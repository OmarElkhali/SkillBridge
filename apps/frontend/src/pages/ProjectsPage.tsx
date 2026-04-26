import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { cx, emptyText, errorText, eyebrow, heroPanel, input, label, listCard, pageStack, panel, primaryButton, sectionTitle, textarea } from "../components/ui";
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
    <div className={cx(pageStack, "max-w-[1440px]")}>
      <section className={cx(heroPanel, "grid gap-3")}>
        <p className={eyebrow}>Project ideas</p>
        <h2 className={sectionTitle}>Capture what you want to build, then turn it into a path.</h2>
      </section>

      {message ? <p className={errorText}>{message}</p> : null}

      <section className="grid gap-5 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
        <article className={cx(panel, "grid gap-5 bg-[linear-gradient(135deg,rgba(199,97,63,0.08),rgba(255,219,173,0.22))]")}>
          <div className="grid gap-2">
            <p className={eyebrow}>New project idea</p>
            <h3 className="font-['Fraunces',_'Source_Serif_4',_Georgia,_serif] text-2xl text-[#261b18]">Describe what you want to build.</h3>
          </div>
          <form className="grid gap-4" onSubmit={handleSubmit}>
            <label className={label}>
              Project title
              <input
                className={input}
                required
                value={form.title}
                onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
              />
            </label>
            <label className={label}>
              Description
              <textarea
                className={textarea}
                required
                rows={8}
                value={form.description}
                onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
              />
            </label>
            <button className={primaryButton} type="submit">
              Save project idea
            </button>
          </form>
        </article>

        <article className={panel}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="font-['Fraunces',_'Source_Serif_4',_Georgia,_serif] text-2xl text-[#261b18]">Your project list</h3>
            <span className="text-sm text-[#6f5b54]">{projects.length} items</span>
          </div>
          <div className="mt-4 grid gap-3">
            {projects.map((project) => (
              <Link className={listCard} key={project.id} to={`/projects/${project.id}`}>
                <strong className="text-[#261b18]">{project.title}</strong>
                <p className="text-sm leading-6 text-[#6f5b54]">{project.description.slice(0, 135)}...</p>
                <small className="text-xs uppercase tracking-[0.24em] text-[#8c3f29]">{new Date(project.createdAt).toLocaleString()}</small>
              </Link>
            ))}
            {projects.length === 0 ? <p className={emptyText}>No project ideas yet. Add one to generate recommendations.</p> : null}
          </div>
        </article>
      </section>
    </div>
  );
}
