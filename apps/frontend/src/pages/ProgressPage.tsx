import { useEffect, useState } from "react";
import { cx, emptyText, eyebrow, heroPanel, input, label, messageBanner, pageStack, panel, select } from "../components/ui";
import { api } from "../services/api";
import type { ProgressEntry } from "../types/api";

const statusOptions = ["NOT_STARTED", "STARTED", "COMPLETED"];

export function ProgressPage() {
  const [entries, setEntries] = useState<ProgressEntry[]>([]);
  const [message, setMessage] = useState("");

  async function load() {
    setEntries(await api.getProgress());
  }

  useEffect(() => {
    load().catch((err) => setMessage(err instanceof Error ? err.message : "Unable to load progress."));
  }, []);

  async function update(courseId: number, status: string, progressPercent: number) {
    try {
      await api.updateProgress(courseId, { status, progressPercent });
      await load();
      setMessage("Progress updated.");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Unable to update progress.");
    }
  }

  return (
    <div className={cx(pageStack, "max-w-[1440px]")}>
      <section className={cx(heroPanel, "grid gap-3")}>
        <p className={eyebrow}>Progress tracking</p>
        <h2 className="font-['Fraunces',_'Source_Serif_4',_Georgia,_serif] text-4xl leading-tight text-[#261b18]">
          Update course execution as your learning path advances.
        </h2>
      </section>
      {message ? <p className={messageBanner}>{message}</p> : null}
      <section className={panel}>
        <div className="grid gap-4">
          {entries.map((entry) => (
            <div className="grid gap-4 rounded-[1.2rem] border border-[rgba(70,43,34,0.08)] bg-white/70 p-4" key={entry.id}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <strong className="text-[#261b18]">{entry.course.title}</strong>
                <span className="text-sm text-[#6f5b54]">{entry.status}</span>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className={label}>
                  Status
                  <select
                    className={select}
                    defaultValue={entry.status}
                    onChange={(event) => update(entry.course.id, event.target.value, entry.progressPercent)}
                  >
                    {statusOptions.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </label>
                <label className={label}>
                  Progress %
                  <input
                    className={input}
                    defaultValue={entry.progressPercent}
                    max={100}
                    min={0}
                    type="number"
                    onBlur={(event) => update(entry.course.id, entry.status, Number(event.target.value))}
                  />
                </label>
              </div>
            </div>
          ))}
          {entries.length === 0 ? <p className={emptyText}>No tracked courses yet. Save a course and update it here.</p> : null}
        </div>
      </section>
    </div>
  );
}
