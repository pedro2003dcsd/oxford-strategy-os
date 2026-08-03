-- ============================================================
-- Oxford Strategy OS — datos de demo Q3 2026 (Grupo Oxford)
--
-- Este archivo es idempotente: borra el set anterior y lo vuelve a
-- cargar completo. Se usa para dos cosas:
--   1. En local, `npx supabase db reset` lo corre solo.
--   2. En la nube, pegar este contenido en el SQL editor de Supabase.
--
-- ⚠ BORRA todo el árbol estratégico existente (pilares, OKRs, KRs,
--   check-ins, compromisos LOM y proyectos SOLOP). No toca usuarios.
-- ============================================================

begin;

delete from proyectos_solop;
delete from compromisos_lom;
delete from check_ins;
delete from hitos_kr;
delete from key_results;
delete from okr_trimestral;
delete from okr_anual;
delete from pilares;

-- ------------------------------------------------------------
-- 1. Pilares estratégicos 2026
-- ------------------------------------------------------------
insert into pilares (nombre, descripcion, anio) values
  ('Rentabilidad Interna y Excelencia Operativa',
   'Costeo eficiente, control de horas por POD y disciplina de costos fijos.', 2026),
  ('Experiencia del Cliente y Posicionamiento de Marca',
   'NPS, estandarización de entregas y retención de Clientes Estrella.', 2026),
  ('Rediseño Organizacional y Adopción de IA',
   'Agilidad por PODs/Células, mindset data-driven y adopción de IA generativa.', 2026);

do $$
declare
  pilar_rentabilidad uuid;
  pilar_cliente uuid;
  okr_facturacion uuid;
  okr_nps uuid;
  ot uuid;
  kr uuid;
  kr_batistella uuid;
