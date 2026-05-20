import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { cx, errorText, input, label, mutedText, primaryButton, eyebrow } from "../components/ui";

const GITHUB_STATE_STORAGE_KEY = "skillbridge.oauth.github.state";

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, loginWithGoogle, loginWithGithub } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [githubLoading, setGithubLoading] = useState(false);
  const googleButtonRef = useRef<HTMLDivElement | null>(null);
  const processedGithubCodeRef = useRef<string | null>(null);
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim() ?? "";
  const googleEnabled = googleClientId.length > 0;
  const githubClientId = import.meta.env.VITE_GITHUB_CLIENT_ID?.trim() ?? "";
  const githubRedirectUri = import.meta.env.VITE_GITHUB_REDIRECT_URI?.trim() ?? "";
  const githubEnabled = githubClientId.length > 0 && githubRedirectUri.length > 0;
  const socialLoginEnabled = googleEnabled || githubEnabled;

  const targetPath = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname ?? "/dashboard";

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      await login(form.email, form.password);
      navigate(targetPath, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to log in.");
    } finally {
      setLoading(false);
    }
  }

  const handleGoogleCredential = useCallback(async (response: { credential?: string }) => {
    if (!response?.credential) {
      setError("Google login failed. Missing credential token.");
      return;
    }
    setGoogleLoading(true);
    setError("");
    try {
      await loginWithGoogle(response.credential);
      navigate(targetPath, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to sign in with Google.");
    } finally {
      setGoogleLoading(false);
    }
  }, [loginWithGoogle, navigate, targetPath]);

  useEffect(() => {
    if (!googleEnabled) {
      return;
    }

    let cancelled = false;

    const initializeGoogleButton = () => {
      if (cancelled || !window.google || !googleButtonRef.current) {
        return;
      }
      window.google.accounts.id.initialize({
        client_id: googleClientId,
        callback: handleGoogleCredential,
        auto_select: false,
      });
      googleButtonRef.current.innerHTML = "";
      window.google.accounts.id.renderButton(googleButtonRef.current, {
        theme: "outline",
        size: "large",
        text: "continue_with",
        shape: "pill",
        width: 380,
      });
    };

    if (window.google?.accounts?.id) {
      initializeGoogleButton();
      return () => {
        cancelled = true;
      };
    }

    const existingScript = document.querySelector<HTMLScriptElement>('script[src="https://accounts.google.com/gsi/client"]');
    if (existingScript) {
      existingScript.addEventListener("load", initializeGoogleButton, { once: true });
      return () => {
        cancelled = true;
      };
    }

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = initializeGoogleButton;
    document.head.appendChild(script);

    return () => {
      cancelled = true;
    };
  }, [googleClientId, googleEnabled, handleGoogleCredential]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const code = params.get("code");
    const state = params.get("state");
    const oauthError = params.get("error");

    if (oauthError) {
      setError("GitHub login was cancelled or failed.");
      navigate("/login", { replace: true, state: location.state });
      return;
    }

    if (!code || processedGithubCodeRef.current === code) {
      return;
    }
    processedGithubCodeRef.current = code;

    const expectedState = sessionStorage.getItem(GITHUB_STATE_STORAGE_KEY);
    sessionStorage.removeItem(GITHUB_STATE_STORAGE_KEY);
    if (!expectedState || !state || expectedState !== state) {
      setError("GitHub login failed state validation. Please try again.");
      navigate("/login", { replace: true, state: location.state });
      return;
    }
    if (!githubEnabled) {
      setError("GitHub login is not configured on this client.");
      navigate("/login", { replace: true, state: location.state });
      return;
    }

    setGithubLoading(true);
    setError("");
    void loginWithGithub(code, githubRedirectUri)
      .then(() => navigate(targetPath, { replace: true }))
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Unable to sign in with GitHub.");
        navigate("/login", { replace: true, state: location.state });
      })
      .finally(() => {
        setGithubLoading(false);
      });
  }, [githubEnabled, githubRedirectUri, location.search, location.state, loginWithGithub, navigate, targetPath]);

  function createStateValue() {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    return Array.from(bytes, value => value.toString(16).padStart(2, "0")).join("");
  }

  function startGithubLogin() {
    if (!githubEnabled) {
      setError("GitHub login is not configured on this client.");
      return;
    }
    const state = createStateValue();
    sessionStorage.setItem(GITHUB_STATE_STORAGE_KEY, state);

    const query = new URLSearchParams({
      client_id: githubClientId,
      redirect_uri: githubRedirectUri,
      scope: "read:user user:email",
      state,
    });
    window.location.assign(`https://github.com/login/oauth/authorize?${query.toString()}`);
  }

  return (
    <section className="grid min-h-screen gap-6 bg-gradient-to-br from-[var(--color-surface)] to-[var(--color-surface-muted)] p-4 lg:grid-cols-2 lg:p-8">
      <div className="relative flex min-h-[520px] flex-col justify-end overflow-hidden rounded-[2.5rem] border-2 border-white/80 bg-gradient-to-br from-[var(--accent-wash)] to-white/60 p-8 shadow-2xl shadow-[var(--accent-wash-strong)] backdrop-blur-xl lg:p-12">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 h-64 w-64 rounded-full bg-[var(--color-accent)] opacity-20 blur-[80px]" />

        <img alt="SkillBridge full logo" className="z-10 mb-12 w-full max-w-[500px] self-center drop-shadow-xl" src="/logo.svg" />
        <div className="relative z-10 grid gap-5">
          <h1 className="max-w-[14ch] font-['Fraunces',_'Source_Serif_4',_Georgia,_serif] text-5xl leading-tight tracking-tight text-[var(--color-text-strong)] sm:text-6xl">
            Build from an idea, <span className="text-[var(--color-accent)] italic">not from a noisy dashboard.</span>
          </h1>
          <p className={cx("max-w-xl text-lg leading-relaxed", mutedText)}>
            Sign in to turn a rough concept into a project path, course suggestions, and a calmer place to keep moving forward.
          </p>
        </div>
      </div>

      <div className="flex w-full flex-col items-center justify-center py-10">
        <form
          className="grid w-full max-w-lg gap-6 rounded-[2.5rem] border-2 border-white/90 bg-white/70 p-8 shadow-[0_20px_60px_-15px_rgba(62,39,35,0.1)] backdrop-blur-2xl sm:p-12"
          onSubmit={handleSubmit}
        >
          <div className="mb-2 grid gap-2">
            <p className={eyebrow}>Welcome back</p>
            <h2 className="font-['Fraunces',_'Source_Serif_4',_Georgia,_serif] text-3xl font-bold text-[var(--color-text-strong)]">Login to your account</h2>
          </div>

          <label className={label}>
            Email address
            <input
              className={cx(input, "mt-2 py-3 text-base")}
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
              className={cx(input, "mt-2 py-3 text-base")}
              required
              type="password"
              placeholder="********"
              value={form.password}
              onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
            />
          </label>

          {error ? <p className={errorText}>{error}</p> : null}

          <div className="mt-4 flex flex-col gap-4">
            <button className={cx(primaryButton, "w-full py-3.5 text-lg shadow-lg shadow-[var(--accent-wash-strong)]")} disabled={loading} type="submit">
              {loading ? "Signing in..." : "Sign in to Workspace"}
            </button>
            {socialLoginEnabled ? (
              <div className="grid gap-3 rounded-2xl bg-white/50 p-4 shadow-[0_8px_24px_-18px_rgba(62,39,35,0.35)]">
                <p className="text-center text-sm font-semibold text-[var(--color-text-muted)]">Or continue with</p>

                {githubEnabled ? (
                  <button
                    className="relative flex h-12 w-full items-center justify-center rounded-full bg-white px-5 text-[1.02rem] font-medium tracking-[0.01em] text-[#3c4043] shadow-[0_8px_20px_-16px_rgba(62,39,35,0.45)] transition-colors hover:bg-[var(--color-surface)] disabled:cursor-not-allowed disabled:opacity-60"
                    disabled={githubLoading}
                    type="button"
                    onClick={startGithubLogin}
                  >
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#24292f]">
                      <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 24 24">
                        <path
                          d="M12 .5a12 12 0 0 0-3.79 23.39c.6.11.82-.26.82-.58v-2.03c-3.34.73-4.04-1.61-4.04-1.61-.55-1.38-1.34-1.75-1.34-1.75-1.1-.75.08-.73.08-.73 1.21.08 1.85 1.25 1.85 1.25 1.08 1.85 2.83 1.31 3.52 1 .11-.78.42-1.31.77-1.61-2.67-.3-5.48-1.33-5.48-5.94 0-1.31.47-2.39 1.24-3.23-.13-.3-.54-1.52.12-3.17 0 0 1.01-.32 3.3 1.23a11.47 11.47 0 0 1 6 0c2.28-1.55 3.29-1.23 3.29-1.23.66 1.65.25 2.87.13 3.17.77.84 1.24 1.92 1.24 3.23 0 4.62-2.81 5.64-5.49 5.94.43.37.82 1.1.82 2.22v3.29c0 .32.21.7.83.58A12 12 0 0 0 12 .5Z"
                          fill="currentColor"
                        />
                      </svg>
                    </span>
                    <span>{githubLoading ? "Signing in with GitHub..." : "Continue with GitHub"}</span>
                  </button>
                ) : null}

                {googleEnabled ? (
                  <div className="flex justify-center rounded-full bg-white py-1 shadow-[0_8px_20px_-16px_rgba(62,39,35,0.45)]">
                    <div ref={googleButtonRef} />
                  </div>
                ) : null}

                {googleLoading ? <p className="text-center text-xs text-[var(--color-text-muted)]">Signing in with Google...</p> : null}
              </div>
            ) : null}
          </div>

          <p className="mt-4 text-center text-[0.95rem] text-[var(--color-text-muted)]">
            Need an account?{" "}
            <Link className="font-bold text-[var(--color-accent-dark)] transition-colors hover:text-[var(--color-accent)] hover:underline" to="/register">
              Create one now
            </Link>
          </p>
        </form>
      </div>
    </section>
  );
}
