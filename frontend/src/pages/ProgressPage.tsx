import { useEffect, useState } from "react";
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
    <div className="page-stack">
      <section className="hero-panel compact">
        <div>
          <p className="eyebrow">Progress tracking</p>
          <h2>Update course execution as your learning path advances.</h2>
        </div>
      </section>
      {message ? <p className="hint-banner">{message}</p> : null}
      <section className="panel">
        <div className="stack-list">
          {entries.map((entry) => (
            <div className="list-card" key={entry.id}>
              <div className="list-card-header">
                <strong>{entry.course.title}</strong>
                <span>{entry.status}</span>
              </div>
              <div className="grid-two">
                <label>
                  Status
                  <select
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
                <label>
                  Progress %
                  <input
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
          {entries.length === 0 ? <p className="empty-text">No tracked courses yet. Save a course and update it here.</p> : null}
        </div>
      </section>
    </div>
  );
}
