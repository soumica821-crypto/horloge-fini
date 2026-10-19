import { useState } from "react";
import { toast } from "sonner";
import { Gift } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { api, errMsg } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

export default function DepositDialog({ trigger }) {
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const { refresh } = useAuth();

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const r = await api.post("/giftcards/redeem", { code });
      toast.success(`+$${r.data.amount.toFixed(2)} added to your balance`);
      setCode("");
      setOpen(false);
      refresh();
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="glass border-white/10 sm:max-w-md" data-testid="deposit-dialog">
        <DialogHeader>
          <DialogTitle className="font-display flex items-center gap-2"><Gift className="h-5 w-5 text-[#FF2A85]" />Deposit</DialogTitle>
          <DialogDescription>Redeem a gift card code from the owner to top up your balance.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <input data-testid="giftcard-code-input" value={code} onChange={(e) => setCode(e.target.value)}
            placeholder="HJGIFT-XXXX-XXXX-XXXX"
            className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 font-mono uppercase outline-none focus:border-[#FF2A85]/60" />
          <button data-testid="giftcard-redeem-btn" disabled={busy || !code} className="btn-primary w-full rounded-xl py-3 font-semibold">
            {busy ? "Redeeming…" : "Redeem gift card"}
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
