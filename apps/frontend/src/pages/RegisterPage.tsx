import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { errorText, input, label, mutedText, primaryButton, secondaryButton } from "../components/ui";
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
    <section className="grid min-h-screen gap-6 p-4 lg:grid-cols-[1.12fr_0.88fr] lg:p-8">
      <div className="flex min-h-[320px] flex-col justify-end rounded-[2rem] border border-[rgba(70,43,34,0.14)] bg-[linear-gradient(145deg,rgba(255,246,235,0.94),rgba(247,233,219,0.88))] p-8 shadow-[0_30px_80px_rgba(48,25,17,0.08)] backdrop-blur-xl">
        <p className="text-[0.72rem] font-medium uppercase tracking-[0.32em] text-[#8c3f29]">New learner journey</p>
        <h1 className="mt-3 max-w-[12ch] font-['Fraunces',_'Source_Serif_4',_Georgia,_serif] text-5xl leading-[0.95] text-[#261b18] sm:text-6xl">
          Start with one idea and let the path grow around it.
        </h1>
        <p className={mutedText + " mt-5 max-w-2xl"}>
          Create your account to capture what you want to build, map the skills behind it, and keep your learning flow simple.
        </p>
      </div>

      <form
        className="mx-auto grid w-full max-w-xl gap-5 self-center rounded-[1.85rem] border border-[rgba(70,43,34,0.12)] bg-[rgba(255,251,246,0.86)] p-6 shadow-[0_26px_70px_rgba(48,25,17,0.08)] backdrop-blur-xl sm:p-8"
        onSubmit={handleSubmit}
      >
        <div className="grid gap-2">
          <p className="text-[0.72rem] font-medium uppercase tracking-[0.32em] text-[#8c3f29]">Create account</p>
          <h2 className="font-['Fraunces',_'Source_Serif_4',_Georgia,_serif] text-3xl text-[#261b18]">Register</h2>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className={label}>
            First name
            <input
              className={input}
              required
              value={form.firstName}
              onChange={(event) => setForm((current) => ({ ...current, firstName: event.target.value }))}
            />
          </label>
          <label className={label}>
            Last name
            <input
              className={input}
              required
              value={form.lastName}
              onChange={(event) => setForm((current) => ({ ...current, lastName: event.target.value }))}
            />
          </label>
        </div>

        <label className={label}>
          Email
          <input
            className={input}
            required
            type="email"
            value={form.email}
            onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
          />
        </label>

        <label className={label}>
          Password
          <input
            className={input}
            minLength={8}
            required
            type="password"
            value={form.password}
            onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
          />
        </label>

        {error ? <p className={errorText}>{error}</p> : null}

        <div className="flex flex-wrap items-center gap-3">
          <button className={primaryButton} disabled={loading} type="submit">
            {loading ? "Creating account..." : "Create account"}
          </button>
          <Link className={secondaryButton} to="/login">
            Login instead
          </Link>
        </div>

        <p className="text-sm text-[#6f5b54]">
          Already registered?{" "}
          <Link className="font-medium text-[#8c3f29] underline-offset-4 hover:underline" to="/login">
            Login
          </Link>
        </p>
      </form>
    </section>
  );
}
