"""Cliente mínimo de la API de datos abiertos del BOE (legislación consolidada).

Documentación: https://www.boe.es/datosabiertos/api/api.php
Solo usa la biblioteca estándar para poder reutilizarse desde los scripts.
"""
from __future__ import annotations

import json
import urllib.error
import urllib.request
import xml.etree.ElementTree as ET

BASE = "https://www.boe.es/datosabiertos/api/legislacion-consolidada/id/"
USER_AGENT = "competencias-espana/0.2 (verificacion de referencias legales)"


class ErrorBOE(Exception):
    """La API del BOE no devolvió lo esperado (norma inexistente, red caída...)."""


def _get(ruta: str, accept: str) -> bytes:
    peticion = urllib.request.Request(
        BASE + ruta, headers={"Accept": accept, "User-Agent": USER_AGENT}
    )
    try:
        with urllib.request.urlopen(peticion, timeout=30) as resp:
            return resp.read()
    except urllib.error.HTTPError as exc:
        raise ErrorBOE(f"HTTP {exc.code} al consultar {ruta}") from exc
    except OSError as exc:
        raise ErrorBOE(f"Sin conexión con el BOE ({exc})") from exc


def _get_json(ruta: str) -> list:
    cuerpo = json.loads(_get(ruta, "application/json"))
    if cuerpo.get("status", {}).get("code") != "200":
        raise ErrorBOE(f"Respuesta inesperada del BOE para {ruta}: {cuerpo.get('status')}")
    return cuerpo.get("data", [])


def _fecha(valor: str | None) -> str | None:
    """'20261005T100626Z' o '19850403' -> '2026-10-05'."""
    if not valor or len(valor) < 8:
        return None
    return f"{valor[0:4]}-{valor[4:6]}-{valor[6:8]}"


def estado_norma(id_boe: str) -> dict:
    """Título y situación de vigencia de una norma consolidada."""
    datos = _get_json(f"{id_boe}/metadatos")
    if not datos:
        raise ErrorBOE(f"El BOE no devuelve metadatos para {id_boe}")
    meta = datos[0]
    derogada = meta.get("estatus_derogacion") == "S"
    anulada = meta.get("estatus_anulacion") == "S"
    agotada = meta.get("vigencia_agotada") == "S"
    return {
        "id_boe": id_boe,
        "titulo": meta.get("titulo"),
        "rango": (meta.get("rango") or {}).get("texto"),
        "vigente": not (derogada or anulada or agotada),
        "derogada": derogada,
        "anulada": anulada,
        "vigencia_agotada": agotada,
        "ultima_actualizacion": _fecha(meta.get("fecha_actualizacion")),
        "url": meta.get("url_html_consolidada")
        or f"https://www.boe.es/buscar/act.php?id={id_boe}",
    }


def indice(id_boe: str) -> list[dict]:
    """Bloques (artículos, disposiciones...) de la norma: [{id, titulo}]."""
    datos = _get_json(f"{id_boe}/texto/indice")
    bloques = datos[0].get("bloque", []) if datos else []
    return [{"id": b.get("id"), "titulo": b.get("titulo") or ""} for b in bloques]


def texto_bloque(id_boe: str, bloque: str) -> str:
    """Texto vigente (última versión consolidada) de un bloque de la norma."""
    raiz = ET.fromstring(_get(f"{id_boe}/texto/bloque/{bloque}", "application/xml"))
    versiones = raiz.findall(".//version")
    if not versiones:
        raise ErrorBOE(f"El bloque {bloque} de {id_boe} no tiene texto")
    parrafos = ("".join(p.itertext()).strip() for p in versiones[-1].iter("p"))
    return "\n".join(p for p in parrafos if p)
