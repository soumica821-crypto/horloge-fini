import { Lock, ExternalLink, Copy } from "lucide-react";
import { toast } from "sonner";
import BrainrotImg from "@/components/BrainrotImg";
import { TIER_META, timeAgo, robloxJoinUrl } from "@/lib/format";

const MUT_COLORS = { Gold: "#FFD54A", Diamond: "#7FE3FF", Rainbow: "#ff7ad9", Lava: "#FF7A2A", Galaxy: "#9b7bff",
  Divine: "#fff3a6", Cursed: "#ff4b4b", Radioactive: "#7dff6a", Candy: "#ff8fd1", Bloodrot: "#d81b3c", "Yin-Yang": "#e5e5e5" };

export const MutationBadge = ({ m }) => (
  <span className="rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider"
    style={{ color: MUT_COLORS[m] || "#a0a0ab", background: `${MUT_COLORS[m] || "#a0a0ab"}1f` }}>{m}</span>
);

export const CompactLog = ({ log }) => (
  <div className="glass flex items-center gap-4 rounded-2xl p-4 fade-up" data-testid="history-log-card">
    <BrainrotImg src={log.image} name={log.name} size={60} />
    <div className="min-w-0">
      <div className="truncate font-semibold">{log.name}</div>
      <div className="mt-1 flex items-center gap-2">
        <span className="font-semibold text-emerald-400">{log.value_text.replace("/s", "")}</span>
        <MutationBadge m={log.mutation} />
      </div>
      <div className="mt-1 text-xs text-zinc-500">{timeAgo(log.created_at)}</div>
    </div>
  </div>
);

export default function LogRow({ log, fresh }) {
  const tier = TIER_META[log.tier];
  const copy = () => { navigator.clipboard.writeText(log.job_id); toast.success("Job ID copied"); };
  return (
    <div data-testid="live-log-item" className={`glass relative flex flex-wrap items-center gap-4 overflow-hidden rounded-2xl p-4 sm:flex-nowrap ${fresh ? "flash-new" : ""}`}>
      <span className="absolute left-0 top-0 h-full w-1" style={{ background: tier.color, boxShadow: `0 0 18px ${tier.color}` }} />
      <BrainrotImg src={log.image} name={log.name} size={56} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="truncate font-semibold">{log.name}</span>
          <MutationBadge m={log.mutation} />
          {log.is_demo && <span className="rounded bg-white/10 px-1.5 text-[10px] text-zinc-400">DEMO</span>}
        </div>
        <div className="mt-1 text-xs text-zinc-500">{log.rarity} · {log.players ?? "?"}/8 players · {timeAgo(log.created_at)}</div>
      </div>
      <div className="text-right">
        <div className="font-display text-lg font-bold text-emerald-400">{log.value_text}</div>
        <div className="text-[11px] font-bold uppercase tracking-widest" style={{ color: tier.color }}>{tier.label}</div>
      </div>
      {log.locked ? (
        <div className="flex items-center gap-1.5 rounded-xl border border-white/10 px-3 py-2 text-xs text-zinc-500" data-testid="log-locked">
          <Lock className="h-3.5 w-3.5" />Locked
        </div>
      ) : (
        <div className="flex gap-2">
          <button onClick={copy} data-testid="log-copy-jobid-btn" className="btn-ghost rounded-xl p-2.5" title="Copy job id"><Copy className="h-4 w-4" /></button>
          <a href={robloxJoinUrl(log.place_id, log.job_id)} data-testid="log-join-btn"
            className="btn-primary flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold">
            <ExternalLink className="h-4 w-4" />Join
          </a>
        </div>
      )}
    </div>
  );
}
