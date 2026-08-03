import { createClient } from "@/lib/supabase/server";
import type { UsuarioAutorizado } from "@/lib/types";

export interface Perfil extends UsuarioAutorizado {
  esDireccion: boolean;
}

/** Perfil de quien está usando la app: sale de cruzar el mail de la sesión
 * con la lista de autorizados. Devuelve null si no hay sesión o si el mail
 * no está habilitado. */
export async function perfilActual(): Promise<Perfil | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const email = user?.email?.toLowerCase();
  if (!email) return null;

  const { data } = await supabase
    .from("usuarios_autorizados")
    .select("*")
    .ilike("email", email)
    .eq("activo", true)
    .maybeSingle();

  if (!data) return null;

  const usuario = data as UsuarioAutorizado;
  return { ...usuario, esDireccion: usuario.rol === "direccion" };
}