begin
  select id into pilar_rentabilidad from pilares
    where nombre = 'Rentabilidad Interna y Excelencia Operativa';
  select id into pilar_cliente from pilares
    where nombre = 'Experiencia del Cliente y Posicionamiento de Marca';

  -- ----------------------------------------------------------
  -- 2. OKRs anuales
  -- ----------------------------------------------------------
  insert into okr_anual (pilar_id, titulo, objetivo, responsable)
  values (
    pilar_rentabilidad,
    'Alcanzar $800M en facturación ejecutada manteniendo un margen de utilidad bruta promedio del 68%',
    'Facturación ejecutada (no vendida) de $800M en 2026, con margen de utilidad bruta promedio del 68% sobre el total de la cartera.',
    'Mateo'
  ) returning id into okr_facturacion;

  insert into okr_anual (pilar_id, titulo, objetivo, responsable)
  values (
    pilar_cliente,
    'Lograr un NPS promedio > 70 en los Clientes Estrella de la agencia',
    'Medición trimestral de NPS sobre la cartera de Clientes Estrella (integrales de fee mensual).',
    'Mateo'
  ) returning id into okr_nps;

  -- ----------------------------------------------------------
  -- 3. Comercial / Clientes — Cristóbal Dávalos
  -- ----------------------------------------------------------
  insert into okr_trimestral (okr_anual_id, area, titulo, trimestre, anio, responsable)
  values (okr_facturacion, 'Comercial / Clientes',
          'Acelerar la captación de Clientes Estrella de Fee Mensual',
          'Q3', 2026, 'Cristóbal Dávalos')
  returning id into ot;

  insert into key_results (okr_trimestral_id, titulo, tipo_medicion,
    valor_inicial, valor_meta, valor_actual, estado_semaforo)
  values (ot, 'Cerrar 3 nuevos contratos integrales de Fee mensual',
          'numerico', 0, 3, 0, 'rojo')
  returning id into kr;

  insert into check_ins (kr_id, usuario, valor_registrado, estado_semaforo, comentario_bloqueos, creado_at) values
    (kr, 'Cristóbal Dávalos', 0, 'rojo', 'Arranque de trimestre, pipeline en armado.', now() - interval '28 days'),
    (kr, 'Cristóbal Dávalos', 1, 'amarillo', 'Primer contrato firmado: Ueno 2026.', now() - interval '21 days'),
    (kr, 'Cristóbal Dávalos', 1, 'amarillo', null, now() - interval '14 days'),
    (kr, 'Cristóbal Dávalos', 2, 'verde', null, now() - interval '7 days'),
    (kr, 'Cristóbal Dávalos', 2, 'verde', 'Tercer contrato en revisión legal, cierre previsto para agosto.', now() - interval '2 days');

  insert into key_results (okr_trimestral_id, titulo, tipo_medicion,
    valor_inicial, valor_meta, valor_actual, estado_semaforo)
  values (ot, 'Incrementar la facturación de servicios Ad-Hoc en $150M',
          'moneda', 0, 150000000, 0, 'rojo')
  returning id into kr;

  insert into check_ins (kr_id, usuario, valor_registrado, estado_semaforo, comentario_bloqueos, creado_at) values
    (kr, 'Cristóbal Dávalos', 20000000, 'rojo', 'Ad-Hoc arranca lento, foco puesto en fee mensual.', now() - interval '28 days'),
    (kr, 'Cristóbal Dávalos', 45000000, 'amarillo', null, now() - interval '21 days'),
    (kr, 'Cristóbal Dávalos', 62000000, 'amarillo', null, now() - interval '14 days'),
    (kr, 'Cristóbal Dávalos', 80000000, 'verde', null, now() - interval '7 days'),
    (kr, 'Cristóbal Dávalos', 95000000, 'verde', 'Buen ritmo, traccionado por Batistella y Ueno.', now() - interval '2 days');

  -- ----------------------------------------------------------
  -- 4. Digital — Ayelén Bruno
  -- ----------------------------------------------------------
  insert into okr_trimestral (okr_anual_id, area, titulo, trimestre, anio, responsable)
  values (okr_facturacion, 'Digital',
          'Optimizar la conversión y rendimiento de campañas digitales clave',
          'Q3', 2026, 'Ayelén Bruno')
  returning id into ot;

  insert into key_results (okr_trimestral_id, titulo, tipo_medicion,
    valor_inicial, valor_meta, valor_actual, estado_semaforo,
    cliente_asociado, margen_utilidad_esperado, margen_actual_pct, margen_actualizado_at)
  values (ot, 'Alcanzar $12M de retorno en ventas para el cliente Batistella (Bati Off)',
          'moneda', 0, 12000000, 0, 'rojo',
          'Batistella', 65.0, 54.0, now() - interval '2 days')
  returning id into kr_batistella;

  insert into check_ins (kr_id, usuario, valor_registrado, estado_semaforo, comentario_bloqueos, creado_at) values
    (kr_batistella, 'Ayelén Bruno', 1500000, 'rojo', 'Campaña recién lanzada, learning phase.', now() - interval '28 days'),
    (kr_batistella, 'Ayelén Bruno', 3200000, 'amarillo', null, now() - interval '21 days'),
    (kr_batistella, 'Ayelén Bruno', 5000000, 'amarillo', 'Rendimiento por debajo de lo proyectado en formatos verticales.', now() - interval '14 days'),
    (kr_batistella, 'Ayelén Bruno', 6400000, 'amarillo', null, now() - interval '7 days'),
    (kr_batistella, 'Ayelén Bruno', 7500000, 'amarillo',
     'El equipo de Arte viene demorado con los adaptados de video en formato vertical para Meta Ads. Si no se entregan esta semana, la pauta pierde rendimiento.',
     now() - interval '2 days');

  -- ----------------------------------------------------------
  -- 5. Arte / Diseño — Matías Merlo
  -- ----------------------------------------------------------
  insert into okr_trimestral (okr_anual_id, area, titulo, trimestre, anio, responsable)
  values (okr_nps, 'Arte / Diseño',
          'Estandarizar entregas creativas para cuentas principales',
          'Q3', 2026, 'Matías Merlo')
  returning id into ot;

  insert into key_results (okr_trimestral_id, titulo, tipo_medicion,
    valor_inicial, valor_meta, valor_actual, estado_semaforo)
  values (ot, 'Entregar el 100% de los kits audiovisuales y creativos de campaña a tiempo',
          'porcentaje', 0, 100, 0, 'rojo')
  returning id into kr;

  insert into check_ins (kr_id, usuario, valor_registrado, estado_semaforo, comentario_bloqueos, creado_at) values
    (kr, 'Matías Merlo', 20, 'rojo', 'Sin proceso estandarizado todavía.', now() - interval '28 days'),
    (kr, 'Matías Merlo', 35, 'rojo', 'Se definió el checklist de entrega por campaña.', now() - interval '21 days'),
    (kr, 'Matías Merlo', 45, 'amarillo', null, now() - interval '14 days'),
    (kr, 'Matías Merlo', 55, 'amarillo', null, now() - interval '7 days'),
    (kr, 'Matías Merlo', 60, 'rojo',
     'Sobrecarga de pedidos Ad-Hoc. Necesitamos reasignar prioridad para Batistella y Ueno antes del martes.',
     now() - interval '2 days');

  -- ----------------------------------------------------------
  -- 6. Planificación y Operaciones — Laura Bonetto
  -- ----------------------------------------------------------
  insert into okr_trimestral (okr_anual_id, area, titulo, trimestre, anio, responsable)
  values (okr_facturacion, 'Planificación y Operaciones',
          'Garantizar la eficiencia de horas y rentabilidad por proyecto',
          'Q3', 2026, 'Laura Bonetto')
  returning id into ot;

  insert into key_results (okr_trimestral_id, titulo, tipo_medicion,
    valor_inicial, valor_meta, valor_actual, estado_semaforo)
  values (ot, 'Implementar el módulo de control de horas en SOLOP en el 100% de los PODs',
          'hitos', 0, 3, 0, 'amarillo')
  returning id into kr;

  insert into hitos_kr (kr_id, titulo, cumplido, orden) values
    (kr, 'Carga de plantilla de tarifas', true, 1),
    (kr, 'Capacidad de horas por POD asignada', true, 2),
    (kr, 'Auditoría quincenal de desvíos', false, 3);

  insert into check_ins (kr_id, usuario, valor_registrado, estado_semaforo, comentario_bloqueos, creado_at) values
    (kr, 'Laura Bonetto', 0, 'amarillo', 'Relevamiento de tarifas por POD en curso.', now() - interval '21 days'),
    (kr, 'Laura Bonetto', 1, 'amarillo', null, now() - interval '14 days'),
    (kr, 'Laura Bonetto', 2, 'verde', null, now() - interval '7 days'),
    (kr, 'Laura Bonetto', 2, 'verde', 'Falta la auditoría quincenal de desvíos, prevista para la semana próxima.', now() - interval '2 days');

  -- ----------------------------------------------------------
  -- 7. Administración y Finanzas — Dolores García Díaz
  -- ----------------------------------------------------------
  insert into okr_trimestral (okr_anual_id, area, titulo, trimestre, anio, responsable)
  values (okr_facturacion, 'Administración y Finanzas',
          'Control de costos fijos y cobranzas quincenales',
          'Q3', 2026, 'Dolores García Díaz')
  returning id into ot;

  insert into key_results (okr_trimestral_id, titulo, tipo_medicion,
    valor_inicial, valor_meta, valor_actual, estado_semaforo)
  values (ot, 'Reducir el plazo medio de cobro a clientes de 45 a 25 días',
          'numerico', 45, 25, 45, 'rojo')
  returning id into kr;

  -- Sin check-in de los últimos 7 días: aparece como pendiente en el inbox
  -- de Check-in Express y en la agenda de la LOM.
  insert into check_ins (kr_id, usuario, valor_registrado, estado_semaforo, comentario_bloqueos, creado_at) values
    (kr, 'Dolores García Díaz', 45, 'rojo', 'Sin cambios respecto del cierre de Q2.', now() - interval '24 days'),
    (kr, 'Dolores García Díaz', 40, 'amarillo', 'Se depuró la cartera de deudores viejos.', now() - interval '17 days'),
    (kr, 'Dolores García Díaz', 30, 'verde', 'Se implementó el recordatorio automático de vencimientos.', now() - interval '10 days');

  -- ----------------------------------------------------------
  -- 8. Equipo Consciente / Cultura — Mariana García Díaz
  -- ----------------------------------------------------------
  insert into okr_trimestral (area, titulo, trimestre, anio, responsable)
  values ('Equipo Consciente / Cultura',
          'Fomentar el bienestar y la adopción de IA en los PODs',
          'Q3', 2026, 'Mariana García Díaz')
  returning id into ot;

  insert into key_results (okr_trimestral_id, titulo, tipo_medicion,
    valor_inicial, valor_meta, valor_actual, estado_semaforo)
  values (ot, '100% del equipo capacitado en herramientas de IA generativa',
          'porcentaje', 0, 100, 0, 'rojo')
  returning id into kr;

  insert into check_ins (kr_id, usuario, valor_registrado, estado_semaforo, comentario_bloqueos, creado_at) values
    (kr, 'Mariana García Díaz', 25, 'amarillo', 'Primer taller dictado para Comercial y Digital.', now() - interval '24 days'),
    (kr, 'Mariana García Díaz', 50, 'verde', null, now() - interval '17 days'),
    (kr, 'Mariana García Díaz', 80, 'verde', 'Falta el módulo de práctica con casos reales para el POD de Arte.', now() - interval '10 days');

  -- ----------------------------------------------------------
  -- 9. Torre de Control SOLOP
  -- ----------------------------------------------------------
  -- Batistella: margen real 54% sobre facturación de $12M (costo $5.52M).
  -- 88 de 100 horas consumidas -> dispara la advertencia de consumo de horas.
  insert into proyectos_solop (cliente, tipo_contrato, kr_id,
    horas_presupuestadas, horas_consumidas, facturacion_total, costo_operativo)
  values ('Batistella (Bati Off)', 'Fee', kr_batistella, 100, 88, 12000000, 5520000);

  -- Ueno 2026: margen real 72% sobre facturación de $18M (costo $5.04M).
  insert into proyectos_solop (cliente, tipo_contrato,
    horas_presupuestadas, horas_consumidas, facturacion_total, costo_operativo)
  values ('Ueno 2026', 'Fee', 150, 60, 18000000, 5040000);

  -- ----------------------------------------------------------
  -- 10. Iniciativas: el trabajo concreto detrás de cada KR
  -- ----------------------------------------------------------
  insert into iniciativas (kr_id, titulo, responsable, estado, fecha_limite, orden)
  values
    (kr_batistella, 'Adaptar los 6 videos de campaña a formato vertical 9:16',
     'Matías Merlo', 'bloqueado', current_date - 3, 1),
    (kr_batistella, 'Reconfigurar públicos de retargeting en Meta Ads',
     'Ayelén Bruno', 'completado', current_date - 8, 2),
    (kr_batistella, 'Test A/B de creatividades en carrusel',
     'Ayelén Bruno', 'en_curso', current_date + 5, 3),
    (kr_batistella, 'Informe quincenal de ROAS para el cliente',
     'Ayelén Bruno', 'pendiente', current_date + 10, 4);

  select id into kr from key_results
    where titulo = 'Entregar el 100% de los kits audiovisuales y creativos de campaña a tiempo';
  insert into iniciativas (kr_id, titulo, responsable, estado, fecha_limite, orden)
  values
    (kr, 'Checklist de entrega por campaña', 'Matías Merlo', 'completado', current_date - 12, 1),
    (kr, 'Plantillas maestras en Figma para kits de campaña', 'Matías Merlo', 'en_curso', current_date + 7, 2),
    (kr, 'Priorizar la cola de pedidos Ad-Hoc con Planificación',
     'Laura Bonetto', 'bloqueado', current_date - 1, 3);

  select id into kr from key_results
    where titulo = 'Cerrar 3 nuevos contratos integrales de Fee mensual';
  insert into iniciativas (kr_id, titulo, responsable, estado, fecha_limite, orden)
  values
    (kr, 'Cierre legal del contrato Ueno 2026', 'Cristóbal Dávalos', 'completado', current_date - 20, 1),
    (kr, 'Propuesta integral para el tercer prospecto', 'Cristóbal Dávalos', 'en_curso', current_date + 12, 2);

  select id into kr from key_results
    where titulo = 'Implementar el módulo de control de horas en SOLOP en el 100% de los PODs';
  insert into iniciativas (kr_id, titulo, responsable, estado, fecha_limite, orden)
  values
    (kr, 'Cargar la plantilla de tarifas por rol', 'Laura Bonetto', 'completado', current_date - 18, 1),
    (kr, 'Asignar capacidad de horas por POD', 'Laura Bonetto', 'completado', current_date - 9, 2),
    (kr, 'Definir la auditoría quincenal de desvíos', 'Laura Bonetto', 'pendiente', current_date + 14, 3);

  select id into kr from key_results
    where titulo = '100% del equipo capacitado en herramientas de IA generativa';
  insert into iniciativas (kr_id, titulo, responsable, estado, fecha_limite, orden)
  values
    (kr, 'Taller de IA generativa para Comercial y Digital', 'Mariana García Díaz', 'completado', current_date - 22, 1),
    (kr, 'Módulo de práctica con casos reales para el POD de Arte', 'Mariana García Díaz', 'en_curso', current_date + 9, 2);

  select id into kr from key_results
    where titulo = 'Reducir el plazo medio de cobro a clientes de 45 a 25 días';
  insert into iniciativas (kr_id, titulo, responsable, estado, fecha_limite, orden)
  values
    (kr, 'Recordatorio automático de vencimientos', 'Dolores García Díaz', 'completado', current_date - 11, 1),
    (kr, 'Revisión quincenal de cartera con Dirección', 'Dolores García Díaz', 'pendiente', current_date + 6, 2);

  -- ----------------------------------------------------------
  -- 11. Compromisos de la LOM pasada
  -- ----------------------------------------------------------
  -- Anotados hace más de una semana: son los que la reunión de hoy tiene que
  -- revisar en el bloque "Compromisos de la LOM pasada".
  select id into kr from key_results
    where titulo = 'Entregar el 100% de los kits audiovisuales y creativos de campaña a tiempo';
  insert into compromisos_lom (kr_id, descripcion, responsable, fecha_limite, cumplido, creado_at)
  values
    (kr, 'Definir con Planificación la prioridad de los pedidos Ad-Hoc',
     'Laura Bonetto', current_date - 2, false, now() - interval '9 days'),
    (kr, 'Presentar las plantillas maestras de Figma al equipo',
     'Matías Merlo', current_date + 4, true, now() - interval '9 days');

  insert into compromisos_lom (kr_id, descripcion, responsable, fecha_limite, cumplido, creado_at)
  values
    (kr_batistella, 'Entregar los adaptados verticales para Meta Ads',
     'Matías Merlo', current_date - 1, false, now() - interval '8 days'),
    (kr_batistella, 'Revisar el scope de Batistella con el líder de cuenta',
     'Cristóbal Dávalos', current_date + 3, false, now() - interval '8 days');
end $$;

commit;
