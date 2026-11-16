"""Descarga quién ocupa la alcaldía de cada municipio y la web de su ayuntamiento,
y genera data/ayuntamientos.json.

Fuentes:
- Alcaldías: Ministerio de Política Territorial y Memoria Democrática, registro de
  cargos electos de las entidades locales (mandato 2023-2027). Es una foto del
  alcalde actual de cada municipio, con la lista por la que fue elegido y la fecha
  de toma de posesión (recoge mociones de censura y relevos). Si el portal oficial
  está en mantenimiento se usa la copia literal del mismo Excel que guarda
  OpenSanctions cada semana.
- Familia política de cada lista: tabla de reglas de SpainFacts
  (transform/seeds/partidos_familias.csv), que agrupa las ≈1.100 etiquetas del
  registro (PSC-CP, PSdeG-PSOE, CM, ERC-AM…) en partidos reconocibles.
- Web del ayuntamiento: Wikidata (propiedad P856 de cada municipio, por su código INE).

Uso:  python scripts/actualizar_ayuntamientos.py
Después: python scripts/build_data.py
"""
from __future__ import annotations

import csv
import io
import json
import re
import sys
import unicodedata
import urllib.parse
import urllib.request
from datetime import date, datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DESTINO = ROOT / "data" / "ayuntamientos.json"
MUNICIPIOS = ROOT / "data" / "municipios.json"

AGENTE = {"User-Agent": "competencias-espana/0.4 (https://github.com/sanjuanjor/competencias; uso divulgativo)"}
URL_OFICIAL = "https://concejales.redsara.es/consulta/getAlcaldesLegislatura"
PAGINA_OFICIAL = "https://concejales.redsara.es/consulta/"
INDICE_COPIA = "https://data.opensanctions.org/datasets/latest/es_mayors_councillors/index.json"
URL_FAMILIAS = "https://raw.githubusercontent.com/spainfacts/spainfacts.github.io/main/transform/seeds/partidos_familias.csv"
MANDATO = "2023-2027"
WIKIDATA = "https://query.wikidata.org/sparql"
CONSULTA_WEBS = "SELECT ?ine ?web WHERE { ?m wdt:P772 ?ine . ?m wdt:P856 ?web . }"

# Familias que no aportan nada al lector frente a la etiqueta original.
FAMILIAS_SIN_INFORMACION = {"Sin detalle en la fuente", "Independientes y locales", "Otros partidos", "Comisión gestora"}
PARTICULAS = {"de", "del", "la", "las", "los", "y", "i", "e", "da", "das", "do", "dos", "van", "von", "der"}


def descargar(url: str, cabeceras: dict | None = None, timeout: int = 120) -> bytes:
    peticion = urllib.request.Request(url, headers={**AGENTE, **(cabeceras or {})})
    with urllib.request.urlopen(peticion, timeout=timeout) as resp:
        return resp.read()


def clave(texto: str) -> str:
    """Igual que SpainFacts: mayúsculas, sin tildes y cualquier signo como espacio."""
    t = unicodedata.normalize("NFKD", texto or "")
    t = "".join(c for c in t if not unicodedata.combining(c))
    return re.sub(r"[^A-Z0-9]+", " ", t.upper()).strip()


def nombre_propio(texto: str) -> str:
    """«JUAN JOSÉ CASTELLÓ MOLINA» -> «Juan José Castelló Molina». Respeta lo que ya viene en mixtas."""
    texto = re.sub(r"\s+", " ", texto or "").strip()
    if not texto or texto != texto.upper():
        return texto
    palabras = []
    for i, palabra in enumerate(texto.lower().split(" ")):
        if i and palabra in PARTICULAS:
            palabras.append(palabra)
        else:
            palabras.append("-".join(p[:1].upper() + p[1:] for p in palabra.split("-")))
    nombre = " ".join(palabras)
    # D'Angelo, L'Hospitalet, Mª
    return re.sub(r"\b([DL])'(\w)", lambda m: m.group(1).upper() + "'" + m.group(2).upper(), nombre)


def fecha_iso(valor) -> str | None:
    if isinstance(valor, datetime):
        return valor.date().isoformat()
    if isinstance(valor, date):
        return valor.isoformat()
    if isinstance(valor, str) and re.fullmatch(r"\d{1,2}/\d{1,2}/\d{4}", valor.strip()):
        return datetime.strptime(valor.strip(), "%d/%m/%Y").date().isoformat()
    return None


