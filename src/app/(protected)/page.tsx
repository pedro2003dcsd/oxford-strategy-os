import { createClient } from "@/lib/supabase/server";
import type { CheckIn, KeyResultCompleto, ProyectoSolop } from "@/lib/types";
import { DashboardClient } from "@/components/DashboardClient";
import { perfilActual } from "@/lib/perfil";

export default async function DashboardPage() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("key_results")
    .select(
      `*,
      hitos_kr ( * ),
      iniciativas ( * ),
      okr_trimestral (
        *,
        okr_anual (
          *,
          pilares ( * )
        )
      )`
    )
    .order("titulo");

  if (error) {
    return (
      <p className="text-sm text-red-700 dark:text-red-400">
        No se pudieron cargar los Key Results: {error.message}
      </p>
    );
  }

  const krs = (data ?? []) as unknown as KeyResultCompleto[];

  // El drawer muestra el historial de check-ins y el detalle de SOLOP, así que
  // los traemos acá y no en una segunda vuelta desde el cliente.
  const [{ data: checkInsData }, { data: proyectosData }, perfil] =
    await Promise.all([
      supabase
        .from("check_ins")
        .select("*")
        .order("creado_at", { ascending: true }),
      supabase.from("proyectos_solop").select("*"),
      perfilActual(),
    ]);

  return (
    <DashboardClient
      krs={krs}
      checkIns={(checkInsData ?? []) as CheckIn[]}
      proyectos={(proyectosData ?? []) as ProyectoSolop[]}
      responsableDelPerfil={perfil?.responsable ?? null}
    />
  );
}
