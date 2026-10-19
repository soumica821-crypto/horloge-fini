import { useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import { TIER_META } from "@/lib/format";
import LogRow from "@/components/LogCard";
import FiltersPanel from "@/components/FiltersPanel";

export default function LiveLogs() {
  const [logs, setLogs] = useState([]);
  const [tier, setTier] = useState("");
  const seen = useRef(new Set());
  const [fresh, setFresh] = useState(new Set());

  useEffect(() => {
    seen.current = new Set();
    const load = async () => {
      const r = await api.get("/logs", { params: { limit: 60, tier: tier || undefined } });
      const first = seen.current.size === 0;
      const nw = new Set(r.data.filter((l) => !seen.current.has(l.id)).map((l) => l.id));
      r.data.forEach((l) => seen.current.add(l.id));
      setFresh(first ? new Set() : nw);
      setLogs(r.data);
    };
    load();
    const t = setInterval(load, 8000);
    return () => clearInterval(t);
  }, [tier]);

  return (
    <div className="space-y-8">
      <div className="fade-up">
        <div className="flex items-center gap-2 label-xs"><span className="h-2 w-2 animate-pulse rounded-full bg-[#FF2A85]" />Live feed</div>
        <h1 className="font-display mt-3 text-4xl font-bold sm:text-5xl">Live Logs</h1>
        <p className="mt-2 text-zinc-400">Brainrots found by our bots in real time. Join locks open with an active slot.</p>
      </div>
      <div className="flex flex-wrap gap-2" data-testid="tier-filter">
        {[["", "All"], ...Object.entries(TIER_META).map(([k, v]) => [k, v.label])].map(([k, l]) => (
          <button key={k} onClick={() => setTier(k)} data-testid={`tier-filter-${k || "all"}`}
            className={`rounded-full px-4 py-2 text-sm transition-colors ${tier === k ? "bg-[#FF2A85] text-white" : "btn-ghost text-zinc-300"}`}>{l}</button>
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-12">
        <div className="space-y-3 lg:col-span-8" data-testid="live-log-list">
          {logs.length === 0 && <div className="glass rounded-2xl p-10 text-center text-zinc-500">No logs yet</div>}
          {logs.map((l) => <LogRow key={l.id} log={l} fresh={fresh.has(l.id)} />)}
        </div>
        <div className="lg:col-span-4"><div className="lg:sticky lg:top-32"><FiltersPanel /></div></div>
      </div>
    </div>
  );
}
