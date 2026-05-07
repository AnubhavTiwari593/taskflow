import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { CheckSquare } from "lucide-react";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    const res = await login(email, password);
    setBusy(false);
    if (res.ok) navigate("/dashboard");
    else setError(res.error || "Login failed");
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-white">
      <div className="hidden lg:flex flex-col justify-between p-12 bg-zinc-950 text-white">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-white flex items-center justify-center">
            <CheckSquare className="w-4 h-4 text-zinc-950" strokeWidth={2} />
          </div>
          <span className="font-heading font-extrabold tracking-tighter text-lg">TaskFlow</span>
        </div>
        <div>
          <div className="text-xs uppercase tracking-[0.2em] text-zinc-400 mb-4">// Workspace</div>
          <h1 className="font-heading text-5xl font-extrabold tracking-tighter leading-none">
            Ship work,<br />not status meetings.
          </h1>
          <p className="mt-6 text-zinc-400 text-base leading-relaxed max-w-md">
            A focused project & task workspace for small teams. Plan it. Assign it. Track it. Done.
          </p>
        </div>
        <div className="text-xs uppercase tracking-[0.2em] text-zinc-500">
          v1.0 · Built for teams
        </div>
      </div>

      <div className="flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md">
          <div className="text-xs uppercase tracking-[0.2em] text-zinc-500 mb-2">// Sign in</div>
          <h2 className="font-heading text-3xl font-bold tracking-tight text-zinc-950">
            Welcome back
          </h2>
          <p className="mt-2 text-sm text-zinc-500">
            Don't have an account?{" "}
            <Link to="/register" className="text-zinc-950 font-semibold underline underline-offset-4" data-testid="register-link">
              Create one
            </Link>
          </p>

          <form onSubmit={onSubmit} className="mt-8 space-y-5" data-testid="login-form">
            <div>
              <label className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-2 block w-full rounded-md border border-zinc-200 bg-white px-4 py-2.5 text-sm text-zinc-950 placeholder:text-zinc-400 focus:border-zinc-950 focus:outline-none focus:ring-1 focus:ring-zinc-950"
                placeholder="you@company.com"
                data-testid="login-email-input"
              />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-2 block w-full rounded-md border border-zinc-200 bg-white px-4 py-2.5 text-sm text-zinc-950 placeholder:text-zinc-400 focus:border-zinc-950 focus:outline-none focus:ring-1 focus:ring-zinc-950"
                placeholder="••••••••"
                data-testid="login-password-input"
              />
            </div>

            {error && (
              <div className="text-sm text-red-600 border border-red-200 bg-red-50 rounded-md px-3 py-2" data-testid="login-error">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={busy}
              className="w-full inline-flex items-center justify-center rounded-md bg-zinc-950 px-6 py-3 text-sm font-medium text-white hover:bg-zinc-800 transition-colors disabled:opacity-50"
              data-testid="login-submit-btn"
            >
              {busy ? "Signing in…" : "Sign in"}
            </button>
          </form>

          <div className="mt-8 border border-zinc-200 rounded-md p-4 bg-zinc-50">
            <div className="text-xs uppercase tracking-[0.2em] text-zinc-500 mb-2">// Demo admin</div>
            <div className="text-sm text-zinc-700 font-mono">admin@taskflow.com</div>
            <div className="text-sm text-zinc-700 font-mono">Admin@12345</div>
          </div>
        </div>
      </div>
    </div>
  );
}
