-- ============================================================
-- Datos de Performance Clientes: las seis cuentas
--
-- Generado desde la maqueta que se borró al pasar el módulo a producción,
-- recuperada del historial de git. Son los datos que se presentaron al
-- directorio: revisalos antes de darlos por vigentes.
--
-- NO toca proyectos_solop. Las horas, la facturación y el margen son
-- registros financieros reales que carga el equipo; la maqueta tenía una
-- copia de esos números y pisarlos con datos de demo sería corromper la
-- Torre de Control. Las cuentas nuevas van a decir "sin horas cargadas"
-- hasta que alguien cargue el proyecto de verdad.
--
-- Idempotente: se puede pegar más de una vez. Cada bloque borra lo suyo
-- antes de insertar, así que corregir el script y volver a pegarlo deja el
-- estado final que dice el archivo y no una acumulación.
-- ============================================================

begin;

-- ------------------------------------------------------------
-- 1. Las seis cuentas
--
-- on conflict sobre lower(nombre): si el backfill ya las creó desde SOLOP,
-- se completan en vez de duplicarse.
-- ------------------------------------------------------------
insert into clientes (nombre, estado, fee_mensual, pod_asignado, looker_studio_url, ceremonias)
values ('Batistella (Bati Off)', 'en_riesgo', 1800000, 'POD Digital', null, array['Weekly Quincenal', 'Review Quincenal', 'Retro Mensual'])
on conflict (lower(nombre)) do update set
  estado = excluded.estado,
  fee_mensual = excluded.fee_mensual,
  pod_asignado = excluded.pod_asignado,
  looker_studio_url = excluded.looker_studio_url,
  ceremonias = excluded.ceremonias,
  actualizado_at = now();

insert into clientes (nombre, estado, fee_mensual, pod_asignado, looker_studio_url, ceremonias)
values ('Eseka (Cocot & Dufour)', 'activo', 1450000, 'POD Comercial', 'https://lookerstudio.google.com/u/0/reporting/67beab94-6566-4c66-8c26-f72d8de2314c/page/p_66o0rk0itd', array['Weekly Quincenal', 'Review Quincenal', 'Retro Bimensual'])
on conflict (lower(nombre)) do update set
  estado = excluded.estado,
  fee_mensual = excluded.fee_mensual,
  pod_asignado = excluded.pod_asignado,
  looker_studio_url = excluded.looker_studio_url,
  ceremonias = excluded.ceremonias,
  actualizado_at = now();

insert into clientes (nombre, estado, fee_mensual, pod_asignado, looker_studio_url, ceremonias)
values ('Conquistadores', 'activo', 2100000, 'POD Consultoría', null, array['Weekly Quincenal', 'Review Mensual', 'Retro Bimensual'])
on conflict (lower(nombre)) do update set
  estado = excluded.estado,
  fee_mensual = excluded.fee_mensual,
  pod_asignado = excluded.pod_asignado,
  looker_studio_url = excluded.looker_studio_url,
  ceremonias = excluded.ceremonias,
  actualizado_at = now();

insert into clientes (nombre, estado, fee_mensual, pod_asignado, looker_studio_url, ceremonias)
values ('Sipssa', 'activo', 980000, 'POD Digital', null, array['Weekly Quincenal', 'Review Quincenal', 'Retro Mensual'])
on conflict (lower(nombre)) do update set
  estado = excluded.estado,
  fee_mensual = excluded.fee_mensual,
  pod_asignado = excluded.pod_asignado,
  looker_studio_url = excluded.looker_studio_url,
  ceremonias = excluded.ceremonias,
  actualizado_at = now();

insert into clientes (nombre, estado, fee_mensual, pod_asignado, looker_studio_url, ceremonias)
values ('Blangino', 'onboarding', 1200000, 'POD Arte', null, array['Weekly Quincenal', 'Review Quincenal', 'Retro Mensual'])
on conflict (lower(nombre)) do update set
  estado = excluded.estado,
  fee_mensual = excluded.fee_mensual,
  pod_asignado = excluded.pod_asignado,
  looker_studio_url = excluded.looker_studio_url,
  ceremonias = excluded.ceremonias,
  actualizado_at = now();

insert into clientes (nombre, estado, fee_mensual, pod_asignado, looker_studio_url, ceremonias)
values ('Panther', 'en_riesgo', 760000, 'POD Digital', null, array['Weekly', 'Review Chapter', 'Retro cada 2-3 meses'])
on conflict (lower(nombre)) do update set
  estado = excluded.estado,
  fee_mensual = excluded.fee_mensual,
  pod_asignado = excluded.pod_asignado,
  looker_studio_url = excluded.looker_studio_url,
  ceremonias = excluded.ceremonias,
  actualizado_at = now();

