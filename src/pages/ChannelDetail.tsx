import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../api/client";
import type {
  Binding,
  Channel,
  CommandsView,
  CustomCommand,
  DispatchResult,
  KnowledgeDoc,
  StickerFile,
} from "../api/types";

type Tab = "knowledge" | "bindings" | "commands" | "test";

export default function ChannelDetail() {
  const { id = "" } = useParams();
  const nav = useNavigate();
  const [channel, setChannel] = useState<Channel | null>(null);
  const [tab, setTab] = useState<Tab>("knowledge");
  const [err, setErr] = useState("");

  const load = useCallback(() => {
    api.getChannel(id).then(setChannel).catch(() => setErr("Channel not found."));
  }, [id]);
  useEffect(load, [load]);

  async function remove() {
    if (!confirm("Delete this channel and all its docs, bindings and commands?")) return;
    await api.deleteChannel(id);
    nav("/channels");
  }

  if (err) return <div className="card empty">{err}</div>;
  if (!channel) return <div className="spinner">Loading…</div>;

  return (
    <div>
      <div className="row between" style={{ marginBottom: 16 }}>
        <div>
          <h2 style={{ margin: 0 }}>#{channel.name}</h2>
          <div className="muted small">{channel.description || "No description"}</div>
        </div>
        <button className="btn danger" onClick={remove}>Delete channel</button>
      </div>

      <div className="tabs">
        {(["knowledge", "bindings", "commands", "test"] as Tab[]).map((t) => (
          <div key={t} className={`tab ${tab === t ? "active" : ""}`} onClick={() => setTab(t)}>
            {t[0].toUpperCase() + t.slice(1)}
          </div>
        ))}
      </div>

      {tab === "knowledge" && <KnowledgeTab channelId={id} />}
      {tab === "bindings" && <BindingsTab channelId={id} />}
      {tab === "commands" && <CommandsTab channelId={id} />}
      {tab === "test" && <TestTab channelId={id} />}
    </div>
  );
}

