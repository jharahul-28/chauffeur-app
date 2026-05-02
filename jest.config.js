module.exports = {
  preset: 'jest-expo',
  setupFilesAfterEnv: ['./jest.setup.js'],
  testMatch: [
    '**/__tests__/**/*.test.(ts|tsx)',
    '**/__tests__/**/*.spec.(ts|tsx)',
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  transformIgnorePatterns: [
    'node_modules/(?!(' + [
      '(jest-)?react-native',
      '@react-native(-community)?',
      'expo(-[a-z-]+)?',
      '@expo(-[a-z-]+)?',
      '@unimodules',
      '@react-navigation',
      'zustand',
    ].join('|') + ')/)',
  ],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/index.ts',
  ],
  // Thresholds re-enable once baseline test pass rate is established.
  // coverageThreshold: {
  //   global: { branches: 80, functions: 85, lines: 85, statements: 85 },
  // },
};
