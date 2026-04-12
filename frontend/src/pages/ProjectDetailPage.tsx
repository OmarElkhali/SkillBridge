import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../services/api";
import type { ProjectIdea, RecommendationResponse } from "../types/api";

export function ProjectDetailPage() {
  const params = useParams();
  const projectId = Number(params.id);
  const [project, setProject] = useState<ProjectIdea | null>(null);
  const [recommendations, setRecommendations] = useState<RecommendationResponse | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    Promise.all([
      api.getProject(projectId),
      api.getLatestRecommendations(projectId).catch(() => null),
    ])
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

  return (
    <div className="page-stack">
      <section className="hero-panel">
        <div>
          <p className="eyebrow">Project detail</p>
          <h2>{project?.title ?? "Project idea"}</h2>
          <p>{project?.description}</p>
        </div>
        <button className="primary-button" disabled={loading} onClick={generateRecommendations} type="button">
          {loading ? "Generating..." : "Generate recommendations"}
        </button>
      </section>

      {message ? <p className="hint-banner">{message}</p> : null}

      <section className="content-grid">
        <article className="panel">
          <div className="panel-heading">
            <h3>Detected skills</h3>
            <span>{recommendations?.detectedSkills.length ?? 0}</span>
          </div>
          <div className="tag-row">
            {(recommendations?.detectedSkills ?? []).map((skill) => (
              <span className="tag" key={`${skill.skillId}-${skill.matchedKeyword}`}>
                {skill.skillName} · {skill.matchedKeyword}
              </span>
            ))}
          </div>
          {!recommendations ? <p className="empty-text">Run the recommendation engine to populate this section.</p> : null}
        </article>

        <article className="panel">
          <div className="panel-heading">
            <h3>Recommendation snapshot</h3>
            <span>{recommendations?.algorithmVersion ?? "Not generated"}</span>
          </div>
          <p className="snapshot-copy">
            Keywords: <strong>{recommendations?.keywordSummary || "No snapshot generated yet."}</strong>
          </p>
          <div className="stack-list">
            {(recommendations?.recommendations ?? []).map((item) => (
              <div className="list-card" key={item.course.id}>
                <div className="list-card-header">
                  <strong>
                    #{item.rank} {item.course.title}
                  </strong>
                  <span className="score-pill">{item.score} pts</span>
                </div>
                <p>{item.explanation}</p>
                <p className="score-breakdown">
                  title {item.titleMatchScore} · skills {item.skillMatchScore} · category {item.categoryMatchScore}
                  · bonus {item.bonusScore}
                </p>
                <div className="button-row">
                  <a className="ghost-button" href={item.course.sourceUrl} rel="noreferrer" target="_blank">
                    Open course
                  </a>
                  <button className="primary-button" onClick={() => saveCourse(item.course.id)} type="button">
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
