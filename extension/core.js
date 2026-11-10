/* Lógica compartida por la web y la extensión (y por los tests con Node).
   El servidor MCP tiene el equivalente en Python (competencias_mcp/core.py);
   ambos se validan contra los mismos casos de tests/casos.json.

   FUENTE: shared/core.js. Las copias de web/ y extension/ las genera
   scripts/build_data.py: no las edites a mano. */
(function (raiz, fabrica) {
  const api = fabrica();
  if (typeof module === "object" && module.exports) module.exports = api;
  else raiz.CompetenciasCore = api;
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  const ETIQUETAS = {
    estado: "Estado",
    ccaa: "Comunidad Autónoma",
    provincial: "Diputación",
    municipal: "Ayuntamiento",
  };

  /* ---------- texto ---------- */

  function normalizar(texto) {
    return String(texto || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9\s]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  /* Raíz aproximada para igualar singular y plural (calle/calles, hospital/hospitales). */
  function raizDe(palabra) {
    let p = palabra;
    if (p.length > 3 && p.endsWith("s")) p = p.slice(0, -1);
    if (p.length > 4 && p.endsWith("e")) p = p.slice(0, -1);
    return p;
  }

  const STOPWORDS = new Set([
    "que", "quien", "quienes", "cual", "cuales", "como", "donde", "cuando",
    "del", "las", "los", "una", "unos", "unas", "con", "sin", "por", "para",
    "sobre", "entre", "este", "esta", "estos", "estas", "ese", "esa", "mis",
    "gestiona", "paga", "pagan", "encarga", "responsable", "compete", "competencia",
    "depende", "dependen", "hace", "tiene", "son", "quiero", "saber",
  ].map(raizDe));

  function tokens(texto) {
    const limpio = normalizar(texto);
    return limpio ? limpio.split(" ").map(raizDe) : [];
  }

  function contieneSecuencia(palabras, secuencia) {
    const ultimo = palabras.length - secuencia.length;
    for (let i = 0; i <= ultimo; i++) {
      let j = 0;
      while (j < secuencia.length && palabras[i + j] === secuencia[j]) j++;
      if (j === secuencia.length) return true;
    }
    return false;
  }

  function escaparHtml(texto) {
    return String(texto == null ? "" : texto).replace(/[&<>"']/g, c => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
    }[c]));
  }

  function urlRef(ref) {
    const base = "https://www.boe.es/buscar/act.php?id=" + ref.id_boe;
    return ref.bloque ? base + "#" + ref.bloque : base;
  }

  /* ---------- índice de tags por materia ---------- */

  const indices = new WeakMap();

  function indiceDe(materia) {
    let indice = indices.get(materia);
    if (!indice) {
      const vistos = new Map(); // clave de la secuencia -> entrada (gana la versión fuerte)
      const anadir = (tag, fuerte) => {
        const secuencia = tokens(tag);
        if (!secuencia.length) return;
        const clave = secuencia.join(" ");
        const previo = vistos.get(clave);
        if (!previo) vistos.set(clave, { secuencia, fuerte });
        else if (fuerte) previo.fuerte = true;
      };
      (materia.tags || []).forEach(t => anadir(t, true));
      (materia.tags_debiles || []).forEach(t => anadir(t, false));
      indice = {
        tags: Array.from(vistos.values()),
        nombre: new Set(tokens(materia.nombre)),
        descripcion: new Set(tokens(materia.descripcion)),
      };
      indices.set(materia, indice);
    }
    return indice;
  }

  /* ---------- buscador ---------- */

  /* Puntúa una materia frente a una consulta en lenguaje llano. Compara por
     palabras completas (no subcadenas). Con `prefijos`, una palabra a medio
     escribir de 4 o más letras también cuenta. 0 = sin coincidencia. */
  function puntuar(materia, consulta, opciones) {
    const palabras = tokens(consulta);
    if (!palabras.length) return 0;
    const indice = indiceDe(materia);
    const explicadas = new Set();
    let puntos = 0;

    for (const tag of indice.tags) {
      if (contieneSecuencia(palabras, tag.secuencia)) {
        puntos += (tag.fuerte ? 3 : 2) + 2 * (tag.secuencia.length - 1);
        tag.secuencia.forEach(p => explicadas.add(p));
      }
    }

    const significativas = palabras.filter(p => p.length > 2 && !STOPWORDS.has(p));
    for (const palabra of significativas) {
      if (indice.nombre.has(palabra)) { puntos += 2; explicadas.add(palabra); }
      else if (indice.descripcion.has(palabra)) { puntos += 1; explicadas.add(palabra); }
    }

    if (opciones && opciones.prefijos) {
      for (const palabra of significativas) {
        if (palabra.length < 4 || explicadas.has(palabra)) continue;
        if (indice.tags.some(tag => tag.secuencia.some(t => t.startsWith(palabra)))) puntos += 1;
      }
    }
    return puntos;
  }

  function buscar(materias, consulta, opciones) {
    return materias
      .map(materia => ({ materia, puntos: puntuar(materia, consulta, opciones) }))
      .filter(r => r.puntos > 0)
      .sort((a, b) => b.puntos - a.puntos);
  }

  /* ---------- detección de materia en un titular de prensa ---------- */

  const UMBRAL_NOTICIA = 3;

  /* Más estricto que el buscador: un tag débil (palabra ambigua como
     «contrato» o «calle») no basta por sí solo; hace falta un tag fuerte o
     varias señales. Devuelve {materia, puntos} o null. */
  function detectarNoticia(materias, texto) {
    const palabras = tokens(texto);
    let mejor = null;
    let segundo = 0;
    for (const materia of materias) {
      let puntos = 0;
      for (const tag of indiceDe(materia).tags) {
        if (!contieneSecuencia(palabras, tag.secuencia)) continue;
        puntos += !tag.fuerte ? 1 : tag.secuencia.length > 1 ? 4 : 3;
      }
      if (!mejor || puntos > mejor.puntos) {
        segundo = mejor ? mejor.puntos : 0;
        mejor = { materia, puntos };
      } else if (puntos > segundo) {
        segundo = puntos;
      }
    }
    if (!mejor || mejor.puntos < UMBRAL_NOTICIA || mejor.puntos === segundo) return null;
    return mejor;
  }

  /* ---------- excepciones territoriales ---------- */

  function excepcionesDe(materia, isoCcaa) {
    if (!isoCcaa) return [];
    return (materia.excepciones || []).filter(e => e.ccaa.includes(isoCcaa));
  }

  /* ---------- carreteras ---------- */

  function normalizarRef(ref) {
    return String(ref || "").split(/[;/]/)[0].toUpperCase().replace(/\s+/g, "");
  }

  /* Deduce la administración titular de una vía.
     via = {ref, tipo, operador}; isoCcaa = "ES-MD"... o null si se desconoce. */
  function clasificarVia(config, via, isoCcaa) {
    const operador = String(via.operador || "").toLowerCase();
    if (operador) {
      for (const regla of config.operadores) {
        if (new RegExp(regla.patron, "i").test(operador)) {
          return {
            admin: regla.admin,
            confianza: "alta",
            motivo: "OpenStreetMap registra como operador de la vía a «" + via.operador + "».",
            titular: via.operador,
          };
        }
      }
    }

    const ref = normalizarRef(via.ref);
    if (!ref) {
      if (!via.tipo || config.tipos_urbanos.includes(via.tipo)) {
        return {
          admin: "municipal",
          confianza: "media",
          motivo: "Vía sin código de carretera: las calles y caminos municipales son del Ayuntamiento.",
        };
      }
      return {
        admin: null,
        confianza: "baja",
        motivo: "La vía no tiene código de carretera en OpenStreetMap y no se puede deducir su titular.",
      };
    }

    for (const regla of config.reglas) {
      if (regla.ccaa && !regla.ccaa.includes(isoCcaa)) continue;
      if (!new RegExp(regla.patron).test(ref)) continue;
      return {
        admin: regla.admin,
        confianza: regla.confianza,
        motivo: regla.motivo.replace("{ref}", ref),
        titular: regla.titular,
      };
    }
    return { admin: null, confianza: "baja", motivo: "No hay ninguna regla aplicable al código " + ref + "." };
  }

  /* Nombre concreto del titular («Comunidad de Madrid», «Diputación Foral de Bizkaia»...). */
  function nombreTitular(config, clasificacion, territorio, territorios) {
    if (!clasificacion.admin) return "Titular no determinado";
    const lugar = territorio || {};
    const ccaa = (territorios || []).find(t => t.iso === lugar.ccaa);
    const plantilla = clasificacion.titular || config.titulares[clasificacion.admin];
    const valores = {
      gobierno: ccaa && ccaa.gobierno,
      provincia: lugar.provincia,
      municipio: lugar.municipio,
    };
    let completo = true;
    const nombre = plantilla.replace(/\{(\w+)\}/g, (_, clave) => {
      if (!valores[clave]) completo = false;
      return valores[clave] || "";
    });
    return completo ? nombre : ETIQUETAS[clasificacion.admin];
  }

  /* URL de geocodificación inversa (API de Nominatim): devuelve en una sola
     llamada la vía más cercana al punto y el territorio en el que está. */
  function urlGeocodificador(base, lat, lon) {
    return base + "?format=jsonv2&zoom=17&addressdetails=1&namedetails=1&extratags=1" +
      "&polygon_geojson=1&accept-language=es&lat=" + lat + "&lon=" + lon;
  }

  /* Distancia en metros de un punto al segmento a-b, con puntos [lon, lat]
     (aproximación plana, válida a esta escala). */
  function distanciaASegmento(lat, lon, a, b) {
    const kx = 111320 * Math.cos(lat * Math.PI / 180);
    const ky = 110540;
    const ax = (a[0] - lon) * kx, ay = (a[1] - lat) * ky;
    const bx = (b[0] - lon) * kx, by = (b[1] - lat) * ky;
    const dx = bx - ax, dy = by - ay;
    const largo2 = dx * dx + dy * dy;
    const t = largo2 ? Math.max(0, Math.min(1, -(ax * dx + ay * dy) / largo2)) : 0;
    return Math.hypot(ax + t * dx, ay + t * dy);
  }

  /* Distancia en metros de un punto a una geometría GeoJSON; null si no se puede calcular. */
  function distanciaAGeometria(lat, lon, geojson) {
    if (!geojson || !geojson.coordinates) return null;
    const c = geojson.coordinates;
    const lineas = geojson.type === "Point" ? [[c, c]]
      : geojson.type === "LineString" ? [c]
      : geojson.type === "MultiLineString" || geojson.type === "Polygon" ? c
      : geojson.type === "MultiPolygon" ? c.flat()
      : [];
    let minima = Infinity;
    for (const linea of lineas) {
      for (let i = 1; i < linea.length; i++) {
        minima = Math.min(minima, distanciaASegmento(lat, lon, linea[i - 1], linea[i]));
      }
    }
    return Number.isFinite(minima) ? Math.round(minima) : null;
  }

  /* Interpreta la respuesta del geocodificador: {via, territorio}. `via` es
     null si lo más cercano al punto no es una vía. */
  function interpretarGeocodificacion(respuesta, lat, lon) {
    const r = respuesta || {};
    const dir = r.address || {};
    const territorio = {
      ccaa: dir["ISO3166-2-lvl4"] || null,
      provincia: dir.province || null,
      municipio: dir.city || dir.town || dir.village || dir.municipality || null,
    };
    if (r.category !== "highway") return { via: null, territorio };
    const nombres = r.namedetails || {};
    const extra = r.extratags || {};
    return {
      via: {
        ref: nombres.ref || "",
        nombre: nombres["name:es"] || nombres.name || "",
        tipo: r.type || "",
        operador: extra.operator || "",
        distancia: distanciaAGeometria(lat, lon, r.geojson),
      },
      territorio,
    };
  }

  return {
    ETIQUETAS, normalizar, tokens, escaparHtml, urlRef,
    puntuar, buscar, detectarNoticia, excepcionesDe,
    normalizarRef, clasificarVia, nombreTitular,
    urlGeocodificador, distanciaAGeometria, interpretarGeocodificacion,
  };
});
