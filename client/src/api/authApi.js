import api from './axios';

export const authApi = {
  register: async (payload) => {
    const res = await api.post('/auth/register', payload);
    return res.data;
  },
  login: async (payload) => {
    const res = await api.post('/auth/login', payload);
    return res.data;
  },
  getMe: async () => {
    const res = await api.get('/auth/me');
    return res.data;
  },
};

export default authApi;
