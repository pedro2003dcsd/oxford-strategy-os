-- ============================================================
-- El rol `lectura` pasa a ser de solo lectura de verdad
--
-- Hasta acá el nombre prometía algo que la app no cumplía. El rol se
-- chequeaba en un solo lugar, la pantalla Equipo, y todas las tablas tenían
-- `authenticated full access`. Una cuenta marcada "Solo lectura" podía
-- crear, editar y borrar OKRs, check-ins, clientes, evaluaciones y actas.
--
-- Esta migración lo cierra en la base, que es la capa que no se puede
-- saltear llamando a la API directo.
--
-- Ojo con el criterio: leer queda abierto a cualquier autenticado, igual
-- que antes. Lo que se cierra es escribir. Un error acá bloquea una
-- escritura, que es el lado seguro; el fail-open de `proxy.ts` existe para
-- que un problema de infraestructura no deje al equipo sin poder mirar, y
-- eso no cambia.
--
-- Idempotente: se pega entero en el SQL editor de Supabase.
-- ============================================================

-- ------------------------------------------------------------
-- 1. Quién puede escribir
--
-- SECURITY DEFINER por el mismo motivo que esta_autorizado() y
-- es_direccion(): si leyera la tabla con RLS puesta, la política que la usa
-- se llamaría a sí misma y entraría en recursión.
-- ------------------------------------------------------------
create or replace function puede_escribir()
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
      and rol <> 'lectura'
  );
$$;

grant execute on function puede_escribir() to authenticated;

-- ------------------------------------------------------------
-- 2. Las políticas de las tablas de datos
--
-- Se reemplazan TODAS de una vez. Dejar una sola con la política vieja
-- alcanzaría para que por ahí se escriba igual, que es el mismo error que
-- hay que evitar cuando se haga el aislamiento del rol `cliente`.
--
-- usuarios_autorizados queda afuera: ya tiene las suyas desde 0007, y ahí
-- el que manda es Dirección, no "quien puede escribir".
-- ------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array[
    'pilares', 'okr_anual', 'okr_trimestral', 'key_results', 'hitos_kr',
    'check_ins', 'compromisos_lom', 'proyectos_solop', 'iniciativas',
    'informes_guardados', 'clientes', 'squad_miembros', 'metricas_cliente',
    'kata_condiciones', 'pdca_experimentos', 'evaluaciones_360',
    'okr_responsables', 'actas_directorio'
  ] loop
    -- Se borran las cuatro antes de crear ninguna. Si alguna quedara sin
    -- borrar, la segunda pasada fallaría a la mitad y la tabla quedaría con
    -- políticas de las dos versiones mezcladas.
    execute format('drop policy if exists "authenticated full access" on %I', t);
    execute format('drop policy if exists "lectura autenticada" on %I', t);
    execute format('drop policy if exists "escritura sin rol lectura" on %I', t);
    execute format('drop policy if exists "modificacion sin rol lectura" on %I', t);
    execute format('drop policy if exists "borrado sin rol lectura" on %I', t);

    execute format(
      'create policy "lectura autenticada" on %I
         for select using (auth.role() = ''authenticated'')', t);

    -- Una sola política FOR ALL con USING y WITH CHECK no sirve: FOR ALL
    -- incluye SELECT, así que el rol lectura no podría ni mirar.
    execute format(
      'create policy "escritura sin rol lectura" on %I
         for insert with check (puede_escribir())', t);
    execute format(
      'create policy "modificacion sin rol lectura" on %I
         for update using (puede_escribir()) with check (puede_escribir())', t);
    execute format(
      'create policy "borrado sin rol lectura" on %I
         for delete using (puede_escribir())', t);
  end loop;
end $$;

-- ------------------------------------------------------------
-- 3. El historial de ediciones
--
-- Tiene sus propias políticas desde 0008: se lee y se inserta, nunca se
-- edita ni se borra. Lo que cambia es que insertar ahora exige poder
-- escribir, porque un registro de auditoría lo genera una edición.
-- ------------------------------------------------------------
drop policy if exists "historial solo lectura e inserción" on okr_historial_cambios;
create policy "historial solo lectura e inserción" on okr_historial_cambios
  for select using (auth.role() = 'authenticated');

drop policy if exists "historial inserta" on okr_historial_cambios;
create policy "historial inserta" on okr_historial_cambios
  for insert with check (puede_escribir());

-- ------------------------------------------------------------
-- 4. Control: cuántas políticas quedó con cada tabla.
--
-- Tienen que ser 4 en las tablas de datos (una de lectura y tres de
-- escritura), 2 en okr_historial_cambios y 2 en usuarios_autorizados. Si
-- alguna quedó en 1, se salteó y por ahí se puede escribir igual.
-- ------------------------------------------------------------
select tablename, count(*) as politicas
from pg_policies
where schemaname = 'public'
group by tablename
order by politicas, tablename;
