# Builds the static snapshot used by the site from raw public data.
import json, bisect, statistics as st, math
raw = json.load(open("scripts/appstore_raw.json"))
MINC = 50          # an app needs 50+ ratings to count in a category's spread
PRIOR = 200        # Bayesian prior weight, in ratings
MIN_GENRE = 60     # smaller genres fall back to the whole store
apps = [a for a in raw["apps"] if a["rating"] and a["count"] >= MINC]
# dedupe by id
seen = {}; 
for a in apps: seen[a["id"]] = a
apps = list(seen.values())
by = {}
for a in apps: by.setdefault(a["genre"], []).append(a)
allmean = st.mean(a["rating"] for a in apps)
def adj(r, n, mu): return (n*r + PRIOR*mu) / (n + PRIOR)
genres = {}
def mk(name, lst):
    mu = st.mean(a["rating"] for a in lst)
    ad = sorted(adj(a["rating"], a["count"], mu) for a in lst)
    rs = sorted(a["rating"] for a in lst)
    q = lambda p: rs[min(len(rs)-1, int(p*len(rs)))]
    return {"name": name, "n": len(lst), "mean": round(mu,4), "median": round(st.median(rs),3),
            "p10": round(q(.1),3), "p25": round(q(.25),3), "p75": round(q(.75),3), "p90": round(q(.9),3),
            "adj": [round(x,4) for x in ad]}
genres["All apps"] = mk("All apps", apps)
for g, lst in by.items():
    if len(lst) >= MIN_GENRE: genres[g] = mk(g, lst)
def real(r, n, g):
    G = genres.get(g) if g in genres else genres["All apps"]
    a = adj(r, n, G["mean"]); arr = G["adj"]
    lo = bisect.bisect_left(arr, a); hi = bisect.bisect_right(arr, a)
    p = ((lo + hi) / 2) / len(arr)
    return round(1 + 4*p, 1), round(p*100), G["name"]
out = []
for a in apps:
    rr, pct, gname = real(a["rating"], a["count"], a["genre"])
    out.append({**a, "real": rr, "pct": pct, "cat": gname})
json.dump({"fetchedAt": raw["fetchedAt"], "prior": PRIOR, "minCount": MINC,
           "genres": genres}, open("src/data/genres.json","w"), separators=(",",":"))
# compact field for the hero: [rating, real, genreIdx, count, id, name]
gl = sorted(set(a["genre"] for a in out))
field = {"genres": gl, "apps": [[round(a["rating"],3), a["real"], gl.index(a["genre"]), a["count"], a["id"], a["name"][:40]] for a in out]}
json.dump(field, open("src/data/field.json","w"), separators=(",",":"), ensure_ascii=False)
json.dump(out, open("scripts/scored.json","w"))
rs = sorted(a["rating"] for a in out)
print("n", len(out), "median", st.median(rs), "share 4.5+", sum(r>=4.5 for r in rs)/len(rs), "share 4.0+", sum(r>=4.0 for r in rs)/len(rs), "share <3", sum(r<3 for r in rs)/len(rs))
print("raw apps total", len(raw["apps"]))
top = sorted(out, key=lambda a: -a["count"])[:80]
for a in top: print(a["id"], a["name"][:30], a["genre"], round(a["rating"],2), a["count"], "->", a["real"], a["pct"])
