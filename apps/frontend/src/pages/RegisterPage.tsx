import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      await register(form.firstName, form.lastName, form.email, form.password);
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create your account.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="auth-screen">
      <div className="auth-hero">
        <p className="eyebrow">New learner journey</p>
        <h1>Start with an idea, then let SkillBridge outline the skills you need.</h1>
        <p>
          The platform is built to be explainable. Every recommendation is tied to matched keywords, known
          skills, and a simple rule-based score you can defend in a presentation or jury.
        </p>
      </div>

      <form className="auth-card" onSubmit={handleSubmit}>
        <div>
          <p className="eyebrow">Create account</p>
          <h2>Register</h2>
        </div>

        <div className="grid-two">
          <label>
            First name
            <input
              required
              value={form.firstName}
              onChange={(event) => setForm((current) => ({ ...current, firstName: event.target.value }))}
            />
          </label>
          <label>
            Last name
            <input
              required
              value={form.lastName}
              onChange={(event) => setForm((current) => ({ ...current, lastName: event.target.value }))}
            />
          </label>
        </div>

        <label>
          Email
          <input
            required
            type="email"
            value={form.email}
            onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
          />
        </label>

        <label>
          Password
          <input
            required
            minLength={8}
            type="password"
            value={form.password}
            onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
          />
        </label>

        {error ? <p className="error-text">{error}</p> : null}

        <button className="primary-button" disabled={loading} type="submit">
          {loading ? "Creating account..." : "Create account"}
        </button>

        <p className="hint-text">
          Already registered? <Link to="/login">Login</Link>
        </p>
      </form>
    </section>
  );
}
