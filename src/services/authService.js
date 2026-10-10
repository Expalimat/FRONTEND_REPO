import api, { TOKEN_KEY, USER_KEY } from './api';

const readUser = () => {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY));
  } catch {
    return null;
  }
};

export const authService = {
  login: async (username, password) => {
    const { data } = await api.post('/login', { username, password });
    localStorage.setItem(TOKEN_KEY, data.token);
    localStorage.setItem(USER_KEY, JSON.stringify(data.user));
    return data.user;
  },

  // re-checks the saved token with the server and refreshes the user
  fetchMe: async () => {
    const { data } = await api.get('/me');
    localStorage.setItem(USER_KEY, JSON.stringify(data));
    return data;
  },

  getCurrentUser: () => (localStorage.getItem(TOKEN_KEY) ? readUser() : null),

  logout: () => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
      api.post('/logout', null, { headers: { Authorization: `Bearer ${token}` } }).catch(() => {});
    }
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },

  isAuthenticated: () => !!localStorage.getItem(TOKEN_KEY)
};
