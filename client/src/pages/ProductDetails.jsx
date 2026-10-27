import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import productApi from '../api/productApi';
import reviewApi from '../api/reviewApi';
import ProductCard from '../components/ProductCard';
import Rating from '../components/Rating';
import Loader from '../components/Loader';
import ErrorState from '../components/ErrorState';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { formatPrice, formatDate, imgUrl, cx, calcDiscountPct } from '../utils/format';

const getBody = (res) => res?.data?.data ?? res?.data ?? {};
const errMsg = (e, fb = 'Something went wrong.') =>
  e?.response?.data?.message || e?.message || fb;

const toProducts = (res) => {
  const body = getBody(res);
  const list = Array.isArray(body) ? body : body.products ?? body.items ?? [];
  return Array.isArray(list) ? list : [];
};

const toReviews = (res) => {
  const body = getBody(res);
  if (Array.isArray(body)) return body;
  const list = body.reviews ?? [];
  return Array.isArray(list) ? list : [];
};

const getId = (p) => p?._id || p?.id;

function QtyStepper({ qty, setQty, max }) {
  return (
    <div className="inline-flex items-center rounded-lg border border-slate-300">
      <button
        type="button"
        className="px-3 py-2 text-slate-600 hover:text-slate-900 disabled:opacity-40"
        onClick={() => setQty((q) => Math.max(1, q - 1))}
        disabled={qty <= 1}
        aria-label="Decrease quantity"
      >
        <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path d="M4 10a.75.75 0 01.75-.75h10.5a.75.75 0 010 1.5H4.75A.75.75 0 014 10z" />
        </svg>
      </button>
      <span className="w-10 text-center text-sm font-semibold" aria-live="polite">
        {qty}
      </span>
      <button
        type="button"
        className="px-3 py-2 text-slate-600 hover:text-slate-900 disabled:opacity-40"
        onClick={() => setQty((q) => Math.min(max || 99, q + 1))}
        disabled={max ? qty >= max : false}
        aria-label="Increase quantity"
      >
        <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
        </svg>
      </button>
    </div>
  );
}

function ImagePlaceholder({ className }) {
  return (
    <div className={cx('flex items-center justify-center bg-slate-100', className)} aria-hidden="true">
      <svg className="h-16 w-16 text-slate-300" viewBox="0 0 24 24" fill="currentColor">
        <path
          fillRule="evenodd"
          d="M1.5 6a2.25 2.25 0 012.25-2.25h16A2.25 2.25 0 0122 6v12a2.25 2.25 0 01-2.25 2.25H3.75A2.25 2.25 0 011.5 18V6zM3 16.06V18c0 .414.336.75.75.75h16.5A.75.75 0 0021 18v-1.94l-5.03-5.03a1.5 1.5 0 00-2.12 0l-5.03 5.03zm9.47-7.31a1.125 1.125 0 11-2.25 0 1.125 1.125 0 012.25 0z"
          clipRule="evenodd"
        />
      </svg>
    </div>
  );
}

