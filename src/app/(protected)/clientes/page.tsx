import { CarteraClientes } from "@/components/clientes/CarteraClientes";
import { listarClientes } from "@/lib/clientes";
import { createClient } from "@/lib/supabase/server";
import type { KeyResult, UsuarioAutorizado } from "@/lib/types";

export const metadata = {
  title: "Cartera de Clientes · Oxford Strategy OS",
};

export default async function ClientesPage() {
  const supabase = await createClient();

  const [clientes, { data: keyResults }, { data: personas }] = await Promise.all([
    listarClientes(),
    supabase.from("key_results").select("*").order("titulo"),
    supabase
      .from("usuarios_autorizados")
      .select("*")
      .eq("activo", true)
      .order("nombre"),
  ]);

  return (
    <CarteraClientes
      clientes={clientes}
      keyResults={(keyResults ?? []) as KeyResult[]}
      personas={(personas ?? []) as UsuarioAutorizado[]}
    />
  );
}
