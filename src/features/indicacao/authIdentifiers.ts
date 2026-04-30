export function normalizeIdentifier(identifier: string) {
  const value = identifier.trim().toLowerCase();
  const digits = value.replace(/\D/g, "");
  const type = value.includes("@") ? "email" : digits.length === 11 ? "cpf" : "ra";
  return { value, digits, type };
}

export function authEmailForIdentifier(identifier: string) {
  const normalized = normalizeIdentifier(identifier);
  if (normalized.type === "email") return normalized.value;
  if (normalized.type === "cpf") return `${normalized.digits}@cpf.ntt-indicacoes.local`;
  return `${normalized.value.replace(/[^a-z0-9._-]/g, "-")}@ra.ntt-indicacoes.local`;
}