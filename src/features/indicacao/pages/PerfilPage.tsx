import { useMemo, useRef } from "react";
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
  Camera
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

export function PerfilPage() {
  const { user, indicacoes, meta, setMeta, avatar, setAvatar } = useApp();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error("A imagem deve ter no máximo 2MB.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatar(reader.result as string);
      toast.success("Foto de perfil atualizada!");
    };
    reader.readAsDataURL(file);
  };

  const userIndicacoes = useMemo(() => {
    if (!user) return [];
    return indicacoes.filter(i => i.criadoPorId === user.id);
  }, [indicacoes, user]);

  if (!user) return null;

  // Cálculos de Indicações (Apenas do usuário logado)
  const totalIndicacoes = userIndicacoes.length;
  const conversoes = userIndicacoes.filter(i => i.status === "Contrato assinado").length;
  const taxaConversao = totalIndicacoes > 0 ? (conversoes / totalIndicacoes) * 100 : 0;
  const creditoAcumulado = conversoes * 200;

  // Nível Atual
  const currentLevel = useMemo(() => {
    return LEVELS.find(l => conversoes >= l.min && conversoes <= l.max) || LEVELS[0];
  }, [conversoes]);

  const nextLevel = useMemo(() => {
    const currentIndex = LEVELS.findIndex(l => l.name === currentLevel.name);
    return LEVELS[currentIndex + 1] || null;
  }, [currentLevel]);

  const progressToNext = useMemo(() => {
    if (!nextLevel) return 100;
    const range = nextLevel.min - currentLevel.min;
    const currentProgress = conversoes - currentLevel.min;
    return Math.min(Math.max((currentProgress / range) * 100, 0), 100);
  }, [conversoes, currentLevel, nextLevel]);

  // Conversoes Trimestre Atual
  const conversoesTrimestre = useMemo(() => {
    const now = new Date();
    const quarter = Math.floor(now.getMonth() / 3);
    const startOfQuarter = new Date(now.getFullYear(), quarter * 3, 1);
    return userIndicacoes.filter(i => {
      const date = new Date(i.criadoEm);
      return i.status === "Contrato assinado" && date >= startOfQuarter;
    }).length;
  }, [userIndicacoes]);

  // Conquistas
  const achievements = useMemo(() => {
    const uniqueProducts = new Set(userIndicacoes.map(i => i.produto)).size;
    
    // Mês Perfeito: 2 conversões no mesmo mês (apenas CLT)
    const hasPerfectMonth = user.contrato === "CLT" && (() => {
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

    return [
      { id: "1st", title: "Primeira Indicação", icon: Rocket, unlocked: totalIndicacoes >= 1, description: "Crie a sua 1ª indicação no sistema." },
      { id: "1st_contract", title: "Primeiro Contrato", icon: Handshake, unlocked: conversoes >= 1, description: "Tenha pelo menos 1 indicação com status 'Contrato assinado'." },
      { id: "hat_trick", title: "Hat-Trick", icon: Target, unlocked: conversoes >= 3, description: "Alcance 3 conversões confirmadas." },
      { id: "conector", title: "Conector", icon: () => <span className="text-xl">🦖</span>, unlocked: conversoes >= 3, description: "Atinga o nível Conector (3+ conversões)." },
      { id: "acelerador", title: "Acelerador", icon: Flame, unlocked: conversoes >= 7, description: "Atinga o nível Acelerador (7+ conversões)." },
      { id: "sangue_verde", title: "Sangue Verde", icon: Heart, unlocked: conversoes >= 13, description: "Atinga o nível Sangue Verde (13+ conversões)." },
      { id: "perfect_month", title: "Mês Perfeito", icon: Calendar, unlocked: hasPerfectMonth, info: "Apenas CLT", description: "Consiga 2 conversões em um único mês (Exclusivo CLT)." },
      { id: "diversified", title: "Diversificado", icon: Globe, unlocked: uniqueProducts >= 3, description: "Tenha indicações em pelo menos 3 produtos diferentes." },
    ];
  }, [userIndicacoes, totalIndicacoes, conversoes, user.contrato]);

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Header Mobile - Nome e Nível */}
      <div className="lg:hidden flex items-center justify-between bg-surface-low p-4 rounded-2xl border border-outline-variant/10">
        <div className="flex items-center gap-3">
          <Avatar 
            name={user.name} 
            size="md" 
            src={avatar} 
            className={cn("ring-2", currentLevel.border)} 
          />
          <div>
            <h1 className="text-white font-bold text-lg">{user.name}</h1>
            <span className={cn("text-xs font-black uppercase tracking-wider flex items-center gap-1", currentLevel.color)}>
              {currentLevel.icon} {currentLevel.name}
            </span>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-outline uppercase font-black tracking-widest">Crédito</p>
          <p className="text-primary-container font-display font-bold text-lg">
            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(creditoAcumulado)}
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-8">
        {/* Coluna Esquerda - Identidade */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-surface-low rounded-3xl border border-outline-variant/10 overflow-hidden shadow-2xl shadow-black/40">
            <div className={cn("h-32 w-full opacity-20", currentLevel.bg)} />
            <div className="px-8 pb-8 -mt-16 flex flex-col items-center text-center">
              <div 
                className="relative group cursor-pointer" 
                onClick={() => fileInputRef.current?.click()}
                title="Clique para mudar a foto"
              >
                <div className={cn("absolute inset-0 rounded-full blur-2xl opacity-40 transition-all duration-500 group-hover:opacity-70", currentLevel.bg)} />
                <Avatar 
                  name={user.name} 
                  size="lg" 
                  src={avatar}
                  className={cn("h-32 w-32 text-4xl ring-4 ring-surface-low relative z-10 transition-transform duration-500 group-hover:scale-105", currentLevel.bg)} 
                />
                
                {/* Overlay de Edição */}
                <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col items-center justify-center z-20 backdrop-blur-[2px]">
                  <Camera className="text-white h-8 w-8 mb-1 animate-in zoom-in duration-300" />
                  <span className="text-[8px] text-white font-black uppercase tracking-widest">Editar</span>
                </div>

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

              <div className="mt-6 space-y-1">
                <h2 className="text-2xl font-display font-bold text-white uppercase tracking-tight">{user.name}</h2>
                <p className="text-outline text-sm font-medium">{user.email}</p>
                <div className={cn("inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mt-2 border", currentLevel.border, currentLevel.color)}>
                  {currentLevel.icon} {currentLevel.name}
                </div>
              </div>

              <div className="w-full h-px bg-outline-variant/10 my-8" />

              <div className="w-full space-y-4">
                <div className="flex items-center justify-between text-left">
                  <div className="flex items-center gap-3 text-outline">
                    <Building2 className="h-4 w-4" />
                    <span className="text-xs font-bold uppercase tracking-wider">Setor</span>
                  </div>
                  <span className="text-white text-sm font-bold">{user.setor}</span>
                </div>
                <div className="flex items-center justify-between text-left">
                  <div className="flex items-center gap-3 text-outline">
                    <FileText className="h-4 w-4" />
                    <span className="text-xs font-bold uppercase tracking-wider">Contrato</span>
                  </div>
                  <span className="text-white text-sm font-bold">{user.contrato}</span>
                </div>
                <div className="flex items-center justify-between text-left">
                  <div className="flex items-center gap-3 text-outline">
                    <Briefcase className="h-4 w-4" />
                    <span className="text-xs font-bold uppercase tracking-wider">Função</span>
                  </div>
                  <span className="text-white text-sm font-bold truncate max-w-[150px]">{user.funcao}</span>
                </div>
              </div>

              <div className="w-full mt-8 p-6 rounded-2xl bg-surface-high/50 border border-outline-variant/10">
                <p className="text-[10px] text-outline uppercase font-black tracking-[0.2em] mb-1">Total de Créditos</p>
                <p className="text-3xl font-display font-bold text-primary-container leading-none">
                   {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(creditoAcumulado)}
                </p>
              </div>
            </div>
          </div>

          {/* Meta Pessoal */}
          <div className="bg-surface-low rounded-3xl border border-outline-variant/10 p-8 space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-primary-container/10 border border-primary-container/20 grid place-items-center">
                  <Target className="h-5 w-5 text-primary-container" />
                </div>
                <h3 className="font-display font-bold text-white uppercase tracking-tight">Minha Meta</h3>
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
        <div className="lg:col-span-8 space-y-8">
          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Total Indicações", value: totalIndicacoes, icon: Rocket },
              { label: "Conversões", value: conversoes, icon: Handshake },
              { label: "Taxa de Conversão", value: `${Math.round(taxaConversao)}%`, icon: TrendingUp },
              { label: "Crédito Acumulado", value: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(creditoAcumulado), icon: CreditCard },
            ].map((kpi, i) => (
              <div key={i} className="bg-surface-low p-5 rounded-2xl border border-outline-variant/10 hover:border-primary-container/20 transition-all group">
                <kpi.icon className="h-5 w-5 text-outline group-hover:text-primary-container mb-3 transition-colors" />
                <p className="text-2xl font-display font-bold text-white mb-1 tracking-tight">{kpi.value}</p>
                <p className="text-[10px] text-outline uppercase font-black tracking-wider leading-tight">{kpi.label}</p>
              </div>
            ))}
          </div>

          {/* Evolução de Nível */}
          <div className="bg-surface-low rounded-3xl border border-outline-variant/10 p-8">
            <h3 className="font-display font-bold text-white uppercase tracking-tight mb-8">Evolução de Nível</h3>
            
            <div className="relative mb-12">
              <div className="absolute top-1/2 left-0 w-full h-1 bg-surface-highest -translate-y-1/2 rounded-full" />
              <div 
                className="absolute top-1/2 left-0 h-1 bg-primary-container -translate-y-1/2 rounded-full transition-all duration-1000 shadow-[0_0_15px_rgba(202,253,0,0.3)]" 
                style={{ width: `${(LEVELS.findIndex(l => l.name === currentLevel.name) / (LEVELS.length - 1)) * 100}%` }}
              />
              
              <div className="relative flex justify-between">
                {LEVELS.map((lvl, i) => {
                  const isPast = conversoes >= lvl.min && lvl.name !== currentLevel.name;
                  const isCurrent = lvl.name === currentLevel.name;
                  
                  return (
                    <div key={lvl.name} className="flex flex-col items-center gap-3 relative">
                      <div className={cn(
                        "h-10 w-10 rounded-full border-4 ring-8 ring-surface-low grid place-items-center z-10 transition-all duration-500",
                        isPast ? "bg-primary-container border-primary-container" : 
                        isCurrent ? "bg-surface-low border-primary-container animate-pulse shadow-[0_0_20px_rgba(202,253,0,0.4)]" : 
                        "bg-surface-highest border-surface-highest"
                      )}>
                        {isPast ? <CheckCircle2 className="h-5 w-5 text-on-primary-container" /> : <span className="text-lg">{lvl.icon}</span>}
                      </div>
                      <div className="text-center absolute -bottom-8 w-24">
                        <p className={cn(
                          "text-[9px] font-black uppercase tracking-wider",
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

            <div className="mt-16 space-y-4">
              <div className="flex justify-between items-end">
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
          <div className="bg-surface-low rounded-3xl border border-outline-variant/10 p-8">
            <h3 className="font-display font-bold text-white uppercase tracking-tight mb-6">Conquistas</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {achievements.map((ach) => (
                <Tooltip key={ach.id}>
                  <TooltipTrigger asChild>
                    <div 
                      role="button"
                      tabIndex={0}
                      className={cn(
                        "relative p-4 rounded-2xl border transition-all duration-300 flex flex-col items-center text-center gap-2 overflow-hidden cursor-help outline-none focus-visible:ring-2 focus-visible:ring-primary-container/50",
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
                      <p className="text-[10px] font-black uppercase tracking-wider text-white leading-tight h-8 flex items-center">
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
          <div className="bg-surface-low rounded-3xl border border-outline-variant/10 overflow-hidden">
            <div className="p-8 pb-4 flex items-center justify-between">
              <h3 className="font-display font-bold text-white uppercase tracking-tight">Últimas Indicações</h3>
              <Link 
                to="/app/indicacoes" 
                className="text-xs font-black uppercase tracking-widest text-primary-container hover:underline flex items-center gap-1"
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
