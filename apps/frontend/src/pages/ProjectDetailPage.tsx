import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { cx, emptyText, eyebrow, heroPanel, listCard, messageBanner, pageStack, panel, primaryButton, secondaryButton, tag } from "../components/ui";
import { api } from "../services/api";
import type { ProjectIdea, RecommendationResponse } from "../types/api";

export function ProjectDetailPage() {
  const DESCRIPTION_PREVIEW_LENGTH = 180;
  const params = useParams();
  const projectId = Number(params.id);
  const [project, setProject] = useState<ProjectIdea | null>(null);
  const [recommendations, setRecommendations] = useState<RecommendationResponse | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [expandedDescriptions, setExpandedDescriptions] = useState<Record<number, boolean>>({});

  useEffect(() => {
    Promise.all([api.getProject(projectId), api.getLatestRecommendations(projectId).catch(() => null)])
      .then(([projectItem, recommendationItem]) => {
        setProject(projectItem);
        setRecommendations(recommendationItem);
      })
      .catch((err) => setMessage(err instanceof Error ? err.message : "Unable to load the project."));
  }, [projectId]);

  async function generateRecommendations() {
    setLoading(true);
    setMessage("");
    try {
      const data = await api.generateRecommendations(projectId);
      setRecommendations(data);
      setProject(data.project);
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

  function toggleDescription(courseId: number) {
    setExpandedDescriptions((current) => ({
      ...current,
      [courseId]: !current[courseId],
    }));
  }

  return (
    <div className={cx(pageStack, "max-w-[1440px]")}>
      <section className={cx(heroPanel, "grid gap-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end")}>
        <div className="grid gap-3">
          <p className={eyebrow}>Project detail</p>
          <h2 className="font-['Fraunces',_'Source_Serif_4',_Georgia,_serif] text-4xl leading-tight text-[#261b18]">
            {project?.title ?? "Project idea"}
          </h2>
          <p className="max-w-3xl text-[1rem] leading-7 text-[#6f5b54]">{project?.description}</p>
        </div>
        <button className={primaryButton} disabled={loading} onClick={generateRecommendations} type="button">
          {loading ? "Generating..." : "Generate recommendations"}
        </button>
      </section>

      {message ? <p className={messageBanner}>{message}</p> : null}

      <section className="grid gap-5 xl:grid-cols-[minmax(0,0.72fr)_minmax(0,1.28fr)]">
        <article className={panel}>
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-['Fraunces',_'Source_Serif_4',_Georgia,_serif] text-2xl text-[#261b18]">Detected skills</h3>
            <span className="text-sm text-[#6f5b54]">{recommendations?.detectedSkills.length ?? 0}</span>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {(recommendations?.detectedSkills ?? []).map((skill) => (
              <span className={tag} key={`${skill.skillId}-${skill.matchedKeyword}`}>
                {skill.skillName} · {skill.matchedKeyword}
              </span>
            ))}
          </div>
          {!recommendations ? <p className={cx(emptyText, "mt-4")}>Run the recommendation engine to populate this section.</p> : null}
        </article>

        <article className={panel}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="font-['Fraunces',_'Source_Serif_4',_Georgia,_serif] text-2xl text-[#261b18]">Recommendation snapshot</h3>
              <p className="mt-2 text-sm leading-6 text-[#6f5b54]">
                Keywords: <strong className="text-[#261b18]">{recommendations?.keywordSummary || "No snapshot generated yet."}</strong>
              </p>
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
                    #{item.rank} {item.course.title}
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
                  level <strong className="text-[#261b18]">{item.course.level}</strong>
                </p>
                <p className="text-sm text-[#6f5b54]">
                  title {item.titleMatchScore} · skills {item.skillMatchScore} · category {item.categoryMatchScore} · bonus {item.bonusScore}
                </p>
                <div className="flex flex-wrap gap-3">
                  <a className={secondaryButton} href={item.course.sourceUrl} rel="noreferrer" target="_blank">
                    Open course
                  </a>
                  <button className={primaryButton} onClick={() => saveCourse(item.course.id)} type="button">
                    Save
                  </button>
                </div>
              </div>
            ))}
          </div>
        </article>
      </section>
    </div>
  );
}
