# Plays three years through the real page in a headless browser: the setup screen, every view at several points of each year,
# the trainer and Pokémon cards, the glossary, the menu, god mode, the sim dialog, a battle replay and a reload from
# the save. Usage: python3 tests/browser.py "$PWD/dist/Pokémon League Builder.html"
import asyncio, sys, json
from playwright.async_api import async_playwright
async def run(path):
    errs = []
    async with async_playwright() as p:
        b = await p.chromium.launch(); ctx = await b.new_context(viewport={'width': 420, 'height': 900}); pg = await ctx.new_page()
        pg.on('pageerror', lambda e: errs.append('PAGEERR ' + str(e)))
        # a page with no network can't fetch its web fonts; that is not the game's fault
        pg.on('console', lambda m: errs.append('CONSOLE ' + m.text) if m.type == 'error' and 'Failed to load resource' not in m.text else None)
        await pg.goto('file://' + path); await pg.wait_for_timeout(500)
        out = await pg.evaluate("""() => {
          const log = [], click = sel => { const el = document.querySelector(sel); if (el) { el.click(); return true; } return false; };
          if (!document.querySelector('[data-act=newworld]')) log.push('FAIL no region cards on the setup screen');
          if (!/Pokémon League Builder/.test(document.title + document.body.textContent)) log.push('FAIL the name is missing');
          // setup pages
          for (const pg of ['advanced', 'main']) { click(`[data-act=setuppage][data-v=${pg}]`); if (!document.querySelector('main')) log.push('FAIL setup page ' + pg); }
          click('[data-act=updates]'); click('[data-act=nav]');
          click('[data-act=setgod][data-v="1"]');
          document.querySelectorAll('[data-act=newworld]')[2].click();
          if (!S || S.phase !== 'season' || S.season !== 1) { log.push('FAIL the world did not start'); return log; }
          log.push('started: ' + S.lgName + ', ' + S.challengers.length + ' challengers, cities ' + Object.values(S.cities).map(c => c.name).join(' '));
          const views = ['circuit', 'gyms', 'news', 'history', 'records', 'hof', 'dex', 'trainers', 'recap', 'god', 'updates'];
          const tour = tag => { for (const v of views) { try { go(v); const m = document.querySelector('#main'); if (!m || m.textContent.trim().length < 20) log.push('FAIL ' + tag + ' empty ' + v); if (/undefined|NaN|\\[object/.test(m.textContent)) log.push('FAIL ' + tag + ' ' + v + ' shows ' + m.textContent.match(/.{30}(undefined|NaN|\\[object).{20}/)[0]); } catch (e) { log.push('FAIL ' + tag + ' ' + v + ': ' + e.message); } } };
          const cards = tag => { try { go('circuit'); click('[data-act=profile]'); if (!document.querySelector('.sheet-profile')) log.push('FAIL ' + tag + ' no profile'); if (click('.sheet [data-act=mon]')) { if (!document.querySelector('.sheet-mon')) log.push('FAIL ' + tag + ' no Pokémon card'); click('[data-act=close]'); } click('[data-act=close]');
            click('[data-act=glossary]'); if (!document.querySelector('.sheet-glossary')) log.push('FAIL ' + tag + ' no glossary'); if (/undefined/.test(document.querySelector('.sheet').textContent)) log.push('FAIL glossary shows undefined'); click('[data-act=close]');
            click('[data-act=menu]'); if (!document.querySelector('.sheet-menu')) log.push('FAIL ' + tag + ' no menu'); click('[data-act=close]'); } catch (e) { log.push('FAIL ' + tag + ' cards: ' + e.message); } };
          // three years through the real controls: a few single weeks, a couple of months, then to New Year (which
          // stops early when a title is conceded or a post falls vacant, so it is pressed until the year turns)
          let guard = 0; const seen = {}; let watched = false, stopsSeen = 0;
          while (S.season < 4 && guard++ < 400) {
            const tag = 'y' + S.season + (S.week < 3 ? 'early' : S.week < 12 ? 'spring' : 'late');
            if (!seen[tag]) { seen[tag] = 1; tour(tag); cards(tag); go('circuit'); }
            try {
              const y = S.season, w = S.week;
              if (w < 3) { click('[data-act=playweek]'); if (S.week !== w + 1) log.push('FAIL Next week did not move one week'); }
              else if (w < 11) { click('[data-act=playmonth]'); if (S.season === y && S.week === w) log.push('FAIL Next month did not move'); if (S.season === y && S.week - w < 4) stopsSeen++; }
              else {
                if (S.season === 2 && !seen.god) { seen.god = 1; go('god'); if (click('[data-act=godpick]')) { const n = document.querySelector('#ge-age'); if (n) { n.value = '33'; click('[data-act=godsave]'); log.push('god saved'); } }
                  if (click('[data-act=godleague]')) log.push('god opened a League midyear: now ' + nLeagues()); go('circuit'); }
                click('[data-act=playyear]');
                if (S.season === y && S.week === w) log.push('FAIL To New Year did not move');
                if (S.season !== y) { if (view !== 'recap') log.push('FAIL no year in review at New Year'); if (S.week !== 0) log.push('FAIL New Year is not week 0');
                  if (!/in review/.test(document.querySelector('#main').textContent)) log.push('FAIL the year in review is empty'); }
                else stopsSeen++;
              }
              if (!watched && click('[data-act=watch]')) { if (!document.querySelector('.sheet-battle')) log.push('FAIL no battle replay'); else { watched = true; log.push('watched a title battle'); } click('[data-act=bskip]'); click('[data-act=close]'); }
            } catch (e) { log.push('FAIL step ' + tag + ': ' + e.message); break; }
          }
          if (S.history.length !== 3) log.push('FAIL history has ' + S.history.length + ' years after three');
          if (!/Year 4/.test(document.querySelector('header').textContent)) log.push('FAIL the header does not show the year');
          log.push('early stops: ' + stopsSeen + ' · field ' + S.challengers.length + ' · resting ' + S.challengers.filter(id => T(id).rest != null).length);
          // the sim dialog, one year
          click('[data-act=simmany]'); click('[data-act=simmanyn][data-v="1"]'); click('[data-act=simmanygo]');
          log.push('year ' + S.season + ' week ' + S.week + ' leagues ' + nLeagues() + ' ver ' + UPDATES[0].ver + ' key ' + SAVE_KEY);
          return log; }""")
        await pg.wait_for_timeout(4000)
        after = await pg.evaluate("""() => { const done = !!(modal && modal.done); document.querySelector('[data-act=simmanyclose]') && document.querySelector('[data-act=simmanyclose]').click(); save(); return { done, season: S.season, phase: S.phase, n: Object.keys(S.trainers).length }; }""")
        await pg.wait_for_timeout(1500)
        keys = await pg.evaluate("() => Object.keys(localStorage)")
        await pg.reload(); await pg.wait_for_timeout(1500)
        back = await pg.evaluate("() => S ? { season: S.season, phase: S.phase, n: Object.keys(S.trainers).length, view } : null")
        if not after['done']: out.append('FAIL the sim dialog did not finish')
        if not back or back['season'] != after['season'] or back['n'] != after['n']: out.append('FAIL the save did not come back after a reload: %s vs %s' % (back, after))
        if any(k.startswith('plgm') or 'league-gm' in k for k in keys) or 'plb-save' not in keys: out.append('FAIL storage keys: %s' % keys)
        out.append('after sim %s · reloaded %s · keys %s' % (after, back, keys))
        await pg.screenshot(path='/tmp/shot.png')
        # the itch.io build loads its data from a second file
        await b.close()
    print(json.dumps(out, indent=0, ensure_ascii=False)[:4000])
    bad = [x for x in out if x.startswith('FAIL')]
    print('FAILS', len(bad), 'ERRORS', len(errs)); [print(e[:300]) for e in errs[:10]]
    sys.exit(1 if bad or errs else 0)
asyncio.run(run(sys.argv[1]))
