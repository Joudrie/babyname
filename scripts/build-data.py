"""Builds the app's name data files in public/data/ from free sources.

Sources (not committed, they're large):
  - US Social Security baby names 1880-2024 plus per-name origin/meaning details, from the
    MIT-licensed `usbabynames` npm package (sqlite/us-name-data.sqlite, sqlite/us-name-details.sqlite).
  - Name variants (Stephen / Steven / Esteban / Stefano…) are read out of the details' notes.

  - Optional: other countries' official name statistics in <intl dir> (see load_intl below):
    England & Wales (ONS), Ireland (CSO), France (INSEE), Spain (INE), Norway (SSB).

Usage: python3 scripts/build-data.py <dir with the two .sqlite files> [intl dir]
"""
import json, math, re, sqlite3, sys, collections, os
sys.path.insert(0, os.path.dirname(__file__))
from fiction import FICTION

SRC = sys.argv[1]
INTL = sys.argv[2] if len(sys.argv) > 2 else None
OUT = os.path.join(os.path.dirname(__file__), '..', 'public', 'data')
MIN_BIRTHS = 500          # all-time US births needed to be included
DECADES = list(range(1880, 2030, 10))
RECENT = (2015, 2024)     # "popular now" window
TREND_FROM, TREND_TO = (2010, 2014), (2020, 2024)

