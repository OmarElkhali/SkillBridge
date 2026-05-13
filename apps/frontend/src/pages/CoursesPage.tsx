import { useDeferredValue, useEffect, useState } from "react";
import {
  cx,
  emptyText,
  eyebrow,
  heroPanel,
  input,
  label,
  messageBanner,
  pageStack,
  panel,
  primaryButton,
  secondaryButton,
  tag,
} from "../components/ui";
import { api } from "../services/api";
import type { Category, Course, PageResponse, Provider, SavedCourse, Skill } from "../types/api";

const PAGE_SIZE = 12;

export function CoursesPage() {
  const [coursePage, setCoursePage] = useState<PageResponse<Course> | null>(null);
  const [saved, setSaved] = useState<SavedCourse[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [query, setQuery] = useState("");
  const [skillQuery, setSkillQuery] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [providerId, setProviderId] = useState("");
  const [skillId, setSkillId] = useState("");
  const [level, setLevel] = useState("");
  const [sort, setSort] = useState("title");
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const deferredQuery = useDeferredValue(query);

  useEffect(() => {
    setPage(0);
  }, [categoryId, deferredQuery, level, providerId, skillId, sort]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    api
      .getCourses({
        page,
        size: PAGE_SIZE,
        q: deferredQuery,
        categoryId: categoryId ? Number(categoryId) : undefined,
        providerId: providerId ? Number(providerId) : undefined,
        skillId: skillId ? Number(skillId) : undefined,
        level: level || undefined,
        sort,
      })
      .then((items) => {
        if (active) {
          setCoursePage(items);
        }
      })
      .catch((err) => {
        if (active) {
          setMessage(err instanceof Error ? err.message : "Unable to load courses.");
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, [categoryId, deferredQuery, level, page, providerId, skillId, sort]);

  useEffect(() => {
    Promise.all([api.getSavedCourses(), api.getCategories(), api.getProviders(), api.searchSkills({ page: 0, size: 20 })])
      .then(([savedItems, categoryItems, providerItems, skillItems]) => {
        setSaved(savedItems);
        setCategories(categoryItems);
        setProviders(providerItems.slice(0, 80));
        setSkills(skillItems.content);
      })
      .catch(() => setSaved([]));
  }, []);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      api.searchSkills({ page: 0, size: 20, q: skillQuery }).then((data) => setSkills(data.content)).catch(() => undefined);
    }, 250);
    return () => window.clearTimeout(handle);
  }, [skillQuery]);

  const savedIds = new Set(saved.map((item) => item.course.id));
  const courses = coursePage?.content ?? [];

  async function toggleSave(courseId: number) {
    const isSaved = savedIds.has(courseId);
    try {
      if (isSaved) {
        await api.unsaveCourse(courseId);
      } else {
        await api.saveCourse(courseId);
      }
      setSaved(await api.getSavedCourses());
      setMessage(isSaved ? "Course removed from saved list." : "Course saved successfully.");
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

  async function recordCourseClick(courseId: number) {
    try {
      await api.recordCourseClick(courseId);
    } catch {
      // Click tracking is best-effort and should never block opening a course.
    }
  }

  return (
    <div className={cx(pageStack, "max-w-[1440px]")}>
      <section className={cx(heroPanel, "grid gap-8 lg:grid-cols-[minmax(0,1fr)_420px] lg:items-center")}>
        <div className="absolute top-0 left-0 -ml-20 -mt-20 h-64 w-64 rounded-full bg-[var(--color-accent)] opacity-20 blur-[80px]" />

        <div className="relative z-10 grid gap-4">
          <p className={eyebrow}>Course catalog</p>
          <h2 className="font-['Fraunces',_'Source_Serif_4',_Georgia,_serif] text-4xl lg:text-5xl font-bold leading-tight text-[var(--color-text)]">
            Search the <span className="text-[var(--color-accent)]">entire catalog</span>
          </h2>
          <p className="max-w-2xl text-[1.05rem] leading-relaxed text-[var(--color-text-muted)] mt-2">
            Find exactly what you need from over 17,000 courses. Results are paginated from our backend to keep things fast and smooth.
          </p>
        </div>
        <div className="relative z-10 w-full">
          <label className="grid gap-2 text-sm font-semibold text-[var(--color-text-muted)]">
            <span className="sr-only">Search courses</span>
            <div className="relative">
              <svg className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                className={cx(input, "pl-11 py-4 text-lg shadow-lg border-[var(--accent-border)]")}
                placeholder="Try spring, security, postgres..."
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </div>
          </label>
        </div>
      </section>

      <section className={cx(panel, "grid gap-4 lg:grid-cols-5 p-4 sm:p-6")}>
        <label className={label}>
          Category
          <select className={input} value={categoryId} onChange={(event) => setCategoryId(event.target.value)}>
            <option value="">All categories</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </label>
        <label className={label}>
          Provider
          <select className={input} value={providerId} onChange={(event) => setProviderId(event.target.value)}>
            <option value="">Top providers</option>
            {providers.map((provider) => (
              <option key={provider.id} value={provider.id}>
                {provider.name}
              </option>
            ))}
          </select>
        </label>
        <div className="grid grid-cols-2 gap-3 lg:block lg:space-y-3">
          <label className={label}>
            <span className="sr-only">Search skills</span>
            <input className={input} placeholder="Search skills" value={skillQuery} onChange={(event) => setSkillQuery(event.target.value)} />
          </label>
          <label className={label}>
            <span className="sr-only">Select skill</span>
            <select className={input} value={skillId} onChange={(event) => setSkillId(event.target.value)}>
              <option value="">Any skill</option>
              {skills.map((skill) => (
                <option key={skill.id} value={skill.id}>
                  {skill.name}
                </option>
              ))}
            </select>
          </label>
        </div>
        <label className={label}>
          Level
          <select className={input} value={level} onChange={(event) => setLevel(event.target.value)}>
            <option value="">All levels</option>
            <option value="BEGINNER">Beginner</option>
            <option value="INTERMEDIATE">Intermediate</option>
            <option value="ADVANCED">Advanced</option>
          </select>
        </label>
        <label className={label}>
          Sort
          <select className={input} value={sort} onChange={(event) => setSort(event.target.value)}>
            <option value="title">Title</option>
            <option value="popularity">Popularity score</option>
          </select>
        </label>
      </section>

      {message ? <p className={messageBanner}>{message}</p> : null}

      <div className="flex flex-wrap items-center justify-between gap-3 px-2">
        <span className="text-[0.95rem] font-semibold text-[var(--color-text-muted)]">
          {loading
            ? "Loading courses..."
            : <><strong className="text-[var(--color-text-strong)]">{coursePage?.totalElements ?? 0}</strong> result{coursePage?.totalElements === 1 ? "" : "s"} found</>}
        </span>
        {coursePage && coursePage.totalPages > 0 ? (
          <span className="text-[0.95rem] font-semibold text-[var(--color-text-muted)] border border-[var(--line)] bg-[var(--color-surface)] px-4 py-1.5 rounded-full">
            Page <strong className="text-[var(--color-text-strong)]">{coursePage.page + 1}</strong> of <strong className="text-[var(--color-text-strong)]">{coursePage.totalPages}</strong>
          </span>
        ) : null}
      </div>

      <section className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {loading
          ? Array.from({ length: 8 }).map((_, index) => (
              <article className={cx(panel, "min-h-[320px] animate-pulse bg-white/40")} key={index} />
            ))
          : courses.map((course) => (
              <article className={cx(panel, "group relative flex flex-col gap-5 p-6 hover:-translate-y-2 overflow-hidden")} key={course.id}>
                <div className="absolute top-0 right-0 h-32 w-32 translate-x-12 -translate-y-12 rounded-full bg-[var(--accent-wash)] opacity-50 blur-3xl transition-all group-hover:opacity-100" />

                <div className="relative z-10 flex flex-col gap-4 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-3 text-[0.85rem] font-bold text-[var(--color-accent-dark)] uppercase tracking-wide">
                    <span className="truncate max-w-[60%]">{course.category.name}</span>
                    <span className="bg-[var(--accent-wash)] px-2 py-0.5 rounded-md text-[0.75rem]">{course.level}</span>
                  </div>

                  <div className="grid gap-2.5">
                    <h3 className="font-['Fraunces',_'Source_Serif_4',_Georgia,_serif] text-[1.4rem] font-bold leading-tight text-[var(--color-text-strong)] group-hover:text-[var(--color-accent-dark)] transition-colors line-clamp-2">
                      {course.title}
                    </h3>
                    <p className="line-clamp-3 text-[0.95rem] leading-relaxed text-[var(--color-text-muted)]">
                      {course.description}
                    </p>
                  </div>

                  <div className="mt-auto flex flex-wrap gap-2 pt-2">
                    {course.skills.slice(0, 3).map((skill) => (
                      <span className={tag} key={skill}>
                        {skill}
                      </span>
                    ))}
                    {course.skills.length > 3 ? <span className={tag}>+{course.skills.length - 3}</span> : null}
                  </div>
                </div>

                <div className="relative z-10 grid grid-cols-[1fr_auto_auto] items-center gap-2 border-t border-[var(--line-soft)] pt-5">
                  <a className={cx(primaryButton, "w-full text-center px-0 text-[0.9rem] py-2.5")} href={course.sourceUrl} rel="noreferrer" target="_blank" onClick={() => void recordCourseClick(course.id)}>
                    View Course
                  </a>
                  <button
                    className="flex h-11 w-11 items-center justify-center rounded-full border border-[var(--line)] bg-white text-[var(--color-text-muted)] transition-all hover:bg-[var(--accent-wash)] hover:text-[var(--color-accent-dark)] hover:border-[var(--accent-border)]"
                    onClick={() => toggleSave(course.id)}
                    type="button"
                    aria-label={savedIds.has(course.id) ? "Remove from saved" : "Save course"}
                  >
                    <svg className="h-5 w-5" fill={savedIds.has(course.id) ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                    </svg>
                  </button>
                  <button
                    className="flex h-11 w-11 items-center justify-center rounded-full border border-[var(--line)] bg-white text-[var(--color-text-muted)] transition-all hover:bg-green-50 hover:text-green-600 hover:border-green-200"
                    onClick={() => startTracking(course.id)}
                    type="button"
                    title="Start tracking"
                  >
                    <svg className="h-5 w-5 ml-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </button>
                </div>
              </article>
            ))}
        {!loading && courses.length === 0 ? (
          <div className="col-span-full rounded-[1.5rem] border border-dashed border-[var(--line)] bg-[var(--color-surface-muted)] py-16 text-center">
            <p className="text-lg font-bold text-[var(--color-text-strong)]">No courses found</p>
            <p className={cx(emptyText, "mt-2")}>Try adjusting your search or filters to find what you're looking for.</p>
          </div>
        ) : null}
      </section>

      {coursePage && coursePage.totalPages > 1 ? (
        <div className="flex flex-wrap items-center justify-center gap-4 mt-8">
          <button className={cx(secondaryButton, "px-8 py-3")} disabled={coursePage.first} onClick={() => setPage((value) => Math.max(0, value - 1))} type="button">
            &larr; Previous Page
          </button>
          <button className={cx(secondaryButton, "px-8 py-3")} disabled={coursePage.last} onClick={() => setPage((value) => value + 1)} type="button">
            Next Page &rarr;
          </button>
        </div>
      ) : null}
    </div>
  );
}
