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
          // 0.21.0: three starting Leagues by default (the option is pressed anyway)
          if ((document.querySelector('.setleaguesn') || {}).textContent !== '3') log.push('FAIL Starting Leagues does not default to 3');
          // 0.30.0: the stepper goes to the world's full room (two a region), with the speed estimate warning on big worlds
          for (let n = 0; n < 20; n++) click('[data-act=setleagues][data-v="' + (+document.querySelector('.setleaguesn').textContent + 1) + '"]');
          if (document.querySelector('.setleaguesn').textContent !== '18') log.push('FAIL Starting Leagues stops at ' + document.querySelector('.setleaguesn').textContent + ', not 18');
          if (!document.querySelector('.speed-est.red')) log.push('FAIL no warning for an 18-League world');
          while (+document.querySelector('.setleaguesn').textContent > 3) click('[data-act=setleagues][data-v="' + (+document.querySelector('.setleaguesn').textContent - 1) + '"]');
          if (!document.querySelector('.speed-est') || document.querySelector('.speed-est.amber, .speed-est.red')) log.push('FAIL the speed estimate for three Leagues');
          // Advanced: rival 2 starts in Hoenn, the region this test picks for the player's League
          click('[data-act=setuppage][data-v=advanced]');
          { const sels = document.querySelectorAll('.rivalsel'); if (sels.length !== 2) log.push('FAIL the rival picker lists ' + sels.length + ' rivals'); else { sels[1].value = '2'; sels[1].dispatchEvent(new Event('change', { bubbles: true })); } }
          // 0.33.0: rival 1 is named here; rival 2 keeps its seat's default
          { const inp = document.querySelector('.rivalname[data-i="1"]'); if (!inp) log.push('FAIL no name field for rival 1'); else { inp.value = 'Browser Rival Cup'; inp.dispatchEvent(new Event('input', { bubbles: true })); } }
          // 0.31.0: the region editor. Make a region (rename it and a city, a port, neighbours, a legendary, a generated
          // list, a line added and removed, a Pokémon of its own), save it, export it, import the code back (its own
          // Pokémon's name is taken, so it is left out and flagged), delete the copy, and use the first as a 10th region
          // closed to rivals
          { const setIn = (sel, v, ev = 'input') => { const el = document.querySelector(sel); if (!el) { log.push('FAIL no field ' + sel); return; } el.value = v; el.dispatchEvent(new Event(ev, { bubbles: true })); };
            if (!document.querySelector('[data-act=rgnew]')) { click('[data-act=advfold][data-k=regions]'); }
            if (!click('[data-act=rgnew]')) log.push('FAIL no New region button');
            if (!document.querySelector('.rg-places')) log.push('FAIL the region editor did not open');
            setIn('.rg-f[data-f=name]', 'Testland'); setIn('.rg-f[data-f="towns.0"]', 'Portwick'); setIn('.rg-port[data-i="0"]', 'port', 'change');
            setIn('.rg-f[data-f="posts.leader"]', 'Warden'); setIn('.rg-f[data-f="posts.champion"]', 'Lord Warden'); setIn('.rg-f[data-f="posts.e4"]', 'High Wardens');
            click('[data-act=rgnb][data-k=Kanto]'); click('[data-act=rgnb][data-k=Hoenn]');
            setIn('#rg-leg', 'Mewtwo'); click('[data-act=rglegadd]');
            click('[data-act=rggent][data-k=Water]'); click('[data-act=rggent][data-k=Ice]'); click('[data-act=rggen]');
            if (!/Generated a list/.test(document.body.textContent)) log.push('FAIL the generator made no list');
            setIn('#rg-add', 'Ekans'); click('[data-act=rgadd]'); click('[data-act=rgrm][data-k=Ekans]');
            click('[data-act=rgspnew]'); setIn('#rgs-name', 'Testmon'); setIn('#rgs-t1', 'Water', 'change'); click('[data-act=rgspsave]');
            if (!/Added Testmon/.test(document.body.textContent)) log.push('FAIL the own Pokémon of the region was not added');
            // a legendary encounter of its own: refused under the bar, added over it, kept off the list
            click('[data-act=rgspnew]'); setIn('#rgs-name', 'Testgod'); document.querySelector('#rgs-legend').checked = true; click('[data-act=rgspsave]');
            if (!/over 650/.test(document.body.textContent)) log.push('FAIL a weak legendary encounter was not refused');
            for (let i = 0; i < 6; i++) setIn('#rgs-st' + i, '120'); document.querySelector('#rgs-legend').checked = true; click('[data-act=rgspsave]');
            if (!/Added Testgod/.test(document.body.textContent) || document.querySelector('[data-act=rgrm][data-k=Testgod]')) log.push('FAIL the legendary encounter was not added, or is on the list');
            if (!document.querySelector('[data-act=rgrm][data-k=Testmon]')) log.push('FAIL Testmon is not on the list');
            if (!/Strong lines by type/.test(document.body.textContent)) log.push('FAIL no type checks in the editor');
            click('[data-act=rgsave]');
            const rec = regionLib.regions.find(r => r.name === 'Testland');
            if (!rec) log.push('FAIL Testland was not saved'); else {
              if (rec.towns[0] !== 'Portwick' || rec.ports.Portwick !== 'port' || !rec.legends.includes('Mewtwo') || rec.nb.length !== 2 || !rec.added.some(x => x.name === 'Testmon') || !rec.added.some(x => x.name === 'Testgod' && x.legend) || rec.pool.includes('Testgod') || !rec.pool.includes('Testmon') || rec.pool.includes('Ekans') || (rec.posts || {}).leader !== 'Warden' || (rec.posts || {}).champion !== 'Lord Warden' || (rec.posts || {}).e4 !== 'High Wardens') log.push('FAIL Testland saved wrong: ' + JSON.stringify(rec).slice(0, 300));
              click(`[data-act=rgexport][data-k=${rec.id}]`);
              const code = (document.querySelector('#rg-exptext') || {}).value || '';
              if (!code.startsWith('PLR1:')) log.push('FAIL no region code');
              setIn('#rg-imp', code); click('[data-act=rgimport]');
              const copy = regionLib.regions.find(r => r.name === 'Testland 2');
              if (!copy) log.push('FAIL the imported region is missing'); else {
                if (copy.added.length || !/already taken: Testmon/.test(document.body.textContent)) log.push('FAIL the taken name was not left out and flagged');
                click(`[data-act=rgdel][data-k=${copy.id}]`); click(`[data-act=rgdelyes][data-k=${copy.id}]`);
                if (regionLib.regions.some(r => r.name === 'Testland 2')) log.push('FAIL the copy was not deleted'); }
              click(`[data-act=rgedit][data-k=${rec.id}]`); click('[data-act=rgflag][data-k=rivals]'); click('[data-act=rgsave]');
              setIn(`.rguse[data-k=${rec.id}]`, 'add', 'change');
              if (!/Testland: added as a new region/.test((click('[data-act=setuppage][data-v=main]'), document.body.textContent))) log.push('FAIL the main page does not list the custom region');
              if (document.querySelectorAll('[data-act=newworld]').length !== 10) log.push('FAIL ' + document.querySelectorAll('[data-act=newworld]').length + ' region cards, not 10');
              click('[data-act=setuppage][data-v=advanced]'); } }
          click('[data-act=setuppage][data-v=main]');
          // 0.33.0: your League's name on the main setup page
          { const inp = document.querySelector('#setlgname'); if (!inp) log.push('FAIL no name field for your League'); else { inp.value = 'Browser Home Cup'; inp.dispatchEvent(new Event('input', { bubbles: true })); } }
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
          // 0.23.0: no famous trainers in the pool, and anyone the new League can't sign shows the prestige they need
          if (S.founding.cands.some(id => S.trainers[id].famous)) log.push('FAIL a famous trainer in the founding pool');
          { const bl = foundPool().filter(id => !willSign(S.trainers[id])); click('[data-act=foundshow][data-v=all]');
            if (bl.length && !/needs prestige \\d+ \\(you have 0\\)/.test(document.querySelector('#found-pool').textContent)) log.push('FAIL a blocked candidate shows no prestige need');
            if (bl.length && foundPlace('gym', 1, bl[0])) log.push('FAIL a blocked candidate could be placed'); }
          if (!/a week/.test(document.querySelector('#main').textContent) || !/₽/.test(document.querySelector('#main').textContent)) log.push('FAIL the founding screen shows no pay or wage bill');
          click('[data-act=foundfill]'); if (document.querySelector('[data-act=foundgo]').disabled) log.push('FAIL Fill the rest left posts empty');
          const placedChamp = S.founding.champion; click('[data-act=foundgo]');
          if (!S || S.founding || S.phase !== 'season' || S.season !== 1) { log.push('FAIL the world did not start'); return log; }
          if (S.champion !== placedChamp) log.push('FAIL the Champion placed is not the Champion');
          if (S.gyms.some(g => g.trainers.length !== 2 || g.trainers.some(id => !T(id) || T(id).role !== 'gymtrainer'))) log.push('FAIL gym trainers were not taken on');
          // 0.31.0: the world has Testland as its 10th region, its own Pokémon and Mewtwo at home there, and no rival in it
          { const r = S.regions[9];
            if (!r || r.name !== 'Testland League' || !r.solo || r.posts.leader !== 'Warden' || r.ports.Portwick !== 'port') log.push('FAIL the 10th region of the world: ' + JSON.stringify(r || {}).slice(0, 200));
            if (!SP.Testmon || !homeSet(9) || !homeSet(9).has('Testmon') || !(LEGEND_HOMES.Mewtwo || []).includes(9) || !(LEGEND_HOMES.Mewtwo || []).includes(0) || LEGEND_HOME.Testgod !== 9 || !SP.Testgod || !SP.Testgod.dexLegend) log.push('FAIL the Pokémon or legendary of Testland');
            if (eachLeague(() => S.region).slice(1).includes(9)) log.push('FAIL a rival started in a region closed to rivals'); }
          // 0.31.0: no "Defending" before a Champion's title (the owner)
          if (/Defending/.test((document.querySelector('#main') || {}).textContent || '') || eachLeague(() => dn(T(S.champion))).some(x => /Defending/.test(x))) log.push('FAIL a Champion is still titled Defending');
          log.push('started: ' + S.lgName + ', ' + S.challengers.length + ' challengers, cities ' + Object.values(S.cities).map(c => c.name).join(' '));
          // 0.21.0: three Leagues, each in its own region
          { const rg = eachLeague(() => S.region), nm = eachLeague(() => S.lgName); if (nLeagues() !== 3 || rg[0] !== 2 || rg[2] !== 2 || rg[1] === 2 || nm[2] !== 'Sky Pillar League' || nm[0] !== 'Browser Home Cup' || nm[1] !== 'Browser Rival Cup') log.push('FAIL the world did not start with the placed rival beside the player: ' + rg + ' ' + nm); }
          const views = ['circuit', 'board', 'gyms', 'news', 'history', 'records', 'hof', 'dex', 'trainers', 'recap', 'god', 'updates', 'hire', 'staff', 'meta', 'money', 'cities', 'ranch', 'plans'];
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
                    // 0.18.0: sell it back for half from the Cities page
                    { const sb = document.querySelector('[data-act=sellb][data-w=seat][data-k=attract]'), m1 = S.fin.money;
                      if (!(S.seatB || []).some(x => x.k === 'attract')) {} else if (!sb) log.push('FAIL no sell button for the attraction'); else { sb.click(); if ((S.seatB || []).some(x => x.k === 'attract') || S.fin.money !== m1 + 12500) log.push('FAIL selling the attraction'); else log.push('sold the attraction'); } }
                    // 0.19.0: a level sold in the red can be restored at 30%; a distress offer can be bought from the Cities page
                    { const keep = S.fin.money; S.fin.money = 100000; go('cities'); const b2 = document.querySelector('[data-act=build][data-w=seat][data-k=attract]');
                      if (b2 && !b2.disabled) { b2.click(); S.fin.money = -1000; inLeague(0, () => sellBuilding('seat', 'attract')); S.fin.money = 100000; go('cities');
                        const rb = document.querySelector('[data-act=build][data-w=seat][data-k=attract]');
                        if (!rb || !/Restore/.test(rb.textContent)) log.push('FAIL no Restore button after a sale in the red');
                        else { rb.click(); if (S.fin.money !== 100000 - 7500 || !(S.seatB || []).some(x => x.k === 'attract')) log.push('FAIL restoring the attraction'); else log.push('restored the attraction'); } }
                      const ck = inLeague(0, () => buildCheck(0, 'attract'));
                      if (!ck.why) { S.distress = [{ city: S.gyms[0].city, k: 'attract', lv: ck.lv, from: -1, price: 7500, due: S.turn + 4, at: S.turn }]; go('cities');
                        const db = document.querySelector('[data-act=distbuy]'), m2 = S.fin.money;
                        if (!db || !/Distress sales/.test(document.querySelector('#main').textContent)) log.push('FAIL no distress sales panel');
                        else { db.click(); if (S.fin.money !== m2 - 7500 || (S.distress || []).length) log.push('FAIL buying a distress offer'); else log.push('bought a distress offer'); } }
                      // 0.20.0: a legendary site in a gym city; build a Sanctuary there from the Cities page
                      { S.fin.money = 100000; const gi = [1, 2, 3, 4, 5, 6, 7].find(i => { const c = S.cities[S.gyms[i].city]; const was = c.site; c.site = { sp: 'Mew', from: S.season, until: S.season + 9 }; const ok = !inLeague(0, () => buildCheck(i, 'sanct')).why; if (!ok) c.site = was; return ok; });
                        if (gi == null) log.push('no gym city with room for a Sanctuary');
                        else { go('cities'); const sb = document.querySelector('[data-act=build][data-w="' + gi + '"][data-k=sanct]'), m3 = S.fin.money;
                          if (!/Legendary site/.test(document.querySelector('#main').textContent) || !sb) log.push('FAIL no legendary site or Sanctuary button');
                          else { sb.click(); if (S.fin.money !== m3 - 25000 || !inLeague(0, () => placeLv(gi, 'sanct'))) log.push('FAIL building a Sanctuary'); else log.push('built a Sanctuary'); } }
                        if (!document.querySelector('[data-act=build][data-w=seat][data-k=sanct]') === false) log.push('FAIL a Sanctuary offered at the seat'); }
                      S.fin.money = keep; go('cities'); }
                    if (document.querySelectorAll('[data-act=movegym]').length !== 3) log.push('FAIL the Cities page should list three cities with no gym');
                    // 0.40.0: every gym city shows its control tier; a staff member's profile shows their hometown
                    { const txt = document.body.innerText; if (!TIER_NAMES.some(n => txt.includes(n))) log.push('FAIL the Cities page shows no control tier');
                      const sid = inLeague(0, () => S.champion); modal = { kind: 'profile', id: sid }; renderModal(); const pt = (document.querySelector('.sheet-profile') || {}).textContent || ''; if (homeName(T(sid)) && !pt.includes('From ' + homeName(T(sid)))) log.push('FAIL a profile without its hometown'); modal = null; renderModal(); go('cities'); }
                    go('meta'); const bn = [...document.querySelectorAll('[data-act=ban][data-v="1"]')].find(x => !x.disabled);
                    if (bn) { const sp = bn.dataset.sp; bn.click(); if (!inLeague(0, () => paidBans().some(x => x.sp === sp))) log.push('FAIL paying for a ban'); else log.push('banned ' + sp); } else log.push('nothing to ban yet');
                    go('money'); if (!/Ledger/.test(document.querySelector('#main').textContent) || !/Salaries/.test(document.querySelector('#main').textContent)) log.push('FAIL the Money page');
                    if (/undefined|NaN|\\[object/.test(document.querySelector('#main').textContent)) log.push('FAIL the Money page shows undefined'); }
                  // 0.25.0: the ranch. Buy from the market, send an area trip and a targeted trip, reserve, lock and sell one,
                  // and build the Ranch at the seat
                  { const keep = S.fin.money; S.fin.money = 300000; go('ranch'); const txt = () => document.querySelector('#main').textContent, R = () => inLeague(0, () => S.ranch);
                    if (!/Who fields what/.test(txt()) || !/The pool/.test(txt()) || !/The market/.test(txt())) log.push('FAIL the Ranch page');
                    if (S.gyms.some(g => T(g.leader) && T(g.leader).specialty) && !/backups/.test(txt())) log.push('FAIL the Ranch page shows no backup types'); // (0.38.0)
                    if (/undefined|NaN|\[object/.test(txt())) log.push('FAIL the Ranch page shows undefined');
                    { const b = document.querySelector('[data-act=ranchbuy]'), n0 = R().mons.length, m0 = S.fin.money, x = b && R().shop.find(y => y.uid === +b.dataset.id);
                      if (!b || !x) log.push('FAIL no market to buy from'); else if (!b.disabled) { b.click(); if (R().mons.length !== n0 + 1 || S.fin.money !== m0 - x.price) log.push('FAIL buying at the market'); else log.push('bought ' + x.b + ' at the market'); } else log.push('the ranch is full'); }
                    { const b = document.querySelector('[data-act=rancharea]'), t0 = R().trips.length, m0 = S.fin.money; if (!b) log.push('FAIL no area trip button'); else if (!b.disabled) { b.click(); if (R().trips.length !== t0 + 1 || S.fin.money !== m0 - 2500) log.push('FAIL the area trip'); } }
                    { const sel = document.querySelector('select.ranchtypesel'); if (!sel) log.push('FAIL no type picker'); else { sel.value = 'Water'; sel.dispatchEvent(new Event('change', { bubbles: true })); }
                      const b = document.querySelector('[data-act=ranchtrip]'), t0 = R().trips.length; if (!b) log.push('FAIL no targeted trip button'); else if (!b.disabled) { const sp = b.dataset.b; b.click(); if (R().trips.length !== t0 + 1 || !R().trips.some(x => x.b === sp)) log.push('FAIL the targeted trip'); else log.push('sent a trip for ' + sp); } }
                    // 0.36.0: hunt an alpha from the condition picker (cost the plan's), a trip to an injected outbreak, and a
                    // Delta entry shown with its tag and its own type
                    { inLeague(0, () => { S.ranch.trips = []; });
                      const sel = document.querySelector('select.ranchcondsel'); if (!sel) log.push('FAIL no condition picker'); else { sel.value = 'alpha'; sel.dispatchEvent(new Event('change', { bubbles: true })); }
                      const b = document.querySelector('[data-act=ranchtrip]'), m0 = S.fin.money;
                      if (!b || !/Hunt an? alpha/.test(b.textContent)) log.push('FAIL no hunt button'); else if (!b.disabled) { const sp = b.dataset.b, p = inLeague(0, () => huntPlan(sp, 'alpha')); b.click(); const tr = R().trips.find(x => x.cond === 'alpha'); if (!tr || S.fin.money !== m0 - p.cost) log.push('FAIL the hunt'); else log.push('hunted an alpha ' + sp + ' for ' + p.cost); }
                      const sel2 = document.querySelector('select.ranchcondsel'); if (sel2) { sel2.value = ''; sel2.dispatchEvent(new Event('change', { bubbles: true })); }
                      inLeague(0, () => { const b0 = ranchSpecies().find(x => !SP[x].rare); S.outbreak = { sp: b0, town: townName(0), turn: S.turn, season: S.season, week: S.week, caught: 0, alpha: 0, shiny: 0 }; }); render();
                      const ob = document.querySelector('[data-act=ranchob]'), t0 = R().trips.length; if (!ob) log.push('FAIL no outbreak trip button'); else if (!ob.disabled) { ob.click(); if (R().trips.length !== t0 + 1 || !R().trips.some(x => x.k === 'outbreak')) log.push('FAIL the outbreak trip'); else if (document.querySelector('[data-act=ranchob]')) log.push('FAIL a second outbreak trip offered'); }
                      inLeague(0, () => { S.outbreak = null; S.ranch.trips = []; const e = newEntry(ranchSpecies().find(x => SP[x].types.length === 1), 3, 'trip'); condEntry(e, ['delta']); ranchAdd(e); }); render();
                      if (!document.querySelector('#main .tag.delta')) log.push('FAIL no Delta tag on the Ranch page');
                      if (/undefined|NaN|\[object/.test(txt())) log.push('FAIL the Ranch page shows undefined after conditions'); }
                    // 0.37.0: take from a new hire's storage, store a challenger's legendary in a Sanctuary (paying their fee) and
                    // give it to an Elite Four member
                    { const t = inLeague(0, () => { const t = T(S.e4[0]); const b = ranchSpecies().find(x => !SP[x].rare); t.store = [{ uid: 990001, sp: b, iv: { hp: 20, atk: 20, def: 20, spa: 20, spd: 20, spe: 20 }, at: S.turn }]; t.storePick = { n: 1, until: S.turn + 8 }; return t; }); render();
                      const pb = document.querySelector('[data-act=storepick]'), n0 = R().mons.length; if (!/New hires' storage/.test(txt()) || !pb) log.push('FAIL no storage pick');
                      else if (!pb.disabled) { pb.click(); if (R().mons.length !== n0 + 1 || t.store.length || t.storePick) log.push('FAIL the storage pick'); else log.push('took ' + R().mons[R().mons.length - 1].sp + ' from storage'); }
                      const L = inLeague(0, () => { const own = ownedLegends(), pooled = new Set((S.wPool || []).map(m => m.sp)); const sp = LEGENDS.map(x => x.name || x).find(x => SP[x] && SP[x].legend && !SP[x].baby && !own.has(x) && !pooled.has(x) && !legendHeld(x));
                        const c = S.challengers.map(T).find(x => x && x.team.length >= 2 && !legendFull(x)); if (!sp || !c) return null;
                        const m = claimLegend(c, makeMon(sp, 50)); c.team.push(m); const city = S.cities[S.gyms[0].city]; city.site = { sp, from: S.season, sps: [sp] }; cityB(city).push({ k: 'sanct', lv: 1 }); S.fin.money = Math.max(S.fin.money, 400000); return { c, m }; });
                      if (!L) log.push('no legendary to store'); else { render();
                        if (!/Sanctuaries and the vault/.test(txt())) log.push('FAIL no Sanctuary panel');
                        const ab = document.querySelector('[data-act=vaultask][data-id="' + L.c.id + '"]'), fee = inLeague(0, () => vaultFee(L.m)), m0 = S.fin.money;
                        if (!ab) log.push('FAIL no store button'); else { ab.click(); const v = inLeague(0, () => S.vault || []); if (!v.some(e => e.m === L.m) || L.c.team.includes(L.m) || S.fin.money !== m0 - fee) log.push('FAIL storing a legendary ' + JSON.stringify({ dis: ab.disabled, n: v.length, team: L.c.team.includes(L.m), m0, now: S.fin.money, fee, toast: (document.querySelector('.toast') || {}).textContent })); else log.push('stored ' + L.m.sp + ' for ' + fee); }
                        if (!/open/.test(document.querySelector('#main').textContent)) log.push('FAIL the Sanctuary not shown open');
                        const gb = document.querySelector('[data-act=vaultgive]'), sel = document.querySelector('select.vaultsel');
                        if (!gb || !sel) log.push('FAIL no give button'); else { const to = T(+sel.value); gb.click(); if (!to.team.includes(L.m)) log.push('FAIL giving a stored legendary'); else log.push('gave ' + L.m.sp + ' to ' + to.name); }
                        if (/undefined|NaN|\[object/.test(txt())) log.push('FAIL the Ranch page shows undefined after the vault'); } }
                    { const e = inLeague(0, () => { ranchSync(); return S.ranch.mons.find(x => x.at == null && !x.sale); });
                      if (!e) log.push('nothing free in the ranch');
                      else { const sel = document.querySelector('select.ranchressel[data-id="' + e.uid + '"]'); if (!sel) log.push('FAIL no reserve picker'); else { sel.value = 'gym:0'; sel.dispatchEvent(new Event('change', { bubbles: true })); if (e.res !== 'gym:0') log.push('FAIL reserving'); }
                        const lb = document.querySelector('[data-act=ranchlock][data-id="' + e.uid + '"]'); if (!lb) log.push('FAIL no lock button'); else { lb.click(); if (!e.lock || e.res) log.push('FAIL locking'); }
                        const sb = document.querySelector('[data-act=ranchsell][data-id="' + e.uid + '"]'), v = inLeague(0, () => Math.round(entryValue(e) * SELL_BACK)), m0 = S.fin.money;
                        if (!sb) log.push('FAIL no sell button'); else { sb.click(); if (S.fin.money !== m0 + v || R().mons.includes(e)) log.push('FAIL selling back'); else log.push('sold back ' + e.sp); } } }
                    // 0.26.0: sell a fielded one straight from the pool; its holder swaps it out at once
                    { go('ranch'); const e = inLeague(0, () => { ranchSync(); return S.ranch.mons.find(x => x.at != null); });
                      if (!e) log.push('nothing fielded from the ranch'); else { const t = T(e.at), n0 = t.team.length, sb = document.querySelector('[data-act=ranchsell][data-id="' + e.uid + '"]');
                        if (!sb || !/swaps it out/.test(sb.closest('tr').textContent)) log.push('FAIL no Sell button or note on a fielded ranch Pokémon');
                        else { sb.click(); if (t.team.length !== n0 || t.team.some(m => m.rid === e.uid) || R().mons.includes(e)) log.push('FAIL selling a fielded ranch Pokémon'); else log.push('sold a fielded ' + e.sp); } } }
                    // 0.39.0: team plans. With the review open, plan a ranch Pokémon for gym 1 (built at once); with it closed and
                    // the holder seen, a plan for gym 2 waits for the review; clear it; the review-stop box
                    { inLeague(0, () => { ranchSync(); const P = plansState(); P.win = S.turn; }); go('plans'); const txt2 = () => document.querySelector('#main').textContent;
                      if (!/Team plans/.test(txt2()) || !/quarterly team review/.test(txt2())) log.push('FAIL the Team plans page');
                      if (/undefined|NaN|\[object/.test(txt2())) log.push('FAIL the Team plans page shows undefined');
                      const sel = document.querySelector('select.plansel[data-k="gym:0"][data-i="0"]'), opt = sel && [...sel.options].find(o => o.value[0] === 'r');
                      if (!sel) log.push('FAIL no plan picker'); else if (!opt) log.push('nothing in the ranch to plan for gym 1');
                      else { sel.value = opt.value; sel.dispatchEvent(new Event('change', { bubbles: true })); document.querySelector('[data-act=planset][data-k="gym:0"]').click();
                        const L0 = T(S.gyms[0].leader), uid = +opt.value.slice(1);
                        if (!L0.team.some(m => m.rid === uid) || !inLeague(0, () => planOf('gym:0'))) log.push('FAIL a plan set in the review week was not built'); else log.push('planned ' + L0.team.find(m => m.rid === uid).sp + ' for gym 1');
                        if (!/planned/.test(txt2())) log.push('FAIL the planned tag'); }
                      inLeague(0, () => { const P = plansState(); P.win = null; for (const k of planKeys()) { const h = planHolder(k); if (h) P.seen[k] = h.id; } }); go('plans');
                      const sel2 = document.querySelector('select.plansel[data-k="gym:1"][data-i="0"]'), opt2 = sel2 && [...sel2.options].find(o => o.value);
                      if (sel2 && opt2) { sel2.value = opt2.value; sel2.dispatchEvent(new Event('change', { bubbles: true })); const b = document.querySelector('[data-act=planset][data-k="gym:1"]');
                        if (!/next review/.test(b.textContent)) log.push('FAIL the plan button does not say it waits'); b.click();
                        if (!inLeague(0, () => planNext('gym:1')) || inLeague(0, () => planOf('gym:1'))) log.push('FAIL a plan set mid-quarter did not wait'); else log.push('a plan waits for the review');
                        const cb = document.querySelector('[data-act=planclear][data-k="gym:1"]'); if (!cb) log.push('FAIL no clear button'); else cb.click(); }
                      const st = document.querySelector('input.planstop'); if (!st) log.push('FAIL no review stop box'); else { st.checked = false; st.dispatchEvent(new Event('change', { bubbles: true })); if (!inLeague(0, () => plansState().off)) log.push('FAIL turning the review stop off'); st.checked = true; st.dispatchEvent(new Event('change', { bubbles: true })); } }
                    go('cities'); const rb = document.querySelector('[data-act=build][data-w=seat][data-k=ranch]'), c0 = inLeague(0, () => ranchCap());
                    if (!rb) log.push('FAIL no Ranch to build'); else { rb.click(); if (inLeague(0, () => ranchCap()) <= c0) log.push('FAIL building the Ranch'); else log.push('built the Ranch'); }
                    // 0.27.0: the region panel, a charter, a lane in a port (moving a gym there if needed) and its route, the safari
                    { S.fin.money = 400000; R().trips.length = 0; go('ranch'); const txt = () => document.querySelector('#main').textContent;
                      if (!/Pokémon/.test(txt()) || !/Charter from/.test(txt())) log.push('FAIL no region panel on the Ranch page');
                      { const b = document.querySelector('[data-act=ranchcharter]'), t0 = R().trips.length, m0 = S.fin.money; if (!b) log.push('FAIL no charter button'); else if (b.disabled) log.push('charter button disabled (trips out ' + R().trips.length + ')'); else { b.click(); if (R().trips.length !== t0 + 1 || S.fin.money !== m0 - 12000 || !R().trips.some(x => x.k === 'charter')) log.push('FAIL the charter'); else log.push('sent a charter'); } }
                      const opts = [...document.querySelectorAll('select.ranchspsel option')].map(o => o.value);
                      if (opts.some(b => !inLeague(0, () => tripOk(b)))) log.push('FAIL the trip list offers a line out of reach');
                      go('cities');
                      let li = inLeague(0, () => S.gyms.findIndex(g => isPort(S.cities[g.city])));
                      if (li < 0) { const port = inLeague(0, () => myPlaces().find(p => p.none && isPort(p.c))); if (port) { const sel = document.querySelector('#move-' + port.c.id), mb = document.querySelector('[data-act=movegym][data-c="' + port.c.id + '"]'); if (sel && mb) { sel.value = '0'; mb.click(); go('cities'); li = 0; log.push('moved a gym to ' + port.c.name); } } }
                      if (li >= 0) { inLeague(0, () => { cityB(S.cities[S.gyms[li].city]).length = 0; }); go('cities'); } // clear its slot for the lane
                      const lb = document.querySelector('[data-act=build][data-k=lane]');
                      if (li < 0) log.push('no port to build a lane in');
                      else if (!lb) { const why = inLeague(0, () => buildCheck(li, 'lane').why); if (/port/.test(why || '')) log.push('FAIL no lane to build in a port'); else log.push('no lane built: ' + why); }
                      else { const m0 = S.fin.money; lb.click(); const ln = inLeague(0, () => lanesOf()); if (!ln.length || S.fin.money !== m0 - 60000) log.push('FAIL building a lane'); else { log.push('built a lane in ' + ln[0].city.name);
                        go('ranch'); const sel = document.querySelector('select.lanesel'); if (!sel) log.push('FAIL no route picker'); else { const to = [...sel.options].map(o => +o.value).find(v => v !== ln[0].src), m1 = S.fin.money; sel.value = String(to); sel.dispatchEvent(new Event('change', { bubbles: true })); if (inLeague(0, () => lanesOf()[0].src) !== to || S.fin.money !== m1 - 10000) log.push('FAIL changing the route'); else log.push('changed the lane route'); } } }
                      go('cities'); const sb = document.querySelector('[data-act=build][data-k=safari]');
                      if (!sb) log.push('no safari to build (no free slot)'); else { const w = sb.dataset.w; sb.click(); if ([...document.querySelectorAll('[data-act=build][data-k=safari]')].some(x => x.dataset.w !== w)) log.push('FAIL a second safari offered'); else log.push('built a safari'); }
                      go('ranch'); if (/undefined|NaN|\[object/.test(txt())) log.push('FAIL the Ranch page shows undefined after the region steps'); }
                    S.fin.money = keep; go('ranch'); }
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
                // 0.22.0: title claims. Allow one (fought at once; a won claim seats the claimant and the old Champion
                // leaves the post), turn one down (recorded, prestige lost), and check the claim's wording and the tag
                if (S.season === 3 && seen.chal && !seen.claim) { seen.claim = 1; viewLg = 0; clearVac();
                  const h = S.history[S.history.length - 1], free = S.challengers.map(T).filter(t => t && t.rest != null && !t.spon && !t.hired && !t.hireDue && !t.leaving);
                  if (free.length < 2) log.push('FAIL no resting challengers to claim');
                  else { const [a, b] = free, champ0 = S.champion, n0 = (h.chal || []).length;
                    S.chalPending = [{ k: 'champ', cand: a.id, inc: champ0, slot: null, from: 'claim', gym: null, season: h.season, due: S.turn + 8 }]; a.claimOn = S.turn + 8;
                    go('staff'); const tx = document.querySelector('#main').textContent;
                    if (!/claims/.test(tx) || !/Allow the battle/.test(tx) || !/Turn it down/.test(tx)) log.push('FAIL a title claim is not in the staff notices');
                    click('[data-act=chalyes][data-v="0"]'); const rec = (h.chal || [])[n0];
                    if (!rec || rec.from !== 'claim' || rec.won == null) log.push('FAIL an allowed claim was not fought');
                    else if (rec.won ? S.champion !== a.id || T(champ0).role === 'champion' : S.champion !== champ0) log.push('FAIL the claim result did not move the right people');
                    const p0 = S.prest || 0, inc = S.champion;
                    S.chalPending = [{ k: 'champ', cand: b.id, inc, slot: null, from: 'claim', gym: null, season: h.season, due: S.turn + 8 }]; b.claimOn = S.turn + 8;
                    go('staff'); click('[data-act=chalno][data-v="0"]'); const r2 = (h.chal || [])[n0 + 1];
                    if ((S.chalPending || []).length || !r2 || !r2.refused || S.champion !== inc || T(b.id).grudge == null || (p0 >= 2 && (S.prest || 0) > p0 - 2 + 0.01)) log.push('FAIL turning down a claim');
                    repYear = h.season; go('recap'); if (!/title claim/.test(document.querySelector('#main').textContent) || !/turned down/.test(document.querySelector('#main').textContent)) log.push('FAIL claims not in the year report');
                    log.push('title claim: ' + (rec && rec.won ? 'claimant won' : 'defended') + ', one turned down'); repYear = null; go('circuit'); } }
                // 0.34.0: call a challenge against your Champion from Your staff, fight it at once and find it in the
                // year report; call another and call it off
                if (S.season === 3 && seen.claim && !seen.call) { seen.call = 1; viewLg = 0; clearVac(); S.chalPending = []; S.calls = null; const txt = () => document.querySelector('#main').textContent;
                  const h0 = S.history.length;
                  go('staff'); if (!/Call a challenge/.test(txt())) log.push('FAIL no Call a challenge panel');
                  click('[data-act=callopen]'); const btns = [...document.querySelectorAll('[data-act=callchal]')];
                  if (btns.length < 2) log.push('FAIL fewer than two challengers to call');
                  else { const id = +btns[0].dataset.id, champ0 = S.champion; btns[0].click();
                    const x = (S.chalPending || [])[0];
                    if (!x || !x.called || x.cand !== id || x.k !== 'champ') log.push('FAIL calling a challenge');
                    else { go('staff'); if (!/You called/.test(txt()) || !/Fight it now/.test(txt())) log.push('FAIL a called challenge is not in the staff notices');
                      click('[data-act=chalyes][data-v="0"]'); const rec = (S.league && S.league.chal || []).find(c => c.cand === id && c.called);
                      if ((S.chalPending || []).length || !rec || rec.won == null) log.push('FAIL a called challenge was not fought');
                      else if (rec.won ? S.champion !== id : S.champion !== champ0) log.push('FAIL the called challenge moved the wrong people');
                      go('staff'); click('[data-act=callopen]'); const b2 = [...document.querySelectorAll('[data-act=callchal]')].find(b => +b.dataset.id !== id && +b.dataset.id !== S.champion);
                      if (!b2) log.push('FAIL no second challenger to call'); else { b2.click(); go('staff'); click('[data-act=chalno][data-v="0"]');
                        if ((S.chalPending || []).length || !(S.league.chal || []).some(c => c.calledOff)) log.push('FAIL calling off a challenge');
                        if (S.calls.n !== 2) log.push('FAIL calls not counted'); }
                      log.push('called a challenge: ' + (rec && rec.won ? 'challenger won' : 'defended') + ', one called off'); } }
                  go('circuit'); }
                if (!seen.gymwatch && S.season >= 2) { go('gyms'); if (click('[data-act=watchgym]')) { seen.gymwatch = 1; if (!document.querySelector('.sheet-battle')) log.push('FAIL no gym battle replay'); else log.push('watched a badge conceded'); click('[data-act=bskip]'); click('[data-act=close]'); } go('circuit'); }
                if (!seen.repyear && S.history.length >= 2) { go('history'); const ls = document.querySelectorAll('#main [data-act=repyear]'); const old = ls[ls.length - 1];
                  if (!old) log.push('FAIL no year links on the History page'); else { const yv = old.dataset.v; old.click(); const tx = document.querySelector('#main').textContent;
                    if (view !== 'recap' || !tx.includes('Year ' + yv + ' report')) log.push('FAIL an earlier year report did not open');
                    if (![...document.querySelectorAll('#main .tbl')].some(tb => tb.querySelectorAll('tbody tr').length === 8 && tb.textContent.includes(townName(0)))) log.push('FAIL the year report has no row per gym'); // (0.21.0) found by its rows: other Leagues' tables come first from the start
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
          // 0.21.0: the progress board, drilled into a gym and the Champion, for your League and a rival; the Hall of Fame
          for (const lg of [0, 1]) { viewLg = lg; go('board');
            const rows = document.querySelectorAll('[data-act=boardrow]'); if (rows.length !== 13) log.push('FAIL the board does not list 13 stops');
            rows[0].click(); let tx = document.querySelector('#main').textContent; if (!/Here now/.test(tx) || !/Let through lately/.test(tx)) log.push('FAIL a gym did not open on the board');
            document.querySelector('[data-act=boardrow][data-v=champ]').click(); tx = document.querySelector('#main').textContent; if (!/Won the title lately/.test(tx)) log.push('FAIL the Champion did not open on the board');
            if (/undefined|NaN|\[object/.test(tx)) log.push('FAIL the board shows undefined'); }
          viewLg = 0;
          { const hofN = (S.hof || []).length, titles = eachLeague(() => S.history.reduce((a, h) => a + (h.titles || 0), 0) + ((S.league && S.league.conceded) || []).length).reduce((a, b) => a + b, 0);
            if (hofN !== titles) log.push('FAIL Hall entries ' + hofN + ' differ from titles ' + titles);
            go('hof'); const cards = document.querySelectorAll('.hofcard').length; if (hofN && !cards) log.push('FAIL no Hall cards');
            if (click('[data-act=watchhof]')) { if (!document.querySelector('.sheet')) log.push('FAIL the Hall title battle did not open'); click('[data-act=close]'); }
            log.push('hall: ' + hofN + ' entries, ' + cards + ' cards; memories ' + eachLeague(() => Object.keys(S.gmem || {}).length).join('/')); }
          if (S.history.length !== 3) log.push('FAIL history has ' + S.history.length + ' years after three');
          if (!/Year 4/.test(document.querySelector('header').textContent)) log.push('FAIL the header does not show the year');
          log.push('early stops: ' + stopsSeen + ' · field ' + S.challengers.length + ' · resting ' + S.challengers.filter(id => T(id).rest != null).length);
          // 0.17.0: contenders and leaving. Open a second League, send a contender from the Contenders page, check the
          // League table's prestige, then leave to found a League of your own and place its staff on the founding screen
          { openNewLeague(null); const n0 = nLeagues(), old = ME(); go('contenders'); let tx = document.querySelector('#main').textContent;
            if (!/Your contenders/.test(tx) || !/Send a contender/.test(tx)) log.push('FAIL the Contenders page');
            const b = [...document.querySelectorAll('[data-act=sendcon]')].find(x => !x.disabled);
            if (!b) log.push('FAIL nobody to send'); else { const id = +b.dataset.id; b.click(); const t = T(id); log.push('contender: ' + (t.spon ? (t.spon.pending ? 'goes after their run' : 'sent') : 'turned it down')); if (t.spon && !t.spon.pending && lgOf(t) !== 1) log.push('FAIL a contender sent at once is not on the other circuit'); }
            if (/undefined|NaN|\[object/.test(document.querySelector('#main').textContent)) log.push('FAIL the Contenders page shows undefined');
            go('table'); if (!/Prestige/.test(document.querySelector('#main').textContent)) log.push('FAIL the League table has no prestige');
            // 0.33.0: rename your League from the League table (rivals have no Rename without the setup option)
            { const bs = [...document.querySelectorAll('[data-act=lgrename]')];
              if (bs.length !== 1 || +bs[0].dataset.i !== ME()) log.push('FAIL Rename buttons on the League table: ' + bs.map(b => b.dataset.i));
              else { bs[0].click(); const inp = document.querySelector('#lgrenamein'); if (!inp) log.push('FAIL no rename field');
                else { inp.value = 'Sky Pillar League'; click('[data-act=lgrenamego]'); if (!/already a League/.test(document.querySelector('#main').textContent)) log.push('FAIL renamed to a name already taken');
                  document.querySelector('#lgrenamein').value = 'Renamed Home Cup'; click('[data-act=lgrenamego]');
                  if (leagueName(ME()) !== 'Renamed Home Cup' || !/Formerly the Browser Home Cup/.test(document.querySelector('#main').textContent)) log.push('FAIL renaming your League: ' + leagueName(ME())); } } }
            inLeague(ME(), () => { S.prest = PRESTIGE_BAR; S.fin.money = Math.max(S.fin.money, LEAVE_FEE + 50000); });
            go('money'); if (!click('[data-act=leaveask]')) log.push('FAIL no way to leave on the Money page');
            const cb = document.querySelector('.leavetake'); if (cb) { cb.checked = true; cb.dispatchEvent(new Event('change', { bubbles: true })); }
            if (!click('[data-act=leavego]')) log.push('FAIL no leave button');
            tx = document.querySelector('#app').textContent;
            if (!S.founding || ME() !== n0 || !/Place your staff/.test(tx) || document.querySelector('[data-act=foundquit]')) log.push('FAIL leaving did not open the founding screen');
            click('[data-act=foundfill]'); click('[data-act=foundgo]');
            if (S.founding || nLeagues() !== n0 + 1 || !inLeague(old, () => S.fin.aim)) log.push('FAIL the new League did not open, or the old one has no aim');
            go('staff'); if (!/Your staff/.test(document.querySelector('#main').textContent) || inLeague(ME(), () => S.champion == null)) log.push('FAIL the new League has no staff');
            for (let n = 0; n < 6; n++) click('[data-act=playweek]');
            log.push('left to found the ' + inLeague(ME(), () => S.lgName)); }
          // the sim dialog, one year
          click('[data-act=simmany]'); click('[data-act=simmanyn][data-v="1"]'); click('[data-act=simmanygo]');
          log.push('year ' + S.season + ' week ' + S.week + ' leagues ' + nLeagues() + ' ver ' + UPDATES[0].ver + ' key ' + SAVE_KEY);
          return log; }""")
        await pg.wait_for_timeout(4000)
        after = await pg.evaluate("""() => { const done = !!(modal && modal.done); document.querySelector('[data-act=simmanyclose]') && document.querySelector('[data-act=simmanyclose]').click(); save(); return { done, season: S.season, phase: S.phase, n: Object.keys(S.trainers).length }; }""")
        await pg.wait_for_timeout(1500)
        keys = await pg.evaluate("() => Object.keys(localStorage)")
        # 0.30.0: the save is in IndexedDB, not localStorage
        idb = await pg.evaluate("""() => new Promise(res => { const rq = indexedDB.open('plb-save-db'); rq.onsuccess = () => { try { const g = rq.result.transaction('save').objectStore('save').get('world'); g.onsuccess = () => res(g.result ? { v: g.result.v, bytes: g.result.z ? g.result.z.length : -1 } : null); g.onerror = () => res(null); } catch (e) { res(null); } }; rq.onerror = () => res(null); })""")
        await pg.reload(); await pg.wait_for_timeout(1500)
        back = await pg.evaluate("() => S ? { season: S.season, phase: S.phase, n: Object.keys(S.trainers).length, view } : null")
        if not after['done']: out.append('FAIL the sim dialog did not finish')
        if not back or back['season'] != after['season'] or back['n'] != after['n']: out.append('FAIL the save did not come back after a reload: %s vs %s' % (back, after))
        if any(k.startswith('plgm') or 'league-gm' in k for k in keys) or 'plb-save' in keys: out.append('FAIL storage keys: %s' % keys)
        if not idb or idb['bytes'] < 1000: out.append('FAIL no save in IndexedDB: %s' % idb)
        out.append('after sim %s · reloaded %s · keys %s · IndexedDB %s' % (after, back, keys, idb))
        await pg.screenshot(path='/tmp/shot.png')
        # the itch.io build loads its data from a second file
        await b.close()
    print(json.dumps(out, indent=0, ensure_ascii=False)[:4000])
    bad = [x for x in out if x.startswith('FAIL')]
    print('FAILS', len(bad), 'ERRORS', len(errs)); [print(e[:300]) for e in errs[:10]]
    sys.exit(1 if bad or errs else 0)
asyncio.run(run(sys.argv[1]))