-- ------------------------------------------------------------
-- 2. Squads
--
-- usuario_id queda en null: se completa desde la pantalla Equipo cuando la
-- persona tenga cuenta. Buena parte del squad son proveedores externos que
-- nunca la van a tener.
-- ------------------------------------------------------------
delete from squad_miembros where cliente_id = (select id from clientes where lower(nombre) = lower('Batistella (Bati Off)'));
insert into squad_miembros (cliente_id, nombre, rol_squad, especialidad)
select c.id, v.nombre, v.rol_squad, v.especialidad
from clientes c, (values
  ('Leticia', 'PO', null),
  ('Mateo', 'Chapter Lead', 'Arte'),
  ('Ayelén', 'Chapter Lead', 'Digital'),
  ('Seba', 'Chapter Lead', 'Consultoría'),
  ('Cristóbal', 'Chapter Lead', 'Cliente'),
  ('Nico', 'Ejecutor', 'Diseño'),
  ('Maca', 'Ejecutor', 'Redacción'),
  ('Pepe', 'Ejecutor', 'Animación / Motion'),
  ('Bruno', 'Ejecutor', 'Diseño'),
  ('OMG / Maribel', 'Ejecutor', 'Pauta Digital'),
  ('Celina', 'Ejecutor', 'Mailing'),
  ('Franco B.', 'Ejecutor', 'Coordinación'),
  ('Danilo / Dani T.', 'Ejecutor', 'P&S'),
  ('Laura / Gon', 'Ejecutor', 'Medios')
) as v(nombre, rol_squad, especialidad)
where lower(c.nombre) = lower('Batistella (Bati Off)');

delete from squad_miembros where cliente_id = (select id from clientes where lower(nombre) = lower('Eseka (Cocot & Dufour)'));
insert into squad_miembros (cliente_id, nombre, rol_squad, especialidad)
select c.id, v.nombre, v.rol_squad, v.especialidad
from clientes c, (values
  ('Agostina', 'PO', null),
  ('Mateo', 'Chapter Lead', 'Arte'),
  ('Ayelén', 'Chapter Lead', 'Digital'),
  ('Seba', 'Chapter Lead', 'Consultoría'),
  ('Cristóbal', 'Chapter Lead', 'Cliente'),
  ('Primo', 'Ejecutor', 'Redacción'),
  ('Meli', 'Ejecutor', 'CM / Influencers'),
  ('OMG', 'Ejecutor', 'Pauta'),
  ('Celi', 'Ejecutor', 'Mailing'),
  ('Igna', 'Ejecutor', 'Ecommerce')
) as v(nombre, rol_squad, especialidad)
where lower(c.nombre) = lower('Eseka (Cocot & Dufour)');

delete from squad_miembros where cliente_id = (select id from clientes where lower(nombre) = lower('Conquistadores'));
insert into squad_miembros (cliente_id, nombre, rol_squad, especialidad)
select c.id, v.nombre, v.rol_squad, v.especialidad
from clientes c, (values
  ('Agostina', 'PO', null),
  ('Mateo', 'Chapter Lead', 'Arte'),
  ('Anto', 'Chapter Lead', 'Cliente'),
  ('Seba', 'Chapter Lead', 'Consultoría'),
  ('Ayelén', 'Chapter Lead', 'Digital'),
  ('Eli', 'Ejecutor', 'Diseño'),
  ('Primo', 'Ejecutor', 'Redacción'),
  ('Pepe', 'Ejecutor', 'Animación'),
  ('Bruno', 'Ejecutor', 'Diseño'),
  ('Advicers', 'Ejecutor', 'Pauta'),
  ('Aldana', 'Ejecutor', 'CM'),
  ('Dani T. / Danilo', 'Ejecutor', 'P&S'),
  ('Laura', 'Ejecutor', 'Eventos / Medios')
) as v(nombre, rol_squad, especialidad)
where lower(c.nombre) = lower('Conquistadores');

