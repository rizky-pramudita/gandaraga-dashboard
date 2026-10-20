import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import type { AuditEntry, ChannelView, ConnectorStatus } from "../api/types";

export default function Dashboard() {
  const [channels, setChannels] = useState<ChannelView[]>([]);
  const [connectors, setConnectors] = useState<ConnectorStatus[]>([]);
  const [audit, setAudit] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.listChannels(), api.listConnectors(), api.listAudit(8)])
      .then(([c, cn, a]) => {
        setChannels(c);
        setConnectors(cn);
        setAudit(a);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="spinner">Loading…</div>;

  const docs = channels.reduce((n, c) => n + c.doc_count, 0);
  const binds = channels.reduce((n, c) => n + c.binding_count, 0);

  return (
    <div className="grid" style={{ gap: 20 }}>
      <div className="grid cols-3">
        <div className="card">
          <div className="stat">{channels.length}</div>
          <div className="stat-label">Channels</div>
        </div>
        <div className="card">
          <div className="stat">{docs}</div>
          <div className="stat-label">Knowledge docs</div>
        </div>
        <div className="card">
          <div className="stat">{binds}</div>
          <div className="stat-label">Chat bindings</div>
        </div>
      </div>

      <div className="grid cols-2">
        <div className="card">
          <h3>Connectors</h3>
          {connectors.map((c) => (
            <div key={c.name} className="row between" style={{ padding: "8px 0" }}>
              <span className="row">
                <span className={`dot ${c.connected ? "on" : c.needs_qr ? "warn" : "off"}`} />
                {c.name}
              </span>
              <span className="muted small">
                {c.connected ? "connected" : c.needs_qr ? "needs QR" : "offline"}
              </span>
            </div>
          ))}
          <Link to="/connectors" className="small">Manage connectors →</Link>
        </div>

        <div className="card">
          <h3>Recent activity</h3>
          {audit.length === 0 && <div className="muted small">No activity yet.</div>}
          {audit.map((a) => (
            <div key={a.id} className="row between small" style={{ padding: "6px 0" }}>
              <span><code>{a.command}</code> <span className="muted">{a.chat_id}</span></span>
              <span className="muted">{new Date(a.ts).toLocaleTimeString()}</span>
            </div>
          ))}
          <Link to="/activity" className="small">View all →</Link>
        </div>
      </div>
    </div>
  );
}
