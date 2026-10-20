import { NavLink, Outlet, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAuth } from "../auth";
import { api } from "../api/client";
import type { ConnectorStatus } from "../api/types";

const titles: Record<string, string> = {
  "/": "Dashboard",
  "/channels": "Channels",
  "/connectors": "Connectors",
  "/activity": "Activity",
};

export default function Layout() {
  const { logout } = useAuth();
  const loc = useLocation();
  const [wa, setWa] = useState<ConnectorStatus | null>(null);

  useEffect(() => {
    api
      .listConnectors()
      .then((cs) => setWa(cs.find((c) => c.name === "whatsapp") ?? null))
      .catch(() => setWa(null));
  }, [loc.pathname]);

  const title =
    titles[loc.pathname] ??
    (loc.pathname.startsWith("/channels/") ? "Channel" : "Admin");

  const dotClass = wa?.connected ? "on" : wa?.needs_qr ? "warn" : "off";

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="brand">
          Gandaraga
          <small>Assistant Admin</small>
        </div>
        <nav className="nav">
          <NavLink to="/" end>Dashboard</NavLink>
          <NavLink to="/channels">Channels</NavLink>
          <NavLink to="/connectors">Connectors</NavLink>
          <NavLink to="/stickers">Stickers</NavLink>
          <NavLink to="/activity">Activity</NavLink>
        </nav>
        <div className="spacer" />
        <button className="btn secondary logout" onClick={logout}>
          Log out
        </button>
      </aside>
      <div className="main">
        <header className="topbar">
          <h1>{title}</h1>
          <span className="badge">
            <span className={`dot ${dotClass}`} />
            WhatsApp{" "}
            {wa?.connected ? "connected" : wa?.needs_qr ? "needs QR" : "offline"}
          </span>
        </header>
        <div className="content">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
