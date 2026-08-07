import { KpisClientes } from "@/components/clientes/KpisClientes";
import { listarClientes, listarEvaluaciones } from "@/lib/clientes";

export const metadata = {
  title: "KPIs Clientes · Oxford Strategy OS",
};

export default async function KpisClientesPage() {
  const [clientes, evaluaciones] = await Promise.all([
    listarClientes(),
    listarEvaluaciones(),
  ]);

  return <KpisClientes clientes={clientes} evaluaciones={evaluaciones} />;
}
