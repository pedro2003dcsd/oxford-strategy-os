import { logout } from "@/app/actions";

export function SignOutButton() {
  return (
    <form action={logout}>
      <button
        type="submit"
        className="text-sm text-tenue transition hover:text-foreground"
      >
        Cerrar sesión
      </button>
    </form>
  );
}
