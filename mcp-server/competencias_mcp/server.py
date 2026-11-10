"""Servidor MCP de competencias administrativas en España.

Expone la matriz competencial a cualquier cliente MCP (Claude, Cursor...)
mediante herramientas deterministas: no contiene ningún modelo de IA, solo
datos verificados y lógica de negocio.
"""
from __future__ import annotations

import json
import urllib.request
from pathlib import Path

from fastmcp import FastMCP

from . import boe, core

_AQUI = Path(__file__).resolve().parent
# Instalado como paquete los datos viajan dentro (datos/); en el repositorio están en data/.
_DIR_DATOS = _AQUI / "datos" if (_AQUI / "datos").exists() else _AQUI.parent.parent / "data"


def _cargar(nombre: str, por_defecto: dict | None = None) -> dict:
    ruta = _DIR_DATOS / nombre
    if not ruta.exists() and por_defecto is not None:
        return por_defecto
    return json.loads(ruta.read_text(encoding="utf-8"))


DATOS = _cargar("competencias.json")
CARRETERAS = _cargar("carreteras.json")
VERIFICACION = _cargar("verificacion_boe.json", {})
PREGUNTAS = _cargar("casos.json")["casos"]
SERVICIOS = _cargar("servicios_municipales.json")
PROVINCIAS = _cargar("provincias.json")["provincias"]
PADRON = _cargar("municipios.json", {"municipios": []})
MATERIAS = DATOS["materias"]
TERRITORIOS = DATOS["territorios"]

mcp = FastMCP(
    "competencias-espana",
    instructions=(
        "Reparto competencial entre administraciones públicas en España (Estado, comunidades "
        "autónomas, diputaciones y ayuntamientos), con la ley y el artículo del BOE que lo "
        "establecen. Usa buscar_competencia para saber quién es responsable de una materia o "
        "problema: devuelve primero `respuestas_directas` a preguntas concretas y después las "
        "fichas de materia. Pasa `comunidad` si conoces el territorio, porque la respuesta "
        "cambia (régimen foral, Rodalies, policías autonómicas...). Usa consultar_municipio "
        "para saber qué servicios está obligado a prestar un ayuntamiento según su población, "
        "identificar_titular_carretera con coordenadas GPS y verificar_vigencia_boe para "
        "comprobar que una norma sigue vigente. El contenido está pendiente de revisión por un jurista. "
        "Los datos describen el marco general y son divulgativos: cita siempre la referencia legal."
    ),
)


def _iso_de(comunidad: str | None) -> str | None:
    """Acepta el código ISO («ES-MD») o el nombre («Madrid», «país vasco»)."""
    if not comunidad:
        return None
    buscado = core.normalizar(comunidad)
    for territorio in TERRITORIOS:
        if comunidad.upper() == territorio["iso"]:
            return territorio["iso"]
    for territorio in TERRITORIOS:
        nombre = core.normalizar(territorio["nombre"])
        if buscado == nombre or buscado in nombre.split(" ") or buscado in nombre:
            return territorio["iso"]
    raise ValueError(
        f"Comunidad desconocida: «{comunidad}». Valores válidos: "
        + ", ".join(f"{t['nombre']} ({t['iso']})" for t in TERRITORIOS)
    )


def _con_url(refs: list[dict]) -> list[dict]:
    return [
        {"norma": r["norma"], "articulo": r["articulo"], "id_boe": r["id_boe"], "url": core.url_ref(r)}
        for r in refs
    ]


def _ficha(materia: dict, iso: str | None) -> dict:
    """Materia lista para un agente: sin tags y con las excepciones que apliquen."""
    nombres = {t["iso"]: t["nombre"] for t in TERRITORIOS}
    excepciones = core.excepciones_de(materia, iso) if iso else materia.get("excepciones", [])
    ficha = {
        "id": materia["id"],
        "nombre": materia["nombre"],
        "descripcion": materia["descripcion"],
        "niveles": [
            {
                "administracion": core.ETIQUETAS[n["administracion"]],
                "rol": n["rol"],
                "detalle": n["detalle"],
                **({"donde_acudir": n["donde"]} if n.get("donde") else {}),
                "referencias": _con_url(n["refs"]),
            }
            for n in materia["niveles"]
        ],
        "excepciones_territoriales": [
            {
                "territorios": [nombres[i] for i in x["ccaa"]],
                "titulo": x["titulo"],
                "detalle": x["detalle"],
                "referencias": _con_url(x["refs"]),
            }
            for x in excepciones
        ],
    }
    if iso:
        ficha["comunidad_consultada"] = nombres[iso]
    return ficha


