# Guía de pruebas: recorrido completo

_Para el equipo de Grupo Oxford. Agosto de 2026._

Esta guía recorre la app entera siguiendo el camino que hace un dato desde que
alguien lo carga hasta que aparece en el tablero del directorio. Cada bloque
te dice **dónde poner el dato** y **dónde tiene que aparecer después**.

Lleva unos 40 minutos hacerla completa. Se puede repartir: los bloques están
ordenados pero son bastante independientes.

**La app está en https://oxford-strategy-os.vercel.app**

Estás probando sobre datos reales, no sobre una copia. Podés cargar y corregir
con confianza, pero evitá borrar cosas que no cargaste vos.

---

## Antes de empezar

1. Entrá con tu cuenta de Grupo Oxford, con mail y contraseña o con Google.
2. Abajo del menú lateral tiene que figurar tu nombre. Si dice otro, avisá
   antes de seguir.
3. Abrí el menú con el botón **☰** de arriba a la izquierda. Vas a ver tres
   categorías en acordeón. Ahí está todo.

Si podés, hacé la mitad del recorrido en modo claro y la otra mitad en oscuro.
La app sigue el tema de tu sistema operativo, así que se cambia desde la
configuración de tu compu o del navegador.

---

## Bloque 1: el check-in semanal

Es el punto de entrada de casi todo lo demás. Lo que cargues acá se propaga a
cuatro pantallas distintas.

**Dónde se carga:** menú → **Check-in Express**.

1. Elegí uno de tus Key Results.
2. Movele el valor con los botones **+ / −**, o escribilo directo.
3. Poné el semáforo en **amarillo o rojo**.
4. Escribí un bloqueo concreto, como lo dirías en la reunión. Por ejemplo:
   "Falta la aprobación del cliente para salir con la campaña". El comentario
   es obligatorio cuando el semáforo no está en verde, y es a propósito: un
   amarillo sin explicación no sirve en la LOM.
5. Guardá.

**Dónde tiene que aparecer:**

- **Dashboard** (el ícono de la casa, o el logo de arriba). La tarjeta de ese
  KR tiene que mostrar el valor nuevo, el color que elegiste y tu texto de
  bloqueo con el ícono ⚠️.
- **Ficha del KR.** Hacé clic en el título del KR. Abajo, en "Historial de
  check-ins", tiene que estar tu carga con tu nombre y la fecha de hoy.
- **Modo LOM.** El KR tiene que aparecer en la lista, porque por defecto
  muestra solo los desvíos. Tu bloqueo va citado textual, entre comillas.
- **Pizarra de LOM.** Mismo KR en la primera columna, "Desvíos de la semana".

**Si el bloqueo no aparece en la LOM**, fijate primero que el semáforo haya
quedado en amarillo o rojo. En verde no es un desvío, así que no se muestra.

---

## Bloque 2: compromisos de destrabe

**Dónde se carga:** menú → **Modo LOM**. Buscá el KR del bloque anterior y
agregale un compromiso.

1. Escribí qué se va a hacer para destrabarlo.
2. Elegí un responsable. Es obligatorio, porque un compromiso sin dueño no se
   cumple.
3. Ponele fecha límite. Para probar el aviso de vencido, ponele una fecha de
   la semana pasada.

**Dónde tiene que aparecer:**

- En la misma tarjeta del KR dentro de la LOM.
- En la **Pizarra**, columna del medio, "Compromisos abiertos". Si le pusiste
  fecha pasada, la tarjeta se pone ámbar y dice **⚠ Vencido**.
- Tildá el compromiso como cumplido. Tiene que desaparecer de la columna,
  porque ahí van solo los abiertos.

---

## Bloque 3: actas de directorio

Esto es nuevo. Antes las actas vivían en un documento aparte y no se podían
mirar al lado de los desvíos que las originaron.

**Dónde se carga:** menú → **Modo LOM** → botón **🧱 Pizarra** arriba → en la
tercera columna, **➕ Acta**.

1. Ponele fecha y título, por ejemplo "LOM del 7 de agosto".
2. En el contenido escribí qué se decidió, qué quedó pendiente y quién lo
   lleva.

**Dónde tiene que aparecer:** en la tercera columna, ordenada por fecha, con
tu nombre abajo como quien la tomó. Probá también editarla y borrarla.

---

## Bloque 4: editar objetivos y ver quién cambió qué

También es nuevo. Ahora se puede corregir una meta o un texto sin borrar el
registro, y queda asentado quién lo hizo.

**Dónde se carga:** menú → **Alineación Estratégica**.

1. Desplegá un pilar hasta ver un OKR trimestral.
2. Al lado del título hay un botón **Editar**. Cambiale el título o el
   responsable y guardá.
