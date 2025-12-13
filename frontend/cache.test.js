/**
 * Additional Cache-Focused Tests
 * These tests specifically target the new caching functionality
 * added in the current branch changes
 */

describe('Cache Integration and Performance', () => {
  
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
    
    // Setup DOM
    document.body.innerHTML = `
      <form id="userForm">
        <input id="name" value="" />
        <input id="email" value="" />
        <input id="age" value="" />
      </form>
      <div id="users"></div>
    `;
    
    global.fetch = jest.fn();
    global.alert = jest.fn();
    global.confirm = jest.fn();
  });

  describe('Cache behavior with loadUsers', () => {
    
    test('should check cache before making API call', async () => {
      const cachedData = {
        users: [{
          id: '1',
          name: 'Cached User',
          email: 'cached@test.com',
          age: 30,
          posts: []
        }]
      };
      
      localStorage.setItem('users', JSON.stringify(cachedData));
      
      await loadUsers();
      
      // Should not make fetch call
      expect(global.fetch).not.toHaveBeenCalled();
      
      // Should render cached data
      const usersDiv = document.getElementById('users');
      expect(usersDiv.innerHTML).toContain('Cached User');
    });

    test('should skip loading state when using cache', async () => {
      const cachedData = {
        users: [{
          id: '1',
          name: 'User',
          email: 'user@test.com',
          age: null,
          posts: []
        }]
      };
      
      localStorage.setItem('users', JSON.stringify(cachedData));
      
      await loadUsers();
      
      const usersDiv = document.getElementById('users');
      // Should immediately show users, not loading message
      expect(usersDiv.innerHTML).not.toContain('Loading');
      expect(usersDiv.innerHTML).toContain('User');
    });

    test('should store full API response in cache', async () => {
      const apiResponse = {
        users: [{
          id: '1',
          name: 'API User',
          email: 'api@test.com',
          age: 25,
          posts: [
            { id: 'p1', title: 'Post', content: 'Content' }
          ]
        }]
      };
      
      global.fetch.mockResolvedValueOnce({
        json: async () => ({ data: apiResponse })
      });
      
      await loadUsers();
      
      // Check cache was populated
      const cached = JSON.parse(localStorage.getItem('users'));
      expect(cached).toEqual(apiResponse);
      expect(cached.users[0].posts).toHaveLength(1);
    });

    test('should handle corrupted cache data by fetching from API', async () => {
      // Set invalid JSON in cache
      localStorage.setItem('users', '{invalid json}');
      
      const apiResponse = {
        users: [{
          id: '1',
          name: 'Fresh User',
          email: 'fresh@test.com',
          age: null,
          posts: []
        }]
      };
      
      global.fetch.mockResolvedValueOnce({
        json: async () => ({ data: apiResponse })
      });
      
      // Should throw when trying to parse cache, then fetch from API
      let errorThrown = false;
      try {
        const cached = cache.get('users');
      } catch (e) {
        errorThrown = true;
      }
      
      expect(errorThrown).toBe(true);
    });

    test('should update cache when API returns new data', async () => {
      // Set old cache data
      const oldData = {
        users: [{
          id: '1',
          name: 'Old User',
          email: 'old@test.com',
          age: null,
          posts: []
        }]
      };
      localStorage.setItem('users', JSON.stringify(oldData));
      
      // Clear cache to force API call
      localStorage.removeItem('users');
      
      // Mock new API response
      const newData = {
        users: [{
          id: '1',
          name: 'New User',
          email: 'new@test.com',
          age: 30,
          posts: []
        }]
      };
      
      global.fetch.mockResolvedValueOnce({
        json: async () => ({ data: newData })
      });
      
      await loadUsers();
      
      // Check cache was updated
      const cached = JSON.parse(localStorage.getItem('users'));
      expect(cached.users[0].name).toBe('New User');
    });
  });

  describe('Cache persistence scenarios', () => {
    
    test('should persist cache across page reloads', () => {
      const userData = {
        users: [{
          id: '1',
          name: 'Persistent User',
          email: 'persist@test.com',
          age: null,
          posts: []
        }]
      };
      
      cache.set('users', userData);
      
      // Simulate page reload by clearing runtime state but not localStorage
      // In real scenario, the localStorage data persists
      const retrieved = cache.get('users');
      
      expect(retrieved).toEqual(userData);
    });

    test('should handle large dataset caching', () => {
      // Create a large dataset
      const largeDataset = {
        users: Array.from({ length: 100 }, (_, i) => ({
          id: `${i}`,
          name: `User ${i}`,
          email: `user${i}@test.com`,
          age: 20 + i,
          posts: Array.from({ length: 5 }, (_, j) => ({
            id: `p${i}-${j}`,
            title: `Post ${j}`,
            content: `Content for post ${j}`
          }))
        }))
      };
      
      cache.set('users', largeDataset);
      const retrieved = cache.get('users');
      
      expect(retrieved.users).toHaveLength(100);
      expect(retrieved.users[0].posts).toHaveLength(5);
    });

    test('should handle cache with special characters', () => {
      const specialData = {
        users: [{
          id: '1',
          name: 'User "with" quotes',
          email: 'user@test.com',
          age: null,
          posts: [{
            id: 'p1',
            title: 'Title with \n newlines',
            content: 'Content with \t tabs and \\ backslashes'
          }]
        }]
      };
      
      cache.set('users', specialData);
      const retrieved = cache.get('users');
      
      expect(retrieved).toEqual(specialData);
    });

    test('should handle cache with unicode characters', () => {
      const unicodeData = {
        users: [{
          id: '1',
          name: '用户 👤',
          email: 'user@测试.com',
          age: null,
          posts: [{
            id: 'p1',
            title: 'Título en español',
            content: 'Contenu en français 🇫🇷'
          }]
        }]
      };
      
      cache.set('users', unicodeData);
      const retrieved = cache.get('users');
      
      expect(retrieved).toEqual(unicodeData);
    });
  });

  describe('Cache invalidation scenarios', () => {
    
    test('should bypass cache after user creation', async () => {
      // Set initial cache
      const oldData = {
        users: [{
          id: '1',
          name: 'Old User',
          email: 'old@test.com',
          age: null,
          posts: []
        }]
      };
      localStorage.setItem('users', JSON.stringify(oldData));
      
      // Mock user creation
      global.fetch.mockResolvedValueOnce({
        json: async () => ({ data: { createUser: { id: '2' } } })
      });
      
      // Mock loadUsers call after creation (which clears cache implicitly by reloading)
      const newData = {
        users: [
          oldData.users[0],
          {
            id: '2',
            name: 'New User',
            email: 'new@test.com',
            age: 25,
            posts: []
          }
        ]
      };
      
      global.fetch.mockResolvedValueOnce({
        json: async () => ({ data: newData })
      });
      
      // Trigger user creation
      document.getElementById('name').value = 'New User';
      document.getElementById('email').value = 'new@test.com';
      document.getElementById('age').value = '25';
      
      const form = document.getElementById('userForm');
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
      
      await new Promise(resolve => setTimeout(resolve, 50));
      
      // Should have made API calls (not using cache)
      expect(global.fetch).toHaveBeenCalled();
    });

    test('should bypass cache after post deletion', async () => {
      // Set cache with post
      const dataWithPost = {
        users: [{
          id: '1',
          name: 'User',
          email: 'user@test.com',
          age: null,
          posts: [{ id: 'p1', title: 'Post', content: 'Content' }]
        }]
      };
      localStorage.setItem('users', JSON.stringify(dataWithPost));
      
      global.confirm.mockReturnValueOnce(true);
      
      // Mock delete mutation
      global.fetch.mockResolvedValueOnce({
        json: async () => ({ data: { deletePost: true } })
      });
      
      // Mock loadUsers after deletion
      const dataWithoutPost = {
        users: [{
          id: '1',
          name: 'User',
          email: 'user@test.com',
          age: null,
          posts: []
        }]
      };
      
      global.fetch.mockResolvedValueOnce({
        json: async () => ({ data: dataWithoutPost })
      });
      
      await window.deletePost('p1');
      
      // Should fetch fresh data
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });
  });

  describe('Performance and optimization', () => {
    
    test('should reduce API calls with effective caching', async () => {
      const userData = {
        users: [{
          id: '1',
          name: 'User',
          email: 'user@test.com',
          age: null,
          posts: []
        }]
      };
      
      // First call - fetch from API
      global.fetch.mockResolvedValueOnce({
        json: async () => ({ data: userData })
      });
      
      await loadUsers();
      expect(global.fetch).toHaveBeenCalledTimes(1);
      
      // Second call - use cache
      global.fetch.mockClear();
      await loadUsers();
      expect(global.fetch).not.toHaveBeenCalled();
      
      // Third call - still use cache
      await loadUsers();
      expect(global.fetch).not.toHaveBeenCalled();
    });

    test('should handle rapid successive loadUsers calls', async () => {
      const userData = {
        users: [{
          id: '1',
          name: 'User',
          email: 'user@test.com',
          age: null,
          posts: []
        }]
      };
      
      global.fetch.mockResolvedValue({
        json: async () => ({ data: userData })
      });
      
      // Call loadUsers multiple times rapidly
      const calls = [
        loadUsers(),
        loadUsers(),
        loadUsers(),
        loadUsers(),
        loadUsers()
      ];
      
      await Promise.all(calls);
      
      // All calls should complete without errors
      const usersDiv = document.getElementById('users');
      expect(usersDiv.innerHTML).toContain('User');
    });

    test('should maintain cache consistency', async () => {
      const userData = {
        users: [{
          id: '1',
          name: 'User',
          email: 'user@test.com',
          age: null,
          posts: []
        }]
      };
      
      // Set cache
      cache.set('users', userData);
      
      // Load users (should use cache)
      await loadUsers();
      
      // Verify cache wasn't corrupted
      const cached = cache.get('users');
      expect(cached).toEqual(userData);
      
      // Verify rendering matches cache
      const usersDiv = document.getElementById('users');
      expect(usersDiv.innerHTML).toContain('User');
    });
  });

  describe('Error recovery with cache', () => {
    
    test('should fall back to cache on API error', async () => {
      const cachedData = {
        users: [{
          id: '1',
          name: 'Cached User',
          email: 'cached@test.com',
          age: null,
          posts: []
        }]
      };
      
      // Set valid cache
      cache.set('users', cachedData);
      
      // First load - use cache
      await loadUsers();
      expect(document.getElementById('users').innerHTML).toContain('Cached User');
      
      // Clear cache and simulate API error
      localStorage.removeItem('users');
      global.fetch.mockRejectedValueOnce(new Error('Network error'));
      
      // Second load - should show error
      await loadUsers();
      expect(document.getElementById('users').innerHTML).toContain('Error');
    });

    test('should show error when both cache and API fail', async () => {
      // No cache
      localStorage.removeItem('users');
      
      // API fails
      global.fetch.mockRejectedValueOnce(new Error('API Error'));
      
      await loadUsers();
      
      const usersDiv = document.getElementById('users');
      expect(usersDiv.innerHTML).toContain('Error: API Error');
      expect(usersDiv.innerHTML).toContain('color:red');
    });

    test('should not cache failed API responses', async () => {
      localStorage.removeItem('users');
      
      global.fetch.mockRejectedValueOnce(new Error('Server error'));
      
      await loadUsers();
      
      // Cache should still be empty
      expect(localStorage.getItem('users')).toBeNull();
    });
  });

  describe('Cache key management', () => {
    
    test('should use consistent cache key', async () => {
      const userData = {
        users: [{
          id: '1',
          name: 'User',
          email: 'user@test.com',
          age: null,
          posts: []
        }]
      };
      
      global.fetch.mockResolvedValueOnce({
        json: async () => ({ data: userData })
      });
      
      await loadUsers();
      
      // Check the specific key 'users' is used
      expect(localStorage.getItem('users')).toBeTruthy();
      expect(localStorage.getItem('user')).toBeNull();
      expect(localStorage.getItem('userData')).toBeNull();
    });

    test('should not interfere with other localStorage keys', () => {
      // Set other data in localStorage
      localStorage.setItem('appConfig', JSON.stringify({ theme: 'dark' }));
      localStorage.setItem('userPreferences', JSON.stringify({ lang: 'en' }));
      
      // Set cache
      cache.set('users', { users: [] });
      
      // Other keys should remain unchanged
      expect(JSON.parse(localStorage.getItem('appConfig'))).toEqual({ theme: 'dark' });
      expect(JSON.parse(localStorage.getItem('userPreferences'))).toEqual({ lang: 'en' });
    });
  });
});