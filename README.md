# ¿De quién es la competencia?

Quién se encarga de qué en España —Estado, comunidad autónoma, diputación o
ayuntamiento—, con la ley y el artículo del BOE que lo establecen y dónde acudir.

**Web publicada:** <https://sanjuanjor.github.io/competencias/>

Son tres aplicaciones sobre los mismos datos:

- **Web**: preguntas concretas con respuesta directa, vista por administración, ficha de tu municipio con el padrón del INE y mapa «¿de quién es esta carretera?».
- **Servidor MCP**: las mismas consultas para agentes de IA (Claude, Cursor…).
- **Extensión de navegador**: al leer una noticia, muestra a quién corresponde la competencia.

No hay base de datos ni servidor propio: todo son ficheros y páginas estáticas.

> **Pendiente:** el contenido no ha sido revisado por un jurista. La verificación
> automática confirma que cada norma está vigente y que el artículo citado existe,
> no que la explicación lo interprete bien.

```
data/
  competencias.json          ← materias, niveles, excepciones, territorios y referencias (FUENTE)
  casos.json                 ← preguntas concretas con respuesta directa (FUENTE)
  carreteras.json            ← reglas de titularidad de vías por territorio (FUENTE)
  servicios_municipales.json ← servicios obligatorios según la población (FUENTE)
  provincias.json            ← provincias, comunidad y diputación (FUENTE)
  municipios.json            ← padrón del INE (lo escribe actualizar_municipios.py)
  verificacion_boe.json      ← informe de la última comprobación contra el BOE
shared/core.js               ← lógica compartida por la web y la extensión (FUENTE)
scripts/
  build_data.py              ← valida los datos y genera web/ y extension/
  verificar_boe.py           ← comprueba normas y artículos contra la API del BOE
  actualizar_municipios.py   ← descarga el padrón municipal del INE
  generar_imagen.py          ← imagen para compartir en redes (necesita Pillow)
web/                         ← web estática (páginas a mano + generadas)
extension/                   ← extensión Manifest V3
mcp-server/                  ← servidor MCP (paquete competencias_mcp)
tests/                       ← casos compartidos y tests de Python y Node
```

En `web/` se escriben a mano `index.html`, `municipio.html`, `como-lo-sabemos.html`,
`app.js`, `municipio.js`, `comun.js` y `styles.css`. El resto lo genera
`build_data.py`: una página por materia, por pregunta y por administración, el
índice de preguntas y los ficheros de datos.

## Actualizar el contenido

1. Edita los ficheros de `data/`.
2. `python scripts/build_data.py` — valida y regenera la web y la extensión.
3. `python scripts/verificar_boe.py` — confirma que las normas siguen vigentes y que cada artículo citado existe.
4. Ejecuta los tests y haz commit. Cada push a `main` republica la web.

### Añadir una pregunta

En `data/casos.json`:

```jsonc
{
  "id": "farola-fundida",
  "pregunta": "¿Quién arregla una farola fundida?",
  "materia": "energia",          // id de una materia de competencias.json
  "admin": "municipal",          // estado | ccaa | provincial | municipal
  "respuesta": "Tu ayuntamiento: el alumbrado público es un servicio obligatorio…",
  "claves": ["farola", "alumbrado publico"],   // palabras con las que se encuentra
  "popular": true,               // opcional: aparece en la portada
  "excepciones": [               // opcional: territorios donde la respuesta es otra
    { "ccaa": ["ES-PV"], "admin": "provincial", "respuesta": "En el País Vasco…" }
  ]
}
```

La respuesta se respalda con las referencias del nivel correspondiente de su
materia (o con sus propias `refs`). El validador rechaza una pregunta cuya
respuesta, en algún territorio, se quede sin referencia legal.

### Referencias legales

```jsonc
{ "norma": "Ley 7/1985 (LBRL)", "id_boe": "BOE-A-1985-5392", "articulo": "25.2.n", "bloque": "a25" }
// → https://www.boe.es/buscar/act.php?id=BOE-A-1985-5392#a25
```

El `bloque` es el identificador del artículo en el texto consolidado. Si no lo
conoces, pon uno aproximado: `verificar_boe.py` dirá que no existe y propondrá candidatos.

### Palabras clave de las materias

`tags` son inequívocas («hospital», «alquiler») y `tags_debiles` ambiguas
(«contrato», «calle»). El buscador usa las dos; la extensión solo muestra una ficha
si hay un tag fuerte o varias señales. Las diferencias entre comunidades van en
`excepciones`, con el código ISO del territorio (`ES-PV`, `ES-CT`…).

### Padrón municipal

El INE publica a finales de cada año las cifras oficiales a 1 de enero:

```bash
python scripts/actualizar_municipios.py
```

```bash
python scripts/build_data.py
```

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

## Web en local

```bash
python -m http.server 8000
```

y abre <http://localhost:8000/web/>.

El mapa usa la geocodificación inversa de OpenStreetMap (Nominatim) para obtener en
una sola llamada la vía más cercana y el territorio. El servicio público admite como
máximo una petición por segundo: para mucho tráfico habría que usar una instancia propia.

### Saber qué se busca y no se encuentra

La web puede registrar, sin cookies, las búsquedas sin resultado. Está desactivado.
Para activarlo, crea una cuenta en [GoatCounter](https://www.goatcounter.com) y pon
su código en `data/competencias.json`, en `analitica.goatcounter`.

## Servidor MCP

Sin IA propia: expone datos y lógica determinista.

| Herramienta | Qué hace |
|---|---|
| `buscar_competencia(termino, comunidad?)` | Respuestas directas a preguntas concretas y fichas de materia, con referencias, dónde acudir y lo que cambia por territorio |
| `obtener_materia(id_materia, comunidad?)` | Ficha completa de una materia |
| `listar_materias()` | Catálogo de materias |
| `consultar_municipio(nombre)` | Población (INE) y servicios que el ayuntamiento está obligado a prestar |
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

## Fuentes y límites

- **Normas**: texto consolidado del BOE. **Población**: INE, cifras oficiales del padrón municipal. **Vías**: OpenStreetMap.
- Describe el marco general más las excepciones territoriales recogidas en los datos; no sustituye a los Estatutos de Autonomía ni al asesoramiento jurídico.
- Varias excepciones (competencias traspasadas por real decreto, como el tráfico en el País Vasco o la gestión del litoral) no tienen cita propia porque esos decretos no figuran en la legislación consolidada: se apoyan en la referencia general de su materia.
- La titularidad de las vías es una estimación por nomenclatura y territorio, con grado de confianza.
