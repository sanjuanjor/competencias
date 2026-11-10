"""Lógica pura del proyecto: buscador, detección de noticias y carreteras.

Es el equivalente en Python de shared/core.js. Ambas implementaciones se
validan contra los mismos casos (tests/casos.json): si cambias una, cambia la
otra y ejecuta los tests.
"""
from __future__ import annotations

import math
import re
import unicodedata

ETIQUETAS = {
    "estado": "Estado",
    "ccaa": "Comunidad Autónoma",
    "provincial": "Diputación",
    "municipal": "Ayuntamiento",
}

UMBRAL_NOTICIA = 3


# ---------- texto ----------

def normalizar(texto: str) -> str:
    texto = unicodedata.normalize("NFD", (texto or "").lower())
    texto = "".join(c for c in texto if not "̀" <= c <= "ͯ")
    return re.sub(r"\s+", " ", re.sub(r"[^a-z0-9\s]", " ", texto)).strip()


def raiz_de(palabra: str) -> str:
    """Raíz aproximada para igualar singular y plural."""
    if len(palabra) > 3 and palabra.endswith("s"):
        palabra = palabra[:-1]
    if len(palabra) > 4 and palabra.endswith("e"):
        palabra = palabra[:-1]
    return palabra


STOPWORDS = {raiz_de(p) for p in (
    "que", "quien", "quienes", "cual", "cuales", "como", "donde", "cuando",
    "del", "las", "los", "una", "unos", "unas", "con", "sin", "por", "para",
    "sobre", "entre", "este", "esta", "estos", "estas", "ese", "esa", "mis",
    "gestiona", "paga", "pagan", "encarga", "responsable", "compete", "competencia",
    "depende", "dependen", "hace", "tiene", "son", "quiero", "saber",
)}


def tokens(texto: str) -> list[str]:
    limpio = normalizar(texto)
    return [raiz_de(p) for p in limpio.split(" ")] if limpio else []


def _contiene_secuencia(palabras: list[str], secuencia: list[str]) -> bool:
    n = len(secuencia)
    return any(palabras[i:i + n] == secuencia for i in range(len(palabras) - n + 1))


def url_ref(ref: dict) -> str:
    base = f"https://www.boe.es/buscar/act.php?id={ref['id_boe']}"
    return f"{base}#{ref['bloque']}" if ref.get("bloque") else base


# ---------- índice de tags por materia ----------

_INDICES: dict[str, dict] = {}


def _indice_de(materia: dict) -> dict:
    indice = _INDICES.get(materia["id"])
    if indice is None:
        vistos: dict[str, dict] = {}
        for fuerte, lista in ((True, materia.get("tags", [])), (False, materia.get("tags_debiles", []))):
            for tag in lista:
                secuencia = tokens(tag)
                if not secuencia:
                    continue
                clave = " ".join(secuencia)
                if clave not in vistos:
                    vistos[clave] = {"secuencia": secuencia, "fuerte": fuerte}
                elif fuerte:
                    vistos[clave]["fuerte"] = True
        indice = {
            "tags": list(vistos.values()),
            "nombre": set(tokens(materia["nombre"])),
            "descripcion": set(tokens(materia["descripcion"])),
        }
        _INDICES[materia["id"]] = indice
    return indice


# ---------- buscador ----------

def puntuar(materia: dict, consulta: str, prefijos: bool = False) -> int:
    """Puntúa una materia frente a una consulta en lenguaje llano (0 = nada)."""
    palabras = tokens(consulta)
    if not palabras:
        return 0
    indice = _indice_de(materia)
    explicadas: set[str] = set()
    puntos = 0

    for tag in indice["tags"]:
        if _contiene_secuencia(palabras, tag["secuencia"]):
            puntos += (3 if tag["fuerte"] else 2) + 2 * (len(tag["secuencia"]) - 1)
            explicadas.update(tag["secuencia"])

    significativas = [p for p in palabras if len(p) > 2 and p not in STOPWORDS]
    for palabra in significativas:
        if palabra in indice["nombre"]:
            puntos += 2
            explicadas.add(palabra)
        elif palabra in indice["descripcion"]:
            puntos += 1
            explicadas.add(palabra)

    if prefijos:
        for palabra in significativas:
            if len(palabra) < 4 or palabra in explicadas:
                continue
            if any(t.startswith(palabra) for tag in indice["tags"] for t in tag["secuencia"]):
                puntos += 1
    return puntos


