import axios from 'axios';

const API_BASE = 'http://localhost:5000/api';

const client = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

export const setToken = (token) => {
  if (token) {
    client.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    localStorage.setItem('ff_admin_token', token);
  } else {
    delete client.defaults.headers.common['Authorization'];
    localStorage.removeItem('ff_admin_token');
  }
};

// Restore token from localStorage on load
const savedToken = localStorage.getItem('ff_admin_token');
if (savedToken) {
  client.defaults.headers.common['Authorization'] = `Bearer ${savedToken}`;
}

// FIX #12: Intercept 401 responses and redirect to login.
// Previously, expired sessions would silently fail with no feedback.
client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      setToken(null);
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default client;