3. Hacé lo mismo con un Key Result, con el botón **Editar** de su fila.
   Cambiale la meta.

**Dónde tiene que aparecer:**

- Debajo de la tarjeta que editaste, en gris chiquito: **"Editado el 7 de
  agosto por [tu nombre]"**.
- En la **ficha del KR**, en la sección "Historial de ediciones", tiene que
  estar el detalle: qué campo cambió, con el valor viejo tachado y el nuevo al
  lado.

**Prueba importante:** volvé a abrir el formulario y guardá **sin cambiar
nada**. No tiene que registrarse ninguna edición nueva. Si aparece una, avisá,
porque significa que el historial se está ensuciando solo.

---

## Bloque 5: OKRs colaborativos

Para los objetivos que son de varias áreas a la vez, como "Vender más Oxford"
o "Eficiencia operativa global".

**Dónde se carga:** menú → **Alineación Estratégica** → **Editar** en un OKR
trimestral.

1. Tildá **Objetivo colaborativo**. Se abren las áreas.
2. Elegí **dos o más**. Con una sola tiene que rechazarte el guardado y
   explicarte por qué. Probá ese caso a propósito.
3. Guardá con dos áreas.

**Dónde tiene que aparecer:**

- En Alineación, al lado del área, un chip **🤝 Colaborativo**.
- En menú → **OKRs Colaborativos**, la tarjeta del objetivo con sus áreas, el
  avance consolidado y sus Key Results.
- Ahí mismo, sumale un referente con **+ Referente**: elegís persona y área.
  Tiene que aparecer con su avatar. El botón **×** lo quita.

---

## Bloque 6: la rentabilidad, de SOLOP a la ficha del cliente

Este es el bloque más importante, porque cruza dos módulos que antes no se
hablaban. Vale la pena hacerlo despacio.

**Dónde se carga:** menú → **SOLOP / Rentabilidad**.

1. Elegí un cliente y cargale horas presupuestadas, horas consumidas,
   facturación y costo operativo.
2. Guardá y mirá el margen que calcula la fila.
3. Si la fila permite asociar un Key Result, asociale uno.

**Dónde tiene que aparecer:**

- **Cartera de Clientes**, en la ficha de ese cliente. Los tres recuadros de
  arriba, "Horas consumidas", "Margen actual" y "Rendimiento por hora", tienen
  que mostrar los números que acabás de cargar. **No se cargan a mano en
  ningún lado: salen de SOLOP.**
- **Kata Board** → pestaña **💰 Rentabilidad**. El cliente tiene que aparecer
  en la tabla, y si el margen quedó abajo de 65% dice "Rentabilidad crítica".
- **Kata Board**, los cuatro números de arriba. "Squads en riesgo" tiene que
  subir si dejaste el margen bajo o las horas arriba del 75%.
- Si asociaste un KR, su tarjeta en el Dashboard muestra el margen real.

**Prueba clave:** cambiá las horas consumidas en SOLOP y volvé a la Cartera.
El porcentaje tiene que haber cambiado ahí también. Si no cambia, es un
problema y hay que reportarlo.

---

## Bloque 7: ficha del cliente

**Dónde se carga:** menú → **Cartera de Clientes**.

Las seis cuentas ya vienen cargadas con su squad y sus métricas. Lo que hay
que probar es corregirlas y sumar cosas.

1. **Sumá un integrante al squad.** Probá los dos casos:
   - Alguien del equipo que tiene cuenta en la app: elegilo en el desplegable
     "Cuenta en la app".
   - Un proveedor externo, tipo una agencia de pauta: dejá el desplegable en
     "Sin cuenta / proveedor externo" y cargá solo el nombre. **Este caso
     tiene que funcionar**, es medio squad de varias cuentas.
2. **Agregá una métrica** en cada uno de los tres niveles. El valor y la meta
   son texto libre a propósito, así podés escribir "> 7,8x" o "$8.000 a
   $20.000". El progreso sí es un número de 0 a 100 y es lo que mueve la
   barra.
3. **Editá el cliente** con el botón al lado del nombre: fee, estado,
   ceremonias y el link al Looker Studio.

**Dónde tiene que aparecer:**

- El integrante nuevo en "Composición del Squad", en Liderazgo si es PO o
  Chapter Lead, o en Equipo ejecutor si no.
- Si cargaste un PO nuevo, el filtro **Squad / PO** de arriba tiene que
  ofrecerlo.
- La métrica en su nivel, con la barra pintada según el progreso: verde arriba
  de 85, ámbar entre 60 y 85, roja abajo.
