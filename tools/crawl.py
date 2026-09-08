#!/usr/bin/env python3
"""Aspirateur du tour krpano applemuseum360.com/vip-tour/.

Reproduit l'arborescence du site sous <out>/ . Reprise a chaud : tout fichier
deja present et non vide est saute. Le serveur filtre les clients sans en-tetes
de navigateur (reponse 466), d'ou les headers et le cookie de session.
"""
import argparse, math, os, queue, random, re, sys, threading, time
import http.cookiejar, urllib.request, urllib.error, urllib.parse
import xml.etree.ElementTree as ET

BASE   = "https://www.applemuseum360.com"
ENTRY  = BASE + "/vip-tour/"
TDATA  = "/3DTour/Tourdata"
UA     = ("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
          "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")

cj     = http.cookiejar.CookieJar()
opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(cj))

lock   = threading.Lock()
stats  = {"ok": 0, "skip": 0, "miss": 0, "err": 0, "bytes": 0}


def headers(dest):
    h = {"User-Agent": UA, "Referer": ENTRY, "Accept-Language": "fr-FR,fr;q=0.9,en;q=0.8",
         "Sec-Fetch-Site": "same-origin", "Sec-Fetch-Mode": "no-cors", "Sec-Fetch-Dest": dest,
         "Connection": "keep-alive"}
    h["Accept"] = {"image": "image/avif,image/webp,*/*",
                   "document": "text/html,application/xhtml+xml,*/*;q=0.8"}.get(dest, "*/*")
    return h


def fetch(path, dest="empty", tries=4):
    """Renvoie le corps, ou None si 404. Leve en cas d'echec durable."""
    url = BASE + path
    for n in range(tries):
        try:
            rq = urllib.request.Request(url, headers=headers(dest))
            with opener.open(rq, timeout=45) as r:
                return r.read()
        except urllib.error.HTTPError as e:
            if e.code == 404:
                return None
            if e.code in (429, 500, 502, 503, 504, 466) and n < tries - 1:
                time.sleep((2 ** n) + random.random())
                continue
            raise
        except Exception:
            if n < tries - 1:
                time.sleep((2 ** n) + random.random())
                continue
            raise
    return None


def save(out, path, data):
    fp = os.path.join(out, path.lstrip("/"))
    os.makedirs(os.path.dirname(fp), exist_ok=True)
    tmp = fp + ".part"
    with open(tmp, "wb") as f:
        f.write(data)
    os.replace(tmp, fp)


def have(out, path):
    fp = os.path.join(out, path.lstrip("/"))
    return os.path.isfile(fp) and os.path.getsize(fp) > 0


def grab(out, path, dest="empty"):
    if have(out, path):
        with lock:
            stats["skip"] += 1
        return True
    try:
        d = fetch(path, dest)
    except Exception as e:
        with lock:
            stats["err"] += 1
        print(f"  ERR  {path}  {e}", file=sys.stderr)
        return False
    if d is None:
        with lock:
            stats["miss"] += 1
        return False
    save(out, path, d)
    with lock:
        stats["ok"] += 1
        stats["bytes"] += len(d)
    return True


# ---------- extraction de references ----------
EXT = r"(?:jpg|jpeg|png|gif|webp|psb|swf|js|css|xml|mp3|ogg|wav|mp4|webm|cur|ico|svg|woff2?|ttf|eot|json|txt)"
REF = re.compile(r"""["'(]\s*([A-Za-z0-9_%!./~-][A-Za-z0-9_%!./~ -]*\.""" + EXT + r""")\s*["')]""", re.I)


def resolve(ref, curdir):
    """Resout une reference krpano/HTML en chemin absolu du site, ou None."""
    ref = ref.strip().replace("\\/", "/")
    if not ref or re.search(r"%[0-9]*[vus]\b", ref):
        return None                                         # motif de tuile
    ref = ref.replace("%FIRSTXML%", TDATA).replace("%SWFPATH%", TDATA)
    if "%" in ref or ref.startswith("//") or re.match(r"^[a-z]+:", ref, re.I):
        return None                                         # variable non resolue / externe
    if " " in ref or ref.startswith("/Users/"):
        return None                                         # chemin de production reste dans le XML
    if " " in ref or ref.startswith("/Users/") or ref.startswith("/Volumes/"):
        return None                                         # chemin local du monteur, pas une URL
    if not ref.startswith("/"):
        ref = os.path.join(curdir, ref)
    return os.path.normpath(ref)


