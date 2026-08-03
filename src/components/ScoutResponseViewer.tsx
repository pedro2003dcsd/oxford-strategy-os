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

/** Estados y márgenes que la IA escribe como texto plano se muestran como
 * insignias: proyectado en una pantalla, "Margen 54%" en gris se pierde. */
const PATRON_BADGE =
  /(🔴\s*Retrasado|🟡\s*En riesgo|🟢\s*En línea|Retrasado|En riesgo|En línea|[Mm]argen(?:\s+real)?\s+\d+(?:[.,]\d+)?\s*%|\d+(?:[.,]\d+)?\s*%\s+de\s+margen)/g;

/** Versión anclada y sin flag global: `test` sobre un regex /g mueve
 * lastIndex y devuelve falsos negativos en llamadas alternadas. */
const ES_BADGE = new RegExp(`^(?:${PATRON_BADGE.source})$`);

function claseBadge(texto: string): string {
  const t = texto.toLowerCase();
  if (t.includes("retrasado") || t.includes("🔴")) {
    return "bg-red-500/15 text-red-700 dark:text-red-300";
  }
  if (t.includes("riesgo") || t.includes("🟡")) {
    return "bg-amber-500/15 text-amber-800 dark:text-amber-300";
  }
  if (t.includes("línea") || t.includes("🟢")) {
    return "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300";
  }
  // Márgenes: por debajo de la meta van en rojo, arriba en verde.
  const n = Number(t.replace(",", ".").match(/(\d+(?:\.\d+)?)\s*%/)?.[1]);
  if (!Number.isNaN(n)) {
    return n < 65
      ? "bg-red-500/15 text-red-700 dark:text-red-300"
      : "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300";
  }
  return "bg-linea text-foreground";
}

function Badge({ texto }: { texto: string }) {
  const esMargen = /margen|%/i.test(texto);
  return (
    <span
      className={clsx(
        "mx-0.5 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold",
        claseBadge(texto)
      )}
    >
      {esMargen && !texto.includes("💰") ? `💰 ${texto}` : texto}
    </span>
  );
}

/** Render de la respuesta de Scout: Markdown acotado (títulos, viñetas,
 * negritas) + enlaces automáticos a los KRs que la IA menciona entre comillas. */
export function ScoutResponseViewer({
  texto,
  referencias,
  onAbrirKr,
}: {
  texto: string;
  referencias: ReferenciaKr[];
  /** Si se pasa, el KR abre el panel lateral en vez de navegar a su ficha. */
  onAbrirKr?: (krId: string) => void;
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

  /** Resuelve negritas, convierte "títulos entre comillas" en enlaces al KR
   * y transforma los estados y márgenes sueltos en insignias. */
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
              const clase = clsx(
                "mx-0.5 inline-flex items-center gap-1.5 rounded-md bg-linea/60 px-1.5 py-0.5 text-left align-baseline transition hover:bg-linea",
                negrita && "font-semibold"
              );
              const tooltip = `${ESTADO_LABEL[ref.semaforo]} · ${ref.area} · ${ref.responsable}`;
              const punto = (
                <span
                  className={clsx(
                    "h-1.5 w-1.5 shrink-0 rounded-full",
                    DOT_CLASSES[ref.semaforo]
                  )}
                />
              );

              return onAbrirKr ? (
                <button
                  key={i}
                  type="button"
                  onClick={() => onAbrirKr(ref.id)}
                  className={clase}
                  title={tooltip}
                >
                  {punto}
                  {titulo}
                </button>
              ) : (
                <Link key={i} href={`/kr/${ref.id}`} className={clase} title={tooltip}>
                  {punto}
                  {titulo}
                </Link>
              );
            }
          }

          const cuerpo = contenido.split(PATRON_BADGE).map((trozo, j) =>
            ES_BADGE.test(trozo) ? (
              <Badge key={j} texto={trozo} />
            ) : (
              <span key={j}>{trozo}</span>
            )
          );

          if (negrita) return <strong key={i}>{cuerpo}</strong>;
          return <span key={i}>{cuerpo}</span>;
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
