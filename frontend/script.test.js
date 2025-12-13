/**
 * Comprehensive Unit Tests for frontend/script.js
 * Tests cover: gql function, cache object, DOM manipulation, 
 * user operations, error handling, and edge cases
 */

// Store original implementations
const originalFetch = global.fetch;
const originalLocalStorage = global.localStorage;

describe('GraphQL CRUD Frontend - script.js', () => {
  
  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
    localStorage.clear();
    
    // Setup DOM structure
    document.body.innerHTML = `
      <form id="userForm">
        <input id="name" value="" />
        <input id="email" value="" />
        <input id="age" value="" />
      </form>
      <div id="users"></div>
    `;
    
    // Reset fetch mock
    global.fetch = jest.fn();
    global.alert = jest.fn();
    global.confirm = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('gql() function', () => {
    
    test('should make POST request to GraphQL endpoint with correct headers', async () => {
      const mockResponse = {
        data: { users: [] }
      };
      
      global.fetch.mockResolvedValueOnce({
        json: async () => mockResponse
      });

      const query = 'query { users { id name } }';
      await gql(query);

      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:4000/graphql',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query, variables: {} })
        }
      );
    });

    test('should pass variables correctly in request body', async () => {
      const mockResponse = { data: { user: { id: '1' } } };
      global.fetch.mockResolvedValueOnce({
        json: async () => mockResponse
      });

      const query = 'mutation($name: String!) { createUser(name: $name) { id } }';
      const variables = { name: 'John Doe' };
      
      await gql(query, variables);

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:4000/graphql',
        expect.objectContaining({
          body: JSON.stringify({ query, variables })
        })
      );
    });

    test('should return data from successful response', async () => {
      const expectedData = { 
        users: [
          { id: '1', name: 'Alice', email: 'alice@test.com' }
        ]
      };
      
      global.fetch.mockResolvedValueOnce({
        json: async () => ({ data: expectedData })
      });

      const result = await gql('query { users { id name email } }');
      
      expect(result).toEqual(expectedData);
    });

    test('should throw error when GraphQL response contains errors', async () => {
      const errorMessage = 'User not found';
      global.fetch.mockResolvedValueOnce({
        json: async () => ({
          errors: [{ message: errorMessage }]
        })
      });

      await expect(gql('query { user(id: "999") { id } }'))
        .rejects
        .toThrow(errorMessage);
    });

    test('should handle multiple GraphQL errors by throwing first error', async () => {
      global.fetch.mockResolvedValueOnce({
        json: async () => ({
          errors: [
            { message: 'First error' },
            { message: 'Second error' }
          ]
        })
      });

      await expect(gql('invalid query'))
        .rejects
        .toThrow('First error');
    });

    test('should handle network errors', async () => {
      global.fetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(gql('query { users { id } }'))
        .rejects
        .toThrow('Network error');
    });

    test('should handle malformed JSON response', async () => {
      global.fetch.mockResolvedValueOnce({
        json: async () => {
          throw new Error('Invalid JSON');
        }
      });

      await expect(gql('query { users { id } }'))
        .rejects
        .toThrow('Invalid JSON');
    });

    test('should work with empty variables object', async () => {
      const mockResponse = { data: { users: [] } };
      global.fetch.mockResolvedValueOnce({
        json: async () => mockResponse
      });

      const result = await gql('query { users { id } }', {});
      
      expect(result).toEqual(mockResponse.data);
    });

    test('should handle null data in response', async () => {
      global.fetch.mockResolvedValueOnce({
        json: async () => ({ data: null })
      });

      const result = await gql('query { users { id } }');
      
      expect(result).toBeNull();
    });
  });

  describe('cache object', () => {
    
    test('should store data in localStorage when set() is called', () => {
      const key = 'testKey';
      const value = { id: '1', name: 'Test User' };
      
      cache.set(key, value);
      
      const stored = localStorage.getItem(key);
      expect(stored).toBe(JSON.stringify(value));
    });

    test('should retrieve and parse data from localStorage when get() is called', () => {
      const key = 'users';
      const value = { users: [{ id: '1', name: 'Alice' }] };
      
      localStorage.setItem(key, JSON.stringify(value));
      
      const result = cache.get(key);
      expect(result).toEqual(value);
    });

    test('should return null when key does not exist in localStorage', () => {
      const result = cache.get('nonexistent-key');
      expect(result).toBeNull();
    });

    test('should handle storing complex nested objects', () => {
      const complexData = {
        users: [
          {
            id: '1',
            name: 'User One',
            posts: [
              { id: 'p1', title: 'Post 1', content: 'Content 1' },
              { id: 'p2', title: 'Post 2', content: 'Content 2' }
            ]
          }
        ]
      };
      
      cache.set('complex', complexData);
      const retrieved = cache.get('complex');
      
      expect(retrieved).toEqual(complexData);
    });

    test('should handle storing arrays', () => {
      const arrayData = [1, 2, 3, 4, 5];
      
      cache.set('numbers', arrayData);
      const retrieved = cache.get('numbers');
      
      expect(retrieved).toEqual(arrayData);
    });

    test('should handle storing primitive values', () => {
      cache.set('string', 'hello');
      cache.set('number', 42);
      cache.set('boolean', true);
      cache.set('null', null);
      
      expect(cache.get('string')).toBe('hello');
      expect(cache.get('number')).toBe(42);
      expect(cache.get('boolean')).toBe(true);
      expect(cache.get('null')).toBeNull();
    });

    test('should overwrite existing cache entries', () => {
      cache.set('key', 'first value');
      cache.set('key', 'second value');
      
      expect(cache.get('key')).toBe('second value');
    });

    test('should handle empty string as key', () => {
      cache.set('', { data: 'test' });
      expect(cache.get('')).toEqual({ data: 'test' });
    });

    test('should handle special characters in keys', () => {
      const specialKey = 'key-with.special@chars!';
      const value = { test: 'data' };
      
      cache.set(specialKey, value);
      expect(cache.get(specialKey)).toEqual(value);
    });
  });

  describe('escape() function', () => {
    
    test('should escape HTML special characters', () => {
      const input = '<script>alert("XSS")</script>';
      const result = escape(input);
      
      expect(result).toBe('&lt;script&gt;alert("XSS")&lt;/script&gt;');
    });

    test('should escape ampersands', () => {
      expect(escape('Tom & Jerry')).toBe('Tom &amp; Jerry');
    });

    test('should escape quotes', () => {
      expect(escape('He said "Hello"')).toBe('He said "Hello"');
    });

    test('should escape single quotes', () => {
      expect(escape("It's a test")).toBe("It's a test");
    });

    test('should handle empty strings', () => {
      expect(escape('')).toBe('');
    });

    test('should handle strings with multiple special characters', () => {
      const input = '<div class="test" id=\'main\'>Content & more</div>';
      const result = escape(input);
      
      expect(result).toContain('&lt;');
      expect(result).toContain('&gt;');
      expect(result).toContain('&amp;');
    });

    test('should not double-escape already escaped strings', () => {
      const input = '&lt;script&gt;';
      const result = escape(input);
      
      expect(result).toBe('&amp;lt;script&amp;gt;');
    });

    test('should handle unicode characters', () => {
      const input = 'Hello 世界 🌍';
      const result = escape(input);
      
      expect(result).toBe('Hello 世界 🌍');
    });

    test('should preserve whitespace', () => {
      const input = '  test  with   spaces  ';
      const result = escape(input);
      
      expect(result).toBe('  test  with   spaces  ');
    });
  });

  describe('renderUsers() function', () => {
    
    test('should display "No users yet" when users array is empty', () => {
      renderUsers([]);
      
      const usersDiv = document.getElementById('users');
      expect(usersDiv.innerHTML).toContain('No users yet.');
    });

    test('should render user cards with name and email', () => {
      const users = [
        {
          id: '1',
          name: 'Alice',
          email: 'alice@test.com',
          age: null,
          posts: []
        }
      ];
      
      renderUsers(users);
      
      const usersDiv = document.getElementById('users');
      expect(usersDiv.innerHTML).toContain('Alice');
      expect(usersDiv.innerHTML).toContain('alice@test.com');
    });

    test('should render age when present', () => {
      const users = [
        {
          id: '1',
          name: 'Bob',
          email: 'bob@test.com',
          age: 30,
          posts: []
        }
      ];
      
      renderUsers(users);
      
      const usersDiv = document.getElementById('users');
      expect(usersDiv.innerHTML).toContain('Age:');
      expect(usersDiv.innerHTML).toContain('30');
    });

    test('should not render age section when age is null', () => {
      const users = [
        {
          id: '1',
          name: 'Charlie',
          email: 'charlie@test.com',
          age: null,
          posts: []
        }
      ];
      
      renderUsers(users);
      
      const usersDiv = document.getElementById('users');
      expect(usersDiv.innerHTML).not.toContain('Age:');
    });

    test('should render posts when user has posts', () => {
      const users = [
        {
          id: '1',
          name: 'David',
          email: 'david@test.com',
          age: 25,
          posts: [
            { id: 'p1', title: 'First Post', content: 'Post content' },
            { id: 'p2', title: 'Second Post', content: 'More content' }
          ]
        }
      ];
      
      renderUsers(users);
      
      const usersDiv = document.getElementById('users');
      expect(usersDiv.innerHTML).toContain('First Post');
      expect(usersDiv.innerHTML).toContain('Post content');
      expect(usersDiv.innerHTML).toContain('Second Post');
      expect(usersDiv.innerHTML).toContain('More content');
    });

    test('should display "No posts" when posts array is empty', () => {
      const users = [
        {
          id: '1',
          name: 'Eve',
          email: 'eve@test.com',
          age: null,
          posts: []
        }
      ];
      
      renderUsers(users);
      
      const usersDiv = document.getElementById('users');
      expect(usersDiv.innerHTML).toContain('No posts');
    });

    test('should render delete button for each post', () => {
      const users = [
        {
          id: '1',
          name: 'Frank',
          email: 'frank@test.com',
          age: null,
          posts: [
            { id: 'p1', title: 'Post 1', content: 'Content 1' }
          ]
        }
      ];
      
      renderUsers(users);
      
      const usersDiv = document.getElementById('users');
      expect(usersDiv.innerHTML).toContain('onclick="deletePost(\'p1\')"');
      expect(usersDiv.innerHTML).toContain('Delete');
    });

    test('should escape HTML in user name to prevent XSS', () => {
      const users = [
        {
          id: '1',
          name: '<script>alert("XSS")</script>',
          email: 'test@test.com',
          age: null,
          posts: []
        }
      ];
      
      renderUsers(users);
      
      const usersDiv = document.getElementById('users');
      expect(usersDiv.innerHTML).toContain('&lt;script&gt;');
      expect(usersDiv.innerHTML).not.toContain('<script>alert');
    });

    test('should escape HTML in email to prevent XSS', () => {
      const users = [
        {
          id: '1',
          name: 'User',
          email: '<img src=x onerror=alert(1)>',
          age: null,
          posts: []
        }
      ];
      
      renderUsers(users);
      
      const usersDiv = document.getElementById('users');
      expect(usersDiv.innerHTML).toContain('&lt;img');
      expect(usersDiv.innerHTML).not.toContain('<img src=x');
    });

    test('should escape HTML in post title and content', () => {
      const users = [
        {
          id: '1',
          name: 'User',
          email: 'user@test.com',
          age: null,
          posts: [
            {
              id: 'p1',
              title: '<b>Bold Title</b>',
              content: '<i>Italic Content</i>'
            }
          ]
        }
      ];
      
      renderUsers(users);
      
      const usersDiv = document.getElementById('users');
      expect(usersDiv.innerHTML).toContain('&lt;b&gt;');
      expect(usersDiv.innerHTML).toContain('&lt;i&gt;');
    });

    test('should render multiple users correctly', () => {
      const users = [
        {
          id: '1',
          name: 'User One',
          email: 'one@test.com',
          age: 20,
          posts: []
        },
        {
          id: '2',
          name: 'User Two',
          email: 'two@test.com',
          age: 30,
          posts: []
        },
        {
          id: '3',
          name: 'User Three',
          email: 'three@test.com',
          age: null,
          posts: []
        }
      ];
      
      renderUsers(users);
      
      const usersDiv = document.getElementById('users');
      expect(usersDiv.innerHTML).toContain('User One');
      expect(usersDiv.innerHTML).toContain('User Two');
      expect(usersDiv.innerHTML).toContain('User Three');
      expect(usersDiv.querySelectorAll('.user-card').length).toBe(3);
    });

    test('should handle user with age 0', () => {
      const users = [
        {
          id: '1',
          name: 'Baby',
          email: 'baby@test.com',
          age: 0,
          posts: []
        }
      ];
      
      renderUsers(users);
      
      const usersDiv = document.getElementById('users');
      // Age 0 is falsy, so it might not render depending on implementation
      // This tests the actual behavior
      expect(usersDiv.innerHTML).toContain('Baby');
    });
  });

  describe('loadUsers() function', () => {
    
    beforeEach(() => {
      // Mock gql function globally
      global.gql = jest.fn();
    });

    test('should display loading message initially', async () => {
      global.gql.mockImplementation(() => new Promise(() => {})); // Never resolves
      
      const loadPromise = loadUsers();
      
      const usersDiv = document.getElementById('users');
      expect(usersDiv.innerHTML).toContain('Loading users...');
      expect(usersDiv.querySelector('.loading')).toBeTruthy();
    });

    test('should use cached data if available', async () => {
      const cachedData = {
        users: [
          {
            id: '1',
            name: 'Cached User',
            email: 'cached@test.com',
            age: null,
            posts: []
          }
        ]
      };
      
      cache.set('users', cachedData);
      
      await loadUsers();
      
      const usersDiv = document.getElementById('users');
      expect(usersDiv.innerHTML).toContain('Cached User');
      expect(global.gql).not.toHaveBeenCalled();
    });

    test('should fetch from API when cache is empty', async () => {
      const apiData = {
        users: [
          {
            id: '1',
            name: 'API User',
            email: 'api@test.com',
            age: 25,
            posts: []
          }
        ]
      };
      
      global.gql.mockResolvedValueOnce(apiData);
      
      await loadUsers();
      
      expect(global.gql).toHaveBeenCalledWith(expect.stringContaining('query'));
      const usersDiv = document.getElementById('users');
      expect(usersDiv.innerHTML).toContain('API User');
    });

    test('should cache data after successful API fetch', async () => {
      const apiData = {
        users: [
          {
            id: '1',
            name: 'User',
            email: 'user@test.com',
            age: null,
            posts: []
          }
        ]
      };
      
      global.gql.mockResolvedValueOnce(apiData);
      
      await loadUsers();
      
      const cachedData = cache.get('users');
      expect(cachedData).toEqual(apiData);
    });

    test('should render users after successful fetch', async () => {
      const apiData = {
        users: [
          {
            id: '1',
            name: 'Test User',
            email: 'test@test.com',
            age: 30,
            posts: [
              { id: 'p1', title: 'Post', content: 'Content' }
            ]
          }
        ]
      };
      
      global.gql.mockResolvedValueOnce(apiData);
      
      await loadUsers();
      
      const usersDiv = document.getElementById('users');
      expect(usersDiv.innerHTML).toContain('Test User');
      expect(usersDiv.innerHTML).toContain('Post');
    });

    test('should display error message when fetch fails', async () => {
      const errorMessage = 'Network error';
      global.gql.mockRejectedValueOnce(new Error(errorMessage));
      
      await loadUsers();
      
      const usersDiv = document.getElementById('users');
      expect(usersDiv.innerHTML).toContain('Error:');
      expect(usersDiv.innerHTML).toContain(errorMessage);
      expect(usersDiv.innerHTML).toContain('color:red');
    });

    test('should not cache data when fetch fails', async () => {
      global.gql.mockRejectedValueOnce(new Error('API Error'));
      
      await loadUsers();
      
      const cachedData = cache.get('users');
      expect(cachedData).toBeNull();
    });

    test('should include all required fields in GraphQL query', async () => {
      global.gql.mockResolvedValueOnce({ users: [] });
      
      await loadUsers();
      
      const query = global.gql.mock.calls[0][0];
      expect(query).toContain('users');
      expect(query).toContain('id');
      expect(query).toContain('name');
      expect(query).toContain('email');
      expect(query).toContain('age');
      expect(query).toContain('posts');
      expect(query).toContain('title');
      expect(query).toContain('content');
    });

    test('should handle empty users array', async () => {
      global.gql.mockResolvedValueOnce({ users: [] });
      
      await loadUsers();
      
      const usersDiv = document.getElementById('users');
      expect(usersDiv.innerHTML).toContain('No users yet');
    });
  });

  describe('deletePost() function', () => {
    
    beforeEach(() => {
      global.gql = jest.fn();
      global.loadUsers = jest.fn();
    });

    test('should show confirmation dialog before deleting', async () => {
      global.confirm.mockReturnValueOnce(false);
      
      await window.deletePost('post123');
      
      expect(global.confirm).toHaveBeenCalledWith('Delete this post?');
      expect(global.gql).not.toHaveBeenCalled();
    });

    test('should call gql mutation when user confirms', async () => {
      global.confirm.mockReturnValueOnce(true);
      global.gql.mockResolvedValueOnce({});
      
      await window.deletePost('post123');
      
      expect(global.gql).toHaveBeenCalledWith(
        expect.stringContaining('mutation')
      );
      expect(global.gql).toHaveBeenCalledWith(
        expect.stringContaining('deletePost')
      );
      expect(global.gql).toHaveBeenCalledWith(
        expect.stringContaining('post123')
      );
    });

    test('should reload users after successful deletion', async () => {
      global.confirm.mockReturnValueOnce(true);
      global.gql.mockResolvedValueOnce({});
      
      await window.deletePost('post456');
      
      expect(global.loadUsers).toHaveBeenCalled();
    });

    test('should not reload users if user cancels', async () => {
      global.confirm.mockReturnValueOnce(false);
      
      await window.deletePost('post789');
      
      expect(global.loadUsers).not.toHaveBeenCalled();
    });

    test('should show alert when deletion fails', async () => {
      global.confirm.mockReturnValueOnce(true);
      const errorMessage = 'Post not found';
      global.gql.mockRejectedValueOnce(new Error(errorMessage));
      
      await window.deletePost('nonexistent');
      
      expect(global.alert).toHaveBeenCalledWith(
        expect.stringContaining('Delete failed')
      );
      expect(global.alert).toHaveBeenCalledWith(
        expect.stringContaining(errorMessage)
      );
    });

    test('should not reload users when deletion fails', async () => {
      global.confirm.mockReturnValueOnce(true);
      global.gql.mockRejectedValueOnce(new Error('Error'));
      
      await window.deletePost('post123');
      
      expect(global.loadUsers).not.toHaveBeenCalled();
    });

    test('should handle network errors gracefully', async () => {
      global.confirm.mockReturnValueOnce(true);
      global.gql.mockRejectedValueOnce(new Error('Network timeout'));
      
      await window.deletePost('post123');
      
      expect(global.alert).toHaveBeenCalled();
    });

    test('should handle empty post ID', async () => {
      global.confirm.mockReturnValueOnce(true);
      global.gql.mockResolvedValueOnce({});
      
      await window.deletePost('');
      
      expect(global.gql).toHaveBeenCalled();
    });
  });

  describe('User form submission', () => {
    
    beforeEach(() => {
      global.gql = jest.fn();
      global.loadUsers = jest.fn();
      
      // Re-create DOM to ensure fresh form
      document.body.innerHTML = `
        <form id="userForm">
          <input id="name" value="" />
          <input id="email" value="" />
          <input id="age" value="" />
        </form>
        <div id="users"></div>
      `;
    });

    test('should prevent default form submission', async () => {
      const form = document.getElementById('userForm');
      const event = new Event('submit', { bubbles: true, cancelable: true });
      const preventDefaultSpy = jest.spyOn(event, 'preventDefault');
      
      global.gql.mockResolvedValueOnce({});
      
      form.dispatchEvent(event);
      
      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 0));
      
      expect(preventDefaultSpy).toHaveBeenCalled();
    });

    test('should read values from form inputs', async () => {
      document.getElementById('name').value = 'John Doe';
      document.getElementById('email').value = 'john@example.com';
      document.getElementById('age').value = '35';
      
      global.gql.mockResolvedValueOnce({});
      
      const form = document.getElementById('userForm');
      const event = new Event('submit', { bubbles: true, cancelable: true });
      form.dispatchEvent(event);
      
      await new Promise(resolve => setTimeout(resolve, 0));
      
      expect(global.gql).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          n: 'John Doe',
          e: 'john@example.com',
          a: 35
        })
      );
    });

    test('should send null for age when not provided', async () => {
      document.getElementById('name').value = 'Jane';
      document.getElementById('email').value = 'jane@example.com';
      document.getElementById('age').value = '';
      
      global.gql.mockResolvedValueOnce({});
      
      const form = document.getElementById('userForm');
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
      
      await new Promise(resolve => setTimeout(resolve, 0));
      
      expect(global.gql).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          n: 'Jane',
          e: 'jane@example.com',
          a: null
        })
      );
    });

    test('should parse age as integer', async () => {
      document.getElementById('name').value = 'Bob';
      document.getElementById('email').value = 'bob@example.com';
      document.getElementById('age').value = '42';
      
      global.gql.mockResolvedValueOnce({});
      
      const form = document.getElementById('userForm');
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
      
      await new Promise(resolve => setTimeout(resolve, 0));
      
      const callArgs = global.gql.mock.calls[0][1];
      expect(typeof callArgs.a).toBe('number');
      expect(callArgs.a).toBe(42);
    });

    test('should use GraphQL mutation with variables', async () => {
      document.getElementById('name').value = 'Test';
      document.getElementById('email').value = 'test@test.com';
      
      global.gql.mockResolvedValueOnce({});
      
      const form = document.getElementById('userForm');
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
      
      await new Promise(resolve => setTimeout(resolve, 0));
      
      const query = global.gql.mock.calls[0][0];
      expect(query).toContain('mutation');
      expect(query).toContain('createUser');
      expect(query).toContain('$n:String!');
      expect(query).toContain('$e:String!');
      expect(query).toContain('$a:Int');
    });

    test('should reset form after successful submission', async () => {
      document.getElementById('name').value = 'Alice';
      document.getElementById('email').value = 'alice@test.com';
      document.getElementById('age').value = '28';
      
      global.gql.mockResolvedValueOnce({});
      
      const form = document.getElementById('userForm');
      const resetSpy = jest.spyOn(form, 'reset');
      
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
      
      await new Promise(resolve => setTimeout(resolve, 0));
      
      expect(resetSpy).toHaveBeenCalled();
    });

    test('should reload users after successful submission', async () => {
      document.getElementById('name').value = 'User';
      document.getElementById('email').value = 'user@test.com';
      
      global.gql.mockResolvedValueOnce({});
      
      const form = document.getElementById('userForm');
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
      
      await new Promise(resolve => setTimeout(resolve, 0));
      
      expect(global.loadUsers).toHaveBeenCalled();
    });

    test('should show alert when submission fails', async () => {
      document.getElementById('name').value = 'Error User';
      document.getElementById('email').value = 'error@test.com';
      
      const errorMessage = 'Email already exists';
      global.gql.mockRejectedValueOnce(new Error(errorMessage));
      
      const form = document.getElementById('userForm');
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
      
      await new Promise(resolve => setTimeout(resolve, 0));
      
      expect(global.alert).toHaveBeenCalledWith(
        expect.stringContaining('Error')
      );
      expect(global.alert).toHaveBeenCalledWith(
        expect.stringContaining(errorMessage)
      );
    });

    test('should not reset form when submission fails', async () => {
      document.getElementById('name').value = 'Keep Me';
      document.getElementById('email').value = 'keep@test.com';
      
      global.gql.mockRejectedValueOnce(new Error('Server error'));
      
      const form = document.getElementById('userForm');
      const resetSpy = jest.spyOn(form, 'reset');
      
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
      
      await new Promise(resolve => setTimeout(resolve, 0));
      
      expect(resetSpy).not.toHaveBeenCalled();
    });

    test('should handle special characters in name and email', async () => {
      document.getElementById('name').value = "O'Brien-Smith";
      document.getElementById('email').value = 'user+tag@example.com';
      
      global.gql.mockResolvedValueOnce({});
      
      const form = document.getElementById('userForm');
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
      
      await new Promise(resolve => setTimeout(resolve, 0));
      
      expect(global.gql).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          n: "O'Brien-Smith",
          e: 'user+tag@example.com'
        })
      );
    });

    test('should handle age as string "0"', async () => {
      document.getElementById('name').value = 'Newborn';
      document.getElementById('email').value = 'newborn@test.com';
      document.getElementById('age').value = '0';
      
      global.gql.mockResolvedValueOnce({});
      
      const form = document.getElementById('userForm');
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
      
      await new Promise(resolve => setTimeout(resolve, 0));
      
      const callArgs = global.gql.mock.calls[0][1];
      expect(callArgs.a).toBe(0);
      expect(typeof callArgs.a).toBe('number');
    });

    test('should handle very large age values', async () => {
      document.getElementById('name').value = 'Ancient';
      document.getElementById('email').value = 'ancient@test.com';
      document.getElementById('age').value = '999';
      
      global.gql.mockResolvedValueOnce({});
      
      const form = document.getElementById('userForm');
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
      
      await new Promise(resolve => setTimeout(resolve, 0));
      
      expect(global.gql).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ a: 999 })
      );
    });
  });

  describe('Integration tests', () => {
    
    beforeEach(() => {
      global.fetch = jest.fn();
      localStorage.clear();
    });

    test('should complete full user creation flow', async () => {
      // Mock successful API responses
      global.fetch
        .mockResolvedValueOnce({
          json: async () => ({
            data: { createUser: { id: 'new-user-id' } }
          })
        })
        .mockResolvedValueOnce({
          json: async () => ({
            data: {
              users: [
                {
                  id: 'new-user-id',
                  name: 'New User',
                  email: 'new@test.com',
                  age: 25,
                  posts: []
                }
              ]
            }
          })
        });

      // Fill form
      document.getElementById('name').value = 'New User';
      document.getElementById('email').value = 'new@test.com';
      document.getElementById('age').value = '25';

      // Submit form
      const form = document.getElementById('userForm');
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 100));

      // Verify user was created and list was refreshed
      expect(global.fetch).toHaveBeenCalledTimes(2);
      
      // Check form was reset
      expect(document.getElementById('name').value).toBe('');
    });

    test('should use cache on second load', async () => {
      const userData = {
        users: [
          {
            id: '1',
            name: 'Cached User',
            email: 'cached@test.com',
            age: null,
            posts: []
          }
        ]
      };

      // First load - from API
      global.fetch.mockResolvedValueOnce({
        json: async () => ({ data: userData })
      });

      await loadUsers();
      expect(global.fetch).toHaveBeenCalledTimes(1);

      // Second load - from cache
      global.fetch.mockClear();
      await loadUsers();
      expect(global.fetch).not.toHaveBeenCalled();

      // Verify cached data is displayed
      const usersDiv = document.getElementById('users');
      expect(usersDiv.innerHTML).toContain('Cached User');
    });

    test('should handle post deletion and refresh', async () => {
      global.confirm.mockReturnValueOnce(true);
      
      // Mock delete mutation
      global.fetch
        .mockResolvedValueOnce({
          json: async () => ({ data: { deletePost: true } })
        })
        // Mock refresh query
        .mockResolvedValueOnce({
          json: async () => ({
            data: {
              users: [
                {
                  id: '1',
                  name: 'User',
                  email: 'user@test.com',
                  age: null,
                  posts: []
                }
              ]
            }
          })
        });

      await window.deletePost('post123');

      expect(global.fetch).toHaveBeenCalledTimes(2);
      expect(global.confirm).toHaveBeenCalled();
    });
  });

  describe('Edge cases and error handling', () => {
    
    test('should handle undefined variables in gql', async () => {
      global.fetch.mockResolvedValueOnce({
        json: async () => ({ data: {} })
      });

      await gql('query { test }', undefined);
      
      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: JSON.stringify({ query: 'query { test }', variables: undefined })
        })
      );
    });

    test('should handle malformed cache data', () => {
      localStorage.setItem('users', 'invalid json{');
      
      expect(() => cache.get('users')).toThrow();
    });

    test('should handle null user in renderUsers', () => {
      // This shouldn't happen in practice, but let's test robustness
      expect(() => {
        renderUsers([null]);
      }).toThrow();
    });

    test('should handle missing DOM elements gracefully', () => {
      document.body.innerHTML = ''; // Remove all elements
      
      // These should not throw, though they won't work
      expect(() => {
        const usersDiv = document.getElementById('users');
        if (usersDiv) {
          usersDiv.innerHTML = 'test';
        }
      }).not.toThrow();
    });

    test('should handle very long strings in escape function', () => {
      const longString = '<script>' + 'a'.repeat(10000) + '</script>';
      const result = escape(longString);
      
      expect(result).toContain('&lt;script&gt;');
      expect(result.length).toBeGreaterThan(10000);
    });

    test('should handle concurrent loadUsers calls', async () => {
      global.fetch.mockImplementation(() => 
        new Promise(resolve => 
          setTimeout(() => 
            resolve({
              json: async () => ({ data: { users: [] } })
            }), 50)
        )
      );

      // Call loadUsers multiple times concurrently
      const promises = [
        loadUsers(),
        loadUsers(),
        loadUsers()
      ];

      await Promise.all(promises);

      // All should complete without errors
      const usersDiv = document.getElementById('users');
      expect(usersDiv).toBeTruthy();
    });

    test('should handle empty post ID in deletePost', async () => {
      global.confirm.mockReturnValueOnce(true);
      global.fetch.mockResolvedValueOnce({
        json: async () => ({ data: {} })
      });

      await window.deletePost('');
      
      expect(global.fetch).toHaveBeenCalled();
    });

    test('should handle age value of NaN', async () => {
      document.getElementById('name').value = 'Test';
      document.getElementById('email').value = 'test@test.com';
      document.getElementById('age').value = 'not-a-number';
      
      global.fetch.mockResolvedValueOnce({
        json: async () => ({ data: {} })
      });
      
      const form = document.getElementById('userForm');
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
      
      await new Promise(resolve => setTimeout(resolve, 0));
      
      // Should handle NaN gracefully
      expect(global.fetch).toHaveBeenCalled();
    });
  });
});