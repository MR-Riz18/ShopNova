import { useCallback, useEffect, useRef, useState } from 'react';
import adminApi from '../../api/adminApi';
import { useToast } from '../../context/ToastContext';
import ConfirmDialog from '../../components/ConfirmDialog';
import EmptyState from '../../components/EmptyState';
import ErrorState from '../../components/ErrorState';
import Loader from '../../components/Loader';
import { TableSkeleton } from '../../components/Skeleton';
import { formatDate, formatPrice } from '../../utils/format';

function Avatar({ username }) {
  const initial = (username || '?').charAt(0).toUpperCase();
  return (
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-sm font-semibold text-indigo-700">
      {initial}
    </div>
  );
}

export default function Customers() {
  const { toast } = useToast();
  const [customers, setCustomers] = useState([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selected, setSelected] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const [toggleTarget, setToggleTarget] = useState(null);
  const [toggling, setToggling] = useState(false);

  const debounceRef = useRef(null);
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(debounceRef.current);
  }, [search]);

  const fetchCustomers = useCallback(async (p = 1) => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminApi.getCustomers({
        search: debouncedSearch || undefined,
        page: p,
        limit: 10,
      });
      const d = res?.body?.data || res?.data || {};
      const list = Array.isArray(d) ? d : d.customers || d.users || [];
      setCustomers(list);
      setPage(Number(d.page) || p);
      setPages(Number(d.pages) || 1);
      setTotal(Number(d.total) || list.length);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load customers');
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch]);

  useEffect(() => {
    fetchCustomers(1);
  }, [fetchCustomers]);

  const openDetail = async (c) => {
    setDetailLoading(true);
    setSelected(null);
    try {
      const res = await adminApi.getCustomer(c._id);
      const d = res?.body?.data || res?.data || {};
      setSelected(d.customer || d);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to load customer details');
    } finally {
      setDetailLoading(false);
    }
  };

  const confirmToggle = async () => {
    if (!toggleTarget) return;
    setToggling(true);
    try {
      await adminApi.toggleCustomerStatus(toggleTarget._id);
      toast.success(
        toggleTarget.isActive ? 'Customer disabled' : 'Customer enabled'
      );
      setToggleTarget(null);
      fetchCustomers(page);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to update customer status');
    } finally {
      setToggling(false);
    }
  };

  const recentOrders = selected?.recentOrders || selected?.orders || [];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
        <p className="mt-1 text-sm text-gray-500">View and manage ShopNova customer accounts</p>
      </div>

      <div className="card mb-6">
        <input
          className="input"
          placeholder="Search customers by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="card"><TableSkeleton rows={8} cols={7} /></div>
      ) : error ? (
        <ErrorState message={error} onRetry={() => fetchCustomers(page)} />
      ) : customers.length === 0 ? (
        <EmptyState title="No customers found" message="Try adjusting your search." />
      ) : (
        <div className="card overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[840px] text-left text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="th">Customer</th>
                  <th className="th">Phone</th>
                  <th className="th">Orders</th>
                  <th className="th">Total Spent</th>
                  <th className="th">Status</th>
                  <th className="th">Joined</th>
                  <th className="th text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {customers.map((c) => (
                  <tr key={c._id} className="hover:bg-gray-50">
                    <td className="td">
                      <div className="flex items-center gap-3">
                        <Avatar username={c.username} />
                        <div>
                          <div className="font-medium text-gray-900">{c.username}</div>
                          <div className="text-xs text-gray-500">{c.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="td text-gray-500">{c.phone || '—'}</td>
                    <td className="td">{c.ordersCount ?? 0}</td>
                    <td className="td font-medium">{formatPrice(c.totalSpent || 0)}</td>
                    <td className="td">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                          c.isActive === false
                            ? 'bg-red-100 text-red-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {c.isActive === false ? 'Disabled' : 'Active'}
                      </span>
                    </td>
                    <td className="td text-gray-500">{formatDate(c.createdAt)}</td>
                    <td className="td text-right">
                      <div className="flex justify-end gap-2">
                        <button className="btn-outline px-3 py-1.5 text-xs" onClick={() => openDetail(c)}>
                          View
                        </button>
                        <button
                          className={c.isActive === false ? 'btn-secondary px-3 py-1.5 text-xs' : 'btn-danger px-3 py-1.5 text-xs'}
                          onClick={() => setToggleTarget(c)}
                        >
                          {c.isActive === false ? 'Enable' : 'Disable'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!loading && !error && customers.length > 0 && (
        <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
          <span>
            Page {page} of {pages} · {total} customers
          </span>
          <div className="flex gap-2">
            <button
              className="btn-secondary px-3 py-1.5 text-xs disabled:opacity-50"
              disabled={page <= 1}
              onClick={() => fetchCustomers(page - 1)}
            >
              Previous
            </button>
            <button
              className="btn-secondary px-3 py-1.5 text-xs disabled:opacity-50"
              disabled={page >= pages}
              onClick={() => fetchCustomers(page + 1)}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setSelected(null)}>
          <div
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-start justify-between">
              <div className="flex items-center gap-3">
                <Avatar username={selected.username} />
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">{selected.username}</h2>
                  <p className="text-sm text-gray-500">{selected.email}</p>
                </div>
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

            <dl className="grid grid-cols-2 gap-4 rounded-lg bg-gray-50 p-4 text-sm">
              <div>
                <dt className="text-gray-500">Phone</dt>
                <dd className="font-medium text-gray-900">{selected.phone || '—'}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Role</dt>
                <dd className="font-medium text-gray-900">{selected.role || 'customer'}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Total Orders</dt>
                <dd className="font-medium text-gray-900">{selected.ordersCount ?? 0}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Total Spent</dt>
                <dd className="font-medium text-gray-900">{formatPrice(selected.totalSpent || 0)}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Joined</dt>
                <dd className="font-medium text-gray-900">{formatDate(selected.createdAt)}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Status</dt>
                <dd className="font-medium text-gray-900">
                  {selected.isActive === false ? 'Disabled' : 'Active'}
                </dd>
              </div>
            </dl>

            {recentOrders.length > 0 && (
              <div className="mt-5">
                <h3 className="mb-2 font-semibold text-gray-900">Recent Orders</h3>
                <div className="divide-y divide-gray-100 rounded-lg border border-gray-100 text-sm">
                  {recentOrders.slice(0, 5).map((o) => (
                    <div key={o._id || o.orderNumber} className="flex items-center justify-between p-3">
                      <div>
                        <p className="font-mono text-xs font-medium">{o.orderNumber || o._id?.slice(-8)}</p>
                        <p className="text-xs text-gray-500">{formatDate(o.createdAt)}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{formatPrice(o.total)}</p>
                        <p className="text-xs text-gray-500">{o.status}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-6 flex justify-end">
              <button className="btn-secondary" onClick={() => setSelected(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!toggleTarget}
        title={toggleTarget?.isActive === false ? 'Enable Customer' : 'Disable Customer'}
        message={
          toggleTarget?.isActive === false
            ? `Re-enable the account for "${toggleTarget?.username}"?`
            : `Disable the account for "${toggleTarget?.username}"? They will no longer be able to sign in.`
        }
        confirmText={toggleTarget?.isActive === false ? 'Enable' : 'Disable'}
        loading={toggling}
        onConfirm={confirmToggle}
        onCancel={() => setToggleTarget(null)}
      />
    </div>
  );
}
