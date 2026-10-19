import { useEffect, useState } from "react";
import { Lock } from "lucide-react";
import { api } from "@/lib/api";
import { DIVISION_META, TIER_META, remaining } from "@/lib/format";
import Avatar from "@/components/Avatar";

const SlotCard = ({ occ, color }) => (
  <div data-testid={occ ? "slot-occupied" : "slot-available"}
    className="glass grid h-44 place-items-center rounded-3xl transition-colors duration-200 hover:border-white/20"
    style={occ ? { borderColor: `${color}55`, boxShadow: `inset 0 0 40px ${color}10` } : {}}>
    {occ ? (
      <div className="flex flex-col items-center gap-2">
        <Avatar src={occ.avatar} name={occ.username} size={48} />
        <div className="font-semibold">{occ.username}</div>
        <div className="font-mono text-xs text-zinc-400">{remaining(occ.expires_at)}{occ.rented ? " · rented" : ""}</div>
      </div>
    ) : (
      <div className="flex flex-col items-center gap-2 text-zinc-500"><Lock className="h-7 w-7 text-amber-200/60" />Available</div>
    )}
  </div>
);

export default function Slots() {
  const [divs, setDivs] = useState([]);
  const [sel, setSel] = useState("king");
  const [counts, setCounts] = useState({});
  useEffect(() => {
    const load = () => { api.get("/divisions").then((r) => setDivs(r.data)); api.get("/stats").then((r) => setCounts(r.data.counts)); };
    load();
    const t = setInterval(load, 15000);
    return () => clearInterval(t);
  }, []);
  const d = divs.find((x) => x.id === sel);
  if (!d) return <div className="text-zinc-500">Loading…</div>;
  const color = DIVISION_META[d.id].color;

  return (
    <div className="space-y-8">
      <div className="glass flex flex-wrap items-center gap-6 rounded-3xl p-6 sm:p-8" data-testid="division-header">
        <span data-testid="division-status" className={`rounded-lg border px-4 py-1.5 font-display text-sm font-bold tracking-[0.2em] ${d.frozen
          ? "border-cyan-400/40 bg-cyan-400/10 text-cyan-300" : "border-emerald-400/40 bg-emerald-400/10 text-emerald-300"}`}>
          {d.frozen ? "FROZEN" : "ACTIVE"}
        </span>
        <div>
          <div className="font-display text-3xl font-bold" style={{ color }}>{d.name}</div>
          <div className="mt-1 text-sm" style={{ color: `${color}cc` }}>{d.desc}</div>
        </div>
        <div className="ml-auto text-lg">${d.price}/hour per slot</div>
      </div>
      <div className="inline-flex flex-wrap gap-1 rounded-2xl border border-white/5 bg-white/[0.03] p-1.5">
        {divs.map((x) => (
          <button key={x.id} onClick={() => setSel(x.id)} data-testid={`slots-tab-${x.id}`}
            className={`rounded-xl px-5 py-2.5 text-sm font-semibold transition-colors ${sel === x.id ? "bg-white/10 text-white" : "text-zinc-400 hover:text-white"}`}>
            {x.name} <span className="ml-1 text-xs text-zinc-500">{x.used}/{x.capacity}</span>
          </button>
        ))}
      </div>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3" data-testid="slots-grid">
        {Array.from({ length: d.capacity }).map((_, i) => <SlotCard key={i} occ={d.occupants[i]} color={color} />)}
      </div>
      <div className="glass grid grid-cols-2 gap-6 rounded-3xl p-6 sm:grid-cols-4">
        {Object.entries(TIER_META).map(([k, v]) => (
          <div key={k} className="text-center" data-testid={`slots-tier-count-${k}`}>
            <div className="font-display text-3xl font-bold" style={{ color: v.color }}>{counts[k] || 0}</div>
            <div className="label-xs mt-1">{v.label} logs</div>
          </div>
        ))}
      </div>
    </div>
  );
}
