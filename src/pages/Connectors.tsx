import { useEffect, useRef, useState } from "react";
import { api } from "../api/client";
import type { ConnectorStatus, IntegrationStatus } from "../api/types";

const INT_DOT: Record<string, string> = {
  ok: "on",
  unauthorized: "off",
  unreachable: "warn",
  error: "off",
  disabled: "",
};

export default function Connectors() {
  const [connectors, setConnectors] = useState<ConnectorStatus[]>([]);
  const [integrations, setIntegrations] = useState<IntegrationStatus[]>([]);
  const [intLoading, setIntLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  const [linking, setLinking] = useState(false);
  const timer = useRef<number | null>(null);

  function load() {
    api
      .listIntegrations()
      .then(setIntegrations)
      .catch(() => setIntegrations([]))
      .finally(() => setIntLoading(false));
    return api
      .listConnectors()
      .then(setConnectors)
      .finally(() => setLoading(false));
  }

  // Poll while any connector still needs a QR, so the screen updates the moment
  // the phone scans and the socket goes "connected".
  useEffect(() => {
    load();
    timer.current = window.setInterval(load, 2000);
    return () => {
      if (timer.current) window.clearInterval(timer.current);
    };
  }, []);

  async function link() {
    setLinking(true);
    try {
      await api.linkWhatsApp();
      await load();
    } finally {
      setLinking(false);
    }
  }

  if (loading) return <div className="spinner">Loading…</div>;

  return (
    <div className="grid" style={{ gap: 16 }}>
      <div className="card">
        <div className="row between">
          <h3 style={{ margin: 0 }}>API integrations</h3>
          <span className="muted small">used by /agent</span>
        </div>
        {intLoading ? (
          <div className="muted small" style={{ marginTop: 8 }}>Checking…</div>
        ) : integrations.length === 0 ? (
          <div className="muted small" style={{ marginTop: 8 }}>No integrations configured.</div>
        ) : (
          <table style={{ marginTop: 8 }}>
            <thead>
              <tr><th>Service</th><th>Status</th><th>Host</th><th>Detail</th></tr>
            </thead>
            <tbody>
              {integrations.map((it) => (
                <tr key={it.name}>
                  <td style={{ textTransform: "capitalize" }}>{it.name}</td>
                  <td>
                    <span className="badge">
                      <span className={`dot ${INT_DOT[it.status] ?? ""}`} />
                      {it.status}
                    </span>
                  </td>
                  <td className="small muted">{it.base_url || "—"}</td>
                  <td className="small muted">{it.detail || (it.status === "ok" ? "authenticated" : "")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {connectors.map((c) => {
        const isQrImage = (c.qr_code ?? "").startsWith("data:image");
        return (
          <div key={c.name} className="card">
            <div className="row between">
              <h3 style={{ margin: 0, textTransform: "capitalize" }}>{c.name}</h3>
              <span className="badge">
                <span className={`dot ${c.connected ? "on" : c.needs_qr ? "warn" : "off"}`} />
                {c.connected ? "connected" : c.needs_qr ? "needs QR" : "offline"}
              </span>
            </div>
            {c.detail && <p className="muted small">{c.detail}</p>}

            {c.connected && (
              <p className="ok">WhatsApp is linked and ready.</p>
            )}

            {!c.connected && c.needs_qr && (
              <div style={{ marginTop: 12 }}>
                {isQrImage ? (
                  <>
                    <p className="small muted">
                      Open WhatsApp on your phone → Settings → Linked Devices →
                      Link a Device, then scan. The code refreshes automatically —
                      scan whatever is currently shown.
                    </p>
                    <img
                      src={c.qr_code}
                      alt="WhatsApp QR"
                      width={260}
                      height={260}
                      style={{ background: "#fff", padding: 10, borderRadius: 8 }}
                    />
                  </>
                ) : (
                  <div className="pre" style={{ display: "inline-block" }}>
                    {c.qr_code || "waiting for QR…"}
                  </div>
                )}
                <div style={{ marginTop: 12 }}>
                  <button className="btn secondary" onClick={link} disabled={linking}>
                    {linking ? "Refreshing…" : "Refresh"}
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
