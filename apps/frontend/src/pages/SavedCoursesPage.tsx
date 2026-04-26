import { useEffect, useState } from "react";
import { cx, emptyText, eyebrow, heroPanel, messageBanner, pageStack, panel, primaryButton, secondaryButton } from "../components/ui";
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
    <div className={cx(pageStack, "max-w-[1440px]")}>
      <section className={cx(heroPanel, "grid gap-3")}>
        <p className={eyebrow}>Saved courses</p>
        <h2 className="font-['Fraunces',_'Source_Serif_4',_Georgia,_serif] text-4xl leading-tight text-[#261b18]">Your shortlist for focused learning.</h2>
      </section>
      {message ? <p className={messageBanner}>{message}</p> : null}
      <section className="grid gap-5 md:grid-cols-2 2xl:grid-cols-3">
        {saved.map((item) => (
          <article className={cx(panel, "grid gap-4")} key={item.id}>
            <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-[#6f5b54]">
              <span>{item.course.provider.name}</span>
              <span>{item.course.level}</span>
            </div>
            <div className="grid gap-2">
              <h3 className="font-['Fraunces',_'Source_Serif_4',_Georgia,_serif] text-2xl text-[#261b18]">{item.course.title}</h3>
              <p className="text-sm leading-6 text-[#6f5b54]">{item.course.description}</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <a className={primaryButton} href={item.course.sourceUrl} rel="noreferrer" target="_blank">
                Open course
              </a>
              <button className={secondaryButton} onClick={() => startTracking(item.course.id)} type="button">
                Start
              </button>
              <button className={secondaryButton} onClick={() => remove(item.course.id)} type="button">
                Remove
              </button>
            </div>
          </article>
        ))}
        {saved.length === 0 ? <p className={emptyText}>No saved courses yet. Save one from the catalog or recommendation page.</p> : null}
      </section>
    </div>
  );
}
