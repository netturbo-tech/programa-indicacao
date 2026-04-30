import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type {
  Indicacao,
  StatusIndicacao,
  User,
  Contato,
  Contrato,
  Setor,
  Role,
  Produto,
} from "./types";
import { LIMITE_CLT_MES, VALOR_RECOMPENSA } from "./types";
import { authEmailForIdentifier } from "./authIdentifiers";
import { replaceAuthEmail } from "./authActions";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import type { Session } from "@supabase/supabase-js";
import { toast } from "sonner";

const now = () => new Date().toISOString();
type IndicacaoUpdate = Database["public"]["Tables"]["indicacoes"]["Update"];

interface RegisterUserInput {
  identifier: string;
  password: string;
  authUserId?: string;
  name?: string;
  cpf?: string;
  funcao?: string;
  contrato?: Contrato;
  setor?: Setor;
}

interface UpdateProfileInput {
  name: string;
  loginId?: string;
  email?: string;
  ra?: string;
  cpf: string;
  funcao: string;
  setor: Setor;
  contrato: Contrato;
}

interface AppContextValue {
  user: User | null;
  authLoading: boolean;
  users: User[];
  login: (userId: string) => void;
  registerUser: (data: RegisterUserInput) => Promise<{ ok: boolean; error?: string }>;
  updateProfile: (data: UpdateProfileInput) => Promise<{ ok: boolean; error?: string }>;
  refreshData: () => Promise<{ ok: boolean; error?: string }>;
  logout: () => void;
  indicacoes: Indicacao[];
  visibleIndicacoes: Indicacao[];
  createIndicacao: (
    data: Omit<
      Indicacao,
      | "id"
      | "status"
      | "criadoEm"
      | "modificadoEm"
      | "criadoPorId"
      | "criadoPorNome"
      | "modificadoPorNome"
    >,
  ) => Promise<{ ok: boolean; error?: string }>;
  updateIndicacao: (
    id: string,
    patch: Partial<Indicacao>,
  ) => Promise<{ ok: boolean; error?: string }>;
  updateStatus: (id: string, status: StatusIndicacao) => Promise<{ ok: boolean; error?: string }>;
  deleteIndicacao: (id: string) => void;
  countCltThisMonth: (userId: string) => number;
  creditoAtual: (userId: string) => number;
  contatos: Contato[];
  visibleContatos: Contato[];
  createContato: (
    data: Omit<
      Contato,
      "id" | "criadoEm" | "modificadoEm" | "criadoPorId" | "criadoPorNome" | "modificadoPorNome"
    >,
  ) => Promise<{ ok: boolean; error?: string }>;
  updateContato: (id: string, patch: Partial<Contato>) => void;
  deleteContato: (id: string) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

function mapProfileToUser(profile: any, role: Role = "usuario"): User {
  return {
    id: profile.user_id,
    authUserId: profile.user_id,
    name: profile.name,
    email: profile.email,
    loginId: profile.login_identifier || profile.email,
    ra: profile.ra || undefined,
    cpf: profile.cpf || undefined,
    funcao: profile.funcao || "",
    role,
    contrato: profile.contrato as Contrato,
    setor: profile.setor as Setor,
    onboardingCompleted: profile.onboarding_completed ?? false,
  };
}

async function getUserRole(userId: string): Promise<Role> {
  const { data } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .maybeSingle();
  return (data?.role as Role) || "usuario";
}

function mapIndicacao(i: any): Indicacao {
  return {
    id: i.id,
    status: i.status as StatusIndicacao,
    leadNome: i.lead_nome,
    empresa: i.empresa,
    telefone: i.telefone,
    emailLead: i.email_lead,
    produto: i.produto as Produto,
    emailIndicador: i.email_indicador,
    setor: i.setor as Setor,
    funcao: i.funcao,
    contrato: i.contrato as Contrato,
    observacao: i.observacao,
    criadoPorId: i.criado_por_id,
    criadoPorNome: i.criado_por_nome,
    criadoEm: i.created_at,
    modificadoEm: i.updated_at,
    modificadoPorNome: i.modificado_por_nome,
    recompensaPaga: i.recompensa_paga,
  };
}

function mapContato(c: any): Contato {
  return {
    id: c.id,
    nome: c.nome,
    email: c.email,
    cnpj: c.cnpj,
    razaoSocial: c.razao_social,
    nomeFantasia: c.nome_fantasia,
    telefoneFixo: c.telefone_fixo,
    celular: c.celular,
    observacao: c.observacao ?? "",
    criadoPorId: c.criado_por_id,
    criadoPorNome: c.criado_por_nome,
    criadoEm: c.created_at,
    modificadoEm: c.updated_at,
    modificadoPorNome: c.modificado_por_nome,
  };
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [indicacoes, setIndicacoes] = useState<Indicacao[]>([]);
  const [contatos, setContatos] = useState<Contato[]>([]);

  useEffect(() => {
    let cancelled = false;
    let loadVersion = 0;

    const resetState = () => {
      if (cancelled) return;
      setUser(null);
      setUsers([]);
      setIndicacoes([]);
      setContatos([]);
    };

    const clearInvalidStoredSession = async () => {
      await supabase.auth.signOut({ scope: "local" });
      if (typeof window === "undefined") return;
      Object.keys(window.localStorage)
        .filter((key) => key.startsWith("sb-") && key.endsWith("-auth-token"))
        .forEach((key) => window.localStorage.removeItem(key));
    };

    const loadSessionData = async (session: Session | null) => {
      const requestVersion = ++loadVersion;
      setAuthLoading(true);

      if (!session) {
        resetState();
        setAuthLoading(false);
        return;
      }

      const [profileResult, roleResult] = await Promise.all([
        supabase.from("profiles").select("*").eq("user_id", session.user.id).maybeSingle(),
        supabase.from("user_roles").select("role").eq("user_id", session.user.id).maybeSingle(),
      ]);

      if (cancelled || requestVersion !== loadVersion) return;

      if (profileResult.error || roleResult.error) {
        resetState();
        setAuthLoading(false);
        return;
      }

      const role = (roleResult.data?.role as Role) || "usuario";
      const currentUser = profileResult.data ? mapProfileToUser(profileResult.data, role) : null;

      setUser(currentUser);
      setUsers(currentUser ? [currentUser] : []);
      setAuthLoading(false);

      if (!currentUser) return;

      const isBroadAccess = currentUser.role === "admin" || currentUser.role === "aprovador";
      const canAccessContatos = isBroadAccess || currentUser.role === "usuario_ra";
      const ownerId = currentUser.authUserId || currentUser.id;
      const indicacoesQuery = supabase
        .from("indicacoes")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);
      const contatosQuery = supabase
        .from("contatos")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);

      const [indicacoesResult, contatosResult] = await Promise.all([
        isBroadAccess ? indicacoesQuery : indicacoesQuery.eq("criado_por_id", ownerId),
        canAccessContatos
          ? isBroadAccess
            ? contatosQuery
            : contatosQuery.eq("criado_por_id", ownerId)
          : Promise.resolve({ data: [] }),
      ]);

      if (cancelled || requestVersion !== loadVersion) return;

      setIndicacoes(indicacoesResult.data?.map(mapIndicacao) ?? []);
      setContatos(contatosResult.data?.map(mapContato) ?? []);
    };

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") {
        loadVersion += 1;
        resetState();
        setAuthLoading(false);
        return;
      }

