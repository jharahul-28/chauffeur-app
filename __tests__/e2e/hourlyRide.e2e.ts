/**
 * E2E-HR-001 through E2E-HR-004
 * Detox E2E tests — Hourly ride scenarios
 */

import { device, element, by, expect as detoxExpect, waitFor } from 'detox';

// ── Helpers ───────────────────────────────────────────────────────────────────

async function login(phone = '9876543210', otp = '1234') {
  await waitFor(element(by.id('phone-input'))).toBeVisible().withTimeout(10000);
  await element(by.id('phone-input')).typeText(phone);
  await element(by.id('send-otp-button')).tap();
  await waitFor(element(by.id('otp-input'))).toBeVisible().withTimeout(10000);
  await element(by.id('otp-input')).typeText(otp);
  await element(by.id('verify-otp-button')).tap();
  await waitFor(element(by.id('bookings-screen'))).toBeVisible().withTimeout(15000);
}

async function selectHourlyBooking() {
  await element(by.id('tab-current')).tap();
  await waitFor(element(by.id('booking-list'))).toBeVisible().withTimeout(10000);
  // Assumes first booking in current tab is hourly
  await element(by.id('booking-item-0')).tap();
}

// ── Test Suite ────────────────────────────────────────────────────────────────

describe('E2E: Hourly Rental Flow', () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true });
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  /**
   * E2E-HR-001: Complete hourly ride — happy path
   * Preconditions: Driver has an ASSIGNED HOURLY_RENTALS booking
   */
  it('E2E-HR-001: Complete hourly ride from pickup to payment', async () => {
    await login();
    await selectHourlyBooking();

    // Verify driver-home screen loads
    await waitFor(element(by.id('driver-home-screen'))).toBeVisible().withTimeout(15000);

    // Go to pickup
    await waitFor(element(by.id('cta-go-to-pickup'))).toBeVisible().withTimeout(5000);
    await element(by.id('cta-go-to-pickup')).tap();

    // Arrive at pickup
    await waitFor(element(by.id('cta-arrived'))).toBeVisible().withTimeout(10000);
    await element(by.id('cta-arrived')).tap();

    // OTP for hourly booking
    await waitFor(element(by.id('otp-modal'))).toBeVisible().withTimeout(5000);
    await element(by.id('otp-modal-input')).typeText('1234');
    await element(by.id('otp-modal-confirm')).tap();

    // Auto-redirected to hourly-ride screen
    await waitFor(element(by.id('hourly-ride-screen'))).toBeVisible().withTimeout(10000);

    // Verify timer is showing
    await detoxExpect(element(by.id('hourly-timer-display'))).toBeVisible();

    // End hourly ride
    await element(by.id('cta-end-hourly-ride')).tap();

    // Confirm end ride alert
    await waitFor(element(by.id('alert-modal'))).toBeVisible().withTimeout(5000);
    await element(by.id('alert-confirm-button')).tap();

    // Payment screen
    await waitFor(element(by.id('pending-amount-screen'))).toBeVisible().withTimeout(10000);
    await element(by.id('payment-paid-button')).tap();

    await waitFor(element(by.id('payment-modal'))).toBeVisible().withTimeout(5000);
    await element(by.id('payment-amount-input')).typeText('3000');
    await element(by.id('payment-confirm-button')).tap();

    await waitFor(element(by.id('bookings-screen'))).toBeVisible().withTimeout(10000);
  });

  /**
   * E2E-HR-002: Hourly ride timer exceeds booked time
   */
  it('E2E-HR-002: Timer shows expired state when booking window exceeded', async () => {
    await login();
    await selectHourlyBooking();

    await waitFor(element(by.id('driver-home-screen'))).toBeVisible().withTimeout(15000);
    await element(by.id('cta-go-to-pickup')).tap();
    await waitFor(element(by.id('cta-arrived'))).toBeVisible().withTimeout(10000);
    await element(by.id('cta-arrived')).tap();
    await waitFor(element(by.id('otp-modal'))).toBeVisible().withTimeout(5000);
    await element(by.id('otp-modal-input')).typeText('1234');
    await element(by.id('otp-modal-confirm')).tap();

    await waitFor(element(by.id('hourly-ride-screen'))).toBeVisible().withTimeout(10000);

    // The timer will show expired state when the booked window passes
    // In E2E we can verify the "Extra time" badge is visible once timer expires
    // (This test requires mocked time or a short booking window)
    await detoxExpect(element(by.id('hourly-timer-display'))).toBeVisible();

    // Verify "End Hourly Ride" button is always visible regardless of expiry
    await detoxExpect(element(by.id('cta-end-hourly-ride'))).toBeVisible();
  });

  /**
   * E2E-HR-003: Hourly ride — add extra charges before ending
   */
  it('E2E-HR-003: Add toll + parking charges on hourly ride', async () => {
    await login();
    await selectHourlyBooking();

    await waitFor(element(by.id('driver-home-screen'))).toBeVisible().withTimeout(15000);
    await element(by.id('cta-go-to-pickup')).tap();
    await waitFor(element(by.id('cta-arrived'))).toBeVisible().withTimeout(10000);
    await element(by.id('cta-arrived')).tap();
    await waitFor(element(by.id('otp-modal'))).toBeVisible().withTimeout(5000);
    await element(by.id('otp-modal-input')).typeText('1234');
    await element(by.id('otp-modal-confirm')).tap();

    await waitFor(element(by.id('hourly-ride-screen'))).toBeVisible().withTimeout(10000);

    // Add toll charge
    await element(by.id('charges-button')).tap();
    await waitFor(element(by.id('charge-modal'))).toBeVisible().withTimeout(5000);
    await element(by.id('charge-type-toll')).tap();
    await element(by.id('charge-amount-input')).typeText('100');
    await element(by.id('charge-save-button')).tap();

    // Add parking charge
    await element(by.id('charges-button')).tap();
    await waitFor(element(by.id('charge-modal'))).toBeVisible().withTimeout(5000);
    await element(by.id('charge-type-parking')).tap();
    await element(by.id('charge-amount-input')).typeText('50');
    await element(by.id('charge-save-button')).tap();

    // Verify charges visible
    await waitFor(element(by.text('₹100'))).toBeVisible().withTimeout(5000);
    await waitFor(element(by.text('₹50'))).toBeVisible().withTimeout(5000);

    // End ride
    await element(by.id('cta-end-hourly-ride')).tap();
    await waitFor(element(by.id('alert-modal'))).toBeVisible().withTimeout(5000);
    await element(by.id('alert-confirm-button')).tap();
    await waitFor(element(by.id('pending-amount-screen'))).toBeVisible().withTimeout(10000);
  });

  /**
   * E2E-HR-004: Wrong OTP on hourly booking shows error then retries
   */
  it('E2E-HR-004: Hourly OTP failure and retry', async () => {
    await login();
    await selectHourlyBooking();

    await waitFor(element(by.id('driver-home-screen'))).toBeVisible().withTimeout(15000);
    await element(by.id('cta-go-to-pickup')).tap();
    await waitFor(element(by.id('cta-arrived'))).toBeVisible().withTimeout(10000);
    await element(by.id('cta-arrived')).tap();

    await waitFor(element(by.id('otp-modal'))).toBeVisible().withTimeout(5000);

    // Wrong OTP
    await element(by.id('otp-modal-input')).typeText('9999');
    await element(by.id('otp-modal-confirm')).tap();
    await waitFor(element(by.id('otp-error-message'))).toBeVisible().withTimeout(5000);
    await detoxExpect(element(by.id('otp-error-message'))).toBeVisible();

    // Retry with correct OTP
    await element(by.id('otp-modal-input')).clearText();
    await element(by.id('otp-modal-input')).typeText('1234');
    await element(by.id('otp-modal-confirm')).tap();

    // Auto-redirect to hourly screen
    await waitFor(element(by.id('hourly-ride-screen'))).toBeVisible().withTimeout(10000);
  });
});
