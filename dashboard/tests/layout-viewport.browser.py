#!/usr/bin/env python3
"""Real-browser regression: authenticated dashboard header must not overflow or clip controls.

Usage: run `npx vite --port 5199 --strictPort` in dashboard/, then
  python3 dashboard/tests/layout-viewport.browser.py [http://localhost:5199]
All API traffic is MOCKED in-browser (mock data, not real API); only the local origin is reachable. No secrets involved.
Exit 1 on any uncaught JS pageerror, any unmocked /api call, and any failing width/route combination (page overflow from <main> content is FAIL, not WARN).
"""
import json, sys
from playwright.sync_api import sync_playwright

BASE = (sys.argv[1] if len(sys.argv) > 1 else 'http://localhost:5199').rstrip('/')
LONG = 'An Extremely Long Portfolio Name That Keeps Going And Going For Ever And Ever'
USER = {'id': 'u1', 'email': 'a@example.invalid', 'name': 'A', 'isAdmin': True, 'hasCompletedOnboarding': True}
TS = '2026-01-02T03:04:05.000Z'  # every createdAt/updatedAt must be a valid ISO date (API contract: Prisma DateTime)


def content_row(i, status='PUBLISHED', ctype='BLOG', pid='p1'):
    return {'id': 'c%d' % i, 'projectId': pid, 'type': ctype, 'contentType': ctype, 'title': LONG, 'slug': 'post-%d' % i, 'excerpt': LONG,
            'content': LONG, 'order': i, 'status': status, 'createdAt': TS, 'updatedAt': TS, 'tags': [], 'linkedSkills': [], 'meta': None}


def project_row(pid, name, published):
    return {'id': pid, 'name': name, 'description': LONG, 'ownerId': 'u1', 'subdomain': 'sub-' + pid, 'isPublished': published,
            'createdAt': TS, 'updatedAt': TS, 'owner': {'id': 'u1', 'name': 'A', 'email': 'a@example.invalid'}, 'members': [],
            'content': [content_row(1, 'PUBLISHED', 'BLOG', pid), content_row(2, 'DRAFT', 'PROJECT', pid), content_row(3, 'HIDDEN', 'EXPERIENCE', pid)],
            '_count': {'content': 3, 'members': 0, 'media': 0}}


PROJECTS = {'ownedProjects': [project_row('p1', LONG, True), project_row('p2', 'Short', False)], 'memberProjects': []}
# Every DashboardLayout child route in src/router/index.ts (param routes get mock ids).
ROUTES = ['/', '/blogs', '/projects', '/experience', '/portfolios', '/portfolios/p1', '/content/new/BLOG',
          '/portfolios/p1/content/new/BLOG', '/users', '/admin', '/admin/users', '/admin/projects',
          '/admin/content', '/admin/sso', '/admin/ai-models', '/admin/settings', '/analytics',
          '/settings', '/settings/site', '/media', '/portfolios/p1/media']
WIDTHS = [(360, 800), (390, 844), (768, 1024), (1280, 900)]
PAGE = {'page': 1, 'limit': 20, 'total': 3, 'pages': 1}
fails = []
unmocked = []
page_errors = []  # (width, route, message): any uncaught JS exception is a HARD FAIL
# Optional: ONLY_ROUTES=/media,/x narrows a debug run; the default (unset) covers every route.
import os
if os.environ.get('ONLY_ROUTES'):
    ROUTES = os.environ['ONLY_ROUTES'].split(',')


