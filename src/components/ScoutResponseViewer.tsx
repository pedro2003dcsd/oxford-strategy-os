"use client";

import Link from "next/link";
import clsx from "clsx";
import { AREAS } from "@/lib/types";
import type { ReferenciaKr } from "@/lib/scout";

const DOT_CLASSES: Record<ReferenciaKr["semaforo"], string> = {
  verde: "bg-emerald-500",
  amarillo: "bg-amber-500",
  rojo: "bg-red-500",
};

const CARD_CLASSES: Record<ReferenciaKr["semaforo"], string> = {
  verde: "border-emerald-500/30 hover:border-emerald-500/60",
  amarillo: "border-amber-500/30 hover:border-amber-500/60",
  rojo: "border-red-500/30 hover:border-red-500/60",
};

const ESTADO_LABEL: Record<ReferenciaKr["semaforo"], string> = {
  verde: "En línea",
  amarillo: "En riesgo",
  rojo: "Retrasado",
};

function normalizar(s: string): string {
  return s.trim().toLowerCase();
}

/** Render de la respuesta de Scout: Markdown acotado (títulos, viñetas,
 * negritas) + enlaces automáticos a los KRs que la IA menciona entre comillas. */
export function ScoutResponseViewer({
  texto,
  referencias,
}: {
  texto: string;
  referencias: ReferenciaKr[];
}) {
  const porTitulo = new Map<string, ReferenciaKr>();
  for (const r of referencias) porTitulo.set(normalizar(r.titulo), r);

  const textoPlano = normalizar(texto);
  const krsMencionados = referencias.filter((r) =>
    textoPlano.includes(normalizar(r.titulo))
  );
  const areasMencionadas = AREAS.filter((a) =>
    textoPlano.includes(normalizar(a))
  );

  /** Resuelve negritas y convierte "títulos entre comillas" en enlaces al KR. */
  function inline(linea: string, key: number) {
    const partes = linea.split(/(\*\*[^*]+\*\*|"[^"]+")/g);
    return (
      <span key={key}>
        {partes.map((parte, i) => {
          const negrita = parte.startsWith("**") && parte.endsWith("**");
          const contenido = negrita ? parte.slice(2, -2) : parte;

          if (contenido.startsWith('"') && contenido.endsWith('"')) {
            const titulo = contenido.slice(1, -1);
            const ref = porTitulo.get(normalizar(titulo));
            if (ref) {
              return (
                <Link
                  key={i}
                  href={`/kr/${ref.id}`}
                  className={clsx(
                    "mx-0.5 inline-flex items-center gap-1.5 rounded-md bg-linea/60 px-1.5 py-0.5 align-baseline transition hover:bg-linea",
                    negrita && "font-semibold"
                  )}
                  title={`${ESTADO_LABEL[ref.semaforo]} · ${ref.area} · ${ref.responsable}`}
                >
                  <span
                    className={clsx(
                      "h-1.5 w-1.5 shrink-0 rounded-full",
                      DOT_CLASSES[ref.semaforo]
                    )}
                  />
                  {titulo}
                </Link>
              );
            }
          }

          if (negrita) return <strong key={i}>{contenido}</strong>;
          return <span key={i}>{contenido}</span>;
        })}
      </span>
    );
  }

  const lineas = texto.split("\n");

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        {lineas.map((linea, i) => {
          const l = linea.trimEnd();
          const esAlerta = /⚠|ALERTA|🔴/.test(l);
          const esOk = /🎉|✅/.test(l);

          if (l.startsWith("### ")) {
            return (
              <h3 key={i} className="pt-1 text-sm font-semibold">
                {inline(l.slice(4), i)}
              </h3>
            );
          }
          if (l.startsWith("## ")) {
            return (
              <h2 key={i} className="pt-1 text-sm font-semibold">
                {inline(l.slice(3), i)}
              </h2>
            );
          }
          if (l.startsWith("# ")) {
            return (
              <h2 key={i} className="text-base font-semibold">
                {inline(l.slice(2), i)}
              </h2>
            );
          }
          if (/^\s*[-*]\s+/.test(l)) {
            const sangria = (l.length - l.trimStart().length) / 2;
            return (
              <p
                key={i}
                className={clsx(
                  "flex gap-2 text-sm leading-relaxed",
                  esAlerta &&
                    "rounded-md bg-amber-500/10 px-2 py-1 text-amber-800 dark:text-amber-300",
                  esOk && "text-emerald-700 dark:text-emerald-400"
                )}
                style={{ marginLeft: `${sangria * 0.75}rem` }}
              >
                <span className="select-none text-tenue">•</span>
                <span>{inline(l.trimStart().replace(/^[-*]\s+/, ""), i)}</span>
              </p>
            );
          }
          if (/^\s*\d+\.\s+/.test(l)) {
            return (
              <p key={i} className="text-sm leading-relaxed">
                {inline(l.trimStart(), i)}
              </p>
            );
          }
          if (l.startsWith("_") && l.endsWith("_") && l.length > 2) {
            return (
              <p key={i} className="text-xs italic text-tenue">
                {l.slice(1, -1)}
              </p>
            );
          }
          if (l === "") return <div key={i} className="h-1" />;
          return (
            <p
              key={i}
              className={clsx(
                "text-sm leading-relaxed",
                esAlerta &&
                  "rounded-md bg-amber-500/10 px-2 py-1 text-amber-800 dark:text-amber-300",
                esOk && "text-emerald-700 dark:text-emerald-400"
              )}
            >
              {inline(l, i)}
            </p>
          );
        })}
      </div>

      {(krsMencionados.length > 0 || areasMencionadas.length > 0) && (
        <div className="space-y-2 border-t border-linea pt-3">
          <p className="text-xs font-medium text-tenue">Ir a</p>
          {krsMencionados.length > 0 && (
            <div className="grid gap-1.5 sm:grid-cols-2">
              {krsMencionados.map((ref) => (
                <Link
                  key={ref.id}
                  href={`/kr/${ref.id}`}
                  className={clsx(
                    "group flex items-start gap-2 rounded-lg border bg-panel px-2.5 py-2 transition ",
                    CARD_CLASSES[ref.semaforo]
                  )}
                >
                  <span
                    className={clsx(
                      "mt-1.5 h-2 w-2 shrink-0 rounded-full",
                      DOT_CLASSES[ref.semaforo]
                    )}
                  />
                  <span className="min-w-0">
                    <span className="block truncate text-xs font-medium group-hover:underline">
                      {ref.titulo}
                    </span>
                    <span className="block truncate text-[11px] text-tenue">
                      {ESTADO_LABEL[ref.semaforo]} · {ref.area} · {ref.responsable}
                    </span>
                  </span>
                </Link>
              ))}
            </div>
          )}
          {areasMencionadas.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {areasMencionadas.map((area) => (
                <Link
                  key={area}
                  href="/okrs"
                  className="rounded-full border border-linea px-2.5 py-1 text-[11px] text-tenue transition hover:border-oxford/50 hover:text-foreground"
                >
                  {area}
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
