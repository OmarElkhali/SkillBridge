import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { cx, emptyText, errorText, eyebrow, heroPanel, input, label, listCard, mutedText, pageStack, panel, primaryButton, sectionTitle, textarea } from "../components/ui";
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
      <section className={cx(heroPanel, "grid gap-4 py-10 lg:py-14")}>
        <div className="absolute inset-0 bg-gradient-to-r from-[var(--color-accent)] to-transparent opacity-5" />
        <div className="relative z-10 grid gap-3">
          <p className={eyebrow}>Project ideas</p>
          <h2 className={cx(sectionTitle, "max-w-2xl")}>
            Capture what you want to build, then turn it into a path.
          </h2>
          <p className={cx(mutedText, "max-w-3xl")}>
            Describe the features, audience, and goals of your project. We'll extract the required skills and match you with the exact courses needed to build it.
          </p>
        </div>
      </section>

      {message ? <p className={errorText}>{message}</p> : null}

      <section className="grid gap-6 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] items-start">
        <article className={cx(panel, "grid gap-6 bg-gradient-to-br from-[var(--accent-wash)] to-[var(--color-surface)] border-[var(--accent-border)]")}>
          <div className="grid gap-2 border-b border-[var(--accent-border)] pb-4">
            <p className={eyebrow}>New project idea</p>
            <h3 className="font-['Fraunces',_'Source_Serif_4',_Georgia,_serif] text-2xl font-bold text-[var(--color-text)]">Describe what you want to build.</h3>
          </div>
          <form className="grid gap-5" onSubmit={handleSubmit}>
            <label className={label}>
              Project title
              <input
                className={input}
                required
                placeholder="e.g. Real-time collaboration tool"
                value={form.title}
                onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
              />
            </label>
            <label className={label}>
              Description
              <textarea
                className={textarea}
                required
                placeholder="I want to build a tool where users can draw on a shared canvas in real-time, save their work, and invite friends..."
                rows={6}
                value={form.description}
                onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
              />
            </label>
            <button className={cx(primaryButton, "w-full text-lg shadow-xl shadow-[var(--accent-wash-strong)] mt-2")} type="submit">
              Save project idea
            </button>
          </form>
        </article>

        <article className={cx(panel, "flex flex-col gap-5")}>
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--line-soft)] pb-4">
            <div>
              <p className={eyebrow}>Your workspace</p>
              <h3 className="mt-1 font-['Fraunces',_'Source_Serif_4',_Georgia,_serif] text-2xl font-bold text-[var(--color-text)]">Your project list</h3>
            </div>
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[var(--accent-wash)] text-sm font-bold text-[var(--color-accent-dark)]">
              {projects.length}
            </span>
          </div>
          <div className="grid gap-4">
            {projects.map((project) => (
              <Link className={listCard} key={project.id} to={`/projects/${project.id}`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="grid gap-2">
                    <strong className="text-xl font-bold text-[var(--color-text-strong)] group-hover:text-[var(--color-accent)] transition-colors">{project.title}</strong>
                    <p className="text-[0.95rem] leading-relaxed text-[var(--color-text-muted)] line-clamp-2">{project.description}</p>
                    <small className="mt-1 text-xs font-bold uppercase tracking-wider text-[var(--color-accent-dark)]/60">
                      Added {new Date(project.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </small>
                  </div>
                  <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white shadow-sm border border-[var(--line-soft)] text-[var(--color-text-muted)] group-hover:bg-[var(--color-accent)] group-hover:text-white group-hover:border-transparent transition-all">
                    <svg fill="none" height="20" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="20">
                      <line x1="5" y1="12" x2="19" y2="12" />
                      <polyline points="12 5 19 12 12 19" />
                    </svg>
                  </div>
                </div>
              </Link>
            ))}
            {projects.length === 0 ? (
              <div className="rounded-[1.25rem] border border-dashed border-[var(--line)] bg-[var(--color-surface-muted)] py-12 text-center">
                <p className="text-lg font-bold text-[var(--color-text-strong)]">No project ideas yet</p>
                <p className={cx(emptyText, "mt-2 max-w-sm mx-auto")}>Add one using the form to start generating personalized course recommendations.</p>
              </div>
            ) : null}
          </div>
        </article>
      </section>
    </div>
  );
}
