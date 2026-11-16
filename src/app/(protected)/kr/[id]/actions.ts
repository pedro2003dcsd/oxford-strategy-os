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

/** Los códigos con los que editar_check_in y borrar_check_in (0019) rechazan
 * una corrección, traducidos para la persona. La regla la aplica la base en
 * la misma transacción que el cambio: acá solo se explica el motivo. */
const MOTIVOS_DE_RECHAZO: Record<string, string> = {
  checkin_sin_permiso: "Tu cuenta no puede modificar check-ins.",
  checkin_no_existe:
    "Ese check-in ya no existe. Actualizá el historial para ver el estado actual.",
  checkin_no_es_ultimo:
    "Mientras tanto se cargó un check-in más nuevo en este KR, así que este ya no se puede modificar. Actualizá el historial para verlo.",
  checkin_no_es_autor: "Solo quien cargó el check-in puede modificarlo.",
  checkin_kr_de_hitos:
    "Los check-ins de un KR de hitos no se pueden editar ni borrar.",
  checkin_sin_estado_previo:
    "No se puede borrar: no quedó guardado el avance que tenía el KR antes de este check-in. Podés editarlo en lugar de borrarlo.",
  checkin_valor_invalido: "Ingresá un valor numérico válido.",
  checkin_semaforo_invalido: "Elegí un semáforo.",
};

function motivoDeRechazo(mensaje: string): string {
  const codigo = Object.keys(MOTIVOS_DE_RECHAZO).find((c) => mensaje.includes(c));
  return codigo ? MOTIVOS_DE_RECHAZO[codigo] : mensaje;
}

/** Todo lo que muestra el avance o el último check-in de un KR. */
function revalidarKr(krId: string) {
  revalidatePath(`/kr/${krId}`);
  revalidatePath("/");
  revalidatePath("/checkin");
  revalidatePath("/okrs");
  revalidatePath("/lom");
}

/** Corregir el último check-in de un KR. Solo quien lo cargó, y solo
 * mientras siga siendo el último: lo verifica editar_check_in. */
export async function editarCheckIn(
  krId: string,
  checkInId: string,
  _prevState: CheckInState,
  formData: FormData
): Promise<CheckInState> {
  const veto = await vetoDeEscritura();
  if (veto) return { error: veto };

  const valorRaw = formData.get("valor_registrado");
  const estado = String(formData.get("estado_semaforo") ?? "");
  const comentario = String(formData.get("comentario_bloqueos") ?? "").trim();
  const valor = Number(valorRaw);

  if (valorRaw === null || valorRaw === "" || Number.isNaN(valor)) {
    return { error: MOTIVOS_DE_RECHAZO.checkin_valor_invalido };
  }
  if (!["verde", "amarillo", "rojo"].includes(estado)) {
    return { error: MOTIVOS_DE_RECHAZO.checkin_semaforo_invalido };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("editar_check_in", {
    p_check_in: checkInId,
    p_valor: valor,
    p_estado: estado,
    p_comentario: comentario || null,
  });

  // Si falla no se revalida: el rechazo típico es que alguien cargó un
  // check-in más nuevo, y refrescar acá sacaría de pantalla el formulario
  // junto con el mensaje que lo explica. El formulario ofrece actualizar.
  if (error) return { error: motivoDeRechazo(error.message) };
  revalidarKr(krId);
  return undefined;
}

/** Borrar el último check-in de un KR. El avance y el semáforo vuelven al
 * check-in anterior o, si era el único, al estado guardado antes de esa
 * carga: lo resuelve borrar_check_in. */
export async function borrarCheckIn(
  krId: string,
  checkInId: string
): Promise<CheckInState> {
  const veto = await vetoDeEscritura();
  if (veto) return { error: veto };

  const supabase = await createClient();
  const { error } = await supabase.rpc("borrar_check_in", {
    p_check_in: checkInId,
  });

  if (error) return { error: motivoDeRechazo(error.message) };
  revalidarKr(krId);
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
