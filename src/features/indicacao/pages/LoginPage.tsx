import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { ArrowRight, Eye, EyeOff } from "lucide-react";
import { useApp } from "../AppContext";
import { PrimaryButton } from "../components/PrimaryButton";
import { BackgroundGradientAnimation } from "@/components/ui/background-gradient-animation";
import { supabase } from "@/integrations/supabase/client";
import { authEmailForIdentifier, normalizeIdentifier } from "../authIdentifiers";
import { resolveLoginIdentifier } from "../authActions";

const LAST_LOGIN_IDENTIFIER_KEY = "indicacao:last-login-identifier";
const LOGIN_TIMEOUT_MS = 15000;

function withTimeout<T>(promise: Promise<T>, message: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => window.setTimeout(() => reject(new Error(message)), LOGIN_TIMEOUT_MS)),
  ]);
}

function loginErrorMessage(message?: string) {
  const normalized = (message || "").toLowerCase();

  if (normalized.includes("tempo limite") || normalized.includes("timeout")) {
    return "O Supabase demorou para responder. Verifique a conexão e tente novamente.";
  }

  if (normalized.includes("invalid login credentials")) {
    return "E-mail, RA, CPF ou senha inválidos.";
  }

  if (normalized.includes("email not confirmed")) {
    return "Seu e-mail ainda não foi confirmado.";
  }

  if (normalized.includes("too many requests") || normalized.includes("rate limit")) {
    return "Muitas tentativas de login. Aguarde alguns minutos e tente novamente.";
  }

  if (!message) {
    return "Não foi possível acessar. Tente novamente.";
  }

  return `Erro ao acessar: ${message}`;
}

