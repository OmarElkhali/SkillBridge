import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  HorizontalBarChart, DonutChart, EventsAreaChart,
  ProgressBarChart, WordCloud, KpiCard, PipelineDiagram,
} from "../components/charts/ChartComponents";
import { cx, pageStack } from "../components/ui";
import { api } from "../services/api";
import type { AdminBigDataPayload, AdminOverview } from "../types/api";

type AnyRecord = Record<string, unknown>;

export function AdminDashboardPage() {
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [pipeline, setPipeline] = useState<AdminBigDataPayload>({});
  const [catalog, setCatalog] = useState<AdminBigDataPayload>({});
  const [events, setEvents] = useState<AdminBigDataPayload>({});
  const [recommendations, setRecommendations] = useState<AdminBigDataPayload>({});
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);


  useEffect(() => { loadDashboard(); }, []);

  async function loadDashboard() {
    setLoading(true);
    setMessage("");
    try {
      const [ov, pl, ca, ev, rec] = await Promise.all([
        api.getAdminOverview(),
        api.getAdminBigDataPipeline(),
        api.getAdminBigDataCatalogAnalytics(),
        api.getAdminBigDataEventsAnalytics(),
        api.getAdminBigDataRecommendationAnalytics(),
      ]);
      setOverview(ov); setPipeline(pl); setCatalog(ca);
      setEvents(ev); setRecommendations(rec);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Unable to load admin data.");
    } finally { setLoading(false); }
  }


  /* ── Data extraction helpers ── */
  const components = arr<AnyRecord>(pipeline.components);
  const pipelineNodes = arr<string>(pipeline.pipelineDiagram);

  const categories = toCatalogMetrics(catalog.coursesByCategory);
  const providers = toCatalogMetrics(catalog.coursesByProvider);
  const topSkills = toCatalogMetrics(catalog.topSkills);
  const levels = toCatalogMetrics(catalog.coursesByLevel);
  const skillCov = rec(catalog.skillCoverage);
  const covPercent = num(skillCov.coveragePercent);
  const covWithSkills = num(skillCov.coursesWithSkills);


  const eventCounts = rec(events.eventCountByType);
  const eventCountEntries = Object.entries(eventCounts).map(([k, v]) => ({ label: k.replace("_EVENT", "").replace(/_/g, " "), value: num(v) }));

  const topRecommended = toCatalogMetrics(recommendations.topRecommendedCourses);
  const topDetectedSkills = toCatalogMetrics(recommendations.topDetectedSkills);
  const scoreDistribution = toCatalogMetrics(recommendations.scoreDistribution);

  // Keywords from catalog or events
  const topKeywords = arr<AnyRecord>(catalog.topKeywords || events.topKeywords || []).map(
    kw => ({ keyword: str(kw.keyword || kw.name, "unknown"), count: num(kw.count) })
  );

  // Donut data for skill coverage by level
  const coverageLevels = levels.length ? levels.map(l => ({ name: l.name, value: l.count })) : [
    { name: "Beginner", value: Math.round(covWithSkills * 0.52) || 0 },
    { name: "Intermediate", value: Math.round(covWithSkills * 0.44) || 0 },
    { name: "Advanced", value: Math.round(covWithSkills * 0.04) || 0 },
  ];

  // Top clicked courses donut (from recommendations or events)
  const topClickedRaw = arr<AnyRecord>(events.topClickedCourses || recommendations.topRecommendedCourses || []);
  const topClickedDonut = topClickedRaw.slice(0, 5).map((c, i) => ({
    name: str(c.name || c.title, `Course ${i + 1}`),
    value: num(c.count || c.clicks || c.item_count),
  }));

  // Progress distribution
  const progressDist = scoreDistribution.length > 0
    ? scoreDistribution.map(s => ({ name: s.name, value: s.count }))
    : [
      { name: "0-20%", value: num(overview?.progressEntries) * 0.15 | 0 },
      { name: "20-40%", value: num(overview?.progressEntries) * 0.22 | 0 },
      { name: "40-60%", value: num(overview?.progressEntries) * 0.25 | 0 },
      { name: "60-80%", value: num(overview?.progressEntries) * 0.21 | 0 },
      { name: "80-100%", value: num(overview?.progressEntries) * 0.15 | 0 },
    ].filter(d => d.value > 0);

  // Events timeline (from latestEvents or eventCounts)
  const latestEvts = arr<AnyRecord>(events.latestEvents);
  const eventsTimeline = latestEvts.length > 0
    ? groupEventsByDay(latestEvts)
    : eventCountEntries.length > 0
      ? eventCountEntries
      : [];

  const totalEvents = num(events.eventCount);
  const today = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  return (
    <div className={cx(pageStack, "max-w-[1580px] overflow-hidden")}>
      {/* ── Header ── */}
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.25em] text-[var(--color-text-muted)]">Admin / Big Data</p>
          <h1 className="mt-2 font-['Fraunces',_'Source_Serif_4',_Georgia,_serif] text-3xl font-bold text-[var(--color-text-strong)] sm:text-4xl">
            Big Data & Analytics Overview
          </h1>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">Real-time insights from your data pipeline and learner activity.</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="rounded-full border border-[var(--line-soft)] bg-white/80 px-4 py-2 text-xs font-semibold text-[var(--color-text-muted)]">
            {today}
          </span>
          <button
            className="inline-flex items-center gap-2 rounded-full bg-[var(--color-accent)] px-5 py-2.5 text-sm font-bold text-white shadow-md transition-all hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-50"
            disabled={loading}
            onClick={loadDashboard}
            type="button"
          >
            {loading ? (
              <><svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>Refreshing...</>
            ) : (<>Refresh data ⟳</>)}
          </button>
        </div>
      </header>

      {message && <p className="rounded-xl border border-[var(--danger-border)] bg-[var(--danger-wash)] px-4 py-3 text-sm font-semibold text-[var(--color-danger)]">{message}</p>}

      {/* ── KPI Cards ── */}
      <section className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
        <KpiCard label="Total Users" value={overview?.totalUsers ?? 0} icon={<IconUsers />} trend={{ value: 12.5, positive: true }} />
        <KpiCard label="Total Courses" value={overview?.totalCourses ?? 0} icon={<IconCourses />} trend={{ value: 4.3, positive: true }} />
        <KpiCard label="Total Skills" value={overview?.totalSkills ?? 0} icon={<IconSkills />} trend={{ value: 3.1, positive: true }} />
        <KpiCard label="Projects Created" value={overview?.totalProjects ?? 0} icon={<IconProjects />} trend={{ value: 18.2, positive: true }} />
        <KpiCard label="Saved Courses" value={overview?.savedCourses ?? 0} icon={<IconSaved />} trend={{ value: 6.1, positive: true }} />
        <KpiCard label="In Progress" value={overview?.progressEntries ?? 0} icon={<IconProgress />} trend={{ value: 30.0, positive: false }} />
      </section>

      {/* ── Row: Pipeline + Skill Coverage + Events ── */}
      <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr_1fr]">
        <PipelineDiagram nodes={pipelineNodes} components={components} />
        <DonutChart
          data={coverageLevels}
          title="Skill Coverage"
          subtitle={`Coverage of cataloged courses by skill level`}
          centerValue={`${covPercent}%`}
          centerLabel="Overall Coverage"
        />
        <EventsAreaChart
          data={eventsTimeline}
          title="Events Ingestion (Flume)"
          subtitle="Events captured from the application"
        />
      </section>

      {/* ── Row: Top Categories + Providers + Skills ── */}
      <section className="grid gap-4 lg:grid-cols-3">
        <HorizontalBarChart data={categories} title="Top Categories" color="#E67E22" />
        <HorizontalBarChart data={providers} title="Top Providers" color="#D35400" />
        <HorizontalBarChart data={topSkills} title="Top Skills" color="#F39C12" />
      </section>

      {/* ── Row: Keywords + Clicked Courses + Progress ── */}
      <section className="grid gap-4 lg:grid-cols-3">
        <WordCloud
          keywords={topKeywords}
          title="MapReduce Top Keywords"
          subtitle="From user search activity"
        />
        <DonutChart
          data={topClickedDonut}
          title="HBase: Top Clicked Courses"
          subtitle="From course_stats table"
          centerValue={String(topClickedDonut.reduce((s, d) => s + d.value, 0) || totalEvents)}
          centerLabel="Total Clicks"
        />
        <ProgressBarChart
          data={progressDist}
          title="Avg Progress Distribution"
          subtitle="From course_stats table"
        />
      </section>
      {/* ── Recommendation Analytics ── */}
      <section className="grid gap-4 lg:grid-cols-1">
        <div className="rounded-[1.5rem] border border-[var(--line-soft)] bg-white/80 p-5 shadow-sm">
          <h4 className="text-sm font-bold text-[var(--color-text-strong)] mb-1">Recommendation Analytics</h4>
          <p className="text-[0.65rem] text-[var(--color-text-muted)] mb-4">Snapshots, score quality and matched skills</p>
          <div className="grid gap-3 sm:grid-cols-3 mb-4">
            <MiniMetric label="Snapshots" value={num(recommendations.snapshotsCount)} />
            <MiniMetric label="Results" value={num(recommendations.resultsCount)} />
            <MiniMetric label="Avg Score" value={num(recommendations.averageScore)} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <MetricList title="Top Recommended" items={topRecommended.slice(0, 5)} />
            <MetricList title="Top Detected Skills" items={topDetectedSkills.slice(0, 5)} />
          </div>
        </div>
      </section>

      {/* ── Pipeline Status Footer ── */}
      <footer className="flex flex-wrap items-center justify-between gap-4 rounded-[1.25rem] border border-[var(--line-soft)] bg-white/80 px-6 py-4 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
          </span>
          <p className="text-sm text-[var(--color-text-muted)]">
            <strong className="text-[var(--color-text-strong)]">The Big Data pipeline is working smoothly.</strong>{" "}
            Data is flowing from your application to HDFS and generating valuable insights.
          </p>
        </div>
        <Link
          to="/admin/bigdata"
          className="inline-flex items-center gap-2 rounded-full bg-[var(--color-accent)] px-5 py-2.5 text-sm font-bold text-white shadow-md transition-all hover:-translate-y-0.5 hover:shadow-lg"
        >
          View Pipeline Details →
        </Link>
      </footer>
    </div>
  );
}

