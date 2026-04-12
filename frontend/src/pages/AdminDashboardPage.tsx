import { useEffect, useState } from "react";
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
    <div className="page-stack">
      <section className="hero-panel">
        <div>
          <p className="eyebrow">Admin overview</p>
          <h2>Monitor catalog growth and learner activity from one place.</h2>
        </div>
      </section>
      {message ? <p className="error-text">{message}</p> : null}
      <section className="metrics-grid">
        {overview
          ? Object.entries(overview).map(([label, value]) => (
              <article className="metric-tile" key={label}>
                <span>{label}</span>
                <strong>{value}</strong>
              </article>
            ))
          : null}
      </section>
      <section className="panel">
        <div className="panel-heading">
          <h3>User registry</h3>
          <span>{users.length} accounts</span>
        </div>
        <div className="table-shell">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td>
                    {user.firstName} {user.lastName}
                  </td>
                  <td>{user.email}</td>
                  <td>{user.role}</td>
                  <td>{user.active ? "Active" : "Inactive"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
