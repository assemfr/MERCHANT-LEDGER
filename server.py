#!/usr/bin/env python3
"""Static local preview server for the offline-first PWA. No database or API."""
from __future__ import annotations

import os
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

ROOT = Path(__file__).resolve().parent
PUBLIC = ROOT / "public"
HOST = os.environ.get("HOST", "0.0.0.0")
PORT = int(os.environ.get("PORT", "8080"))


class PreviewHandler(SimpleHTTPRequestHandler):
    """Serve only static app files; ledger data never passes through this server."""

    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(PUBLIC), **kwargs)

    def guess_type(self, path: str) -> str:
        if path.lower().endswith(".webmanifest"):
            return "application/manifest+json"
        return super().guess_type(path)

    def log_message(self, fmt: str, *args) -> None:
        # Keep preview logs concise; no request bodies or ledger contents are logged.
        super().log_message(fmt, *args)


def main() -> None:
    with ThreadingHTTPServer((HOST, PORT), PreviewHandler) as server:
        print(f"Static local preview on http://{HOST}:{PORT} (no API or database)", flush=True)
        server.serve_forever()


if __name__ == "__main__":
    main()