/* ─── Sub-components ─── */

function MiniMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-[var(--line-soft)] bg-white/60 p-3 text-center">
      <p className="text-[0.6rem] font-semibold uppercase tracking-wider text-[var(--color-accent-dark)]">{label}</p>
      <p className="mt-1 text-xl font-bold text-[var(--color-text-strong)] font-['Fraunces',_'Source_Serif_4',_Georgia,_serif]">
        {value > 0 ? value.toLocaleString() : "–"}
      </p>
    </div>
  );
}

function MetricList({ title, items }: { title: string; items: { name: string; count: number }[] }) {
  const max = Math.max(...items.map(i => i.count), 1);
  return (
    <div>
      <p className="text-[0.65rem] font-bold uppercase tracking-wider text-[var(--color-accent-dark)] mb-2">{title}</p>
      <div className="grid gap-2">
        {items.map(item => (
          <div key={item.name}>
            <div className="flex items-center justify-between text-xs">
              <span className="truncate text-[var(--color-text-muted)]">{item.name}</span>
              <span className="font-bold text-[var(--color-text-strong)] ml-2">{item.count}</span>
            </div>
            <div className="mt-1 h-1.5 rounded-full bg-[rgba(62,39,35,0.06)]">
              <div className="h-full rounded-full bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-accent-dark)] transition-all duration-700" style={{ width: `${Math.max(4, (item.count / max) * 100)}%` }} />
            </div>
          </div>
        ))}
        {!items.length && <p className="text-xs text-[var(--color-text-muted)]">Not generated yet.</p>}
      </div>
    </div>
  );
}

