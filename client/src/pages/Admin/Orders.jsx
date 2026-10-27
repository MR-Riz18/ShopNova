import { useCallback, useEffect, useRef, useState } from 'react';
import adminApi from '../../api/adminApi';
import { useToast } from '../../context/ToastContext';
import EmptyState from '../../components/EmptyState';
import ErrorState from '../../components/ErrorState';
import Loader from '../../components/Loader';
import { TableSkeleton } from '../../components/Skeleton';
import { formatDate, formatPrice, imgUrl } from '../../utils/format';
import { ORDER_STATUSES, STATUS_STYLES } from '../../utils/constants';

const statusList = Array.isArray(ORDER_STATUSES)
  ? ORDER_STATUSES.map((s) => (typeof s === 'string' ? { value: s, label: s } : s))
  : [];

function statusBadge(status) {
  const style = STATUS_STYLES?.[status] || 'bg-gray-100 text-gray-700';
  return `rounded-full px-2.5 py-1 text-xs font-medium ${style}`;
}

function paymentBadge(method, paymentStatus) {
  const ok = String(paymentStatus || '').toLowerCase() === 'paid';
  return (
    <span
      className={`rounded-full px-2.5 py-1 text-xs font-medium ${
        ok ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
      }`}
    >
      {method || '—'} · {paymentStatus || '—'}
    </span>
  );
}

