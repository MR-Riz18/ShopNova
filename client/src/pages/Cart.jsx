import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import couponApi from '../api/couponApi';
import EmptyState from '../components/EmptyState';
import Loader from '../components/Loader';
import ConfirmDialog from '../components/ConfirmDialog';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { formatPrice, imgUrl } from '../utils/format';

const TAX_RATE = 0.08;
const getBody = (res) => res?.data?.data ?? res?.data ?? {};
const errMsg = (e, fb = 'Something went wrong.') =>
  e?.response?.data?.message || e?.message || fb;

function QtyStepper({ qty, onChange, disabled }) {
  return (
    <div className="inline-flex items-center rounded-lg border border-slate-300 bg-white">
      <button
        type="button"
        className="px-2.5 py-1.5 text-slate-600 hover:text-slate-900 disabled:opacity-40"
        onClick={() => onChange(qty - 1)}
        disabled={disabled || qty <= 1}
        aria-label="Decrease quantity"
      >
        <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path d="M4 10a.75.75 0 01.75-.75h10.5a.75.75 0 010 1.5H4.75A.75.75 0 014 10z" />
        </svg>
      </button>
      <span className="w-8 text-center text-sm font-semibold" aria-live="polite">
        {qty}
      </span>
      <button
        type="button"
        className="px-2.5 py-1.5 text-slate-600 hover:text-slate-900 disabled:opacity-40"
        onClick={() => onChange(qty + 1)}
        disabled={disabled}
        aria-label="Increase quantity"
      >
        <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
        </svg>
      </button>
    </div>
  );
}

