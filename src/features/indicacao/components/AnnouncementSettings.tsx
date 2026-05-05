import React, { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { Upload, X, Save, Trash2 } from "lucide-react";
import { PrimaryButton } from "./PrimaryButton";
import { supabase } from "@/integrations/supabase/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type AnnouncementConfig = {
  id: string;
  titulo: string;
  texto: string;
  midia: {
    tipo: "imagem" | "video";
    base64: string;
  } | null;
  exibicao: "ao_login" | "uma_vez_por_dia" | "periodo_especifico" | string; // Permitindo string para não quebrar salvos antigos
  dataInicio: string | null;
  dataFim: string | null;
  ativo: boolean;
  criadoEm: string;
  atualizadoEm: string;
};

const DEFAULT_CONFIG: AnnouncementConfig = {
  id: "",
  titulo: "",
  texto: "",
  midia: null,
  exibicao: "ao_login",
  dataInicio: null,
  dataFim: null,
  ativo: true,
  criadoEm: "",
  atualizadoEm: "",
};

export function AnnouncementSettings() {
  const [config, setConfig] = useState<AnnouncementConfig>(DEFAULT_CONFIG);
  const [rowId, setRowId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("announcements")
        .select("id, config, active")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) {
        console.error("Failed to load announcement", error);
      } else if (data) {
        setRowId(data.id);
        setConfig({ ...DEFAULT_CONFIG, ...(data.config as any), ativo: data.active });
      }
      setLoading(false);
    })();
  }, []);

  const handleSave = async () => {
    const nextConfig = {
      ...config,
      id: config.id || crypto.randomUUID(),
      criadoEm: config.criadoEm || new Date().toISOString(),
      atualizadoEm: new Date().toISOString(),
    };
    if (rowId) {
      const { error } = await supabase
        .from("announcements")
        .update({ config: nextConfig as any, active: nextConfig.ativo })
        .eq("id", rowId);
      if (error) {
        toast.error("Erro ao salvar: " + error.message);
        return;
      }
    } else {
      const { data, error } = await supabase
        .from("announcements")
        .insert({ config: nextConfig as any, active: nextConfig.ativo })
        .select("id")
        .single();
      if (error) {
        toast.error("Erro ao salvar: " + error.message);
        return;
      }
      setRowId(data.id);
    }
    setConfig(nextConfig);
    toast.success("Anúncio salvo com sucesso!");
  };

  const handleDelete = async () => {
    if (!window.confirm("Tem certeza que deseja excluir permanentemente este anúncio?")) return;
    if (rowId) {
      const { error } = await supabase.from("announcements").delete().eq("id", rowId);
      if (error) {
        toast.error("Erro ao excluir: " + error.message);
        return;
      }
    }
    setRowId(null);
    setConfig(DEFAULT_CONFIG);
    toast.success("Anúncio excluído com sucesso!");
  };


  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("O arquivo deve ter no máximo 5MB.");
      return;
    }

    const isVideo = file.type.startsWith("video/");
    const reader = new FileReader();

    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setConfig((prev) => ({
        ...prev,
        midia: {
          tipo: isVideo ? "video" : "imagem",
          base64,
        },
      }));
    };

    reader.onerror = () => {
      toast.error("Erro ao ler o arquivo.");
    };

    reader.readAsDataURL(file);
  };

  const removeMedia = () => {
    setConfig((prev) => ({ ...prev, midia: null }));
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-8">
      <div className="grid md:grid-cols-2 gap-12 items-start">
        {/* Editor */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-xl font-bold uppercase tracking-tight text-white">
              Editar Anúncio
            </h3>
            <label className="flex items-center gap-2 cursor-pointer">
              <span className="text-[10px] font-black uppercase tracking-widest text-outline">
                {config.ativo ? "Ativo" : "Inativo"}
              </span>
              <div className="relative inline-flex h-5 w-9 items-center rounded-full bg-surface-highest transition-colors">
                <input
                  type="checkbox"
                  className="peer sr-only"
                  checked={config.ativo}
                  onChange={(e) => setConfig({ ...config, ativo: e.target.checked })}
                />
                <div
                  className={`absolute left-0.5 top-0.5 h-4 w-4 rounded-full transition-transform ${
                    config.ativo ? "translate-x-4 bg-primary-container" : "bg-outline"
                  }`}
                />
              </div>
            </label>
          </div>

          <div className="space-y-4">
            <label className="block space-y-2">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-outline">
                Título do anúncio
              </span>
              <input
                type="text"
                value={config.titulo}
                onChange={(e) => setConfig({ ...config, titulo: e.target.value })}
                className="w-full border-0 border-b border-outline-variant/30 bg-transparent px-0 py-2 text-sm font-medium text-on-surface caret-primary-container outline-none transition-all focus:border-primary-container focus:ring-0"
                placeholder="Ex: Novidade no Net Turbo!"
              />
            </label>

            <label className="block space-y-2">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-outline">
                Texto / Descrição
              </span>
              <textarea
                value={config.texto}
                onChange={(e) => setConfig({ ...config, texto: e.target.value })}
                rows={4}
                className="w-full rounded-lg border border-outline-variant/10 bg-surface-low p-4 text-sm font-medium text-on-surface outline-none transition-all focus:border-primary-container/50 focus:ring-1 focus:ring-primary-container/30 resize-none"
                placeholder="Detalhes do anúncio..."
              />
            </label>

            <div className="space-y-2">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-outline">
                Mídia (Imagem ou Vídeo)
              </span>
              {config.midia ? (
                <div className="relative rounded-lg overflow-hidden border border-outline-variant/20 bg-surface-high">
                  {config.midia.tipo === "imagem" ? (
                    <img
                      src={config.midia.base64}
                      alt="Preview"
                      className="w-full h-32 object-cover opacity-80"
                    />
                  ) : (
                    <video
                      src={config.midia.base64}
                      className="w-full h-32 object-cover opacity-80"
                      muted
                    />
                  )}
                  <button
                    onClick={removeMedia}
                    className="absolute top-2 right-2 bg-black/60 p-1.5 rounded-md hover:bg-red-500/80 transition-colors text-white"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-outline-variant/20 rounded-lg p-6 flex flex-col items-center justify-center text-outline cursor-pointer hover:border-primary-container/50 hover:text-primary-container transition-colors"
                >
                  <Upload className="h-6 w-6 mb-2" />
                  <span className="text-xs font-bold uppercase tracking-widest">
                    Fazer Upload
                  </span>
                  <span className="text-[10px] mt-1 opacity-60">JPG, PNG, WEBP ou MP4</span>
                </div>
              )}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*,video/mp4"
                className="hidden"
              />
            </div>

            <div className="space-y-2">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-outline">
                Quando exibir
              </span>
              <Select
                value={config.exibicao}
                onValueChange={(v: any) => setConfig({ ...config, exibicao: v })}
              >
                <SelectTrigger className="w-full border-0 border-b border-outline-variant/30 bg-transparent px-0 py-2 h-auto text-sm font-medium text-on-surface shadow-none outline-none focus:ring-0 focus:border-primary-container rounded-none">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="border border-outline-variant/20 bg-surface-low text-on-surface rounded-xl shadow-2xl p-1.5">
                  <SelectItem value="ao_login">Ao fazer login</SelectItem>
                  <SelectItem value="uma_vez_por_dia">Uma vez por dia</SelectItem>
                  <SelectItem value="periodo_especifico">Período específico</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {config.exibicao === "periodo_especifico" && (
              <div className="grid grid-cols-2 gap-4">
                <label className="block space-y-2">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-outline">
                    Data de Início
                  </span>
                  <input
                    type="date"
                    value={config.dataInicio || ""}
                    onChange={(e) => setConfig({ ...config, dataInicio: e.target.value })}
                    className="w-full border-0 border-b border-outline-variant/30 bg-transparent px-0 py-2 text-sm font-medium text-on-surface outline-none focus:border-primary-container focus:ring-0"
                  />
                </label>
                <label className="block space-y-2">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-outline">
                    Data de Fim
                  </span>
                  <input
                    type="date"
                    value={config.dataFim || ""}
                    onChange={(e) => setConfig({ ...config, dataFim: e.target.value })}
                    className="w-full border-0 border-b border-outline-variant/30 bg-transparent px-0 py-2 text-sm font-medium text-on-surface outline-none focus:border-primary-container focus:ring-0"
                  />
                </label>
              </div>
            )}
          </div>

          <div className="pt-4 flex justify-end gap-3">
            {config.id && (
              <button 
                onClick={handleDelete}
                className="flex items-center gap-2 px-6 py-3 text-xs font-black uppercase tracking-[0.2em] text-red-500 hover:bg-red-500/10 rounded-xl transition-colors border border-red-500/20"
              >
                <Trash2 className="h-4 w-4" /> Excluir
              </button>
            )}
            <PrimaryButton onClick={handleSave} className="px-6 py-3 text-xs uppercase tracking-[0.2em]">
              <Save className="h-4 w-4 mr-2" /> Salvar Anúncio
            </PrimaryButton>
          </div>
        </div>

        {/* Preview */}
        <div className="bg-surface-low rounded-2xl p-6 border border-outline-variant/10 overflow-hidden flex flex-col items-center">
          <h3 className="w-full font-display text-xs font-bold uppercase tracking-[0.2em] text-outline mb-6">
            Preview (60% escala)
          </h3>

          {/* Scaled container */}
          <div className="relative w-[600px] origin-top scale-[0.6] bg-[#1a1a1a] border border-[#2a2a2a] rounded-3xl overflow-hidden shadow-2xl">
            {/* Header X */}
            <div className="absolute top-4 right-4 z-10">
              <button disabled className="h-8 w-8 rounded-full bg-black/40 text-white grid place-items-center backdrop-blur-md">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="absolute top-5 left-6 z-10">
              <span className="text-white/60 font-black uppercase tracking-widest text-xs drop-shadow-md">NET TURBO</span>
            </div>

            {config.midia && (
              <div className="w-full h-[280px] bg-black">
                {config.midia.tipo === "imagem" ? (
                  <img src={config.midia.base64} className="w-full h-full object-cover" alt="" />
                ) : (
                  <video src={config.midia.base64} className="w-full h-full object-cover" muted loop autoPlay />
                )}
              </div>
            )}

            <div className={`p-8 ${!config.midia ? "pt-16" : ""}`}>
              <h2 className="text-2xl font-display font-bold text-white uppercase tracking-tight mb-4">
                {config.titulo || "Título do anúncio"}
              </h2>
              <div className="text-[#AAAAAA] text-sm leading-relaxed whitespace-pre-wrap mb-8 min-h-[40px]">
                {config.texto || "O texto descritivo aparecerá aqui..."}
              </div>
              <button disabled className="w-full bg-[#CCFF00] text-black font-black uppercase tracking-widest py-4 rounded-xl text-sm">
                Entendido ✓
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
