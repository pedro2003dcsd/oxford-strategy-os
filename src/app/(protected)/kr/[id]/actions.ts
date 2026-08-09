"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { puedeEscribir, vetoDeEscritura } from "@/lib/permisos";

export type CheckInState = { error?: string } | undefined;

export async function addCheckIn(
  krId: string,
  _prevState: CheckInState,
  formData: FormData
): Promise<CheckInState> {
  const veto = await vetoDeEscritura();
  if (veto) return { error: veto };

  const usuario = String(formData.get("usuario") ?? "").trim();
  const valorRaw = formData.get("valor_registrado");
  const estado = String(formData.get("estado_semaforo") ?? "");
  const comentario = String(formData.get("comentario_bloqueos") ?? "").trim();

  const valor = Number(valorRaw);

  if (!usuario) return { error: "Indicá quién hace el check-in." };
  if (valorRaw === null || valorRaw === "" || Number.isNaN(valor)) {
    return { error: "Ingresá un valor numérico válido." };
  }
  if (!["verde", "amarillo", "rojo"].includes(estado)) {
    return { error: "Elegí un semáforo." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("check_ins").insert({
    kr_id: krId,
    usuario,
    valor_registrado: valor,
    estado_semaforo: estado,
    comentario_bloqueos: comentario || null,
  });

  if (error) return { error: error.message };

  revalidatePath(`/kr/${krId}`);
  revalidatePath("/");
  return undefined;
}

export async function toggleHito(hitoId: string, krId: string, cumplido: boolean) {
  if (!(await puedeEscribir())) return;

  const supabase = await createClient();
  await supabase.from("hitos_kr").update({ cumplido }).eq("id", hitoId);
  revalidatePath(`/kr/${krId}`);
  revalidatePath("/");
}

export type MargenState = { error?: string } | undefined;

export async function updateMargen(
  krId: string,
  _prevState: MargenState,
  formData: FormData
): Promise<MargenState> {
  const veto = await vetoDeEscritura();
  if (veto) return { error: veto };

  const margenRaw = formData.get("margen_actual_pct");
  const margen = margenRaw === "" ? null : Number(margenRaw);

  if (margen !== null && Number.isNaN(margen)) {
    return { error: "Ingresá un porcentaje válido." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("key_results")
    .update({
      margen_actual_pct: margen,
      margen_actualizado_at: new Date().toISOString(),
    })
    .eq("id", krId);

  if (error) return { error: error.message };

  revalidatePath(`/kr/${krId}`);
  revalidatePath("/");
  return undefined;
}
