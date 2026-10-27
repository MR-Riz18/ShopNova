// Pure-SVG chart: bar, line, or donut. No dependencies.
const PALETTE = ['#4f46e5', '#8b5cf6', '#10b981', '#f59e0b', '#f43f5e', '#06b6d4'];

export default function Chart({ type = 'bar', data = [], height = 260, formatValue = (v) => v }) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center text-slate-400 text-sm" style={{ height }}>
        No data
      </div>
    );
  }

  const W = 600;
  const H = 300;

  if (type === 'line') return <LineChart data={data} height={height} formatValue={formatValue} W={W} H={H} />;
  if (type === 'donut') return <DonutChart data={data} height={height} formatValue={formatValue} W={W} H={H} />;
  return <BarChart data={data} height={height} formatValue={formatValue} W={W} H={H} />;
}

function BarChart({ data, height, formatValue, W, H }) {
  const padding = 36;
  const max = Math.max(...data.map((d) => d.value), 1);
  const n = data.length;
  const slot = (W - padding * 2) / n;
  const barW = Math.min(slot * 0.6, 48);

  return (
    <div style={{ height }} className="w-full">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-full" role="img" aria-label="Bar chart">
        {[0, 0.5, 1].map((t) => {
          const y = padding + (1 - t) * (H - padding * 2);
          return (
            <g key={t}>
              <line x1={padding} y1={y} x2={W - padding} y2={y} stroke="#e2e8f0" strokeWidth="1" />
              <text x={padding - 8} y={y + 4} textAnchor="end" fontSize="10" fill="#94a3b8">
                {formatValue(max * t)}
              </text>
            </g>
          );
        })}
        {data.map((d, i) => {
          const h = (d.value / max) * (H - padding * 2);
          const x = padding + slot * i + (slot - barW) / 2;
          const y = H - padding - h;
          return (
            <g key={i}>
              <title>{`${d.label}: ${formatValue(d.value)}`}</title>
              <rect x={x} y={y} width={barW} height={Math.max(h, 2)} rx="4" fill={PALETTE[i % PALETTE.length]} />
              <text
                x={x + barW / 2}
                y={H - padding + 16}
                textAnchor="end"
                fontSize="11"
                fill="#64748b"
                transform={`rotate(${n > 8 ? -30 : 0} ${x + barW / 2} ${H - padding + 16})`}
              >
                {d.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function LineChart({ data, height, formatValue, W, H }) {
  const padding = 36;
  const max = Math.max(...data.map((d) => d.value), 1);
  const n = data.length;
  const x = (i) => (n === 1 ? W / 2 : padding + (i / (n - 1)) * (W - padding * 2));
  const y = (v) => padding + (1 - v / max) * (H - padding * 2);

  const points = data.map((d, i) => `${x(i)},${y(d.value)}`).join(' ');
  const area = `${padding},${H - padding} ${points} ${x(n - 1)},${H - padding}`;

  return (
    <div style={{ height }} className="w-full">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-full" role="img" aria-label="Line chart">
        <defs>
          <linearGradient id="chart-area" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#4f46e5" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0, 0.5, 1].map((t) => {
          const gy = padding + (1 - t) * (H - padding * 2);
          return (
            <g key={t}>
              <line x1={padding} y1={gy} x2={W - padding} y2={gy} stroke="#e2e8f0" strokeWidth="1" />
              <text x={padding - 8} y={gy + 4} textAnchor="end" fontSize="10" fill="#94a3b8">
                {formatValue(max * t)}
              </text>
            </g>
          );
        })}
        <polygon points={area} fill="url(#chart-area)" />
        <polyline points={points} fill="none" stroke="#4f46e5" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
        {data.map((d, i) => (
          <g key={i}>
            <title>{`${d.label}: ${formatValue(d.value)}`}</title>
            <circle cx={x(i)} cy={y(d.value)} r="4" fill="#fff" stroke="#4f46e5" strokeWidth="2.5" />
          </g>
        ))}
      </svg>
    </div>
  );
}

function DonutChart({ data, height, formatValue, W, H }) {
  const total = data.reduce((sum, d) => sum + d.value, 0) || 1;
  const cx = W / 2;
  const cy = H / 2;
  const r = 90;
  const sw = 34;
  const C = 2 * Math.PI * r;
  let offset = 0;

  const segments = data.map((d, i) => {
    const frac = d.value / total;
    const seg = (
      <g key={i}>
        <title>{`${d.label}: ${formatValue(d.value)}`}</title>
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke={PALETTE[i % PALETTE.length]}
          strokeWidth={sw}
          strokeDasharray={`${frac * C} ${C}`}
          strokeDashoffset={-offset * C}
          transform={`rotate(-90 ${cx} ${cy})`}
        />
      </g>
    );
    offset += frac;
    return seg;
  });

  return (
    <div style={{ height }} className="w-full flex items-center justify-center gap-6">
      <svg viewBox={`0 0 ${W} ${H}`} className="h-full" role="img" aria-label="Donut chart" style={{ maxWidth: '55%' }}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f1f5f9" strokeWidth={sw} />
        {segments}
        <text x={cx} y={cy - 6} textAnchor="middle" fontSize="16" fill="#94a3b8">
          Total
        </text>
        <text x={cx} y={cy + 20} textAnchor="middle" fontSize="24" fontWeight="700" fill="#0f172a">
          {formatValue(total)}
        </text>
      </svg>
      <ul className="space-y-2 shrink-0">
        {data.map((d, i) => (
          <li key={i} className="flex items-center gap-2 text-sm text-slate-600">
            <span
              className="w-3 h-3 rounded-full shrink-0"
              style={{ backgroundColor: PALETTE[i % PALETTE.length] }}
              aria-hidden="true"
            />
            <span>{d.label}</span>
            <span className="font-semibold text-slate-900 ml-auto pl-3">{formatValue(d.value)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
