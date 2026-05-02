/**
 * Detox global setup — runs before all E2E tests
 */

import { cleanup } from 'detox';
import adapter from 'detox/runners/jest/adapter';

// @ts-ignore
jasmine.getEnv().addReporter(adapter);

beforeAll(async () => {
  await adapter.setup();
});

afterAll(async () => {
  await adapter.teardown();
});