export default function Orders() {
  const { toast } = useToast();
  const [orders, setOrders] = useState([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [date, setDate] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selected, setSelected] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [updating, setUpdating] = useState(false);

  const debounceRef = useRef(null);
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(debounceRef.current);
  }, [search]);

  const fetchOrders = useCallback(async (p = 1) => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        status: status || undefined,
        search: debouncedSearch || undefined,
        date: date || undefined,
        page: p,
        limit: 10,
      };
      const res = await adminApi.getOrders(params);
      const d = res?.body?.data || res?.data || {};
      const list = Array.isArray(d) ? d : d.orders || [];
      setOrders(list);
      setPage(Number(d.page) || p);
      setPages(Number(d.pages) || 1);
      setTotal(Number(d.total) || list.length);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  }, [status, debouncedSearch, date]);

  useEffect(() => {
    fetchOrders(1);
  }, [fetchOrders]);

  const openDetail = async (o) => {
    setDetailLoading(true);
    setSelected(null);
    try {
      const res = await adminApi.getOrderById(o._id);
      const d = res?.body?.data || res?.data || {};
      const full = d.order || d;
      setSelected(full);
      setNewStatus(full.status || '');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to load order details');
    } finally {
      setDetailLoading(false);
    }
  };

  const handleStatusUpdate = async () => {
    if (!selected || !newStatus) return;
    setUpdating(true);
    try {
      await adminApi.updateOrderStatus(selected._id, newStatus);
      toast.success('Order status updated');
      setSelected((s) => ({ ...s, status: newStatus }));
      fetchOrders(page);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to update order status');
    } finally {
      setUpdating(false);
    }
  };

  const address = selected?.shippingAddress || {};

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
        <p className="mt-1 text-sm text-gray-500">Track and manage ShopNova orders</p>
      </div>

      <div className="card mb-6">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <input
            className="input"
            placeholder="Search order # or customer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select className="input" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">All Statuses</option>
            {statusList.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
          <input
            type="date"
            className="input"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="card"><TableSkeleton rows={8} cols={8} /></div>
      ) : error ? (
        <ErrorState message={error} onRetry={() => fetchOrders(page)} />
      ) : orders.length === 0 ? (
        <EmptyState title="No orders found" message="Try adjusting your filters." />
      ) : (
        <div className="card overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="th">Order #</th>
                  <th className="th">Customer</th>
                  <th className="th">Date</th>
                  <th className="th">Items</th>
                  <th className="th">Total</th>
                  <th className="th">Payment</th>
                  <th className="th">Status</th>
                  <th className="th text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {orders.map((o) => (
                  <tr key={o._id} className="hover:bg-gray-50">
                    <td className="td font-mono text-xs font-medium">
                      {o.orderNumber || o._id?.slice(-8)}
                    </td>
                    <td className="td">
                      <div className="font-medium text-gray-900">{o.user?.username || 'Guest'}</div>
                      <div className="text-xs text-gray-500">{o.user?.email}</div>
                    </td>
                    <td className="td text-gray-500">{formatDate(o.createdAt)}</td>
                    <td className="td">{o.items?.length || 0}</td>
                    <td className="td font-medium">{formatPrice(o.total)}</td>
                    <td className="td">{paymentBadge(o.paymentMethod, o.paymentStatus)}</td>
                    <td className="td">
                      <span className={statusBadge(o.status)}>{o.status || '—'}</span>
                    </td>
                    <td className="td text-right">
                      <button className="btn-outline px-3 py-1.5 text-xs" onClick={() => openDetail(o)}>
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!loading && !error && orders.length > 0 && (
        <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
          <span>
            Page {page} of {pages} · {total} orders
          </span>
          <div className="flex gap-2">
            <button
              className="btn-secondary px-3 py-1.5 text-xs disabled:opacity-50"
              disabled={page <= 1}
              onClick={() => fetchOrders(page - 1)}
            >
              Previous
            </button>
            <button
              className="btn-secondary px-3 py-1.5 text-xs disabled:opacity-50"
              disabled={page >= pages}
              onClick={() => fetchOrders(page + 1)}
            >
              Next
            </button>
          </div>
        </div>
      )}

      {detailLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Loader />
        </div>
      )}

      {selected && (
        <div className="fixed inset-0 z-50 bg-black/50" onClick={() => setSelected(null)}>
          <div
            className="absolute right-0 top-0 h-full w-full max-w-lg overflow-y-auto bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-start justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Order {selected.orderNumber || selected._id?.slice(-8)}
                </h2>
                <p className="text-sm text-gray-500">{formatDate(selected.createdAt)}</p>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                aria-label="Close"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-5 text-sm">
              <div className="rounded-lg bg-gray-50 p-4">
                <h3 className="mb-2 font-semibold text-gray-900">Customer</h3>
                <p className="font-medium">{selected.user?.username || 'Guest'}</p>
                <p className="text-gray-500">{selected.user?.email}</p>
              </div>

              <div>
                <h3 className="mb-2 font-semibold text-gray-900">Items</h3>
                <div className="divide-y divide-gray-100 rounded-lg border border-gray-100">
                  {(selected.items || []).map((item, i) => (
                    <div key={i} className="flex items-center gap-3 p-3">
                      <img
                        src={imgUrl(item.image || item.product?.images?.[0])}
                        alt={item.name || item.product?.name}
                        className="h-12 w-12 rounded object-cover"
                      />
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">
                          {item.name || item.product?.name}
                        </p>
                        <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                      </div>
                      <p className="font-medium">{formatPrice(item.price * item.quantity)}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-lg bg-gray-50 p-4">
                <h3 className="mb-2 font-semibold text-gray-900">Shipping Address</h3>
                <p className="text-gray-600">
                  {[
                    address.street || address.address,
                    address.city,
                    address.state,
                    address.zipCode || address.postalCode,
                    address.country,
                  ]
                    .filter(Boolean)
                    .join(', ') || '—'}
                </p>
                {selected.deliveryMethod && (
                  <p className="mt-1 text-gray-500">Delivery: {selected.deliveryMethod}</p>
                )}
              </div>

              <div className="rounded-lg border border-gray-100 p-4">
                <div className="space-y-1.5">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal</span>
                    <span>{formatPrice(selected.subtotal)}</span>
                  </div>
                  {Number(selected.discount) > 0 && (
                    <div className="flex justify-between text-emerald-600">
                      <span>Discount</span>
                      <span>-{formatPrice(selected.discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-gray-600">
                    <span>Shipping</span>
                    <span>{formatPrice(selected.shipping)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Tax</span>
                    <span>{formatPrice(selected.tax)}</span>
                  </div>
                  <div className="flex justify-between border-t border-gray-100 pt-2 text-base font-semibold text-gray-900">
                    <span>Total</span>
                    <span>{formatPrice(selected.total)}</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="label">Update Status</label>
                <div className="flex gap-2">
                  <select className="input flex-1" value={newStatus} onChange={(e) => setNewStatus(e.target.value)}>
                    {statusList.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                  <button className="btn-primary" onClick={handleStatusUpdate} disabled={updating}>
                    {updating ? 'Updating...' : 'Update'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
