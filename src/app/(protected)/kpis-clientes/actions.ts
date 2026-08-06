"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ItemEvaluacion, KpiCalidad, PuntoTendencia } from "@/lib/types";

export type FormActionState = { error?: string } | undefined;

function str(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

/** Los bloques de la 360 son filas paralelas: cada criterio viaja con su
 * puntaje en el mismo índice. Las filas sin criterio se descartan, que es
 * como el formulario representa una fila que el usuario vació. */
function itemsEvaluacion(formData: FormData, prefijo: string): ItemEvaluacion[] {
  const criterios = formData.getAll(`${prefijo}_criterio`).map(String);
  const puntajes = formData.getAll(`${prefijo}_puntaje`).map(String);

  const items: ItemEvaluacion[] = [];
  for (let i = 0; i < criterios.length; i++) {
    const criterio = criterios[i].trim();
    if (!criterio) continue;
    const puntaje = Number(puntajes[i]);
    items.push({
      criterio,
      // Fuera de rango se recorta en vez de rechazar: la grilla es 1 a 5 y
      // un 7 tipeado de más no justifica perder el resto de la carga.
      puntaje: Number.isFinite(puntaje) ? Math.min(5, Math.max(1, puntaje)) : 1,
    });
  }
  return items;
}

function kpisCalidad(formData: FormData): KpiCalidad[] {
  const titulos = formData.getAll("kpi_titulo").map(String);
  const metas = formData.getAll("kpi_meta").map(String);
  const actuales = formData.getAll("kpi_actual").map(String);
  const estados = formData.getAll("kpi_estado").map(String);

  const kpis: KpiCalidad[] = [];
  for (let i = 0; i < titulos.length; i++) {
    const titulo = titulos[i].trim();
    if (!titulo) continue;
    const estado = estados[i];
    kpis.push({
      titulo,
      meta: (metas[i] ?? "").trim(),
      actual: (actuales[i] ?? "").trim(),
      estado:
        estado === "verde" || estado === "amarillo" || estado === "rojo"
          ? estado
          : "verde",
    });
  }
  return kpis;
}

function tendencia(formData: FormData): PuntoTendencia[] {
  const meses = formData.getAll("tendencia_mes").map(String);
  const puntajes = formData.getAll("tendencia_puntaje").map(String);

  const puntos: PuntoTendencia[] = [];
  for (let i = 0; i < meses.length; i++) {
    const mes = meses[i].trim();
    if (!mes) continue;
    const puntaje = Number(puntajes[i]);
    puntos.push({ mes, puntaje: Number.isFinite(puntaje) ? puntaje : 0 });
  }
  return puntos;
}

export async function upsertEvaluacion(
  _prevState: FormActionState,
  formData: FormData
): Promise<FormActionState> {
  const clienteId = str(formData, "cliente_id");
  const periodo = str(formData, "periodo");

  if (!clienteId || !periodo) {
    return { error: "Elegí el cliente y el período (por ejemplo Q3 2026)." };
  }

  const campos = {
    cliente_id: clienteId,
    periodo,
    notas_comerciales_json: itemsEvaluacion(formData, "comercial"),
    notas_performance_json: itemsEvaluacion(formData, "performance"),
    notas_relacionamiento_json: itemsEvaluacion(formData, "relacionamiento"),
    kpis_calidad_json: kpisCalidad(formData),
    tendencia_json: tendencia(formData),
    actualizado_at: new Date().toISOString(),
  };

  const supabase = await createClient();

  // upsert sobre (cliente_id, periodo): reabrir la evaluación del trimestre
  // y volver a guardarla tiene que pisar la anterior, no crear una segunda.
  const { error } = await supabase
    .from("evaluaciones_360")
    .upsert(campos, { onConflict: "cliente_id,periodo" });

  if (error) return { error: error.message };

  revalidatePath("/kpis-clientes");
  return undefined;
}

export async function deleteEvaluacion(evaluacionId: string) {
  const supabase = await createClient();
  await supabase.from("evaluaciones_360").delete().eq("id", evaluacionId);
  revalidatePath("/kpis-clientes");
}
