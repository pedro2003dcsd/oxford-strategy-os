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
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
        {children}
      </main>
      <ScoutFloatingButton />
    </div>
  );
}
