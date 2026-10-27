import api from './axios';

export const wishlistApi = {
  getWishlist: async () => {
    const res = await api.get('/wishlist');
    return res.data;
  },
  add: async (productId) => {
    const res = await api.post('/wishlist', { productId });
    return res.data;
  },
  remove: async (productId) => {
    const res = await api.delete(`/wishlist/${productId}`);
    return res.data;
  },
};

export default wishlistApi;