delete from squad_miembros where cliente_id = (select id from clientes where lower(nombre) = lower('Sipssa'));
insert into squad_miembros (cliente_id, nombre, rol_squad, especialidad)
select c.id, v.nombre, v.rol_squad, v.especialidad
from clientes c, (values
  ('Maxi', 'PO', null),
  ('Mateo', 'Chapter Lead', 'Arte'),
  ('Ayelén', 'Chapter Lead', 'Digital'),
  ('Seba', 'Chapter Lead', 'Consultoría'),
  ('Cristóbal', 'Chapter Lead', 'Cliente'),
  ('Nico', 'Ejecutor', 'Diseño'),
  ('Maca', 'Ejecutor', 'Redacción'),
  ('Pepe', 'Ejecutor', 'Motion'),
  ('Javi', 'Ejecutor', 'Diseño'),
  ('Advicers Dani / Fran', 'Ejecutor', 'Pauta & CRM'),
  ('Dani T. / Laura', 'Ejecutor', 'P&S / BTL')
) as v(nombre, rol_squad, especialidad)
where lower(c.nombre) = lower('Sipssa');

delete from squad_miembros where cliente_id = (select id from clientes where lower(nombre) = lower('Blangino'));
insert into squad_miembros (cliente_id, nombre, rol_squad, especialidad)
select c.id, v.nombre, v.rol_squad, v.especialidad
from clientes c, (values
  ('Agostina', 'PO', null),
  ('Mateo', 'Chapter Lead', 'Arte'),
  ('Ayelén', 'Chapter Lead', 'Digital'),
  ('Seba', 'Chapter Lead', 'Consultoría'),
  ('Cristóbal', 'Chapter Lead', 'Cliente'),
  ('Eli Druetta', 'Ejecutor', 'Diseño'),
  ('Mati Mazzoni', 'Ejecutor', 'Redacción'),
  ('Pepe', 'Ejecutor', 'Animación'),
  ('Advicers', 'Ejecutor', 'Pauta'),
  ('Celina', 'Ejecutor', 'Email Mkt'),
  ('Dani T. / Danilo', 'Ejecutor', 'P&S'),
  ('Javi', 'Ejecutor', 'Diseño')
) as v(nombre, rol_squad, especialidad)
where lower(c.nombre) = lower('Blangino');

delete from squad_miembros where cliente_id = (select id from clientes where lower(nombre) = lower('Panther'));
insert into squad_miembros (cliente_id, nombre, rol_squad, especialidad)
select c.id, v.nombre, v.rol_squad, v.especialidad
from clientes c, (values
  ('Gon / Leti', 'PO', null),
  ('Mati', 'Chapter Lead', 'Arte'),
  ('Juli', 'Chapter Lead', 'Digital'),
  ('Anto', 'Chapter Lead', 'Cliente / Ej. Cuentas'),
  ('Nico', 'Ejecutor', 'Diseño'),
  ('Maca', 'Ejecutor', 'Redacción'),
  ('Pepe', 'Ejecutor', 'Animación'),
  ('Juli', 'Ejecutor', 'P&S'),
  ('OMG', 'Ejecutor', 'Pauta'),
  ('Meli', 'Ejecutor', 'CM')
) as v(nombre, rol_squad, especialidad)
where lower(c.nombre) = lower('Panther');

-- ------------------------------------------------------------
-- 3. Métricas de tres niveles
--
-- meta y valor_actual van como texto: las metas reales son rangos y
-- múltiplos ("> 7,8x", "$8.000 a $20.000"). El número comparable es el
-- progreso.
-- ------------------------------------------------------------
delete from metricas_cliente where cliente_id = (select id from clientes where lower(nombre) = lower('Batistella (Bati Off)'));
insert into metricas_cliente (cliente_id, nivel, titulo, valor_actual, meta, progreso_porcentaje, detalle)
select c.id, v.nivel, v.titulo, v.valor_actual, v.meta, v.progreso, v.detalle
from clientes c, (values
  (1, 'Tickets vendidos por mes', '24.800', '40.000', 62, 'Objetivo principal del contrato anual.'),
  (2, 'ROAS Meta Ads', '4,9x', '> 7,8x', 63, 'Cayó con el agotamiento creativo de los formatos verticales.'),
  (2, 'CPL', '$14.200', '$8.000 a $20.000', 78, 'Dentro de rango, pero en la mitad alta.'),
  (2, 'Leads calificados', '612', '900 / mes', 68, null),
  (3, 'CTR', '2,1%', '> 3%', 70, null),
  (3, 'Apertura de emailing', '31%', '> 28%', 100, null),
  (3, 'Entregables de Arte a tiempo', '60%', '100%', 60, 'Cuello de botella declarado en el check-in.')
) as v(nivel, titulo, valor_actual, meta, progreso, detalle)
where lower(c.nombre) = lower('Batistella (Bati Off)');

