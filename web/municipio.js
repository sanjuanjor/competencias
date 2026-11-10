/* Página «Tu municipio»: busca un municipio en el padrón del INE y muestra los
   servicios que su ayuntamiento está obligado a prestar según su población. */
(function () {
  "use strict";

  const Core = CompetenciasCore;
  const e = Core.escaparHtml;
  const territorios = COMPETENCIAS.territorios;
  const materias = COMPETENCIAS.materias;
  const MAX_SUGERENCIAS = 8;

  // [codigo, nombre, poblacion] + nombre normalizado para buscar
  const municipios = MUNICIPIOS.municipios.map(([codigo, nombre, poblacion]) => ({
    codigo, nombre, poblacion, clave: Core.normalizar(nombre),
  }));

  const entrada = document.getElementById("buscador-municipio");
  const lista = document.getElementById("sugerencias");
  const ficha = document.getElementById("ficha-municipio");
  const acciones = document.getElementById("acciones-municipio");
  const numero = n => n.toLocaleString("es-ES", { useGrouping: "always" });
  const fechaPadron = new Date(MUNICIPIOS.fecha_referencia + "T12:00:00")
    .toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" });

  document.getElementById("fuente-padron").innerHTML =
    `Población: <a href="${e(MUNICIPIOS.url)}" target="_blank" rel="noopener">${e(MUNICIPIOS.fuente)}</a>, ` +
    `a ${e(fechaPadron)}. Servicios obligatorios: art. 26 de la Ley de Bases del Régimen Local.`;

  /* Coincidencias por nombre: primero las que empiezan igual, luego las que lo
     contienen; dentro de cada grupo, los municipios más poblados. */
  function sugerir(texto) {
    const q = Core.normalizar(texto);
    if (q.length < 2) return [];
    const empiezan = [], contienen = [];
    for (const m of municipios) {
      if (m.clave.startsWith(q) || m.clave.includes(" " + q)) empiezan.push(m);
      else if (m.clave.includes(q)) contienen.push(m);
    }
    const porPoblacion = (a, b) => b.poblacion - a.poblacion;
    const exactos = empiezan.filter(m => m.clave === q);
    const resto = empiezan.filter(m => m.clave !== q).sort(porPoblacion);
    return exactos.concat(resto, contienen.sort(porPoblacion)).slice(0, MAX_SUGERENCIAS);
  }

  function pintarSugerencias(candidatos) {
    lista.hidden = !candidatos.length;
    entrada.setAttribute("aria-expanded", String(!!candidatos.length));
    lista.innerHTML = candidatos.map(m => {
      const provincia = PROVINCIAS[m.codigo.slice(0, 2)];
      return `<li role="option"><button type="button" data-codigo="${e(m.codigo)}">` +
        `<strong>${e(m.nombre)}</strong> <span>${e(provincia.nombre)} · ${numero(m.poblacion)} hab.</span></button></li>`;
    }).join("");
  }

  function htmlTramo(tramo) {
    const servicios = tramo.servicios.map(s => {
      const materia = materias.find(m => m.id === s.materia);
      return `<li>${e(s.nombre)} <a class="enlace-materia" href="materia/${e(s.materia)}.html">${e(materia.nombre)}</a></li>`;
    }).join("");
    return `
      <section class="nivel nivel-municipal">
        <h3>${e(tramo.titulo)}</h3>
        <ul class="servicios">${servicios}</ul>
        <p class="ref-articulo">Art. ${e(tramo.apartado)} de la Ley 7/1985</p>
      </section>`;
  }

  function mostrar(municipio) {
    const provincia = PROVINCIAS[municipio.codigo.slice(0, 2)];
    const territorio = territorios.find(t => t.iso === provincia.ccaa);
    const esCiudadAutonoma = provincia.ccaa === "ES-CE" || provincia.ccaa === "ES-ML";
    const { tramos, apoyos } = Core.serviciosObligatorios(SERVICIOS, municipio.poblacion);
    const siguiente = SERVICIOS.tramos.find(t => t.desde >= municipio.poblacion && t.desde > 0);

    const intermedia = provincia.intermedia
      || `${territorio.gobierno} (tu comunidad tiene una sola provincia y ejerce las funciones de diputación)`;
    const htmlApoyos = !esCiudadAutonoma && apoyos.length ? `
      <h2>Apoyo a tu ayuntamiento</h2>
      <section class="nivel nivel-provincial">
        ${apoyos.map(a => `<p>${e(a.texto.replace("{intermedia}", intermedia))} <span class="ref-articulo">(art. ${e(a.apartado)})</span></p>`).join("")}
      </section>` : "";

    const administraciones = esCiudadAutonoma ? `
        <li><span class="chip chip-municipal">Ciudad autónoma</span> ${e(territorio.gobierno)}: reúne las funciones de ayuntamiento y parte de las de una comunidad. <a href="${e(territorio.web)}" target="_blank" rel="noopener">${e(territorio.web.replace("https://", ""))}</a></li>
        <li><span class="chip chip-estado">Estado</span> Gestiona directamente sanidad y educación, que aquí no están transferidas.</li>` : `
        <li><span class="chip chip-municipal">Ayuntamiento</span> Ayuntamiento de ${e(municipio.nombre)}</li>
        ${provincia.intermedia ? `<li><span class="chip chip-provincial">Diputación</span> ${e(provincia.intermedia)}</li>` : ""}
        <li><span class="chip chip-ccaa">Comunidad</span> ${e(territorio.gobierno)} · <a href="${e(territorio.web)}" target="_blank" rel="noopener">${e(territorio.web.replace("https://", ""))}</a></li>
        <li><span class="chip chip-estado">Estado</span> Gobierno de España · <a href="${e(COMPETENCIAS.organismos.estado.web)}" target="_blank" rel="noopener">administracion.gob.es</a> · teléfono ${e(COMPETENCIAS.organismos.estado.telefono)}</li>`;

    const falta = siguiente
      ? `<p class="aviso-territorio">Le faltan ${numero(siguiente.desde - municipio.poblacion + 1)} habitantes para superar los ${numero(siguiente.desde)} y sumar más servicios obligatorios.</p>`
      : "";

    ficha.innerHTML = `
      <article class="materia">
        <h2 class="municipio-nombre">${e(municipio.nombre)}</h2>
        <p class="desc">${e(provincia.nombre)} · ${e(territorio.nombre)} · <strong>${numero(municipio.poblacion)} habitantes</strong> a ${e(fechaPadron)}</p>

        <h2>Servicios que tu ayuntamiento está obligado a prestar</h2>
        ${tramos.map(htmlTramo).join("")}
        ${falta}
        <p class="aviso-territorio">Es el mínimo legal: tu ayuntamiento puede prestar más servicios, y otras leyes (o tu comunidad) pueden añadir obligaciones.</p>
        ${htmlApoyos}

        <h2>Tus administraciones</h2>
        <ul class="administraciones">${administraciones}</ul>
        <p class="aviso-territorio">Hemos guardado ${e(territorio.nombre)} como tu comunidad: el <a href="./">buscador</a> te dará las respuestas que aplican allí.</p>
      </article>`;
    acciones.hidden = false;

    try { localStorage.setItem("territorio", provincia.ccaa); } catch (_) { /* almacenamiento no disponible */ }
    const url = new URL(location.href);
    url.search = "?m=" + municipio.codigo;
    history.replaceState(null, "", url);
    document.title = `${municipio.nombre}: qué está obligado a darte tu ayuntamiento`;
  }

  function elegir(municipio) {
    entrada.value = municipio.nombre;
    pintarSugerencias([]);
    mostrar(municipio);
  }

  entrada.addEventListener("input", () => pintarSugerencias(sugerir(entrada.value)));
  entrada.addEventListener("keydown", ev => {
    if (ev.key !== "Enter") return;
    const candidatos = sugerir(entrada.value);
    if (candidatos.length) elegir(candidatos[0]);
  });
  lista.addEventListener("click", ev => {
    const boton = ev.target.closest("button[data-codigo]");
    if (boton) elegir(municipios.find(m => m.codigo === boton.dataset.codigo));
  });

  /* Llegada con ?m=28079 (enlace compartido) o ?q=nombre (formulario de la portada). */
  const parametros = new URLSearchParams(location.search);
  const porCodigo = municipios.find(m => m.codigo === parametros.get("m"));
  if (porCodigo) {
    elegir(porCodigo);
  } else if (parametros.get("q")) {
    entrada.value = parametros.get("q");
    const candidatos = sugerir(entrada.value);
    if (candidatos.length === 1 || (candidatos.length && candidatos[0].clave === Core.normalizar(entrada.value))) {
      elegir(candidatos[0]);
    } else {
      pintarSugerencias(candidatos);
      if (!candidatos.length) {
        ficha.innerHTML = `<p class="aviso-sin-resultados">No encontramos ningún municipio llamado «${e(entrada.value)}». Prueba a escribir solo el principio del nombre.</p>`;
      }
    }
  }
  entrada.focus();
})();
