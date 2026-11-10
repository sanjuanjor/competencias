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
MATERIAS = DATOS["materias"]
TERRITORIOS = DATOS["territorios"]

mcp = FastMCP(
    "competencias-espana",
    instructions=(
        "Reparto competencial entre administraciones públicas en España (Estado, comunidades "
        "autónomas, diputaciones y ayuntamientos), con la ley y el artículo del BOE que lo "
        "establecen. Usa buscar_competencia para saber quién es responsable de una materia o "
        "problema; pasa `comunidad` si conoces el territorio, porque hay excepciones (régimen "
        "foral, Rodalies, policías autonómicas...). Usa identificar_titular_carretera con "
        "coordenadas GPS y verificar_vigencia_boe para comprobar que una norma sigue vigente. "
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
        Materias por relevancia. Cada una desglosa el papel del Estado, la
        comunidad autónoma, la diputación y el ayuntamiento con su referencia
        legal (norma, artículo y URL del BOE al artículo), y las excepciones
        territoriales.
    """
    iso = _iso_de(comunidad)
    resultados = core.buscar(MATERIAS, termino)[: max(1, max_resultados)]
    if not resultados:
        return {
            "resultado": "sin_coincidencias",
            "sugerencia": "Prueba con otro término o consulta listar_materias.",
            "materias_disponibles": [m["id"] for m in MATERIAS],
        }
    return {
        "resultado": "ok",
        "referencias_verificadas_boe": VERIFICACION.get("fecha"),
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
        },
        ensure_ascii=False,
        indent=2,
    )


def main() -> None:
    mcp.run()


if __name__ == "__main__":
    main()
