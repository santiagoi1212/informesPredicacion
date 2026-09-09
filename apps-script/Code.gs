/**
 * Proxy de solo lectura para las planillas de "Publicadores por Grupo".
 *
 * Qué hace:
 *   Expone un único endpoint web (doGet) que, dado el id de una planilla y el
 *   gid de una hoja, devuelve su contenido como JSON. Las planillas NO
 *   necesitan estar compartidas públicamente: este script corre con los
 *   permisos de la cuenta de Google que lo despliega (vos), así que basta con
 *   que esa cuenta tenga acceso de lectura a las 6 planillas (las 5 de
 *   formulario + el padrón).
 *
 *   Solo responde para los IDs de la lista blanca ALLOWED_SHEETS de abajo —
 *   así el endpoint no puede usarse para leer otras planillas tuyas aunque
 *   alguien descubra la URL.
 *
 * Cómo desplegarlo (una sola vez):
 *   1) Andá a https://script.google.com/ → "Proyecto nuevo".
 *   2) Borrá el contenido de Code.gs y pegá este archivo completo.
 *   3) Arriba a la derecha: "Implementar" → "Nueva implementación".
 *   4) Tipo: "Aplicación web".
 *      - Ejecutar como: "Yo (tu cuenta)"
 *      - Quién tiene acceso: "Cualquier usuario" (así index.html puede
 *        llamarlo sin que el visitante inicie sesión en Google). Si tu cuenta
 *        es de Google Workspace y preferís restringirlo, podés elegir
 *        "Cualquier usuario de [tu organización]" — pero entonces el
 *        navegador que abra index.html debe estar logueado con una cuenta de
 *        esa organización, o la carga fallará.
 *   5) "Implementar" → copiá la URL que termina en /exec.
 *   6) Pegá esa URL como API_URL en index.html (buscá "REEMPLAZA_CON_TU_URL").
 *   7) Cada vez que modifiques este script, tenés que crear una "Nueva
 *      implementación" (o editar la implementación existente) para que los
 *      cambios se publiquen — guardar el archivo solo no alcanza.
 */

// IDs de las planillas autorizadas: las 5 de formulario + la planilla
// padrón (Grupo/Nombre). No agregues otras sin revisar qué datos vas a exponer.
var ALLOWED_SHEETS = {
  '1-ebPFUI2Ko4z_hRTcYX_RtXFyOpCMnu-LZTIvfSTULY': true,
  '1DuBmCR4otIfwdkz6u69KxajK8MBldnkaKVQBDwqOMQk': true,
  '1rnH1jBASvggOBdlbSrMENJCEI5XD1eq2Uvn7soJMUL4': true,
  '1Tz-YTMSZvOsqhq3RRNAaRd0OvoRoWfzGLdEXqcYw5io': true,
  '1I5EV4UDiMUU9qb9tvG0K0PgoyqQecHC1IN3nstk20-o': true,
  '10iAtM2jSdqSOZ6ot0u-OILEm58BrO9dbnK_Lp4ks3qk': true // padrón (Grupo/Nombre)
};

function doGet(e) {
  var params = (e && e.parameter) || {};
  var id = params.id;
  var gid = params.gid;

  if (!id || !ALLOWED_SHEETS[id]) {
    return jsonOutput({ error: 'Planilla no autorizada (revisá ALLOWED_SHEETS en Code.gs)' });
  }

  // Cache de 3 minutos por hoja: si index.html vuelve a pedir el mismo grupo
  // poco después (recarga, reintento), se responde al toque sin releer la
  // planilla. No evita fallas de conexión, pero acorta el tiempo de
  // respuesta y baja la carga sobre las 5 planillas.
  var cacheKey = 'sheet_' + id + '_' + (gid || 'default');
  var cache = CacheService.getScriptCache();
  var cached = cache.get(cacheKey);
  if (cached) return jsonOutput(JSON.parse(cached));

  try {
    var ss = SpreadsheetApp.openById(id);
    var sheet = null;
    if (gid) {
      var sheets = ss.getSheets();
      for (var i = 0; i < sheets.length; i++) {
        if (String(sheets[i].getSheetId()) === String(gid)) { sheet = sheets[i]; break; }
      }
    }
    if (!sheet) sheet = ss.getSheets()[0];

    var values = sheet.getDataRange().getValues();
    if (!values.length) return jsonOutput({ header: [], rows: [] });

    var header = values[0].map(function (v) { return v == null ? '' : String(v); });
    var rows = values.slice(1).map(function (row) {
      return row.map(function (v) {
        if (Object.prototype.toString.call(v) === '[object Date]') {
          return Utilities.formatDate(v, Session.getScriptTimeZone(), 'dd/MM/yyyy HH:mm:ss');
        }
        return v;
      });
    });
    var result = { header: header, rows: rows };
    try {
      // CacheService rechaza valores de más de 100KB por clave; si la
      // planilla creciera mucho, simplemente no cacheamos esa respuesta.
      cache.put(cacheKey, JSON.stringify(result), 180);
    } catch (cacheErr) { /* seguimos sin cache, no es crítico */ }
    return jsonOutput(result);
  } catch (err) {
    return jsonOutput({ error: 'Error leyendo la planilla: ' + err });
  }
}

function jsonOutput(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