# Order matters: the first rule whose keyword appears in a source tag wins for that tag.
ORIGIN_RULES = [
    ('american', ['african american', 'african-american']),
    ('native', ['native american', 'cherokee', 'navajo', 'sioux', 'lakota', 'apache', 'algonquin', 'ojibwe', 'indigenous', 'inuit']),
    ('spanish', ['latin america', 'spain', 'spanish', 'mexic', 'cuba', 'argentin', 'colombia', 'puerto ric', 'chile', 'peru', 'venezuel', 'hispanic', 'catalan', 'basque', 'castil', 'dominican', 'guatemal', 'ecuador', 'bolivia', 'hondur', 'salvador', 'nicaragu', 'urugu', 'paragu', 'costa rica', 'panama']),
    ('scottish', ['scot']),
    ('irish', ['ireland', 'irish', 'gaelic']),
    ('welsh', ['wales', 'welsh', 'cornish', 'breton', 'celtic']),
    ('english', ['english', 'england', 'united kingdom', 'britain', 'british', 'anglo', 'old norse-english']),
    ('french', ['france', 'french']),
    ('german', ['german', 'austria', 'switzerland', 'swiss', 'prussia']),
    ('dutch', ['netherlands', 'dutch', 'belgi', 'flemish', 'frisian']),
    ('portuguese', ['portug', 'brazil', 'cape verde']),
    ('italian', ['ital', 'sicil', 'sardin']),
    ('latin', ['latin', 'roman']),
    ('greek', ['greek', 'greece', 'cyprus']),
    ('hebrew', ['hebrew', 'israel', 'jewish', 'yiddish', 'biblical', 'aramaic']),
    ('nordic', ['swed', 'norw', 'denmark', 'danish', 'scandinavia', 'iceland', 'norse', 'finland', 'finnish', 'nordic', 'faroe', 'sami']),
    ('russian', ['russia', 'ukrain', 'belarus']),
    ('polish', ['poland', 'polish']),
    ('czech', ['czech', 'slovak', 'bohemia']),
    ('balkan', ['serbia', 'croatia', 'bulgaria', 'sloven', 'bosnia', 'macedonia', 'montenegr', 'yugoslav', 'albania', 'romania', 'moldova', 'balkan']),
    ('slavic', ['slavic', 'slav', 'eastern europe']),
    ('hungarian', ['hungar', 'magyar']),
    ('baltic', ['lithuan', 'latvia', 'eston']),
    ('armenian', ['armenia', 'georgian']),
    ('turkish', ['turk', 'azerbaij', 'kazakh', 'uzbek', 'kyrgyz', 'turkmen', 'mongol']),
    ('persian', ['persia', 'iran', 'farsi', 'afghan', 'tajik', 'kurd', 'pashto']),
    ('arabic', ['arab', 'egypt', 'saudi', 'north africa', 'morocc', 'algeria', 'tunisia', 'leban', 'syria', 'jordan', 'iraq', 'yemen', 'oman', 'emirat', 'qatar', 'kuwait', 'libya', 'sudan', 'palestin', 'middle east', 'islam', 'muslim', 'quran', 'bahrain']),
    ('indian', ['india', 'sanskrit', 'hindi', 'hindu', 'nepal', 'tamil', 'telugu', 'bengal', 'punjab', 'gujarat', 'marathi', 'kannada', 'malayalam', 'sri lanka', 'south asia', 'urdu', 'pakistan', 'bangladesh', 'sikh', 'bhutan']),
    ('chinese', ['china', 'chinese', 'taiwan', 'mandarin', 'cantonese', 'hong kong']),
    ('japanese', ['japan']),
    ('korean', ['korea']),
    ('vietnamese', ['vietnam']),
    ('filipino', ['philippin', 'filipino', 'tagalog']),
    ('seasian', ['thai', 'indonesia', 'malay', 'cambodia', 'khmer', 'laos', 'lao ', 'burm', 'myanmar', 'hmong', 'singapore', 'javanese']),
    ('westafrican', ['nigeria', 'yoruba', 'igbo', 'hausa', 'ghana', 'akan', 'twi', 'senegal', 'west africa', 'ivory', 'cameroon', 'sierra leone', 'liberia', 'mali', 'benin', 'togo', 'gambia', 'ewe', 'wolof', 'fula']),
    ('eastafrican', ['kenya', 'tanzania', 'swahili', 'uganda', 'rwanda', 'ethiopia', 'amharic', 'eritrea', 'somali', 'east africa', 'burundi', 'oromo', 'tigrinya']),
    ('southafrican', ['south africa', 'zulu', 'xhosa', 'zimbabwe', 'botswana', 'sotho', 'shona', 'namibia', 'zambia', 'malawi', 'mozambique', 'angola', 'congo', 'afrikaans', 'tswana']),
    ('african', ['africa']),
    ('polynesian', ['hawai', 'polynes', 'maori', 'samoa', 'tonga', 'fiji', 'tahiti']),
    ('fiction', ['fiction', 'literature', 'novel', 'fantasy']),
    ('american', ['united states', 'usa', 'u.s.', 'american', 'canada', 'english-speaking', 'australia', 'new zealand', 'america']),
]
ORIGINS = []
for key, _ in ORIGIN_RULES:
    if key not in ORIGINS:
        ORIGINS.append(key)
ORIGINS += ['biblical', 'myth']
OIDX = {k: i for i, k in enumerate(ORIGINS)}


def origin_of(tag):
    t = tag.lower()
    for key, words in ORIGIN_RULES:
        if any(w in t for w in words):
            return key
    return None


def origins_from(detail):
    tags = [t for t in (detail.get('country') or []) if isinstance(t, str)]
    for m in detail.get('meaning') or []:
        if isinstance(m, dict):
            tags += [k for k in m if k not in ('language', 'meaning')]
            if isinstance(m.get('language'), str):
                tags.append(m['language'])
    found = []
    for t in tags:
        o = origin_of(t)
        if o and o not in found:
            found.append(o)
    # "United States" is on almost every record; it only means "modern American" when nothing else is known.
    specific = [o for o in found if o != 'american']
    out = specific or found
    notes = (detail.get('notes') or '').lower()
    if re.search(r'\bbibl|\bold testament|\bnew testament|\bapostle|\bprophet', notes):
        out.append('biblical')
    if re.search(r'mytholog|\bgoddess|\bdeity|\blegend(ary)? (hero|king|warrior)', notes):
        out.append('myth')
    return out


