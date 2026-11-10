"""Tests de la lógica en Python y de la integridad de los datos.

Ejecutar desde la raíz:  python -m unittest discover -s tests -v
No necesitan red ni dependencias externas.
"""
import json
import re
import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "mcp-server"))
sys.path.insert(0, str(ROOT / "scripts"))

from competencias_mcp import core  # noqa: E402
import build_data  # noqa: E402

DATOS = json.loads((ROOT / "data" / "competencias.json").read_text(encoding="utf-8"))
CARRETERAS = json.loads((ROOT / "data" / "carreteras.json").read_text(encoding="utf-8"))
CASOS = json.loads((ROOT / "tests" / "casos.json").read_text(encoding="utf-8"))
MATERIAS = DATOS["materias"]


class Busqueda(unittest.TestCase):
    def test_casos(self):
        for caso in CASOS["busqueda"]:
            with self.subTest(q=caso["q"]):
                resultados = core.buscar(MATERIAS, caso["q"])
                if caso.get("vacio"):
                    self.assertEqual([m["id"] for _, m in resultados], [])
                else:
                    self.assertTrue(resultados, "sin resultados")
                    self.assertEqual(resultados[0][1]["id"], caso["primero"])

    def test_prefijo_mientras_se_escribe(self):
        self.assertEqual(core.buscar(MATERIAS, "hospi"), [])
        self.assertEqual(core.buscar(MATERIAS, "hospi", prefijos=True)[0][1]["id"], "sanidad")


class Noticias(unittest.TestCase):
    def test_casos(self):
        for caso in CASOS["noticias"]:
            with self.subTest(texto=caso["texto"]):
                materia = core.detectar_noticia(MATERIAS, caso["texto"])
                self.assertEqual(materia["id"] if materia else None, caso["materia"])


class Carreteras(unittest.TestCase):
    def test_clasificacion(self):
        for caso in CASOS["vias"]:
            with self.subTest(ref=caso["ref"], ccaa=caso["ccaa"]):
                via = {"ref": caso["ref"], "tipo": caso.get("tipo"), "operador": caso.get("operador", "")}
                resultado = core.clasificar_via(CARRETERAS, via, caso["ccaa"])
                self.assertEqual(resultado["admin"], caso["admin"])
                if "titular" in caso:
                    territorio = {
                        "ccaa": caso["ccaa"],
                        "provincia": caso.get("provincia"),
                        "municipio": caso.get("municipio"),
                    }
                    nombre = core.nombre_titular(CARRETERAS, resultado, territorio, DATOS["territorios"])
                    self.assertEqual(nombre, caso["titular"])

    def test_geocodificacion(self):
        for caso in CASOS["geocodificacion"]:
            with self.subTest(caso=caso["_"]):
                resultado = core.interpretar_geocodificacion(caso["respuesta"], caso["lat"], caso["lon"])
                self.assertEqual(resultado["via"], caso["via"])
                self.assertEqual(resultado["territorio"], caso["territorio"])

    def test_patrones_validos(self):
        for regla in CARRETERAS["reglas"] + CARRETERAS["operadores"]:
            re.compile(regla["patron"])


class Datos(unittest.TestCase):
    def test_esquema(self):
        self.assertEqual(build_data.validar(DATOS, CARRETERAS), [])

    def test_ningun_tag_fuerte_coincide_con_otra_materia(self):
        """Un mismo tag fuerte en dos materias haría ambiguo el buscador."""
        vistos: dict[str, str] = {}
        for materia in MATERIAS:
            for tag in materia["tags"]:
                clave = " ".join(core.tokens(tag))
                otra = vistos.setdefault(clave, materia["id"])
                self.assertEqual(otra, materia["id"], f"tag «{tag}» repetido en {otra} y {materia['id']}")

    def test_bundles_al_dia(self):
        """web/ y extension/ deben estar regenerados tras editar los datos."""
        self.assertEqual(build_data.desactualizados(), [], "ejecuta: python scripts/build_data.py")


if __name__ == "__main__":
    unittest.main()