export default function Cart() {
  const { isAuthenticated } = useAuth();
  const { items, subtotal, loading, updateQty, removeItem, clearCart } = useCart();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [couponCode, setCouponCode] = useState('');
  const [coupon, setCoupon] = useState(null); // { code, discount }
  const [applying, setApplying] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);

  if (!isAuthenticated) {
    return (
      <div className="container-x py-16">
        <div className="card mx-auto max-w-md p-8 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
            <svg className="h-7 w-7" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path d="M1 8.25a.75.75 0 01.75-.75h1.372l.516-1.193a1 1 0 011.414-.414l2.605 1.737a1 1 0 01.414 1.414l-.516 1.193H15.5a.75.75 0 01.75.75v.008c0 .414-.336.75-.75.75H6.617l-.621 1.434a.75.75 0 01-.69.456H4.25a.75.75 0 01-.75-.75v-.008c0-.414.336-.75.75-.75h.617l.621-1.434H1.75A.75.75 0 011 8.25v-.008zM2.5 5.75A.75.75 0 013.25 5h2.44l.72 1.667H1.75a.75.75 0 01-.75-.75v-.167c0-.414.336-.75.75-.75z" />
              <path d="M6 15a2 2 0 104 0 2 2 0 00-4 0zm8 0a2 2 0 104 0 2 2 0 00-4 0z" />
            </svg>
          </div>
          <h1 className="mt-4 text-xl font-bold text-slate-900">Your cart is login-gated</h1>
          <p className="mt-2 text-sm text-slate-500">
            Log in to view your cart, apply coupons, and check out securely.
          </p>
          <Link
            to="/login"
            state={{ from: '/cart' }}
            className="btn-primary mt-6 inline-flex w-full justify-center"
          >
            Log in
          </Link>
          <p className="mt-3 text-sm text-slate-500">
            New here?{' '}
            <Link to="/register" className="font-semibold text-indigo-600 hover:text-indigo-700">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    );
  }

  const discount = coupon?.discount || 0;
  const taxable = Math.max(0, subtotal - discount);
  const tax = taxable * TAX_RATE;
  const total = taxable + tax;

  const applyCoupon = async () => {
    const code = couponCode.trim();
    if (!code) {
      toast.error('Enter a coupon code.');
      return;
    }
    setApplying(true);
    try {
      const res = await couponApi.validate(code, subtotal);
      const body = getBody(res);
      const value = Number(body.discount ?? body.discountAmount ?? 0) || 0;
      const valid = body.valid !== false;
      if (!valid || value <= 0) {
        toast.error('This coupon is not valid for your cart.');
        return;
      }
      setCoupon({ code: body.code || code.toUpperCase(), discount: value });
      setCouponCode('');
      toast.success(`Coupon applied — you saved ${formatPrice(value)}.`);
    } catch (e) {
      toast.error(errMsg(e, 'Invalid or expired coupon.'));
    } finally {
      setApplying(false);
    }
  };

  const handleQtyChange = async (item, nextQty) => {
    try {
      if (nextQty < 1) await removeItem(item._id);
      else await updateQty(item._id, nextQty);
    } catch (e) {
      toast.error(errMsg(e, 'Could not update quantity.'));
    }
  };

  const handleRemove = async (item) => {
    try {
      await removeItem(item._id);
      toast.success('Item removed from cart.');
    } catch (e) {
      toast.error(errMsg(e, 'Could not remove item.'));
    }
  };

  const handleClear = async () => {
    try {
      await clearCart();
      setCoupon(null);
      setConfirmClear(false);
      toast.success('Cart cleared.');
    } catch (e) {
      toast.error(errMsg(e, 'Could not clear cart.'));
    }
  };

  return (
    <div className="container-x py-8">
      <h1 className="text-3xl font-bold tracking-tight text-slate-900">Shopping Cart</h1>

      {loading ? (
        <div className="flex min-h-[40vh] items-center justify-center">
          <Loader />
        </div>
      ) : items.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            title="Your cart is empty"
            message="Looks like you haven't added anything yet. Let's fix that."
            action={
              <Link to="/shop" className="btn-primary">
                Start shopping
              </Link>
            }
          />
        </div>
      ) : (
        <div className="mt-8 grid gap-8 lg:grid-cols-3">
          {/* Items */}
          <div className="lg:col-span-2">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm text-slate-500">
                {items.length} {items.length === 1 ? 'item' : 'items'} in your cart
              </p>
              <button
                type="button"
                className="text-sm font-medium text-rose-600 hover:text-rose-700"
                onClick={() => setConfirmClear(true)}
              >
                Clear cart
              </button>
            </div>

            <ul className="space-y-4">
              {items.map((item) => {
                const p = item.product || {};
                const pid = p._id || p.id;
                const img = p.images?.[0];
                const lineTotal = Number(p.price || 0) * item.quantity;
                return (
                  <li key={item._id} className="card flex gap-4 p-4">
                    <Link
                      to={pid ? `/product/${pid}` : '#'}
                      className="h-24 w-24 shrink-0 overflow-hidden rounded-lg bg-slate-100"
                      aria-label={p.name || 'Product'}
                    >
                      {img ? (
                        <img
                          src={imgUrl(img)}
                          alt={p.name || 'Product image'}
                          className="h-full w-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-slate-300">
                          <svg className="h-8 w-8" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                            <path
                              fillRule="evenodd"
                              d="M1.5 6a2.25 2.25 0 012.25-2.25h16A2.25 2.25 0 0122 6v12a2.25 2.25 0 01-2.25 2.25H3.75A2.25 2.25 0 011.5 18V6zM3 16.06V18c0 .414.336.75.75.75h16.5A.75.75 0 0021 18v-1.94l-5.03-5.03a1.5 1.5 0 00-2.12 0l-5.03 5.03zm9.47-7.31a1.125 1.125 0 11-2.25 0 1.125 1.125 0 012.25 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </div>
                      )}
                    </Link>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <Link
                            to={pid ? `/product/${pid}` : '#'}
                            className="truncate text-sm font-semibold text-slate-900 hover:text-indigo-600"
                          >
                            {p.name || 'Product'}
                          </Link>
                          <div className="mt-1 flex flex-wrap gap-2 text-xs text-slate-500">
                            {item.size && (
                              <span className="rounded bg-slate-100 px-2 py-0.5">Size: {item.size}</span>
                            )}
                            {item.color && (
                              <span className="rounded bg-slate-100 px-2 py-0.5">
                                Color: {item.color}
                              </span>
                            )}
                          </div>
                          <p className="mt-1 text-xs text-slate-500">
                            {formatPrice(p.price || 0)} each
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemove(item)}
                          className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                          aria-label={`Remove ${p.name || 'item'} from cart`}
                        >
                          <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                            <path
                              fillRule="evenodd"
                              d="M8.5 2a.75.75 0 00-.75.75v.5h-2.5a.75.75 0 000 1.5h11a.75.75 0 000-1.5h-2.5v-.5A.75.75 0 0012.5 2h-4zM4 5.75A.75.75 0 014.75 5h10.5a.75.75 0 01.75.75v9.5c0 .966-.784 1.75-1.75 1.75H5.75A1.75 1.75 0 014 15.25v-9.5zm3.5 2.5a.75.75 0 00-1.5 0v5.5a.75.75 0 001.5 0v-5.5zm3.5 0a.75.75 0 00-1.5 0v5.5a.75.75 0 001.5 0v-5.5zm3.5 0a.75.75 0 00-1.5 0v5.5a.75.75 0 001.5 0v-5.5z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </button>
                      </div>
                      <div className="mt-3 flex items-center justify-between">
                        <QtyStepper
                          qty={item.quantity}
                          onChange={(q) => handleQtyChange(item, q)}
                        />
                        <p className="text-sm font-bold text-slate-900">{formatPrice(lineTotal)}</p>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Summary */}
          <div>
            <div className="card sticky top-24 p-6">
              <h2 className="text-lg font-semibold text-slate-900">Order summary</h2>

              {/* Coupon */}
              <div className="mt-4">
                {coupon ? (
                  <div className="flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2.5">
                    <div className="text-sm">
                      <span className="font-bold text-emerald-800">{coupon.code}</span>
                      <span className="ml-2 text-emerald-700">
                        −{formatPrice(coupon.discount)}
                      </span>
                    </div>
                    <button
                      type="button"
                      className="text-xs font-semibold text-emerald-700 underline hover:text-emerald-900"
                      onClick={() => {
                        setCoupon(null);
                        toast.info('Coupon removed.');
                      }}
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <label htmlFor="cart-coupon" className="sr-only">
                      Coupon code
                    </label>
                    <input
                      id="cart-coupon"
                      type="text"
                      className="input uppercase"
                      placeholder="Coupon code"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                    />
                    <button
                      type="button"
                      className="btn-outline shrink-0"
                      onClick={applyCoupon}
                      disabled={applying}
                    >
                      {applying ? 'Applying…' : 'Apply'}
                    </button>
                  </div>
                )}
              </div>

              <dl className="mt-5 space-y-2.5 text-sm">
                <div className="flex justify-between">
                  <dt className="text-slate-500">Subtotal</dt>
                  <dd className="font-medium text-slate-900">{formatPrice(subtotal)}</dd>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between">
                    <dt className="text-slate-500">Discount</dt>
                    <dd className="font-medium text-emerald-600">−{formatPrice(discount)}</dd>
                  </div>
                )}
                <div className="flex justify-between">
                  <dt className="text-slate-500">Shipping</dt>
                  <dd className="font-medium text-slate-900" title="Calculated at checkout">
                    —
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-500">Estimated tax (8%)</dt>
                  <dd className="font-medium text-slate-900">{formatPrice(tax)}</dd>
                </div>
                <div className="flex justify-between border-t border-slate-200 pt-3 text-base">
                  <dt className="font-semibold text-slate-900">Total</dt>
                  <dd className="font-extrabold text-slate-900">{formatPrice(total)}</dd>
                </div>
              </dl>

              <button
                type="button"
                className="btn-primary mt-6 w-full"
                onClick={() => navigate('/checkout')}
              >
                Proceed to Checkout
              </button>
              <Link
                to="/shop"
                className="mt-3 block text-center text-sm font-medium text-indigo-600 hover:text-indigo-700"
              >
                Continue shopping
              </Link>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={confirmClear}
        title="Clear cart?"
        message="This will remove all items from your cart. This action cannot be undone."
        confirmLabel="Clear cart"
        danger
        onConfirm={handleClear}
        onCancel={() => setConfirmClear(false)}
      />
    </div>
  );
}
