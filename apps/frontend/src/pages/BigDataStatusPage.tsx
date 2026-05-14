import { useEffect, useState } from "react";
import { 
  HorizontalBarChart, DonutChart, WordCloud, KpiCard 
} from "../components/charts/ChartComponents";
import { cx, pageStack, primaryButton } from "../components/ui";
import { api } from "../services/api";
import type { BigDataRefreshResponse, BigDataStatus } from "../types/api";

type AnyRecord = Record<string, unknown>;

function prettyJson(value: unknown) {
  if (!value || (typeof value === "object" && Object.keys(value as Record<string, unknown>).length === 0)) {
    return "No generated output found yet.";
  }
  return JSON.stringify(value, null, 2);
}

export function BigDataStatusPage() {
  const [status, setStatus] = useState<BigDataStatus | null>(null);

  const [refresh, setRefresh] = useState<BigDataRefreshResponse | null>(null);
  const [hiveSummary, setHiveSummary] = useState<AnyRecord>({});
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"commands" | "trace" | "summary">("commands");

  async function loadStatus() {
    setLoading(true);
    setMessage("");
    try {
      const [statusData, _analyticsData, refreshData, hiveData] = await Promise.all([
        api.getBigDataStatus(),
        api.getCatalogAnalytics().catch(() => null),
        api.refreshBigDataAnalytics().catch(() => null),
        api.getBigDataHiveSummary().catch(() => ({})),
      ]);
      setStatus(statusData);
      setRefresh(refreshData);
      setHiveSummary(hiveData || {});
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Unable to load Big Data status.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void loadStatus(); }, []);

  async function refreshAnalytics() {
    try {
      setRefresh(await api.refreshBigDataAnalytics());
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Unable to prepare refresh commands.");
    }
  }

  /* ── Extraction Helpers ── */
  const catalogCounts = status?.catalogBuildReport?.["final_counts"] as Record<string, number> | undefined;
  const mapReduce = status?.bigDataSummary?.["mapreduce"] as AnyRecord | undefined;
  const hbase = status?.bigDataSummary?.["hbase"] as AnyRecord | undefined;
  
  const topKeywordsRaw = (mapReduce?.["topSearchKeywords"] ?? status?.bigDataSummary?.["topSearchKeywords"]) as AnyRecord[] | undefined;
  const topClickedRaw = (status?.bigDataSummary?.["topClickedCourses"] ?? hbase?.["sample"]) as AnyRecord[] | undefined;
  const recommendationPipelineTrace = status?.recommendationResult?.["pipelineTrace"] ?? status?.recommendationResult?.["pipeline_trace"];

  // Mapping to charts
  const topKeywords = (topKeywordsRaw || []).map(kw => ({
    keyword: String(kw.keyword || kw.name || "unknown"),
    count: Number(kw.count || kw.value || 0)
  }));

  const topClicked = (topClickedRaw || []).map((c, i) => ({
    name: String(c.title || c["meta:title"] || c.courseId || `Course ${i + 1}`),
    count: Number(c.clicks || c["activity:clicks"] || c.count || 0)
  }));

  const pipelineHealth = Object.entries(status?.pipelineHealth ?? {}).map(([key, val]) => ({
    name: key.replace(/([A-Z])/g, " $1").trim(),
    status: String(val)
  }));

  // Timeline events
  const latestEvents = (status?.latestEvents ?? []).slice(0, 10);
  const eventsBySource = latestEvents.reduce((acc: Record<string, number>, ev: AnyRecord) => {
    const src = String(ev.source || "unknown");
    acc[src] = (Number(acc[src]) || 0) + 1;
    return acc;
  }, {});
  const eventSourceData = Object.entries(eventsBySource).map(([name, value]) => ({ name, value: Number(value) }));

  // Hive QL data mapping
  // Assuming hiveSummary has some top stats or we extract from existing hive data
  const hiveTopSkillsRaw = arr<AnyRecord>(hiveSummary?.top_skills || (status?.bigDataSummary?.["hive"] as AnyRecord)?.["top_skills"] || []);
  const hiveTopSkills = hiveTopSkillsRaw.map(s => ({
    name: String(s.skill || s.name || "Skill"),
    count: Number(s.count || s.mentions || 0)
  }));

  return (
    <div className={cx(pageStack, "max-w-[1580px] overflow-hidden")}>
      {/* ── Header ── */}
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.25em] text-[var(--color-text-muted)]">Admin / Pipeline Status</p>
          <h1 className="mt-2 font-['Fraunces',_'Source_Serif_4',_Georgia,_serif] text-3xl font-bold text-[var(--color-text-strong)] sm:text-4xl">
            Big Data Trace & Analytics
          </h1>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">Live monitoring of HDFS, Flume, Hive, MapReduce, and HBase processes.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            className={cx(primaryButton, "py-2.5 px-6")}
            onClick={refreshAnalytics}
            disabled={loading}
            type="button"
          >
            {loading ? "Syncing..." : "Generate Hadoop Commands"}
          </button>
        </div>
      </header>

      {message && <p className="rounded-xl border border-[var(--danger-border)] bg-[var(--danger-wash)] px-4 py-3 text-sm font-semibold text-[var(--color-danger)]">{message}</p>}

      {/* ── Pipeline Health Strip ── */}
      <section className="flex flex-wrap gap-3">
        {pipelineHealth.map(h => (
          <div key={h.name} className="flex items-center gap-2 rounded-full border border-[var(--line-soft)] bg-white/80 px-4 py-2 text-xs shadow-sm">
            <span className="relative flex h-2.5 w-2.5">
              <span className={cx("absolute inline-flex h-full w-full rounded-full opacity-75", h.status === "UP" ? "animate-ping bg-emerald-400" : h.status === "DOWN" ? "bg-red-400" : "bg-amber-400")} />
              <span className={cx("relative inline-flex rounded-full h-2.5 w-2.5", h.status === "UP" ? "bg-emerald-500" : h.status === "DOWN" ? "bg-red-500" : "bg-amber-500")} />
            </span>
            <span className="font-bold text-[var(--color-text-strong)] uppercase tracking-wider">{h.name}</span>
            <span className="text-[var(--color-text-muted)]">{h.status}</span>
          </div>
        ))}
      </section>

      {/* ── Catalog Build KPIs ── */}
      <section className="grid gap-4 grid-cols-2 sm:grid-cols-4 lg:grid-cols-5">
        {catalogCounts ? Object.entries(catalogCounts).map(([name, count]) => (
          <KpiCard key={name} label={name.replaceAll("_", " ")} value={count} icon={<div />} trend={{ value: 0, positive: true }} />
        )) : (
          <div className="col-span-full rounded-xl border border-dashed border-[var(--line-soft)] p-8 text-center text-sm text-[var(--color-text-muted)]">
            Run the catalog build to populate catalog metrics.
          </div>
        )}
      </section>

      {/* ── Analytics Visualizations ── */}
      <section className="grid gap-4 lg:grid-cols-3">
        <WordCloud
          keywords={topKeywords}
          title="MapReduce Keywords"
          subtitle="Extracted from search logs"
        />
        <DonutChart
          data={eventSourceData.length ? eventSourceData : [{ name: "No data", value: 1 }]}
          title="Flume Event Sources"
          subtitle="Distribution of latest captured events"
          centerValue={String(latestEvents.length)}
          centerLabel="Total Events"
        />
        <HorizontalBarChart 
          data={topClicked.slice(0, 5)} 
          title="HBase Top Courses" 
          color="#D35400" 
        />
      </section>

      {/* ── HiveQL & Advanced Charts ── */}
      {hiveTopSkills.length > 0 && (
        <section className="grid gap-4 lg:grid-cols-2">
          <HorizontalBarChart 
            data={hiveTopSkills} 
            title="HiveQL: Trending Skills" 
            color="#2E86C1" 
          />
          <div className="rounded-[1.5rem] border border-[var(--line-soft)] bg-white/80 p-5 shadow-sm">
            <h4 className="text-sm font-bold text-[var(--color-text-strong)] mb-1">Hive Query Performance</h4>
            <p className="text-[0.65rem] text-[var(--color-text-muted)] mb-4">Execution time of scheduled jobs</p>
            {/* Placeholder for Hive performance metrics */}
            <div className="flex h-[200px] items-center justify-center rounded-xl bg-[var(--accent-wash)] text-xs text-[var(--color-accent-dark)]">
              HiveQL metrics visualized here.
            </div>
          </div>
        </section>
      )}

      {/* ── HDFS Files & Events Log Grid ── */}
      <section className="grid gap-4 xl:grid-cols-2">
        <div className="rounded-[1.5rem] border border-[var(--line-soft)] bg-white/80 p-5 shadow-sm">
          <h4 className="font-['Fraunces',_'Source_Serif_4',_Georgia,_serif] text-xl font-bold text-[var(--color-text-strong)] mb-4">HDFS Output Files</h4>
          <div className="max-h-[300px] overflow-auto rounded-xl border border-[var(--line-soft)]">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-gradient-to-r from-[var(--accent-wash)] to-transparent sticky top-0">
                <tr>
                  <th className="px-3 py-2.5 text-[0.6rem] font-bold uppercase tracking-wider text-[var(--color-accent-dark)]">File Name</th>
                  <th className="px-3 py-2.5 text-[0.6rem] font-bold uppercase tracking-wider text-[var(--color-accent-dark)]">Size</th>
                  <th className="px-3 py-2.5 text-[0.6rem] font-bold uppercase tracking-wider text-[var(--color-accent-dark)]">Status</th>
                </tr>
              </thead>
              <tbody>
                {(status?.files ?? []).map(file => (
                  <tr key={file.name} className="border-t border-[var(--line-soft)] transition hover:bg-[var(--accent-wash)]">
                    <td className="px-3 py-2.5">
                      <p className="text-xs font-semibold text-[var(--color-text-strong)]">{file.name}</p>
                      <p className="text-[0.6rem] text-[var(--color-text-muted)] truncate max-w-[200px]">{file.path}</p>
                    </td>
                    <td className="px-3 py-2.5 text-xs text-[var(--color-text-muted)]">
                      {(file.sizeBytes / 1024).toFixed(1)} KB
                    </td>
                    <td className="px-3 py-2.5">
                      <span className={cx("rounded-full px-2 py-0.5 text-[0.6rem] font-bold", file.available ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700")}>
                        {file.available ? "AVAILABLE" : "MISSING"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-[1.5rem] border border-[var(--line-soft)] bg-white/80 p-5 shadow-sm">
          <h4 className="font-['Fraunces',_'Source_Serif_4',_Georgia,_serif] text-xl font-bold text-[var(--color-text-strong)] mb-4">Flume Events Stream</h4>
          <div className="grid gap-3 max-h-[300px] overflow-auto pr-2">
            {latestEvents.map((event, index) => (
              <div key={`${event.timestamp ?? index}`} className="flex gap-3 rounded-xl border border-[var(--line-soft)] bg-white p-3 shadow-sm">
                <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[var(--color-accent)]" />
                <div className="min-w-0 flex-1">
                  <div className="flex justify-between items-start">
                    <strong className="text-xs text-[var(--color-text-strong)]">{String(event.eventType ?? "UNKNOWN")}</strong>
                    <span className="text-[0.6rem] text-[var(--color-text-muted)]">{String(event.timestamp ?? "")}</span>
                  </div>
                  <p className="mt-1 truncate text-xs text-[var(--color-text-muted)]">{String(event.projectTitle ?? event.query ?? event.courseId ?? "System event")}</p>
                  <span className="mt-1 inline-block rounded-md bg-[var(--accent-wash)] px-1.5 py-0.5 text-[0.55rem] font-bold text-[var(--color-accent-dark)]">
                    Source: {String(event.source ?? "unknown")}
                  </span>
                </div>
              </div>
            ))}
            {!latestEvents.length && <p className="text-sm text-[var(--color-text-muted)]">No web events recorded yet.</p>}
          </div>
        </div>
      </section>

      {/* ── Developer Terminal Console ── */}
      <section className="rounded-[1.5rem] bg-[#1a0f0d] p-1 shadow-xl ring-1 ring-white/10">
        <div className="flex items-center justify-between border-b border-white/10 bg-[#241511] px-4 py-2 rounded-t-[1.3rem]">
          <div className="flex gap-1.5">
            <div className="h-3 w-3 rounded-full bg-red-500/80" />
            <div className="h-3 w-3 rounded-full bg-amber-500/80" />
            <div className="h-3 w-3 rounded-full bg-emerald-500/80" />
          </div>
          <div className="flex gap-2">
            <button onClick={() => setActiveTab("commands")} className={cx("rounded-md px-3 py-1 text-xs font-semibold transition-colors", activeTab === "commands" ? "bg-white/10 text-white" : "text-white/50 hover:bg-white/5 hover:text-white")}>Commands</button>
            <button onClick={() => setActiveTab("trace")} className={cx("rounded-md px-3 py-1 text-xs font-semibold transition-colors", activeTab === "trace" ? "bg-white/10 text-white" : "text-white/50 hover:bg-white/5 hover:text-white")}>Pipeline Trace</button>
            <button onClick={() => setActiveTab("summary")} className={cx("rounded-md px-3 py-1 text-xs font-semibold transition-colors", activeTab === "summary" ? "bg-white/10 text-white" : "text-white/50 hover:bg-white/5 hover:text-white")}>HBase/Hive JSON</button>
          </div>
        </div>
        
        <div className="p-4">
          {activeTab === "commands" && (
            <div>
              <p className="mb-2 text-xs text-[#a08f8a] font-mono"># {refresh?.reason ?? "Click 'Generate Hadoop Commands' to get terminal scripts."}</p>
              <pre className="max-h-[300px] overflow-auto font-mono text-xs leading-6 text-[#e8ded1] scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/20">
                {(refresh?.commands ?? []).join("\n") || "$ Waiting for command generation..."}
              </pre>
            </div>
          )}
          {activeTab === "trace" && (
            <div>
              <p className="mb-2 text-xs text-[#a08f8a] font-mono"># Recommendation Pipeline Trace (recommendation_result.json)</p>
              <pre className="max-h-[300px] overflow-auto font-mono text-[0.65rem] leading-5 text-[#a1e6a1] scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/20">
                {prettyJson(recommendationPipelineTrace)}
              </pre>
            </div>
          )}
          {activeTab === "summary" && (
            <div>
              <p className="mb-2 text-xs text-[#a08f8a] font-mono"># Big Data Aggregated Summary Payload</p>
              <pre className="max-h-[300px] overflow-auto font-mono text-[0.65rem] leading-5 text-[#8ab4f8] scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/20">
                {prettyJson(status?.bigDataSummary)}
              </pre>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

// Helpers
function arr<T>(v: unknown): T[] { return Array.isArray(v) ? v as T[] : []; }