delete from metricas_cliente where cliente_id = (select id from clientes where lower(nombre) = lower('Eseka (Cocot & Dufour)'));
insert into metricas_cliente (cliente_id, nivel, titulo, valor_actual, meta, progreso_porcentaje, detalle)
select c.id, v.nivel, v.titulo, v.valor_actual, v.meta, v.progreso, v.detalle
from clientes c, (values
  (1, 'Facturación en locales propios', '$142M', '$180M / trimestre', 79, null),
  (2, 'Ticket promedio', '$38.500', '> $36.000', 100, null),
  (2, 'Tráfico a locales', '18.400', '22.000 / mes', 84, null),
  (2, 'Conversión en tienda', '4,2%', '> 4%', 100, null),
  (3, 'Alcance orgánico', '212K', '180K', 100, null),
  (3, 'Frecuencia de posteo', '4/sem', '5/sem', 80, null)
) as v(nivel, titulo, valor_actual, meta, progreso, detalle)
where lower(c.nombre) = lower('Eseka (Cocot & Dufour)');

delete from metricas_cliente where cliente_id = (select id from clientes where lower(nombre) = lower('Conquistadores'));
insert into metricas_cliente (cliente_id, nivel, titulo, valor_actual, meta, progreso_porcentaje, detalle)
select c.id, v.nivel, v.titulo, v.valor_actual, v.meta, v.progreso, v.detalle
from clientes c, (values
  (1, 'Clientes cerrados en el año', '31', '50 / año', 62, 'Ritmo de cierre por encima del año pasado.'),
  (2, 'Oportunidades en pipeline', '84', '> 70', 100, null),
  (2, 'Tasa de cierre', '37%', '> 40%', 92, null),
  (2, 'Costo por oportunidad', '$62.000', '< $70.000', 100, null),
  (3, 'Tiempo de respuesta a lead', '3,4 h', '< 2 h', 58, null),
  (3, 'Reuniones agendadas', '22', '25 / mes', 88, null)
) as v(nivel, titulo, valor_actual, meta, progreso, detalle)
where lower(c.nombre) = lower('Conquistadores');

delete from metricas_cliente where cliente_id = (select id from clientes where lower(nombre) = lower('Sipssa'));
insert into metricas_cliente (cliente_id, nivel, titulo, valor_actual, meta, progreso_porcentaje, detalle)
select c.id, v.nivel, v.titulo, v.valor_actual, v.meta, v.progreso, v.detalle
from clientes c, (values
  (1, 'Cotizaciones solicitadas', '310', '400 / trimestre', 78, null),
  (2, 'CPL', '$9.800', '$8.000 a $20.000', 100, null),
  (2, 'Leads calificados', '188', '220 / mes', 85, null),
  (3, 'CTR', '3,4%', '> 3%', 100, null),
  (3, 'Tiempo en landing', '1:42', '> 1:30', 100, null)
) as v(nivel, titulo, valor_actual, meta, progreso, detalle)
where lower(c.nombre) = lower('Sipssa');

delete from metricas_cliente where cliente_id = (select id from clientes where lower(nombre) = lower('Blangino'));
insert into metricas_cliente (cliente_id, nivel, titulo, valor_actual, meta, progreso_porcentaje, detalle)
select c.id, v.nivel, v.titulo, v.valor_actual, v.meta, v.progreso, v.detalle
from clientes c, (values
  (1, 'Lanzamiento de marca renovada', '2 de 6 hitos', '6 hitos', 33, 'Cuenta en onboarding: métricas de resultado todavía no aplican.'),
  (2, 'Manual de marca aprobado', 'En revisión', 'Aprobado', 60, null),
  (2, 'Piezas base entregadas', '8', '24', 33, null),
  (3, 'Rondas de corrección', '2,4', '< 3', 100, null)
) as v(nivel, titulo, valor_actual, meta, progreso, detalle)
where lower(c.nombre) = lower('Blangino');

delete from metricas_cliente where cliente_id = (select id from clientes where lower(nombre) = lower('Panther'));
insert into metricas_cliente (cliente_id, nivel, titulo, valor_actual, meta, progreso_porcentaje, detalle)
select c.id, v.nivel, v.titulo, v.valor_actual, v.meta, v.progreso, v.detalle
from clientes c, (values
  (1, 'Ventas del canal online', '$18M', '$45M / trimestre', 40, 'Cuenta con rentabilidad crítica: 118 horas sobre 90 presupuestadas.'),
  (2, 'ROAS', '2,1x', '> 5x', 42, null),
  (2, 'CPL', '$27.400', '$8.000 a $20.000', 30, null),
  (3, 'CTR', '1,4%', '> 3%', 47, null),
  (3, 'Carritos abandonados', '78%', '< 65%', 35, null)
) as v(nivel, titulo, valor_actual, meta, progreso, detalle)
where lower(c.nombre) = lower('Panther');

