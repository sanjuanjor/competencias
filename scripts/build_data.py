"""Valida los datos y genera todo lo que la web y la extensión consumen.

Fuentes (lo único que se edita a mano):
    data/competencias.json          materias, niveles, excepciones, territorios y referencias
    data/casos.json                 preguntas concretas con respuesta directa
    data/carreteras.json            reglas de titularidad de vías
    data/servicios_municipales.json servicios obligatorios según la población
    data/provincias.json            provincias, comunidad y diputación
    data/municipios.json            padrón del INE (lo escribe actualizar_municipios.py)
    shared/core.js                  lógica compartida

Generado (no editar):
    web/config.js, web/data.js, web/municipios.js, web/core.js
    web/materia/<id>.html, web/pregunta/<id>.html, web/administracion/<admin>.html
    web/preguntas.html, índice de materias de web/index.html
    extension/data.js, extension/core.js

Uso:
    python scripts/build_data.py            valida y regenera
    python scripts/build_data.py --check    solo comprueba (código 1 si falta regenerar)
Con la variable de entorno SITE_URL (p. ej. https://usuario.github.io/competencias)
añade enlaces canónicos, imagen para redes y web/sitemap.xml.
"""
from __future__ import annotations

import html
import json
import os
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "data"
WEB = ROOT / "web"
CORE = ROOT / "shared" / "core.js"
INDEX = WEB / "index.html"

ADMINISTRACIONES = ("estado", "ccaa", "provincial", "municipal")
ETIQUETAS = {"estado": "Estado", "ccaa": "Comunidad Autónoma", "provincial": "Diputación", "municipal": "Ayuntamiento"}
VEREDICTOS = {
    "estado": "El Estado",
    "ccaa": "Tu comunidad autónoma",
    "provincial": "Tu diputación",
    "municipal": "Tu ayuntamiento",
}
PAGINAS_ADMIN = {
    "estado": ("Qué hace el Estado", "El Gobierno de España, sus ministerios y organismos, y las Cortes Generales. Se ocupa de lo que debe ser igual en todo el país y de las bases que luego desarrollan las comunidades."),
    "ccaa": ("Qué hace tu comunidad autónoma", "El gobierno autonómico y su parlamento. Gestiona los grandes servicios públicos, como la sanidad, la educación y los servicios sociales, y desarrolla las leyes básicas del Estado."),
    "provincial": ("Qué hace tu diputación", "Las diputaciones provinciales y forales, los cabildos y los consejos insulares. Asisten a los municipios pequeños y prestan los servicios que estos no pueden asumir solos. En las comunidades de una sola provincia sus funciones las ejerce la comunidad autónoma."),
    "municipal": ("Qué hace tu ayuntamiento", "La administración más cercana. Presta los servicios del día a día: calles, alumbrado, agua, basuras, urbanismo y policía local. Lo que está obligado a ofrecer depende de su población."),
}
MARCA_INICIO, MARCA_FIN = "<!-- MATERIAS:INICIO -->", "<!-- MATERIAS:FIN -->"
AVISO = "Archivo GENERADO por scripts/build_data.py — no editar a mano."
e = html.escape


def _leer(nombre: str, por_defecto=None):
    ruta = DATA / nombre
    if not ruta.exists() and por_defecto is not None:
        return por_defecto
    return json.loads(ruta.read_text(encoding="utf-8"))


# ---------- validación ----------

def _validar_refs(donde: str, refs: list | None, errores: list[str]) -> None:
    if not refs:
        errores.append(f"{donde}: sin referencias legales")
    for ref in refs or []:
        for campo in ("norma", "id_boe", "articulo", "bloque"):
            if not ref.get(campo):
                errores.append(f"{donde}: a una referencia le falta «{campo}»")
        if ref.get("id_boe") and not re.fullmatch(r"BOE-A-\d{4}-\d+", ref["id_boe"]):
            errores.append(f"{donde}: id_boe con formato incorrecto «{ref['id_boe']}»")


