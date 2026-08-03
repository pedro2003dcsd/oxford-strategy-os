import { createClient } from "@/lib/supabase/server";
import { AIReports } from "@/components/AIReports";
import type { OkrTrimestral } from "@/lib/types";
import type { InformeGuardado } from "@/lib/informes";

export default async function InformesPage() {
  const supabase = await createClient();

  const [{ data }, { data: guardadosData }] = await Promise.all([
    supabase.from("okr_trimestral").select("*"),
    supabase
      .from("informes_guardados")
      .select("*")
      .order("creado_at", { ascending: false })
      .limit(30),
  ]);

  const okrs = (data ?? []) as OkrTrimestral[];
  const areasConDatos = [...new Set(okrs.map((o) => o.area))].sort();
  const trimestreActual = `Q${Math.floor(new Date().getMonth() / 3) + 1}`;

  return (
    <AIReports
      areasConDatos={areasConDatos}
      trimestreActual={trimestreActual}
      anioActual={new Date().getFullYear()}
      guardados={(guardadosData ?? []) as InformeGuardado[]}
    />
  );
}
