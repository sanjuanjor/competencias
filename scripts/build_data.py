"""Valida los datos y genera todo lo que la web y la extensión consumen.

Fuentes (lo único que se edita a mano):
    data/competencias.json   materias, niveles, excepciones y referencias
    data/carreteras.json     reglas de titularidad de vías
    shared/core.js           lógica compartida (buscador, noticias, carreteras)

Generado (no editar):
    web/data.js, web/core.js, web/materia/<id>.html, índice de web/index.html
    extension/data.js, extension/core.js

Uso:
    python scripts/build_data.py            valida y regenera
    python scripts/build_data.py --check    solo comprueba (código 1 si falta regenerar)
Con la variable de entorno SITE_URL (p. ej. https://usuario.github.io/competencias)
añade enlaces canónicos y web/sitemap.xml.
"""
from __future__ import annotations

import html
import json
import os
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATOS = ROOT / "data" / "competencias.json"
CARRETERAS = ROOT / "data" / "carreteras.json"
VERIFICACION = ROOT / "data" / "verificacion_boe.json"
CORE = ROOT / "shared" / "core.js"
INDEX = ROOT / "web" / "index.html"

ADMINISTRACIONES = ("estado", "ccaa", "provincial", "municipal")
ETIQUETAS = {"estado": "Estado", "ccaa": "Comunidad Autónoma", "provincial": "Diputación", "municipal": "Ayuntamiento"}
MARCA_INICIO, MARCA_FIN = "<!-- MATERIAS:INICIO -->", "<!-- MATERIAS:FIN -->"
AVISO = "Archivo GENERADO por scripts/build_data.py — no editar a mano."


# ---------- validación ----------

def _validar_refs(donde: str, refs: list, errores: list[str]) -> None:
    if not refs:
        errores.append(f"{donde}: sin referencias legales")
    for ref in refs or []:
        for campo in ("norma", "id_boe", "articulo", "bloque"):
            if not ref.get(campo):
                errores.append(f"{donde}: a una referencia le falta «{campo}»")
        if ref.get("id_boe") and not re.fullmatch(r"BOE-A-\d{4}-\d+", ref["id_boe"]):
            errores.append(f"{donde}: id_boe con formato incorrecto «{ref['id_boe']}»")


def validar(datos: dict, carreteras: dict) -> list[str]:
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


# ---------- generación ----------

def _url_ref(ref: dict) -> str:
    return f"https://www.boe.es/buscar/act.php?id={ref['id_boe']}#{ref['bloque']}"


def _refs_html(refs: list[dict]) -> str:
    items = "".join(
        f'<li><a href="{html.escape(_url_ref(r))}" target="_blank" rel="noopener">{html.escape(r["norma"])}</a>'
        f' <span class="ref-articulo">— art. {html.escape(r["articulo"])}</span></li>'
        for r in refs
    )
    return f'<ul class="refs">{items}</ul>'