def validar(datos: dict, carreteras: dict) -> list[str]:
    """Errores de competencias.json y carreteras.json."""
    errores: list[str] = []
    isos = {t["iso"] for t in datos.get("territorios", [])}
    ids: set[str] = set()

    for materia in datos.get("materias", []):
        mid = materia.get("id", "<sin id>")
        if mid in ids:
            errores.append(f"id duplicado: {mid}")
        ids.add(mid)
        if not re.fullmatch(r"[a-z0-9-]+", mid):
            errores.append(f"{mid}: el id solo admite minúsculas, cifras y guiones")
        for campo in ("nombre", "descripcion", "tags", "niveles"):
            if not materia.get(campo):
                errores.append(f"{mid}: falta el campo «{campo}»")
        for nivel in materia.get("niveles", []):
            admin = nivel.get("administracion")
            if admin not in ADMINISTRACIONES:
                errores.append(f"{mid}: administración desconocida «{admin}»")
            for campo in ("rol", "detalle"):
                if not nivel.get(campo):
                    errores.append(f"{mid}/{admin}: falta «{campo}»")
            _validar_refs(f"{mid}/{admin}", nivel.get("refs"), errores)
        for exc in materia.get("excepciones", []):
            donde = f"{mid}/excepción «{exc.get('titulo', '?')}»"
            for campo in ("ccaa", "titulo", "detalle"):
                if not exc.get(campo):
                    errores.append(f"{donde}: falta «{campo}»")
            for iso in exc.get("ccaa", []):
                if iso not in isos:
                    errores.append(f"{donde}: territorio desconocido «{iso}»")
            _validar_refs(donde, exc.get("refs"), errores)

    for i, regla in enumerate(carreteras.get("reglas", [])):
        donde = f"carreteras.json regla {i + 1}"
        if regla.get("admin") not in ADMINISTRACIONES:
            errores.append(f"{donde}: administración desconocida «{regla.get('admin')}»")
        if regla.get("confianza") not in ("alta", "media", "baja"):
            errores.append(f"{donde}: confianza desconocida «{regla.get('confianza')}»")
        for iso in regla.get("ccaa", []):
            if iso not in isos:
                errores.append(f"{donde}: territorio desconocido «{iso}»")
        try:
            re.compile(regla.get("patron", ""))
        except re.error as exc:
            errores.append(f"{donde}: patrón inválido ({exc})")
    return errores


def validar_casos(datos: dict, casos: list[dict]) -> list[str]:
    errores: list[str] = []
    isos = {t["iso"] for t in datos["territorios"]}
    materias = {m["id"]: m for m in datos["materias"]}
    ids: set[str] = set()
    for caso in casos:
        cid = caso.get("id", "<sin id>")
        donde = f"casos.json/{cid}"
        if cid in ids:
            errores.append(f"{donde}: id duplicado")
        ids.add(cid)
        if not re.fullmatch(r"[a-z0-9-]+", cid):
            errores.append(f"{donde}: el id solo admite minúsculas, cifras y guiones")
        for campo in ("pregunta", "materia", "admin", "respuesta", "claves"):
            if not caso.get(campo):
                errores.append(f"{donde}: falta «{campo}»")
        materia = materias.get(caso.get("materia"))
        if materia is None:
            errores.append(f"{donde}: materia desconocida «{caso.get('materia')}»")
            continue
        niveles = {n["administracion"] for n in materia["niveles"]}
        if caso.get("admin") not in ADMINISTRACIONES:
            errores.append(f"{donde}: administración desconocida «{caso.get('admin')}»")
        elif "refs" in caso:
            _validar_refs(donde, caso["refs"], errores)
        elif caso["admin"] not in niveles:
            errores.append(f"{donde}: la materia «{materia['id']}» no tiene nivel «{caso['admin']}» que respalde la respuesta")
        vistos: set[str] = set()
        for exc in caso.get("excepciones", []):
            if exc.get("admin") not in ADMINISTRACIONES or not exc.get("respuesta") or not exc.get("ccaa"):
                errores.append(f"{donde}: excepción incompleta")
                continue
            for iso in exc["ccaa"]:
                if iso not in isos:
                    errores.append(f"{donde}: territorio desconocido «{iso}»")
                if iso in vistos:
                    errores.append(f"{donde}: «{iso}» aparece en dos excepciones")
                vistos.add(iso)
                respaldo = exc["admin"] in niveles or any(iso in x["ccaa"] for x in materia.get("excepciones", []))
                if not respaldo:
                    errores.append(f"{donde}: la excepción de {iso} no tiene referencia legal que la respalde en «{materia['id']}»")
    return errores


