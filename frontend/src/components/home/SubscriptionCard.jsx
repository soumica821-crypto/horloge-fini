import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { DIVISION_META, remaining } from "@/lib/format";

export default function SubscriptionCard() {
  const { user } = useAuth();
  const [, tick] = useState(0);
  useEffect(() => { const t = setInterval(() => tick((x) => x + 1), 1000); return () => clearInterval(t); }, []);
  const access = user?.access || [];
  const active = access.length > 0;

  return (
    <section data-testid="subscription-card"
      className={`glass relative overflow-hidden rounded-3xl border-l-4 p-6 sm:p-8 ${active ? "border-l-emerald-500" : "border-l-red-500"}`}>
      <span className={`absolute right-6 top-6 h-2.5 w-2.5 rounded-full ${active ? "bg-emerald-400 shadow-[0_0_12px_#34d399]" : "bg-red-500"}`} />
      <div className="label-xs">Subscription</div>
      {!active ? (
        <div className="mt-2 text-xl font-semibold" data-testid="no-active-plan">No Active Plan</div>
      ) : (
        <div className="mt-4 flex flex-wrap gap-3">
          {access.map((a) => (
            <div key={a.division} data-testid={`active-plan-${a.division}`}
              className="rounded-2xl border border-white/10 bg-black/30 px-5 py-3">
              <div className="font-display font-bold" style={{ color: DIVISION_META[a.division].color }}>
                {DIVISION_META[a.division].label}{a.rented ? " · rented" : ""}
              </div>
              <div className="font-mono text-sm text-zinc-300">{a.infinite ? "Infinite (owner)" : remaining(a.expires_at)}</div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
