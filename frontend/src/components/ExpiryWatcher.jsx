import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { DIVISION_META } from "@/lib/format";

export default function ExpiryWatcher() {
  const { user } = useAuth();
  const warned = useRef(new Set());

  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") Notification.requestPermission();
  }, []);

  useEffect(() => {
    const check = () => {
      (user?.access || []).forEach((a) => {
        if (!a.expires_at) return;
        const left = new Date(a.expires_at).getTime() - Date.now();
        const id = `${a.slot_id}-${a.expires_at}`;
        if (left > 0 && left <= 5 * 60 * 1000 && !warned.current.has(id)) {
          warned.current.add(id);
          const msg = `Your ${DIVISION_META[a.division].label} key expires in ${Math.ceil(left / 60000)} min`;
          toast.warning(msg, { duration: 15000 });
          if ("Notification" in window && Notification.permission === "granted") new Notification("Horloge Joiner", { body: msg });
        }
      });
    };
    check();
    const t = setInterval(check, 20000);
    return () => clearInterval(t);
  }, [user]);

  return null;
}
