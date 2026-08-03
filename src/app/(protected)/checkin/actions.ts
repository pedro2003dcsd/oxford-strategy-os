"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type ExpressState = { error?: string; ok?: boolean } | undefined;

export async function submitCheckInExpress(
  krId: string,
  _prevState: ExpressState,
  formData: FormData
): Promise<ExpressState> {
  const usuario = String(formData.get("usuario") ?? "").trim();
  const estado = String(formData.get("estado_semaforo") ?? "");
  const comentario = String(formData.get("comentario_bloqueos") ?? "").trim();
  const tipoMedicion = String(formData.get("tipo_medicion") ?? "");

  if (!usuario) return { error: "Falta el responsable del check-in." };
  if (!["verde", "amarillo", "rojo"].includes(estado)) {
    return { error: "Elegí un estado del semáforo." };
  }
  if ((estado === "amarillo" || estado === "rojo") && !comentario) {
    return {
      error:
        "En amarillo o rojo, contá qué bloqueos o necesidades tenés para presentar en la LOM.",
    };
  }

  const supabase = await createClient();
  let valor: number;

  if (tipoMedicion === "hitos") {
    // Los checkboxes tildados viajan como hito_cumplido=<id>; el resto va en hito_todos.
    const todos = formData.getAll("hito_todos").map(String);
    const cumplidos = new Set(formData.getAll("hito_cumplido").map(String));

    for (const hitoId of todos) {
      const { error } = await supabase
        .from("hitos_kr")
        .update({ cumplido: cumplidos.has(hitoId) })
        .eq("id", hitoId);
      if (error) return { error: error.message };
    }
    valor =
      todos.length === 0
        ? 0
        : Math.round((cumplidos.size / todos.length) * 100);
  } else {
    const valorRaw = formData.get("valor_registrado");
    valor = Number(valorRaw);
    if (valorRaw === null || valorRaw === "" || Number.isNaN(valor)) {
      return { error: "Ingresá un valor numérico válido." };
    }
  }

  // Iniciativas tildadas en el mismo acto: se marcan completadas y las
  // destildadas vuelven a pendiente, salvo que estén bloqueadas o en curso
  // (ese estado lo maneja el responsable desde la ficha, no el check-in).
  const iniciativasTodas = formData.getAll("iniciativa_todas").map(String);
  if (iniciativasTodas.length > 0) {
    const completadas = new Set(formData.getAll("iniciativa_completada").map(String));
    const previas = new Set(formData.getAll("iniciativa_ya_completada").map(String));

    for (const id of iniciativasTodas) {
      const estaCompletada = completadas.has(id);
      if (estaCompletada === previas.has(id)) continue;
      const { error } = await supabase
        .from("iniciativas")
        .update({
          estado: estaCompletada ? "completado" : "pendiente",
          actualizado_at: new Date().toISOString(),
        })
        .eq("id", id);
      if (error) return { error: error.message };
    }
  }

  const { error } = await supabase.from("check_ins").insert({
    kr_id: krId,
    usuario,
    valor_registrado: valor,
    estado_semaforo: estado,
    comentario_bloqueos: comentario || null,
  });
  if (error) return { error: error.message };

  revalidatePath("/checkin");
  revalidatePath("/");
  revalidatePath("/okrs");
  revalidatePath(`/kr/${krId}`);
  return { ok: true };
}
