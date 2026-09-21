# Estado del proyecto — PETERBELITY (repo/infra: oxford-strategy-os)

_Última actualización: 21 de septiembre de 2026_

Documento de traspaso: si empezás una conversación nueva con Claude sobre este
proyecto, pedile que lea este archivo primero.

> **Nombre interno del producto: PETERBELITY.** El equipo se refiere al producto
> con ese nombre. El repositorio, la carpeta, la URL de Vercel, el proyecto de
> Supabase y el remoto de GitHub **siguen llamándose `oxford-strategy-os`**. No
> hay que renombrar nada de esa infraestructura: "PETERBELITY" es solo el nombre
> con el que se habla del producto de puertas adentro.

## Qué es

App interna de Grupo Oxford que reemplaza a Tability: OKRs, check-ins
semanales, tablero de dirección (LOM), control de rentabilidad (SOLOP),
informes ejecutivos y un asistente conversacional (Scout). **Está en producción.**

Lo que la diferencia de un tablero de OKRs común: conecta los objetivos con la
rentabilidad real por cliente. Un bloqueo que reporta un responsable el lunes
aparece en la tarjeta, se explica en la ficha del KR, se cruza con el margen
del cliente en SOLOP, llega priorizado a la LOM del martes y sale formateado
para el grupo de WhatsApp.

## Accesos

| Qué | Dónde |
|---|---|
| App en vivo | https://oxford-strategy-os.vercel.app |
| Código | https://github.com/pedro2003dcsd/oxford-strategy-os |
| Base de datos (Supabase) | Proyecto `yxfjimahoxeaebrovkwp` |
| Hosting (Vercel) | https://vercel.com/pedro2003dcsds-projects/oxford-strategy-os |
| **Copia canónica (desde 21/09/2026)** | `C:\Users\pedro\Documents\Proyectos\oxford-strategy-os` |
| Respaldo histórico (no usar) | `C:\Users\pedro\Downloads\oxford-strategy-os` |

GitHub: usuario `pedro2003dcsd`. Supabase y Vercel: usar los proyectos
enlazados en la tabla superior. (Este documento no guarda contraseñas,
credenciales ni direcciones de email personales; se cargan aparte.)

> **Ubicación canónica.** Todo el desarrollo se hace sobre la copia de
> `Documents\Proyectos\oxford-strategy-os`. La copia en `Downloads` queda solo
> como respaldo histórico temporal: **no se desarrolla, no se modifica y no se
> borra todavía**. Los documentos y memorias más viejos pueden apuntar a la ruta
> de `Downloads`; hay que leerlos igual, traduciendo la ruta.

**Altas de usuarios:** desde la pantalla **Equipo** dentro de la app. Ver la
sección de accesos más abajo.

## Stack

- **Next.js 16.2.12** (App Router, React 19.2.4, Tailwind v4). Ojo: Next.js 16
  tiene cambios respecto a versiones anteriores — `middleware.ts` se llama ahora
  `proxy.ts` y los `params` de rutas son `Promise`. Antes de escribir código de
  Next, leer la guía correspondiente en `node_modules/next/dist/docs/`. Ver
  `AGENTS.md` / `CLAUDE.md`.
- **Supabase** (Postgres + Auth): `@supabase/ssr` 0.12 + `@supabase/supabase-js`
  2.111. Local vía Docker Desktop + Supabase CLI.
- **Recharts** 3 para gráficos, **@anthropic-ai/sdk** 0.115 para IA.
- Sin librería de componentes. Se evaluó Shadcn y se descartó: los componentes
  usan Tailwind plano con tokens propios, y migrar rompería el diseño ya
  desplegado.
- Scripts: `npm run dev`, `npm run build`, `npm run lint` (eslint), `npm run
  test` (vitest), `npm start`.

## Módulos

1. **Dashboard** (`/`) — Estrella Polar, filtros por trimestre y área, filtros
   rápidos "Mis Objetivos" y "Solo Alertas". Cada tarjeta muestra avatar del
   responsable, avance, contador de iniciativas y el bloqueo del último
   check-in. Al hacer clic abre un panel lateral (`KrDrawer`) con timeline de
   check-ins, iniciativas, detalle de horas y margen de SOLOP, y link de
   trabajo. Mejora reciente (ya en producción): sección única "COLABORATIVOS"
   sin duplicados, orden estable, trimestre actual por defecto (no Q3 fijo) y
   bloqueo actual leído del último check-in por fecha; "Solo Alertas" considera
   el bloque actual.
