import { createClient } from "@/lib/supabase/server";
import { perfilActual } from "@/lib/perfil";
import { EquipoClient } from "@/components/EquipoClient";
import type { OkrTrimestral, UsuarioAutorizado } from "@/lib/types";

export const metadata = {
  title: "Equipo y accesos · Oxford Strategy OS",
};

export default async function EquipoPage() {
  const supabase = await createClient();
  const perfil = await perfilActual();

  const [{ data: usuarios }, { data: okrs }] = await Promise.all([
    supabase
      .from("usuarios_autorizados")
      .select("*")
      .order("nombre"),
    supabase.from("okr_trimestral").select("responsable"),
  ]);

  const responsables = [
    ...new Set(
      ((okrs ?? []) as Pick<OkrTrimestral, "responsable">[])
        .map((o) => o.responsable)
        .filter(Boolean)
    ),
  ].sort((a, b) => a.localeCompare(b, "es"));

  return (
    <EquipoClient
      usuarios={(usuarios ?? []) as UsuarioAutorizado[]}
      responsables={responsables}
      esDireccion={perfil?.esDireccion ?? false}
      miEmail={perfil?.email ?? ""}
    />
  );
}
