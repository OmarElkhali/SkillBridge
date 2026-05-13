import { useEffect, useState } from "react";
import { cx, emptyText, eyebrow, heroPanel, listCard, messageBanner, pageStack, panel, primaryButton, tag } from "../components/ui";
import { api } from "../services/api";
import type { BigDataRefreshResponse, BigDataStatus, CatalogAnalytics } from "../types/api";

function prettyJson(value: unknown) {
  if (!value || (typeof value === "object" && Object.keys(value as Record<string, unknown>).length === 0)) {
    return "No generated output found yet.";
  }
  return JSON.stringify(value, null, 2);
}

export function BigDataStatusPage() {
  const [status, setStatus] = useState<BigDataStatus | null>(null);
  const [analytics, setAnalytics] = useState<CatalogAnalytics | null>(null);
  const [refresh, setRefresh] = useState<BigDataRefreshResponse | null>(null);
  const [message, setMessage] = useState("");

  async function loadStatus() {
    setMessage("");
    try {
      const [statusData, analyticsData, refreshData] = await Promise.all([
        api.getBigDataStatus(),
        api.getCatalogAnalytics().catch(() => null),
        api.refreshBigDataAnalytics().catch(() => null),
      ]);
      setStatus(statusData);
      setAnalytics(analyticsData);
      setRefresh(refreshData);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Unable to load Big Data status.");
    }
  }

  useEffect(() => {
    void loadStatus();
  }, []);

  async function refreshAnalytics() {
    try {
      setRefresh(await api.refreshBigDataAnalytics());
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Unable to prepare refresh commands.");
    }
  }

  const catalogCounts = status?.catalogBuildReport?.["final_counts"] as Record<string, number> | undefined;
  const mapReduce = status?.bigDataSummary?.["mapreduce"] as Record<string, unknown> | undefined;
  const hbase = status?.bigDataSummary?.["hbase"] as Record<string, unknown> | undefined;
  const topKeywords = (mapReduce?.["topSearchKeywords"] ?? status?.bigDataSummary?.["topSearchKeywords"]) as Record<string, unknown>[] | undefined;
  const topClicked = (status?.bigDataSummary?.["topClickedCourses"] ?? hbase?.["sample"]) as Record<string, unknown>[] | undefined;
  const recommendationPipelineTrace = status?.recommendationResult?.["pipelineTrace"] ?? status?.recommendationResult?.["pipeline_trace"];

  return (
    <div className={cx(pageStack, "max-w-[1440px]")}>
      <section className={cx(heroPanel, "grid gap-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end")}>
        <div className="grid gap-3">
          <p className={eyebrow}>Big Data pipeline</p>
          <h2 className="font-['Fraunces',_'Source_Serif_4',_Georgia,_serif] text-4xl leading-tight text-[var(--color-text-strong)]">
            Web recommendations are traced into the Hadoop lab.
          </h2>
          <p className="max-w-3xl text-sm leading-6 text-[var(--color-text-muted)]">
            The backend writes JSON events for Flume, reads generated outputs, and keeps Hadoop execution terminal-first.
          </p>
        </div>
        <button className={primaryButton} onClick={refreshAnalytics} type="button">
          Refresh Big Data Analytics
        </button>
      </section>

      {message ? <p className={messageBanner}>{message}</p> : null}

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {Object.entries(status?.pipelineHealth ?? {}).map(([name, value]) => (
          <article className={panel} key={name}>
            <span className={eyebrow}>{name.replace(/([A-Z])/g, " $1")}</span>
            <strong className="mt-3 block break-words text-lg text-[var(--color-text-strong)]">{String(value)}</strong>
          </article>
        ))}
      </section>

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-5">
        {catalogCounts
          ? Object.entries(catalogCounts).map(([name, count]) => (
              <article className={panel} key={name}>
                <span className={eyebrow}>{name.replaceAll("_", " ")}</span>
                <strong className="mt-3 block text-4xl text-[var(--color-text-strong)]">{count}</strong>
              </article>
            ))
          : <p className={emptyText}>Run the catalog build to populate catalog metrics.</p>}
      </section>

      <section className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
        <article className={panel}>
          <h3 className="font-['Fraunces',_'Source_Serif_4',_Georgia,_serif] text-2xl text-[var(--color-text-strong)]">Output files</h3>
          <div className="mt-4 grid gap-3">
            {(status?.files ?? []).map((file) => (
              <div className={listCard} key={file.name}>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <strong className="text-[var(--color-text-strong)]">{file.name}</strong>
                  <span className={tag}>{file.available ? "available" : "missing"}</span>
                </div>
                <p className="break-all text-sm leading-6 text-[var(--color-text-muted)]">{file.path}</p>
                <p className="text-sm text-[var(--color-text-muted)]">
                  {file.sizeBytes} bytes {file.lastModified ? `- ${new Date(file.lastModified).toLocaleString()}` : ""}
                </p>
              </div>
            ))}
          </div>
        </article>

        <article className={panel}>
          <h3 className="font-['Fraunces',_'Source_Serif_4',_Georgia,_serif] text-2xl text-[var(--color-text-strong)]">Latest events.log entries</h3>
          <div className="mt-4 grid gap-3">
            {(status?.latestEvents ?? []).map((event, index) => (
              <div className={listCard} key={`${event.timestamp ?? index}`}>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <strong className="text-[var(--color-text-strong)]">{String(event.eventType ?? "UNKNOWN")}</strong>
                  <span className={tag}>{String(event.source ?? "unknown")}</span>
                </div>
                <p className="break-all text-sm leading-6 text-[var(--color-text-muted)]">{String(event.projectTitle ?? event.query ?? event.courseId ?? "")}</p>
                <p className="text-xs text-[var(--color-accent-dark)]">{String(event.timestamp ?? "")}</p>
              </div>
            ))}
            {status?.latestEvents.length === 0 ? <p className={emptyText}>No web events recorded yet.</p> : null}
          </div>
        </article>
      </section>

      <section className="grid gap-5 xl:grid-cols-3">
        <MetricList title="MapReduce top keywords" items={topKeywords ?? []} labelKey="keyword" valueKey="count" />
        <MetricList title="HBase/top clicked courses" items={topClicked ?? []} labelKey="title" valueKey="clicks" />
        <article className={panel}>
          <h3 className="font-['Fraunces',_'Source_Serif_4',_Georgia,_serif] text-2xl text-[var(--color-text-strong)]">Skill coverage</h3>
          <p className="mt-4 text-4xl font-semibold text-[var(--color-text-strong)]">{analytics?.skillCoverage.coveragePercent ?? 0}%</p>
          <p className="mt-2 text-sm leading-6 text-[var(--color-text-muted)]">
            {analytics?.skillCoverage.coursesWithSkills ?? 0} of {analytics?.skillCoverage.totalCourses ?? 0} courses have mapped skills.
          </p>
        </article>
      </section>

      <section className="grid gap-5 xl:grid-cols-2">
        <article className={panel}>
          <h3 className="font-['Fraunces',_'Source_Serif_4',_Georgia,_serif] text-2xl text-[var(--color-text-strong)]">Latest recommendation_result.json</h3>
          <pre className="mt-4 max-h-[520px] overflow-auto rounded-[1.2rem] bg-gradient-to-br from-[#2b1812] to-[#1a0d07] p-4 text-xs leading-5 text-[#fff4e8]">
            {prettyJson(status?.recommendationResult)}
          </pre>
        </article>

        <article className={panel}>
          <h3 className="font-['Fraunces',_'Source_Serif_4',_Georgia,_serif] text-2xl text-[var(--color-text-strong)]">Refresh commands</h3>
          <p className="mt-2 text-sm leading-6 text-[var(--color-text-muted)]">
            {refresh?.reason ?? "Click refresh to get the exact terminal commands for MapReduce, HBase, and HDFS verification."}
          </p>
          <pre className="mt-4 max-h-[420px] overflow-auto rounded-[1.2rem] bg-gradient-to-br from-[#2b1812] to-[#1a0d07] p-4 text-xs leading-5 text-[#fff4e8]">
            {(refresh?.commands ?? []).join("\n") || "No commands requested yet."}
          </pre>
        </article>
      </section>

      <section className={panel}>
        <h3 className="font-['Fraunces',_'Source_Serif_4',_Georgia,_serif] text-2xl text-[var(--color-text-strong)]">Recommendation pipeline trace</h3>
        <p className="mt-2 text-sm leading-6 text-[var(--color-text-muted)]">
          This is the Big Data proof attached to the latest generated recommendation artifact: NameNode/DataNodes, Flume, HDFS, Hive, MapReduce and HBase.
        </p>
        <pre className="mt-4 max-h-[360px] overflow-auto rounded-[1.2rem] bg-gradient-to-br from-[#2b1812] to-[#1a0d07] p-4 text-xs leading-5 text-[#fff4e8]">
          {prettyJson(recommendationPipelineTrace)}
        </pre>
      </section>

      <section className={panel}>
        <h3 className="font-['Fraunces',_'Source_Serif_4',_Georgia,_serif] text-2xl text-[var(--color-text-strong)]">Big Data summary JSON</h3>
        <pre className="mt-4 max-h-[420px] overflow-auto rounded-[1.2rem] bg-gradient-to-br from-[#2b1812] to-[#1a0d07] p-4 text-xs leading-5 text-[#fff4e8]">
          {prettyJson(status?.bigDataSummary)}
        </pre>
      </section>
    </div>
  );
}

function MetricList({ title, items, labelKey, valueKey }: { title: string; items: Record<string, unknown>[]; labelKey: string; valueKey: string }) {
  return (
    <article className={panel}>
      <h3 className="font-['Fraunces',_'Source_Serif_4',_Georgia,_serif] text-2xl text-[var(--color-text-strong)]">{title}</h3>
      <div className="mt-4 grid gap-3">
        {items.map((item, index) => {
          const label = item[labelKey] ?? item["meta:title"] ?? item.courseId ?? "Unknown";
          const value = item[valueKey] ?? item["activity:clicks"] ?? item.clicks ?? 0;
          return (
            <div className={listCard} key={`${String(label)}-${index}`}>
              <strong className="text-[var(--color-text-strong)]">{String(label)}</strong>
              <span className="text-sm text-[var(--color-text-muted)]">{String(value)}</span>
            </div>
          );
        })}
        {!items.length ? <p className={emptyText}>Not generated yet.</p> : null}
      </div>
    </article>
  );
}