2. **Check-in Express** (`/checkin`) — inbox semanal, carga en menos de dos
   minutos, botones +/- rápidos, hitos e iniciativas tildables en el mismo
   acto, comentario de bloqueo obligatorio en amarillo/rojo. Tiene botón
   "Recordar" que arma el mensaje para WhatsApp y badge de cierre del viernes
   18:00.
3. **Alineación / Mapa** (`/okrs`) — mapa editable estilo Miro que reemplazó al
   árbol viejo. Ver la sección **"Alineación: el modelo nuevo"** más abajo (es el
   módulo más trabajado recientemente y su modelo cambió por completo).
4. **Modo LOM** (`/lom`) — solo desvíos por defecto, sparkline de 4 semanas,
   bloqueo citado textual, detección de dependencia cruzada entre áreas,
   compromisos con responsable y fecha límite, bloque de revisión de la LOM
   pasada, pizarra de actas y copia del resumen con formato de Slack/WhatsApp.
5. **Torre de Control SOLOP** (`/solop`) — matriz de rentabilidad por
   cliente, barra dual de horas consumidas contra avance del KR con aviso de
   scope creep, asociación de KR desde la fila, y fecha de última
   sincronización. Al guardar propaga el margen real al KR asociado.
6. **Informes** (`/informes`) — LOM semanal, retrospectiva trimestral y
   reporte de área, con filtro de secciones antes de generar, botonera de PDF,
   Markdown y envío por mail, CSS de impresión en claro, e histórico de
   informes guardados.
7. **Scout AI** (`/scout` + botón flotante global) — chat en lenguaje natural.
   La API Route `/api/ai/scout-chat` lee KRs, check-ins, compromisos y
   proyectos en cada consulta y arma el contexto. Prompts rápidos, cápsulas de
   seguimiento, badges de color y KRs que abren el panel lateral.
8. **Equipo** (`/equipo`) — administración de accesos.
9. **OKRs Colaborativos** (`/okrs/colaborativos`) — objetivos transversales a
   varias áreas, con avance consolidado y un referente por área.
10. **Cartera de Clientes** (`/clientes`) — ficha por cuenta: squad, métricas
    de tres niveles y la rentabilidad cruzada desde SOLOP.
11. **Kata Board** (`/kata`) — condición objetivo, experimentos PDCA y
    rentabilidad por hora.
12. **KPIs Clientes** (`/kpis-clientes`) — evaluación 360 bidireccional,
    matriz de valoración y tendencia mensual.
13. **Iniciativas** (`/iniciativas`) y **KR detalle** (`/kr/[id]`).

La navegación es un **sidebar** desplegable (☰) con categorías en acordeón,
ruta activa resaltada, opción de fijarlo en escritorio y pie con el usuario.
Reemplazó la barra de links de arriba.

**Degradación elegante:** Informes y Scout funcionan sin `ANTHROPIC_API_KEY`.
Responden por reglas sobre los mismos datos y lo avisan en pantalla.

## Alineación: el modelo nuevo (sin Pilar, M:N)

El módulo `/okrs` fue reescrito entre agosto y septiembre de 2026. Reemplaza al
árbol viejo (`Pilar → OKR Anual → OKR Trimestral → KR`). Decisiones vigentes,
acordadas con Mateo y Mariana (reunión del 11/09):

- **"Pilar" se eliminó como concepto.** Ya no hay un nivel por encima del OKR
  anual. Los residuos en el subsistema de IA (`scout.ts`, `informes.ts`) se
  limpiaron. Queda deuda legacy menor en el type system (ver "Base de datos").
- **Estructura nueva, muchos-a-muchos:** OKR trimestral ↔ OKR anual y KR
  trimestral ↔ KR anual. **La relación M:N es la regla, no la excepción.** Las
  alineaciones son solo entre niveles equivalentes (anual con trimestral),
  nunca un OKR con un KR.
