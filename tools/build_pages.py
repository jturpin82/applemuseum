#!/usr/bin/env python3
"""Fabrique depuis site/ un sous-ensemble publiable sur GitHub Pages.

Pages refuse un site publie au-dela de 1 Go ; l'archive integrale en fait ~2,4.
Chaque niveau de zoom krpano pese environ 4x le precedent, donc en retirer les
plus lourds fait chuter le volume sans toucher a la navigation : les 47 scenes,
les hotspots, le son et le plan restent la, seule la finesse au zoom maximal baisse.

    python3 tools/build_pages.py --drop-top 1

Les fichiers sont lies en dur quand c'est possible : pas de second exemplaire sur le disque.
"""
import argparse, math, os, re, shutil, sys
import xml.etree.ElementTree as ET

HERE  = os.path.dirname(os.path.abspath(__file__))
SRC   = os.path.normpath(os.path.join(HERE, "..", "site"))
TDATA = "3DTour/Tourdata"
FACES = ("front", "right", "back", "left", "up", "down")


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


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--drop-top", type=int, default=1)
    ap.add_argument("--out", default=os.path.normpath(os.path.join(HERE, "..", "pages")))
    a = ap.parse_args()
    if not os.path.isdir(SRC):
        sys.exit("site/ absent")

    keep, drop_els, root = kept_tiles(os.path.join(SRC, TDATA, "Tour.xml"), a.drop_top)
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
            dst = os.path.join(a.out, rel)
            os.makedirs(os.path.dirname(dst), exist_ok=True)
            try:
                os.link(src, dst)
            except OSError:
                shutil.copy2(src, dst)
            n_link += 1
            total += os.path.getsize(src)

    # le XML doit cesser d'annoncer des niveaux qu'on ne publie plus
    for img, el in drop_els:
        img.remove(el)
    ET.ElementTree(root).write(os.path.join(a.out, TDATA, "Tour.xml"),
                               encoding="utf-8", xml_declaration=True)

    open(os.path.join(a.out, ".nojekyll"), "w").close()
    print(f"{n_link} fichiers publies, {n_skip} tuiles haute def ecartees, "
          f"{total/2**30:.2f} Go -> {a.out}")
    if total > 2**30:
        print("ATTENTION : au-dela du plafond de 1 Go de GitHub Pages")


if __name__ == "__main__":
    main()
