// Tests de shared/core.js con los mismos casos que la versión Python.
// Ejecutar desde la raíz:  node --test tests/
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const core = require("../shared/core.js");
const leer = ruta => JSON.parse(readFileSync(new URL(ruta, import.meta.url), "utf-8"));

const datos = leer("../data/competencias.json");
const carreteras = leer("../data/carreteras.json");
const casos = leer("./casos.json");
const materias = datos.materias;

test("buscador", () => {
  for (const caso of casos.busqueda) {
    const resultados = core.buscar(materias, caso.q);
    if (caso.vacio) {
      assert.deepEqual(resultados.map(r => r.materia.id), [], `«${caso.q}» no debería dar resultados`);
    } else {
      assert.ok(resultados.length, `«${caso.q}» no da resultados`);
      assert.equal(resultados[0].materia.id, caso.primero, `«${caso.q}»`);
    }
  }
});

test("buscador: prefijo mientras se escribe", () => {
  assert.equal(core.buscar(materias, "hospi").length, 0);
  assert.equal(core.buscar(materias, "hospi", { prefijos: true })[0].materia.id, "sanidad");
});

test("detección de noticias", () => {
  for (const caso of casos.noticias) {
    const hallazgo = core.detectarNoticia(materias, caso.texto);
    assert.equal(hallazgo ? hallazgo.materia.id : null, caso.materia, `«${caso.texto}»`);
  }
});

test("clasificación de vías", () => {
  for (const caso of casos.vias) {
    const via = { ref: caso.ref, tipo: caso.tipo, operador: caso.operador || "" };
    const resultado = core.clasificarVia(carreteras, via, caso.ccaa);
    assert.equal(resultado.admin, caso.admin, `${caso.ref} en ${caso.ccaa}`);
    if ("titular" in caso) {
      const territorio = { ccaa: caso.ccaa, provincia: caso.provincia, municipio: caso.municipio };
      const nombre = core.nombreTitular(carreteras, resultado, territorio, datos.territorios);
      assert.equal(nombre, caso.titular, `titular de ${caso.ref}`);
    }
  }
});

test("interpretación del geocodificador", () => {
  for (const caso of casos.geocodificacion) {
    const resultado = core.interpretarGeocodificacion(caso.respuesta, caso.lat, caso.lon);
    assert.deepEqual(resultado.via, caso.via, caso._);
    assert.deepEqual(resultado.territorio, caso.territorio, caso._);
  }
});

test("escape de HTML", () => {
  assert.equal(core.escaparHtml('<img src=x onerror="alert(1)">'), "&lt;img src=x onerror=&quot;alert(1)&quot;&gt;");
});
