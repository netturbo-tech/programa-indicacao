import { useEffect, useState, useRef } from "react";
import { toast } from "sonner";
import { Save, Camera, User as UserIcon, Building2, FileText, Briefcase, CreditCard } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useApp, LEVELS } from "../AppContext";
import { PrimaryButton } from "../components/PrimaryButton";
import { CONTRATOS, SETORES, type Contrato, type Setor } from "../types";
import { supabase } from "@/integrations/supabase/client";
import { AnnouncementSettings } from "../components/AnnouncementSettings";
import { Avatar } from "../components/Avatar";
import { cn } from "@/lib/utils";

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

function AprovadorProfileForm() {
  const { user, avatar, setAvatar, updateProfile } = useApp();
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
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
    toast.success("Dados do perfil salvos com sucesso.");
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error("A imagem deve ter no máximo 10MB.");
      return;
    }
    const reader = new FileReader();
    if (file.size <= 2.5 * 1024 * 1024) {
      reader.onloadend = () => {
        setAvatar(reader.result as string);
        toast.success("Foto de perfil atualizada!");
      };
      reader.readAsDataURL(file);
      return;
    }
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX = 1200;
        let w = img.width, h = img.height;
        if (w > h) { if (w > MAX) { h *= MAX / w; w = MAX; } }
        else { if (h > MAX) { w *= MAX / h; h = MAX; } }
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = "high";
          ctx.drawImage(img, 0, 0, w, h);
          setAvatar(canvas.toDataURL("image/jpeg", 0.95));
          toast.success("Foto de perfil atualizada!");
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  if (!user) return null;

  return (
    <div className="bg-surface-low rounded-3xl border border-outline-variant/10 p-6 sm:p-8">
      <h3 className="font-display font-bold text-white uppercase tracking-tight mb-6 text-sm sm:text-base">
        Meu Perfil
      </h3>

      <div className="flex items-start gap-6 mb-8">
        <div
          className="relative group cursor-pointer shrink-0"
          onClick={() => fileInputRef.current?.click()}
          title="Clique para mudar a foto"
        >
          <Avatar
            name={user.name}
            size="lg"
            src={avatar}
            className="h-20 w-20 text-2xl ring-2 ring-outline-variant/20"
          />
          <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col items-center justify-center backdrop-blur-[2px]">
            <Camera className="text-white h-5 w-5" />
          </div>
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/*"
            onChange={handleAvatarChange}
          />
        </div>
        <div className="min-w-0">
          <h4 className="text-lg font-bold text-white truncate">{user.name}</h4>
          <p className="text-xs text-outline truncate">{user.email}</p>
          <span className="inline-block mt-1 text-[9px] font-black uppercase tracking-widest text-primary-container/70 bg-primary-container/5 px-2 py-0.5 rounded-full border border-primary-container/10">
            Aprovador
          </span>
        </div>
      </div>

      <form onSubmit={handleSaveProfile} className="space-y-4">
        <div className="grid sm:grid-cols-2 gap-4">
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
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
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
        </div>
        <EditorialField
          label="Sua Função"
          value={form.funcao}
          onChange={(v) => setForm({ ...form, funcao: v })}
        />
        <div className="grid sm:grid-cols-2 gap-4">
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
        </div>
        <div className="pt-4 flex justify-end">
          <PrimaryButton disabled={saving} type="submit" className="px-6 py-2.5 text-xs">
            {saving ? "Salvando..." : "Salvar Perfil"}
          </PrimaryButton>
        </div>
      </form>
    </div>
  );
}

export function ConfiguracoesPage() {
  const { user } = useApp();

  if (!user) return null;

  // Aprovador: mostra formulário de perfil
  if (user.role === "aprovador") {
    return (
      <div className="mx-auto max-w-3xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 font-body">
        <header className="relative border-b border-outline-variant/10 py-6">
          <div className="space-y-2">
            <h1 className="font-display text-3xl font-bold uppercase leading-none tracking-tighter md:text-5xl">
              Configurações
            </h1>
            <p className="text-sm text-outline">Gerencie os dados do seu perfil profissional.</p>
          </div>
        </header>

        <AprovadorProfileForm />
      </div>
    );
  }

  if (user.role !== "admin") {
    return (
      <div className="mx-auto max-w-5xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 font-body">
        <header className="relative border-b border-outline-variant/10 py-6">
          <div className="space-y-2">
            <h1 className="font-display text-3xl font-bold uppercase leading-none tracking-tighter md:text-5xl">
              Configurações
            </h1>
          </div>
        </header>
        <div className="p-8 text-center text-outline text-sm italic">
          Nenhuma configuração disponível para o seu perfil no momento.
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 font-body">
      <header className="relative border-b border-outline-variant/10 py-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="space-y-2">
            <h1 className="font-display text-3xl font-bold uppercase leading-none tracking-tighter md:text-5xl">
              Configurações <br />
              <span className="font-light italic text-on-surface-variant">do Sistema</span>
            </h1>
          </div>
        </div>
      </header>
      
      <AnnouncementSettings />
    </div>
  );
}
