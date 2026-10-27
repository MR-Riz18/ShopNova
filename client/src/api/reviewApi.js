import api from './axios';

export const reviewApi = {
  getByProduct: async (productId) => {
    const res = await api.get(`/products/${productId}/reviews`);
    return res.data;
  },
  create: async (productId, payload) => {
    const res = await api.post(`/products/${productId}/reviews`, payload);
    return res.data;
  },
};

export default reviewApi;
