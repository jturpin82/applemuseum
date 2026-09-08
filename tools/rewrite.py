#!/usr/bin/env python3
"""Rend le miroir autonome : chemins relatifs, plus d'appel de session au serveur d'origine.

La page d'origine reference /3DTour/... en absolu, ce qui suppose d'etre servi a la
racine d'un domaine. GitHub Pages publie un projet sous /<depot>/, d'ou le passage en
relatif. Le tour krpano lui-meme est deja entierement relatif : rien a y toucher.
"""
import os, re, shutil, sys

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "site")
ROOT = os.path.normpath(ROOT)


def rewrite(html, prefix):
    # Ce script ecrit dans vip-tour/index.html, qui est aussi sa source : sans cette
    # remise a plat, un second passage relativiserait un chemin deja relatif.
    for pfx in ('"../', '"'), ("(../", "("):
        html = html.replace(f"{pfx[0]}3DTour/", f"{pfx[1]}/3DTour/")
    html = html.replace('"//3DTour/', '"/3DTour/').replace("(//3DTour/", "(/3DTour/")

    # chemins absolus du site -> relatifs a la page
    html = html.replace('"/3DTour/', f'"{prefix}3DTour/')
    html = html.replace("(/3DTour/", f"({prefix}3DTour/")     # url() des curseurs CSS

    # Sans <link rel="icon">, le navigateur reclame /favicon.ico a la racine du
    # domaine -- hors du site, donc 404. On pointe l'icone livree avec les fiches.
    if 'rel="icon"' not in html:
        html = html.replace("</head>",
            f'\t\t<link rel="icon" href="{prefix}3DTour/3Dtexty/images/icon/favicon.png" />\n\t</head>', 1)

    # KolorBootstrap porte la deduction de racine : une copie perimee en cache
    # rejouerait l'ancien prefixe absolu. On versionne sa reference.
    html = re.sub(r'(graphics/KolorBootstrap\.js)(\?v=\d+)?"', r'\1?v=2"', html)

    # sondage de session : sur le miroir il alerterait puis renverrait vers l'original
    html = re.sub(r"\$\(document\)\.ready\(\s*function\s*\(\)\s*\{\s*setInterval\(.*?60000\s*\);\s*\}\s*\);",
                  "/* sondage de session retire : miroir autonome */",
                  html, flags=re.S)

    # dernier recours pour le lien de repli Flash vers adobe.com (mort depuis 2021)
    html = html.replace("http://www.adobe.com/images/shared/download_buttons/get_flash_player.gif",
                        "data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==")
    return html


KB_ORIG = "var crossDomainTargetUrl = '/3DTour/';"
# Racine deduite a l'execution de l'URL du script lui-meme : marche sous n'importe
# quel prefixe (GitHub Pages sert sous /<depot>/) et depuis les deux pages d'entree.
KB_NEW = """var crossDomainTargetUrl = (function(){
	var s = document.currentScript ? document.currentScript.src : '';
	if (!s) { var t = document.getElementsByTagName('script');
		for (var i = t.length - 1; i >= 0; i--) { if (t[i].src.indexOf('KolorBootstrap.js') > -1) { s = t[i].src; break; } } }
	return s ? s.replace(/3DTour\\/Tourdata\\/graphics\\/KolorBootstrap\\.js.*$/, '') + '3DTour/' : '/3DTour/';
})();"""


def patch_bootstrap():
    """KolorTools batit les URL de KolorArea, KolorBox et des messages sur cette racine."""
    fp = os.path.join(ROOT, "3DTour", "Tourdata", "graphics", "KolorBootstrap.js")
    js = open(fp, encoding="utf-8").read()
    if "document.currentScript" in js:
        print("controle KolorBootstrap.js: deja relativise")
        return
    if KB_ORIG not in js:
        sys.exit("KolorBootstrap.js : racine absolue introuvable, verifier le fichier")
    open(fp, "w", encoding="utf-8").write(js.replace(KB_ORIG, KB_NEW))
    print("ecrit : 3DTour/Tourdata/graphics/KolorBootstrap.js")


def patch_skins():
    """Les drapeaux du selecteur de langue sont cites en absolu depuis la racine du domaine."""
    tdir = os.path.join(ROOT, "3DTour", "Tourdata")
    n = 0
    for f in sorted(os.listdir(tdir)):
        if not f.startswith("Tour_skin") or not f.endswith(".xml"):
            continue
        fp = os.path.join(tdir, f)
        x = open(fp, encoding="utf-8").read()
        if 'url="/vip-tour/' not in x:
            continue
        # ancre sur le guillemet : une seconde execution ne reempile pas de ../
        open(fp, "w", encoding="utf-8").write(
            x.replace('url="/vip-tour/', 'url="%FIRSTXML%/../../vip-tour/'))
        n += 1
    print(f"ecrit : {n} XML de skin (chemins des drapeaux)")


