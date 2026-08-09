"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { puedeEscribir, vetoDeEscritura } from "@/lib/permisos";
import { ESTADOS_INICIATIVA, type EstadoIniciativa } from "@/lib/types";

export type IniciativaState = { error?: string } | undefined;

/** Las iniciativas se ven en el dashboard, en la LOM y en el detalle del KR:
 * cualquier cambio tiene que refrescar las tres. */
function revalidarVistas(krId: string) {
  revalidatePath("/");
  revalidatePath("/lom");
  revalidatePath(`/kr/${krId}`);
}

export async function addIniciativa(
  krId: string,
  _prevState: IniciativaState,
  formData: FormData
): Promise<IniciativaState> {
  const veto = await vetoDeEscritura();
  if (veto) return { error: veto };

  const titulo = String(formData.get("titulo") ?? "").trim();
  const responsable = String(formData.get("responsable") ?? "").trim();
  const fechaLimite = String(formData.get("fecha_limite") ?? "").trim();
  const linkRecurso = String(formData.get("link_recurso") ?? "").trim();

  if (!titulo) return { error: "Escribí qué hay que hacer." };
  if (linkRecurso && !/^https?:\/\//i.test(linkRecurso)) {
    return { error: "El link tiene que empezar con http:// o https://" };
  }

  const supabase = await createClient();

  // La nueva iniciativa va al final de la lista del KR.
  const { data: ultima } = await supabase
    .from("iniciativas")
    .select("orden")
    .eq("kr_id", krId)
    .order("orden", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { error } = await supabase.from("iniciativas").insert({
    kr_id: krId,
    titulo,
    responsable: responsable || null,
    fecha_limite: fechaLimite || null,
    link_recurso: linkRecurso || null,
    orden: ((ultima?.orden as number | undefined) ?? 0) + 1,
  });

  if (error) return { error: error.message };

  revalidarVistas(krId);
  return undefined;
}

export async function setEstadoIniciativa(
  iniciativaId: string,
  krId: string,
  estado: EstadoIniciativa
) {
  if (!(await puedeEscribir())) return;

  if (!ESTADOS_INICIATIVA.includes(estado)) return;

  const supabase = await createClient();
  await supabase
    .from("iniciativas")
    .update({ estado, actualizado_at: new Date().toISOString() })
    .eq("id", iniciativaId);

  revalidarVistas(krId);
}

/** Tildar/destildar desde la lista: alterna entre completado y pendiente. */
export async function toggleIniciativa(
  iniciativaId: string,
  krId: string,
  completado: boolean
) {
  if (!(await puedeEscribir())) return;

  await setEstadoIniciativa(
    iniciativaId,
    krId,
    completado ? "completado" : "pendiente"
  );
}

export async function deleteIniciativa(iniciativaId: string, krId: string) {
  if (!(await puedeEscribir())) return;

  const supabase = await createClient();
  await supabase.from("iniciativas").delete().eq("id", iniciativaId);
  revalidarVistas(krId);
}

export type LinkTrabajoState = { error?: string } | undefined;

export async function updateLinkTrabajo(
  krId: string,
  _prevState: LinkTrabajoState,
  formData: FormData
): Promise<LinkTrabajoState> {
  const veto = await vetoDeEscritura();
  if (veto) return { error: veto };

  const link = String(formData.get("link_trabajo") ?? "").trim();

  if (link && !/^https?:\/\//i.test(link)) {
    return { error: "El link tiene que empezar con http:// o https://" };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("key_results")
    .update({ link_trabajo: link || null })
    .eq("id", krId);

  if (error) return { error: error.message };

  revalidarVistas(krId);
  return undefined;
}