- **El KR anual tiene meta propia** (`valor_meta`), que carga Dirección/CEO una
  vez al año y ajusta si cambia la estrategia. **No es un rollup** del avance de
  los KR trimestrales.
- **Mapa editable estilo Miro:** zoom, pan, foco (modo reunión que resalta
  líneas y nodos), "Ajustar" (encajar todo), "Ordenar", y arrastrar tarjetas
  para reubicarlas. Las relaciones se crean arrastrando desde los puntos ● de
  cada nodo.
- **Posiciones persistidas** en Supabase (migración `0018`), para que el acomodo
  quede fijo y todos vean el mismo mapa.
- **Indicador "Sin alineación"** (chip) en OKR/KR trimestrales huérfanos.
- **Borrado de OKR anual y KR anual desde el mapa, solo Dirección** (componente
  `BorrarAnual.tsx`, gate `esDireccion` en cliente, guard `vetoDeBorrado()` en
  servidor). Los trimestrales no se borran desde el mapa.
- **Valores %/$ en formato argentino** (punto = miles, coma = decimales) vía
  `src/lib/numeros.ts` (`parsearNumero` / `formatearParaInput`). Decisión
  explícita: en inputs de meta, `"55,22"` y `"55.22"` se interpretan ambos como
  `55.22` (no `5522`), porque el usuario escribe decimales. La tabla de casos
  está documentada en el propio archivo.

**Componentes clave del mapa:** `MapaAlineacion.tsx` (el corazón de `/okrs`),
`Modal.tsx` (modal compartido), `KrModal.tsx` (modal propio del KR trimestral),
`OkrForms.tsx` (`OkrAnualModal`, `KrAnualModal`, `NewOkrTrimestralModal`),
`KrAnualModal.tsx`, `BorrarAnual.tsx`. Server Actions en
`src/app/(protected)/okrs/actions.ts` (`deleteOkrAnual` / `deleteKrAnual` con
`vetoDeBorrado`). La página `okrs/page.tsx` carga datos y pasa `esDireccion` al
mapa.

**Modales del mapa:** se renderizan con `createPortal(overlay, document.body)`
porque el "mundo" transformado (zoom/pan) sería el *containing block* de un
`position: fixed` y descentraría el modal. La capa del overlay corta la
propagación de `pointerdown`/`click` para no disparar drag/pan/selección del
mapa; el backdrop sigue cerrando (`target === currentTarget`). **No
redimensionar ni rediseñar los modales.**

## Diseño

Identidad Oxford con tokens semánticos en `globals.css`: `bg-panel`,
`text-tenue`, `border-linea` y el acento `bg-oxford` (magenta `#E0115F`). Dos
temas del mismo juego de tokens, elegidos por `prefers-color-scheme`: claro
sobre `#FAFAFA` y oscuro borravino sobre `#0F070E`.

**Los componentes no usan colores crudos.** Para cambiar la paleta se toca
solo `globals.css`. La excepción son los colores de semáforo, que son
semánticos y no de marca.

## Accesos y autenticación

Dos formas de entrar, las dos sujetas al mismo filtro:

- **Email y contraseña**, con cuentas creadas en Supabase.
- **Google**, configurado en Google Cloud + Supabase. Ver `GUIA-LOGIN-GOOGLE.md`.

La tabla `usuarios_autorizados` es la única puerta. Hace de lista blanca y de
perfil en la misma fila: email, nombre, área, responsable de OKRs y rol
(`direccion`, `equipo`, `lectura`).

### El rol `lectura` restringe de verdad

Desde el 9 de agosto de 2026. Antes el nombre prometía algo que la app no
cumplía: el rol se chequeaba únicamente en la pantalla Equipo y todas las
tablas tenían `authenticated full access`, así que una cuenta "Solo lectura"
podía crear, editar y borrar cualquier cosa.

Se cierra en dos capas, y las dos hacen falta:

- **RLS (`0015`).** Leer queda abierto a cualquier autenticado; insertar,
  modificar y borrar exigen `puede_escribir()`. Es la capa que no se puede
  saltear llamando a la API directo.
