import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import EmptyState from '../components/EmptyState';
import { useWishlist } from '../context/WishlistContext';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';

const errMsg = (e, fb = 'Something went wrong.') =>
  e?.response?.data?.message || e?.message || fb;

export default function Wishlist() {
  const { items, toggleWishlist } = useWishlist();
  const { addItem } = useCart();
  const { toast } = useToast();

  const products = useMemo(
    () => (items || []).map((it) => it.product || it).filter((p) => p && (p._id || p.id)),
    [items]
  );

  const moveToCart = async (p) => {
    const pid = p._id || p.id;
    try {
      await addItem(pid, 1);
      await toggleWishlist(pid);
      toast.success(`"${p.name}" moved to cart.`);
    } catch (e) {
      toast.error(errMsg(e, 'Could not move item to cart.'));
    }
  };

  return (
    <div className="container-x py-8">
      <h1 className="text-3xl font-bold tracking-tight text-slate-900">My Wishlist</h1>
      <p className="mt-1 text-sm text-slate-500">
        {products.length} {products.length === 1 ? 'item' : 'items'} saved for later.
      </p>

      {products.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            title="Your wishlist is empty"
            message="Tap the heart on any product to save it here for later."
            action={
              <Link to="/shop" className="btn-primary">
                Discover products
              </Link>
            }
          />
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-6 xl:grid-cols-4">
          {products.map((p) => (
            <div key={p._id || p.id} className="flex flex-col">
              <ProductCard product={p} />
              <button
                type="button"
                className="btn-outline mt-2 w-full"
                onClick={() => moveToCart(p)}
              >
                Move to cart
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