def meaning_of(detail):
    parts = []
    for m in detail.get('meaning') or []:
        if isinstance(m, str):
            parts.append(m)
        elif isinstance(m, dict):
            if 'meaning' in m and isinstance(m['meaning'], str):
                parts.append(f"{m['language']}: {m['meaning']}" if isinstance(m.get('language'), str) else m['meaning'])
            else:
                parts += [f'{k}: {v}' for k, v in m.items() if isinstance(v, str)]
    text = parts[0] if parts else ''
    if len(text) > 140:
        text = text[:137].rsplit(' ', 1)[0] + '…'
    return text


def main():
    data = sqlite3.connect(os.path.join(SRC, 'us-name-data.sqlite'))
    births = collections.defaultdict(lambda: {'M': 0, 'F': 0})
    by_decade = collections.defaultdict(lambda: [0] * len(DECADES))
    recent = collections.Counter()
    trend_a, trend_b = collections.Counter(), collections.Counter()
    year_tops = collections.defaultdict(dict)
    decade_totals = collections.defaultdict(lambda: collections.Counter())
    for name, sex, n, rank, year in data.execute('select name, sex, births, rank, year from usNameData'):
        births[name][sex] += n
        d = (year - 1880) // 10
        by_decade[name][d] += n
        decade_totals[d][name] += n
        if RECENT[0] <= year <= RECENT[1]:
            recent[(name, sex)] += n
        if TREND_FROM[0] <= year <= TREND_FROM[1]:
            trend_a[name] += n
        if TREND_TO[0] <= year <= TREND_TO[1]:
            trend_b[name] += n
        if rank <= 100:
            year_tops[year].setdefault(sex, []).append((rank, name))

    details = {}
    dd = sqlite3.connect(os.path.join(SRC, 'us-name-details.sqlite'))
    for name, sex, nd in dd.execute('select name, sex, nameData from usNameDetails'):
        try:
            details.setdefault(name, {})[sex] = json.loads(nd)
        except json.JSONDecodeError:
            pass

    keep = [n for n, b in births.items() if b['M'] + b['F'] >= MIN_BIRTHS]
    keep.sort(key=lambda n: -(births[n]['M'] + births[n]['F']))

    entries = []
    for name in keep:
        b = births[name]
        total = b['M'] + b['F']
        share_m = b['M'] / total
        if 0.2 <= share_m <= 0.8 and min(b['M'], b['F']) >= 1000:
            g = 'u'
        else:
            g = 'm' if share_m > 0.5 else 'f'
        det = details.get(name, {})
        d = det.get('m' if g == 'm' else 'f') or det.get('f') or det.get('m') or {}
        display = d.get('name') if isinstance(d.get('name'), str) and d['name'].lower() == name and d['name'] != name else name.capitalize()
        origins = origins_from(d) if d else []
        series = by_decade[name]
        peak = max(range(len(DECADES)), key=lambda i: series[i] / max(1, sum(decade_totals[i].values())))
        entries.append({
            'key': name, 'name': display, 'g': g, 'total': total, 'origins': origins, 'peak': peak,
            'meaning': meaning_of(d) if d else '', 'pron': d.get('pronunciation', '') if d else '',
            'series': series,
        })

    fiction_src = {}
    by_display = {e['name']: e for e in entries}
    for name, (g, source) in FICTION.items():
        fiction_src[name] = source
        e = by_display.get(name)
        if e is None:
            e = {'key': name.lower(), 'name': name, 'g': g, 'total': 0, 'origins': [], 'peak': -1, 'meaning': '', 'pron': '', 'series': [0] * len(DECADES)}
            entries.append(e)
            by_display[name] = e
        if 'fiction' not in e['origins']:
            e['origins'].append('fiction')
    # The source data's own "fictional" tag is too loose; only the curated list counts.
    for e in entries:
        if e['name'] not in fiction_src and 'fiction' in e['origins']:
            e['origins'].remove('fiction')

    countries = {}
    if INTL:
        countries = merge_intl(entries, details)

    index = {e['key']: i for i, e in enumerate(entries)}

    # Popular now: top 1000 per sex in the recent window.
    popular = []
    for sex in ('M', 'F'):
        ranked = sorted(((n, c) for (n, s), c in recent.items() if s == sex and n in index), key=lambda x: -x[1])[:1000]
        popular += [index[n] for n, _ in ranked]
    # Trending: biggest rise between the two windows, among names with real volume.
    rising = sorted((n for n in index if trend_b[n] >= 1500), key=lambda n: -(trend_b[n] / (trend_a[n] + 300)))[:300]
    trending = [index[n] for n in rising]
    # Era decks: the 300 most-given names of each decade.
    eras = [[index[n] for n, _ in decade_totals[d].most_common() if n in index][:300] for d in range(len(DECADES))]
    years = {str(y): {s.lower(): [index[n] for _, n in sorted(v) if n in index] for s, v in tops.items()} for y, tops in sorted(year_tops.items())}

    extra = []
    variants = variants_from_notes(details, entries, index)

    # Popularity score 0-9 from log births, so the client can sort and label without the raw counts.
    def pop(e):
        return min(9, int(math.log10(max(1, e['total']))))

    core_rows = []
    for e in entries + extra:
        core_rows.append('|'.join([
            e['name'], e['g'], '.'.join(str(OIDX[o]) for o in e['origins']),
            str(e.get('peak', -1)) if e.get('total') else '', str(pop(e)) if e.get('total') else '0',
        ]))
    os.makedirs(os.path.join(OUT, 'details'), exist_ok=True)
    country_decks = {k: [index[n] for n in v['names'] if n in index] for k, v in countries.items()}
    core = {'v': 1, 'origins': ORIGINS, 'decades': DECADES, 'names': core_rows,
            'popular': popular, 'trending': trending, 'eras': eras, 'countries': country_decks}
    json.dump(core, open(os.path.join(OUT, 'names.json'), 'w'), separators=(',', ':'), ensure_ascii=False)
    json.dump(years, open(os.path.join(OUT, 'years.json'), 'w'), separators=(',', ':'))
    json.dump(fiction_src, open(os.path.join(OUT, 'fiction.json'), 'w'), separators=(',', ':'), ensure_ascii=False)

    # Details are sharded by first letter and fetched only when a name is flipped or opened.
    shards = collections.defaultdict(dict)
    for e in entries:
        # Decade series as share per 100k births that decade, so eras are comparable.
        s = [round(e['series'][i] * 100000 / max(1, sum(decade_totals[i].values()))) for i in range(len(DECADES))]
        shards[shard_of(e['name'])][e['name']] = [e['meaning'], e['pron'], s, variants.get(e['key'], [])]
    for k, v in shards.items():
        json.dump(v, open(os.path.join(OUT, 'details', f'{k}.json'), 'w'), separators=(',', ':'), ensure_ascii=False)
    print(f'{len(entries)} names, {sum(1 for v in variants.values() if v)} with variants, {len(shards)} detail shards')
    by_origin = collections.Counter(o for e in entries + extra for o in e['origins'])
    print(sorted(by_origin.items(), key=lambda x: -x[1]))
    print('genders', collections.Counter(e['g'] for e in entries + extra))


