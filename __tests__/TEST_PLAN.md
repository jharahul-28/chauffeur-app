# Chauffeur App — Test Plan

**App:** Velvet Experience — Chauffeur Driver App  
**Platform:** React Native (Expo), iOS + Android  
**Tech Stack:** Jest + React Native Testing Library + Detox  
**Date:** 2026-05-02  

---

## 1. Scope

This test plan covers all driver-facing flows in the Velvet Experience chauffeur app:

| Flow | Description |
|------|-------------|
| **Auth** | Phone login, OTP verification, token persistence |
| **Bookings** | List fetch, sorting, status-based navigation |
| **One-Way Ride** | Full lifecycle from ASSIGNED → COMPLETED |
| **Hourly Rental** | OTP → Timer → End → Payment |
| **Location Sync** | Background task, throttling, arrival detection |
| **Wait Feature** | Timer start/stop/reset, free time threshold |
| **Extra Charges** | Add/edit, API sync (GET+PUT), display |
| **Payment** | PAID/UNPAID flows, amount validation |
| **Waypoints** | Route extraction, stop handling, skip |
| **Edge Cases** | Network failures, GPS loss, permissions revoked |

---

## 2. Test Layers

### Layer 1: Unit Tests (Jest)
Fast, isolated, deterministic. No I/O.

| File | TC IDs | Coverage |
|------|--------|----------|
| `useRideStore.test.ts` | TC-STORE-001 to 020 | Zustand store state machine |
| `useLocationStore.test.ts` | TC-LOCSTORE-001 to 012 | Location state management |
| `useWaitTimer.test.ts` | TC-WAIT-001 to 020 | Wait timer lifecycle |
| `useHourlyTimer.test.ts` | TC-HTIMER-001 to 020 | Hourly timer + helpers |
| `timeUtils.test.ts` | TC-TIME-001 to 010 | formatCountdown utility |
| `waypointUtils.test.ts` | TC-WP-001 to 021 | Route extraction, coordinate validation |
| `bookingSorter.test.ts` | TC-SORT-001 to 010 | Today-first sorting |
| `bookingMapper.test.ts` | TC-MAP-001 to 020 | API → UI model mapping |
| `useBookings.test.ts` | TC-BOOKINGS-001 to 013 | Bookings hook with caching |
| `useCharges.test.ts` | TC-CHARGES-001 to 012 | Charges hook |
| `rideService.test.ts` | TC-SVC-001 to 020 | All ride lifecycle API calls |
| `bookingService.test.ts` | TC-BSVC-001 to 020 | Booking fetch + mapper |

**Total Unit TCs: ~178**

### Layer 2: Integration Tests (Jest + RNTL)
Tests multiple modules working together with mocked APIs.

| File | TC IDs | Coverage |
|------|--------|----------|
| `oneWayFlow.test.ts` | TC-OW-001 to 040 | Complete one-way state machine |
| `hourlyFlow.test.ts` | TC-HR-001 to 035 | Complete hourly rental flow |
| `locationTracking.test.ts` | TC-LOC-001 to 022 | Location sync lifecycle |
| `paymentAndCharges.test.ts` | TC-PAY-001 to 020 | Payment + charges integration |

**Total Integration TCs: ~117**

### Layer 3: E2E Tests (Detox)
Full app flows on simulator/device.

| File | TC IDs | Coverage |
|------|--------|----------|
| `auth.e2e.ts` | E2E-AUTH-001 to 006 | Login, OTP, token, permissions |
| `oneWayRide.e2e.ts` | E2E-OW-001 to 006 | One-way ride scenarios |
| `hourlyRide.e2e.ts` | E2E-HR-001 to 004 | Hourly rental scenarios |

**Total E2E TCs: 16**

---

## 3. Booking Status State Machine

```
API Status         → Client RideStatus       → CTA Button
─────────────────────────────────────────────────────────
ASSIGNED           → GOING_TO_PICKUP         → "Go To Pickup"
DRIVER_ON_THE_WAY  → GOING_TO_PICKUP         → (map active)
ARRIVED            → ARRIVED_AT_PICKUP       → "Enter OTP"
(OTP modal open)   → OTP_PENDING             → (modal shown)
OTP_VERIFIED       → TRIP_STARTED            → "End Trip" / hourly redirect
IN_PROGRESS        → TRIP_STARTED            → "End Trip"
WAITING            → TRIP_STARTED (waiting)  → "Resume Trip"
RIDE_END           → (payment screen)        → "Paid" / "Unpaid"
COMPLETED          → TRIP_COMPLETED          → (no button)
```

---

## 4. Critical Test Cases

### TC-CRIT-001: OTP wrong 3 times
**Risk:** Driver locked out  
**Test:** Submit wrong OTP 3x → verify error shown, no crash

### TC-CRIT-002: End trip while waiting
**Risk:** Trip ends while meter running  
**Test:** isWaiting=true → tap "End Trip" → blocked by tripGuard

### TC-CRIT-003: GPS disabled mid-trip
**Risk:** Location stops updating, arrival not detected  
**Test:** Revoke location permission → verify graceful degradation

