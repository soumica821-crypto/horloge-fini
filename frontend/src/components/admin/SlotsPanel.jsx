import { useEffect, useState } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { DIVISION_META, remaining } from "@/lib/format";
import { Card } from "@/components/admin/shared";

export default function SlotsPanel() {
  const [slots, setSlots] = useState([]);
  const load = () => api.get("/admin/slots").then((r) => setSlots(r.data));
  useEffect(() => { load(); }, []);
  const revoke = async (id) => { await api.delete(`/admin/slots/${id}`); toast.success("Slot revoked"); load(); };
  return (
    <Card title="Active slots" testid="admin-slots">
      {slots.length === 0 && <div className="text-zinc-500">No active slots</div>}
      <div className="space-y-2">
        {slots.map((s) => (
          <div key={s.id} className="flex flex-wrap items-center gap-4 rounded-2xl bg-black/30 px-4 py-3" data-testid="admin-slot-row">
            <span className="w-20 font-display font-bold" style={{ color: DIVISION_META[s.division].color }}>{DIVISION_META[s.division].label}</span>
            <span className="flex-1">{s.owner}{s.holder !== s.owner && <span className="text-zinc-500"> → rented by {s.holder}</span>}</span>
            <span className="font-mono text-sm text-zinc-400">{remaining(s.expires_at)}</span>
            <button onClick={() => revoke(s.id)} data-testid="admin-revoke-slot-btn" className="btn-ghost rounded-lg px-3 py-1.5 text-sm text-red-300">Revoke</button>
          </div>
        ))}
      </div>
    </Card>
  );
}