export default function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();
  const { addItem } = useCart();
  const { toggleWishlist, isWishlisted } = useWishlist();

  const [product, setProduct] = useState(null);
  const [related, setRelated] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [activeImage, setActiveImage] = useState(0);
  const [size, setSize] = useState('');
  const [color, setColor] = useState('');
  const [qty, setQty] = useState(1);
  const [adding, setAdding] = useState(false);
  const [tab, setTab] = useState('description');

  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError('');
      setActiveImage(0);
      setSize('');
      setColor('');
      setQty(1);
      try {
        const res = await productApi.getProduct(id);
        const body = getBody(res);
        const p = body.product ?? body;
        if (cancelled) return;
        if (!p || (!p._id && !p.id)) throw new Error('Product not found.');
        setProduct(p);
        setSize(p.sizes && p.sizes.length === 1 ? p.sizes[0] : '');
        setColor(p.colors && p.colors.length === 1 ? p.colors[0] : '');

        // Related products
        let rel = [];
        try {
          rel = toProducts(await productApi.getRelated(getId(p)));
        } catch {
          rel = [];
        }
        if (!rel.length) {
          try {
            const cat = p.category;
            const catParam =
              typeof cat === 'object' && cat !== null ? cat.slug || cat._id || cat.name : cat;
            if (catParam) {
              rel = toProducts(await productApi.getProducts({ category: catParam, limit: 6 }));
            }
          } catch {
            rel = [];
          }
        }
        if (!cancelled) {
          setRelated(rel.filter((r) => getId(r) !== getId(p)).slice(0, 4));
        }

        // Reviews
        try {
          const rr = await reviewApi.getByProduct(getId(p));
          if (!cancelled) setReviews(toReviews(rr));
        } catch {
          if (!cancelled) setReviews([]);
        }
      } catch (e) {
        if (!cancelled) setError(errMsg(e, 'Product not found.'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    window.scrollTo({ top: 0 });
    return () => {
      cancelled = true;
    };
  }, [id]);

  const images = useMemo(
    () => (product?.images && product.images.length ? product.images : []),
    [product]
  );
  const inStock = Number(product?.stock ?? 0) > 0;
  const lowStock = inStock && Number(product.stock) <= 5;
  const discountPct =
    product?.originalPrice && product.originalPrice > product.price
      ? calcDiscountPct(product.price, product.originalPrice)
      : 0;
  const wishlisted = product ? isWishlisted(getId(product)) : false;
  const categoryName =
    typeof product?.category === 'object' && product?.category !== null
      ? product.category.name
      : null;

  const specRows = useMemo(() => {
    const specs = product?.specifications;
    if (!specs) return [];
    if (Array.isArray(specs)) {
      return specs
        .map((s) => ({ key: s.key ?? s.name ?? '', value: s.value ?? '' }))
        .filter((s) => s.key);
    }
    if (typeof specs === 'object') {
      return Object.entries(specs).map(([key, value]) => ({ key, value: String(value ?? '') }));
    }
    return [];
  }, [product]);

  const handleAdd = async (buyNow = false) => {
    if (!product || !inStock) return;
    if (product.sizes?.length && !size) {
      toast.error('Please select a size.');
      return;
    }
    if (product.colors?.length && !color) {
      toast.error('Please select a color.');
      return;
    }
    setAdding(true);
    try {
      await addItem(getId(product), qty, size || undefined, color || undefined);
      if (buyNow) {
        navigate('/checkout');
      } else {
        toast.success('Added to cart.');
      }
    } catch (e) {
      toast.error(errMsg(e, 'Could not add to cart.'));
    } finally {
      setAdding(false);
    }
  };

  const handleWishlist = async () => {
    if (!product) return;
    try {
      await toggleWishlist(getId(product));
      toast.success(wishlisted ? 'Removed from wishlist.' : 'Saved to wishlist.');
    } catch (e) {
      toast.error(errMsg(e, 'Could not update wishlist.'));
    }
  };

  const submitReview = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      toast.error('Please log in to write a review.');
      return;
    }
    if (!reviewComment.trim()) {
      toast.error('Please write a comment.');
      return;
    }
    setSubmittingReview(true);
    try {
      const res = await reviewApi.create(getId(product), {
        rating: reviewRating,
        comment: reviewComment.trim(),
      });
      const body = getBody(res);
      const created = body.review ?? body;
      if (created && (created._id || created.id)) setReviews((prev) => [created, ...prev]);
      setReviewComment('');
      setReviewRating(5);
      toast.success('Review submitted. Thank you!');
    } catch (e) {
      toast.error(errMsg(e, 'Could not submit review.'));
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <div className="container-x flex min-h-[50vh] items-center justify-center py-16">
        <Loader />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="container-x py-16">
        <ErrorState
          title="Product not found"
          message={error || 'This product may have been removed.'}
          onRetry={() => window.location.reload()}
          actionLabel="Reload page"
        />
        <div className="mt-6 text-center">
          <Link to="/shop" className="btn-outline">
            Back to shop
          </Link>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'description', label: 'Description' },
    { id: 'specs', label: `Specifications${specRows.length ? ` (${specRows.length})` : ''}` },
    { id: 'reviews', label: `Reviews (${reviews.length})` },
  ];

  return (
    <div className="container-x py-8">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="mb-6 text-sm text-slate-500">
        <ol className="flex flex-wrap items-center gap-1">
          <li>
            <Link to="/" className="hover:text-indigo-600">
              Home
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li>
            <Link to="/shop" className="hover:text-indigo-600">
              Shop
            </Link>
          </li>
          {categoryName && (
            <>
              <li aria-hidden="true">/</li>
              <li>
                <Link
                  to={`/shop?category=${encodeURIComponent(
                    product.category.slug || product.category.name
                  )}`}
                  className="hover:text-indigo-600"
                >
                  {categoryName}
                </Link>
              </li>
            </>
          )}
          <li aria-hidden="true">/</li>
          <li className="max-w-[40vw] truncate font-medium text-slate-800" aria-current="page">
            {product.name}
          </li>
        </ol>
      </nav>

      <div className="grid gap-10 lg:grid-cols-2">
        {/* Gallery */}
        <div>
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            {images.length ? (
              <img
                src={imgUrl(images[activeImage])}
                alt={product.name}
                className="aspect-square w-full object-cover"
              />
            ) : (
              <ImagePlaceholder className="aspect-square w-full rounded-xl" />
            )}
          </div>
          {images.length > 1 && (
            <div className="mt-3 grid grid-cols-5 gap-3">
              {images.map((src, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setActiveImage(i)}
                  className={cx(
                    'overflow-hidden rounded-lg border-2 bg-white',
                    i === activeImage ? 'border-indigo-600' : 'border-transparent hover:border-slate-300'
                  )}
                  aria-label={`View image ${i + 1}`}
                  aria-pressed={i === activeImage}
                >
                  <img
                    src={imgUrl(src)}
                    alt=""
                    className="aspect-square w-full object-cover"
                    loading="lazy"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div>
          {product.brand && (
            <p className="text-sm font-semibold uppercase tracking-wider text-indigo-600">
              {product.brand}
            </p>
          )}
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">{product.name}</h1>

          <div className="mt-3 flex items-center gap-2">
            <Rating value={product.rating || 0} />
            <span className="text-sm text-slate-500">
              {Number(product.rating || 0).toFixed(1)} · {product.numReviews || reviews.length || 0}{' '}
              reviews
            </span>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <span className="text-3xl font-extrabold text-slate-900">
              {formatPrice(product.price)}
            </span>
            {product.originalPrice && product.originalPrice > product.price && (
              <>
                <span className="text-lg text-slate-400 line-through">
                  {formatPrice(product.originalPrice)}
                </span>
                <span className="rounded-full bg-rose-100 px-2.5 py-1 text-xs font-bold text-rose-700">
                  Save {discountPct}%
                </span>
              </>
            )}
          </div>

          <p className="mt-4 text-sm leading-relaxed text-slate-600">
            {(product.description || '').slice(0, 280)}
            {product.description && product.description.length > 280 ? '…' : ''}
          </p>

          {/* Sizes */}
          {product.sizes?.length > 0 && (
            <div className="mt-6">
              <div className="mb-2 flex items-center justify-between">
                <span className="label mb-0">Size {size ? `— ${size}` : ''}</span>
                {product.sizes.length > 1 && (
                  <span className="text-xs text-slate-400">Select a size</span>
                )}
              </div>
              <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Size">
                {product.sizes.map((s) => (
                  <button
                    key={s}
                    type="button"
                    role="radio"
                    aria-checked={size === s}
                    onClick={() => setSize(s)}
                    className={cx(
                      'min-w-[3rem] rounded-lg border px-3 py-2 text-sm font-medium transition',
                      size === s
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                        : 'border-slate-300 text-slate-700 hover:border-slate-400'
                    )}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Colors */}
          {product.colors?.length > 0 && (
            <div className="mt-5">
              <span className="label">Color {color ? `— ${color}` : ''}</span>
              <div className="mt-2 flex flex-wrap gap-2" role="radiogroup" aria-label="Color">
                {product.colors.map((c) => (
                  <button
                    key={c}
                    type="button"
                    role="radio"
                    aria-checked={color === c}
                    title={c}
                    onClick={() => setColor(c)}
                    className={cx(
                      'flex h-10 min-w-[2.5rem] items-center justify-center rounded-full border-2 px-2 text-[11px] font-semibold transition',
                      color === c
                        ? 'border-indigo-600 ring-2 ring-indigo-200'
                        : 'border-slate-300 hover:border-slate-400'
                    )}
                    style={{ backgroundColor: c }}
                  >
                    <span className="rounded bg-white/80 px-1">{c}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Stock */}
          <div className="mt-6">
            {inStock ? (
              <p className={cx('text-sm font-semibold', lowStock ? 'text-amber-600' : 'text-emerald-600')}>
                {lowStock ? `Only ${product.stock} left in stock — order soon` : 'In stock'}
              </p>
            ) : (
              <p className="text-sm font-semibold text-rose-600">Out of stock</p>
            )}
          </div>

          {/* Actions */}
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <QtyStepper qty={qty} setQty={setQty} max={Number(product.stock) || 99} />
            <button
              type="button"
              className="btn-primary flex-1 sm:flex-none sm:px-8"
              disabled={!inStock || adding}
              onClick={() => handleAdd(false)}
            >
              {adding ? 'Adding…' : 'Add to Cart'}
            </button>
            <button
              type="button"
              className="btn-outline"
              disabled={!inStock || adding}
              onClick={() => handleAdd(true)}
            >
              Buy Now
            </button>
            <button
              type="button"
              onClick={handleWishlist}
              aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
              aria-pressed={wishlisted}
              className={cx(
                'rounded-lg border p-3 transition',
                wishlisted
                  ? 'border-rose-200 bg-rose-50 text-rose-600'
                  : 'border-slate-300 text-slate-500 hover:border-rose-200 hover:text-rose-600'
              )}
            >
              <svg
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill={wishlisted ? 'currentColor' : 'none'}
                stroke="currentColor"
                strokeWidth="1.8"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9.653 16.915l-.005-.003-.019-.01a20.759 20.759 0 01-1.162-.682 22.045 22.045 0 01-2.582-1.9C4.045 12.733 2 10.352 2 7.5a3.5 3.5 0 016.326-2.04 3.5 3.5 0 016.348 2.04c0 2.852-2.044 5.233-3.885 6.82a22.045 22.045 0 01-2.582 1.9 20.759 20.759 0 01-1.162.682l-.019.01-.005.003h-.002a.24.24 0 01-.104.044.24.24 0 01-.104-.044h-.002z"
                />
              </svg>
            </button>
          </div>

          {/* Meta */}
          <dl className="mt-6 space-y-2 border-t border-slate-200 pt-6 text-sm">
            <div className="flex gap-2">
              <dt className="w-24 shrink-0 font-medium text-slate-500">SKU</dt>
              <dd className="text-slate-800">{product.sku || getId(product)?.slice(-8).toUpperCase()}</dd>
            </div>
            {categoryName && (
              <div className="flex gap-2">
                <dt className="w-24 shrink-0 font-medium text-slate-500">Category</dt>
                <dd className="text-slate-800">{categoryName}</dd>
              </div>
            )}
            {product.brand && (
              <div className="flex gap-2">
                <dt className="w-24 shrink-0 font-medium text-slate-500">Brand</dt>
                <dd className="text-slate-800">{product.brand}</dd>
              </div>
            )}
          </dl>
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-12">
        <div className="border-b border-slate-200" role="tablist" aria-label="Product information">
          <div className="flex gap-1 overflow-x-auto">
            {tabs.map((t) => (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={tab === t.id}
                onClick={() => setTab(t.id)}
                className={cx(
                  'whitespace-nowrap border-b-2 px-4 py-3 text-sm font-semibold transition',
                  tab === t.id
                    ? 'border-indigo-600 text-indigo-700'
                    : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-800'
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="py-8" role="tabpanel">
          {tab === 'description' && (
            <div className="prose-sm max-w-3xl whitespace-pre-line text-slate-600">
              {product.description || 'No description available.'}
            </div>
          )}

          {tab === 'specs' &&
            (specRows.length ? (
              <div className="max-w-3xl overflow-hidden rounded-xl border border-slate-200">
                <table className="w-full text-sm">
                  <tbody>
                    {specRows.map((row, i) => (
                      <tr key={i} className={i % 2 ? 'bg-white' : 'bg-slate-50'}>
                        <th
                          scope="row"
                          className="w-1/3 px-4 py-3 text-left font-medium text-slate-500"
                        >
                          {row.key}
                        </th>
                        <td className="px-4 py-3 text-slate-800">{row.value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-slate-500">No specifications provided for this product.</p>
            ))}

          {tab === 'reviews' && (
            <div className="grid gap-10 lg:grid-cols-5">
              <div className="lg:col-span-3">
                <h3 className="text-lg font-semibold text-slate-900">Customer reviews</h3>
                {reviews.length === 0 ? (
                  <p className="mt-3 text-sm text-slate-500">
                    No reviews yet. Be the first to share your experience.
                  </p>
                ) : (
                  <ul className="mt-4 space-y-5">
                    {reviews.map((r) => {
                      const name = r.user?.username || r.name || r.user?.name || 'Customer';
                      return (
                        <li key={r._id || r.id} className="border-b border-slate-100 pb-5">
                          <div className="flex items-center justify-between gap-3">
                            <p className="text-sm font-semibold text-slate-900">{name}</p>
                            <span className="text-xs text-slate-400">
                              {r.createdAt ? formatDate(r.createdAt) : ''}
                            </span>
                          </div>
                          <div className="mt-1">
                            <Rating value={r.rating || 0} />
                          </div>
                          <p className="mt-2 text-sm text-slate-600">{r.comment}</p>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
              <div className="lg:col-span-2">
                <div className="card p-6">
                  <h3 className="text-lg font-semibold text-slate-900">Write a review</h3>
                  {isAuthenticated ? (
                    <form onSubmit={submitReview} className="mt-4 space-y-4">
                      <div>
                        <span className="label">Your rating</span>
                        <div className="mt-1 flex gap-1" role="radiogroup" aria-label="Rating">
                          {[1, 2, 3, 4, 5].map((n) => (
                            <button
                              key={n}
                              type="button"
                              role="radio"
                              aria-checked={reviewRating === n}
                              aria-label={`${n} star${n > 1 ? 's' : ''}`}
                              onClick={() => setReviewRating(n)}
                              className="p-0.5"
                            >
                              <svg
                                className={cx(
                                  'h-7 w-7',
                                  n <= reviewRating ? 'text-amber-400' : 'text-slate-300'
                                )}
                                viewBox="0 0 20 20"
                                fill="currentColor"
                                aria-hidden="true"
                              >
                                <path d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" />
                              </svg>
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label htmlFor="review-comment" className="label">
                          Your review
                        </label>
                        <textarea
                          id="review-comment"
                          className="input"
                          rows={4}
                          value={reviewComment}
                          onChange={(e) => setReviewComment(e.target.value)}
                          placeholder="What did you like or dislike about this product?"
                        />
                      </div>
                      <button
                        type="submit"
                        className="btn-primary w-full"
                        disabled={submittingReview}
                      >
                        {submittingReview ? 'Submitting…' : 'Submit review'}
                      </button>
                    </form>
                  ) : (
                    <div className="mt-4 text-sm text-slate-600">
                      <p>You need to be logged in to write a review.</p>
                      <Link
                        to="/login"
                        state={{ from: `/product/${getId(product)}` }}
                        className="btn-primary mt-3 inline-flex w-full justify-center"
                      >
                        Log in
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Related */}
      {related.length > 0 && (
        <section className="mt-4" aria-labelledby="related-products">
          <h2 id="related-products" className="mb-6 text-2xl font-bold tracking-tight text-slate-900">
            You may also like
          </h2>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
            {related.map((p) => (
              <ProductCard key={getId(p)} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
