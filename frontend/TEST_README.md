# Frontend Unit Tests for GraphQL CRUD Application

## Overview
Comprehensive unit tests for `script.js` covering all functionality including:
- GraphQL query execution
- Local storage caching
- DOM manipulation and rendering
- User form submission
- Post deletion
- Error handling and edge cases
- XSS prevention

## Test Structure

### Test Suites

1. **gql() function** - Tests for GraphQL API communication
   - POST request formatting
   - Variable passing
   - Response handling
   - Error handling
   - Network failures

2. **cache object** - Tests for localStorage caching
   - Data storage and retrieval
   - JSON serialization
   - Complex object handling
   - Edge cases (null, empty strings, special characters)

3. **escape() function** - Tests for XSS prevention
   - HTML entity escaping
   - Special character handling
   - Unicode support
   - Whitespace preservation

4. **renderUsers() function** - Tests for UI rendering
   - User card generation
   - Post rendering
   - Empty state handling
   - XSS prevention in rendered content
   - Delete button functionality

5. **loadUsers() function** - Tests for data loading
   - Cache utilization
   - API fallback
   - Loading states
   - Error display
   - Data persistence

6. **deletePost() function** - Tests for post deletion
   - Confirmation dialog
   - GraphQL mutation
   - UI refresh
   - Error handling

7. **User form submission** - Tests for user creation
   - Form validation
   - Data extraction
   - Age parsing (integer conversion)
   - Null handling for optional fields
   - Form reset after submission
   - Error feedback

8. **Integration tests** - End-to-end workflows
   - Complete user creation flow
   - Cache persistence across loads
   - Post deletion with refresh
   - Multiple concurrent operations

9. **Edge cases and error handling**
   - Malformed data
   - Missing DOM elements
   - Concurrent operations
   - Boundary values

## Running Tests

### Install Dependencies
```bash
cd frontend
npm install
```

### Run All Tests
```bash
npm test
```

### Run Tests in Watch Mode
```bash
npm test:watch
```

### Generate Coverage Report
```bash
npm test:coverage
```

## Test Coverage Goals
- **Lines**: 80%+
- **Functions**: 80%+
- **Branches**: 80%+
- **Statements**: 80%+

## Key Testing Patterns

### Mocking
- `fetch` API is mocked globally
- `localStorage` is mocked via `jest-localstorage-mock`
- `alert` and `confirm` dialogs are mocked
- DOM elements are created in `beforeEach` hooks

### Async Testing
All async functions are tested with proper `await` and promise handling to ensure accurate test results.

### DOM Testing
JSDOM environment provides browser-like DOM API for testing DOM manipulation without a real browser.

### Security Testing
XSS prevention is thoroughly tested with various attack vectors including:
- Script tags
- Event handlers
- HTML entities
- Special characters

## Test File Organization

Each test suite is organized with:
1. **Setup** (`beforeEach`): Clean slate for each test
2. **Teardown** (`afterEach`): Cleanup and mock restoration
3. **Test cases**: Descriptive names explaining what is being tested
4. **Assertions**: Clear expectations with helpful error messages

## Continuous Integration

These tests are designed to run in CI/CD pipelines. The test configuration in `package.json` includes:
- Jest environment setup
- Coverage thresholds
- Test file patterns
- Mock configurations

## Debugging Tests

To debug a specific test:
```bash
npm test -- --testNamePattern="should handle network errors"
```

To run a specific test file:
```bash
npm test script.test.js
```

## Notes

- Tests use Jest 29.x with JSDOM environment
- All DOM operations are tested without requiring a browser
- LocalStorage operations are fully mocked
- Network requests are intercepted and mocked
- Tests are isolated and can run in any order
- Each test suite has its own describe block for organization

## Future Enhancements

Potential additions:
- Visual regression tests
- Performance benchmarks
- Accessibility tests
- E2E tests with Playwright/Cypress
- Snapshot tests for rendered HTML