def place_close_button():
    """KolorBox injecte ce chemin dans un url() CSS : le navigateur le resout contre
    le document, pas contre la racine du tour. L'origine reglait cela par une copie
    sous /vip-tour/ ; il en faut une par page d'entree."""
    src = os.path.join(ROOT, "3DTour", "Tourdata", "graphics", "websiteviewer",
                       "circle-close-128.png")
    if not os.path.isfile(src):
        print("controle bouton de fermeture: source absente, ignore")
        return
    n = 0
    for base in ("", "vip-tour"):
        dst = os.path.join(ROOT, base, "Tourdata", "graphics", "websiteviewer",
                           "circle-close-128.png")
        if os.path.isfile(dst):
            continue
        os.makedirs(os.path.dirname(dst), exist_ok=True)
        try:
            os.link(src, dst)
        except OSError:
            shutil.copy2(src, dst)
        n += 1
    print(f"ecrit : {n} copie(s) du bouton de fermeture")


def alias_exhibit_pages():
    """Les fiches d'exposition n'ont pas d'extension ; un hebergeur statique les sert
    alors en application/octet-stream, et KolorBox les ouvre dans une iframe -- le
    navigateur declencherait un telechargement. On expose un alias .html."""
    root = os.path.join(ROOT, "3DTour", "3Dtexty")
    if not os.path.isdir(root):
        return
    n = 0
    for dp, _, fs in os.walk(root):
        for f in fs:
            if "." in f:
                continue                      # deja typé
            src = os.path.join(dp, f)
            dst = src + ".html"
            if os.path.isfile(dst):
                continue
            try:
                os.link(src, dst)
            except OSError:
                shutil.copy2(src, dst)
            n += 1
    print(f"ecrit : {n} alias .html de fiches")


def patch_messages():
    """Faire pointer les XML de messages sur les alias typés."""
    tdir = os.path.join(ROOT, "3DTour", "Tourdata")
    pat = re.compile(r"(\./3Dtexty/[A-Za-z0-9_/-]+?)(?=\]\]>)")
    # Le segment 3DTour/ manque dans la valeur d'origine : le navigateur resout
    # ./3Dtexty/... contre le document, alors que le contenu vit sous 3DTour/3Dtexty/.
    # (Deja casse sur le site d'origine : /vip-tour/3Dtexty/... y renvoie 404.)
    seg = re.compile(r"\./3DTour/3Dtexty/")
    n = 0
    for f in sorted(os.listdir(tdir)):
        if not (f.startswith("Tour_messages") and f.endswith(".xml")):
            continue
        fp = os.path.join(tdir, f)
        x = open(fp, encoding="utf-8").read()
        new = pat.sub(lambda m: m.group(1) if m.group(1).endswith(".html")
                      else m.group(1) + ".html", x)
        new = seg.sub("./3Dtexty/", new)   # KolorBox prefixe deja, cf patch_kolorbox
        if new != x:
            open(fp, "w", encoding="utf-8").write(new)
            n += 1
    print(f"ecrit : {n} XML de messages (alias .html)")


def patch_kolorbox():
    """KolorBox code en dur '/3DTour/' comme prefixe du src d'iframe des fiches.
    Sous un sous-repertoire la requete part a la racine du domaine. On reutilise
    crossDomainTargetUrl, global deja calcule par KolorBootstrap depuis l'URL du
    script, donc juste sous n'importe quelle base."""
    fp = os.path.join(ROOT, "3DTour", "Tourdata", "graphics", "KolorBox", "KolorBox.min.js")
    if not os.path.isfile(fp):
        print("controle KolorBox: absent, ignore")
        return
    js = open(fp, encoding="utf-8").read()
    n = js.count("'/3DTour/'")
    if n == 0:
        print("controle KolorBox: deja relativise")
        return
    open(fp, "w", encoding="utf-8").write(js.replace("'/3DTour/'", "crossDomainTargetUrl"))
    print(f"ecrit : KolorBox.min.js ({n} prefixe(s) relativise(s))")


KB_VER = "?v=2"


def version_modules():
    """Un KolorBox.min.js perime en cache rejoue l'ancien prefixe code en dur.
    On versionne l'URL des modules charges dynamiquement : le navigateur ne peut
    plus servir une copie ancienne."""
    fp = os.path.join(ROOT, "3DTour", "Tourdata", "graphics", "KolorBootstrap.js")
    js = open(fp, encoding="utf-8").read()
    if KB_VER in js:
        print("controle modules: deja versionnes")
        return
    new = re.sub(r'(crossDomainTargetUrl\s*\+\s*"Tourdata/graphics/[A-Za-z]+/[A-Za-z.]+?)(\.(?:js|css))"',
                 lambda m: f'{m.group(1)}{m.group(2)}{KB_VER}"', js)
    n = new.count(KB_VER)
    if n == 0:
        print("controle modules: aucune URL de module trouvee, ignore")
        return
    open(fp, "w", encoding="utf-8").write(new)
    print(f"ecrit : {n} URL(s) de module versionnee(s)")


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

    alias_exhibit_pages()
    patch_messages()
    place_close_button()
    patch_bootstrap()
    patch_kolorbox()
    version_modules()
    patch_skins()

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