def refs_in(data, curdir):
    try:
        txt = data.decode("utf-8", "ignore")
    except Exception:
        return set()
    out = set()
    for m in REF.finditer(txt):
        p = resolve(m.group(1), curdir)
        if p and p.startswith("/"):
            out.add(p)
    for m in re.finditer(r'url\(\s*["\']?([^"\')]+)["\']?\s*\)', txt):
        p = resolve(m.group(1), curdir)
        if p and p.startswith("/"):
            out.add(p)
    return out


# ---------- enumeration des tuiles ----------
FACES = ("front", "right", "back", "left", "up", "down")
LANGS = ("en", "de", "fr", "es", "it", "ru", "cn", "cs")


def tile_paths(xml_bytes, drop_top=0):
    """Developpe les motifs %v/%u de chaque <level> en chemins concrets."""
    root = ET.fromstring(xml_bytes)
    out = []
    for scene in root.iter("scene"):
        for img in scene.iter("image"):
            ts = img.get("tilesize")
            if img.get("type") != "CUBE" or not ts:
                continue
            ts = int(ts)
            base = int(img.get("baseindex") or 0)
            lv = []
            for level in img.findall("level"):
                w, h = int(level.get("tiledimagewidth")), int(level.get("tiledimageheight"))
                lv.append((w, h, level))
            lv.sort(key=lambda t: t[0])                     # petit -> grand
            if drop_top:
                lv = lv[:max(1, len(lv) - drop_top)]
            for w, h, level in lv:
                nx, ny = math.ceil(w / ts), math.ceil(h / ts)
                for face in FACES:
                    el = level.find(face)
                    if el is None or not el.get("url"):
                        continue
                    pat = el.get("url")
                    for v in range(base, base + ny):
                        for u in range(base, base + nx):
                            rel = re.sub(r"%0?v", str(v), pat)
                            rel = re.sub(r"%0?u", str(u), rel)
                            out.append(f"{TDATA}/{rel}")
    return out


def static_assets(xml_bytes):
    """Previews, vignettes, plan : references non tuilees portees par les scenes."""
    root = ET.fromstring(xml_bytes)
    got = set()
    for el in root.iter():
        for attr in ("url", "thumburl", "href", "projectfloorplanurl"):
            v = el.get(attr)
            if not v:
                continue
            p = resolve(v, TDATA)
            if p:
                got.add(p)
    return got


