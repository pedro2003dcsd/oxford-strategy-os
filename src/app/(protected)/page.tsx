import { createClient } from "@/lib/supabase/server";
import type {
  CheckIn,
  Cliente,
  KeyResultCompleto,
  OkrAnual,
  OkrTrimestral,
  ProyectoSolop,
  UsuarioAutorizado,
} from "@/lib/types";
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
  const [
    { data: checkInsData },
    { data: proyectosData },
    { data: okrsTrimData },
    { data: okrsAnualesData },
    { data: clientesData },
    { data: personasData },
    perfil,
  ] = await Promise.all([
    supabase
      .from("check_ins")
      .select("*")
      .order("creado_at", { ascending: true }),
    supabase.from("proyectos_solop").select("*"),
    supabase
      .from("okr_trimestral")
      .select("*")
      .order("created_at", { ascending: true }),
    supabase.from("okr_anual").select("*").order("created_at", { ascending: true }),
    supabase.from("clientes").select("*").order("nombre"),
    supabase
      .from("usuarios_autorizados")
      .select("*")
      .eq("activo", true)
      .order("nombre"),
    perfilActual(),
  ]);

  // Los OKRs que lleva quien está mirando, por id: los que rinde cuentas más
  // los que comparte. Se resuelve acá y no en el cliente para no mandarle la
  // tabla entera de responsables al navegador.
  let misOkrIds: string[] | null = null;
  if (perfil) {
    const [{ data: propios }, { data: compartidos }] = await Promise.all([
      supabase
        .from("okr_trimestral")
        .select("id")
        .eq("responsable_id", perfil.id),
      supabase
        .from("okr_responsables")
        .select("okr_trimestral_id")
        .eq("usuario_id", perfil.id)
        .not("okr_trimestral_id", "is", null),
    ]);

    misOkrIds = [
      ...(propios ?? []).map((o) => o.id as string),
      ...(compartidos ?? []).map((r) => r.okr_trimestral_id as string),
    ];
  }

  return (
    <DashboardClient
      krs={krs}
      checkIns={(checkInsData ?? []) as CheckIn[]}
      proyectos={(proyectosData ?? []) as ProyectoSolop[]}
      responsableDelPerfil={perfil?.nombre ?? null}
      areaDelPerfil={perfil?.area ?? null}
      misOkrIds={misOkrIds}
      okrsTrimestrales={(okrsTrimData ?? []) as OkrTrimestral[]}
      okrsAnuales={(okrsAnualesData ?? []) as OkrAnual[]}
      clientes={(clientesData ?? []) as Cliente[]}
      personas={(personasData ?? []) as UsuarioAutorizado[]}
      puedeCrear={perfil ? perfil.rol !== "lectura" : false}
    />
  );
}
