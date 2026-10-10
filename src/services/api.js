import axios from 'axios';

export const TOKEN_KEY = 'pnc_token';
export const USER_KEY = 'pnc_current_user';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api',
  headers: { Accept: 'application/json' }
});

// attach the login token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token && !config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// turn API errors into plain Errors so pages can keep using err.message
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const data = err.response?.data;
    const firstValidationError = data?.errors ? Object.values(data.errors).flat()[0] : null;
    const message =
      firstValidationError ||
      data?.message ||
      (err.request && !err.response ? 'Cannot reach the server. Please try again.' : err.message);

    // expired / invalid token (but not a wrong password on the login form)
    if (err.response?.status === 401 && !err.config?.url?.includes('/login')) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      if (window.location.pathname !== '/login') window.location.href = '/login';
    }
    return Promise.reject(new Error(message));
  }
);

export default api;
