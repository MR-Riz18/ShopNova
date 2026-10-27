export default function Pagination({ page, totalPages, pages: pagesAlias, onChange, onPageChange }) {
  const total = totalPages ?? pagesAlias ?? 1;
  const handleChange = onChange ?? onPageChange;
  if (total <= 1) return null;

  const go = (p) => {
    const next = Math.min(Math.max(1, p), total);
    if (next !== page) {
      handleChange?.(next);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Windowed page numbers: 1 … p-1 p p+1 … N
  const pages = [];
  const windowed = new Set([1, total, page - 1, page, page + 1]);
  const sorted = [...windowed].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
  let prev = 0;
  for (const p of sorted) {
    if (p - prev > 1) pages.push('ellipsis');
    pages.push(p);
    prev = p;
  }

  const btnBase =
    'min-w-[2.5rem] h-10 px-3 inline-flex items-center justify-center rounded-lg text-sm font-medium border transition-colors disabled:opacity-40 disabled:cursor-not-allowed';

  return (
    <nav aria-label="Pagination" className="flex items-center justify-center gap-2 mt-8">
      <button
        type="button"
        onClick={() => go(page - 1)}
        disabled={page <= 1}
        className={`${btnBase} border-slate-300 text-slate-700 hover:bg-slate-100`}
        aria-label="Previous page"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      {pages.map((p, i) =>
        p === 'ellipsis' ? (
          <span key={`e-${i}`} className="px-1 text-slate-400" aria-hidden="true">
            …
          </span>
        ) : (
          <button
            key={p}
            type="button"
            onClick={() => go(p)}
            aria-current={p === page ? 'page' : undefined}
            className={
              p === page
                ? `${btnBase} bg-indigo-600 border-indigo-600 text-white`
                : `${btnBase} border-slate-300 text-slate-700 hover:bg-slate-100`
            }
          >
            {p}
          </button>
        )
      )}

      <button
        type="button"
        onClick={() => go(page + 1)}
        disabled={page >= total}
        className={`${btnBase} border-slate-300 text-slate-700 hover:bg-slate-100`}
        aria-label="Next page"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </nav>
  );
}
