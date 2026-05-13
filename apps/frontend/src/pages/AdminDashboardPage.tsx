import { useEffect, useState } from "react";
import {
  cx,
  emptyText,
  errorText,
  eyebrow,
  heroPanel,
  messageBanner,
  metricTile,
  mutedText,
  pageStack,
  panel,
  primaryButton,
  secondaryButton,
  select,
  tableShell,
  tag,
} from "../components/ui";
import { api } from "../services/api";
import type { AdminBigDataPayload, AdminOverview, CatalogMetric, UserSummary } from "../types/api";

type AnyRecord = Record<string, unknown>;

export function AdminDashboardPage() {
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [pipeline, setPipeline] = useState<AdminBigDataPayload>({});
  const [catalog, setCatalog] = useState<AdminBigDataPayload>({});
  const [events, setEvents] = useState<AdminBigDataPayload>({});
  const [recommendations, setRecommendations] = useState<AdminBigDataPayload>({});
  const [commands, setCommands] = useState<AdminBigDataPayload>({});
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [savingUserId, setSavingUserId] = useState<number | null>(null);

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    setLoading(true);
    setMessage("");
    try {
      const [overviewData, pipelineData, catalogData, eventsData, recommendationData, commandsData, userData] = await Promise.all([
        api.getAdminOverview(),
        api.getAdminBigDataPipeline(),
        api.getAdminBigDataCatalogAnalytics(),
        api.getAdminBigDataEventsAnalytics(),
        api.getAdminBigDataRecommendationAnalytics(),
        api.getAdminBigDataCommands(),
        api.getAdminUsers(),
      ]);
      setOverview(overviewData);
      setPipeline(pipelineData);
      setCatalog(catalogData);
      setEvents(eventsData);
      setRecommendations(recommendationData);
      setCommands(commandsData);
      setUsers(userData);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Unable to load admin data.");
    } finally {
      setLoading(false);
    }
  }

  async function updateUserAssignment(userId: number, payload: { role?: "USER" | "ADMIN"; active?: boolean }) {
    setSavingUserId(userId);
    setMessage("");
    try {
      const updated = await api.updateAdminUser(userId, payload);
      setUsers((current) => current.map((user) => (user.id === updated.id ? updated : user)));
      setMessage("User assignment updated.");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Unable to update user assignment.");
    } finally {
      setSavingUserId(null);
    }
  }

  const components = asArray<AnyRecord>(pipeline.components);
  const pipelineNodes = asArray<string>(pipeline.pipelineDiagram);
  const eventCounts = asRecord(events.eventCountByType);
  const latestEvents = asArray<AnyRecord>(events.latestEvents);
  const latestRecommendation = asRecord(recommendations.latestRecommendation);
  const recommendationRows = asArray<AnyRecord>(latestRecommendation.recommendations);
  const commandList = asArray<string>(commands.commands);

  return (
    <div className={cx(pageStack, "max-w-[1580px] overflow-hidden")}>
      <section className={cx(heroPanel, "grid gap-5 xl:grid-cols-[1.2fr_0.8fr] xl:items-end p-8 sm:p-12 relative overflow-hidden")}>
        <div className="absolute top-0 right-0 -mr-32 -mt-32 h-[400px] w-[400px] rounded-full bg-[var(--color-accent)] opacity-10 blur-[100px]" />
        <div className="absolute bottom-0 left-[10%] -mb-20 h-48 w-48 rounded-full bg-[var(--color-accent-dark)] opacity-10 blur-[60px]" />

        <div className="relative z-10">
          <p className={eyebrow}>Admin Control Room</p>
          <h2 className="mt-3 max-w-5xl break-words font-['Fraunces',_'Source_Serif_4',_Georgia,_serif] text-3xl leading-tight text-[var(--color-text-strong)] sm:text-5xl">
            Monitor catalog growth and <span className="bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-accent-dark)] bg-clip-text text-transparent">learner activity</span> from one place.
          </h2>
          <p className={cx(mutedText, "mt-4 max-w-3xl text-lg")}>
            React reads Spring Boot APIs only. Spring Boot aggregates Supabase data, Big Data JSON files, and the local event stream.
          </p>
        </div>
        <div className="relative z-10 flex flex-wrap gap-4 xl:justify-end">
          <button className={cx(secondaryButton, "px-6 py-2.5 gap-2")} disabled={loading} onClick={loadDashboard} type="button">
            {loading ? (<><svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>Refreshing...</>) : "Refresh Dashboard"}
          </button>
          <span className={cx(tag, "bg-white/90 border-[var(--accent-border)]")}>Frontend / Spring Boot / Hadoop</span>
        </div>
      </section>

      {message ? <p className={message.includes("updated") ? messageBanner : errorText}>{message}</p> : null}

      <section className="grid min-w-0 gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <Metric label="Courses" value={overview?.totalCourses} />
        <Metric label="Providers" value={overview?.totalProviders} />
        <Metric label="Categories" value={overview?.totalCategories} />
        <Metric label="Skills" value={overview?.totalSkills} />
        <Metric label="Users" value={overview?.totalUsers} />
        <Metric label="Saved" value={overview?.savedCourses} />
        <Metric label="Projects" value={overview?.totalProjects} />
        <Metric label="Snapshots" value={overview?.totalRecommendationSnapshots} />
        <Metric label="Results" value={overview?.totalRecommendationResults} />
        <Metric label="Progress" value={overview?.progressEntries} />
      </section>

      <section className={panel}>
        <SectionHeader
          eyebrowText="Visual pipeline"
          title="End-to-end Big Data pipeline health"
        />
        <PipelinePath nodes={pipelineNodes} />
        <div className="mt-5 grid min-w-0 gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {pipelineNodes.map((node) => {
            const component = components.find((item) => asString(item.name) === node || asString(item.name).includes(node));
            return <PipelineNode component={component} key={node} name={node} />;
          })}
        </div>
      </section>

      <section className="grid min-w-0 gap-5 xl:grid-cols-2">
        {components.map((component) => (
          <article className={panel} id={slug(asString(component.name))} key={asString(component.name)}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="font-['Fraunces',_'Source_Serif_4',_Georgia,_serif] text-2xl text-[var(--color-text-strong)]">{asString(component.name)}</h3>
                <p className="mt-2 text-sm leading-6 text-[var(--color-text-muted)]">{asString(component.description)}</p>
              </div>
              <StatusBadge status={asString(component.status, "UNKNOWN")} />
            </div>
            <p className="mt-4 text-xs uppercase tracking-[0.2em] text-[var(--color-accent-dark)]">Source</p>
            <p className="mt-1 break-words text-sm text-[var(--color-text-muted)]">{asString(component.source, "Not available")}</p>
            <CompactObject className="mt-4" data={component.metrics} />
          </article>
        ))}
      </section>

      <section className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(260px,0.8fr)]">
        <article className={panel}>
          <SectionHeader eyebrowText="Catalog analytics" title="Coverage and metadata quality" />
          <div className="mt-5 grid gap-4">
            <CoverageCard coverage={asRecord(catalog.skillCoverage)} />
            <MissingMetadata data={asRecord(catalog.missingMetadata)} />
          </div>
        </article>
        <article className={panel}>
          <SectionHeader eyebrowText="Catalog distribution" title="Dominant categories, providers, levels and skills" />
          <div className="mt-5 grid gap-5 md:grid-cols-2">
            <MetricList title="Categories" items={asCatalogMetrics(catalog.coursesByCategory)} />
            <MetricList title="Providers" items={asCatalogMetrics(catalog.coursesByProvider)} />
            <MetricList title="Levels" items={asCatalogMetrics(catalog.coursesByLevel)} />
            <MetricList title="Top skills" items={asCatalogMetrics(catalog.topSkills)} />
          </div>
        </article>
        <article className={panel}>
          <SectionHeader eyebrowText="Event analytics" title="Web activity captured for Flume and HDFS" />
          <div className="mt-5 grid gap-3">
            <MetricRow label="Total events" value={asNumber(events.eventCount)} />
            <MetricRow label="Course searches" value={asNumber(events.searchQueriesCount)} />
            <MetricRow label="Recommendation events" value={asNumber(events.recommendationEventsCount)} />
            <MetricRow label="Course clicks" value={asNumber(events.courseClickEvents)} />
            <MetricRow label="Course saves" value={asNumber(events.courseSaveEvents)} />
          </div>
          <div className="mt-5">
            <h4 className="font-['Fraunces',_'Source_Serif_4',_Georgia,_serif] text-xl text-[var(--color-text-strong)]">Event count by type</h4>
            <KeyValueMap data={eventCounts} />
          </div>
        </article>
      </section>

      <section className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <article className={panel}>
          <SectionHeader eyebrowText="Latest events.log records" title="Streaming input for Flume" />
          <div className={cx(tableShell, "mt-5 max-h-[420px] overflow-auto")}>
            <table className="min-w-full text-left text-sm">
              <thead className="bg-gradient-to-r from-[var(--accent-wash)] to-transparent text-[var(--color-accent-dark)]">
                <tr>
                  <th className="px-4 py-3 font-medium">Type</th>
                  <th className="px-4 py-3 font-medium">Project / Course / Query</th>
                  <th className="px-4 py-3 font-medium">Time</th>
                </tr>
              </thead>
              <tbody>
                {latestEvents.map((event, index) => (
                  <tr className="border-t border-[rgba(70,43,34,0.08)]" key={`${asString(event.eventType)}-${index}`}>
                    <td className="px-4 py-3 font-semibold text-[var(--color-text-strong)]">{asString(event.eventType, "UNKNOWN")}</td>
                    <td className="px-4 py-3 text-[var(--color-text-muted)]">
                      {asString(event.projectTitle) || asString(event.courseId) || asString(event.query) || asString(event.projectDescription, "No payload")}
                    </td>
                    <td className="px-4 py-3 text-[var(--color-text-muted)]">{asString(event.timestamp, "-")}</td>
                  </tr>
                ))}
                {!latestEvents.length ? (
                  <tr>
                    <td className="px-4 py-6 text-[#6f5b54]" colSpan={3}>
                      No events yet. Generate recommendations, search courses, save courses, or open courses.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </article>

        <article className={panel}>
          <SectionHeader eyebrowText="Recommendation analytics" title="Snapshots, score quality and latest trace" />
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <Metric label="Snapshots" value={asNumber(recommendations.snapshotsCount)} compact />
            <Metric label="Results" value={asNumber(recommendations.resultsCount)} compact />
            <Metric label="Average score" value={asNumber(recommendations.averageScore)} compact />
          </div>
          <div className="mt-5 grid gap-5 lg:grid-cols-2">
            <MetricList title="Top recommended courses" items={asCatalogMetrics(recommendations.topRecommendedCourses)} />
            <MetricList title="Top detected skills" items={asCatalogMetrics(recommendations.topDetectedSkills)} />
            <MetricList title="Matched categories" items={asCatalogMetrics(recommendations.topMatchedCategories)} />
            <MetricList title="Score ranges" items={asCatalogMetrics(recommendations.scoreDistribution)} />
          </div>
        </article>
      </section>

      <section className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <article className={panel}>
          <SectionHeader eyebrowText="Latest recommendation_result.json" title={asString(latestRecommendation.project, "Latest Python/Java recommendation trace")} />
          {recommendationRows.length ? (
            <div className="mt-5 grid gap-3">
              {recommendationRows.slice(0, 6).map((item, index) => (
                <div className="group rounded-2xl border-2 border-white/60 bg-gradient-to-r from-white/70 to-white/40 p-5 shadow-sm transition hover:-translate-y-1 hover:border-[var(--accent-border)] hover:shadow-md" key={`${asString(item.title)}-${index}`}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-['Fraunces',_'Source_Serif_4',_Georgia,_serif] text-lg font-bold text-[#1A0D07]">
                        <span className="text-[var(--color-accent)] mr-2">#{asNumber(item.rank_position, index + 1)}</span>
                        {asString(item.title, "Recommendation")}
                      </p>
                      <p className="mt-1.5 text-sm leading-relaxed text-[#6f5b54]">{asString(item.explanation, "No explanation available.")}</p>
                    </div>
                    <span className={cx(tag, "bg-white border-[var(--accent-border-strong)]")}>{asNumber(item.score)} pts</span>
                  </div>
                  <div className="mt-4 grid gap-2 rounded-xl bg-white/40 px-3 py-2 text-xs font-semibold text-[#8c3f29] sm:grid-cols-4">
                    <span>title {asNumber(item.title_match_score)}</span>
                    <span>skills {asNumber(item.skill_match_score)}</span>
                    <span>category {asNumber(item.category_match_score)}</span>
                    <span>bonus {asNumber(item.bonus_score)}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className={cx(emptyText, "mt-5")}>No recommendation artifact yet. Generate a project recommendation or run the Python script.</p>
          )}
        </article>
        <article className={panel}>
          <SectionHeader eyebrowText="Refresh commands" title="Manual verification commands for the jury" />
          <p className={cx(mutedText, "mt-3")}>{asString(commands.reason, "Hadoop jobs remain terminal-first. Run these commands from apps/bigdata.")}</p>
          <div className="mt-5 relative overflow-hidden rounded-[1.5rem] border border-[var(--accent-border)] bg-gradient-to-br from-[#2b1812] to-[#1a0d07] p-5 shadow-inner">
            <div className="absolute top-0 right-0 -mr-10 -mt-10 h-32 w-32 rounded-full bg-[var(--color-accent)] opacity-20 blur-[40px]"></div>
            <pre className="relative z-10 max-h-[420px] overflow-auto text-[0.85rem] leading-7 text-[#f9f5f0] font-mono">
              {commandList.length ? commandList.join("\n") : "No commands returned by the backend."}
            </pre>
          </div>
        </article>
      </section>

      <section className={panel}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className={eyebrow}>User management</p>
            <h3 className="mt-2 font-['Fraunces',_'Source_Serif_4',_Georgia,_serif] text-2xl text-[var(--color-text-strong)]">User assignments</h3>
            <p className="mt-1 text-sm leading-6 text-[var(--color-text-muted)]">Assign roles and activate/deactivate accounts.</p>
          </div>
          <span className="rounded-full border-2 border-white/60 bg-white/50 px-4 py-2 text-sm font-bold text-[var(--color-accent-dark)]">{users.length} accounts</span>
        </div>
        <div className={cx(tableShell, "mt-5")}>
          <table className="min-w-full border-collapse text-left text-sm text-[var(--color-text)]">
            <thead className="bg-gradient-to-r from-[var(--accent-wash)] to-transparent text-[var(--color-accent-dark)]">
              <tr>
                <th className="px-5 py-4 font-bold text-xs uppercase tracking-[0.2em]">User</th>
                <th className="px-5 py-4 font-bold text-xs uppercase tracking-[0.2em]">Email</th>
                <th className="px-5 py-4 font-bold text-xs uppercase tracking-[0.2em]">Role</th>
                <th className="px-5 py-4 font-bold text-xs uppercase tracking-[0.2em]">Status</th>
                <th className="px-5 py-4 font-bold text-xs uppercase tracking-[0.2em]">Action</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr className="border-t border-[var(--line-soft)] transition-colors hover:bg-[var(--accent-wash)]" key={user.id}>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[var(--brand-gradient)] text-xs font-bold text-white shadow-sm">
                        {user.firstName?.[0]}{user.lastName?.[0]}
                      </div>
                      <span className="font-semibold">{user.firstName} {user.lastName}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-[var(--color-text-muted)]">{user.email}</td>
                  <td className="px-5 py-4">
                    <select
                      className={cx(select, "min-w-32 py-2 text-sm")}
                      value={user.role}
                      onChange={(event) => updateUserAssignment(user.id, { role: event.target.value as "USER" | "ADMIN" })}
                    >
                      <option value="USER">USER</option>
                      <option value="ADMIN">ADMIN</option>
                    </select>
                  </td>
                  <td className="px-5 py-4">
                    <select
                      className={cx(select, "min-w-32 py-2 text-sm")}
                      value={user.active ? "active" : "inactive"}
                      onChange={(event) => updateUserAssignment(user.id, { active: event.target.value === "active" })}
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </td>
                  <td className="px-5 py-4">
                    <button
                      className={cx(primaryButton, "px-4 py-2 text-sm")}
                      disabled={savingUserId === user.id}
                      onClick={() => updateUserAssignment(user.id, { role: user.role, active: user.active })}
                      type="button"
                    >
                      {savingUserId === user.id ? "Saving..." : "Confirm"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function SectionHeader({ eyebrowText, title }: { eyebrowText: string; title: string }) {
  return (
    <div>
      <p className={eyebrow}>{eyebrowText}</p>
      <h3 className="mt-2 break-words font-['Fraunces',_'Source_Serif_4',_Georgia,_serif] text-2xl leading-tight text-[var(--color-text-strong)]">{title}</h3>
    </div>
  );
}

function PipelinePath({ nodes }: { nodes: string[] }) {
  if (!nodes.length) return null;

  return (
    <div className="mt-5 flex min-w-0 flex-wrap items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-[var(--color-accent-dark)]">
      {nodes.map((node, index) => (
        <span className="flex min-w-0 items-center gap-2" key={`${node}-${index}`}>
          <span className="max-w-[12rem] truncate rounded-full border border-[var(--accent-border)] bg-white/70 px-3 py-1.5">{node}</span>
          {index < nodes.length - 1 ? <span aria-hidden="true" className="text-[var(--color-text-muted)]">-&gt;</span> : null}
        </span>
      ))}
    </div>
  );
}

function Metric({ label, value, compact = false }: { label: string; value: number | undefined; compact?: boolean }) {
  return (
    <article className={cx(
      compact ? "rounded-2xl bg-gradient-to-br from-white/70 to-white/40 p-4" : metricTile,
      "min-w-0 border-2 border-white/60 shadow-lg shadow-[var(--accent-wash)] transition-all hover:-translate-y-0.5 hover:shadow-xl"
    )}>
      <span className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-[var(--color-accent-dark)]">{label}</span>
      <strong className={cx("mt-2 block font-['Fraunces',_'Source_Serif_4',_Georgia,_serif] text-[var(--color-text-strong)]", compact ? "text-3xl" : "text-4xl")}>
        {value != null ? value.toLocaleString() : "-"}
      </strong>
    </article>
  );
}

function PipelineNode({ name, component }: { name: string; component?: AnyRecord }) {
  const status = asString(component?.status, "MISSING");
  return (
    <a
      className="group min-w-0 rounded-2xl border-2 border-white/60 bg-gradient-to-br from-white/70 to-white/40 p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-[var(--accent-border-strong)] hover:shadow-lg"
      href={`#${slug(asString(component?.name, name))}`}
      title={asString(component?.description, name)}
    >
      <div className="flex items-center justify-between gap-3">
        <strong className="min-w-0 truncate text-[0.95rem] font-bold text-[#1A0D07]">{name}</strong>
        <StatusBadge status={status} small />
      </div>
      <p className="mt-3 line-clamp-2 text-[0.8rem] leading-relaxed text-[#6f5b54]">{asString(component?.description, "Pipeline node")}</p>
    </a>
  );
}

function StatusBadge({ status, small = false }: { status: string; small?: boolean }) {
  const normalized = status.toUpperCase();
  const tone =
    normalized === "OK"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : normalized.includes("WARNING") || normalized.includes("STALE")
        ? "border-amber-200 bg-amber-50 text-amber-700"
        : "border-[var(--danger-border)] bg-[var(--danger-wash)] text-[var(--color-danger)]";
  return <span className={cx("rounded-full border px-3 py-1 font-bold", small ? "text-[10px]" : "text-xs", tone)}>{normalized}</span>;
}

function CoverageCard({ coverage }: { coverage: AnyRecord }) {
  const percent = asNumber(coverage.coveragePercent);
  return (
    <div className="rounded-2xl border-2 border-white/60 bg-gradient-to-br from-white/70 to-white/40 p-6 shadow-sm">
      <strong className="block font-['Fraunces',_'Source_Serif_4',_Georgia,_serif] text-5xl text-[#1A0D07]">{percent}%</strong>
      <p className="mt-2 text-sm leading-relaxed text-[#6f5b54]">
        <strong className="text-[#261b18]">{asNumber(coverage.coursesWithSkills)}</strong> of {asNumber(coverage.totalCourses)} courses have at least one mapped skill.
      </p>
      <div className="mt-5 h-3 overflow-hidden rounded-full bg-[rgba(70,43,34,0.06)] shadow-inner">
        <div className="h-full rounded-full bg-[var(--brand-gradient)] shadow-md transition-all duration-1000 ease-out" style={{ width: `${Math.min(100, Math.max(0, percent))}%` }} />
      </div>
    </div>
  );
}

function MissingMetadata({ data }: { data: AnyRecord }) {
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <Metric label="Missing skills" value={asNumber(data.coursesMissingSkills)} compact />
      <Metric label="Missing description" value={asNumber(data.coursesMissingDescription)} compact />
      <Metric label="Missing source URL" value={asNumber(data.coursesMissingSourceUrl)} compact />
    </div>
  );
}

function MetricList({ title, items }: { title: string; items: CatalogMetric[] }) {
  const max = Math.max(...items.map((item) => item.count), 1);
  return (
    <div className="rounded-2xl border-2 border-white/60 bg-gradient-to-br from-white/70 to-white/40 p-5 shadow-sm">
      <h4 className="font-['Fraunces',_'Source_Serif_4',_Georgia,_serif] text-xl text-[#1A0D07]">{title}</h4>
      <div className="mt-4 grid gap-3.5">
        {items.slice(0, 10).map((item) => (
          <div key={item.name} className="group">
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="truncate text-[#6f5b54] group-hover:text-[#261b18] transition-colors">{item.name}</span>
              <strong className="text-[#1A0D07]">{item.count}</strong>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-[rgba(70,43,34,0.06)] shadow-inner">
              <div className="h-full rounded-full bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-accent-dark)] transition-all duration-1000 ease-out" style={{ width: `${Math.max(4, Math.round((item.count / max) * 100))}%` }} />
            </div>
          </div>
        ))}
        {!items.length ? <p className={emptyText}>Not generated yet.</p> : null}
      </div>
    </div>
  );
}

function MetricRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border-2 border-white/60 bg-white/50 px-4 py-3 text-sm shadow-[0_2px_10px_rgba(62,39,35,0.02)] transition-all hover:bg-white/80">
      <span className="text-[#6f5b54] font-medium">{label}</span>
      <strong className="text-[#1A0D07] text-base">{value}</strong>
    </div>
  );
}

function KeyValueMap({ data }: { data: AnyRecord }) {
  const entries = Object.entries(data);
  return (
    <div className="mt-3 grid gap-2.5">
      {entries.map(([key, value]) => (
        <MetricRow key={key} label={key} value={asNumber(value)} />
      ))}
      {!entries.length ? <p className={emptyText}>No event counts yet.</p> : null}
    </div>
  );
}

function CompactObject({ data, className }: { data: unknown; className?: string }) {
  if (Array.isArray(data)) {
    return (
      <div className={cx("grid gap-2.5", className)}>
        {data.slice(0, 6).map((item, index) => (
          <p className="rounded-xl border border-white/60 bg-white/50 px-4 py-2.5 text-xs text-[#6f5b54] shadow-sm" key={index}>
            {formatValue(item)}
          </p>
        ))}
      </div>
    );
  }

  const record = asRecord(data);
  const entries = Object.entries(record).slice(0, 8);
  return (
    <div className={cx("grid gap-2.5 sm:grid-cols-2", className)}>
      {entries.map(([key, value]) => (
        <div className="rounded-xl border border-white/60 bg-white/50 px-4 py-3 text-xs shadow-sm" key={key}>
          <p className="uppercase tracking-[0.16em] text-[var(--color-accent-dark)] font-bold">{labelize(key)}</p>
          <p className="mt-1.5 break-words text-[#261b18] font-medium">{formatValue(value)}</p>
        </div>
      ))}
      {!entries.length ? <p className={emptyText}>Not generated yet.</p> : null}
    </div>
  );
}

function asCatalogMetrics(value: unknown): CatalogMetric[] {
  if (Array.isArray(value)) {
    return value.map((item, index) => {
      const record = asRecord(item);
      return {
        name: asString(record.name, `Item ${index + 1}`),
        count: asNumber(record.count ?? record.item_count),
      };
    });
  }
  return Object.entries(asRecord(value)).map(([name, count]) => ({ name, count: asNumber(count) }));
}

function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function asRecord(value: unknown): AnyRecord {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as AnyRecord) : {};
}

function asString(value: unknown, fallback = "") {
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return fallback;
}

function asNumber(value: unknown, fallback = 0) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "" && Number.isFinite(Number(value))) return Number(value);
  return fallback;
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return "-";
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) return value.map((item) => formatValue(item)).join(", ");
  return JSON.stringify(value);
}

function labelize(value: string) {
  return value.replace(/[_-]/g, " ").replace(/([a-z])([A-Z])/g, "$1 $2");
}

function slug(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}
