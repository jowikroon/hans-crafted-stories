#!/usr/bin/env python3
"""
publication_guard.py -- blokkeert publicatie van tekst die een denylist raakt.

De guard zelf bevat geen patronen. Die komen uit een regelbestand (--rules PAD) of uit de
omgevingsvariabele PUBLICATION_DENYLIST_B64 (base64 van hetzelfde regelbestand), zodat de
lijst niet in een publieke repo hoeft te staan.

  publication_guard.py [--rules F] scan PAD...     bestanden/mappen (git-tracked als het een repo is)
  publication_guard.py [--rules F] urls URL...     live pagina's; sitemap.xml wordt uitgevouwen
  publication_guard.py [--rules F] selftest        hit/pass-gevallen uit het regelbestand
  publication_guard.py [--rules F] classifier-yaml tekstregels als YAML voor een classifier
Exit: 0 schoon, 1 treffer, 2 geen regels of onleesbaar (dat is NOOIT 'schoon').
Uitzondering op een regel: zet 'publication-guard: toegestaan <reden>' op dezelfde regel.
"""
import base64, os, re, subprocess, sys, urllib.request

ALLOW = "publication-guard: toegestaan"
TEXT_EXT = {".md",".mdx",".txt",".ts",".tsx",".js",".jsx",".mjs",".cjs",".json",".html",".htm",".yml",".yaml",".xml",".css",".csv",".py",".ps1",".sql",".toml",".svg"}
SKIP = {"node_modules",".git","dist","build",".next",".vercel","coverage"}

def load(path):
    if path:
        raw = open(path, encoding="utf-8").read()
    elif os.environ.get("PUBLICATION_DENYLIST_B64"):
        raw = base64.b64decode(os.environ["PUBLICATION_DENYLIST_B64"]).decode("utf-8")
    else:
        return None
    rules = {"text": [], "path": [], "hit": [], "pass": []}
    for line in raw.splitlines():
        if not line.strip() or line.startswith("#"): continue
        kind, name, value = line.split("\t", 2)
        rules[kind].append((name, re.compile(value, re.I) if kind in ("text", "path") else value))
    return rules

def check_text(rules, text, label):
    out = []
    for i, line in enumerate(text.splitlines(), 1):
        if ALLOW in line: continue
        for name, rx in rules["text"]:
            m = rx.search(line)
            if m: out.append((label, i, name, line[max(0, m.start()-40):m.end()+40].strip()))
    return out

def files(root):
    if os.path.isfile(root): return [root]
    try:
        ls = subprocess.run(["git", "-C", root, "ls-files"], capture_output=True, text=True, check=True).stdout.splitlines()
        return [os.path.join(root, f) for f in ls]
    except Exception:
        acc = []
        for d, ds, fs in os.walk(root):
            ds[:] = [x for x in ds if x not in SKIP]
            acc += [os.path.join(d, f) for f in fs]
        return acc

def scan(rules, roots, ignore):
    hits, bad = [], 0
    for root in roots:
        if not os.path.exists(root): print(f"ONLEESBAAR {root}", file=sys.stderr); bad += 1; continue
        for f in files(root):
            rel = os.path.relpath(f, root) if os.path.isdir(root) else f
            if any(rel.endswith(x) for x in ignore): continue
            hits += [(rel, 0, n, "pad") for n, rx in rules["path"] if rx.search(rel)]
            if os.path.splitext(f)[1].lower() not in TEXT_EXT: continue
            try: hits += check_text(rules, open(f, encoding="utf-8", errors="replace").read(), rel)
            except OSError: bad += 1
    return hits, bad

def fetch(u):
    with urllib.request.urlopen(urllib.request.Request(u, headers={"User-Agent": "publication-guard/1"}), timeout=30) as r:
        return r.read().decode("utf-8", errors="replace")

def urls(rules, targets):
    hits, bad, todo = [], 0, []
    for t in targets:
        if t.endswith(".xml"):
            try: todo += re.findall(r"<loc>\s*([^<\s]+)\s*</loc>", fetch(t))
            except Exception as e: print(f"ONLEESBAAR {t}: {e}", file=sys.stderr); bad += 1
        else: todo.append(t)
    todo = list(dict.fromkeys(todo))
    for u in todo:
        try: hits += check_text(rules, fetch(u), u)
        except Exception as e: print(f"ONLEESBAAR {u}: {e}", file=sys.stderr); bad += 1
    return hits, bad, len(todo)

def report(hits, bad, what):
    for label, line, name, ctx in hits: print(f"TREFFER [{name}] {label}:{line}  ...{ctx}...")
    print(f"--- {what}: {len(hits)} treffer(s), {bad} onleesbaar")
    if hits: return 1
    if bad: print("LET OP: onleesbaar is geen 'schoon'."); return 2
    return 0

def main(argv):
    rules_path, ignore = None, []
    while argv and argv[0].startswith("--"):
        flag = argv.pop(0)
        if flag == "--rules": rules_path = argv.pop(0)
        elif flag == "--ignore": ignore.append(argv.pop(0))
    if not argv: print(__doc__); return 2
    rules = load(rules_path)
    if rules is None:
        print("GEEN REGELS: geef --rules of zet PUBLICATION_DENYLIST_B64. Zonder regels is dit geen 'schoon'."); return 2
    cmd, args = argv[0], argv[1:]
    if cmd == "selftest":
        bad = [s for _, s in rules["hit"] if not check_text(rules, s, "t")] + [s for _, s in rules["pass"] if check_text(rules, s, "t")]
        for s in bad: print("SELFTEST FOUT:", s)
        print(f"selftest {'OK' if not bad else 'FAALT'}: {len(rules['hit'])} moeten raken, {len(rules['pass'])} moeten passeren, {len(rules['text'])} tekstregels")
        return 0 if not bad else 1
    if cmd == "classifier-yaml":
        for n, rx in rules["text"]: print(f"    - '(?i){rx.pattern.replace(chr(39), chr(39)*2)}'   # {n}")
        return 0
    if cmd == "scan": h, b = scan(rules, args, ignore); return report(h, b, f"scan {len(args)} pad(en)")
    if cmd == "urls": h, b, n = urls(rules, args); return report(h, b, f"{n} url(s)")
    print(__doc__); return 2

if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
