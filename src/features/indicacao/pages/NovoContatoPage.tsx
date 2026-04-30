import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { z } from "zod";
import { useApp } from "../AppContext";
import { PrimaryButton } from "../components/PrimaryButton";

const contatoSchema = z.object({
  nome: z.string().trim().min(1).max(100),
  email: z.string().trim().email().max(255),
  cnpj: z.string().trim().min(1).max(18),
  razaoSocial: z.string().trim().max(200),
  nomeFantasia: z.string().trim().max(200),
  telefoneFixo: z.string().trim().max(20),
  celular: z.string().trim().max(20),
  observacao: z.string().trim().max(1000),
});

function maskCnpj(value: string) {
  const d = value.replace(/\D/g, "").slice(0, 14);
  return d
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2");
}

function maskPhone(value: string) {
  const d = value.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 10) {
    return d.replace(/^(\d{2})(\d)/, "($1) $2").replace(/(\d{4})(\d)/, "$1-$2");
  }
  return d.replace(/^(\d{2})(\d)/, "($1) $2").replace(/(\d{5})(\d)/, "$1-$2");
}

export function NovoContatoPage() {
  const { user, createContato } = useApp();
  const [loadingCnpj, setLoadingCnpj] = useState(false);
  const lastFetchedRef = useRef<string>("");
  const [form, setForm] = useState({
    nome: "",
    email: "",
    cnpj: "",
    razaoSocial: "",
    nomeFantasia: "",
    telefoneFixo: "",
    celular: "",
    observacao: "",
  });

  const lookupCnpj = async (digits: string) => {
    if (digits.length !== 14) return;
    if (lastFetchedRef.current === digits) return;
    lastFetchedRef.current = digits;
    setLoadingCnpj(true);
    try {
      const res = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${digits}`);
      if (!res.ok) {
        toast.error("CNPJ não encontrado.");
        return;
      }
      const data = await res.json();
      const ddd = data.ddd_telefone_1 ? String(data.ddd_telefone_1) : "";
      setForm((f) => ({
        ...f,
        razaoSocial: data.razao_social ?? f.razaoSocial,
        nomeFantasia: data.nome_fantasia || data.razao_social || f.nomeFantasia,
        telefoneFixo: ddd ? maskPhone(ddd) : f.telefoneFixo,
        email: data.email ?? f.email,
      }));
      toast.success("Dados preenchidos automaticamente.");
    } catch {
      toast.error("Erro ao consultar CNPJ.");
    } finally {
      setLoadingCnpj(false);
    }
  };

  // Auto-lookup quando o CNPJ atingir 14 dígitos
  useEffect(() => {
    const digits = form.cnpj.replace(/\D/g, "");
    if (digits.length === 14 && lastFetchedRef.current !== digits) {
      const t = setTimeout(() => lookupCnpj(digits), 300);
      return () => clearTimeout(t);
    }
    if (digits.length < 14) {
      lastFetchedRef.current = "";
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.cnpj]);

  if (!user) return null;
  if (user.role === "usuario") {
    return (
      <div className="max-w-3xl mx-auto py-20 font-body">
        <h1 className="font-display text-4xl font-bold uppercase tracking-tight">
          Acesso restrito
        </h1>
        <p className="mt-3 text-sm text-on-surface-variant">
          Contatos são permitidos somente para Usuário RA.
        </p>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = contatoSchema.safeParse(form);
    if (!parsed.success) {
      toast.error("Preencha Nome, Email e CNPJ.");
      return;
    }
    const result = await createContato(parsed.data);
    if (!result.ok) {
      toast.error(result.error || "Erro ao criar contato.");
      return;
    }
    toast.success("Contato registrado com sucesso!", {
      description: `${form.nome} adicionado à base.`,
    });
    setForm({
      nome: "",
      email: "",
      cnpj: "",
      razaoSocial: "",
      nomeFantasia: "",
      telefoneFixo: "",
      celular: "",
      observacao: "",
    });
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 font-body">
      <header className="relative py-6 border-b border-outline-variant/10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-2">
             <h1 className="font-display text-3xl md:text-5xl font-bold tracking-tighter uppercase leading-none">
               Novo Contato <br />
               <span className="italic font-light text-on-surface-variant">Quente</span>
             </h1>
          </div>
          <div className="max-w-xs text-right hidden md:block">
            <p className="text-xs text-on-surface-variant font-medium leading-relaxed">
              Registre um novo contato corporativo. Use o CNPJ para preencher os dados
              automaticamente.
            </p>
          </div>
        </div>
      </header>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Section 01: CNPJ Lookup */}
        <section className="space-y-5">
          <div className="flex items-center gap-3">
            <span className="font-display text-2xl font-bold text-outline-variant/30 italic">
              01
            </span>
            <h2 className="font-display text-sm font-bold uppercase tracking-widest">
              Identificação Empresarial
            </h2>
            <div className="h-px flex-1 bg-outline-variant/10" />
          </div>

          <div className="grid md:grid-cols-2 gap-x-8 gap-y-5">
            <div className="relative">
              <EditorialField
                label="CNPJ *"
                value={form.cnpj}
                onChange={(v) => setForm({ ...form, cnpj: maskCnpj(v) })}
                placeholder="00.000.000/0000-00"
              />
              {loadingCnpj && (
                <div className="absolute right-0 bottom-2 flex items-center gap-2 text-[10px] uppercase tracking-widest text-primary-container font-bold">
                  <Loader2 className="h-3 w-3 animate-spin" /> Buscando...
                </div>
              )}
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-x-8 gap-y-5">
            <EditorialField
              label="Razão Social"
              value={form.razaoSocial}
              onChange={(v) => setForm({ ...form, razaoSocial: v })}
              placeholder="Preenchido automaticamente"
            />
            <EditorialField
              label="Nome Fantasia"
              value={form.nomeFantasia}
              onChange={(v) => setForm({ ...form, nomeFantasia: v })}
              placeholder="Preenchido automaticamente"
            />
          </div>
        </section>

        {/* Section 02: Contato */}
        <section className="space-y-5">
          <div className="flex items-center gap-3">
            <span className="font-display text-2xl font-bold text-outline-variant/30 italic">
              02
            </span>
            <h2 className="font-display text-sm font-bold uppercase tracking-widest">
              Dados de Contato
            </h2>
            <div className="h-px flex-1 bg-outline-variant/10" />
          </div>

          <div className="grid md:grid-cols-2 gap-x-8 gap-y-5">
            <EditorialField
              label="Nome *"
              value={form.nome}
              onChange={(v) => setForm({ ...form, nome: v })}
              placeholder="Ex: Carlos Oliveira"
            />
             <EditorialField
               label="Email do Lead *"
               type="email"
               value={form.email}
               onChange={(v) => setForm({ ...form, email: v })}
               placeholder="contato@empresa.com"
             />
            <EditorialField
              label="Telefone Fixo"
              value={form.telefoneFixo}
              onChange={(v) => setForm({ ...form, telefoneFixo: maskPhone(v) })}
              placeholder="(XX) XXXX-XXXX"
            />
            <EditorialField
              label="Celular"
              value={form.celular}
              onChange={(v) => setForm({ ...form, celular: maskPhone(v) })}
              placeholder="(XX) XXXXX-XXXX"
            />
            <EditorialTextarea
              label="Observações"
              value={form.observacao}
              onChange={(v) => setForm({ ...form, observacao: v.slice(0, 1000) })}
              placeholder="Informações relevantes sobre o lead"
            />
          </div>
        </section>

        <footer className="pt-6 border-t border-outline-variant/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-xs font-medium text-on-surface-variant">
            <div className="h-2 w-2 rounded-full bg-primary-container animate-pulse" />
            Dados enriquecidos automaticamente
          </div>
          <PrimaryButton type="submit" className="px-8 py-4 text-xs tracking-[0.2em] uppercase">
            Registrar Contato
          </PrimaryButton>
        </footer>
      </form>
    </div>
  );
}

function EditorialField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div className="group space-y-2">
      <label className="block text-[10px] uppercase tracking-[0.2em] text-outline font-black group-focus-within:text-primary-container transition-colors">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-transparent border-0 border-b border-outline-variant/30 py-2 px-0 text-on-surface placeholder:text-outline-variant/50 outline-none focus:outline-none focus:ring-0 focus:border-primary-container caret-primary-container transition-all text-sm font-medium"
      />
    </div>
  );
}

function EditorialTextarea({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="group space-y-2 md:col-span-2">
      <label className="block text-[10px] uppercase tracking-[0.2em] text-outline font-black group-focus-within:text-primary-container transition-colors">
        {label}
      </label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={4}
        maxLength={1000}
        className="w-full resize-none bg-transparent border-0 border-b border-outline-variant/30 py-2 px-0 text-on-surface placeholder:text-outline-variant/50 outline-none focus:outline-none focus:ring-0 focus:border-primary-container caret-primary-container transition-all text-sm font-medium"
      />
    </div>
  );
}
