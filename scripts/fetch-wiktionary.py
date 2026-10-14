"""Downloads given names from Wiktionary's name categories (CC BY-SA), for languages the US data covers
thinly: Yoruba, Igbo, Turkish, the English spellings of Arabic / Hindi / Chinese names, and so on.

Usage: python3 scripts/fetch-wiktionary.py <out.json>
Writes {"names": [[name, language, gender, meaning], ...]}. Gender is m / f / u.
Polite by design: one request at a time with a pause, and a descriptive User-Agent.
"""
import json, re, sys, time, urllib.parse, urllib.request

API = 'https://en.wiktionary.org/w/api.php'
UA = 'CradleNameBuilder/0.1 (baby name site; contact via github.com/Joudrie/babyname)'

# Only languages the US data covers thinly; Western European names are already well represented.
# Languages written in the Latin alphabet use their own categories...
NATIVE = ['Yoruba', 'Igbo', 'Hausa', 'Akan', 'Twi', 'Ewe', 'Swahili', 'Zulu', 'Xhosa', 'Somali', 'Shona', 'Turkish', 'Azerbaijani',
          'Vietnamese', 'Indonesian', 'Malay', 'Tagalog', 'Hawaiian', 'Maori', 'Finnish', 'Swedish', 'Polish', 'Czech', 'Hungarian',
          'Romanian', 'Albanian', 'Croatian', 'Lithuanian']
# ...and languages in other scripts use the English-spelling categories ("English male given names from Arabic").
FROM = ['Arabic', 'Hebrew', 'Persian', 'Hindi', 'Sanskrit', 'Urdu', 'Punjabi', 'Bengali', 'Tamil', 'Chinese', 'Mandarin', 'Japanese',
        'Korean', 'Russian', 'Greek', 'Armenian', 'Thai', 'Amharic']
# Many African names are given to boys and girls alike, so those also have unisex categories worth reading.
UNISEX = {'Yoruba', 'Igbo', 'Hausa', 'Akan', 'Twi', 'Ewe', 'Swahili', 'Zulu', 'Xhosa', 'Somali', 'Shona'}
LATIN = re.compile(r"^[A-Za-zÀ-ÖØ-öø-ÿĀ-žƀ-ɏḀ-ỿ'’\-]{2,16}$")


def get(params):
    params = {**params, 'format': 'json', 'formatversion': 2}
    for attempt in range(8):
        time.sleep(1.5)
        try:
            req = urllib.request.Request(API + '?' + urllib.parse.urlencode(params), headers={'User-Agent': UA})
            return json.load(urllib.request.urlopen(req, timeout=60))
        except Exception as e:
            print('retry', e, file=sys.stderr)
            time.sleep(20 * (attempt + 1))
    raise SystemExit(f'gave up on {params}')


def members(category):
    out, cont = [], {}
    while True:
        d = get({'action': 'query', 'list': 'categorymembers', 'cmtitle': f'Category:{category}', 'cmlimit': 500, 'cmnamespace': 0, **cont})
        out += [m['title'] for m in d.get('query', {}).get('categorymembers', [])]
        if 'continue' not in d:
            return out
        cont = {'cmcontinue': d['continue']['cmcontinue']}


def gloss(wikitext, lang):
    """The first meaning in quotes from the language's etymology, e.g. “God has done this”."""
    sec = re.split(r'\n==([^=].*?)==\n', '\n' + wikitext)
    body = ''
    for i in range(1, len(sec) - 1, 2):
        if sec[i].strip() == lang:
            body = sec[i + 1]
            break
    body = body or wikitext
    ety = body.split('Etymology', 1)[1][:1200] if 'Etymology' in body else body[:1200]
    m = re.search(r'“([^”]{3,80})”', ety) or re.search(r'\|t=([^|}]{3,80})', ety) or re.search(r"''\"([^\"]{3,80})\"''", ety)
    if not m:
        return ''
    text = re.sub(r'\[\[(?:[^|\]]*\|)?([^\]]*)\]\]', r'\1', m.group(1))
    text = re.sub(r'\{\{[^}]*\}\}', '', text).strip(' ,;')
    return text if 3 <= len(text) <= 80 else ''


def main():
    found = {}  # (name, lang) -> gender set
    jobs = [(f'{lang} {g} given names', lang) for lang in NATIVE for g in ('male', 'female') + (('unisex',) if lang in UNISEX else ())]
    jobs += [(f'English {g} given names from {lang}', lang) for lang in FROM for g in ('male', 'female')]
    for cat, lang in jobs:
        g = 'm' if ' male ' in f' {cat} ' else 'f' if 'female' in cat else 'u'
        titles = [t for t in members(cat) if LATIN.match(t)]
        for t in titles:
            found.setdefault((t, lang), set()).add(g)
        print(f'{cat}: {len(titles)}', file=sys.stderr)

    # Meanings: fetch page text in batches of 50 and read the etymology gloss.
    by_title = {}
    for (t, lang) in found:
        by_title.setdefault(t, []).append(lang)
    titles = sorted(by_title)
    meanings = {}
    for k in range(0, len(titles), 50):
        batch = titles[k:k + 50]
        d = get({'action': 'query', 'prop': 'revisions', 'rvprop': 'content', 'rvslots': 'main', 'titles': '|'.join(batch)})
        for p in d.get('query', {}).get('pages', []):
            text = (p.get('revisions') or [{}])[0].get('slots', {}).get('main', {}).get('content', '')
            for lang in by_title.get(p['title'], []):
                gl = gloss(text, lang if lang not in FROM or lang in NATIVE else 'English')
                if gl:
                    meanings[(p['title'], lang)] = gl
        if k % 1000 == 0:
            print(f'meanings {k}/{len(titles)}', file=sys.stderr)

    rows = []
    for (t, lang), gs in found.items():
        g = 'u' if len(gs) > 1 or 'u' in gs else next(iter(gs))
        rows.append([t, lang, g, meanings.get((t, lang), '')])
    json.dump({'names': rows}, open(sys.argv[1], 'w'), ensure_ascii=False)
    print(f'{len(rows)} name/language pairs, {sum(1 for r in rows if r[3])} with meanings', file=sys.stderr)


if __name__ == '__main__':
    main()