def mock(route):
    url = route.request.url
    if not url.startswith(BASE):
        return route.abort()
    path = url[len(BASE):].split('?')[0]
    if path.startswith('/api/'):
        p = path[4:]
        if p == '/auth/me':
            body = USER
        elif p == '/projects':
            body = PROJECTS
        elif p == '/admin/users':
            body = {'users': [{'id': 'u%d' % i, 'name': LONG, 'email': 'very.long.address.%d@example-long-domain.invalid' % i, 'isAdmin': i == 0,
                               'hasCompletedOnboarding': False, 'createdAt': '2026-01-02T03:04:05.000Z',
                               '_count': {'projectsOwned': 2, 'projectAccess': 1}} for i in range(3)], 'pagination': PAGE}
        elif p == '/admin/projects':
            body = {'projects': [{'id': 'p%d' % i, 'name': LONG, 'subdomain': 'long-subdomain-%d' % i, 'isPublished': True, 'createdAt': '2026-01-02T03:04:05.000Z',
                                  'owner': {'name': LONG, 'email': 'owner.long.address@example-long-domain.invalid'},
                                  '_count': {'content': 5, 'members': 2}} for i in range(3)], 'pagination': PAGE}
        elif p == '/admin/content':
            body = {'content': [{'id': 'c%d' % i, 'title': LONG, 'excerpt': LONG, 'contentType': 'BLOG', 'status': 'DRAFT', 'createdAt': '2026-01-02T03:04:05.000Z',
                                 'project': {'name': LONG, 'subdomain': 'long-subdomain'}} for i in range(3)], 'pagination': PAGE}
        elif p == '/admin/stats':
            body = {'stats': {'totalUsers': 3, 'totalProjects': 3, 'totalContent': 9},
                    'recentUsers': [{'id': 'u1', 'name': LONG, 'email': 'a@example.invalid', 'createdAt': TS}],
                    'recentProjects': [{'id': 'p1', 'name': LONG, 'subdomain': 'sub-p1', 'createdAt': TS, 'owner': {'name': LONG, 'email': 'a@example.invalid'}}]}
        elif p == '/admin/settings':
            body = {'searxng_url': '', 'allow_public_signups': 'true'}
        elif p == '/admin/sso/providers':
            body = []
        elif p == '/admin/ai-models':
            body = []
        elif p == '/admin/ai-models/providers':
            body = []
        elif p == '/admin/ai-models/defaults':
            body = {'QUICK': [], 'LONG': []}
        elif p == '/admin/ai-models/voice/elevenlabs':
            body = {'id': None, 'enabled': False, 'hasApiKey': False}
        elif p == '/ai/voice-config':
            body = {'voice': None}
        elif p == '/auth/tokens':
            body = {'tokens': [{'id': 't1', 'name': LONG, 'masked': 'flg_****abcd', 'prefix': 'flg_abcd', 'lastUsedAt': TS, 'createdAt': TS}]}
        elif p == '/integrations/github/status':
            body = {'connected': False}
        elif p in ('/media', '/projects/p1/media'):
            body = {'media': [], 'total': 0, 'limit': 50, 'offset': 0}
        elif p == '/projects/p1':
            body = PROJECTS['ownedProjects'][0]
        elif p == '/content-tags':
            body = [{'id': 'tg1', 'name': 'tag', 'slug': 'tag'}]
        elif p == '/projects/p1/content-links':
            body = []
        elif p == '/projects/p1/content' and route.request.method == 'GET':
            body = PROJECTS['ownedProjects'][0]['content']
        elif p == '/content/c1':
            body = content_row(1)
        elif p == '/analytics/projects/p1/summary':
            body = {'configured': False, 'days': 30, 'totals': {'events': 0, 'pageViews': 0, 'visitors': 0, 'sessions': 0}, 'series': []}
        elif p == '/analytics/projects/p1/property':
            body = {'configured': False, 'allowedOrigins': []}
        elif p == '/projects/p1/content' and route.request.method == 'POST':
            return route.fulfill(status=201, content_type='application/json', body=json.dumps({'id': 'c1', 'projectId': 'p1', 'title': 'New Blog Post', 'content': 'x', 'status': 'DRAFT', 'contentType': 'BLOG'}))
        else:
            # Unknown API call = fixture gap. Record it (gated below) and answer with a real 404, never a fake [].
            unmocked.append(route.request.method + ' ' + p)
            return route.fulfill(status=404, content_type='application/json', body=json.dumps({'error': 'unmocked in viewport harness'}))
        return route.fulfill(status=200, content_type='application/json', body=json.dumps(body))
    return route.continue_()


