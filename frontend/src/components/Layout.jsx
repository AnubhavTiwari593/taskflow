import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { LogOut, LayoutDashboard, FolderKanban, Users, CheckSquare } from "lucide-react";

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const linkClass = ({ isActive }) =>
    `flex items-center gap-2 px-3 py-2 text-sm font-medium tracking-tight transition-colors border-b-2 ${
      isActive
        ? "text-zinc-950 border-zinc-950"
        : "text-zinc-500 border-transparent hover:text-zinc-950"
    }`;

  return (
    <div className="min-h-screen bg-white text-zinc-950 font-body">
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-zinc-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-8">
              <Link to="/dashboard" className="flex items-center gap-2" data-testid="brand-link">
                <div className="w-7 h-7 bg-zinc-950 flex items-center justify-center">
                  <CheckSquare className="w-4 h-4 text-white" strokeWidth={2} />
                </div>
                <span className="font-heading font-extrabold tracking-tighter text-lg">
                  TaskFlow
                </span>
              </Link>
              <nav className="hidden md:flex items-center gap-1">
                <NavLink to="/dashboard" className={linkClass} data-testid="nav-dashboard">
                  <LayoutDashboard className="w-4 h-4" strokeWidth={1.5} />
                  Dashboard
                </NavLink>
                <NavLink to="/projects" className={linkClass} data-testid="nav-projects">
                  <FolderKanban className="w-4 h-4" strokeWidth={1.5} />
                  Projects
                </NavLink>
                {user?.role === "admin" && (
                  <NavLink to="/team" className={linkClass} data-testid="nav-team">
                    <Users className="w-4 h-4" strokeWidth={1.5} />
                    Team
                  </NavLink>
                )}
              </nav>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <div className="text-sm font-semibold text-zinc-950" data-testid="header-user-name">
                  {user?.name}
                </div>
                <div className="text-xs uppercase tracking-[0.2em] text-zinc-500" data-testid="header-user-role">
                  {user?.role}
                </div>
              </div>
              <div className="w-9 h-9 rounded-full bg-zinc-950 text-white flex items-center justify-center text-sm font-semibold">
                {user?.name?.[0]?.toUpperCase() || "?"}
              </div>
              <button
                onClick={handleLogout}
                className="inline-flex items-center gap-2 rounded-md border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors"
                data-testid="logout-btn"
              >
                <LogOut className="w-4 h-4" strokeWidth={1.5} />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">{children}</main>
    </div>
  );
}
