import type { Config } from '@jest/types';
import nextJest from 'next/jest';

// Provide the path to your Next.js app to load next.config.js and .env files
const createJestConfig = nextJest({
  dir: './', // Path to your Next.js app
});

// Custom config to be passed to Jest
const customJestConfig: Config.InitialOptions = {
  // Add more setup options before each test is run
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],

  // Test environment
  testEnvironment: 'jsdom',

  // Module file extensions for importing
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],

  // Module name mapper
  moduleNameMapper: {
    // Handle module aliases (this will be automatically configured for you when using next/jest)
    '^@/(.*)$': '<rootDir>/$1',

    // Handle CSS imports
    '^.+\\.(css|sass|scss)$': 'identity-obj-proxy',

    // Handle image imports
    '^.+\\.(jpg|jpeg|png|gif|webp|avif|svg)$': '<rootDir>/__mocks__/fileMock.js',

    // Handle static assets
    '^.+\\.(woff|woff2|eot|ttf|otf)$': '<rootDir>/__mocks__/fileMock.js',
  },

  // Transform settings
  transform: {
    // Use babel-jest to transpile tests with the next/babel preset
    '^.+\\.(js|jsx|ts|tsx)$': ['babel-jest', { presets: ['next/babel'] }],
  },

  // Test path patterns
  testPathIgnorePatterns: [
    '<rootDir>/.next/',
    '<rootDir>/node_modules/',
    '<rootDir>/cypress/',
    '<rootDir>/coverage/',
    '<rootDir>/dist/',
  ],

  // Collect coverage
  collectCoverage: true,
  collectCoverageFrom: [
    '**/*.{js,jsx,ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/.next/**',
    '!**/coverage/**',
    '!**/cypress/**',
    '!**/types/**',
    '!**/pages/_app.tsx',
    '!**/pages/_document.tsx',
    '!**/jest.config.*',
    '!**/next.config.*',
    '!**/postcss.config.*',
    '!**/tailwind.config.*',
  ],

  // Coverage thresholds
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },

  // Setup files
  setupFiles: ['<rootDir>/__tests__/setup.ts'],

  // Test timeout
  testTimeout: 10000,

  // Watch plugins
  watchPlugins: ['jest-watch-typeahead/filename', 'jest-watch-typeahead/testname'],

  // Clear mocks between tests
  clearMocks: true,

  // Reset modules between tests
  resetMocks: true,

  // Reset modules between test files
  resetModules: true,

  // Global test environment
  testEnvironmentOptions: {
    url: 'http://localhost:3000',
  },
};

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
export default createJestConfig(customJestConfig);
