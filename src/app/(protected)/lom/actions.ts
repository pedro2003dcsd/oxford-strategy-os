"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

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
