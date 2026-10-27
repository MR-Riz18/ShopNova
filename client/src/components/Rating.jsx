import { cx } from '../utils/format';

export default function Rating({ value = 0, count, size = 'sm', showCount = true }) {
  const rounded = Math.round(Number(value) || 0);
  const starSize =
    size === 'lg' ? 'w-5 h-5' : size === 'md' ? 'w-4 h-4' : 'w-3.5 h-3.5';

  return (
    <div
      className="flex items-center gap-1.5"
      role="img"
      aria-label={`Rated ${value} out of 5 stars`}
    >
      <div className="flex items-center gap-0.5">
        {[0, 1, 2, 3, 4].map((i) => (
          <svg
            key={i}
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
            className={cx(starSize, i < rounded ? 'text-amber-400' : 'text-slate-300')}
          >
            <path d="M10 1.5l2.6 5.3 5.9.9-4.2 4.1 1 5.8L10 14.9l-5.3 2.7 1-5.8L1.5 7.7l5.9-.9L10 1.5z" />
          </svg>
        ))}
      </div>
      {showCount && typeof count === 'number' && (
        <span className="text-xs text-slate-500">({count})</span>
      )}
    </div>
  );
}
