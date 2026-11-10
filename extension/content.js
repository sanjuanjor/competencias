/* Content script: detecta de qué materia trata la noticia y muestra una ficha
   con el reparto competencial. El análisis es local (core.js + data.js): no se
   envía nada a ningún servidor. */
(function () {
  "use strict";

  const Core = CompetenciasCore;
  const e = Core.escaparHtml;
  const ID_FICHA = "competencias-ficha";

  /* Secciones donde una ficha sobre competencias españolas no aporta o confunde. */
  const SECCIONES_EXCLUIDAS = /\/(internacional|mundo|deportes|deporte|gente|television|tv|loc|famosos|motor|horoscopo|opinion|pasatiempos)(\/|$)/i;

  function esArticulo() {
    if (SECCIONES_EXCLUIDAS.test(location.pathname)) return false;
    const tipo = document.querySelector('meta[property="og:type"]');
    return !!tipo && tipo.content.toLowerCase() === "article";
  }

  /* Solo titular y entradilla: el título de la pestaña incluye el nombre de la
     sección («| Cultura |») y provocaba falsos positivos. */
  function textoDeLaNoticia() {
    const titular = document.querySelector("article h1, main h1, h1");
    const entradilla = document.querySelector(
      "article h2, article .entradilla, [class*='subtitle'], [class*='standfirst'], [class*='entradilla']"
    );
    return [titular, entradilla].map(n => (n ? n.textContent : "")).join(" ").trim();
  }

  function htmlFicha(materia) {
    const nombres = new Map(COMPETENCIAS.territorios.map(t => [t.iso, t.nombre]));
    const niveles = materia.niveles.map(n => {
      const ref = n.refs[0];
      return `
        <div class="cb-nivel cb-${n.administracion}">
          <span class="cb-chip">${e(Core.ETIQUETAS[n.administracion])}</span>
          <span class="cb-detalle">${e(n.rol)} —
            <a href="${e(Core.urlRef(ref))}" target="_blank" rel="noopener">${e(ref.norma)}, art. ${e(ref.articulo)}</a>
          </span>
        </div>`;
    }).join("");

    const excepciones = (materia.excepciones || []).map(x =>
      `<li><strong>${e(x.ccaa.map(iso => nombres.get(iso)).join(", "))}:</strong> ${e(x.titulo)}</li>`).join("");

    return `
      <div class="cb-cabecera">
        <span class="cb-titulo">¿De quién es la competencia?</span>
        <button class="cb-cerrar" type="button" aria-label="Cerrar ficha">×</button>
      </div>
      <div class="cb-materia">${e(materia.nombre)}</div>
      ${niveles}
      ${excepciones ? `<details class="cb-excepciones"><summary>Diferencias por territorio</summary><ul>${excepciones}</ul></details>` : ""}
      <div class="cb-pie">Marco general. Fuente vinculante: BOE.</div>`;
  }

  function analizar() {
    const anterior = document.getElementById(ID_FICHA);
    if (anterior) anterior.remove();
    if (!esArticulo()) return;

    const hallazgo = Core.detectarNoticia(COMPETENCIAS.materias, textoDeLaNoticia());
    if (!hallazgo) return;

    const ficha = document.createElement("aside");
    ficha.id = ID_FICHA;
    ficha.setAttribute("aria-label", "Ficha de competencia");
    ficha.innerHTML = htmlFicha(hallazgo.materia);
    ficha.querySelector(".cb-cerrar").addEventListener("click", () => ficha.remove());
    document.body.appendChild(ficha);
  }

  analizar();

  /* Muchos periódicos cambian de artículo sin recargar la página. */
  let ultimaUrl = location.href;
  setInterval(() => {
    if (location.href === ultimaUrl) return;
    ultimaUrl = location.href;
    setTimeout(analizar, 1200);
  }, 1500);
})();
