import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Copy, Trash2 } from "lucide-react";
import { api, errMsg } from "@/lib/api";
import { money, timeAgo } from "@/lib/format";
import { Card } from "@/components/admin/shared";

export default function GiftCardsPanel({ reload }) {
  const [cards, setCards] = useState([]);
  const [amount, setAmount] = useState(5);
  const [count, setCount] = useState(1);
  const load = () => api.get("/admin/giftcards").then((r) => setCards(r.data));
  useEffect(() => { load(); }, []);

  const gen = async () => {
    try {
      const r = await api.post("/admin/giftcards", { amount: Number(amount), count: Number(count) });
      navigator.clipboard?.writeText(r.data.map((c) => c.code).join("\n"));
      toast.success(`${r.data.length} gift card(s) generated & copied`);
      load(); reload();
    } catch (e) { toast.error(errMsg(e)); }
  };
  const del = async (id) => { await api.delete(`/admin/giftcards/${id}`); load(); reload(); };

  return (
    <div className="grid gap-6 lg:grid-cols-12">
      <Card title="Generate gift cards" className="lg:col-span-4" testid="giftcard-generator">
        <label className="label-xs">Amount ($)</label>
        <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} data-testid="giftcard-amount-input"
          className="mt-2 mb-4 w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 outline-none" />
        <label className="label-xs">Quantity</label>
        <input type="number" value={count} onChange={(e) => setCount(e.target.value)} data-testid="giftcard-count-input"
          className="mt-2 mb-6 w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 outline-none" />
        <button onClick={gen} data-testid="giftcard-generate-btn" className="btn-primary w-full rounded-xl py-3 font-semibold">Generate</button>
      </Card>
      <Card title="All gift cards" className="lg:col-span-8" testid="giftcard-list">
        <div className="max-h-[520px] space-y-2 overflow-y-auto pr-1">
          {cards.map((c) => (
            <div key={c.id} className="flex items-center gap-3 rounded-xl bg-black/30 px-4 py-3" data-testid="giftcard-row">
              <span className="font-mono text-sm flex-1">{c.code}</span>
              <span className="font-semibold text-emerald-400">{money(c.amount)}</span>
              <span className="w-40 text-right text-xs text-zinc-500">{c.redeemed_by ? `used by ${c.redeemed_by}` : timeAgo(c.created_at)}</span>
              <button onClick={() => { navigator.clipboard.writeText(c.code); toast.success("Copied"); }} className="text-zinc-400 hover:text-white"><Copy className="h-4 w-4" /></button>
              {!c.redeemed_by && <button onClick={() => del(c.id)} data-testid="giftcard-delete-btn" className="text-zinc-500 hover:text-red-400"><Trash2 className="h-4 w-4" /></button>}
            </div>
          ))}
          {cards.length === 0 && <div className="text-zinc-500">No gift cards yet</div>}
        </div>
      </Card>
    </div>
  );
}
