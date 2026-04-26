import { useEffect, useState, type FormEvent } from "react";
import {
  cx,
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
import type { Category, Course, Provider, Skill } from "../types/api";

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

export function AdminCatalogPage({ resource }: Props) {
  const [message, setMessage] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [simpleForm, setSimpleForm] = useState({ id: 0, name: "", description: "", websiteUrl: "" });
  const [courseForm, setCourseForm] = useState({
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
  });

  async function load() {
    const [categoryItems, providerItems, skillItems, courseItems] = await Promise.all([
      api.getCategories(),
      api.getProviders(),
      api.getSkills(),
      api.getCourses(true),
    ]);
    setCategories(categoryItems);
    setProviders(providerItems);
    setSkills(skillItems);
    setCourses(courseItems);
  }

  useEffect(() => {
    load().catch((err) => setMessage(err instanceof Error ? err.message : "Unable to load catalog data."));
  }, [resource]);

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
      await load();
      setMessage("Resource saved.");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Unable to save the resource.");
    }
  }

  async function submitCourse(event: FormEvent) {
    event.preventDefault();
    try {
      const payload = { ...courseForm };
      courseForm.id ? await api.updateCourse(courseForm.id, payload) : await api.createCourse(payload);
      setCourseForm({
        id: 0,
        title: "",
        description: "",
        level: "BEGINNER",
        language: "English",
        sourceUrl: "",
        thumbnailUrl: "",
        categoryId: 0,
        providerId: 0,
        skillIds: [],
        published: true,
        popularityScore: 0,
      });
      await load();
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
      await load();
      setMessage("Resource deleted.");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Unable to delete the resource.");
    }
  }

  function toggleSkill(id: number) {
    setCourseForm((current) => ({
      ...current,
      skillIds: current.skillIds.includes(id) ? current.skillIds.filter((item) => item !== id) : [...current.skillIds, id],
    }));
  }

  const simpleItems = resource === "categories" ? categories : resource === "providers" ? providers : skills;

  return (
    <div className={cx(pageStack, "max-w-[1440px]")}>
      <section className={cx(heroPanel, "grid gap-3")}>
        <p className={eyebrow}>Admin catalog</p>
        <h2 className="font-['Fraunces',_'Source_Serif_4',_Georgia,_serif] text-4xl leading-tight text-[#261b18]">{titles[resource]}</h2>
      </section>
      {message ? <p className={messageBanner}>{message}</p> : null}

      {resource === "courses" ? (
        <section className="grid gap-5 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
          <article className={panel}>
            <h3 className="font-['Fraunces',_'Source_Serif_4',_Georgia,_serif] text-2xl text-[#261b18]">{courseForm.id ? "Edit course" : "Create course"}</h3>
            <form className="mt-4 grid gap-4" onSubmit={submitCourse}>
              <label className={label}>
                Title
                <input className={input} value={courseForm.title} onChange={(e) => setCourseForm({ ...courseForm, title: e.target.value })} />
              </label>
              <label className={label}>
                Description
                <textarea className={textarea} rows={6} value={courseForm.description} onChange={(e) => setCourseForm({ ...courseForm, description: e.target.value })} />
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
                  <input className={input} value={courseForm.language} onChange={(e) => setCourseForm({ ...courseForm, language: e.target.value })} />
                </label>
              </div>
              <label className={label}>
                Source URL
                <input className={input} value={courseForm.sourceUrl} onChange={(e) => setCourseForm({ ...courseForm, sourceUrl: e.target.value })} />
              </label>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className={label}>
                  Category
                  <select className={select} value={courseForm.categoryId} onChange={(e) => setCourseForm({ ...courseForm, categoryId: Number(e.target.value) })}>
                    <option value={0}>Select</option>
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
                    <option value={0}>Select</option>
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
                <input
                  className={input}
                  min={0}
                  type="number"
                  value={courseForm.popularityScore}
                  onChange={(e) => setCourseForm({ ...courseForm, popularityScore: Number(e.target.value) })}
                />
              </label>
              <div className="flex flex-wrap gap-2">
                {skills.map((skill) => (
                  <button
                    className={cx(tag, courseForm.skillIds.includes(skill.id) && tagActive)}
                    key={skill.id}
                    onClick={() => toggleSkill(skill.id)}
                    type="button"
                  >
                    {skill.name}
                  </button>
                ))}
              </div>
              <button className={primaryButton} type="submit">
                {courseForm.id ? "Update course" : "Create course"}
              </button>
            </form>
          </article>

          <article className={panel}>
            <h3 className="font-['Fraunces',_'Source_Serif_4',_Georgia,_serif] text-2xl text-[#261b18]">Existing courses</h3>
            <div className="mt-4 grid gap-3">
              {courses.map((course) => (
                <div className={listCard} key={course.id}>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <strong className="text-[#261b18]">{course.title}</strong>
                    <span className="text-sm text-[#6f5b54]">{course.category.name}</span>
                  </div>
                  <p className="text-sm leading-6 text-[#6f5b54]">{course.description.slice(0, 120)}...</p>
                  <div className="flex flex-wrap gap-3">
                    <button
                      className={secondaryButton}
                      onClick={() =>
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
                          skillIds: skills.filter((skill) => course.skills.includes(skill.name)).map((skill) => skill.id),
                          published: course.published,
                          popularityScore: course.popularityScore,
                        })
                      }
                      type="button"
                    >
                      Edit
                    </button>
                    <button className="inline-flex items-center justify-center rounded-full border border-[rgba(143,45,45,0.18)] bg-[rgba(143,45,45,0.08)] px-5 py-3 text-sm font-medium text-[#8f2d2d] transition hover:-translate-y-0.5 hover:bg-[rgba(143,45,45,0.12)]" onClick={() => remove(course.id)} type="button">
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </article>
        </section>
      ) : (
        <section className="grid gap-5 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
          <article className={panel}>
            <h3 className="font-['Fraunces',_'Source_Serif_4',_Georgia,_serif] text-2xl text-[#261b18]">{simpleForm.id ? "Edit resource" : "Create resource"}</h3>
            <form className="mt-4 grid gap-4" onSubmit={submitSimple}>
              <label className={label}>
                Name
                <input className={input} value={simpleForm.name} onChange={(e) => setSimpleForm({ ...simpleForm, name: e.target.value })} />
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
            <h3 className="font-['Fraunces',_'Source_Serif_4',_Georgia,_serif] text-2xl text-[#261b18]">Existing items</h3>
            <div className="mt-4 grid gap-3">
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
                    <button className="inline-flex items-center justify-center rounded-full border border-[rgba(143,45,45,0.18)] bg-[rgba(143,45,45,0.08)] px-5 py-3 text-sm font-medium text-[#8f2d2d] transition hover:-translate-y-0.5 hover:bg-[rgba(143,45,45,0.12)]" onClick={() => remove(item.id)} type="button">
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </article>
        </section>
      )}
    </div>
  );
}
