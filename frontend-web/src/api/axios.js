import axios from 'axios';

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

const api = axios.create({ baseURL: API_BASE_URL });

api.interceptors.request.use(cfg => {
  const token = localStorage.getItem('access');
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

api.interceptors.response.use(
  r => r,
  async err => {
    const requestUrl = err.config?.url || '';
    const isAuthRequest = requestUrl.includes('/auth/');
    const refresh = localStorage.getItem('refresh');

    if (err.response?.status === 401 && !err.config._retry && !isAuthRequest) {
      if (!refresh) {
        localStorage.clear();
        window.location.href = '/login';
        return Promise.reject(err);
      }

      err.config._retry = true;
      try {
        const { data } = await axios.post(`${API_BASE_URL}/auth/refresh/`, { refresh });
        localStorage.setItem('access', data.access);
        err.config.headers.Authorization = `Bearer ${data.access}`;
        return api(err.config);
      } catch {
        localStorage.clear();
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  }
);

export default api;
