/* Quién gobierna y dónde reclamar: piezas compartidas por la portada y la ficha
   de municipio. Necesita cargos.js (CARGOS, PROVINCIAS, ALCALDIAS) y core.js.
   Las alcaldías se cargan por provincia (ayuntamientos/NN.json) cuando hacen falta. */
const Gobierno = (function () {
  "use strict";

  const Core = CompetenciasCore;
  const e = Core.escaparHtml;
  const cargos = Core.completarCargos(CARGOS, COMPETENCIAS.territorios);
  const CLAVE = "municipio";
  const cache = {};

  const fecha = iso => iso
    ? new Date(iso + "T12:00:00").toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" })
    : "";
  const enlace = (url, texto) => url
    ? `<a href="${e(url)}" target="_blank" rel="noopener">${e(texto || url.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, ""))}</a>`
    : "";

  /* ---------- municipio elegido ---------- */

  function leerMunicipio() {
    try {
      const m = JSON.parse(localStorage.getItem(CLAVE) || "null");
      return m && /^\d{5}$/.test(m.codigo) && PROVINCIAS[m.codigo.slice(0, 2)] ? m : null;
    } catch (_) { return null; }
  }
  function guardarMunicipio(codigo, nombre) {
    try { localStorage.setItem(CLAVE, JSON.stringify({ codigo, nombre })); } catch (_) { /* sin almacenamiento */ }
  }

  async function ayuntamientoDe(codigo) {
    const prov = codigo.slice(0, 2);
    if (!cache[prov]) {
      cache[prov] = fetch(`ayuntamientos/${prov}.json`).then(r => (r.ok ? r.json() : {})).catch(() => ({}));
    }
    return (await cache[prov])[codigo] || null;
  }

  async function gobiernoDe(codigo) {
    return Core.gobiernoDelMunicipio(cargos, PROVINCIAS, codigo, await ayuntamientoDe(codigo));
  }

  /* Gobierno conocido sin municipio: solo la comunidad (y el Estado). */
  function gobiernoDeComunidad(iso) {
    return { ccaa: cargos.ccaa[iso] || null, estado: cargos.estado.presidencia, isoCcaa: iso };
  }

  /* ---------- piezas de HTML ---------- */

  function partido(persona) {
    if (!persona) return "";
    if (persona.lista) {
      const familia = persona.familia ? ` (${persona.familia})` : "";
      return `lista ${persona.lista}${familia}`;
    }
    return persona.partido || "";
  }

  /* «Isabel Díaz Ayuso (PP), Presidencia de la Comunidad de Madrid» */
  function htmlPersona(persona, cargo) {
    const p = partido(persona);
    const extra = [];
    if (persona.en_funciones || /funciones/i.test(persona.cargo || "")) extra.push("en funciones");
    if (/gestor/i.test(persona.cargo || "")) extra.push("comisión gestora");
    return `<strong>${e(persona.nombre)}</strong>${p ? ` <span class="partido">(${e(p)})</span>` : ""}` +
      `${cargo ? `, ${e(cargo)}` : ""}${extra.length ? ` · ${e(extra.join(", "))}` : ""}`;
  }

  /* Línea «Quién responde» de una respuesta. */
  function htmlResponsable(admin, materiaId, gobierno, ministerioId) {
    const persona = Core.responsable(cargos, admin, materiaId, gobierno, ministerioId);
    if (persona) {
      const cargo = admin === "municipal"
        ? `Alcaldía${gobierno.nombreMunicipio ? ` de ${gobierno.nombreMunicipio}` : ""}`
        : admin === "provincial" ? `${persona.institucion} (${persona.cargo.toLowerCase()})` : persona.cargo || persona.institucion;
      return `<p class="quien"><strong>Quién responde:</strong> ${htmlPersona(persona, cargo)}.</p>`;
    }
    if (admin === "municipal" || admin === "provincial") {
      return `<p class="quien"><strong>Quién responde:</strong> <a href="municipio.html">dinos dónde vives</a> y te decimos quién gobierna tu ${admin === "municipal" ? "ayuntamiento" : "diputación"}.</p>`;
    }
    return "";
  }

  function htmlPasos(pasos) {
    return `<ol class="pasos-reclamar">${pasos.map(p => `
      <li><strong>${p.url ? enlace(p.url, p.nombre) : e(p.nombre)}</strong>. ${e(p.detalle)}</li>`).join("")}</ol>`;
  }

  /* Bloque desplegable «¿No funciona? Dónde reclamar» de una respuesta. */
  function htmlReclamar(admin, materiaId, gobierno, ministerioId) {
    const pasos = Core.dondeReclamar(cargos, admin, materiaId, gobierno, ministerioId);
    const sinWeb = admin === "municipal" && !(gobierno && gobierno.municipal && gobierno.municipal.web)
      ? `<p class="aviso-territorio">No tenemos la web de tu ayuntamiento: búscala como «sede electrónica» y el nombre del municipio.</p>` : "";
    return `
      <details class="reclamar">
        <summary>¿No funciona? Dónde reclamar</summary>
        ${htmlPasos(pasos)}${sinWeb}
        ${htmlBaseLegal()}
      </details>`;
  }

  function htmlBaseLegal() {
    const refs = cargos.reclamar.refs.map(ref =>
      `<a href="${e(Core.urlRef(ref))}" target="_blank" rel="noopener">${e(ref.norma)}, art. ${e(ref.articulo)}</a>`);
    return `<p class="ref-articulo">Base legal: ${refs.join(" · ")}.</p>`;
  }

  /* Ficha «Quién gobierna» de un municipio. */
  function htmlGobierno(gobierno, nombreMunicipio) {
    const g = gobierno;
    const filas = [];
    const m = g.municipal || {};
    if (m.nombre) {
      const desde = m.desde ? ` · desde el ${e(fecha(m.desde))}` : "";
      filas.push(`<li><span class="chip chip-municipal">Ayuntamiento</span> ${htmlPersona(m, `Alcaldía de ${nombreMunicipio}`)}${desde}${m.web ? ` · ${enlace(m.web)}` : ""}</li>`);
    }
    if (g.provincial) {
      filas.push(`<li><span class="chip chip-provincial">${e(g.isla ? "Isla" : "Diputación")}</span> ${htmlPersona(g.provincial, `${g.provincial.institucion} (${g.provincial.cargo.toLowerCase()})`)}${g.provincial.web ? ` · ${enlace(g.provincial.web)}` : ""}</li>`);
    }
    if (g.ccaa) {
      const etiqueta = g.isoCcaa === "ES-CE" || g.isoCcaa === "ES-ML" ? "Ciudad autónoma" : "Comunidad";
      filas.push(`<li><span class="chip chip-ccaa">${etiqueta}</span> ${htmlPersona(g.ccaa, g.ccaa.cargo)} · ${enlace(g.ccaa.web)}</li>`);
    }
    filas.push(`<li><span class="chip chip-estado">Estado</span> ${htmlPersona(g.estado, g.estado.cargo)} · <a href="#ministerios">cada ministerio</a></li>`);
    return `<ul class="administraciones gobierno">${filas.join("")}</ul>`;
  }

  /* Lista de ministerios con las materias de las que responden. */
  function htmlMinisterios() {
    const materias = COMPETENCIAS.materias;
    return `<ul class="ministerios">${cargos.estado.ministerios.map(m => {
      const de = (m.materias || []).map(id => materias.find(x => x.id === id)).filter(Boolean)
        .map(x => `<a href="materia/${e(x.id)}.html">${e(x.nombre)}</a>`).join(", ");
      return `<li><strong>${e(m.nombre)}</strong>: ${htmlPersona(m.titular ? { nombre: m.titular, partido: m.partido } : {}, "")}${de ? ` · ${de}` : ""}</li>`;
    }).join("")}</ul>`;
  }

  /* Dónde reclamar según quién lo gestione, para la ficha de municipio. */
  function htmlReclamarMunicipio(gobierno) {
    const r = cargos.reclamar;
    const gestores = [];
    const m = gobierno.municipal || {};
    gestores.push(`<li><strong>Calles, basuras, agua, licencias, policía local…</strong> ${m.web ? enlace(m.web, "la web de tu ayuntamiento") : "la sede electrónica de tu ayuntamiento"}</li>`);
    if (gobierno.provincial) {
      gestores.push(`<li><strong>Carreteras provinciales y servicios de la ${e(gobierno.isla ? "isla" : "diputación")}:</strong> ${enlace(gobierno.provincial.quejas || gobierno.provincial.web, gobierno.provincial.institucion)}</li>`);
    }
    if (gobierno.ccaa) {
      gestores.push(`<li><strong>Sanidad, educación, servicios sociales…</strong> ${enlace(gobierno.ccaa.quejas || gobierno.ccaa.web, gobierno.ccaa.institucion)}</li>`);
    }
    gestores.push(`<li><strong>DNI, pensiones, paro, impuestos del Estado…</strong> ${enlace(r.age.url, r.age.nombre)}, o el ministerio correspondiente</li>`);
    const defensores = [];
    if (gobierno.ccaa && gobierno.ccaa.defensor) {
      defensores.push(`<li>${enlace(gobierno.ccaa.defensor.queja || gobierno.ccaa.defensor.web, gobierno.ccaa.defensor.nombre)}: tu comunidad y tus entidades locales.</li>`);
    }
    defensores.push(`<li>${enlace(r.defensor_pueblo.queja, r.defensor_pueblo.nombre)}: cualquier administración, también el Estado.</li>`);
    return `
      <ol class="pasos-reclamar">
        <li><strong>Reclama a quien presta el servicio</strong>, en su sede electrónica (quejas y sugerencias):<ul>${gestores.join("")}</ul></li>
        <li><strong>${enlace(r.registro.url, r.registro.nombre)}</strong>. ${e(r.registro.detalle)}</li>
        <li><strong>Si no te responden o no estás de acuerdo</strong>, acude gratis a un defensor:<ul>${defensores.join("")}</ul></li>
      </ol>
      ${htmlBaseLegal()}`;
  }

  function htmlFuentes() {
    const f = ALCALDIAS;
    return `Alcaldías: <a href="${e(f.fuentes.alcaldias.url)}" target="_blank" rel="noopener">registro de cargos electos locales</a> ` +
      `del Ministerio de Política Territorial (último cambio recogido: ${e(fecha(f.ultimo_cambio))}). ` +
      `Presidencias, ministerios y defensores revisados a ${e(fecha(cargos.fecha_revision))}. ` +
      `La «lista» es la candidatura por la que salió elegida cada persona; puede no coincidir con su afiliación actual.`;
  }

  return {
    cargos, leerMunicipio, guardarMunicipio, ayuntamientoDe, gobiernoDe, gobiernoDeComunidad,
    htmlPersona, htmlResponsable, htmlReclamar, htmlGobierno, htmlMinisterios, htmlReclamarMunicipio, htmlFuentes,
  };
})();

/* El enlace «cada ministerio» abre el desplegable al que apunta. */
document.addEventListener("click", ev => {
  const enlace = ev.target.closest('a[href="#ministerios"]');
  const destino = enlace && document.getElementById("ministerios");
  if (destino && destino.tagName === "DETAILS") destino.open = true;
});
