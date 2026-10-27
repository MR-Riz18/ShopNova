import api from './axios';

export const couponApi = {
  validate: async (code, subtotal) => {
    const res = await api.post('/coupons/validate', { code, subtotal });
    return res.data;
  },
};

export default couponApi;
