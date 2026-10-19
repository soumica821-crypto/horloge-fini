import { useEffect, useState } from "react";
import { Lock, Copy, Check } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

export const CodeBlock = ({ code, testid }) => {
  const [ok, setOk] = useState(false);
  const copy = () => { navigator.clipboard.writeText(code); setOk(true); toast.success("Copied"); setTimeout(() => setOk(false), 1500); };
  return (
    <div className="relative rounded-xl border border-white/10 bg-black/50 p-4 pr-14">
      <pre className="font-mono text-xs text-[#FF9cc3] whitespace-pre-wrap break-all" data-testid={testid}>{code}</pre>
      <button onClick={copy} data-testid={`${testid}-copy-btn`} className="btn-ghost absolute right-3 top-3 rounded-lg p-2">
        {ok ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
      </button>
    </div>
  );
};

export default function ScriptCard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  useEffect(() => { api.get("/script").then((r) => setData(r.data)); }, [user?.key, user?.access?.length]);

  return (
    <section className="glass rounded-3xl p-6 sm:p-8" data-testid="script-card">
      <div className="flex items-center justify-between">
        <div className="label-xs">Script</div>
        {data && !data.locked && (
          <span className="text-xs text-zinc-500" data-testid="hwid-status">HWID {data.hwid_bound ? "bound" : "not bound yet"}</span>
        )}
      </div>
      <div className="mt-4">
        {!data || data.locked ? (
          <div className="flex flex-col items-center gap-2 rounded-xl bg-black/40 py-8 text-zinc-500" data-testid="script-locked">
            <Lock className="h-6 w-6" /><span>Buy access first</span>
          </div>
        ) : (
          <CodeBlock code={data.loader} testid="script-loader" />
        )}
      </div>
    </section>
  );
}
