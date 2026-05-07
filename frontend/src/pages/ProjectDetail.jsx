import { useEffect, useState, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import api, { formatApiError } from "@/api/client";
import { useAuth } from "@/contexts/AuthContext";
import { Plus, ArrowLeft, Users, Settings, Trash2, X, Calendar, Tag, MessageSquare, Send } from "lucide-react";
import { format, parseISO, isValid } from "date-fns";

const STATUSES = [
  { id: "todo", label: "To do", accent: "text-zinc-600" },
  { id: "in_progress", label: "In progress", accent: "text-blue-600" },
  { id: "done", label: "Done", accent: "text-emerald-600" },
];

const PRIORITY_BADGE = {
  low: "bg-zinc-100 text-zinc-600 border-zinc-200",
  medium: "bg-amber-50 text-amber-700 border-amber-200",
  high: "bg-orange-50 text-orange-700 border-orange-200",
  urgent: "bg-red-50 text-red-700 border-red-200",
};

function fmt(d) {
  if (!d) return "";
  const dt = parseISO(d);
  return isValid(dt) ? format(dt, "MMM d") : "";
}

function isOverdue(t) {
  if (!t.due_date || t.status === "done") return false;
  const today = new Date().toISOString().slice(0, 10);
  return t.due_date < today;
}

export default function ProjectDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [openTaskId, setOpenTaskId] = useState(null);
  const [showSettings, setShowSettings] = useState(false);

  const userMap = useMemo(() => Object.fromEntries(users.map((u) => [u.id, u])), [users]);
  const memberUsers = useMemo(
    () => (project?.member_ids || []).map((mid) => userMap[mid]).filter(Boolean),
    [project, userMap]
  );

  const load = async () => {
    setLoading(true);
    try {
      const [p, t, u] = await Promise.all([
        api.get(`/projects/${id}`),
        api.get(`/projects/${id}/tasks`),
        api.get("/users"),
      ]);
      setProject(p.data);
      setTasks(t.data);
      setUsers(u.data);
    } catch (e) {
      setProject(null);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line
  }, [id]);

  const updateTaskStatus = async (taskId, newStatus) => {
    const prev = tasks;
    setTasks((ts) => ts.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t)));
    try {
      await api.put(`/tasks/${taskId}`, { status: newStatus });
    } catch (e) {
      setTasks(prev);
      alert(formatApiError(e.response?.data?.detail));
    }
  };

  const deleteTask = async (taskId) => {
    if (!confirm("Delete this task?")) return;
    try {
      await api.delete(`/tasks/${taskId}`);
      setTasks((ts) => ts.filter((t) => t.id !== taskId));
      if (openTaskId === taskId) setOpenTaskId(null);
    } catch (e) {
      alert(formatApiError(e.response?.data?.detail));
    }
  };

  if (loading) return <div className="text-zinc-500 text-sm uppercase tracking-[0.2em]">Loading…</div>;
  if (!project) {
    return (
      <div className="text-center py-20">
        <h2 className="font-heading text-2xl font-bold tracking-tight">Project not found</h2>
        <Link to="/projects" className="mt-4 inline-block text-sm underline underline-offset-4">Back to projects</Link>
      </div>
    );
  }

  const canManage = user.role === "admin" || user.id === project.owner_id;
  const openTask = tasks.find((t) => t.id === openTaskId);

  return (
    <div className="space-y-8" data-testid="project-detail-page">
      <div>
        <Link to="/projects" className="inline-flex items-center gap-1.5 text-xs uppercase tracking-[0.2em] text-zinc-500 hover:text-zinc-950 transition-colors" data-testid="back-to-projects">
          <ArrowLeft className="w-3.5 h-3.5" strokeWidth={1.5} />
          All projects
        </Link>
        <div className="mt-3 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 border-b border-zinc-200 pb-6">
          <div className="min-w-0">
            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">// Project</div>
            <h1 className="mt-2 font-heading text-4xl font-extrabold tracking-tighter text-zinc-950 truncate">{project.name}</h1>
            {project.description && <p className="mt-2 text-sm text-zinc-500 max-w-2xl">{project.description}</p>}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <div className="hidden sm:flex items-center -space-x-2 mr-2">
              {memberUsers.slice(0, 4).map((u) => (
                <div key={u.id} className="w-8 h-8 rounded-full bg-zinc-950 text-white border-2 border-white flex items-center justify-center text-xs font-semibold" title={u.name}>
                  {u.name?.[0]?.toUpperCase()}
                </div>
              ))}
              {memberUsers.length > 4 && (
                <div className="w-8 h-8 rounded-full bg-zinc-100 text-zinc-700 border-2 border-white flex items-center justify-center text-xs font-semibold">
                  +{memberUsers.length - 4}
                </div>
              )}
            </div>
            {canManage && (
              <button
                onClick={() => setShowSettings(true)}
                className="inline-flex items-center gap-2 rounded-md border border-zinc-200 px-4 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors"
                data-testid="project-settings-btn"
              >
                <Settings className="w-4 h-4" strokeWidth={1.5} />
                Settings
              </button>
            )}
            <button
              onClick={() => setShowCreate(true)}
              className="inline-flex items-center gap-2 rounded-md bg-zinc-950 px-4 py-2.5 text-sm font-medium text-white hover:bg-zinc-800 transition-colors"
              data-testid="new-task-btn"
            >
              <Plus className="w-4 h-4" strokeWidth={1.5} />
              New task
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start" data-testid="kanban-board">
        {STATUSES.map((s) => {
          const colTasks = tasks.filter((t) => t.status === s.id);
          return (
            <div key={s.id} className="bg-zinc-50/60 border border-zinc-200 rounded-md p-3 min-h-[400px]" data-testid={`kanban-col-${s.id}`}>
              <div className="flex items-center justify-between px-2 py-1.5">
                <div className="flex items-center gap-2">
                  <span className={`inline-block w-1.5 h-1.5 rounded-full ${s.id === "todo" ? "bg-zinc-400" : s.id === "in_progress" ? "bg-blue-500" : "bg-emerald-500"}`}></span>
                  <h3 className={`text-sm font-semibold tracking-tight ${s.accent}`}>{s.label}</h3>
                  <span className="text-xs text-zinc-500">{colTasks.length}</span>
                </div>
              </div>
              <div className="mt-2 space-y-2">
                {colTasks.length === 0 && (
                  <div className="text-xs text-zinc-400 italic px-2 py-4">No tasks</div>
                )}
                {colTasks.map((t) => (
                  <div
                    key={t.id}
                    onClick={() => setOpenTaskId(t.id)}
                    className={`bg-white border ${isOverdue(t) ? "border-red-200" : "border-zinc-200"} rounded-md p-3 cursor-pointer hover:border-zinc-400 transition-colors`}
                    data-testid={`task-card-${t.id}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-sm font-semibold text-zinc-950 leading-snug">{t.title}</h4>
                      <span className={`text-[10px] uppercase tracking-wider font-semibold px-1.5 py-0.5 rounded border ${PRIORITY_BADGE[t.priority]}`}>
                        {t.priority}
                      </span>
                    </div>
                    {t.description && (
                      <p className="mt-1.5 text-xs text-zinc-500 line-clamp-2">{t.description}</p>
                    )}
                    {t.labels?.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {t.labels.slice(0, 4).map((l, i) => (
                          <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-600 border border-zinc-200">
                            {l}
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="mt-3 pt-2 border-t border-zinc-100 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5 text-zinc-500">
                        {t.due_date ? (
                          <>
                            <Calendar className="w-3 h-3" strokeWidth={1.5} />
                            <span className={isOverdue(t) ? "text-red-600 font-medium" : ""}>{fmt(t.due_date)}</span>
                          </>
                        ) : (
                          <span className="text-zinc-400">No date</span>
                        )}
                      </div>
                      {t.assignee_id && userMap[t.assignee_id] && (
                        <div className="w-6 h-6 rounded-full bg-zinc-950 text-white flex items-center justify-center text-[10px] font-semibold" title={userMap[t.assignee_id].name}>
                          {userMap[t.assignee_id].name?.[0]?.toUpperCase()}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {showCreate && (
        <CreateTaskDialog
          projectId={project.id}
          members={memberUsers}
          onClose={() => setShowCreate(false)}
          onCreated={(t) => setTasks((prev) => [t, ...prev])}
        />
      )}

      {openTask && (
        <TaskDetailDialog
          task={openTask}
          members={memberUsers}
          userMap={userMap}
          currentUser={user}
          projectOwnerId={project.owner_id}
          onClose={() => setOpenTaskId(null)}
          onUpdated={(updated) => setTasks((ts) => ts.map((t) => (t.id === updated.id ? updated : t)))}
          onDelete={() => deleteTask(openTask.id)}
          onStatusChange={(s) => updateTaskStatus(openTask.id, s)}
        />
      )}

      {showSettings && (
        <ProjectSettingsDialog
          project={project}
          users={users}
          onClose={() => setShowSettings(false)}
          onUpdated={(p) => setProject(p)}
        />
      )}
    </div>
  );
}

function CreateTaskDialog({ projectId, members, onClose, onCreated }) {
  const [form, setForm] = useState({
    title: "",
    description: "",
    status: "todo",
    priority: "medium",
    assignee_id: "",
    due_date: "",
    labels: "",
  });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const payload = {
        title: form.title,
        description: form.description,
        status: form.status,
        priority: form.priority,
        assignee_id: form.assignee_id || null,
        due_date: form.due_date || null,
        labels: form.labels.split(",").map((l) => l.trim()).filter(Boolean),
      };
      const { data } = await api.post(`/projects/${projectId}/tasks`, payload);
      onCreated(data);
      onClose();
    } catch (err) {
      setError(formatApiError(err.response?.data?.detail));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 backdrop-blur-sm bg-zinc-950/30 flex items-center justify-center p-4" data-testid="create-task-dialog">
      <div className="w-full max-w-xl bg-white border border-zinc-200 rounded-md shadow-xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">// New task</div>
            <h3 className="font-heading text-xl font-bold tracking-tight mt-1">Create task</h3>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-950" data-testid="close-create-task-btn">
            <X className="w-5 h-5" strokeWidth={1.5} />
          </button>
        </div>
        <form onSubmit={submit} className="px-6 py-5 space-y-4">
          <div>
            <label className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Title</label>
            <input
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="mt-2 block w-full rounded-md border border-zinc-200 bg-white px-4 py-2.5 text-sm text-zinc-950 focus:border-zinc-950 focus:outline-none focus:ring-1 focus:ring-zinc-950"
              placeholder="What needs to be done?"
              data-testid="task-title-input"
            />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Description</label>
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="mt-2 block w-full rounded-md border border-zinc-200 bg-white px-4 py-2.5 text-sm text-zinc-950 focus:border-zinc-950 focus:outline-none focus:ring-1 focus:ring-zinc-950 resize-none"
              data-testid="task-description-input"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="mt-2 block w-full rounded-md border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-950 focus:border-zinc-950 focus:outline-none focus:ring-1 focus:ring-zinc-950"
                data-testid="task-status-select"
              >
                <option value="todo">To do</option>
                <option value="in_progress">In progress</option>
                <option value="done">Done</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Priority</label>
              <select
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value })}
                className="mt-2 block w-full rounded-md border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-950 focus:border-zinc-950 focus:outline-none focus:ring-1 focus:ring-zinc-950"
                data-testid="task-priority-select"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Assignee</label>
              <select
                value={form.assignee_id}
                onChange={(e) => setForm({ ...form, assignee_id: e.target.value })}
                className="mt-2 block w-full rounded-md border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-950 focus:border-zinc-950 focus:outline-none focus:ring-1 focus:ring-zinc-950"
                data-testid="task-assignee-select"
              >
                <option value="">Unassigned</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Due date</label>
              <input
                type="date"
                value={form.due_date}
                onChange={(e) => setForm({ ...form, due_date: e.target.value })}
                className="mt-2 block w-full rounded-md border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-950 focus:border-zinc-950 focus:outline-none focus:ring-1 focus:ring-zinc-950"
                data-testid="task-duedate-input"
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Labels (comma-separated)</label>
            <input
              value={form.labels}
              onChange={(e) => setForm({ ...form, labels: e.target.value })}
              className="mt-2 block w-full rounded-md border border-zinc-200 bg-white px-4 py-2.5 text-sm text-zinc-950 focus:border-zinc-950 focus:outline-none focus:ring-1 focus:ring-zinc-950"
              placeholder="bug, frontend, urgent"
              data-testid="task-labels-input"
            />
          </div>

          {error && <div className="text-sm text-red-600 border border-red-200 bg-red-50 rounded-md px-3 py-2">{error}</div>}

          <div className="flex items-center justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="rounded-md border border-zinc-200 px-5 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50" data-testid="cancel-create-task-btn">Cancel</button>
            <button type="submit" disabled={busy} className="rounded-md bg-zinc-950 px-5 py-2.5 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50" data-testid="submit-create-task-btn">
              {busy ? "Creating…" : "Create task"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function TaskDetailDialog({ task, members, userMap, currentUser, projectOwnerId, onClose, onUpdated, onDelete, onStatusChange }) {
  const [edit, setEdit] = useState({
    title: task.title,
    description: task.description,
    priority: task.priority,
    assignee_id: task.assignee_id || "",
    due_date: task.due_date || "",
    labels: (task.labels || []).join(", "),
  });
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  const canDelete = currentUser.role === "admin" || currentUser.id === projectOwnerId || currentUser.id === task.created_by;

  useEffect(() => {
    api.get(`/tasks/${task.id}/comments`).then((r) => setComments(r.data));
  }, [task.id]);

  const saveEdit = async () => {
    setSavingEdit(true);
    try {
      const payload = {
        title: edit.title,
        description: edit.description,
        priority: edit.priority,
        assignee_id: edit.assignee_id || null,
        due_date: edit.due_date || null,
        labels: edit.labels.split(",").map((l) => l.trim()).filter(Boolean),
      };
      const { data } = await api.put(`/tasks/${task.id}`, payload);
      onUpdated(data);
    } catch (e) {
      alert(formatApiError(e.response?.data?.detail));
    } finally {
      setSavingEdit(false);
    }
  };

  const addComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    try {
      const { data } = await api.post(`/tasks/${task.id}/comments`, { content: newComment });
      setComments((c) => [...c, data]);
      setNewComment("");
    } catch (err) {
      alert(formatApiError(err.response?.data?.detail));
    }
  };

  const removeComment = async (cid) => {
    try {
      await api.delete(`/comments/${cid}`);
      setComments((c) => c.filter((x) => x.id !== cid));
    } catch (e) {
      alert(formatApiError(e.response?.data?.detail));
    }
  };

  return (
    <div className="fixed inset-0 z-50 backdrop-blur-sm bg-zinc-950/30 flex items-center justify-center p-4 overflow-y-auto" data-testid="task-detail-dialog">
      <div className="w-full max-w-3xl bg-white border border-zinc-200 rounded-md shadow-xl my-8">
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 sticky top-0 bg-white">
          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">// Task details</div>
          <div className="flex items-center gap-2">
            {canDelete && (
              <button onClick={onDelete} className="text-zinc-500 hover:text-red-600 transition-colors" title="Delete" data-testid="delete-task-btn">
                <Trash2 className="w-4 h-4" strokeWidth={1.5} />
              </button>
            )}
            <button onClick={onClose} className="text-zinc-500 hover:text-zinc-950" data-testid="close-task-detail-btn">
              <X className="w-5 h-5" strokeWidth={1.5} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-0">
          <div className="md:col-span-2 px-6 py-5 space-y-5 border-b md:border-b-0 md:border-r border-zinc-200">
            <input
              value={edit.title}
              onChange={(e) => setEdit({ ...edit, title: e.target.value })}
              className="block w-full rounded-md border border-transparent bg-transparent px-2 py-2 text-2xl font-heading font-bold tracking-tight text-zinc-950 hover:border-zinc-200 focus:border-zinc-950 focus:outline-none"
              data-testid="task-edit-title"
            />
            <textarea
              rows={4}
              value={edit.description}
              onChange={(e) => setEdit({ ...edit, description: e.target.value })}
              placeholder="Add a description…"
              className="block w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700 focus:border-zinc-950 focus:outline-none focus:ring-1 focus:ring-zinc-950 resize-none"
              data-testid="task-edit-description"
            />
            <div className="flex items-center gap-3">
              <button onClick={saveEdit} disabled={savingEdit} className="rounded-md bg-zinc-950 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50" data-testid="save-task-btn">
                {savingEdit ? "Saving…" : "Save changes"}
              </button>
            </div>

            <div className="pt-4 border-t border-zinc-200">
              <div className="flex items-center gap-2 mb-3">
                <MessageSquare className="w-4 h-4 text-zinc-500" strokeWidth={1.5} />
                <h4 className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Comments ({comments.length})</h4>
              </div>
              <div className="space-y-3" data-testid="comments-list">
                {comments.map((c) => (
                  <div key={c.id} className="flex gap-3" data-testid={`comment-${c.id}`}>
                    <div className="w-7 h-7 rounded-full bg-zinc-950 text-white flex items-center justify-center text-xs font-semibold shrink-0">
                      {c.user_name?.[0]?.toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 text-xs">
                        <span className="font-semibold text-zinc-950">{c.user_name}</span>
                        <span className="text-zinc-400">{fmt(c.created_at)}</span>
                        {(currentUser.role === "admin" || currentUser.id === c.user_id) && (
                          <button onClick={() => removeComment(c.id)} className="ml-auto text-zinc-400 hover:text-red-600">
                            <Trash2 className="w-3 h-3" strokeWidth={1.5} />
                          </button>
                        )}
                      </div>
                      <p className="mt-1 text-sm text-zinc-700 whitespace-pre-wrap">{c.content}</p>
                    </div>
                  </div>
                ))}
                {comments.length === 0 && <div className="text-xs text-zinc-400 italic">No comments yet.</div>}
              </div>
              <form onSubmit={addComment} className="mt-4 flex gap-2">
                <input
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Write a comment…"
                  className="flex-1 rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm focus:border-zinc-950 focus:outline-none focus:ring-1 focus:ring-zinc-950"
                  data-testid="comment-input"
                />
                <button type="submit" className="rounded-md bg-zinc-950 px-3 py-2 text-white hover:bg-zinc-800" data-testid="submit-comment-btn">
                  <Send className="w-4 h-4" strokeWidth={1.5} />
                </button>
              </form>
            </div>
          </div>

          <div className="px-6 py-5 space-y-5 bg-zinc-50/40">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500 mb-2">Status</div>
              <select
                value={task.status}
                onChange={(e) => onStatusChange(e.target.value)}
                className="block w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm focus:border-zinc-950 focus:outline-none focus:ring-1 focus:ring-zinc-950"
                data-testid="task-status-change"
              >
                <option value="todo">To do</option>
                <option value="in_progress">In progress</option>
                <option value="done">Done</option>
              </select>
            </div>
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500 mb-2">Priority</div>
              <select
                value={edit.priority}
                onChange={(e) => setEdit({ ...edit, priority: e.target.value })}
                className="block w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm focus:border-zinc-950 focus:outline-none focus:ring-1 focus:ring-zinc-950"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500 mb-2">Assignee</div>
              <select
                value={edit.assignee_id}
                onChange={(e) => setEdit({ ...edit, assignee_id: e.target.value })}
                className="block w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm focus:border-zinc-950 focus:outline-none focus:ring-1 focus:ring-zinc-950"
              >
                <option value="">Unassigned</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500 mb-2">Due date</div>
              <input
                type="date"
                value={edit.due_date || ""}
                onChange={(e) => setEdit({ ...edit, due_date: e.target.value })}
                className="block w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm focus:border-zinc-950 focus:outline-none focus:ring-1 focus:ring-zinc-950"
              />
            </div>
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500 mb-2">Labels</div>
              <input
                value={edit.labels}
                onChange={(e) => setEdit({ ...edit, labels: e.target.value })}
                placeholder="comma, separated"
                className="block w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm focus:border-zinc-950 focus:outline-none focus:ring-1 focus:ring-zinc-950"
              />
              {task.labels?.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {task.labels.map((l, i) => (
                    <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-600 border border-zinc-200 inline-flex items-center gap-1">
                      <Tag className="w-2.5 h-2.5" strokeWidth={1.5} />{l}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <div className="text-xs text-zinc-400 pt-2 border-t border-zinc-200">
              Created {fmt(task.created_at)} · Updated {fmt(task.updated_at)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProjectSettingsDialog({ project, users, onClose, onUpdated }) {
  const [name, setName] = useState(project.name);
  const [description, setDescription] = useState(project.description || "");
  const [memberIds, setMemberIds] = useState(project.member_ids || []);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const toggle = (id) => {
    if (id === project.owner_id) return;
    setMemberIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const save = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const { data } = await api.put(`/projects/${project.id}`, {
        name, description, member_ids: memberIds,
      });
      onUpdated(data);
      onClose();
    } catch (err) {
      setError(formatApiError(err.response?.data?.detail));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 backdrop-blur-sm bg-zinc-950/30 flex items-center justify-center p-4" data-testid="project-settings-dialog">
      <div className="w-full max-w-lg bg-white border border-zinc-200 rounded-md shadow-xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">// Settings</div>
            <h3 className="font-heading text-xl font-bold tracking-tight mt-1">Project settings</h3>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-950" data-testid="close-settings-btn">
            <X className="w-5 h-5" strokeWidth={1.5} />
          </button>
        </div>
        <form onSubmit={save} className="px-6 py-5 space-y-5">
          <div>
            <label className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} required className="mt-2 block w-full rounded-md border border-zinc-200 bg-white px-4 py-2.5 text-sm focus:border-zinc-950 focus:outline-none focus:ring-1 focus:ring-zinc-950" data-testid="settings-name-input" />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Description</label>
            <textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} className="mt-2 block w-full rounded-md border border-zinc-200 bg-white px-4 py-2.5 text-sm focus:border-zinc-950 focus:outline-none focus:ring-1 focus:ring-zinc-950 resize-none" />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Members</label>
            <div className="mt-2 max-h-44 overflow-y-auto border border-zinc-200 rounded-md divide-y divide-zinc-100">
              {users.map((u) => (
                <label key={u.id} className={`flex items-center gap-3 px-4 py-2.5 text-sm ${u.id === project.owner_id ? "bg-zinc-50" : "hover:bg-zinc-50 cursor-pointer"}`}>
                  <input
                    type="checkbox"
                    checked={memberIds.includes(u.id) || u.id === project.owner_id}
                    onChange={() => toggle(u.id)}
                    disabled={u.id === project.owner_id}
                    className="rounded border-zinc-300 text-zinc-950 focus:ring-zinc-950"
                  />
                  <div className="flex-1">
                    <div className="text-zinc-950 font-medium">{u.name}</div>
                    <div className="text-xs text-zinc-500">{u.email}</div>
                  </div>
                  {u.id === project.owner_id ? (
                    <span className="text-xs uppercase tracking-[0.2em] text-zinc-950 font-semibold">Owner</span>
                  ) : (
                    <span className="text-xs uppercase tracking-[0.2em] text-zinc-500">{u.role}</span>
                  )}
                </label>
              ))}
            </div>
          </div>

          {error && <div className="text-sm text-red-600 border border-red-200 bg-red-50 rounded-md px-3 py-2">{error}</div>}

          <div className="flex items-center justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="rounded-md border border-zinc-200 px-5 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50">Cancel</button>
            <button type="submit" disabled={busy} className="rounded-md bg-zinc-950 px-5 py-2.5 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50" data-testid="save-settings-btn">
              {busy ? "Saving…" : "Save changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
