"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { perfilActual } from "@/lib/perfil";

export type CompromisoState = { error?: string } | undefined;

export async function addCompromisoLom(
  krId: string,
  _prevState: CompromisoState,
  formData: FormData
): Promise<CompromisoState> {
  const descripcion = String(formData.get("descripcion") ?? "").trim();
  const responsable = String(formData.get("responsable") ?? "").trim();
  const fechaLimite = String(formData.get("fecha_limite") ?? "").trim();

  if (!descripcion) return { error: "Escribí el compromiso." };
  if (!responsable) return { error: "Un compromiso sin dueño no se cumple: elegí responsable." };

  const supabase = await createClient();
  const { error } = await supabase.from("compromisos_lom").insert({
    kr_id: krId,
    descripcion,
    responsable,
    fecha_limite: fechaLimite || null,
  });
  if (error) return { error: error.message };

  revalidatePath("/lom");
  return undefined;
}

export async function toggleCompromisoLom(compromisoId: string, cumplido: boolean) {
  const supabase = await createClient();
  await supabase
    .from("compromisos_lom")
    .update({ cumplido })
    .eq("id", compromisoId);
  revalidatePath("/lom");
}

// ------------------------------------------------------------
// Actas de directorio
// ------------------------------------------------------------

export async function upsertActa(
  _prevState: CompromisoState,
  formData: FormData
): Promise<CompromisoState> {
  const titulo = String(formData.get("titulo") ?? "").trim();
  if (!titulo) return { error: "Ponele un título al acta." };

  const supabase = await createClient();
  const perfil = await perfilActual();

  const campos = {
    titulo,
    fecha: String(formData.get("fecha") ?? "").trim() || new Date().toISOString().slice(0, 10),
    contenido: String(formData.get("contenido") ?? "").trim() || null,
    actualizado_at: new Date().toISOString(),
  };

  const actaId = String(formData.get("acta_id") ?? "").trim();

  // El autor se sella al crear y no se pisa al editar: el acta la tomó
  // quien la tomó, aunque después la corrija otra persona.
  const { error } = actaId
    ? await supabase.from("actas_directorio").update(campos).eq("id", actaId)
    : await supabase.from("actas_directorio").insert({
        ...campos,
        autor_nombre: perfil?.nombre ?? null,
        autor_id: perfil?.id ?? null,
      });

  if (error) return { error: error.message };

  revalidatePath("/lom");
  return undefined;
}

export async function deleteActa(actaId: string) {
  const supabase = await createClient();
  await supabase.from("actas_directorio").delete().eq("id", actaId);
  revalidatePath("/lom");
}
