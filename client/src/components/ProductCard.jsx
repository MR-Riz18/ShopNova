import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { formatPrice, imgUrl, cx, calcDiscountPct } from '../utils/format';
import Rating from './Rating';

export default function ProductCard({ product }) {
  const navigate = useNavigate();
  const { addItem } = useCart();
  const { toggleWishlist, isWishlisted } = useWishlist();
  const [imgErr, setImgErr] = useState(false);

  if (!product) return null;

  const wished = isWishlisted(product._id);
  const out = (product.stock ?? 0) <= 0;
  const low = !out && (product.stock ?? 0) < 10;
  const discountPct = calcDiscountPct(product);

  const handleAdd = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (out) return;
    try {
      await addItem(product._id, 1);
    } catch (err) {
      if (err?.message === 'Login required') navigate('/login');
    }
  };

  const handleWishlist = (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(product._id);
  };

  const categoryName =
    typeof product.category === 'object' && product.category
      ? product.category.name
      : product.category;

  return (
    <article className="card group flex h-full flex-col overflow-hidden transition-shadow hover:shadow-lg">
      <Link
        to={`/product/${product._id}`}
        className="flex flex-1 flex-col"
        aria-label={product.name}
      >
        <div className="relative aspect-square w-full overflow-hidden bg-slate-100">
          {!imgErr ? (
            <img
              src={imgUrl(product.images?.[0])}
              alt={product.name}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              onError={() => setImgErr(true)}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-slate-100">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                className="h-12 w-12 text-slate-300"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
                />
              </svg>
            </div>
          )}

          {discountPct > 0 && (
            <span className="absolute left-3 top-3 rounded-full bg-red-600 px-2.5 py-1 text-xs font-bold text-white">
              -{discountPct}%
            </span>
          )}

          {out && (
            <span className="absolute left-3 top-3 mt-8 rounded-full bg-slate-800 px-2.5 py-1 text-xs font-semibold text-white">
              Out of stock
            </span>
          )}
          {low && (
            <span className="absolute left-3 top-3 mt-8 rounded-full bg-amber-500 px-2.5 py-1 text-xs font-semibold text-white">
              Low stock
            </span>
          )}

          <button
            type="button"
            onClick={handleWishlist}
            aria-label={wished ? 'Remove from wishlist' : 'Add to wishlist'}
            aria-pressed={wished}
            className={cx(
              'absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full shadow-md transition-colors',
              wished
                ? 'bg-red-500 text-white hover:bg-red-600'
                : 'bg-white text-slate-500 hover:text-red-500'
            )}
          >
            <svg
              viewBox="0 0 24 24"
              fill={wished ? 'currentColor' : 'none'}
              stroke="currentColor"
              strokeWidth="1.8"
              className="h-5 w-5"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
              />
            </svg>
          </button>
        </div>

        <div className="flex flex-1 flex-col gap-1.5 p-4">
          {product.brand && (
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
              {product.brand}
            </p>
          )}
          <h3 className="line-clamp-2 text-sm font-semibold text-slate-900 transition-colors group-hover:text-indigo-600">
            {product.name}
          </h3>
          {categoryName && (
            <p className="text-xs text-slate-500">{categoryName}</p>
          )}
          <Rating value={product.rating} count={product.numReviews} />
          <div className="mt-auto flex items-baseline gap-2 pt-2">
            <span className="text-lg font-bold text-slate-900">
              {formatPrice(product.price)}
            </span>
            {product.originalPrice && product.originalPrice > product.price && (
              <span className="text-sm text-slate-400 line-through">
                {formatPrice(product.originalPrice)}
              </span>
            )}
          </div>
        </div>
      </Link>

      <div className="px-4 pb-4">
        <button
          type="button"
          onClick={handleAdd}
          disabled={out}
          className="btn-primary w-full text-sm disabled:cursor-not-allowed disabled:opacity-50"
        >
          {out ? 'Out of Stock' : 'Add to Cart'}
        </button>
      </div>
    </article>
  );
}
