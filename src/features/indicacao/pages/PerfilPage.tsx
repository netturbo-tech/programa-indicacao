import { useMemo, useRef, useState, useEffect, useCallback } from "react";
import { useApp, LEVELS } from "../AppContext";
import { 
  Rocket, 
  Handshake, 
  Target, 
  Flame, 
  Heart, 
  Calendar, 
  Globe, 
  Lock, 
  CheckCircle2, 
  TrendingUp,
  ChevronRight,
  User as UserIcon,
  Briefcase,
  Building2,
  FileText,
  CreditCard,
  Camera,
  Search,
  Users,
  Zap,
  ThermometerSun,
  Users as UsersIcon
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar } from "../components/Avatar";
import { Link } from "@tanstack/react-router";
import { STATUS_STYLES } from "../types";
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from "@/components/ui/tooltip";
import { toast } from "sonner";
import { CONTRATOS, SETORES, type Contrato, type Setor } from "../types";
import type { Role } from "../types";
import { supabase } from "@/integrations/supabase/client";
import { PrimaryButton } from "../components/PrimaryButton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

function maskCpf(value: string) {
  const d = value.replace(/\D/g, "").slice(0, 11);
  return d
    .replace(/^(\d{3})(\d)/, "$1.$2")
    .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1-$2");
}

function normalizeSetor(value: string | undefined): Setor {
  const normalized = value?.trim().toUpperCase();
  return SETORES.find((setor) => setor.toUpperCase() === normalized) ?? "COMERCIAL";
}

function normalizeContrato(value: string | undefined): Contrato {
  const normalized = value?.trim().toUpperCase();
  return CONTRATOS.find((contrato) => contrato === normalized) ?? "CLT";
}

interface SearchableUser {
  userId: string;
  name: string;
  email: string;
  setor: string;
  contrato: string;
  funcao: string;
  ra: string;
  cpf: string;
  role: string;
}