def validar_municipal(datos: dict, servicios: dict, provincias: dict, municipios: dict) -> list[str]:
    errores: list[str] = []
    isos = {t["iso"] for t in datos["territorios"]}
    materias = {m["id"] for m in datos["materias"]}
    for tramo in servicios.get("tramos", []):
        for servicio in tramo.get("servicios", []):
            if servicio.get("materia") not in materias:
                errores.append(f"servicios_municipales.json: materia desconocida «{servicio.get('materia')}»")
    for codigo, provincia in provincias.get("provincias", {}).items():
        if provincia.get("ccaa") not in isos:
            errores.append(f"provincias.json/{codigo}: territorio desconocido «{provincia.get('ccaa')}»")
    for codigo, _, _ in municipios.get("municipios", []):
        if codigo[:2] not in provincias.get("provincias", {}):
            errores.append(f"municipios.json: el municipio {codigo} no tiene provincia conocida")
            break
    return errores


def validar_todo() -> list[str]:
    datos = _leer("competencias.json")
    return (
        validar(datos, _leer("carreteras.json"))
        + validar_casos(datos, _leer("casos.json")["casos"])
        + validar_municipal(datos, _leer("servicios_municipales.json"), _leer("provincias.json"),
                            _leer("municipios.json", {"municipios": []}))
    )


# ---------- piezas de HTML ----------

def _url_ref(ref: dict) -> str:
    return f"https://www.boe.es/buscar/act.php?id={ref['id_boe']}#{ref['bloque']}"


def _refs_html(refs: list[dict]) -> str:
    items = "".join(
        f'<li><a href="{e(_url_ref(r))}" target="_blank" rel="noopener">{e(r["norma"])}</a>'
        f' <span class="ref-articulo">— art. {e(r["articulo"])}</span></li>'
        for r in refs
    )
    return f'<ul class="refs">{items}</ul>'


def _refs_de_caso(caso: dict, materia: dict, iso: str | None = None) -> list[dict]:
    def del_nivel(admin: str) -> list[dict]:
        return next((n["refs"] for n in materia["niveles"] if n["administracion"] == admin), [])

    excepcion = next((x for x in caso.get("excepciones", []) if iso and iso in x["ccaa"]), None)
    if excepcion:
        propias = [r for x in materia.get("excepciones", []) if iso in x["ccaa"] for r in x["refs"]]
        return propias or del_nivel(excepcion["admin"])
    return caso.get("refs") or del_nivel(caso["admin"])


def _frase(caso: dict) -> str:
    """Veredicto y respuesta en una sola frase, sin repetir el titular si la respuesta ya empieza por él."""
    veredicto = VEREDICTOS[caso["admin"]]
    if caso["respuesta"].lower().startswith(veredicto.lower()):
        return caso["respuesta"]
    return f'{veredicto}. {caso["respuesta"]}'


def _pagina(*, titulo: str, descripcion: str, cuerpo: str, ruta: str, cabecera: str,
            sitio: dict, site_url: str, extra_head: str = "") -> str:
    """Página estática completa. `ruta` es relativa a web/ (p. ej. «materia/sanidad.html»)."""
    raiz = "../" * ruta.count("/")
    canonica = ""
    if site_url:
        canonica = (
            f'\n  <link rel="canonical" href="{e(site_url)}/{e(ruta)}">'
            f'\n  <meta property="og:url" content="{e(site_url)}/{e(ruta)}">'
            f'\n  <meta property="og:image" content="{e(site_url)}/og.png">'
            '\n  <meta name="twitter:card" content="summary_large_image">'
        )
    verificado = (
        f' Referencias comprobadas contra el BOE el {e(sitio["verificacion"]["fecha"])}.'
        if sitio["verificacion"].get("fecha") else ""
    )
    return f'''<!DOCTYPE html>
<!-- {AVISO} -->
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{e(titulo)}</title>
  <meta name="description" content="{e(descripcion)}">
  <meta property="og:type" content="article">
  <meta property="og:title" content="{e(titulo)}">
  <meta property="og:description" content="{e(descripcion)}">
  <meta property="og:site_name" content="¿De quién es la competencia?">{canonica}
  <link rel="stylesheet" href="{raiz}styles.css">{extra_head}
</head>
<body>
  <header class="compacto">
    <p class="migas"><a href="{raiz}">¿De quién es la competencia?</a></p>
{cabecera}
  </header>
  <main>
{cuerpo}
    <p class="acciones">
      <button type="button" class="boton-secundario" data-compartir>Compartir</button>
      <a class="boton-secundario" data-error href="{e(sitio["repositorio"])}/issues/new">He visto un error</a>
    </p>
    <p class="volver"><a href="{raiz}">← Buscar otra cosa</a></p>
  </main>
  <footer>
    <p>Contenido divulgativo, pendiente de revisión por un jurista. La fuente vinculante es el <a href="https://www.boe.es">BOE</a>.{verificado}</p>
    <p><a href="{raiz}como-lo-sabemos.html">Cómo lo sabemos</a> · <a href="{raiz}preguntas.html">Todas las preguntas</a> · <a href="{e(sitio["repositorio"])}">Código y datos</a></p>
  </footer>
  <script src="{raiz}config.js"></script>
  <script src="{raiz}comun.js"></script>
</body>
</html>
'''


