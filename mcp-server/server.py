"""Arranque del servidor MCP directamente desde el repositorio.

    python mcp-server/server.py

Equivale al comando `competencias-mcp` que queda disponible al instalar el paquete.
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from competencias_mcp.server import main  # noqa: E402

if __name__ == "__main__":
    main()
