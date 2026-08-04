# Guion de demo: prototipo Performance Clientes

_Presentación del módulo nuevo. Duración: 12 minutos, más discusión._

**Esta demo es distinta a la del sistema en producción.** Aquella mostraba
algo terminado. Esta pide una decisión: si el módulo se construye o no.
Decilo al principio, así nadie evalúa la maqueta como si fuera un producto.

---

## La idea que tiene que quedar

Hoy Oxford Strategy OS responde bien una pregunta: **cómo venimos con nuestros
objetivos**. No responde la otra, que es la que paga las cuentas: **cómo está
cada cliente, y de quién es la responsabilidad cuando no está bien**.

El argumento entero se apoya en el contraste entre dos cuentas:

- **Eseka.** La agencia rinde 4.2 sobre 5 en performance digital, pero los
  objetivos comerciales del cliente están en 1.9. Hicimos bien nuestro
  trabajo y el resultado de negocio no aparece.
- **Panther.** 118 horas consumidas sobre 90 presupuestadas, margen 5%,
  $2.000 por hora. Ahí el problema es nuestro.

Son dos problemas opuestos que hoy se discuten igual, a fin de mes, con la
sensación de que "la cuenta no viene bien". La frase para cerrar:

> **La matriz separa lo que depende de nosotros de lo que no. Sin eso, toda
> conversación con un cliente termina en quién tiene la culpa.**

---

## Antes de empezar (5 minutos antes)

- [ ] Abrí el prototipo y **logueate**:
      https://oxford-strategy-21atii1q3-pedro2003dcsds-projects.vercel.app
- [ ] La primera vez pasa por Vercel y después por el login de la app. Hacelo
      antes, no en vivo.
- [ ] Dejá abierta en otra pestaña la app real, para comparar la navegación:
      https://oxford-strategy-os.vercel.app
- [ ] Probá Scout con una pregunta del módulo nuevo. Si responde bien, tenés
      el cierre asegurado.
- [ ] Zoom del navegador al 110% o 125%.
- [ ] Cerrá el cartel de Vercel Toolbar si aparece.

---

## 1. Por qué estamos acá (1 minuto)

**No abras nada todavía.** Planteá el problema primero.

**Qué decir:** "El sistema que ya usamos nos dice si cumplimos nuestros
objetivos. Lo que no nos dice es cómo está cada cuenta por dentro, ni cuánto
nos cuesta sostenerla. Eso hoy vive en la cabeza de cada PO y en planillas
sueltas. Les quiero mostrar cómo se vería si estuviera acá adentro."

**Aclará el estado:** "Esto es una maqueta. Los datos son reales, la
funcionalidad no está construida. La idea es decidir si vale la pena
construirla."

---

## 2. La navegación nueva (2 minutos)

**Pantalla:** el prototipo, recién abierto.

**Qué decir:** "Con tres módulos la barra de arriba alcanzaba. Con ocho, no."

**Qué mostrar:**

1. Tocá el **☰**. Se despliega el menú con las tres categorías.
2. Señalá la agrupación: **OKRs y Ritos** es la operación diaria,
   **Performance Clientes** es lo nuevo, **Control y Dirección** es la LOM y
   el cierre.
3. Entrá a cualquier pantalla y mostrá que el ítem activo queda marcado en
   magenta con la barra vertical.
4. Tocá el **📌** para fijar el menú y contá que la preferencia se recuerda.

Si alguien pregunta por qué cambiar la navegación: "porque el módulo nuevo no
entra arriba, y porque agrupado se entiende para qué sirve cada pantalla".

---

## 3. Cartera de Clientes: los tres niveles (3 minutos)

**Pantalla:** Performance Clientes → Cartera de Clientes. Empezá en
**Batistella**.

**Qué decir:** "Cada cuenta tiene la misma estructura de tres niveles. No es
un tablero libre: es el mismo formato para todos, que es lo que permite
compararlas."

**Qué mostrar, en este orden:**

1. **Arriba, la foto de SOLOP:** horas al 88%, margen 54%, rendimiento por
   hora. "Esto ya lo teníamos, pero estaba en otra pantalla."
2. **Nivel 1:** tickets vendidos, 24.800 de 40.000. "Este es el número que
   justifica el fee. Es el único que le importa al cliente."
3. **Nivel 2:** el ROAS en 4,9x contra una meta de 7,8x. "Acá se explica por
   qué el Nivel 1 no llega."
4. **Nivel 3:** entregables de Arte a tiempo, 60%. "Y acá está la causa
   concreta, que es la misma que aparece en el check-in de Ayelén."

**El momento que conecta todo:** "Fíjense que este 60% es el mismo bloqueo
que ya vieron en el tablero de OKRs. El dato se carga una vez y aparece donde
tiene que aparecer."

5. Tocá **➕ Vincular a KR del Trimestre** y mostrá el aviso de simulación.
   "Así se ataría cada métrica del cliente a nuestros objetivos internos."

---

## 4. El squad y los ritos (2 minutos)

**Pantalla:** la misma ficha, bajá a **Composición del Squad & Ritos**.

**Qué decir:** "Hoy, si alguien pregunta quién trabaja en Batistella, la
respuesta depende de a quién le preguntes."

