import apiClient from './apiClient';

/**
 * All ride lifecycle action endpoints.
 * Every call is a POST to /chauffeur/{bookingVehicleId}/{action}.
 *
 * bookingVehicleId — the `id` field from the bookings list API (e.g. 7).
 *                    It is stored on ActiveRide.bookingVehicleId and passed
 *                    through to every call here.
 */

const base = (id: string) => `/chauffeur/${id}`;

/** Called immediately when the driver taps "Go to Pickup" on the bookings screen. */
export const postDriverOnTheWay = (bookingVehicleId: string): Promise<void> =>
    apiClient.post(`${base(bookingVehicleId)}/driver-on-the-way`).then(() => {
        console.log('[rideService] driver-on-the-way ✓', bookingVehicleId);
    });

/** Called when the driver taps "Arrived at Pickup". */
export const postArrived = (bookingVehicleId: string): Promise<void> => {
    console.log(`[rideService] 🚩 Posting Arrived for BV ID: ${bookingVehicleId}`);
    return apiClient.post(`${base(bookingVehicleId)}/arrived`).then(() => {
        console.log('[rideService] arrived ✓', bookingVehicleId);
    });
};

/**
 * Called when the driver submits the OTP modal.
 * OTP is sent as a query param as per API spec.
 * Throws on wrong OTP (non-2xx response) so the modal can show an error.
 */
export const postVerifyOtp = async (
    bookingVehicleId: string,
    otp: string
): Promise<{ rideStartTime?: string }> => {
    const response = await apiClient.post(`${base(bookingVehicleId)}/verify-otp`, null, {
        params: { otp },
    });
    console.log('[rideService] verify-otp ✓', bookingVehicleId, response.data);
    return response.data;
};

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface WaitingResponse {
  /** Cumulative waiting seconds across all sessions for this booking. */
  totalWaitingSeconds: number;
  /** Pre-formatted timer string, e.g. "00:04:42". */
  formattedWaitingTime: string;
}

/**
 * Fetches the current cumulative wait-timer state from the backend.
 * Call on screen mount (if status === WAITING) and after every postWaiting success
 * to seed the local timer from the authoritative backend value.
 */
export const getWaitingTimer = (bookingVehicleId: string): Promise<WaitingResponse> =>
    apiClient.get<WaitingResponse>(`${base(bookingVehicleId)}/waiting-timer`).then((res) => {
        console.log('[rideService] waiting-timer ✓', bookingVehicleId, res.data);
        return res.data;
    });

/** Called when the driver taps "Wait" during an active trip. */
export const postWaiting = (bookingVehicleId: string): Promise<WaitingResponse> =>
    apiClient.post<WaitingResponse>(`${base(bookingVehicleId)}/waiting`).then((res) => {
        console.log('[rideService] waiting ✓', bookingVehicleId, res.data);
        return res.data;
    });

/** Called when the driver taps "Resume" after a wait. */
export const postContinue = (bookingVehicleId: string): Promise<void> =>
    apiClient.post(`${base(bookingVehicleId)}/continue`).then(() => {
        console.log('[rideService] continue ✓', bookingVehicleId);
    });

/**
 * Called when the driver taps "Arrived" at an intermediate STOP.
 * waypointId is the stable id from the booking waypoint list — resolved via
 * waypointMapper before this call is made.
 */
export const postArrivedAtStop = (
    bookingVehicleId: string,
    waypointId: number,
): Promise<void> =>
    apiClient
        .post(`${base(bookingVehicleId)}/arrived-at-stop`, null, { params: { waypointId } })
        .then(() => {
            console.log('[rideService] arrived-at-stop ✓', bookingVehicleId, 'waypointId:', waypointId);
        });

/**
 * Called when the driver taps "Skip" on an intermediate STOP.
 * waypointId sent as a query param per API spec.
 */
export const postSkipStop = (
    bookingVehicleId: string,
    waypointId: number,
): Promise<void> =>
    apiClient
        .post(`${base(bookingVehicleId)}/skip-stop`, null, { params: { waypointId } })
        .then(() => {
            console.log('[rideService] skip-stop ✓', bookingVehicleId, 'waypointId:', waypointId);
        });

/** Called when the driver taps "End Trip". */
export const postEndRide = (bookingVehicleId: string): Promise<void> =>
    apiClient.post(`${base(bookingVehicleId)}/end-ride`).then(() => {
        console.log('[rideService] end-ride ✓', bookingVehicleId);
    });

export type PaymentStatus = 'PAID' | 'UNPAID';

export interface CompletePaymentPayload {
  paymentStatus: PaymentStatus;
  amount?: number;
}

/** Called on payment confirmation after the ride ends. */
export const postCompletePayment = (
    bookingVehicleId: string,
    payload: CompletePaymentPayload,
): Promise<void> =>
    apiClient.post(`${base(bookingVehicleId)}/complete`, payload).then(() => {
        console.log('[rideService] complete (payment) ✓', bookingVehicleId, payload.paymentStatus);
    });

export interface NextWaypoint {
  type: 'PICKUP' | 'STOP' | 'DROP';
  latitude: number;
  longitude: number;
  address: string;
  placeId?: string;
  status?: string;
}

export interface LocationUpdateResponse {
  arrived: boolean;
  /** Next waypoint the driver should head to. Always present when a ride is active. */
  waypoint: NextWaypoint | null;
  distanceMeters: number;
  /**
   * Server-side ride start time for hourly rentals.
   * Format: "YYYY-MM-DD HH:mm:ss" in the server's local timezone (treat as local).
   * Present only when tripType === 'HOURLY_RENTALS' and ride has started.
   */
  rideStartTime?: string | null;
}

/** Sends the driver's current GPS coordinates to the backend. */
export const updateDriverLocation = (
    bookingVehicleId: string,
    lat: number,
    lng: number,
): Promise<LocationUpdateResponse> => {
    console.log(`[RideService] 📍 Sending Location: Lat ${lat}, Lng ${lng} for BV ID: ${bookingVehicleId}`);
    return apiClient
        .post<LocationUpdateResponse>(`${base(bookingVehicleId)}/location-update`, {
            currentLatitude: lat,
            currentLongitude: lng,
        })
        .then((res) => {
            console.log(`[RideService] ✅ Location Update Success: BV ID ${bookingVehicleId}`);
            return res.data;
        })
        .catch((err) => {
            const errorData = err.response?.data;
            console.error(`[RideService] ❌ Location Update Failed: BV ID ${bookingVehicleId}`, {
                message: err.message,
                responseData: errorData
            });
            throw err;
        });
};
