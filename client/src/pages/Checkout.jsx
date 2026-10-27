import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import userApi from '../api/userApi';
import orderApi from '../api/orderApi';
import couponApi from '../api/couponApi';
import EmptyState from '../components/EmptyState';
import Loader from '../components/Loader';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { DELIVERY_METHODS, PAYMENT_METHODS } from '../utils/constants';
import { formatPrice, imgUrl, cx } from '../utils/format';

const TAX_RATE = 0.08;
const getBody = (res) => res?.data?.data ?? res?.data ?? {};
const errMsg = (e, fb = 'Something went wrong.') =>
  e?.response?.data?.message || e?.message || fb;

const FALLBACK_DELIVERY = [
  { value: 'standard', label: 'Standard Delivery', description: '3–5 business days', price: 4.99 },
  { value: 'express', label: 'Express Delivery', description: '1–2 business days', price: 14.99 },
];
const FALLBACK_PAYMENT = [
  { value: 'cod', label: 'Cash on Delivery', description: 'Pay when your order arrives.' },
  { value: 'card', label: 'Credit / Debit Card', description: 'Pay securely online.' },
  { value: 'bank_transfer', label: 'Bank Transfer', description: 'Transfer after placing your order.' },
];

const toOptions = (src, fallback) => {
  const list = src ?? fallback;
  if (Array.isArray(list)) {
    return list.map((o) =>
      typeof o === 'string'
        ? { value: o, label: o }
        : {
            value: o.value ?? o.id,
            label: o.label ?? o.name ?? o.value,
            description: o.description ?? o.desc ?? '',
            price: o.price ?? o.cost ?? o.fee,
          }
    );
  }
  if (list && typeof list === 'object') {
    return Object.entries(list).map(([value, label]) => ({
      value,
      label: String(label?.label ?? label),
      description: label?.description ?? '',
      price: label?.price,
    }));
  }
  return [];
};

const shippingFor = (method) => {
  if (method?.price !== undefined && method?.price !== null) return Number(method.price) || 0;
  const fb = FALLBACK_DELIVERY.find((m) => m.value === method?.value);
  return fb ? fb.price : 0;
};

const EMPTY_ADDRESS = {
  fullName: '',
  phone: '',
  address: '',
  city: '',
  state: '',
  postalCode: '',
  country: '',
};
const ADDRESS_FIELDS = [
  { key: 'fullName', label: 'Full name', span: true },
  { key: 'phone', label: 'Phone', type: 'tel' },
  { key: 'address', label: 'Street address', span: true },
  { key: 'city', label: 'City' },
  { key: 'state', label: 'State / Province' },
  { key: 'postalCode', label: 'Postal code' },
  { key: 'country', label: 'Country' },
];

const validateAddress = (form) => {
  const errs = {};
  ADDRESS_FIELDS.forEach(({ key, label }) => {
    if (!String(form[key] || '').trim()) errs[key] = `${label} is required.`;
  });
  return errs;
};

