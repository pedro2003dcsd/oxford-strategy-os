import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { SemaforoBadge } from "@/components/SemaforoBadge";
import { ResponsablesPanel } from "@/components/ResponsablesPanel";
import { LeyendaEdicion } from "@/components/HistorialEdicion";
import { ultimasEdiciones } from "@/lib/historial-server";
import { progresoPct } from "@/lib/kr-logic";
import type {
  HitoKr,
  KeyResult,
  OkrColaborativo,
  UsuarioAutorizado,
} from "@/lib/types";

export default async function ColaborativosPage() {
  const supabase = await createClient();

  const [{ data: okrs }, { data: keyResults }, { data: personas }] =
    await Promise.all([
      supabase
        .from("okr_trimestral")
        .select("*, okr_responsables ( *, usuarios_autorizados ( * ) )")
        .eq("es_colaborativo", true)
        .order("titulo"),
      supabase.from("key_results").select("*, hitos_kr ( * )"),
      supabase
        .from("usuarios_autorizados")
        .select("*")
        .eq("activo", true)
        .order("nombre"),
    ]);

  const okrsList = (okrs ?? []) as unknown as OkrColaborativo[];
  const krsList = (keyResults ?? []) as (KeyResult & { hitos_kr: HitoKr[] })[];
  const personasList = (personas ?? []) as UsuarioAutorizado[];

  const krsPorOkr = new Map<string, typeof krsList>();
  for (const kr of krsList) {
    if (!krsPorOkr.has(kr.okr_trimestral_id)) krsPorOkr.set(kr.okr_trimestral_id, []);
    krsPorOkr.get(kr.okr_trimestral_id)!.push(kr);
  }

  const ediciones = await ultimasEdiciones(
    "okr_id",
    okrsList.map((o) => o.id)
  );

  /** Avance del objetivo: promedio simple de sus KRs. Ponderarlos exigiría
   * un peso por KR que hoy nadie carga, y un promedio explicable vale más
   * que un número exacto que nadie sabe de dónde sale. */
  function avance(okrId: string): number | null {
    const krs = krsPorOkr.get(okrId) ?? [];
    if (krs.length === 0) return null;
    const suma = krs.reduce((acc, kr) => acc + progresoPct(kr), 0);
    return Math.round(suma / krs.length);
  }

  return (
    <div className="space-y-5">
      <header className="space-y-1">
        <h1 className="text-xl font-semibold">OKRs Colaborativos</h1>
        <p className="text-sm text-tenue">
          Objetivos transversales que no son de un área sola. Cada uno tiene
          quien rinde cuentas y un referente por área involucrada.
        </p>
      </header>

      {okrsList.length === 0 ? (
        <div className="rounded-lg border border-dashed border-linea p-6 text-center">
          <p className="text-sm font-medium">Todavía no hay objetivos colaborativos.</p>
          <p className="mt-1 text-sm text-tenue">
            Se marcan desde{" "}
            <Link href="/okrs" className="text-oxford hover:underline">
              Alineación
            </Link>
            , tildando “Objetivo colaborativo” al crear o editar un OKR
            trimestral.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {okrsList.map((okr) => {
            const krs = krsPorOkr.get(okr.id) ?? [];
            const pct = avance(okr.id);

            return (
              <article
                key={okr.id}
                className="space-y-3 rounded-xl border border-linea bg-panel p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="space-y-1">
                    <h2 className="font-semibold">{okr.titulo}</h2>
                    <p className="text-xs text-tenue">
                      {okr.trimestre} {okr.anio} · rinde cuentas {okr.responsable}
                    </p>
                  </div>
                  {pct !== null && (
                    <span className="shrink-0 text-sm font-semibold">{pct}%</span>
                  )}
                </div>

                <div className="flex flex-wrap gap-1">
                  {(okr.areas_involucradas ?? []).map((a) => (
                    <span
                      key={a}
                      className="rounded bg-linea/60 px-1.5 py-0.5 text-xs font-medium"
                    >
                      {a}
                    </span>
                  ))}
                </div>

                {pct !== null && (
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-linea">
                    <div
                      className="h-full rounded-full bg-oxford"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                )}

                <ResponsablesPanel
                  okrId={okr.id}
                  responsables={okr.okr_responsables ?? []}
                  personas={personasList}
                  areasInvolucradas={okr.areas_involucradas ?? []}
                />

                <div className="space-y-1 border-t border-linea pt-2">
                  {krs.length === 0 ? (
                    <p className="text-xs text-tenue">Sin Key Results todavía.</p>
                  ) : (
                    krs.map((kr) => (
                      <div key={kr.id} className="flex items-center gap-2 text-sm">
                        <Link
                          href={`/kr/${kr.id}`}
                          className="truncate hover:underline"
                        >
                          {kr.titulo}
                        </Link>
                        <SemaforoBadge estado={kr.estado_semaforo} compact />
                        <span className="ml-auto shrink-0 text-xs text-tenue">
                          {progresoPct(kr)}%
                        </span>
                      </div>
                    ))
                  )}
                </div>

                <LeyendaEdicion edicion={ediciones.get(okr.id)} />
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
