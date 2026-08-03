"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type GuardarInformeState = { error?: string; ok?: boolean } | undefined;

/** Guarda el informe tal como se generó. No se regenera después: los datos
 * cambian y el texto de la LOM del 3 de agosto tiene que seguir diciendo lo
 * que decía el 3 de agosto. */
export async function guardarInforme(
  _prevState: GuardarInformeState,
  formData: FormData
): Promise<GuardarInformeState> {
  const markdown = String(formData.get("markdown") ?? "").trim();
  const tipoReporte = String(formData.get("tipo_reporte") ?? "").trim();
  const titulo = String(formData.get("titulo") ?? "").trim();
  const fuente = String(formData.get("fuente") ?? "reglas");

  if (!markdown) return { error: "No hay informe para guardar." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase.from("informes_guardados").insert({
    tipo_reporte: tipoReporte || "semanal_lom",
    titulo: titulo || "Informe",
    markdown,
    fuente: fuente === "ia" ? "ia" : "reglas",
    area: String(formData.get("area") ?? "") || null,
    trimestre: String(formData.get("trimestre") ?? "") || null,
    anio: Number(formData.get("anio")) || null,
    creado_por: user?.email ?? null,
  });

  if (error) return { error: error.message };

  revalidatePath("/informes");
  return { ok: true };
}

export async function borrarInforme(id: string) {
  const supabase = await createClient();
  await supabase.from("informes_guardados").delete().eq("id", id);
  revalidatePath("/informes");
}
