import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import productApi from '../api/productApi';
import categoryApi from '../api/categoryApi';
import ProductCard from '../components/ProductCard';
import Filters from '../components/Filters';
import Pagination from '../components/Pagination';
import EmptyState from '../components/EmptyState';
import ErrorState from '../components/ErrorState';
import { ProductGridSkeleton } from '../components/Skeleton';
import { useDebounce } from '../hooks/useDebounce';
import { SORT_OPTIONS } from '../utils/constants';
import { SAMPLE_PRODUCTS, SAMPLE_CATEGORIES } from '../utils/sampleData';

const PAGE_SIZE = 12;

const getBody = (res) => res?.data?.data ?? res?.data ?? {};
const errMsg = (e, fb = 'Failed to load products.') =>
  e?.response?.data?.message || e?.message || fb;

const unwrapProducts = (res) => {
  const body = getBody(res);
  const list = Array.isArray(body) ? body : body.products ?? body.items ?? [];
  const pg = body.pagination ?? {};
  return {
    items: Array.isArray(list) ? list : [],
    page: Number(body.page ?? pg.page ?? 1) || 1,
    pages: Number(body.pages ?? pg.pages ?? 1) || 1,
    total: Number(body.total ?? pg.total ?? (Array.isArray(list) ? list.length : 0)) || 0,
  };
};

const FALLBACK_SORTS = [
  { value: 'newest', label: 'Newest' },
  { value: 'popular', label: 'Most popular' },
  { value: 'rating', label: 'Top rated' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'featured', label: 'Featured' },
];

const toOptions = (src, fallback) => {
  const list = src ?? fallback;
  if (Array.isArray(list)) {
    return list.map((o) =>
      typeof o === 'string' ? { value: o, label: o } : { value: o.value, label: o.label ?? o.value }
    );
  }
  if (list && typeof list === 'object') {
    return Object.entries(list).map(([value, label]) => ({ value, label: String(label) }));
  }
  return [];
};

/** Client-side filtering used only when the API is unreachable (sample fallback). */
const applyLocalFilters = (list, f) => {
  let out = [...list];
  if (f.search) {
    const q = f.search.trim().toLowerCase();
    out = out.filter((p) =>
      [p.name, p.description, p.brand].filter(Boolean).join(' ').toLowerCase().includes(q)
    );
  }
  if (f.category) {
    out = out.filter((p) => {
      const c = p.category;
      const slug = typeof c === 'object' && c !== null ? c.slug || c.name || c._id : c;
      return String(slug ?? '').toLowerCase() === f.category.toLowerCase();
    });
  }
  if (f.brand) out = out.filter((p) => String(p.brand ?? '').toLowerCase() === f.brand.toLowerCase());
  if (f.minPrice !== '') out = out.filter((p) => Number(p.price) >= Number(f.minPrice));
  if (f.maxPrice !== '') out = out.filter((p) => Number(p.price) <= Number(f.maxPrice));
  if (f.minRating !== '')
    out = out.filter((p) => Number(p.rating ?? 0) >= Number(f.minRating));
  if (f.inStock) out = out.filter((p) => Number(p.stock ?? 0) > 0);
  if (f.size) out = out.filter((p) => (p.sizes || []).includes(f.size));
  if (f.color) {
    out = out.filter((p) =>
      (p.colors || []).map((c) => String(c).toLowerCase()).includes(f.color.toLowerCase())
    );
  }
  switch (f.sort) {
    case 'price-asc':
      out.sort((a, b) => a.price - b.price);
      break;
    case 'price-desc':
      out.sort((a, b) => b.price - a.price);
      break;
    case 'rating':
      out.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
      break;
    case 'popular':
      out.sort((a, b) => (b.numReviews ?? 0) - (a.numReviews ?? 0));
      break;
    case 'newest':
    default:
      out.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  }
  return out;
};

