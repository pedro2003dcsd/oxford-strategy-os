import { createClient } from "@/lib/supabase/server";
import type { KeyResult, ProyectoSolop } from "@/lib/types";
import { SolopClient } from "@/components/SolopClient";

export default async function SolopPage() {
  const supabase = await createClient();

  const [{ data: proyectos, error }, { data: krs }] = await Promise.all([
    supabase.from("proyectos_solop").select("*").order("cliente"),
    supabase.from("key_results").select("*").order("titulo"),
  ]);

  if (error) {
    return (
      <p className="text-sm text-red-600">
        No se pudo cargar la Torre de Control: {error.message}
      </p>
    );
  }

  return (
    <SolopClient
      proyectos={(proyectos ?? []) as ProyectoSolop[]}
      krs={(krs ?? []) as KeyResult[]}
    />
  );
}