### TC-CRIT-004: 401 during active location sync
**Risk:** Background task fires 401, token cleared, UI loops  
**Test:** Mock 401 on location-update → verify redirect to login

### TC-CRIT-005: RIDE_END 400 from location task
**Risk:** Background task keeps firing after ride ended server-side  
**Test:** Mock 400 RIDE_END → verify task stops, storage cleared

### TC-CRIT-006: App killed and restarted mid-trip
**Risk:** Ride state lost, driver confused  
**Test:** Send app to background, kill, relaunch → verify booking still navigable

### TC-CRIT-007: Invalid waypointId on arrived-at-stop
**Risk:** Wrong stop marked as arrived  
**Test:** Pass waypointId=0 → verify API rejects (backend validation)

### TC-CRIT-008: Payment amount = 0 submitted
**Risk:** Zero-amount payment accepted  
**Test:** Amount input = 0 → Confirm button disabled (UI guard)

### TC-CRIT-009: Hourly timer with null rideStartTime  
**Risk:** Timer never shows, driver confused  
**Test:** rideStartTime=null → formattedTime = "—", no crash

### TC-CRIT-010: Multiple rapid postDriverOnTheWay calls
**Risk:** Duplicate API calls, double-billing  
**Test:** Tap button twice fast → only one API call made

---

## 5. Test Data Requirements

### Valid accounts (staging)
```
Phone: 9876543210
OTP: 1234 (staging bypass)
ChauffeurId: 99
```

### Booking fixtures needed
- ONE_WAY booking with 2 stops (status: ASSIGNED)
- HOURLY_RENTALS 4-hour booking (status: ASSIGNED)
- ONE_WAY with waiting history (totalWaitingSeconds > 180)
- RIDE_END booking (for payment screen testing)

### Mocked API responses (for unit/integration)
See `__tests__/mocks/api.mock.ts` and `services.mock.ts`

---

## 6. Mocking Strategy

### API mocks (Axios)
```typescript
jest.mock('../src/services/apiClient', () => ({
  default: { get: jest.fn(), post: jest.fn(), put: jest.fn() }
}));
```

### Location mocks
```typescript
jest.mock('expo-location', () => ({
  requestForegroundPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  startLocationUpdatesAsync: jest.fn().mockResolvedValue(undefined),
  // ...
}));
```

### Timer mocks
```typescript
jest.useFakeTimers();
jest.advanceTimersByTime(30000); // Advance 30s
jest.useRealTimers();
```

### AsyncStorage mock
```typescript
jest.mock('@react-native-async-storage/async-storage',
  () => require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);
```

### DeviceEventEmitter mock
Directly call event handlers in tests using `DeviceEventEmitter.emit(...)`.

---

## 7. CI/CD Configuration

### Run order
1. `jest --testPathPattern=unit` — Fast, run on every commit
2. `jest --testPathPattern=integration` — Run on PR
3. `detox test` — Run on merge to main

### Coverage gates
```json
{
  "branches": 80,
  "functions": 85,
  "lines": 85,
  "statements": 85
}
```

### Commands
```bash
# Unit tests
npx jest --testPathPattern=unit --coverage

# Integration tests
npx jest --testPathPattern=integration

# E2E (iOS Simulator)
npx detox build --configuration ios.sim.debug
npx detox test --configuration ios.sim.debug

# E2E (Android Emulator)
npx detox build --configuration android.emu.debug
npx detox test --configuration android.emu.debug
```

---

## 8. Coverage Checklist

### AUTH
- [x] Login success (TC-AUTH)
- [x] Invalid phone (E2E-AUTH-002)
- [x] OTP failure from backend (E2E-AUTH-003)
- [x] Token persistence (E2E-AUTH-004)
- [x] 401 redirect to login (E2E-AUTH-005)

### BOOKINGS
- [x] Current tab fetch (TC-BOOKINGS-002)
- [x] Upcoming tab fetch (TC-BOOKINGS-003)
- [x] Past tab fetch (TC-BOOKINGS-004)
- [x] Sorting: today-first (TC-SORT-002)
- [x] Empty state (TC-BOOKINGS-011)
- [x] Cache hit on tab switch (TC-BOOKINGS-009)
- [x] Pull-to-refresh busts cache (TC-BOOKINGS-010)
- [x] Session expired error (TC-BOOKINGS-013)
- [x] bookingMapper: all fields (TC-MAP-001 to 020)

### MAP / NAVIGATION
- [x] Route extraction: PICKUP → STOPS → DROP (TC-WP-010)
- [x] Invalid coordinates filtered (TC-WP-013)
- [x] Empty waypoints handled (TC-WP-016)
- [x] Duplicate PICKUP/DROP guard (TC-WP-017, TC-WP-018)

### WAYPOINTS
- [x] waypointId preserved for API (TC-WP-021)
- [x] Multi-stop sequence ordering (TC-WP-019)
- [x] postArrivedAtStop sends correct waypointId (TC-SVC-008)
- [x] postSkipStop sends correct waypointId (TC-SVC-009)