- **Guard en las Server Actions** (`src/lib/permisos.ts`: `puedeEscribir`,
  `vetoDeEscritura`, `vetoDeBorrado`). No es cosmético: un UPDATE o un DELETE
  bloqueados por RLS **no dan error**, afectan cero filas en silencio. Sin el
  guard, la pantalla diría "guardado" sin haber guardado nada.

Los formularios devuelven un mensaje claro. Las acciones sin retorno, como
tildar un compromiso, cortan sin avisar: la tilde se mueve en pantalla y
vuelve a su valor real al recargar. **Los controles de escritura siguen a la
vista para el rol lectura**; lo que hay es un aviso arriba de todo. Esconder
cada botón queda pendiente.

Decisiones que conviene no revertir sin pensarlo:

- El control vive en `proxy.ts`, así también cubre las rutas de API.
- **Ante un error de la base, deja pasar** (fail-open). Un problema de
  infraestructura no puede dejar afuera al equipo entero. Lo que cierra la
  puerta es una respuesta correcta y vacía, no un error. (Esto se invierte
  cuando entre el primer rol `cliente`; ver "Segunda etapa".)
- No se puede borrar ni suspender la última cuenta de Dirección activa.
- Las funciones `esta_autorizado()` y `es_direccion()` son SECURITY DEFINER a
  propósito: si leyeran la tabla con RLS puesta, la política que las usa
  entraría en recursión.
- El índice del email es case-insensitive, porque Google puede devolver la
  dirección con otra capitalización.

## Responsables de un OKR

Un OKR tiene **uno que rinde cuentas y los que comparten el objetivo**.
Aparece en "Mis Objetivos" de todos por igual; la diferencia solo importa
cuando en la LOM hay que preguntarle a alguien.

- Quien rinde cuentas está en `responsable_id`, y los demás en
  `okr_responsables`. Nadie está en los dos lados a la vez: si estuviera,
  su avatar saldría duplicado en cada tarjeta.
- **La columna de texto `responsable` se conserva y se mantiene
  sincronizada** con el nombre de quien rinde cuentas. La leen los informes,
  Scout, el resumen de la LOM y el mail de recordatorio. Mientras exista,
  tiene que decir lo mismo que el id.
- El desplegable muestra `nombre` y no `responsable`, porque `responsable`
  es un alias y dos personas pueden compartirlo. Cuando difieren, el alias
  va entre paréntesis.

**Ojo con los alias repetidos:** si dos personas tienen el mismo valor en
`responsable`, el backfill de 0014 elige una sin criterio. Conviene que la
pantalla Equipo no tenga alias duplicados.

## Base de datos

Las migraciones viven en `supabase/migrations/` (18 al 21/09/2026). **Se
aplican a mano en la nube**, pegando el SQL en el editor de Supabase (lo hace
Pedro). Este entorno no tiene —ni debe tener— credenciales de producción.

- `0001_init.sql` — okr_anual, okr_trimestral, key_results, hitos_kr,
  check_ins, trigger de sincronización, vistas, RLS y GRANTs. (Incluía
  `pilares`, hoy legacy; ver más abajo.)
- `0002_compromisos_lom.sql` — compromisos de destrabe.
- `0003_proyectos_solop.sql` — proyectos con horas, facturación y costos.
- `0004_kr_descendente.sql` — KR cuya métrica baja (plazo de cobro de 45 a 25
  días) se compara según el sentido correcto.
- `0005_iniciativas.sql` — tabla `iniciativas` y `link_trabajo` en key_results.
- `0006_compromisos_e_informes.sql` — responsable y fecha en compromisos, más
  la tabla `informes_guardados`.
- `0007_usuarios_autorizados.sql` — lista blanca y perfiles.
- `0008_clientes_y_performance.sql` — `clientes` como fuente de verdad, con
  backfill desde el texto suelto de `proyectos_solop.cliente` y
  `key_results.cliente_asociado`. Más `squad_miembros`, `metricas_cliente`,
  `kata_condiciones`, `pdca_experimentos`, `evaluaciones_360`,
  `okr_historial_cambios` y los campos colaborativos del árbol de OKRs.
- `0009_rol_equipo.sql` — el rol `lider` pasa a llamarse `equipo`. El check
  constraint queda en `('direccion', 'equipo', 'lectura')` — **sin `cliente`**,
  a propósito.
