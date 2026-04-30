import { useState } from "react";
import { toast } from "sonner";
import { Loader2, ArrowRight, User as UserIcon, Building2, Briefcase, FileText, Mail } from "lucide-react";
import { useApp } from "../AppContext";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  SETORES,
  CONTRATOS,
  type Contrato,
  type Setor,
} from "../types";
import { PrimaryButton } from "../components/PrimaryButton";

export function OnboardingPage() {
  const { user, updateProfile } = useApp();
  const [loading, setLoading] = useState(false);
  const isRaUser = user?.role === "usuario_ra";
  const hasSyntheticEmail = !!user?.email && /@(ra|cpf)\.ntt-indicacoes\.local$/i.test(user.email);
  const requiresEmail = isRaUser && hasSyntheticEmail;
  const [form, setForm] = useState({
    name: user?.name || "",
    loginId: user?.loginId || user?.email || "",
    email: hasSyntheticEmail ? "" : user?.email || "",
    cpf: user?.cpf || "",
    setor: "" as Setor | "", // No default value
    funcao: user?.funcao || "",
    contrato: "" as Contrato | "", // No default value
  });

  if (!user) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.setor || !form.contrato) {
      toast.error("Por favor, preencha todos os campos obrigatórios.");
      return;
    }

    if (requiresEmail) {
      const emailTrim = form.email.trim();
      const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrim);
      if (!emailValid) {
        toast.error("Informe um e-mail válido para acessar futuramente também por e-mail.");
        return;
      }
    }

    setLoading(true);
    try {
      const result = await updateProfile({
        name: form.name,
        loginId: form.loginId,
        email: requiresEmail ? form.email.trim() : undefined,
        cpf: form.cpf,
        setor: form.setor as Setor,
        funcao: form.funcao,
        contrato: form.contrato as Contrato,
      });

      if (result.ok) {
        toast.success("Perfil configurado com sucesso!");
      } else {
        toast.error(result.error || "Erro ao salvar configurações.");
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error("[Onboarding] erro inesperado:", error);
      toast.error(`Ocorreu um erro inesperado: ${message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-[#0a0a0a] font-body overflow-y-auto py-10 px-4">
      <div className="w-full max-w-2xl space-y-8 animate-in fade-in zoom-in-95 duration-700">
        <header className="text-center space-y-4">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-container/10 text-primary-container mb-2">
            <UserIcon className="h-8 w-8" />
          </div>
          <h1 className="font-display text-4xl md:text-6xl font-bold tracking-tighter uppercase leading-none text-white">
            Configuração <br />
            <span className="italic font-light text-on-surface-variant">Inicial</span>
          </h1>
          <p className="text-sm text-on-surface-variant max-w-md mx-auto">
            Bem-vindo ao Turbo Leads Hub. Vamos personalizar sua experiência configurando os detalhes da sua conta.
          </p>
        </header>

        <form onSubmit={handleSubmit} className="bg-surface-low border border-outline-variant/10 rounded-3xl p-8 md:p-12 shadow-2xl space-y-8">
          <div className="grid md:grid-cols-2 gap-8">
            <EditorialField
              label="Nome Completo *"
              icon={<UserIcon className="h-4 w-4" />}
              value={form.name}
              onChange={(v) => setForm({ ...form, name: v })}
              placeholder="Ex: João Silva"
            />

            {requiresEmail && (
              <EditorialField
                label="Seu E-mail *"
                icon={<Mail className="h-4 w-4" />}
                value={form.email}
                onChange={(v) => setForm({ ...form, email: v })}
                placeholder="nome@empresa.com.br"
                type="email"
              />
            )}

            <EditorialSelect
              label="Seu Setor *"
              icon={<Building2 className="h-4 w-4" />}
              value={form.setor}
              onChange={(v) => setForm({ ...form, setor: v as Setor })}
              options={SETORES}
              placeholder="Selecione seu setor"
            />

            <EditorialSelect
              label="Tipo de Contrato *"
              icon={<FileText className="h-4 w-4" />}
              value={form.contrato}
              onChange={(v) => setForm({ ...form, contrato: v as Contrato })}
              options={CONTRATOS}
              placeholder="Selecione o contrato"
            />

            <EditorialField
              label="Sua Função"
              icon={<Briefcase className="h-4 w-4" />}
              value={form.funcao}
              onChange={(v) => setForm({ ...form, funcao: v })}
              placeholder="Ex: Analista Comercial"
            />
          </div>

          <div className="pt-6 border-t border-outline-variant/10 flex flex-col items-center gap-6">
            <PrimaryButton 
              type="submit" 
              disabled={loading}
              className="w-full md:w-auto px-12 py-5 text-sm tracking-[0.2em] uppercase group"
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  Finalizar Configuração
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </PrimaryButton>
            <p className="text-[10px] text-outline uppercase tracking-widest font-bold">
              * Campos obrigatórios
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}

function EditorialField({
  label,
  value,
  onChange,
  placeholder,
  icon,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  icon?: React.ReactNode;
  type?: string;
}) {
  return (
    <div className="group space-y-3">
      <label className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-outline font-black group-focus-within:text-primary-container transition-colors">
        {icon} {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-transparent border-0 border-b border-outline-variant/30 py-3 px-0 text-on-surface placeholder:text-outline-variant/50 outline-none focus:outline-none focus:ring-0 focus:border-primary-container caret-primary-container transition-all text-sm font-medium"
      />
    </div>
  );
}

function EditorialSelect({
  label,
  value,
  options,
  onChange,
  placeholder,
  icon,
}: {
  label: string;
  value: string;
  options: readonly string[];
  onChange: (v: string) => void;
  placeholder?: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="group space-y-3">
      <label className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-outline font-black group-focus-within:text-primary-container transition-colors">
        {icon} {label}
      </label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger
          className="w-full bg-transparent border-0 border-b border-outline-variant/30 rounded-none px-0 py-3 h-auto text-sm font-medium text-on-surface shadow-none outline-none focus:outline-none focus:ring-0 focus:border-primary-container hover:border-primary-container/50 transition-colors data-[placeholder]:text-outline-variant/50"
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent
          position="popper"
          sideOffset={6}
          className="z-[100] border border-outline-variant/20 bg-surface-low backdrop-blur-xl text-on-surface rounded-xl shadow-2xl p-1.5"
        >
          {options.map((o) => (
            <SelectItem
              key={o}
              value={o}
              className="text-xs font-bold uppercase tracking-widest text-on-surface-variant rounded-md py-2.5 px-4 cursor-pointer focus:bg-primary-container/15 focus:text-primary-container data-[state=checked]:bg-primary-container/20 data-[state=checked]:text-primary-container transition-colors"
            >
              {o}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
