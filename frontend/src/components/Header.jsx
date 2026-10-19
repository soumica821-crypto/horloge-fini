import { NavLink, useNavigate } from "react-router-dom";
import { LogOut, Plus, Shield } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Logo } from "@/components/Logo";
import DepositDialog from "@/components/DepositDialog";
import Avatar from "@/components/Avatar";
import { money } from "@/lib/format";

const LINKS = [
  ["/", "Home"], ["/logs", "Live Logs"], ["/statistics", "Statistics"], ["/slots", "Slots"],
  ["/marketplace", "Marketplace"], ["/leaderboard", "Leaderboard"],
];

const NavItem = ({ to, label, testid }) => (
  <NavLink to={to} end={to === "/"} data-testid={testid}
    className={({ isActive }) =>
      `relative whitespace-nowrap rounded-xl px-3.5 py-2 text-[15px] transition-colors duration-200 ${
        isActive ? "bg-[#FF2A85]/10 text-[#FF5C9D]" : "text-zinc-300 hover:text-white hover:bg-white/5"}`}>
    {label}
  </NavLink>
);

export default function Header() {
  const { user, logout, settings } = useAuth();
  const nav = useNavigate();
  return (
    <header className="border-b border-white/5 bg-[#08080c]/85 backdrop-blur-xl">
      <div className="mx-auto flex max-w-[1400px] flex-wrap items-center gap-x-4 gap-y-2 px-4 sm:px-8 py-3 lg:flex-nowrap">
        <Logo />
        {settings.discord_invite && (
          <a href={settings.discord_invite} target="_blank" rel="noreferrer" data-testid="discord-invite-link"
            className="hidden md:inline text-[#7289FF] hover:text-[#9aaaff] ml-2">Discord</a>
        )}
        <nav className="no-scrollbar order-last flex w-full min-w-0 items-center gap-1 overflow-x-auto lg:order-none lg:w-auto lg:flex-1 lg:justify-center">
          {LINKS.map(([to, label]) => <NavItem key={to} to={to} label={label} testid={`nav-${label.toLowerCase().replace(" ", "-")}`} />)}
          {user?.is_admin && <NavItem to="/admin" label={<span className="flex items-center gap-1.5"><Shield className="h-4 w-4" />Owner</span>} testid="nav-admin" />}
        </nav>
        {user && (
          <div className="ml-auto flex items-center gap-2 shrink-0 lg:ml-0">
            <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] p-1 pr-1.5">
              <DepositDialog trigger={
                <button data-testid="header-deposit-btn" className="grid h-8 w-8 place-items-center rounded-full bg-[#FF2A85]/15 text-[#FF5C9D] hover:bg-[#FF2A85]/25 transition-colors">
                  <Plus className="h-4 w-4" />
                </button>} />
              <span className="font-semibold text-emerald-400 px-1" data-testid="header-balance">{money(user.balance)}</span>
              <Avatar src={user.avatar} name={user.display_name || user.username} size={32} />
            </div>
            <button data-testid="logout-btn" onClick={() => { logout(); nav("/login"); }}
              className="grid h-9 w-9 place-items-center rounded-full text-zinc-400 hover:text-white hover:bg-white/5 transition-colors">
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
