import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "@/api/client";
import { useAuth } from "@/contexts/AuthContext";
import { CheckCircle2, CircleDashed, Clock, AlertTriangle, FolderKanban, ListTodo, ArrowRight } from "lucide-react";
import { format, parseISO, isValid } from "date-fns";

const STAT_CARDS = [
  { key: "tasks", label: "Total tasks", icon: ListTodo, accent: "text-zinc-950" },
  { key: "in_progress", label: "In progress", icon: Clock, accent: "text-blue-600" },
  { key: "done", label: "Completed", icon: CheckCircle2, accent: "text-emerald-600" },
  { key: "overdue", label: "Overdue", icon: AlertTriangle, accent: "text-red-600" },
];

const STATUS_LABEL = { todo: "To do", in_progress: "In progress", done: "Done" };
const STATUS_BADGE = {
  todo: "bg-zinc-100 text-zinc-600 border-zinc-200",
  in_progress: "bg-blue-50 text-blue-600 border-blue-200",
  done: "bg-emerald-50 text-emerald-600 border-emerald-200",
};

function fmt(d) {
  if (!d) return "—";
  const dt = typeof d === "string" ? parseISO(d) : d;
  return isValid(dt) ? format(dt, "MMM d, yyyy") : "—";
}

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/dashboard").then((r) => setData(r.data)).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="text-zinc-500 text-sm uppercase tracking-[0.2em]">Loading dashboard…</div>;
  }

  const t = data?.totals || {};

  return (
    <div className="space-y-10" data-testid="dashboard-page">
      <div className="flex items-end justify-between border-b border-zinc-200 pb-6">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">// Overview</div>
          <h1 className="mt-2 font-heading text-4xl font-extrabold tracking-tighter text-zinc-950">
            Hello, {user?.name?.split(" ")[0]}
          </h1>
          <p className="mt-2 text-sm text-zinc-500">
            {t.my_open ?? 0} open task{(t.my_open ?? 0) === 1 ? "" : "s"} assigned to you · {t.projects ?? 0} project{(t.projects ?? 0) === 1 ? "" : "s"}
          </p>
        </div>
        <Link
          to="/projects"
          className="hidden sm:inline-flex items-center gap-2 rounded-md bg-zinc-950 px-5 py-2.5 text-sm font-medium text-white hover:bg-zinc-800 transition-colors"
          data-testid="dashboard-go-projects-btn"
        >
          <FolderKanban className="w-4 h-4" strokeWidth={1.5} />
          Go to projects
        </Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-zinc-200 border border-zinc-200 rounded-md overflow-hidden">
        {STAT_CARDS.map((c) => {
          const Icon = c.icon;
          return (
            <div key={c.key} className="bg-white p-6" data-testid={`stat-${c.key}`}>
              <div className="flex items-center justify-between">
                <div className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
                  {c.label}
                </div>
                <Icon className={`w-4 h-4 ${c.accent}`} strokeWidth={1.5} />
              </div>
              <div className={`mt-4 font-heading text-4xl font-extrabold tracking-tighter ${c.accent}`}>
                {t[c.key] ?? 0}
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <section className="border border-zinc-200 rounded-md bg-white">
          <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">// Recent activity</div>
              <h2 className="font-heading text-xl font-bold tracking-tight text-zinc-950 mt-1">Recent tasks</h2>
            </div>
          </div>
          {data?.recent_tasks?.length ? (
            <ul className="divide-y divide-zinc-200" data-testid="recent-tasks-list">
              {data.recent_tasks.map((task) => (
                <li key={task.id} className="px-6 py-4 flex items-start justify-between gap-4 hover:bg-zinc-50 transition-colors">
                  <div className="min-w-0 flex-1">
                    <Link
                      to={`/projects/${task.project_id}`}
                      className="font-medium text-zinc-950 hover:underline underline-offset-4"
                    >
                      {task.title}
                    </Link>
                    <div className="text-xs text-zinc-500 mt-1">Updated {fmt(task.updated_at)}</div>
                  </div>
                  <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full border ${STATUS_BADGE[task.status]}`}>
                    {STATUS_LABEL[task.status]}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="px-6 py-10 text-center text-sm text-zinc-500" data-testid="recent-tasks-empty">
              <CircleDashed className="w-8 h-8 mx-auto text-zinc-300 mb-2" strokeWidth={1.5} />
              No tasks yet — create a project to get started.
            </div>
          )}
        </section>

        <section className="border border-zinc-200 rounded-md bg-white">
          <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.2em] text-red-600">// Attention</div>
              <h2 className="font-heading text-xl font-bold tracking-tight text-zinc-950 mt-1">Overdue tasks</h2>
            </div>
          </div>
          {data?.overdue_tasks?.length ? (
            <ul className="divide-y divide-zinc-200" data-testid="overdue-tasks-list">
              {data.overdue_tasks.map((task) => (
                <li key={task.id} className="px-6 py-4 flex items-start justify-between gap-4 hover:bg-zinc-50 transition-colors">
                  <div className="min-w-0 flex-1">
                    <Link
                      to={`/projects/${task.project_id}`}
                      className="font-medium text-zinc-950 hover:underline underline-offset-4"
                    >
                      {task.title}
                    </Link>
                    <div className="text-xs text-red-600 mt-1">Due {fmt(task.due_date)}</div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-zinc-400 mt-1" strokeWidth={1.5} />
                </li>
              ))}
            </ul>
          ) : (
            <div className="px-6 py-10 text-center text-sm text-zinc-500" data-testid="overdue-tasks-empty">
              <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-400 mb-2" strokeWidth={1.5} />
              All caught up. Nothing overdue.
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
