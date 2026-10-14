"""Writes one small static page per name (plus A-Z index pages, a sitemap and robots.txt) into the built
site, so search engines can find names like "Henry meaning" and send people into the app.

Usage: python3 scripts/build-pages.py <dist dir>     (run after `vite build`; deploy.sh does this)
Env:   SITE_URL  public address of the site, default https://joudrie.github.io/babyname
"""
import collections, html, json, os, re, sys, unicodedata

DIST = sys.argv[1]
DATA = os.path.join(os.path.dirname(__file__), '..', 'public', 'data')
SITE = os.environ.get('SITE_URL', 'https://joudrie.github.io/babyname').rstrip('/')
APP_NAME = 'Cradle'

ORIGIN_LABEL = {
    'english': 'English', 'irish': 'Irish', 'scottish': 'Scottish', 'welsh': 'Welsh & Celtic', 'french': 'French', 'german': 'German',
    'dutch': 'Dutch & Flemish', 'spanish': 'Spanish & Latin American', 'portuguese': 'Portuguese & Brazilian', 'italian': 'Italian',
    'latin': 'Latin', 'greek': 'Greek', 'nordic': 'Nordic', 'russian': 'Russian & Ukrainian', 'polish': 'Polish', 'czech': 'Czech & Slovak',
    'balkan': 'Balkan & Romanian', 'slavic': 'Slavic', 'hungarian': 'Hungarian', 'baltic': 'Baltic', 'hebrew': 'Hebrew', 'arabic': 'Arabic',
    'persian': 'Persian', 'turkish': 'Turkish & Central Asian', 'armenian': 'Armenian & Georgian', 'indian': 'Indian & South Asian',
    'chinese': 'Chinese', 'japanese': 'Japanese', 'korean': 'Korean', 'vietnamese': 'Vietnamese', 'filipino': 'Filipino',
    'seasian': 'Southeast Asian', 'westafrican': 'West African (Nigerian, Ghanaian)', 'eastafrican': 'East African', 'southafrican': 'Southern African',
    'african': 'African', 'american': 'Modern American', 'native': 'Native American', 'polynesian': 'Hawaiian & Polynesian',
    'fiction': 'Books, film & TV', 'myth': 'Mythology', 'biblical': 'Biblical',
}
COUNTRY_LABEL = {'uk': 'England & Wales', 'sc': 'Scotland', 'ie': 'Ireland', 'fr': 'France', 'es': 'Spain', 'no': 'Norway'}
GENDER = {'m': 'boy', 'f': 'girl', 'u': 'unisex'}

CSS = """*{box-sizing:border-box}body{margin:0;font-family:Nunito,system-ui,sans-serif;color:#33403a;background:#e4f1e1;-webkit-font-smoothing:antialiased}
a{color:#3f8a5b}main{max-width:640px;margin:0 auto;padding:20px 16px 48px}header{display:flex;justify-content:space-between;align-items:center;margin-bottom:16px}
header a{text-decoration:none;font-weight:800;color:#33403a;font-family:Fredoka,Nunito,sans-serif;font-size:22px}
.card{background:#fff;border-radius:24px;padding:24px;box-shadow:0 10px 30px rgba(55,85,65,.12)}
h1{font-family:Fredoka,Nunito,sans-serif;font-weight:600;font-size:44px;margin:0;line-height:1.05}
.sub{color:#7f8c85;font-weight:700;margin:6px 0 14px}.meaning{font-size:19px;font-weight:700;line-height:1.4;margin:0 0 14px}
h2{font-size:13px;letter-spacing:.06em;text-transform:uppercase;color:#7f8c85;margin:22px 0 8px}
.tags{display:flex;flex-wrap:wrap;gap:6px;margin:0;padding:0;list-style:none}.tags li,.tags a{background:#f1f4f2;border-radius:999px;padding:5px 12px;font-weight:700;font-size:14px;text-decoration:none;color:#33403a}
.m h1{color:#284860}.f h1{color:#6a2e44}.u h1{color:#47396c}svg{width:100%;height:60px;display:block}.cap{display:flex;justify-content:space-between;font-size:12px;color:#7f8c85;font-weight:700}
.cta{display:block;text-align:center;margin:24px 0 0;padding:15px;border-radius:999px;background:#4fa06c;color:#fff;font-weight:800;text-decoration:none;font-size:17px}
.letters{display:flex;flex-wrap:wrap;gap:6px;margin:12px 0}.letters a{width:38px;height:38px;display:grid;place-items:center;background:#fff;border-radius:10px;font-weight:800;text-decoration:none;color:#33403a}
.list{columns:2;column-gap:16px;padding:0;list-style:none;margin:0}.list li{padding:4px 0;break-inside:avoid}footer{margin-top:28px;font-size:13px;color:#7f8c85}"""

