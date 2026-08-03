import Link from "next/link";
import { SignOutButton } from "@/components/SignOutButton";
import { ScoutFloatingButton } from "@/components/ScoutFloatingButton";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="border-b border-linea">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex flex-wrap items-center gap-x-8 gap-y-2">
            <Link href="/" className="text-sm font-semibold">
              Oxford Strategy OS
            </Link>
            <nav className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-tenue">
              <Link href="/" className="hover:text-foreground">
                Dashboard
              </Link>
              <Link href="/checkin" className="hover:text-foreground">
                Check-in
              </Link>
              <Link href="/okrs" className="hover:text-foreground">
                Alineación
              </Link>
              <Link href="/lom" className="hover:text-foreground">
                LOM
              </Link>
              <Link href="/solop" className="hover:text-foreground">
                SOLOP
              </Link>
              <Link href="/informes" className="hover:text-foreground">
                Informes
              </Link>
              <Link
                href="/scout"
                className="flex items-center gap-1 text-oxford hover:text-oxford-fuerte"
              >
                <span aria-hidden>✦</span> Scout AI
              </Link>
            </nav>
          </div>
          <SignOutButton />
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-8">
        {children}
      </main>
      <ScoutFloatingButton />
    </div>
  );
}
