import { useEffect, useState } from "react";
import { toast } from "sonner";
import { X } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { api, errMsg } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

const ChipPicker = ({ label, values, onChange, options, testid }) => {
  const [q, setQ] = useState("");
  const add = (n) => { if (n && !values.includes(n)) onChange([...values, n]); setQ(""); };
  return (
    <div>
      <div className="label-xs">{label}</div>
      <div className="mt-2 flex flex-wrap gap-2">
        {values.map((v) => (
          <span key={v} className="flex items-center gap-1 rounded-full bg-[#FF2A85]/10 px-3 py-1 text-xs text-[#FF75A8]">
            {v}<button onClick={() => onChange(values.filter((x) => x !== v))} data-testid={`${testid}-remove-${v}`}><X className="h-3 w-3" /></button>
          </span>
        ))}
      </div>
      <input list={`${testid}-list`} value={q} onChange={(e) => setQ(e.target.value)} data-testid={`${testid}-input`}
        onKeyDown={(e) => e.key === "Enter" && add(q)} placeholder="Type a brainrot + Enter"
        className="mt-2 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm outline-none focus:border-[#FF2A85]/60" />
      <datalist id={`${testid}-list`}>{options.map((o) => <option key={o} value={o} />)}</datalist>
    </div>
  );
};

export default function FiltersPanel() {
  const { user, refresh } = useAuth();
  const [f, setF] = useState(user.filters);
  const [names, setNames] = useState([]);
  useEffect(() => { api.get("/brainrots").then((r) => setNames(r.data.brainrots.map((b) => b.name))); }, []);
  const set = (k) => (v) => setF((p) => ({ ...p, [k]: v }));
  const save = async () => {
    try { await api.put("/me/filters", { ...f, min_value: Number(f.min_value) || 0 }); toast.success("Filters saved"); refresh(); }
    catch (e) { toast.error(errMsg(e)); }
  };
  return (
    <aside className="glass space-y-6 rounded-3xl p-6" data-testid="filters-panel">
      <h3 className="font-display text-lg font-bold">Joiner filters</h3>
      <label className="flex items-center justify-between"><span>Auto join</span>
        <Switch checked={f.auto_join} onCheckedChange={set("auto_join")} data-testid="auto-join-switch" /></label>
      <label className="flex items-center justify-between"><span>Self bot (report my server)</span>
        <Switch checked={f.self_bot} onCheckedChange={set("self_bot")} data-testid="self-bot-switch" /></label>
      <div>
        <div className="label-xs">Min value ($/s)</div>
        <input type="number" value={f.min_value} onChange={(e) => set("min_value")(e.target.value)} data-testid="min-value-input"
          className="mt-2 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm outline-none" />
      </div>
      <ChipPicker label="Whitelist (only join these)" values={f.whitelist} onChange={set("whitelist")} options={names} testid="whitelist" />
      <ChipPicker label="Blacklist (never join)" values={f.blacklist} onChange={set("blacklist")} options={names} testid="blacklist" />
      <button onClick={save} data-testid="save-filters-btn" className="btn-primary w-full rounded-xl py-3 font-semibold">Save filters</button>
    </aside>
  );
}