def _donde_generico(admin: str, datos: dict) -> str:
    estado = datos["organismos"]["estado"]
    if admin == "estado":
        return (f'Información general de la Administración del Estado: teléfono {e(estado["telefono"])} y '
                f'<a href="{e(estado["web"])}" target="_blank" rel="noopener">administracion.gob.es</a>.')
    if admin == "ccaa":
        enlaces = " · ".join(
            f'<a href="{e(t["web"])}" target="_blank" rel="noopener">{e(t["nombre"])}</a>' for t in datos["territorios"]
        )
        return f'<details><summary>Portal de tu comunidad autónoma</summary><p class="portales">{enlaces}</p></details>'
    if admin == "provincial":
        return "La web o la sede electrónica de tu diputación, cabildo o consejo insular."
    return "La sede electrónica o el registro de tu ayuntamiento; muchas ciudades atienden también por teléfono en el 010."


def _lista_preguntas(casos: list[dict], raiz: str) -> str:
    items = "".join(
        f'<li><a href="{raiz}pregunta/{c["id"]}.html">{e(c["pregunta"])}</a> '
        f'<span class="chip chip-{c["admin"]}">{e(ETIQUETAS[c["admin"]])}</span></li>'
        for c in casos
    )
    return f'<ul class="lista-preguntas">{items}</ul>'


# ---------- páginas ----------

def _pagina_materia(materia: dict, datos: dict, casos: list[dict], sitio: dict, site_url: str) -> str:
    nombres = {t["iso"]: t["nombre"] for t in datos["territorios"]}
    niveles = "".join(
        f'''
      <section class="nivel nivel-{n["administracion"]}">
        <div class="cabecera">
          <span class="chip chip-{n["administracion"]}">{ETIQUETAS[n["administracion"]]}</span>
          <span class="rol">{e(n["rol"])}</span>
        </div>
        <p>{e(n["detalle"])}</p>
        {f'<p class="donde"><strong>Dónde acudir:</strong> {e(n["donde"])}</p>' if n.get("donde") else ""}
        {_refs_html(n["refs"])}
      </section>'''
        for n in materia["niveles"]
    )
    excepciones = ""
    if materia.get("excepciones"):
        bloques = "".join(
            f'''
      <section class="excepcion">
        <h3>{e(x["titulo"])}</h3>
        <p class="donde">{e(", ".join(nombres[i] for i in x["ccaa"]))}</p>
        <p>{e(x["detalle"])}</p>
        {_refs_html(x["refs"])}
      </section>'''
            for x in materia["excepciones"]
        )
        excepciones = f"\n      <h2>Diferencias por territorio</h2>{bloques}"
    propias = [c for c in casos if c["materia"] == materia["id"]]
    preguntas = f"\n      <h2>Preguntas frecuentes</h2>\n      {_lista_preguntas(propias, '../')}" if propias else ""
    cuerpo = f'    <article class="materia">{niveles}{excepciones}{preguntas}\n    </article>'
    return _pagina(
        titulo=f'{materia["nombre"]}: ¿de quién es la competencia?',
        descripcion=f'Qué hace el Estado, la comunidad autónoma y el ayuntamiento en {materia["nombre"].lower()}: '
                    f'{materia["descripcion"]} Con la ley y el artículo que lo establecen.',
        cuerpo=cuerpo,
        ruta=f'materia/{materia["id"]}.html',
        cabecera=f'    <h1>{e(materia["nombre"])}</h1>\n    <p class="subtitle">{e(materia["descripcion"])}</p>',
        sitio=sitio, site_url=site_url,
    )


