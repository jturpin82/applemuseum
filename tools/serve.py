#!/usr/bin/env python3
"""Sert le miroir en local, en pleine resolution.

    python3 tools/serve.py [port]

Le tour est alors accessible depuis n'importe quelle machine du reseau local.
"""
import functools, http.server, mimetypes, os, socket, socketserver, sys

ROOT = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "site"))

# krpano sert des types que la table systeme ne connait pas toujours
for ext, typ in ((".psb", "image/vnd.adobe.photoshop"), (".swf", "application/x-shockwave-flash"),
                 (".cur", "image/vnd.microsoft.icon"), (".xml", "application/xml")):
    mimetypes.add_type(typ, ext)


class Handler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # les tuiles sont immuables : evite de re-telecharger a chaque panoramique
        if self.path.endswith((".jpg", ".png", ".psb", ".mp3", ".mp4", ".swf")):
            self.send_header("Cache-Control", "public, max-age=604800")
        super().end_headers()

    def log_message(self, fmt, *a):
        pass                                   # sinon une panoramique noie le terminal


class Server(socketserver.ThreadingTCPServer):
    allow_reuse_address = True
    daemon_threads = True


def lan_ip():
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        s.connect(("192.0.2.1", 1))            # adresse de doc : aucun paquet ne part
        return s.getsockname()[0]
    except Exception:
        return "127.0.0.1"
    finally:
        s.close()


if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8080
    if not os.path.isdir(ROOT):
        sys.exit("site/ absent : lancer tools/crawl.py d'abord")
    with Server(("0.0.0.0", port), functools.partial(Handler, directory=ROOT)) as srv:
        print(f"AppleMuseum 360 — miroir local\n  http://{lan_ip()}:{port}/\n  http://127.0.0.1:{port}/\nCtrl+C pour arreter")
        try:
            srv.serve_forever()
        except KeyboardInterrupt:
            print("\narret")
