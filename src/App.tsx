import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./auth";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Channels from "./pages/Channels";
import ChannelDetail from "./pages/ChannelDetail";
import Connectors from "./pages/Connectors";
import Activity from "./pages/Activity";
import Stickers from "./pages/Stickers";

export default function App() {
  const { authed } = useAuth();

  if (!authed) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/channels" element={<Channels />} />
        <Route path="/channels/:id" element={<ChannelDetail />} />
        <Route path="/connectors" element={<Connectors />} />
        <Route path="/stickers" element={<Stickers />} />
        <Route path="/activity" element={<Activity />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
