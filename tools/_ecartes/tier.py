#!/usr/bin/env python3
"""Separe les niveaux de zoom : ce que git suit, et ce qui part en archive.

GitHub Pages plafonne un site publie a 1 Go. Le tour complet pese ~2,4 Go, dont
l'essentiel dans les deux niveaux de zoom les plus fins. On garde donc l'arbre
complet sur le disque (copie de conservation) mais on ne versionne que les
niveaux servables ; les niveaux exclus sont empaquetes a part.
"""
import argparse, os, re, subprocess, sys
from collections import defaultdict

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TD   = os.path.join(ROOT, "3DTour", "Tourdata")
# <scene>/<face 0-5>/<niveau>/...
TILE = re.compile(r"^(?P<scene>[^/]+)/(?P<face>[0-5])/(?P<lvl>\d+)/")


def scan():
    """niveaux presents par scene, et poids par (scene, niveau)."""
    lv, size = defaultdict(set), defaultdict(int)
    for dp, _, fs in os.walk(TD):
        rel = os.path.relpath(dp, TD)
        m = TILE.match(rel.replace(os.sep, "/") + "/")
        if not m:
            continue
        s, l = m.group("scene"), int(m.group("lvl"))
        lv[s].add(l)
        for f in fs:
            size[(s, l)] += os.path.getsize(os.path.join(dp, f))
    return lv, size


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--drop-top", type=int, default=2,
                    help="niveaux les plus fins exclus du suivi git")
    ap.add_argument("--write", action="store_true", help="ecrire .gitignore")
    a = ap.parse_args()

    lv, size = scan()
    if not lv:
        sys.exit("aucune tuile trouvee sous 3DTour/Tourdata/")

    excl, kept_b, excl_b = [], 0, 0
    for s in sorted(lv):
        levels = sorted(lv[s])
        cut = levels[len(levels) - a.drop_top:] if a.drop_top else []
        for l in levels:
            if l in cut:
                excl_b += size[(s, l)]
                excl.append(f"/3DTour/Tourdata/{s}/*/{l}/")
            else:
                kept_b += size[(s, l)]

    print(f"scenes            : {len(lv)}")
    print(f"suivi par git     : {kept_b/2**30:.2f} Go")
    print(f"exclu (archive)   : {excl_b/2**30:.2f} Go  ({len(excl)} regles)")

    if a.write:
        body = ("# Niveaux de zoom les plus fins : conserves sur disque et en archive de\n"
                "# Release, mais hors du depot pour rester sous le plafond de 1 Go de Pages.\n"
                "# Regenerer avec : python3 tools/tier.py --drop-top %d --write\n" % a.drop_top
                + "\n".join(sorted(excl)) + "\n\nsite/\n*.part\n*.tar.zst\n")
        open(os.path.join(ROOT, ".gitignore"), "w").write(body)
        print("-> .gitignore ecrit")


if __name__ == "__main__":
    main()
