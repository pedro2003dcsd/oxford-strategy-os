import { createClient } from "@/lib/supabase/server";
import { ScoutPageClient } from "@/components/ScoutPageClient";
import type { CheckIn, KeyResultCompleto, ProyectoSolop } from "@/lib/types";

export const metadata = {
  title: "Scout AI · Oxford Strategy OS",
};

export default async function ScoutPage() {
  const supabase = await createClient();

  // Los datos son para el panel lateral: la conversación en sí la resuelve
  // la API, que consulta la base por su cuenta.
  const [{ data: krsData }, { data: checkInsData }, { data: proyectosData }] =
    await Promise.all([
      supabase
        .from("key_results")
        .select(
          `*,
          hitos_kr ( * ),
          iniciativas ( * ),
          okr_trimestral ( *, okr_anual ( *, pilares ( * ) ) )`
        )
        .order("titulo"),
      supabase.from("check_ins").select("*").order("creado_at", { ascending: true }),
      supabase.from("proyectos_solop").select("*"),
    ]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Scout AI</h1>
        <p className="text-sm text-tenue">
          Preguntale en lenguaje natural por el estado de los OKRs, los check-ins
          de la semana y la rentabilidad de los proyectos.
        </p>
      </div>
      <ScoutPageClient
        krs={(krsData ?? []) as unknown as KeyResultCompleto[]}
        checkIns={(checkInsData ?? []) as CheckIn[]}
        proyectos={(proyectosData ?? []) as ProyectoSolop[]}
      />
    </div>
  );
}
