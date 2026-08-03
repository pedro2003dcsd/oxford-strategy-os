"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type SolopState = { error?: string } | undefined;

function num(formData: FormData, key: string): number {
  const v = Number(formData.get(key));
  return Number.isNaN(v) ? 0 : v;
}

/** Asocia (o desasocia) un KR desde la fila de la tabla, sin abrir el modal.
 * Si queda asociado y hay facturación cargada, arrastra el margen al KR. */
export async function asignarKrAProyecto(proyectoId: string, krId: string | null) {
  const supabase = await createClient();

  const { data: proyecto } = await supabase
    .from("proyectos_solop")
    .select("facturacion_total, costo_operativo")
    .eq("id", proyectoId)
    .maybeSingle();

  await supabase
    .from("proyectos_solop")
    .update({ kr_id: krId, actualizado_at: new Date().toISOString() })
    .eq("id", proyectoId);

  const facturacion = Number(proyecto?.facturacion_total ?? 0);
  const costo = Number(proyecto?.costo_operativo ?? 0);
  if (krId && facturacion > 0) {
    const margen = Math.round(((facturacion - costo) / facturacion) * 1000) / 10;
    await supabase
      .from("key_results")
      .update({
        margen_actual_pct: margen,
        margen_actualizado_at: new Date().toISOString(),
      })
      .eq("id", krId);
  }

  revalidatePath("/solop");
  revalidatePath("/");
  revalidatePath("/lom");
  if (krId) revalidatePath(`/kr/${krId}`);
}

/** Crea o edita un proyecto SOLOP y, si está vinculado a un KR, sincroniza el
 * margen real del proyecto en key_results.margen_actual_pct (lo que dispara
 * la alerta de rentabilidad y alimenta la Estrella Polar). */
export async function upsertProyectoSolop(
  proyectoId: string | null,
  _prevState: SolopState,
  formData: FormData
): Promise<SolopState> {
  const cliente = String(formData.get("cliente") ?? "").trim();
  const tipoContrato = String(formData.get("tipo_contrato") ?? "");
  const krId = String(formData.get("kr_id") ?? "").trim() || null;

  if (!cliente) return { error: "Ingresá el nombre del cliente/proyecto." };
  if (!["Fee", "AdHoc"].includes(tipoContrato)) {
    return { error: "Elegí el tipo de contrato." };
  }

  const horasPresupuestadas = num(formData, "horas_presupuestadas");
  const horasConsumidas = num(formData, "horas_consumidas");
  const facturacionTotal = num(formData, "facturacion_total");
  const costoOperativo = num(formData, "costo_operativo");

  const supabase = await createClient();
  const payload = {
    cliente,
    tipo_contrato: tipoContrato,
    kr_id: krId,
    horas_presupuestadas: horasPresupuestadas,
    horas_consumidas: horasConsumidas,
    facturacion_total: facturacionTotal,
    costo_operativo: costoOperativo,
    actualizado_at: new Date().toISOString(),
  };

  const { error } = proyectoId
    ? await supabase.from("proyectos_solop").update(payload).eq("id", proyectoId)
    : await supabase.from("proyectos_solop").insert(payload);
  if (error) return { error: error.message };

  if (krId && facturacionTotal > 0) {
    const margen =
      Math.round(((facturacionTotal - costoOperativo) / facturacionTotal) * 1000) /
      10;
    const { error: krError } = await supabase
      .from("key_results")
      .update({
        margen_actual_pct: margen,
        margen_actualizado_at: new Date().toISOString(),
      })
      .eq("id", krId);
    if (krError) return { error: krError.message };
  }

  revalidatePath("/solop");
  revalidatePath("/");
  revalidatePath("/lom");
  revalidatePath("/checkin");
  if (krId) revalidatePath(`/kr/${krId}`);
  return undefined;
}
