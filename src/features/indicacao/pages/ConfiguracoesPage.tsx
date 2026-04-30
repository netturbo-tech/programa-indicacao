import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Save } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useApp } from "../AppContext";
import { PrimaryButton } from "../components/PrimaryButton";
import { CONTRATOS, SETORES, type Contrato, type Setor } from "../types";
import { supabase } from "@/integrations/supabase/client";

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

export function ConfiguracoesPage() {
  const { user, updateProfile } = useApp();
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

  useEffect(() => {
    if (!user) return;
    const nextForm = {
      name: user.name,
      email: user.email,
      ra: user.ra || "",
      cpf: user.cpf || "",
      funcao: user.funcao || "",
      setor: normalizeSetor(user.setor),
      contrato: normalizeContrato(user.contrato),
    };

    setForm(nextForm);

    supabase
      .from("profiles")
      .select("name, email, ra, cpf, funcao, setor, contrato")
      .eq("user_id", user.id)
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
  }, [user]);

  if (!user) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
  };

  return (
    <div className="mx-auto max-w-5xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 font-body">
      <header className="relative border-b border-outline-variant/10 py-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="space-y-2">
            <h1 className="font-display text-3xl font-bold uppercase leading-none tracking-tighter md:text-5xl">
              Configurações <br />
              <span className="font-light italic text-on-surface-variant">do Perfil</span>
            </h1>
          </div>
          <div className="hidden max-w-xs text-right md:block">
            <p className="text-xs font-medium leading-relaxed text-on-surface-variant">
              Essas informações serão usadas automaticamente nos formulários de indicação.
            </p>
          </div>
        </div>
      </header>

      <form onSubmit={handleSubmit} className="space-y-8">
        <section className="space-y-5">
          <div className="flex items-center gap-3">
            <span className="font-display text-2xl font-bold italic text-outline-variant/30">
              01
            </span>
            <h2 className="font-display text-sm font-bold uppercase tracking-widest">
              Dados do usuário
            </h2>
            <div className="h-px flex-1 bg-outline-variant/10" />
          </div>

          <div className="grid gap-x-8 gap-y-5 md:grid-cols-2">
            <EditorialField
              label="Nome Completo *"
              value={form.name}
              onChange={(v) => setForm({ ...form, name: v })}
              placeholder="Seu nome completo"
            />
            <EditorialField
              label="Email"
              value={form.email}
              onChange={() => undefined}
              placeholder="email corporativo"
              readOnly
            />
            <EditorialField
              label="RA"
              value={form.ra}
              onChange={(v) => setForm({ ...form, ra: v })}
              placeholder="Seu RA"
              readOnly={!!form.ra}
            />
            <EditorialField
              label="CPF"
              value={form.cpf}
              onChange={(v) => setForm({ ...form, cpf: maskCpf(v) })}
              placeholder="000.000.000-00"
            />
            <EditorialField
              label="Sua função"
              value={form.funcao}
              onChange={(v) => setForm({ ...form, funcao: v })}
              placeholder="Cargo atual"
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
              options={["CLT", "PJ"]}
            />
          </div>
        </section>

        <footer className="flex flex-col items-center justify-between gap-4 border-t border-outline-variant/10 pt-6 sm:flex-row">
          <div className="flex items-center gap-3 text-xs font-medium text-on-surface-variant">
            <div className="h-2 w-2 rounded-full bg-primary-container" />
            Perfil persistente para os próximos formulários
          </div>
          <PrimaryButton
            disabled={saving}
            type="submit"
            className="px-8 py-4 text-xs uppercase tracking-[0.2em]"
          >
            {saving ? "Salvando..." : "Salvar Configurações"}
            <Save className="h-3 w-3" />
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
    <div className="group space-y-2">
      <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-outline transition-colors group-focus-within:text-primary-container">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        readOnly={readOnly}
        className="w-full border-0 border-b border-outline-variant/30 bg-transparent px-0 py-2 text-sm font-medium text-on-surface caret-primary-container outline-none transition-all placeholder:text-outline-variant/50 read-only:cursor-not-allowed read-only:text-on-surface-variant read-only:focus:border-outline-variant/30 focus:border-primary-container focus:outline-none focus:ring-0"
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
    <div className="group space-y-2">
      <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-outline transition-colors group-focus-within:text-primary-container">
        {label}
      </label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="h-auto w-full rounded-none border-0 border-b border-outline-variant/30 bg-transparent px-0 py-2 text-sm font-medium text-on-surface shadow-none outline-none transition-colors hover:border-primary-container/50 focus:border-primary-container focus:outline-none focus:ring-0 data-[state=open]:border-primary-container [&>svg]:text-outline [&>svg]:opacity-60">
          <SelectValue placeholder="Selecione">{value || "Selecione"}</SelectValue>
        </SelectTrigger>
        <SelectContent
          position="popper"
          sideOffset={6}
          className="max-h-72 min-w-[--radix-select-trigger-width] rounded-xl border border-outline-variant/20 bg-surface-low p-1.5 text-on-surface shadow-2xl shadow-black/60 backdrop-blur-xl"
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
