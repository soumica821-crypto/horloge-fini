import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { api, errMsg } from "@/lib/api";
import { money } from "@/lib/format";
import Avatar from "@/components/Avatar";
import { Card } from "@/components/admin/shared";

const UserRow = ({ u, onPatch }) => {
  const [add, setAdd] = useState("");
  return (
    <div className="flex flex-wrap items-center gap-4 rounded-2xl bg-black/30 px-4 py-3" data-testid="admin-user-row">
      <Avatar src={u.avatar} name={u.username} size={36} />
      <div className="min-w-[140px] flex-1">
        <div className="font-semibold">{u.username}{u.is_admin && <span className="ml-2 text-xs text-[#FF2A85]">OWNER</span>}</div>
        <div className="font-mono text-[11px] text-zinc-500">{u.key || "no key"} · HWID {u.hwid ? "bound" : "free"}</div>
      </div>
      <span className="font-semibold text-emerald-400 w-20">{money(u.balance)}</span>
      <input value={add} onChange={(e) => setAdd(e.target.value)} placeholder="+/- $" data-testid="admin-add-balance-input"
        className="w-20 rounded-lg border border-white/10 bg-black/40 px-2 py-1.5 text-sm" />
      <button onClick={() => { onPatch(u.id, { add_balance: Number(add) }); setAdd(""); }} disabled={!Number(add)}
        data-testid="admin-add-balance-btn" className="btn-ghost rounded-lg px-3 py-1.5 text-sm">Apply</button>
      <label className="flex items-center gap-2 text-xs">WL<Switch checked={u.whitelisted} onCheckedChange={(v) => onPatch(u.id, { whitelisted: v })} data-testid="admin-whitelist-switch" /></label>
      <label className="flex items-center gap-2 text-xs">Ban<Switch checked={u.banned} disabled={u.is_admin} onCheckedChange={(v) => onPatch(u.id, { banned: v })} data-testid="admin-ban-switch" /></label>
      <button onClick={() => onPatch(u.id, { reset_hwid: true })} data-testid="admin-reset-hwid-btn" className="btn-ghost rounded-lg px-3 py-1.5 text-xs">Reset HWID</button>
    </div>
  );
};

export default function UsersPanel() {
  const [users, setUsers] = useState([]);
  const [q, setQ] = useState("");
  const load = () => api.get("/admin/users").then((r) => setUsers(r.data));
  useEffect(() => { load(); }, []);
  const patch = async (id, body) => {
    try { await api.patch(`/admin/users/${id}`, body); toast.success("Updated"); load(); } catch (e) { toast.error(errMsg(e)); }
  };
  const shown = users.filter((u) => u.username.toLowerCase().includes(q.toLowerCase()));
  return (
    <Card title="Users & whitelist" testid="admin-users">
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search username" data-testid="admin-user-search"
        className="mb-4 w-full rounded-xl border border-white/10 bg-black/40 px-4 py-2.5 outline-none" />
      <div className="space-y-2">{shown.map((u) => <UserRow key={u.id} u={u} onPatch={patch} />)}</div>
    </Card>
  );
}
