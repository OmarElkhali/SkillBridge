import { useEffect, useState } from "react";
import { api } from "../services/api";
import type { SavedCourse } from "../types/api";

export function SavedCoursesPage() {
  const [saved, setSaved] = useState<SavedCourse[]>([]);
  const [message, setMessage] = useState("");

  async function load() {
    setSaved(await api.getSavedCourses());
  }

  useEffect(() => {
    load().catch((err) => setMessage(err instanceof Error ? err.message : "Unable to load saved courses."));
  }, []);

  async function remove(courseId: number) {
    try {
      await api.unsaveCourse(courseId);
      await load();
      setMessage("Saved course removed.");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Unable to remove the saved course.");
    }
  }

  async function startTracking(courseId: number) {
    try {
      await api.updateProgress(courseId, { status: "STARTED", progressPercent: 10 });
      setMessage("Course added to progress tracking.");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Unable to start tracking.");
    }
  }

  return (
    <div className="page-stack">
      <section className="hero-panel compact">
        <div>
          <p className="eyebrow">Saved courses</p>
          <h2>Your shortlist for focused learning.</h2>
        </div>
      </section>
      {message ? <p className="hint-banner">{message}</p> : null}
      <section className="card-grid">
        {saved.map((item) => (
          <article className="course-card" key={item.id}>
            <div className="course-meta">
              <span>{item.course.provider.name}</span>
              <span>{item.course.level}</span>
            </div>
            <h3>{item.course.title}</h3>
            <p>{item.course.description}</p>
            <div className="button-row">
              <a className="primary-button" href={item.course.sourceUrl} rel="noreferrer" target="_blank">
                Open course
              </a>
              <div className="button-row">
                <button className="ghost-button" onClick={() => startTracking(item.course.id)} type="button">
                  Start
                </button>
                <button className="ghost-button" onClick={() => remove(item.course.id)} type="button">
                  Remove
                </button>
              </div>
            </div>
          </article>
        ))}
        {saved.length === 0 ? <p className="empty-text">No saved courses yet. Save one from the catalog or recommendation page.</p> : null}
      </section>
    </div>
  );
}
