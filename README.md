# ¿De quién es la competencia?

Tres aplicaciones que responden a la misma pregunta: **qué administración (Estado,
comunidad autónoma, diputación o ayuntamiento) es responsable de cada materia en
España**, siempre con la ley y el artículo del BOE que lo establecen.

- **Web**: buscador en lenguaje llano, selector de comunidad autónoma y mapa «¿de quién es esta carretera?».
- **Servidor MCP**: las mismas consultas para agentes de IA (Claude, Cursor…).
- **Extensión de navegador**: al leer una noticia, muestra a quién corresponde la competencia.

Las tres comparten datos y lógica; no hay base de datos ni servidor propio.

```
data/
  competencias.json      ← materias, niveles, excepciones por territorio y referencias (FUENTE)
  carreteras.json        ← reglas de titularidad de vías por territorio (FUENTE)
  verificacion_boe.json  ← informe de la última comprobación contra el BOE (lo escribe el script)
shared/core.js           ← lógica compartida por la web y la extensión (FUENTE)
scripts/
  build_data.py          ← valida los datos y genera web/ y extension/
  verificar_boe.py       ← comprueba normas y artículos contra la API del BOE
web/                     ← web estática (index.html, app.js, styles.css + generados)
extension/               ← extensión Manifest V3 (content.js, badge.css + generados)
mcp-server/              ← servidor MCP (paquete competencias_mcp)
tests/                   ← casos compartidos y tests de Python y Node
```

## Actualizar los datos

1. Edita `data/competencias.json` (o `data/carreteras.json`).
2. Ejecuta `python scripts/build_data.py`: valida el esquema y regenera la web y la extensión.
3. Ejecuta `python scripts/verificar_boe.py`: confirma que las normas siguen vigentes y que cada artículo citado existe.
4. Ejecuta los tests (abajo) y haz commit.

Cada referencia identifica la norma y el bloque del texto consolidado, de modo que
el enlace lleva al artículo exacto:

```jsonc
{ "norma": "Ley 7/1985 (LBRL)", "id_boe": "BOE-A-1985-5392", "articulo": "25.2.n", "bloque": "a25" }
// → https://www.boe.es/buscar/act.php?id=BOE-A-1985-5392#a25
```

El `bloque` es el identificador del artículo en el BOE. Si no lo conoces, pon uno
aproximado: `verificar_boe.py` te dirá que no existe y te propondrá los candidatos.

Cada materia tiene dos listas de palabras clave: `tags` (inequívocas: «hospital»,
«alquiler») y `tags_debiles` (ambiguas: «contrato», «calle»). El buscador usa las
dos; la extensión solo muestra una ficha si hay un tag fuerte o varias señales.
Las diferencias entre comunidades van en `excepciones`, con el código ISO del
territorio (`ES-PV`, `ES-CT`…).

## Tests

```bash
python -m unittest discover -s tests
```

```bash
node --test tests/core.test.mjs
```

La lógica existe en JavaScript (`shared/core.js`) y en Python
(`mcp-server/competencias_mcp/core.py`). Ambas se prueban contra los mismos casos
de `tests/casos.json`: si cambias una, cambia la otra. Los tests no necesitan red.

## Web

Estática, sin dependencias de compilación. Para verla en local:

```bash
python -m http.server 8000
```

y abre <http://localhost:8000/web/>. `scripts/build_data.py` genera además una página
por materia (`web/materia/<id>.html`) para que los buscadores indexen cada una.

El mapa usa la geocodificación inversa de OpenStreetMap (Nominatim) para obtener en
una sola llamada la vía más cercana y el territorio, y aplica las reglas de
`data/carreteras.json`. El servicio público de Nominatim admite como máximo una
petición por segundo: para mucho tráfico habría que usar una instancia propia.

## Servidor MCP

Sin IA propia: expone datos y lógica determinista.

| Herramienta | Qué hace |
|---|---|
| `buscar_competencia(termino, comunidad?)` | Reparto de una materia con sus referencias y las excepciones del territorio |
| `obtener_materia(id_materia, comunidad?)` | Ficha completa de una materia |
| `listar_materias()` | Catálogo de materias |
| `identificar_titular_carretera(latitud, longitud)` | Vía más cercana, titular concreto y grado de confianza |
| `verificar_vigencia_boe(id_norma)` | Consulta en vivo al BOE: vigente, derogada o anulada |

Recurso: `competencias://espana/matriz_completa`.

Desde el repositorio (con un entorno virtual, para no tocar el Python global):

```bash
python -m venv mcp-server/.venv
```

```bash
mcp-server/.venv/Scripts/pip install fastmcp
```

```bash
claude mcp add competencias -- mcp-server/.venv/Scripts/python.exe mcp-server/server.py
```

(En Linux o macOS la ruta es `mcp-server/.venv/bin/`.) También es un paquete
instalable: `pip install .` deja disponible el comando `competencias-mcp` con los
datos incluidos.

## Extensión de navegador

Analiza el titular y la entradilla **en local**, sin enviar nada a ningún servidor.
Solo actúa en páginas de artículo y se abstiene en secciones como deportes o
internacional. Para instalarla en Chrome o Edge: `chrome://extensions` → activar
«Modo de desarrollador» → «Cargar descomprimida» → carpeta `extension/`.

Para probarla sin instalarla, con el servidor local en marcha:
<http://localhost:8000/tests/fixtures/noticia.html?t=Tu+titular+de+prueba>.

## Automatización (GitHub Actions)

- `ci.yml`: valida los datos, comprueba que lo generado está al día y ejecuta los tests.
- `pages.yml`: publica `web/` en GitHub Pages en cada push a `main`.
- `boe.yml`: cada lunes verifica las referencias contra el BOE y abre una incidencia si una norma deja de estar vigente.

## Límites

- Describe el marco general (Constitución, LBRL y leyes sectoriales) más las
  excepciones territoriales recogidas en los datos; no sustituye a los Estatutos de
  Autonomía ni al asesoramiento jurídico.
- La verificación automática comprueba que la norma está vigente y que el artículo
  citado existe, no que la interpretación de la ficha sea correcta: eso requiere
  revisión humana.
- La titularidad de las vías es una estimación por nomenclatura y territorio, con
  grado de confianza; la fuente vinculante es el catálogo de cada administración.
