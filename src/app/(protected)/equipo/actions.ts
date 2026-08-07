"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { perfilActual } from "@/lib/perfil";
import { ROLES, type Rol } from "@/lib/types";

export type EquipoState = { error?: string; ok?: string } | undefined;

/** La política de RLS ya bloquea a quien no es Dirección, pero cortar acá da
 * un mensaje entendible en vez de un error de base. */
async function exigirDireccion(): Promise<string | null> {
  const perfil = await perfilActual();
  if (!perfil) return "No hay sesión.";
  if (!perfil.esDireccion) {
    return "Solo Dirección puede administrar los accesos.";
  }
  return null;
}

export async function agregarUsuario(
  _prevState: EquipoState,
  formData: FormData
): Promise<EquipoState> {
  const veto = await exigirDireccion();
  if (veto) return { error: veto };

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const nombre = String(formData.get("nombre") ?? "").trim();
  const responsable = String(formData.get("responsable") ?? "").trim();
  const rol = String(formData.get("rol") ?? "equipo") as Rol;

  if (!email || !email.includes("@")) return { error: "Ingresá un email válido." };
  if (!nombre) return { error: "Ingresá el nombre de la persona." };
  if (!ROLES.includes(rol)) return { error: "Rol inválido." };

  const supabase = await createClient();
  const { error } = await supabase.from("usuarios_autorizados").insert({
    email,
    nombre,
    responsable: responsable || null,
    rol,
  });

  if (error) {
    if (error.code === "23505") return { error: "Ese email ya está en la lista." };
    return { error: error.message };
  }

  revalidatePath("/equipo");
  return { ok: `${nombre} ya puede entrar con ${email}.` };
}

export async function cambiarEstadoUsuario(id: string, activo: boolean) {
  if (await exigirDireccion()) return;
  const supabase = await createClient();
  await supabase.from("usuarios_autorizados").update({ activo }).eq("id", id);
  revalidatePath("/equipo");
}

export async function cambiarRolUsuario(id: string, rol: Rol) {
  if (!ROLES.includes(rol)) return;
  if (await exigirDireccion()) return;
  const supabase = await createClient();
  await supabase.from("usuarios_autorizados").update({ rol }).eq("id", id);
  revalidatePath("/equipo");
}

export async function cambiarResponsableUsuario(id: string, responsable: string) {
  if (await exigirDireccion()) return;
  const supabase = await createClient();
  await supabase
    .from("usuarios_autorizados")
    .update({ responsable: responsable || null })
    .eq("id", id);
  revalidatePath("/equipo");
  revalidatePath("/");
}

export async function quitarUsuario(id: string) {
  const veto = await exigirDireccion();
  if (veto) return;

  const supabase = await createClient();

  // No dejar la casa sin llaves: si es la única cuenta de Dirección activa,
  // borrarla haría imposible volver a administrar los accesos.
  const { data: fila } = await supabase
    .from("usuarios_autorizados")
    .select("rol")
    .eq("id", id)
    .maybeSingle();

  if (fila?.rol === "direccion") {
    const { count } = await supabase
      .from("usuarios_autorizados")
      .select("id", { count: "exact", head: true })
      .eq("rol", "direccion")
      .eq("activo", true);
    if ((count ?? 0) <= 1) return;
  }

  await supabase.from("usuarios_autorizados").delete().eq("id", id);
  revalidatePath("/equipo");
}
