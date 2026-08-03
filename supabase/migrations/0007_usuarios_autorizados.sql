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
-- ------------------------------------------------------------
insert into usuarios_autorizados (email, nombre, responsable, rol)
values ('pedrogrupooxford@gmail.com', 'Pedro', 'Mateo', 'direccion')
on conflict do nothing;

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
