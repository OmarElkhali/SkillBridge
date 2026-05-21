import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  cx,
  emptyText,
  eyebrow,
  heroPanel,
  input,
  label,
  listCard,
  messageBanner,
  pageStack,
  panel,
  primaryButton,
  secondaryButton,
  tag,
} from "../components/ui";
import { api } from "../services/api";
import type { ProjectIdea, RecommendationResponse } from "../types/api";

export function ProjectDetailPage() {
  const DESCRIPTION_PREVIEW_LENGTH = 180;
  const params = useParams();
  const navigate = useNavigate();
  const projectId = Number(params.id);
  const [projects, setProjects] = useState<ProjectIdea[]>([]);
  const [project, setProject] = useState<ProjectIdea | null>(null);
  const [recommendations, setRecommendations] = useState<RecommendationResponse | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [expandedDescriptions, setExpandedDescriptions] = useState<Record<number, boolean>>({});
  const [limitPreset, setLimitPreset] = useState("10");
  const [customLimit, setCustomLimit] = useState("30");

  useEffect(() => {
    Promise.all([api.getProjects(), api.getProject(projectId), api.getLatestRecommendations(projectId).catch(() => null)])
      .then(([projectItems, projectItem, recommendationItem]) => {
        setProjects(projectItems);
        setProject(projectItem);
        setRecommendations(recommendationItem);
      })
      .catch((err) => setMessage(err instanceof Error ? err.message : "Unable to load the project."));
  }, [projectId]);

  async function generateRecommendations() {
    setLoading(true);
    setMessage("");
    try {
      const limit = limitPreset === "custom" ? Number(customLimit) : Number(limitPreset);
      const data = await api.generateRecommendations(projectId, limit);
      setRecommendations(data);
      setProject(data.project);
      setMessage(data.bigDataTrace.message);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Unable to generate recommendations.");
    } finally {
      setLoading(false);
    }
  }

  async function saveCourse(courseId: number) {
    try {
      await api.saveCourse(courseId);
      setMessage("Course saved successfully.");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Unable to save this course.");
    }
  }

  async function recordCourseClick(courseId: number) {
    try {
      await api.recordCourseClick(courseId);
    } catch {
      // Best-effort Big Data tracking; do not block course navigation.
    }
  }

  function toggleDescription(courseId: number) {
    setExpandedDescriptions((current) => ({
      ...current,
      [courseId]: !current[courseId],
    }));
  }

  return (
    <div className={cx(pageStack, "max-w-[1440px]")}>
      <section className={cx(heroPanel, "grid gap-5 lg:grid-cols-[minmax(0,1fr)_280px_220px_auto] lg:items-end")}>
        <div className="grid gap-3">
          <p className={eyebrow}>Project detail</p>
          <h2 className="font-['Fraunces',_'Source_Serif_4',_Georgia,_serif] text-4xl leading-tight text-[#261b18]">
            {project?.title ?? "Project idea"}
          </h2>
          <p className="max-w-3xl text-[1rem] leading-7 text-[#6f5b54]">{project?.description}</p>
        </div>

        <label className={label}>
          Select project
          <select className={input} value={projectId || ""} onChange={(event) => navigate(`/projects/${event.target.value}`)}>
            {projects.map((item) => (
              <option key={item.id} value={item.id}>
                {item.title}
              </option>
            ))}
          </select>
        </label>

        <div className="grid gap-3">
          <label className={label}>
            Results
            <select className={input} value={limitPreset} onChange={(event) => setLimitPreset(event.target.value)}>
              <option value="5">5 recommendations</option>
              <option value="10">10 recommendations</option>
              <option value="20">20 recommendations</option>
              <option value="50">50 recommendations</option>
              <option value="custom">Custom</option>
            </select>
          </label>
          {limitPreset === "custom" ? (
            <input
              className={input}
              max={100}
              min={1}
              type="number"
              value={customLimit}
              onChange={(event) => setCustomLimit(event.target.value)}
            />
          ) : null}
        </div>

        <button className={primaryButton} disabled={loading} onClick={generateRecommendations} type="button">
          {loading ? "Generating..." : "Generate recommendations"}
        </button>
      </section>

      {message ? <p className={messageBanner}>{message}</p> : null}

      <section className="grid items-start gap-5 xl:grid-cols-[minmax(0,0.72fr)_minmax(0,1.28fr)]">
        <div className="grid content-start gap-5 xl:sticky xl:top-6">
          <article className={cx(panel, "p-5")}>
            <div className="flex items-center justify-between gap-3">
              <h3 className="font-['Fraunces',_'Source_Serif_4',_Georgia,_serif] text-2xl text-[#261b18]">Detected skills</h3>
              <span className="text-sm text-[#6f5b54]">{recommendations?.detectedSkills.length ?? 0}</span>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {(recommendations?.detectedSkills ?? []).map((skill) => (
                <span className={tag} key={`${skill.skillId}-${skill.matchedKeyword}`}>
                  {skill.skillName} - {skill.matchedKeyword}
                </span>
              ))}
            </div>
            {!recommendations ? <p className={cx(emptyText, "mt-4")}>Run the recommendation engine to populate this section.</p> : null}
          </article>

          <article className={cx(panel, "p-5")}>
            <div className="flex items-center justify-between gap-3">
              <h3 className="font-['Fraunces',_'Source_Serif_4',_Georgia,_serif] text-2xl text-[#261b18]">Matched categories</h3>
              <span className="text-sm text-[#6f5b54]">{recommendations?.matchedCategories.length ?? 0}</span>
            </div>
            <div className="mt-4 grid gap-3">
              {(recommendations?.matchedCategories ?? []).map((category) => (
                <div className={listCard} key={category.categoryId}>
                  <strong className="text-[#261b18]">{category.name}</strong>
                  <div className="flex flex-wrap gap-2">
                    {category.matchedKeywords.slice(0, 6).map((keyword) => (
                      <span className={tag} key={keyword}>
                        {keyword}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
              {!recommendations ? <p className={emptyText}>Matched categories appear after generation.</p> : null}
            </div>
          </article>
        </div>

        <article className={panel}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="font-['Fraunces',_'Source_Serif_4',_Georgia,_serif] text-2xl text-[#261b18]">Recommendation snapshot</h3>
              <p className="mt-2 text-sm leading-6 text-[#6f5b54]">
                Keywords: <strong className="text-[#261b18]">{recommendations?.keywordSummary || "No snapshot generated yet."}</strong>
              </p>
              {recommendations?.bigDataTrace ? (
                <p className="mt-2 text-sm leading-6 text-[#6f5b54]">
                  Big Data event: <strong className="break-all text-[#261b18]">{recommendations.bigDataTrace.eventPath}</strong>
                  <br />
                  Flume/HDFS path: <strong className="text-[#261b18]">{recommendations.bigDataTrace.flumeHdfsPath}</strong>
                </p>
              ) : null}
            </div>
            <span className="rounded-full border border-[rgba(70,43,34,0.12)] bg-white/55 px-3 py-2 text-xs uppercase tracking-[0.24em] text-[#8c3f29]">
              {recommendations?.algorithmVersion ?? "Not generated"}
            </span>
          </div>

          <div className="mt-4 grid gap-3">
            {(recommendations?.recommendations ?? []).map((item) => (
              <div className={listCard} key={item.course.id}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <strong className="text-[#261b18]">
                    #{item.rankPosition} {item.course.title}
                  </strong>
                  <span className="rounded-full bg-[rgba(46,125,90,0.12)] px-3 py-1 text-sm font-medium text-[#2e7d5a]">{item.score} pts</span>
                </div>
                <p className="text-sm leading-6 text-[#6f5b54]">
                  {expandedDescriptions[item.course.id] || item.course.description.length <= DESCRIPTION_PREVIEW_LENGTH
                    ? item.course.description
                    : `${item.course.description.slice(0, DESCRIPTION_PREVIEW_LENGTH).trimEnd()}...`}
                </p>
                {item.course.description.length > DESCRIPTION_PREVIEW_LENGTH ? (
                  <button
                    className="w-fit text-sm font-medium text-[#8c3f29] underline-offset-4 hover:underline"
                    onClick={() => toggleDescription(item.course.id)}
                    type="button"
                  >
                    {expandedDescriptions[item.course.id] ? "Show less" : "Show more"}
                  </button>
                ) : null}
                <p className="text-sm text-[#6f5b54]">
                  provider <strong className="text-[#261b18]">{item.course.provider.name}</strong> - category{" "}
                  <strong className="text-[#261b18]">{item.course.category.name}</strong> - level{" "}
                  <strong className="text-[#261b18]">{item.course.level}</strong> - popularity{" "}
                  <strong className="text-[#261b18]">{item.popularityScore}</strong>
                </p>
                <p className="text-sm text-[#6f5b54]">
                  title {item.titleMatchScore} - skills {item.skillMatchScore} - category {item.categoryMatchScore} - bonus {item.bonusScore}
                </p>
                <div className="grid gap-3 text-sm text-[#6f5b54] md:grid-cols-3">
                  <MatchedList title="Matched keywords" items={item.matchedTitleKeywords} />
                  <MatchedList title="Matched skills" items={item.matchedSkills.slice(0, 8)} />
                  <MatchedList title="Matched categories" items={item.matchedCategories} />
                </div>
                <p className="text-sm leading-6 text-[#6f5b54]">
                  <strong className="text-[#261b18]">Why:</strong> {item.explanation}
                </p>
                <div className="flex flex-wrap gap-3">
                  <a
                    className={secondaryButton}
                    href={item.sourceUrl || item.course.sourceUrl}
                    rel="noreferrer"
                    target="_blank"
                    onClick={() => void recordCourseClick(item.course.id)}
                  >
                    Open course
                  </a>
                  <button className={primaryButton} onClick={() => saveCourse(item.course.id)} type="button">
                    Save
                  </button>
                </div>
              </div>
            ))}
            {!recommendations ? <p className={emptyText}>No recommendation snapshot yet.</p> : null}
            {recommendations && recommendations.recommendations.length === 0 ? (
              <p className={emptyText}>No ranked courses returned. Try a project with more technical keywords.</p>
            ) : null}
          </div>
        </article>
      </section>
    </div>
  );
}

function MatchedList({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <strong className="text-[#261b18]">{title}</strong>
      <div className="mt-2 flex flex-wrap gap-2">
        {items.length ? items.map((item) => <span className={tag} key={item}>{item}</span>) : <span className={emptyText}>None</span>}
      </div>
    </div>
  );
}
