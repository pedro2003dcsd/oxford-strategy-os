import Link from "next/link";
import { ScoutFloatingButton } from "@/components/ScoutFloatingButton";
import { Sidebar } from "@/components/Sidebar";
import { perfilActual } from "@/lib/perfil";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const perfil = await perfilActual();

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="border-b border-linea">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3 sm:px-6">
          <Sidebar
            nombre={perfil?.nombre ?? "Equipo"}
            email={perfil?.email ?? ""}
          />
          <Link href="/" className="text-sm font-semibold">
            Oxford <span className="text-oxford">Strategy OS</span>
          </Link>
        </div>
      </header>
      {/* Los botones de guardar siguen a la vista, así que sin este aviso la
          persona descubre que no puede escribir recién al chocarse con el
          error. Decirlo antes es más barato que esconder cada control. */}
      {perfil?.rol === "lectura" && (
        <div className="border-b border-amber-500/40 bg-amber-500/10">
          <p className="mx-auto max-w-6xl px-4 py-2 text-sm text-amber-900 dark:text-amber-200 sm:px-6">
            <span className="font-semibold">Modo solo lectura.</span> Podés ver
            todo, pero no guardar cambios. Si necesitás cargar datos, pedile a
            Dirección que te cambie el rol desde la pantalla Equipo.
          </p>
        </div>
      )}
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
        {children}
      </main>
      <ScoutFloatingButton />
    </div>
  );
}
