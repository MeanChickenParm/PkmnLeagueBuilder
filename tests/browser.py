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
          // 0.9.0: pick a candidate who takes a post at once (not a challenger, who gets an offer, and not senior staff)
          // (0.10.0) staff can now leave over their ambitions, so a scripted step starts with no vacancy already open
          const clearVac = () => inLeague(0, () => { for (let n = 0; n < 20 && (S.vacancies || []).length; n++) { const v = S.vacancies[0]; if (v.incoming != null) withdrawOffer(v.incoming); const o = (v.outsiders || []).find(x => T(x) && T(x).role === 'prospect'); if (!o || !fillVacancy(v, o)) break; } });
          const pickNow = () => { const b = [...document.querySelectorAll('[data-act=hirepick]')].find(b => !/^(Circuit|Another circuit)/.test(b.closest('tr').children[1].textContent) && !/Gym Leader ·|Elite Four #/.test(b.closest('tr').textContent)); if (b) { b.click(); return true; } return false; };
          const log = [], click = sel => { const el = document.querySelector(sel); if (el) { el.click(); return true; } return false; };
          if (!document.querySelector('[data-act=newworld]')) log.push('FAIL no region cards on the setup screen');
          if (!/Pokémon League Builder/.test(document.title + document.body.textContent)) log.push('FAIL the name is missing');
          // setup pages
          for (const pg of ['advanced', 'main']) { click(`[data-act=setuppage][data-v=${pg}]`); if (!document.querySelector('main')) log.push('FAIL setup page ' + pg); }
          click('[data-act=updates]'); click('[data-act=nav]');
          click('[data-act=setgod][data-v="1"]');
          document.querySelectorAll('[data-act=newworld]')[2].click();
          // 0.6.0: founding by hand. Place one post by hand, clear and redo it, then fill the rest and open the League
          if (!S || !S.founding) { log.push('FAIL no founding screen'); return log; }
          if (document.querySelectorAll('[data-act=foundsel]').length !== 13) log.push('FAIL the founding screen does not list 13 posts');
          if (!document.querySelector('[data-act=foundgo]').disabled) log.push('FAIL Open the League is not disabled with empty posts');
          click('[data-act=foundsel][data-k=gym][data-v="0"]'); click('[data-act=foundshow][data-v=field]');
          { const id = +document.querySelector('[data-act=foundpick]').dataset.id; click('[data-act=foundpick]'); if (S.founding.gyms[0] !== id) log.push('FAIL picking a trainer did not place them'); if (!S.founding.field.includes(id)) log.push('FAIL the founding field filter'); }
          click('[data-act=foundclear][data-k=gym][data-v="0"]'); if (S.founding.gyms[0] != null) log.push('FAIL Clear did not clear the post');
          click('[data-act=foundshow][data-v=all]'); click('[data-act=foundpick]');
          if (/undefined|NaN|\\[object/.test(document.querySelector('#main').textContent)) log.push('FAIL the founding screen shows undefined');
          if (!/a week/.test(document.querySelector('#main').textContent) || !/₽/.test(document.querySelector('#main').textContent)) log.push('FAIL the founding screen shows no pay or wage bill');
          click('[data-act=foundfill]'); if (document.querySelector('[data-act=foundgo]').disabled) log.push('FAIL Fill the rest left posts empty');
          const placedChamp = S.founding.champion; click('[data-act=foundgo]');
          if (!S || S.founding || S.phase !== 'season' || S.season !== 1) { log.push('FAIL the world did not start'); return log; }
          if (S.champion !== placedChamp) log.push('FAIL the Champion placed is not the Champion');
          if (S.gyms.some(g => g.trainers.length !== 2 || g.trainers.some(id => !T(id) || T(id).role !== 'gymtrainer'))) log.push('FAIL gym trainers were not taken on');
          log.push('started: ' + S.lgName + ', ' + S.challengers.length + ' challengers, cities ' + Object.values(S.cities).map(c => c.name).join(' '));
          const views = ['circuit', 'gyms', 'news', 'history', 'records', 'hof', 'dex', 'trainers', 'recap', 'god', 'updates', 'hire', 'staff', 'meta', 'money', 'cities'];
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
                // 0.6.0: a Gym Leader and an Elite Four member leave; the posts wait with acting holders, then are filled
                if (S.season === 2 && !seen.vac) { seen.vac = 1; clearVac(); inLeague(0, () => { announceStepDown(T(S.gyms[4].leader)); staffRetires(T(S.gyms[2].leader)); staffRetires(T(S.e4[1])); }); viewLg = 0; go('gyms');
                  const txt = document.querySelector('#main').textContent;
                  if (!/waiting for you/.test(txt) || !/Acting/.test(txt) || !/Steps down/.test(txt)) log.push('FAIL vacancies or step-downs not shown');
                  if (!inLeague(0, () => T(S.gyms[2].leader).acting && S.gyms[2].trainers.filter(Boolean).length === 1)) log.push('FAIL no acting leader at gym 3');
                  click('[data-act=hire][data-v="0"]'); if (view !== 'hire' || !document.querySelector('[data-act=hirepick]')) log.push('FAIL no hiring page');
                  click('[data-act=hirefit]'); click('[data-act=hirefit]'); if (!pickNow()) log.push('FAIL nobody to pick at once');
                  click('[data-act=hire][data-v="0"]'); if (!pickNow()) log.push('FAIL nobody to pick at once');
                  if ((S.vacancies || []).length) log.push('FAIL vacancies left open: ' + S.vacancies.length);
                  if (inLeague(0, () => S.gyms[2].acting || S.gyms[2].trainers.filter(Boolean).length !== 2 || S.e4.some(id => T(id).acting))) log.push('FAIL posts not filled properly ' + JSON.stringify(inLeague(0, () => [S.gyms[2].acting, S.gyms[2].trainers, S.e4.map(id => T(id).acting), (S.vacancies || []).map(v => v.post + v.slot)])));
                  log.push('filled two vacancies'); go('circuit'); }
                // 0.7.0: your staff. Let an Elite Four member go and move a Gym Leader up (their gym opens next), swap
                // two Gym Leaders, replace a gym trainer by hand, let a gym trainer go
                if (S.season === 2 && !seen.staff) { seen.staff = 1; viewLg = 0; clearVac(); go('staff');
                  if (!/Your staff/.test(document.querySelector('#main').textContent) || document.querySelectorAll('[data-act=gtpick]').length !== 16) log.push('FAIL the staff page');
                  if (document.querySelector('[data-act=staffask][data-id="' + S.champion + '"]')) log.push('FAIL the Champion can be let go');
                  const e4 = S.e4[3]; click('[data-act=staffask][data-id="' + e4 + '"]'); click('[data-act=staffgo][data-id="' + e4 + '"]');
                  if (view !== 'hire' || !T(S.e4[3]).acting || !['challenger', 'retired'].includes(T(e4).role)) log.push('FAIL letting an Elite Four member go');
                  const row = [...document.querySelectorAll('[data-act=hirepick]')].find(b => /Gym Leader ·/.test(b.closest('tr').textContent));
                  if (!row) log.push('FAIL no Gym Leader among the candidates'); else { const id = +row.dataset.id; row.click();
                    if (T(S.e4[3]) !== T(id) || view !== 'hire' || !(S.vacancies || []).some(v => v.post === 'leader')) log.push('FAIL moving a Gym Leader up did not open their gym');
                    if (!pickNow()) log.push('FAIL nobody to pick at once'); }
                  if ((S.vacancies || []).length) log.push('FAIL posts left open after the move ' + JSON.stringify(S.vacancies.map(v => [v.post, v.slot, v.incoming])));
                  go('staff'); const a = S.gyms[0].leader, b2 = S.gyms[5].leader;
                  // 0.10.0: someone who wants to stay put refuses a swap; two who want promotion swap
                  T(a).wish = { k: 'stay', since: S.turn }; click('[data-act=staffswap][data-id="' + a + '"]');
                  if (document.querySelector('[data-act=staffswapto][data-id="' + b2 + '"]') || !/No swap: .* wants to stay put/.test(document.querySelector('#main').textContent)) log.push('FAIL a stay-put swap was offered');
                  click('[data-act=staffswap]'); T(a).wish = { k: 'up', since: S.turn }; T(b2).wish = { k: 'up', since: S.turn }; render();
                  if (!/Wants a /.test(document.querySelector('#main').textContent)) log.push('FAIL no ambition tags on the staff page');
                  click('[data-act=staffswap][data-id="' + a + '"]'); click('[data-act=staffswapto][data-id="' + b2 + '"]');
                  if (S.gyms[0].leader !== b2 || S.gyms[5].leader !== a) log.push('FAIL the swap');
                  // another run: a Gym Leader who asked is let go on their run and returns to the circuit
                  { const r = T(S.gyms[3].leader); r.wish = { k: 'run', since: S.turn, asked: S.turn }; go('staff');
                    if (!/Asking for another run/.test(document.querySelector('#main').textContent)) log.push('FAIL the run request is not in the notices');
                    click('[data-act=staffask][data-id="' + r.id + '"]'); const gb = document.querySelector('[data-act=staffgo][data-id="' + r.id + '"]');
                    if (!gb || !/on their run/.test(gb.textContent)) log.push('FAIL no Let go on their run button'); else { gb.click();
                      if (r.role !== 'challenger' || !(r.comebacks || []).length) log.push('FAIL letting go on a run'); else log.push('let a Gym Leader go on another run'); } } go('staff');
                  click('[data-act=gtpick][data-g="1"][data-k="0"]'); const old = S.gyms[1].trainers[0];
                  // 0.9.0: the picker offers outsiders; one nobody picks sets out as a challenger
                  { const outs = (S.gyms[1].outs || []).slice(), ob = [...document.querySelectorAll('[data-act=gtplace]')].find(b => /Outsider/.test(b.closest('tr').textContent));
                    if (view !== 'gtpick' || !ob) log.push('FAIL the gym trainer picker has no outsiders'); else { const oid = +ob.dataset.id; ob.click();
                      if (S.gyms[1].trainers[0] === old || S.gyms[1].trainers[0] !== oid) log.push('FAIL Replace did not change the gym trainer');
                      if (outs.filter(x => x !== oid).some(x => T(x).role !== 'challenger')) log.push('FAIL an unpicked outsider did not join the circuit'); } }
                  // an offer to a challenger: taken now, accepted for after their run, or turned down
                  let og = 2, ob = null;
                  for (; og < 8 && !ob; og++) { go('staff'); click('[data-act=gtpick][data-g="' + og + '"][data-k="0"]'); ob = [...document.querySelectorAll('[data-act=gtplace]')].find(b => b.textContent === 'Offer'); }
                  og--;
                  { const old2 = S.gyms[og].trainers[0];
                    if (!ob) log.push('FAIL no Offer button'); else { const oid = +ob.dataset.id; ob.click(); const t = T(oid);
                      if (!(S.gyms[og].trainers[0] === oid || (t.hired && S.gyms[og].incoming[0] === oid && S.gyms[og].trainers[0] === old2) || t.refusedAt === S.turn)) log.push('FAIL the offer came to nothing');
                      log.push('offer: ' + (S.gyms[og].trainers[0] === oid ? 'taken now' : t.hired ? 'after their run' : 'turned down'));
                      if (t.hired) { go('staff'); if (!/Coming:/.test(document.querySelector('#main').textContent)) log.push('FAIL the staff page does not show who is coming'); go('circuit'); if (!/Hired:/.test(document.querySelector('#main').textContent)) log.push('FAIL the circuit does not show the hire'); } } }
                  for (let n = 0; n < 20; n++) { const vi = (S.vacancies || []).findIndex(v => v.incoming == null); if (vi < 0) break; go('staff'); click('[data-act=hireauto][data-v="' + vi + '"]'); }
                  go('staff'); const gt = S.gyms[6].trainers[1]; click('[data-act=staffask][data-id="' + gt + '"]'); click('[data-act=staffgo][data-id="' + gt + '"]');
                  if (S.gyms[6].trainers.filter(Boolean).length !== 2 || S.gyms[6].trainers.includes(gt)) log.push('FAIL letting a gym trainer go');
                  if (/undefined|NaN|\\[object/.test(document.querySelector('#main').textContent)) log.push('FAIL the staff page shows undefined');
                  // 0.12.0: steers. Set the League line and one gym's steer from Your staff, then counter from the Meta page
                  { go('staff'); const pick = (k, v) => { const el = document.querySelector('select.steersel[data-k="' + k + '"]'); if (!el) { log.push('FAIL no steer picker for ' + k); return; } el.value = v; el.dispatchEvent(new Event('change', { bubbles: true })); };
                    pick('line', 'bulk'); pick('gym:2', 'power');
                    inLeague(0, () => { if (S.steer.line !== 'bulk' || S.steer.posts['gym:2'] !== 'power') log.push('FAIL steers were not set'); if (steerOf(T(S.gyms[2].trainers[0])) !== 'power' || steerOf(T(S.gyms[5].leader)) !== (S.steer.posts['gym:5'] || 'bulk')) log.push('FAIL steerOf'); });
                    pick('gym:2', ''); inLeague(0, () => { if ('gym:2' in S.steer.posts) log.push('FAIL clearing a steer'); });
                    go('meta'); if (!/The trend/.test(document.querySelector('#main').textContent)) log.push('FAIL the Meta page');
                    const b = document.querySelector('[data-act=steerall][data-v=year]'); if (b) { b.click(); log.push('countered the year: ' + Object.values(inLeague(0, () => S.steer.posts)).filter(x => x === 'year').length + ' posts'); } else log.push('no year reading yet');
                    go('trainers'); }
                  // 0.13.0: money and cities. Build an attraction at the seat, ban a Pokémon from the Meta page, read the books
                  { if (!/₽/.test(document.querySelector('header').textContent)) log.push('FAIL the header shows no money');
                    go('cities'); const m0 = S.fin.money, b = document.querySelector('[data-act=build][data-w=seat][data-k=attract]');
                    if (!b) log.push('FAIL no attraction to build at the seat'); else if (!b.disabled) { b.click(); if (!(S.seatB || []).some(x => x.k === 'attract') || S.fin.money !== m0 - 25000) log.push('FAIL building an attraction'); else log.push('built an attraction'); }
                    if (document.querySelectorAll('[data-act=movegym]').length !== 3) log.push('FAIL the Cities page should list three cities with no gym');
                    go('meta'); const bn = [...document.querySelectorAll('[data-act=ban][data-v="1"]')].find(x => !x.disabled);
                    if (bn) { const sp = bn.dataset.sp; bn.click(); if (!inLeague(0, () => paidBans().some(x => x.sp === sp))) log.push('FAIL paying for a ban'); else log.push('banned ' + sp); } else log.push('nothing to ban yet');
                    go('money'); if (!/Ledger/.test(document.querySelector('#main').textContent) || !/Salaries/.test(document.querySelector('#main').textContent)) log.push('FAIL the Money page');
                    if (/undefined|NaN|\\[object/.test(document.querySelector('#main').textContent)) log.push('FAIL the Money page shows undefined'); }
                  log.push('managed staff'); go('circuit'); }
                // 0.11.0: seat challenges waiting for the player. Approve one for the Champion's seat (it is fought at
                // once and recorded), refuse one for an Elite Four seat, and find both in the year report with a Watch button
                if (S.season === 3 && !seen.chal) { seen.chal = 1; viewLg = 0; clearVac();
                  const h = S.history[S.history.length - 1], e = 0, champ0 = S.champion, cand = S.e4[e];
                  S.chalPending = [{ k: 'champ', cand, inc: S.champion, slot: e, from: 'e4', gym: null, season: h.season, due: S.turn + 4 },
                    { k: 'e4', cand: S.gyms[7].leader, inc: S.e4[1], slot: 1, from: 'leader', gym: 7, season: h.season, due: S.turn + 4 }];
                  go('staff'); if (!/Seat challenges waiting for you/.test(document.querySelector('#main').textContent)) log.push('FAIL waiting challenges not in the staff notices');
                  const n0 = (h.chal || []).length; // the year's own challenges may already be recorded
                  click('[data-act=chalyes][data-v="0"]'); const rec = (h.chal || [])[n0];
                  if (!rec || rec.lapsed || rec.won == null) log.push('FAIL an approved challenge was not fought');
                  else if (rec.won ? S.champion !== cand || T(champ0).role !== 'e4' || S.e4[e] !== champ0 : S.champion !== champ0) log.push('FAIL the challenge result did not move the right people');
                  click('[data-act=chalno][data-v="0"]'); if ((S.chalPending || []).length || !(h.chal || []).some(c => c.refused)) log.push('FAIL refusing a challenge');
                  repYear = h.season; go('recap'); const tx = document.querySelector('#main').textContent;
                  if (!/Seat challenges/.test(tx) || !/refused by you/.test(tx)) log.push('FAIL the year report has no seat challenges');
                  if (!click('[data-act=watchseat]') || !document.querySelector('.sheet-battle')) log.push('FAIL no seat challenge to watch'); click('[data-act=bskip]'); click('[data-act=close]');
                  log.push('seat challenge: ' + (rec && rec.won ? 'challenger won' : 'defended') + ', one refused'); repYear = null; go('circuit'); }
                if (!seen.gymwatch && S.season >= 2) { go('gyms'); if (click('[data-act=watchgym]')) { seen.gymwatch = 1; if (!document.querySelector('.sheet-battle')) log.push('FAIL no gym battle replay'); else log.push('watched a badge conceded'); click('[data-act=bskip]'); click('[data-act=close]'); } go('circuit'); }
                if (!seen.repyear && S.history.length >= 2) { go('history'); const ls = document.querySelectorAll('#main [data-act=repyear]'); const old = ls[ls.length - 1];
                  if (!old) log.push('FAIL no year links on the History page'); else { const yv = old.dataset.v; old.click(); const tx = document.querySelector('#main').textContent;
                    if (view !== 'recap' || !tx.includes('Year ' + yv + ' report')) log.push('FAIL an earlier year report did not open');
                    if (document.querySelectorAll('#main .tbl')[2].querySelectorAll('tbody tr').length !== 8) log.push('FAIL the year report has no row per gym');
                    if (/undefined|NaN|\[object/.test(tx)) log.push('FAIL the year report shows undefined');
                    if (!click('[data-act=repyear][data-v=latest]') || !document.querySelector('#main').textContent.includes('Year ' + S.history[S.history.length - 1].season + ' report')) log.push('FAIL Latest did not go back');
                    seen.repyear = 1; log.push('opened an earlier year report'); } go('circuit'); }
                click('[data-act=playyear]');
                if (S.season === y && S.week === w) log.push('FAIL To New Year did not move');
                if (S.season !== y) { if (view !== 'recap') log.push('FAIL no year in review at New Year'); if (S.week !== 0) log.push('FAIL New Year is not week 0');
                  if (!/Year \d+ report/.test(document.querySelector('#main').textContent) || !document.querySelectorAll('#main .tbl').length) log.push('FAIL the year report is empty'); }
                else stopsSeen++;
              }
              if (!watched && click('[data-act=watch]')) { if (!document.querySelector('.sheet-battle')) log.push('FAIL no battle replay'); else { watched = true; log.push('watched a title battle'); } click('[data-act=bskip]'); click('[data-act=close]'); }
            } catch (e) { log.push('FAIL step ' + tag + ': ' + e.message); break; }
          }
          if (!seen.gymwatch) log.push('FAIL no badge conceded to watch');
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