def _pagina_pregunta(caso: dict, datos: dict, casos: list[dict], sitio: dict, site_url: str) -> str:
    materia = next(m for m in datos["materias"] if m["id"] == caso["materia"])
    nombres = {t["iso"]: t["nombre"] for t in datos["territorios"]}
    admin = caso["admin"]
    nivel = next((n for n in materia["niveles"] if n["administracion"] == admin), None)

    excepciones = ""
    if caso.get("excepciones"):
        bloques = "".join(
            f'''
        <section class="excepcion">
          <h3>{e(", ".join(nombres[i] for i in x["ccaa"]))}: {e(VEREDICTOS[x["admin"]].lower())}</h3>
          <p>{e(x["respuesta"])}</p>
          {_refs_html(_refs_de_caso(caso, materia, x["ccaa"][0]))}
        </section>'''
            for x in caso["excepciones"]
        )
        excepciones = f"\n      <h2>No es igual en toda España</h2>{bloques}"

    donde_especifico = f'<p>{e(nivel["donde"])}</p>' if nivel and nivel.get("donde") else ""
    relacionadas = [c for c in casos if c["materia"] == caso["materia"] and c["id"] != caso["id"]][:6]
    otras = f"\n      <h2>Preguntas relacionadas</h2>\n      {_lista_preguntas(relacionadas, '../')}" if relacionadas else ""

    cuerpo = f'''    <article class="materia">
      <section class="veredicto nivel nivel-{admin}">
        <p class="veredicto-titular"><span class="chip chip-{admin}">{e(VEREDICTOS[admin])}</span></p>
        <p class="veredicto-texto">{e(caso["respuesta"])}</p>
      </section>{excepciones}
      <h2>Qué puedes hacer</h2>
      <div class="donde-acudir">
        {donde_especifico}
        <p>{_donde_generico(admin, datos)}</p>
        <p>Si la administración no responde, puedes presentar una queja ante el <a href="{e(datos["organismos"]["defensor"]["web"])}" target="_blank" rel="noopener">Defensor del Pueblo</a> o su equivalente autonómico.</p>
      </div>
      <h2>En qué se basa</h2>
      {_refs_html(_refs_de_caso(caso, materia))}
      <p>Forma parte de la materia <a href="../materia/{materia["id"]}.html">{e(materia["nombre"])}</a>, donde se explica qué hace cada administración.</p>{otras}
    </article>'''

    json_ld = json.dumps({
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": [{
            "@type": "Question",
            "name": caso["pregunta"],
            "acceptedAnswer": {"@type": "Answer", "text": _frase(caso)},
        }],
    }, ensure_ascii=False).replace("</", "<\\/")
    return _pagina(
        titulo=caso["pregunta"],
        descripcion=_frase(caso),
        cuerpo=cuerpo,
        ruta=f'pregunta/{caso["id"]}.html',
        cabecera=f'    <h1>{e(caso["pregunta"])}</h1>',
        sitio=sitio, site_url=site_url,
        extra_head=f'\n  <script type="application/ld+json">{json_ld}</script>',
    )


def _pagina_administracion(admin: str, datos: dict, casos: list[dict], sitio: dict, site_url: str) -> str:
    titulo, intro = PAGINAS_ADMIN[admin]
    secciones = []
    for materia in datos["materias"]:
        nivel = next((n for n in materia["niveles"] if n["administracion"] == admin), None)
        if nivel is None:
            continue
        propias = [c for c in casos if c["materia"] == materia["id"] and c["admin"] == admin]
        preguntas = _lista_preguntas(propias, "../") if propias else ""
        secciones.append(f'''
      <section class="nivel nivel-{admin}">
        <h2><a href="../materia/{materia["id"]}.html">{e(materia["nombre"])}</a></h2>
        <p class="rol">{e(nivel["rol"])}</p>
        <p>{e(nivel["detalle"])}</p>
        {preguntas}
      </section>''')
    otras = " · ".join(
        f'<a href="{a}.html">{e(PAGINAS_ADMIN[a][0])}</a>' for a in ADMINISTRACIONES if a != admin
    )
    extra = ('\n      <p class="aviso-territorio">Lo que tu ayuntamiento está obligado a prestar depende de su población: '
             '<a href="../municipio.html">consulta tu municipio</a>.</p>' if admin in ("municipal", "provincial") else "")
    cuerpo = f'''    <article class="materia">
      <p>{e(intro)}</p>{extra}{"".join(secciones)}
      <p class="aviso-territorio">Hay diferencias entre comunidades (régimen foral, competencias traspasadas…): cada ficha de materia las detalla. Ver también: {otras}.</p>
    </article>'''
    return _pagina(
        titulo=f"{titulo}: sus competencias, materia por materia",
        descripcion=f"{intro} Lista de sus competencias materia por materia, con la ley que las establece.",
        cuerpo=cuerpo,
        ruta=f"administracion/{admin}.html",
        cabecera=f"    <h1>{e(titulo)}</h1>",
        sitio=sitio, site_url=site_url,
    )


