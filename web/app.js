/* Portada: buscador de preguntas y materias, selector de comunidad y mapa de
   carreteras. La lógica vive en core.js; los datos, en data.js. */
(function () {
  "use strict";

  const Core = CompetenciasCore;
  const e = Core.escaparHtml;
  const materias = COMPETENCIAS.materias;
  const territorios = COMPETENCIAS.territorios;
  const MAX_PREGUNTAS = 6;
  const MAX_POPULARES = 12;

  /* ---------- comunidad seleccionada ---------- */

  const selectorTerritorio = document.getElementById("territorio");
  for (const t of territorios) {
    selectorTerritorio.add(new Option(t.nombre, t.iso));
  }

  function leerPreferencia() {
    try { return localStorage.getItem("territorio") || ""; } catch (_) { return ""; }
  }
  function guardarPreferencia(iso) {
    try { localStorage.setItem("territorio", iso); } catch (_) { /* almacenamiento no disponible */ }
  }

  let territorioActual = leerPreferencia();
  if (!territorios.some(t => t.iso === territorioActual)) territorioActual = "";
  selectorTerritorio.value = territorioActual;

  const territorioDe = iso => territorios.find(t => t.iso === iso);

  /* ---------- piezas ---------- */

  function htmlRefs(refs) {
    const items = refs.map(ref =>
      `<li><a href="${e(Core.urlRef(ref))}" target="_blank" rel="noopener">${e(ref.norma)}</a>` +
      ` <span class="ref-articulo">— art. ${e(ref.articulo)}</span></li>`).join("");
    return `<ul class="refs">${items}</ul>`;
  }

  /* Dónde acudir: indicación de la materia y, si se conoce la comunidad, su portal. */
  function htmlDonde(materia, admin) {
    const nivel = materia.niveles.find(n => n.administracion === admin);
    const partes = [];
    if (nivel && nivel.donde) partes.push(e(nivel.donde));
    const t = territorioDe(territorioActual);
    if (admin === "ccaa" && t) {
      const salud = materia.id === "sanidad" ? ` Tu servicio de salud es ${e(t.salud)}.` : "";
      partes.push(`Portal de ${e(t.gobierno)}: <a href="${e(t.web)}" target="_blank" rel="noopener">${e(t.web.replace("https://", ""))}</a>.${salud}`);
    } else if (admin === "estado") {
      const estado = COMPETENCIAS.organismos.estado;
      partes.push(`Información general: teléfono ${e(estado.telefono)} y <a href="${e(estado.web)}" target="_blank" rel="noopener">administracion.gob.es</a>.`);
    }
    return partes.length ? `<p class="donde"><strong>Dónde acudir:</strong> ${partes.join(" ")}</p>` : "";
  }

  function htmlPregunta(caso, detallada) {
    const resuelto = Core.resolverCaso(caso, territorioActual);
    const materia = materias.find(m => m.id === caso.materia);
    const titular = Core.titularCorto(resuelto.admin, territorioActual, territorios);
    const otros = !territorioActual && (caso.excepciones || []).length
      ? `<p class="aviso-territorio">No es igual en toda España: elige tu comunidad arriba.</p>` : "";
    const detalle = detallada ? `
        ${otros}
        ${htmlDonde(materia, resuelto.admin)}
        ${htmlRefs(Core.refsDeCaso(caso, materias, territorioActual))}
        <p class="acciones">
          <a class="boton-secundario" href="pregunta/${e(caso.id)}.html">Ver la explicación completa</a>
          <button type="button" class="boton-secundario" data-compartir data-url="pregunta/${e(caso.id)}.html" data-titulo="${e(caso.pregunta)}">Compartir</button>
        </p>` : "";
    return `
      <article class="pregunta nivel nivel-${resuelto.admin}">
        <h3><a href="pregunta/${e(caso.id)}.html">${e(caso.pregunta)}</a></h3>
        <p class="veredicto-titular"><span class="chip chip-${resuelto.admin}">${e(titular)}</span></p>
        <p class="veredicto-texto">${e(resuelto.respuesta)}</p>${detalle}
      </article>`;
  }

  function htmlNivel(materia, nivel) {
    const admin = nivel.administracion;
    const t = territorioDe(territorioActual);
    const etiqueta = admin === "ccaa" && t ? t.gobierno : Core.ETIQUETAS[admin];
    return `
      <div class="nivel nivel-${admin}">
        <div class="cabecera">
          <span class="chip chip-${admin}">${e(etiqueta)}</span>
          <span class="rol">${e(nivel.rol)}</span>
        </div>
        <p>${e(nivel.detalle)}</p>
        ${htmlDonde(materia, admin)}
        ${htmlRefs(nivel.refs)}
      </div>`;
  }

  function htmlExcepciones(materia) {
    const todas = materia.excepciones || [];
    if (!todas.length) return "";
    if (!territorioActual) {
      const cuantos = new Set(todas.flatMap(x => x.ccaa)).size;
      return `<p class="aviso-territorio">Hay diferencias en ${cuantos} ${cuantos === 1 ? "territorio" : "territorios"}: ` +
        `elige tu comunidad arriba o consulta la <a href="materia/${e(materia.id)}.html">ficha completa</a>.</p>`;
    }
    return Core.excepcionesDe(materia, territorioActual).map(x => `
      <div class="excepcion">
        <h4>En tu comunidad: ${e(x.titulo)}</h4>
        <p>${e(x.detalle)}</p>
        ${htmlRefs(x.refs)}
      </div>`).join("");
  }

  function htmlPreguntasDe(materia) {
    const propias = CASOS.filter(c => c.materia === materia.id).slice(0, 6);
    if (!propias.length) return "";
    const items = propias.map(c => {
      const admin = Core.resolverCaso(c, territorioActual).admin;
      return `<li><a href="pregunta/${e(c.id)}.html">${e(c.pregunta)}</a> ` +
        `<span class="chip chip-${admin}">${e(Core.titularCorto(admin, territorioActual, territorios))}</span></li>`;
    }).join("");
    return `<h4 class="titulo-resultados">Preguntas frecuentes</h4><ul class="lista-preguntas">${items}</ul>`;
  }

  function htmlMateria(materia, abierta) {
    return `
      <details class="materia"${abierta ? " open" : ""}>
        <summary><span class="materia-nombre">${e(materia.nombre)}</span><span class="desc">${e(materia.descripcion)}</span></summary>
        ${htmlExcepciones(materia)}
        ${materia.niveles.map(n => htmlNivel(materia, n)).join("")}
        ${htmlPreguntasDe(materia)}
        <p class="acciones"><a class="boton-secundario" href="materia/${e(materia.id)}.html">Ficha completa de ${e(materia.nombre)}</a></p>
      </details>`;
  }

  /* ---------- buscador ---------- */

  const entrada = document.getElementById("buscador");
  const resultados = document.getElementById("resultados");
  const portada = document.getElementById("portada");
  let ultimaSinResultados = "";

  function pintarPopulares() {
    document.getElementById("populares").innerHTML =
      CASOS.filter(c => c.popular).slice(0, MAX_POPULARES).map(c => htmlPregunta(c, false)).join("");
  }

  function pintar() {
    const consulta = entrada.value.trim();
    const url = new URL(location.href);
    if (consulta) url.searchParams.set("q", consulta); else url.searchParams.delete("q");
    history.replaceState(null, "", url);

    pintarPopulares();
    portada.hidden = !!consulta;
    resultados.hidden = !consulta;
    if (!consulta) { resultados.innerHTML = ""; return; }

    const preguntas = Core.buscarCasos(CASOS, consulta, { prefijos: true }).slice(0, MAX_PREGUNTAS).map(r => r.caso);
    const fichas = Core.buscar(materias, consulta, { prefijos: true }).map(r => r.materia);
    // Si una pregunta encaja, su materia se ofrece también aunque el buscador de materias no la traiga.
    for (const caso of preguntas) {
      const materia = materias.find(m => m.id === caso.materia);
      if (!fichas.includes(materia)) fichas.push(materia);
    }

    if (!preguntas.length && !fichas.length) {
      resultados.innerHTML = `<p class="aviso-sin-resultados">No tenemos respuesta para «${e(consulta)}». Prueba con otras palabras ` +
        `o mira <a href="preguntas.html">todas las preguntas</a>. Si crees que debería estar, ` +
        `<a href="${e(SITIO.repositorio)}/issues/new?title=${encodeURIComponent("Falta: " + consulta)}" target="_blank" rel="noopener">dínoslo</a>.</p>`;
      if (consulta.length > 3 && consulta !== ultimaSinResultados) {
        ultimaSinResultados = consulta;
        window.registrarEvento("sin-resultados/" + Core.normalizar(consulta));
      }
      return;
    }

    const bloquePreguntas = preguntas.length
      ? `<h2 class="titulo-resultados">Respuesta directa</h2>` +
        preguntas.map((c, i) => htmlPregunta(c, i === 0)).join("")
      : "";
    const bloqueFichas = fichas.length
      ? `<h2 class="titulo-resultados">${preguntas.length ? "Qué hace cada administración" : "Materias relacionadas"}</h2>` +
        fichas.slice(0, 5).map((m, i) => htmlMateria(m, !preguntas.length && i === 0)).join("")
      : "";
    resultados.innerHTML = bloquePreguntas + bloqueFichas;
  }

  let temporizador = null;
  entrada.addEventListener("input", () => {
    clearTimeout(temporizador);
    temporizador = setTimeout(pintar, 150);
  });
  selectorTerritorio.addEventListener("change", () => {
    territorioActual = selectorTerritorio.value;
    guardarPreferencia(territorioActual);
    pintar();
  });

  entrada.value = new URLSearchParams(location.search).get("q") || "";
  pintar();

  if (SITIO.verificacion.fecha) {
    document.getElementById("verificacion").textContent =
      `Las ${SITIO.verificacion.normas} normas citadas se comprobaron contra el BOE el ${SITIO.verificacion.fecha}.`;
  }

  /* ---------- mapa de carreteras ---------- */

  const estadoMapa = document.getElementById("mapa-estado");
  const resultadoMapa = document.getElementById("mapa-resultado");
  if (typeof L === "undefined") {
    estadoMapa.textContent = "No se ha podido cargar el mapa. Comprueba tu conexión.";
    return;
  }

  const mapa = L.map("mapa").setView([40.4168, -3.7038], 6);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: '&copy; colaboradores de <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  }).addTo(mapa);

  async function geocodificar(lat, lon) {
    const respuesta = await fetch(Core.urlGeocodificador(CARRETERAS.geocodificador, lat, lon));
    if (!respuesta.ok) throw new Error(`el servidor respondió ${respuesta.status}`);
    return respuesta.json();
  }

  let marcador = null;
  let peticionEnCurso = 0;

  async function resolverPunto(lat, lon) {
    const turno = ++peticionEnCurso;
    estadoMapa.textContent = "Consultando OpenStreetMap…";
    resultadoMapa.innerHTML = "";
    if (marcador) marcador.remove();
    marcador = L.marker([lat, lon]).addTo(mapa);
    mapa.setView([lat, lon], Math.max(mapa.getZoom(), 15));

    let hallazgo;
    try {
      hallazgo = Core.interpretarGeocodificacion(await geocodificar(lat, lon), lat, lon);
    } catch (error) {
      if (turno !== peticionEnCurso) return;
      estadoMapa.textContent = "";
      resultadoMapa.innerHTML = `<p class="aviso-sin-resultados">OpenStreetMap no responde ahora mismo (${e(error.message)}). Vuelve a intentarlo en unos segundos.</p>`;
      return;
    }
    if (turno !== peticionEnCurso) return;
    estadoMapa.textContent = "";

    const { via, territorio } = hallazgo;
    const limite = CARRETERAS.distancia_maxima_m;
    if (!via || (via.distancia !== null && via.distancia > limite)) {
      resultadoMapa.innerHTML = `<p class="aviso-sin-resultados">No hay ninguna vía a menos de ${limite} m de ese punto.</p>`;
      return;
    }
    const clasificacion = Core.clasificarVia(CARRETERAS, via, territorio.ccaa);
    const titular = Core.nombreTitular(CARRETERAS, clasificacion, territorio, territorios);
    const admin = clasificacion.admin;
    const carreteras = materias.find(m => m.id === "carreteras");
    const nivel = admin && carreteras.niveles.find(n => n.administracion === admin);
    const lugar = [territorio.municipio, territorio.provincia].filter(Boolean).join(", ");

    resultadoMapa.innerHTML = `
      <div class="nivel nivel-${admin || "desconocido"}">
        <div class="cabecera">
          <span class="via-nombre">${e([via.ref, via.nombre].filter(Boolean).join(" · ") || "Vía sin nombre")}</span>
          <span class="chip chip-${admin || "desconocido"}">${e(titular)}</span>
          <span class="rol">confianza ${e(clasificacion.confianza)}${via.distancia !== null ? ` · a ${via.distancia} m` : ""}${lugar ? " · " + e(lugar) : ""}</span>
        </div>
        <p>${e(clasificacion.motivo)}</p>
        ${nivel && nivel.donde ? `<p class="donde"><strong>Dónde acudir:</strong> ${e(nivel.donde)}</p>` : ""}
        ${nivel ? htmlRefs(nivel.refs) : ""}
      </div>`;
  }

  mapa.on("click", ev => resolverPunto(ev.latlng.lat, ev.latlng.lng));

  document.getElementById("btn-ubicacion").addEventListener("click", () => {
    if (!navigator.geolocation) {
      estadoMapa.textContent = "Tu navegador no permite obtener la ubicación.";
      return;
    }
    estadoMapa.textContent = "Obteniendo tu posición…";
    navigator.geolocation.getCurrentPosition(
      pos => resolverPunto(pos.coords.latitude, pos.coords.longitude),
      () => { estadoMapa.textContent = "No se ha podido obtener tu ubicación. Haz clic en el mapa."; },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  });

  window.resolverPunto = resolverPunto; // útil para pruebas desde la consola
})();