- `0010_okr_responsables.sql` — referente por área en los OKRs colaborativos.
- `0011_ajustes_datos_reales.sql` — correcciones que aparecieron al cargar
  los datos reales. Ver la cabecera del archivo.
- `0012_actas_directorio.sql` — actas para la pizarra de la LOM.
- `0013_sincronizar_cliente.sql` — trigger que resuelve `cliente_id` a partir
  del nombre, y lo crea si no existe.
- `0014_responsables_por_id.sql` — `responsable_id` en los dos niveles de OKR,
  y `okr_responsables` generalizada.
- `0015_solo_lectura.sql` — la función `puede_escribir()` y las políticas que
  hacen que el rol `lectura` no pueda escribir en ninguna tabla. Reemplaza el
  `authenticated full access` de las 18 tablas de datos.
- `0016_area_usuario.sql` — área de cada persona en `usuarios_autorizados`.
  Reemplaza el "Responsable de OKRs" de texto libre de la pantalla Equipo. El
  área arranca el filtro del Dashboard en lo de cada uno (conveniencia), pero
  **no restringe**: todos siguen viendo todo.
- `0017_kr_anual_y_alineacion.sql` — **KR anual con meta propia** (`valor_meta`)
  y la **alineación M:N** entre niveles (`okr_alineacion`, `kr_alineacion`).
  Refleja las decisiones de la reunión del 11/09 (Mateo, Mariana, Pedro).
- `0018_posiciones_mapa.sql` — **posición (x, y) de cada nodo** del mapa de
  Alineación. Nullable: un OKR recién creado no tiene posición hasta que alguien
  lo mueve.

> **Estado de nube confirmado por Pedro / handoff al 21/09/2026: las migraciones
> 0017 y 0018 ya fueron aplicadas en Supabase. NO volver a ejecutarlas.**

**FK / cascadas verificadas:** borrar un KR anual hace *cascade* sobre
`kr_alineacion`; borrar un OKR anual hace *cascade* sobre
`kr_anual`/`okr_alineacion`/`okr_responsables` y *SET NULL* en
`okr_trimestral.okr_anual_id`. Los trimestrales nunca se borran. Sin líneas
huérfanas.

**Deuda legacy que NO hay que borrar todavía** (rompe código desplegado):
- `proyectos_solop.cliente` y `key_results.cliente_asociado` (columnas de
  cliente en texto) conviven con las FK nuevas.
- `okr_trimestral.okr_anual_id` (auditada, aún referenciada).
- En el type system, `src/lib/types.ts` todavía define `interface Pilar` y una
  referencia `pilares`, marcadas como legacy: ningún formulario las escribe,
  pero algunas consultas viejas y tipos las traen. Borrarlas es un paso aparte,
  coordinado con la limpieza de la columna en la base.

Scripts sueltos (no son migraciones, se pegan cuando hacen falta):

- `supabase/datos-performance-clientes.sql` — las seis cuentas completas.
  Idempotente.
- `supabase/fusionar-clientes-duplicados.sql` — para cuando el mismo cliente
  quedó cargado con dos nombres. Ya se usó para fusionar "Batistella" dentro de
  "Batistella (Bati Off)".
- `supabase/aplicar-en-la-nube.sql` — junta migraciones tempranas en un script
  idempotente. **No** incluye datos: para eso se pega `supabase/seed.sql`
  aparte.

**Local:** requiere Docker Desktop abierto + `npx supabase start`. `npx
supabase db reset` aplica todas las migraciones y borra `auth.users` (hay que
recrear el usuario de prueba después).

## Estado de Git y ramas

- **Remoto:** `origin = https://github.com/pedro2003dcsd/oxford-strategy-os.git`
- **`main` = producción.** HEAD `9df6787` ("Dashboard: estructura estable,
  colaborativos sin duplicar y bloqueo actual"). Ya incluye el mapa v2 (M:N, sin
  Pilar) mergeado y la limpieza de Pilar en la IA (`1366f19`).
