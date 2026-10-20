import { useCallback, useEffect, useState } from "react";
import { api } from "../api/client";
import type { StickerFile } from "../api/types";

export default function Stickers() {
  const [items, setItems] = useState<StickerFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");
  const [pruning, setPruning] = useState(false);
  const [err, setErr] = useState("");

  const load = useCallback(() => {
    setLoading(true);
    setErr("");
    api
      .listStickers()
      .then(setItems)
      .catch(() => setErr("Couldn't reach the WhatsApp bridge. Is it running?"))
      .finally(() => setLoading(false));
  }, []);
  useEffect(load, [load]);

  async function del(file: string) {
    await api.deleteSticker(file);
    load();
  }

  async function prune() {
    if (!confirm("Delete all captured stickers not used by any command?")) return;
    setPruning(true);
    setMsg("");
    try {
      const res = await api.pruneStickers();
      setMsg(`Cleaned up ${res.deleted.length} unused sticker(s). ${res.kept} kept.`);
      load();
    } catch {
      setErr("Cleanup failed (bridge unavailable?).");
    } finally {
      setPruning(false);
    }
  }

  return (
    <div>
      <div className="row between" style={{ marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>Stickers</h2>
        <div className="row">
          <button className="btn secondary" onClick={load}>Refresh</button>
          <button className="btn danger" onClick={prune} disabled={pruning || items.length === 0}>
            {pruning ? "Cleaning…" : "Clean up unused"}
          </button>
        </div>
      </div>

      <p className="muted small" style={{ marginTop: 0 }}>
        Stickers you send to the bot are captured here. Attach one to a command in
        a channel's <b>Commands → Custom commands</b> tab (use "Pick sticker").
        "Clean up unused" removes captured stickers not referenced by any command.
      </p>

      {msg && <div className="ok">{msg}</div>}
      {err && <div className="error">{err}</div>}

      {loading ? (
        <div className="spinner">Loading…</div>
      ) : items.length === 0 ? (
        <div className="card empty">
          No stickers captured yet. Send one of your stickers to the bot on WhatsApp.
        </div>
      ) : (
        <div className="card">
          <div className="sticker-grid">
            {items.map((s) => (
              <div key={s.file} className="sticker-cell">
                <img src={s.url} alt={s.file} loading="lazy" />
                <div className="sticker-meta">
                  <span className="muted">{(s.size / 1024).toFixed(0)} KB</span>
                  <button className="btn danger sm" onClick={() => del(s.file)}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
