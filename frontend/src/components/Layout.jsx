import { Outlet } from "react-router-dom";
import { AlertTriangle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import Header from "@/components/Header";
import ExpiryWatcher from "@/components/ExpiryWatcher";

const FrozenBanner = () => (
  <div data-testid="system-frozen-banner"
    className="flex items-center justify-center gap-3 border-b border-red-500/40 bg-[#3a1418]/90 px-4 py-3 text-sm backdrop-blur">
    <AlertTriangle className="h-4 w-4 text-red-200" />
    <span className="font-bold tracking-wide">SYSTEM FROZEN:</span>
    <span className="text-red-100/90">All divisions are paused. Purchases are temporarily locked.</span>
  </div>
);

export default function Layout() {
  const { settings, user } = useAuth();
  return (
    <div className="min-h-screen flex flex-col">
      <div className="app-bg" />
      <div className="clock-ring" />
      <div className="sticky top-0 z-40">
        {settings.system_frozen && <FrozenBanner />}
        <Header />
      </div>
      <main className="flex-1 w-full max-w-[1400px] mx-auto px-4 sm:px-8 py-10">
        <Outlet />
      </main>
      <footer className="border-t border-white/5 py-6 text-center text-sm text-zinc-500" data-testid="footer">
        © {new Date().getFullYear()} Horloge Joiner. All rights reserved.
      </footer>
      {user && <ExpiryWatcher />}
    </div>
  );
}
