import { createClient } from "@/lib/supabase/server";
import type { CheckIn, KeyResultCompleto } from "@/lib/types";
import { CheckInExpress } from "@/components/CheckInExpress";

function trimestreActual(): { trimestre: string; anio: number } {
  const hoy = new Date();
  const q = Math.floor(hoy.getMonth() / 3) + 1;
  return { trimestre: `Q${q}`, anio: hoy.getFullYear() };
}

export default async function CheckInPage() {
  const supabase = await createClient();
  const { trimestre, anio } = trimestreActual();

  const { data: krs, error } = await supabase
    .from("key_results")
    .select(
      `*,
      hitos_kr ( * ),
      okr_trimestral!inner (
        *,
        okr_anual ( *, pilares ( * ) )
      )`
    )
    .eq("okr_trimestral.trimestre", trimestre)
    .eq("okr_trimestral.anio", anio)
    .order("titulo");

  if (error) {
    return (
      <p className="text-sm text-red-600">
        No se pudieron cargar los Key Results: {error.message}
      </p>
    );
  }

  const lista = (krs ?? []) as unknown as KeyResultCompleto[];
  const ids = lista.map((kr) => kr.id);

  let checkIns: CheckIn[] = [];
  if (ids.length > 0) {
    const { data } = await supabase
      .from("check_ins")
      .select("*")
      .in("kr_id", ids)
      .order("creado_at", { ascending: true });
    checkIns = (data ?? []) as CheckIn[];
  }

  return (
    <CheckInExpress
      krs={lista}
      checkIns={checkIns}
      trimestre={trimestre}
      anio={anio}
    />
  );
}
