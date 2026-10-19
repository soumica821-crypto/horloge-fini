import { useEffect, useState } from "react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts";
import { api } from "@/lib/api";
import { TIER_META } from "@/lib/format";
import BrainrotImg from "@/components/BrainrotImg";
import { MutationBadge } from "@/components/LogCard";

const Counter = ({ tier, value, label }) => (
  <div className="glass flex items-center gap-4 rounded-3xl p-6" data-testid={`stat-counter-${tier}`}>
    <div className="grid h-14 w-14 place-items-center rounded-2xl" style={{ background: `${TIER_META[tier].color}18` }}>
      <span className="h-6 w-6 rounded-full" style={{ background: TIER_META[tier].color, boxShadow: `0 0 18px ${TIER_META[tier].color}` }} />
    </div>
    <div>
      <div className="font-display text-3xl font-bold text-[#FF2A85]">{value}</div>
      <div className="label-xs">{label}</div>
    </div>
  </div>
);

const RecentList = ({ title, items, testid }) => (
  <div className="glass rounded-3xl p-6" data-testid={testid}>
    <div className="flex items-center justify-between">
      <h3 className="font-display text-lg font-bold">{title}</h3>
      <span className="grid h-8 min-w-8 place-items-center rounded-full bg-white/5 px-2 text-sm text-zinc-400">{items.length}</span>
    </div>
    <div className="mt-4 space-y-2">
      {items.length === 0 && <div className="py-8 text-center text-zinc-500">Nothing recorded yet</div>}
      {items.map((l) => (
        <div key={l.id} className="flex items-center gap-3 rounded-xl p-2 hover:bg-white/5 transition-colors">
          <BrainrotImg src={l.image} name={l.name} size={40} />
          <div className="min-w-0 flex-1"><div className="truncate text-sm font-semibold">{l.name}</div><MutationBadge m={l.mutation} /></div>
          <div className="text-sm font-semibold text-emerald-400">{l.value_text}</div>
        </div>
      ))}
    </div>
  </div>
);

export default function Statistics() {
  const [s, setS] = useState(null);
  useEffect(() => {
    const load = () => api.get("/stats").then((r) => setS(r.data));
    load();
    const t = setInterval(load, 60000);
    return () => clearInterval(t);
  }, []);
  if (!s) return <div className="text-zinc-500">Loading…</div>;

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-12">
        <div className="glass rounded-3xl p-6 lg:col-span-7" data-testid="stats-chart">
          <h2 className="font-display text-xl font-bold">Logs — Last 24 Hours</h2>
          <div className="mt-6 h-72">
            <ResponsiveContainer>
              <AreaChart data={s.chart}>
                <defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#FF2A85" stopOpacity={0.5} /><stop offset="100%" stopColor="#FF2A85" stopOpacity={0} /></linearGradient></defs>
                <CartesianGrid stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis dataKey="label" stroke="#52525b" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#52525b" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{ background: "#0c0c11", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12 }} />
                <Area type="monotone" dataKey="count" stroke="#FF2A85" strokeWidth={2.5} fill="url(#g)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:col-span-5">
          <Counter tier="og" value={s.counts.og || 0} label="OG / 24 hours" />
          <Counter tier="peak" value={s.counts.peak || 0} label="Peaklight / 24h" />
          <Counter tier="high" value={s.counts.high || 0} label="Highlight / 24h" />
          <Counter tier="mid" value={s.counts.mid || 0} label="Midlight / 24h" />
        </div>
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <RecentList title="Recent OGs" items={s.recent.og} testid="recent-og" />
        <RecentList title="Recent Peaklights" items={s.recent.peak} testid="recent-peak" />
        <RecentList title="Recent Highlights" items={s.recent.high} testid="recent-high" />
      </div>
    </div>
  );
}
