import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const credentialsSchema = z.object({
  identifier: z.string().trim().min(3).max(255),
  password: z.string().min(6).max(128),
});

const identifierSchema = z.object({
  identifier: z.string().trim().min(3).max(255),
});

const replaceEmailSchema = z.object({
  userId: z.string().uuid(),
  newEmail: z.string().trim().email().max(255),
});

function normalizeIdentifier(identifier: string) {
  const value = identifier.trim().toLowerCase();
  const digits = value.replace(/\D/g, "");
  const type = value.includes("@") ? "email" : digits.length === 11 ? "cpf" : "ra";
  return { value, digits, type };
}

function cpfMask(digits: string) {
  return digits
    .slice(0, 11)
    .replace(/^(\d{3})(\d)/, "$1.$2")
    .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1-$2");
}

function authEmailForIdentifier(identifier: string) {
  const normalized = normalizeIdentifier(identifier);
  if (normalized.type === "email") return normalized.value;
  if (normalized.type === "cpf") return `${normalized.digits}@cpf.ntt-indicacoes.local`;
  return `${normalized.value.replace(/[^a-z0-9._-]/g, "-")}@ra.ntt-indicacoes.local`;
}

export const registerAuthUser = createServerFn({ method: "POST" })
  .inputValidator((input) => credentialsSchema.parse(input))
  .handler(async ({ data }) => {
    const normalized = normalizeIdentifier(data.identifier);
    const email = authEmailForIdentifier(data.identifier);

    const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: data.password,
      email_confirm: true,
      user_metadata: {
        login_identifier: normalized.value,
        name:
          normalized.type === "email"
            ? normalized.value.split("@")[0]
            : `Usuário ${data.identifier.trim()}`,
        ra: normalized.type === "ra" ? normalized.value : undefined,
        cpf: normalized.type === "cpf" ? normalized.digits : undefined,
        contrato: "CLT",
        setor: "COMERCIAL",
      },
    });

    if (error || !created.user) {
      return { ok: false, error: error?.message || "Não foi possível criar o usuário." };
    }

    // Garante que o usuário tenha uma role inicial
    await supabaseAdmin.from("user_roles").insert({
      user_id: created.user.id,
      role: "usuario",
    });

    return { ok: true, email };
  });

export const resolveLoginIdentifier = createServerFn({ method: "POST" })
  .inputValidator((input) => identifierSchema.parse(input))
  .handler(async ({ data }) => {
    const normalized = normalizeIdentifier(data.identifier);

    // Para e-mail, retorna direto sem consultar o banco.
    if (normalized.type === "email") {
      return { ok: true, email: normalized.value };
    }

    // Busca por CPF (com e sem máscara), RA ou login_identifier.
    const filters =
      normalized.type === "cpf"
        ? [
            `cpf.eq.${normalized.digits}`,
            `cpf.eq.${cpfMask(normalized.digits)}`,
            `login_identifier.eq.${normalized.value}`,
          ]
        : [
            `ra.eq.${normalized.value}`,
            `login_identifier.eq.${normalized.value}`,
          ];

    const { data: profile, error } = await supabaseAdmin
      .from("profiles")
      .select("email")
      .or(filters.join(","))
      .limit(1)
      .maybeSingle();

    if (error) {
      return { ok: false, error: `Erro ao localizar cadastro: ${error.message}` };
    }

    if (!profile?.email) {
      // Fallback: tenta o e-mail sintético antigo (contas criadas só por CPF/RA).
      const fallback =
        normalized.type === "cpf"
          ? `${normalized.digits}@cpf.ntt-indicacoes.local`
          : `${normalized.value.replace(/[^a-z0-9._-]/g, "-")}@ra.ntt-indicacoes.local`;
      return { ok: true, email: fallback };
    }

    return { ok: true, email: profile.email };
  });

export const replaceAuthEmail = createServerFn({ method: "POST" })
  .inputValidator((input) => replaceEmailSchema.parse(input))
  .handler(async ({ data }) => {
    const newEmail = data.newEmail.trim().toLowerCase();

    const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(data.userId, {
      email: newEmail,
      email_confirm: true,
    });
    if (authError) {
      return { ok: false, error: `Erro ao atualizar e-mail no login: ${authError.message}` };
    }

    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .update({ email: newEmail, login_identifier: newEmail })
      .eq("user_id", data.userId);
    if (profileError) {
      return { ok: false, error: `Erro ao atualizar e-mail no perfil: ${profileError.message}` };
    }

    return { ok: true, email: newEmail };
  });