def obtener_excel() -> tuple[bytes, str, str]:
    """Devuelve (contenido, url_de_origen, descripción)."""
    try:
        contenido = descargar(URL_OFICIAL)
        if contenido[:2] == b"PK":
            return contenido, URL_OFICIAL, "portal oficial"
        print("El portal oficial no devuelve el Excel (¿mantenimiento?): se usa la copia de OpenSanctions.")
    except OSError as error:
        print(f"El portal oficial no responde ({error}): se usa la copia de OpenSanctions.")
    indice = json.loads(descargar(INDICE_COPIA))
    recurso = next(r for r in indice["resources"] if r["name"] == "current.xlsx")
    return descargar(recurso["url"]), recurso["url"], f"copia de OpenSanctions del {indice['updated_at'][:10]}"


def leer_alcaldias(contenido: bytes) -> dict[str, dict]:
    from openpyxl import load_workbook  # pip install openpyxl

    hoja = load_workbook(io.BytesIO(contenido), read_only=True).worksheets[0]
    filas = hoja.iter_rows(values_only=True)
    columnas = None
    for fila in filas:
        claves = [clave(str(c)) if c is not None else "" for c in fila]
        if "CODIGO INE" in claves and "CARGO" in claves:
            columnas = {c: i for i, c in enumerate(claves)}
            break
    if columnas is None:
        raise SystemExit("El formato del registro ha cambiado: no encuentro la cabecera.")

    def valor(fila, nombre):
        return fila[columnas[nombre]]

    alcaldias: dict[str, dict] = {}
    for fila in filas:
        cargo = str(valor(fila, "CARGO") or "").strip()
        if not (cargo.lower().startswith("alcalde") or cargo.lower().startswith("presidente gestor")):
            continue
        codigo_bruto = valor(fila, "CODIGO INE")
        codigo = (str(int(codigo_bruto)) if isinstance(codigo_bruto, (int, float)) else re.sub(r"\D", "", str(codigo_bruto))).zfill(6)[:5]
        nombre = " ".join(nombre_propio(str(valor(fila, c) or "")) for c in ("NOMBRE", "1ER APELLIDO", "2O APELLIDO")).strip()
        nombre = re.sub(r"\s+", " ", nombre)
        registro = {
            "nombre": nombre,
            "lista": re.sub(r"\s+", " ", str(valor(fila, "PARTIDO") or "")).strip() or None,
            "desde": fecha_iso(valor(fila, "FECHA DE POSESION")),
        }
        if cargo.lower() != "alcalde":
            registro["cargo"] = cargo
        anterior = alcaldias.get(codigo)
        # Si hubiera dos filas, gana la toma de posesión más reciente.
        if anterior is None or (registro["desde"] or "") > (anterior["desde"] or ""):
            alcaldias[codigo] = registro
    return alcaldias


def leer_familias() -> tuple[list[tuple[re.Pattern | str, str, str]], dict[tuple[str, str], str]]:
    """Etiquetas exactas de SpainFacts (generales y excepciones por municipio)."""
    texto = descargar(URL_FAMILIAS).decode("utf-8")
    generales: dict[str, str] = {}
    excepciones: dict[tuple[str, str], str] = {}
    for fila in csv.DictReader(io.StringIO(texto)):
        if fila["mandato"] not in ("", MANDATO):
            continue
        if fila["cod_mun"]:
            excepciones[(fila["partido_original"], fila["cod_mun"])] = fila["familia"]
        elif fila["mandato"] == MANDATO or fila["partido_original"] not in generales:
            generales[fila["partido_original"]] = fila["familia"]
    return generales, excepciones


def familia_legible(lista: str | None, codigo: str, generales: dict, excepciones: dict) -> str | None:
    if not lista:
        return None
    k = clave(lista)
    familia = excepciones.get((k, codigo)) or generales.get(k)
    if not familia or familia in FAMILIAS_SIN_INFORMACION:
        return None
    # «PSOE-A» ya dice PSOE; «PSC-CP» no dice PSOE.
    palabras = set(k.split(" "))
    if all(p in palabras for p in clave(familia.split(" (")[0]).split(" ")):
        return None
    return familia


