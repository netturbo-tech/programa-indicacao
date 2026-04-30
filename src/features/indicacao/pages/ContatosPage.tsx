import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Filter, Download, MoreVertical, Pencil, Trash2, X } from "lucide-react";
import { useApp } from "../AppContext";
import { Avatar } from "../components/Avatar";
import { PrimaryButton } from "../components/PrimaryButton";
import type { Contato } from "../types";

function fmtDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

export function ContatosPage() {
  const { user, visibleContatos, updateContato, deleteContato } = useApp();
  const [showFilter, setShowFilter] = useState(false);
  const [fSearch, setFSearch] = useState("");
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [editing, setEditing] = useState<Contato | null>(null);

  const filtered = useMemo(() => {
    const q = fSearch.trim().toLowerCase();
    if (!q) return visibleContatos;
    return visibleContatos.filter((c) =>
      [c.nome, c.email, c.cnpj, c.razaoSocial, c.nomeFantasia, c.observacao].some((v) =>
        v.toLowerCase().includes(q),
      ),
    );
  }, [visibleContatos, fSearch]);

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

  const canEdit = (c: Contato) =>
    user.role === "admin" || (user.role === "usuario_ra" && c.criadoPorId === user.id);
  const canDelete = (c: Contato) =>
    user.role === "admin" || (user.role === "usuario_ra" && c.criadoPorId === user.id);

  const handleExport = () => {
    const rows = [
      [
        "Nome",
        "Email",
        "CNPJ",
        "Razão Social",
        "Nome Fantasia",
        "Telefone Fixo",
        "Celular",
        "Observações",
        "Criado por",
        "Criado em",
      ].join(","),
      ...filtered.map((c) =>
        [
          c.nome,
          c.email,
          c.cnpj,
          c.razaoSocial,
          c.nomeFantasia,
          c.telefoneFixo,
          c.celular,
          c.observacao,
          c.criadoPorNome,
          new Date(c.criadoEm).toLocaleDateString("pt-BR"),
        ]
          .map((v) => `"${String(v).replace(/"/g, '""')}"`)
          .join(","),
      ),
    ].join("\n");
    const blob = new Blob([rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `contatos-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV exportado.");
  };

  return (
    <div className="max-w-7xl mx-auto space-y-10 animate-in fade-in duration-700 font-body">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-outline-variant/10">
        <div className="space-y-2">
          <h1 className="font-display text-5xl md:text-7xl font-bold tracking-tighter uppercase leading-none">
            {user.role === "admin" || user.role === "aprovador" ? "Todos" : "Meus"} <br />
             <span className="italic font-light text-on-surface-variant">Contatos Quentes</span>
          </h1>
          <p className="text-[10px] text-outline uppercase tracking-widest font-bold">
            {filtered.length} itens encontrados no banco de dados
          </p>
        </div>

        <div className="flex items-center gap-3">
          <PrimaryButton
            variant="secondary"
            onClick={() => setShowFilter((v) => !v)}
            className="px-4 py-2 text-[10px] tracking-widest"
          >
            <Filter className="h-3 w-3" /> FILTRAR
          </PrimaryButton>
          <PrimaryButton
            variant="secondary"
            onClick={handleExport}
            className="px-4 py-2 text-[10px] tracking-widest"
          >
            <Download className="h-3 w-3" /> EXPORTAR
          </PrimaryButton>
        </div>
      </header>

      {showFilter && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 p-8 bg-surface-low rounded-xl animate-in slide-in-from-top-4 duration-500">
          <label className="block md:col-span-3">
            <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-[#888888]">
              Buscar
            </span>
            <input
              value={fSearch}
              onChange={(e) => setFSearch(e.target.value)}
              placeholder="Nome, email, CNPJ, razão social..."
              className="w-full rounded-lg border border-[#2a2a2a] bg-[#111111] px-3 py-2 text-sm text-white outline-none focus:border-[#CCFF00]"
            />
          </label>
          <div className="flex items-end pb-1">
            <button
              type="button"
              onClick={() => setFSearch("")}
              className="text-[10px] font-black uppercase tracking-widest text-primary-container hover:underline underline-offset-4"
            >
              Resetar Filtros
            </button>
          </div>
        </div>
      )}

      <div className="overflow-hidden rounded-xl bg-surface-low shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-highest/50 border-b border-outline-variant/10">
                <th className="px-6 py-5 text-[10px] uppercase tracking-[0.2em] font-black text-outline">
                  Colaborador
                </th>
                <th className="px-6 py-5 text-[10px] uppercase tracking-[0.2em] font-black text-outline">
                  Contato / Empresa
                </th>
                <th className="px-6 py-5 text-[10px] uppercase tracking-[0.2em] font-black text-outline hidden md:table-cell">
                  CNPJ
                </th>
                <th className="px-6 py-5 text-[10px] uppercase tracking-[0.2em] font-black text-outline hidden lg:table-cell">
                  Telefones
                </th>
                <th className="px-6 py-5 text-[10px] uppercase tracking-[0.2em] font-black text-outline">
                  Datas
                </th>
                <th className="px-6 py-5 text-[10px] uppercase tracking-[0.2em] font-black text-outline text-right">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/5">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center">
                    <div className="text-outline-variant font-display text-lg uppercase tracking-widest italic">
                      Nenhum contato encontrado
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((c) => (
                  <tr key={c.id} className="group hover:bg-surface-high/50 transition-colors">
                    <td className="px-6 py-6">
                      <div className="flex items-center gap-3">
                        <Avatar
                          name={c.criadoPorNome}
                          size="sm"
                          className="ring-2 ring-primary-container/20"
                        />
                        <span className="text-xs font-bold uppercase tracking-tight text-on-surface">
                          {c.criadoPorNome}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-6">
                      <div className="space-y-1">
                        <div className="text-sm font-bold uppercase tracking-tight text-white group-hover:text-primary-container transition-colors">
                          {c.nome}
                        </div>
                        <div className="text-[10px] font-medium text-outline uppercase tracking-wider">
                          {c.nomeFantasia || c.razaoSocial}
                        </div>
                        <div className="text-[10px] font-medium text-outline-variant">
                          {c.email}
                        </div>
                        {c.observacao && (
                          <div className="max-w-sm text-[10px] font-medium text-on-surface-variant line-clamp-2">
                            {c.observacao}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-6 hidden md:table-cell">
                      <span className="text-xs font-medium text-on-surface-variant">
                        {c.cnpj || "—"}
                      </span>
                    </td>
                    <td className="px-6 py-6 hidden lg:table-cell">
                      <div className="space-y-0.5">
                        <div className="text-[10px] font-medium text-on-surface-variant">
                          Fixo: {c.telefoneFixo || "—"}
                        </div>
                        <div className="text-[10px] font-medium text-on-surface-variant">
                          Cel: {c.celular || "—"}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-6">
                      <div className="space-y-0.5">
                        <div className="text-[10px] font-bold text-on-surface-variant">
                          C: {fmtDate(c.criadoEm)}
                        </div>
                        <div className="text-[10px] font-medium text-outline">
                          M: {fmtDate(c.modificadoEm)}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-6 text-right">
                      {canEdit(c) || canDelete(c) ? (
                        <div className="relative inline-block">
                          <button
                            type="button"
                            onClick={() => setOpenMenu(openMenu === c.id ? null : c.id)}
                            className="p-2 rounded-lg text-outline hover:text-white hover:bg-surface-highest transition-all"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </button>
                          {openMenu === c.id && (
                            <div
                              className="absolute right-0 top-full z-20 mt-2 w-48 overflow-hidden rounded-xl bg-surface-high border border-outline-variant/20 shadow-2xl animate-in zoom-in-95 duration-200"
                              onMouseLeave={() => setOpenMenu(null)}
                            >
                              {canEdit(c) && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditing(c);
                                    setOpenMenu(null);
                                  }}
                                  className="flex w-full items-center gap-3 px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-white hover:bg-primary-container hover:text-on-primary-container transition-colors"
                                >
                                  <Pencil className="h-3.5 w-3.5" /> Editar
                                </button>
                              )}
                              {canDelete(c) && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (confirm("Excluir este contato?")) {
                                      deleteContato(c.id);
                                      setOpenMenu(null);
                                      toast.success("Excluído.");
                                    }
                                  }}
                                  className="flex w-full items-center gap-3 px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-red-400 hover:bg-red-500 hover:text-white transition-colors"
                                >
                                  <Trash2 className="h-3.5 w-3.5" /> Excluir
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs font-bold text-outline">—</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {editing && (
        <EditContatoModal
          contato={editing}
          onClose={() => setEditing(null)}
          onSave={(patch) => {
            updateContato(editing.id, patch);
            setEditing(null);
            toast.success("Contato atualizado.");
          }}
        />
      )}
    </div>
  );
}

function EditContatoModal({
  contato,
  onClose,
  onSave,
}: {
  contato: Contato;
  onClose: () => void;
  onSave: (patch: Partial<Contato>) => void;
}) {
  const [form, setForm] = useState({
    nome: contato.nome,
    email: contato.email,
    cnpj: contato.cnpj,
    razaoSocial: contato.razaoSocial,
    nomeFantasia: contato.nomeFantasia,
    telefoneFixo: contato.telefoneFixo,
    celular: contato.celular,
    observacao: contato.observacao,
  });
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4" onClick={onClose}>
      <div
        className="w-full max-w-xl rounded-2xl border border-[#2a2a2a] bg-[#1a1a1a] p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-white">Editar Contato</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-[#AAAAAA] hover:bg-[#2a2a2a] hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <ModalField
            label="Nome"
            value={form.nome}
            onChange={(v) => setForm({ ...form, nome: v })}
          />
          <ModalField
            label="Email"
            value={form.email}
            onChange={(v) => setForm({ ...form, email: v })}
          />
          <ModalField
            label="CNPJ"
            value={form.cnpj}
            onChange={(v) => setForm({ ...form, cnpj: v })}
          />
          <ModalField
            label="Telefone Fixo"
            value={form.telefoneFixo}
            onChange={(v) => setForm({ ...form, telefoneFixo: v })}
          />
          <ModalField
            label="Celular"
            value={form.celular}
            onChange={(v) => setForm({ ...form, celular: v })}
          />
          <ModalField
            label="Razão Social"
            value={form.razaoSocial}
            onChange={(v) => setForm({ ...form, razaoSocial: v })}
          />
          <ModalField
            label="Nome Fantasia"
            value={form.nomeFantasia}
            onChange={(v) => setForm({ ...form, nomeFantasia: v })}
          />
          <ModalTextarea
            label="Observações"
            value={form.observacao}
            onChange={(v) => setForm({ ...form, observacao: v.slice(0, 1000) })}
          />
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <PrimaryButton variant="secondary" onClick={onClose}>
            Cancelar
          </PrimaryButton>
          <PrimaryButton onClick={() => onSave(form)}>Salvar</PrimaryButton>
        </div>
      </div>
    </div>
  );
}

function ModalField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-[#AAAAAA]">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-[#2a2a2a] bg-[#111111] px-3.5 py-2.5 text-sm text-white outline-none focus:border-[#CCFF00]"
      />
    </label>
  );
}

function ModalTextarea({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block md:col-span-2">
      <span className="mb-1.5 block text-xs font-medium text-[#AAAAAA]">{label}</span>
      <textarea
        value={value}
        maxLength={1000}
        rows={4}
        onChange={(e) => onChange(e.target.value)}
        className="w-full resize-none rounded-lg border border-[#2a2a2a] bg-[#111111] px-3.5 py-2.5 text-sm text-white outline-none focus:border-[#CCFF00]"
      />
    </label>
  );
}
