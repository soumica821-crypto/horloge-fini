import { useEffect, useState } from "react";
import { toast } from "sonner";
import { RefreshCw, Timer, Coins, ScrollText, KeyRound } from "lucide-react";
import { api, errMsg } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { DIVISION_META, money, timeAgo } from "@/lib/format";
import CreateListingDialog from "@/components/market/CreateListingDialog";
import ListingCard from "@/components/market/ListingCard";

const TABS = [["rent", "Renting", Timer], ["sell", "Sell / Buy", Coins], ["history", "History", ScrollText]];

const History = () => {
  const [tx, setTx] = useState([]);
  useEffect(() => { api.get("/me/transactions").then((r) => setTx(r.data)); }, []);
  if (!tx.length) return <div className="py-20 text-center text-zinc-500" data-testid="history-empty">No transactions yet</div>;
  return (
    <div className="space-y-2" data-testid="history-list">
      {tx.map((t) => (
        <div key={t.id} className="glass flex items-center justify-between rounded-2xl px-5 py-4">
          <div><div className="font-semibold">{t.note}</div><div className="text-xs text-zinc-500">{t.type} · {timeAgo(t.created_at)}</div></div>
          <div className={`font-semibold ${t.amount >= 0 ? "text-emerald-400" : "text-red-400"}`}>{t.amount >= 0 ? "+" : ""}{money(t.amount)}</div>
        </div>
      ))}
    </div>
  );
};

export default function Marketplace() {
  const { user, refresh } = useAuth();
  const [tab, setTab] = useState("rent");
  const [division, setDivision] = useState("");
  const [list, setList] = useState([]);
  const hasKey = (user?.access || []).some((a) => !a.rented && !a.infinite);

  const load = () => {
    if (tab === "history") return;
    api.get("/market/listings", { params: { type: tab, division: division || undefined } }).then((r) => setList(r.data));
  };
  useEffect(load, [tab, division]);

  const buy = async (l, hours) => {
    try { const r = await api.post(`/market/listings/${l.id}/buy`, { hours }); toast.success(`Done! Paid ${money(r.data.cost)}`); refresh(); load(); }
    catch (e) { toast.error(errMsg(e)); }
  };
  const cancel = async (l) => {
    try { await api.delete(`/market/listings/${l.id}`); toast.success("Listing cancelled"); load(); } catch (e) { toast.error(errMsg(e)); }
  };

  return (
    <div className="space-y-8">
      <div className="text-center fade-up">
        <h1 className="font-display flex items-center justify-center gap-3 text-4xl font-bold sm:text-5xl"><KeyRound className="h-10 w-10 text-amber-300" />Key Marketplace</h1>
        <p className="mt-3 text-zinc-400">Rent key time from other users, or list your own key for others to rent. Max $5.25/h.</p>
      </div>
      <div className="mx-auto flex w-fit gap-1 rounded-2xl border border-white/5 bg-white/[0.03] p-1.5">
        {TABS.map(([k, l, I]) => (
          <button key={k} onClick={() => setTab(k)} data-testid={`market-tab-${k}`}
            className={`flex items-center gap-2 rounded-xl px-5 py-3 font-semibold transition-colors ${tab === k ? "bg-[#FF2A85]/15 text-white ring-1 ring-[#FF2A85]/40" : "text-zinc-400 hover:text-white"}`}>
            <I className="h-4 w-4" />{l}
          </button>
        ))}
      </div>
      {tab !== "history" && (
        <div className="flex flex-wrap items-center gap-3 border-b border-white/5 pb-6">
          <CreateListingDialog disabled={!hasKey} onCreated={load} defaultType={tab} />
          {!hasKey && <span className="text-sm italic text-zinc-500">You need an active key to create a listing</span>}
          <select value={division} onChange={(e) => setDivision(e.target.value)} data-testid="market-division-filter"
            className="ml-auto rounded-xl border border-white/10 bg-black/40 px-4 py-2.5">
            <option value="">All Divisions</option>
            {Object.entries(DIVISION_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
          <button onClick={load} data-testid="market-refresh-btn" className="btn-ghost flex items-center gap-2 rounded-xl px-4 py-2.5"><RefreshCw className="h-4 w-4" />Refresh</button>
        </div>
      )}
      {tab === "history" ? <History /> : list.length === 0 ? (
        <div className="py-20 text-center" data-testid="market-empty">
          <div className="font-display text-2xl font-bold">No active listings</div>
          <div className="mt-2 text-zinc-500">Check back later, or create your own listing!</div>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((l) => <ListingCard key={l.id} l={l} onBuy={buy} onCancel={cancel} />)}
        </div>
      )}
    </div>
  );
}
