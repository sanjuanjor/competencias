"""Genera web/og.png, la imagen que muestran las redes al compartir un enlace.

Solo hay que ejecutarlo si se quiere cambiar la imagen. Necesita Pillow
(pip install pillow), que no es una dependencia del resto del proyecto.

Uso:  python scripts/generar_imagen.py
"""
from __future__ import annotations

import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
DESTINO = ROOT / "web" / "og.png"
ANCHO, ALTO = 1200, 630
FUENTES = [
    "C:/Windows/Fonts/segoeuib.ttf", "C:/Windows/Fonts/arialbd.ttf",
    "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
    "/System/Library/Fonts/Supplemental/Arial Bold.ttf",
]
ADMINISTRACIONES = [("Estado", "#1d4ed8"), ("Comunidad autónoma", "#15803d"),
                    ("Diputación", "#b45309"), ("Ayuntamiento", "#6d28d9")]


def fuente(tamano: int) -> ImageFont.FreeTypeFont:
    for ruta in FUENTES:
        if Path(ruta).exists():
            return ImageFont.truetype(ruta, tamano)
    raise SystemExit("No se ha encontrado ninguna fuente TrueType conocida.")


def main() -> int:
    imagen = Image.new("RGB", (ANCHO, ALTO))
    dibujo = ImageDraw.Draw(imagen)
    for y in range(ALTO):  # degradado vertical, como la cabecera de la web
        t = y / ALTO
        dibujo.line([(0, y), (ANCHO, y)], fill=(int(15 + 15 * t), int(23 + 35 * t), int(42 + 96 * t)))

    dibujo.text((80, 150), "¿De quién es", font=fuente(92), fill="#ffffff")
    dibujo.text((80, 255), "la competencia?", font=fuente(92), fill="#ffffff")
    dibujo.text((80, 385), "Quién se encarga de qué en España, con la ley que lo dice.",
                font=fuente(36), fill="#cbd5e1")

    x = 80
    letra = fuente(30)
    for nombre, color in ADMINISTRACIONES:
        ancho = int(dibujo.textlength(nombre, font=letra)) + 44
        dibujo.rounded_rectangle([x, 480, x + ancho, 540], radius=30, fill=color)
        dibujo.text((x + 22, 491), nombre, font=letra, fill="#ffffff")
        x += ancho + 18

    imagen.save(DESTINO, optimize=True)
    print(f"Guardada {DESTINO.relative_to(ROOT)} ({DESTINO.stat().st_size // 1024} KB)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
