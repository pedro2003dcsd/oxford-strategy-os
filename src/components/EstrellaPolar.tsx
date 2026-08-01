import type { KeyResultCompleto } from "@/lib/types";

const META_CLIENTES = 20;
const META_MARGEN = 65;

export function EstrellaPolar({ krs }: { krs: KeyResultCompleto[] }) {
  const clientesSobreMeta = new Set(
    krs
      .filter(
        (kr) =>
          kr.cliente_asociado &&
          kr.margen_actual_pct != null &&
          kr.margen_actual_pct >= META_MARGEN
      )
      .map((kr) => kr.cliente_asociado)
  ).size;

  const pct = Math.min(100, Math.round((clientesSobreMeta / META_CLIENTES) * 100));

  return (
    <section className="rounded-xl border border-indigo-500/30 bg-indigo-500/5 p-5 dark:bg-indigo-500/10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600 dark:text-indigo-400">
            ★ Estrella Polar 2026
          </p>
          <h2 className="mt-1 text-lg font-semibold">
            {META_CLIENTES} clientes integrales con UB/Venta &gt; {META_MARGEN}%
          </h2>
          <p className="mt-1 text-sm text-neutral-500">
            Clientes con margen real cargado sobre {META_MARGEN}%:{" "}
            <span className="font-semibold text-neutral-900 dark:text-white">
              {clientesSobreMeta} / {META_CLIENTES}
            </span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="h-2 w-40 overflow-hidden rounded-full bg-indigo-500/15">
            <div
              className="h-full rounded-full bg-indigo-500 transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
          <span className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">
            {pct}%
          </span>
        </div>
      </div>
    </section>
  );
}
