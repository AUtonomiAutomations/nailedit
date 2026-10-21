"""Build src/data/il-places.json from data.gov.il (CBS localities + streets).
Run: python3 scripts/build-places.py   (re-run when the CBS lists update, ~yearly)"""
import json, re, subprocess, os
STREETS = 'a7296d1a-f8c9-4b70-96c2-6ebb4352f8e3'
OUT = os.path.join(os.path.dirname(__file__), '..', 'src', 'data', 'il-places.json')

def fetch_all(rid):
    rows, off = [], 0
    while True:
        url = f'https://data.gov.il/api/3/action/datastore_search?resource_id={rid}&limit=32000&offset={off}'
        j = json.loads(subprocess.check_output(['curl', '-s', '-m', '120', '-A', 'Mozilla/5.0', url]))
        recs = j['result']['records']; rows += recs; off += len(recs)
        if not recs or off >= j['result'].get('total', 0): return rows

clean = lambda s: re.sub(r'\s+', ' ', str(s or '')).strip()
# CBS writes some names with reversed parentheses, e.g. "(שבט) אבו ג'ווייעד" variants – keep as is, just trim
cities, streets = {}, {}
for r in fetch_all(STREETS):
    code = int(r['סמל_ישוב']); city = clean(r['שם_ישוב']); st = clean(r['שם_רחוב'])
    cities[code] = city
    if st and st != city: streets.setdefault(code, set()).add(st)

data = {'cities': sorted([[c, n] for c, n in cities.items()], key=lambda x: x[1]),
        'streets': {str(c): sorted(s) for c, s in streets.items()}}
json.dump(data, open(OUT, 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
print(len(data['cities']), 'cities,', sum(len(v) for v in data['streets'].values()), 'streets →', os.path.getsize(OUT) // 1024, 'KB')
