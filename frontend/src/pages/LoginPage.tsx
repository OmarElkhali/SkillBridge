import { useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      await login(form.email, form.password);
      const target = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname ?? "/dashboard";
      navigate(target, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to log in.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="auth-screen">
      <div className="auth-hero">
        <p className="eyebrow">SkillBridge</p>
        <h1>Map a software idea to a structured learning path.</h1>
        <p>
          Sign in to submit project ideas, get explainable recommendations, save courses, and track your
          progress from beginner curiosity to project execution.
        </p>
      </div>

      <form className="auth-card" onSubmit={handleSubmit}>
        <div>
          <p className="eyebrow">Welcome back</p>
          <h2>Login</h2>
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
            type="password"
            value={form.password}
            onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
          />
        </label>

        {error ? <p className="error-text">{error}</p> : null}

        <button className="primary-button" disabled={loading} type="submit">
          {loading ? "Signing in..." : "Sign in"}
        </button>

        <p className="hint-text">
          Need an account? <Link to="/register">Create one</Link>
        </p>
      </form>
    </section>
  );
}