def buscar(materias: list[dict], consulta: str, prefijos: bool = False) -> list[tuple[int, dict]]:
    resultados = [(puntuar(m, consulta, prefijos), m) for m in materias]
    return sorted((r for r in resultados if r[0] > 0), key=lambda r: -r[0])


# ---------- detección de materia en un titular ----------

def detectar_noticia(materias: list[dict], texto: str) -> dict | None:
    """Materia de la que trata un titular, o None si no hay señal suficiente."""
    palabras = tokens(texto)
    mejor: tuple[int, dict] | None = None
    segundo = 0
    for materia in materias:
        puntos = 0
        for tag in _indice_de(materia)["tags"]:
            if not _contiene_secuencia(palabras, tag["secuencia"]):
                continue
            puntos += 1 if not tag["fuerte"] else 4 if len(tag["secuencia"]) > 1 else 3
        if mejor is None or puntos > mejor[0]:
            segundo = mejor[0] if mejor else 0
            mejor = (puntos, materia)
        elif puntos > segundo:
            segundo = puntos
    if mejor is None or mejor[0] < UMBRAL_NOTICIA or mejor[0] == segundo:
        return None
    return mejor[1]


# ---------- excepciones territoriales ----------

def excepciones_de(materia: dict, iso_ccaa: str | None) -> list[dict]:
    if not iso_ccaa:
        return []
    return [e for e in materia.get("excepciones", []) if iso_ccaa in e["ccaa"]]


# ---------- carreteras ----------

def normalizar_ref(ref: str | None) -> str:
    return re.sub(r"\s+", "", re.split(r"[;/]", ref or "")[0].upper())


def clasificar_via(config: dict, via: dict, iso_ccaa: str | None) -> dict:
    """Deduce la administración titular. via = {ref, tipo, operador}."""
    operador = (via.get("operador") or "").lower()
    if operador:
        for regla in config["operadores"]:
            if re.search(regla["patron"], operador, re.IGNORECASE):
                return {
                    "admin": regla["admin"],
                    "confianza": "alta",
                    "motivo": f"OpenStreetMap registra como operador de la vía a «{via['operador']}».",
                    "titular": via["operador"],
                }

    ref = normalizar_ref(via.get("ref"))
    if not ref:
        if not via.get("tipo") or via["tipo"] in config["tipos_urbanos"]:
            return {
                "admin": "municipal",
                "confianza": "media",
                "motivo": "Vía sin código de carretera: las calles y caminos municipales son del Ayuntamiento.",
            }
        return {
            "admin": None,
            "confianza": "baja",
            "motivo": "La vía no tiene código de carretera en OpenStreetMap y no se puede deducir su titular.",
        }

    for regla in config["reglas"]:
        if regla.get("ccaa") and iso_ccaa not in regla["ccaa"]:
            continue
        if not re.search(regla["patron"], ref):
            continue
        return {
            "admin": regla["admin"],
            "confianza": regla["confianza"],
            "motivo": regla["motivo"].replace("{ref}", ref),
            "titular": regla.get("titular"),
        }
    return {"admin": None, "confianza": "baja", "motivo": f"No hay ninguna regla aplicable al código {ref}."}


