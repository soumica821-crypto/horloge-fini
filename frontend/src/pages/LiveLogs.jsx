import { useEffect, useRef, useState } from "react";
import { Zap } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { TIER_META, robloxJoinUrl } from "@/lib/format";
import LogRow from "@/components/LogCard";
import FiltersPanel from "@/components/FiltersPanel";

const matches = (l, f) => {
  const n = l.name.toLowerCase();
  if (l.locked || l.value < (f.min_value || 0)) return false;
  if (f.blacklist.some((x) => x.toLowerCase() === n)) return false;
  return !f.whitelist.length || f.whitelist.some((x) => x.toLowerCase() === n);
};

export default function LiveLogs() {
  const { user } = useAuth();
  const [logs, setLogs] = useState([]);
  const [tier, setTier] = useState("");
  const [autoJoin, setAutoJoin] = useState(localStorage.getItem("hj_web_autojoin") === "1");
  const seen = useRef(new Set());
  const auto = useRef(autoJoin);
  const filters = useRef(user.filters);
  filters.current = user.filters;
  const [fresh, setFresh] = useState(new Set());

  const toggleAuto = (v) => { setAutoJoin(v); auto.current = v; localStorage.setItem("hj_web_autojoin", v ? "1" : "0"); };

  useEffect(() => {
    seen.current = new Set();
    const load = async () => {
      const r = await api.get("/logs", { params: { limit: 60, tier: tier || undefined } });
      const first = seen.current.size === 0;
      const newLogs = r.data.filter((l) => !seen.current.has(l.id));
      r.data.forEach((l) => seen.current.add(l.id));
      setFresh(first ? new Set() : new Set(newLogs.map((l) => l.id)));
      setLogs(r.data);
      if (!first && auto.current) {
        const best = newLogs.filter((l) => matches(l, filters.current)).sort((a, b) => b.value - a.value)[0];
        if (best) window.location.href = robloxJoinUrl(best.place_id, best.job_id);
      }
    };
    load();
    const t = setInterval(load, 2000);
    return () => clearInterval(t);
  }, [tier]);

  return (
    <div className="space-y-8">
      <div className="fade-up">
        <div className="flex items-center gap-2 label-xs"><span className="h-2 w-2 animate-pulse rounded-full bg-[#FF2A85]" />Live feed</div>
        <h1 className="font-display mt-3 text-4xl font-bold sm:text-5xl">Live Logs</h1>
        <p className="mt-2 text-zinc-400">Brainrots found by our bots and the owner self bot, in real time. Join unlocks with an active slot.</p>
      </div>
      <div className="flex flex-wrap items-center gap-2" data-testid="tier-filter">
        {[["", "All"], ...Object.entries(TIER_META).map(([k, v]) => [k, v.label])].map(([k, l]) => (
          <button key={k} onClick={() => setTier(k)} data-testid={`tier-filter-${k || "all"}`}
            className={`rounded-full px-4 py-2 text-sm transition-colors ${tier === k ? "bg-[#FF2A85] text-white" : "btn-ghost text-zinc-300"}`}>{l}</button>
        ))}
        <label className="glass ml-auto flex items-center gap-3 rounded-full px-4 py-2 text-sm" data-testid="web-autojoin">
          <Zap className={`h-4 w-4 ${autoJoin ? "text-[#FF2A85]" : "text-zinc-500"}`} />Auto Join (browser)
          <Switch checked={autoJoin} onCheckedChange={toggleAuto} data-testid="web-autojoin-switch" />
        </label>
      </div>
      <div className="grid gap-6 lg:grid-cols-12">
        <div className="space-y-3 lg:col-span-8" data-testid="live-log-list">
          {logs.length === 0 && <div className="glass rounded-2xl p-10 text-center text-zinc-500" data-testid="no-logs">Waiting for the first logs from the bots…</div>}
          {logs.map((l) => <LogRow key={l.id} log={l} fresh={fresh.has(l.id)} />)}
        </div>
        <div className="lg:col-span-4"><div className="lg:sticky lg:top-32"><FiltersPanel /></div></div>
      </div>
    </div>
  );
}
