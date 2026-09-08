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

## Reconstruire depuis la source

```sh
python3 tools/crawl.py --out site      # aspiration (reprenable)
python3 tools/build_site.py            # relativisation + nettoyage
python3 tools/tier.py --drop-top 2 --write
```

Le serveur d'origine renvoie `466 Access Forbidden` aux clients sans en-têtes de
navigateur ; le crawler envoie donc `Referer` et `Sec-Fetch-*`, et porte le
cookie de session que `/vip-tour/` délivre.
