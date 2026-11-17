-- ============================================================
-- Autor real de cada check-in, y corrección del último
--
-- Pedido de Mariana: quien cargó el check-in más reciente de un KR tiene que
-- poder editarlo o borrarlo, y nadie más. Si otra persona carga uno después,
-- el anterior deja de ser editable.
--
-- Hasta acá no se podía, por dos motivos:
--
--   1. `check_ins.usuario` es texto y lo manda el navegador: en la ficha del
--      KR se tipea a mano y en Check-in Express es el responsable del filtro
--      o del objetivo. Dice a nombre de quién se cargó, no quién lo cargó.
--      No sirve para dar permisos. Se conserva tal cual, porque lo leen la
--      LOM, los informes y Scout.
--   2. El KR solo se sincronizaba al insertar. Editar o borrar un check-in
--      dejaba el avance y el semáforo del KR apuntando a un dato viejo.
--
-- Decisiones que se reflejan acá:
--
--   - El autor es `autor_id` y lo estampa la base desde la sesión. Lo que
--     mande el cliente se ignora.
--   - Los check-ins anteriores a esta migración quedan con `autor_id` nulo y
--     por lo tanto no los puede corregir nadie. No se atribuyen por
--     coincidencia de nombre, y no hay excepción para Dirección.
--   - Cada check-in guarda el avance y el semáforo que tenía el KR justo
--     antes de esa carga. Es lo que se restaura al borrar el único check-in
--     de un KR. Si ese dato falta, el borrado se rechaza: no se inventa un
--     valor.
--   - Editar y borrar pasan por dos funciones que, en una sola transacción,
--     bloquean el KR, verifican autor y "sigue siendo el último", aplican el
--     cambio y dejan el KR consistente. La carga toma el mismo bloqueo, así
--     que una carga nueva y una corrección nunca se pisan: gana el orden en
--     que entran, y la corrección que llega tarde se rechaza.
--   - Fuera de esas dos funciones ya no se puede modificar ni borrar un
--     check-in: se retiran las políticas y los permisos directos.
--   - Los KR de hitos quedan afuera: el check-in tilda los hitos en la lista
--     y eso no se deshace.
--   - Al editar, el comentario que ya tenía el check-in se conserva salvo que
--     se mande otro. Y si el semáforo queda en amarillo o rojo tiene que
--     haber una explicación: sin ella la edición se rechaza.
--   - El avance tiene que ser un número finito, al cargar y al editar.
--     `numeric` acepta NaN e Infinity, y uno de esos en un check-in pasaría
--     derecho al avance del KR.
--
-- No toca datos existentes. Es compatible con el código desplegado: las
-- columnas nuevas son opcionales y la app actual no modifica ni borra
-- check-ins.
-- ============================================================

alter table check_ins
  add column if not exists autor_id uuid
    references usuarios_autorizados(id) on delete set null,
  add column if not exists valor_previo numeric,
  add column if not exists semaforo_previo varchar
    check (semaforo_previo in ('verde', 'amarillo', 'rojo')),
  add column if not exists editado_at timestamptz;

-- ------------------------------------------------------------
-- Quién está usando la app, como fila de usuarios_autorizados.
--
-- SECURITY DEFINER por el mismo motivo que puede_escribir(): se usa desde
-- funciones que no deben depender de la RLS de la tabla que consultan.
-- ------------------------------------------------------------
create or replace function usuario_actual_id()
returns uuid
language sql
security definer
stable
set search_path = public
as $$
  select id from usuarios_autorizados
  where lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
    and activo
  limit 1;
$$;

grant execute on function usuario_actual_id() to authenticated;

-- ------------------------------------------------------------
-- Un avance sirve si es un número de verdad: ni nulo, ni NaN, ni infinito.
--
-- Se compara como texto para no depender de la versión de Postgres: el
-- literal 'Infinity'::numeric recién existe desde la 14.
-- ------------------------------------------------------------
create or replace function avance_finito(p_valor numeric)
returns boolean
language sql
immutable
as $$
  select p_valor is not null
    and p_valor::text not in ('NaN', 'Infinity', '-Infinity');
$$;

-- ------------------------------------------------------------
-- Antes de insertar un check-in.
--
-- Rechaza un avance que no sea un número finito. Después toma el bloqueo
-- del KR: es el mismo que toman editar_check_in y borrar_check_in, y es lo
-- que coordina la carga con la corrección.
--
-- Con el bloqueo tomado:
--   - guarda el estado que tiene el KR en este momento (el "previo");
--   - estampa el autor desde la sesión;
--   - en sesiones de la app fija la fecha con el reloj del servidor, después
--     del bloqueo. Así "el último por fecha" coincide siempre con "el último
--     que entró", y nadie puede fechar un check-in hacia adelante para que
--     quede como último. Las cargas por SQL (seed, scripts) conservan la
--     fecha que traigan.
-- ------------------------------------------------------------
create or replace function preparar_check_in()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_valor numeric;
  v_semaforo varchar;
begin
  if not avance_finito(new.valor_registrado) then
    raise exception 'checkin_valor_invalido';
  end if;

  select valor_actual, estado_semaforo
    into v_valor, v_semaforo
  from key_results
  where id = new.kr_id
  for update;

  new.valor_previo := v_valor;
  new.semaforo_previo := v_semaforo;
  new.autor_id := usuario_actual_id();
  new.editado_at := null;

  if auth.role() = 'authenticated' then
    new.creado_at := clock_timestamp();
  end if;

  return new;
end;
$$;

drop trigger if exists trg_preparar_check_in on check_ins;
create trigger trg_preparar_check_in
before insert on check_ins
for each row execute function preparar_check_in();

