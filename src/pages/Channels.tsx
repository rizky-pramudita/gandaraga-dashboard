import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client";
import type { ChannelView } from "../api/types";

export default function Channels() {
  const nav = useNavigate();
  const [channels, setChannels] = useState<ChannelView[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [err, setErr] = useState("");

  function load() {
    setLoading(true);
    api.listChannels().then(setChannels).finally(() => setLoading(false));
  }
  useEffect(load, []);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    try {
      const c = await api.createChannel(name.trim(), desc.trim());
      setShowNew(false);
      setName("");
      setDesc("");
      nav(`/channels/${c.id}`);
    } catch {
      setErr("Could not create channel.");
    }
  }

  return (
    <div>
      <div className="row between" style={{ marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>Channels</h2>
        <button className="btn" onClick={() => setShowNew((s) => !s)}>
          {showNew ? "Cancel" : "+ New Channel"}
        </button>
      </div>

      {showNew && (
        <form className="card" style={{ marginBottom: 16 }} onSubmit={create}>
          <div className="field">
            <label>Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="support" autoFocus />
          </div>
          <div className="field">
            <label>Description</label>
            <input value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="customer support knowledge" />
          </div>
          {err && <div className="error">{err}</div>}
          <button className="btn" disabled={!name.trim()}>Create</button>
        </form>
      )}

      {loading ? (
        <div className="spinner">Loading…</div>
      ) : channels.length === 0 ? (
        <div className="card empty">No channels yet. Create your first one.</div>
      ) : (
        <div className="card" style={{ padding: 0 }}>
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Description</th>
                <th>Docs</th>
                <th>Chats</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {channels.map((c) => (
                <tr key={c.id} style={{ cursor: "pointer" }} onClick={() => nav(`/channels/${c.id}`)}>
                  <td>#{c.name}</td>
                  <td className="muted">{c.description || "—"}</td>
                  <td>{c.doc_count}</td>
                  <td>{c.binding_count}</td>
                  <td style={{ textAlign: "right" }}>
                    <button className="btn secondary sm">Edit</button>
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
