import { createClient } from "@/lib/supabase/server";
import type { KeyResultCompleto } from "@/lib/types";
import { DashboardClient } from "@/components/DashboardClient";

export default async function DashboardPage() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("key_results")
    .select(
      `*,
      hitos_kr ( * ),
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
      <p className="text-sm text-red-600">
        No se pudieron cargar los Key Results: {error.message}
      </p>
    );
  }

  return <DashboardClient krs={(data ?? []) as unknown as KeyResultCompleto[]} />;
}