export default function Checkout() {
  const { isAuthenticated } = useAuth();
  const { items, subtotal, loading: cartLoading, clearCart } = useCart();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [addresses, setAddresses] = useState([]);
  const [addrLoading, setAddrLoading] = useState(true);
  const [selectedId, setSelectedId] = useState('');
  const [useNew, setUseNew] = useState(false);
  const [form, setForm] = useState(EMPTY_ADDRESS);
  const [formErrors, setFormErrors] = useState({});

  const deliveryOptions = useMemo(() => toOptions(DELIVERY_METHODS, FALLBACK_DELIVERY), []);
  const paymentOptions = useMemo(() => toOptions(PAYMENT_METHODS, FALLBACK_PAYMENT), []);
  const [delivery, setDelivery] = useState(deliveryOptions[0]?.value || 'standard');
  const [payment, setPayment] = useState(paymentOptions[0]?.value || 'cod');

  const [couponCode, setCouponCode] = useState('');
  const [coupon, setCoupon] = useState(null);
  const [applying, setApplying] = useState(false);
  const [placing, setPlacing] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setAddrLoading(true);
      try {
        const res = await userApi.getAddresses();
        const body = getBody(res);
        const list = Array.isArray(body) ? body : body.addresses ?? [];
        if (cancelled) return;
        const arr = Array.isArray(list) ? list : [];
        setAddresses(arr);
        const def = arr.find((a) => a.isDefault) || arr[0];
        if (def) setSelectedId(String(def._id || def.id));
        if (!arr.length) setUseNew(true);
      } catch {
        if (!cancelled) {
          setAddresses([]);
          setUseNew(true);
        }
      } finally {
        if (!cancelled) setAddrLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: '/checkout' }} />;
  }

  const discount = coupon?.discount || 0;
  const shipping = shippingFor(deliveryOptions.find((m) => m.value === delivery));
  const taxable = Math.max(0, subtotal - discount);
  const tax = taxable * TAX_RATE;
  const total = taxable + shipping + tax;
  const isCard = payment === 'card';

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
      if (body.valid === false || value <= 0) {
        toast.error('This coupon is not valid for your order.');
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

  const buildShippingAddress = () => {
    if (useNew || addresses.length === 0) {
      const errs = validateAddress(form);
      setFormErrors(errs);
      if (Object.keys(errs).length) {
        toast.error('Please complete the shipping address.');
        return null;
      }
      return { ...form };
    }
    const sel = addresses.find((a) => String(a._id || a.id) === String(selectedId)) || addresses[0];
    if (!sel) {
      toast.error('Please select a shipping address.');
      return null;
    }
    return {
      fullName: sel.fullName,
      phone: sel.phone,
      address: sel.address,
      city: sel.city,
      state: sel.state,
      postalCode: sel.postalCode,
      country: sel.country,
    };
  };

  const placeOrder = async () => {
    if (!items.length || placing) return;
    const shippingAddress = buildShippingAddress();
    if (!shippingAddress) return;
    setPlacing(true);
    try {
      const payload = {
        shippingAddress,
        deliveryMethod: delivery,
        paymentMethod: payment,
        ...(coupon ? { couponCode: coupon.code } : {}),
      };
      const res = await orderApi.create(payload);
      const body = getBody(res);
      const order = body.order ?? body;
      try {
        await clearCart();
      } catch {
        /* backend clears the cart too */
      }
      toast.success('Order placed successfully!');
      navigate(`/order-confirmation/${order._id || order.orderNumber}`, { state: { order } });
    } catch (e) {
      toast.error(errMsg(e, 'Could not place your order.'));
      setPlacing(false);
    }
  };

  if (cartLoading) {
    return (
      <div className="container-x flex min-h-[50vh] items-center justify-center py-16">
        <Loader />
      </div>
    );
  }

  if (!items.length) {
    return (
      <div className="container-x py-16">
        <EmptyState
          title="Your cart is empty"
          message="Add some products before checking out."
          action={
            <Link to="/shop" className="btn-primary">
              Browse products
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="container-x py-8">
      <h1 className="text-3xl font-bold tracking-tight text-slate-900">Checkout</h1>

      <div className="mt-8 grid gap-8 lg:grid-cols-3">
        {/* Left column */}
        <div className="space-y-8 lg:col-span-2">
          {/* Shipping address */}
          <section className="card p-6" aria-labelledby="checkout-address">
            <h2 id="checkout-address" className="text-lg font-semibold text-slate-900">
              Shipping address
            </h2>
            {addrLoading ? (
              <div className="mt-4 flex items-center gap-2 text-sm text-slate-500">
                <Loader /> Loading saved addresses…
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                {addresses.map((a) => {
                  const aid = String(a._id || a.id);
                  const checked = !useNew && String(selectedId) === aid;
                  return (
                    <label
                      key={aid}
                      className={cx(
                        'flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition',
                        checked ? 'border-indigo-600 bg-indigo-50/50' : 'border-slate-200 hover:border-slate-300'
                      )}
                    >
                      <input
                        type="radio"
                        name="shipping-address"
                        className="mt-1 h-4 w-4 accent-indigo-600"
                        checked={checked}
                        onChange={() => {
                          setUseNew(false);
                          setSelectedId(aid);
                        }}
                      />
                      <span className="text-sm">
                        <span className="flex items-center gap-2 font-semibold text-slate-900">
                          {a.fullName}
                          {a.isDefault && (
                            <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[11px] font-bold text-indigo-700">
                              Default
                            </span>
                          )}
                        </span>
                        <span className="mt-0.5 block text-slate-600">
                          {a.address}, {a.city}, {a.state} {a.postalCode}, {a.country}
                        </span>
                        <span className="block text-slate-500">{a.phone}</span>
                      </span>
                    </label>
                  );
                })}

                <label
                  className={cx(
                    'flex cursor-pointer items-center gap-3 rounded-lg border p-4 transition',
                    useNew ? 'border-indigo-600 bg-indigo-50/50' : 'border-slate-200 hover:border-slate-300'
                  )}
                >
                  <input
                    type="radio"
                    name="shipping-address"
                    className="h-4 w-4 accent-indigo-600"
                    checked={useNew}
                    onChange={() => setUseNew(true)}
                  />
                  <span className="text-sm font-semibold text-slate-900">Use a new address</span>
                </label>

                {useNew && (
                  <div className="grid gap-4 rounded-lg border border-slate-200 bg-slate-50 p-4 sm:grid-cols-2">
                    {ADDRESS_FIELDS.map(({ key, label, type, span }) => (
                      <div key={key} className={span ? 'sm:col-span-2' : ''}>
                        <label htmlFor={`checkout-${key}`} className="label">
                          {label}
                        </label>
                        <input
                          id={`checkout-${key}`}
                          type={type || 'text'}
                          className={cx('input bg-white', formErrors[key] && 'border-rose-400')}
                          value={form[key]}
                          onChange={(e) => {
                            setForm((f) => ({ ...f, [key]: e.target.value }));
                            setFormErrors((prev) => ({ ...prev, [key]: undefined }));
                          }}
                          aria-invalid={!!formErrors[key]}
                        />
                        {formErrors[key] && (
                          <p className="mt-1 text-xs text-rose-600">{formErrors[key]}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </section>

          {/* Delivery method */}
          <section className="card p-6" aria-labelledby="checkout-delivery">
            <h2 id="checkout-delivery" className="text-lg font-semibold text-slate-900">
              Delivery method
            </h2>
            <div className="mt-4 space-y-3" role="radiogroup" aria-label="Delivery method">
              {deliveryOptions.map((m) => {
                const checked = delivery === m.value;
                return (
                  <label
                    key={m.value}
                    className={cx(
                      'flex cursor-pointer items-center justify-between gap-3 rounded-lg border p-4 transition',
                      checked ? 'border-indigo-600 bg-indigo-50/50' : 'border-slate-200 hover:border-slate-300'
                    )}
                  >
                    <span className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="delivery-method"
                        className="h-4 w-4 accent-indigo-600"
                        checked={checked}
                        onChange={() => setDelivery(m.value)}
                      />
                      <span>
                        <span className="block text-sm font-semibold text-slate-900">{m.label}</span>
                        {m.description && (
                          <span className="block text-xs text-slate-500">{m.description}</span>
                        )}
                      </span>
                    </span>
                    <span className="text-sm font-bold text-slate-900">
                      {formatPrice(shippingFor(m))}
                    </span>
                  </label>
                );
              })}
            </div>
          </section>

          {/* Payment method */}
          <section className="card p-6" aria-labelledby="checkout-payment">
            <h2 id="checkout-payment" className="text-lg font-semibold text-slate-900">
              Payment method
            </h2>
            <div className="mt-4 space-y-3" role="radiogroup" aria-label="Payment method">
              {paymentOptions.map((m) => {
                const checked = payment === m.value;
                return (
                  <label
                    key={m.value}
                    className={cx(
                      'flex cursor-pointer items-center gap-3 rounded-lg border p-4 transition',
                      checked ? 'border-indigo-600 bg-indigo-50/50' : 'border-slate-200 hover:border-slate-300'
                    )}
                  >
                    <input
                      type="radio"
                      name="payment-method"
                      className="h-4 w-4 accent-indigo-600"
                      checked={checked}
                      onChange={() => setPayment(m.value)}
                    />
                    <span>
                      <span className="block text-sm font-semibold text-slate-900">{m.label}</span>
                      {m.description && (
                        <span className="block text-xs text-slate-500">{m.description}</span>
                      )}
                    </span>
                  </label>
                );
              })}
            </div>

            {isCard && (
              <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm text-slate-600">
                  Card payments are processed securely via our payment gateway. We never store
                  card details.
                </p>
                <div className="mt-3 grid gap-3 sm:grid-cols-2" aria-hidden="true">
                  <input className="input bg-white" placeholder="Card number" disabled />
                  <input className="input bg-white" placeholder="Name on card" disabled />
                  <input className="input bg-white" placeholder="MM / YY" disabled />
                  <input className="input bg-white" placeholder="CVC" disabled />
                </div>
                <p className="mt-2 text-xs text-slate-400">
                  You&apos;ll enter your card details on the secure payment page after placing the
                  order.
                </p>
              </div>
            )}
          </section>
        </div>

        {/* Order summary */}
        <div>
          <div className="card sticky top-24 p-6">
            <h2 className="text-lg font-semibold text-slate-900">Order summary</h2>
            <ul className="mt-4 max-h-64 space-y-3 overflow-y-auto">
              {items.map((item) => {
                const p = item.product || {};
                const img = p.images?.[0];
                return (
                  <li key={item._id} className="flex items-center gap-3">
                    <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                      {img && (
                        <img
                          src={imgUrl(img)}
                          alt=""
                          className="h-full w-full object-cover"
                          loading="lazy"
                        />
                      )}
                      <span className="absolute -right-0 -top-0 rounded-bl-lg bg-slate-900/70 px-1.5 text-[11px] font-bold text-white">
                        ×{item.quantity}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-slate-900">{p.name}</p>
                      {(item.size || item.color) && (
                        <p className="text-xs text-slate-500">
                          {[item.size, item.color].filter(Boolean).join(' · ')}
                        </p>
                      )}
                    </div>
                    <p className="text-sm font-semibold text-slate-900">
                      {formatPrice(Number(p.price || 0) * item.quantity)}
                    </p>
                  </li>
                );
              })}
            </ul>

            <div className="mt-4 border-t border-slate-200 pt-4">
              {coupon ? (
                <div className="flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2.5">
                  <div className="text-sm">
                    <span className="font-bold text-emerald-800">{coupon.code}</span>
                    <span className="ml-2 text-emerald-700">−{formatPrice(coupon.discount)}</span>
                  </div>
                  <button
                    type="button"
                    className="text-xs font-semibold text-emerald-700 underline hover:text-emerald-900"
                    onClick={() => setCoupon(null)}
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <label htmlFor="checkout-coupon" className="sr-only">
                    Coupon code
                  </label>
                  <input
                    id="checkout-coupon"
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

            <dl className="mt-4 space-y-2.5 text-sm">
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
                <dd className="font-medium text-slate-900">{formatPrice(shipping)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Tax (8%)</dt>
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
              onClick={placeOrder}
              disabled={placing}
            >
              {placing ? (
                <span className="inline-flex items-center gap-2">
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                  </svg>
                  Placing order…
                </span>
              ) : (
                `Place Order · ${formatPrice(total)}`
              )}
            </button>
            <p className="mt-3 text-center text-xs text-slate-400">
              By placing this order you agree to our terms of service.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