-- ------------------------------------------------------------
-- 4. Condiciones objetivo y experimentos PDCA
--
-- La maqueta colgaba los experimentos del cliente; el modelo los cuelga de
-- la condición objetivo, que es de donde tienen que colgar. Cada
-- experimento va a la condición de su cuenta.
-- ------------------------------------------------------------
delete from kata_condiciones where cliente_id = (select id from clientes where lower(nombre) = lower('Batistella (Bati Off)'));
insert into kata_condiciones (cliente_id, titulo, meta, progreso_porcentaje, obstaculo_actual, siguiente_paso, responsable_nombre)
select c.id, 'Recuperar el rendimiento de la pauta', 'ROAS > 7,8x', 62, 'Retraso en la entrega de kits de video vertical por parte de Arte', 'Matías entrega 6 adaptados 9:16 el jueves para relanzar la campaña', 'Ayelén Bruno'
from clientes c where lower(c.nombre) = lower('Batistella (Bati Off)');

insert into pdca_experimentos (condicion_id, hipotesis, estado, aprendizaje)
select k.id, v.hipotesis, v.estado, v.aprendizaje
from kata_condiciones k
join clientes c on c.id = k.cliente_id
, (values
  ('Si publicamos 3 cortes verticales por semana, el ROAS sube de 4,9x a 6,5x en 14 días', 'en_curso', null),
  ('Si separamos el público de retargeting por profundidad de visita, el CPL baja 15%', 'en_curso', 'El CPL bajó 9%. Sirve, pero menos de lo esperado.')
) as v(hipotesis, estado, aprendizaje)
where lower(c.nombre) = lower('Batistella (Bati Off)') and k.titulo = 'Recuperar el rendimiento de la pauta';

delete from kata_condiciones where cliente_id = (select id from clientes where lower(nombre) = lower('Panther'));
insert into kata_condiciones (cliente_id, titulo, meta, progreso_porcentaje, obstaculo_actual, siguiente_paso, responsable_nombre)
select c.id, 'Volver la cuenta a rentabilidad sana', 'Margen > 65%', 8, 'Se consumieron 118 horas sobre 90 presupuestadas sin renegociar alcance', 'Cristóbal presenta addenda de alcance al cliente antes del viernes', 'Cristóbal Dávalos'
from clientes c where lower(c.nombre) = lower('Panther');

insert into pdca_experimentos (condicion_id, hipotesis, estado, aprendizaje)
select k.id, v.hipotesis, v.estado, v.aprendizaje
from kata_condiciones k
join clientes c on c.id = k.cliente_id
, (values
  ('Si limitamos las rondas de corrección a dos, recuperamos 20 horas por mes', 'planificado', null)
) as v(hipotesis, estado, aprendizaje)
where lower(c.nombre) = lower('Panther') and k.titulo = 'Volver la cuenta a rentabilidad sana';

delete from kata_condiciones where cliente_id = (select id from clientes where lower(nombre) = lower('Conquistadores'));
insert into kata_condiciones (cliente_id, titulo, meta, progreso_porcentaje, obstaculo_actual, siguiente_paso, responsable_nombre)
select c.id, 'Acortar el tiempo de respuesta a leads', '< 2 horas', 58, 'Los leads entran por tres canales y nadie tiene la bandeja unificada', 'Probar bandeja única en HubSpot durante dos semanas', 'Sebastián'
from clientes c where lower(c.nombre) = lower('Conquistadores');

insert into pdca_experimentos (condicion_id, hipotesis, estado, aprendizaje)
select k.id, v.hipotesis, v.estado, v.aprendizaje
from kata_condiciones k
join clientes c on c.id = k.cliente_id
, (values
  ('Si asignamos un responsable de guardia por turno, el tiempo de respuesta baja a 2 h', 'en_curso', null)
) as v(hipotesis, estado, aprendizaje)
where lower(c.nombre) = lower('Conquistadores') and k.titulo = 'Acortar el tiempo de respuesta a leads';