# ---------- boucle de telechargement ----------
def run_pool(out, paths, workers, delay, label):
    q = queue.Queue()
    for p in paths:
        q.put(p)
    total = q.qsize()
    t0 = time.time()

    def worker():
        while True:
            try:
                p = q.get_nowait()
            except queue.Empty:
                return
            dest = "image" if re.search(r"\.(jpg|jpeg|png|gif|webp|psb)$", p, re.I) else "empty"
            grab(out, p, dest)
            if delay:
                time.sleep(delay)
            q.task_done()

    ts = [threading.Thread(target=worker, daemon=True) for _ in range(workers)]
    [t.start() for t in ts]
    while any(t.is_alive() for t in ts):
        time.sleep(5)
        done = total - q.qsize()
        el = time.time() - t0
        rate = done / el if el > 0 else 0
        eta = (total - done) / rate if rate > 0 else 0
        print(f"  [{label}] {done}/{total}  ok={stats['ok']} skip={stats['skip']} "
              f"404={stats['miss']} err={stats['err']}  {stats['bytes']/2**20:.0f} Mio  "
              f"{rate:.1f}/s  ETA {eta/60:.0f} min", flush=True)
    [t.join() for t in ts]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", default="site")
    ap.add_argument("--drop-top", type=int, default=0, help="niveaux de zoom les plus lourds a ignorer")
    ap.add_argument("--workers", type=int, default=8)
    ap.add_argument("--delay", type=float, default=0.0)
    ap.add_argument("--assets-only", action="store_true")
    a = ap.parse_args()

    print("== session ==")
    opener.open(urllib.request.Request(ENTRY, headers=headers("document")), timeout=45).read()
    print("   cookie:", ", ".join(c.name for c in cj) or "aucun")

    print("== page d'entree ==")
    grab(a.out, "/vip-tour/index.html") or save(a.out, "/vip-tour/index.html",
                                                fetch("/vip-tour/", "document"))

    print("== parcours des fichiers texte ==")
    seen, pending = set(), ["/vip-tour/index.html"]
    seed = [f"{TDATA}/Tour.xml", f"{TDATA}/Tour_vr.xml", f"{TDATA}/Tour.js"]
    for lg in LANGS:                                        # krpano deduit Tour-<lg>.xml de Tour-<lg>.swf
        seed += [f"{TDATA}/Tour-{lg}.xml", f"{TDATA}/Tour_core-{lg}.xml",
                 f"{TDATA}/Tour_skin-{lg}.xml", f"{TDATA}/Tour_messages-{lg}.xml"]
    pending += seed
    while pending:
        p = pending.pop()
        if p in seen:
            continue
        seen.add(p)
        if not grab(a.out, p):
            continue
        if not re.search(r"\.(xml|js|css|html)$", p, re.I):
            continue
        data = open(os.path.join(a.out, p.lstrip("/")), "rb").read()
        for r in refs_in(data, os.path.dirname(p)):
            if r not in seen:
                pending.append(r)
    print(f"   {len(seen)} fichiers texte/assets parcourus")

    print("== variantes de langue du lecteur ==")
    for lg in ("en", "de", "fr", "es", "it", "ru", "zh", "ja", "cs", "sk", "pl", "ko"):
        grab(a.out, f"{TDATA}/Tour-{lg}.swf")
        grab(a.out, f"{TDATA}/Tour_messages_{lg}.xml")

    tdir = os.path.join(a.out, TDATA.lstrip("/"))
    tour_xmls = sorted(f for f in os.listdir(tdir)
                       if re.fullmatch(r"Tour(-[a-z]{2})?\.xml", f))
    print(f"   XML de tour retenus : {', '.join(tour_xmls)}")
    blobs = [open(os.path.join(tdir, f), "rb").read() for f in tour_xmls]

    print("== sons (noms nus dans les actions krpano -> sounds/) ==")
    snd = set()
    for fn in os.listdir(os.path.join(a.out, TDATA.lstrip("/"))):
        if fn.endswith(".xml"):
            txt = open(os.path.join(a.out, TDATA.lstrip("/"), fn), encoding="utf-8", errors="ignore").read()
            for m in re.finditer(r"([A-Za-z0-9_!-]+\.(?:mp3|ogg|wav|m4a|aac))", txt):
                snd.add(f"{TDATA}/sounds/{m.group(1)}")
    for pth in sorted(snd):
        grab(a.out, pth)

    print("== previews / vignettes / plan ==")
    sa = set()
    for b in blobs:
        sa |= static_assets(b)
    run_pool(a.out, sorted(sa), a.workers, a.delay, "assets")

    if a.assets_only:
        print("   (--assets-only : tuiles ignorees)")
    else:
        print("== tuiles ==")
        tset = set()
        for b in blobs:
            tset |= set(tile_paths(b, a.drop_top))
        tiles = sorted(tset)
        print(f"   {len(tiles)} tuiles a couvrir (drop-top={a.drop_top})")
        run_pool(a.out, tiles, a.workers, a.delay, "tuiles")

    print(f"\n== bilan == ok={stats['ok']} deja={stats['skip']} 404={stats['miss']} "
          f"err={stats['err']}  {stats['bytes']/2**30:.2f} Gio telecharges")


if __name__ == "__main__":
    main()
