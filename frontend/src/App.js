import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { Toaster } from "sonner";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import Layout from "@/components/Layout";
import Home from "@/pages/Home";
import LiveLogs from "@/pages/LiveLogs";
import Statistics from "@/pages/Statistics";
import Slots from "@/pages/Slots";
import Marketplace from "@/pages/Marketplace";
import Leaderboard from "@/pages/Leaderboard";
import Admin from "@/pages/Admin";
import Login from "@/pages/Login";
import AuthCallback from "@/pages/AuthCallback";

const Protected = ({ admin }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="p-20 text-center text-zinc-500" data-testid="loading">Loading…</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (admin && !user.is_admin) return <Navigate to="/" replace />;
  return <Outlet />;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route element={<Layout />}>
            <Route element={<Protected />}>
              <Route path="/" element={<Home />} />
              <Route path="/logs" element={<LiveLogs />} />
              <Route path="/statistics" element={<Statistics />} />
              <Route path="/slots" element={<Slots />} />
              <Route path="/marketplace" element={<Marketplace />} />
              <Route path="/leaderboard" element={<Leaderboard />} />
            </Route>
            <Route element={<Protected admin />}>
              <Route path="/admin" element={<Admin />} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
      <Toaster theme="dark" position="top-right" richColors />
    </AuthProvider>
  );
}

export default App;
