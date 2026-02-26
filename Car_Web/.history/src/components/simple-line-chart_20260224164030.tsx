type Point = {
  label: string;
  value: number;
};

type SimpleLineChartProps = {
  title: string;
  points: Point[];
  colorClass?: string;
};

export function SimpleLineChart({
  title,
  points,
  colorClass = "stroke-blue-600",
}: SimpleLineChartProps) {
  const width = 600;
  const height = 220;
  const padding = 24;

  const max = Math.max(...points.map((point) => point.value));
  const min = Math.min(...points.map((point) => point.value));
  const range = Math.max(1, max - min);

  const chartPoints = points
    .map((point, index) => {
      const x = padding + (index * (width - padding * 2)) / Math.max(points.length - 1, 1);
      const y = height - padding - ((point.value - min) / range) * (height - padding * 2);
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="mb-3 text-base font-semibold">{title}</h3>
      <svg viewBox={`0 0 ${width} ${height}`} className="h-56 w-full">
        <line
          x1={padding}
          y1={height - padding}
          x2={width - padding}
          y2={height - padding}
          className="stroke-slate-300"
          strokeWidth="1"
        />
        <line
          x1={padding}
          y1={padding}
          x2={padding}
          y2={height - padding}
          className="stroke-slate-300"
          strokeWidth="1"
        />
        <polyline
          fill="none"
          points={chartPoints}
          className={colorClass}
          strokeWidth="2.5"
        />
      </svg>
      <div className="mt-2 grid grid-cols-6 gap-2 text-xs text-slate-500">
        {points.map((point) => (
          <span key={point.label}>{point.label}</span>
        ))}
      </div>
    </section>
  );
}
