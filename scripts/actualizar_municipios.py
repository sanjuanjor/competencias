"""Descarga del INE la población de todos los municipios y genera data/municipios.json.

Fuente: INE, cifras oficiales de población de los municipios españoles
(revisión del Padrón municipal), tabla 29005. El fichero ocupa unos 27 MB
porque incluye la serie histórica; aquí se conserva solo el último año.

Uso:  python scripts/actualizar_municipios.py
El INE publica las cifras de cada 1 de enero a finales de ese mismo año.
"""
from __future__ import annotations

import csv
import io
import json
import re
import sys
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DESTINO = ROOT / "data" / "municipios.json"
URL = "https://www.ine.es/jaxiT3/files/t/es/csv_bdsc/29005.csv"
PAGINA = "https://www.ine.es/jaxiT3/Tabla.htm?t=29005"


def nombre_legible(nombre: str) -> str:
    """«Coruña, A» -> «A Coruña»; «Palmas de Gran Canaria, Las» -> «Las Palmas de Gran Canaria»."""
    partes = [nombre_legible_simple(p) for p in nombre.split("/")]
    return "/".join(partes)


def nombre_legible_simple(nombre: str) -> str:
    coincidencia = re.fullmatch(r"(.+), (El|La|Los|Las|L'|Els|Les|O|A|Os|As|Es|Sa|Ses|S')", nombre.strip(), re.IGNORECASE)
    if not coincidencia:
        return nombre.strip()
    resto, articulo = coincidencia.groups()
    union = "" if articulo.endswith("'") else " "
    return f"{articulo}{union}{resto}"


def descargar() -> str:
    peticion = urllib.request.Request(URL, headers={"User-Agent": "competencias-espana/0.3 (uso divulgativo)"})
    with urllib.request.urlopen(peticion, timeout=180) as resp:
        crudo = resp.read()
    try:
        return crudo.decode("utf-8-sig")
    except UnicodeDecodeError:
        return crudo.decode("iso-8859-15")


def main() -> int:
    print("Descargando el padrón municipal del INE (unos 27 MB)…")
    texto = descargar()
    lector = csv.reader(io.StringIO(texto), delimiter=";")
    cabecera = next(lector)
    if [c.strip() for c in cabecera[:4]] != ["Municipios", "Sexo", "Periodo", "Total"]:
        print(f"El formato del INE ha cambiado: cabecera inesperada {cabecera}")
        return 1

    por_anio: dict[int, dict[str, tuple[str, int]]] = {}
    for fila in lector:
        if len(fila) < 4 or fila[1].strip() != "Total":
            continue
        coincidencia = re.fullmatch(r"(\d{5}) (.+)", fila[0].strip())
        valor = fila[3].strip().replace(".", "")
        if not coincidencia or not valor.isdigit():
            continue
        codigo, nombre = coincidencia.groups()
        por_anio.setdefault(int(fila[2]), {})[codigo] = (nombre_legible(nombre), int(valor))

    if not por_anio:
        print("No se ha podido leer ningún municipio.")
        return 1
    anio = max(por_anio)
    municipios = por_anio[anio]
    if len(municipios) < 8000:
        print(f"Solo hay {len(municipios)} municipios para {anio}: algo va mal, no se guarda.")
        return 1

    salida = {
        "fuente": "INE. Cifras oficiales de población de los municipios españoles: Revisión del Padrón Municipal",
        "url": PAGINA,
        "fecha_referencia": f"{anio}-01-01",
        "municipios": [[codigo, nombre, poblacion] for codigo, (nombre, poblacion) in sorted(municipios.items())],
    }
    lineas = ",\n".join("    " + json.dumps(m, ensure_ascii=False) for m in salida.pop("municipios"))
    cabecera_json = json.dumps(salida, ensure_ascii=False, indent=2)[:-2]
    DESTINO.write_text(f'{cabecera_json},\n  "municipios": [\n{lineas}\n  ]\n}}\n', encoding="utf-8", newline="\n")

    total = sum(p for _, p in municipios.values())
    print(f"{len(municipios)} municipios a 1 de enero de {anio}, {total:,} habitantes en total.".replace(",", "."))
    print(f"Guardado en {DESTINO.relative_to(ROOT)}. Ejecuta ahora: python scripts/build_data.py")
    return 0


if __name__ == "__main__":
    sys.exit(main())