def _pagina_preguntas(datos: dict, casos: list[dict], sitio: dict, site_url: str) -> str:
    secciones = []
    for materia in datos["materias"]:
        propias = [c for c in casos if c["materia"] == materia["id"]]
        if propias:
            secciones.append(
                f'\n      <h2><a href="materia/{materia["id"]}.html">{e(materia["nombre"])}</a></h2>\n'
                f'      {_lista_preguntas(propias, "")}'
            )
    cuerpo = f'    <article class="materia">{"".join(secciones)}\n    </article>'
    return _pagina(
        titulo="Todas las preguntas: quién se encarga de qué en España",
        descripcion=f"{len(casos)} preguntas concretas sobre qué administración es responsable de cada cosa en España, "
                    "con respuesta directa y la ley que lo establece.",
        cuerpo=cuerpo,
        ruta="preguntas.html",
        cabecera=f'    <h1>Todas las preguntas</h1>\n    <p class="subtitle">{len(casos)} dudas concretas, con respuesta directa.</p>',
        sitio=sitio, site_url=site_url,
    )


def _indice_materias(datos: dict) -> str:
    tarjetas = "\n".join(
        f'        <li><a href="materia/{m["id"]}.html"><strong>{e(m["nombre"])}</strong>'
        f'<span>{e(m["descripcion"])}</span></a></li>'
        for m in datos["materias"]
    )
    return f"{MARCA_INICIO}\n      <ul class=\"rejilla\">\n{tarjetas}\n      </ul>\n      {MARCA_FIN}"


# ---------- generación ----------