**Qué mostrar:**

- El PO destacado en magenta, los chapter leads, y los nueve ejecutores.
- Las píldoras de ceremonias: Weekly Quincenal, Review Quincenal, Retro
  Mensual.
- Cambiá el filtro de arriba a **Agostina** y mostrá que le quedan tres
  cuentas: Eseka, Blangino y Conquistadores. "Esto también sirve para mirar
  la carga de cada PO."

---

## 5. Kata Board: el corazón del módulo (2 minutos)

**Pantalla:** Performance Clientes → Kata Board.

**Qué decir:** "Toyota Kata es simple: dónde estamos, dónde queremos estar,
qué nos frena, y qué estamos probando para destrabarlo. Una card por cuenta."

**Qué mostrar:**

1. La card de **Batistella**: la condición objetivo, el obstáculo citado
   textual, y el siguiente paso con nombre y fecha.
2. Pestaña **PDCA**: los experimentos, con uno ya medido. Señalá el
   aprendizaje: "el CPL bajó 9%, menos de lo esperado". "Esto es lo que hoy
   se pierde: probamos cosas y no queda registro de qué funcionó."
3. Pestaña **Rentabilidad**: ordenada de peor a mejor. **Panther arriba de
   todo, en rojo, a $2.000 la hora.**

**La frase:** "Panther factura. El problema no es que no facture: es que cada
hora que le metemos vale una décima parte de lo que vale una hora de Eseka."

---

## 6. KPIs Clientes: el cierre del argumento (2 minutos)

**Pantalla:** Performance Clientes → KPIs Clientes → seleccioná **Eseka**.

Este es el momento más fuerte. No lo apures.

**Qué mostrar:**

1. **La matriz de valoración**, los tres bloques:
   - Objetivos Comerciales, responsabilidad del cliente: **1.9**
   - Performance Digital, responsabilidad de la agencia: **4.2, Alta
     Performance**
   - Relacionamiento, compartido: **3.8**
2. **Los KPIs de calidad:** aprobación en primera presentación 78%,
   consistencia de marca 90%, CTR 3,2%. Los tres en verde.
3. **La tendencia:** marzo 2.0, abril 1.5, mayo 1.9.

**Qué decir:** "Miren lo que dice esta pantalla. Nuestro trabajo está en 4.2
y en verde en los tres indicadores de calidad. El resultado comercial está en
1.9. Esa conversación con el cliente hoy la damos sin datos, y termina en
sensaciones."

4. Tocá **📊 Ver Reporte Live en Looker Studio** desde la ficha de Eseka.
   "Y el detalle fino sigue viviendo donde ya está, no lo duplicamos."

---

## 7. Scout AI, el cierre (1 minuto)

**Pantalla:** Scout AI, o el botón flotante desde donde estés.

Preguntá en vivo, sin libreto:

> ¿Por qué Eseka tiene buena performance digital pero malos objetivos
> comerciales?

> ¿Quién compone el squad de Conquistadores?

**Qué decir:** "Todo lo que vieron es consultable en castellano. No hace falta
saber en qué pantalla está cada cosa."

---

## Preguntas que van a hacer

**"¿Esto ya funciona?"**
No. Es una maqueta con datos reales. Los botones muestran un aviso en vez de
guardar. Lo que está construido de verdad es la navegación.

**"¿Cuánto tarda hacerlo?"**
Alrededor de dos jornadas de trabajo, más el tiempo de cargar la información
de las seis cuentas.

**"¿Por qué no lo hicieron funcionando directamente?"**
Porque antes hay que resolver una decisión de fondo. Hoy SOLOP guarda el
cliente como texto suelto. Si armamos este módulo sin unificar eso primero,
terminamos con dos listas de clientes que se desincronizan.

**"¿Quién carga todo esto?"**
El PO de cada cuenta, en la Review. La matriz de valoración se completa una
vez por mes, no todas las semanas.

**"¿No es mucha carga de datos?"**
La mitad ya se carga en otro lado: las horas y el margen salen de SOLOP, y
los bloqueos del check-in semanal. Lo nuevo es la matriz mensual y las
condiciones objetivo.

**"¿Se puede ver un cliente sin entrar al sistema?"**
Sí, con el botón Exportar Expediente sale en PDF con la marca, listo para
mandar.

---

## Lo que conviene NO prometer

- No digas que está listo para usar la semana que viene.
- No prometas integración automática con SOLOP ni con Looker: hoy es carga
  manual y un link.
- No muestres los botones de acción esperando que hagan algo. Si los tocás,
  aclará que el aviso es a propósito.

---

## El pedido final

Cerrá con una decisión concreta, no con "¿qué les parece?".

1. **¿Construimos el módulo, sí o no?** Es lo único que se decide hoy.
2. Si va: **quién es el dueño de la carga** de cada cuenta, y con qué
   frecuencia.
3. Si va: **arrancamos por unificar la tabla de clientes con SOLOP**, que es
   el cimiento. Las pantallas vienen después.

Si la respuesta es que no, tampoco se pierde nada: la rama queda guardada y
producción nunca se tocó.
