export type Role = "admin" | "aprovador" | "usuario" | "usuario_ra";
export type Contrato = "CLT" | "PJ";

export type Setor =
  | "GT"
  | "BACK OFFICE"
  | "COMERCIAL"
  | "COMPRAS"
  | "FINANCEIRO"
  | "IMPLANTAÇÃO"
  | "LOGÍSTICA"
  | "MANUTENÇÃO"
  | "MARKETING"
  | "NOC"
  | "NT TECH"
  | "O&M"
  | "PROCESSO E QUALIDADE"
  | "PROJETOS"
  | "TI";

export type Produto =
  | "Conectividade"
  | "Wifi"
  | "Firewall"
  | "Switch"
  | "Backup"
  | "VOZ";

export type StatusIndicacao =
  | "Indicado"
  | "Qualificado"
  | "Desqualificado"
  | "Reunião agendada"
  | "Reunião realizada"
  | "Proposta em análise"
  | "Contrato assinado"
  | "Venda perdida";

export interface User {
  id: string;
  authUserId?: string;
  name: string;
  email: string;
  loginId?: string;
  ra?: string;
  cpf?: string;
  funcao?: string;
  role: Role;
  contrato: Contrato;
  setor: Setor;
  onboardingCompleted?: boolean;
}

export interface Indicacao {
  id: string;
  status: StatusIndicacao;
  leadNome: string;
  empresa: string;
  telefone: string;
  emailLead: string;
  produto: Produto;
  emailIndicador: string;
  setor: Setor;
  funcao: string;
  contrato: Contrato;
  observacao: string;
  criadoPorId: string;
  criadoPorNome: string;
  criadoEm: string;
  modificadoEm: string;
  modificadoPorNome: string;
  recompensaPaga?: boolean;
}

export const SETORES: Setor[] = [
  "GT",
  "BACK OFFICE",
  "COMERCIAL",
  "COMPRAS",
  "FINANCEIRO",
  "IMPLANTAÇÃO",
  "LOGÍSTICA",
  "MANUTENÇÃO",
  "MARKETING",
  "NOC",
  "NT TECH",
  "O&M",
  "PROCESSO E QUALIDADE",
  "PROJETOS",
  "TI",
];

export const CONTRATOS: Contrato[] = ["CLT", "PJ"];

export const PRODUTOS: Produto[] = [
  "Conectividade",
  "Wifi",
  "Firewall",
  "Switch",
  "Backup",
  "VOZ",
];

export const STATUSES: StatusIndicacao[] = [
  "Indicado",
  "Qualificado",
  "Desqualificado",
  "Reunião agendada",
  "Reunião realizada",
  "Proposta em análise",
  "Contrato assinado",
  "Venda perdida",
];

export const STATUS_STYLES: Record<StatusIndicacao, { dot: string; bg: string; text: string; border: string }> = {
  Indicado: { dot: "bg-amber-400", bg: "bg-amber-500/10", text: "text-amber-400", border: "border-amber-500/20" },
  Qualificado: { dot: "bg-sky-400", bg: "bg-sky-500/10", text: "text-sky-400", border: "border-sky-500/20" },
  Desqualificado: { dot: "bg-rose-500", bg: "bg-rose-500/10", text: "text-rose-400", border: "border-rose-500/20" },
  "Reunião agendada": { dot: "bg-indigo-400", bg: "bg-indigo-500/10", text: "text-indigo-400", border: "border-indigo-500/20" },
  "Reunião realizada": { dot: "bg-violet-400", bg: "bg-violet-500/10", text: "text-violet-400", border: "border-violet-500/20" },
  "Proposta em análise": { dot: "bg-emerald-400", bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/20" },
  "Contrato assinado": { dot: "bg-primary-container", bg: "bg-primary-container/10", text: "text-primary-container", border: "border-primary-container/20" },
  "Venda perdida": { dot: "bg-zinc-500", bg: "bg-zinc-500/10", text: "text-zinc-400", border: "border-zinc-500/20" },
};

export const VALOR_RECOMPENSA = 200;
export const META_TRIMESTRAL = 10;
export const LIMITE_CLT_MES = 2;

export interface Contato {
  id: string;
  nome: string;
  email: string;
  cnpj: string;
  razaoSocial: string;
  nomeFantasia: string;
  telefoneFixo: string;
  celular: string;
  observacao: string;
  criadoPorId: string;
  criadoPorNome: string;
  criadoEm: string;
  modificadoEm: string;
  modificadoPorNome: string;
}