def _pagina_materia(materia: dict, datos: dict, verificacion: dict, site_url: str) -> str:
    e = html.escape
    nombres = {t["iso"]: t["nombre"] for t in datos["territorios"]}
    niveles = "".join(
        f'''
      <section class="nivel nivel-{n["administracion"]}">
        <div class="cabecera">
          <span class="chip chip-{n["administracion"]}">{ETIQUETAS[n["administracion"]]}</span>
          <span class="rol">{e(n["rol"])}</span>
        </div>
        <p>{e(n["detalle"])}</p>
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
    canonica = (
        f'\n  <link rel="canonical" href="{e(site_url)}/materia/{materia["id"]}.html">' if site_url else ""
    )
    verificado = (
        f'Referencias comprobadas contra el BOE el {e(verificacion["fecha"])}.' if verificacion.get("fecha") else ""
    )
    return f'''<!DOCTYPE html>
<!-- {AVISO} -->
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{e(materia["nombre"])}: ¿de quién es la competencia?</title>
  <meta name="description" content="Qué hace el Estado, la comunidad autónoma y el ayuntamiento en {e(materia["nombre"].lower())}: {e(materia["descripcion"])} Con la ley y el artículo que lo establecen.">{canonica}
  <link rel="stylesheet" href="../styles.css">
</head>
<body>
  <header class="compacto">
    <p class="migas"><a href="../">¿De quién es la competencia?</a></p>
    <h1>{e(materia["nombre"])}</h1>
    <p class="subtitle">{e(materia["descripcion"])}</p>
  </header>
  <main>
    <article class="materia">{niveles}{excepciones}
    </article>
    <p class="volver"><a href="../">← Buscar otra materia</a></p>
  </main>
  <footer>
    <p>Contenido divulgativo sobre el marco general; la fuente vinculante es el <a href="https://www.boe.es">BOE</a>. {verificado}</p>
  </footer>
</body>
</html>
'''


def _indice_materias(datos: dict) -> str:
    enlaces = "\n".join(
        f'        <li><a href="materia/{m["id"]}.html">{html.escape(m["nombre"])}</a></li>'
        for m in datos["materias"]
    )
    return f"{MARCA_INICIO}\n      <ul>\n{enlaces}\n      </ul>\n      {MARCA_FIN}"


def construir() -> dict[Path, str]:
    """Contenido de todos los archivos generados: {ruta: texto}."""
    datos = json.loads(DATOS.read_text(encoding="utf-8"))
    carreteras = json.loads(CARRETERAS.read_text(encoding="utf-8"))
    verificacion = json.loads(VERIFICACION.read_text(encoding="utf-8")) if VERIFICACION.exists() else {}
    site_url = os.environ.get("SITE_URL", "").rstrip("/")

    resumen = {"fecha": verificacion.get("fecha"), "normas": len(verificacion.get("normas", {}))}
    cabecera = f"// {AVISO}\n"
    j = lambda valor: json.dumps(valor, ensure_ascii=False, indent=1)  # noqa: E731
    datos_web = (
        f"{cabecera}const COMPETENCIAS = {j(datos)};\n"
        f"const CARRETERAS = {j(carreteras)};\n"
        f"const VERIFICACION = {j(resumen)};\n"
    )
    datos_extension = f"{cabecera}const COMPETENCIAS = {j(datos)};\n"
    core = CORE.read_text(encoding="utf-8")

    archivos: dict[Path, str] = {
        ROOT / "web" / "data.js": datos_web,
        ROOT / "web" / "core.js": core,
        ROOT / "extension" / "data.js": datos_extension,
        ROOT / "extension" / "core.js": core,
    }
    for materia in datos["materias"]:
        archivos[ROOT / "web" / "materia" / f"{materia['id']}.html"] = _pagina_materia(
            materia, datos, verificacion, site_url
        )

    index = INDEX.read_text(encoding="utf-8")
    if MARCA_INICIO not in index or MARCA_FIN not in index:
        raise SystemExit(f"web/index.html debe contener {MARCA_INICIO} y {MARCA_FIN}")
    patron = re.compile(re.escape(MARCA_INICIO) + r".*?" + re.escape(MARCA_FIN), re.DOTALL)
    archivos[INDEX] = patron.sub(lambda _: _indice_materias(datos), index)

    if site_url:
        urls = [f"{site_url}/"] + [f"{site_url}/materia/{m['id']}.html" for m in datos["materias"]]
        cuerpo = "".join(f"  <url><loc>{html.escape(u)}</loc></url>\n" for u in urls)
        archivos[ROOT / "web" / "sitemap.xml"] = (
            '<?xml version="1.0" encoding="UTF-8"?>\n'
            f'<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n{cuerpo}</urlset>\n'
        )
    return archivos


def desactualizados() -> list[str]:
    """Rutas generadas cuyo contenido en disco no coincide con las fuentes."""
    pendientes = []
    for ruta, contenido in construir().items():
        if not ruta.exists() or ruta.read_text(encoding="utf-8") != contenido:
            pendientes.append(str(ruta.relative_to(ROOT)).replace("\\", "/"))
    paginas = ROOT / "web" / "materia"
    vigentes = {m["id"] for m in json.loads(DATOS.read_text(encoding="utf-8"))["materias"]}
    for sobrante in sorted(paginas.glob("*.html")) if paginas.exists() else []:
        if sobrante.stem not in vigentes:
            pendientes.append(f"web/materia/{sobrante.name} (sobra)")
    return pendientes


def main() -> int:
    datos = json.loads(DATOS.read_text(encoding="utf-8"))
    carreteras = json.loads(CARRETERAS.read_text(encoding="utf-8"))
    errores = validar(datos, carreteras)
    if errores:
        print("ERRORES de validación:")
        for error in errores:
            print(f"  - {error}")
        return 1

    if "--check" in sys.argv:
        pendientes = desactualizados()
        if pendientes:
            print("Archivos generados desactualizados (ejecuta python scripts/build_data.py):")
            for ruta in pendientes:
                print(f"  - {ruta}")
            return 1
        print("Datos válidos y archivos generados al día.")
        return 0

    archivos = construir()
    vigentes = {ruta for ruta in archivos}
    paginas = ROOT / "web" / "materia"
    if paginas.exists():
        for sobrante in paginas.glob("*.html"):
            if sobrante not in vigentes:
                sobrante.unlink()
    for ruta, contenido in archivos.items():
        ruta.parent.mkdir(parents=True, exist_ok=True)
        ruta.write_text(contenido, encoding="utf-8", newline="\n")

    refs = sum(len(n["refs"]) for m in datos["materias"] for n in m["niveles"])
    refs += sum(len(x["refs"]) for m in datos["materias"] for x in m.get("excepciones", []))
    print(f"Validado: {len(datos['materias'])} materias, {refs} referencias legales, "
          f"{len(carreteras['reglas'])} reglas de carreteras.")
    print(f"Generados {len(archivos)} archivos en web/ y extension/.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
