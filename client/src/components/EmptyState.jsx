import { Link } from 'react-router-dom';

export default function EmptyState({ title, message, actionText, actionTo, action, icon }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-4">
      {icon && (
        <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-4">
          {icon}
        </div>
      )}
      <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
      {message && <p className="mt-2 text-slate-500 max-w-sm">{message}</p>}
      {actionText && actionTo && (
        <Link to={actionTo} className="btn-primary mt-6">
          {actionText}
        </Link>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
