import { useEffect, useState } from "react";
import { Ban } from "lucide-react";
import { api } from "@/lib/api";
import BrainrotImg from "@/components/BrainrotImg";
import { Card, saveSettings } from "@/components/admin/shared";

export default function BlacklistPanel({ o, reload }) {
  const [all, setAll] = useState([]);
  const [q, setQ] = useState("");
  useEffect(() => { api.get("/brainrots").then((r) => setAll(r.data.brainrots)); }, []);
  const bl = o.settings.global_blacklist;
  const toggle = (n) => saveSettings({ global_blacklist: bl.includes(n) ? bl.filter((x) => x !== n) : [...bl, n] }, reload);
  const shown = all.filter((b) => b.name.toLowerCase().includes(q.toLowerCase()));

  return (
    <Card title={`Global brainrot blacklist (${bl.length})`} testid="admin-blacklist">
      <p className="mb-4 text-sm text-zinc-400">Blacklisted brainrots are never logged nor sent to joiners. Only Secret / OG / high value ones become logs.</p>
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search brainrot" data-testid="blacklist-search"
        className="mb-5 w-full rounded-xl border border-white/10 bg-black/40 px-4 py-2.5 outline-none" />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {shown.map((b) => {
          const on = bl.includes(b.name);
          return (
            <button key={b.name} onClick={() => toggle(b.name)} data-testid={`blacklist-toggle-${b.name.replace(/\s+/g, "-").toLowerCase()}`}
              className={`flex items-center gap-3 rounded-2xl border p-3 text-left transition-colors ${on ? "border-red-500/50 bg-red-500/10" : "border-white/5 bg-black/30 hover:border-white/20"}`}>
              <BrainrotImg src={b.image} name={b.name} size={40} />
              <div className="min-w-0 flex-1"><div className="truncate text-sm font-semibold">{b.name}</div><div className="text-xs text-zinc-500">{b.rarity}</div></div>
              {on && <Ban className="h-4 w-4 text-red-400" />}
            </button>
          );
        })}
      </div>
    </Card>
  );
}