- **`qa-mapa-mateo` = rama de estabilización del mapa, NO en producción.**
  - HEAD local: `3951634` ("aislar eventos del modal").
  - `origin/qa-mapa-mateo`: `6710854` → el local está **1 commit adelante, sin
    pushear** (`3951634`).
  - Commits por encima de `main` (aprobados para Preview, sin mergear a `main`):
    `7698dfc` (valores %/$ AR + lienzo sin muro) · `bb48bb6` (KR trimestral
    formato AR) · `5c30d6c` (borrado OKR/KR anual, solo Dirección) · `6710854`
    (modales Portal) · `3951634` (aislar eventos del modal).
- **Otras ramas:** `alineacion-estrategica-v2` (ya en `main`),
  `prototipo-sidebar`.

**Reglas de Git de Pedro (permanentes):** nunca push/merge/deploy sin pedirlo
explícitamente; merges **fast-forward**; sin squash, sin rebase, sin force salvo
pedido expreso; preferir un commit nuevo antes que `amend`.

## Estado del QA del mapa (fase actual)

Todo el trabajo reciente del mapa vive en `qa-mapa-mateo`, aprobado para Preview
pero **no mergeado a `main`** (no está en producción).

**Estado actual del commit `3951634`:** `qa-mapa-mateo` local está en `3951634`,
**1 commit adelante de `origin/qa-mapa-mateo`** (que está en `6710854`). Es
decir, **`3951634` todavía NO está en `origin`**.

Secuencia correcta para cerrar el mapa:

1. **No hacer push de `3951634` sin autorización explícita de Pedro.**
2. Cuando Pedro autorice el push de `3951634`, Vercel generará el Preview
   correspondiente.
3. Recién **sobre ese Preview** correr el **smoke test completo**. Caso fuerte:
   panear a un costado, abrir "editar" de un nodo visible, confirmar que el modal
   aparece centrado en el viewport, cerrar, y confirmar que el mapa quedó en el
   mismo lugar/zoom. Luego el resto de casos (crear relación arrastrando, borrado
   anual solo Dirección, formato AR en metas).
4. Si el smoke test pasa, evaluar **merge fast-forward a `main` con autorización
   explícita de Pedro** (sin squash/force). Antes de que el código llegue a
   producción, aplicar en Supabase cualquier SQL pendiente (0017/0018 ya están
   aplicadas).

## Pendientes, deuda técnica y decisiones

- **Todo lo cargado es demo (set Q3 2026).** No se actualiza solo. **El riesgo
  más grande del proyecto no es técnico: es que nadie cargue los datos reales ni
  las horas de SOLOP cada semana.**
- **QA del mapa sin mergear** (ver sección anterior).
- **Aislamiento multitenant por RLS: NO hecho, a propósito.** Todas las tablas
  siguen con lectura abierta a cualquier autenticado. Correcto hoy (solo entra
  el equipo). Ver "Segunda etapa".
- **Controles de escritura visibles para el rol lectura.** El rol restringe de
  verdad, pero esconder cada botón quedó pendiente; hoy solo hay un aviso arriba.
- **El formulario de SOLOP escribe el cliente como texto libre.** El trigger de
  0013 resuelve/crea el cliente, pero un typo crea una cuenta nueva. Arreglo
  durable: desplegable contra `clientes` con opción de crear (media jornada).
- **Columnas y tipo legacy** (no borrar aún): `proyectos_solop.cliente`,
  `key_results.cliente_asociado`, `okr_trimestral.okr_anual_id`, `interface
  Pilar`/`pilares` en `types.ts`.
- **Margen SOLOP: carga manual.** El campo queda listo para integrar una API o
  export de SOLOP más adelante.
- **Tests solo de lógica pura.** `npm test` corre vitest sobre
  `src/lib/historial.test.ts` y `src/lib/clientes-logic.test.ts` (30 casos).
  Los componentes y las Server Actions se verifican a mano.
- `npm audit` reporta vulnerabilidades en `postcss`/`sharp` que vienen dentro de
  `node_modules/next`. **No** arreglar con `--force`: bajaría Next.js.

### Bugs conocidos

- **Turbopack sirve `/okrs` como 404** a veces tras arrancar `npm run dev` (caché
  de rutas de Turbopack, no del código). Solución: parar el dev server, borrar
  `.next`, reiniciar.
