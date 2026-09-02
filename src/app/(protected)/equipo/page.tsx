import { createClient } from "@/lib/supabase/server";
import { perfilActual } from "@/lib/perfil";
import { EquipoClient } from "@/components/EquipoClient";
import type { UsuarioAutorizado } from "@/lib/types";

export const metadata = {
  title: "Equipo y accesos · Oxford Strategy OS",
};

export default async function EquipoPage() {
  const supabase = await createClient();
  const perfil = await perfilActual();

  const { data: usuarios } = await supabase
    .from("usuarios_autorizados")
    .select("*")
    .order("nombre");

  return (
    <EquipoClient
      usuarios={(usuarios ?? []) as UsuarioAutorizado[]}
      esDireccion={perfil?.esDireccion ?? false}
      miEmail={perfil?.email ?? ""}
    />
  );
}
