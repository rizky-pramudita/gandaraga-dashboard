import { useEffect, useState } from "react";
import { api } from "../api/client";
import type { AuditEntry } from "../api/types";

export default function Activity() {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");

  function load() {
    setLoading(true);
    api.listAudit(200).then(setEntries).finally(() => setLoading(false));
  }
  useEffect(load, []);

  const shown = entries.filter((e) => {
    if (!filter) return true;
    const q = filter.toLowerCase();
    return (
      e.command.toLowerCase().includes(q) ||
      e.chat_id.toLowerCase().includes(q) ||
      e.text.toLowerCase().includes(q)
    );
  });

  return (
    <div>
      <div className="row between" style={{ marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>Activity</h2>
        <div className="row">
          <input
            style={{ width: 240 }}
            placeholder="Filter by command / chat / text"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
          <button className="btn secondary" onClick={load}>Refresh</button>
        </div>
      </div>

      {loading ? (
        <div className="spinner">Loading…</div>
      ) : shown.length === 0 ? (
        <div className="card empty">No activity.</div>
      ) : (
        <div className="card" style={{ padding: 0 }}>
          <table>
            <thead>
              <tr>
                <th>Time</th>
                <th>Connector</th>
                <th>Chat</th>
                <th>Command</th>
                <th>Text</th>
                <th>Response</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((e) => (
                <tr key={e.id}>
                  <td className="muted small">{new Date(e.ts).toLocaleString()}</td>
                  <td>{e.connector}</td>
                  <td className="small">{e.chat_id}</td>
                  <td><code>{e.command}</code></td>
                  <td className="small">{e.text}</td>
                  <td className="small muted" style={{ maxWidth: 280, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {e.response}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
