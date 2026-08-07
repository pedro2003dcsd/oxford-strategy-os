-- ============================================================
-- El rol `lider` pasa a llamarse `equipo`
--
-- El nombre viejo describía a una persona ("líder de área"); el nuevo
-- describe un nivel de acceso, que es lo que la política de RLS necesita
-- mirar. `lectura` se conserva: hay cuentas internas que solo miran, y
-- pasarlas a `equipo` les daría escritura sobre OKRs sin que nadie lo pida.
--
-- NO se agrega todavía el rol `cliente`. Mientras las tablas sigan con la
-- política "authenticated full access", una cuenta marcada como `cliente`
-- tendría acceso total igual, y el rol daría una sensación falsa de
-- aislamiento. Se agrega junto con la reescritura de RLS, no antes.
--
-- Idempotente: se pega entero en el SQL editor de Supabase.
-- ============================================================

alter table usuarios_autorizados
  drop constraint if exists usuarios_autorizados_rol_check;

update usuarios_autorizados set rol = 'equipo' where rol = 'lider';

alter table usuarios_autorizados
  alter column rol set default 'equipo';

alter table usuarios_autorizados
  add constraint usuarios_autorizados_rol_check
  check (rol in ('direccion', 'equipo', 'lectura'));
