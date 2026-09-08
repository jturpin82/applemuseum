# AppleMuseum 360 — miroir statique de la visite virtuelle

Copie de conservation de la visite virtuelle **AppleMuseum 3D** publiée sur
`applemuseum360.com/vip-tour/`. Le musée Apple de Prague ayant fermé, ce dépôt
existe pour que la visite survive à la disparition éventuelle de son hébergement.

Le site est servi de façon autonome : aucune dépendance réseau vers l'original.

## Provenance et droits

- Œuvre originale : **AppleMuseum** (visite montée avec Kolor Panotour / krpano).
- Ce dépôt n'est **pas** l'œuvre d'origine et n'en revendique aucun droit ; c'est
  un miroir de conservation, reproduit tel quel.
- La visite était autrefois payante (3 €) puis est passée en accès libre : c'est
  cette version librement accessible qui est archivée ici. Accès libre ne vaut
  pas domaine public — le droit d'auteur de l'AppleMuseum reste entier.
- La bande son inclut des enregistrements tiers présents dans la visite d'origine.

Toute demande de retrait émanant d'un ayant droit sera honorée.

## Contenu

| | |
|---|---|
| Scènes panoramiques | 47 |
| Langues du guide | en, de, fr, es, it, ru, cn (+ messages cs) |
| Vidéos des points d'intérêt | 9 (mp4) |
| Bande son | 3 (mp3) |
| Lecteur | krpano 1.19, HTML5 (le SWF n'est plus qu'un vestige) |

Les panoramas sont des cubemaps multirésolution découpés en tuiles de 512 px.

## Ce qui a été adapté

Le miroir n'est pas une copie octet à octet : trois retouches étaient
nécessaires pour qu'il fonctionne hors du serveur d'origine.

1. **Chemins relativisés.** Le wrapper HTML pointait vers `/3DTour/...` en
   absolu, ce qui casse sous le préfixe de GitHub Pages (`/<dépôt>/`). Les XML
   krpano, eux, utilisaient déjà des chemins relatifs et sont intacts.
2. **Vérification de session retirée.** La page interrogeait
   `/vip-tour/?validateSession` toutes les 60 s et renvoyait le visiteur vers le
   site d'origine à l'expiration. Inopérant et nuisible sur un miroir.
3. **`.nojekyll`.** Sans ce fichier, Jekyll ignorerait tout répertoire commençant
   par `_` — c'est-à-dire la quasi-totalité des scènes (`_00_2037`, `_01_91`…).

## Résolution servie

Le tour complet pèse ~2,4 Go pour 162 000 tuiles, au-delà du plafond de 1 Go
par site publié de GitHub Pages. Le dépôt ne versionne donc que les niveaux de
zoom servables ; les deux niveaux les plus fins sont exclus par `.gitignore` et
distribués séparément en archive. La visite reste entièrement navigable, seul le
zoom maximal est réduit.

## Code d'accès du site publié

Le tour publié sur GitHub Pages attend un code avant d'instancier le lecteur
krpano. Le but est la **bande passante**, pas la sécurité : tant que le lecteur
n'a pas démarré, aucune tuile ni aucun XML n'est demandé — or c'est là que passent
les ~520 Mo. Un visiteur de passage ou un robot ne consomme donc presque rien.
Une balise `<meta name="robots" content="noindex,nofollow">` écarte en outre les
moteurs. Un `robots.txt` serait sans effet ici : il n'est lu qu'à la racine du
domaine, qui n'appartient pas à ce dépôt.

**Ce n'est pas une protection.** Le code est vérifié côté navigateur et tous les
fichiers restent joignables en direct par leur URL. Pour un accès réellement
restreint, utiliser l'instance du Pi, derrière oauth2-proxy.

Le code n'est volontairement pas indiqué ici : ce dépôt est public. Il se
définit à la construction :

```bash
python3 tools/build_pages.py --drop-top 2 --gate-pass "mon-code"
```

Le garde-fou n'est appliqué qu'à `pages/` : ni l'archive `site/`, ni l'instance
du Pi ne le portent.

## Reconstruire depuis la source

```sh
python3 tools/crawl.py --out site      # aspiration (reprenable)
python3 tools/build_site.py            # relativisation + nettoyage
python3 tools/tier.py --drop-top 2 --write
```

Le serveur d'origine renvoie `466 Access Forbidden` aux clients sans en-têtes de
navigateur ; le crawler envoie donc `Referer` et `Sec-Fetch-*`, et porte le
cookie de session que `/vip-tour/` délivre.
