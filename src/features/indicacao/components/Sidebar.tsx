import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import {
  PlusCircle,
  ListChecks,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  UserPlus,
  Contact,
  UsersRound,
  RefreshCw,
} from "lucide-react";
import { useApp } from "../AppContext";
import { Logo } from "./Logo";
import { Avatar } from "./Avatar";
import { useState, useEffect } from "react";

const ROLE_LABEL: Record<string, string> = {
  admin: "Administrador",
  aprovador: "Aprovador",
  usuario: "Usuário",
  usuario_ra: "Usuário RA",
};

export function Sidebar({ collapsed, onToggle }: { collapsed?: boolean; onToggle?: () => void }) {
  const { user, logout, refreshData } = useApp();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  if (!user) return null;

  const handleLogout = () => {
    logout();
    navigate({ to: "/" });
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshData();
    } finally {
      setRefreshing(false);
    }
  };

  const NAV =
    user.role === "aprovador"
      ? ([
          { to: "/app/indicacoes", label: "Indicações", Icon: ListChecks },
          { to: "/app/contatos", label: "Contatos Quentes", Icon: Contact },
          { to: "/app/analytics", label: "Analytics", Icon: BarChart3 },
        ] as const)
      : user.role === "admin"
        ? ([
            { to: "/app/nova", label: "Nova Indicação", Icon: PlusCircle },
            { to: "/app/novo-contato", label: "Novo Contato Quente", Icon: UserPlus },
            { to: "/app/indicacoes", label: "Registros", Icon: ListChecks },
            { to: "/app/analytics", label: "Analytics", Icon: BarChart3 },
          ] as const)
        : user.role === "usuario_ra"
          ? ([
              { to: "/app/nova", label: "Nova Indicação", Icon: PlusCircle },
              { to: "/app/indicacoes", label: "Indicações", Icon: ListChecks },
              { to: "/app/novo-contato", label: "Novo Contato Quente", Icon: UserPlus },
              { to: "/app/contatos", label: "Contatos Quentes", Icon: Contact },
              { to: "/app/analytics", label: "Analytics", Icon: BarChart3 },
            ] as const)
          : ([
              { to: "/app/nova", label: "Nova Indicação", Icon: PlusCircle },
              { to: "/app/indicacoes", label: "Indicações", Icon: ListChecks },
              { to: "/app/analytics", label: "Analytics", Icon: BarChart3 },
            ] as const);

  const adminNav =
    user.role === "admin"
      ? ([{ to: "/app/gestao-usuarios", label: "Gestão de Usuários", Icon: UsersRound }] as const)
      : [];

  return (
    <>
      {/* Mobile trigger */}
      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        className="fixed top-4 left-4 z-50 lg:hidden grid h-10 w-10 place-items-center rounded-lg bg-surface-highest border border-outline-variant/20 text-white"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/80 lg:hidden backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`
          flex h-screen shrink-0 flex-col bg-surface-low sticky top-0 transition-all duration-300 z-50
          ${collapsed ? "w-20" : "w-72"}
          max-lg:fixed max-lg:w-72
          ${mobileOpen ? "max-lg:translate-x-0" : "max-lg:-translate-x-full"}
          font-body shadow-[1px_0_0_0_rgba(255,255,255,0.05)]
        `}
      >
        <div
          className={`flex items-center ${collapsed ? "justify-center px-2 py-8" : "justify-between px-8 py-8"}`}
        >
          {!collapsed && <Logo />}
          <button
            type="button"
            onClick={() => {
              if (window.innerWidth < 1024) {
                setMobileOpen(false);
              } else {
                onToggle?.();
              }
            }}
            className="grid h-10 w-10 place-items-center rounded-lg text-outline hover:bg-surface-high hover:text-white transition-all"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        <div
          className={`flex items-center gap-4 py-6 mb-4 ${collapsed ? "justify-center px-2" : "px-8"}`}
        >
          <Avatar
            name={user.name}
            size={collapsed ? "sm" : "md"}
            className="ring-2 ring-primary-container/20"
          />
          {!collapsed && (
            <div className="min-w-0">
              <div className="truncate text-sm font-bold text-white uppercase tracking-tight">
                {user.name}
              </div>
              <div className="truncate text-[10px] font-black uppercase tracking-widest text-primary-container/70">
                {ROLE_LABEL[user.role]}
              </div>
            </div>
          )}
        </div>

        <nav className="flex-1 px-4 space-y-2">
          {NAV.map(({ to, label, Icon }) => {
            const active = location.pathname.startsWith(to);
            return (
              <Link
                key={to}
                to={to}
                title={collapsed ? label : undefined}
                className={`flex items-center gap-4 rounded-xl px-4 py-3 text-[11px] font-black uppercase tracking-[0.15em] transition-all duration-200 ${
                  collapsed ? "justify-center" : ""
                } ${
                  active
                    ? "bg-primary-container text-on-primary-container shadow-[0_10px_20px_rgba(202,253,0,0.2)]"
                    : "text-outline hover:bg-surface-high hover:text-white"
                }`}
              >
                <Icon
                  className={`h-4 w-4 shrink-0 transition-transform ${active ? "scale-110" : ""}`}
                />
                {!collapsed && <span className="font-display">{label}</span>}
              </Link>
            );
          })}
          {adminNav.map(({ to, label, Icon }) => {
            const active = location.pathname.startsWith(to);
            return (
              <Link
                key={to}
                to={to}
                title={collapsed ? label : undefined}
                className={`flex items-center gap-4 rounded-xl px-4 py-3 text-[11px] font-black uppercase tracking-[0.15em] transition-all duration-200 ${
                  collapsed ? "justify-center" : ""
                } ${
                  active
                    ? "bg-primary-container text-on-primary-container shadow-[0_10px_20px_rgba(202,253,0,0.2)]"
                    : "text-outline hover:bg-surface-high hover:text-white"
                }`}
              >
                <Icon
                  className={`h-4 w-4 shrink-0 transition-transform ${active ? "scale-110" : ""}`}
                />
                {!collapsed && <span className="font-display">{label}</span>}
              </Link>
            );
          })}
          {(() => {
            const active = location.pathname.startsWith("/app/configuracoes");
            return (
              <Link
                to="/app/configuracoes"
                title={collapsed ? "Configurações" : undefined}
                className={`flex items-center gap-4 rounded-xl px-4 py-3 text-[11px] font-black uppercase tracking-[0.15em] transition-all duration-200 ${
                  collapsed ? "justify-center" : ""
                } ${
                  active
                    ? "bg-primary-container text-on-primary-container shadow-[0_10px_20px_rgba(202,253,0,0.2)]"
                    : "text-outline hover:bg-surface-high hover:text-white"
                }`}
              >
                <Settings
                  className={`h-4 w-4 shrink-0 transition-transform ${active ? "scale-110" : ""}`}
                />
                {!collapsed && <span className="font-display">Configurações</span>}
              </Link>
            );
          })()}
        </nav>

        <div className="p-4 space-y-2 mt-auto border-t border-outline-variant/5">
          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing}
            title={collapsed ? "Atualizar" : undefined}
            className={`flex w-full items-center gap-4 rounded-xl px-4 py-3 text-[11px] font-black uppercase tracking-[0.15em] text-outline hover:bg-surface-high hover:text-white transition-all disabled:opacity-50 ${collapsed ? "justify-center" : ""}`}
          >
            <RefreshCw className={`h-4 w-4 shrink-0 ${refreshing ? "animate-spin" : ""}`} />
            {!collapsed && <span className="font-display">Atualizar</span>}
          </button>
          <button
            type="button"
            onClick={handleLogout}
            title={collapsed ? "Sair" : undefined}
            className={`flex w-full items-center gap-4 rounded-xl px-4 py-3 text-[11px] font-black uppercase tracking-[0.15em] text-outline hover:bg-destructive/10 hover:text-destructive transition-all ${collapsed ? "justify-center" : ""}`}
          >
            <LogOut className="h-4 w-4 shrink-0" />
            {!collapsed && <span className="font-display">Sair</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
