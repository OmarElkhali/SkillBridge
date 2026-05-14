import { useEffect, useState } from "react";
import { cx, eyebrow, pageStack, select, primaryButton, messageBanner } from "../components/ui";
import { api } from "../services/api";
import type { UserSummary } from "../types/api";

export function AdminUsersPage() {
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [savingUserId, setSavingUserId] = useState<number | null>(null);

  useEffect(() => { loadUsers(); }, []);

  async function loadUsers() {
    setLoading(true);
    setMessage("");
    try {
      const us = await api.getAdminUsers();
      setUsers(us);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Unable to load users.");
    } finally { setLoading(false); }
  }

  async function updateUser(userId: number, payload: { role?: "USER" | "ADMIN"; active?: boolean }) {
    setSavingUserId(userId);
    try {
      const updated = await api.updateAdminUser(userId, payload);
      setUsers(cur => cur.map(u => u.id === updated.id ? updated : u));
      setMessage("User updated successfully.");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Unable to update user.");
    } finally { setSavingUserId(null); }
  }

  return (
    <div className={cx(pageStack, "max-w-[1200px] overflow-hidden")}>
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className={eyebrow}>Admin / Users</p>
          <h1 className="mt-2 font-['Fraunces',_'Source_Serif_4',_Georgia,_serif] text-3xl font-bold text-[var(--color-text-strong)] sm:text-4xl">
            User Management
          </h1>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">Assign roles and manage account access.</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="rounded-full bg-[var(--accent-wash)] px-4 py-2 text-sm font-bold text-[var(--color-accent-dark)]">
            {users.length} accounts
          </span>
          <button
            className={cx(primaryButton, "py-2.5 px-5")}
            disabled={loading}
            onClick={loadUsers}
            type="button"
          >
            {loading ? "Refreshing..." : "Refresh list"}
          </button>
        </div>
      </header>

      {message && <p className={messageBanner}>{message}</p>}

      <div className="rounded-[1.5rem] border border-[var(--line-soft)] bg-white/80 p-1 shadow-sm">
        <div className="max-h-[calc(100vh-250px)] overflow-auto rounded-[1.2rem] border border-[var(--line-soft)]">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-gradient-to-r from-[var(--accent-wash)] to-transparent sticky top-0 z-10 shadow-sm">
              <tr>
                <th className="px-5 py-3.5 text-[0.65rem] font-bold uppercase tracking-wider text-[var(--color-accent-dark)]">User</th>
                <th className="px-5 py-3.5 text-[0.65rem] font-bold uppercase tracking-wider text-[var(--color-accent-dark)]">Email</th>
                <th className="px-5 py-3.5 text-[0.65rem] font-bold uppercase tracking-wider text-[var(--color-accent-dark)]">Role</th>
                <th className="px-5 py-3.5 text-[0.65rem] font-bold uppercase tracking-wider text-[var(--color-accent-dark)]">Status</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id} className="border-t border-[var(--line-soft)] transition hover:bg-[var(--accent-wash)]">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[var(--brand-gradient)] text-xs font-bold text-white shadow-sm">
                        {user.firstName?.[0]}{user.lastName?.[0]}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-[var(--color-text-strong)] truncate">{user.firstName} {user.lastName}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <p className="text-sm text-[var(--color-text-muted)] truncate">{user.email}</p>
                  </td>
                  <td className="px-5 py-4">
                    <select 
                      className={cx(select, "min-w-[120px] py-2 text-sm")} 
                      value={user.role} 
                      onChange={e => updateUser(user.id, { role: e.target.value as "USER" | "ADMIN" })}
                      disabled={savingUserId === user.id}
                    >
                      <option value="USER">USER</option>
                      <option value="ADMIN">ADMIN</option>
                    </select>
                  </td>
                  <td className="px-5 py-4">
                    <select 
                      className={cx(select, "min-w-[120px] py-2 text-sm")} 
                      value={user.active ? "active" : "inactive"} 
                      onChange={e => updateUser(user.id, { active: e.target.value === "active" })}
                      disabled={savingUserId === user.id}
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </td>
                </tr>
              ))}
              {users.length === 0 && !loading && (
                <tr>
                  <td colSpan={4} className="px-5 py-8 text-center text-sm text-[var(--color-text-muted)]">
                    No users found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
