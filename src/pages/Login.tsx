import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth";
import { api } from "../api/client";

export default function Login() {
  const { login } = useAuth();
  const nav = useNavigate();
  const [token, setToken] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    setBusy(true);
    try {
      await login(token.trim());
      nav("/", { replace: true });
    } catch {
      setErr("Invalid admin token, or the API is unreachable.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="login-wrap">
      <form className="card login-card" onSubmit={submit}>
        <div className="brand" style={{ padding: "0 0 16px" }}>
          Gandaraga
          <small>Assistant Admin</small>
        </div>
        <div className="field">
          <label>Admin token</label>
          <input
            type="password"
            value={token}
            autoFocus
            placeholder="ADMIN_TOKEN"
            onChange={(e) => setToken(e.target.value)}
          />
        </div>
        {err && <div className="error">{err}</div>}
        <button className="btn" style={{ width: "100%" }} disabled={busy || !token}>
          {busy ? "Verifying…" : "Sign in"}
        </button>
        <p className="muted small" style={{ marginTop: 14 }}>
          API: <code>{api.base}</code>
        </p>
      </form>
    </div>
  );
}
