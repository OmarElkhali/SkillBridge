
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

/* ── Color palette ── */
const COLORS = ["#E67E22", "#D35400", "#F39C12", "#E74C3C", "#2ECC71", "#3498DB", "#9B59B6", "#1ABC9C", "#34495E", "#E91E63"];
const DONUT_COLORS = ["#E67E22", "#F39C12", "#D35400", "#E74C3C", "#2ECC71", "#3498DB", "#9B59B6", "#1ABC9C"];

/* ── Types ── */
interface MetricItem { name: string; count: number }
interface KeywordItem { keyword: string; count: number }


/* ── Horizontal Bar Chart ── */
export function HorizontalBarChart({ data, title, color = "#E67E22" }: { data: MetricItem[]; title: string; color?: string }) {
  const items = data.slice(0, 8);
  if (!items.length) return <EmptyChart title={title} />;
  return (
    <div className="rounded-[1.5rem] border border-[var(--line-soft)] bg-white/80 p-5 shadow-sm">
      <h4 className="text-sm font-bold text-[var(--color-text-strong)] mb-1">{title}</h4>
      <p className="text-[0.65rem] text-[var(--color-text-muted)] mb-4">By number of courses</p>
      <ResponsiveContainer width="100%" height={items.length * 38 + 10}>
        <BarChart data={items} layout="vertical" margin={{ top: 0, right: 40, left: 0, bottom: 0 }}>
          <XAxis type="number" hide />
          <YAxis type="category" dataKey="name" width={130} tick={{ fontSize: 11, fill: "#6f5b54" }} axisLine={false} tickLine={false} />
          <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid rgba(230,126,34,0.2)", fontSize: 12 }} />
          <Bar dataKey="count" fill={color} radius={[0, 6, 6, 0]} barSize={18} label={{ position: "right", fontSize: 11, fill: "#3E2723", fontWeight: 700 }} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/* ── Donut Chart ── */
export function DonutChart({ data, title, subtitle, centerLabel, centerValue }: {
  data: { name: string; value: number }[];
  title: string;
  subtitle?: string;
  centerLabel?: string;
  centerValue?: string;
}) {
  if (!data.length) return <EmptyChart title={title} />;
  return (
    <div className="rounded-[1.5rem] border border-[var(--line-soft)] bg-white/80 p-5 shadow-sm flex flex-col items-center">
      <h4 className="text-sm font-bold text-[var(--color-text-strong)] self-start mb-1">{title}</h4>
      {subtitle && <p className="text-[0.65rem] text-[var(--color-text-muted)] self-start mb-3">{subtitle}</p>}
      <div className="relative">
        <ResponsiveContainer width={220} height={220}>
          <PieChart>
            <Pie data={data} cx="50%" cy="50%" innerRadius={65} outerRadius={95} paddingAngle={3} dataKey="value" stroke="none">
              {data.map((_, i) => <Cell key={i} fill={DONUT_COLORS[i % DONUT_COLORS.length]} />)}
            </Pie>
            <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid rgba(230,126,34,0.2)", fontSize: 12 }} />
          </PieChart>
        </ResponsiveContainer>
        {centerValue && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-2xl font-bold text-[var(--color-text-strong)]">{centerValue}</span>
            {centerLabel && <span className="text-[0.6rem] text-[var(--color-text-muted)] uppercase tracking-wider">{centerLabel}</span>}
          </div>
        )}
      </div>
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 justify-center">
        {data.map((d, i) => (
          <div key={d.name} className="flex items-center gap-1.5 text-[0.7rem]">
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: DONUT_COLORS[i % DONUT_COLORS.length] }} />
            <span className="text-[var(--color-text-muted)]">{d.name}</span>
            <span className="font-bold text-[var(--color-text-strong)]">{d.value.toLocaleString()}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Area/Line Chart ── */
export function EventsAreaChart({ data, title, subtitle }: {
  data: { label: string; value: number }[];
  title: string;
  subtitle?: string;
}) {
  if (!data.length) return <EmptyChart title={title} />;
  return (
    <div className="rounded-[1.5rem] border border-[var(--line-soft)] bg-white/80 p-5 shadow-sm">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h4 className="text-sm font-bold text-[var(--color-text-strong)]">{title}</h4>
          {subtitle && <p className="text-[0.65rem] text-[var(--color-text-muted)]">{subtitle}</p>}
        </div>
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="eventGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#E67E22" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#E67E22" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(62,39,35,0.06)" />
          <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#8D6E63" }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 10, fill: "#8D6E63" }} axisLine={false} tickLine={false} />
          <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid rgba(230,126,34,0.2)", fontSize: 12 }} />
          <Area type="monotone" dataKey="value" stroke="#E67E22" strokeWidth={2.5} fill="url(#eventGrad)" dot={{ r: 4, fill: "#E67E22", strokeWidth: 2, stroke: "#fff" }} activeDot={{ r: 6 }} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

/* ── Vertical Bar Chart (Progress Distribution) ── */
export function ProgressBarChart({ data, title, subtitle }: {
  data: { name: string; value: number }[];
  title: string;
  subtitle?: string;
}) {
  if (!data.length) return <EmptyChart title={title} />;
  return (
    <div className="rounded-[1.5rem] border border-[var(--line-soft)] bg-white/80 p-5 shadow-sm">
      <h4 className="text-sm font-bold text-[var(--color-text-strong)] mb-1">{title}</h4>
      {subtitle && <p className="text-[0.65rem] text-[var(--color-text-muted)] mb-4">{subtitle}</p>}
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(62,39,35,0.06)" vertical={false} />
          <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#8D6E63" }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 10, fill: "#8D6E63" }} axisLine={false} tickLine={false} />
          <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid rgba(230,126,34,0.2)", fontSize: 12 }} />
          <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={36}>
            {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/* ── Word Cloud ── */
export function WordCloud({ keywords, title, subtitle }: {
  keywords: KeywordItem[];
  title: string;
  subtitle?: string;
}) {
  const items = keywords.slice(0, 30);
  const max = Math.max(...items.map(k => k.count), 1);
  if (!items.length) return <EmptyChart title={title} />;
  return (
    <div className="rounded-[1.5rem] border border-[var(--line-soft)] bg-white/80 p-5 shadow-sm">
      <h4 className="text-sm font-bold text-[var(--color-text-strong)] mb-1">{title}</h4>
      {subtitle && <p className="text-[0.65rem] text-[var(--color-text-muted)] mb-4">{subtitle}</p>}
      <div className="flex flex-wrap gap-2 items-center justify-center min-h-[160px] py-3">
        {items.map((kw, i) => {
          const ratio = kw.count / max;
          const size = 0.7 + ratio * 1.6;
          return (
            <span
              key={kw.keyword}
              className="inline-block px-1 py-0.5 font-bold transition-transform hover:scale-110 cursor-default"
              style={{
                fontSize: `${size}rem`,
                color: COLORS[i % COLORS.length],
                opacity: 0.7 + ratio * 0.3,
              }}
              title={`${kw.keyword}: ${kw.count}`}
            >
              {kw.keyword}
            </span>
          );
        })}
      </div>
    </div>
  );
}

/* ── KPI Stat Card ── */
export function KpiCard({ label, value, icon, trend }: {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  trend?: { value: number; positive: boolean };
}) {
  return (
    <div className="group rounded-[1.25rem] border border-[var(--line-soft)] bg-white/85 p-4 shadow-[0_4px_20px_rgba(62,39,35,0.04)] backdrop-blur-xl transition-all hover:border-[var(--accent-border)] hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-center gap-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[var(--accent-wash)] text-[var(--color-accent)] transition-colors group-hover:bg-[var(--accent-wash-strong)]">
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.15em] text-[var(--color-text-muted)]">{label}</p>
          <p className="text-2xl font-bold text-[var(--color-text-strong)] font-['Fraunces',_'Source_Serif_4',_Georgia,_serif]">
            {typeof value === "number" ? value.toLocaleString() : value}
          </p>
        </div>
      </div>
      {trend && (
        <p className={`mt-2 text-[0.65rem] font-semibold ${trend.positive ? "text-emerald-600" : "text-red-500"}`}>
          {trend.positive ? "▲" : "▼"} {Math.abs(trend.value)}% vs last 7 days
        </p>
      )}
    </div>
  );
}

/* ── Pipeline Health Diagram ── */
export function PipelineDiagram({ nodes, components }: {
  nodes: string[];
  components: Record<string, unknown>[];
}) {
  if (!nodes.length) return null;

  const iconMap: Record<string, string> = {
    flume: "🔄", hdfs: "💾", hive: "🐝", mapreduce: "⚙️", hbase: "🗄️",
    namenode: "🖥️", datanode: "💿", spark: "⚡",
  };

  const statusColor = (status: string) => {
    const s = status?.toUpperCase() || "";
    if (s === "OK" || s === "ACTIVE" || s === "HEALTHY" || s === "SUCCESS") return "border-emerald-300 bg-emerald-50 text-emerald-700";
    if (s.includes("WARN") || s.includes("STALE")) return "border-amber-300 bg-amber-50 text-amber-700";
    return "border-red-200 bg-red-50 text-red-600";
  };

  return (
    <div className="rounded-[1.5rem] border border-[var(--line-soft)] bg-white/80 p-5 shadow-sm">
      <h4 className="text-sm font-bold text-[var(--color-text-strong)] mb-1">Pipeline Health</h4>
      <p className="text-[0.65rem] text-[var(--color-text-muted)] mb-5">Status of Big Data pipeline components</p>
      <div className="flex flex-wrap items-center justify-center gap-2">
        {nodes.map((node, i) => {
          const comp = components.find((c: any) => {
            const n = String(c.name || "").toLowerCase();
            return n === node.toLowerCase() || n.includes(node.toLowerCase());
          }) as Record<string, unknown> | undefined;
          const status = String(comp?.status || "OK");
          const icon = iconMap[node.toLowerCase()] || "📦";
          return (
            <div key={node} className="flex items-center gap-2">
              <div className={`flex flex-col items-center gap-1.5 rounded-2xl border-2 px-4 py-3 min-w-[80px] transition-all hover:scale-105 ${statusColor(status)}`}>
                <span className="text-2xl">{icon}</span>
                <span className="text-[0.7rem] font-bold">{node}</span>
                <span className="text-[0.55rem] font-semibold uppercase tracking-wider">{status}</span>
              </div>
              {i < nodes.length - 1 && (
                <span className="text-[var(--color-accent)] text-lg font-bold">→</span>
              )}
            </div>
          );
        })}
      </div>
      <p className="mt-4 text-[0.6rem] text-emerald-600 font-semibold flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        Last update: just now
      </p>
    </div>
  );
}

/* ── Empty placeholder ── */
function EmptyChart({ title }: { title: string }) {
  return (
    <div className="rounded-[1.5rem] border border-dashed border-[var(--line)] bg-white/50 p-6 text-center">
      <p className="text-sm font-bold text-[var(--color-text-muted)]">{title}</p>
      <p className="mt-2 text-xs text-[var(--color-text-muted)]">No data available yet. Run the pipeline to generate data.</p>
    </div>
  );
}
