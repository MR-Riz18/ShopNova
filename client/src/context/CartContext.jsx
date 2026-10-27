import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import cartApi from '../api/cartApi';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const refreshCart = async () => {
    if (!user) {
      setItems([]);
      return;
    }
    setLoading(true);
    try {
      const body = await cartApi.getCart();
      const list = body.data?.items ?? body.data ?? [];
      setItems(Array.isArray(list) ? list : []);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch whenever the signed-in user changes; clear when logged out.
  useEffect(() => {
    let active = true;
    async function load() {
      if (!user) {
        setItems([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const body = await cartApi.getCart();
        const list = body.data?.items ?? body.data ?? [];
        if (active) setItems(Array.isArray(list) ? list : []);
      } catch (err) {
        if (active) toast.error(err.message);
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?._id]);

  const addItem = async (productId, quantity = 1, size, color) => {
    if (!user) {
      toast.error('Please log in to add items to your cart.');
      throw new Error('Login required');
    }
    try {
      await cartApi.addItem(productId, quantity, size, color);
      await refreshCart();
      toast.success('Added to cart');
    } catch (err) {
      toast.error(err.message);
      throw err;
    }
  };

  const updateQty = async (itemId, quantity) => {
    if (quantity < 1) return removeItem(itemId);
    try {
      await cartApi.updateItem(itemId, quantity);
      await refreshCart();
    } catch (err) {
      toast.error(err.message);
      throw err;
    }
  };

  const removeItem = async (itemId) => {
    try {
      await cartApi.removeItem(itemId);
      await refreshCart();
      toast.success('Removed from cart');
    } catch (err) {
      toast.error(err.message);
      throw err;
    }
  };

  const clearCart = async () => {
    try {
      await cartApi.clear();
      await refreshCart();
    } catch (err) {
      toast.error(err.message);
      throw err;
    }
  };

  const { count, subtotal } = useMemo(() => {
    let count = 0;
    let subtotal = 0;
    for (const item of items) {
      const qty = item.quantity ?? 0;
      const price = item.product?.price ?? item.price ?? 0;
      count += qty;
      subtotal += price * qty;
    }
    return { count, subtotal };
  }, [items]);

  const value = {
    items,
    count,
    subtotal,
    loading,
    addItem,
    updateQty,
    removeItem,
    clearCart,
    refreshCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error('useCart must be used inside a <CartProvider>.');
  }
  return ctx;
}
