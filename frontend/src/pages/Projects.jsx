import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api, { formatApiError } from "@/api/client";
import { useAuth } from "@/contexts/AuthContext";
import { Plus, FolderKanban, Users, Trash2, X } from "lucide-react";
import { format, parseISO, isValid } from "date-fns";

function fmtDate(d) {
  if (!d) return "—";
  const dt = parseISO(d);
  return isValid(dt) ? format(dt, "MMM d, yyyy") : "—";
}

export default function Projects() {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  const load = async () => {
    setLoading(true);
    const [p, u] = await Promise.all([api.get("/projects"), api.get("/users")]);
    setProjects(p.data);
    setUsers(u.data);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const handleDelete = async (id) => {
    if (!confirm("Delete this project and all its tasks?")) return;
    try {
      await api.delete(`/projects/${id}`);
      setProjects((prev) => prev.filter((p) => p.id !== id));
    } catch (e) {
      alert(formatApiError(e.response?.data?.detail));
    }
  };

  return (
    <div className="space-y-8" data-testid="projects-page">
      <div className="flex items-end justify-between border-b border-zinc-200 pb-6">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">// Workspace</div>
          <h1 className="mt-2 font-heading text-4xl font-extrabold tracking-tighter text-zinc-950">Projects</h1>
          <p className="mt-2 text-sm text-zinc-500">All projects you own or are a member of.</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="inline-flex items-center gap-2 rounded-md bg-zinc-950 px-5 py-2.5 text-sm font-medium text-white hover:bg-zinc-800 transition-colors"
          data-testid="new-project-btn"
        >
          <Plus className="w-4 h-4" strokeWidth={1.5} />
          New project
        </button>
      </div>

      {loading ? (
        <div className="text-zinc-500 text-sm uppercase tracking-[0.2em]">Loading…</div>
      ) : projects.length === 0 ? (
        <div className="border border-dashed border-zinc-300 rounded-md p-16 text-center" data-testid="projects-empty">
          <FolderKanban className="w-10 h-10 mx-auto text-zinc-300 mb-4" strokeWidth={1.25} />
          <h3 className="font-heading text-xl font-semibold text-zinc-950">No projects yet</h3>
          <p className="mt-2 text-sm text-zinc-500">Create your first project to start tracking work.</p>
          <button
            onClick={() => setShowCreate(true)}
            className="mt-6 inline-flex items-center gap-2 rounded-md bg-zinc-950 px-5 py-2.5 text-sm font-medium text-white hover:bg-zinc-800 transition-colors"
            data-testid="create-first-project-btn"
          >
            <Plus className="w-4 h-4" strokeWidth={1.5} />
            Create project
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-zinc-200 border border-zinc-200 rounded-md overflow-hidden" data-testid="projects-grid">
          {projects.map((p) => {
            const canManage = user.role === "admin" || user.id === p.owner_id;
            return (
              <div key={p.id} className="bg-white p-6 hover:bg-zinc-50 transition-colors group flex flex-col" data-testid={`project-card-${p.id}`}>
                <div className="flex items-start justify-between gap-4">
                  <Link to={`/projects/${p.id}`} className="min-w-0 flex-1">
                    <div className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
                      // {p.member_ids?.length || 0} member{(p.member_ids?.length || 0) === 1 ? "" : "s"}
                    </div>
                    <h3 className="mt-2 font-heading text-xl font-bold tracking-tight text-zinc-950 group-hover:underline underline-offset-4">
                      {p.name}
                    </h3>
                    <p className="mt-2 text-sm text-zinc-500 line-clamp-2 min-h-[2.5rem]">
                      {p.description || <span className="italic text-zinc-400">No description</span>}
                    </p>
                  </Link>
                  {canManage && (
                    <button
                      onClick={() => handleDelete(p.id)}
                      className="text-zinc-400 hover:text-red-600 transition-colors opacity-0 group-hover:opacity-100"
                      title="Delete project"
                      data-testid={`delete-project-${p.id}`}
                    >
                      <Trash2 className="w-4 h-4" strokeWidth={1.5} />
                    </button>
                  )}
                </div>
                <div className="mt-6 flex items-center justify-between text-xs text-zinc-500 pt-4 border-t border-zinc-100">
                  <div className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5" strokeWidth={1.5} />
                    <span>{(p.member_ids?.length || 0)} member{(p.member_ids?.length || 0) === 1 ? "" : "s"}</span>
                  </div>
                  <div>Created {fmtDate(p.created_at)}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showCreate && (
        <CreateProjectDialog
          users={users}
          onClose={() => setShowCreate(false)}
          onCreated={(p) => setProjects((prev) => [p, ...prev])}
          currentUser={user}
        />
      )}
    </div>
  );
}

function CreateProjectDialog({ users, onClose, onCreated, currentUser }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [memberIds, setMemberIds] = useState([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const toggleMember = (id) => {
    setMemberIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const { data } = await api.post("/projects", {
        name,
        description,
        member_ids: memberIds,
      });
      onCreated(data);
      onClose();
    } catch (err) {
      setError(formatApiError(err.response?.data?.detail));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 backdrop-blur-sm bg-zinc-950/30 flex items-center justify-center p-4" data-testid="create-project-dialog">
      <div className="w-full max-w-lg bg-white border border-zinc-200 rounded-md shadow-xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">// New project</div>
            <h3 className="font-heading text-xl font-bold tracking-tight mt-1">Create project</h3>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-950" data-testid="close-create-project-btn">
            <X className="w-5 h-5" strokeWidth={1.5} />
          </button>
        </div>
        <form onSubmit={submit} className="px-6 py-5 space-y-5">
          <div>
            <label className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Name</label>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-2 block w-full rounded-md border border-zinc-200 bg-white px-4 py-2.5 text-sm text-zinc-950 focus:border-zinc-950 focus:outline-none focus:ring-1 focus:ring-zinc-950"
              placeholder="Marketing site redesign"
              data-testid="project-name-input"
            />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Description</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-2 block w-full rounded-md border border-zinc-200 bg-white px-4 py-2.5 text-sm text-zinc-950 focus:border-zinc-950 focus:outline-none focus:ring-1 focus:ring-zinc-950 resize-none"
              placeholder="Describe the goal of this project."
              data-testid="project-description-input"
            />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Members</label>
            <div className="mt-2 max-h-44 overflow-y-auto border border-zinc-200 rounded-md divide-y divide-zinc-100">
              {users.filter((u) => u.id !== currentUser.id).length === 0 && (
                <div className="px-4 py-3 text-xs text-zinc-500">No other users yet.</div>
              )}
              {users.filter((u) => u.id !== currentUser.id).map((u) => (
                <label key={u.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-zinc-50 cursor-pointer text-sm">
                  <input
                    type="checkbox"
                    checked={memberIds.includes(u.id)}
                    onChange={() => toggleMember(u.id)}
                    className="rounded border-zinc-300 text-zinc-950 focus:ring-zinc-950"
                    data-testid={`member-toggle-${u.id}`}
                  />
                  <div className="flex-1">
                    <div className="text-zinc-950 font-medium">{u.name}</div>
                    <div className="text-xs text-zinc-500">{u.email}</div>
                  </div>
                  <span className="text-xs uppercase tracking-[0.2em] text-zinc-500">{u.role}</span>
                </label>
              ))}
            </div>
            <p className="mt-2 text-xs text-zinc-500">You'll automatically be added as the owner.</p>
          </div>

          {error && (
            <div className="text-sm text-red-600 border border-red-200 bg-red-50 rounded-md px-3 py-2" data-testid="create-project-error">
              {error}
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center justify-center rounded-md border border-zinc-200 px-5 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors"
              data-testid="cancel-create-project-btn"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={busy}
              className="inline-flex items-center justify-center rounded-md bg-zinc-950 px-5 py-2.5 text-sm font-medium text-white hover:bg-zinc-800 transition-colors disabled:opacity-50"
              data-testid="submit-create-project-btn"
            >
              {busy ? "Creating…" : "Create project"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
