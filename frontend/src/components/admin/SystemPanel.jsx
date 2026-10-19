import { useState } from "react";
import { Switch } from "@/components/ui/switch";
import { CodeBlock } from "@/components/home/ScriptCard";
import { Card, saveSettings } from "@/components/admin/shared";

const Row = ({ label, hint, checked, onChange, testid }) => (
  <label className="flex items-center justify-between gap-4 border-b border-white/5 py-4 last:border-0">
    <div><div className="font-semibold">{label}</div>{hint && <div className="text-xs text-zinc-500">{hint}</div>}</div>
    <Switch checked={checked} onCheckedChange={onChange} data-testid={testid} />
  </label>
);

export default function SystemPanel({ o, reload }) {
  const s = o.settings;
  const [invite, setInvite] = useState(s.discord_invite);
  const toggleDiv = (d) => saveSettings({ frozen_divisions: s.frozen_divisions.includes(d) ? s.frozen_divisions.filter((x) => x !== d) : [...s.frozen_divisions, d] }, reload);

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card title="System" testid="system-settings">
        <Row label="Freeze whole system" hint="Pauses every division and locks purchases" checked={s.system_frozen} onChange={(v) => saveSettings({ system_frozen: v }, reload)} testid="freeze-system-switch" />
        {["king", "slave", "russian"].map((d) => (
          <Row key={d} label={`Freeze ${d}`} checked={s.frozen_divisions.includes(d)} onChange={() => toggleDiv(d)} testid={`freeze-${d}-switch`} />
        ))}
        <Row label="Whitelist only" hint="Only whitelisted users can buy slots" checked={s.whitelist_only} onChange={(v) => saveSettings({ whitelist_only: v }, reload)} testid="whitelist-only-switch" />
        <div className="mt-4 flex gap-2">
          <input value={invite} onChange={(e) => setInvite(e.target.value)} placeholder="Discord invite URL" data-testid="discord-invite-input"
            className="flex-1 rounded-xl border border-white/10 bg-black/40 px-4 py-2.5 outline-none" />
          <button onClick={() => saveSettings({ discord_invite: invite }, reload)} data-testid="save-invite-btn" className="btn-primary rounded-xl px-4 font-semibold">Save</button>
        </div>
      </Card>
      <Card title="In-game server bots" testid="bot-settings">
        <p className="text-sm text-zinc-400">Run this on your bot accounts. Each bot scans its server (1s), pushes every brainrot to the logs, then hops to the next server automatically.</p>
        <div className="mt-4"><CodeBlock code={o.bot_loader} testid="bot-loader" /></div>
        <div className="label-xs mt-6">Ingest endpoint (header X-Bot-Token)</div>
        <div className="mt-2 font-mono text-xs text-zinc-400 break-all" data-testid="ingest-url">{o.ingest_url}</div>
      </Card>
    </div>
  );
}
