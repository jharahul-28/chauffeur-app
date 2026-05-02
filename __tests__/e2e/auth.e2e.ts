/**
 * E2E-AUTH-001 through E2E-AUTH-006
 * Detox E2E tests — Authentication flow
 */

import { device, element, by, expect as detoxExpect, waitFor } from 'detox';

describe('E2E: Authentication', () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true });
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  /**
   * E2E-AUTH-001: Successful login
   */
  it('E2E-AUTH-001: Login with valid phone and OTP reaches bookings', async () => {
    await waitFor(element(by.id('phone-input'))).toBeVisible().withTimeout(10000);
    await element(by.id('phone-input')).typeText('9876543210');
    await element(by.id('send-otp-button')).tap();

    await waitFor(element(by.id('otp-screen'))).toBeVisible().withTimeout(10000);
    await element(by.id('otp-input')).typeText('1234');
    await element(by.id('verify-otp-button')).tap();

    await waitFor(element(by.id('bookings-screen'))).toBeVisible().withTimeout(15000);
    await detoxExpect(element(by.id('bookings-screen'))).toBeVisible();
  });

  /**
   * E2E-AUTH-002: Invalid phone number shows validation error
   */
  it('E2E-AUTH-002: Short phone number disables OTP send button', async () => {
    await waitFor(element(by.id('phone-input'))).toBeVisible().withTimeout(10000);
    await element(by.id('phone-input')).typeText('123'); // Too short
    await detoxExpect(element(by.id('send-otp-button'))).not.toBeEnabled();
  });

  /**
   * E2E-AUTH-003: Wrong OTP shows error from backend
   */
  it('E2E-AUTH-003: Wrong OTP shows error message', async () => {
    await waitFor(element(by.id('phone-input'))).toBeVisible().withTimeout(10000);
    await element(by.id('phone-input')).typeText('9876543210');
    await element(by.id('send-otp-button')).tap();

    await waitFor(element(by.id('otp-screen'))).toBeVisible().withTimeout(10000);
    await element(by.id('otp-input')).typeText('0000');
    await element(by.id('verify-otp-button')).tap();

    await waitFor(element(by.id('otp-error-message'))).toBeVisible().withTimeout(10000);
    await detoxExpect(element(by.id('otp-error-message'))).toBeVisible();
  });

  /**
   * E2E-AUTH-004: Token persists across app restarts
   */
  it('E2E-AUTH-004: Already logged-in user goes straight to bookings on restart', async () => {
    // Login first
    await waitFor(element(by.id('phone-input'))).toBeVisible().withTimeout(10000);
    await element(by.id('phone-input')).typeText('9876543210');
    await element(by.id('send-otp-button')).tap();
    await waitFor(element(by.id('otp-input'))).toBeVisible().withTimeout(10000);
    await element(by.id('otp-input')).typeText('1234');
    await element(by.id('verify-otp-button')).tap();
    await waitFor(element(by.id('bookings-screen'))).toBeVisible().withTimeout(15000);

    // Restart app (without clearing storage)
    await device.sendToHome();
    await device.launchApp({ newInstance: false });

    // Should go straight to bookings, not login
    await waitFor(element(by.id('bookings-screen'))).toBeVisible().withTimeout(15000);
    await detoxExpect(element(by.id('bookings-screen'))).toBeVisible();
  });

  /**
   * E2E-AUTH-005: 401 during active session redirects to login
   */
  it('E2E-AUTH-005: Session expiry (401) redirects to login screen', async () => {
    // This test requires network interception to stub 401 response
    // Login first
    await waitFor(element(by.id('phone-input'))).toBeVisible().withTimeout(10000);
    await element(by.id('phone-input')).typeText('9876543210');
    await element(by.id('send-otp-button')).tap();
    await waitFor(element(by.id('otp-input'))).toBeVisible().withTimeout(10000);
    await element(by.id('otp-input')).typeText('1234');
    await element(by.id('verify-otp-button')).tap();
    await waitFor(element(by.id('bookings-screen'))).toBeVisible().withTimeout(15000);

    // Trigger a pull-to-refresh which fires fetchBookings
    // (Network stub should return 401 for this test)
    await element(by.id('booking-list')).swipe('down', 'slow', 0.5);

    // Should redirect to login screen after 401
    await waitFor(element(by.id('phone-input'))).toBeVisible().withTimeout(15000);
  });

  /**
   * E2E-AUTH-006: Location permission gate blocks driver screen
   */
  it('E2E-AUTH-006: Denied location permission shows permission request screen', async () => {
    // Launch with permissions denied
    await device.launchApp({
      newInstance: true,
      permissions: { location: 'never' },
    });

    // Login
    await waitFor(element(by.id('phone-input'))).toBeVisible().withTimeout(10000);
    await element(by.id('phone-input')).typeText('9876543210');
    await element(by.id('send-otp-button')).tap();
    await waitFor(element(by.id('otp-input'))).toBeVisible().withTimeout(10000);
    await element(by.id('otp-input')).typeText('1234');
    await element(by.id('verify-otp-button')).tap();

    // Should see permission gate, not bookings
    await waitFor(element(by.id('permission-gate-screen'))).toBeVisible().withTimeout(15000);
    await detoxExpect(element(by.id('permission-gate-screen'))).toBeVisible();
  });
});
