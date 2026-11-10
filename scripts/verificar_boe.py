"""Verifica contra el BOE todas las referencias legales de data/competencias.json.

Para cada norma citada comprueba que existe y sigue vigente; para cada cita,
que el bloque (artículo o disposición) existe en el texto consolidado y que su
título corresponde al artículo citado. Guarda el resultado en
data/verificacion_boe.json, que la web y el servidor MCP muestran como
«verificado contra el BOE el ...».

Uso:
    python scripts/verificar_boe.py            # verifica y actualiza el informe
    python scripts/verificar_boe.py --volcar DIR   # además guarda el texto de cada bloque citado
Sale con código 1 si hay incidencias.
"""
from __future__ import annotations

import argparse
import datetime
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "mcp-server"))

from competencias_mcp import boe  # noqa: E402

DATOS = ROOT / "data" / "competencias.json"
INFORME = ROOT / "data" / "verificacion_boe.json"


def citas(datos: dict):
    """Recorre todas las referencias: (ubicación legible, ref)."""
    for materia in datos["materias"]:
        for nivel in materia["niveles"]:
            for ref in nivel["refs"]:
                yield f"{materia['id']}/{nivel['administracion']}", ref
        for exc in materia.get("excepciones", []):
            for ref in exc["refs"]:
                yield f"{materia['id']}/excepción «{exc['titulo']}»", ref


def titulo_coincide(articulo: str, titulo_bloque: str) -> bool | None:
    """True/False si se puede comprobar el número de artículo; None si no."""
    titulo_bloque = re.sub(r"[\s. ]+", " ", titulo_bloque)
    numero = re.match(r"\s*(\d+)(\s*(bis|ter|quater))?", articulo)
    if not numero or not re.search(r"\d", titulo_bloque):
        return None
    esperado = numero.group(1) + (f" {numero.group(3)}" if numero.group(3) else "")
    return re.search(rf"\b{re.escape(esperado)}\b", titulo_bloque, re.IGNORECASE) is not None


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    parser.add_argument("--volcar", metavar="DIR", help="guarda el texto de cada bloque citado")
    args = parser.parse_args()

    datos = json.loads(DATOS.read_text(encoding="utf-8"))
    incidencias: list[str] = []
    normas: dict[str, dict] = {}
    indices: dict[str, dict[str, str]] = {}

    for donde, ref in citas(datos):
        id_boe = ref["id_boe"]
        if id_boe not in normas:
            try:
                normas[id_boe] = boe.estado_norma(id_boe)
                indices[id_boe] = {b["id"]: b["titulo"] for b in boe.indice(id_boe)}
            except boe.ErrorBOE as exc:
                normas[id_boe] = {"id_boe": id_boe, "error": str(exc)}
                indices[id_boe] = {}
                incidencias.append(f"{id_boe} ({ref['norma']}): {exc}")
                continue
            if not normas[id_boe]["vigente"]:
                incidencias.append(f"{id_boe} ({ref['norma']}): la norma ya NO está vigente")
        if "error" in normas[id_boe]:
            continue

        bloque = ref.get("bloque")
        if not bloque:
            incidencias.append(f"{donde}: la cita de {ref['norma']} art. {ref['articulo']} no indica bloque")
            continue
        titulo = indices[id_boe].get(bloque)
        if titulo is None:
            numero = re.match(r"\s*(\d+)", ref["articulo"])
            pistas = [
                f"{bid} («{tit}»)" for bid, tit in indices[id_boe].items()
                if numero and re.search(rf"\b{numero.group(1)}\b", tit)
            ][:6]
            incidencias.append(
                f"{donde}: no existe el bloque «{bloque}» en {id_boe} "
                f"(art. {ref['articulo']}). Candidatos: {', '.join(pistas) or 'ninguno'}"
            )
            continue
        if titulo_coincide(ref["articulo"], titulo) is False:
            incidencias.append(
                f"{donde}: el bloque «{bloque}» de {id_boe} se titula «{titulo}», "
                f"pero la cita dice art. {ref['articulo']}"
            )
        if args.volcar:
            destino = Path(args.volcar)
            destino.mkdir(parents=True, exist_ok=True)
            fichero = destino / f"{id_boe}_{bloque}.txt"
            if not fichero.exists():
                fichero.write_text(
                    f"{normas[id_boe]['titulo']}\n[{titulo}]\n\n" + boe.texto_bloque(id_boe, bloque),
                    encoding="utf-8",
                )

    informe = {
        "fecha": datetime.date.today().isoformat(),
        "normas": dict(sorted(normas.items())),
        "incidencias": incidencias,
    }
    INFORME.write_text(json.dumps(informe, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    total = sum(1 for _ in citas(datos))
    print(f"{len(normas)} normas y {total} citas comprobadas.")
    for norma in normas.values():
        print(f"  {norma['id_boe']}: {norma.get('titulo') or norma.get('error')}")
    if incidencias:
        print(f"\n{len(incidencias)} INCIDENCIAS:")
        for inc in incidencias:
            print(f"  - {inc}")
        return 1
    print("Sin incidencias: todas las normas están vigentes y todos los bloques existen.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