def _respuesta(caso: dict, iso: str | None) -> dict:
    """Pregunta concreta resuelta para un territorio, lista para un agente."""
    nombres = {t["iso"]: t["nombre"] for t in TERRITORIOS}
    resuelto = core.resolver_caso(caso, iso)
    materia = next(m for m in MATERIAS if m["id"] == caso["materia"])
    nivel = next((n for n in materia["niveles"] if n["administracion"] == resuelto["admin"]), None)
    respuesta = {
        "pregunta": caso["pregunta"],
        "responsable": core.titular_corto(resuelto["admin"], iso, TERRITORIOS),
        "administracion": core.ETIQUETAS[resuelto["admin"]],
        "respuesta": resuelto["respuesta"],
        "materia": caso["materia"],
        "referencias": _con_url(core.refs_de_caso(caso, MATERIAS, iso)),
    }
    if nivel and nivel.get("donde"):
        respuesta["donde_acudir"] = nivel["donde"]
    if not iso and caso.get("excepciones"):
        respuesta["cambia_en"] = [
            {
                "territorios": [nombres[i] for i in x["ccaa"]],
                "administracion": core.ETIQUETAS[x["admin"]],
                "respuesta": x["respuesta"],
            }
            for x in caso["excepciones"]
        ]
    return respuesta


@mcp.tool()
def listar_materias() -> list[dict]:
    """Catálogo de materias disponibles (id, nombre y descripción)."""
    return [{"id": m["id"], "nombre": m["nombre"], "descripcion": m["descripcion"]} for m in MATERIAS]


@mcp.tool()
def buscar_competencia(termino: str, comunidad: str | None = None, max_resultados: int = 3) -> dict:
    """Busca qué administraciones son competentes sobre una materia o problema.

    Args:
        termino: Materia o problema en lenguaje llano: "becas comedor",
            "listas de espera", "recogida de basuras", "quién arregla los baches".
        comunidad: Opcional. Comunidad autónoma por nombre o código ISO
            ("Cataluña", "ES-PV"). Si se indica, solo se devuelven las
            excepciones que aplican en ese territorio.
        max_resultados: Número máximo de materias devueltas.

    Returns:
        `respuestas_directas`: preguntas concretas que encajan, con la
        administración responsable, una respuesta en una frase, dónde acudir y
        la referencia legal. Sin `comunidad`, `cambia_en` indica los
        territorios donde la respuesta es otra.
        `materias`: fichas por relevancia, con el papel del Estado, la
        comunidad autónoma, la diputación y el ayuntamiento, sus referencias
        (norma, artículo y URL del BOE) y las excepciones territoriales.
    """
    iso = _iso_de(comunidad)
    limite = max(1, max_resultados)
    preguntas = [c for _, c in core.buscar_casos(PREGUNTAS, termino)[:limite]]
    resultados = core.buscar(MATERIAS, termino)[:limite]
    encontradas = {m["id"] for _, m in resultados}
    for caso in preguntas:  # la materia de una pregunta que encaja se ofrece siempre
        if caso["materia"] not in encontradas and len(resultados) < limite:
            resultados.append((0, next(m for m in MATERIAS if m["id"] == caso["materia"])))
            encontradas.add(caso["materia"])
    if not resultados and not preguntas:
        return {
            "resultado": "sin_coincidencias",
            "sugerencia": "Prueba con otro término o consulta listar_materias.",
            "materias_disponibles": [m["id"] for m in MATERIAS],
        }
    return {
        "resultado": "ok",
        "referencias_verificadas_boe": VERIFICACION.get("fecha"),
        "respuestas_directas": [_respuesta(c, iso) for c in preguntas],
        "materias": [_ficha(m, iso) for _, m in resultados],
    }