VARIANT_WORDS = re.compile(r'\b(variant|version|form|equivalent|cognate|diminutive|spelling|counterpart|derivative|feminine of|masculine of|nickname for|short for)\b', re.I)
NOT_NAMES = {'The', 'English', 'French', 'German', 'Spanish', 'Italian', 'Greek', 'Latin', 'Hebrew', 'Irish', 'Russian', 'It',
             'In', 'Its', 'This', 'A', 'An', 'King', 'Saint', 'St', 'Christian', 'Old', 'New', 'God', 'Lord', 'American',
             'Scottish', 'Welsh', 'Dutch', 'Polish', 'Arabic', 'Rose', 'May', 'June', 'April', 'Grace', 'Hope', 'Joy',
             'Faith', 'Star', 'Sky', 'Many', 'Some', 'Both', 'Often', 'Similar', 'Middle', 'Princess', 'Queen', 'Prince'}


def variants_from_notes(details, entries, index):
    """Links names whose notes call one a variant/version/form of the other; a name's variants are its
    direct links plus their links (Mikhail -> Michael -> Miguel), most popular first."""
    adj = collections.defaultdict(set)
    for key in index:
        for d in details.get(key, {}).values():
            for sent in re.split(r'(?<=[.;])\s+', d.get('notes') or ''):
                if not VARIANT_WORDS.search(sent):
                    continue
                for m in re.finditer(r"\b[A-Z][a-z]{1,14}\b", sent):
                    tok, t = m.group(), m.group().lower()
                    # "William Shakespeare", "by Charles Dickens": a person mentioned, not a variant.
                    if re.match(r"\s+[A-Z][a-z]", sent[m.end():]) or re.search(r"\b(by|author|writer|poet|playwright|novelist)\s+$", sent[:m.start()]):
                        continue
                    if t != key and t in index and tok not in NOT_NAMES:
                        adj[key].add(t)
                        adj[t].add(key)
    total = {e['key']: e['total'] for e in entries}
    by_pop = lambda ks: sorted(ks, key=lambda k: -total.get(k, 0))
    out = {}
    for key in index:
        direct = by_pop(adj[key])
        second = by_pop({k for d in adj[key] for k in adj[d]} - set(direct) - {key})
        out[key] = [entries[index[k]]['name'] for k in (direct + second)[:24]]
    return out