      if (["INITIAL_SESSION", "SIGNED_IN", "TOKEN_REFRESHED", "USER_UPDATED"].includes(event)) {
        void loadSessionData(session);
      }
    });

    const init = async () => {
      const { data, error } = await supabase.auth.getSession();
      if (cancelled) return;

      if (error) {
        await clearInvalidStoredSession();
        resetState();
        setAuthLoading(false);
        return;
      }

      await loadSessionData(data.session);
    };

    void init();

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  const login = useCallback(
    (userId: string) => {
      const found = users.find((u) => u.id === userId);
      if (!found) return;
      setUser(found);
    },
    [users],
  );

  const registerUser: AppContextValue["registerUser"] = useCallback(
    async (data) => {
      const identifier = data.identifier.trim();
      const normalized = identifier.toLowerCase();
      if (!identifier) return { ok: false, error: "Informe e-mail, RA ou CPF." };
      if (data.password.trim().length < 6)
        return { ok: false, error: "A senha deve ter pelo menos 6 caracteres." };

      if (data.authUserId) {
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("user_id", data.authUserId)
          .maybeSingle();

        if (profileError)
          return {
            ok: false,
            error: `Erro ao carregar perfil no banco de dados: ${profileError.message}`,
          };

        if (profile) {
          const existingProfileUser = mapProfileToUser(profile, await getUserRole(profile.user_id));

          setUsers((prev) => {
            const exists = prev.some((u) => u.id === existingProfileUser.id);
            if (exists)
              return prev.map((u) => (u.id === existingProfileUser.id ? existingProfileUser : u));
            return [existingProfileUser, ...prev];
          });
          setUser(existingProfileUser);
          return { ok: true };
        }
      }

      const existingUser = users.find(
        (u) =>
          u.id === data.authUserId ||
          u.authUserId === data.authUserId ||
          u.email.toLowerCase() === normalized ||
          u.loginId?.toLowerCase() === normalized,
      );

      if (existingUser) {
        if (
          data.authUserId &&
          (existingUser.id === data.authUserId || existingUser.authUserId === data.authUserId)
        ) {
          setUser(existingUser);
          return { ok: true };
        }

        return { ok: false, error: "Este cadastro já existe." };
      }

      const nextUser: User = {
        id: data.authUserId || `local-${Date.now()}`,
        authUserId: data.authUserId,
        name:
          data.name?.trim() ||
          (identifier.includes("@") ? identifier.split("@")[0] : `Usuário ${identifier}`),
        email: authEmailForIdentifier(identifier),
        loginId: identifier,
        cpf: data.cpf?.trim(),
        funcao: data.funcao?.trim() || "",
        role: data.authUserId ? await getUserRole(data.authUserId) : "usuario",
        contrato: data.contrato ?? "CLT",
        setor: data.setor ?? "COMERCIAL",
      };

      if (data.authUserId) {
        const { error } = await supabase.from("profiles").upsert(
          {
            user_id: data.authUserId,
            name: nextUser.name,
            email: nextUser.email,
            login_identifier: nextUser.loginId,
            ra: nextUser.ra || null,
            cpf: nextUser.cpf || null,
            funcao: nextUser.funcao || "",
            contrato: nextUser.contrato,
            setor: nextUser.setor,
            onboarding_completed: false,
          },
          { onConflict: "user_id" },
        );

        if (error)
          return { ok: false, error: `Erro ao salvar perfil no banco de dados: ${error.message}` };
      }

      setUsers((prev) => [nextUser, ...prev]);
      setUser(nextUser);
      return { ok: true };
    },
    [users],
  );

  const updateProfile = useCallback(
    async (updates: Partial<User>) => {
      if (!user) return { ok: false, error: "Usuário não autenticado." };

      const updatedUser: User = {
        ...user,
        ...updates,
        onboardingCompleted: true,
      };

      // Se o usuário forneceu um novo e-mail real (ex.: Usuário RA cadastrado
      // sem e-mail), atualiza também o e-mail de autenticação no Supabase Auth.
      const newEmail = (updates as { email?: string }).email?.trim();
      const currentEmail = user.email?.trim();
      if (newEmail && newEmail.toLowerCase() !== currentEmail?.toLowerCase()) {
        const result = await replaceAuthEmail({
          data: { userId: user.id, newEmail: newEmail.toLowerCase() },
        });
        if (!result.ok) {
          return { ok: false, error: result.error };
        }
        updatedUser.email = result.email ?? newEmail.toLowerCase();
        updatedUser.loginId = updatedUser.email;
        // Refresh session so the JWT carries the new email immediately.
        await supabase.auth.refreshSession();
      }

      if (supabase) {
        const payload = {
          user_id: user.id,
          name: updatedUser.name,
          email: updatedUser.email,
          login_identifier: updatedUser.loginId || updatedUser.email,
          ra: updatedUser.ra || null,
          cpf: updatedUser.cpf || null,
          funcao: updatedUser.funcao || "",
          setor: updatedUser.setor,
          contrato: updatedUser.contrato,
          onboarding_completed: true,
        };

        const { error } = await supabase
          .from("profiles")
          .upsert(payload, { onConflict: "user_id" });
        if (error) return { ok: false, error: `Erro no banco de dados: ${error.message}` };
      }

      setUsers((prev) => prev.map((u) => (u.id === user.id ? updatedUser : u)));
      setUser(updatedUser);
      return { ok: true };
    },
    [user],
  );

  const logout = useCallback(() => {
    setUser(null);
    supabase.auth.signOut();
  }, []);

  const refreshData = useCallback(async () => {
    if (!user) return { ok: false, error: "Usuário não autenticado." };

    const isBroadAccess = user.role === "admin" || user.role === "aprovador";
    const canAccessContatos = isBroadAccess || user.role === "usuario_ra";
    const ownerId = user.authUserId || user.id;
    const indicacoesQuery = supabase
      .from("indicacoes")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);
    const contatosQuery = supabase
      .from("contatos")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);

    const [indicacoesResult, contatosResult] = await Promise.all([
      isBroadAccess ? indicacoesQuery : indicacoesQuery.eq("criado_por_id", ownerId),
      canAccessContatos
        ? isBroadAccess
          ? contatosQuery
          : contatosQuery.eq("criado_por_id", ownerId)
        : Promise.resolve({ data: [] }),
    ]);

    if (indicacoesResult.error || ("error" in contatosResult && contatosResult.error)) {
      return {
        ok: false,
        error:
          indicacoesResult.error?.message ||
          ("error" in contatosResult ? contatosResult.error?.message : undefined) ||
          "Erro ao atualizar os dados.",
      };
    }

    setIndicacoes(indicacoesResult.data?.map(mapIndicacao) ?? []);
    setContatos(contatosResult.data?.map(mapContato) ?? []);
    return { ok: true };
  }, [user]);

  const countCltThisMonth = useCallback(
    (userId: string) => {
      const now = new Date();
      const m = now.getMonth();
      const y = now.getFullYear();
      return indicacoes.filter((i) => {
        if (i.criadoPorId !== userId) return false;
        const d = new Date(i.criadoEm);
        return d.getMonth() === m && d.getFullYear() === y;
      }).length;
    },
    [indicacoes],
  );

  const creditoAtual = useCallback(
    (userId: string) =>
      indicacoes.filter((i) => i.criadoPorId === userId && i.status === "Contrato assinado")
        .length * VALOR_RECOMPENSA,
    [indicacoes],
  );

  const createIndicacao: AppContextValue["createIndicacao"] = useCallback(
    async (data) => {
      if (!user) return { ok: false, error: "Não autenticado" };
      if (user.contrato === "CLT" && user.role === "usuario") {
        const count = countCltThisMonth(user.id);
        if (count >= LIMITE_CLT_MES) {
          return {
            ok: false,
            error: `Você atingiu o limite de ${LIMITE_CLT_MES} indicações para este mês.`,
          };
        }
      }
      const stamp = now();
      const novaId = crypto.randomUUID();

      const nova: Indicacao = {
        ...data,
        id: novaId,
        status: "Indicado",
        criadoPorId: user.id,
        criadoPorNome: user.name,
        criadoEm: stamp,
        modificadoEm: stamp,
        modificadoPorNome: user.name,
      };

      if (user.authUserId) {
        const { error } = await supabase.from("indicacoes").insert({
          id: novaId,
          lead_nome: data.leadNome,
          empresa: data.empresa,
          telefone: data.telefone,
          email_lead: data.emailLead,
          produto: data.produto,
          email_indicador: data.emailIndicador,
          setor: data.setor,
          funcao: data.funcao,
          contrato: data.contrato,
          observacao: data.observacao,
          criado_por_id: user.authUserId,
          criado_por_nome: user.name,
          modificado_por_nome: user.name,
          status: "Indicado",
        });

        if (error)
          return { ok: false, error: `Erro ao salvar no banco de dados: ${error.message}` };
      }

      setIndicacoes((prev) => [nova, ...prev]);
      return { ok: true };
    },
    [user, countCltThisMonth],
  );

  const updateIndicacao: AppContextValue["updateIndicacao"] = useCallback(
    async (id, patch) => {
      if (!user) return { ok: false, error: "Não autenticado" };

      const previousIndicacoes = indicacoes;
      const stamp = now();

      setIndicacoes((prev) =>
        prev.map((i) =>
          i.id === id ? { ...i, ...patch, modificadoEm: stamp, modificadoPorNome: user.name } : i,
        ),
      );

      const authUserId = user.authUserId || user.id;

      if (authUserId) {
        const payload: IndicacaoUpdate = {};
        if (patch.status !== undefined) payload.status = patch.status;
        if (patch.leadNome !== undefined) payload.lead_nome = patch.leadNome;
        if (patch.empresa !== undefined) payload.empresa = patch.empresa;
        if (patch.telefone !== undefined) payload.telefone = patch.telefone;
        if (patch.emailLead !== undefined) payload.email_lead = patch.emailLead;
        if (patch.produto !== undefined) payload.produto = patch.produto;
        if (patch.observacao !== undefined) payload.observacao = patch.observacao;

        payload.modificado_por_nome = user.name;
        payload.updated_at = stamp;

        const { data: updatedRow, error } = await supabase
          .from("indicacoes")
          .update(payload)
          .eq("id", id)
          .select("*")
          .maybeSingle();

        if (error || !updatedRow) {
          setIndicacoes(previousIndicacoes);
          const message = error?.message || "Nenhuma indicação foi atualizada no banco de dados.";
          toast.error(`Erro ao atualizar no banco de dados: ${message}`);
          return { ok: false, error: message };
        }

        setIndicacoes((prev) => prev.map((i) => (i.id === id ? mapIndicacao(updatedRow) : i)));
      }

      return { ok: true };
    },
    [indicacoes, user],
  );

  const updateStatus = useCallback(
    (id: string, status: StatusIndicacao) => updateIndicacao(id, { status }),
    [updateIndicacao],
  );

  const deleteIndicacao = useCallback(async (id: string) => {
    const { error } = await supabase.from("indicacoes").delete().eq("id", id);
    if (error) {
      toast.error("Erro ao excluir do banco de dados.");
      return;
    }
    setIndicacoes((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const visibleIndicacoes = useMemo(() => {
    if (!user) return [];
    if (user.role === "usuario" || user.role === "usuario_ra") {
      return indicacoes.filter((i) => i.criadoPorId === user.id);
    }
    return indicacoes;
  }, [indicacoes, user]);

  const createContato: AppContextValue["createContato"] = useCallback(
    async (data) => {
      if (!user) return { ok: false, error: "Não autenticado" };
      if (user.role === "usuario") {
        return { ok: false, error: "Contatos são permitidos somente para Usuário RA." };
      }
      const stamp = now();
      const novoId = crypto.randomUUID();

      const novo: Contato = {
        ...data,
        id: novoId,
        criadoPorId: user.id,
        criadoPorNome: user.name,
        criadoEm: stamp,
        modificadoEm: stamp,
        modificadoPorNome: user.name,
      };

      if (user.authUserId) {
        const { error } = await supabase.from("contatos").insert({
          id: novoId,
          nome: data.nome,
          email: data.email,
          cnpj: data.cnpj,
          razao_social: data.razaoSocial,
          nome_fantasia: data.nomeFantasia,
          telefone_fixo: data.telefoneFixo,
          celular: data.celular,
          observacao: data.observacao,
          criado_por_id: user.authUserId,
          criado_por_nome: user.name,
          modificado_por_nome: user.name,
        } as any);

        if (error) return { ok: false, error: "Erro ao salvar contato no Supabase." };
      }

      setContatos((prev) => [novo, ...prev]);
      return { ok: true };
    },
    [user],
  );

  const updateContato: AppContextValue["updateContato"] = useCallback(
    async (id, patch) => {
      if (!user) return;

      if (user.authUserId) {
        const payload: any = {};
        if (patch.nome) payload.nome = patch.nome;
        if (patch.email) payload.email = patch.email;
        if (patch.cnpj) payload.cnpj = patch.cnpj;
        if (patch.razaoSocial) payload.razao_social = patch.razaoSocial;
        if (patch.nomeFantasia) payload.nome_fantasia = patch.nomeFantasia;
        if (patch.telefoneFixo) payload.telefone_fixo = patch.telefoneFixo;
        if (patch.celular) payload.celular = patch.celular;
        if (patch.observacao !== undefined) payload.observacao = patch.observacao;

        payload.modificado_por_nome = user.name;
        payload.updated_at = now();

        const { error } = await supabase.from("contatos").update(payload).eq("id", id);
        if (error) {
          toast.error("Erro ao atualizar contato no banco de dados.");
          return;
        }
      }

      setContatos((prev) =>
        prev.map((c) =>
          c.id === id ? { ...c, ...patch, modificadoEm: now(), modificadoPorNome: user.name } : c,
        ),
      );
    },
    [user],
  );

  const deleteContato = useCallback(async (id: string) => {
    const { error } = await supabase.from("contatos").delete().eq("id", id);
    if (error) {
      toast.error("Erro ao excluir contato do banco de dados.");
      return;
    }
    setContatos((prev) => prev.filter((c) => c.id !== id));
  }, []);

  const visibleContatos = useMemo(() => {
    if (!user) return [];
    if (user.role === "usuario") return [];
    if (user.role === "usuario_ra") {
      return contatos.filter((c) => c.criadoPorId === user.id);
    }
    return contatos;
  }, [contatos, user]);

  const value: AppContextValue = useMemo(
    () => ({
      user,
      authLoading,
      users,
      login,
      registerUser,
      updateProfile,
      refreshData,
      logout,
      indicacoes,
      visibleIndicacoes,
      createIndicacao,
      updateIndicacao,
      updateStatus,
      deleteIndicacao,
      countCltThisMonth,
      creditoAtual,
      contatos,
      visibleContatos,
      createContato,
      updateContato,
      deleteContato,
    }),
    [
      user,
      authLoading,
      users,
      login,
      registerUser,
      updateProfile,
      refreshData,
      logout,
      indicacoes,
      visibleIndicacoes,
      createIndicacao,
      updateIndicacao,
      updateStatus,
      deleteIndicacao,
      countCltThisMonth,
      creditoAtual,
      contatos,
      visibleContatos,
      createContato,
      updateContato,
      deleteContato,
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
