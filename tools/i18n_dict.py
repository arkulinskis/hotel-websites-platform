"""Read the hotel-site dictionary (site/15-i18n.js DICT: English -> [Latvian, Russian, German, French]) from Python.

    python -I tools/i18n_dict.py            -> checks every row, prints DICT OK or the problems (check.py runs it)

parse(text) returns the rows as dicts {key, values, close} (close = the offset of the row's closing "]"), so a script
can add a column without touching the formatting. check(text) returns a list of problems: a row without exactly
len(COLUMNS) strings, an empty translation, or a translation whose {placeholders} differ from the English key's.
"""
import json
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
I18N = ROOT / "site" / "15-i18n.js"
COLUMNS = ("lv", "ru", "de", "fr")
PLACEHOLDER = re.compile(r"\{(\w+)\}")


def _string(text, i):
    """The JS string literal starting at text[i] (a quote): (value, index after it)."""
    q = text[i]
    j = i + 1
    out = []
    while j < len(text):
        c = text[j]
        if c == "\\":
            out.append(text[j:j + 2])
            j += 2
            continue
        if c == q:
            raw = "".join(out)
            if q == "'":
                raw = raw.replace('"', '\\"').replace("\\'", "'")
            return json.loads('"' + raw + '"'), j + 1
        out.append(c)
        j += 1
    raise ValueError("unterminated string at %d" % i)


def _skip(text, i):
    """Skip spaces and comments."""
    while i < len(text):
        if text[i].isspace():
            i += 1
        elif text.startswith("//", i):
            i = text.index("\n", i) + 1
        elif text.startswith("/*", i):
            i = text.index("*/", i) + 2
        else:
            break
    return i


def parse(text):
    start = text.index("var DICT = {") + len("var DICT = {")
    rows, i = [], start
    while True:
        i = _skip(text, i)
        if text[i] == "}":
            return rows
        key, i = _string(text, i)
        i = _skip(text, i)
        assert text[i] == ":", "':' expected after %r" % key
        i = _skip(text, i + 1)
        assert text[i] == "[", "'[' expected for %r" % key
        i += 1
        values = []
        while True:
            i = _skip(text, i)
            if text[i] == "]":
                break
            v, i = _string(text, i)
            values.append(v)
            i = _skip(text, i)
            if text[i] == ",":
                i += 1
        rows.append({"key": key, "values": values, "close": i})
        i = _skip(text, i + 1)
        if text[i] == ",":
            i += 1


def check(text):
    problems, seen = [], set()
    for r in parse(text):
        k, vals = r["key"], r["values"]
        if k in seen:
            problems.append("repeated row %r" % k)
        seen.add(k)
        if len(vals) != len(COLUMNS):
            problems.append("%r has %d strings, needs %d (%s)" % (k, len(vals), len(COLUMNS), ", ".join(COLUMNS)))
            continue
        want = sorted(PLACEHOLDER.findall(k))
        for lang, v in zip(COLUMNS, vals):
            if not v.strip():
                problems.append("%r: empty %s" % (k, lang))
            elif sorted(PLACEHOLDER.findall(v)) != want:
                problems.append("%r: %s placeholders %s, English has %s" % (k, lang, sorted(PLACEHOLDER.findall(v)), want))
    return problems


def main():
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    text = I18N.read_text(encoding="utf-8")
    rows = parse(text)
    problems = check(text)
    for p in problems[:40]:
        print("  " + p)
    print("DICT OK (%d rows x %d languages)" % (len(rows), len(COLUMNS)) if not problems else "%d DICT PROBLEM(S)" % len(problems))
    sys.exit(1 if problems else 0)


if __name__ == "__main__":
    main()
