# GraphQL CRUD Frontend - Testing Guide

## 🎯 Overview

This directory contains comprehensive unit tests for the frontend JavaScript application (`script.js`). The tests were created to ensure the reliability and correctness of the new caching functionality and all existing features.

## 📋 What's New

The current branch introduces **localStorage caching** to improve performance by reducing redundant API calls. The test suite thoroughly validates:

- ✅ Cache storage and retrieval
- ✅ Cache-first data loading
- ✅ Fallback to API when cache is empty
- ✅ Cache invalidation after mutations
- ✅ Error handling for corrupted cache
- ✅ Performance improvements from caching

## 📦 Test Files

### `script.test.js` (Main Test Suite)
Comprehensive tests covering:
- **gql() function**: GraphQL API communication (18 tests)
- **cache object**: localStorage operations (10 tests)
- **escape() function**: XSS prevention (9 tests)
- **renderUsers() function**: UI rendering (13 tests)
- **loadUsers() function**: Data loading with cache (9 tests)
- **deletePost() function**: Post deletion workflow (8 tests)
- **Form submission**: User creation (13 tests)
- **Integration tests**: End-to-end flows (3 tests)
- **Edge cases**: Robustness testing (9 tests)

**Total: 92+ test cases**

### `cache.test.js` (Cache-Focused Tests)
Additional tests specifically for caching:
- Cache behavior with loadUsers (5 tests)
- Cache persistence scenarios (5 tests)
- Cache invalidation scenarios (2 tests)
- Performance and optimization (3 tests)
- Error recovery with cache (3 tests)
- Cache key management (2 tests)

**Total: 20+ test cases**

### `jest.setup.js`
Global test configuration:
- Mock setup for `alert`, `confirm`, `fetch`
- Testing library matchers
- JSDOM environment configuration

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd frontend
npm install
```

This installs:
- Jest 29.7.0 (test runner)
- @testing-library/dom & @testing-library/jest-dom (DOM testing utilities)
- jest-environment-jsdom (browser-like environment)
- jest-localstorage-mock (localStorage mocking)

### 2. Run Tests

```bash
# Run all tests once
npm test

# Run tests in watch mode (re-runs on file changes)
npm test:watch

# Run with coverage report
npm test:coverage
```

### 3. View Results

Test output shows all tests passing with comprehensive coverage.

## 📊 Coverage Report

Run `npm test:coverage` to generate detailed coverage. Coverage thresholds are set at 80% for all metrics.

## 🧪 Test Structure

### Anatomy of a Test

```javascript
describe('Feature Name', () => {
  beforeEach(() => {
    // Setup: Reset mocks, create DOM, clear localStorage
  });

  test('should do something specific', async () => {
    // Arrange: Set up test data
    const mockData = { users: [] };
    
    // Act: Execute the function
    await loadUsers();
    
    // Assert: Verify expectations
    expect(global.fetch).toHaveBeenCalled();
  });
});
```

### Key Testing Patterns

1. **Isolation**: Each test runs independently
2. **Mocking**: External dependencies are mocked
3. **Async/Await**: Proper handling of asynchronous code
4. **DOM Manipulation**: JSDOM provides browser APIs
5. **Descriptive Names**: Tests clearly state what they verify

## 🔍 Test Categories

### Unit Tests
Test individual functions in isolation:
- `gql()` - API communication
- `cache.get()` / `cache.set()` - localStorage
- `escape()` - HTML sanitization
- `renderUsers()` - UI generation

### Integration Tests
Test multiple components working together:
- Complete user creation flow
- Cache + API interaction
- Post deletion + UI refresh
- Form submission + data persistence

### Edge Case Tests
Test boundary conditions and error scenarios:
- Malformed JSON in cache
- Network failures
- Concurrent operations
- Large datasets
- Special characters and Unicode

## 🛡️ Security Testing

XSS Prevention tests ensure user input is properly escaped.

## 🎨 Best Practices Demonstrated

1. **Clear Test Names**: `should do X when Y happens`
2. **Arrange-Act-Assert**: Structured test logic
3. **Mock External Dependencies**: Isolated testing
4. **Test One Thing**: Each test has a single responsibility
5. **Setup/Teardown**: Clean state for each test
6. **Async Handling**: Proper await usage
7. **Edge Cases**: Comprehensive scenario coverage

## 🐛 Debugging Tests

### Run Single Test
```bash
npm test -- --testNamePattern="should cache data after successful API fetch"
```

### Run Specific File
```bash
npm test script.test.js
```

### Enable Verbose Output
```bash
npm test -- --verbose
```

## 📈 Continuous Integration

Tests are CI-ready with proper exit codes and coverage reporting.

## 📚 Resources

- [Jest Documentation](https://jestjs.io/)
- [Testing Library](https://testing-library.com/)
- [JSDOM](https://github.com/jsdom/jsdom)

## ✅ Summary

**Total Test Cases**: 112+
**Coverage Target**: 80%+
**Test Frameworks**: Jest, Testing Library, JSDOM
**Focus Areas**: Caching, API calls, DOM manipulation, Security, Error handling

The test suite provides confidence that the caching functionality works correctly and doesn't break existing features.