def nombre_titular(config: dict, clasificacion: dict, territorio: dict | None, territorios: list[dict]) -> str:
    """Nombre concreto del titular («Comunidad de Madrid», «Diputación Foral de Bizkaia»...)."""
    if not clasificacion.get("admin"):
        return "Titular no determinado"
    lugar = territorio or {}
    ccaa = next((t for t in territorios if t["iso"] == lugar.get("ccaa")), None)
    plantilla = clasificacion.get("titular") or config["titulares"][clasificacion["admin"]]
    valores = {
        "gobierno": ccaa["gobierno"] if ccaa else None,
        "provincia": lugar.get("provincia"),
        "municipio": lugar.get("municipio"),
    }
    claves = re.findall(r"\{(\w+)\}", plantilla)
    if any(not valores.get(c) for c in claves):
        return ETIQUETAS[clasificacion["admin"]]
    return re.sub(r"\{(\w+)\}", lambda m: valores[m.group(1)], plantilla)


def url_geocodificador(base: str, lat: float, lon: float) -> str:
    """URL de geocodificación inversa (API de Nominatim): vía más cercana y territorio."""
    return (
        f"{base}?format=jsonv2&zoom=17&addressdetails=1&namedetails=1&extratags=1"
        f"&polygon_geojson=1&accept-language=es&lat={lat}&lon={lon}"
    )


def _distancia_a_segmento(lat: float, lon: float, a: list, b: list) -> float:
    """Distancia en metros al segmento a-b, con puntos [lon, lat]."""
    kx = 111320 * math.cos(math.radians(lat))
    ky = 110540
    ax, ay = (a[0] - lon) * kx, (a[1] - lat) * ky
    bx, by = (b[0] - lon) * kx, (b[1] - lat) * ky
    dx, dy = bx - ax, by - ay
    largo2 = dx * dx + dy * dy
    t = max(0.0, min(1.0, -(ax * dx + ay * dy) / largo2)) if largo2 else 0.0
    return math.hypot(ax + t * dx, ay + t * dy)


def distancia_a_geometria(lat: float, lon: float, geojson: dict | None) -> int | None:
    """Distancia en metros de un punto a una geometría GeoJSON; None si no se puede calcular."""
    if not geojson or not geojson.get("coordinates"):
        return None
    c = geojson["coordinates"]
    tipo = geojson.get("type")
    if tipo == "Point":
        lineas = [[c, c]]
    elif tipo == "LineString":
        lineas = [c]
    elif tipo in ("MultiLineString", "Polygon"):
        lineas = c
    elif tipo == "MultiPolygon":
        lineas = [anillo for poligono in c for anillo in poligono]
    else:
        lineas = []
    distancias = [
        _distancia_a_segmento(lat, lon, linea[i - 1], linea[i])
        for linea in lineas
        for i in range(1, len(linea))
    ]
    return _redondear(min(distancias)) if distancias else None


def _redondear(valor: float) -> int:
    """Redondeo «mitad hacia arriba», igual que Math.round en JavaScript."""
    return math.floor(valor + 0.5)


def interpretar_geocodificacion(respuesta: dict | None, lat: float, lon: float) -> dict:
    """{via, territorio} a partir de la respuesta del geocodificador.

    `via` es None si lo más cercano al punto no es una vía.
    """
    r = respuesta or {}
    direccion = r.get("address") or {}
    territorio = {
        "ccaa": direccion.get("ISO3166-2-lvl4"),
        "provincia": direccion.get("province"),
        "municipio": direccion.get("city") or direccion.get("town")
        or direccion.get("village") or direccion.get("municipality"),
    }
    if r.get("category") != "highway":
        return {"via": None, "territorio": territorio}
    nombres = r.get("namedetails") or {}
    extra = r.get("extratags") or {}
    return {
        "via": {
            "ref": nombres.get("ref", ""),
            "nombre": nombres.get("name:es") or nombres.get("name", ""),
            "tipo": r.get("type", ""),
            "operador": extra.get("operator", ""),
            "distancia": distancia_a_geometria(lat, lon, r.get("geojson")),
        },
        "territorio": territorio,
    }