@mcp.tool()
def obtener_materia(id_materia: str, comunidad: str | None = None) -> dict:
    """Ficha completa de una materia por su id (ver listar_materias).

    Args:
        id_materia: Identificador, p. ej. "sanidad" o "transporte-publico".
        comunidad: Opcional. Comunidad autónoma por nombre o código ISO.
    """
    materia = next((m for m in MATERIAS if m["id"] == id_materia), None)
    if materia is None:
        raise ValueError(f"No existe la materia «{id_materia}». Consulta listar_materias.")
    return _ficha(materia, _iso_de(comunidad))


@mcp.tool()
def consultar_municipio(nombre: str) -> dict:
    """Servicios que un ayuntamiento está obligado a prestar según su población.

    Usa las cifras oficiales del padrón (INE) y el artículo 26 de la Ley de
    Bases del Régimen Local, cuyos mínimos dependen de si el municipio supera
    los 5.000, 20.000 o 50.000 habitantes.

    Args:
        nombre: Nombre del municipio ("Tolosa", "A Coruña") o su código INE de
            cinco cifras ("28079").

    Returns:
        Población, provincia, comunidad, servicios obligatorios por tramo, el
        apoyo que debe dar la diputación a los municipios pequeños y sus
        administraciones. Si el nombre es ambiguo, devuelve los candidatos.
    """
    buscado = core.normalizar(nombre)
    municipios = PADRON["municipios"]
    exactos = [m for m in municipios if m[0] == nombre.strip() or core.normalizar(m[1]) == buscado]
    if not exactos:
        exactos = [m for m in municipios if buscado and buscado in core.normalizar(m[1]).split("/")[0]]
        exactos.sort(key=lambda m: -m[2])
    if not exactos:
        return {"resultado": "sin_coincidencias", "detalle": f"No hay ningún municipio llamado «{nombre}»."}
    if len(exactos) > 1:
        return {
            "resultado": "ambiguo",
            "detalle": "Hay varios municipios que encajan; repite la consulta con el código INE.",
            "candidatos": [
                {"codigo_ine": c, "nombre": n, "provincia": PROVINCIAS[c[:2]]["nombre"], "poblacion": p}
                for c, n, p in exactos[:10]
            ],
        }

    codigo, nombre_oficial, poblacion = exactos[0]
    provincia = PROVINCIAS[codigo[:2]]
    territorio = next(t for t in TERRITORIOS if t["iso"] == provincia["ccaa"])
    obligatorios = core.servicios_obligatorios(SERVICIOS, poblacion)
    intermedia = provincia["intermedia"] or f"{territorio['gobierno']} (comunidad de una sola provincia)"
    es_ciudad_autonoma = provincia["ccaa"] in ("ES-CE", "ES-ML")
    return {
        "resultado": "ok",
        "municipio": nombre_oficial,
        "codigo_ine": codigo,
        "provincia": provincia["nombre"],
        "comunidad": territorio["nombre"],
        "poblacion": poblacion,
        "fecha_padron": PADRON.get("fecha_referencia"),
        "fuente_poblacion": PADRON.get("fuente"),
        "servicios_obligatorios": [
            {
                "tramo": t["titulo"],
                "articulo": t["apartado"],
                "servicios": [s["nombre"] for s in t["servicios"]],
            }
            for t in obligatorios["tramos"]
        ],
        "apoyo_de_la_diputacion": [] if es_ciudad_autonoma else [
            {"texto": a["texto"].replace("{intermedia}", intermedia), "articulo": a["apartado"]}
            for a in obligatorios["apoyos"]
        ],
        "administraciones": {
            "ayuntamiento": f"Ayuntamiento de {nombre_oficial}" if not es_ciudad_autonoma else territorio["gobierno"],
            "diputacion": provincia["intermedia"],
            "comunidad_autonoma": territorio["gobierno"],
            "portal_comunidad": territorio["web"],
        },
        "referencias": _con_url([SERVICIOS["ref"], SERVICIOS["ref_diputacion"]]),
        "aviso": "Es el mínimo legal: el ayuntamiento puede prestar más servicios.",
    }


