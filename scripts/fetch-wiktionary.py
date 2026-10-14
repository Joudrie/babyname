"""Collects given names from Wiktionary (CC BY-SA) via kaikki.org's machine-readable copies, for languages the
US data covers thinly: Yoruba, Igbo, Hausa, Turkish, plus the English spellings of Arabic / Hindi / Chinese names.
kaikki.org publishes one file of proper names per language, so this needs no Wiktionary API calls.

Usage: python3 scripts/fetch-wiktionary.py <out.json>
Writes {"names": [[name, language, gender, meaning], ...]}. Gender is m / f / u.
"""
import json, re, sys, urllib.parse, urllib.request

UA = 'CradleNameBuilder/0.1 (baby name site; contact via github.com/Joudrie/babyname)'
BASE = 'https://kaikki.org/dictionary/{lang}/pos-name/kaikki.org-dictionary-{file}-by-pos-name.jsonl'

# Languages written in the Latin alphabet: read their own name files.
NATIVE = ['Yoruba', 'Igbo', 'Hausa', 'Akan', 'Twi', 'Ewe', 'Swahili', 'Zulu', 'Xhosa', 'Somali', 'Shona', 'Turkish', 'Azerbaijani',
          'Vietnamese', 'Indonesian', 'Malay', 'Tagalog', 'Hawaiian', 'Maori', 'Finnish', 'Swedish', 'Polish', 'Czech', 'Hungarian',
          'Romanian', 'Albanian', 'Croatian', 'Lithuanian']
# Languages in other scripts: read the English file for "English male given names from Arabic" and similar.
FROM = ['Arabic', 'Hebrew', 'Persian', 'Hindi', 'Sanskrit', 'Urdu', 'Punjabi', 'Bengali', 'Tamil', 'Chinese', 'Mandarin', 'Japanese',
        'Korean', 'Russian', 'Greek', 'Armenian', 'Thai', 'Amharic', 'Yoruba', 'Igbo', 'Swahili', 'Turkish']
LATIN = re.compile(r"^[A-Za-zÀ-ÖØ-öø-ÿĀ-žƀ-ɏḀ-ỿ'’\-]{2,16}$")
GLOSS = re.compile(r'^An? (?:(male|female|unisex) )?given name from ([A-Z][a-z]+)')
CAT = re.compile(r'^(?:English )?(male|female|unisex) given names(?: from (.+))?$')


def stream(lang):
    file = lang.replace(' ', '')
    url = BASE.format(lang=urllib.parse.quote(file), file=urllib.parse.quote(file))
    req = urllib.request.Request(url, headers={'User-Agent': UA})
    try:
        with urllib.request.urlopen(req, timeout=120) as r:
            for line in r:
                yield json.loads(line)
    except Exception as e:
        print(f'{lang}: {e}', file=sys.stderr)


def meaning_of(entry):
    """The meaning from the etymology: the "literally ..." gloss if there is one, otherwise the longest quoted
    gloss of two or more words, so a part like “lord” in “olú (“lord”) + ...” isn't taken for the whole."""
    ety = entry.get('etymology_text') or ''
    lit = re.search(r'literally[,:]? [“"]([^”"]{3,80})[”"]', ety)
    if lit:
        return lit.group(1).strip(' ,;.')
    quotes = [q.strip(' ,;.') for q in re.findall(r'[“"]([^”"]{3,80})[”"]', ety)]
    quotes = [q for q in quotes if len(q.split()) >= 2]
    return max(quotes, key=len) if quotes else ''


def categories(entry):
    # Categories can sit on the entry itself or on each sense.
    for c in entry.get('categories', []):
        yield c['name'] if isinstance(c, dict) else c
    for s in entry.get('senses', []):
        for c in s.get('categories', []):
            yield c['name'] if isinstance(c, dict) else c


def main():
    found = {}

    def add(name, lang, g, meaning):
        key = (name, lang)
        gs, mean = found.get(key, (set(), ''))
        gs.add(g)
        found[key] = (gs, mean or meaning)

    for lang in NATIVE:
        n = 0
        for e in stream(lang):
            word = e.get('word', '')
            if not LATIN.match(word):
                continue
            for c in categories(e):
                if c.startswith(lang + ' '):
                    m = CAT.match(c[len(lang) + 1:])
                    if m and not m.group(2):
                        add(word, lang, {'male': 'm', 'female': 'f'}.get(m.group(1), 'u'), meaning_of(e))
                        n += 1
        print(f'{lang}: {n}', file=sys.stderr)

    wanted = set(FROM)
    n = 0
    for e in stream('English'):
        word = e.get('word', '')
        if not LATIN.match(word):
            continue
        # The source language is in the definition: "A female given name from Arabic".
        for sense in e.get('senses', []):
            for gl in sense.get('glosses', []):
                m = GLOSS.match(gl)
                if m and m.group(2) in wanted:
                    add(word, m.group(2), {'male': 'm', 'female': 'f'}.get(m.group(1) or '', 'u'), meaning_of(e))
                    n += 1
    print(f'English (from other scripts): {n}', file=sys.stderr)

    rows = [[name, lang, 'u' if len(gs) > 1 or 'u' in gs else next(iter(gs)), meaning] for (name, lang), (gs, meaning) in found.items()]
    json.dump({'names': rows}, open(sys.argv[1], 'w'), ensure_ascii=False)
    print(f'{len(rows)} name/language pairs, {sum(1 for r in rows if r[3])} with meanings', file=sys.stderr)


if __name__ == '__main__':
    main()