- **Entorno de test — panel del navegador oculto:** cuando el Browser pane está
  oculto, `document.hidden=true`, `getBoundingClientRect()` del viewport devuelve
  ~2×2 px (distorsiona Ajustar/zoom/pan) y `requestAnimationFrame` se pausa. Un
  screenshot trae el pane al frente y da viewport real por un momento. Preferir
  tools de texto y `setTimeout` en vez de rAF para medir.
- **Estrella Polar y SOLOP cuentan clientes con lógicas distintas** → muestran
  números diferentes (0/20 vs 1/20). Sin resolver.
- **Batistella no dispara "scope creep" en la etiqueta de horas** (umbral 90%,
  está en 88%). La Torre sí lo cuenta con criterio de 75%.
- **OKR de Cultura queda "sin alinear"** en el set demo (residuo del modelo
  viejo: un objetivo sin OKR anual asociado).
- **Alias repetidos en `responsable`:** el backfill de 0014 elige uno sin
  criterio. Evitar alias duplicados en Equipo.

### Decisiones que no deben revertirse (sin conversarlo)

- **Producto:** nombre interno PETERBELITY; infra sigue como `oxford-strategy-os`.
- **Alineación:** Pilar eliminado; M:N KR↔KR (y OKR↔OKR) es la regla; KR anual
  con meta propia; mapa editable; no resetear el set (se mantiene Q3).
- **CRM de Consultoría** se construye como MÓDULO dentro de esta app, no como app
  aparte (comparten la columna vertebral de datos).
- Sin librería de componentes; colores por tokens semánticos.
- **Auth:** control en `proxy.ts` (cubre API); fail-open ante error de base; no
  borrar la última cuenta de Dirección; `esta_autorizado()`/`es_direccion()`
  SECURITY DEFINER; índice de email case-insensitive.
- **Modales del mapa** con `createPortal` + aislamiento de eventos; no
  redimensionar/rediseñar.
- Se descartó WhatsApp automatizado (API Business, aprobación Meta, costo): el
  botón manual de Check-in cubre el caso.
- **Migraciones a mano en la nube, SQL primero, código después.**
- **Números en formato AR** con la interpretación de decimales documentada.
- **No re-ejecutar migraciones ya aplicadas** (0017, 0018 confirmadas).
- **No pasar credenciales de producción por este entorno.**
- **No `npm audit fix --force`.**

## Performance Clientes: en producción

El directorio lo aprobó el 6 de agosto de 2026: de maqueta a producción real,
mergeado a `main` el mismo día.

- **Cartera de Clientes** (`/clientes`) — ficha por cuenta con métricas de tres
  niveles, composición del squad, filtro por PO y link al Looker Studio. Alta y
  edición de cliente, squad y métricas.
- **Kata Board** (`/kata`) — condición objetivo, experimentos PDCA con cambio de
  estado desde el tablero, y rentabilidad por hora.
- **KPIs Clientes** (`/kpis-clientes`) — evaluación 360 bidireccional, matriz de
  valoración, KPIs de calidad y tendencia mensual.

**Ya no hay maqueta.** `src/lib/prototipo/` y `src/components/prototipo/` se
borraron. Todo sale de la base y todo guarda. Scout lee los datos reales.

**La rentabilidad ya no se carga a mano en la ficha del cliente:** sale de
`proyectos_solop` cruzando por `cliente_id`. Los números de horas, margen y
rendimiento por hora son los mismos que muestra SOLOP, por construcción.

Las seis cuentas —Batistella (Bati Off), Eseka, Conquistadores, Sipssa,
Blangino y Panther— se cargaron con `supabase/datos-performance-clientes.sql`.
**Esos números se presentaron al directorio en agosto de 2026; no se actualizan
solos.** **Solo Batistella y "Ueno 2026" tienen datos en SOLOP;** las otras
muestran "sin horas cargadas" hasta que alguien cargue el proyecto en la Torre.

## Segunda etapa: aislamiento para usuarios externos (rol `cliente`)

**Pospuesto a propósito.** Se puede dar acceso a un cliente externo recién
cuando estén las tres cosas, juntas:

1. **Filtrar la lectura por cliente.** La mitad ya está en `0015` (18 tablas con
   políticas por operación y `puede_escribir()` como patrón). Falta la política
   de SELECT, hoy abierta a cualquier autenticado.
