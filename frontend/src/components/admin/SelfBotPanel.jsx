import { useEffect, useState } from "react";
import { Power, Radar } from "lucide-react";
import { api } from "@/lib/api";
import { timeAgo } from "@/lib/format";
import { CodeBlock } from "@/components/home/ScriptCard";
import { Card, saveSettings } from "@/components/admin/shared";

export default function SelfBotPanel({ o, reload }) {
  const on = o.settings.owner_selfbot;
  const [script, setScript] = useState(null);
  useEffect(() => { api.get("/script").then((r) => setScript(r.data)); }, []);

  return (
    <div className="grid gap-6 lg:grid-cols-12">
      <Card className="lg:col-span-5" testid="selfbot-control">
        <div className="flex items-center gap-3">
          <Radar className={`h-7 w-7 ${on ? "text-[#FF2A85] animate-pulse" : "text-zinc-500"}`} />
          <div>
            <div className="font-display text-xl font-bold">Owner Self Bot</div>
            <div className="text-sm text-zinc-400">Scans every brainrot of the server in 1s, logs it, then hops to the next server. Loops until you stop it.</div>
          </div>
        </div>
        <div className="mt-6 flex items-center justify-between rounded-2xl bg-black/30 p-4">
          <span data-testid="selfbot-status" className={`font-display font-bold tracking-widest ${on ? "text-emerald-400" : "text-zinc-500"}`}>{on ? "RUNNING" : "STOPPED"}</span>
          <button data-testid="selfbot-toggle-btn" onClick={() => saveSettings({ owner_selfbot: !on }, reload)}
            className={`flex items-center gap-2 rounded-xl px-5 py-3 font-semibold ${on ? "btn-ghost text-red-300" : "btn-primary"}`}>
            <Power className="h-4 w-4" />{on ? "Disable" : "Enable"}
          </button>
        </div>
        <p className="mt-4 text-xs text-zinc-500">Your owner key is infinite and unlocks every division. Enable here, then execute the loader below in Roblox.</p>
      </Card>
      <Card title="Self Bot loader" className="lg:col-span-7" testid="selfbot-loader-card">
        {script?.selfbot_loader ? <CodeBlock code={script.selfbot_loader} testid="selfbot-loader" /> : <div className="text-zinc-500">Loading…</div>}
        <div className="label-xs mt-6">Recent scans</div>
        <div className="mt-3 space-y-2" data-testid="selfbot-runs">
          {o.selfbot_runs.length === 0 && <div className="text-sm text-zinc-500">No scans yet</div>}
          {o.selfbot_runs.map((r) => (
            <div key={r.id} className="flex justify-between rounded-xl bg-black/30 px-4 py-2 text-sm">
              <span className="font-mono text-zinc-400">{r.job_id.slice(0, 18)}…</span>
              <span>{r.scanned} scanned · <span className="text-emerald-400">{r.logged} logged</span> · {timeAgo(r.created_at)}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