export function LoginPage() {
  const { registerUser } = useApp();
  const navigate = useNavigate();
  const [email, setEmail] = useState(() =>
    typeof window === "undefined"
      ? ""
      : window.localStorage.getItem(LAST_LOGIN_IDENTIFIER_KEY) || "",
  );
  const [senha, setSenha] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const normalized = normalizeIdentifier(email);
      let loginEmail: string;

      if (normalized.type === "email") {
        loginEmail = normalized.value;
      } else {
        // CPF/RA: busca o e-mail real cadastrado no perfil.
        const resolved = await withTimeout(
          resolveLoginIdentifier({ data: { identifier: email } }),
          "Tempo limite ao localizar cadastro.",
        );
        if (!resolved.ok || !resolved.email) {
          setError(resolved.error || "Cadastro não encontrado para este CPF/RA.");
          return;
        }
        loginEmail = resolved.email;
      }

      let { data: signInData, error: signInError } = await withTimeout(
        supabase.auth.signInWithPassword({
          email: loginEmail,
          password: senha,
        }),
        "Tempo limite ao conectar com o Supabase.",
      );

      // Fallback para contas antigas criadas com e-mail sintético de CPF/RA.
      if (signInError && normalized.type !== "email") {
        const synthetic = authEmailForIdentifier(email);
        if (synthetic !== loginEmail) {
          const retry = await withTimeout(
            supabase.auth.signInWithPassword({
              email: synthetic,
              password: senha,
            }),
            "Tempo limite ao conectar com o Supabase.",
          );
          signInData = retry.data;
          signInError = retry.error;
        }
      }

      if (signInError) {
        setError(loginErrorMessage(signInError.message));
        return;
      }

      const result = await withTimeout(
        registerUser({
          identifier: email,
          password: senha,
          authUserId: signInData.user?.id,
        }),
        "Tempo limite ao carregar o perfil do usuário.",
      );

      if (!result.ok) {
        setError(result.error || "Não foi possível carregar o perfil.");
        return;
      }

      if (typeof window !== "undefined") {
        window.localStorage.setItem(LAST_LOGIN_IDENTIFIER_KEY, email.trim());
      }
      navigate({ to: "/app/nova" });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro inesperado no login.";
      setError(loginErrorMessage(message));
    } finally {
      setIsSubmitting(false);
    }
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
      <div className="fixed inset-0 z-10 flex items-center justify-center p-4 selection:bg-primary-container selection:text-on-primary-container font-body overflow-y-auto">
        {/* Main Editorial Card */}
        <main className="relative my-auto grid w-full max-w-[58rem] min-h-[480px] overflow-hidden rounded-2xl border border-outline-variant/10 bg-surface/20 shadow-[0_24px_64px_rgba(0,0,0,0.8)] backdrop-blur-3xl lg:grid-cols-12">
          {/* Mancha Verde / Green Glow at the division */}
          <div className="absolute top-0 right-[41.666%] w-px h-full bg-gradient-to-b from-transparent via-primary-container/40 to-transparent z-20 hidden lg:block shadow-[0_0_40px_rgba(202,253,0,0.3)]" />

          {/* Left Side: Marketing Content */}
          <div className="relative hidden flex-col justify-between overflow-hidden p-9 lg:col-span-7 lg:flex xl:p-10">
            <div className="z-10 flex items-center gap-3">
              <img
                src="/logo.png"
                alt="Logo"
                className="h-10 w-10 object-contain shadow-[0_0_30px_rgba(202,253,0,0.2)] rounded-xl mix-blend-screen brightness-125"
              />
              <div className="flex flex-col">
                <span className="text-primary-container font-display text-xl font-bold italic uppercase leading-none">
                  Net Turbo
                </span>
                <span className="mt-1 text-[9px] font-black uppercase tracking-[0.35em] text-white/50">
                  Programa de Indicações
                </span>
              </div>
            </div>

            <div className="z-10 max-w-[25rem] space-y-6">
              <h1 className="font-display text-[2.45rem] font-bold uppercase leading-[0.95] tracking-tight text-white animate-in slide-in-from-left duration-700 xl:text-[2.85rem]">
                Indique. Ganhe. <br />
                <span className="text-primary-container italic font-light lowercase">
                  Faça o time crescer.
                </span>
              </h1>

              <div className="max-w-sm space-y-3">
                <div className="space-y-1">
                  <h2 className="font-display text-sm font-bold uppercase tracking-tight text-white">
                    Como Funciona?
                  </h2>
                  <div className="h-[2px] w-10 bg-primary-container" />
                </div>
                <p className="text-xs leading-5 text-on-surface-variant">
                  Para realizar uma indicação, o colaborador deverá registrar o potencial cliente
                  através do canal oficial. E após venda e confirmação da implantação do contrato os
                  créditos do programa serão liberados.
                </p>
                <div className="pt-1">
                  <span className="text-primary-container font-display text-sm font-bold uppercase tracking-tight">
                    R$ 200 em créditos por venda realizada
                  </span>
                </div>
              </div>
            </div>

            <div className="z-10" />

            {/* Kinetic Texture Overlay */}
            <div className="absolute top-0 right-0 w-full h-full opacity-[0.04] pointer-events-none">
              <div
                className="absolute inset-0"
                style={{
                  backgroundImage:
                    "radial-gradient(circle at 1.5px 1.5px, #cafd00 1px, transparent 0)",
                  backgroundSize: "40px 40px",
                }}
              ></div>
            </div>
          </div>

          {/* Right Side: Login Form */}
          <div className="relative flex flex-col justify-center border-l border-outline-variant/10 bg-surface-low p-6 sm:p-8 lg:col-span-5 lg:p-9 xl:p-10">
            <header className="mb-7">
              <h2 className="mb-2 font-display text-xl font-bold uppercase leading-none tracking-tight text-white lg:text-2xl">
                Indique um cliente!
              </h2>
              <p className="mt-3 text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant">
                Identifique-se para continuar.
              </p>
            </header>

            <form onSubmit={handleEmailLogin} className="space-y-5">
              <Field
                label="Seu E-mail, RA ou CPF"
                type="text"
                value={email}
                onChange={(v) => {
                  setEmail(v);
                  setError("");
                }}
                placeholder="nome@empresa.com.br, RA ou CPF"
              />
              <Field
                label="Sua Senha"
                type={showPassword ? "text" : "password"}
                value={senha}
                onChange={(v) => {
                  setSenha(v);
                  setError("");
                }}
                placeholder="••••••••"
                showForgot
                showPasswordToggle
                isPasswordVisible={showPassword}
                onTogglePassword={() => setShowPassword((current) => !current)}
              />
              {error && <p className="text-xs font-bold text-destructive">{error}</p>}

              <div className="pt-2">
                <PrimaryButton
                  disabled={isSubmitting}
                  type="submit"
                  className="w-full py-4 text-[9px] tracking-[0.22em] uppercase shadow-[0_15px_30px_rgba(202,253,0,0.1)]"
                >
                  {isSubmitting ? "ENTRANDO..." : "ENTRAR NO DASHBOARD"}
                  <ArrowRight className="h-3 w-3" />
                </PrimaryButton>
              </div>
            </form>

            <div className="mt-5 rounded-xl border border-outline-variant/10 bg-surface-high/20 p-4 text-center">
              <p className="text-[9px] uppercase tracking-[0.18em] text-on-surface-variant font-black">
                Ainda não tem acesso?
              </p>
              <Link
                to="/cadastro"
                className="mt-2 inline-flex text-[10px] font-bold uppercase tracking-[0.18em] text-primary-container transition-colors hover:text-on-surface"
              >
                Cadastrar nova conta
              </Link>
            </div>
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
  showForgot = false,
  showPasswordToggle = false,
  isPasswordVisible = false,
  onTogglePassword,
}: {
  label: string;
  type: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  showForgot?: boolean;
  showPasswordToggle?: boolean;
  isPasswordVisible?: boolean;
  onTogglePassword?: () => void;
}) {
  return (
    <div className="group relative">
      <div className="flex justify-between items-end mb-1">
        <label className="block text-[9px] uppercase tracking-[0.2em] text-on-surface-variant font-bold group-focus-within:text-primary-container transition-colors">
          {label}
        </label>
        {showForgot && (
          <a
            className="text-[9px] uppercase tracking-wider text-outline hover:text-primary-container transition-colors font-bold"
            href="#"
          >
            Esqueceu?
          </a>
        )}
      </div>
      <div className="relative">
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-transparent border-0 border-b border-outline-variant/30 py-2.5 px-0 pr-10 text-sm font-medium text-on-surface placeholder:text-outline focus:ring-0 focus:border-primary-container transition-all"
        />
        {showPasswordToggle && onTogglePassword && (
          <button
            type="button"
            onClick={onTogglePassword}
            className="absolute right-0 top-1/2 -translate-y-1/2 p-2 text-outline transition-colors hover:text-primary-container focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary-container"
            aria-label={isPasswordVisible ? "Ocultar senha" : "Mostrar senha"}
          >
            {isPasswordVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        )}
      </div>
    </div>
  );
}
