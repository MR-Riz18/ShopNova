import { useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import orderApi from '../api/orderApi';
import Loader from '../components/Loader';
import ErrorState from '../components/ErrorState';
import { STATUS_STYLES } from '../utils/constants';
import { formatPrice, formatDate, imgUrl, cx } from '../utils/format';

const getBody = (res) => res?.data?.data ?? res?.data ?? {};
const errMsg = (e, fb = 'Could not load this order.') =>
  e?.response?.data?.message || e?.message || fb;

const DEFAULT_STATUS_STYLES = {
  pending: 'bg-amber-100 text-amber-800',
  confirmed: 'bg-blue-100 text-blue-800',
  processing: 'bg-indigo-100 text-indigo-800',
  shipped: 'bg-purple-100 text-purple-800',
  out_for_delivery: 'bg-cyan-100 text-cyan-800',
  delivered: 'bg-emerald-100 text-emerald-800',
  cancelled: 'bg-rose-100 text-rose-800',
};

const prettyStatus = (s) =>
  String(s || 'pending')
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');

export default function OrderConfirmation() {
  const { id } = useParams();
  const { state } = useLocation();
  const [order, setOrder] = useState(state?.order || null);
  const [loading, setLoading] = useState(!state?.order);
  const [error, setError] = useState('');

  useEffect(() => {
    if (order) return;
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await orderApi.getById(id);
        const body = getBody(res);
        if (!cancelled) setOrder(body.order ?? body);
      } catch (e) {
        if (!cancelled) setError(errMsg(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) {
    return (
      <div className="container-x flex min-h-[50vh] items-center justify-center py-16">
        <Loader />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="container-x py-16">
        <ErrorState
          title="Order not found"
          message={error || 'We could not find this order.'}
          onRetry={() => window.location.reload()}
        />
        <div className="mt-6 text-center">
          <Link to="/orders" className="btn-outline">
            View my orders
          </Link>
        </div>
      </div>
    );
  }

  const orderNumber = order.orderNumber || order.orderId || order._id;
  const status = order.status || order.orderStatus || 'pending';
  const statusStyle =
    (STATUS_STYLES && STATUS_STYLES[status]) || DEFAULT_STATUS_STYLES[status] || DEFAULT_STATUS_STYLES.pending;
  const addr = order.shippingAddress || {};
  const paymentLabel =
    order.paymentMethod === 'cod'
      ? 'Cash on Delivery'
      : order.paymentMethod === 'card'
        ? 'Credit / Debit Card'
        : order.paymentMethod === 'bank_transfer'
          ? 'Bank Transfer'
          : prettyStatus(order.paymentMethod);

  return (
    <div className="container-x max-w-4xl py-12">
      {/* Success header */}
      <div className="text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
          <svg className="h-9 w-9 text-emerald-600" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-900">
          Order placed successfully!
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Thank you for shopping with ShopNova. A confirmation has been sent to your email.
        </p>
      </div>

      {/* Order meta */}
      <div className="card mt-8 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-wider text-slate-400">Order number</p>
            <p className="mt-0.5 font-mono text-lg font-bold text-slate-900">{orderNumber}</p>
          </div>
          <span className={cx('rounded-full px-3 py-1 text-xs font-bold', statusStyle)}>
            {prettyStatus(status)}
          </span>
        </div>
        <div className="mt-4 grid gap-4 border-t border-slate-100 pt-4 text-sm sm:grid-cols-3">
          <div>
            <p className="text-xs uppercase tracking-wider text-slate-400">Placed on</p>
            <p className="mt-0.5 font-medium text-slate-800">
              {order.createdAt ? formatDate(order.createdAt) : '—'}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-slate-400">Payment</p>
            <p className="mt-0.5 font-medium text-slate-800">{paymentLabel}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-slate-400">Delivery</p>
            <p className="mt-0.5 font-medium text-slate-800">
              {prettyStatus(order.deliveryMethod || 'standard')}
            </p>
          </div>
        </div>
      </div>

      {/* Items */}
      <div className="card mt-6 p-6">
        <h2 className="text-lg font-semibold text-slate-900">Items</h2>
        <ul className="mt-4 divide-y divide-slate-100">
          {(order.items || []).map((item, i) => {
            const name = item.product?.name || item.name || 'Product';
            const img = item.image || item.product?.images?.[0];
            return (
              <li key={item._id || i} className="flex items-center gap-4 py-3">
                <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                  {img && (
                    <img src={imgUrl(img)} alt="" className="h-full w-full object-cover" loading="lazy" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-900">{name}</p>
                  <p className="text-xs text-slate-500">
                    Qty {item.quantity}
                    {[item.size, item.color].filter(Boolean).length > 0 &&
                      ` · ${[item.size, item.color].filter(Boolean).join(' · ')}`}
                  </p>
                </div>
                <p className="text-sm font-semibold text-slate-900">
                  {formatPrice(Number(item.price || 0) * Number(item.quantity || 0))}
                </p>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Address + totals */}
      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-slate-900">Shipping address</h2>
          <address className="mt-3 text-sm not-italic leading-relaxed text-slate-600">
            <span className="font-semibold text-slate-900">{addr.fullName}</span>
            <br />
            {addr.address}
            <br />
            {addr.city}, {addr.state} {addr.postalCode}
            <br />
            {addr.country}
            <br />
            <span className="text-slate-500">{addr.phone}</span>
          </address>
        </div>
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-slate-900">Order totals</h2>
          <dl className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-slate-500">Subtotal</dt>
              <dd className="font-medium text-slate-900">{formatPrice(order.subtotal || 0)}</dd>
            </div>
            {Number(order.discount || 0) > 0 && (
              <div className="flex justify-between">
                <dt className="text-slate-500">
                  Discount{order.couponCode || order.coupon?.code ? ` (${order.couponCode || order.coupon.code})` : ''}
                </dt>
                <dd className="font-medium text-emerald-600">−{formatPrice(order.discount)}</dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt className="text-slate-500">Shipping</dt>
              <dd className="font-medium text-slate-900">{formatPrice(order.shipping || 0)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Tax</dt>
              <dd className="font-medium text-slate-900">{formatPrice(order.tax || 0)}</dd>
            </div>
            <div className="flex justify-between border-t border-slate-200 pt-2 text-base">
              <dt className="font-semibold text-slate-900">Total</dt>
              <dd className="font-extrabold text-slate-900">{formatPrice(order.total || 0)}</dd>
            </div>
          </dl>
        </div>
      </div>

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link to="/shop" className="btn-primary">
          Continue Shopping
        </Link>
        <Link to={`/orders/${order._id || id}`} className="btn-outline">
          View Order
        </Link>
      </div>
    </div>
  );
}
