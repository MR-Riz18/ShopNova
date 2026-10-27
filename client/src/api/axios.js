import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 15000,
});

// Request interceptor: attach JWT + handle FormData content type
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    if (config.data instanceof FormData) {
      // Let the browser set the multipart boundary
      delete config.headers['Content-Type'];
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: normalize success / error shape
api.interceptors.response.use(
  (response) => response,
  (err) => {
    const message =
      err.response?.data?.message || err.message || 'Something went wrong';
    const e = new Error(message);
    e.status = err.response?.status;
    e.original = err;
    throw e;
  }
);

export default api;
