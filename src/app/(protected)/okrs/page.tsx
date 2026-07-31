import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { SemaforoBadge } from "@/components/SemaforoBadge";
import {
  NewHitoForm,
  NewKeyResultForm,
  NewOkrAnualForm,
  NewOkrTrimestralForm,
  NewPilarForm,
} from "@/components/OkrForms";
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

  function renderOkrTrimestral(ot: OkrTrimestral) {
    const krs = krsPorTrim.get(ot.id) ?? [];
    return (
      <li key={ot.id} className="space-y-1 border-l border-black/10 pl-3 dark:border-white/10">
        <p className="text-sm font-medium">
          [{ot.area}] {ot.titulo}{" "}
          <span className="font-normal text-neutral-500">
            · {ot.trimestre} {ot.anio} · {ot.responsable}
          </span>
        </p>
        {krs.length === 0 ? (
          <p className="pl-3 text-xs text-neutral-400">Sin Key Results todavía.</p>
        ) : (
          <ul className="space-y-1 pl-3">
            {krs.map((kr) => (
              <li key={kr.id} className="flex items-center gap-2 text-sm">
                <Link href={`/kr/${kr.id}`} className="hover:underline">
                  {kr.titulo}
                </Link>
                <SemaforoBadge estado={kr.estado_semaforo} compact />
                {hasAlertaRentabilidad(kr) && (
                  <span className="text-xs text-red-600" title="Alerta de rentabilidad">
                    ⚠
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </li>
    );
  }

  function renderOkrAnual(oa: OkrAnual) {
    const trims = okrsTrimPorAnual.get(oa.id) ?? [];
    return (
      <li key={oa.id} className="space-y-2 border-l border-black/10 pl-3 dark:border-white/10">
        <p className="text-sm font-semibold">
          {oa.titulo}{" "}
          {oa.responsable && (
            <span className="font-normal text-neutral-500">· {oa.responsable}</span>
          )}
        </p>
        {trims.length === 0 ? (
          <p className="pl-3 text-xs text-neutral-400">Sin OKRs trimestrales alineados.</p>
        ) : (
          <ul className="space-y-2">{trims.map(renderOkrTrimestral)}</ul>
        )}
      </li>
    );
  }

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-xl font-semibold">Alineación estratégica</h1>
        <p className="text-sm text-neutral-500">
          Pilares → OKRs anuales → OKRs trimestrales por área → Key Results.
          La alineación es flexible: un OKR trimestral puede crearse sin OKR
          anual asignado todavía.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
        <details className="rounded-lg border border-black/10 p-4 dark:border-white/10">
          <summary className="cursor-pointer text-sm font-semibold">Nuevo Key Result</summary>
          <div className="mt-3">
            <NewKeyResultForm okrsTrimestrales={okrsTrimestralesList} />
          </div>
        </details>
        <details className="rounded-lg border border-black/10 p-4 dark:border-white/10">
          <summary className="cursor-pointer text-sm font-semibold">Nuevo hito</summary>
          <div className="mt-3">
            <NewHitoForm keyResults={keyResultsList} />
          </div>
        </details>
      </div>

      <div className="space-y-6">
        {pilaresList.length === 0 && (
          <p className="text-sm text-neutral-500">Todavía no hay pilares cargados.</p>
        )}
        {pilaresList.map((pilar) => {
          const oas = okrsAnualesPorPilar.get(pilar.id) ?? [];
          return (
            <section key={pilar.id} className="space-y-3 rounded-lg border border-black/10 p-4 dark:border-white/10">
              <div>
                <h2 className="text-base font-semibold">{pilar.nombre}</h2>
                {pilar.descripcion && (
                  <p className="text-sm text-neutral-500">{pilar.descripcion}</p>
                )}
              </div>
              {oas.length === 0 ? (
                <p className="text-xs text-neutral-400">Sin OKRs anuales todavía.</p>
              ) : (
                <ul className="space-y-3">{oas.map(renderOkrAnual)}</ul>
              )}
            </section>
          );
        })}

        {okrsAnualesSinPilar.length > 0 && (
          <section className="space-y-3 rounded-lg border border-dashed border-black/20 p-4 dark:border-white/20">
            <h2 className="text-base font-semibold text-neutral-500">
              OKRs anuales sin pilar asignado
            </h2>
            <ul className="space-y-3">{okrsAnualesSinPilar.map(renderOkrAnual)}</ul>
          </section>
        )}

        {okrsTrimSinAlinear.length > 0 && (
          <section className="space-y-3 rounded-lg border border-dashed border-black/20 p-4 dark:border-white/20">
            <h2 className="text-base font-semibold text-neutral-500">
              OKRs trimestrales sin alinear a un OKR anual
            </h2>
            <ul className="space-y-3">{okrsTrimSinAlinear.map(renderOkrTrimestral)}</ul>
          </section>
        )}
      </div>
    </div>
  );
}
