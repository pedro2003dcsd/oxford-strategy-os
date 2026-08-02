"use client";

import { useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { PROMPTS_RAPIDOS, type ReferenciaKr } from "@/lib/scout";
import { ScoutResponseViewer } from "@/components/ScoutResponseViewer";

interface Burbuja {
  id: string;
  role: "user" | "assistant";
  content: string;
  referencias?: ReferenciaKr[];
  fuente?: "ia" | "reglas";
  motivo?: string;
}

const MENSAJES_CARGA = [
  "Scout está consultando la base de datos…",
  "Leyendo los check-ins de la semana…",
  "Cruzando desvíos con la rentabilidad de SOLOP…",
  "Armando la respuesta…",
];

function nuevoId() {
  return Math.random().toString(36).slice(2);
}

export function ScoutChat({ variant = "page" }: { variant?: "page" | "panel" }) {
  const [mensajes, setMensajes] = useState<Burbuja[]>([]);
  const [entrada, setEntrada] = useState("");
  const [cargando, setCargando] = useState(false);
  const [mensajeIdx, setMensajeIdx] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Scroll automático al último mensaje.
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [mensajes, cargando]);

  useEffect(() => {
    if (!cargando) return;
    const id = setInterval(
      () => setMensajeIdx((i) => (i + 1) % MENSAJES_CARGA.length),
      2500
    );
    return () => clearInterval(id);
  }, [cargando]);

  async function enviar(texto: string) {
    const pregunta = texto.trim();
    if (!pregunta || cargando) return;

    const historial: Burbuja[] = [
      ...mensajes,
      { id: nuevoId(), role: "user", content: pregunta },
    ];
    setMensajes(historial);
    setEntrada("");
    setError(null);
    setMensajeIdx(0);
    setCargando(true);

    try {
      const res = await fetch("/api/ai/scout-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: historial.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });
      // Si la respuesta no es JSON (404, 500 o una página de error del host),
      // mostramos el código en vez de un "no se pudo contactar" genérico.
      const tipo = res.headers.get("content-type") ?? "";
      if (!tipo.includes("application/json")) {
        setError(
          res.status === 401 || res.status === 307
            ? "Se cerró la sesión. Volvé a entrar y probá de nuevo."
            : `El servidor respondió ${res.status} sin datos. Si estás en local, revisá que el servidor de desarrollo esté corriendo.`
        );
        return;
      }

      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? `Scout no pudo responder (${res.status}).`);
        return;
      }
      setMensajes((prev) => [
        ...prev,
        {
          id: nuevoId(),
          role: "assistant",
          content: data.respuesta,
          referencias: data.referencias ?? [],
          fuente: data.fuente,
          motivo: data.motivo ?? undefined,
        },
      ]);
    } catch {
      setError(
        "No se pudo contactar al servidor. Si estás en local, arrancá el servidor de desarrollo (npm run dev); si estás en la app publicada, recargá la página."
      );
    } finally {
      setCargando(false);
      inputRef.current?.focus();
    }
  }

  const vacio = mensajes.length === 0;

  return (
    <div
      className={clsx(
        "flex flex-col overflow-hidden rounded-xl border border-black/10 bg-white dark:border-white/10 dark:bg-neutral-900",
        variant === "page" ? "h-[calc(100vh-13rem)] min-h-[28rem]" : "h-full"
      )}
    >
      {/* Header */}
      <header className="flex items-center justify-between gap-3 border-b border-black/10 px-4 py-3 dark:border-white/10">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-sm text-white">
            ✦
          </span>
          <div>
            <p className="text-sm font-semibold leading-tight">
              Scout AI{" "}
              <span className="font-normal text-neutral-500">
                · Asistente de Oxford
              </span>
            </p>
            <p className="flex items-center gap-1.5 text-xs text-neutral-500">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              En línea
            </p>
          </div>
        </div>
        {mensajes.length > 0 && (
          <button
            type="button"
            onClick={() => {
              setMensajes([]);
              setError(null);
            }}
            className="rounded-md px-2 py-1 text-xs text-neutral-500 transition hover:bg-black/5 hover:text-neutral-900 dark:hover:bg-white/10 dark:hover:text-white"
          >
            Limpiar
          </button>
        )}
      </header>

      {/* Conversación */}
      <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
        {vacio && (
          <div className="space-y-4 py-4">
            <div>
              <p className="text-sm font-medium">
                ¿Qué querés saber del trimestre?
              </p>
              <p className="text-sm text-neutral-500">
                Preguntá en lenguaje natural. Scout lee los OKRs, los check-ins y
                la rentabilidad cargados en el sistema.
              </p>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {PROMPTS_RAPIDOS.map((p) => (
                <button
                  key={p.texto}
                  type="button"
                  onClick={() => enviar(`${p.emoji} ${p.texto}`)}
                  className="rounded-lg border border-black/10 px-3 py-2.5 text-left text-sm transition hover:border-black/25 hover:bg-black/[0.03] dark:border-white/10 dark:hover:border-white/30 dark:hover:bg-white/5"
                >
                  <span className="mr-1.5">{p.emoji}</span>
                  {p.texto}
                </button>
              ))}
            </div>
          </div>
        )}

        {mensajes.map((m) =>
          m.role === "user" ? (
            <div key={m.id} className="flex justify-end">
              <p className="max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-br-sm bg-indigo-600 px-3.5 py-2 text-sm text-white">
                {m.content}
              </p>
            </div>
          ) : (
            <div key={m.id} className="flex gap-2.5">
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-[11px] text-white">
                ✦
              </span>
              <div className="min-w-0 flex-1 space-y-2">
                <ScoutResponseViewer
                  texto={m.content}
                  referencias={m.referencias ?? []}
                />
                {m.fuente === "reglas" && (
                  <p className="text-xs text-neutral-500">
                    Respuesta automática sobre los datos del sistema
                    {m.motivo ? ` — ${m.motivo}` : ""}
                  </p>
                )}
              </div>
            </div>
          )
        )}

        {cargando && (
          <div className="flex items-center gap-2.5">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-[11px] text-white">
              ✦
            </span>
            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
            <p className="text-sm text-neutral-500">
              {MENSAJES_CARGA[mensajeIdx]}
            </p>
          </div>
        )}

        {error && (
          <p className="rounded-md bg-red-500/10 px-3 py-2 text-sm text-red-700 dark:text-red-400">
            {error}
          </p>
        )}
      </div>

      {/* Input */}
      <div className="border-t border-black/10 px-4 py-3 dark:border-white/10">
        {!vacio && (
          <div className="mb-2 flex gap-1.5 overflow-x-auto pb-1">
            {PROMPTS_RAPIDOS.map((p) => (
              <button
                key={p.texto}
                type="button"
                disabled={cargando}
                onClick={() => enviar(`${p.emoji} ${p.texto}`)}
                className="shrink-0 rounded-full border border-black/10 px-2.5 py-1 text-xs text-neutral-600 transition hover:border-black/25 hover:text-neutral-900 disabled:opacity-50 dark:border-white/15 dark:text-neutral-300 dark:hover:border-white/40 dark:hover:text-white"
              >
                {p.emoji} {p.texto}
              </button>
            ))}
          </div>
        )}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            enviar(entrada);
          }}
          className="flex items-end gap-2"
        >
          <textarea
            ref={inputRef}
            value={entrada}
            onChange={(e) => setEntrada(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                enviar(entrada);
              }
            }}
            rows={1}
            placeholder="Preguntale a Scout sobre los OKRs, los check-ins o la rentabilidad…"
            className="max-h-32 min-h-[2.5rem] flex-1 resize-none rounded-lg border border-black/15 bg-transparent px-3 py-2 text-sm outline-none transition focus:border-indigo-500 dark:border-white/20"
          />
          <button
            type="submit"
            disabled={cargando || entrada.trim() === ""}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-white transition hover:bg-indigo-500 disabled:opacity-40"
            aria-label="Enviar"
          >
            ↑
          </button>
        </form>
      </div>
    </div>
  );
}
