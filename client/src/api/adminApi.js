import api from './axios';

// Accepts FormData (sent as-is) or a plain object (sent as JSON).
const sendAsIs = (data) => data;

export const adminApi = {
  // Dashboard
  getDashboardStats: async () => {
    const res = await api.get('/admin/dashboard');
    return res.data;
  },

  // Products
  getProducts: async (params) => {
    const res = await api.get('/admin/products', { params });
    return res.data;
  },
  createProduct: async (data) => {
    const res = await api.post('/admin/products', sendAsIs(data));
    return res.data;
  },
  updateProduct: async (id, data) => {
    const res = await api.put(`/admin/products/${id}`, sendAsIs(data));
    return res.data;
  },
  deleteProduct: async (id) => {
    const res = await api.delete(`/admin/products/${id}`);
    return res.data;
  },

  // Categories
  getCategories: async () => {
    const res = await api.get('/admin/categories');
    return res.data;
  },
  createCategory: async (data) => {
    const res = await api.post('/admin/categories', sendAsIs(data));
    return res.data;
  },
  updateCategory: async (id, data) => {
    const res = await api.put(`/admin/categories/${id}`, sendAsIs(data));
    return res.data;
  },
  deleteCategory: async (id) => {
    const res = await api.delete(`/admin/categories/${id}`);
    return res.data;
  },

  // Orders
  getOrders: async (params) => {
    const res = await api.get('/admin/orders', { params });
    return res.data;
  },
  getOrderById: async (id) => {
    const res = await api.get(`/admin/orders/${id}`);
    return res.data;
  },
  updateOrderStatus: async (id, status) => {
    const res = await api.patch(`/admin/orders/${id}/status`, { status });
    return res.data;
  },

  // Customers
  getCustomers: async (params) => {
    const res = await api.get('/admin/customers', { params });
    return res.data;
  },
  getCustomer: async (id) => {
    const res = await api.get(`/admin/customers/${id}`);
    return res.data;
  },
  toggleCustomerStatus: async (id) => {
    const res = await api.patch(`/admin/customers/${id}/toggle-status`);
    return res.data;
  },

  // Coupons
  getCoupons: async () => {
    const res = await api.get('/admin/coupons');
    return res.data;
  },
  createCoupon: async (payload) => {
    const res = await api.post('/admin/coupons', payload);
    return res.data;
  },
  updateCoupon: async (id, payload) => {
    const res = await api.put(`/admin/coupons/${id}`, payload);
    return res.data;
  },
  deleteCoupon: async (id) => {
    const res = await api.delete(`/admin/coupons/${id}`);
    return res.data;
  },

  // Inventory
  getInventory: async (params) => {
    const res = await api.get('/admin/inventory', { params });
    return res.data;
  },
};

export default adminApi;
