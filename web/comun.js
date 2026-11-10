/* Comportamiento común a todas las páginas: compartir, avisar de un error,
   enlace al repositorio y analítica opcional. Necesita config.js (SITIO). */
(function () {
  "use strict";

  /* Enlace «He visto un error»: abre una incidencia con la página ya indicada. */
  function urlError() {
    const titulo = "Error en: " + document.title;
    const cuerpo = "Página: " + location.href +
      "\n\nQué está mal:\n\n\nCuál es la fuente correcta (ley, artículo o enlace oficial):\n";
    return SITIO.repositorio + "/issues/new?title=" + encodeURIComponent(titulo) +
      "&body=" + encodeURIComponent(cuerpo);
  }

  for (const enlace of document.querySelectorAll("a[data-error]")) {
    enlace.href = urlError();
    enlace.target = "_blank";
    enlace.rel = "noopener";
    // La URL de la portada cambia al buscar: se recalcula al pulsar.
    enlace.addEventListener("click", () => { enlace.href = urlError(); });
  }
  for (const enlace of document.querySelectorAll("a[data-repo]")) {
    enlace.href = SITIO.repositorio;
  }

  /* Botones «Compartir»: menú nativo del móvil o copia del enlace. `data-url`
     permite compartir una dirección distinta de la página actual. */
  async function compartir(boton) {
    const url = new URL(boton.dataset.url || location.href, location.href).href;
    const titulo = boton.dataset.titulo || document.title;
    if (navigator.share) {
      try { await navigator.share({ title: titulo, url }); } catch (_) { /* cancelado por la persona */ }
      return;
    }
    const original = boton.textContent;
    try {
      await navigator.clipboard.writeText(url);
      boton.textContent = "Enlace copiado";
    } catch (_) {
      boton.textContent = "No se pudo copiar";
    }
    setTimeout(() => { boton.textContent = original; }, 2000);
  }

  document.addEventListener("click", ev => {
    const boton = ev.target.closest("[data-compartir]");
    if (boton) compartir(boton);
  });

  /* Analítica sin cookies (GoatCounter), solo si se configura un código en
     data/competencias.json → analitica.goatcounter. Desactivada por defecto. */
  window.registrarEvento = function (nombre) {
    if (window.goatcounter && window.goatcounter.count) {
      window.goatcounter.count({ path: nombre, title: nombre, event: true });
    }
  };
  if (SITIO.goatcounter) {
    const script = document.createElement("script");
    script.async = true;
    script.src = "https://gc.zgo.at/count.js";
    script.dataset.goatcounter = "https://" + SITIO.goatcounter + ".goatcounter.com/count";
    document.head.appendChild(script);
  }
})();
