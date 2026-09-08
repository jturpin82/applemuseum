#!/usr/bin/env python3
"""Transforme le miroir brut (site/) en site statique autonome a la racine du depot.

Le tour krpano utilise deja des URLs relatives dans ses XML ; seuls le wrapper
HTML et KolorBootstrap.js portent des chemins absolus /3DTour/. On les
relativise pour que le site fonctionne sous n'importe quel prefixe (Pages sert
sous /<repo>/), et on retire l'appel de validation de session, qui renverrait
le visiteur vers le site d'origine.
"""
import os, re, shutil, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC  = os.path.join(ROOT, "site")


def strip_session_check(html):
    """Retire le sondage ?validateSession (alerte + redirection vers l'original)."""
    pat = re.compile(r"\n\s*\$\(document\)\.ready\(function\(\)\{\s*setInterval\("
                     r".*?validateSession.*?\}, ?60000\);\s*\}\);", re.S)
    out, n = pat.subn("\n\t\t\t// [miroir] sondage de session supprime", html)
    if n != 1:
        sys.exit("ECHEC: bloc validateSession introuvable ou ambigu (n=%d)" % n)
    return out


def relativize(text, prefix):
    """/3DTour/... -> <prefix>3DTour/... (prefix = '' a la racine, '../' un cran plus bas)."""
    return re.sub(r'(["\'(=])/3DTour/', lambda m: m.group(1) + prefix + "3DTour/", text)


def main():
    if not os.path.isdir(SRC):
        sys.exit("site/ absent : lancer d'abord tools/crawl.py")

    # 1. arborescence des donnees a la racine du depot
    for d in ("3DTour",):
        dst = os.path.join(ROOT, d)
        if os.path.exists(dst):
            shutil.rmtree(dst)
        shutil.move(os.path.join(SRC, d), dst)

    # 2. wrapper : version racine + version /vip-tour/ (fidelite d'URL)
    raw = open(os.path.join(SRC, "vip-tour", "index.html"), encoding="utf-8").read()
    raw = strip_session_check(raw)
    banner = ("<!-- Miroir statique hors-ligne de applemuseum360.com/vip-tour/.\n"
              "     Chemins relativises, verification de session retiree. -->\n")

    open(os.path.join(ROOT, "index.html"), "w", encoding="utf-8").write(
        banner + relativize(raw, ""))
    os.makedirs(os.path.join(ROOT, "vip-tour"), exist_ok=True)
    open(os.path.join(ROOT, "vip-tour", "index.html"), "w", encoding="utf-8").write(
        banner + relativize(raw, "../"))

    # 3. KolorBootstrap : cible cross-domain absolue
    kb = os.path.join(ROOT, "3DTour", "Tourdata", "graphics", "KolorBootstrap.js")
    t = open(kb, encoding="utf-8", errors="ignore").read()
    t2 = t.replace("var crossDomainTargetUrl = '/3DTour/';",
                   "var crossDomainTargetUrl = '../../';")
    if t2 == t:
        print("  ATTENTION: crossDomainTargetUrl inchange", file=sys.stderr)
    open(kb, "w", encoding="utf-8").write(t2)

    # 4. Pages : sans ce fichier Jekyll ignore tout repertoire commencant par _
    #    (toutes les scenes du tour : _00_2037, _01_91, ...)
    open(os.path.join(ROOT, ".nojekyll"), "w").close()

    shutil.rmtree(SRC, ignore_errors=True)

    n = sum(len(f) for _, _, f in os.walk(os.path.join(ROOT, "3DTour")))
    print(f"site construit : {n} fichiers sous 3DTour/, index.html + vip-tour/index.html")


if __name__ == "__main__":
    main()
