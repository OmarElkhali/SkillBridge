export function cx(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

export const pageStack = "mx-auto grid w-full min-w-0 max-w-full gap-6";
export const eyebrow = "text-[0.7rem] font-bold uppercase tracking-[0.35em] text-[var(--color-accent-dark)]";
export const sectionTitle = "font-['Fraunces',_'Source_Serif_4',_Georgia,_serif] text-3xl leading-tight text-[var(--color-text)] sm:text-4xl";
export const mutedText = "text-base leading-relaxed text-[var(--color-text-muted)]";
export const panel =
  "min-w-0 max-w-full rounded-[2rem] border-2 border-white/60 bg-[var(--color-surface)] p-6 shadow-[0_20px_60px_-15px_rgba(62,39,35,0.12)] backdrop-blur-2xl transition-all duration-300";
export const heroPanel =
  "min-w-0 max-w-full rounded-[2.5rem] border-2 border-white/80 bg-[var(--hero-bg)] p-8 shadow-[0_30px_80px_-20px_rgba(62,39,35,0.15)] backdrop-blur-3xl sm:p-10 relative overflow-hidden";
export const input =
  "w-full rounded-[1.1rem] border border-[var(--line)] bg-white/80 px-4 py-3.5 text-base text-[var(--color-text)] shadow-sm outline-none transition-all focus:border-[var(--color-accent)] focus:ring-4 focus:ring-[var(--accent-ring)] focus:bg-white";
export const textarea = `${input} min-h-[140px] resize-y`;
export const select = `${input} pr-10 appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20width%3D%2220%22%20height%3D%2220%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cpath%20d%3D%22M5%208l5%205%205-5%22%20fill%3D%22none%22%20stroke%3D%22%233E2723%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[position:calc(100%-1rem)_center]`;
export const label = "grid gap-2 text-sm font-semibold text-[var(--color-text-muted)]";
export const primaryButton =
  "inline-flex items-center justify-center rounded-full bg-[var(--color-accent)] px-6 py-3.5 text-[0.95rem] font-bold text-white shadow-md shadow-[var(--accent-wash-strong)] transition-all hover:-translate-y-1 hover:shadow-lg hover:shadow-[var(--accent-ring)] hover:bg-[var(--color-accent-hover)] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 disabled:hover:shadow-none";
export const secondaryButton =
  "inline-flex items-center justify-center rounded-full border border-[var(--line)] bg-white/60 px-6 py-3.5 text-[0.95rem] font-semibold text-[var(--color-text-strong)] transition-all hover:-translate-y-1 hover:bg-white hover:shadow-md hover:border-[var(--line-soft)]";
export const dangerButton =
  "inline-flex items-center justify-center rounded-full border border-[var(--danger-border)] bg-[var(--danger-wash)] px-6 py-3.5 text-[0.95rem] font-bold text-[var(--color-danger)] transition-all hover:-translate-y-1 hover:bg-[var(--danger-wash-strong)]";
export const messageBanner =
  "rounded-2xl border border-[var(--accent-border)] bg-[var(--message-bg)] px-5 py-4 text-sm text-[var(--color-text)] shadow-sm";
export const errorText = "text-sm font-semibold text-[var(--color-danger)] flex items-center gap-2";
export const emptyText = "text-sm leading-relaxed text-[var(--color-text-muted)]";
export const listCard =
  "group grid gap-2.5 rounded-[1.25rem] border border-[var(--line-soft)] bg-[var(--color-card)] p-5 transition-all duration-300 hover:-translate-y-1 hover:border-[var(--accent-border)] hover:bg-[var(--color-card-strong)] hover:shadow-[0_12px_30px_rgba(62,39,35,0.06)]";
export const metricTile =
  "min-w-0 rounded-[1.5rem] border border-[var(--line-soft)] bg-[var(--color-surface)] p-6 shadow-[0_16px_40px_rgba(62,39,35,0.04)] backdrop-blur-xl relative overflow-hidden transition-all hover:border-[var(--accent-border)]";
export const tag =
  "rounded-full border border-[var(--accent-border)] bg-[var(--accent-wash)] px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider text-[var(--color-accent-dark)] transition-all hover:bg-[var(--accent-wash-strong)]";
export const tagActive = "border-transparent bg-[var(--color-accent)] text-white shadow-sm";
export const tableShell = "min-w-0 max-w-full overflow-x-auto rounded-[1.5rem] border border-[var(--line-soft)] bg-[var(--color-card)] shadow-sm";
