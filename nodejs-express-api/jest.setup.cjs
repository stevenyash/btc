// Jest setup file
// This file is executed before each test suite

// Mock console.log to reduce noise in tests
const originalLog = console.log;
const originalError = console.error;

beforeEach(() => {
  console.log = jest.fn();
  console.error = jest.fn();
});

afterEach(() => {
  console.log = originalLog;
  console.error = originalError;
});

// Global test utilities
global.createMockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  return res;
};

global.createMockRequest = (overrides = {}) => ({
  params: {},
  query: {},
  body: {},
  headers: {},
  user: null,
  ...overrides
});