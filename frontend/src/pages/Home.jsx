import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { CompactLog } from "@/components/LogCard";
import ScriptCard from "@/components/home/ScriptCard";
import SubscriptionCard from "@/components/home/SubscriptionCard";
import AcquireSlot from "@/components/home/AcquireSlot";

const LiveClock = () => {
  const [t, setT] = useState(new Date());
  useEffect(() => { const i = setInterval(() => setT(new Date()), 1000); return () => clearInterval(i); }, []);
  return <span className="font-mono text-[#FF75A8]" data-testid="live-clock">{t.toLocaleTimeString()}</span>;
};

export default function Home() {
  const { user } = useAuth();
  const [recent, setRecent] = useState([]);
  useEffect(() => {
    const load = () => api.get("/logs/recent").then((r) => setRecent(r.data));
    load();
    const t = setInterval(load, 30000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="space-y-10">
      <div className="fade-up">
        <div className="label-xs">Welcome back · <LiveClock /></div>
        <h1 className="font-display mt-3 text-4xl font-bold sm:text-5xl lg:text-6xl" data-testid="home-title">
          {user?.display_name || user?.username}<span className="text-[#FF2A85]">.</span>
        </h1>
      </div>
      <ScriptCard />
      <section>
        <h2 className="font-display text-3xl font-bold">History</h2>
        <p className="mt-1 text-zinc-400">All recently stolen brainrots</p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4" data-testid="history-grid">
          {recent.slice(0, 8).map((l) => <CompactLog key={l.id} log={l} />)}
        </div>
      </section>
      <SubscriptionCard />
      <AcquireSlot />
    </div>
  );
}
