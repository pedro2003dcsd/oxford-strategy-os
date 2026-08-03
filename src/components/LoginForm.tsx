"use client";

import { useActionState } from "react";
import { useSearchParams } from "next/navigation";
import { login, type LoginState } from "@/app/login/actions";
import { GoogleLoginButton } from "@/components/GoogleLoginButton";

function mensajeDeError(codigo: string | null, email: string | null): string | null {
  if (!codigo) return null;
  if (codigo === "no-autorizado") {
    return `La cuenta ${email ?? ""} no está habilitada para entrar a Oxford Strategy OS. Pedile a Dirección que te agregue.`.trim();
  }
  if (codigo === "sin-codigo" || codigo === "no-se-pudo-entrar") {
    return "No se pudo completar el ingreso con Google. Probá de nuevo.";
  }
  return codigo;
}

export function LoginForm() {
  const params = useSearchParams();
  const [state, action, pending] = useActionState<LoginState, FormData>(
    login,
    undefined
  );

  const next = params.get("next") ?? undefined;
  const errorExterno = mensajeDeError(params.get("error"), params.get("email"));

  return (
    <div className="w-full max-w-sm space-y-5 rounded-xl border border-linea p-8">
      <div>
        <h1 className="text-xl font-semibold">Oxford Strategy OS</h1>
        <p className="text-sm text-tenue">
          Ingresá con tu cuenta de Grupo Oxford.
        </p>
      </div>

      {errorExterno && (
        <p className="rounded-md bg-red-500/10 px-3 py-2 text-sm text-red-700 dark:text-red-400">
          {errorExterno}
        </p>
      )}

      <GoogleLoginButton next={next} />

      <div className="flex items-center gap-3">
        <span className="h-px flex-1 bg-linea" />
        <span className="text-xs text-tenue">o con email</span>
        <span className="h-px flex-1 bg-linea" />
      </div>

      <form action={action} className="space-y-4">
        <div className="space-y-1">
          <label htmlFor="email" className="text-sm font-medium">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            className="w-full rounded-md border border-linea bg-transparent px-3 py-2 text-sm"
          />
        </div>
        <div className="space-y-1">
          <label htmlFor="password" className="text-sm font-medium">
            Contraseña
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
            className="w-full rounded-md border border-linea bg-transparent px-3 py-2 text-sm"
          />
        </div>
        {state?.error && (
          <p className="text-sm text-red-700 dark:text-red-400">{state.error}</p>
        )}
        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-md bg-oxford px-3 py-2 text-sm font-medium text-white transition hover:bg-oxford-fuerte disabled:opacity-50"
        >
          {pending ? "Ingresando…" : "Ingresar"}
        </button>
      </form>
    </div>
  );
}
