"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type FormActionState = { error?: string } | undefined;

function str(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function optionalStr(formData: FormData, key: string) {
  const v = str(formData, key);
  return v || null;
}

export async function createPilar(
  _prevState: FormActionState,
  formData: FormData
): Promise<FormActionState> {
  const nombre = str(formData, "nombre");
  if (!nombre) return { error: "El nombre del pilar es obligatorio." };

  const supabase = await createClient();
  const { error } = await supabase.from("pilares").insert({
    nombre,
    descripcion: optionalStr(formData, "descripcion"),
    anio: Number(formData.get("anio")) || 2026,
  });
  if (error) return { error: error.message };

  revalidatePath("/okrs");
  return undefined;
}

export async function createOkrAnual(
  _prevState: FormActionState,
  formData: FormData
): Promise<FormActionState> {
  const titulo = str(formData, "titulo");
  if (!titulo) return { error: "El título es obligatorio." };

  const supabase = await createClient();
  const { error } = await supabase.from("okr_anual").insert({
    pilar_id: optionalStr(formData, "pilar_id"),
    titulo,
    objetivo: optionalStr(formData, "objetivo"),
    responsable: optionalStr(formData, "responsable"),
  });
  if (error) return { error: error.message };

  revalidatePath("/okrs");
  return undefined;
}

export async function createOkrTrimestral(
  _prevState: FormActionState,
  formData: FormData
): Promise<FormActionState> {
  const titulo = str(formData, "titulo");
  const area = str(formData, "area");
  const trimestre = str(formData, "trimestre");
  const responsable = str(formData, "responsable");

  if (!titulo || !area || !trimestre || !responsable) {
    return { error: "Completá título, área, trimestre y responsable." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("okr_trimestral").insert({
    // okr_anual_id es opcional a propósito: un área puede alinear su OKR
    // trimestral más tarde sin bloquear el arranque del trimestre.
    okr_anual_id: optionalStr(formData, "okr_anual_id"),
    area,
    titulo,
    trimestre,
    anio: Number(formData.get("anio")) || 2026,
    responsable,
  });
  if (error) return { error: error.message };

  revalidatePath("/okrs");
  return undefined;
}

export async function createKeyResult(
  _prevState: FormActionState,
  formData: FormData
): Promise<FormActionState> {
  const okrTrimestralId = str(formData, "okr_trimestral_id");
  const titulo = str(formData, "titulo");
  const tipoMedicion = str(formData, "tipo_medicion");

  if (!okrTrimestralId || !titulo || !tipoMedicion) {
    return { error: "Completá el OKR trimestral, el título y el tipo de medición." };
  }

  const valorMeta = Number(formData.get("valor_meta"));
  if (tipoMedicion !== "hitos" && Number.isNaN(valorMeta)) {
    return { error: "Ingresá una meta numérica." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("key_results").insert({
    okr_trimestral_id: okrTrimestralId,
    titulo,
    tipo_medicion: tipoMedicion,
    valor_inicial: Number(formData.get("valor_inicial")) || 0,
    valor_meta: tipoMedicion === "hitos" ? 1 : valorMeta,
    cliente_asociado: optionalStr(formData, "cliente_asociado"),
    margen_utilidad_esperado:
      Number(formData.get("margen_utilidad_esperado")) || 65.0,
  });
  if (error) return { error: error.message };

  revalidatePath("/okrs");
  revalidatePath("/");
  return undefined;
}

export async function createHito(
  _prevState: FormActionState,
  formData: FormData
): Promise<FormActionState> {
  const krId = str(formData, "kr_id");
  const titulo = str(formData, "titulo");
  if (!krId || !titulo) return { error: "Elegí el KR e ingresá el título del hito." };

  const supabase = await createClient();
  const { error } = await supabase.from("hitos_kr").insert({
    kr_id: krId,
    titulo,
    orden: Number(formData.get("orden")) || 0,
  });
  if (error) return { error: error.message };

  revalidatePath("/okrs");
  revalidatePath("/");
  return undefined;
}
