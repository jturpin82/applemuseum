#!/usr/bin/env python3
"""Rend le miroir autonome : chemins relatifs, plus d'appel de session au serveur d'origine.

La page d'origine reference /3DTour/... en absolu, ce qui suppose d'etre servi a la
racine d'un domaine. GitHub Pages publie un projet sous /<depot>/, d'ou le passage en
relatif. Le tour krpano lui-meme est deja entierement relatif : rien a y toucher.
"""
import os, re, sys

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "site")
ROOT = os.path.normpath(ROOT)


def rewrite(html, prefix):
    # chemins absolus du site -> relatifs a la page
    html = html.replace('"/3DTour/', f'"{prefix}3DTour/')
    html = html.replace("(/3DTour/", f"({prefix}3DTour/")     # url() des curseurs CSS

    # sondage de session : sur le miroir il alerterait puis renverrait vers l'original
    html = re.sub(r"\$\(document\)\.ready\(\s*function\s*\(\)\s*\{\s*setInterval\(.*?60000\s*\);\s*\}\s*\);",
                  "/* sondage de session retire : miroir autonome */",
                  html, flags=re.S)

    # dernier recours pour le lien de repli Flash vers adobe.com (mort depuis 2021)
    html = html.replace("http://www.adobe.com/images/shared/download_buttons/get_flash_player.gif",
                        "data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==")
    return html


def main():
    src = os.path.join(ROOT, "vip-tour", "index.html")
    if not os.path.isfile(src):
        sys.exit("page d'entree absente : lancer crawl.py d'abord")
    html = open(src, encoding="utf-8").read()

    for rel, prefix in (("index.html", ""), (os.path.join("vip-tour", "index.html"), "../")):
        out = os.path.join(ROOT, rel)
        os.makedirs(os.path.dirname(out), exist_ok=True)
        open(out, "w", encoding="utf-8").write(rewrite(html, prefix))
        print("ecrit :", os.path.relpath(out, ROOT))

    # Jekyll ignore tout chemin commencant par _ : les 47 dossiers de scenes le font
    open(os.path.join(ROOT, ".nojekyll"), "w").close()
    print("ecrit : .nojekyll")

    # controle
    for rel in ("index.html", "vip-tour/index.html"):
        t = open(os.path.join(ROOT, rel), encoding="utf-8").read()
        bad = re.findall(r'["(]/3DTour/', t) + re.findall(r"validateSession", t)
        print(f"controle {rel}: {'OK' if not bad else 'RESTE ' + str(bad[:3])}")


if __name__ == "__main__":
    main()
