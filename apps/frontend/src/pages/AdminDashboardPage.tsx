import { useEffect, useState } from "react";
import { cx, errorText, eyebrow, heroPanel, metricTile, pageStack, panel, tableShell } from "../components/ui";
import { api } from "../services/api";
import type { AdminOverview, UserSummary } from "../types/api";

export function AdminDashboardPage() {
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    Promise.all([api.getAdminOverview(), api.getAdminUsers()])
      .then(([overviewData, userData]) => {
        setOverview(overviewData);
        setUsers(userData);
      })
      .catch((err) => setMessage(err instanceof Error ? err.message : "Unable to load admin data."));
  }, []);

  return (
    <div className={cx(pageStack, "max-w-[1440px]")}>
      <section className={cx(heroPanel, "grid gap-3")}>
        <p className={eyebrow}>Admin overview</p>
        <h2 className="font-['Fraunces',_'Source_Serif_4',_Georgia,_serif] text-4xl leading-tight text-[#261b18]">
          Monitor catalog growth and learner activity from one place.
        </h2>
      </section>
      {message ? <p className={errorText}>{message}</p> : null}
      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        {overview
          ? Object.entries(overview).map(([label, value]) => (
              <article className={metricTile} key={label}>
                <span className="text-sm uppercase tracking-[0.24em] text-[#8c3f29]">{label}</span>
                <strong className="mt-3 block text-4xl font-semibold text-[#261b18]">{value}</strong>
              </article>
            ))
          : null}
      </section>
      <section className={panel}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="font-['Fraunces',_'Source_Serif_4',_Georgia,_serif] text-2xl text-[#261b18]">User registry</h3>
          <span className="text-sm text-[#6f5b54]">{users.length} accounts</span>
        </div>
        <div className={cx(tableShell, "mt-4")}>
          <table className="min-w-full border-collapse text-left text-sm text-[#261b18]">
            <thead className="bg-white/50 text-[#8c3f29]">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr className="border-t border-[rgba(70,43,34,0.08)]" key={user.id}>
                  <td className="px-4 py-3">
                    {user.firstName} {user.lastName}
                  </td>
                  <td className="px-4 py-3">{user.email}</td>
                  <td className="px-4 py-3">{user.role}</td>
                  <td className="px-4 py-3">{user.active ? "Active" : "Inactive"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
