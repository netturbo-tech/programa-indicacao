import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useApp } from "../AppContext";
import { PrimaryButton } from "../components/PrimaryButton";
import { BackgroundGradientAnimation } from "@/components/ui/background-gradient-animation";
import { supabase } from "@/integrations/supabase/client";
import { authEmailForIdentifier, normalizeIdentifier } from "../authIdentifiers";

const LAST_LOGIN_IDENTIFIER_KEY = "indicacao:last-login-identifier";

export function CadastroPage() {
  const navigate = useNavigate();
  const { registerUser } = useApp();
  const [identifier, setIdentifier] = useState("");
  const [senha, setSenha] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    const normalized = normalizeIdentifier(identifier);
    const authEmail = authEmailForIdentifier(identifier);

    const displayName =
      normalized.type === "email" ? normalized.value.split("@")[0] : `Usuário ${identifier.trim()}`;
    const cpf = normalized.type === "cpf" ? normalized.digits : undefined;

    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: authEmail,
      password: senha,
      options: {
        emailRedirectTo: typeof window !== "undefined" ? window.location.origin : undefined,
        data: {
          login_identifier: normalized.value,
          name: displayName,
          ra: normalized.type === "ra" ? normalized.value : undefined,
          cpf,
          funcao: "",
          contrato: "CLT",
          setor: "COMERCIAL",
        },
      },
    });

    if (signUpError) {
      setError(signUpError.message || "Não foi possível concluir o cadastro.");
      setIsSubmitting(false);
      return;
    }

    const signInResult = signUpData.session
      ? { data: signUpData, error: null }
      : await supabase.auth.signInWithPassword({
          email: authEmail,
          password: senha,
        });

    if (signInResult.error) {
      setError(
        "Cadastro criado. Se o login não entrar agora, confirme o acesso pelo e-mail e tente novamente.",
      );
      setIsSubmitting(false);
      return;
    }

    const result = await registerUser({
      identifier,
      password: senha,
      authUserId: signInResult.data.user?.id || signUpData.user?.id,
      name: displayName,
      cpf,
      funcao: "",
      contrato: "CLT",
      setor: "COMERCIAL",
    });

    if (!result.ok) {
      setError(result.error || "Não foi possível salvar o perfil no banco de dados.");
      setIsSubmitting(false);
      return;
    }

    if (typeof window !== "undefined") {
      window.localStorage.setItem(LAST_LOGIN_IDENTIFIER_KEY, identifier.trim());
    }

    navigate({ to: "/app/nova" });
  };

  return (
    <BackgroundGradientAnimation
      containerClassName="h-screen w-full"
      firstColor="14, 14, 14"
      secondColor="10, 10, 10"
      thirdColor="18, 18, 18"
      fourthColor="12, 12, 12"
      fifthColor="15, 15, 15"
      pointerColor="202, 253, 0"
    >
      <div className="fixed inset-0 z-10 flex items-center justify-center overflow-y-auto p-4 font-body selection:bg-primary-container selection:text-on-primary-container">
        <main className="relative grid w-full max-w-4xl gap-0 overflow-hidden rounded-2xl border border-outline-variant/10 bg-surface/20 shadow-[0_24px_64px_rgba(0,0,0,0.8)] backdrop-blur-3xl lg:grid-cols-12 my-auto">
          <div className="absolute top-0 right-[41.666%] z-20 hidden h-full w-px bg-gradient-to-b from-transparent via-primary-container/40 to-transparent shadow-[0_0_40px_rgba(202,253,0,0.3)] lg:block" />

          <div className="hidden lg:flex lg:col-span-7 flex-col justify-between overflow-hidden p-12 lg:p-14 relative">
            <div className="z-10 flex items-center gap-4">
              <img
                src="/logo.png"
                alt="Logo"
                className="h-14 w-14 rounded-xl object-contain shadow-[0_0_30px_rgba(202,253,0,0.2)] mix-blend-screen brightness-125"
              />
              <div className="flex flex-col">
                <span className="font-display text-3xl font-bold italic leading-none tracking-tighter text-primary-container uppercase">
                  Net Turbo
                </span>
                <span className="mt-1 text-[10px] font-black tracking-[0.4em] text-white/50 uppercase">
                  Programa de Indicações
                </span>
              </div>
            </div>

            <div className="z-10 max-w-md space-y-6">
              <h1 className="font-display text-4xl font-bold leading-[0.95] tracking-tight text-white uppercase lg:text-5xl">
                Comece agora. <br />
                <span className="font-light text-primary-container italic lowercase">
                  Indique seu primeiro cliente.
                </span>
              </h1>
              <p className="text-sm font-light leading-relaxed text-on-surface-variant">
                Cadastre seu acesso usando e-mail corporativo, RA ou CPF para entrar no programa de
                indicações.
              </p>
            </div>

            <div className="absolute inset-0 opacity-[0.04] pointer-events-none">
              <div
                className="absolute inset-0"
                style={{
                  backgroundImage:
                    "radial-gradient(circle at 1.5px 1.5px, #cafd00 1px, transparent 0)",
                  backgroundSize: "40px 40px",
                }}
              />
            </div>
          </div>

          <div className="relative flex flex-col justify-center border-l border-outline-variant/10 bg-surface-low p-6 lg:col-span-5 lg:p-10">
            <Link
              to="/"
              className="mb-8 inline-flex items-center gap-2 text-[10px] font-bold tracking-[0.18em] text-outline uppercase transition-colors hover:text-primary-container"
            >
              <ArrowLeft className="h-3 w-3" />
              Voltar ao login
            </Link>

            <header className="mb-8">
              <h2 className="font-display text-2xl font-bold leading-none tracking-tight text-white uppercase lg:text-3xl">
                Criar cadastro
              </h2>
              <p className="mt-3 text-[10px] font-black tracking-[0.2em] text-on-surface-variant uppercase">
                Use e-mail, RA ou CPF.
              </p>
            </header>

            <form onSubmit={handleSubmit} className="space-y-6">
              <Field
                label="E-mail, RA ou CPF"
                type="text"
                value={identifier}
                onChange={(v) => {
                  setIdentifier(v);
                  setError("");
                }}
                placeholder="nome@empresa.com.br, RA ou CPF"
              />
              <Field
                label="Senha"
                type="password"
                value={senha}
                onChange={(v) => {
                  setSenha(v);
                  setError("");
                }}
                placeholder="••••••••"
              />

              {error && <p className="text-xs font-bold text-destructive">{error}</p>}

              <PrimaryButton
                disabled={isSubmitting}
                type="submit"
                className="w-full py-5 text-[10px] tracking-[0.2em] uppercase shadow-[0_15px_30px_rgba(202,253,0,0.1)]"
              >
                {isSubmitting ? "CADASTRANDO..." : "CADASTRAR E ENTRAR"}
                <ArrowRight className="h-3 w-3" />
              </PrimaryButton>
            </form>
          </div>
        </main>
      </div>
    </BackgroundGradientAnimation>
  );
}

function Field({
  label,
  type,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  type: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="group relative">
      <label className="mb-1 block text-[10px] font-bold tracking-[0.2em] text-on-surface-variant uppercase transition-colors group-focus-within:text-primary-container">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full border-0 border-b border-outline-variant/30 bg-transparent px-0 py-3 text-base font-medium text-on-surface transition-all placeholder:text-outline focus:border-primary-container focus:ring-0"
      />
    </div>
  );
}