def construir() -> dict[Path, str]:
    """Contenido de todos los archivos generados: {ruta: texto}."""
    datos = _leer("competencias.json")
    casos = _leer("casos.json")["casos"]
    carreteras = _leer("carreteras.json")
    servicios = _leer("servicios_municipales.json")
    provincias = _leer("provincias.json")["provincias"]
    municipios = _leer("municipios.json", {"municipios": []})
    verificacion = _leer("verificacion_boe.json", {})
    site_url = os.environ.get("SITE_URL", "").rstrip("/")

    sitio = {
        "repositorio": datos["repositorio"],
        "goatcounter": datos.get("analitica", {}).get("goatcounter", ""),
        "verificacion": {"fecha": verificacion.get("fecha"), "normas": len(verificacion.get("normas", {}))},
        "padron": municipios.get("fecha_referencia"),
        "materias": len(datos["materias"]),
        "preguntas": len(casos),
    }
    cabecera = f"// {AVISO}\n"
    j = lambda valor: json.dumps(valor, ensure_ascii=False, indent=1)  # noqa: E731
    compacto = lambda valor: json.dumps(valor, ensure_ascii=False, separators=(",", ":"))  # noqa: E731

    core = CORE.read_text(encoding="utf-8")
    para_extension = {"territorios": datos["territorios"], "materias": datos["materias"]}
    archivos: dict[Path, str] = {
        WEB / "config.js": f"{cabecera}const SITIO = {j(sitio)};\n",
        WEB / "data.js": (
            f"{cabecera}const COMPETENCIAS = {j(datos)};\n"
            f"const CASOS = {j(casos)};\n"
            f"const CARRETERAS = {j(carreteras)};\n"
        ),
        WEB / "municipios.js": (
            f"{cabecera}const SERVICIOS = {j(servicios)};\n"
            f"const PROVINCIAS = {j(provincias)};\n"
            f"const MUNICIPIOS = {compacto(municipios)};\n"
        ),
        WEB / "core.js": core,
        ROOT / "extension" / "data.js": f"{cabecera}const COMPETENCIAS = {j(para_extension)};\n",
        ROOT / "extension" / "core.js": core,
    }
    for materia in datos["materias"]:
        archivos[WEB / "materia" / f"{materia['id']}.html"] = _pagina_materia(materia, datos, casos, sitio, site_url)
    for caso in casos:
        archivos[WEB / "pregunta" / f"{caso['id']}.html"] = _pagina_pregunta(caso, datos, casos, sitio, site_url)
    for admin in ADMINISTRACIONES:
        archivos[WEB / "administracion" / f"{admin}.html"] = _pagina_administracion(admin, datos, casos, sitio, site_url)
    archivos[WEB / "preguntas.html"] = _pagina_preguntas(datos, casos, sitio, site_url)

    index = INDEX.read_text(encoding="utf-8")
    if MARCA_INICIO not in index or MARCA_FIN not in index:
        raise SystemExit(f"web/index.html debe contener {MARCA_INICIO} y {MARCA_FIN}")
    patron = re.compile(re.escape(MARCA_INICIO) + r".*?" + re.escape(MARCA_FIN), re.DOTALL)
    archivos[INDEX] = patron.sub(lambda _: _indice_materias(datos), index)

    if site_url:
        rutas = [""] + sorted(
            str(ruta.relative_to(WEB)).replace("\\", "/") for ruta in archivos
            if ruta.suffix == ".html" and ruta != INDEX and WEB in ruta.parents
        ) + ["municipio.html", "como-lo-sabemos.html"]
        cuerpo = "".join(f"  <url><loc>{e(site_url)}/{e(r)}</loc></url>\n" for r in rutas)
        archivos[WEB / "sitemap.xml"] = (
            '<?xml version="1.0" encoding="UTF-8"?>\n'
            f'<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n{cuerpo}</urlset>\n'
        )
    return archivos


CARPETAS_GENERADAS = ("materia", "pregunta", "administracion")


def _sobrantes(archivos: dict[Path, str]) -> list[Path]:
    """Páginas generadas en una versión anterior que ya no corresponden a ningún dato."""
    return [
        ruta
        for carpeta in CARPETAS_GENERADAS
        if (WEB / carpeta).exists()
        for ruta in sorted((WEB / carpeta).glob("*.html"))
        if ruta not in archivos
    ]


def desactualizados() -> list[str]:
    """Rutas generadas cuyo contenido en disco no coincide con las fuentes."""
    archivos = construir()
    relativa = lambda ruta: str(ruta.relative_to(ROOT)).replace("\\", "/")  # noqa: E731
    pendientes = [
        relativa(ruta) for ruta, contenido in archivos.items()
        if not ruta.exists() or ruta.read_text(encoding="utf-8") != contenido
    ]
    return pendientes + [f"{relativa(ruta)} (sobra)" for ruta in _sobrantes(archivos)]


def main() -> int:
    errores = validar_todo()
    if errores:
        print("ERRORES de validación:")
        for error in errores:
            print(f"  - {error}")
        return 1

    if "--check" in sys.argv:
        pendientes = desactualizados()
        if pendientes:
            print("Archivos generados desactualizados (ejecuta python scripts/build_data.py):")
            for ruta in pendientes[:30]:
                print(f"  - {ruta}")
            return 1
        print("Datos válidos y archivos generados al día.")
        return 0

    archivos = construir()
    for sobrante in _sobrantes(archivos):
        sobrante.unlink()
    for ruta, contenido in archivos.items():
        ruta.parent.mkdir(parents=True, exist_ok=True)
        ruta.write_text(contenido, encoding="utf-8", newline="\n")

    datos = _leer("competencias.json")
    casos = _leer("casos.json")["casos"]
    refs = sum(len(n["refs"]) for m in datos["materias"] for n in m["niveles"])
    refs += sum(len(x["refs"]) for m in datos["materias"] for x in m.get("excepciones", []))
    print(f"Validado: {len(datos['materias'])} materias, {len(casos)} preguntas, {refs} referencias legales.")
    print(f"Generados {len(archivos)} archivos en web/ y extension/.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
