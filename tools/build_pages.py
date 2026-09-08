#!/usr/bin/env python3
"""Fabrique depuis site/ un sous-ensemble publiable sur GitHub Pages.

Pages refuse un site publie au-dela de 1 Go ; l'archive integrale en fait ~2,4.
Chaque niveau de zoom krpano pese environ 4x le precedent, donc en retirer les
plus lourds fait chuter le volume sans toucher a la navigation : les 47 scenes,
les hotspots, le son et le plan restent la, seule la finesse au zoom maximal baisse.

    python3 tools/build_pages.py --drop-top 1

Les fichiers sont lies en dur quand c'est possible : pas de second exemplaire sur le disque.
"""
import argparse, hashlib, math, os, re, shutil, sys
import xml.etree.ElementTree as ET

HERE  = os.path.dirname(os.path.abspath(__file__))
SRC   = os.path.normpath(os.path.join(HERE, "..", "site"))
TDATA = "3DTour/Tourdata"
FACES = ("front", "right", "back", "left", "up", "down")


def tour_xmls(tdir):
    """Tour.xml, ses sept variantes de langue et la variante VR : tous portent des scenes."""
    return sorted(f for f in os.listdir(tdir)
                  if re.fullmatch(r"Tour(_vr|-[a-z]{2})?\.xml", f))


def kept_tiles(xml_path, drop_top):
    """Chemins des tuiles conservees, plus la liste des <level> a retirer du XML."""
    root = ET.parse(xml_path).getroot()
    keep, drop_els = set(), []
    for scene in root.iter("scene"):
        for img in scene.iter("image"):
            ts = img.get("tilesize")
            if img.get("type") != "CUBE" or not ts:
                continue
            ts = int(ts)
            base = int(img.get("baseindex") or 0)
            lv = sorted(((int(l.get("tiledimagewidth")), int(l.get("tiledimageheight")), l)
                         for l in img.findall("level")), key=lambda t: t[0])
            cut = lv[max(1, len(lv) - drop_top):] if drop_top else []
            for _, _, el in cut:
                drop_els.append((img, el))
            for w, h, el in lv:
                if any(el is d for _, d in drop_els):
                    continue
                nx, ny = math.ceil(w / ts), math.ceil(h / ts)
                for face in FACES:
                    fe = el.find(face)
                    if fe is None or not fe.get("url"):
                        continue
                    for v in range(base, base + ny):
                        for u in range(base, base + nx):
                            rel = re.sub(r"%0?v", str(v), fe.get("url"))
                            rel = re.sub(r"%0?u", str(u), rel)
                            keep.add(f"{TDATA}/{rel}")
    return keep, drop_els, root


GATE = """		<div id="amGate" style="position:fixed;inset:0;z-index:99999;background:#111;color:#eee;
			display:flex;align-items:center;justify-content:center;
			font:14px/1.5 -apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
			<form id="amGateForm" style="text-align:center;max-width:22em;padding:2em">
				<p style="margin:0 0 .4em;font-size:1.25em">AppleMuseum 360</p>
				<p style="margin:0 0 1.4em;opacity:.55">Visite privee</p>
				<input id="amGateInput" type="password" autocomplete="off" autofocus
					style="width:100%;padding:.6em;border:1px solid #444;border-radius:4px;
					background:#1c1c1c;color:#eee;text-align:center;font-size:1em">
				<button type="submit" style="margin-top:.8em;width:100%;padding:.6em;border:0;
					border-radius:4px;background:#3a7afe;color:#fff;font-size:1em;cursor:pointer">Entrer</button>
				<p id="amGateErr" hidden style="margin:1em 0 0;color:#ff6b6b">Code incorrect</p>
			</form>
		</div>
		<script type="text/javascript">
		// Simple garde-fou : evite qu'un visiteur de passage ou un robot ne declenche
		// le telechargement des tuiles. Ce n'est pas une protection : les fichiers
		// restent joignables en direct. Cf. README.
		(function () {
			var HASH = "%HASH%", KEY = "am_gate";
			var gate = document.getElementById("amGate");
			function start() {
				gate.parentNode.removeChild(gate);
				if (isVRModeRequested()) { accessWebVr(); } else { accessStdVr(); }
			}
			function sha(s) {
				return crypto.subtle.digest("SHA-256", new TextEncoder().encode(s)).then(function (b) {
					return Array.prototype.map.call(new Uint8Array(b), function (x) {
						return ("0" + x.toString(16)).slice(-2); }).join("");
				});
			}
			try { if (localStorage.getItem(KEY) === HASH) { start(); return; } } catch (e) {}
			document.getElementById("amGateForm").addEventListener("submit", function (e) {
				e.preventDefault();
				sha(document.getElementById("amGateInput").value.trim()).then(function (h) {
					if (h === HASH) {
						try { localStorage.setItem(KEY, h); } catch (e) {}
						start();
					} else { document.getElementById("amGateErr").hidden = false; }
				});
			});
		})();
		</script>"""

