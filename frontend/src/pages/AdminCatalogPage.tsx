import { useEffect, useState, type FormEvent } from "react";
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
        simpleForm.id
          ? await api.updateCategory(simpleForm.id, simpleForm)
          : await api.createCategory(simpleForm);
      } else if (resource === "providers") {
        simpleForm.id
          ? await api.updateProvider(simpleForm.id, simpleForm)
          : await api.createProvider(simpleForm);
      } else if (resource === "skills") {
        simpleForm.id
          ? await api.updateSkill(simpleForm.id, simpleForm)
          : await api.createSkill(simpleForm);
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
      skillIds: current.skillIds.includes(id)
        ? current.skillIds.filter((item) => item !== id)
        : [...current.skillIds, id],
    }));
  }

  const simpleItems = resource === "categories" ? categories : resource === "providers" ? providers : skills;

  return (
    <div className="page-stack">
      <section className="hero-panel compact">
        <div>
          <p className="eyebrow">Admin catalog</p>
          <h2>{titles[resource]}</h2>
        </div>
      </section>
      {message ? <p className="hint-banner">{message}</p> : null}

      {resource === "courses" ? (
        <section className="content-grid">
          <article className="panel">
            <h3>{courseForm.id ? "Edit course" : "Create course"}</h3>
            <form className="stack-form" onSubmit={submitCourse}>
              <label>
                Title
                <input value={courseForm.title} onChange={(e) => setCourseForm({ ...courseForm, title: e.target.value })} />
              </label>
              <label>
                Description
                <textarea rows={6} value={courseForm.description} onChange={(e) => setCourseForm({ ...courseForm, description: e.target.value })} />
              </label>
              <div className="grid-two">
                <label>
                  Level
                  <select value={courseForm.level} onChange={(e) => setCourseForm({ ...courseForm, level: e.target.value })}>
                    <option>BEGINNER</option>
                    <option>INTERMEDIATE</option>
                    <option>ADVANCED</option>
                  </select>
                </label>
                <label>
                  Language
                  <input value={courseForm.language} onChange={(e) => setCourseForm({ ...courseForm, language: e.target.value })} />
                </label>
              </div>
              <label>
                Source URL
                <input value={courseForm.sourceUrl} onChange={(e) => setCourseForm({ ...courseForm, sourceUrl: e.target.value })} />
              </label>
              <div className="grid-two">
                <label>
                  Category
                  <select value={courseForm.categoryId} onChange={(e) => setCourseForm({ ...courseForm, categoryId: Number(e.target.value) })}>
                    <option value={0}>Select</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Provider
                  <select value={courseForm.providerId} onChange={(e) => setCourseForm({ ...courseForm, providerId: Number(e.target.value) })}>
                    <option value={0}>Select</option>
                    {providers.map((provider) => (
                      <option key={provider.id} value={provider.id}>
                        {provider.name}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <label>
                Popularity score
                <input
                  min={0}
                  type="number"
                  value={courseForm.popularityScore}
                  onChange={(e) => setCourseForm({ ...courseForm, popularityScore: Number(e.target.value) })}
                />
              </label>
              <div className="tag-selector">
                {skills.map((skill) => (
                  <button
                    className={courseForm.skillIds.includes(skill.id) ? "tag active" : "tag"}
                    key={skill.id}
                    onClick={() => toggleSkill(skill.id)}
                    type="button"
                  >
                    {skill.name}
                  </button>
                ))}
              </div>
              <button className="primary-button" type="submit">
                {courseForm.id ? "Update course" : "Create course"}
              </button>
            </form>
          </article>

          <article className="panel">
            <h3>Existing courses</h3>
            <div className="stack-list">
              {courses.map((course) => (
                <div className="list-card" key={course.id}>
                  <div className="list-card-header">
                    <strong>{course.title}</strong>
                    <span>{course.category.name}</span>
                  </div>
                  <p>{course.description.slice(0, 120)}...</p>
                  <div className="button-row">
                    <button
                      className="ghost-button"
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
                    <button className="danger-button" onClick={() => remove(course.id)} type="button">
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </article>
        </section>
      ) : (
        <section className="content-grid">
          <article className="panel">
            <h3>{simpleForm.id ? "Edit resource" : "Create resource"}</h3>
            <form className="stack-form" onSubmit={submitSimple}>
              <label>
                Name
                <input value={simpleForm.name} onChange={(e) => setSimpleForm({ ...simpleForm, name: e.target.value })} />
              </label>
              {resource === "providers" ? (
                <label>
                  Website URL
                  <input value={simpleForm.websiteUrl} onChange={(e) => setSimpleForm({ ...simpleForm, websiteUrl: e.target.value })} />
                </label>
              ) : null}
              <label>
                Description
                <textarea rows={6} value={simpleForm.description} onChange={(e) => setSimpleForm({ ...simpleForm, description: e.target.value })} />
              </label>
              <button className="primary-button" type="submit">
                {simpleForm.id ? "Update" : "Create"}
              </button>
            </form>
          </article>

          <article className="panel">
            <h3>Existing items</h3>
            <div className="stack-list">
              {simpleItems.map((item) => (
                <div className="list-card" key={item.id}>
                  <div className="list-card-header">
                    <strong>{item.name}</strong>
                    <span>{"slug" in item ? item.slug : "provider"}</span>
                  </div>
                  <p>{item.description || "No description yet."}</p>
                  <div className="button-row">
                    <button
                      className="ghost-button"
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
                    <button className="danger-button" onClick={() => remove(item.id)} type="button">
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
