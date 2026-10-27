import api from './axios';

export const cartApi = {
  getCart: async () => {
    const res = await api.get('/cart');
    return res.data;
  },
  addItem: async (productId, quantity = 1, size, color) => {
    const res = await api.post('/cart/items', { productId, quantity, size, color });
    return res.data;
  },
  updateItem: async (itemId, quantity) => {
    const res = await api.put(`/cart/items/${itemId}`, { quantity });
    return res.data;
  },
  removeItem: async (itemId) => {
    const res = await api.delete(`/cart/items/${itemId}`);
    return res.data;
  },
  clear: async () => {
    const res = await api.delete('/cart');
    return res.data;
  },
};

export default cartApi;
