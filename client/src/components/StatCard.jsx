export default function StatCard({ title, value, icon, delta, sub }) {
  const positive = typeof delta === 'string' ? delta.trim().startsWith('+') : delta > 0;
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-500">{title}</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{value}</p>
        </div>
        {icon && (
          <div className="w-11 h-11 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
            {icon}
          </div>
        )}
      </div>
      {(delta || sub) && (
        <p className="mt-2 text-xs">
          {delta && (
            <span className={`font-semibold ${positive ? 'text-emerald-600' : 'text-red-600'}`}>{delta}</span>
          )}
          {sub && <span className="text-slate-500"> {sub}</span>}
        </p>
      )}
    </div>
  );
}
