import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import wishlistApi from '../api/wishlistApi';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';

const WishlistContext = createContext(null);

/** Normalize API entries to { _id, product } shape. */
function normalize(list) {
  return (Array.isArray(list) ? list : []).map((entry) =>
    entry && entry.product ? entry : { _id: entry?._id ?? `w-${entry?.product ?? 'x'}`, product: entry }
  );
}

export function WishlistProvider({ children }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const refreshWishlist = async () => {
    if (!user) {
      setItems([]);
      return;
    }
    setLoading(true);
    try {
      const body = await wishlistApi.getWishlist();
      setItems(normalize(body.data ?? []));
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
        const body = await wishlistApi.getWishlist();
        if (active) setItems(normalize(body.data ?? []));
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

  const ids = useMemo(
    () => items.map((i) => i.product?._id).filter(Boolean),
    [items]
  );

  const isWishlisted = (productId) => ids.includes(productId);

  const toggleWishlist = async (productId) => {
    if (!user) {
      toast.error('Please log in to manage your wishlist.');
      throw new Error('Login required');
    }
    const wasWishlisted = isWishlisted(productId);
    const snapshot = items;

    // Optimistic update.
    setItems((prev) =>
      wasWishlisted
        ? prev.filter((i) => i.product?._id !== productId)
        : [...prev, { _id: `temp-${productId}`, product: { _id: productId } }]
    );

    try {
      if (wasWishlisted) {
        await wishlistApi.remove(productId);
        toast.info('Removed from wishlist');
      } else {
        await wishlistApi.add(productId);
        toast.success('Added to wishlist');
      }
      await refreshWishlist();
    } catch (err) {
      setItems(snapshot); // rollback
      toast.error(err.message);
      throw err;
    }
  };

  const value = {
    items,
    ids,
    loading,
    toggleWishlist,
    isWishlisted,
    refreshWishlist,
  };

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) {
    throw new Error('useWishlist must be used inside a <WishlistProvider>.');
  }
  return ctx;
}
