// Jest setup file for additional matchers and global configurations
require('@testing-library/jest-dom');

// Mock alert and confirm globally
global.alert = jest.fn();
global.confirm = jest.fn();

// Mock fetch globally (will be overridden in specific tests)
global.fetch = jest.fn();