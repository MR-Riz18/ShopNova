import { useCallback, useEffect, useRef, useState } from 'react';
import adminApi from '../../api/adminApi';
import { useToast } from '../../context/ToastContext';
import StatCard from '../../components/StatCard';
import EmptyState from '../../components/EmptyState';
import ErrorState from '../../components/ErrorState';
import { TableSkeleton } from '../../components/Skeleton';
import { formatPrice, imgUrl } from '../../utils/format';

function stockBadge(stock) {
  if (stock <= 0)
    return <span className="rounded-full bg-red-100 px-2.5 py-1 text-xs font-medium text-red-800">Out of stock</span>;
  if (stock < 10)
    return <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-800">Low stock</span>;
  return <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-800">In stock</span>;
}

const StockIcon = ({ d }) => (
  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d={d} />
  </svg>
);

export default function Inventory() {
  const { toast } = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all'); // all | low | out
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [adjusting, setAdjusting] = useState({});

  const debounceRef = useRef(null);
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(debounceRef.current);
  }, [search]);

  const fetchInventory = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        search: debouncedSearch || undefined,
        filter: filter !== 'all' ? filter : undefined,
        lowStock: filter === 'low' ? true : undefined,
        outOfStock: filter === 'out' ? true : undefined,
      };
      const res = await adminApi.getInventory(params);
      const d = res?.body?.data || res?.data || {};
      const list = Array.isArray(d) ? d : d.products || d.inventory || d.items || [];
      setItems(list);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load inventory');
    } finally {
      setLoading(false);
    }
  }, [filter, debouncedSearch]);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  const adjustStock = async (product, delta) => {
    const id = product._id;
    const next = Math.max(0, (Number(product.stock) || 0) + delta);
    setAdjusting((a) => ({ ...a, [id]: true }));
    try {
      await adminApi.updateProduct(id, { stock: next });
      setItems((prev) => prev.map((p) => (p._id === id ? { ...p, stock: next } : p)));
      toast.success(`Stock updated to ${next}`);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to update stock');
    } finally {
      setAdjusting((a) => ({ ...a, [id]: false }));
    }
  };

  const lowStockCount = items.filter((p) => (p.stock || 0) > 0 && (p.stock || 0) < 10).length;
  const outOfStockCount = items.filter((p) => (p.stock || 0) <= 0).length;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Inventory</h1>
        <p className="mt-1 text-sm text-gray-500">Monitor and adjust ShopNova stock levels</p>
      </div>

      {lowStockCount > 0 && (
        <div className="mb-6 flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4">
          <svg className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <p className="text-sm text-amber-800">
            <span className="font-semibold">Low stock warning:</span> {lowStockCount} product
            {lowStockCount === 1 ? '' : 's'} {lowStockCount === 1 ? 'is' : 'are'} running low (fewer than 10 units). Consider restocking soon.
          </p>
        </div>
      )}

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          title="Total Products"
          value={items.length}
          icon={<StockIcon d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />}
          sub="Products tracked"
        />
        <StatCard
          title="Low Stock"
          value={lowStockCount}
          icon={<StockIcon d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />}
          sub="Fewer than 10 units"
        />
        <StatCard
          title="Out of Stock"
          value={outOfStockCount}
          icon={<StockIcon d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />}
          sub="Need restocking"
        />
      </div>

      <div className="card mb-6">
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            className="input flex-1"
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select className="input sm:w-56" value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="all">All Products</option>
            <option value="low">Low Stock</option>
            <option value="out">Out of Stock</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="card"><TableSkeleton rows={8} cols={6} /></div>
      ) : error ? (
        <ErrorState message={error} onRetry={fetchInventory} />
      ) : items.length === 0 ? (
        <EmptyState title="No products found" message="Try adjusting your search or filter." />
      ) : (
        <div className="card overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="th">Product</th>
                  <th className="th">Category</th>
                  <th className="th">Price</th>
                  <th className="th">Stock</th>
                  <th className="th">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {items.map((p) => (
                  <tr key={p._id} className="hover:bg-gray-50">
                    <td className="td">
                      <div className="flex items-center gap-3">
                        <img
                          src={imgUrl(p.images?.[0])}
                          alt={p.name}
                          className="h-11 w-11 rounded object-cover"
                        />
                        <span className="font-medium text-gray-900">{p.name}</span>
                      </div>
                    </td>
                    <td className="td text-gray-500">{p.category?.name || '—'}</td>
                    <td className="td font-medium">{formatPrice(p.price)}</td>
                    <td className="td">
                      <div className="flex items-center gap-2">
                        <button
                          className="btn-secondary flex h-7 w-7 items-center justify-center rounded p-0 text-base font-bold disabled:opacity-50"
                          disabled={adjusting[p._id] || (p.stock || 0) <= 0}
                          onClick={() => adjustStock(p, -1)}
                          aria-label="Decrease stock"
                        >
                          −
                        </button>
                        <span className="w-10 text-center font-semibold text-gray-900">
                          {p.stock ?? 0}
                        </span>
                        <button
                          className="btn-secondary flex h-7 w-7 items-center justify-center rounded p-0 text-base font-bold disabled:opacity-50"
                          disabled={adjusting[p._id]}
                          onClick={() => adjustStock(p, 1)}
                          aria-label="Increase stock"
                        >
                          +
                        </button>
                      </div>
                    </td>
                    <td className="td">{stockBadge(p.stock || 0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
