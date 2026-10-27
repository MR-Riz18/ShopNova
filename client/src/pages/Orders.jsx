import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import orderApi from '../api/orderApi';
import EmptyState from '../components/EmptyState';
import ErrorState from '../components/ErrorState';
import { STATUS_STYLES } from '../utils/constants';
import { formatPrice, formatDate, cx } from '../utils/format';

const getBody = (res) => res?.data?.data ?? res?.data ?? {};
const errMsg = (e, fb = 'Failed to load orders.') =>
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

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await orderApi.getMyOrders();
      const body = getBody(res);
      const list = Array.isArray(body) ? body : body.orders ?? [];
      setOrders(Array.isArray(list) ? list : []);
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="container-x py-8">
      <h1 className="text-3xl font-bold tracking-tight text-slate-900">My Orders</h1>
      <p className="mt-1 text-sm text-slate-500">Track and review your past purchases.</p>

      {loading ? (
        <div className="mt-8 grid gap-4" aria-hidden="true">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="card animate-pulse p-5">
              <div className="flex justify-between">
                <div className="h-4 w-40 rounded bg-slate-200" />
                <div className="h-5 w-24 rounded-full bg-slate-200" />
              </div>
              <div className="mt-4 h-4 w-64 rounded bg-slate-200" />
              <div className="mt-2 h-4 w-32 rounded bg-slate-200" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="mt-8">
          <ErrorState title="Couldn't load orders" message={error} onRetry={load} />
        </div>
      ) : orders.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            title="You haven't placed any orders yet."
            message="When you do, they'll show up here with tracking details."
            action={
              <Link to="/shop" className="btn-primary">
                Start shopping
              </Link>
            }
          />
        </div>
      ) : (
        <div className="mt-8 grid gap-4">
          {orders.map((order) => {
            const orderNumber = order.orderNumber || order.orderId || order._id;
            const status = order.status || order.orderStatus || 'pending';
            const style =
              (STATUS_STYLES && STATUS_STYLES[status]) ||
              DEFAULT_STATUS_STYLES[status] ||
              DEFAULT_STATUS_STYLES.pending;
            const itemCount = (order.items || []).reduce(
              (n, it) => n + Number(it.quantity || 0),
              0
            );
            return (
              <Link
                key={order._id || orderNumber}
                to={`/orders/${order._id}`}
                className="card block p-5 transition hover:shadow-md"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-mono text-sm font-bold text-slate-900">{orderNumber}</p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      Placed {order.createdAt ? formatDate(order.createdAt) : '—'}
                    </p>
                  </div>
                  <span className={cx('rounded-full px-3 py-1 text-xs font-bold', style)}>
                    {prettyStatus(status)}
                  </span>
                </div>
                <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4 text-sm">
                  <p className="text-slate-500">
                    {itemCount} {itemCount === 1 ? 'item' : 'items'}
                  </p>
                  <p className="font-extrabold text-slate-900">{formatPrice(order.total || 0)}</p>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
