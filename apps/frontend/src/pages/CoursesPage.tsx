import { useDeferredValue, useEffect, useState } from "react";
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
    <div className="page-stack">
      <section className="hero-panel compact">
        <div>
          <p className="eyebrow">Course catalog</p>
          <h2>Explore the learning inventory behind the recommendation engine.</h2>
        </div>
        <input
          className="search-input"
          placeholder="Search by title, category, or skill"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </section>

      {message ? <p className="hint-banner">{message}</p> : null}

      <section className="card-grid">
        {filteredCourses.map((course) => (
          <article className="course-card" key={course.id}>
            <div className="course-meta">
              <span>{course.category.name}</span>
              <span>{course.level}</span>
            </div>
            <h3>{course.title}</h3>
            <p>{course.description}</p>
            <div className="tag-row">
              {course.skills.map((skill) => (
                <span className="tag" key={skill}>
                  {skill}
                </span>
              ))}
            </div>
            <div className="button-row">
              <a className="primary-button" href={course.sourceUrl} rel="noreferrer" target="_blank">
                Open course
              </a>
              <div className="button-row">
                <button className="ghost-button" onClick={() => toggleSave(course.id)} type="button">
                  {savedIds.has(course.id) ? "Remove" : "Save"}
                </button>
                <button className="ghost-button" onClick={() => startTracking(course.id)} type="button">
                  Start
                </button>
              </div>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
