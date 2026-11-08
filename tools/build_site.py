"""The hotel-website renderer: site/*.js -> theme/assets/ns-site.js, site/*.css -> theme/assets/ns-site.css (joined by
file name), and server_code/site_version.py (SITE_V, the cache-busting version the hosted pages link with).

    python -I tools/build_site.py           write them
    python -I tools/build_site.py --check   exit 1 if they are out of date (tools/check.py runs this)

ns-site.js/.css are what every hosted hotel site (<api>/s/<slug>), the editor's preview and the exports load.
Edit site/*, never the joined files.
"""
import hashlib
import pathlib
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
LF = chr(10)


def joined(ext):
    return LF.join(f.read_text(encoding="utf-8") for f in sorted((ROOT / "site").glob("*." + ext)))


def outputs():
    js, css = joined("js"), joined("css")
    v = hashlib.sha1((js + css).encode("utf-8")).hexdigest()[:10]
    ver = '"""Written by tools/build_site.py: the version of site/*.js + *.css (hosted pages link ns-site.* with it)."""' + LF + 'SITE_V = "%s"' % v + LF
    return {ROOT / "theme" / "assets" / "ns-site.js": js, ROOT / "theme" / "assets" / "ns-site.css": css,
            ROOT / "server_code" / "site_version.py": ver}


def main():
    stale = [p for p, text in outputs().items() if not p.exists() or p.read_text(encoding="utf-8") != text]
    if "--check" in sys.argv:
        if stale:
            print("out of date: " + ", ".join(p.name for p in stale) + " (run python -I tools/build_site.py)")
            sys.exit(1)
        print("site renderer up to date")
        return
    for p in stale:
        p.write_text(outputs()[p], encoding="utf-8", newline=LF)
    print("wrote " + (", ".join(p.name for p in stale) or "nothing (up to date)"))


if __name__ == "__main__":
    main()
