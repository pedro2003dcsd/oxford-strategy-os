import { createClient } from "@/lib/supabase/server";
import { MapaAlineacion } from "@/components/MapaAlineacion";
import { perfilActual } from "@/lib/perfil";
import type {
  Cliente,
  HitoKr,
  KeyResult,
  KrAlineacion,
  KrAnual,
  OkrAlineacion,
  OkrAnual,
  OkrTrimestral,
  UsuarioAutorizado,
} from "@/lib/types";

export default async function OkrsPage() {
  const supabase = await createClient();
  const perfil = await perfilActual();
  const puedeEditar = perfil ? perfil.rol !== "lectura" : false;

  const [
    { data: okrsAnuales },
    { data: krsAnuales },
    { data: okrsTrimestrales },
    { data: keyResults },
    { data: okrLinks },
    { data: krLinks },
    { data: personas },
    { data: clientes },
  ] = await Promise.all([
    supabase.from("okr_anual").select("*").order("created_at", { ascending: true }),
    supabase.from("kr_anual").select("*").order("orden", { ascending: true }),
    supabase
      .from("okr_trimestral")
      .select("*")
      .order("created_at", { ascending: true }),
    supabase
      .from("key_results")
      .select("*, hitos_kr ( * )")
      .order("created_at", { ascending: true }),
    supabase.from("okr_alineacion").select("*"),
    supabase.from("kr_alineacion").select("*"),
    supabase
      .from("usuarios_autorizados")
      .select("*")
      .eq("activo", true)
      .order("nombre"),
    supabase.from("clientes").select("*").order("nombre"),
  ]);

  return (
    <div className="space-y-5">
      <header className="space-y-1">
        <h1 className="text-xl font-semibold">Alineación estratégica</h1>
        <p className="text-sm text-tenue">
          El mapa de OKRs anuales y trimestrales. Cada OKR/KR trimestral puede
          empujar a más de un anual.
          {puedeEditar
            ? " Arrastrá del punto de un nodo hasta el del lado opuesto para conectar; tocá la ✕ de una línea para desvincular."
            : ""}
        </p>
      </header>

      <MapaAlineacion
        okrsAnuales={(okrsAnuales ?? []) as OkrAnual[]}
        krsAnuales={(krsAnuales ?? []) as KrAnual[]}
        okrsTrimestrales={(okrsTrimestrales ?? []) as OkrTrimestral[]}
        keyResults={(keyResults ?? []) as (KeyResult & { hitos_kr: HitoKr[] })[]}
        okrLinks={(okrLinks ?? []) as OkrAlineacion[]}
        krLinks={(krLinks ?? []) as KrAlineacion[]}
        personas={(personas ?? []) as UsuarioAutorizado[]}
        clientes={(clientes ?? []) as Cliente[]}
        puedeEditar={puedeEditar}
      />
    </div>
  );
}
