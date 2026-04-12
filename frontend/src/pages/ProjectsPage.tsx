import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../services/api";
import type { ProjectIdea } from "../types/api";

export function ProjectsPage() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<ProjectIdea[]>([]);
  const [form, setForm] = useState({ title: "", description: "" });
  const [message, setMessage] = useState("");

  async function loadProjects() {
    const data = await api.getProjects();
    setProjects(data);
  }

  useEffect(() => {
    loadProjects().catch((err) => setMessage(err instanceof Error ? err.message : "Unable to load projects."));
  }, []);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    try {
      const project = await api.createProject(form);
      setForm({ title: "", description: "" });
      await loadProjects();
      navigate(`/projects/${project.id}`);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Unable to create the project idea.");
    }
  }

  return (
    <div className="page-stack">
      <section className="content-grid">
        <article className="panel accent-panel">
          <p className="eyebrow">New project idea</p>
          <h2>Describe what you want to build.</h2>
          <form className="stack-form" onSubmit={handleSubmit}>
            <label>
              Project title
              <input
                required
                value={form.title}
                onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
              />
            </label>
            <label>
              Description
              <textarea
                required
                rows={8}
                value={form.description}
                onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
              />
            </label>
            <button className="primary-button" type="submit">
              Save project idea
            </button>
          </form>
        </article>

        <article className="panel">
          <div className="panel-heading">
            <h3>Your project list</h3>
            <span>{projects.length} items</span>
          </div>
          {message ? <p className="error-text">{message}</p> : null}
          <div className="stack-list">
            {projects.map((project) => (
              <Link className="list-card" key={project.id} to={`/projects/${project.id}`}>
                <strong>{project.title}</strong>
                <p>{project.description.slice(0, 135)}...</p>
                <small>{new Date(project.createdAt).toLocaleString()}</small>
              </Link>
            ))}
            {projects.length === 0 ? <p className="empty-text">No project ideas yet. Add one to generate recommendations.</p> : null}
          </div>
        </article>
      </section>
    </div>
  );
}