def shard_of(name):
    c = name[0].lower()
    return c if 'a' <= c <= 'z' else 'other'


COUNTRY_ORIGIN = {'uk': 'english', 'ie': 'irish', 'fr': 'french', 'es': 'spanish', 'no': 'nordic'}


def fold(name):
    """Lowercase without accents, to match "Chloé" (France) with "Chloe" (US)."""
    import unicodedata
    return ''.join(c for c in unicodedata.normalize('NFD', name.lower()) if unicodedata.category(c) != 'Mn')


def title(name):
    return '-'.join(p[:1].upper() + p[1:].lower() for p in name.split('-'))


def load_intl(d):
    """Each country's most-given names in recent years as {country: [(name, sex, count)]}, most given first."""
    import csv, openpyxl, xlrd
    out = {}

    def top(counts, per_sex):
        rows = []
        for sex in ('M', 'F'):
            ranked = sorted(((n, c) for (n, s_), c in counts.items() if s_ == sex), key=lambda x: -x[1])[:per_sex]
            rows += [(n, sex, c) for n, c in ranked]
        return sorted(rows, key=lambda r: -r[2])

    # England & Wales: Table_1 girls, Table_2 boys, columns "<year> Count".
    p = os.path.join(d, 'ons.xlsx')
    if os.path.exists(p):
        wb = openpyxl.load_workbook(p, read_only=True)
        counts = collections.Counter()
        for sheet, sex in (('Table_1', 'F'), ('Table_2', 'M')):
            rows = wb[sheet].iter_rows(values_only=True)
            header = None
            for r in rows:
                if header is None:
                    if r and r[0] == 'Name':
                        header = [str(h or '') for h in r]
                        cols = [i for i, h in enumerate(header) if h.endswith('Count') and int(h[:4]) >= 2016]
                    continue
                for i in cols:
                    if isinstance(r[i], int):
                        counts[(str(r[0]).strip(), sex)] += r[i]
        out['uk'] = top(counts, 500)

    # Ireland: CSO VSA50 (boys) / VSA60 (girls), the "Number" statistic.
    counts = collections.Counter()
    for f, sex in (('VSA50.csv', 'M'), ('VSA60.csv', 'F')):
        p = os.path.join(d, f)
        if not os.path.exists(p):
            continue
        with open(p, encoding='utf-8-sig') as fh:
            for r in csv.reader(fh):
                if len(r) < 8 or 'Rank' in r[1] or not r[2].isdigit() or int(r[2]) < 2015 or not r[7]:
                    continue
                counts[(r[5].strip(), sex)] += int(float(r[7]))
    if counts:
        out['ie'] = top(counts, 300)

    # France: INSEE nat2021.csv, sexe 1 = boy, 2 = girl.
    p = os.path.join(d, 'nat2021.csv')
    if os.path.exists(p):
        counts = collections.Counter()
        with open(p, encoding='utf-8') as fh:
            for r in csv.reader(fh, delimiter=';'):
                if len(r) < 4 or not r[2].isdigit() or int(r[2]) < 2012 or r[1].startswith('_') or len(r[1]) < 2:
                    continue
                counts[(title(r[1]), 'M' if r[0] == '1' else 'F')] += int(r[3])
        out['fr'] = top(counts, 500)

    # Spain: INE top 50 per decade of birth; newer decades first.
    p = os.path.join(d, 'ine_fecha.xls')
    if os.path.exists(p):
        b = xlrd.open_workbook(p)
        rows = []
        seen = set()
        for sheet, sex in (('ESPAÑA_hombres', 'M'), ('ESPAÑA_mujeres', 'F')):
            sh = b.sheet_by_name(sheet)
            # Columns repeat per decade as NOMBRE, FRECUENCIA, Por 1.000 starting at column 1.
            for col in range(1 + 3 * ((sh.ncols - 2) // 3), 0, -3):
                for r in range(5, sh.nrows):
                    name, freq = sh.cell_value(r, col), sh.cell_value(r, col + 1)
                    if isinstance(name, str) and name.strip() and isinstance(freq, float):
                        key = (title(name.strip()), sex)
                        if key not in seen:
                            seen.add(key)
                            rows.append((key[0], sex, -len(rows)))
        out['es'] = sorted(rows, key=lambda r: -r[2])

    # Norway: SSB table 10467 as json-stat2; name codes start with 1 (girls) or 2 (boys).
    p = os.path.join(d, 'ssb.json')
    if os.path.exists(p):
        j = json.load(open(p))
        cat = j['dimension']['Fornavn']['category']
        nyears = j['size'][2]
        counts = collections.Counter()
        for code, pos in cat['index'].items():
            total = sum(v or 0 for v in j['value'][pos * nyears:(pos + 1) * nyears])
            if total:
                counts[(cat['label'][code], 'F' if code.startswith('1') else 'M')] += total
        out['no'] = top(counts, 300)
    return out


def merge_intl(entries, details):
    """Adds country decks, creating entries for names the US data doesn't have (with details when known)."""
    by_fold = {}
    for e in entries:
        by_fold.setdefault(fold(e['name']), e)
    decks = {}
    for country, rows in load_intl(INTL).items():
        names = []
        sexes = collections.defaultdict(set)
        for name, sex, _ in rows:
            sexes[fold(name)].add(sex)
        for name, sex, _ in rows:
            f = fold(name)
            e = by_fold.get(f)
            if e is None:
                g = 'u' if len(sexes[f]) > 1 else ('m' if sex == 'M' else 'f')
                det = details.get(f) or details.get(name.lower()) or {}
                d = det.get(g if g != 'u' else 'f') or det.get('m') or det.get('f') or {}
                origins = [o for o in origins_from(d) if o != 'american'] if d else []
                e = {'key': f, 'name': name, 'g': g, 'total': 0, 'origins': origins or [COUNTRY_ORIGIN[country]], 'peak': -1,
                     'meaning': meaning_of(d) if d else '', 'pron': d.get('pronunciation', '') if d else '', 'series': [0] * len(DECADES)}
                entries.append(e)
                by_fold[f] = e
            if e['key'] not in names:
                names.append(e['key'])
        decks[country] = {'names': names}
        print(country, len(names), 'names')
    return decks


if __name__ == '__main__':
    main()