delete from kata_condiciones where cliente_id = (select id from clientes where lower(nombre) = lower('Eseka (Cocot & Dufour)'));
insert into kata_condiciones (cliente_id, titulo, meta, progreso_porcentaje, obstaculo_actual, siguiente_paso, responsable_nombre)
select c.id, 'Sostener el tráfico a locales en temporada baja', '22.000 visitas / mes', 84, 'La campaña de geolocalización no escala más allá de Córdoba', 'Piloto de radio segmentada en dos ciudades nuevas', 'Cristóbal Dávalos'
from clientes c where lower(c.nombre) = lower('Eseka (Cocot & Dufour)');

insert into pdca_experimentos (condicion_id, hipotesis, estado, aprendizaje)
select k.id, v.hipotesis, v.estado, v.aprendizaje
from kata_condiciones k
join clientes c on c.id = k.cliente_id
, (values
  ('Si adelantamos la pauta 10 días al evento, el tráfico sube 12%', 'validado', 'Subió 14%. Se adopta como práctica estándar.')
) as v(hipotesis, estado, aprendizaje)
where lower(c.nombre) = lower('Eseka (Cocot & Dufour)') and k.titulo = 'Sostener el tráfico a locales en temporada baja';

-- ------------------------------------------------------------
-- 5. Evaluaciones 360
--
-- Período Q3 2026, que es el set con el que se presentó. Los bloques van
-- como jsonb porque la grilla cambia de trimestre a trimestre.
-- ------------------------------------------------------------
insert into evaluaciones_360 (cliente_id, periodo, notas_relacionamiento_json, notas_performance_json, notas_comerciales_json, kpis_calidad_json, tendencia_json, matriz_json)
select c.id, 'Q3 2026',
  '[{"criterio":"Tiempos de respuesta","puntaje":3},{"criterio":"Calidad del feedback","puntaje":4},{"criterio":"Claridad de los briefs","puntaje":2},{"criterio":"Entrega de información","puntaje":2}]'::jsonb,
  '[{"criterio":"Cumplimiento de pagos","puntaje":5},{"criterio":"Agilidad en aprobaciones","puntaje":2},{"criterio":"Respeto de procesos","puntaje":3}]'::jsonb,
  '[{"criterio":"Facturación en locales","puntaje":3},{"criterio":"Mix de producto","puntaje":2},{"criterio":"Base de datos","puntaje":2},{"criterio":"Performance digital","puntaje":3},{"criterio":"Presencia de marca","puntaje":4}]'::jsonb,
  '[]'::jsonb,
  '[{"mes":"Mayo","puntaje":2.9},{"mes":"Junio","puntaje":2.3},{"mes":"Julio","puntaje":2.5}]'::jsonb,
  '[]'::jsonb
from clientes c where lower(c.nombre) = lower('Batistella (Bati Off)')
on conflict (cliente_id, periodo) do update set
  notas_relacionamiento_json = excluded.notas_relacionamiento_json,
  notas_performance_json = excluded.notas_performance_json,
  notas_comerciales_json = excluded.notas_comerciales_json,
  kpis_calidad_json = excluded.kpis_calidad_json,
  tendencia_json = excluded.tendencia_json,
  matriz_json = excluded.matriz_json,
  actualizado_at = now();

insert into evaluaciones_360 (cliente_id, periodo, notas_relacionamiento_json, notas_performance_json, notas_comerciales_json, kpis_calidad_json, tendencia_json, matriz_json)
select c.id, 'Q3 2026',
  '[{"criterio":"Tiempos de respuesta","puntaje":5},{"criterio":"Calidad del feedback","puntaje":4},{"criterio":"Claridad de los briefs","puntaje":4},{"criterio":"Entrega de información","puntaje":4}]'::jsonb,
  '[{"criterio":"Cumplimiento de pagos","puntaje":5},{"criterio":"Agilidad en aprobaciones","puntaje":4},{"criterio":"Respeto de procesos","puntaje":5}]'::jsonb,
  '[{"criterio":"Facturación en locales","puntaje":4},{"criterio":"Mix de producto","puntaje":4},{"criterio":"Base de datos","puntaje":3},{"criterio":"Performance digital","puntaje":4},{"criterio":"Presencia de marca","puntaje":5}]'::jsonb,
  '[{"titulo":"Aprobación en 1ª presentación","meta":"> 70%","actual":"78%","estado":"verde","nota":"Mide re-trabajo y rebote de piezas."},{"titulo":"Consistencia de marca","meta":"> 85%","actual":"90%","estado":"verde","nota":"Evaluación semáforo sobre las piezas entregadas."},{"titulo":"CTR Meta / Google Ads","meta":"3%","actual":"3,2%","estado":"verde"}]'::jsonb,
  '[{"mes":"Marzo","puntaje":2},{"mes":"Abril","puntaje":1.5},{"mes":"Mayo","puntaje":1.9}]'::jsonb,
  '[{"titulo":"Objetivos Comerciales","fuente":"Responsabilidad del cliente","subtotal":1.9,"items":[{"criterio":"Impacto en ventas offline","puntaje":3},{"criterio":"Mix de productos de terceros","puntaje":1},{"criterio":"Crecimiento de base de datos","puntaje":2}]},{"titulo":"Performance Digital","fuente":"Responsabilidad de la agencia","subtotal":4.2,"etiqueta":"Alta Performance","items":[{"criterio":"Alcance digital","puntaje":4},{"criterio":"Crecimiento de comunidad","puntaje":5},{"criterio":"CR de e-commerce","puntaje":5}]},{"titulo":"Relacionamiento","fuente":"Cliente ↔ Agencia","subtotal":3.8,"items":[{"criterio":"Entrega de información","puntaje":4},{"criterio":"Calidad del feedback","puntaje":3},{"criterio":"Tiempos de respuesta","puntaje":3.6}]}]'::jsonb