export function PerfilPage() {
  const { user, indicacoes, contatos, meta, setMeta, avatar, setAvatar, updateProfile, getAvatar } = useApp();
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    ra: "",
    cpf: "",
    funcao: "",
    setor: "COMERCIAL" as Setor,
    contrato: "CLT" as Contrato,
  });

  // Aprovador: user search state
  const isAprovador = user?.role === "aprovador";
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchableUser[]>([]);
  const [allSearchableUsers, setAllSearchableUsers] = useState<SearchableUser[]>([]);
  const [selectedUser, setSelectedUser] = useState<SearchableUser | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Load all users for aprovador
  useEffect(() => {
    if (!isAprovador) return;
    setLoadingUsers(true);
    
    Promise.all([
      supabase
        .from("profiles")
        .select("user_id, name, email, setor, contrato, funcao, ra, cpf")
        .order("name", { ascending: true }),
      supabase
        .from("user_roles")
        .select("user_id, role")
    ]).then(([profilesRes, rolesRes]) => {
      if (profilesRes.data && rolesRes.data) {
        const rolesMap = new Map(rolesRes.data.map(r => [r.user_id, r.role]));
        
        setAllSearchableUsers(
          profilesRes.data.map((p) => ({
            userId: p.user_id,
            name: p.name || "",
            email: p.email || "",
            setor: p.setor || "",
            contrato: p.contrato || "",
            funcao: p.funcao || "",
            ra: p.ra || "",
            cpf: p.cpf || "",
            role: rolesMap.get(p.user_id) || "usuario",
          }))
        );
      }
      setLoadingUsers(false);
    });
  }, [isAprovador]);

  // Filter users based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const q = searchQuery.toLowerCase();
    setSearchResults(
      allSearchableUsers.filter(
        (u) =>
          u.name.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q)
      ).slice(0, 8)
    );
  }, [searchQuery, allSearchableUsers]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSelectUser = useCallback((u: SearchableUser) => {
    setSelectedUser(u);
    setSearchQuery(u.name);
    setShowDropdown(false);
    setIsEditing(false);
  }, []);

  // The "target" user whose profile is being displayed
  const targetUser = isAprovador && selectedUser
    ? {
        id: selectedUser.userId,
        authUserId: selectedUser.userId,
        name: selectedUser.name,
        email: selectedUser.email,
        setor: selectedUser.setor as Setor,
        contrato: selectedUser.contrato as Contrato,
        funcao: selectedUser.funcao,
        ra: selectedUser.ra,
        cpf: selectedUser.cpf,
        role: selectedUser.role as Role,
      }
    : user;

  const targetAvatar = isAprovador && selectedUser
    ? getAvatar(selectedUser.userId)
    : avatar;

  const isViewingOther = isAprovador && selectedUser !== null;

  useEffect(() => {
    if (!targetUser) return;
    // Don't sync form for aprovador viewing someone else
    if (isViewingOther) return;

    const nextForm = {
      name: targetUser.name,
      email: targetUser.email,
      ra: targetUser.ra || "",
      cpf: targetUser.cpf || "",
      funcao: targetUser.funcao || "",
      setor: normalizeSetor(targetUser.setor),
      contrato: normalizeContrato(targetUser.contrato),
    };

    setForm(nextForm);

    supabase
      .from("profiles")
      .select("name, email, ra, cpf, funcao, setor, contrato")
      .eq("user_id", targetUser.id)
      .maybeSingle()
      .then(({ data }) => {
        if (!data) return;
        setForm({
          name: data.name || nextForm.name,
          email: data.email || nextForm.email,
          ra: data.ra || "",
          cpf: data.cpf || "",
          funcao: data.funcao || "",
          setor: normalizeSetor(data.setor),
          contrato: normalizeContrato(data.contrato),
        });
      });
  }, [targetUser?.id, isViewingOther]);

  const handleSaveProfile = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!form.name.trim() || !form.setor || !form.contrato) {
      toast.error("Preencha Nome Completo, Seu Setor e Tipo de Contrato.");
      return;
    }

    setSaving(true);
    const result = await updateProfile(form);
    setSaving(false);

    if (!result.ok) {
      toast.error(result.error || "Erro ao salvar configurações.");
      return;
    }

    toast.success("Configurações salvas com sucesso.");
    setIsEditing(false);
  };
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error("A imagem deve ter no máximo 10MB.");
      return;
    }

    const reader = new FileReader();
    
    // Se a imagem for menor que 2.5MB, não aplicamos nenhuma compressão de canvas para manter 100% da qualidade original
    if (file.size <= 2.5 * 1024 * 1024) {
      reader.onloadend = () => {
        setAvatar(reader.result as string);
        toast.success("Foto de perfil atualizada!");
      };
      reader.readAsDataURL(file);
      return;
    }

    // Para imagens maiores, usamos o canvas para downscale seguro
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX_WIDTH = 1200; // Resolução ainda maior
        const MAX_HEIGHT = 1200;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        
        if (ctx) {
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = "high";
          ctx.drawImage(img, 0, 0, width, height);
          
          const dataUrl = canvas.toDataURL("image/jpeg", 0.95); // Qualidade 95%
          setAvatar(dataUrl);
          toast.success("Foto de perfil atualizada!");
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const userIndicacoes = useMemo(() => {
    if (!targetUser) return [];
    return indicacoes.filter(i => i.criadoPorId === targetUser.id);
  }, [indicacoes, targetUser]);

  const userContatos = useMemo(() => {
    if (!targetUser) return [];
    return contatos.filter(c => c.criadoPorId === targetUser.id);
  }, [contatos, targetUser]);

  if (!user) return null;

  // Aprovador sem seleção: mostrar tela de busca
  if (isAprovador && !selectedUser) {
    return (
      <div className="space-y-8 animate-in fade-in duration-700">
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-8">
          <div className="text-center space-y-3">
            <div className="h-20 w-20 rounded-2xl bg-primary-container/10 border border-primary-container/20 grid place-items-center mx-auto mb-4">
              <UsersIcon className="h-10 w-10 text-primary-container" />
            </div>
            <h1 className="text-2xl font-display font-bold text-white uppercase tracking-tight">Consultar Perfil</h1>
            <p className="text-sm text-outline max-w-md">
              Busque um colaborador pelo nome ou e-mail para visualizar o perfil completo, indicações e conquistas.
            </p>
          </div>

          <div ref={searchRef} className="relative w-full max-w-md">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-outline" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowDropdown(true);
                }}
                onFocus={() => setShowDropdown(true)}
                placeholder="Digite o nome ou e-mail do colaborador..."
                className="w-full bg-surface-low border border-outline-variant/20 rounded-2xl pl-12 pr-4 py-4 text-sm text-white placeholder:text-outline/60 focus:outline-none focus:border-primary-container/50 focus:ring-1 focus:ring-primary-container/20 transition-all"
              />
            </div>

            {showDropdown && searchResults.length > 0 && (
              <div className="absolute top-full mt-2 w-full bg-surface-low border border-outline-variant/20 rounded-2xl overflow-hidden shadow-2xl shadow-black/60 z-50 max-h-80 overflow-y-auto custom-scrollbar">
                {searchResults.map((u) => (
                  <button
                    key={u.userId}
                    onClick={() => handleSelectUser(u)}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-primary-container/5 transition-colors text-left border-b border-outline-variant/5 last:border-b-0"
                  >
                    <Avatar name={u.name} size="sm" src={getAvatar(u.userId)} className="shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-white truncate">{u.name}</p>
                      <p className="text-[10px] text-outline truncate">{u.email}</p>
                    </div>
                    <span className="text-[8px] font-black uppercase tracking-widest text-outline ml-auto shrink-0">{u.setor}</span>
                  </button>
                ))}
              </div>
            )}

            {showDropdown && searchQuery.trim() && searchResults.length === 0 && !loadingUsers && (
              <div className="absolute top-full mt-2 w-full bg-surface-low border border-outline-variant/20 rounded-2xl overflow-hidden shadow-2xl shadow-black/60 z-50">
                <div className="px-4 py-6 text-center text-outline text-sm italic">
                  Nenhum colaborador encontrado.
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Cálculos de Indicações
  const totalIndicacoes = userIndicacoes.length;
  const conversoes = userIndicacoes.filter(i => i.status === "Contrato assinado").length;
  const taxaConversao = totalIndicacoes > 0 ? (conversoes / totalIndicacoes) * 100 : 0;
  const creditoAcumulado = conversoes * 200;

  // Nível Atual
  const currentLevel = LEVELS.find(l => conversoes >= l.min && conversoes <= l.max) || LEVELS[0];

  const nextLevel = (() => {
    const currentIndex = LEVELS.findIndex(l => l.name === currentLevel.name);
    return LEVELS[currentIndex + 1] || null;
  })();

  const progressToNext = (() => {
    if (!nextLevel) return 100;
    const range = nextLevel.min - currentLevel.min;
    const currentProgress = conversoes - currentLevel.min;
    return Math.min(Math.max((currentProgress / range) * 100, 0), 100);
  })();

  // Conversoes Trimestre Atual
  const conversoesTrimestre = (() => {
    const now = new Date();
    const quarter = Math.floor(now.getMonth() / 3);
    const startOfQuarter = new Date(now.getFullYear(), quarter * 3, 1);
    return userIndicacoes.filter(i => {
      const date = new Date(i.criadoEm);
      return i.status === "Contrato assinado" && date >= startOfQuarter;
    }).length;
  })();

  // Conquistas
  const displayUser = targetUser!;
  const achievements = (() => {
    const uniqueProducts = new Set(userIndicacoes.map(i => i.produto)).size;
    
    const hasPerfectMonth = displayUser.contrato === "CLT" && (() => {
      const months: Record<string, number> = {};
      userIndicacoes.forEach(i => {
        if (i.status === "Contrato assinado") {
          const d = new Date(i.criadoEm);
          const key = `${d.getFullYear()}-${d.getMonth()}`;
          months[key] = (months[key] || 0) + 1;
        }
      });
      return Object.values(months).some(count => count >= 2);
    })();

    const isRA = displayUser.role === "usuario_ra";
    const totalContatos = userContatos.length;

    const baseAchievements = [
      { id: "1st", title: "Primeira Indicação", icon: Rocket, unlocked: totalIndicacoes >= 1, description: "Crie a sua 1ª indicação no sistema." },
      { id: "1st_contract", title: "Primeiro Contrato", icon: Handshake, unlocked: conversoes >= 1, description: "Tenha pelo menos 1 indicação com status 'Contrato assinado'." },
      { id: "hat_trick", title: "Hat-Trick", icon: Target, unlocked: conversoes >= 3, description: "Alcance 3 conversões confirmadas." },
      { id: "conector", title: "Conector", icon: () => <span className="text-xl">🦖</span>, unlocked: conversoes >= 3, description: "Atinga o nível Conector (3+ conversões)." },
      { id: "acelerador", title: "Acelerador", icon: Flame, unlocked: conversoes >= 7, description: "Atinga o nível Acelerador (7+ conversões)." },
      { id: "sangue_verde", title: "Sangue Verde", icon: Heart, unlocked: conversoes >= 13, description: "Atinga o nível Sangue Verde (13+ conversões)." },
      { id: "perfect_month", title: "Mês Perfeito", icon: Calendar, unlocked: hasPerfectMonth, info: "Apenas CLT", description: "Consiga 2 conversões em um único mês (Exclusivo CLT)." },
      { id: "diversified", title: "Diversificado", icon: Globe, unlocked: uniqueProducts >= 3, description: "Tenha indicações em pelo menos 3 produtos diferentes." },
    ];

    const raAchievements = [
      { id: "ra_pioneer", title: "Pioneiro RA", icon: Zap, unlocked: totalContatos >= 1, info: "Exclusivo RA", description: "Registre o seu 1º Contato Quente no sistema." },
      { id: "ra_network", title: "Rede de Contatos", icon: Users, unlocked: totalContatos >= 5, info: "Exclusivo RA", description: "Alcance a marca de 5 Contatos Quentes registrados." },
      { id: "ra_master", title: "Mestre dos Contatos", icon: ThermometerSun, unlocked: totalContatos >= 10, info: "Exclusivo RA", description: "Alcance a marca de 10 Contatos Quentes registrados." },
    ];

    return [...baseAchievements, ...(isRA ? raAchievements : [])];
  })();

  return (
    <div className="w-full max-w-full min-w-0 space-y-6 sm:space-y-8 overflow-x-hidden animate-in fade-in duration-700">
      {/* Aprovador: Search bar when viewing a profile */}
      {isViewingOther && (
        <div className="flex items-center gap-4">
          <button
            onClick={() => {
              setSelectedUser(null);
              setSearchQuery("");
            }}
            className="text-[10px] font-black uppercase tracking-widest text-primary-container hover:underline shrink-0 flex items-center gap-1"
          >
            <ChevronRight className="h-3 w-3 rotate-180" /> Voltar
          </button>
          <div ref={searchRef} className="relative flex-1 max-w-sm">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-outline" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowDropdown(true);
                  if (e.target.value !== selectedUser?.name) {
                    // Don't deselect yet, just show results
                  }
                }}
                onFocus={() => setShowDropdown(true)}
                placeholder="Buscar outro colaborador..."
                className="w-full bg-surface-low border border-outline-variant/20 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder:text-outline/60 focus:outline-none focus:border-primary-container/50 transition-all"
              />
            </div>
            {showDropdown && searchResults.length > 0 && (
              <div className="absolute top-full mt-2 w-full bg-surface-low border border-outline-variant/20 rounded-2xl overflow-hidden shadow-2xl shadow-black/60 z-50 max-h-64 overflow-y-auto custom-scrollbar">
                {searchResults.map((u) => (
                  <button
                    key={u.userId}
                    onClick={() => handleSelectUser(u)}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-primary-container/5 transition-colors text-left border-b border-outline-variant/5 last:border-b-0"
                  >
                    <Avatar name={u.name} size="sm" src={getAvatar(u.userId)} className="shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-white truncate">{u.name}</p>
                      <p className="text-[10px] text-outline truncate">{u.email}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Header Mobile - Nome e Nível */}
      <div className="lg:hidden flex min-w-0 items-center justify-between overflow-hidden bg-surface-low p-3 sm:p-4 rounded-2xl border border-outline-variant/10">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
          <Avatar 
            name={displayUser.name} 
            size="sm" 
            src={targetAvatar} 
            className={cn("ring-2 h-10 w-10 shrink-0", currentLevel.border)} 
          />
          <div className="min-w-0">
            <h1 className="text-white font-bold text-sm sm:text-lg truncate">{displayUser.name}</h1>
            <span className={cn("text-[8px] sm:text-xs font-black uppercase tracking-wider flex items-center gap-1", currentLevel.color)}>
              {currentLevel.icon} {currentLevel.name}
            </span>
          </div>
        </div>
        <div className="min-w-0 text-right shrink-0 pl-2">
          <p className="text-[8px] text-outline uppercase font-black tracking-widest">Crédito</p>
          <p className="text-primary-container font-display font-bold text-sm sm:text-lg leading-tight">
            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(creditoAcumulado)}
          </p>
        </div>
      </div>

      <div className="grid min-w-0 grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
        {/* Coluna Esquerda - Identidade */}
        <div className="min-w-0 lg:col-span-4 space-y-6">
          <div className="min-w-0 bg-surface-low rounded-2xl sm:rounded-3xl border border-outline-variant/10 overflow-hidden shadow-2xl shadow-black/40">
            <div className={cn("h-32 w-full opacity-20", currentLevel.bg)} />
            <div className="px-5 sm:px-8 pb-8 -mt-16 flex flex-col items-center text-center">
              <div 
                className={cn("relative group", !isViewingOther && "cursor-pointer")}
                onClick={() => !isViewingOther && fileInputRef.current?.click()}
                title={isViewingOther ? displayUser.name : "Clique para mudar a foto"}
              >
                <div className={cn("absolute inset-0 rounded-full blur-2xl opacity-40 transition-all duration-500 group-hover:opacity-70", currentLevel.bg)} />
                <Avatar 
                  name={displayUser.name} 
                  size="lg" 
                  src={targetAvatar}
                  className={cn("h-24 w-24 sm:h-32 sm:w-32 text-4xl ring-4 ring-surface-low relative z-10 transition-transform duration-500 group-hover:scale-105", currentLevel.bg)} 
                />
                
                {/* Overlay de Edição - only for own profile */}
                {!isViewingOther && (
                  <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col items-center justify-center z-20 backdrop-blur-[2px]">
                    <Camera className="text-white h-8 w-8 mb-1 animate-in zoom-in duration-300" />
                    <span className="text-[8px] text-white font-black uppercase tracking-widest">Editar</span>
                  </div>
                )}

                <div className="absolute -bottom-2 -right-2 bg-surface-highest border border-outline-variant/20 rounded-full h-10 w-10 grid place-items-center z-30 shadow-lg">
                  <span className="text-xl">{currentLevel.icon}</span>
                </div>
              </div>

              <input 
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleAvatarChange}
              />

              <div className="mt-6 w-full min-w-0 space-y-1">
                <h2 className="max-w-full break-words text-xl sm:text-2xl font-display font-bold text-white uppercase tracking-tight">{displayUser.name}</h2>
                <p className="max-w-full break-all text-outline text-xs sm:text-sm font-medium">{displayUser.email}</p>
                <div className={cn("inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mt-2 border", currentLevel.border, currentLevel.color)}>
                  {currentLevel.icon} {currentLevel.name}
                </div>
              </div>

              <div className="w-full h-px bg-outline-variant/10 my-8" />

              <div className="w-full space-y-4">
                {isEditing && !isViewingOther ? (
                  <form onSubmit={handleSaveProfile} className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                    <EditorialField
                      label="Nome Completo *"
                      value={form.name}
                      onChange={(v) => setForm({ ...form, name: v })}
                    />
                    <EditorialField
                      label="Email"
                      value={form.email}
                      onChange={() => undefined}
                      readOnly
                    />
                    <EditorialField
                      label="RA"
                      value={form.ra}
                      onChange={(v) => setForm({ ...form, ra: v })}
                      readOnly={!!user.ra}
                    />
                    <EditorialField
                      label="CPF"
                      value={form.cpf}
                      onChange={(v) => setForm({ ...form, cpf: maskCpf(v) })}
                    />
                    <EditorialField
                      label="Sua Função"
                      value={form.funcao}
                      onChange={(v) => setForm({ ...form, funcao: v })}
                    />
                    <EditorialSelect
                      label="Seu Setor *"
                      value={form.setor}
                      onChange={(v) => setForm({ ...form, setor: v as Setor })}
                      options={SETORES}
                    />
                    <EditorialSelect
                      label="Tipo de Contrato *"
                      value={form.contrato}
                      onChange={(v) => setForm({ ...form, contrato: v as Contrato })}
                      options={CONTRATOS}
                    />
                    <div className="pt-2 flex items-center justify-end gap-2">
                      <button 
                        type="button" 
                        onClick={() => setIsEditing(false)}
                        className="text-[10px] font-black uppercase tracking-widest text-outline hover:text-white transition-colors px-3 py-2"
                      >
                        Cancelar
                      </button>
                      <PrimaryButton disabled={saving} type="submit" className="px-4 py-2 text-[10px]">
                        {saving ? "Salvando..." : "Salvar"}
                      </PrimaryButton>
                    </div>
                  </form>
                ) : (
                  <>
                    {!isViewingOther && (
                      <div className="flex justify-end mb-4">
                        <button 
                          onClick={() => setIsEditing(true)}
                          className="text-[10px] font-black uppercase tracking-widest text-primary-container hover:underline"
                        >
                          Editar Perfil
                        </button>
                      </div>
                    )}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between text-left gap-4">
                        <div className="flex items-center gap-3 text-outline shrink-0">
                          <Building2 className="h-4 w-4" />
                          <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider">Setor</span>
                        </div>
                        <span className="min-w-0 text-right text-white text-xs sm:text-sm font-bold truncate">{displayUser.setor}</span>
                      </div>
                      <div className="flex items-center justify-between text-left gap-4">
                        <div className="flex items-center gap-3 text-outline shrink-0">
                          <FileText className="h-4 w-4" />
                          <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider">Contrato</span>
                        </div>
                        <span className="min-w-0 text-right text-white text-xs sm:text-sm font-bold truncate">{displayUser.contrato}</span>
                      </div>
                      <div className="flex items-center justify-between text-left gap-4">
                        <div className="flex items-center gap-3 text-outline shrink-0">
                          <Briefcase className="h-4 w-4" />
                          <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider">Função</span>
                        </div>
                        <span className="min-w-0 text-right text-white text-xs sm:text-sm font-bold truncate">{displayUser.funcao || "-"}</span>
                      </div>
                    </div>
                  </>
                )}
              </div>

              <div className="w-full min-w-0 mt-8 p-4 sm:p-6 rounded-2xl bg-surface-high/50 border border-outline-variant/10">
                <p className="text-[8px] sm:text-[10px] text-outline uppercase font-black tracking-widest mb-1">Total de Créditos</p>
                <p className="break-words text-xl sm:text-3xl font-display font-bold text-primary-container leading-tight">
                   {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(creditoAcumulado)}
                </p>
              </div>
            </div>
          </div>
 
          {/* Meta Pessoal */}
          <div className="min-w-0 bg-surface-low rounded-2xl sm:rounded-3xl border border-outline-variant/10 p-4 sm:p-8 space-y-4 sm:space-y-6">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-xl bg-primary-container/10 border border-primary-container/20 grid place-items-center shrink-0">
                  <Target className="h-4 w-4 sm:h-5 sm:w-5 text-primary-container" />
                </div>
                <h3 className="font-display font-bold text-white uppercase tracking-tight text-sm sm:text-base truncate">Minha Meta</h3>
              </div>
              <div className="relative">
                <input 
                  type="number" 
                  value={meta}
                  onChange={(e) => setMeta(Math.max(1, parseInt(e.target.value) || 0))}
                  className="w-16 bg-surface-high border border-outline-variant/20 rounded-lg px-2 py-1 text-right text-primary-container font-bold text-sm focus:outline-none focus:border-primary-container/50"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-2xl font-display font-bold text-white">
                    {conversoesTrimestre} <span className="text-outline text-sm font-body">/ {meta}</span>
                  </p>
                  <p className="text-[10px] text-outline uppercase font-black tracking-wider">Conversões no trimestre</p>
                </div>
                <div className="text-right">
                  <span className="text-primary-container font-bold text-sm">
                    {Math.round((conversoesTrimestre / meta) * 100)}%
                  </span>
                </div>
              </div>

              <div className="h-3 w-full bg-surface-highest rounded-full overflow-hidden p-0.5 border border-outline-variant/10">
                <div 
                  className="h-full bg-primary-container rounded-full shadow-[0_0_10px_rgba(202,253,0,0.5)] transition-all duration-1000"
                  style={{ width: `${Math.min((conversoesTrimestre / meta) * 100, 100)}%` }}
                />
              </div>

              <p className="text-xs text-outline italic text-center px-4">
                {conversoesTrimestre / meta < 0.5 ? "Continue! Você está construindo seu caminho." : 
                 conversoesTrimestre / meta < 1 ? `Quase lá! Mais ${meta - conversoesTrimestre} conversões para bater a meta.` : 
                 "🎉 Meta batida! Considere aumentar o desafio."}
              </p>
            </div>
          </div>
        </div>

        {/* Coluna Direita - Stats e Histórico */}
        <div className="min-w-0 lg:col-span-8 space-y-6 sm:space-y-8">
          {/* KPI Cards */}
          <div className="grid min-w-0 grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            {[
              { label: "Total Indicações", value: totalIndicacoes, icon: Rocket },
              { label: "Conversões", value: conversoes, icon: Handshake },
              { label: "Taxa de Conversão", value: `${Math.round(taxaConversao)}%`, icon: TrendingUp },
              { label: "Crédito Acumulado", value: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(creditoAcumulado), icon: CreditCard },
            ].map((kpi, i) => (
              <div key={i} className="min-w-0 bg-surface-low p-3 sm:p-5 rounded-2xl border border-outline-variant/10 hover:border-primary-container/20 transition-all group">
                <kpi.icon className="h-4 w-4 sm:h-5 sm:w-5 text-outline group-hover:text-primary-container mb-2 sm:mb-3 transition-colors" />
                <p className="break-words text-base sm:text-2xl font-display font-bold text-white mb-0.5 sm:mb-1 tracking-tight leading-tight">{kpi.value}</p>
                <p className="text-[8px] sm:text-[10px] text-outline uppercase font-black tracking-wider leading-tight">{kpi.label}</p>
              </div>
            ))}
          </div>

          {/* Evolução de Nível */}
          <div className="min-w-0 bg-surface-low rounded-2xl sm:rounded-3xl border border-outline-variant/10 p-4 sm:p-8 overflow-hidden">
            <h3 className="font-display font-bold text-white uppercase tracking-tight mb-6 sm:mb-8 text-sm sm:text-base">Evolução de Nível</h3>
            
            <div className="pb-6">
              <div className="relative mb-8 sm:mb-10 px-3 sm:px-12">
                <div className="absolute top-4 sm:top-5 left-8 sm:left-12 right-8 sm:right-12 h-1 bg-surface-highest -translate-y-1/2 rounded-full" />
                <div 
                  className="absolute top-4 sm:top-5 left-8 sm:left-12 h-1 bg-primary-container -translate-y-1/2 rounded-full transition-all duration-1000 shadow-[0_0_15px_rgba(202,253,0,0.3)]" 
                  style={{ width: `calc(${(LEVELS.findIndex(l => l.name === currentLevel.name) / (LEVELS.length - 1)) * 100}% - ${(LEVELS.findIndex(l => l.name === currentLevel.name) / (LEVELS.length - 1)) * 96}px)` }}
                />
                
                <div className="relative flex justify-between">
                {LEVELS.map((lvl, i) => {
                  const isPast = conversoes >= lvl.min && lvl.name !== currentLevel.name;
                  const isCurrent = lvl.name === currentLevel.name;
                  
                  return (
                    <div key={lvl.name} className="flex min-w-0 flex-col items-center gap-2 sm:gap-3 relative">
                      <div className={cn(
                        "h-8 w-8 sm:h-10 sm:w-10 rounded-full border-2 sm:border-4 ring-4 sm:ring-8 ring-surface-low grid place-items-center z-10 transition-all duration-500",
                        isPast ? "bg-primary-container border-primary-container" : 
                        isCurrent ? "bg-surface-low border-primary-container animate-pulse shadow-[0_0_20px_rgba(202,253,0,0.4)]" : 
                        "bg-surface-highest border-surface-highest"
                      )}>
                        {isPast ? <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-on-primary-container" /> : <span className="text-sm sm:text-lg">{lvl.icon}</span>}
                      </div>
                      <div className="min-w-0 text-center w-14 sm:w-28">
                        <p className={cn(
                          "break-words text-[7px] sm:text-[9px] font-black uppercase tracking-wider leading-none",
                          isCurrent ? lvl.color : "text-outline"
                        )}>
                          {lvl.name}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            </div>

            <div className="mt-16 space-y-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:justify-between sm:items-end">
                <p className="text-sm text-outline">
                  {nextLevel ? (
                    <>Faltam <span className="text-primary-container font-bold">{nextLevel.min - conversoes}</span> conversões para o próximo nível</>
                  ) : (
                    "Você atingiu o nível máximo! Parabéns!"
                  )}
                </p>
                {nextLevel && (
                  <span className="text-xs font-black uppercase tracking-widest text-outline">
                    Próximo: {nextLevel.name}
                  </span>
                )}
              </div>
              <div className="h-2 w-full bg-surface-highest rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary-container rounded-full transition-all duration-1000"
                  style={{ width: `${progressToNext}%` }}
                />
              </div>
            </div>
          </div>

          {/* Conquistas */}
          <div className="min-w-0 bg-surface-low rounded-2xl sm:rounded-3xl border border-outline-variant/10 p-4 sm:p-8 overflow-hidden">
            <h3 className="font-display font-bold text-white uppercase tracking-tight mb-6 text-sm sm:text-base">Conquistas</h3>
            <div className="grid min-w-0 grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              {achievements.map((ach) => (
                <Tooltip key={ach.id}>
                  <TooltipTrigger asChild>
                    <div 
                      role="button"
                      tabIndex={0}
                      className={cn(
                        "relative min-w-0 p-3 sm:p-4 rounded-2xl border transition-all duration-300 flex flex-col items-center text-center gap-2 overflow-hidden cursor-help outline-none focus-visible:ring-2 focus-visible:ring-primary-container/50",
                        ach.unlocked 
                          ? "bg-primary-container/5 border-primary-container/20" 
                          : "bg-surface-high/30 border-outline-variant/5 grayscale opacity-60"
                      )}
                    >
                      <div className={cn(
                        "h-12 w-12 rounded-xl grid place-items-center mb-1",
                        ach.unlocked ? "bg-primary-container/10 text-primary-container shadow-[0_0_20px_rgba(202,253,0,0.1)]" : "bg-surface-highest text-outline"
                      )}>
                        <ach.icon className="h-6 w-6" />
                      </div>
                      <p className="max-w-full break-words text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-white leading-tight min-h-8 flex items-center">
                        {ach.title}
                      </p>
                      {!ach.unlocked && (
                        <div className="absolute top-2 right-2">
                          <Lock className="h-3 w-3 text-outline" />
                        </div>
                      )}
                      {ach.unlocked && (
                        <div className="absolute top-2 right-2">
                          <CheckCircle2 className="h-3 w-3 text-primary-container" />
                        </div>
                      )}
                      {ach.info && <p className="text-[8px] text-outline-variant uppercase">{ach.info}</p>}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="bg-surface-highest border border-outline-variant/20 text-white p-3 max-w-[200px] text-center space-y-1 shadow-2xl z-[100]">
                    <p className="font-bold uppercase tracking-widest text-[9px] text-primary-container">
                      {ach.unlocked ? "Conquistado" : "Como desbloquear"}
                    </p>
                    <p className="text-xs font-medium leading-relaxed">
                      {ach.description}
                    </p>
                  </TooltipContent>
                </Tooltip>
              ))}
            </div>
          </div>

          {/* Histórico Resumido */}
          <div className="min-w-0 bg-surface-low rounded-2xl sm:rounded-3xl border border-outline-variant/10 overflow-hidden">
            <div className="p-4 sm:p-8 sm:pb-4 flex items-center justify-between gap-3">
              <h3 className="min-w-0 font-display font-bold text-white uppercase tracking-tight text-sm sm:text-base">Últimas Indicações</h3>
              <Link 
                to="/app/indicacoes" 
                className="shrink-0 text-[10px] sm:text-xs font-black uppercase tracking-widest text-primary-container hover:underline flex items-center gap-1"
              >
                Ver todas <ChevronRight className="h-3 w-3" />
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-outline-variant/10">
                    <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-outline">Lead</th>
                    <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-outline">Produto</th>
                    <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-outline">Status</th>
                    <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-outline text-right">Criado em</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/5">
                  {userIndicacoes.slice(0, 5).map((ind) => {
                    const style = STATUS_STYLES[ind.status];
                    return (
                      <tr key={ind.id} className="hover:bg-surface-high/30 transition-colors group">
                        <td className="px-8 py-4">
                          <p className="text-sm font-bold text-white group-hover:text-primary-container transition-colors">{ind.leadNome}</p>
                          <p className="text-[10px] text-outline uppercase">{ind.empresa}</p>
                        </td>
                        <td className="px-8 py-4">
                          <span className="text-xs text-white font-medium">{ind.produto}</span>
                        </td>
                        <td className="px-8 py-4">
                          <div className={cn("inline-flex items-center gap-2 px-2 py-1 rounded-md border text-[10px] font-black uppercase tracking-tighter", style.bg, style.text, style.border)}>
                            <div className={cn("h-1.5 w-1.5 rounded-full", style.dot)} />
                            {ind.status}
                          </div>
                        </td>
                        <td className="px-8 py-4 text-right">
                          <span className="text-xs text-outline tabular-nums">
                            {new Date(ind.criadoEm).toLocaleDateString('pt-BR')}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                  {userIndicacoes.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-8 py-12 text-center text-outline text-sm italic">
                        Nenhuma indicação encontrada.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function EditorialField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  readOnly = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  readOnly?: boolean;
}) {
  return (
    <div className="group space-y-1">
      <label className="block text-[9px] font-black uppercase tracking-[0.2em] text-outline transition-colors group-focus-within:text-primary-container">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        readOnly={readOnly}
        className="w-full border-0 border-b border-outline-variant/30 bg-transparent px-0 py-1 text-xs font-bold text-white caret-primary-container outline-none transition-all placeholder:text-outline-variant/50 read-only:cursor-not-allowed read-only:text-on-surface-variant read-only:focus:border-outline-variant/30 focus:border-primary-container focus:outline-none focus:ring-0"
      />
    </div>
  );
}

function EditorialSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: readonly string[];
  onChange: (v: string) => void;
}) {
  const displayOptions = options.includes(value) || !value ? options : [value, ...options];

  return (
    <div className="group space-y-1">
      <label className="block text-[9px] font-black uppercase tracking-[0.2em] text-outline transition-colors group-focus-within:text-primary-container">
        {label}
      </label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="h-auto w-full rounded-none border-0 border-b border-outline-variant/30 bg-transparent px-0 py-1 text-xs font-bold text-white shadow-none outline-none transition-colors hover:border-primary-container/50 focus:border-primary-container focus:outline-none focus:ring-0 data-[state=open]:border-primary-container [&>svg]:text-outline [&>svg]:opacity-60">
          <SelectValue placeholder="Selecione">{value || "Selecione"}</SelectValue>
        </SelectTrigger>
        <SelectContent
          position="popper"
          sideOffset={6}
          className="max-h-72 min-w-[--radix-select-trigger-width] rounded-xl border border-outline-variant/20 bg-surface-low p-1.5 text-on-surface shadow-2xl shadow-black/60 backdrop-blur-xl z-[200]"
        >
          {displayOptions.map((o) => (
            <SelectItem
              key={o}
              value={o}
              className="cursor-pointer rounded-md px-3 py-2 text-xs font-bold uppercase tracking-widest text-on-surface-variant transition-colors focus:bg-primary-container/15 focus:text-primary-container data-[state=checked]:bg-primary-container/20 data-[state=checked]:text-primary-container"
            >
              {o}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