### LOCATION TRACKING
- [x] Location update API called with coordinates (TC-LOC-004)
- [x] Arrival detection via arrived=true (TC-LOC-003)
- [x] Background task starts/stops (TC-LOC-009, TC-LOC-010)
- [x] Throttle: skip if < 25s (TC-LOC-017)
- [x] Throttle: allow if >= 25s (TC-LOC-018)
- [x] RIDE_END 400 stops task (TC-LOC-015)
- [x] Duplicate start protection (TC-LOC-012)
- [x] Different booking replaces old tracking (TC-LOC-013)
- [x] No access token skips update (TC-LOC-014)
- [x] GPS unavailable is handled (TC-LOC-019)

### WAIT FEATURE
- [x] startWaiting initialises from backend value (TC-WAIT-004)
- [x] Timer increments every second (TC-WAIT-003)
- [x] stopWaiting freezes timer (TC-WAIT-006)
- [x] resetTimer clears all state (TC-WAIT-008)
- [x] isFreeTimeExceeded at 180s (TC-WAIT-010)
- [x] isFreeTimeExceeded not triggered before 180s (TC-WAIT-009)
- [x] Timer idempotent (double start safe) (TC-WAIT-005)
- [x] Interval cleaned up on unmount (TC-WAIT-019)
- [x] Resume from new backend value (TC-WAIT-020)

### EXTRA CHARGES
- [x] Add MC_FARE, TOLL_CHARGE, PARKING_CHARGE (TC-CHARGES-012)
- [x] Edit charge amount (TC-PAY-017)
- [x] Multiple charges same type (TC-PAY-014)
- [x] PUT + GET API sync (TC-PAY-010)
- [x] Zero-amount rejected (TC-STORE-009)
- [x] saveCharges failure alert (TC-CHARGES-007)
- [x] CHARGE_DISPLAY_NAME mapping (TC-PAY-015)

### PAYMENT FLOW
- [x] PAID: amount sent in payload (TC-PAY-002)
- [x] UNPAID: no amount in payload (TC-PAY-003)
- [x] Payment failure propagates error (TC-PAY-004)
- [x] Ride cleared after payment (TC-PAY-005)
- [x] End ride → payment order (TC-PAY-008)

### HOURLY RIDE
- [x] Timer from rideStartTime (TC-HTIMER-015)
- [x] HH:mm when > 10 min (TC-HTIMER-018)
- [x] mm:ss when ≤ 10 min (TC-HTIMER-019)
- [x] isExpired=true when past end (TC-HTIMER-016)
- [x] Overrun shown as elapsed (TC-HR-027)
- [x] sendFinalAndStop idempotent (TC-LOC-021)
- [x] rideStartTime updated each sync (TC-HR-029)
- [x] Timer interval cleaned on unmount (TC-HTIMER-020)

### STATUS HANDLING
- [x] GOING_TO_PICKUP on initRide (TC-STORE-002)
- [x] ARRIVED_AT_PICKUP transition (TC-STORE-004)
- [x] OTP_PENDING transition (TC-OW-009)
- [x] TRIP_STARTED after OTP success (TC-OW-013)
- [x] TRIP_COMPLETED after end ride (TC-OW-027)
- [x] isWaiting blocks end trip (TC-OW-021)

### EDGE CASES
- [x] API network failure (TC-OW-006)
- [x] Zero-amount charge rejected (TC-OW-036)
- [x] Re-entry clears old state (TC-OW-038)
- [x] parseRideStartTime null/malformed (TC-HTIMER-002 to 005)
- [x] Hourly hours=0 shows "—" (TC-HR-024)
- [x] Empty booking list (TC-BOOKINGS-011)
- [x] Non-RIDE_END 400 does not stop task (TC-LOC-016)
- [x] 401 during location update (TC-HR-035)

---

## 9. Test Extensibility

### Adding new booking statuses
1. Add status to `BookingStatus` type in `src/types/booking.ts`
2. Add case to `getActionForBooking()` in the screen
3. Add test case to `oneWayFlow.test.ts` under "Status Handling"

### Adding new charge types
1. Add type to `ChargeType` in `src/types/charge.ts`
2. Add to `CHARGE_DISPLAY_NAME` and `CHARGE_ORDER`
3. Add test case to `useCharges.test.ts` TC-CHARGES-012

### New flow (e.g. multi-vehicle)
1. Add to `mockBookingVehicle` in `api.mock.ts`
2. Create new integration test file
3. Add E2E scenario

---

## 10. Known Gaps / Future Work

| Area | Gap | Priority |
|------|-----|----------|
| Component rendering | RNTL tests for `PickupDrawer`, `OTPModal`, `ChargeModal` | HIGH |
| Alert system | `AlertContext` queue tests | HIGH |
| MapViewContainer | Route rendering assertions | MEDIUM |
| SlideToConfirm | Gesture testing | MEDIUM |
| Profile screen | Static content tests | LOW |
| Push notifications | Not yet covered | LOW |
| App update check | `UpdateManager` component | LOW |
