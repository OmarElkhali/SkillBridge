import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../services/api";
import { useAuth } from "../hooks/useAuth";
import type { ProjectIdea, ProgressEntry, SavedCourse } from "../types/api";

export function DashboardPage() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<ProjectIdea[]>([]);
  const [saved, setSaved] = useState<SavedCourse[]>([]);
  const [progress, setProgress] = useState<ProgressEntry[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([api.getProjects(), api.getSavedCourses(), api.getProgress()])
      .then(([projectItems, savedItems, progressItems]) => {
        setProjects(projectItems);
        setSaved(savedItems);
        setProgress(progressItems);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Unable to load the dashboard."));
  }, []);

  return (
    <div className="page-stack">
      <section className="hero-panel">
        <div>
          <p className="eyebrow">Welcome</p>
          <h2>
            {user?.firstName}, your learning path starts from what you want to build, not from a random course list.
          </h2>
          <p>
            Submit a project idea, inspect the detected skills, and turn recommendations into a progression plan you
            can actually follow.
          </p>
        </div>
        <Link className="primary-button" to="/projects">
          Open project ideas
        </Link>
      </section>

      {error ? <p className="error-text">{error}</p> : null}

      <section className="metrics-grid">
        <article className="metric-tile">
          <span>Projects</span>
          <strong>{projects.length}</strong>
          <p>Ideas you submitted for structured recommendations.</p>
        </article>
        <article className="metric-tile">
          <span>Saved courses</span>
          <strong>{saved.length}</strong>
          <p>Courses bookmarked for later review or follow-up.</p>
        </article>
        <article className="metric-tile">
          <span>Active progress</span>
          <strong>{progress.filter((item) => item.status !== "COMPLETED").length}</strong>
          <p>Courses still moving toward completion.</p>
        </article>
      </section>

      <section className="content-grid">
        <article className="panel">
          <div className="panel-heading">
            <h3>Recent project ideas</h3>
            <Link to="/projects">View all</Link>
          </div>
          <div className="stack-list">
            {projects.slice(0, 3).map((project) => (
              <Link key={project.id} className="list-card" to={`/projects/${project.id}`}>
                <strong>{project.title}</strong>
                <p>{project.description.slice(0, 120)}...</p>
              </Link>
            ))}
            {projects.length === 0 ? <p className="empty-text">No projects yet. Add one to start the recommendation flow.</p> : null}
          </div>
        </article>

        <article className="panel">
          <div className="panel-heading">
            <h3>Progress snapshot</h3>
            <Link to="/progress">Manage</Link>
          </div>
          <div className="stack-list">
            {progress.slice(0, 3).map((item) => (
              <div key={item.id} className="list-card">
                <strong>{item.course.title}</strong>
                <p>
                  {item.status} · {item.progressPercent}%
                </p>
              </div>
            ))}
            {progress.length === 0 ? <p className="empty-text">No progress entries yet. Save a course and start tracking it.</p> : null}
          </div>
        </article>
      </section>
    </div>
  );
}