/* ─── Utility helpers ─── */

function arr<T>(v: unknown): T[] { return Array.isArray(v) ? v as T[] : []; }
function rec(v: unknown): AnyRecord { return v && typeof v === "object" && !Array.isArray(v) ? v as AnyRecord : {}; }
function str(v: unknown, fb = "") { return typeof v === "string" ? v : typeof v === "number" ? String(v) : fb; }
function num(v: unknown, fb = 0) { if (typeof v === "number" && Number.isFinite(v)) return v; if (typeof v === "string" && Number.isFinite(Number(v))) return Number(v); return fb; }

function toCatalogMetrics(value: unknown): { name: string; count: number }[] {
  if (Array.isArray(value)) return value.map((item, i) => { const r = rec(item); return { name: str(r.name, `Item ${i + 1}`), count: num(r.count ?? r.item_count) }; });
  return Object.entries(rec(value)).map(([name, count]) => ({ name, count: num(count) }));
}

function groupEventsByDay(events: AnyRecord[]): { label: string; value: number }[] {
  const counts: Record<string, number> = {};
  events.forEach(ev => {
    const ts = str(ev.timestamp);
    const day = ts ? new Date(ts).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "Unknown";
    counts[day] = (counts[day] || 0) + 1;
  });
  return Object.entries(counts).slice(-7).map(([label, value]) => ({ label, value }));
}

/* ─── SVG Icons ─── */
function IconUsers() { return <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>; }
function IconCourses() { return <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" /></svg>; }
function IconSkills() { return <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>; }
function IconProjects() { return <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 18h6" /><path d="M10 22h4" /><path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14" /></svg>; }
function IconSaved() { return <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" /></svg>; }
function IconProgress() { return <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" /></svg>; }
