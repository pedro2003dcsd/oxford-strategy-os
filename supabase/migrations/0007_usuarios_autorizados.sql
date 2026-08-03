-- ============================================================
-- Lista de autorizados y perfiles
--
-- Al habilitar el login con Google, cualquier persona con una cuenta de
-- Gmail podría entrar. El equipo usa Gmail personal, así que no se puede
-- filtrar por dominio corporativo: la puerta es esta lista.
--
-- Una sola tabla hace de lista blanca y de perfil. Separarlas obligaría a
-- mantener dos filas sincronizadas por persona sin ganar nada.
-- ============================================================

create table if not exists usuarios_autorizados (
  id uuid primary key default gen_random_uuid(),
  email varchar not null,
  nombre varchar not null,
  -- Nombre tal cual figura en okr_trimestral.responsable. Es lo que permite
  -- que "Mis Objetivos" sepa qué KRs son de quien está mirando.
  responsable varchar,
  rol varchar not null default 'lider' check (rol in ('direccion', 'lider', 'lectura')),
  activo boolean not null default true,
  creado_at timestamptz not null default now()
);

-- El mail se compara siempre en minúsculas: Google puede devolver el
-- capitalizado distinto de como se cargó a mano.
create unique index if not exists idx_usuarios_autorizados_email
  on usuarios_autorizados (lower(email));

-- ------------------------------------------------------------
-- Semilla: sin esto, la primera persona que entre queda afuera y nadie
-- puede agregar a nadie. Es el candado que se cierra con la llave adentro.
--
-- No se escribe ningún mail a mano: se autorizan las cuentas que ya
-- existen. Así nadie que hoy entra puede quedar afuera mañana, sin importar
-- con qué dirección se haya creado la cuenta.
-- ------------------------------------------------------------
insert into usuarios_autorizados (email, nombre, rol)
select
  u.email,
  initcap(replace(split_part(u.email, '@', 1), '.', ' ')),
  'lider'
from auth.users u
where u.email is not null
on conflict do nothing;

-- Y la cuenta más antigua queda como Dirección, para que haya alguien que
-- pueda administrar la lista. Solo si todavía no hay ninguna.
update usuarios_autorizados
set rol = 'direccion'
where id = (
  select ua.id
  from usuarios_autorizados ua
  join auth.users u on lower(u.email) = lower(ua.email)
  order by u.created_at
  limit 1
)
and not exists (
  select 1 from usuarios_autorizados where rol = 'direccion' and activo
);

-- ------------------------------------------------------------
-- Funciones de apoyo
-- ------------------------------------------------------------
-- SECURITY DEFINER a propósito: si consultaran la tabla con RLS puesta, la
-- política que las usa se llamaría a sí misma y entraría en recursión.
create or replace function esta_autorizado()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from usuarios_autorizados
    where lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
      and activo
  );
$$;

create or replace function es_direccion()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from usuarios_autorizados
    where lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
      and rol = 'direccion'
      and activo
  );
$$;

grant execute on function esta_autorizado() to authenticated;
grant execute on function es_direccion() to authenticated;

-- ------------------------------------------------------------
-- RLS: todos los autenticados leen la lista (la app necesita saber quién es
-- quién), pero solo Dirección la modifica. Sin esto, cualquiera con acceso
-- podría agregarse un cómplice.
-- ------------------------------------------------------------
alter table usuarios_autorizados enable row level security;

drop policy if exists "lectura autenticada" on usuarios_autorizados;
create policy "lectura autenticada" on usuarios_autorizados
  for select using (auth.role() = 'authenticated');

drop policy if exists "solo direccion administra" on usuarios_autorizados;
create policy "solo direccion administra" on usuarios_autorizados
  for all using (es_direccion()) with check (es_direccion());

grant select, insert, update, delete on usuarios_autorizados to authenticated;
