import { useCallback, useEffect, useMemo, useState } from "react";
import { ShieldCheck, UsersRound } from "lucide-react";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useApp } from "../AppContext";
import type { Role, User } from "../types";

type ManagedUser = {
  userId: string;
  name: string;
  email: string;
  loginId: string;
  setor: string;
  contrato: string;
  role: Role;
};

const ROLE_OPTIONS: { value: Role; label: string }[] = [
  { value: "admin", label: "Administrador" },
  { value: "aprovador", label: "Aprovador" },
  { value: "usuario", label: "Usuário" },
  { value: "usuario_ra", label: "Usuário RA" },
];

const ROLE_LABEL = Object.fromEntries(
  ROLE_OPTIONS.map((role) => [role.value, role.label]),
) as Record<Role, string>;

function mapCurrentUserToManagedUser(currentUser: User): ManagedUser {
  return {
    userId: currentUser.authUserId || currentUser.id,
    name: currentUser.name,
    email: currentUser.email,
    loginId: currentUser.loginId || currentUser.email,
    setor: currentUser.setor,
    contrato: currentUser.contrato,
    role: currentUser.role,
  };
}

export function GestaoUsuariosPage() {
  const { user, authLoading } = useApp();
  const [users, setUsers] = useState<ManagedUser[]>(() =>
    user ? [mapCurrentUserToManagedUser(user)] : [],
  );
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [savingUserId, setSavingUserId] = useState<string | null>(null);

  const isAdmin = user?.role === "admin";

  const loadUsers = useCallback(async () => {
    const currentUserRow = user ? mapCurrentUserToManagedUser(user) : null;

    if (currentUserRow && users.length === 0) {
      setUsers([currentUserRow]);
    }

    if (authLoading) {
      setLoading(false);
      return;
    }

    if (!isAdmin) {
      setLoading(false);
      return;
    }

    setLoading(users.length === 0);
    setLoadError("");

    try {
      const [profilesResult, rolesResult] = await Promise.all([
        supabase
          .from("profiles")
          .select("user_id, name, email, login_identifier, setor, contrato")
          .order("name", { ascending: true }),
        supabase.from("user_roles").select("user_id, role"),
      ]);

      if (profilesResult.error || rolesResult.error) {
        const message =
          profilesResult.error?.message || rolesResult.error?.message || "Erro desconhecido.";
        setLoadError(message);
        toast.error("Não foi possível carregar os usuários.");
        return;
      }

      const roleByUserId = new Map<string, Role>();
      rolesResult.data?.forEach((roleRow) => {
        roleByUserId.set(roleRow.user_id, roleRow.role as Role);
      });

      setUsers(
        (profilesResult.data ?? []).map((profile) => ({
          userId: profile.user_id,
          name: profile.name,
          email: profile.email,
          loginId: profile.login_identifier || profile.email,
          setor: profile.setor,
          contrato: profile.contrato,
          role: roleByUserId.get(profile.user_id) ?? "usuario",
        })),
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Erro inesperado ao carregar usuários.";
      setLoadError(message);
      toast.error("Não foi possível carregar os usuários.");
    } finally {
      setLoading(false);
    }
  }, [authLoading, isAdmin, user, users.length]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const totals = useMemo(
    () =>
      ROLE_OPTIONS.map((role) => ({
        ...role,
        total: users.filter((managedUser) => managedUser.role === role.value).length,
      })),
    [users],
  );

  const updateRole = async (managedUser: ManagedUser, nextRole: Role) => {
    if (managedUser.role === nextRole) return;
    if (managedUser.userId === user?.id) {
      toast.error("Para evitar perda de acesso, altere sua própria role diretamente no Supabase.");
      return;
    }

    setSavingUserId(managedUser.userId);

    const { error: deleteError } = await supabase
      .from("user_roles")
      .delete()
      .eq("user_id", managedUser.userId);

    if (deleteError) {
      setSavingUserId(null);
      toast.error("Erro ao remover role anterior.");
      return;
    }

    const { error: insertError } = await supabase
      .from("user_roles")
      .insert({ user_id: managedUser.userId, role: nextRole });

    setSavingUserId(null);

    if (insertError) {
      toast.error("Erro ao salvar nova role.");
      await loadUsers();
      return;
    }

    setUsers((prev) =>
      prev.map((item) => (item.userId === managedUser.userId ? { ...item, role: nextRole } : item)),
    );
    toast.success(`Role de ${managedUser.name} alterada para ${ROLE_LABEL[nextRole]}.`);
  };

  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-3xl space-y-4 py-10 font-body">
        <h1 className="font-display text-3xl font-bold uppercase tracking-tight text-on-surface">
          Acesso restrito
        </h1>
        <p className="text-sm text-on-surface-variant">
          Apenas administradores podem acessar a gestão de usuários.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 font-body">
      <header className="border-b border-outline-variant/10 py-6">
        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.24em] text-primary-container">
              <ShieldCheck className="h-4 w-4" /> Área administrativa
            </div>
            <h1 className="font-display text-3xl font-bold uppercase leading-none tracking-tighter text-on-surface md:text-5xl">
              Gestão de <br />
              <span className="font-light italic text-on-surface-variant">Usuários</span>
            </h1>
          </div>
          <div className="flex items-center gap-3 rounded-xl border border-outline-variant/10 bg-surface-low px-4 py-3 text-xs font-bold uppercase tracking-widest text-on-surface-variant">
            <UsersRound className="h-4 w-4 text-primary-container" /> {users.length} usuários ativos
          </div>
        </div>
      </header>

      <section className="grid gap-3 md:grid-cols-4">
        {totals.map((role) => (
          <div key={role.value} className="border border-outline-variant/10 bg-surface-low p-4">
            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-outline">
              {role.label}
            </div>
            <div className="mt-3 font-display text-3xl font-bold text-on-surface">{role.total}</div>
          </div>
        ))}
      </section>

      <section className="overflow-hidden border border-outline-variant/10 bg-surface-low">
        <div className="grid grid-cols-[1.4fr_1.2fr_0.8fr_0.8fr] gap-4 border-b border-outline-variant/10 px-5 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-outline max-lg:hidden">
          <span>Usuário</span>
          <span>Email / login</span>
          <span>Perfil</span>
          <span>Role</span>
        </div>

        {loading && users.length === 0 ? (
          <div className="px-5 py-10 text-sm font-medium text-on-surface-variant">
            Carregando usuários...
          </div>
        ) : loadError && users.length === 0 ? (
          <div className="space-y-4 px-5 py-10 text-sm font-medium text-on-surface-variant">
            <p>Não foi possível carregar os usuários.</p>
            <button
              type="button"
              onClick={loadUsers}
              className="rounded-lg border border-outline-variant/20 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-primary-container transition-colors hover:bg-primary-container/10"
            >
              Tentar novamente
            </button>
          </div>
        ) : users.length === 0 ? (
          <div className="px-5 py-10 text-sm font-medium text-on-surface-variant">
            Nenhum usuário ativo encontrado.
          </div>
        ) : (
          users.map((managedUser) => (
            <div
              key={managedUser.userId}
              className="grid grid-cols-[1.4fr_1.2fr_0.8fr_0.8fr] gap-4 border-b border-outline-variant/10 px-5 py-4 last:border-b-0 max-lg:grid-cols-1"
            >
              <div>
                <div className="font-display text-sm font-bold uppercase text-on-surface">
                  {managedUser.name}
                </div>
                <div className="mt-1 text-[10px] font-black uppercase tracking-widest text-primary-container/70">
                  {managedUser.userId === user?.id ? "Você" : "Usuário ativo"}
                </div>
              </div>
              <div className="min-w-0 text-sm font-medium text-on-surface-variant">
                <div className="truncate text-on-surface">{managedUser.email}</div>
                <div className="mt-1 truncate text-xs text-outline">{managedUser.loginId}</div>
              </div>
              <div className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">
                <div>{managedUser.setor}</div>
                <div className="mt-1 text-outline">{managedUser.contrato}</div>
              </div>
              <Select
                value={managedUser.role}
                onValueChange={(value) => updateRole(managedUser, value as Role)}
                disabled={savingUserId === managedUser.userId || managedUser.userId === user?.id}
              >
                <SelectTrigger className="h-10 rounded-lg border-outline-variant/20 bg-surface text-xs font-black uppercase tracking-widest text-on-surface shadow-none focus:ring-primary-container/30 disabled:opacity-50">
                  <SelectValue>{ROLE_LABEL[managedUser.role]}</SelectValue>
                </SelectTrigger>
                <SelectContent className="rounded-xl border border-outline-variant/20 bg-surface-low p-1.5 text-on-surface shadow-2xl shadow-black/60">
                  {ROLE_OPTIONS.map((role) => (
                    <SelectItem
                      key={role.value}
                      value={role.value}
                      className="cursor-pointer rounded-md px-3 py-2 text-xs font-bold uppercase tracking-widest text-on-surface-variant focus:bg-primary-container/15 focus:text-primary-container data-[state=checked]:bg-primary-container/20 data-[state=checked]:text-primary-container"
                    >
                      {role.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ))
        )}
      </section>
    </div>
  );
}
