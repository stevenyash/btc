/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>'],
  testMatch: [
    '**/*.test.ts',
    '**/*.spec.ts'
  ],
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
  },
  setupFilesAfterEnv: ['<rootDir>/jest.setup.cjs'],
  collectCoverageFrom: [
    'helpers/**/*.ts',
    'services/**/*.ts',
    'controllers/**/*.ts',
    '!**/*.test.ts',
    '!**/*.spec.ts',
    '!**/node_modules/**',
    '!**/dist/**'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  moduleNameMapper: {
    '^(\\.[/\\\\].*)\\.(css|less|sass|scss)$': 'identity-obj-proxy',
    '^(\\.{1,2}[/\\\\].*)\\.js$': '$1',
  },
  testTimeout: 30000,
  verbose: true
};