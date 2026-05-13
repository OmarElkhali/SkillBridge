import { useDeferredValue, useEffect, useState, type FormEvent } from "react";
import {
  cx,
  dangerButton,
  emptyText,
  eyebrow,
  heroPanel,
  input,
  label,
  listCard,
  messageBanner,
  pageStack,
  panel,
  primaryButton,
  secondaryButton,
  select,
  tag,
  tagActive,
  textarea,
} from "../components/ui";
import { api } from "../services/api";
import type { Category, Course, PageResponse, Provider, Skill } from "../types/api";

type ResourceType = "courses" | "categories" | "providers" | "skills";

interface Props {
  resource: ResourceType;
}

const titles: Record<ResourceType, string> = {
  courses: "Course management",
  categories: "Category management",
  providers: "Provider management",
  skills: "Skill management",
};

const COURSE_PAGE_SIZE = 10;
const SKILL_PAGE_SIZE = 25;

const emptyCourseForm = {
  id: 0,
  title: "",
  description: "",
  level: "BEGINNER",
  language: "English",
  sourceUrl: "",
  thumbnailUrl: "",
  categoryId: 0,
  providerId: 0,
  skillIds: [] as number[],
  published: true,
  popularityScore: 0,
};

export function AdminCatalogPage({ resource }: Props) {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [skillsPage, setSkillsPage] = useState<PageResponse<Skill> | null>(null);
  const [coursePage, setCoursePage] = useState<PageResponse<Course> | null>(null);
  const [selectedSkills, setSelectedSkills] = useState<Skill[]>([]);
  const [simpleForm, setSimpleForm] = useState({ id: 0, name: "", description: "", websiteUrl: "" });
  const [courseForm, setCourseForm] = useState(emptyCourseForm);
  const [resourceQuery, setResourceQuery] = useState("");
  const [courseQuery, setCourseQuery] = useState("");
  const [skillQuery, setSkillQuery] = useState("");
  const [resourcePage, setResourcePage] = useState(0);
  const [courseListPage, setCourseListPage] = useState(0);
  const [skillPickerPage, setSkillPickerPage] = useState(0);

  const deferredResourceQuery = useDeferredValue(resourceQuery);
  const deferredCourseQuery = useDeferredValue(courseQuery);
  const deferredSkillQuery = useDeferredValue(skillQuery);

  useEffect(() => {
    setMessage("");
    setSimpleForm({ id: 0, name: "", description: "", websiteUrl: "" });
    setCourseForm(emptyCourseForm);
    setSelectedSkills([]);
    setResourceQuery("");
    setCourseQuery("");
    setSkillQuery("");
    setResourcePage(0);
    setCourseListPage(0);
    setSkillPickerPage(0);
  }, [resource]);

  useEffect(() => {
    setResourcePage(0);
  }, [deferredResourceQuery]);

  useEffect(() => {
    setCourseListPage(0);
  }, [deferredCourseQuery]);

  useEffect(() => {
    setSkillPickerPage(0);
  }, [deferredSkillQuery]);

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      try {
        if (resource === "courses") {
          const [categoryItems, providerItems, courseItems, skillItems] = await Promise.all([
            api.getCategories(),
            api.getProviders(),
            api.getCourses({ admin: true, page: courseListPage, size: COURSE_PAGE_SIZE, q: deferredCourseQuery }),
            api.searchSkills({ page: skillPickerPage, size: SKILL_PAGE_SIZE, q: deferredSkillQuery }),
          ]);
          if (!active) return;
          setCategories(categoryItems);
          setProviders(providerItems);
          setCoursePage(courseItems);
          setSkillsPage(skillItems);
          setCourseForm((current) => ({
            ...current,
            categoryId: current.categoryId || categoryItems[0]?.id || 0,
            providerId: current.providerId || providerItems[0]?.id || 0,
          }));
        } else if (resource === "categories") {
          const categoryItems = await api.getCategories();
          if (!active) return;
          setCategories(categoryItems);
        } else if (resource === "providers") {
          const providerItems = await api.getProviders();
          if (!active) return;
          setProviders(providerItems);
        } else {
          const skillItems = await api.searchSkills({ page: resourcePage, size: SKILL_PAGE_SIZE, q: deferredResourceQuery });
          if (!active) return;
          setSkillsPage(skillItems);
        }
      } catch (err) {
        if (active) {
          setMessage(err instanceof Error ? err.message : "Unable to load catalog data.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    load();
    return () => {
      active = false;
    };
  }, [courseListPage, deferredCourseQuery, deferredResourceQuery, deferredSkillQuery, resource, resourcePage, skillPickerPage]);

  const simpleItems = resource === "categories" ? categories : resource === "providers" ? providers : skillsPage?.content ?? [];

  async function reloadCurrentResource() {
    if (resource === "courses") {
      const courseItems = await api.getCourses({ admin: true, page: courseListPage, size: COURSE_PAGE_SIZE, q: deferredCourseQuery });
      setCoursePage(courseItems);
    } else if (resource === "categories") {
      setCategories(await api.getCategories());
    } else if (resource === "providers") {
      setProviders(await api.getProviders());
    } else {
      setSkillsPage(await api.searchSkills({ page: resourcePage, size: SKILL_PAGE_SIZE, q: deferredResourceQuery }));
    }
  }

  async function submitSimple(event: FormEvent) {
    event.preventDefault();
    try {
      if (resource === "categories") {
        simpleForm.id ? await api.updateCategory(simpleForm.id, simpleForm) : await api.createCategory(simpleForm);
      } else if (resource === "providers") {
        simpleForm.id ? await api.updateProvider(simpleForm.id, simpleForm) : await api.createProvider(simpleForm);
      } else if (resource === "skills") {
        simpleForm.id ? await api.updateSkill(simpleForm.id, simpleForm) : await api.createSkill(simpleForm);
      }
      setSimpleForm({ id: 0, name: "", description: "", websiteUrl: "" });
      await reloadCurrentResource();
      setMessage("Resource saved.");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Unable to save the resource.");
    }
  }

  async function submitCourse(event: FormEvent) {
    event.preventDefault();
    try {
      const payload = { ...courseForm, skillIds: selectedSkills.map((skill) => skill.id) };
      courseForm.id ? await api.updateCourse(courseForm.id, payload) : await api.createCourse(payload);
      setCourseForm({
        ...emptyCourseForm,
        categoryId: categories[0]?.id || 0,
        providerId: providers[0]?.id || 0,
      });
      setSelectedSkills([]);
      await reloadCurrentResource();
      setMessage("Course saved.");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Unable to save the course.");
    }
  }

  async function remove(id: number) {
    try {
      if (resource === "categories") await api.deleteCategory(id);
      if (resource === "providers") await api.deleteProvider(id);
      if (resource === "skills") await api.deleteSkill(id);
      if (resource === "courses") await api.deleteCourse(id);
      await reloadCurrentResource();
      setMessage("Resource deleted.");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Unable to delete the resource.");
    }
  }

  function toggleSkill(skill: Skill) {
    setSelectedSkills((current) => {
      if (current.some((item) => item.id === skill.id)) {
        return current.filter((item) => item.id !== skill.id);
      }
      return [...current, skill];
    });
  }

  function editCourse(course: Course) {
    setCourseForm({
      id: course.id,
      title: course.title,
      description: course.description,
      level: course.level,
      language: course.language,
      sourceUrl: course.sourceUrl,
      thumbnailUrl: course.thumbnailUrl ?? "",
      categoryId: course.category.id,
      providerId: course.provider.id,
      skillIds: course.skillIds,
      published: course.published,
      popularityScore: course.popularityScore,
    });
    setSelectedSkills(course.skillIds.map((id, index) => ({ id, name: course.skills[index] ?? `Skill ${id}`, slug: "", description: null })));
  }

  return (
    <div className={cx(pageStack, "max-w-[1440px]")}>
      <section className={cx(heroPanel, "grid gap-3")}>
        <p className={eyebrow}>Admin catalog</p>
        <h2 className="font-['Fraunces',_'Source_Serif_4',_Georgia,_serif] text-4xl leading-tight text-[#261b18]">{titles[resource]}</h2>
        <p className="max-w-3xl text-sm leading-6 text-[#6f5b54]">
          This screen now loads only the active resource, which keeps admin work fast with the imported BigData catalog.
        </p>
      </section>
      {message ? <p className={messageBanner}>{message}</p> : null}

      {resource === "courses" ? (
        <section className="grid gap-5 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
          <article className={panel}>
            <h3 className="font-['Fraunces',_'Source_Serif_4',_Georgia,_serif] text-2xl text-[#261b18]">{courseForm.id ? "Edit course" : "Create course"}</h3>
            <form className="mt-4 grid gap-4" onSubmit={submitCourse}>
              <label className={label}>
                Title
                <input className={input} required value={courseForm.title} onChange={(e) => setCourseForm({ ...courseForm, title: e.target.value })} />
              </label>
              <label className={label}>
                Description
                <textarea className={textarea} required rows={5} value={courseForm.description} onChange={(e) => setCourseForm({ ...courseForm, description: e.target.value })} />
              </label>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className={label}>
                  Level
                  <select className={select} value={courseForm.level} onChange={(e) => setCourseForm({ ...courseForm, level: e.target.value })}>
                    <option>BEGINNER</option>
                    <option>INTERMEDIATE</option>
                    <option>ADVANCED</option>
                  </select>
                </label>
                <label className={label}>
                  Language
                  <input className={input} required value={courseForm.language} onChange={(e) => setCourseForm({ ...courseForm, language: e.target.value })} />
                </label>
              </div>
              <label className={label}>
                Source URL
                <input className={input} required value={courseForm.sourceUrl} onChange={(e) => setCourseForm({ ...courseForm, sourceUrl: e.target.value })} />
              </label>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className={label}>
                  Category
                  <select className={select} value={courseForm.categoryId} onChange={(e) => setCourseForm({ ...courseForm, categoryId: Number(e.target.value) })}>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className={label}>
                  Provider
                  <select className={select} value={courseForm.providerId} onChange={(e) => setCourseForm({ ...courseForm, providerId: Number(e.target.value) })}>
                    {providers.map((provider) => (
                      <option key={provider.id} value={provider.id}>
                        {provider.name}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <label className={label}>
                Popularity score
                <input className={input} min={0} type="number" value={courseForm.popularityScore} onChange={(e) => setCourseForm({ ...courseForm, popularityScore: Number(e.target.value) })} />
              </label>
              <div className="grid gap-3">
                <label className={label}>
                  Search skills
                  <input className={input} placeholder="Search a skill before selecting it" value={skillQuery} onChange={(e) => setSkillQuery(e.target.value)} />
                </label>
                <div className="flex flex-wrap gap-2">
                  {selectedSkills.map((skill) => (
                    <button className={cx(tag, tagActive)} key={skill.id} onClick={() => toggleSkill(skill)} type="button">
                      {skill.name}
                    </button>
                  ))}
                </div>
                <div className="max-h-[260px] overflow-y-auto rounded-[1.2rem] border border-[var(--line-faint)] bg-white/45 p-3">
                  <div className="flex flex-wrap gap-2">
                    {(skillsPage?.content ?? []).map((skill) => (
                      <button
                        className={cx(tag, selectedSkills.some((item) => item.id === skill.id) && tagActive)}
                        key={skill.id}
                        onClick={() => toggleSkill(skill)}
                        type="button"
                      >
                        {skill.name}
                      </button>
                    ))}
                  </div>
                </div>
                {skillsPage && skillsPage.totalPages > 1 ? (
                  <div className="flex gap-2">
                    <button className={secondaryButton} disabled={skillsPage.first} onClick={() => setSkillPickerPage((value) => Math.max(0, value - 1))} type="button">
                      Previous skills
                    </button>
                    <button className={secondaryButton} disabled={skillsPage.last} onClick={() => setSkillPickerPage((value) => value + 1)} type="button">
                      Next skills
                    </button>
                  </div>
                ) : null}
              </div>
              <button className={primaryButton} type="submit">
                {courseForm.id ? "Update course" : "Create course"}
              </button>
            </form>
          </article>

          <article className={panel}>
            <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
              <label className={label}>
                Search existing courses
                <input className={input} placeholder="Search by title, provider, category, skill" value={courseQuery} onChange={(e) => setCourseQuery(e.target.value)} />
              </label>
              <span className="pb-3 text-sm text-[var(--color-text-muted)]">{coursePage?.totalElements ?? 0} courses</span>
            </div>
            <div className="mt-4 grid gap-3">
              {loading ? <p className={emptyText}>Loading...</p> : null}
              {(coursePage?.content ?? []).map((course) => (
                <div className={listCard} key={course.id}>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <strong className="text-[#261b18]">{course.title}</strong>
                    <span className="text-sm text-[#6f5b54]">{course.category.name}</span>
                  </div>
                  <p className="text-sm leading-6 text-[#6f5b54]">{course.description.slice(0, 140)}...</p>
                  <div className="flex flex-wrap gap-3">
                    <button className={secondaryButton} onClick={() => editCourse(course)} type="button">
                      Edit
                    </button>
                    <button className={dangerButton} onClick={() => remove(course.id)} type="button">
                      Delete
                    </button>
                  </div>
                </div>
              ))}
              {!loading && (coursePage?.content.length ?? 0) === 0 ? <p className={emptyText}>No courses found.</p> : null}
            </div>
            {coursePage && coursePage.totalPages > 1 ? (
              <div className="mt-4 flex flex-wrap gap-2">
                <button className={secondaryButton} disabled={coursePage.first} onClick={() => setCourseListPage((value) => Math.max(0, value - 1))} type="button">
                  Previous
                </button>
                <button className={secondaryButton} disabled={coursePage.last} onClick={() => setCourseListPage((value) => value + 1)} type="button">
                  Next
                </button>
              </div>
            ) : null}
          </article>
        </section>
      ) : (
        <section className="grid gap-5 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
          <article className={panel}>
            <h3 className="font-['Fraunces',_'Source_Serif_4',_Georgia,_serif] text-2xl text-[#261b18]">{simpleForm.id ? "Edit resource" : "Create resource"}</h3>
            <form className="mt-4 grid gap-4" onSubmit={submitSimple}>
              <label className={label}>
                Name
                <input className={input} required value={simpleForm.name} onChange={(e) => setSimpleForm({ ...simpleForm, name: e.target.value })} />
              </label>
              {resource === "providers" ? (
                <label className={label}>
                  Website URL
                  <input className={input} value={simpleForm.websiteUrl} onChange={(e) => setSimpleForm({ ...simpleForm, websiteUrl: e.target.value })} />
                </label>
              ) : null}
              <label className={label}>
                Description
                <textarea className={textarea} rows={6} value={simpleForm.description} onChange={(e) => setSimpleForm({ ...simpleForm, description: e.target.value })} />
              </label>
              <button className={primaryButton} type="submit">
                {simpleForm.id ? "Update" : "Create"}
              </button>
            </form>
          </article>

          <article className={panel}>
            <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
              {resource === "skills" ? (
                <label className={label}>
                  Search skills
                  <input className={input} value={resourceQuery} onChange={(e) => setResourceQuery(e.target.value)} />
                </label>
              ) : (
                <h3 className="font-['Fraunces',_'Source_Serif_4',_Georgia,_serif] text-2xl text-[#261b18]">Existing items</h3>
              )}
              <span className="pb-3 text-sm text-[var(--color-text-muted)]">
                {resource === "skills" ? skillsPage?.totalElements ?? 0 : simpleItems.length} items
              </span>
            </div>
            <div className="mt-4 grid gap-3">
              {loading ? <p className={emptyText}>Loading...</p> : null}
              {simpleItems.map((item) => (
                <div className={listCard} key={item.id}>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <strong className="text-[#261b18]">{item.name}</strong>
                    <span className="text-sm text-[#6f5b54]">{"slug" in item ? item.slug : "provider"}</span>
                  </div>
                  <p className="text-sm leading-6 text-[#6f5b54]">{item.description || "No description yet."}</p>
                  <div className="flex flex-wrap gap-3">
                    <button
                      className={secondaryButton}
                      onClick={() =>
                        setSimpleForm({
                          id: item.id,
                          name: item.name,
                          description: item.description ?? "",
                          websiteUrl: "websiteUrl" in item ? item.websiteUrl ?? "" : "",
                        })
                      }
                      type="button"
                    >
                      Edit
                    </button>
                    <button className={dangerButton} onClick={() => remove(item.id)} type="button">
                      Delete
                    </button>
                  </div>
                </div>
              ))}
              {!loading && simpleItems.length === 0 ? <p className={emptyText}>No items found.</p> : null}
            </div>
            {resource === "skills" && skillsPage && skillsPage.totalPages > 1 ? (
              <div className="mt-4 flex flex-wrap gap-2">
                <button className={secondaryButton} disabled={skillsPage.first} onClick={() => setResourcePage((value) => Math.max(0, value - 1))} type="button">
                  Previous
                </button>
                <button className={secondaryButton} disabled={skillsPage.last} onClick={() => setResourcePage((value) => value + 1)} type="button">
                  Next
                </button>
              </div>
            ) : null}
          </article>
        </section>
      )}
    </div>
  );
}
