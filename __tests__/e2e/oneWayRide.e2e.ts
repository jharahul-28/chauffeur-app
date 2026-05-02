/**
 * E2E-OW-001 through E2E-OW-006
 * Detox E2E tests — One-way ride scenarios
 *
 * Prerequisites:
 *   - App is running on a simulator/device
 *   - Backend staging environment is available OR WireMock is configured
 *   - Driver account: phone = "9876543210", OTP = "1234"
 *
 * Run: npx detox test --configuration ios.sim.debug -t "One-Way"
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

async function selectFirstCurrentBooking() {
  await element(by.id('tab-current')).tap();
  await waitFor(element(by.id('booking-list'))).toBeVisible().withTimeout(10000);
  await element(by.id('booking-item-0')).tap();
}

async function waitForMapScreen() {
  await waitFor(element(by.id('driver-home-screen'))).toBeVisible().withTimeout(15000);
}

// ── Test Suite ────────────────────────────────────────────────────────────────

describe('E2E: One-Way Ride — Happy Path', () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true });
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  /**
   * E2E-OW-001: Complete one-way ride from login to payment
   * Preconditions: Driver has an ASSIGNED booking with ONE_WAY trip type
   */
  it('E2E-OW-001: Complete one-way ride — happy path', async () => {
    // Step 1: Login
    await login();

    // Step 2: Select booking
    await selectFirstCurrentBooking();
    await waitForMapScreen();

    // Step 3: Start navigation to pickup
    await waitFor(element(by.id('cta-go-to-pickup'))).toBeVisible().withTimeout(5000);
    await element(by.id('cta-go-to-pickup')).tap();
    await waitFor(element(by.id('map-route'))).toBeVisible().withTimeout(10000);

    // Step 4: Arrive at pickup
    await waitFor(element(by.id('cta-arrived'))).toBeVisible().withTimeout(10000);
    await element(by.id('cta-arrived')).tap();

    // Step 5: Enter OTP
    await waitFor(element(by.id('otp-modal'))).toBeVisible().withTimeout(5000);
    await element(by.id('otp-modal-input'))).typeText('1234');
    await element(by.id('otp-modal-confirm'))).tap();

    // Step 6: Trip started — verify state
    await waitFor(element(by.id('cta-end-trip'))).toBeVisible().withTimeout(10000);

    // Step 7: End trip
    await element(by.id('cta-end-trip')).tap();

    // Step 8: Payment screen
    await waitFor(element(by.id('pending-amount-screen'))).toBeVisible().withTimeout(10000);
    await element(by.id('payment-paid-button')).tap();

    await waitFor(element(by.id('payment-modal'))).toBeVisible().withTimeout(5000);
    await element(by.id('payment-amount-input')).typeText('2000');
    await element(by.id('payment-confirm-button')).tap();

    // Step 9: Back on bookings
    await waitFor(element(by.id('bookings-screen'))).toBeVisible().withTimeout(10000);
  });

  /**
   * E2E-OW-002: One-way ride with intermediate stop — arrived + skip
   * Preconditions: Booking has a STOP waypoint
   */
  it('E2E-OW-002: One-way with stop — arrive and skip', async () => {
    await login();
    await selectFirstCurrentBooking();
    await waitForMapScreen();

    await element(by.id('cta-go-to-pickup')).tap();
    await waitFor(element(by.id('cta-arrived'))).toBeVisible().withTimeout(10000);
    await element(by.id('cta-arrived')).tap();

    await waitFor(element(by.id('otp-modal'))).toBeVisible().withTimeout(5000);
    await element(by.id('otp-modal-input')).typeText('1234');
    await element(by.id('otp-modal-confirm')).tap();

    // Intermediate stop appears in drawer
    await waitFor(element(by.id('stop-0-arrived-button'))).toBeVisible().withTimeout(10000);

    // Option A: Arrive at stop
    await element(by.id('stop-0-arrived-button')).tap();
    await waitFor(element(by.id('stop-0-arrived-indicator'))).toBeVisible().withTimeout(5000);

    // Option B: Skip next stop (navigate to second booking with skip)
    // (Skip the stop on a different test scenario)

    await element(by.id('cta-end-trip')).tap();
    await waitFor(element(by.id('pending-amount-screen'))).toBeVisible().withTimeout(10000);
  });

  /**
   * E2E-OW-003: One-way with wait → extra charges → payment
   * Preconditions: Trip is IN_PROGRESS, driver taps Wait
   */
  it('E2E-OW-003: One-way with wait, extra charges, and payment', async () => {
    await login();
    await selectFirstCurrentBooking();
    await waitForMapScreen();

    // Navigate to trip started state
    await element(by.id('cta-go-to-pickup')).tap();
    await waitFor(element(by.id('cta-arrived'))).toBeVisible().withTimeout(10000);
    await element(by.id('cta-arrived')).tap();
    await waitFor(element(by.id('otp-modal'))).toBeVisible().withTimeout(5000);
    await element(by.id('otp-modal-input')).typeText('1234');
    await element(by.id('otp-modal-confirm')).tap();

    // Wait
    await waitFor(element(by.id('cta-wait'))).toBeVisible().withTimeout(10000);
    await element(by.id('cta-wait')).tap();
    await waitFor(element(by.id('wait-timer-display'))).toBeVisible().withTimeout(5000);
    await detoxExpect(element(by.id('cta-resume'))).toBeVisible();

    // Resume
    await element(by.id('cta-resume')).tap();
    await waitFor(element(by.id('cta-end-trip'))).toBeVisible().withTimeout(5000);

    // Add toll charge
    await element(by.id('charges-button'))).tap();
    await waitFor(element(by.id('charge-modal'))).toBeVisible().withTimeout(5000);
    await element(by.id('charge-type-toll')).tap();
    await element(by.id('charge-amount-input')).typeText('150');
    await element(by.id('charge-save-button')).tap();

    // Verify charge appears
    await waitFor(element(by.text('₹150'))).toBeVisible().withTimeout(5000);

    // End trip
    await element(by.id('cta-end-trip')).tap();
    await waitFor(element(by.id('pending-amount-screen'))).toBeVisible().withTimeout(10000);

    // Unpaid
    await element(by.id('payment-unpaid-button')).tap();
    await waitFor(element(by.id('bookings-screen'))).toBeVisible().withTimeout(10000);
  });

  /**
   * E2E-OW-004: OTP failure then retry
   */
  it('E2E-OW-004: Wrong OTP shows error, correct OTP proceeds', async () => {
    await login();
    await selectFirstCurrentBooking();
    await waitForMapScreen();

    await element(by.id('cta-go-to-pickup')).tap();
    await waitFor(element(by.id('cta-arrived'))).toBeVisible().withTimeout(10000);
    await element(by.id('cta-arrived')).tap();

    await waitFor(element(by.id('otp-modal'))).toBeVisible().withTimeout(5000);

    // Wrong OTP
    await element(by.id('otp-modal-input')).typeText('0000');
    await element(by.id('otp-modal-confirm')).tap();
    await waitFor(element(by.id('otp-error-message'))).toBeVisible().withTimeout(5000);

    // Clear and retry with correct OTP
    await element(by.id('otp-modal-input')).clearText();
    await element(by.id('otp-modal-input')).typeText('1234');
    await element(by.id('otp-modal-confirm')).tap();

    await waitFor(element(by.id('cta-end-trip'))).toBeVisible().withTimeout(10000);
  });

  /**
   * E2E-OW-005: Payment failure (network error) shows error
   */
  it('E2E-OW-005: Payment failure shows error — does not clear ride', async () => {
    // This test requires network interception (WireMock / Detox proxy)
    // Stub /complete endpoint to return 500
    await login();
    await selectFirstCurrentBooking();
    await waitForMapScreen();

    // Navigate to end trip state (abbreviated)
    await element(by.id('cta-go-to-pickup')).tap();
    await waitFor(element(by.id('cta-arrived'))).toBeVisible().withTimeout(10000);
    await element(by.id('cta-arrived')).tap();
    await waitFor(element(by.id('otp-modal'))).toBeVisible().withTimeout(5000);
    await element(by.id('otp-modal-input')).typeText('1234');
    await element(by.id('otp-modal-confirm')).tap();
    await waitFor(element(by.id('cta-end-trip'))).toBeVisible().withTimeout(10000);
    await element(by.id('cta-end-trip')).tap();
    await waitFor(element(by.id('pending-amount-screen'))).toBeVisible().withTimeout(10000);

    // Trigger payment
    await element(by.id('payment-paid-button')).tap();
    await waitFor(element(by.id('payment-modal'))).toBeVisible().withTimeout(5000);
    await element(by.id('payment-amount-input')).typeText('2000');
    await element(by.id('payment-confirm-button')).tap();

    // On network failure — error alert should appear
    await waitFor(element(by.id('alert-modal'))).toBeVisible().withTimeout(10000);
    await detoxExpect(element(by.id('alert-modal'))).toBeVisible();
  });

  /**
   * E2E-OW-006: Skip stop scenario
   */
  it('E2E-OW-006: Skip intermediate stop', async () => {
    await login();
    await selectFirstCurrentBooking();
    await waitForMapScreen();

    await element(by.id('cta-go-to-pickup')).tap();
    await waitFor(element(by.id('cta-arrived'))).toBeVisible().withTimeout(10000);
    await element(by.id('cta-arrived')).tap();
    await waitFor(element(by.id('otp-modal'))).toBeVisible().withTimeout(5000);
    await element(by.id('otp-modal-input')).typeText('1234');
    await element(by.id('otp-modal-confirm')).tap();

    // Skip stop
    await waitFor(element(by.id('stop-0-skip-button'))).toBeVisible().withTimeout(10000);
    await element(by.id('stop-0-skip-button')).tap();

    // Stop should be marked as skipped
    await waitFor(element(by.id('stop-0-skipped-indicator'))).toBeVisible().withTimeout(5000);

    await element(by.id('cta-end-trip')).tap();
    await waitFor(element(by.id('pending-amount-screen'))).toBeVisible().withTimeout(10000);
  });
});
