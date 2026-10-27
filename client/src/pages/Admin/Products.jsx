import { useCallback, useEffect, useRef, useState } from 'react';
import adminApi from '../../api/adminApi';
import { categoryApi } from '../../api/categoryApi';
import { useToast } from '../../context/ToastContext';
import ConfirmDialog from '../../components/ConfirmDialog';
import EmptyState from '../../components/EmptyState';
import ErrorState from '../../components/ErrorState';
import { TableSkeleton } from '../../components/Skeleton';
import { formatPrice, imgUrl } from '../../utils/format';

const emptyForm = {
  name: '',
  description: '',
  price: '',
  originalPrice: '',
  category: '',
  brand: '',
  stock: '',
  sizes: '',
  colors: '',
  specifications: '',
  featured: false,
  bestSeller: false,
};

function stockBadge(stock) {
  if (stock <= 0) return 'bg-red-100 text-red-800';
  if (stock < 10) return 'bg-amber-100 text-amber-800';
  return 'bg-emerald-100 text-emerald-800';
}

export default function Products() {
  const { toast } = useToast();
  const [products, setProducts] = useState([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [newFiles, setNewFiles] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const debounceRef = useRef(null);
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(debounceRef.current);
  }, [search]);

  const fetchProducts = useCallback(async (p = 1) => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminApi.getProducts({
        search: debouncedSearch || undefined,
        category: category || undefined,
        page: p,
        limit: 10,
      });
      const d = res?.body?.data || res?.data || {};
      setProducts(Array.isArray(d.products) ? d.products : []);
      setPage(Number(d.page) || p);
      setPages(Number(d.pages) || 1);
      setTotal(Number(d.total) || 0);
    } catch (err) {
      const msg = err?.response?.data?.message || 'Failed to load products';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, category]);

  useEffect(() => {
    categoryApi
      .getCategories()
      .then((res) => {
        const d = res?.body?.data || res?.data || {};
        const list = Array.isArray(d) ? d : d.categories || [];
        setCategories(list);
      })
      .catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    fetchProducts(1);
  }, [fetchProducts]);

  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm);
    setNewFiles([]);
    setExistingImages([]);
    setModalOpen(true);
  };

  const openEdit = (p) => {
    setEditing(p);
    setForm({
      name: p.name || '',
      description: p.description || '',
      price: p.price ?? '',
      originalPrice: p.originalPrice ?? '',
      category: p.category?._id || p.category || '',
      brand: p.brand || '',
      stock: p.stock ?? '',
      sizes: (p.sizes || []).join(', '),
      colors: (p.colors || []).join(', '),
      specifications: Object.entries(p.specifications || {})
        .map(([k, v]) => `${k}: ${v}`)
        .join('\n'),
      featured: !!p.featured,
      bestSeller: !!p.bestSeller,
    });
    setNewFiles([]);
    setExistingImages(Array.isArray(p.images) ? p.images : []);
    setModalOpen(true);
  };

  const handleFileChange = (e) => {
    setNewFiles((prev) => [...prev, ...Array.from(e.target.files || [])]);
    e.target.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.description.trim() || !form.category) {
      toast.error('Name, description and category are required');
      return;
    }
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('name', form.name.trim());
      fd.append('description', form.description.trim());
      fd.append('price', String(Number(form.price) || 0));
      if (form.originalPrice !== '' && form.originalPrice != null)
        fd.append('originalPrice', String(Number(form.originalPrice) || 0));
      fd.append('category', form.category);
      if (form.brand) fd.append('brand', form.brand.trim());
      fd.append('stock', String(Number(form.stock) || 0));
      fd.append('sizes', JSON.stringify(form.sizes.split(',').map((s) => s.trim()).filter(Boolean)));
      fd.append('colors', JSON.stringify(form.colors.split(',').map((s) => s.trim()).filter(Boolean)));
      const specs = {};
      form.specifications
        .split('\n')
        .forEach((line) => {
          const idx = line.indexOf(':');
          if (idx > 0) {
            const k = line.slice(0, idx).trim();
            const v = line.slice(idx + 1).trim();
            if (k) specs[k] = v;
          }
        });
      fd.append('specifications', JSON.stringify(specs));
      fd.append('featured', String(!!form.featured));
      fd.append('bestSeller', String(!!form.bestSeller));
      newFiles.forEach((f) => fd.append('images', f));
      fd.append('existingImages', JSON.stringify(existingImages));

      if (editing) {
        await adminApi.updateProduct(editing._id, fd);
        toast.success('Product updated');
      } else {
        await adminApi.createProduct(fd);
        toast.success('Product created');
      }
      setModalOpen(false);
      fetchProducts(editing ? page : 1);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to save product');
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await adminApi.deleteProduct(deleteTarget._id);
      toast.success('Product deleted');
      setDeleteTarget(null);
      fetchProducts(page);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to delete product');
    } finally {
      setDeleting(false);
    }
  };

  const set = (field) => (e) => {
    const v = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm((f) => ({ ...f, [field]: v }));
  };

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Products</h1>
          <p className="mt-1 text-sm text-gray-500">Manage your ShopNova product catalog</p>
        </div>
        <button className="btn-primary" onClick={openAdd}>
          Add Product
        </button>
      </div>

      <div className="card mb-6">
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            className="input flex-1"
            placeholder="Search products by name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select className="input sm:w-56" value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="card"><TableSkeleton rows={8} cols={7} /></div>
      ) : error ? (
        <ErrorState message={error} onRetry={() => fetchProducts(page)} />
      ) : products.length === 0 ? (
        <EmptyState
          title="No products found"
          message="Try adjusting your search or add a new product to get started."
        />
      ) : (
        <div className="card overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-left text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="th">Image</th>
                  <th className="th">Name</th>
                  <th className="th">Category</th>
                  <th className="th">Price</th>
                  <th className="th">Stock</th>
                  <th className="th">Badges</th>
                  <th className="th text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {products.map((p) => (
                  <tr key={p._id} className="hover:bg-gray-50">
                    <td className="td">
                      <img
                        src={imgUrl(p.images?.[0])}
                        alt={p.name}
                        className="h-11 w-11 rounded object-cover"
                      />
                    </td>
                    <td className="td font-medium text-gray-900">{p.name}</td>
                    <td className="td text-gray-500">{p.category?.name || '—'}</td>
                    <td className="td font-medium">
                      {formatPrice(p.price)}
                      {p.originalPrice > p.price && (
                        <span className="ml-2 text-xs text-gray-400 line-through">
                          {formatPrice(p.originalPrice)}
                        </span>
                      )}
                    </td>
                    <td className="td">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${stockBadge(p.stock)}`}>
                        {p.stock}
                      </span>
                    </td>
                    <td className="td">
                      <div className="flex flex-wrap gap-1">
                        {p.featured && (
                          <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-700">
                            Featured
                          </span>
                        )}
                        {p.bestSeller && (
                          <span className="rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700">
                            Bestseller
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="td text-right">
                      <div className="flex justify-end gap-2">
                        <button className="btn-outline px-3 py-1.5 text-xs" onClick={() => openEdit(p)}>
                          Edit
                        </button>
                        <button
                          className="btn-danger px-3 py-1.5 text-xs"
                          onClick={() => setDeleteTarget(p)}
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

      {!loading && !error && products.length > 0 && (
        <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
          <span>
            Page {page} of {pages} · {total} products
          </span>
          <div className="flex gap-2">
            <button
              className="btn-secondary px-3 py-1.5 text-xs disabled:opacity-50"
              disabled={page <= 1}
              onClick={() => fetchProducts(page - 1)}
            >
              Previous
            </button>
            <button
              className="btn-secondary px-3 py-1.5 text-xs disabled:opacity-50"
              disabled={page >= pages}
              onClick={() => fetchProducts(page + 1)}
            >
              Next
            </button>
          </div>
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white p-6 shadow-xl">
            <h2 className="mb-4 text-xl font-semibold text-gray-900">
              {editing ? 'Edit Product' : 'Add Product'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">Name *</label>
                <input className="input" value={form.name} onChange={set('name')} required />
              </div>
              <div>
                <label className="label">Description *</label>
                <textarea className="input min-h-[100px]" value={form.description} onChange={set('description')} required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Price (USD) *</label>
                  <input className="input" type="number" min="0" step="0.01" value={form.price} onChange={set('price')} required />
                </div>
                <div>
                  <label className="label">Original Price</label>
                  <input className="input" type="number" min="0" step="0.01" value={form.originalPrice} onChange={set('originalPrice')} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Category *</label>
                  <select className="input" value={form.category} onChange={set('category')} required>
                    <option value="">Select category</option>
                    {categories.map((c) => (
                      <option key={c._id} value={c._id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">Brand</label>
                  <input className="input" value={form.brand} onChange={set('brand')} />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="label">Stock *</label>
                  <input className="input" type="number" min="0" step="1" value={form.stock} onChange={set('stock')} required />
                </div>
                <div>
                  <label className="label">Sizes (comma-separated)</label>
                  <input className="input" value={form.sizes} onChange={set('sizes')} placeholder="S, M, L" />
                </div>
                <div>
                  <label className="label">Colors (comma-separated)</label>
                  <input className="input" value={form.colors} onChange={set('colors')} placeholder="Red, Blue" />
                </div>
              </div>
              <div>
                <label className="label">Specifications (one per line, "key: value")</label>
                <textarea className="input min-h-[80px]" value={form.specifications} onChange={set('specifications')} placeholder={'Weight: 1.2kg\nMaterial: Cotton'} />
              </div>
              <div className="flex gap-6">
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input type="checkbox" checked={form.featured} onChange={set('featured')} className="h-4 w-4" />
                  Featured
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input type="checkbox" checked={form.bestSeller} onChange={set('bestSeller')} className="h-4 w-4" />
                  Bestseller
                </label>
              </div>
              <div>
                <label className="label">Images</label>
                {existingImages.length > 0 && (
                  <div className="mb-3 flex flex-wrap gap-2">
                    {existingImages.map((src) => (
                      <div key={src} className="relative">
                        <img src={imgUrl(src)} alt="" className="h-16 w-16 rounded object-cover" />
                        <button
                          type="button"
                          onClick={() => setExistingImages((prev) => prev.filter((i) => i !== src))}
                          className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-xs text-white"
                          aria-label="Remove image"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <input type="file" accept="image/*" multiple onChange={handleFileChange} className="input" />
                {newFiles.length > 0 && (
                  <p className="mt-1 text-xs text-gray-500">{newFiles.length} new file(s) selected</p>
                )}
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" className="btn-secondary" onClick={() => setModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={submitting}>
                  {submitting ? 'Saving...' : editing ? 'Save Changes' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Product"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
