import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { SemaforoBadge } from "@/components/SemaforoBadge";
import {
  NewOkrAnualForm,
  NewOkrTrimestralForm,
  NewPilarForm,
  OkrAnualModal,
  OkrTrimestralModal,
} from "@/components/OkrForms";
import { Collapsible } from "@/components/Collapsible";
import { KrModal } from "@/components/KrModal";
import { AlinearOkr } from "@/components/AlinearOkr";
import { LeyendaEdicion } from "@/components/HistorialEdicion";
import { BorrarObjetivo } from "@/components/BorrarObjetivo";
import { ultimasEdiciones } from "@/lib/historial-server";
import { perfilActual } from "@/lib/perfil";
import { hasAlertaRentabilidad, progresoPct } from "@/lib/kr-logic";
import { Avatar } from "@/components/Avatar";
import { TRIMESTRES } from "@/lib/types";
import type {
  Cliente,
  HitoKr,
  KeyResult,
  OkrAnual,
  OkrResponsableConPersona,
  OkrTrimestral,
  Pilar,
  UsuarioAutorizado,
} from "@/lib/types";

export default async function OkrsPage({
  searchParams,
}: {
  searchParams: Promise<{ trimestre?: string }>;
}) {
  const supabase = await createClient();
  const perfil = await perfilActual();
  // Borrar objetivos y KR es solo de Dirección: el botón ni aparece para el
  // resto, para no ofrecer algo que la acción va a rechazar.
  const esDireccion = perfil?.esDireccion ?? false;
  // Filtro por trimestre desde la URL: es un Server Component, así que el
  // selector son links a ?trimestre=Q3 y no estado de cliente.
  const { trimestre: qFiltro } = await searchParams;
  const qActivo = TRIMESTRES.includes(qFiltro as (typeof TRIMESTRES)[number])
    ? qFiltro
    : null;

  const [
    { data: pilares },
    { data: okrsAnuales },
    { data: okrsTrimestrales },
    { data: keyResults },
    { data: personas },
    { data: responsables },
    { data: clientes },
    { data: iniciativas },
  ] = await Promise.all([
    supabase.from("pilares").select("*").order("nombre"),
    supabase.from("okr_anual").select("*").order("titulo"),
    supabase.from("okr_trimestral").select("*").order("area"),
    supabase.from("key_results").select("*, hitos_kr ( * )").order("titulo"),
    supabase
      .from("usuarios_autorizados")
      .select("*")
      .eq("activo", true)
      .order("nombre"),
    supabase
      .from("okr_responsables")
      .select("*, usuarios_autorizados ( * )"),
    supabase.from("clientes").select("*").order("nombre"),
    // Solo el kr_id: acá alcanza con cuántas hay. Embeberlas dentro de
    // key_results traía las filas enteras sin necesidad.
    supabase.from("iniciativas").select("kr_id"),
  ]);

  const pilaresList = (pilares ?? []) as Pilar[];
  const okrsAnualesList = (okrsAnuales ?? []) as OkrAnual[];
  const okrsTrimestralesList = (okrsTrimestrales ?? []) as OkrTrimestral[];
  const okrsTrimVisibles = qActivo
    ? okrsTrimestralesList.filter((ot) => ot.trimestre === qActivo)
    : okrsTrimestralesList;
  const keyResultsList = (keyResults ?? []) as (KeyResult & {
    hitos_kr: HitoKr[];
  })[];
  const personasList = (personas ?? []) as UsuarioAutorizado[];
  const clientesList = (clientes ?? []) as Cliente[];

  const iniciativasPorKr = new Map<string, number>();
  for (const i of (iniciativas ?? []) as { kr_id: string }[]) {
    iniciativasPorKr.set(i.kr_id, (iniciativasPorKr.get(i.kr_id) ?? 0) + 1);
  }

  // Co-responsables agrupados por objetivo, para no recorrer la lista entera
  // en cada tarjeta.
  const coPorOkr = new Map<string, OkrResponsableConPersona[]>();
  for (const r of (responsables ?? []) as unknown as OkrResponsableConPersona[]) {
    const clave = r.okr_trimestral_id ?? r.okr_anual_id;
    if (!clave) continue;
    if (!coPorOkr.has(clave)) coPorOkr.set(clave, []);
    coPorOkr.get(clave)!.push(r);
  }

  function idsCoResponsables(okrId: string): string[] {
    return (coPorOkr.get(okrId) ?? []).map((r) => r.usuario_id);
  }

  /** Los avatares de todos los que llevan el objetivo. El primero, con el
   * borde marcado, es quien rinde cuentas. */
  function ListaResponsables({
    okrId,
    principal,
  }: {
    okrId: string;
    principal: string | null;
  }) {
    const gente = nombresResponsables(okrId, principal);
    if (gente.length === 0) return null;

    return (
      <span className="ml-1.5 inline-flex flex-wrap items-center gap-1 align-middle">
        {gente.map((p) => (
          <span
            key={`${p.nombre}-${p.principal}`}
            title={p.principal ? `${p.nombre} · rinde cuentas` : p.nombre}
            className={p.principal ? "rounded-full ring-1 ring-oxford" : undefined}
          >
            <Avatar nombre={p.nombre} conNombre={false} />
          </span>
        ))}
      </span>
    );
  }

  /** Todos los que llevan el objetivo: quien rinde cuentas primero. */
  function nombresResponsables(
    okrId: string,
    principal: string | null
  ): { nombre: string; principal: boolean }[] {
    const lista: { nombre: string; principal: boolean }[] = [];
    if (principal) lista.push({ nombre: principal, principal: true });
    for (const r of coPorOkr.get(okrId) ?? []) {
      const p = r.usuarios_autorizados;
      if (!p) continue;
      lista.push({ nombre: p.responsable?.trim() || p.nombre, principal: false });
    }
    return lista;
  }

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
  for (const ot of okrsTrimVisibles) {
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

  const [edicionesKr, edicionesOkr] = await Promise.all([
    ultimasEdiciones("kr_id", keyResultsList.map((kr) => kr.id)),
    ultimasEdiciones("okr_id", okrsTrimestralesList.map((ot) => ot.id)),
  ]);

  /** Todos los KRs que cuelgan de un OKR anual, atravesando sus trimestrales. */
  function krsDeAnual(okrAnualId: string) {
    const trims = okrsTrimPorAnual.get(okrAnualId) ?? [];
    return trims.flatMap((ot) => krsPorTrim.get(ot.id) ?? []);
  }

  function krsDePilar(pilarId: string) {
    const anuales = okrsAnualesPorPilar.get(pilarId) ?? [];
    return anuales.flatMap((oa) => krsDeAnual(oa.id));
  }

  /** Conteo de semáforo para la barra colapsada: ver la salud sin desplegar
   * es lo que separa un árbol útil de una lista de títulos. */
  function SaludBadge({ krs }: { krs: (typeof keyResultsList)[number][] }) {
    if (krs.length === 0) {
      return <span className="text-xs text-tenue">Sin KRs</span>;
    }
    const verde = krs.filter((k) => k.estado_semaforo === "verde").length;
    const amarillo = krs.filter((k) => k.estado_semaforo === "amarillo").length;
    const rojo = krs.filter((k) => k.estado_semaforo === "rojo").length;
    return (
      <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-linea/60 px-2.5 py-1 text-xs font-medium">
        <span className="text-emerald-700 dark:text-emerald-400">{verde} 🟢</span>
        <span className="text-tenue">|</span>
        <span className="text-amber-700 dark:text-amber-400">{amarillo} 🟡</span>
        <span className="text-tenue">|</span>
        <span className="text-red-700 dark:text-red-400">{rojo} 🔴</span>
      </span>
    );
  }

  /** Avance consolidado: promedio simple del progreso de los KRs que cuelgan.
   * Simple a propósito, ponderar por peso exige un campo que hoy no existe. */
  function AvanceAnual({ krs }: { krs: (typeof keyResultsList)[number][] }) {
    if (krs.length === 0) return null;
    const pct = Math.round(
      krs.reduce((acc, kr) => {
        if (kr.tipo_medicion === "hitos") {
          const total = kr.hitos_kr.length;
          return (
            acc +
            (total === 0
              ? 0
              : (kr.hitos_kr.filter((h) => h.cumplido).length / total) * 100)
          );
        }
        return acc + progresoPct(kr);
      }, 0) / krs.length
    );

    return (
      <div className="mt-1.5 flex items-center gap-2">
        <div className="h-1.5 w-32 overflow-hidden rounded-full bg-linea">
          <div
            className="h-full rounded-full bg-oxford transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className="text-xs font-medium text-tenue">
          {pct}% consolidado · {krs.length} KR{krs.length > 1 ? "s" : ""}
        </span>
      </div>
    );
  }

  function renderKr(kr: (typeof keyResultsList)[number], indice: number) {
    return (
      <div key={kr.id} className="py-1">
        <div className="flex items-center gap-2 text-sm">
          {/* Número dentro del objetivo: lo pidió el equipo para nombrarlos
              "KR1, KR2" sin escribirlo a mano. */}
          <span className="shrink-0 rounded bg-linea/60 px-1.5 py-0.5 text-[11px] font-semibold text-tenue">
            KR{indice + 1}
          </span>
          <Link href={`/kr/${kr.id}`} className="truncate hover:underline">
            {kr.titulo}
          </Link>
          <SemaforoBadge estado={kr.estado_semaforo} compact />
          {hasAlertaRentabilidad(kr) && (
            <span className="text-xs text-red-600" title="Alerta de rentabilidad">
              ⚠
            </span>
          )}
          {/* Las iniciativas viven en la ficha del KR. Desde Alineación no
              había ningún camino hacia ellas, y Alineación es donde la gente
              está cuando arma el trimestre. */}
          <Link
            href={`/kr/${kr.id}`}
            className="ml-auto shrink-0 rounded-md px-2 py-0.5 text-xs text-tenue transition hover:bg-linea/60 hover:text-foreground"
          >
            Iniciativas ({iniciativasPorKr.get(kr.id) ?? 0})
          </Link>
          <KrModal
            kr={kr}
            clientes={clientesList}
            hitos={kr.hitos_kr}
            triggerLabel="Editar"
            triggerClassName="shrink-0 rounded-md px-2 py-0.5 text-xs text-tenue transition hover:bg-linea/60 hover:text-foreground"
          />
          {esDireccion && (
            <BorrarObjetivo tipo="kr" id={kr.id} titulo={kr.titulo} />
          )}
        </div>
        <LeyendaEdicion edicion={edicionesKr.get(kr.id)} />
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
            <span className="mr-1.5 rounded bg-linea/60 px-1.5 py-0.5 text-xs font-semibold">
              {ot.area}
            </span>
            {ot.es_colaborativo && (
              <span className="mr-1.5 rounded bg-oxford-suave px-1.5 py-0.5 text-xs font-semibold text-oxford">
                🤝 Colaborativo
              </span>
            )}
            {ot.titulo}{" "}
            <span className="font-normal text-tenue">
              · {ot.trimestre} {ot.anio}
            </span>
            <ListaResponsables okrId={ot.id} principal={ot.responsable} />
          </p>
        }
        accion={
          <span className="flex shrink-0 items-center gap-1">
            {/* Agregar un KR desde el objetivo mismo. Antes había que subir
                al botón de arriba de todo y encontrarlo en una lista de nueve
                títulos, donde nadie reconocía el suyo. */}
            <KrModal
              okrFijo={ot}
              clientes={clientesList}
              triggerLabel="+ KR"
              triggerClassName="rounded-md px-2 py-0.5 text-xs font-medium text-oxford transition hover:bg-oxford-suave"
            />
            <OkrTrimestralModal
              okr={ot}
              okrsAnuales={okrsAnualesList}
              personas={personasList}
              coResponsablesActuales={idsCoResponsables(ot.id)}
              triggerLabel="Editar"
              triggerClassName="rounded-md px-2 py-0.5 text-xs text-tenue transition hover:bg-linea/60 hover:text-foreground"
            />
            {esDireccion && (
              <BorrarObjetivo tipo="okr" id={ot.id} titulo={ot.titulo} />
            )}
          </span>
        }
      >
        <LeyendaEdicion edicion={edicionesOkr.get(ot.id)} />
        {krs.length === 0 ? (
          <p className="py-1 text-xs text-tenue">Sin Key Results todavía.</p>
        ) : (
          krs.map((kr, i) => renderKr(kr, i))
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
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-sm font-semibold">
                {oa.titulo}
                <ListaResponsables okrId={oa.id} principal={oa.responsable} />
              </p>
              <AvanceAnual krs={krsDeAnual(oa.id)} />
            </div>
            <SaludBadge krs={krsDeAnual(oa.id)} />
          </div>
        }
        accion={
          <OkrAnualModal
            okr={oa}
            pilares={pilaresList}
            personas={personasList}
            coResponsablesActuales={idsCoResponsables(oa.id)}
            triggerLabel="Editar"
            triggerClassName="shrink-0 rounded-md px-2 py-0.5 text-xs text-tenue transition hover:bg-linea/60 hover:text-foreground"
          />
        }
      >
        {trims.length === 0 ? (
          <p className="py-1 text-xs text-tenue">
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
          <p className="text-sm text-tenue">
            Pilares → OKRs anuales → OKRs trimestrales por área → Key Results.
          </p>
          <div className="mt-2 flex flex-wrap gap-1">
            {(["Todo", ...TRIMESTRES] as const).map((t) => {
              const activo = t === "Todo" ? !qActivo : qActivo === t;
              const href = t === "Todo" ? "/okrs" : "/okrs?trimestre=" + t;
              return (
                <Link
                  key={t}
                  href={href}
                  className={
                    activo
                      ? "rounded-md bg-oxford px-2.5 py-1 text-xs font-medium text-white"
                      : "rounded-md bg-linea/60 px-2.5 py-1 text-xs font-medium text-tenue transition hover:text-foreground"
                  }
                >
                  {t}
                </Link>
              );
            })}
          </div>
        </div>
        <KrModal
          okrsTrimestrales={okrsTrimestralesList}
          clientes={clientesList}
          triggerLabel="+ Nuevo Key Result"
          triggerClassName="rounded-md bg-oxford px-3 py-1.5 text-sm font-medium text-white"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <details className="rounded-lg border border-linea p-4">
          <summary className="cursor-pointer text-sm font-semibold">Nuevo pilar</summary>
          <div className="mt-3">
            <NewPilarForm />
          </div>
        </details>
        <details className="rounded-lg border border-linea p-4">
          <summary className="cursor-pointer text-sm font-semibold">Nuevo OKR anual</summary>
          <div className="mt-3">
            <NewOkrAnualForm pilares={pilaresList} personas={personasList} />
          </div>
        </details>
        <details className="rounded-lg border border-linea p-4">
          <summary className="cursor-pointer text-sm font-semibold">
            Nuevo OKR trimestral
          </summary>
          <div className="mt-3">
            <NewOkrTrimestralForm okrsAnuales={okrsAnualesList} personas={personasList} />
          </div>
        </details>
      </div>

      <div className="space-y-4">
        {pilaresList.length === 0 && (
          <p className="text-sm text-tenue">Todavía no hay pilares cargados.</p>
        )}
        {pilaresList.map((pilar) => {
          const oas = okrsAnualesPorPilar.get(pilar.id) ?? [];
          return (
            <section
              key={pilar.id}
              className="rounded-lg border border-linea p-4"
            >
              <Collapsible
                defaultOpen
                summary={
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="text-base font-semibold">{pilar.nombre}</h2>
                      {pilar.descripcion && (
                        <p className="text-sm text-tenue">{pilar.descripcion}</p>
                      )}
                    </div>
                    <SaludBadge krs={krsDePilar(pilar.id)} />
                  </div>
                }
              >
                {oas.length === 0 ? (
                  <p className="py-1 text-xs text-tenue">
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
          <section className="rounded-lg border border-dashed border-linea-fuerte p-4 border-linea">
            <h2 className="mb-2 text-base font-semibold text-tenue">
              OKRs anuales sin pilar asignado
            </h2>
            <div className="space-y-2">{okrsAnualesSinPilar.map(renderOkrAnual)}</div>
          </section>
        )}

        {okrsTrimSinAlinear.length > 0 && (
          <section className="rounded-lg border border-dashed border-linea-fuerte p-4 border-linea">
            <h2 className="mb-2 text-base font-semibold text-tenue">
              OKRs trimestrales sin alinear a un OKR anual
            </h2>
            <div className="space-y-3">
              {okrsTrimSinAlinear.map((ot) => (
                <div key={ot.id} className="space-y-1.5">
                  <div className="flex flex-wrap items-center justify-end gap-2">
                    <AlinearOkr
                      okrTrimestralId={ot.id}
                      okrsAnuales={okrsAnualesList}
                    />
                  </div>
                  {renderOkrTrimestral(ot)}
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
