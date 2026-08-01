import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { SemaforoBadge } from "@/components/SemaforoBadge";
import { NewOkrAnualForm, NewOkrTrimestralForm, NewPilarForm } from "@/components/OkrForms";
import { Collapsible } from "@/components/Collapsible";
import { KrModal } from "@/components/KrModal";
import { hasAlertaRentabilidad } from "@/lib/kr-logic";
import type {
  HitoKr,
  KeyResult,
  OkrAnual,
  OkrTrimestral,
  Pilar,
} from "@/lib/types";

export default async function OkrsPage() {
  const supabase = await createClient();

  const [
    { data: pilares },
    { data: okrsAnuales },
    { data: okrsTrimestrales },
    { data: keyResults },
  ] = await Promise.all([
    supabase.from("pilares").select("*").order("nombre"),
    supabase.from("okr_anual").select("*").order("titulo"),
    supabase.from("okr_trimestral").select("*").order("area"),
    supabase.from("key_results").select("*, hitos_kr ( * )").order("titulo"),
  ]);

  const pilaresList = (pilares ?? []) as Pilar[];
  const okrsAnualesList = (okrsAnuales ?? []) as OkrAnual[];
  const okrsTrimestralesList = (okrsTrimestrales ?? []) as OkrTrimestral[];
  const keyResultsList = (keyResults ?? []) as (KeyResult & {
    hitos_kr: HitoKr[];
  })[];

  const okrsAnualesPorPilar = new Map<string, OkrAnual[]>();
  const okrsAnualesSinPilar: OkrAnual[] = [];
  for (const oa of okrsAnualesList) {
    if (!oa.pilar_id) {
      okrsAnualesSinPilar.push(oa);
      continue;
    }
    if (!okrsAnualesPorPilar.has(oa.pilar_id)) okrsAnualesPorPilar.set(oa.pilar_id, []);
    okrsAnualesPorPilar.get(oa.pilar_id)!.push(oa);
  }

  const okrsTrimPorAnual = new Map<string, OkrTrimestral[]>();
  const okrsTrimSinAlinear: OkrTrimestral[] = [];
  for (const ot of okrsTrimestralesList) {
    if (!ot.okr_anual_id) {
      okrsTrimSinAlinear.push(ot);
      continue;
    }
    if (!okrsTrimPorAnual.has(ot.okr_anual_id)) okrsTrimPorAnual.set(ot.okr_anual_id, []);
    okrsTrimPorAnual.get(ot.okr_anual_id)!.push(ot);
  }

  const krsPorTrim = new Map<string, typeof keyResultsList>();
  for (const kr of keyResultsList) {
    if (!krsPorTrim.has(kr.okr_trimestral_id)) krsPorTrim.set(kr.okr_trimestral_id, []);
    krsPorTrim.get(kr.okr_trimestral_id)!.push(kr);
  }

  function renderKr(kr: (typeof keyResultsList)[number]) {
    return (
      <div key={kr.id} className="flex items-center gap-2 py-1 text-sm">
        <Link href={`/kr/${kr.id}`} className="truncate hover:underline">
          {kr.titulo}
        </Link>
        <SemaforoBadge estado={kr.estado_semaforo} compact />
        {hasAlertaRentabilidad(kr) && (
          <span className="text-xs text-red-600" title="Alerta de rentabilidad">
            ⚠
          </span>
        )}
        <KrModal
          kr={kr}
          hitos={kr.hitos_kr}
          triggerLabel="Editar"
          triggerClassName="ml-auto shrink-0 rounded-md px-2 py-0.5 text-xs text-neutral-400 transition hover:bg-black/5 hover:text-neutral-900 dark:hover:bg-white/10 dark:hover:text-white"
        />
      </div>
    );
  }

  function renderOkrTrimestral(ot: OkrTrimestral) {
    const krs = krsPorTrim.get(ot.id) ?? [];
    return (
      <Collapsible
        key={ot.id}
        level={2}
        defaultOpen
        summary={
          <p className="text-sm font-medium">
            <span className="mr-1.5 rounded bg-black/5 px-1.5 py-0.5 text-xs font-semibold dark:bg-white/10">
              {ot.area}
            </span>
            {ot.titulo}{" "}
            <span className="font-normal text-neutral-500">
              · {ot.trimestre} {ot.anio} · {ot.responsable}
            </span>
          </p>
        }
      >
        {krs.length === 0 ? (
          <p className="py-1 text-xs text-neutral-400">Sin Key Results todavía.</p>
        ) : (
          krs.map(renderKr)
        )}
      </Collapsible>
    );
  }

  function renderOkrAnual(oa: OkrAnual) {
    const trims = okrsTrimPorAnual.get(oa.id) ?? [];
    return (
      <Collapsible
        key={oa.id}
        level={1}
        defaultOpen
        summary={
          <p className="text-sm font-semibold">
            {oa.titulo}{" "}
            {oa.responsable && (
              <span className="font-normal text-neutral-500">· {oa.responsable}</span>
            )}
          </p>
        }
      >
        {trims.length === 0 ? (
          <p className="py-1 text-xs text-neutral-400">
            Sin OKRs trimestrales alineados.
          </p>
        ) : (
          trims.map(renderOkrTrimestral)
        )}
      </Collapsible>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">Alineación estratégica</h1>
          <p className="text-sm text-neutral-500">
            Pilares → OKRs anuales → OKRs trimestrales por área → Key Results.
          </p>
        </div>
        <KrModal
          okrsTrimestrales={okrsTrimestralesList}
          triggerLabel="+ Nuevo Key Result"
          triggerClassName="rounded-md bg-neutral-900 px-3 py-1.5 text-sm font-medium text-white dark:bg-white dark:text-neutral-900"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <details className="rounded-lg border border-black/10 p-4 dark:border-white/10">
          <summary className="cursor-pointer text-sm font-semibold">Nuevo pilar</summary>
          <div className="mt-3">
            <NewPilarForm />
          </div>
        </details>
        <details className="rounded-lg border border-black/10 p-4 dark:border-white/10">
          <summary className="cursor-pointer text-sm font-semibold">Nuevo OKR anual</summary>
          <div className="mt-3">
            <NewOkrAnualForm pilares={pilaresList} />
          </div>
        </details>
        <details className="rounded-lg border border-black/10 p-4 dark:border-white/10">
          <summary className="cursor-pointer text-sm font-semibold">
            Nuevo OKR trimestral
          </summary>
          <div className="mt-3">
            <NewOkrTrimestralForm okrsAnuales={okrsAnualesList} />
          </div>
        </details>
      </div>

      <div className="space-y-4">
        {pilaresList.length === 0 && (
          <p className="text-sm text-neutral-500">Todavía no hay pilares cargados.</p>
        )}
        {pilaresList.map((pilar) => {
          const oas = okrsAnualesPorPilar.get(pilar.id) ?? [];
          return (
            <section
              key={pilar.id}
              className="rounded-lg border border-black/10 p-4 dark:border-white/10"
            >
              <Collapsible
                defaultOpen
                summary={
                  <div>
                    <h2 className="text-base font-semibold">{pilar.nombre}</h2>
                    {pilar.descripcion && (
                      <p className="text-sm text-neutral-500">{pilar.descripcion}</p>
                    )}
                  </div>
                }
              >
                {oas.length === 0 ? (
                  <p className="py-1 text-xs text-neutral-400">
                    Sin OKRs anuales todavía.
                  </p>
                ) : (
                  oas.map(renderOkrAnual)
                )}
              </Collapsible>
            </section>
          );
        })}

        {okrsAnualesSinPilar.length > 0 && (
          <section className="rounded-lg border border-dashed border-black/20 p-4 dark:border-white/20">
            <h2 className="mb-2 text-base font-semibold text-neutral-500">
              OKRs anuales sin pilar asignado
            </h2>
            <div className="space-y-2">{okrsAnualesSinPilar.map(renderOkrAnual)}</div>
          </section>
        )}

        {okrsTrimSinAlinear.length > 0 && (
          <section className="rounded-lg border border-dashed border-black/20 p-4 dark:border-white/20">
            <h2 className="mb-2 text-base font-semibold text-neutral-500">
              OKRs trimestrales sin alinear a un OKR anual
            </h2>
            <div className="space-y-2">{okrsTrimSinAlinear.map(renderOkrTrimestral)}</div>
          </section>
        )}
      </div>
    </div>
  );
}
