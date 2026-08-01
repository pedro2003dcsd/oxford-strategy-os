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
  if (!descripcion) return { error: "Escribí el compromiso." };

  const supabase = await createClient();
  const { error } = await supabase.from("compromisos_lom").insert({
    kr_id: krId,
    descripcion,
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
