-- Datos base reales (los 3 pilares 2026 de Grupo Oxford)
insert into pilares (nombre, descripcion, anio) values
  ('Rentabilidad Interna', 'Costeo eficiente, control de horas y costos fijos.', 2026),
  ('Experiencia del Cliente', 'NPS, estandarización de servicios y retención.', 2026),
  ('Rediseñar la Organización', 'Adopción de IA, agilidad por PODs/Células y mindset data-driven.', 2026);

-- ============================================================
-- Datos de ejemplo (DEMO) para probar la app en local.
-- Reemplazar/borrar cuando se carguen los OKRs reales del equipo.
-- ============================================================
do $$
declare
  pilar_rentabilidad uuid;
  okr_anual_id uuid;
  okr_trim_id uuid;
  kr_id uuid;
begin
  select id into pilar_rentabilidad from pilares where nombre = 'Rentabilidad Interna';

  insert into okr_anual (pilar_id, titulo, objetivo, responsable)
  values (pilar_rentabilidad, '[DEMO] Alcanzar la Estrella Polar', '20 clientes activos con UB/Venta > 65%.', 'Mateo')
  returning id into okr_anual_id;

  insert into okr_trimestral (okr_anual_id, area, titulo, trimestre, anio, responsable)
  values (okr_anual_id, 'Comercial / Clientes', '[DEMO] Subir UB/Venta de cuentas top', 'Q3', 2026, 'Cristóbal')
  returning id into okr_trim_id;

  insert into key_results (okr_trimestral_id, titulo, tipo_medicion, valor_inicial, valor_meta, valor_actual, estado_semaforo, cliente_asociado, margen_utilidad_esperado, margen_actual_pct)
  values (okr_trim_id, '[DEMO] UB/Venta cliente Acme sobre 65%', 'porcentaje', 58, 65, 66, 'verde', 'Acme', 65.0, 61.5)
  returning id into kr_id;

  insert into check_ins (kr_id, usuario, valor_registrado, estado_semaforo, comentario_bloqueos, creado_at)
  values
    (kr_id, 'Cristóbal', 58, 'rojo', 'Arranque de trimestre, sin ajustes aún.', now() - interval '21 days'),
    (kr_id, 'Cristóbal', 61, 'amarillo', 'Renegociando scope con el cliente.', now() - interval '14 days'),
    (kr_id, 'Cristóbal', 64, 'amarillo', 'Casi en meta, cerrando alcance.', now() - interval '7 days'),
    (kr_id, 'Cristóbal', 66, 'verde', 'Meta alcanzada, ajustar margen real en SOLOP.', now());

  insert into key_results (okr_trimestral_id, titulo, tipo_medicion, valor_inicial, valor_meta, valor_actual, estado_semaforo, margen_utilidad_esperado)
  values (okr_trim_id, '[DEMO] Implementar dashboard de horas por proyecto', 'hitos', 0, 1, 0, 'amarillo', 65.0)
  returning id into kr_id;

  insert into hitos_kr (kr_id, titulo, cumplido, orden) values
    (kr_id, 'Definir estructura de datos en SOLOP', true, 1),
    (kr_id, 'Armar dashboard en herramienta de BI', false, 2),
    (kr_id, 'Capacitar a líderes de área', false, 3);
end $$;
