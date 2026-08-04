# Estado del proyecto — Oxford Strategy OS

_Última actualización: 3 de agosto de 2026_

Documento de traspaso: si empezás una conversación nueva con Claude sobre este
proyecto, pedile que lea este archivo primero.

## Qué es

App interna de Grupo Oxford que reemplaza a Tability: OKRs, check-ins
semanales, tablero de dirección (LOM), control de rentabilidad (SOLOP),
informes ejecutivos y un asistente conversacional. **Está en producción.**

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
| Copia local | `C:\Users\pedro\Downloads\oxford-strategy-os` |

Cuentas de GitHub, Supabase y Vercel: usuario `pedro2003dcsd` /
`pedrogrupooxford@gmail.com`.

**Altas de usuarios:** desde la pantalla **Equipo** dentro de la app. Ver la
sección de accesos más abajo.

## Stack

- **Next.js 16** (App Router, React 19, Tailwind v4). Ojo: Next.js 16 tiene
  cambios respecto a versiones anteriores, `middleware.ts` se llama ahora
  `proxy.ts` y los `params` son `Promise`. Ver `AGENTS.md`.
- **Supabase** (Postgres + Auth). Local vía Docker Desktop + Supabase CLI.
- **Recharts** para gráficos, **@anthropic-ai/sdk** para IA.
- Sin librería de componentes. Se evaluó Shadcn y se descartó: los 25
  componentes usan Tailwind plano con tokens propios, y migrar rompería el
  diseño ya desplegado.

## Módulos

1. **Dashboard** (`/`) — Estrella Polar, filtros por trimestre y área, filtros
   rápidos "Mis Objetivos" y "Solo Alertas". Cada tarjeta muestra avatar del
   responsable, avance, contador de iniciativas y el bloqueo del último
   check-in. Al hacer clic abre un panel lateral con timeline de check-ins,
   iniciativas, detalle de horas y margen de SOLOP, y link de trabajo.
2. **Check-in Express** (`/checkin`) — inbox semanal, carga en menos de dos
   minutos, botones +/- rápidos, hitos e iniciativas tildables en el mismo
   acto, comentario de bloqueo obligatorio en amarillo/rojo. Tiene botón
   "Recordar" que arma el mensaje para WhatsApp y badge de cierre del viernes
   18:00.
3. **Alineación** (`/okrs`) — árbol Pilar → OKR Anual → OKR Trimestral → KR,
   con conteo de semáforo por pilar y por OKR anual, barra de avance
   consolidado y botón para alinear los trimestrales huérfanos.
4. **Modo LOM** (`/lom`) — solo desvíos por defecto, sparkline de 4 semanas,
   bloqueo citado textual, detección de dependencia cruzada entre áreas,
   compromisos con responsable y fecha límite, bloque de revisión de la LOM
   pasada, y copia del resumen con formato de Slack/WhatsApp.
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

**Degradación elegante:** Informes y Scout funcionan sin `ANTHROPIC_API_KEY`.
Responden por reglas sobre los mismos datos y lo avisan en pantalla.

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
perfil en la misma fila: email, nombre, responsable de OKRs y rol
(`direccion`, `lider`, `lectura`).

Decisiones que conviene no revertir sin pensarlo:

- El control vive en `proxy.ts`, así también cubre las rutas de API.
- **Ante un error de la base, deja pasar.** Un problema de infraestructura no
  puede dejar afuera al equipo entero. Lo que cierra la puerta es una
  respuesta correcta y vacía, no un error.
- No se puede borrar ni suspender la última cuenta de Dirección activa.
- Las funciones `esta_autorizado()` y `es_direccion()` son SECURITY DEFINER a
  propósito: si leyeran la tabla con RLS puesta, la política que las usa
  entraría en recursión.
- El índice del email es case-insensitive, porque Google puede devolver la
  dirección con otra capitalización.

## Base de datos

Migraciones en `supabase/migrations/`:

- `0001_init.sql` — pilares, okr_anual, okr_trimestral, key_results, hitos_kr,
  check_ins, trigger de sincronización, vistas, RLS y GRANTs.
- `0002_compromisos_lom.sql` — compromisos de destrabe.
- `0003_proyectos_solop.sql` — proyectos con horas, facturación y costos.
- `0004_kr_descendente.sql` — las vistas daban por cumplido un KR cuya métrica
  baja (plazo de cobro de 45 a 25 días). Ahora comparan según el sentido.
- `0005_iniciativas.sql` — tabla `iniciativas` y `link_trabajo` en key_results.
- `0006_compromisos_e_informes.sql` — responsable y fecha en compromisos, más
  la tabla `informes_guardados`.
- `0007_usuarios_autorizados.sql` — lista blanca y perfiles.

**Las migraciones se aplican a mano en la nube.** `supabase/aplicar-en-la-nube.sql`
junta 0004 a 0007 en un script idempotente listo para pegar en el SQL editor.
Ese archivo **no** incluye los datos: para eso se pega `supabase/seed.sql` por
separado. Se separaron porque mantener dos copias del mismo SQL las
desincronizó una vez.

## Pendientes y decisiones tomadas

- **Todo lo cargado es demo.** `supabase/seed.sql` tiene el set Q3 2026 que se
  usa en las presentaciones. **El riesgo más grande del proyecto no es
  técnico: es que nadie cargue los datos reales ni las horas de SOLOP cada
  semana.**
- **Margen SOLOP: carga manual.** El campo queda listo para integrar una API o
  export de SOLOP más adelante.
- **La Estrella Polar y SOLOP cuentan clientes con lógicas distintas**, así
  que muestran números diferentes (0/20 contra 1/20). Sin resolver.
- **Batistella no dispara "scope creep" en la etiqueta de horas** porque el
  umbral de esa etiqueta es 90% y está en 88%. El contador de la Torre sí lo
  cuenta, con el criterio nuevo de 75% de horas o margen bajo la meta.
- **El OKR de Cultura queda "sin alinear"** porque el pilar 3 no tiene OKR
  anual en el set de demo.
- **No hay tests automáticos.** Cada cambio se verifica a mano. Ya costó caro
  una vez: la migración de tema rompió cuatro modales y los desplegables.
- `npm audit` reporta vulnerabilidades en `postcss`/`sharp` que vienen dentro
  de `node_modules/next`. Arreglarlas con `--force` bajaría Next.js a la v9.

## Próximo paso acordado

**Mails de recordatorio automáticos.** Una tarea programada en Vercel que
corra una vez por día, mire quién tiene check-ins pendientes y le mande un
mail con sus KRs. Jueves como aviso y viernes a la mañana como último llamado.
Se apoya en `src/lib/rito-semanal.ts`, que ya arma el mensaje.

Se descartó WhatsApp automatizado: necesita la API de Business, aprobación de
Meta y costo por mensaje. El botón manual de Check-in ya cubre ese caso.

## Otros documentos

- `GUION-DEMO.md` — guion de 15 minutos para presentar al directorio, con
  checklist previo, preguntas esperadas y plan B.
- `GUIA-LOGIN-GOOGLE.md` — paso a paso para activar el ingreso con Google.
- `AGENTS.md` — aviso sobre los cambios de Next.js 16.

## Flujo de trabajo

1. Editar código en local.
2. `npx tsc --noEmit`, `npm run lint`, `npm run build`.
3. Probar en local. Necesita Docker Desktop abierto y `npx supabase start`.
4. `git push` y Vercel despliega solo en 1-2 minutos.

**Cuidado con el orden de despliegue:** si el código sale antes que la
migración esté aplicada en la nube, las pantallas que usan tablas nuevas
rompen. Correr el SQL primero.