2. **Invertir el fail-open de `proxy.ts`.** Hoy, ante error de base, deja pasar.
   Con gente externa, un hipo de Supabase abriría la app entera. Tiene que
   quedar permisivo para el equipo y cerrado para el rol `cliente`.
3. **Resolver el `cliente_id` del usuario.** Se descartó el claim en el JWT. Va
   como columna `cliente_id` en `usuarios_autorizados` más una función
   `cliente_actual()` SECURITY DEFINER, mismo patrón que `es_direccion()`.

El rol `cliente` **no está en el check constraint todavía**, a propósito: con
las políticas actuales una cuenta marcada así tendría acceso total igual.

Scout ya está preparado: sus consultas usan el cliente de Supabase de la
sesión, así que el día que RLS filtre, filtra también para la IA.

## Próximo desarrollo importante: mails de recordatorio automáticos

Una **tarea programada en Vercel** que corra una vez por día, mire quién tiene
check-ins pendientes y le mande un mail con sus KRs. Jueves como aviso y viernes
a la mañana como último llamado. Se apoya en `src/lib/rito-semanal.ts`, que ya
arma el mensaje.

## Módulo futuro: CRM de Consultoría

En scoping, **sin código** (agosto 2026). Se construye como **módulo dentro de
PETERBELITY**, no como app aparte: comparten la columna vertebral de datos, y un
prospecto ganado es una fila de la cartera con cambio de estado, no una
exportación.

Cubre el negocio de consultoría de punta a punta: cacería/captación → viaje de
consultoría de 6 semanas → cliente activo. El plano fundacional está en
`PLANO-CRM-CONSULTORIA.md` (arco de 3 tramos; puertas inbound/outbound ABM;
metodología encodada; modelo de datos; MVP = arrancar por el motor de
consultoría; preguntas abiertas). Semilla de conocimiento: carpeta `Consultoria`
del Drive de Pedro. **Leer ese plano antes de tocar el CRM.**

## Nombres internos y datos de referencia

- **PETERBELITY** = nombre interno del producto (infra sigue `oxford-strategy-os`).
- **Estrella Polar** = objetivo faro del Dashboard ("20 clientes integrales con
  UB/Venta > 65%").
- **LOM** = reunión ejecutiva semanal (tablero de dirección).
- **SOLOP** = Torre de Control de rentabilidad por cliente.
- **Scout** = asistente de IA.
- **Kata / PDCA** = tablero de mejora por experimentos.
- Personas: Pedro (dueño del producto), Mateo y Mariana (definiciones del
  mapa/alineación), Dolores (pruebas), y responsables de OKR del set demo.
- Cuentas demo (6): Batistella (Bati Off), Eseka, (Café) Conquistadores, Sipssa,
  Blangino, Panther. Más "Ueno 2026" con datos SOLOP.

## Otros documentos

- `PLANO-CRM-CONSULTORIA.md` — plano fundacional del CRM (leer antes de tocarlo).
- `PREGUNTAS-AL-EQUIPO.md` — preguntas abiertas al equipo.
- `GUION-DEMO.md` — guion de 15 minutos para presentar al directorio.
- `GUION-DEMO-PROTOTIPO.md` — guion del módulo Performance Clientes.
- `GUIA-PRUEBAS.md` — recorrido de verificación para el equipo.
- `GUIA-LOGIN-GOOGLE.md` — paso a paso para activar el ingreso con Google.
- `AGENTS.md` / `CLAUDE.md` — aviso sobre los cambios de Next.js 16.

## Flujo de trabajo

1. Editar código en local (copia canónica en `Documents\Proyectos`).
2. `npx tsc --noEmit`, `npm run lint`, `npm test`, `npm run build`.
3. Probar en local. Necesita Docker Desktop abierto y `npx supabase start`.
4. **No** hacer push/merge/deploy sin pedido explícito de Pedro. Cuando se
   autorice: cada push a una rama genera un Preview de Vercel; el merge a `main`
   despliega a producción en 1-2 minutos.

**Cuidado con el orden de despliegue:** si el código sale antes de que la
migración esté aplicada en la nube, las pantallas que usan tablas nuevas
rompen. **Correr el SQL primero.**