FONT = '<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Fredoka:wght@600&family=Nunito:wght@600;700;800&display=swap" rel="stylesheet">'


def slug(name):
    s = ''.join(c for c in unicodedata.normalize('NFD', name.lower()) if unicodedata.category(c) != 'Mn')
    return re.sub(r'[^a-z0-9]+', '-', s).strip('-')


def esc(s):
    return html.escape(str(s), quote=True)


def page(title, desc, path, body, depth):
    up = '../' * depth
    return f"""<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>{esc(title)}</title><meta name="description" content="{esc(desc)}"><link rel="canonical" href="{SITE}/{path}">
<meta property="og:title" content="{esc(title)}"><meta property="og:description" content="{esc(desc)}"><meta property="og:type" content="website">
<link rel="icon" href="{up}icon.svg" type="image/svg+xml">{FONT}<link rel="stylesheet" href="{up}name.css"></head>
<body><main><header><a href="{up}">{APP_NAME}</a><a href="{up}names/" style="font-size:15px">All names</a></header>{body}
<footer>Popularity from official statistics (US Social Security Administration and others). Meanings and origins are a guide, not gospel.
<a href="{up}#privacy">Privacy</a> · <a href="{up}#terms">Terms</a></footer></main></body></html>"""


def sparkline(series, decades):
    mx = max(series) if series else 0
    if mx <= 0:
        return ''
    w, h, pad = 300, 60, 4
    step = (w - 2 * pad) / (len(series) - 1)
    pts = [(pad + i * step, h - 4 - v / mx * (h - 10)) for i, v in enumerate(series)]
    line = ' '.join(f'{"M" if i == 0 else "L"}{x:.1f},{y:.1f}' for i, (x, y) in enumerate(pts))
    peak = series.index(mx)
    return (f'<svg viewBox="0 0 {w} {h}" preserveAspectRatio="none" aria-hidden="true"><path d="{line} L{w - pad},{h} L{pad},{h}Z" fill="#4fa06c" opacity=".14"/>'
            f'<path d="{line}" fill="none" stroke="#4fa06c" stroke-width="2" vector-effect="non-scaling-stroke"/></svg>'
            f'<div class="cap"><span>{decades[0]}</span><span>Peaked in the {decades[peak]}s</span><span>Today</span></div>'), decades[peak]


