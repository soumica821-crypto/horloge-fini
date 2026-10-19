import { useEffect, useState } from "react";
import { Crown } from "lucide-react";
import { api } from "@/lib/api";
import { money } from "@/lib/format";
import Avatar from "@/components/Avatar";
import BrainrotImg from "@/components/BrainrotImg";

const RANK = ["#FFD700", "#C0C0C0", "#CD7F32"];

export default function Leaderboard() {
  const [d, setD] = useState({ spenders: [], brainrots: [] });
  useEffect(() => { api.get("/leaderboard").then((r) => setD(r.data)); }, []);
  return (
    <div className="space-y-8">
      <h1 className="font-display text-4xl font-bold sm:text-5xl fade-up">Leaderboard</h1>
      <div className="grid gap-6 lg:grid-cols-12">
        <div className="glass rounded-3xl p-6 lg:col-span-7" data-testid="leaderboard-spenders">
          <h2 className="font-display text-lg font-bold">Top spenders</h2>
          <div className="mt-4 space-y-2">
            {d.spenders.length === 0 && <div className="py-10 text-center text-zinc-500">No one yet. Be the first.</div>}
            {d.spenders.map((u, i) => (
              <div key={u.username} className="flex items-center gap-4 rounded-2xl px-3 py-3 hover:bg-white/5 transition-colors">
                <span className="w-8 font-display text-lg font-bold" style={{ color: RANK[i] || "#52525b" }}>#{i + 1}</span>
                <Avatar src={u.avatar} name={u.display_name || u.username} size={36} />
                <span className="flex-1 font-semibold">{u.display_name || u.username}{i === 0 && <Crown className="ml-2 inline h-4 w-4 text-amber-300" />}</span>
                <span className="font-semibold text-emerald-400">{money(u.total_spent)}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="glass rounded-3xl p-6 lg:col-span-5" data-testid="leaderboard-brainrots">
          <h2 className="font-display text-lg font-bold">Most found · 24h</h2>
          <div className="mt-4 space-y-2">
            {d.brainrots.map((b) => (
              <div key={b.name} className="flex items-center gap-3 rounded-2xl px-2 py-2 hover:bg-white/5 transition-colors">
                <BrainrotImg src={b.image} name={b.name} size={40} />
                <div className="flex-1"><div className="text-sm font-semibold">{b.name}</div><div className="text-xs text-zinc-500">best {b.best}</div></div>
                <span className="font-display font-bold text-[#FF2A85]">{b.count}×</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
