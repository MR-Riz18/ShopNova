import { useCallback, useEffect, useState } from 'react';
import adminApi from '../../api/adminApi';
import { useToast } from '../../context/ToastContext';
import ConfirmDialog from '../../components/ConfirmDialog';
import EmptyState from '../../components/EmptyState';
import ErrorState from '../../components/ErrorState';
import { TableSkeleton } from '../../components/Skeleton';
import { imgUrl } from '../../utils/format';

export default function Categories() {
  const { toast } = useToast();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminApi.getCategories();
      const d = res?.body?.data || res?.data || {};
      const list = Array.isArray(d) ? d : d.categories || [];
      setCategories(list);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load categories');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const openAdd = () => {
    setEditing(null);
    setName('');
    setDescription('');
    setImageFile(null);
    setImagePreview('');
    setModalOpen(true);
  };

  const openEdit = (c) => {
    setEditing(c);
    setName(c.name || '');
    setDescription(c.description || '');
    setImageFile(null);
    setImagePreview(imgUrl(c.image));
    setModalOpen(true);
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Category name is required');
      return;
    }
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('name', name.trim());
      fd.append('description', description.trim());
      if (imageFile) fd.append('image', imageFile);
      if (editing) {
        await adminApi.updateCategory(editing._id, fd);
        toast.success('Category updated');
      } else {
        await adminApi.createCategory(fd);
        toast.success('Category created');
      }
      setModalOpen(false);
      fetchCategories();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to save category');
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await adminApi.deleteCategory(deleteTarget._id);
      toast.success('Category deleted');
      setDeleteTarget(null);
      fetchCategories();
    } catch (err) {
      toast.error(
        err?.response?.data?.message ||
          'Cannot delete this category because it still has products'
      );
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
          <p className="mt-1 text-sm text-gray-500">Organize your ShopNova product catalog</p>
        </div>
        <button className="btn-primary" onClick={openAdd}>
          Add Category
        </button>
      </div>

      {loading ? (
        <div className="card"><TableSkeleton rows={5} cols={5} /></div>
      ) : error ? (
        <ErrorState message={error} onRetry={fetchCategories} />
      ) : categories.length === 0 ? (
        <EmptyState
          title="No categories yet"
          message="Create your first category to start organizing products."
        />
      ) : (
        <div className="card overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="th">Image</th>
                  <th className="th">Name</th>
                  <th className="th">Description</th>
                  <th className="th">Products</th>
                  <th className="th text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {categories.map((c) => (
                  <tr key={c._id} className="hover:bg-gray-50">
                    <td className="td">
                      <img
                        src={imgUrl(c.image)}
                        alt={c.name}
                        className="h-11 w-11 rounded object-cover"
                      />
                    </td>
                    <td className="td font-medium text-gray-900">{c.name}</td>
                    <td className="td max-w-xs truncate text-gray-500">{c.description || '—'}</td>
                    <td className="td">
                      <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700">
                        {c.productCount ?? 0}
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
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h2 className="mb-4 text-xl font-semibold text-gray-900">
              {editing ? 'Edit Category' : 'Add Category'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">Name *</label>
                <input className="input" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <div>
                <label className="label">Description</label>
                <textarea className="input min-h-[90px]" value={description} onChange={(e) => setDescription(e.target.value)} />
              </div>
              <div>
                <label className="label">Image</label>
                {imagePreview && (
                  <img src={imagePreview} alt="Preview" className="mb-2 h-24 w-24 rounded object-cover" />
                )}
                <input type="file" accept="image/*" onChange={handleImageChange} className="input" />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" className="btn-secondary" onClick={() => setModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={submitting}>
                  {submitting ? 'Saving...' : editing ? 'Save Changes' : 'Create Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Category"
        message={`Delete "${deleteTarget?.name}"? Categories containing products cannot be deleted.`}
        confirmText="Delete"
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
