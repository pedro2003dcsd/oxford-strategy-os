import { logout } from "@/app/actions";

export function SignOutButton() {
  return (
    <form action={logout}>
      <button
        type="submit"
        className="text-sm text-neutral-500 transition hover:text-neutral-900 dark:hover:text-white"
      >
        Cerrar sesión
      </button>
    </form>
  );
}
