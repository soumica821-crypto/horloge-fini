import { useState } from "react";
import Avatar from "@/components/Avatar";
import { DIVISION_META, money } from "@/lib/format";

export default function ListingCard({ l, onBuy, onCancel }) {
  const [hours, setHours] = useState(1);
  const meta = DIVISION_META[l.division];
  const total = l.type === "rent" ? l.price * hours : l.price;
  return (
    <div className="glass rounded-3xl p-6 fade-up" data-testid="listing-card">
      <div className="flex items-center gap-3">
        <Avatar src={l.seller_avatar} name={l.seller} size={40} />
        <div className="flex-1"><div className="font-semibold">{l.seller}</div>
          <div className="text-xs font-bold uppercase tracking-widest" style={{ color: meta.color }}>{meta.label}</div></div>
        <div className="text-right">
          <div className="font-display text-xl font-bold text-emerald-400">{money(l.price)}{l.type === "rent" && <span className="text-sm text-zinc-500">/h</span>}</div>
          <div className="text-xs text-zinc-500">{l.type === "rent" ? `${l.hours}h offered` : `${l.remaining_hours}h remaining`}</div>
        </div>
      </div>
      {l.mine ? (
        <button onClick={() => onCancel(l)} data-testid="listing-cancel-btn" className="btn-ghost mt-5 w-full rounded-xl py-3 text-red-300">Cancel listing</button>
      ) : (
        <div className="mt-5 flex gap-2">
          {l.type === "rent" && (
            <input type="number" min={1} max={l.hours} value={hours} onChange={(e) => setHours(Math.min(l.hours, Math.max(1, Number(e.target.value) || 1)))}
              data-testid="listing-buy-hours-input" className="w-20 rounded-xl border border-white/10 bg-black/40 px-3 text-center" />
          )}
          <button onClick={() => onBuy(l, hours)} data-testid="listing-buy-btn" className="btn-primary flex-1 rounded-xl py-3 font-semibold">
            {l.type === "rent" ? "Rent" : "Buy"} · {money(total)}
          </button>
        </div>
      )}
    </div>
  );
}
