import { useEffect, useState } from "react";
import api, { formatApiError } from "@/api/client";
import { useAuth } from "@/contexts/AuthContext";
import { Trash2, ShieldCheck, User as UserIcon } from "lucide-react";
import { format, parseISO, isValid } from "date-fns";

function fmt(d) {
  if (!d) return "—";
  const dt = parseISO(d);
  return isValid(dt) ? format(dt, "MMM d, yyyy") : "—";
}

export default function TeamMembers() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data } = await api.get("/users");
    setUsers(data);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const changeRole = async (id, role) => {
    try {
      const { data } = await api.patch(`/users/${id}/role`, { role });
      setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, role: data.role } : u)));
    } catch (e) {
      alert(formatApiError(e.response?.data?.detail));
    }
  };

  const removeUser = async (id) => {
    if (!confirm("Remove this user? They'll be unassigned from all tasks.")) return;
    try {
      await api.delete(`/users/${id}`);
      setUsers((prev) => prev.filter((u) => u.id !== id));
    } catch (e) {
      alert(formatApiError(e.response?.data?.detail));
    }
  };

  return (
    <div className="space-y-8" data-testid="team-page">
      <div className="border-b border-zinc-200 pb-6">
        <div className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">// Admin</div>
        <h1 className="mt-2 font-heading text-4xl font-extrabold tracking-tighter text-zinc-950">Team members</h1>
        <p className="mt-2 text-sm text-zinc-500">Manage roles and remove users from the workspace.</p>
      </div>

      {loading ? (
        <div className="text-zinc-500 text-sm uppercase tracking-[0.2em]">Loading…</div>
      ) : (
        <div className="border border-zinc-200 rounded-md overflow-hidden">
          <table className="w-full text-sm" data-testid="team-table">
            <thead className="bg-zinc-50">
              <tr className="text-left">
                <th className="px-6 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">User</th>
                <th className="px-6 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Role</th>
                <th className="px-6 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500 hidden md:table-cell">Joined</th>
                <th className="px-6 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 bg-white">
              {users.map((u) => (
                <tr key={u.id} data-testid={`team-row-${u.id}`}>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-zinc-950 text-white flex items-center justify-center text-sm font-semibold">
                        {u.name?.[0]?.toUpperCase()}
                      </div>
                      <div>
                        <div className="font-semibold text-zinc-950">{u.name} {u.id === user.id && <span className="text-xs text-zinc-500 ml-1">(you)</span>}</div>
                        <div className="text-xs text-zinc-500">{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <select
                      value={u.role}
                      onChange={(e) => changeRole(u.id, e.target.value)}
                      disabled={u.id === user.id}
                      className="rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-sm focus:border-zinc-950 focus:outline-none focus:ring-1 focus:ring-zinc-950 disabled:opacity-60"
                      data-testid={`role-select-${u.id}`}
                    >
                      <option value="admin">Admin</option>
                      <option value="member">Member</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 text-zinc-500 hidden md:table-cell">{fmt(u.created_at)}</td>
                  <td className="px-6 py-4 text-right">
                    {u.id !== user.id ? (
                      <button onClick={() => removeUser(u.id)} className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-red-600 transition-colors" data-testid={`remove-user-${u.id}`}>
                        <Trash2 className="w-4 h-4" strokeWidth={1.5} />
                        Remove
                      </button>
                    ) : (
                      <span className="text-xs uppercase tracking-[0.2em] text-zinc-400">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex items-start gap-3 border border-zinc-200 rounded-md bg-zinc-50 px-5 py-4 text-sm text-zinc-600">
        <ShieldCheck className="w-5 h-5 text-zinc-950 shrink-0 mt-0.5" strokeWidth={1.5} />
        <div>
          <span className="font-semibold text-zinc-950">Role guide:</span> Admins can manage all projects, tasks, and users. Members can only access projects they own or are added to.
        </div>
      </div>
    </div>
  );
}