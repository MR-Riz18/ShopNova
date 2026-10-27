import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import orderApi from '../api/orderApi';
import Loader from '../components/Loader';
import ErrorState from '../components/ErrorState';
import { ORDER_STATUSES, STATUS_STYLES } from '../utils/constants';
import { formatPrice, formatDate, imgUrl, cx } from '../utils/format';

const getBody = (res) => res?.data?.data ?? res?.data ?? {};
const errMsg = (e, fb = 'Could not load this order.') =>
  e?.response?.data?.message || e?.message || fb;

const FALLBACK_FLOW = [
  { value: 'pending', label: 'Order Placed' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'processing', label: 'Processing' },
  { value: 'shipped', label: 'Shipped' },
  { value: 'out_for_delivery', label: 'Out for Delivery' },
  { value: 'delivered', label: 'Delivered' },
];

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

const normalizeStatuses = (src) => {
  if (Array.isArray(src) && src.length) {
    return src.map((s) =>
      typeof s === 'string' ? { value: s, label: prettyStatus(s) } : { value: s.value, label: s.label || prettyStatus(s.value) }
    );
  }
  if (src && typeof src === 'object') {
    return Object.entries(src).map(([value, label]) => ({
      value,
      label: String(label?.label ?? label),
    }));
  }
  return FALLBACK_FLOW;
};

export default function OrderDetails() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
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
  }, [id]);

  const steps = useMemo(
    () => normalizeStatuses(ORDER_STATUSES).filter((s) => s.value !== 'cancelled'),
    []
  );

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
            Back to orders
          </Link>
        </div>
      </div>
    );
  }

  const orderNumber = order.orderNumber || order.orderId || order._id;
  const status = order.status || order.orderStatus || 'pending';
  const isCancelled = status === 'cancelled';
  const currentIdx = Math.max(
    0,
    steps.findIndex((s) => s.value === status)
  );
  const statusStyle =
    (STATUS_STYLES && STATUS_STYLES[status]) ||
    DEFAULT_STATUS_STYLES[status] ||
    DEFAULT_STATUS_STYLES.pending;
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
    <div className="container-x max-w-4xl py-8">
      <Link
        to="/orders"
        className="inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-indigo-600"
      >
        <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path
            fillRule="evenodd"
            d="M12.79 5.23a.75.75 0 01-.02 1.06L8.83 10l3.94 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z"
            clipRule="evenodd"
          />
        </svg>
        Back to orders
      </Link>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-mono text-xl font-bold text-slate-900 md:text-2xl">{orderNumber}</h1>
          <p className="mt-1 text-sm text-slate-500">
            Placed {order.createdAt ? formatDate(order.createdAt) : '—'}
          </p>
        </div>
        <span className={cx('rounded-full px-3 py-1 text-xs font-bold', statusStyle)}>
          {prettyStatus(status)}
        </span>
      </div>

      {isCancelled ? (
        <div className="mt-6 rounded-xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-800">
          <p className="font-bold">This order was cancelled.</p>
          <p className="mt-1">
            If you were charged, a refund will be issued to your original payment method.
          </p>
        </div>
      ) : (
        <div className="card mt-6 p-6">
          <h2 className="sr-only">Order tracking</h2>
          <ol className="flex flex-col gap-0 sm:flex-row sm:items-start" aria-label="Order progress">
            {steps.map((step, i) => {
              const done = i < currentIdx;
              const current = i === currentIdx;
              return (
                <li key={step.value} className="relative flex flex-1 gap-3 pb-6 sm:flex-col sm:gap-0 sm:pb-0 last:pb-0">
                  {/* connector */}
                  {i > 0 && (
                    <span
                      aria-hidden="true"
                      className={cx(
                        'absolute left-[13px] top-0 h-full w-0.5 -translate-y-0 sm:left-0 sm:top-[13px] sm:h-0.5 sm:w-full',
                        i <= currentIdx ? 'bg-emerald-500' : 'bg-slate-200'
                      )}
                      style={{ height: undefined }}
                    />
                  )}
                  <span className="relative z-10 flex sm:mb-2">
                    <span
                      className={cx(
                        'flex h-7 w-7 items-center justify-center rounded-full border-2',
                        done && 'border-emerald-500 bg-emerald-500 text-white',
                        current && 'border-indigo-600 bg-indigo-600 text-white',
                        !done && !current && 'border-slate-300 bg-white text-slate-400'
                      )}
                    >
                      {done ? (
                        <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                          <path
                            fillRule="evenodd"
                            d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
                            clipRule="evenodd"
                          />
                        </svg>
                      ) : (
                        <span className={cx('h-2 w-2 rounded-full', current ? 'bg-white' : 'bg-slate-300')} />
                      )}
                    </span>
                  </span>
                  <span
                    className={cx(
                      'pt-0.5 text-sm sm:pr-4 sm:pt-0',
                      current ? 'font-bold text-indigo-700' : done ? 'font-medium text-slate-700' : 'text-slate-400'
                    )}
                    aria-current={current ? 'step' : undefined}
                  >
                    {step.label}
                  </span>
                </li>
              );
            })}
          </ol>
        </div>
      )}

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

      <div className="mt-6 grid gap-6 md:grid-cols-3">
        <div className="card p-6">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">
            Shipping address
          </h2>
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
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">Payment</h2>
          <dl className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between gap-2">
              <dt className="text-slate-500">Method</dt>
              <dd className="font-medium text-slate-900">{paymentLabel}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-slate-500">Status</dt>
              <dd className="font-medium text-slate-900">
                {prettyStatus(order.paymentStatus || 'pending')}
              </dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-slate-500">Delivery</dt>
              <dd className="font-medium text-slate-900">
                {prettyStatus(order.deliveryMethod || 'standard')}
              </dd>
            </div>
          </dl>
        </div>
        <div className="card p-6">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">Totals</h2>
          <dl className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-slate-500">Subtotal</dt>
              <dd className="font-medium text-slate-900">{formatPrice(order.subtotal || 0)}</dd>
            </div>
            {Number(order.discount || 0) > 0 && (
              <div className="flex justify-between">
                <dt className="text-slate-500">Discount</dt>
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
    </div>
  );
}
