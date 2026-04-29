import { useCallback, useState } from 'react';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { ActiveRide } from '../types/ride';
import { ExtraCharge } from '../types/charge';
import { useRideStore } from '../state/useRideStore';
import { useWaitTimer } from './useWaitTimer';
import { logWaitEvent } from '../utils/waitLogger';
import {
  postArrived,
  postVerifyOtp,
  postWaiting,
  postContinue,
  postComplete,
} from '../services/rideService';
import { submitCharges } from '../services/bookingApi';
import { aggregateCharges } from '../utils/chargeAggregator';
import { RouteInfo } from '../components/DrivingRoute';

interface UseRideActionsProps {
  ride: ActiveRide | null;
  extraCharges: ExtraCharge[];
  setOtpModalVisible: (visible: boolean) => void;
  setChargeModalVisible: (visible: boolean) => void;
  setEditingChargeIndex: (index: number | null) => void;
  setRouteInfo: (info: RouteInfo | null) => void;
  startWaiting: (seconds: number) => void;
  stopWaiting: () => void;
  resetWaitTimer: () => void;
}

export function useRideActions({
  ride,
  extraCharges,
  setOtpModalVisible,
  setChargeModalVisible,
  setEditingChargeIndex,
  setRouteInfo,
  startWaiting,
  stopWaiting,
  resetWaitTimer,
}: UseRideActionsProps) {
  const router = useRouter();
  const { updateStatus, addExtraCharge, updateExtraCharge, clearRide } = useRideStore();
  const [isEndingTrip, setIsEndingTrip] = useState(false);

  const handleArrivedAtPickup = useCallback(() => {
    updateStatus('ARRIVED_AT_PICKUP');
    if (ride?.bookingVehicleId) {
      postArrived(ride.bookingVehicleId).catch((err) =>
        console.error('[useRideActions] postArrived failed:', err)
      );
    }
  }, [updateStatus, ride]);

  const handleEnterOTP = useCallback(() => {
    updateStatus('OTP_PENDING');
    setOtpModalVisible(true);
  }, [updateStatus, setOtpModalVisible]);

  const handleOTPSuccess = useCallback(() => {
    setOtpModalVisible(false);
    updateStatus('TRIP_STARTED');
    setRouteInfo(null);
  }, [updateStatus, setOtpModalVisible, setRouteInfo]);

  const handleVerifyOtp = useCallback(async (otp: string) => {
    if (!ride?.bookingVehicleId) throw new Error('No active ride');
    await postVerifyOtp(ride.bookingVehicleId, otp);
  }, [ride]);

  const handleOTPDismiss = useCallback(() => {
    setOtpModalVisible(false);
    updateStatus('ARRIVED_AT_PICKUP');
  }, [updateStatus, setOtpModalVisible]);

  const handleEndTrip = useCallback(() => {
    if (!ride || isEndingTrip) return;

    Alert.alert(
      'End Trip?',
      'Are you sure you want to end the trip?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'End Trip',
          style: 'destructive',
          onPress: async () => {
            setIsEndingTrip(true);
            stopWaiting();

            try {
              await postComplete(ride.bookingVehicleId);
              resetWaitTimer();
              updateStatus('TRIP_COMPLETED');
              clearRide();

              // Navigate to pending amount screen first, then feedback
              router.push({
                pathname: '/(driver)/pending-amount',
                params: {
                  rideId: ride.id,
                  bookingVehicleId: ride.bookingVehicleId,
                  riderName: ride.riderName,
                  pickupText: ride.pickupText,
                  destinationText: ride.destinationText,
                  fare: ride.fare,
                },
              });
            } catch (err) {
              console.error('[useRideActions] endTrip failed:', err);
              Alert.alert('Failed to End Trip', 'Something went wrong. Please try again.');
              setIsEndingTrip(false);
            }
          },
        },
      ],
    );
  }, [ride, isEndingTrip, stopWaiting, resetWaitTimer, updateStatus, clearRide, router]);

  const handleWait = useCallback(() => {
    Alert.alert(
      'Start Waiting?',
      'Do you want to start waiting?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Wait',
          onPress: async () => {
            if (!ride?.bookingVehicleId) return;
            try {
              logWaitEvent('WAIT_START', ride.id);
              const data = await postWaiting(ride.bookingVehicleId);
              startWaiting(data.totalWaitingSeconds);
            } catch (err) {
              console.error('[useRideActions] postWaiting failed:', err);
              Alert.alert('Error', 'Failed to start waiting. Please try again.');
            }
          },
        },
      ],
    );
  }, [ride, startWaiting]);

  const handleResumeTrip = useCallback(() => {
    Alert.alert(
      'Resume Trip?',
      'Do you want to resume the trip?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Resume',
          onPress: async () => {
            if (!ride?.bookingVehicleId) return;
            try {
              logWaitEvent('WAIT_RESUME', ride.id);
              await postContinue(ride.bookingVehicleId);
              stopWaiting();
            } catch (err) {
              console.error('[useRideActions] postContinue failed:', err);
              Alert.alert('Error', 'Failed to resume trip. Please try again.');
            }
          },
        },
      ],
    );
  }, [ride, stopWaiting]);

  const handleChargeSubmit = useCallback(async (
    charge: ExtraCharge,
    editingChargeIndex: number | null
  ) => {
    let updatedCharges: ExtraCharge[];
    if (editingChargeIndex !== null) {
      updatedCharges = extraCharges.map((c, i) => (i === editingChargeIndex ? charge : c));
      updateExtraCharge(editingChargeIndex, charge);
    } else {
      updatedCharges = [...extraCharges, charge];
      addExtraCharge(charge);
    }
    setChargeModalVisible(false);
    setEditingChargeIndex(null);

    if (ride?.bookingVehicleId) {
      try {
        await submitCharges(ride.bookingVehicleId, aggregateCharges(updatedCharges));
      } catch (err) {
        console.error('[useRideActions] submitCharges failed:', err);
        Alert.alert('Warning', 'Charge saved locally but failed to sync. It will be retried.');
      }
    }
  }, [extraCharges, addExtraCharge, updateExtraCharge, ride, setChargeModalVisible, setEditingChargeIndex]);

  return {
    isEndingTrip,
    handleArrivedAtPickup,
    handleEnterOTP,
    handleOTPSuccess,
    handleVerifyOtp,
    handleOTPDismiss,
    handleEndTrip,
    handleWait,
    handleResumeTrip,
    handleChargeSubmit,
  };
}
