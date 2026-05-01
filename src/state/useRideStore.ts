import { create } from 'zustand';
import { ActiveRide, RideStatus } from '../types/ride';
import { Charge as ExtraCharge } from '../types/charge';

// ─── Store ────────────────────────────────────────────────────────────────────

interface RideState {
  ride: ActiveRide | null;
  extraCharges: ExtraCharge[];
  initRide: (rideData: Omit<ActiveRide, 'status'>) => void;
  updateStatus: (status: RideStatus) => void;
  updateRide: (data: Partial<ActiveRide>) => void;
  addExtraCharge: (charge: ExtraCharge) => void;
  updateExtraCharge: (index: number, charge: ExtraCharge) => void;
  clearRide: () => void;
}

export const useRideStore = create<RideState>((set) => ({
  ride: null,
  extraCharges: [],

  initRide: (rideData) =>
    set({
      ride: { ...rideData, status: 'GOING_TO_PICKUP' },
      extraCharges: [],
    }),

  updateStatus: (status) =>
    set((state) => ({
      ride: state.ride ? { ...state.ride, status } : null,
    })),

  updateRide: (data) =>
    set((state) => ({
      ride: state.ride ? { ...state.ride, ...data } : null,
    })),

  addExtraCharge: (charge) => {
    if (!charge.amount || charge.amount <= 0) return;
    set((state) => ({
      extraCharges: [...state.extraCharges, charge],
    }));
  },

  updateExtraCharge: (index, charge) => {
    if (!charge.amount || charge.amount <= 0) return;
    set((state) => ({
      extraCharges: state.extraCharges.map((c, i) => (i === index ? charge : c)),
    }));
  },

  clearRide: () =>
    set({
      ride: null,
      extraCharges: [],
    }),
}));
