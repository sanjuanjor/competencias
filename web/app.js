/* Interfaz de la web: buscador, selector de comunidad y mapa de carreteras.
   La lógica (búsqueda, clasificación de vías) vive en core.js; los datos, en data.js. */
(function () {
  "use strict";

  const Core = CompetenciasCore;
  const e = Core.escaparHtml;
  const materias = COMPETENCIAS.materias;
  const territorios = COMPETENCIAS.territorios;

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

  function gobiernoDe(iso) {
    const t = territorios.find(x => x.iso === iso);
    return t ? t.gobierno : null;
  }

  /* ---------- fichas ---------- */

  function htmlRefs(refs) {
    const items = refs.map(ref =>
      `<li><a href="${e(Core.urlRef(ref))}" target="_blank" rel="noopener">${e(ref.norma)}</a>` +
      ` <span class="ref-articulo">— art. ${e(ref.articulo)}</span></li>`).join("");
    return `<ul class="refs">${items}</ul>`;
  }

  function htmlNivel(nivel) {
    const admin = nivel.administracion;
    const etiqueta = admin === "ccaa" && territorioActual
      ? gobiernoDe(territorioActual)
      : Core.ETIQUETAS[admin];
    return `
      <div class="nivel nivel-${admin}">
        <div class="cabecera">
          <span class="chip chip-${admin}">${e(etiqueta)}</span>
          <span class="rol">${e(nivel.rol)}</span>
        </div>
        <p>${e(nivel.detalle)}</p>
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

  function htmlMateria(materia) {
    return `
      <article class="materia" id="materia-${e(materia.id)}">
        <h3><a href="materia/${e(materia.id)}.html">${e(materia.nombre)}</a></h3>
        <p class="desc">${e(materia.descripcion)}</p>
        ${htmlExcepciones(materia)}
        ${materia.niveles.map(htmlNivel).join("")}
      </article>`;
  }

  /* ---------- buscador ---------- */

  const entrada = document.getElementById("buscador");
  const contenedor = document.getElementById("resultados");

  function pintar() {
    const consulta = entrada.value.trim();
    const lista = consulta
      ? Core.buscar(materias, consulta, { prefijos: true }).map(r => r.materia)
      : materias;

    const url = new URL(location.href);
    if (consulta) url.searchParams.set("q", consulta); else url.searchParams.delete("q");
    history.replaceState(null, "", url);

    contenedor.innerHTML = lista.length
      ? lista.map(htmlMateria).join("")
      : `<p class="aviso-sin-resultados">Sin resultados para «${e(consulta)}». Prueba con otras palabras ` +
        `(<em>colegios</em>, <em>basuras</em>, <em>hospital</em>, <em>alquiler</em>) o mira ` +
        `<a href="#todas-las-materias">todas las materias</a>.</p>`;
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

  if (VERIFICACION.fecha) {
    document.getElementById("verificacion").textContent =
      `Las ${VERIFICACION.normas} normas citadas se comprobaron contra el BOE el ${VERIFICACION.fecha}.`;
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
    const nivel = admin && materias.find(m => m.id === "carreteras").niveles.find(n => n.administracion === admin);
    const lugar = [territorio.municipio, territorio.provincia].filter(Boolean).join(", ");

    resultadoMapa.innerHTML = `
      <div class="nivel nivel-${admin || "desconocido"}">
        <div class="cabecera">
          <span class="via-nombre">${e([via.ref, via.nombre].filter(Boolean).join(" · ") || "Vía sin nombre")}</span>
          <span class="chip chip-${admin || "desconocido"}">${e(titular)}</span>
          <span class="rol">confianza ${e(clasificacion.confianza)}${via.distancia !== null ? ` · a ${via.distancia} m` : ""}${lugar ? " · " + e(lugar) : ""}</span>
        </div>
        <p>${e(clasificacion.motivo)}</p>
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
