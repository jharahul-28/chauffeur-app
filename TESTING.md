# Testing Guide

## Quick Start

### 1. Install test dependencies

```bash
npm install --save-dev \
  jest \
  jest-expo \
  @testing-library/react-hooks \
  @testing-library/react-native \
  @testing-library/jest-native \
  @react-native-async-storage/async-storage \
  react-test-renderer \
  detox \
  @types/jest \
  @types/detox
```

### 2. Run unit tests

```bash
# All unit tests
npx jest --testPathPattern=unit

# Specific file
npx jest __tests__/unit/hooks/useWaitTimer.test.ts

# With coverage
npx jest --testPathPattern=unit --coverage
```

### 3. Run integration tests

```bash
npx jest --testPathPattern=integration
```

### 4. Run E2E tests (requires simulator)

```bash
# Build first
npx detox build --configuration ios.sim.debug

# Run
npx detox test --configuration ios.sim.debug

# Specific suite
npx detox test --configuration ios.sim.debug -t "One-Way"
```

---

## Test File Structure

```
__tests__/
├── unit/
│   ├── stores/
│   │   ├── useRideStore.test.ts       # 20 TCs — Zustand store
│   │   └── useLocationStore.test.ts   # 12 TCs — Location state
│   ├── hooks/
│   │   ├── useWaitTimer.test.ts       # 20 TCs — Wait timer
│   │   ├── useHourlyTimer.test.ts     # 20 TCs — Hourly timer + helpers
│   │   ├── useBookings.test.ts        # 13 TCs — Bookings hook
│   │   └── useCharges.test.ts         # 12 TCs — Charges hook
│   ├── utils/
│   │   ├── timeUtils.test.ts          # 10 TCs — formatCountdown
│   │   ├── waypointUtils.test.ts      # 21 TCs — Route extraction
│   │   ├── bookingSorter.test.ts      # 10 TCs — Sorting
│   │   └── bookingMapper.test.ts      # 20 TCs — API mapper
│   └── services/
│       ├── rideService.test.ts        # 20 TCs — Ride API calls
│       └── bookingService.test.ts     # 20 TCs — Booking + mapper
├── integration/
│   ├── oneWayFlow.test.ts             # 40 TCs — One-way flow
│   ├── hourlyFlow.test.ts             # 35 TCs — Hourly flow
│   ├── locationTracking.test.ts       # 22 TCs — Location sync
│   └── paymentAndCharges.test.ts      # 20 TCs — Payment + charges
├── e2e/
│   ├── auth.e2e.ts                    # 6 scenarios — Auth
│   ├── oneWayRide.e2e.ts              # 6 scenarios — One-way
│   └── hourlyRide.e2e.ts              # 4 scenarios — Hourly
└── mocks/
    ├── api.mock.ts                    # Typed API response factories
    └── services.mock.ts               # Jest module mock factories
```

**Total: ~295 test cases (178 unit + 117 integration + 16 E2E)**

---

## Adding testID props for E2E

The E2E tests rely on `testID` props. Ensure these are set in the UI:

| testID | Component |
|--------|-----------|
| `phone-input` | Phone number input on login screen |
| `send-otp-button` | Send OTP button |
| `otp-input` | OTP code input |
| `verify-otp-button` | Verify OTP button |
| `otp-error-message` | Error text under OTP input |
| `bookings-screen` | Root view of bookings tab |
| `booking-list` | FlatList of bookings |
| `booking-item-{n}` | Individual booking row |
| `tab-current` | Current bookings tab |
| `driver-home-screen` | Root view of driver-home |
| `cta-go-to-pickup` | "Go To Pickup" button |
| `cta-arrived` | "Arrived" button |
| `otp-modal` | OTP entry modal |
| `otp-modal-input` | OTP input inside modal |
| `otp-modal-confirm` | Confirm button in OTP modal |
| `cta-end-trip` | "End Trip" button |
| `cta-wait` | "Wait" button |
| `cta-resume` | "Resume" button |
| `wait-timer-display` | Timer display during wait |
| `charges-button` | Extra charges button |
| `charge-modal` | Charge entry modal |
| `charge-type-toll` | Toll charge option |
| `charge-type-parking` | Parking charge option |
| `charge-amount-input` | Amount input in charge modal |
| `charge-save-button` | Save button in charge modal |
| `hourly-ride-screen` | Root view of hourly-ride screen |
| `hourly-timer-display` | HH:mm or mm:ss timer |
| `cta-end-hourly-ride` | "End Hourly Ride" button |
| `pending-amount-screen` | Root view of payment screen |
| `payment-paid-button` | "Paid" button |
| `payment-unpaid-button` | "Unpaid" button |
| `payment-modal` | Payment amount entry modal |
| `payment-amount-input` | Amount input |
| `payment-confirm-button` | Confirm payment |
| `alert-modal` | Custom alert modal |
| `alert-confirm-button` | Confirm in alert |
| `permission-gate-screen` | Location permission gate |
| `map-route` | Map with rendered route |
| `stop-{n}-arrived-button` | Arrived at stop N button |
| `stop-{n}-skip-button` | Skip stop N button |
| `stop-{n}-arrived-indicator` | Greyed-out arrived indicator |
| `stop-{n}-skipped-indicator` | Skipped indicator |
