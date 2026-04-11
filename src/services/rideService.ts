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
export const postArrived = (bookingVehicleId: string): Promise<void> =>
    apiClient.post(`${base(bookingVehicleId)}/arrived`).then(() => {
        console.log('[rideService] arrived ✓', bookingVehicleId);
    });

/**
 * Called when the driver submits the OTP modal.
 * OTP is sent as a query param as per API spec.
 * Throws on wrong OTP (non-2xx response) so the modal can show an error.
 */
export const postVerifyOtp = async (
    bookingVehicleId: string,
    otp: string
): Promise<void> => {
    await apiClient.post(`${base(bookingVehicleId)}/verify-otp`, null, {
        params: { otp },
    });
    console.log('[rideService] verify-otp ✓', bookingVehicleId);
};

/** Called when the driver taps "Wait" during an active trip. */
export const postWaiting = (bookingVehicleId: string): Promise<void> =>
    apiClient.post(`${base(bookingVehicleId)}/waiting`).then(() => {
        console.log('[rideService] waiting ✓', bookingVehicleId);
    });

/** Called when the driver taps "Resume" after a wait. */
export const postContinue = (bookingVehicleId: string): Promise<void> =>
    apiClient.post(`${base(bookingVehicleId)}/continue`).then(() => {
        console.log('[rideService] continue ✓', bookingVehicleId);
    });

/** Called when the driver taps "End Trip". */
export const postComplete = (bookingVehicleId: string): Promise<void> =>
    apiClient.post(`${base(bookingVehicleId)}/complete`).then(() => {
        console.log('[rideService] complete ✓', bookingVehicleId);
    });