def leer_webs() -> dict[str, str]:
    url = WIKIDATA + "?" + urllib.parse.urlencode({"query": CONSULTA_WEBS})
    texto = descargar(url, {"Accept": "text/csv"}, timeout=180).decode("utf-8")
    candidatas: dict[str, list[str]] = {}
    for fila in csv.DictReader(io.StringIO(texto)):
        codigo = re.sub(r"\D", "", fila["ine"])[:5]
        web = fila["web"].strip()
        if len(codigo) == 5 and web.startswith("http"):
            candidatas.setdefault(codigo, []).append(web)
    # Preferimos https y, a igualdad, la dirección más corta (la portada).
    return {c: sorted(set(ws), key=lambda w: (not w.startswith("https"), len(w)))[0] for c, ws in candidatas.items()}


def main() -> int:
    municipios = {m[0]: m[1] for m in json.loads(MUNICIPIOS.read_text(encoding="utf-8"))["municipios"]}

    print("Descargando el registro de alcaldes…")
    contenido, origen, descripcion = obtener_excel()
    alcaldias = leer_alcaldias(contenido)
    if len(alcaldias) < 8000:
        print(f"Solo hay {len(alcaldias)} alcaldías: algo va mal, no se guarda.")
        return 1

    print("Descargando la tabla de familias políticas de SpainFacts…")
    generales, excepciones = leer_familias()
    print("Consultando las webs municipales en Wikidata…")
    try:
        webs = leer_webs()
    except OSError as error:
        print(f"Wikidata no responde ({error}): se conservan las webs anteriores.")
        anterior = json.loads(DESTINO.read_text(encoding="utf-8")) if DESTINO.exists() else {"ayuntamientos": {}}
        webs = {c: a["web"] for c, a in anterior["ayuntamientos"].items() if a.get("web")}

    ayuntamientos = {}
    for codigo in sorted(municipios):
        entrada: dict = {}
        if codigo in alcaldias:
            alcaldia = dict(alcaldias[codigo])
            familia = familia_legible(alcaldia["lista"], codigo, generales, excepciones)
            if familia:
                alcaldia["familia"] = familia
            entrada["alcaldia"] = alcaldia
        if codigo in webs:
            entrada["web"] = webs[codigo]
        if entrada:
            ayuntamientos[codigo] = entrada

    ultima = max((a["alcaldia"]["desde"] or "") for a in ayuntamientos.values() if "alcaldia" in a)
    salida = {
        "descripcion": "Alcaldía de cada municipio (mandato 2023-2027) y web del ayuntamiento. Lo genera scripts/actualizar_ayuntamientos.py.",
        "fuentes": {
            "alcaldias": {"nombre": "Ministerio de Política Territorial y Memoria Democrática, registro de cargos electos locales",
                          "url": PAGINA_OFICIAL, "descarga": origen, "via": descripcion},
            "familias": {"nombre": "SpainFacts, tabla de familias políticas", "url": "https://github.com/spainfacts/spainfacts.github.io/blob/main/transform/seeds/partidos_familias.md"},
            "webs": {"nombre": "Wikidata (P856)", "url": "https://www.wikidata.org/wiki/Property:P856"},
        },
        "fecha_descarga": date.today().isoformat(),
        "ultimo_cambio": ultima,
        "ayuntamientos": ayuntamientos,
    }
    lineas = ",\n".join(f"    {json.dumps(c)}: {json.dumps(a, ensure_ascii=False)}" for c, a in ayuntamientos.items())
    cabecera = json.dumps({k: v for k, v in salida.items() if k != "ayuntamientos"}, ensure_ascii=False, indent=2)[:-2]
    DESTINO.write_text(f'{cabecera},\n  "ayuntamientos": {{\n{lineas}\n  }}\n}}\n', encoding="utf-8", newline="\n")

    con_alcaldia = sum(1 for a in ayuntamientos.values() if "alcaldia" in a)
    con_web = sum(1 for a in ayuntamientos.values() if "web" in a)
    sin = sorted(set(municipios) - {c for c, a in ayuntamientos.items() if "alcaldia" in a})
    print(f"{con_alcaldia} de {len(municipios)} municipios con alcaldía (último cambio: {ultima}); {con_web} con web.")
    if sin:
        print(f"Sin alcaldía en el registro ({len(sin)}): " + ", ".join(f"{c} {municipios[c]}" for c in sin))
    print(f"Guardado en {DESTINO.relative_to(ROOT)}. Ejecuta ahora: python scripts/build_data.py")
    return 0


if __name__ == "__main__":
    sys.exit(main())