- Las ceremonias como etiquetas 🔁 al pie del squad.

---

## Bloque 8: Kata Board

**Dónde se carga:** menú → **Kata Board**.

1. En **📍 Condición Objetivo**, creá una: cliente, qué queremos lograr, la
   métrica, el obstáculo actual y el siguiente paso con nombre y fecha.
2. En **🔄 PDCA**, creá un experimento colgado de esa condición. La hipótesis
   es obligatoria, porque es lo que el experimento pone a prueba.
3. Cambiale el estado desde el desplegable de la tarjeta, sin abrir el
   formulario. Es el gesto más frecuente del Kata.

**Dónde tiene que aparecer:**

- La condición como tarjeta, con el obstáculo en rojo y el siguiente paso en
  magenta.
- Al pie de esa tarjeta, el contador **🔄 N experimentos en curso**. Tiene que
  cambiar cuando movés un experimento a Validado o Descartado.

**Ojo con los estados:** los experimentos que ya venían cargados se
convirtieron desde el sistema viejo, que usaba otros nombres. Si alguno quedó
en "Validado" pero en realidad se descartó, corregilo. Es esperable que haya
algunos así.

---

## Bloque 9: KPIs Clientes

**Dónde se carga:** menú → **KPIs Clientes** → **✏️ Editar evaluación**.

1. Elegí cliente y período, por ejemplo "Q3 2026".
2. Cargá criterios con puntaje de 1 a 5 en los tres bloques: cómo nos califica
   el cliente, cómo calificamos nosotros al cliente, y los objetivos
   comerciales.
3. Cargá al menos dos meses en **Tendencia mensual**, del más viejo al más
   nuevo.

**Dónde tiene que aparecer:**

- Los tres bloques con su promedio arriba a la derecha, en verde, ámbar o rojo
  según el puntaje.
- Las estrellas de cada criterio.
- El gráfico de tendencia, con el cartel **▲** o **▼** comparando el último
  mes contra el anterior.

**La Matriz de Valoración no se edita desde este formulario.** Si el cliente
ya la tenía, se conserva tal cual. Es a propósito.

---

## Bloque 10: informes y Scout

Cierra el círculo. Todo lo que cargaste en los bloques anteriores tiene que
poder salir por acá.

**Informes:** menú → **Informes Automáticos**.

1. Generá el informe **LOM semanal**.
2. Leelo buscando el bloqueo que escribiste en el Bloque 1. Tiene que estar.
3. Probá los botones de PDF y de Markdown.

**Scout AI:** menú → **Scout AI**, o el botón flotante que está en todas las
pantallas.

Preguntale cosas que solo puede saber si leyó lo que cargaste:

- "¿Cómo viene [nombre del cliente que tocaste]?"
- "¿Qué bloqueos hay esta semana?"
- "¿Qué cuentas están en riesgo de rentabilidad?"
- "¿Quién es el PO de [cliente]?"

Las respuestas tienen que coincidir con lo que ves en las pantallas. Si Scout
dice un número distinto al que muestra la Cartera, eso sí es un problema y hay
que reportarlo.

---

## Lo que NO es un error

Antes de reportar algo, revisá esta lista. Estas cosas están así a propósito o
ya las tenemos anotadas.

- **Cinco de las seis cuentas dicen "sin horas cargadas en SOLOP".** Solo
  Batistella y Ueno tienen proyecto cargado. Los datos financieros no se
  inventaron: los carga el equipo en la Torre de Control.
- **La Estrella Polar del Dashboard y SOLOP muestran números distintos de
  clientes.** Cuentan con criterios diferentes. Está sin resolver y lo sabemos.
- **El OKR de Cultura figura "sin alinear".** Le falta el OKR anual del pilar
  3.
- **Scout puede avisar que respondió "por reglas".** Pasa cuando no está
  configurada la clave de IA. Responde igual, con los mismos datos, pero sin
  redacción.
- **Los números de las seis cuentas son los de la presentación al directorio.**
  Si están viejos, corregilos desde las pantallas. Para eso están los
  formularios.

---

## Si encontrás algo raro

Mandá esto, que es lo que hace falta para poder arreglarlo rápido:

1. **En qué pantalla estabas** y qué botón tocaste.
2. **Qué esperabas que pasara** y qué pasó en su lugar.
3. **Captura de pantalla.** Vale más que cualquier descripción.
4. **Si estabas en modo claro u oscuro**, y en compu o celular.
5. Si cargaste un dato, **cuál era**, así se puede reproducir.

Lo más útil que podés reportar son dos cosas: **un número que no coincide
entre dos pantallas**, y **algo que guardaste y después no aparece**. Esos dos
casos son los que más importan.
