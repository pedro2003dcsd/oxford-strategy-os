import Link from "next/link";
import { SignOutButton } from "@/components/SignOutButton";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="border-b border-black/10 dark:border-white/10">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-8">
            <Link href="/" className="text-sm font-semibold">
              Oxford Strategy OS
            </Link>
            <nav className="flex items-center gap-5 text-sm text-neutral-500">
              <Link href="/" className="hover:text-neutral-900 dark:hover:text-white">
                Dashboard
              </Link>
              <Link href="/checkin" className="hover:text-neutral-900 dark:hover:text-white">
                Check-in
              </Link>
              <Link href="/okrs" className="hover:text-neutral-900 dark:hover:text-white">
                Alineación
              </Link>
              <Link href="/lom" className="hover:text-neutral-900 dark:hover:text-white">
                LOM
              </Link>
            </nav>
          </div>
          <SignOutButton />
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-8">
        {children}
      </main>
    </div>
  );
}
