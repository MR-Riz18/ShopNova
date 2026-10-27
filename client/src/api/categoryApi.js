import api from './axios';

export const categoryApi = {
  getCategories: async () => {
    const res = await api.get('/categories');
    return res.data;
  },
  getCategory: async (id) => {
    const res = await api.get(`/categories/${id}`);
    return res.data;
  },
};

export default categoryApi;
