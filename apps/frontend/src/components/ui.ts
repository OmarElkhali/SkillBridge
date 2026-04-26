export function cx(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

export const pageStack = "mx-auto grid w-full gap-6";
export const eyebrow = "text-xs font-medium uppercase tracking-[0.3em] text-[var(--color-accent-dark)]";
export const sectionTitle = "font-['Fraunces',_'Source_Serif_4',_Georgia,_serif] text-3xl leading-tight text-[var(--color-text)] sm:text-4xl";
export const mutedText = "text-base leading-7 text-[var(--color-text-muted)]";
export const panel =
  "rounded-[1.6rem] border border-[var(--line-soft)] bg-[var(--color-surface)] p-6 shadow-[0_24px_65px_rgba(48,25,17,0.07)] backdrop-blur-xl";
export const heroPanel =
  "rounded-[2rem] border border-[var(--accent-border)] bg-[var(--hero-bg)] p-6 shadow-[0_24px_70px_rgba(48,25,17,0.08)] backdrop-blur-xl sm:p-8";
export const input =
  "w-full rounded-2xl border border-[var(--accent-border)] bg-white/90 px-4 py-3 text-base text-[var(--color-text)] shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] outline-none transition focus:border-[var(--accent-border-strong)] focus:ring-4 focus:ring-[var(--accent-ring)]";
export const textarea = `${input} min-h-36 resize-y`;
export const select = `${input} pr-10`;
export const label = "grid gap-2 text-sm font-medium text-[var(--color-text-muted)]";
export const primaryButton =
  "inline-flex items-center justify-center rounded-full bg-[var(--color-accent)] px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-[var(--color-accent-hover)] disabled:cursor-not-allowed disabled:opacity-60";
export const secondaryButton =
  "inline-flex items-center justify-center rounded-full border border-[var(--line)] bg-white/50 px-5 py-3 text-sm font-medium text-[var(--color-text-strong)] transition hover:-translate-y-0.5 hover:bg-white/80";
export const dangerButton =
  "inline-flex items-center justify-center rounded-full border border-[var(--danger-border)] bg-[var(--danger-wash)] px-5 py-3 text-sm font-medium text-[var(--color-danger)] transition hover:-translate-y-0.5 hover:bg-[var(--danger-wash-strong)]";
export const messageBanner =
  "rounded-2xl border border-[var(--accent-ring)] bg-[var(--message-bg)] px-4 py-3 text-sm text-[var(--color-text-muted)]";
export const errorText = "text-sm font-medium text-[var(--color-danger)]";
export const emptyText = "text-sm leading-6 text-[var(--color-text-muted)]";
export const listCard =
  "grid gap-3 rounded-[1.2rem] border border-[var(--line-faint)] bg-[var(--color-card)] p-4 transition hover:border-[var(--accent-border)] hover:bg-[var(--color-card-strong)]";
export const metricTile =
  "rounded-[1.5rem] border border-[var(--line-soft)] bg-[var(--color-surface)] p-6 shadow-[0_22px_50px_rgba(48,25,17,0.06)] backdrop-blur-xl";
export const tag =
  "rounded-full border border-[var(--accent-border)] bg-[var(--accent-wash)] px-3 py-2 text-sm font-medium text-[var(--color-accent-dark)] transition";
export const tagActive = "border-transparent bg-[var(--color-accent)] text-white";
export const tableShell = "overflow-x-auto rounded-[1.3rem] border border-[var(--line-faint)] bg-[var(--color-card-soft)]";
