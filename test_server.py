import importlib.util
import json
import threading
import unittest
from http.server import ThreadingHTTPServer
from pathlib import Path
from urllib.error import HTTPError
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location("local_preview", ROOT / "server.py")
preview = importlib.util.module_from_spec(spec)
assert spec and spec.loader
spec.loader.exec_module(preview)


class StaticPreviewTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.server = ThreadingHTTPServer(("127.0.0.1", 0), preview.PreviewHandler)
        cls.thread = threading.Thread(target=cls.server.serve_forever, daemon=True)
        cls.thread.start()
        cls.base = f"http://127.0.0.1:{cls.server.server_port}"

    @classmethod
    def tearDownClass(cls):
        cls.server.shutdown()
        cls.server.server_close()
        cls.thread.join(timeout=2)

    def test_shell_and_pwa_assets_are_served(self):
        for path, expected_type in (
            ("/", "text/html"),
            ("/app.js", "text/javascript"),
            ("/styles.css", "text/css"),
            ("/manifest.webmanifest", "application/manifest+json"),
            ("/icon-192.png", "image/png"),
            ("/sw.js", "text/javascript"),
        ):
            with self.subTest(path=path):
                with urlopen(self.base + path, timeout=3) as response:
                    self.assertEqual(response.status, 200)
                    self.assertIn(expected_type, response.headers.get("Content-Type", ""))

    def test_pwa_paths_support_github_pages_subdirectory(self):
        html = (ROOT / "public" / "index.html").read_text(encoding="utf-8")
        manifest = json.loads((ROOT / "public" / "manifest.webmanifest").read_text(encoding="utf-8"))
        main_js = (ROOT / "public" / "main.js").read_text(encoding="utf-8")
        service_worker = (ROOT / "public" / "sw.js").read_text(encoding="utf-8")
        workflow = (ROOT / ".github" / "workflows" / "deploy-pages.yml").read_text(encoding="utf-8")

        self.assertNotIn('href="/', html)
        self.assertNotIn('src="/', html)
        self.assertEqual(manifest["start_url"], "./")
        self.assertEqual(manifest["scope"], "./")
        self.assertTrue(all(icon["src"].startswith("./") for icon in manifest["icons"]))
        self.assertIn("register('./sw.js')", main_js)
        self.assertIn("self.registration.scope", service_worker)
        self.assertIn("path: ./public", workflow)
        self.assertIn("actions/deploy-pages", workflow)

    def test_no_data_api_or_database_is_available(self):
        self.assertFalse(hasattr(preview, "DB_PATH"))
        self.assertFalse(hasattr(preview, "init_db"))
        for path in ("/api/data", "/api/auth/me", "/api/team"):
            with self.subTest(path=path), self.assertRaises(HTTPError) as raised:
                urlopen(self.base + path, timeout=3)
            self.assertEqual(raised.exception.code, 404)
        request = Request(self.base + "/api/data/sync", data=b"{}", method="POST")
        with self.assertRaises(HTTPError) as raised:
            urlopen(request, timeout=3)
        self.assertEqual(raised.exception.code, 501)

    def test_missing_assets_return_404(self):
        with self.assertRaises(HTTPError) as raised:
            urlopen(self.base + "/missing.js", timeout=3)
        self.assertEqual(raised.exception.code, 404)


if __name__ == "__main__":
    unittest.main()
