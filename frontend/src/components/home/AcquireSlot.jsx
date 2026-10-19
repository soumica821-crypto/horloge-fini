import { useEffect, useState } from "react";
import { Snowflake } from "lucide-react";
import { toast } from "sonner";
import { api, errMsg } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { money } from "@/lib/format";
import KeyActions from "@/components/home/KeyActions";

export default function AcquireSlot() {
  const { refresh, settings } = useAuth();
  const [divs, setDivs] = useState([]);
  const [sel, setSel] = useState("king");
  const [hours, setHours] = useState(1);
  const [busy, setBusy] = useState(false);

  const load = () => api.get("/divisions").then((r) => setDivs(r.data));
  useEffect(() => { load(); }, [settings.system_frozen]);

  const d = divs.find((x) => x.id === sel);
  const h = Math.min(24, Math.max(1, Number(hours) || 1));

  const buy = async () => {
    setBusy(true);
    try {
      const r = await api.post("/slots/purchase", { division: sel, hours: h });
      toast.success(`Slot acquired for ${money(r.data.cost)}`);
      refresh(); load();
    } catch (e) { toast.error(errMsg(e)); } finally { setBusy(false); }
  };

  return (
    <section className="glass rounded-3xl p-6 sm:p-8" data-testid="acquire-slot-card">
      <h2 className="font-display text-2xl font-bold">Acquire Slot</h2>
      <p className="mt-2 text-zinc-400">Lock in your joiner slot instantly. Max 24h per slot.</p>
      <div className="label-xs mt-8">Division</div>
      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        {divs.map((x) => (
          <button key={x.id} onClick={() => setSel(x.id)} data-testid={`division-select-${x.id}`}
            className={`rounded-xl border px-4 py-3 font-semibold transition-colors duration-200 ${sel === x.id
              ? "border-[#FF2A85]/60 bg-[#FF2A85]/10 text-[#FF75A8]" : "border-white/5 bg-black/30 text-zinc-300 hover:border-white/20"}`}>
            {x.name} · ${x.price.toFixed(2)}/hr
          </button>
        ))}
      </div>
      <div className="label-xs mt-8">Duration (hours)</div>
      <input type="number" min={1} max={24} value={hours} onChange={(e) => setHours(e.target.value)} data-testid="duration-input"
        className="mt-3 w-full rounded-xl border border-white/5 bg-black/40 px-4 py-3 outline-none focus:border-[#FF2A85]/60" />
      {d && (
        <div className={`mt-6 border-y border-white/5 py-4 ${d.available ? "text-emerald-400" : "text-red-400"}`} data-testid="slots-available-text">
          {d.available} / {d.capacity} {d.name} Slots Available
        </div>
      )}
      <div className="mt-6 flex items-center justify-between rounded-xl bg-black/30 px-6 py-5">
        <span className="text-zinc-400">Total</span>
        <span className="font-display text-2xl font-bold" data-testid="purchase-total">{money((d?.price || 0) * h)}</span>
      </div>
      <button onClick={buy} disabled={busy || !d || d.frozen} data-testid="purchase-slot-btn"
        className="btn-primary mt-6 flex w-full items-center justify-center gap-2 rounded-xl py-4 font-semibold">
        {d?.frozen ? (<><Snowflake className="h-4 w-4" />Division Frozen</>) : busy ? "Processing…" : "Purchase Slot"}
      </button>
      <div className="my-8 border-t border-white/5" />
      <KeyActions divisions={divs} />
    </section>
  );
}
