# Publicadores por Grupo — Informe Mensual

Widget autocontenido (`index.html`) que arma la vista por grupo a partir de un
**padrón maestro** (planilla con columnas Grupo/Nombre) y las respuestas de
los 5 formularios mensuales, muestra quién falta registrarse en el mes en
curso y grafica la situación (Precursor Regular / Precursor Auxiliar /
Publicador) por grupo y en total. Pensado para insertarse luego en un portal
más grande (ver comentarios al principio de `index.html`).

## Cómo arma los grupos

El **padrón** (columnas `Grupo` y `Nombre`) es la fuente de verdad de a qué
grupo pertenece cada persona — no las 5 planillas de formulario. Las
respuestas de las 5 planillas se juntan todas y cada nombre se empareja
contra el padrón para saber a qué grupo asignarlo. Esto es a propósito:
en la práctica los grupos se reorganizan de vez en cuando y la gente sigue
llenando el mismo formulario de siempre aunque haya cambiado de grupo, así
que agrupar "por planilla" da resultados incorrectos — agrupar "por lo que
dice el padrón" es lo correcto.

## Puesta en marcha (una sola vez)

Las 6 planillas (padrón + 5 formularios) se mantienen **privadas**; los datos
se leen a través de un proxy propio en Google Apps Script que corre con tu
cuenta.

1. Andá a [script.google.com](https://script.google.com/) → **Proyecto nuevo**.
2. Reemplazá el contenido de `Code.gs` por el de [apps-script/Code.gs](apps-script/Code.gs) de esta carpeta.
3. **Implementar → Nueva implementación → Aplicación web**.
   - Ejecutar como: **Yo** (tu cuenta, la que ya tiene acceso a las 6 planillas).
   - Quién tiene acceso: **Cualquier usuario** (para que `index.html` pueda
     leerlo sin pedirle login a quien lo abra). Si tu cuenta es de Google
     Workspace y preferís restringirlo a tu organización, podés probar esa
     opción, pero el navegador que abra `index.html` va a necesitar sesión
     iniciada con una cuenta de esa organización.
4. Copiá la URL que termina en `/exec`.
5. Abrí `index.html`, buscá la constante `API_URL` (o definí
   `window.PUBLICADORES_API_URL` antes de cargar el script si lo estás
   embebiendo en otro portal) y pegá ahí tu URL.
6. Abrí `index.html` en el navegador. Si algo no carga, mirá el aviso que
   aparece arriba de las tarjetas — indica si falló el padrón, alguna
   planilla de formulario, o si hay nombres sin coincidencia.

Cada vez que edites `Code.gs`, tenés que crear una nueva implementación (o
"Administrar implementaciones" → editar) para que el cambio se publique.

## Qué asume la lógica

- **Grupos y quién pertenece a cada uno**: salen 100% del padrón (columna
  `Grupo`). Si el padrón no carga, no se puede armar ninguna tarjeta.
- **Coincidencia de nombres** entre las planillas de formulario y el padrón:
  primero exacta (ignorando acentos/mayúsculas), después por "nombre
  acortado" (p. ej. "Teresa Zulueta" contra "Teresa Zulueta de Cabrera", o
  "Carlos Fernández" contra "Carlos Esteban Fernández Zamora" — con un único
  candidato posible), y por último tolerancia a 1-4 letras de diferencia por
  tipeo. Si ninguna estrategia encuentra una coincidencia razonable, el
  nombre queda en la lista de "sin coincidencia" (se muestra como aviso en la
  pantalla) — no se arriesga a asignarlo a un grupo por las dudas.
  **Los apodos no se resuelven solos** (por ejemplo "Bety" vs "Beatriz"): si
  aparecen en el aviso de "sin coincidencia", lo más simple es escribir el
  padrón con el mismo nombre que la persona usa al llenar el formulario.
- **Situación**: se agrupan "Precursor Auxiliar 15 horas" y "... 30 horas" en
  un solo bucket "Precursor Auxiliar" para el gráfico.
- Filas del padrón como "No publicadora" se ignoran (no son una persona a
  trackear); un nombre con un sufijo tipo "- menor" se matchea solo por la
  parte antes del guion pero se muestra completo.
- Los nombres mostrados en cada tarjeta ("Grupo 1"…"Grupo 5" por defecto, uno
  por cada número de grupo que aparezca en el padrón) son editables haciendo
  clic y se guardan en el navegador (localStorage).

## Archivos

- `index.html` — la app completa (HTML + CSS + JS), lista para embeber.
- `apps-script/Code.gs` — el proxy de Apps Script, con instrucciones de
  despliegue en su propio encabezado.
