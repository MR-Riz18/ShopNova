const usd = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
});

/** Format a number as USD, e.g. 29.99 -> "$29.99" */
export const formatPrice = (n) => usd.format(Number(n) || 0);

/** Format a date as "Oct 14, 2026" */
export const formatDate = (d) => {
  if (!d) return '—';
  const date = d instanceof Date ? d : new Date(d);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

/** Format a date+time as "Oct 14, 2026, 2:30 PM" */
export const formatDateTime = (d) => {
  if (!d) return '—';
  const date = d instanceof Date ? d : new Date(d);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};

const PLACEHOLDER_IMG =
  "data:image/svg+xml;charset=UTF-8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800" viewBox="0 0 800 800">
      <rect width="800" height="800" fill="#e2e8f0"/>
      <g fill="none" stroke="#94a3b8" stroke-width="32" stroke-linecap="round" stroke-linejoin="round">
        <path d="M176 304l68-68a48 48 0 0 1 68 0l188 188a48 48 0 0 1 0 68l-68 68a48 48 0 0 1-68 0L176 372a48 48 0 0 1 0-68z"/>
        <circle cx="280" cy="280" r="40"/>
      </g>
      <text x="400" y="640" text-anchor="middle" font-family="sans-serif" font-size="40" fill="#64748b">No image</text>
    </svg>`
  );

/**
 * Resolve an image path: absolute http(s) URLs and root-relative paths pass
 * through unchanged, anything else gets prefixed with '/'. Falsy values fall
 * back to an inline SVG placeholder.
 */
export const imgUrl = (p) => {
  if (!p) return PLACEHOLDER_IMG;
  if (typeof p !== 'string') return PLACEHOLDER_IMG;
  if (p.startsWith('http://') || p.startsWith('https://') || p.startsWith('/')) {
    return p;
  }
  return `/${p}`;
};

/** Join class names, dropping falsy values */
export const cx = (...classes) => classes.filter(Boolean).join(' ');

/** Discount percentage from originalPrice -> price, rounded. 0 when none. */
export const calcDiscountPct = (product) => {
  if (!product || !product.originalPrice || product.originalPrice <= product.price) {
    return 0;
  }
  return Math.round(
    ((product.originalPrice - product.price) / product.originalPrice) * 100
  );
};
