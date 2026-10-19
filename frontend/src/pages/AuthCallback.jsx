import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

export default function AuthCallback() {
  const { login } = useAuth();
  const nav = useNavigate();
  const done = useRef(false);

  useEffect(() => {
    if (done.current) return;
    done.current = true;
    const token = new URLSearchParams(window.location.hash.slice(1)).get("token");
    window.history.replaceState({}, document.title, "/auth/callback");
    if (!token) return nav("/login?error=missing", { replace: true });
    login(token).then(() => nav("/", { replace: true }));
  }, [login, nav]);

  return <div className="grid min-h-screen place-items-center text-zinc-400" data-testid="auth-callback">Signing you in…</div>;
}
