import { Suspense } from "react";
import { LoginForm } from "@/components/LoginForm";

export default function LoginPage() {
  return (
    <main className="flex flex-1 items-center justify-center p-6">
      <Suspense
        fallback={
          <div className="w-full max-w-sm rounded-xl border border-linea p-8">
            <p className="text-sm text-tenue">Cargando…</p>
          </div>
        }
      >
        <LoginForm />
      </Suspense>
    </main>
  );
}
