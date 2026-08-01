import { createClient } from "@/lib/supabase/server";
import type { CheckIn, CompromisoLom, KeyResultCompleto } from "@/lib/types";
import { LomClient } from "@/components/LomClient";

export default async function LomPage() {
  const supabase = await createClient();

  const { data: krs, error } = await supabase
    .from("key_results")
    .select(
      `*,
      hitos_kr ( * ),
      okr_trimestral (
        *,
        okr_anual ( *, pilares ( * ) )
      )`
    )
    .order("titulo");

  if (error) {
    return (
      <p className="text-sm text-red-600">
        No se pudo cargar el tablero LOM: {error.message}
      </p>
    );
  }

  const lista = (krs ?? []) as unknown as KeyResultCompleto[];
  const ids = lista.map((kr) => kr.id);

  let checkIns: CheckIn[] = [];
  let compromisos: CompromisoLom[] = [];
  if (ids.length > 0) {
    const [{ data: c }, { data: comp }] = await Promise.all([
      supabase
        .from("check_ins")
        .select("*")
        .in("kr_id", ids)
        .order("creado_at", { ascending: true }),
      supabase
        .from("compromisos_lom")
        .select("*")
        .in("kr_id", ids)
        .order("creado_at", { ascending: true }),
    ]);
    checkIns = (c ?? []) as CheckIn[];
    compromisos = (comp ?? []) as CompromisoLom[];
  }

  return <LomClient krs={lista} checkIns={checkIns} compromisos={compromisos} />;
}
