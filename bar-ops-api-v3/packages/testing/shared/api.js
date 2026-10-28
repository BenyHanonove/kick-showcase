import { config, validateConfig } from './config.js';

let authToken = null;
let userGroups = [];

const api = {
  setAuth(token, groups = []) {
    authToken = token;
    userGroups = groups;
  },

  clearAuth() {
    authToken = null;
    userGroups = [];
  },

  hasAuth() {
    return authToken !== null;
  },

  async request(path, options = {}) {
    validateConfig();
    let url = path;
    const isAbsolute = /^https?:\/\//i.test(path);
    if (!isAbsolute) {
      url = new URL(path, config.aws.url).toString();
    }

    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (authToken && options.auth !== false) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }

    if (userGroups.length > 0 && options.auth !== false) {
      headers['x-user-groups'] = userGroups.join(',');
    }

    let timeoutMs = 10000;
    if (options.timeout !== undefined) {
      timeoutMs = options.timeout;
    }

    const fetchOptions = {
      ...options,
      headers,
      signal: AbortSignal.timeout(timeoutMs),
    };

    if (fetchOptions.body && typeof fetchOptions.body === 'object') {
      fetchOptions.body = JSON.stringify(fetchOptions.body);
    }

    const start = performance.now();
    try {
      const response = await fetch(url, fetchOptions);
      const duration = performance.now() - start;
      
      let method = 'GET';
      if (fetchOptions.method) {
        method = fetchOptions.method;
      }
      console.log(`[API] ${method} ${url} took ${duration.toFixed(0)}ms`);

      let data = await response.text();
      try {
        data = JSON.parse(data);
      } catch (e) {
      }

      if (!response.ok) {
        if (response.status === 401) {
          console.warn('[API] 401 Unauthorized - Cleared auth tokens/state');
          this.clearAuth();
        }
        
        let errorMsg = data;
        if (typeof data === 'object') {
          errorMsg = JSON.stringify(data);
        }
        
        const error = new Error(`HTTP Error ${response.status}: ${errorMsg}`);
        error.status = response.status;
        error.data = data;
        throw error;
      }

      return {
        status: response.status,
        headers: Object.fromEntries(response.headers.entries()),
        data,
      };
    } catch (error) {
      const duration = performance.now() - start;
      let method = 'GET';
      if (fetchOptions.method) {
        method = fetchOptions.method;
      }
      console.error(`[API] ${method} ${url} failed after ${duration.toFixed(0)}ms`);

      if (error.name === 'TimeoutError') {
        console.error(`[API] Timeout Error - Request to ${url} timed out after ${timeoutMs}ms`);
      } else if (error.status === undefined) {
        console.error(`[API] Network Error or no response:`, error.message);
      }
      throw error;
    }
  },

  get(path, options = {}) {
    return this.request(path, { ...options, method: 'GET' });
  },

  post(path, body, options = {}) {
    return this.request(path, { ...options, method: 'POST', body });
  },

  put(path, body, options = {}) {
    return this.request(path, { ...options, method: 'PUT', body });
  },

  delete(path, options = {}) {
    return this.request(path, { ...options, method: 'DELETE' });
  }
};

export default api;
