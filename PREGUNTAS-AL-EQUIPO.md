# Preguntas y propuestas para el equipo

_Agosto de 2026. Para conversar después de las pruebas internas._

Esto sale de haber construido el módulo y de haber mirado el código de punta
a punta. Está separado en cuatro partes: lo que necesito que decidan ustedes,
lo que sé que está mal, lo que agregaría, y lo que dejaría como está.

---

## 1. Decisiones que no puedo tomar yo

Estas dependen de cómo trabajan, no de cómo está hecha la app.

### El campo "responsable" de la lista de accesos

Cada persona tiene un **nombre** y además un **alias** con el que figura en
los OKRs. Desde que los objetivos se vinculan por id, ese alias ya no cumple
ninguna función técnica. Dos personas incluso pueden tener el mismo alias sin
que nada avise.

**¿Lo borramos y usamos el nombre en todos lados?** Simplifica bastante. El
único motivo para conservarlo sería que alguien figure en los objetivos con
un nombre distinto del que usa para entrar.

### La estructura de tres niveles de métricas

Nivel 1 objetivo de negocio, nivel 2 salud del funnel, nivel 3 micro-KPIs.
Está igual para las seis cuentas.

**¿Le sirve a las seis, o hay alguna donde el molde queda forzado?** Si a dos
cuentas les sobra un nivel, conviene saberlo antes de que el equipo empiece a
llenarlo por obligación.

### El ciclo PDCA del Kata

El sistema viejo tenía cuatro estados: planificado, en curso, medido y
cerrado. Al migrar quedaron planificado, en curso, validado y descartado.
**Se perdió "medido"**, que era el momento de mirar el resultado antes de
concluir.

**¿Lo usaban de verdad, o en la práctica un experimento pasa de en curso a
cerrado?** Si lo usaban, lo devuelvo.

### La evaluación 360

Hoy nada la pide. Alguien tiene que acordarse de entrar y cargarla.

**¿Cada cuánto debería completarse y quién es el dueño de que pase?** Si es
trimestral, se puede avisar igual que el check-in.

### Los compromisos de la LOM

La pizarra muestra los abiertos y marca los vencidos.

**¿Se revisan de verdad la semana siguiente?** Si en la práctica quedan
colgados, el problema no es la pantalla y conviene decirlo antes de agregarle
funciones.

---

## 2. Cosas que sé que están mal

Estas las puedo arreglar. Solo necesito que digan en qué orden.

### El cliente se escribe a mano en SOLOP

El campo sigue siendo texto libre. La app ahora resuelve el cliente sola,
pero un error de tipeo como "Batistela" o un espacio de más **crea una cuenta
nueva en silencio**. Ya pasó una vez: teníamos "Batistella" y "Batistella
(Bati Off)" como dos cuentas distintas.

Propongo cambiarlo por un desplegable con opción de crear explícitamente.
Media jornada.

### El rol Solo lectura muestra botones que no funcionan

Restringe bien, pero los botones de guardar siguen a la vista. Hay un aviso
arriba de todo, aunque igual se puede abrir un formulario y llenarlo para
recién ahí enterarse. Peor: tildar un compromiso mueve la tilde y la devuelve
al recargar.

Propongo esconder los controles de escritura para ese rol. Media jornada.

### La Estrella Polar y SOLOP no dicen lo mismo

Muestran distinta cantidad de clientes porque cuentan con criterios
diferentes. Viene de antes de este trabajo.

**Necesito que definan cuál es el criterio bueno** y lo dejo igual en los dos
lados. Es media hora una vez que esté decidido.

### SOLOP no tiene historial de cambios

Los OKRs y los Key Results registran quién cambió qué. **Los márgenes, las
horas y la facturación no.** Son los datos más sensibles de la app y son los
únicos sin rastro.

Propongo extender la auditoría que ya existe. Una jornada.

### Los tests cubren poco

Hay treinta casos, todos de lógica pura: el cálculo de márgenes y el registro
de ediciones. Los formularios y las pantallas se siguen verificando a mano.

No es urgente, pero cada cosa que agreguemos lo empeora.

---

## 3. Cosas que agregaría

Ideas que aparecieron construyendo. Ninguna está empezada.

### Avisar cuando una cuenta se pone en riesgo

Hoy hay que entrar a mirar. Si el margen de un cliente cruza para abajo el
65%, o si las horas pasan el 75%, **eso debería buscar a la persona en vez de
esperarla**. Es el mismo mecanismo que los mails de recordatorio del
check-in, que ya está en el plan.

### Historial del estado de un cliente

Se ve que una cuenta está en riesgo, pero no desde cuándo ni cuántas veces
entró y salió de ese estado. Para la conversación de renovación eso importa
más que la foto de hoy.

### Cerrar el trimestre

No hay un momento de cierre. Los OKRs de Q3 van a seguir ahí en octubre.
Habría que poder cerrar un trimestre, congelarlo, y arrancar el siguiente
copiando lo que sigue vigente.

### Selector de personas en el resto de los campos

Iniciativas, compromisos de la LOM y condiciones del Kata **siguen con el
responsable escrito a mano**. Es el mismo problema que ya arreglamos en los
OKRs, con las mismas consecuencias.

### Comparar clientes

Las fichas se miran de a una. Ver las seis cuentas juntas en una sola tabla,
ordenables por margen o por rendimiento por hora, ayudaría a decidir dónde
poner el foco.

---

## 4. Lo que dejaría como está

Para no gastar reunión en esto.

- **Que cinco cuentas digan "sin horas cargadas en SOLOP"** es correcto. No
  se inventaron números financieros. Se completa cuando alguien cargue el
  proyecto.
- **Que el valor y la meta de las métricas sean texto** es a propósito. Las
  metas reales son rangos y múltiplos como "> 7,8x" o "$8.000 a $20.000". El
  número comparable es el progreso.
- **Que medio squad no tenga cuenta en la app** está bien. Las agencias de
  pauta y los proveedores externos se cargan solo con el nombre, sin ocupar
  un lugar en la lista de accesos.
- **Que la Matriz de Valoración no se edite desde el formulario** de la 360.
  Se conserva tal cual estaba. Si hace falta editarla, es otra conversación.

---

## Lo que más me interesa escuchar

Menos las funciones que faltan y más esto: **qué pantalla abrieron y
cerraron sin usar**. Una función que nadie mira cuesta lo mismo de mantener
que una que se usa todos los días, y es más fácil sacarla ahora que dentro de
seis meses.
