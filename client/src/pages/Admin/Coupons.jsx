import { useCallback, useEffect, useState } from 'react';
import adminApi from '../../api/adminApi';
import { useToast } from '../../context/ToastContext';
import ConfirmDialog from '../../components/ConfirmDialog';
import EmptyState from '../../components/EmptyState';
import ErrorState from '../../components/ErrorState';
import { TableSkeleton } from '../../components/Skeleton';
import { formatDate, formatPrice } from '../../utils/format';

const emptyForm = {
  code: '',
  discountType: 'percentage',
  discountValue: '',
  minOrderAmount: '',
  maxDiscount: '',
  expiresAt: '',
  usageLimit: '',
  isActive: true,
};

export default function Coupons() {
  const { toast } = useToast();
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchCoupons = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminApi.getCoupons();
      const d = res?.body?.data || res?.data || {};
      const list = Array.isArray(d) ? d : d.coupons || [];
      setCoupons(list);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load coupons');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCoupons();
  }, [fetchCoupons]);

  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (c) => {
    setEditing(c);
    setForm({
      code: c.code || '',
      discountType: c.discountType || 'percentage',
      discountValue: c.discountValue ?? '',
      minOrderAmount: c.minOrderAmount ?? '',
      maxDiscount: c.maxDiscount ?? '',
      expiresAt: c.expiresAt ? c.expiresAt.slice(0, 10) : '',
      usageLimit: c.usageLimit ?? '',
      isActive: c.isActive !== false,
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.code.trim() || form.discountValue === '' || form.discountValue == null) {
      toast.error('Code and discount value are required');
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        code: form.code.trim().toUpperCase(),
        discountType: form.discountType,
        discountValue: Number(form.discountValue) || 0,
        minOrderAmount: Number(form.minOrderAmount) || 0,
        maxDiscount: form.maxDiscount === '' ? undefined : Number(form.maxDiscount),
        expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : undefined,
        usageLimit: form.usageLimit === '' ? undefined : Number(form.usageLimit),
        isActive: !!form.isActive,
      };
      if (editing) {
        await adminApi.updateCoupon(editing._id, payload);
        toast.success('Coupon updated');
      } else {
        await adminApi.createCoupon(payload);
        toast.success('Coupon created');
      }
      setModalOpen(false);
      fetchCoupons();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to save coupon');
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await adminApi.deleteCoupon(deleteTarget._id);
      toast.success('Coupon deleted');
      setDeleteTarget(null);
      fetchCoupons();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to delete coupon');
    } finally {
      setDeleting(false);
    }
  };

  const set = (field) => (e) => {
    const v = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm((f) => ({ ...f, [field]: v }));
  };

  const valueLabel = (c) =>
    c.discountType === 'percentage' ? `${c.discountValue}%` : formatPrice(c.discountValue);

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Coupons</h1>
          <p className="mt-1 text-sm text-gray-500">Create and manage discount coupons for ShopNova</p>
        </div>
        <button className="btn-primary" onClick={openAdd}>
          Create Coupon
        </button>
      </div>

      {loading ? (
        <div className="card"><TableSkeleton rows={6} cols={8} /></div>
      ) : error ? (
        <ErrorState message={error} onRetry={fetchCoupons} />
      ) : coupons.length === 0 ? (
        <EmptyState
          title="No coupons yet"
          message="Create your first coupon to offer discounts to customers."
        />
      ) : (
        <div className="card overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[920px] text-left text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="th">Code</th>
                  <th className="th">Type</th>
                  <th className="th">Value</th>
                  <th className="th">Min Order</th>
                  <th className="th">Max Discount</th>
                  <th className="th">Expiry</th>
                  <th className="th">Usage</th>
                  <th className="th">Status</th>
                  <th className="th text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {coupons.map((c) => (
                  <tr key={c._id} className="hover:bg-gray-50">
                    <td className="td font-mono font-bold text-gray-900">{c.code}</td>
                    <td className="td capitalize text-gray-500">{c.discountType}</td>
                    <td className="td font-medium">{valueLabel(c)}</td>
                    <td className="td text-gray-500">{formatPrice(c.minOrderAmount || 0)}</td>
                    <td className="td text-gray-500">
                      {c.maxDiscount ? formatPrice(c.maxDiscount) : '—'}
                    </td>
                    <td className="td text-gray-500">{c.expiresAt ? formatDate(c.expiresAt) : '—'}</td>
                    <td className="td text-gray-500">
                      {c.usedCount ?? 0}{c.usageLimit ? ` / ${c.usageLimit}` : ''}
                    </td>
                    <td className="td">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                          c.isActive
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {c.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="td text-right">
                      <div className="flex justify-end gap-2">
                        <button className="btn-outline px-3 py-1.5 text-xs" onClick={() => openEdit(c)}>
                          Edit
                        </button>
                        <button
                          className="btn-danger px-3 py-1.5 text-xs"
                          onClick={() => setDeleteTarget(c)}
                        >
                          Delete
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

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-lg bg-white p-6 shadow-xl">
            <h2 className="mb-4 text-xl font-semibold text-gray-900">
              {editing ? 'Edit Coupon' : 'Create Coupon'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">Code *</label>
                <input
                  className="input font-mono uppercase"
                  value={form.code}
                  onChange={set('code')}
                  placeholder="SAVE20"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Discount Type</label>
                  <select className="input" value={form.discountType} onChange={set('discountType')}>
                    <option value="percentage">Percentage</option>
                    <option value="fixed">Fixed amount</option>
                  </select>
                </div>
                <div>
                  <label className="label">Discount Value *</label>
                  <input
                    className="input"
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.discountValue}
                    onChange={set('discountValue')}
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Min Order Amount (USD)</label>
                  <input className="input" type="number" min="0" step="0.01" value={form.minOrderAmount} onChange={set('minOrderAmount')} />
                </div>
                <div>
                  <label className="label">Max Discount (USD)</label>
                  <input className="input" type="number" min="0" step="0.01" value={form.maxDiscount} onChange={set('maxDiscount')} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Expiry Date</label>
                  <input type="date" className="input" value={form.expiresAt} onChange={set('expiresAt')} />
                </div>
                <div>
                  <label className="label">Usage Limit</label>
                  <input className="input" type="number" min="0" step="1" value={form.usageLimit} onChange={set('usageLimit')} placeholder="Unlimited" />
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input type="checkbox" checked={form.isActive} onChange={set('isActive')} className="h-4 w-4" />
                Active
              </label>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" className="btn-secondary" onClick={() => setModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={submitting}>
                  {submitting ? 'Saving...' : editing ? 'Save Changes' : 'Create Coupon'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Coupon"
        message={`Delete coupon "${deleteTarget?.code}"? This action cannot be undone.`}
        confirmText="Delete"
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