export default function Shop() {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryKey = searchParams.toString();

  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1);
  const filters = useMemo(
    () => ({
      search: searchParams.get('search') || '',
      category: searchParams.get('category') || '',
      brand: searchParams.get('brand') || '',
      minPrice: searchParams.get('minPrice') || '',
      maxPrice: searchParams.get('maxPrice') || '',
      minRating: searchParams.get('minRating') || '',
      inStock: searchParams.get('inStock') === 'true',
      size: searchParams.get('size') || '',
      color: searchParams.get('color') || '',
      sort: searchParams.get('sort') || 'newest',
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [queryKey]
  );

  const [products, setProducts] = useState([]);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [usingFallback, setUsingFallback] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const [searchInput, setSearchInput] = useState(filters.search);
  const debouncedSearch = useDebounce(searchInput, 400);

  const updateParams = (patch, resetPage = true) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(patch).forEach(([k, v]) => {
      if (v === '' || v === null || v === undefined || v === false) next.delete(k);
      else next.set(k, String(v));
    });
    if (resetPage) next.delete('page');
    setSearchParams(next);
  };

  const clearAll = () => {
    setSearchInput('');
    setSearchParams({});
  };

  // Debounced search -> URL
  useEffect(() => {
    if (debouncedSearch !== filters.search) updateParams({ search: debouncedSearch });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  const fetchProducts = async (signal) => {
    setLoading(true);
    setError('');
    try {
      const params = { ...filters, page, limit: PAGE_SIZE };
      Object.keys(params).forEach((k) => {
        if (params[k] === '' || params[k] === null || params[k] === undefined) delete params[k];
      });
      const res = await productApi.getProducts(params);
      if (signal.aborted) return;
      const { items, pages: pgs, total: tot } = unwrapProducts(res);
      setProducts(items);
      setPages(pgs);
      setTotal(tot);
      setUsingFallback(false);
    } catch (e) {
      if (signal.aborted) return;
      if (SAMPLE_PRODUCTS && SAMPLE_PRODUCTS.length) {
        const local = applyLocalFilters(SAMPLE_PRODUCTS, filters);
        const pgs = Math.max(1, Math.ceil(local.length / PAGE_SIZE));
        const safePage = Math.min(page, pgs);
        setProducts(local.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE));
        setPages(pgs);
        setTotal(local.length);
        setUsingFallback(true);
      } else {
        setError(errMsg(e));
        setProducts([]);
      }
    } finally {
      if (!signal.aborted) setLoading(false);
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    fetchProducts(controller.signal);
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryKey]);

  // Categories for the filter sidebar
  useEffect(() => {
    let cancelled = false;
    categoryApi
      .getCategories()
      .then((res) => {
        if (cancelled) return;
        const body = getBody(res);
        const list = Array.isArray(body) ? body : body.categories ?? [];
        setCategories(Array.isArray(list) && list.length ? list : [...(SAMPLE_CATEGORIES || [])]);
      })
      .catch(() => {
        if (!cancelled) setCategories([...(SAMPLE_CATEGORIES || [])]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const brands = useMemo(
    () =>
      [...new Set(products.map((p) => p.brand).filter(Boolean))].sort((a, b) =>
        a.localeCompare(b)
      ),
    [products]
  );

  const sortOptions = toOptions(SORT_OPTIONS, FALLBACK_SORTS);

  const activeFilterCount = useMemo(() => {
    let n = 0;
    if (filters.category) n++;
    if (filters.brand) n++;
    if (filters.minPrice || filters.maxPrice) n++;
    if (filters.minRating) n++;
    if (filters.inStock) n++;
    if (filters.size) n++;
    if (filters.color) n++;
    return n;
  }, [filters]);

  const filterPanel = (
    <Filters
      filters={filters}
      categories={categories}
      brands={brands}
      onChange={(patch) => updateParams(patch)}
      onClear={clearAll}
    />
  );

  return (
    <div className="container-x py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Shop</h1>
        <p className="mt-1 text-sm text-slate-500">
          Browse the full catalog and filter by what matters to you.
        </p>
      </div>

      {/* Search */}
      <div className="mb-6">
        <label htmlFor="shop-search" className="sr-only">
          Search products
        </label>
        <div className="relative max-w-xl">
          <svg
            className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z"
              clipRule="evenodd"
            />
          </svg>
          <input
            id="shop-search"
            type="search"
            className="input pl-10"
            placeholder="Search products, brands..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            autoComplete="off"
          />
        </div>
      </div>

      <div className="flex gap-8">
        {/* Sidebar (desktop) */}
        <aside className="hidden w-64 shrink-0 lg:block">
          <div className="card sticky top-24 p-5">{filterPanel}</div>
        </aside>

        <div className="min-w-0 flex-1">
          {/* Toolbar */}
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <button
                type="button"
                className="btn-outline inline-flex items-center gap-2 lg:hidden"
                onClick={() => setDrawerOpen(true)}
                aria-haspopup="dialog"
              >
                <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path
                    fillRule="evenodd"
                    d="M2.5 5a.75.75 0 01.75-.75h13.5a.75.75 0 010 1.5H3.25A.75.75 0 012.5 5zm3 5a.75.75 0 01.75-.75h7.5a.75.75 0 010 1.5h-7.5A.75.75 0 015.5 10zm3 5a.75.75 0 01.75-.75h1.5a.75.75 0 010 1.5H9.25A.75.75 0 018.5 15z"
                    clipRule="evenodd"
                  />
                </svg>
                Filters
                {activeFilterCount > 0 && (
                  <span className="rounded-full bg-indigo-600 px-2 py-0.5 text-xs font-bold text-white">
                    {activeFilterCount}
                  </span>
                )}
              </button>
              <p className="text-sm text-slate-600" aria-live="polite">
                <span className="font-semibold text-slate-900">{loading ? '…' : total}</span>{' '}
                {total === 1 ? 'product' : 'products'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <label htmlFor="shop-sort" className="text-sm text-slate-600">
                Sort by
              </label>
              <select
                id="shop-sort"
                className="input w-auto"
                value={filters.sort}
                onChange={(e) => updateParams({ sort: e.target.value })}
              >
                {sortOptions.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {usingFallback && !loading && (
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              <span>We couldn&apos;t reach our servers, so we&apos;re showing sample products.</span>
              <button
                type="button"
                className="font-semibold underline hover:text-amber-900"
                onClick={() => fetchProducts(new AbortController().signal)}
              >
                Retry
              </button>
            </div>
          )}

          {/* Grid states */}
          {loading ? (
            <ProductGridSkeleton count={PAGE_SIZE} />
          ) : error ? (
            <ErrorState
              title="Couldn't load products"
              message={error}
              onRetry={() => fetchProducts(new AbortController().signal)}
            />
          ) : products.length === 0 ? (
            <EmptyState
              title="No products found"
              message="Try adjusting your filters or search term to find what you're looking for."
              action={
                <button type="button" className="btn-primary" onClick={clearAll}>
                  Clear all filters
                </button>
              }
            />
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-6 xl:grid-cols-4">
                {products.map((p) => (
                  <ProductCard key={p._id || p.id} product={p} />
                ))}
              </div>
              {pages > 1 && (
                <div className="mt-8 flex justify-center">
                  <Pagination
                    page={page}
                    pages={pages}
                    onPageChange={(p) => {
                      updateParams({ page: p }, false);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                  />
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Mobile filter drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Filters">
          <div
            className="absolute inset-0 bg-slate-900/50"
            onClick={() => setDrawerOpen(false)}
            aria-hidden="true"
          />
          <div className="absolute inset-y-0 left-0 flex w-80 max-w-[85vw] flex-col bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <h2 className="text-lg font-semibold text-slate-900">Filters</h2>
              <button
                type="button"
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
                onClick={() => setDrawerOpen(false)}
                aria-label="Close filters"
              >
                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-5">{filterPanel}</div>
            <div className="border-t border-slate-200 p-4">
              <button
                type="button"
                className="btn-primary w-full"
                onClick={() => setDrawerOpen(false)}
              >
                Show {total} {total === 1 ? 'product' : 'products'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
