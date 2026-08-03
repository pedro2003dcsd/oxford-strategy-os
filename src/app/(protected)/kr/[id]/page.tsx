import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { CheckIn, KeyResultCompleto } from "@/lib/types";
import { SemaforoBadge } from "@/components/SemaforoBadge";
import { TrendChart } from "@/components/TrendChart";
import { CheckInForm } from "@/components/CheckInForm";
import { HitosList } from "@/components/HitosList";
import { MargenForm } from "@/components/MargenForm";
import { IniciativasPanel } from "@/components/IniciativasPanel";
import { formatValor, hasAlertaRentabilidad, isKrCumplido } from "@/lib/kr-logic";

export default async function KrDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: kr } = await supabase
    .from("key_results")
    .select(
      `*,
      hitos_kr ( * ),
      iniciativas ( * ),
      okr_trimestral (
        *,
        okr_anual (
          *,
          pilares ( * )
        )
      )`
    )
    .eq("id", id)
    .single();

  if (!kr) notFound();

  const krCompleto = kr as unknown as KeyResultCompleto;

  const { data: checkIns } = await supabase
    .from("check_ins")
    .select("*")
    .eq("kr_id", id)
    .order("creado_at", { ascending: true });

  const historial = (checkIns ?? []) as CheckIn[];
  const alerta = hasAlertaRentabilidad(krCompleto);
  const cumplido = isKrCumplido(krCompleto);
  const okrTrim = krCompleto.okr_trimestral;

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        {okrTrim && (
          <p className="text-xs text-tenue">
            {okrTrim.okr_anual?.pilares?.nombre ?? "Sin pilar"} ·{" "}
            {okrTrim.okr_anual?.titulo ?? "Sin OKR anual"} ·{" "}
            <Link href="/okrs" className="underline hover:no-underline">
              {okrTrim.area}
            </Link>{" "}
            · {okrTrim.trimestre} {okrTrim.anio}
          </p>
        )}
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-xl font-semibold">{krCompleto.titulo}</h1>
          <SemaforoBadge estado={krCompleto.estado_semaforo} />
          {cumplido && (
            <span className="rounded-full bg-linea px-2.5 py-1 text-xs font-medium">
              Cumplido
            </span>
          )}
        </div>
        {krCompleto.cliente_asociado && (
          <p className="text-sm text-tenue">
            Cliente: {krCompleto.cliente_asociado}
          </p>
        )}
        {okrTrim?.responsable && (
          <p className="text-sm text-tenue">
            Responsable: {okrTrim.responsable}
          </p>
        )}
      </div>

      {alerta && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-700 dark:text-red-400">
          <p className="font-semibold">⚠ Alerta de rentabilidad</p>
          <p>
            Este KR se dio por cumplido, pero el margen real cargado desde
            SOLOP ({krCompleto.margen_actual_pct}%) está por debajo del margen
            esperado ({krCompleto.margen_utilidad_esperado}%). Puede ser scope
            creep — revisar con el líder de cuenta.
          </p>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-6">
          <div className="space-y-3 rounded-lg border border-linea p-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">Tendencia</h3>
              {krCompleto.tipo_medicion !== "hitos" && (
                <p className="text-xs text-tenue">
                  Meta: {formatValor(krCompleto.valor_meta, krCompleto.tipo_medicion)}
                </p>
              )}
            </div>
            {krCompleto.tipo_medicion === "hitos" ? (
              <HitosList krId={krCompleto.id} hitos={krCompleto.hitos_kr} />
            ) : (
              <TrendChart checkIns={historial} valorMeta={krCompleto.valor_meta} />
            )}
          </div>

          <div className="rounded-lg border border-linea p-4">
            <IniciativasPanel
              krId={krCompleto.id}
              iniciativas={krCompleto.iniciativas ?? []}
              responsablePorDefecto={okrTrim?.responsable}
            />
          </div>

          <div className="rounded-lg border border-linea p-4">
            <h3 className="mb-3 text-sm font-semibold">Historial de check-ins</h3>
            {historial.length === 0 ? (
              <p className="text-sm text-tenue">Sin check-ins todavía.</p>
            ) : (
              <ul className="divide-y divide-linea">
                {[...historial].reverse().map((c) => (
                  <li key={c.id} className="flex items-start justify-between gap-3 py-2">
                    <div>
                      <p className="text-sm">
                        <span className="font-medium">{c.usuario}</span>{" "}
                        <span className="text-tenue">
                          registró {formatValor(c.valor_registrado, krCompleto.tipo_medicion)}
                        </span>
                      </p>
                      {c.comentario_bloqueos && (
                        <p className="text-xs text-tenue">{c.comentario_bloqueos}</p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1 whitespace-nowrap">
                      <SemaforoBadge estado={c.estado_semaforo} compact />
                      <span className="text-xs text-tenue">
                        {new Date(c.creado_at).toLocaleDateString("es-AR")}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <CheckInForm krId={krCompleto.id} valorActual={krCompleto.valor_actual} />
          <MargenForm
            krId={krCompleto.id}
            margenActual={krCompleto.margen_actual_pct}
            margenEsperado={krCompleto.margen_utilidad_esperado}
          />
        </div>
      </div>
    </div>
  );
}