from clientes c where lower(c.nombre) = lower('Eseka (Cocot & Dufour)')
on conflict (cliente_id, periodo) do update set
  notas_relacionamiento_json = excluded.notas_relacionamiento_json,
  notas_performance_json = excluded.notas_performance_json,
  notas_comerciales_json = excluded.notas_comerciales_json,
  kpis_calidad_json = excluded.kpis_calidad_json,
  tendencia_json = excluded.tendencia_json,
  matriz_json = excluded.matriz_json,
  actualizado_at = now();

insert into evaluaciones_360 (cliente_id, periodo, notas_relacionamiento_json, notas_performance_json, notas_comerciales_json, kpis_calidad_json, tendencia_json, matriz_json)
select c.id, 'Q3 2026',
  '[{"criterio":"Tiempos de respuesta","puntaje":4},{"criterio":"Calidad del feedback","puntaje":3},{"criterio":"Claridad de los briefs","puntaje":3},{"criterio":"Entrega de información","puntaje":4}]'::jsonb,
  '[{"criterio":"Cumplimiento de pagos","puntaje":4},{"criterio":"Agilidad en aprobaciones","puntaje":3},{"criterio":"Respeto de procesos","puntaje":4}]'::jsonb,
  '[{"criterio":"Facturación en locales","puntaje":3},{"criterio":"Mix de producto","puntaje":3},{"criterio":"Base de datos","puntaje":4},{"criterio":"Performance digital","puntaje":3},{"criterio":"Presencia de marca","puntaje":3}]'::jsonb,
  '[]'::jsonb,
  '[{"mes":"Mayo","puntaje":3.2},{"mes":"Junio","puntaje":3.4},{"mes":"Julio","puntaje":3.4}]'::jsonb,
  '[]'::jsonb
from clientes c where lower(c.nombre) = lower('Conquistadores')
on conflict (cliente_id, periodo) do update set
  notas_relacionamiento_json = excluded.notas_relacionamiento_json,
  notas_performance_json = excluded.notas_performance_json,
  notas_comerciales_json = excluded.notas_comerciales_json,
  kpis_calidad_json = excluded.kpis_calidad_json,
  tendencia_json = excluded.tendencia_json,
  matriz_json = excluded.matriz_json,
  actualizado_at = now();

insert into evaluaciones_360 (cliente_id, periodo, notas_relacionamiento_json, notas_performance_json, notas_comerciales_json, kpis_calidad_json, tendencia_json, matriz_json)
select c.id, 'Q3 2026',
  '[{"criterio":"Tiempos de respuesta","puntaje":4},{"criterio":"Calidad del feedback","puntaje":3},{"criterio":"Claridad de los briefs","puntaje":4},{"criterio":"Entrega de información","puntaje":3}]'::jsonb,
  '[{"criterio":"Cumplimiento de pagos","puntaje":4},{"criterio":"Agilidad en aprobaciones","puntaje":4},{"criterio":"Respeto de procesos","puntaje":4}]'::jsonb,
  '[{"criterio":"Facturación en locales","puntaje":3},{"criterio":"Mix de producto","puntaje":3},{"criterio":"Base de datos","puntaje":3},{"criterio":"Performance digital","puntaje":4},{"criterio":"Presencia de marca","puntaje":3}]'::jsonb,
  '[]'::jsonb,
  '[{"mes":"Mayo","puntaje":3.3},{"mes":"Junio","puntaje":3.5},{"mes":"Julio","puntaje":3.6}]'::jsonb,
  '[]'::jsonb