LOADER = re.compile(r"[ \t]*if \(isVRModeRequested\(\)\)\{.*?\n[ \t]*\}", re.S)


def add_gate(out, passphrase):
    """Retarde le demarrage du lecteur jusqu'a saisie du code, et ecarte les moteurs.
    Applique au seul arbre publie : l'archive et l'instance authentifiee n'en veulent pas."""
    h = hashlib.sha256(passphrase.encode()).hexdigest()
    for rel in ("index.html", os.path.join("vip-tour", "index.html")):
        fp = os.path.join(out, rel)
        if not os.path.isfile(fp):
            continue
        html = open(fp, encoding="utf-8").read()
        if "amGate" in html:
            continue
        if not LOADER.search(html):
            print(f"  ATTENTION: appel du lecteur introuvable dans {rel}, non protege")
            continue
        html = LOADER.sub(GATE.replace("%HASH%", h), html, count=1)
        html = html.replace("</head>",
            '\t\t<meta name="robots" content="noindex,nofollow" />\n\t</head>', 1)
        os.unlink(fp)          # lien dur vers l'archive : ne pas ecrire au travers
        open(fp, "w", encoding="utf-8").write(html)
    print(f"code d'acces pose sur les pages d'entree (sha256 {h[:12]}...)")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--drop-top", type=int, default=1)
    ap.add_argument("--gate-pass", default="applemuseum",
                    help="code d'acces du site publie")
    ap.add_argument("--out", default=os.path.normpath(os.path.join(HERE, "..", "pages")))
    a = ap.parse_args()
    if not os.path.isdir(SRC):
        sys.exit("site/ absent")

    tdir  = os.path.join(SRC, TDATA)
    names = tour_xmls(tdir)
    print("XML de scenes traites :", ", ".join(names))
    # l'union : une tuile citee par une seule langue doit survivre
    keep, per_xml = set(), {}
    for n in names:
        k, drop_els, root = kept_tiles(os.path.join(tdir, n), a.drop_top)
        keep |= k
        per_xml[n] = (drop_els, root)
    tile_re = re.compile(r"^" + re.escape(TDATA) + r"/[^/]+/\d+/\d+/")

    if os.path.isdir(a.out):
        shutil.rmtree(a.out)

    n_link = n_skip = 0
    total = 0
    for dirpath, _, files in os.walk(SRC):
        for f in files:
            src = os.path.join(dirpath, f)
            rel = os.path.relpath(src, SRC)
            posix = rel.replace(os.sep, "/")
            if tile_re.match(posix) and posix not in keep:
                n_skip += 1
                continue
            if posix == ".gitignore":
                continue          # celui de l'archive exclut tout : fatal sur la branche publiee
            dst = os.path.join(a.out, rel)
            os.makedirs(os.path.dirname(dst), exist_ok=True)
            try:
                os.link(src, dst)
            except OSError:
                shutil.copy2(src, dst)
            n_link += 1
            total += os.path.getsize(src)

    # chaque XML doit cesser d'annoncer les niveaux qu'on ne publie plus
    for n, (drop_els, root) in per_xml.items():
        for img, el in drop_els:
            img.remove(el)
        dst = os.path.join(a.out, TDATA, n)
        # ce fichier est un lien dur vers l'archive : ecrire dedans tronquerait
        # aussi site/. On rompt le lien avant de reecrire.
        if os.path.exists(dst):
            os.unlink(dst)
        ET.ElementTree(root).write(dst, encoding="utf-8", xml_declaration=True)

    add_gate(a.out, a.gate_pass)

    open(os.path.join(a.out, ".nojekyll"), "w").close()
    print(f"{n_link} fichiers publies, {n_skip} tuiles haute def ecartees, "
          f"{total/2**30:.2f} Go -> {a.out}")
    if total > 2**30:
        print("ATTENTION : au-dela du plafond de 1 Go de GitHub Pages")


if __name__ == "__main__":
    main()