def main():
    core = json.load(open(os.path.join(DATA, 'names.json')))
    origins_list, decades = core['origins'], core['decades']
    rows = [r.split('|') for r in core['names']]
    names = [r[0] for r in rows]
    have = {slug(n): n for n in names}
    details = {}
    for f in os.listdir(os.path.join(DATA, 'details')):
        details.update(json.load(open(os.path.join(DATA, 'details', f))))
    fiction = json.load(open(os.path.join(DATA, 'fiction.json')))
    in_country = collections.defaultdict(list)
    for k, idx in core.get('countries', {}).items():
        for rank, i in enumerate(idx):
            in_country[i].append((k, rank + 1))

    def link_list(items):
        out = []
        for n in items:
            s = slug(n)
            out.append(f'<li><a href="../{s}/">{esc(n)}</a></li>' if s in have else f'<li>{esc(n)}</li>')
        return '<ul class="tags">' + ''.join(out) + '</ul>'

    urls = []
    written = 0
    for i, (name, g, o, *_rest) in enumerate(rows):
        s = slug(name)
        if not s or have.get(s) != name:
            continue
        d = details.get(name)
        meaning, pron, series, variants, nicks, short_for = (d + [[], []])[:6] if d else ('', '', [], [], [], [])
        origins = [ORIGIN_LABEL.get(origins_list[int(x)], '') for x in o.split('.') if x] if o else []
        origins = [x for x in origins if x]
        gender = GENDER.get(g, 'unisex')
        bits = []
        bits.append(f'<div class="card {g}"><h1>{esc(name)}</h1><p class="sub">{gender.capitalize()} name{" · " + esc(pron) if pron else ""}</p>')
        if meaning:
            bits.append(f'<p class="meaning">{esc(meaning)}</p>')
        if nicks:
            bits.append('<h2>Nicknames</h2>' + link_list(nicks))
        elif short_for and len(name) <= 6:
            bits.append('<h2>Short for</h2>' + link_list(short_for))
        if name in fiction:
            bits.append(f'<h2>From</h2><p>{esc(fiction[name])}</p>')
        if origins:
            bits.append('<h2>Origin</h2><ul class="tags">' + ''.join(f'<li>{esc(x)}</li>' for x in origins) + '</ul>')
        peak = None
        if series and max(series) > 0:
            svg, peak = sparkline(series, decades)
            bits.append('<h2>Popularity in the US since 1880</h2>' + svg)
        if in_country.get(i):
            bits.append('<h2>Popular elsewhere</h2><ul class="tags">' + ''.join(
                f'<li>{esc(COUNTRY_LABEL[k])}</li>' for k, _ in in_country[i] if k in COUNTRY_LABEL) + '</ul>')
        if variants:
            bits.append('<h2>Other versions</h2>' + link_list(variants[:24]))
        bits.append(f'<a class="cta" href="../../">Swipe through names like {esc(name)}</a></div>')

        desc_parts = [f'{name} is a {gender} name']
        if origins:
            desc_parts.append(f' of {origins[0]} origin')
        desc = ''.join(desc_parts) + '.'
        if meaning:
            desc += f' Meaning: {meaning.rstrip(".")}.'
        if nicks:
            desc += f' Nicknames: {", ".join(nicks[:4])}.'
        if peak:
            desc += f' Most popular in the US in the {peak}s.'
        title = f'{name}: name meaning, origin{", nicknames" if nicks else ""} & popularity | {APP_NAME}'
        out = os.path.join(DIST, 'name', s)
        os.makedirs(out, exist_ok=True)
        with open(os.path.join(out, 'index.html'), 'w') as fh:
            fh.write(page(title, desc[:300], f'name/{s}/', ''.join(bits), 2))
        urls.append(f'name/{s}/')
        written += 1

    # A-Z index: one page per letter, most-given names first so the familiar ones lead.
    by_letter = collections.defaultdict(list)
    for name in names:
        s = slug(name)
        if s and have.get(s) == name:
            by_letter[s[0] if s[0].isalpha() else '0'].append(name)
    letters = sorted(k for k in by_letter if k.isalpha())
    nav = '<div class="letters">' + ''.join(f'<a href="{{up}}names/{k}/">{k.upper()}</a>' for k in letters) + '</div>'
    os.makedirs(os.path.join(DIST, 'names'), exist_ok=True)
    with open(os.path.join(DIST, 'names', 'index.html'), 'w') as fh:
        fh.write(page(f'Baby names A to Z | {APP_NAME}', f'Browse {written:,} baby names with meanings, origins, nicknames and popularity.', 'names/',
                      f'<div class="card"><h1>Baby names A–Z</h1><p class="sub">{written:,} names with meanings, origins, nicknames and popularity.</p>{nav.replace("{up}", "../")}</div>', 1))
    urls.append('names/')
    for k in letters:
        os.makedirs(os.path.join(DIST, 'names', k), exist_ok=True)
        items = ''.join(f'<li><a href="../../name/{slug(n)}/">{esc(n)}</a></li>' for n in by_letter[k])
        with open(os.path.join(DIST, 'names', k, 'index.html'), 'w') as fh:
            fh.write(page(f'Baby names starting with {k.upper()} | {APP_NAME}', f'{len(by_letter[k]):,} baby names starting with {k.upper()}, with meanings and origins.',
                          f'names/{k}/', f'<div class="card"><h1>Names starting with {k.upper()}</h1>{nav.replace("{up}", "../../")}<ul class="list">{items}</ul></div>', 2))
        urls.append(f'names/{k}/')

    with open(os.path.join(DIST, 'name.css'), 'w') as fh:
        fh.write(CSS)
    with open(os.path.join(DIST, 'sitemap.xml'), 'w') as fh:
        fh.write('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n')
        fh.write(f'<url><loc>{SITE}/</loc></url>\n')
        for u in urls:
            fh.write(f'<url><loc>{SITE}/{u}</loc></url>\n')
        fh.write('</urlset>\n')
    with open(os.path.join(DIST, 'robots.txt'), 'w') as fh:
        fh.write(f'User-agent: *\nAllow: /\nSitemap: {SITE}/sitemap.xml\n')
    print(f'{written} name pages, {len(letters)} letter pages, sitemap with {len(urls) + 1} URLs')


if __name__ == '__main__':
    main()