def _geocodificar(lat: float, lon: float) -> dict:
    peticion = urllib.request.Request(
        core.url_geocodificador(CARRETERAS["geocodificador"], lat, lon),
        headers={"User-Agent": "competencias-espana-mcp/0.2 (uso divulgativo)"},
    )
    with urllib.request.urlopen(peticion, timeout=20) as resp:
        return json.load(resp)


@mcp.tool()
def identificar_titular_carretera(latitud: float, longitud: float) -> dict:
    """Identifica la vía más cercana a unas coordenadas y deduce quién es su titular.

    Localiza la vía en OpenStreetMap y aplica la nomenclatura oficial según el
    territorio (por ejemplo, en el País Vasco y Navarra no hay red estatal).
    Es una estimación con grado de confianza, no un dato registral.

    Args:
        latitud: Latitud WGS84, p. ej. 40.4168.
        longitud: Longitud WGS84, p. ej. -3.7038.
    """
    try:
        respuesta = _geocodificar(latitud, longitud)
    except Exception as exc:  # red caída, límite de peticiones...
        return {"resultado": "error", "detalle": f"El geocodificador de OpenStreetMap no responde: {exc}"}

    hallazgo = core.interpretar_geocodificacion(respuesta, latitud, longitud)
    via, territorio = hallazgo["via"], hallazgo["territorio"]
    limite = CARRETERAS["distancia_maxima_m"]
    if via is None or (via["distancia"] is not None and via["distancia"] > limite):
        return {"resultado": "sin_via", "detalle": f"No hay ninguna vía a menos de {limite} m del punto."}

    clasificacion = core.clasificar_via(CARRETERAS, via, territorio["ccaa"])
    admin = clasificacion["admin"]
    niveles = next(m for m in MATERIAS if m["id"] == "carreteras")["niveles"]
    nivel = next((n for n in niveles if n["administracion"] == admin), None)
    nombres = {t["iso"]: t["nombre"] for t in TERRITORIOS}
    return {
        "resultado": "ok",
        "via": via["ref"] or via["nombre"] or "vía sin nombre",
        "nombre": via["nombre"],
        "tipo_osm": via["tipo"],
        "distancia_m": via["distancia"],
        "territorio": {
            "comunidad": nombres.get(territorio["ccaa"]),
            "provincia": territorio["provincia"],
            "municipio": territorio["municipio"],
        },
        "administracion": core.ETIQUETAS.get(admin, "No determinada"),
        "titular": core.nombre_titular(CARRETERAS, clasificacion, territorio, TERRITORIOS),
        "confianza": clasificacion["confianza"],
        "motivo": clasificacion["motivo"],
        "referencias": _con_url(nivel["refs"]) if nivel else [],
    }


@mcp.tool()
def verificar_vigencia_boe(id_norma: str) -> dict:
    """Comprueba en tiempo real en el BOE si una norma sigue vigente.

    Args:
        id_norma: Identificador del BOE, p. ej. "BOE-A-1985-5392" (es el campo
            id_boe de las referencias que devuelven las demás herramientas).

    Returns:
        Título, si está vigente, derogada o anulada, y la fecha de la última
        actualización del texto consolidado.
    """
    try:
        return {"resultado": "ok", **boe.estado_norma(id_norma.strip())}
    except boe.ErrorBOE as exc:
        return {"resultado": "error", "detalle": str(exc)}


@mcp.resource("competencias://espana/matriz_completa")
def matriz_completa() -> str:
    """Matriz competencial completa en JSON (todas las materias, excepciones y referencias)."""
    return json.dumps(
        {
            "referencias_verificadas_boe": VERIFICACION.get("fecha"),
            "avisos": DATOS["avisos"],
            "materias": [_ficha(m, None) for m in MATERIAS],
            "preguntas": [_respuesta(c, None) for c in PREGUNTAS],
        },
        ensure_ascii=False,
        indent=2,
    )


def main() -> None:
    mcp.run()


if __name__ == "__main__":
    main()