function KnowledgeTab({ channelId }: { channelId: string }) {
  const [docs, setDocs] = useState<KnowledgeDoc[]>([]);
  const [filename, setFilename] = useState("");
  const [content, setContent] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [editing, setEditing] = useState<KnowledgeDoc | null>(null);
  const [editContent, setEditContent] = useState("");
  const [editMsg, setEditMsg] = useState("");

  const load = useCallback(() => {
    api.listDocs(channelId).then(setDocs);
  }, [channelId]);
  useEffect(load, [load]);

  async function openEdit(docId: string) {
    setEditMsg("");
    const doc = await api.getDoc(docId);
    setEditing(doc);
    setEditContent(doc.content ?? "");
  }

  async function saveEdit() {
    if (!editing) return;
    await api.updateDoc(editing.id, editContent);
    setEditMsg("Saved.");
    setTimeout(() => {
      setEditing(null);
      setEditMsg("");
      load();
    }, 700);
  }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFilename(f.name);
    setContent(await f.text());
  }

  async function upload(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg("");
    try {
      await api.uploadDoc(channelId, filename.trim(), content);
      setFilename("");
      setContent("");
      setMsg("Attached.");
      load();
    } finally {
      setBusy(false);
    }
  }

  async function del(docId: string) {
    await api.deleteDoc(docId);
    load();
  }

  return (
    <div className="grid" style={{ gap: 16 }}>
      {editing && (
        <div className="card">
          <div className="row between">
            <h3 style={{ margin: 0 }}>Edit {editing.filename}</h3>
            <button className="btn secondary sm" onClick={() => setEditing(null)}>Close</button>
          </div>
          <p className="muted small">
            Edit the markdown and save. For the AI agent, this is where you put
            mappings like <code>Jira project key</code>, Confluence space, Bitbucket
            project, Bamboo plan key.
          </p>
          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            style={{ minHeight: 260 }}
          />
          {editMsg && <div className="ok">{editMsg}</div>}
          <button className="btn" onClick={saveEdit} disabled={!editContent.trim()}>
            Save changes
          </button>
        </div>
      )}

      <div className="grid cols-2" style={{ alignItems: "start" }}>
      <form className="card" onSubmit={upload}>
        <h3>Attach markdown</h3>
        <div className="field">
          <label>Upload a .md file (or paste below)</label>
          <input type="file" accept=".md,.markdown,text/markdown,text/plain" onChange={onFile} />
        </div>
        <div className="field">
          <label>Filename</label>
          <input value={filename} onChange={(e) => setFilename(e.target.value)} placeholder="refunds.md" />
        </div>
        <div className="field">
          <label>Content</label>
          <textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="# Heading&#10;text..." />
        </div>
        {msg && <div className="ok">{msg}</div>}
        <button className="btn" disabled={busy || !filename.trim() || !content.trim()}>
          {busy ? "Uploading…" : "Attach doc"}
        </button>
      </form>

      <div className="card" style={{ padding: 0 }}>
        <div style={{ padding: "18px 18px 0" }}><h3>Attached documents</h3></div>
        {docs.length === 0 ? (
          <div className="empty">No documents yet.</div>
        ) : (
          <table>
            <thead>
              <tr><th>File</th><th>Version</th><th>Attached</th><th></th></tr>
            </thead>
            <tbody>
              {docs.map((d) => (
                <tr key={d.id}>
                  <td>{d.filename}</td>
                  <td>v{d.version}</td>
                  <td className="muted small">{new Date(d.attached_at).toLocaleDateString()}</td>
                  <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                    <button className="btn secondary sm" onClick={() => openEdit(d.id)}>Edit</button>{" "}
                    <button className="btn danger sm" onClick={() => del(d.id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      </div>
    </div>
  );
}

function BindingsTab({ channelId }: { channelId: string }) {
  const [bindings, setBindings] = useState<Binding[]>([]);
  const [connector, setConnector] = useState("whatsapp");
  const [chatId, setChatId] = useState("");
  const [label, setLabel] = useState("");
  const [err, setErr] = useState("");

  const load = useCallback(() => {
    api.listBindings(channelId).then(setBindings);
  }, [channelId]);
  useEffect(load, [load]);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    try {
      await api.addBinding(channelId, connector, chatId.trim(), label.trim());
      setChatId("");
      setLabel("");
      load();
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Could not add binding (chat may already be bound).");
    }
  }

  async function del(bid: string) {
    await api.deleteBinding(bid);
    load();
  }

  return (
    <div className="grid cols-2" style={{ alignItems: "start" }}>
      <form className="card" onSubmit={add}>
        <h3>Bind a chat</h3>
        <div className="field">
          <label>Connector</label>
          <select value={connector} onChange={(e) => setConnector(e.target.value)}>
            <option value="whatsapp">WhatsApp</option>
            <option value="telegram">Telegram (future)</option>
            <option value="email">Email (future)</option>
          </select>
        </div>
        <div className="field">
          <label>Chat ID</label>
          <input value={chatId} onChange={(e) => setChatId(e.target.value)} placeholder="628123@g.us" />
        </div>
        <div className="field">
          <label>Label</label>
          <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Support Group" />
        </div>
        {err && <div className="error">{err}</div>}
        <button className="btn" disabled={!chatId.trim()}>Add binding</button>
      </form>

      <div className="card" style={{ padding: 0 }}>
        <div style={{ padding: "18px 18px 0" }}><h3>Bound chats</h3></div>
        {bindings.length === 0 ? (
          <div className="empty">No bindings yet.</div>
        ) : (
          <table>
            <thead>
              <tr><th>Connector</th><th>Chat ID</th><th>Label</th><th></th></tr>
            </thead>
            <tbody>
              {bindings.map((b) => (
                <tr key={b.id}>
                  <td>{b.connector}</td>
                  <td className="small">{b.chat_id}</td>
                  <td className="muted">{b.label || "—"}</td>
                  <td style={{ textAlign: "right" }}>
                    <button className="btn danger sm" onClick={() => del(b.id)}>Unbind</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function CommandsTab({ channelId }: { channelId: string }) {
  const [view, setView] = useState<CommandsView | null>(null);
  const [fallback, setFallback] = useState("");
  const [saved, setSaved] = useState(false);

  const load = useCallback(() => {
    api.getCommands(channelId).then((v) => {
      setView(v);
      setFallback(v.fallback_message);
    });
  }, [channelId]);
  useEffect(load, [load]);

  async function toggle(command: string, enabled: boolean) {
    const v = await api.toggleCommand(channelId, command, enabled);
    setView(v);
  }

  async function saveFallback() {
    const v = await api.setFallback(channelId, fallback);
    setView(v);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }

  if (!view) return <div className="spinner">Loading…</div>;

  return (
    <div className="grid" style={{ gap: 16 }}>
      <div className="grid cols-2" style={{ alignItems: "start" }}>
        <div className="card">
          <h3>Built-in commands</h3>
          <p className="muted small">Toggle which built-in commands answer in this channel.</p>
          {view.commands.map((c) => (
            <div key={c.id} className="row between" style={{ padding: "8px 0" }}>
              <code>{c.command}</code>
              <button
                className={`btn sm ${c.enabled ? "" : "secondary"}`}
                onClick={() => toggle(c.command, !c.enabled)}
              >
                {c.enabled ? "Enabled" : "Disabled"}
              </button>
            </div>
          ))}
        </div>

        <div className="card">
          <h3>Fallback message</h3>
          <p className="muted small">
            Sent when no command matches and <code>/ask</code> finds nothing.
            <b> Leave this blank to turn the fallback off</b> — the bot then stays
            silent on messages it doesn't recognize (recommended for busy groups).
          </p>
          <div className="field">
            <textarea
              value={fallback}
              onChange={(e) => setFallback(e.target.value)}
              placeholder="(blank = no reply on unrecognized messages)"
            />
          </div>
          {saved && <div className="ok">Saved.</div>}
          <div className="row">
            <button className="btn" onClick={saveFallback}>Save fallback</button>
            {fallback.trim() !== "" && (
              <button
                className="btn secondary"
                onClick={() => setFallback("")}
                type="button"
                title="Clear to disable fallback replies"
              >
                Turn off (clear)
              </button>
            )}
          </div>
        </div>
      </div>

      <CustomCommandsManager channelId={channelId} />
    </div>
  );
}

function CustomCommandsManager({ channelId }: { channelId: string }) {
  const [items, setItems] = useState<CustomCommand[]>([]);
  const [command, setCommand] = useState("");
  const [answer, setAnswer] = useState("");
  const [stickerUrl, setStickerUrl] = useState("");
  const [err, setErr] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showPicker, setShowPicker] = useState(false);
  const [stickers, setStickers] = useState<StickerFile[]>([]);

  const load = useCallback(() => {
    api.listCustomCommands(channelId).then(setItems);
  }, [channelId]);
  useEffect(load, [load]);

  function togglePicker() {
    const next = !showPicker;
    setShowPicker(next);
    if (next && stickers.length === 0) {
      api.listStickers().then(setStickers).catch(() => setStickers([]));
    }
  }

  function reset() {
    setCommand("");
    setAnswer("");
    setStickerUrl("");
    setEditingId(null);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    try {
      await api.saveCustomCommand(channelId, command.trim(), answer, stickerUrl.trim(), true);
      reset();
      load();
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Could not save command.");
    }
  }

  function edit(c: CustomCommand) {
    setCommand(c.command);
    setAnswer(c.answer);
    setStickerUrl(c.sticker_url || "");
    setEditingId(c.id);
  }

  async function toggle(c: CustomCommand) {
    await api.saveCustomCommand(channelId, c.command, c.answer, c.sticker_url || "", !c.enabled);
    load();
  }

  async function del(id: string) {
    await api.deleteCustomCommand(id);
    if (editingId === id) reset();
    load();
  }

  return (
    <div className="card">
      <h3>Custom commands &amp; answers</h3>
      <p className="muted small">
        Define your own commands with a fixed reply — no code needed. Example:
        command <code>/ping</code> → answer <code>pong</code>. These are matched
        after the built-in commands.
      </p>

      <form onSubmit={save} style={{ marginBottom: 16 }}>
        <div className="grid cols-2" style={{ alignItems: "start" }}>
          <div className="field" style={{ marginBottom: 0 }}>
            <label>Command</label>
            <input
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              placeholder="/hours"
              disabled={editingId !== null}
            />
          </div>
          <div className="field" style={{ marginBottom: 0 }}>
            <label>Answer (text)</label>
            <textarea
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="We're open Mon–Fri, 9am–5pm."
              style={{ minHeight: 60 }}
            />
          </div>
        </div>
        <div className="field" style={{ marginTop: 10, marginBottom: 0 }}>
          <label>Sticker (.webp) — optional</label>
          <div className="row">
            <input
              value={stickerUrl}
              onChange={(e) => setStickerUrl(e.target.value)}
              placeholder="Pick a captured sticker, or paste a .webp URL"
            />
            <button type="button" className="btn secondary" onClick={togglePicker}>
              {showPicker ? "Hide" : "Pick sticker"}
            </button>
            {stickerUrl && (
              <button type="button" className="btn secondary sm" onClick={() => setStickerUrl("")}>
                Clear
              </button>
            )}
          </div>
          {showPicker && (
            stickers.length === 0 ? (
              <p className="muted small" style={{ marginTop: 8 }}>
                No captured stickers. Send one of your stickers to the bot on
                WhatsApp, then reopen this picker.
              </p>
            ) : (
              <div className="sticker-picker">
                {stickers.map((s) => (
                  <div
                    key={s.file}
                    className={`pick ${stickerUrl === s.url ? "selected" : ""}`}
                    title={s.file}
                    onClick={() => setStickerUrl(s.url)}
                  >
                    <img src={s.url} alt={s.file} loading="lazy" />
                  </div>
                ))}
              </div>
            )
          )}
          {stickerUrl && (
            <div className="row" style={{ marginTop: 8 }}>
              <img
                src={stickerUrl}
                alt="selected sticker"
                style={{ width: 56, height: 56, objectFit: "contain" }}
              />
              <span className="muted small">Selected sticker preview</span>
            </div>
          )}
          <p className="muted small" style={{ marginTop: 6 }}>
            Sent as a WhatsApp sticker (WebP). Set a sticker, text, or both —
            blank text = sticker-only reply.
          </p>
        </div>
        {err && <div className="error">{err}</div>}
        <div className="row" style={{ marginTop: 10 }}>
          <button className="btn" disabled={!command.trim() || (!answer.trim() && !stickerUrl.trim())}>
            {editingId ? "Update command" : "Add command"}
          </button>
          {editingId && (
            <button type="button" className="btn secondary" onClick={reset}>
              Cancel
            </button>
          )}
        </div>
      </form>

      {items.length === 0 ? (
        <div className="muted small">No custom commands yet.</div>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Command</th>
              <th>Answer</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {items.map((c) => (
              <tr key={c.id}>
                <td><code>{c.command}</code></td>
                <td className="small" style={{ maxWidth: 320, whiteSpace: "pre-wrap" }}>
                  {c.answer}
                  {c.sticker_url && (
                    <div className="muted" style={{ marginTop: 4 }}>🎯 sticker</div>
                  )}
                </td>
                <td>
                  <button className={`btn sm ${c.enabled ? "" : "secondary"}`} onClick={() => toggle(c)}>
                    {c.enabled ? "Enabled" : "Disabled"}
                  </button>
                </td>
                <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                  <button className="btn secondary sm" onClick={() => edit(c)}>Edit</button>{" "}
                  <button className="btn danger sm" onClick={() => del(c.id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function TestTab({ channelId }: { channelId: string }) {
  const [text, setText] = useState("/ask ");
  const [result, setResult] = useState<DispatchResult | null>(null);
  const [busy, setBusy] = useState(false);

  async function run(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      setResult(await api.testQuery(channelId, text));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid cols-2" style={{ alignItems: "start" }}>
      <form className="card" onSubmit={run}>
        <h3>Dry-run a command</h3>
        <p className="muted small">
          Preview the bot's reply against this channel's docs before it ever hits WhatsApp.
        </p>
        <div className="field">
          <label>Message text</label>
          <input value={text} onChange={(e) => setText(e.target.value)} placeholder="/ask what is the refund policy" />
        </div>
        <button className="btn" disabled={busy || !text.trim()}>
          {busy ? "Running…" : "Run"}
        </button>
      </form>

      <div className="card">
        <h3>Bot reply</h3>
        {!result ? (
          <div className="muted small">Run a command to see the reply.</div>
        ) : (
          <>
            <div className="row" style={{ marginBottom: 10 }}>
              <span className="badge">
                <span className={`dot ${result.matched ? "on" : "warn"}`} />
                {result.matched ? `matched ${result.command}` : "fallback"}
              </span>
            </div>
            <div className="pre">{result.response}</div>
          </>
        )}
      </div>
    </div>
  );
}
