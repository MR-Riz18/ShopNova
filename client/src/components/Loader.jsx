export default function Loader({ text = 'Loading...', fullPage = false }) {
  const spinner = (
    <div className="flex items-center gap-3 text-slate-600" role="status" aria-live="polite">
      <svg
        className="w-6 h-6 text-indigo-600 animate-spin"
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
      >
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path
          className="opacity-90"
          fill="currentColor"
          d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 0 1 4 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
      <span className="text-sm font-medium">{text}</span>
    </div>
  );

  if (fullPage) {
    return <div className="min-h-[60vh] flex items-center justify-center">{spinner}</div>;
  }
  return spinner;
}
