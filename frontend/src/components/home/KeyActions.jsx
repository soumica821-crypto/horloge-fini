import { useState } from "react";
import { CreditCard, RotateCcw, Upload, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { api, errMsg } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import DepositDialog from "@/components/DepositDialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

const Action = ({ icon: I, label, testid, ...p }) => (
  <button data-testid={testid} {...p} className="btn-ghost flex items-center justify-center gap-2 rounded-xl py-4 font-semibold text-zinc-300">
    <I className="h-4 w-4" />{label}
  </button>
);

const TransferDialog = ({ disabled }) => {
  const { user, refresh } = useAuth();
  const [open, setOpen] = useState(false);
  const [username, setUsername] = useState("");
  const owned = (user?.access || []).filter((a) => !a.rented && !a.infinite);
  const [division, setDivision] = useState("");
  const submit = async () => {
    try {
      await api.post("/key/transfer", { username, division: division || owned[0]?.division });
      toast.success("Slot transferred"); setOpen(false); refresh();
    } catch (e) { toast.error(errMsg(e)); }
  };
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Action icon={Upload} label="Transfer Key" testid="transfer-key-btn" disabled={disabled || !owned.length} /></DialogTrigger>
      <DialogContent className="glass border-white/10" data-testid="transfer-dialog">
        <DialogHeader><DialogTitle className="font-display">Transfer slot</DialogTitle></DialogHeader>
        <select value={division} onChange={(e) => setDivision(e.target.value)} data-testid="transfer-division-select"
          className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3">
          {owned.map((a) => <option key={a.division} value={a.division}>{a.division}</option>)}
        </select>
        <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Discord username" data-testid="transfer-username-input"
          className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 outline-none" />
        <button onClick={submit} data-testid="transfer-confirm-btn" className="btn-primary rounded-xl py-3 font-semibold">Transfer</button>
      </DialogContent>
    </Dialog>
  );
};

export default function KeyActions() {
  const { user, refresh } = useAuth();
  const hasKey = !!user?.key;
  const run = async (path, msg) => {
    try { await api.post(path); toast.success(msg); refresh(); } catch (e) { toast.error(errMsg(e)); }
  };
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <DepositDialog trigger={<Action icon={CreditCard} label="Deposit" testid="deposit-btn" />} />
      <Action icon={RotateCcw} label="Reset HWID" testid="reset-hwid-btn" disabled={!hasKey} onClick={() => run("/key/reset-hwid", "HWID reset")} />
      <TransferDialog disabled={!hasKey} />
      <Action icon={RefreshCw} label="Regen Key" testid="regen-key-btn" disabled={!hasKey} onClick={() => run("/key/regen", "New key generated")} />
    </div>
  );
}
