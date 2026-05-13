import { useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { cx, errorText, input, label, mutedText, primaryButton, eyebrow } from "../components/ui";

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
    <section className="grid min-h-screen gap-6 p-4 lg:grid-cols-2 lg:p-8 bg-gradient-to-br from-[var(--color-surface)] to-[var(--color-surface-muted)]">
      <div className="relative flex min-h-[520px] flex-col justify-end overflow-hidden rounded-[2.5rem] border-2 border-white/80 bg-gradient-to-br from-[var(--accent-wash)] to-white/60 p-8 shadow-2xl shadow-[var(--accent-wash-strong)] backdrop-blur-xl lg:p-12">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 h-64 w-64 rounded-full bg-[var(--color-accent)] opacity-20 blur-[80px]" />

        <img alt="SkillBridge full logo" className="mb-12 w-full max-w-[500px] self-center drop-shadow-xl z-10" src="/logo.svg" />
        <div className="relative z-10 grid gap-5">
          <h1 className="max-w-[14ch] font-['Fraunces',_'Source_Serif_4',_Georgia,_serif] text-5xl leading-tight text-[var(--color-text-strong)] sm:text-6xl tracking-tight">
            Build from an idea, <span className="text-[var(--color-accent)] italic">not from a noisy dashboard.</span>
          </h1>
          <p className={cx("max-w-xl text-lg leading-relaxed", mutedText)}>
            Sign in to turn a rough concept into a project path, course suggestions, and a calmer place to keep moving forward.
          </p>
        </div>
      </div>

      <div className="flex flex-col justify-center items-center py-10 w-full">
        <form
          className="grid w-full max-w-lg gap-6 rounded-[2.5rem] border-2 border-white/90 bg-white/70 p-8 shadow-[0_20px_60px_-15px_rgba(62,39,35,0.1)] backdrop-blur-2xl sm:p-12"
          onSubmit={handleSubmit}
        >
          <div className="grid gap-2 mb-2">
            <p className={eyebrow}>Welcome back</p>
            <h2 className="font-['Fraunces',_'Source_Serif_4',_Georgia,_serif] text-3xl font-bold text-[var(--color-text-strong)]">Login to your account</h2>
          </div>

          <label className={label}>
            Email address
            <input
              className={cx(input, "py-3 text-base mt-2")}
              required
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
            />
          </label>

          <label className={label}>
            Password
            <input
              className={cx(input, "py-3 text-base mt-2")}
              required
              type="password"
              placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢"
              value={form.password}
              onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
            />
          </label>

          {error ? <p className={errorText}>{error}</p> : null}

          <div className="flex flex-col gap-4 mt-4">
            <button className={cx(primaryButton, "w-full py-3.5 text-lg shadow-lg shadow-[var(--accent-wash-strong)]")} disabled={loading} type="submit">
              {loading ? "Signing in..." : "Sign in to Workspace"}
            </button>
          </div>

          <p className="mt-4 text-center text-[0.95rem] text-[var(--color-text-muted)]">
            Need an account?{" "}
            <Link className="font-bold text-[var(--color-accent-dark)] hover:underline hover:text-[var(--color-accent)] transition-colors" to="/register">
              Create one now
            </Link>
          </p>
        </form>
      </div>
    </section>
  );
}
