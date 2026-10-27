import api from './axios';

export const productApi = {
  getProducts: async (params) => {
    const res = await api.get('/products', { params });
    return res.data;
  },
  getProduct: async (id) => {
    const res = await api.get(`/products/${id}`);
    return res.data;
  },
  getRelated: async (id) => {
    const res = await api.get(`/products/${id}/related`);
    return res.data;
  },
};

export default productApi;
