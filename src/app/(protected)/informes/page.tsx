import { createClient } from "@/lib/supabase/server";
import { AIReports } from "@/components/AIReports";
import type { OkrTrimestral } from "@/lib/types";

export default async function InformesPage() {
  const supabase = await createClient();
  const { data } = await supabase.from("okr_trimestral").select("*");
  const okrs = (data ?? []) as OkrTrimestral[];

  const areasConDatos = [...new Set(okrs.map((o) => o.area))].sort();
  const trimestreActual = `Q${Math.floor(new Date().getMonth() / 3) + 1}`;

  return (
    <AIReports
      areasConDatos={areasConDatos}
      trimestreActual={trimestreActual}
      anioActual={new Date().getFullYear()}
    />
  );
}