# Selectors are structural so the same test runs against pre-fix and post-fix markup.
JS = """() => {
  const vw = document.documentElement.clientWidth;
  const hdr = document.querySelector('.sticky.top-0');
  const vis = (s, root) => [...(root || document).querySelectorAll(s)].find(e => e.getClientRects().length);
  const box = el => { if (!el) return null; const r = el.getBoundingClientRect();
    return {l: Math.round(r.left), r: Math.round(r.right), w: Math.round(r.width), h: Math.round(r.height)}; };
  const select = vis('select', hdr);
  const mainOv = [...document.querySelectorAll('main *')].find(e => e.getBoundingClientRect().right > vw + 1);
  return {
    mainOverflow: mainOv ? mainOv.tagName + '.' + String(mainOv.className).slice(0, 40) : null,
    scrollWidth: document.documentElement.scrollWidth, vw,
    hdrScroll: hdr ? hdr.scrollWidth : -1, hdrClient: hdr ? hdr.clientWidth : -1,
    hdrH: hdr ? Math.round(hdr.getBoundingClientRect().height) : -1,
    ctl: {select: box(select), ai: box(vis('button[title="Create content with AI"]', hdr)),
          menu: box(vis('button.lg\\\\:hidden', hdr)), title: box(vis('h2', hdr))},
    selectLabel: select ? (select.getAttribute('aria-label') || (select.id && document.querySelector('label[for="' + select.id + '"]') ? 'label-for' : null)) : null,
    menuLabel: (vis('button.lg\\\\:hidden', hdr) || {getAttribute: () => null}).getAttribute('aria-label'),
  };
}"""

with sync_playwright() as pw:
    br = pw.chromium.launch()
    ctx = br.new_context(viewport={'width': 360, 'height': 800})
    ctx.add_init_script("localStorage.setItem('auth_token','local-mock')")
    ctx.route('**/*', mock)
    pg = ctx.new_page()
    cur = {'w': 0, 'r': ''}
    pg.on('pageerror', lambda e: page_errors.append((cur['w'], cur['r'], str(e)[:160])))
    for w, h in WIDTHS:
        pg.set_viewport_size({'width': w, 'height': h})
        for r in ROUTES:
            cur['w'], cur['r'] = w, r
            n_err = len(page_errors)
            pg.goto(BASE + r)
            pg.wait_for_load_state('networkidle')
            try:
                pg.wait_for_selector('.sticky.top-0 select option:nth-child(3)', state='attached', timeout=8000)
            except Exception:
                pass
            pg.wait_for_timeout(300)
            m = pg.evaluate(JS)
            problems = []
            # Any page-level horizontal overflow (header or <main> content) is a hard FAIL.
            warn = ''
            if m['scrollWidth'] > w:
                problems.append(f"page scrollWidth {m['scrollWidth']} > {w} (first overflowing main element: {m['mainOverflow']})")
            if m['hdrScroll'] > m['hdrClient']:
                problems.append(f"header scrollWidth {m['hdrScroll']} > {m['hdrClient']}")
            need = ['select', 'ai', 'title'] + (['menu'] if w < 1024 else [])
            for k in need:
                c = m['ctl'][k]
                if c is None:
                    problems.append(f'{k} missing/hidden')
                    continue
                if c['l'] < 0 or c['r'] > w:
                    problems.append(f"{k} outside viewport [{c['l']},{c['r']}]")
                if k in ('select', 'ai', 'menu') and (c['w'] < 40 or c['h'] < 24):
                    problems.append(f"{k} too small {c['w']}x{c['h']}")
            s = m['ctl']['select']
            if s and s['w'] < 96:
                problems.append('select unusably narrow')
            if not m['selectLabel']:
                problems.append('portfolio select has no accessible label')
            if w < 1024 and not m['menuLabel']:
                problems.append('menu button has no aria-label')
            for pw_, pr_, pm_ in page_errors[n_err:]:
                problems.append(f'pageerror: {pm_}')
            print('FAIL' if problems else 'PASS', f'{w}px {r}', f"scrollWidth={m['scrollWidth']} hdrH={m['hdrH']} select={s} ai={m['ctl']['ai']}", '; '.join(problems), warn, flush=True)
            if problems:
                fails.append((w, r))
    br.close()
if page_errors:
    print(f'PAGEERRORS {len(page_errors)}:', sorted(set(page_errors))[:10])
if unmocked:
    print('UNMOCKED API calls (fixture gap):', sorted(set(unmocked)))
    fails.append(('unmocked', ','.join(sorted(set(unmocked)))))
print(f'RESULT {"FAIL" if fails else "PASS"} ({len(fails)} failing combos of {len(WIDTHS) * len(ROUTES)})')
sys.exit(1 if fails else 0)
