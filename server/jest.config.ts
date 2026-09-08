import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/tests/**/*.test.ts'],
  moduleFileExtensions: ['ts', 'js', 'json', 'node'],
  verbose: true,
  forceExit: true,
  detectOpenHandles: true,
  watchman: false,
  haste: {
    enableSymlinks: false,
  },
  modulePathIgnorePatterns: ['<rootDir>/../node_modules'],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {}],
  },
  testTimeout: 30000,
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/tests/**',
    '!src/index.ts',
    '!src/config/initDb.ts',
    '!**/node_modules/**',
  ],
  coverageReporters: ['text', 'lcov', 'clover'],
};

export default config;