-- ------------------------------------------------------------
-- Validación compartida por editar y borrar.
--
-- Bloquea el KR y devuelve el check-in solo si quien llama puede escribir,
-- es su autor y sigue siendo el último de ese KR. Los mensajes son códigos:
-- la app los traduce a un texto para la persona.
-- ------------------------------------------------------------
create or replace function check_in_corregible(p_check_in uuid)
returns check_ins
language plpgsql
security definer
set search_path = public
as $$
declare
  v_usuario uuid;
  v_kr uuid;
  v_tipo varchar;
  v_ultimo check_ins;
begin
  v_usuario := usuario_actual_id();
  if v_usuario is null or not puede_escribir() then
    raise exception 'checkin_sin_permiso';
  end if;

  select kr_id into v_kr from check_ins where id = p_check_in;
  if v_kr is null then
    raise exception 'checkin_no_existe';
  end if;

  -- El bloqueo va antes de mirar cuál es el último: si alguien está
  -- cargando un check-in nuevo en este KR, se espera a que termine y recién
  -- ahí se decide.
  select tipo_medicion into v_tipo
  from key_results
  where id = v_kr
  for update;

  if v_tipo = 'hitos' then
    raise exception 'checkin_kr_de_hitos';
  end if;

  select * into v_ultimo
  from check_ins
  where kr_id = v_kr
  order by creado_at desc, id desc
  limit 1;

  if v_ultimo.id is null or v_ultimo.id <> p_check_in then
    raise exception 'checkin_no_es_ultimo';
  end if;

  if v_ultimo.autor_id is distinct from v_usuario then
    raise exception 'checkin_no_es_autor';
  end if;

  return v_ultimo;
end;
$$;

revoke execute on function check_in_corregible(uuid) from public, anon, authenticated;

-- ------------------------------------------------------------
-- Editar el último check-in. El KR toma los valores corregidos.
--
-- El comentario: si p_comentario viene nulo se conserva el que ya tenía el
-- check-in; si viene un texto, lo reemplaza (un texto vacío lo borra). Con
-- el semáforo en amarillo o rojo tiene que quedar una explicación, sea la
-- que ya estaba o la nueva.
--
-- Todas las validaciones corren antes de escribir: una edición rechazada no
-- toca ni el check-in ni el KR.
-- ------------------------------------------------------------
create or replace function editar_check_in(
  p_check_in uuid,
  p_valor numeric,
  p_estado varchar,
  p_comentario text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_check_in check_ins;
  v_comentario text;
begin
  if not avance_finito(p_valor) then
    raise exception 'checkin_valor_invalido';
  end if;
  if p_estado is null or p_estado not in ('verde', 'amarillo', 'rojo') then
    raise exception 'checkin_semaforo_invalido';
  end if;

  v_check_in := check_in_corregible(p_check_in);

  v_comentario := nullif(btrim(coalesce(p_comentario, v_check_in.comentario_bloqueos, '')), '');
  if p_estado in ('amarillo', 'rojo') and v_comentario is null then
    raise exception 'checkin_falta_explicacion';
  end if;

  update check_ins
  set valor_registrado = p_valor,
      estado_semaforo = p_estado,
      comentario_bloqueos = v_comentario,
      editado_at = now()
  where id = v_check_in.id;

  update key_results
  set valor_actual = p_valor,
      estado_semaforo = p_estado,
      updated_at = now()
  where id = v_check_in.kr_id;
end;
$$;

-- ------------------------------------------------------------
-- Borrar el último check-in. El KR vuelve al check-in anterior; si no hay,
-- al estado que quedó guardado justo antes de esa carga. Sin ese dato no se
-- borra.
-- ------------------------------------------------------------
create or replace function borrar_check_in(p_check_in uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_check_in check_ins;
  v_anterior check_ins;
  v_valor numeric;
  v_semaforo varchar;
begin
  v_check_in := check_in_corregible(p_check_in);

  select * into v_anterior
  from check_ins
  where kr_id = v_check_in.kr_id
    and id <> v_check_in.id
  order by creado_at desc, id desc
  limit 1;

  if v_anterior.id is not null then
    v_valor := v_anterior.valor_registrado;
    v_semaforo := v_anterior.estado_semaforo;
  else
    v_valor := v_check_in.valor_previo;
    v_semaforo := v_check_in.semaforo_previo;
  end if;

  if v_valor is null or v_semaforo is null then
    raise exception 'checkin_sin_estado_previo';
  end if;

  delete from check_ins where id = v_check_in.id;

  update key_results
  set valor_actual = v_valor,
      estado_semaforo = v_semaforo,
      updated_at = now()
  where id = v_check_in.kr_id;
end;
$$;

revoke execute on function editar_check_in(uuid, numeric, varchar, text) from public, anon;
revoke execute on function borrar_check_in(uuid) from public, anon;
grant execute on function editar_check_in(uuid, numeric, varchar, text) to authenticated;
grant execute on function borrar_check_in(uuid) to authenticated;

-- ------------------------------------------------------------
-- Cerrar la modificación y el borrado directos.
--
-- 0015 dejaba que cualquier cuenta con escritura modificara o borrara
-- cualquier check-in llamando a la API. Desde ahora el único camino son las
-- dos funciones de arriba. Leer e insertar siguen como estaban. El borrado
-- en cascada al eliminar un KR no pasa por estos permisos.
-- ------------------------------------------------------------
drop policy if exists "modificacion sin rol lectura" on check_ins;
drop policy if exists "borrado sin rol lectura" on check_ins;
revoke update, delete, truncate on check_ins from authenticated, anon;
