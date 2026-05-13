import { cx } from "./ui";

export function BrandLogo({ compact = false, className }: { compact?: boolean; className?: string }) {
  return (
    <div className={cx("flex items-center gap-3.5", className)}>
      <img
        alt="SkillBridge logo"
        className={cx(
          "shrink-0 object-contain drop-shadow-[0_4px_8px_rgba(230,126,34,0.15)]",
          compact ? "h-10 w-10" : "h-12 w-16",
        )}
        src="/brand-mark.svg"
      />
      {!compact ? (
        <div className="min-w-0 flex flex-col justify-center">
          <p className="font-['Fraunces',_'Source_Serif_4',_Georgia,_serif] text-[1.65rem] font-bold tracking-tight text-[var(--color-text)] leading-none mt-1">
            Skill<span className="text-[var(--color-accent)]">Bridge</span>
          </p>
          <p className="mt-1.5 text-[0.6rem] font-bold uppercase tracking-[0.25em] text-[var(--color-text-muted)] leading-none">
            Ideas. Skills. Roadmaps.
          </p>
        </div>
      ) : null}
    </div>
  );
}
