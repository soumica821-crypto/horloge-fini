import { useState } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { api, errMsg } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

const field = "w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 outline-none focus:border-[#FF2A85]/60";

export default function CreateListingDialog({ disabled, onCreated, defaultType }) {
  const { user } = useAuth();
  const owned = (user?.access || []).filter((a) => !a.rented && !a.infinite);
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ division: "", type: defaultType, price: 5, hours: 1 });
  const set = (k) => (e) => setF((p) => ({ ...p, [k]: e.target.value }));

  const submit = async () => {
    try {
      await api.post("/market/listings", { ...f, division: f.division || owned[0]?.division, price: Number(f.price), hours: Number(f.hours) });
      toast.success("Listing created"); setOpen(false); onCreated();
    } catch (e) { toast.error(errMsg(e)); }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (o) setF((p) => ({ ...p, type: defaultType })); }}>
      <DialogTrigger asChild>
        <button disabled={disabled} data-testid="create-listing-btn" className="btn-primary rounded-xl px-5 py-2.5 font-semibold">+ Create Listing</button>
      </DialogTrigger>
      <DialogContent className="glass border-white/10" data-testid="create-listing-dialog">
        <DialogHeader><DialogTitle className="font-display">New listing</DialogTitle></DialogHeader>
        <select value={f.division} onChange={set("division")} className={field} data-testid="listing-division-select">
          {owned.map((a) => <option key={a.division} value={a.division}>{a.division}</option>)}
        </select>
        <select value={f.type} onChange={set("type")} className={field} data-testid="listing-type-select">
          <option value="rent">Rent (price per hour, max $5.25)</option>
          <option value="sell">Sell whole remaining time (fixed price)</option>
        </select>
        <label className="label-xs">{f.type === "rent" ? "Price per hour ($)" : "Total price ($)"}</label>
        <input type="number" step="0.01" value={f.price} onChange={set("price")} className={field} data-testid="listing-price-input" />
        {f.type === "rent" && (<>
          <label className="label-xs">Hours offered</label>
          <input type="number" min={1} max={24} value={f.hours} onChange={set("hours")} className={field} data-testid="listing-hours-input" />
        </>)}
        <button onClick={submit} data-testid="listing-submit-btn" className="btn-primary rounded-xl py-3 font-semibold">Publish</button>
      </DialogContent>
    </Dialog>
  );
}
