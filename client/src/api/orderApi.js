import api from './axios';

export const orderApi = {
  create: async (payload) => {
    const res = await api.post('/orders', payload);
    return res.data;
  },
  getMyOrders: async (params) => {
    const res = await api.get('/orders', { params });
    return res.data;
  },
  getById: async (id) => {
    const res = await api.get(`/orders/${id}`);
    return res.data;
  },
};

export default orderApi;
