-- ============================================================
-- Los responsables dejan de ser texto y pasan a ser personas
--
-- Hasta acá `okr_trimestral.responsable` era un campo libre, y el filtro
-- "Mis Objetivos" comparaba ese texto contra
-- `usuarios_autorizados.responsable` con un igual exacto. Si en un lado
-- decía "Ayelén" y en el otro "Ayelén Bruno", el filtro devolvía vacío y
-- nadie se enteraba: no hay error, simplemente no aparece nada.
--
-- Ahora el vínculo es por id. Un OKR además puede tener varios
-- responsables: uno rinde cuentas y los demás comparten el objetivo.
--
-- Las columnas de texto NO se borran. Las leen los informes, Scout, el
-- resumen de la LOM y el mail de recordatorio. Se mantienen sincronizadas
-- con el nombre de quien rinde cuentas.
--
-- Idempotente: se pega entero en el SQL editor de Supabase.
-- ============================================================

-- ------------------------------------------------------------
-- 1. Quién rinde cuentas, por id
-- ------------------------------------------------------------
alter table okr_trimestral
  add column if not exists responsable_id uuid
    references usuarios_autorizados(id) on delete set null;

alter table okr_anual
  add column if not exists responsable_id uuid
    references usuarios_autorizados(id) on delete set null;

create index if not exists idx_okr_trimestral_responsable on okr_trimestral(responsable_id);
create index if not exists idx_okr_anual_responsable on okr_anual(responsable_id);

-- ------------------------------------------------------------
-- 2. Backfill: cruzar el texto que ya está cargado
--
-- Se prueba primero contra `responsable`, que es la columna pensada para
-- esto, y después contra `nombre`. Case-insensitive y sin espacios de
-- sobra, porque el texto lo tipeó gente.
--
-- Lo que no matchee queda en null a propósito: es exactamente la lista de
-- OKRs cuyo responsable estaba mal escrito, y conviene verla.
-- ------------------------------------------------------------
update okr_trimestral o
set responsable_id = u.id
from usuarios_autorizados u
where o.responsable_id is null
  and o.responsable is not null
  and (
    lower(trim(u.responsable)) = lower(trim(o.responsable))
    or lower(trim(u.nombre)) = lower(trim(o.responsable))
  );

update okr_anual o
set responsable_id = u.id
from usuarios_autorizados u
where o.responsable_id is null
  and o.responsable is not null
  and (
    lower(trim(u.responsable)) = lower(trim(o.responsable))
    or lower(trim(u.nombre)) = lower(trim(o.responsable))
  );

-- ------------------------------------------------------------
-- 3. okr_responsables pasa a servir a los dos niveles
--
-- La tabla se creó en 0010 para los referentes por área de los OKRs
-- colaborativos. Es la misma idea que "más de un responsable", así que se
-- generaliza en vez de crear una segunda tabla que haría lo mismo.
--
-- `area` pasa a ser opcional: solo tiene sentido en un colaborativo, donde
-- importa por qué área entra cada uno.
-- ------------------------------------------------------------
alter table okr_responsables
  add column if not exists okr_anual_id uuid
    references okr_anual(id) on delete cascade;

alter table okr_responsables
  alter column area drop not null;

alter table okr_responsables
  alter column okr_trimestral_id drop not null;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'okr_responsables_apunta_a_uno'
  ) then
    alter table okr_responsables add constraint okr_responsables_apunta_a_uno
      check (
        (okr_trimestral_id is not null and okr_anual_id is null) or
        (okr_trimestral_id is null and okr_anual_id is not null)
      );
  end if;
end $$;

create index if not exists idx_okr_responsables_anual on okr_responsables(okr_anual_id);

-- El unique de 0010 incluía `area`, que ahora puede ser null, y en SQL dos
-- null nunca son iguales: sin esto se podría cargar diez veces a la misma
-- persona en el mismo OKR.
alter table okr_responsables
  drop constraint if exists okr_responsables_okr_trimestral_id_usuario_id_area_key;

create unique index if not exists idx_okr_responsables_unico_trimestral
  on okr_responsables (okr_trimestral_id, usuario_id)
  where okr_trimestral_id is not null;

create unique index if not exists idx_okr_responsables_unico_anual
  on okr_responsables (okr_anual_id, usuario_id)
  where okr_anual_id is not null;

-- ------------------------------------------------------------
-- 4. Quien rinde cuentas no va también en la lista de co-responsables
--
-- Si estuviera en los dos lados aparecería con el avatar duplicado en cada
-- tarjeta. La lista es "los demás".
-- ------------------------------------------------------------
delete from okr_responsables r
using okr_trimestral o
where r.okr_trimestral_id = o.id and r.usuario_id = o.responsable_id;

delete from okr_responsables r
using okr_anual o
where r.okr_anual_id = o.id and r.usuario_id = o.responsable_id;

-- ------------------------------------------------------------
-- 5. Control: OKRs cuyo responsable no matcheó con ninguna persona.
--
-- Si devuelve filas, esos objetivos hoy no aparecen en "Mis Objetivos" de
-- nadie. Se arreglan eligiendo la persona desde el formulario.
-- ------------------------------------------------------------
select 'trimestral' as nivel, titulo, responsable
from okr_trimestral
where responsable_id is null and responsable is not null
union all
select 'anual', titulo, responsable
from okr_anual
where responsable_id is null and responsable is not null;