from clientes c where lower(c.nombre) = lower('Sipssa')
on conflict (cliente_id, periodo) do update set
  notas_relacionamiento_json = excluded.notas_relacionamiento_json,
  notas_performance_json = excluded.notas_performance_json,
  notas_comerciales_json = excluded.notas_comerciales_json,
  kpis_calidad_json = excluded.kpis_calidad_json,
  tendencia_json = excluded.tendencia_json,
  matriz_json = excluded.matriz_json,
  actualizado_at = now();

insert into evaluaciones_360 (cliente_id, periodo, notas_relacionamiento_json, notas_performance_json, notas_comerciales_json, kpis_calidad_json, tendencia_json, matriz_json)
select c.id, 'Q3 2026',
  '[{"criterio":"Tiempos de respuesta","puntaje":4},{"criterio":"Calidad del feedback","puntaje":3},{"criterio":"Claridad de los briefs","puntaje":2},{"criterio":"Entrega de información","puntaje":2}]'::jsonb,
  '[{"criterio":"Cumplimiento de pagos","puntaje":5},{"criterio":"Agilidad en aprobaciones","puntaje":2},{"criterio":"Respeto de procesos","puntaje":3}]'::jsonb,
  '[{"criterio":"Facturación en locales","puntaje":2},{"criterio":"Mix de producto","puntaje":2},{"criterio":"Base de datos","puntaje":1},{"criterio":"Performance digital","puntaje":2},{"criterio":"Presencia de marca","puntaje":3}]'::jsonb,
  '[]'::jsonb,
  '[{"mes":"Mayo","puntaje":2.1},{"mes":"Junio","puntaje":2.4},{"mes":"Julio","puntaje":2.6}]'::jsonb,
  '[]'::jsonb
from clientes c where lower(c.nombre) = lower('Blangino')
on conflict (cliente_id, periodo) do update set
  notas_relacionamiento_json = excluded.notas_relacionamiento_json,
  notas_performance_json = excluded.notas_performance_json,
  notas_comerciales_json = excluded.notas_comerciales_json,
  kpis_calidad_json = excluded.kpis_calidad_json,
  tendencia_json = excluded.tendencia_json,
  matriz_json = excluded.matriz_json,
  actualizado_at = now();

insert into evaluaciones_360 (cliente_id, periodo, notas_relacionamiento_json, notas_performance_json, notas_comerciales_json, kpis_calidad_json, tendencia_json, matriz_json)
select c.id, 'Q3 2026',
  '[{"criterio":"Tiempos de respuesta","puntaje":3},{"criterio":"Calidad del feedback","puntaje":2},{"criterio":"Claridad de los briefs","puntaje":1},{"criterio":"Entrega de información","puntaje":2}]'::jsonb,
  '[{"criterio":"Cumplimiento de pagos","puntaje":3},{"criterio":"Agilidad en aprobaciones","puntaje":1},{"criterio":"Respeto de procesos","puntaje":2}]'::jsonb,
  '[{"criterio":"Facturación en locales","puntaje":2},{"criterio":"Mix de producto","puntaje":2},{"criterio":"Base de datos","puntaje":2},{"criterio":"Performance digital","puntaje":1},{"criterio":"Presencia de marca","puntaje":2}]'::jsonb,
  '[]'::jsonb,
  '[{"mes":"Mayo","puntaje":2.6},{"mes":"Junio","puntaje":2.2},{"mes":"Julio","puntaje":1.9}]'::jsonb,
  '[]'::jsonb
from clientes c where lower(c.nombre) = lower('Panther')
on conflict (cliente_id, periodo) do update set
  notas_relacionamiento_json = excluded.notas_relacionamiento_json,
  notas_performance_json = excluded.notas_performance_json,
  notas_comerciales_json = excluded.notas_comerciales_json,
  kpis_calidad_json = excluded.kpis_calidad_json,
  tendencia_json = excluded.tendencia_json,
  matriz_json = excluded.matriz_json,
  actualizado_at = now();

commit;

-- ------------------------------------------------------------
-- Control: qué quedó cargado.
-- ------------------------------------------------------------
select
  (select count(*) from clientes) as clientes,
  (select count(*) from squad_miembros) as squad,
  (select count(*) from metricas_cliente) as metricas,
  (select count(*) from kata_condiciones) as condiciones,
  (select count(*) from pdca_experimentos) as experimentos,
  (select count(*) from evaluaciones_360) as evaluaciones;
