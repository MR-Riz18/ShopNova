// Sidebar filters for the shop / product listing page.
const RATING_OPTIONS = [
  { value: 0, label: 'Any' },
  { value: 4, label: '4★+' },
  { value: 3, label: '3★+' },
];

const headingClass = 'text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2';

export default function Filters({
  filters,
  onChange,
  onClear,
  categories = [],
  brands = [],
  sizes = [],
  colors = [],
}) {
  const patch = (p) => onChange(p);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-900">Filters</h2>
        <button type="button" onClick={onClear} className="text-xs text-indigo-600 hover:text-indigo-800 font-medium">
          Clear all filters
        </button>
      </div>

      {/* Category */}
      <section aria-label="Category">
        <h3 className={headingClass}>Category</h3>
        <ul className="space-y-1">
          <li>
            <button
              type="button"
              onClick={() => patch({ category: '' })}
              className={`w-full text-left text-sm px-2 py-1.5 rounded-md ${
                !filters.category ? 'bg-indigo-50 text-indigo-700 font-medium' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              All
            </button>
          </li>
          {categories.map((c) => {
            const value = typeof c === 'string' ? c : c.slug || c.name;
            const label = typeof c === 'string' ? c : c.name;
            return (
              <li key={value}>
                <button
                  type="button"
                  onClick={() => patch({ category: value })}
                  className={`w-full text-left text-sm px-2 py-1.5 rounded-md ${
                    filters.category === value
                      ? 'bg-indigo-50 text-indigo-700 font-medium'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {label}
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      {/* Brand */}
      <section aria-label="Brand">
        <h3 className={headingClass}>Brand</h3>
        <select
          className="input"
          value={filters.brand || ''}
          onChange={(e) => patch({ brand: e.target.value })}
          aria-label="Brand"
        >
          <option value="">All brands</option>
          {brands.map((b) => {
            const value = typeof b === 'string' ? b : b.slug || b.name;
            const label = typeof b === 'string' ? b : b.name;
            return (
              <option key={value} value={value}>
                {label}
              </option>
            );
          })}
        </select>
      </section>

      {/* Price */}
      <section aria-label="Price">
        <h3 className={headingClass}>Price</h3>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min="0"
            className="input"
            placeholder="Min"
            value={filters.minPrice ?? ''}
            onChange={(e) => patch({ minPrice: e.target.value })}
            aria-label="Minimum price"
          />
          <span className="text-slate-400" aria-hidden="true">–</span>
          <input
            type="number"
            min="0"
            className="input"
            placeholder="Max"
            value={filters.maxPrice ?? ''}
            onChange={(e) => patch({ maxPrice: e.target.value })}
            aria-label="Maximum price"
          />
        </div>
      </section>

      {/* Rating */}
      <section aria-label="Rating">
        <h3 className={headingClass}>Rating</h3>
        <div className="flex gap-2">
          {RATING_OPTIONS.map((o) => (
            <button
              key={o.value}
              type="button"
              onClick={() => patch({ minRating: o.value })}
              className={`text-sm px-3 py-1.5 rounded-full border ${
                (filters.minRating || 0) === o.value
                  ? 'bg-indigo-600 border-indigo-600 text-white'
                  : 'border-slate-300 text-slate-600 hover:bg-slate-100'
              }`}
              aria-pressed={(filters.minRating || 0) === o.value}
            >
              {o.label}
            </button>
          ))}
        </div>
      </section>

      {/* Availability */}
      <section aria-label="Availability">
        <h3 className={headingClass}>Availability</h3>
        <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
          <input
            type="checkbox"
            className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            checked={!!filters.inStock}
            onChange={(e) => patch({ inStock: e.target.checked })}
          />
          In stock only
        </label>
      </section>

      {/* Size */}
      {sizes.length > 0 && (
        <section aria-label="Size">
          <h3 className={headingClass}>Size</h3>
          <div className="flex flex-wrap gap-2">
            {sizes.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => patch({ size: filters.size === s ? '' : s })}
                className={`text-sm px-3 py-1.5 rounded-lg border ${
                  filters.size === s
                    ? 'bg-indigo-600 border-indigo-600 text-white'
                    : 'border-slate-300 text-slate-600 hover:bg-slate-100'
                }`}
                aria-pressed={filters.size === s}
              >
                {s}
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Color */}
      {colors.length > 0 && (
        <section aria-label="Color">
          <h3 className={headingClass}>Color</h3>
          <div className="flex flex-wrap gap-2">
            {colors.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => patch({ color: filters.color === c ? '' : c })}
                className={`text-sm px-3 py-1.5 rounded-lg border ${
                  filters.color === c
                    ? 'bg-indigo-600 border-indigo-600 text-white'
                    : 'border-slate-300 text-slate-600 hover:bg-slate-100'
                }`}
                aria-pressed={filters.color === c}
              >
                {c}
              </button>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
