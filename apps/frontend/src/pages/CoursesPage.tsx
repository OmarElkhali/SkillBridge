import { useDeferredValue, useEffect, useState } from "react";
import { cx, emptyText, eyebrow, heroPanel, input, messageBanner, pageStack, panel, primaryButton, secondaryButton, tag } from "../components/ui";
import { api } from "../services/api";
import type { Course, SavedCourse } from "../types/api";

export function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [saved, setSaved] = useState<SavedCourse[]>([]);
  const [query, setQuery] = useState("");
  const [message, setMessage] = useState("");
  const deferredQuery = useDeferredValue(query);

  useEffect(() => {
    Promise.all([api.getCourses(), api.getSavedCourses()])
      .then(([courseItems, savedItems]) => {
        setCourses(courseItems);
        setSaved(savedItems);
      })
      .catch((err) => setMessage(err instanceof Error ? err.message : "Unable to load courses."));
  }, []);

  const savedIds = new Set(saved.map((item) => item.course.id));
  const filteredCourses = courses.filter((course) => {
    const haystack = `${course.title} ${course.description} ${course.skills.join(" ")} ${course.category.name}`.toLowerCase();
    return haystack.includes(deferredQuery.toLowerCase());
  });

  async function toggleSave(courseId: number) {
    try {
      if (savedIds.has(courseId)) {
        await api.unsaveCourse(courseId);
      } else {
        await api.saveCourse(courseId);
      }
      setSaved(await api.getSavedCourses());
      setMessage(savedIds.has(courseId) ? "Course removed from saved list." : "Course saved successfully.");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Unable to update saved courses.");
    }
  }

  async function startTracking(courseId: number) {
    try {
      await api.updateProgress(courseId, { status: "STARTED", progressPercent: 10 });
      setMessage("Course added to progress tracking.");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Unable to start progress tracking.");
    }
  }

  return (
    <div className={cx(pageStack, "max-w-[1440px]")}>
      <section className={cx(heroPanel, "grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-end")}>
        <div className="grid gap-2">
          <p className={eyebrow}>Course catalog</p>
          <h2 className="font-['Fraunces',_'Source_Serif_4',_Georgia,_serif] text-4xl leading-tight text-[#261b18]">
            Explore the learning inventory behind the recommendation engine.
          </h2>
        </div>
        <input
          className={input}
          placeholder="Search by title, category, or skill"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </section>

      {message ? <p className={messageBanner}>{message}</p> : null}

      <section className="grid gap-5 md:grid-cols-2 2xl:grid-cols-3">
        {filteredCourses.map((course) => (
          <article className={cx(panel, "grid gap-4")} key={course.id}>
            <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-[#6f5b54]">
              <span>{course.category.name}</span>
              <span>{course.level}</span>
            </div>
            <div className="grid gap-2">
              <h3 className="font-['Fraunces',_'Source_Serif_4',_Georgia,_serif] text-2xl text-[#261b18]">{course.title}</h3>
              <p className="text-sm leading-6 text-[#6f5b54]">{course.description}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {course.skills.map((skill) => (
                <span className={tag} key={skill}>
                  {skill}
                </span>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <a className={primaryButton} href={course.sourceUrl} rel="noreferrer" target="_blank">
                Open course
              </a>
              <button className={secondaryButton} onClick={() => toggleSave(course.id)} type="button">
                {savedIds.has(course.id) ? "Remove" : "Save"}
              </button>
              <button className={secondaryButton} onClick={() => startTracking(course.id)} type="button">
                Start
              </button>
            </div>
          </article>
        ))}
        {filteredCourses.length === 0 ? <p className={emptyText}>No courses matched your search yet.</p> : null}
      </section>
    </div>
  );
}
