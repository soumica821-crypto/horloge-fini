import { toast } from "sonner";
import { api, errMsg } from "@/lib/api";

export const saveSettings = async (patch, reload) => {
  try { await api.put("/admin/settings", patch); toast.success("Saved"); reload?.(); }
  catch (e) { toast.error(errMsg(e)); }
};

export const Card = ({ title, children, testid, className = "" }) => (
  <section className={`glass rounded-3xl p-6 sm:p-8 ${className}`} data-testid={testid}>
    {title && <h3 className="font-display mb-5 text-lg font-bold">{title}</h3>}
    {children}
  </section>
);
