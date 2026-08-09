"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { puedeEscribir, vetoDeEscritura } from "@/lib/permisos";

export type FormActionState = { error?: string } | undefined;

function str(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function optionalStr(formData: FormData, key: string) {
  return str(formData, key) || null;
}

// ------------------------------------------------------------
// Condición objetivo
// ------------------------------------------------------------

export async function upsertCondicion(
  _prevState: FormActionState,
  formData: FormData
): Promise<FormActionState> {
  const veto = await vetoDeEscritura();
  if (veto) return { error: veto };

  const clienteId = str(formData, "cliente_id");
  const titulo = str(formData, "titulo");

  if (!clienteId || !titulo) {
    return { error: "Elegí el cliente y escribí la condición objetivo." };
  }

  const progreso = Number(formData.get("progreso_porcentaje")) || 0;
  if (progreso < 0 || progreso > 100) {
    return { error: "El progreso va de 0 a 100." };
  }

  const campos = {
    cliente_id: clienteId,
    titulo,
    meta: optionalStr(formData, "meta"),
    progreso_porcentaje: progreso,
    obstaculo_actual: optionalStr(formData, "obstaculo_actual"),
    siguiente_paso: optionalStr(formData, "siguiente_paso"),
    responsable_nombre: optionalStr(formData, "responsable_nombre"),
    responsable_id: optionalStr(formData, "responsable_id"),
    actualizado_at: new Date().toISOString(),
  };

  const supabase = await createClient();
  const condicionId = optionalStr(formData, "condicion_id");

  const { error } = condicionId
    ? await supabase.from("kata_condiciones").update(campos).eq("id", condicionId)
    : await supabase.from("kata_condiciones").insert(campos);

  if (error) return { error: error.message };

  revalidatePath("/kata");
  return undefined;
}

export async function deleteCondicion(condicionId: string) {
  if (!(await puedeEscribir())) return;

  const supabase = await createClient();
  // Los experimentos se van con ella: on delete cascade en pdca_experimentos.
  await supabase.from("kata_condiciones").delete().eq("id", condicionId);
  revalidatePath("/kata");
}

// ------------------------------------------------------------
// Experimentos PDCA
// ------------------------------------------------------------

export async function upsertExperimento(
  _prevState: FormActionState,
  formData: FormData
): Promise<FormActionState> {
  const veto = await vetoDeEscritura();
  if (veto) return { error: veto };

  const condicionId = str(formData, "condicion_id");
  const hipotesis = str(formData, "hipotesis");

  if (!condicionId || !hipotesis) {
    return { error: "La hipótesis es obligatoria: es lo que el experimento pone a prueba." };
  }

  const campos = {
    condicion_id: condicionId,
    hipotesis,
    experimento: optionalStr(formData, "experimento"),
    estado: str(formData, "estado") || "planificado",
    aprendizaje: optionalStr(formData, "aprendizaje"),
    actualizado_at: new Date().toISOString(),
  };

  const supabase = await createClient();
  const experimentoId = optionalStr(formData, "experimento_id");

  const { error } = experimentoId
    ? await supabase.from("pdca_experimentos").update(campos).eq("id", experimentoId)
    : await supabase.from("pdca_experimentos").insert(campos);

  if (error) return { error: error.message };

  revalidatePath("/kata");
  return undefined;
}

/** Cambio de estado desde el tablero, sin abrir el formulario. Es el gesto
 * más frecuente del Kata: mover una tarjeta de columna. */
export async function cambiarEstadoExperimento(
  experimentoId: string,
  estado: string
) {
  if (!(await puedeEscribir())) return;

  const supabase = await createClient();
  await supabase
    .from("pdca_experimentos")
    .update({ estado, actualizado_at: new Date().toISOString() })
    .eq("id", experimentoId);
  revalidatePath("/kata");
}

export async function deleteExperimento(experimentoId: string) {
  if (!(await puedeEscribir())) return;

  const supabase = await createClient();
  await supabase.from("pdca_experimentos").delete().eq("id", experimentoId);
  revalidatePath("/kata");
}
