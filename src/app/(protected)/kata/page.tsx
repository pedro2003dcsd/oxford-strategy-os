import { KataBoard } from "@/components/clientes/KataBoard";
import { listarClientes, listarCondicionesKata } from "@/lib/clientes";

export const metadata = {
  title: "Kata Board · Oxford Strategy OS",
};

export default async function KataPage() {
  const [clientes, condiciones] = await Promise.all([
    listarClientes(),
    listarCondicionesKata(),
  ]);

  return <KataBoard clientes={clientes} condiciones={condiciones} />;
}
