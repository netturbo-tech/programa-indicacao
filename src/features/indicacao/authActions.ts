import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";

const credentialsSchema = z.object({
  identifier: z.string().trim().min(3).max(255),
  password: z.string().min(6).max(128),
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

/**
 * Strip PostgREST OR-filter special characters from a value before
 * interpolating into `.or()`. Prevents filter injection.
 */
function sanitizeFilterValue(value: string) {
  return value.replace(/[,()"]/g, "");
}

function authEmailForIdentifier(identifier: string) {
  const normalized = normalizeIdentifier(identifier);
  if (normalized.type === "email") return normalized.value;
  if (normalized.type === "cpf") return `${normalized.digits}@cpf.ntt-indicacoes.local`;
  return `${normalized.value.replace(/[^a-z0-9._-]/g, "-")}@ra.ntt-indicacoes.local`;
}

export const registerAuthUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => credentialsSchema.parse(input))
  .handler(async ({ data, context }) => {
    // Only admins can create accounts via the privileged admin API.
    const { data: roleRow, error: roleError } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId)
      .eq("role", "admin")
      .maybeSingle();

    if (roleError || !roleRow) {
      return { ok: false, error: "Apenas administradores podem criar contas." };
    }

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

/**
 * Resolve and sign in by identifier (email/CPF/RA) in a single server-side
 * step. The client never sees the resolved auth email — and an invalid
 * identifier returns the same generic error as a wrong password, which
 * prevents user enumeration.
 */
export const loginWithIdentifier = createServerFn({ method: "POST" })
  .inputValidator((input) => credentialsSchema.parse(input))
  .handler(async ({ data }) => {
    const normalized = normalizeIdentifier(data.identifier);
    const genericError = "Credenciais inválidas." as const;

    const candidateEmails: string[] = [];
    if (normalized.type === "email") {
      candidateEmails.push(normalized.value);
    } else {
      const filters =
        normalized.type === "cpf"
          ? [
              `cpf.eq.${sanitizeFilterValue(normalized.digits)}`,
              `cpf.eq.${sanitizeFilterValue(cpfMask(normalized.digits))}`,
              `login_identifier.eq.${sanitizeFilterValue(normalized.value)}`,
            ]
          : [
              `ra.eq.${sanitizeFilterValue(normalized.value)}`,
              `login_identifier.eq.${sanitizeFilterValue(normalized.value)}`,
            ];

      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("email")
        .or(filters.join(","))
        .limit(1)
        .maybeSingle();

      if (profile?.email) candidateEmails.push(profile.email);
      // Synthetic-email fallback for legacy CPF/RA-only accounts.
      candidateEmails.push(authEmailForIdentifier(data.identifier));
    }

    const env = import.meta.env as Record<string, string | undefined>;
    const SUPABASE_URL =
      process.env.SUPABASE_URL || env.SUPABASE_URL || env.VITE_SUPABASE_URL;
    const SUPABASE_PUBLISHABLE_KEY =
      process.env.SUPABASE_PUBLISHABLE_KEY ||
      env.SUPABASE_PUBLISHABLE_KEY ||
      env.VITE_SUPABASE_PUBLISHABLE_KEY;

    if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
      return { ok: false, error: "Configuração do servidor incompleta." } as const;
    }

    const anon = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    for (const email of candidateEmails) {
      const { data: signIn, error } = await anon.auth.signInWithPassword({
        email,
        password: data.password,
      });
      if (!error && signIn.session) {
        return {
          ok: true as const,
          session: {
            access_token: signIn.session.access_token,
            refresh_token: signIn.session.refresh_token,
          },
        };
      }
    }

    return { ok: false as const, error: genericError };
  });
