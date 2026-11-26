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
          const pickNow = () => { const b = [...document.querySelectorAll('[data-act=hirepick]')].find(b => !/^(Circuit|Another circuit|Region's field)/.test(b.closest('tr').children[1].textContent) && !/Gym Leader ·|Elite Four #/.test(b.closest('tr').textContent)); if (b) { b.click(); return true; } return false; };
          const log = [], click = sel => { const el = document.querySelector(sel); if (el) { el.click(); return true; } return false; };
          if (!document.querySelector('[data-act=newworld]')) log.push('FAIL no region cards on the setup screen');
          if (!/Pokémon League Builder/.test(document.title + document.body.textContent)) log.push('FAIL the name is missing');
          // setup pages
          for (const pg of ['advanced', 'main']) { click(`[data-act=setuppage][data-v=${pg}]`); if (!document.querySelector('main')) log.push('FAIL setup page ' + pg); }
          click('[data-act=updates]'); click('[data-act=nav]');
          click('[data-act=setgod][data-v="1"]');
          // 0.21.0: three starting Leagues by default (the option is pressed anyway)
          if ((document.querySelector('.setleaguesn') || {}).textContent !== '3') log.push('FAIL Starting Leagues does not default to 3');
          // 0.30.0: the stepper goes to the world's full room (0.41.0: four a region), with the speed estimate warning on big worlds
          for (let n = 0; n < 40; n++) click('[data-act=setleagues][data-v="' + (+document.querySelector('.setleaguesn').textContent + 1) + '"]');
          if (document.querySelector('.setleaguesn').textContent !== '36') log.push('FAIL Starting Leagues stops at ' + document.querySelector('.setleaguesn').textContent + ', not 36');
          if (!document.querySelector('.speed-est.red')) log.push('FAIL no warning for a 36-League world');
          while (+document.querySelector('.setleaguesn').textContent > 3) click('[data-act=setleagues][data-v="' + (+document.querySelector('.setleaguesn').textContent - 1) + '"]');
          if (!document.querySelector('.speed-est') || document.querySelector('.speed-est.amber, .speed-est.red')) log.push('FAIL the speed estimate for three Leagues');
          // 0.55.0: the growth pace (8 by default, 12 picked) and Leagues can open in new regions (on by default; off and back on)
          if (!document.querySelector('[data-act=setpace][data-v="8"].on')) log.push('FAIL the growth pace does not default to 8');
          click('[data-act=setpace][data-v="12"]'); if (!document.querySelector('[data-act=setpace][data-v="12"].on')) log.push('FAIL could not pick a 12-year pace');
          click('[data-act=setuppage][data-v=advanced]');
          // (0.57.0) the famous share: Normal by default, the steps pick, and back to Normal for the rest of the test
          if (!document.querySelector('[data-act=setfam][data-v="0"].on')) log.push('FAIL the famous share does not default to Normal');
          click('[data-act=setfam][data-v="75"]'); if (!document.querySelector('[data-act=setfam][data-v="75"].on') || document.querySelector('[data-act=setfam][data-v="0"].on')) log.push('FAIL could not pick a 75% famous share');
          click('[data-act=setfam][data-v="0"]');
          { const nr = () => document.querySelector('[data-act=advtoggle][data-k=newRegions]'); if (!nr() || nr().getAttribute('aria-checked') !== 'true') log.push('FAIL Leagues can open in new regions is not on by default');
            else { click('[data-act=advtoggle][data-k=newRegions]'); if (nr().getAttribute('aria-checked') !== 'false') log.push('FAIL new regions did not switch off'); click('[data-act=advtoggle][data-k=newRegions]'); } }
          click('[data-act=setuppage][data-v=main]');
          // Advanced: rival 2 starts in Hoenn, the region this test picks for the player's League
          click('[data-act=setuppage][data-v=advanced]');
          { const sels = document.querySelectorAll('.rivalsel'); if (sels.length !== 2) log.push('FAIL the rival picker lists ' + sels.length + ' rivals'); else { sels[1].value = '2'; sels[1].dispatchEvent(new Event('change', { bubbles: true })); } }
          // 0.33.0: rival 1 is named here; rival 2 keeps its seat's default
          { const inp = document.querySelector('.rivalname[data-i="1"]'); if (!inp) log.push('FAIL no name field for rival 1'); else { inp.value = 'Browser Rival Cup'; inp.dispatchEvent(new Event('input', { bubbles: true })); } }
          // 0.42.0: rival 1's theme
          { const sel = document.querySelector('.rivaltheme[data-i="0"]'); if (!sel) log.push('FAIL no theme picker for rival 1'); else { sel.value = 'board'; sel.dispatchEvent(new Event('change', { bubbles: true })); } }
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
          // 0.42.0: your League's posts: the Dojo theme fills the fields, then the Champion's is typed over
          { const sel = document.querySelector('#setposttheme'); if (!sel) log.push('FAIL no theme picker for your League');
            else { sel.value = 'dojo'; sel.dispatchEvent(new Event('change', { bubbles: true }));
              const f = document.querySelector('.setpost[data-k="e4"]'); if (!f || f.value !== 'Grandmasters') log.push('FAIL the theme did not fill the fields: ' + (f && f.value));
              const c = document.querySelector('.setpost[data-k="champion"]'); if (c) { c.value = 'Grand Sensei'; c.dispatchEvent(new Event('input', { bubbles: true })); } } }
          // 0.43.0: the seat rule picker: Term shows the timing field; back to Protected for the called-challenge steps
          { let sel = document.querySelector('#setseatrule'); if (!sel) log.push('FAIL no seat rule picker at setup');
            else { sel.value = 'term'; sel.dispatchEvent(new Event('change', { bubbles: true }));
              if (!document.querySelector('#setseatevery')) log.push('FAIL no timing field for a scheduled seat rule');
              // 0.46.0: the Conqueror shows its timing (Instant or At New Year)
              sel = document.querySelector('#setseatrule'); sel.value = 'conqueror'; sel.dispatchEvent(new Event('change', { bubbles: true }));
              let cn = document.querySelector('#setseatevery-now'); if (!cn) log.push('FAIL no timing for the Conqueror');
              else { cn.value = '1'; cn.dispatchEvent(new Event('change', { bubbles: true })); cn = document.querySelector('#setseatevery-now'); if (!cn || cn.value !== '1') log.push('FAIL the Conqueror timing did not take Instant'); }
              sel = document.querySelector('#setseatrule'); sel.value = 'protected'; sel.dispatchEvent(new Event('change', { bubbles: true }));
              if (document.querySelector('#setseatevery')) log.push('FAIL a timing field for Protected'); } }
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
          S.cfg.instantBuild = true; // 0.72.0: your builds finish at once for the scripted steps (the build-times step turns it off)
          if (S.cfg.pace !== 12 || S.cfg.newRegions !== true) log.push('FAIL the world did not keep the growth pace and new regions: ' + S.cfg.pace + ' ' + S.cfg.newRegions);
          { const rg = eachLeague(() => S.region), nm = eachLeague(() => S.lgName); if (nLeagues() !== 3 || rg[0] !== 2 || rg[2] !== 2 || rg[1] === 2 || nm[2] !== 'Sky Pillar League' || nm[0] !== 'Browser Home Cup' || nm[1] !== 'Browser Rival Cup') log.push('FAIL the world did not start with the placed rival beside the player: ' + rg + ' ' + nm); }
          // 0.41.0: the regional field: the Circuit page shows the whole region's field (both Hoenn Leagues), the League
          // table each League's challengers and share
          { go('circuit'); if (!click('[data-act=circscope][data-v=region]')) log.push('FAIL no region field toggle on the Circuit page');
            else { const rows = document.querySelectorAll('#main table.tbl tbody tr').length; if (rows !== fieldSize(S.region)) log.push('FAIL the region field lists ' + rows + ' of ' + fieldSize(S.region));
              if (!/The region's field: /.test(document.querySelector('#main').textContent)) log.push('FAIL no region field summary'); click('[data-act=circscope][data-v=lg]');
              if (document.querySelectorAll('#main table.tbl tbody tr').length !== S.challengers.length) log.push('FAIL back to this League'); }
            go('table'); if (!/Challengers/.test(document.querySelector('#main').textContent)) log.push('FAIL the League table has no Challengers column');
            if (!/(Bold|Steady|Tight) bidder/.test(document.querySelector('#main').textContent)) log.push('FAIL the League table shows no rival bidding temper');
            log.push('region field ' + fieldSize(S.region) + ' of ' + fieldTarget(S.region) + ', yours ' + S.challengers.length); }
          const views = ['circuit', 'board', 'gyms', 'news', 'history', 'posts', 'records', 'hof', 'dex', 'trainers', 'recap', 'god', 'updates', 'hire', 'staff', 'meta', 'money', 'cities', 'ranch', 'plans'];
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
                    go('trainers');
                    // 0.49.0: the Trainers page shows 50 a page; Everyone has more than 50, so Next and Last work
                    { const rows = () => document.querySelectorAll('#trres table.trainers tbody tr').length;
                      click('[data-act=trscope][data-v=all]');
                      if (rows() > 50) log.push('FAIL the Trainers page shows ' + rows() + ' rows');
                      if (!click('[data-act=trpage][data-v="1"]:not([disabled])')) log.push('FAIL no Next page on the Trainers page');
                      else { if (trPage !== 1 || !/Page 2 of/.test(document.querySelector('#trres').textContent)) log.push('FAIL the Trainers page did not turn');
                        const last = document.querySelectorAll('[data-act=trpage]')[3]; last.click(); if (rows() < 1 || rows() > 50) log.push('FAIL the last Trainers page');
                        click('[data-act=trscope][data-v=active]'); if (trPage !== 0) log.push('FAIL a filter did not go back to page 1');
                        log.push('trainer pages ok'); } }
                    // 0.49.0: post holders, by year and by post, for your League and a rival
                    { go('posts'); const m = () => document.querySelector('#main');
                      const rows = m().querySelectorAll('table.phtbl tbody tr').length, cols = m().querySelectorAll('table.phtbl thead th').length;
                      if (rows !== S.history.length + 1 || cols !== 14) log.push('FAIL post holders by year: ' + rows + ' rows, ' + cols + ' columns');
                      if (!m().querySelector('table.phtbl tbody tr.sel [data-act=profile]')) log.push('FAIL post holders: no current Champion');
                      click('[data-act=postsmode][data-v=post]'); if (m().querySelectorAll('.phpost').length !== 13 || /undefined|NaN/.test(m().textContent)) log.push('FAIL post holders by post');
                      if (nLeagues() > 1) { click('[data-act=lgview][data-v="1"]'); if (!m().querySelectorAll('.phpost').length) log.push('FAIL post holders for a rival'); click('[data-act=lgview][data-v="0"]'); }
                      click('[data-act=postsmode][data-v=year]'); log.push('post holders ok'); } }
                  // 0.52.0: contracts. Three Elite Four contracts put in their renewal window: renew a content one and a restless
                  // one (more pay) from Your staff, see one who won't renew; mark a gym trainer to go and back; the length picker
                  { const ids = S.e4.slice(0, 3), ts = ids.map(T), m = () => document.querySelector('#main').textContent;
                    if (ts.some(t => !t || !t.con)) log.push('FAIL an Elite Four member has no contract');
                    else { ts.forEach((t, k) => { t.quit = null; t.con = { post: 'e4', len: 48, from: S.turn - 46, until: S.turn + 2, win: S.turn, will: ['yes', 'more', 'no'][k] }; });
                      go('staff'); if (!/Contracts up for renewal/.test(m()) || !/Won't renew/.test(m()) || !/Asks \+25% to renew/.test(m())) log.push('FAIL the staff page does not show contracts up for renewal');
                      const u0 = ts[0].con.until; if (!click('[data-act=conrenew][data-id="' + ids[0] + '"][data-v="96"]') || ts[0].con.until !== u0 + 96 || ts[0].con.from !== u0) log.push('FAIL renewing a contract');
                      const p0 = inLeague(0, () => payOf(ts[1])); if (!click('[data-act=conrenew][data-id="' + ids[1] + '"][data-v="48"]') || inLeague(0, () => payOf(ts[1])) < p0 * 1.2) log.push('FAIL renewing a restless member for more');
                      if (document.querySelector('[data-act=conrenew][data-id="' + ids[2] + '"]')) log.push('FAIL a renew button for someone who will not renew');
                      if (/undefined|NaN/.test(m())) log.push('FAIL the staff page shows undefined after renewing');
                      log.push('renewed contracts'); }
                    const gid = S.gyms[1].trainers[0], gt = T(gid);
                    if (!gt || !gt.con) log.push('FAIL a gym trainer has no contract');
                    else { go('staff'); click('[data-act=congo][data-id="' + gid + '"]'); const on = gt.con.go; click('[data-act=congo][data-id="' + gid + '"]'); if (!on || gt.con.go) log.push('FAIL marking a gym trainer to go'); }
                    go('staff'); click('[data-act=gtpick][data-g="1"][data-k="0"]');
                    if (!document.querySelector('.conlen') || !/Prefers/.test(m())) log.push('FAIL the gym trainer picker has no contract length');
                    else { click('[data-act=hirelen][data-v="24"]'); if (hireLen !== 24 || !/6 months/.test(document.querySelector('.conlen .seg.on').textContent)) log.push('FAIL picking a contract length'); click('[data-act=hirelen][data-v=""]'); if (hireLen != null) log.push('FAIL going back to their preference'); }
                    go('staff'); }
                  // 0.53.0: talks. Open talks for a challenger, make an offer from the Talks page (post, pay, bonus, a promise),
                  // withdraw and offer again, settle it; a rival goes after a Gym Leader: let them go for the transfer fee
                  { const m = () => document.querySelector('#main'), set = (k, f, v) => { const el = m().querySelector('.talkf[data-k="' + k + '"][data-f="' + f + '"]' + (f === 'prom' ? '[data-v="' + v + '"]' : '')); if (!el) return false; if (f === 'prom') el.checked = true; else el.value = String(v); el.dispatchEvent(new Event('change', { bubbles: true })); return true; };
                    const c = inLeague(0, () => challengers().find(t => t && canTalk(t) && t.rest != null && willSign(t, 0))); // (0.69.0) one who will sign for you (a low-prestige League failed now and then)
                    const k = c && inLeague(0, () => openTalks(c, 'star', null, 'a test'));
                    if (!k) log.push('FAIL could not open talks');
                    else { go('talks'); if (!m().querySelector('.talk[data-talk="' + k.id + '"]') || /undefined|NaN/.test(m().textContent)) log.push('FAIL the Talks page does not show the talks');
                      const vac = inLeague(0, () => S.e4.findIndex(id => T(id) && !T(id).acting));
                      set(k.id, 'post', 'e4:' + vac); set(k.id, 'bid', 0.75); set(k.id, 'bonus', 24); set(k.id, 'prom', 'nodemote');
                      if (!click('[data-act=talkoffer][data-k="' + k.id + '"]')) log.push('FAIL no offer button');
                      const o = k.offers.find(x => x.lg === 0);
                      if (!o || o.post !== 'e4' || o.slot !== vac || o.bid !== 0.75 || o.bonus !== 24 || !o.prom.includes('nodemote')) log.push('FAIL the offer was not made as set: ' + JSON.stringify(o));
                      else { if (!/Your offer/.test(m().textContent) || !/Leading|Behind/.test(m().textContent)) log.push('FAIL the Talks page does not show your offer');
                        click('[data-act=talkwd][data-k="' + k.id + '"]'); if (k.offers.some(x => x.lg === 0)) log.push('FAIL withdrawing an offer');
                        set(k.id, 'post', 'e4:' + vac); set(k.id, 'bid', 0.75); set(k.id, 'bonus', 24); set(k.id, 'prom', 'nodemote'); click('[data-act=talkoffer][data-k="' + k.id + '"]');
                        k.offers = k.offers.filter(x => x.lg === 0); k.until = S.turn; c.age = 40; const m0 = S.fin.money, bonus = inLeague(0, () => talkBonus(c, k.offers[0])), old = T(S.e4[vac]);
                        talksWeek(); if (talkList().includes(k) || c.talk != null) log.push('FAIL the talks did not end at the deadline');
                        else if (c.role === 'e4' && S.e4[vac] === c.id) { if (S.fin.money > m0 - bonus || !promOn(c, 'nodemote', 0) || (old && old.role === 'e4' && S.e4.includes(old.id))) log.push('FAIL signing after talks: bonus, promise or the old holder'); else log.push('signed after talks');
                          // 0.56.0: the result is recorded and shown on the Talks page (Won, marked new, then seen)
                          const r = (S.talkDone || [])[0]; if (!r || r.id !== k.id || r.res !== 'won' || r.seen) log.push('FAIL no Won result after signing in talks');
                          else { go('talks'); const li = m().querySelector('.talkreslist li.won'); if (!li || !/Won/.test(li.textContent) || !r.seen || /undefined|NaN/.test(li.textContent)) log.push('FAIL the Talks page does not show the Won result'); else log.push('talks result shown'); } }
                        else log.push('talks ended without signing (' + c.role + ')'); } }
                    if (nLeagues() > 1) { const L = inLeague(0, () => S.gyms.map(g => T(g.leader)).reverse().find(t => t && !t.acting && canTalk(t))); // the last gyms: later steps use gym 1
                      const kp = L && inLeague(0, () => openTalks(L, 'poach', 0));
                      if (kp) { inLeague(1, () => { S.prest = Math.max(S.prest || 0, 100); if (S.fin) S.fin.money = Math.max(S.fin.money, 500000); }); const err = makeOffer(kp, { lg: 1, post: 'e4', slot: 0, bid: 0.25, bonus: 12, len: 96, prom: [] });
                        if (err) { closeTalk(kp); log.push('retention skipped: ' + err); }
                        else { go('talks'); if (!m().querySelector('[data-act=talklet][data-id="' + L.id + '"]')) log.push('FAIL no Let them go button');
                          const t0 = (S.fin.yr && S.fin.yr.in.transfers) || 0; click('[data-act=talklet][data-id="' + L.id + '"]');
                          if (homeLeague(L) !== 1 || L.role !== 'e4' || !(((S.fin.yr && S.fin.yr.in.transfers) || 0) > t0)) log.push('FAIL letting a Gym Leader go to a rival in talks'); else if (!(S.talkDone || []).some(x => x.tid === L.id && x.res === 'released')) log.push('FAIL no Let go result'); else log.push('retention let go');
                          inLeague(0, fillAllVacancies); } } }
                    go('staff'); }
                  // 0.63.0: city sizes, the seat's Stadium (its base levels can't be sold), a Hotel and a Berry Farm from the Cities page, the Farm's plots set
                  { S.fin.money = 200000; go('cities'); const main = document.querySelector('#main').textContent;
                    if (!/Town|City|Metropolis/.test(main) || !/Visitors/.test(main) || !/Stadium/.test(main)) log.push('FAIL the Cities page shows no size, visitors or Stadium');
                    if (document.querySelector('[data-act=sellb][data-w=seat][data-k=stadium]')) log.push('FAIL the seat Stadium offered for sale');
                    const hb = document.querySelector('[data-act=build][data-w="1"][data-k=hotel]'), m3 = S.fin.money;
                    if (!hb) log.push('FAIL no Hotel to build'); else { hb.click(); if (inLeague(0, () => placeLv(1, 'hotel')) !== 1 || S.fin.money !== m3 - 20000) log.push('FAIL building a Hotel'); else log.push('built a Hotel'); }
                    go('cities'); const fb = document.querySelector('[data-act=build][data-w="2"][data-k=berry]'), m4 = S.fin.money;
                    if (!fb) log.push('FAIL no Berry Farm to build'); else { fb.click(); if (inLeague(0, () => placeLv(2, 'berry')) !== 1 || S.fin.money !== m4 - 15000) log.push('FAIL building a Berry Farm'); else log.push('built a Berry Farm'); }
                    go('cities'); const sel = document.querySelector('select.berryfeed');
                    if (!sel) log.push('FAIL no Berry Farm plot picker'); else { sel.value = '1'; sel.dispatchEvent(new Event('change', { bubbles: true })); const f = inLeague(0, () => berryFarms())[0]; if (!f || f.feed !== 1) log.push('FAIL setting Berry Farm plots'); else log.push('set Berry Farm plots'); }
                    if (!inLeague(0, () => buildCheck('seat', 'hotel')).why) log.push('FAIL a Hotel allowed at the seat');
                    inLeague(0, () => { sellBuilding(1, 'hotel'); sellBuilding(2, 'berry'); }); S.fin.money = 200000; } // their slots back for the later steps
                  // 0.72.0: build times: with instant builds off, a Hotel's button shows its weeks, the build waits (level unchanged), shows on the page, and calling it off gives half back
                  { S.cfg.instantBuild = false; S.fin.money = 200000; go('cities'); const hb = document.querySelector('[data-act=build][data-w="1"][data-k=hotel]'), m5 = S.fin.money;
                    if (!hb) log.push('FAIL no Hotel to build for the build-times step'); else { if (!/wk/.test(hb.textContent)) log.push('FAIL no build time on a build button'); hb.click(); go('cities');
                      const cb = document.querySelector('[data-act=cancelbuild][data-w="1"][data-k=hotel]');
                      if (inLeague(0, () => placeLv(1, 'hotel')) !== 0 || !cb || S.fin.money !== m5 - 20000 || !/Building/.test(document.querySelector('#main').textContent)) log.push('FAIL a timed build not waiting');
                      else { cb.click(); if (S.fin.money !== m5 - 10000 || inLeague(0, () => pendingAt(1, 'hotel'))) log.push('FAIL calling a build off'); else log.push('a timed build waited and was called off'); } }
                    S.cfg.instantBuild = true; S.fin.money = 200000; }
                  // 0.64.0: a Trainer's School, a Move Tutor at the seat, a Research Lab and a Department Store from the Cities page; an item bought into the bag
                  { S.fin.money = 300000; const bld = (w, k, cost, lv) => { go('cities'); const b = document.querySelector(`[data-act=build][data-w="${w}"][data-k=${k}]`), m0 = S.fin.money; if (!b) { log.push('FAIL no ' + k + ' to build'); return; } b.click(); if (inLeague(0, () => placeLv(w, k)) !== lv || S.fin.money !== m0 - cost) log.push('FAIL building a ' + k); else log.push('built a ' + k); };
                    bld(3, 'school', 15000, 1); bld('seat', 'tutor', 20000, 1); bld(4, 'lab', 25000, 1); bld(5, 'store', 15000, 1); bld(5, 'store', 30000, 2);
                    if (!inLeague(0, () => buildCheck(0, 'hall')).why) log.push('FAIL a training hall allowed in a gym city');
                    go('cities'); if (!/Item bag/.test(document.querySelector('#main').textContent)) log.push('FAIL no item bag on the Cities page');
                    const ib = document.querySelector('[data-act=buyitem][data-k=leftovers]'), m5 = S.fin.money, n5 = inLeague(0, () => bagOf().leftovers || 0), pr = inLeague(0, () => itemPrice('leftovers'));
                    if (!ib) log.push('FAIL no Leftovers on sale'); else { ib.click(); if (inLeague(0, () => bagOf().leftovers) !== n5 + 1 || S.fin.money !== m5 - pr) log.push('FAIL buying Leftovers'); else log.push('bought Leftovers'); }
                    if (document.querySelector('[data-act=buyitem][data-k=lifeorb]')) log.push('FAIL a 4F item on sale from a 2-floor Store');
                    const free = inLeague(0, () => staffIds().map(T).some(t => t && t.team.some(m => m.item && ITEMS[m.item].tier >= 2 && m.bagLg !== 0)));
                    if (free) log.push('FAIL a free tier 2-3 item on your staff');
                    inLeague(0, () => { sellBuilding(3, 'school'); sellBuilding('seat', 'tutor'); sellBuilding(4, 'lab'); sellBuilding(5, 'store'); sellBuilding(5, 'store'); }); S.fin.money = 200000; }
                  // 0.65.0: an Airport in a gym city made a City (a route changed from its picker), a Research Lab to level 2 then a
                  // Fossil Lab beside it, the keep grade set, a Contest refused without its condition
                  { S.fin.money = 900000; const bld = (w, k, cost, lv) => { go('cities'); const b = document.querySelector(`[data-act=build][data-w="${w}"][data-k=${k}]`), m0 = S.fin.money; if (!b) { log.push('FAIL no ' + k + ' to build'); return false; } b.click(); if (inLeague(0, () => placeLv(w, k)) !== lv || S.fin.money !== m0 - cost) { log.push('FAIL building a ' + k); return false; } log.push('built a ' + k); return true; };
                    if (!inLeague(0, () => buildCheck(6, 'airport')).why) log.push('FAIL an Airport allowed in a Town');
                    // (0.68.0) Stadium add-ons: a Home stand at the seat (its Stadium starts at level 2), a Video room refused there, the add-on line on the page
                    if (!inLeague(0, () => buildCheck('seat', 'video')).why) log.push('FAIL a Video room allowed below Stadium level 3');
                    if (bld('seat', 'stand', 20000, 1)) { go('cities'); if (!/Home stand<\/b> level 1/.test(document.querySelector('#main').innerHTML) || !/at a full house/.test(document.querySelector('#main').textContent)) log.push('FAIL the Home stand line on the Cities page'); if (!(inLeague(0, () => homeEdge('seat')) > 1)) log.push('FAIL the Home stand gives no edge'); }
                    { const c = S.cities[S.gyms[6].city]; c.spent = c.spent || {}; c.spent[0] = (c.spent[0] || 0) + 100000; }
                    if (bld(6, 'airport', 150000, 1)) { const a = inLeague(0, () => airportAt(0)); if (!a || a.routes.length !== 1) log.push('FAIL a new Airport without a route');
                      go('cities'); const sel = document.querySelector('select.airsel'), m1 = S.fin.money, to = [...sel.options].map(o => +o.value).find(r => r !== a.routes[0]);
                      if (!sel) log.push('FAIL no Airport route picker'); else { sel.value = String(to); sel.dispatchEvent(new Event('change', { bubbles: true })); if (inLeague(0, () => airRoutes())[0] !== to || S.fin.money !== m1 - 25000) log.push('FAIL changing the Airport route'); else log.push('changed the Airport route'); }
                      if (!inLeague(0, () => buildCheck(7, 'airport')).why) log.push('FAIL a second Airport allowed'); }
                    // (0.69.0) the Weather Institute in the gym city made a City: refused in a Town, a seat field from its picker,
                    // an off-type field refused at level 1, any field held at level 2, then sold back
                    if (!inLeague(0, () => buildCheck(7, 'wx')).why && inLeague(0, () => citySize(S.cities[S.gyms[7].city])) < 1) log.push('FAIL a Weather Institute allowed in a Town');
                    if (bld(6, 'wx', 50000, 1)) { go('cities'); const sel = document.querySelector('select.wxsel[data-w=seat]');
                      if (!sel) log.push('FAIL no field picker'); else { const v = [...sel.options].map(o => o.value).find(x => x && x !== 'clear') || 'clear'; sel.value = v; sel.dispatchEvent(new Event('change', { bubbles: true })); if (inLeague(0, () => fieldPick('seat')) !== v) log.push('FAIL setting the seat field'); else log.push('set the seat field to ' + v); }
                      const off = inLeague(0, () => { if (wxClassOn()) return null; for (let i = 0; i < 8; i++) { const k = FIELD_KEYS.find(f => !fieldOpts(i).includes(f)); if (k) return [i, k]; } return null; });
                      if (off && !inLeague(0, () => setField(off[0], off[1]))) log.push('FAIL an off-type field taken at level 1');
                      if (bld(6, 'wx', 100000, 2)) { if (inLeague(0, () => setField(0, 'mterr'))) log.push('FAIL any field refused at level 2'); const f = inLeague(0, () => fieldOf(0)); if (!f || f.t !== 'Fairy' || !f.lock || f.w) log.push('FAIL the level 2 field'); else log.push('Misty Terrain held at gym 1');
                        go('cities'); if (!/Misty Terrain/.test(document.querySelector('#main').textContent)) log.push('FAIL the field not shown on the Cities page'); }
                      inLeague(0, () => { sellBuilding(6, 'wx'); sellBuilding(6, 'wx'); }); }
                    // (0.70.0) a Game Corner in the same City (refused in a Town first), a prize taken from its counter on the Cities
                    // page (the price, the ranch and the Sold mark), then sold back
                    if (!inLeague(0, () => buildCheck(7, 'corner')).why && inLeague(0, () => citySize(S.cities[S.gyms[7].city])) < 1) log.push('FAIL a Game Corner allowed in a Town');
                    if (bld(6, 'corner', 40000, 1)) { inLeague(0, () => { if (ranchRoom() <= 0) S.ranch.mons.splice(S.ranch.mons.findIndex(e => e.at == null), 1); });
                      go('cities'); const x = inLeague(0, () => cityB(S.cities[S.gyms[6].city]).find(y => y.k === 'corner')), pb = document.querySelector('[data-act=cornerbuy][data-g="6"]');
                      if (!x || !x.prize || x.prize.length !== 2) log.push('FAIL a new Game Corner without its two prizes'); else if (!pb) log.push('FAIL no Game Corner prize button');
                      else { const i = +pb.dataset.i, q = x.prize[i], m0 = S.fin.money, n0 = S.ranch.mons.length; pb.click();
                        if (!q.sold || S.fin.money !== m0 - q.price || S.ranch.mons.length !== n0 + 1 || S.ranch.mons[S.ranch.mons.length - 1].b !== q.b) log.push('FAIL taking a Game Corner prize'); else log.push('took ' + q.b + ' from the Game Corner');
                        go('cities'); if (!/Game Corner<\/b> level 1/.test(document.querySelector('#main').innerHTML) || document.querySelector(`[data-act=cornerbuy][data-g="6"][data-i="${i}"]`)) log.push('FAIL the Game Corner line after taking a prize'); }
                      inLeague(0, () => sellBuilding(6, 'corner')); }
                    // (0.71.0) a Bank at gym 6 (refused at the seat): its grace, a loan from the form (money and payment), paid off
                    // from its button, a spell in the red its grace holds up; a Fan Club beside it, its line on the page; both sold back
                    if (!inLeague(0, () => buildCheck('seat', 'bank')).why) log.push('FAIL a Bank allowed at the seat');
                    if (bld(5, 'bank', 40000, 1)) { if (inLeague(0, () => graceLeft()) !== 4) log.push('FAIL a new Bank without its grace');
                      go('cities'); const amt = document.querySelector('#bankamt'), bb = document.querySelector('[data-act=bankborrow]');
                      if (!amt || !bb) log.push('FAIL no Bank borrow form'); else { amt.value = '10000'; document.querySelector('#bankterm').value = '48'; const m0 = S.fin.money, tm = inLeague(0, () => loanTerms(10000, 48)); bb.click();
                        const L = S.fin.bank && S.fin.bank.loan; if (!L || S.fin.money !== m0 + 10000 || L.owed !== tm.total || L.pay !== tm.pay) log.push('FAIL borrowing from the Bank'); else log.push('borrowed 10000 from the Bank');
                        go('cities'); const po = document.querySelector('[data-act=bankpayoff]'), m1 = S.fin.money, ow = L ? L.owed : 0; if (!po) log.push('FAIL no Pay it off button'); else { po.click(); if (S.fin.bank.loan || S.fin.money !== m1 - ow) log.push('FAIL paying off the loan'); else log.push('paid off the loan'); } }
                      const keep = S.fin.money; S.fin.money = -5000; if (inLeague(0, () => lapsed())) log.push('FAIL lapsed during the Bank grace'); go('cities'); if (!/grace keeps every building working/.test(document.querySelector('#main').textContent)) log.push('FAIL no grace note on the Cities page'); S.fin.money = keep;
                      inLeague(0, () => sellBuilding(5, 'bank')); }
                    if (bld(5, 'fanclub', 15000, 1)) { go('cities'); if (!/Fan Club<\/b> level 1/.test(document.querySelector('#main').innerHTML) || !/members \(a loyal core/.test(document.querySelector('#main').textContent)) log.push('FAIL the Fan Club line on the Cities page'); inLeague(0, () => sellBuilding(5, 'fanclub')); }
                    bld(4, 'lab', 25000, 1); if (!inLeague(0, () => buildCheck(4, 'fossil')).why) log.push('FAIL a Fossil Lab allowed beside a level 1 Lab');
                    bld(4, 'lab', 50000, 2); bld(4, 'fossil', 30000, 1);
                    go('cities'); const kg = document.querySelector('select.keepgsel[data-k=fossil]');
                    if (!kg) log.push('FAIL no keep grade picker'); else { kg.value = '3'; kg.dispatchEvent(new Event('change', { bubbles: true })); if (inLeague(0, () => keepGrade('fossil')) !== 3) log.push('FAIL setting the keep grade');
                      else { const k2 = document.querySelector('select.keepgsel[data-k=fossil]'); k2.value = '0'; k2.dispatchEvent(new Event('change', { bubbles: true })); if (inLeague(0, () => keepGrade('fossil')) !== Math.max(1, inLeague(0, () => ranchRules().floor))) log.push('FAIL a keep grade back to the League floor'); else log.push('set the keep grade'); } }
                    // 0.66.0: the ranch rules from the Pool tab (the floor, idle clear-out), then make room and the floor on a full ranch
                    { go('ranch'); ranchTab = 'pool'; render(); const fl = document.querySelector('select.rrf[data-f=floor]'), ic = document.querySelector('input.rrf[data-f=idle]');
                      if (!fl || !ic) log.push('FAIL no ranch rules panel'); else { fl.value = '3'; fl.dispatchEvent(new Event('change', { bubbles: true })); document.querySelector('input.rrf[data-f=idle]').click();
                        const r = inLeague(0, () => ranchRules()); if (r.floor !== 3 || !r.idle || !r.room) log.push('FAIL setting the ranch rules ' + JSON.stringify(r)); else log.push('set the ranch rules');
                        inLeague(0, () => { const R = S.ranch, cap = ranchCap(); const b0 = ranchSpecies().filter(b => lineTop(b) < 420)[0], b1 = ranchSpecies().filter(b => lineTop(b) >= 600)[0];
                          while (R.mons.length < cap) R.mons.push(newEntry(b0, 3, 'trip'));
                          const n0 = R.mons.length, m0 = S.fin.money, hi = newEntry(b1, 4, 'trip'), lo = newEntry(b0, 1, 'trip');
                          if (ranchTake(lo) !== 'sold' || S.fin.money <= m0) log.push('FAIL a find below the floor kept or not sold');
                          if (ranchTake(hi) !== 'kept' || R.mons.length !== n0 || !R.mons.includes(hi)) log.push('FAIL make room'); else log.push('made room for a better find');
                          const rr = ranchRules(), w = R.mons.filter(x => rrSpare(x, rr)).sort((x, y) => entryValue(x) - entryValue(y))[0]; if (w && ranchTake(Object.assign({}, w, { uid: uid() }), 1) !== 'lost') log.push('FAIL make room for a find no better than every spare');
                          R.mons = R.mons.filter(e => e.at != null || e.from !== 'trip' || e === hi); setRanchRules({ floor: 2, idle: false }); }); } go('cities'); }
                    const nb = [0, 1, 2, 3, 4, 5, 6, 7].find(i => inLeague(0, () => condWhy(i, 'contest'))); if (nb != null && !/Bug/.test(inLeague(0, () => buildCheck(nb, 'contest')).why || '')) log.push('FAIL a Contest allowed without a Bug gym or class');
                    if (!/Fossil Lab/.test(document.querySelector('#main').textContent)) log.push('FAIL the Fossil Lab is not on the Cities page');
                    inLeague(0, () => { sellBuilding(6, 'airport'); sellBuilding(4, 'fossil'); sellBuilding(4, 'lab'); sellBuilding(4, 'lab'); }); S.fin.money = 200000; }
                  // 0.13.0: money and cities. Build a scouting office at the seat (0.63.0: attractions are gone), ban a Pokémon from the Meta page, read the books
                  { if (!/₽/.test(document.querySelector('header').textContent)) log.push('FAIL the header shows no money');
                    go('cities'); const m0 = S.fin.money, b = document.querySelector('[data-act=build][data-w=seat][data-k=scout]');
                    if (!b) log.push('FAIL no scouting office to build at the seat'); else if (!b.disabled) { b.click(); if (!(S.seatB || []).some(x => x.k === 'scout') || S.fin.money !== m0 - 25000) log.push('FAIL building a scouting office'); else log.push('built a scouting office'); }
                    // 0.18.0: sell it back for half from the Cities page
                    { const sb = document.querySelector('[data-act=sellb][data-w=seat][data-k=scout]'), m1 = S.fin.money;
                      if (!(S.seatB || []).some(x => x.k === 'scout')) {} else if (!sb) log.push('FAIL no sell button for the scouting office'); else { sb.click(); if ((S.seatB || []).some(x => x.k === 'scout') || S.fin.money !== m1 + 12500) log.push('FAIL selling the scouting office'); else log.push('sold the scouting office'); } }
                    // 0.19.0: a level sold in the red can be restored at 30%; a distress offer can be bought from the Cities page
                    { const keep = S.fin.money; S.fin.money = 100000; go('cities'); const b2 = document.querySelector('[data-act=build][data-w=seat][data-k=scout]');
                      if (b2 && !b2.disabled) { b2.click(); S.fin.money = -1000; inLeague(0, () => sellBuilding('seat', 'scout')); S.fin.money = 100000; go('cities');
                        const rb = document.querySelector('[data-act=build][data-w=seat][data-k=scout]');
                        if (!rb || !/Restore/.test(rb.textContent)) log.push('FAIL no Restore button after a sale in the red');
                        else { rb.click(); if (S.fin.money !== 100000 - 7500 || !(S.seatB || []).some(x => x.k === 'scout')) log.push('FAIL restoring the scouting office'); else log.push('restored the scouting office'); } }
                      const ck = inLeague(0, () => buildCheck(0, 'stadium'));
                      if (!ck.why) { S.distress = [{ city: S.gyms[0].city, k: 'stadium', lv: ck.lv, from: -1, price: 7500, due: S.turn + 4, at: S.turn }]; go('cities');
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
                    if (document.querySelectorAll('#movetownsel option').length !== 6 || document.querySelectorAll('[data-act=movegym]').length !== 1) log.push('FAIL the Cities page should list six cities with no gym in one move control');
                    // 0.40.0: every gym city shows its control tier; a staff member's profile shows their hometown
                    { const txt = document.querySelector('#main').textContent; if (!TIER_NAMES.some(n => txt.includes(n))) log.push('FAIL the Cities page shows no control tier');
                      const sid = inLeague(0, () => S.champion); modal = { kind: 'profile', id: sid }; renderModal(); const pt = (document.querySelector('.sheet-profile') || {}).textContent || ''; if (homeName(T(sid)) && !pt.includes('From ' + homeName(T(sid)))) log.push('FAIL a profile without its hometown'); modal = null; renderModal(); go('cities'); }
                    go('meta'); const bn = [...document.querySelectorAll('[data-act=ban][data-v="1"]')].find(x => !x.disabled);
                    if (bn) { const sp = bn.dataset.sp; bn.click(); if (!inLeague(0, () => paidBans().some(x => x.sp === sp))) log.push('FAIL paying for a ban'); else log.push('banned ' + sp); } else log.push('nothing to ban yet');
                    go('money'); if (!/Ledger/.test(document.querySelector('#main').textContent) || !/Salaries/.test(document.querySelector('#main').textContent)) log.push('FAIL the Money page');
                    if (/undefined|NaN|\\[object/.test(document.querySelector('#main').textContent)) log.push('FAIL the Money page shows undefined'); }
                  // 0.25.0: the ranch. Buy from the market, send an area trip and a targeted trip, reserve, lock and sell one,
                  // and build the Ranch at the seat
                  { const keep = S.fin.money; S.fin.money = 300000; go('ranch'); const txt = () => document.querySelector('#main').textContent, R = () => inLeague(0, () => S.ranch);
                    // 0.44.0: the page is in tabs
                    const rtab = k => { const b = document.querySelector('[data-act=ranchtab][data-v="' + k + '"]'); if (!b) log.push('FAIL no ranch tab ' + k); else b.click(); };
                    const rshow = v => { const sel = document.querySelector('select.ranchf[data-f=show]'); if (!sel) log.push('FAIL no pool show filter'); else { sel.value = v; sel.dispatchEvent(new Event('change', { bubbles: true })); } };
                    for (const [k] of RANCH_TABS) { rtab(k); if (/undefined|NaN|\[object/.test(txt())) log.push('FAIL the Ranch page shows undefined on tab ' + k); }
                    rtab('teams'); if (!/Who fields what/.test(txt()) || !document.querySelector('#ranchteams')) log.push('FAIL the Teams tab');
                    { const rows = document.querySelectorAll('#ranchteams tbody tr').length, n = seniorIds().map(T).reduce((a, t) => a + t.team.length, 0); if (rows !== n) log.push('FAIL the Teams tab should have a row a Pokémon (' + rows + ' of ' + n + ')'); }
                    if (S.gyms.some(g => T(g.leader) && T(g.leader).specialty) && !/backups/.test(txt())) log.push('FAIL the Ranch page shows no backup types'); // (0.38.0)
                    rtab('pool'); if (!/The pool/.test(txt())) log.push('FAIL the Pool tab');
                    { const n = document.querySelectorAll('#ranchpool tbody tr').length, free = R().mons.filter(e => e.at == null).length; if (free && n !== free) log.push('FAIL the pool should show only Pokémon not fielded by default (' + n + ' of ' + free + ')'); }
                    { const sel = document.querySelector('select.ranchf[data-f=type]'), ty = R().mons.length ? inLeague(0, () => entryTypes(R().mons[0], R().mons[0].sp)[0]) : null;
                      rshow('all'); if (!sel || !ty) log.push('FAIL no type filter'); else { const s2 = document.querySelector('select.ranchf[data-f=type]'); s2.value = ty; s2.dispatchEvent(new Event('change', { bubbles: true }));
                        const want = R().mons.filter(e => inLeague(0, () => entryTypes(e, e.sp)).includes(ty)).length, got = document.querySelectorAll('#ranchpool tbody tr').length; if (want !== got) log.push('FAIL the type filter (' + got + ' of ' + want + ')'); else log.push('filtered the pool to ' + ty + ': ' + got); }
                      document.querySelector('[data-act=ranchfreset]').click(); if (ranchF.show !== 'free' || ranchF.type) log.push('FAIL clearing the filters'); }
                    // 0.51.0: sort the pool by egg group (groups shown under the type, rows in egg-group order)
                    { rshow('all'); const so = document.querySelector('select.ranchf[data-f=sort]'); if (!so || ![...so.options].some(o => o.value === 'egg')) log.push('FAIL no egg group sort'); else { so.value = 'egg'; so.dispatchEvent(new Event('change', { bubbles: true }));
                        const want = inLeague(0, () => R().mons.slice().sort(byEgg).map(e => e.uid)), got = [...document.querySelectorAll('#ranchpool [data-act=ranchlock]')].map(b => +b.dataset.id);
                        if (want.join() !== got.join()) log.push('FAIL the pool sorted by egg group is out of order'); else if (want.length && !inLeague(0, () => document.querySelector('#ranchpool').textContent.includes(eggWords(R().mons[0].b)))) log.push('FAIL the egg groups are not shown'); else log.push('sorted the pool by egg group: ' + got.length);
                        document.querySelector('[data-act=ranchfreset]').click(); } }
                    rtab('market'); if (!/The market/.test(txt())) log.push('FAIL the Market tab');
                    { const b = document.querySelector('[data-act=ranchbuy]'), n0 = R().mons.length, m0 = S.fin.money, x = b && R().shop.find(y => y.uid === +b.dataset.id);
                      if (!b || !x) log.push('FAIL no market to buy from'); else if (!b.disabled) { b.click(); if (R().mons.length !== n0 + 1 || S.fin.money !== m0 - x.price) log.push('FAIL buying at the market'); else log.push('bought ' + x.b + ' at the market'); } else log.push('the ranch is full'); }
                    rtab('trips');
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
                      inLeague(0, () => { S.outbreak = null; S.ranch.trips = []; const e = newEntry(ranchSpecies().find(x => SP[x].types.length === 1), 3, 'trip'); condEntry(e, ['delta']); ranchAdd(e); }); rtab('pool');
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
                      if (!L) log.push('no legendary to store'); else { rtab('region');
                        if (!/Sanctuaries and the vault/.test(txt())) log.push('FAIL no Sanctuary panel');
                        const ab = document.querySelector('[data-act=vaultask][data-id="' + L.c.id + '"]'), fee = inLeague(0, () => vaultFee(L.m)), m0 = S.fin.money;
                        if (!ab) log.push('FAIL no store button'); else { ab.click(); const v = inLeague(0, () => S.vault || []); if (!v.some(e => e.m === L.m) || L.c.team.includes(L.m) || S.fin.money !== m0 - fee) log.push('FAIL storing a legendary ' + JSON.stringify({ dis: ab.disabled, n: v.length, team: L.c.team.includes(L.m), m0, now: S.fin.money, fee, toast: (document.querySelector('.toast') || {}).textContent })); else log.push('stored ' + L.m.sp + ' for ' + fee); }
                        if (!/open/.test(document.querySelector('#main').textContent)) log.push('FAIL the Sanctuary not shown open');
                        const gb = document.querySelector('[data-act=vaultgive]'), sel = document.querySelector('select.vaultsel');
                        if (!gb || !sel) log.push('FAIL no give button'); else { const to = T(+sel.value); gb.click(); if (!to.team.includes(L.m)) log.push('FAIL giving a stored legendary'); else log.push('gave ' + L.m.sp + ' to ' + to.name); }
                        if (/undefined|NaN|\[object/.test(txt())) log.push('FAIL the Ranch page shows undefined after the vault'); } }
                    rtab('pool');
                    { const e = inLeague(0, () => { ranchSync(); return S.ranch.mons.find(x => x.at == null && !x.sale); });
                      if (!e) log.push('nothing free in the ranch');
                      else { const sel = document.querySelector('select.ranchressel[data-id="' + e.uid + '"]'); if (!sel) log.push('FAIL no reserve picker'); else { sel.value = 'gym:0'; sel.dispatchEvent(new Event('change', { bubbles: true })); if (e.res !== 'gym:0') log.push('FAIL reserving'); }
                        const lb = document.querySelector('[data-act=ranchlock][data-id="' + e.uid + '"]'); if (!lb) log.push('FAIL no lock button'); else { lb.click(); if (!e.lock || e.res) log.push('FAIL locking'); }
                        const sb = document.querySelector('[data-act=ranchsell][data-id="' + e.uid + '"]'), v = inLeague(0, () => Math.round(entryValue(e) * SELL_BACK)), m0 = S.fin.money;
                        if (!sb) log.push('FAIL no sell button'); else { sb.click(); if (S.fin.money !== m0 + v || R().mons.includes(e)) log.push('FAIL selling back'); else log.push('sold back ' + e.sp); } } }
                    // 0.26.0: sell a fielded one straight from the pool; its holder swaps it out at once
                    { go('ranch'); rtab('pool'); rshow('fielded'); const e = inLeague(0, () => { ranchSync(); return S.ranch.mons.find(x => x.at != null); });
                      if (!e) log.push('nothing fielded from the ranch'); else { const t = T(e.at), n0 = t.team.length, sb = document.querySelector('[data-act=ranchsell][data-id="' + e.uid + '"]');
                        if (!sb || !/swaps it out/.test(sb.closest('tr').textContent)) log.push('FAIL no Sell button or note on a fielded ranch Pokémon');
                        else { sb.click(); if (t.team.length !== n0 || t.team.some(m => m.rid === e.uid) || R().mons.includes(e)) log.push('FAIL selling a fielded ranch Pokémon'); else log.push('sold a fielded ' + e.sp); } } rshow('free'); }
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
                    { S.fin.money = 400000; R().trips.length = 0; go('ranch'); rtab('region'); const txt = () => document.querySelector('#main').textContent;
                      if (!/Pokémon/.test(txt()) || !/Charter from/.test(txt())) log.push('FAIL no region panel on the Ranch page');
                      { const b = document.querySelector('[data-act=ranchcharter]'), t0 = R().trips.length, m0 = S.fin.money; if (!b) log.push('FAIL no charter button'); else if (b.disabled) log.push('charter button disabled (trips out ' + R().trips.length + ')'); else { b.click(); if (R().trips.length !== t0 + 1 || S.fin.money !== m0 - 12000 || !R().trips.some(x => x.k === 'charter')) log.push('FAIL the charter'); else log.push('sent a charter'); } }
                      rtab('trips'); const opts = [...document.querySelectorAll('select.ranchspsel option')].map(o => o.value);
                      if (opts.some(b => !inLeague(0, () => tripOk(b)))) log.push('FAIL the trip list offers a line out of reach');
                      go('cities');
                      let li = inLeague(0, () => S.gyms.findIndex(g => isPort(S.cities[g.city])));
                      if (li < 0) { const port = inLeague(0, () => myPlaces().find(p => p.none && isPort(p.c))); if (port) { const sel = document.querySelector('#movegymsel'), tsel = document.querySelector('#movetownsel'), mb = document.querySelector('[data-act=movegym]'); if (sel && tsel && mb) { sel.value = '0'; tsel.value = String(port.c.id); mb.click(); go('cities'); li = 0; log.push('moved a gym to ' + port.c.name); } } }
                      if (li >= 0) { inLeague(0, () => { cityB(S.cities[S.gyms[li].city]).length = 0; }); go('cities'); } // clear its slot for the lane
                      const lb = document.querySelector('[data-act=build][data-k=lane]');
                      if (li < 0) log.push('no port to build a lane in');
                      else if (!lb) { const why = inLeague(0, () => buildCheck(li, 'lane').why); if (/port/.test(why || '')) log.push('FAIL no lane to build in a port'); else log.push('no lane built: ' + why); }
                      else { const m0 = S.fin.money; lb.click(); const ln = inLeague(0, () => lanesOf()); if (!ln.length || S.fin.money !== m0 - 60000) log.push('FAIL building a lane'); else { log.push('built a lane in ' + ln[0].city.name);
                        go('ranch'); rtab('region'); const sel = document.querySelector('select.lanesel'); if (!sel) log.push('FAIL no route picker'); else { const to = [...sel.options].map(o => +o.value).find(v => v !== ln[0].src), m1 = S.fin.money; sel.value = String(to); sel.dispatchEvent(new Event('change', { bubbles: true })); if (inLeague(0, () => lanesOf()[0].src) !== to || S.fin.money !== m1 - 10000) log.push('FAIL changing the route'); else log.push('changed the lane route'); } } }
                      go('cities'); const sb = document.querySelector('[data-act=build][data-k=safari]');
                      if (!sb) log.push('no safari to build (no free slot)'); else { const w = sb.dataset.w; sb.click(); if ([...document.querySelectorAll('[data-act=build][data-k=safari]')].some(x => x.dataset.w !== w)) log.push('FAIL a second safari offered'); else log.push('built a safari'); }
                      go('ranch'); if (/undefined|NaN|\[object/.test(txt())) log.push('FAIL the Ranch page shows undefined after the region steps');
                      // 0.44.0: the Safari Zone panel: keep a line, send a trip from it (cheaper than a plain trip), stock a ranch
                      // Pokémon from the pool and take it back, a quarterly find, and the log on the Trips tab
                      if (inLeague(0, () => safariBuilt())) { R().trips.length = 0; inLeague(0, () => { S.ranch.safari = null; safariWeek(); }); go('ranch'); rtab('region');
                        if (!/Safari Zone/.test(txt()) || !document.querySelector('#safarilines')) log.push('FAIL no Safari Zone panel with its lines');
                        const kb = document.querySelector('[data-act=safarikeep][data-v="1"]');
                        if (!kb) log.push('FAIL no keep button'); else { const b = kb.dataset.b; kb.click(); if (!inLeague(0, () => safariKept()).includes(b)) log.push('FAIL keeping a safari line'); else { inLeague(0, () => { S.ranch.safari.until = S.turn; safariWeek(); }); if (!inLeague(0, () => S.ranch.safari.lines.includes(b))) log.push('FAIL a kept line did not stay through the change'); else log.push('kept ' + b + ' through a change'); } }
                        go('ranch'); rtab('region'); const tb = document.querySelector('#safarilines [data-act=ranchtrip]');
                        if (!tb) log.push('FAIL no trip button in the safari panel'); else if (!tb.disabled) { const b = tb.dataset.b, m0 = S.fin.money, p = inLeague(0, () => tripPlan(b)); tb.click(); const tr = R().trips.find(x => x.b === b); if (!tr || !tr.safari || S.fin.money !== m0 - p.cost) log.push('FAIL a safari trip'); else log.push('sent a safari trip for ' + b + ' (' + p.cost + ', ' + Math.round(p.odds * 100) + '%)'); }
                        R().trips.length = 0; rtab('pool');
                        const sb2 = document.querySelector('[data-act=ranchstock]');
                        if (!sb2) log.push('FAIL no stock button in the pool'); else { const id = +sb2.dataset.id, n0 = R().mons.length; sb2.click(); const st = inLeague(0, () => safariStock());
                          if (!st.some(e => e.uid === id) || R().mons.length !== n0 - 1) log.push('FAIL stocking the safari'); else { log.push('stocked ' + st.find(e => e.uid === id).sp);
                            const e = st.find(e => e.uid === id); if (!inLeague(0, () => safariSet().has(e.b))) log.push('FAIL a stocked line not in the safari');
                            rtab('region'); if (!document.querySelector('#safaristock')) log.push('FAIL no stock table');
                            const n1 = R().mons.length; inLeague(0, () => safariFind()); if (R().mons.length !== n1 + 1 && R().mons.length < inLeague(0, () => ranchCap())) log.push('FAIL the quarterly safari find'); else log.push('a young ' + R().mons[R().mons.length - 1].sp + ' turned up in the safari');
                            go('ranch'); rtab('region'); const back = document.querySelector('[data-act=safaritake][data-id="' + id + '"]'); if (!back) log.push('FAIL no take-back button'); else if (!back.disabled) { back.click(); if (inLeague(0, () => safariStock()).some(x => x.uid === id) || !R().mons.some(x => x.uid === id)) log.push('FAIL taking a stocked Pokémon back'); } } } }
                      go('ranch'); rtab('trips'); if (!/Recent history/.test(txt()) || !document.querySelectorAll('#ranchlog tbody tr').length) log.push('FAIL no ranch log'); else log.push('the ranch log has ' + document.querySelectorAll('#ranchlog tbody tr').length + ' rows');
                      if (/undefined|NaN|\[object/.test(txt())) log.push('FAIL the Ranch page shows undefined after the safari steps'); rtab('pool'); }
                    // 0.45.0: the Day Care: build it, put two Pokémon that share an egg group in to breed from the Pool tab, start a
                    // pair on the Day Care tab, hatch an egg and end the pair
                    { S.fin.money = 2000000; go('cities'); const db = document.querySelector('[data-act=build][data-w=seat][data-k=daycare]');
                      if (!db) log.push('FAIL no Day Care to build'); else { const m0 = S.fin.money; db.click(); if (!inLeague(0, () => dcBuilt()) || S.fin.money !== m0 - 40000) log.push('FAIL building the Day Care'); else log.push('built the Day Care'); }
                      const txt = () => document.querySelector('#main').textContent;
                      go('ranch'); rtab('pool'); const show = document.querySelector('select.ranchf[data-f=show]'); if (show) { show.value = 'all'; show.dispatchEvent(new Event('change', { bubbles: true })); }
                      const btns = [...document.querySelectorAll('[data-act=ranchbreed]:not([data-ask])')].map(b => ({ b, e: R().mons.find(x => x.uid === +b.dataset.id) })).filter(x => x.e);
                      let pr = null; for (const x of btns) for (const y of btns) if (!pr && x.e.uid !== y.e.uid && x.e.b !== y.e.b && inLeague(0, () => eggMatch(x.e.b, y.e.b))) pr = [x.e.uid, y.e.uid];
                      if (!pr) log.push('no two ranch Pokémon share an egg group');
                      else { const n0 = R().mons.length; for (const id of pr) { const b = document.querySelector('[data-act=ranchbreed][data-id="' + id + '"]'); if (!b) log.push('FAIL no Breed button'); else b.click(); }
                        const P = inLeague(0, () => dcPool()); if (P.length !== 2 || R().mons.length !== n0 - 2) log.push('FAIL putting two in to breed'); else log.push('put in to breed ' + P.map(e => e.sp).join(' and '));
                        rtab('daycare'); if (!document.querySelector('#dcpool') || !/Breeding pool/.test(txt())) log.push('FAIL no breeding pool table');
                        { const sb = document.querySelector('[data-act=dcsort][data-v=egg]'); if (!sb) log.push('FAIL no Day Care sort'); else { sb.click(); if (dcSort !== 'egg' || !document.querySelector('[data-act=dcsort][data-v=egg].on')) log.push('FAIL sorting the breeding pool by egg group'); else log.push('sorted the breeding pool by egg group'); document.querySelector('[data-act=dcsort][data-v=line]').click(); } }
                        const sa = document.querySelector('select.dcsel[data-k=a]'); if (!sa) log.push('FAIL no pair picker'); else { sa.value = String(pr[0]); sa.dispatchEvent(new Event('change', { bubbles: true }));
                          const sb = document.querySelector('select.dcsel[data-k=b]'); sb.value = String(pr[1]); sb.dispatchEvent(new Event('change', { bubbles: true }));
                          const pb = document.querySelector('[data-act=dcpair]'); if (!pb || pb.disabled) log.push('FAIL no Start the pair button'); else { pb.click(); const D = R().dc;
                            if (D.pairs.length !== 1) log.push('FAIL starting a pair'); else { log.push('a pair started');
                              const n1 = R().mons.length; D.pairs[0].due = S.turn; inLeague(0, () => breedWeek());
                              const y = R().mons.find(e => e.from === 'bred'); if (!y && !D.wait.length) log.push('FAIL the egg did not hatch'); else log.push('hatched ' + (y ? y.sp + ' ' + y.g + '★' : 'one waiting for room'));
                              go('ranch'); rtab('daycare'); const eb = document.querySelector('[data-act=dcend]'); if (!eb) log.push('FAIL no End pair button'); else { eb.click(); if (R().dc.pairs.length) log.push('FAIL ending a pair'); } } } } }
                      if (/undefined|NaN|\[object/.test(txt())) log.push('FAIL the Day Care tab shows undefined'); rtab('pool'); }
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
                  // 0.43.0: change the seat rule on Your staff to a yearly Champion's Cup (prestige taken), find it on the
                  // League table, and see a second change refused inside the cooldown; the call panel is gone
                  { go('staff'); const p0 = S.prest || 0, rs = document.querySelector('#seatrulesel');
                    if (!rs || !/How the .* is chosen: Protected/.test(txt())) log.push('FAIL no seat rule panel on Your staff');
                    else { rs.value = 'cup'; rs.dispatchEvent(new Event('change', { bubbles: true }));
                      const ev = document.querySelector('#seatevery'); if (!ev) log.push('FAIL no timing field on Your staff'); else { ev.value = '1'; ev.dispatchEvent(new Event('change', { bubbles: true })); }
                      click('[data-act=seatset]');
                      if (!S.seatRule || S.seatRule.k !== 'cup' || S.seatRule.every !== 1) log.push('FAIL the seat rule did not change: ' + JSON.stringify(S.seatRule));
                      if ((S.prest || 0) > Math.max(0, p0 - 5) + 0.01) log.push('FAIL changing the seat rule cost no prestige');
                      if (/Call a challenge/.test(txt())) log.push('FAIL the call panel shows under the Cup');
                      const r2 = document.querySelector('#seatrulesel'); r2.value = 'merit'; r2.dispatchEvent(new Event('change', { bubbles: true }));
                      if (!/can change again from year/.test(txt())) log.push('FAIL a second seat rule change was not blocked');
                      go('table'); if (!/Seat rule: Champion's Cup/.test(txt())) log.push('FAIL the League table does not show the seat rule');
                      log.push("seat rule set to a yearly Champion's Cup"); } }
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
            // 0.42.0: your posts from setup, rival 1's theme, and changing yours from the League table
            if (postWord('champion', ME()) !== 'Grand Sensei' || postWord('e4', ME()) !== 'Grandmasters') log.push('FAIL your posts from setup: ' + JSON.stringify(postWords(ME())));
            if (themeOf(1).name !== 'Board') log.push('FAIL rival 1 theme: ' + themeOf(1).name);
            { const bs = [...document.querySelectorAll('[data-act=lgposts]')];
              if (bs.length !== 1) log.push('FAIL Posts buttons on the League table: ' + bs.length);
              else { bs[0].click(); const sel = document.querySelector('#lgposttheme'); if (!sel) log.push('FAIL no theme picker on the League table');
                else { sel.value = 'academy'; sel.dispatchEvent(new Event('change', { bubbles: true }));
                  const f = document.querySelector('.lgpostin[data-k="leader"]'); if (f) { f.value = 'Head Tutor'; f.dispatchEvent(new Event('input', { bubbles: true })); }
                  click('[data-act=lgpostsgo]');
                  const w = postWords(ME()); if (w.e4 !== 'Faculty' || w.leader !== 'Head Tutor' || w.champion !== 'Dean') log.push('FAIL posts from the League table: ' + JSON.stringify(w));
                  if (!document.querySelector('#main').textContent.includes('Academy (custom)')) log.push('FAIL the League table does not show the theme');
                  go('gyms'); if (!/Dean/.test(document.querySelector('#main').textContent)) log.push('FAIL the Gyms page does not use your post names'); go('table'); } } }
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
          click('[data-act=simmany]'); click('[data-act=simmanyn][data-v="1"]');
          // (0.50.0) the sim manages your League as a wall-builder
          if (!document.querySelector('[data-act=simmanyauto][data-v="wall"]')) log.push('FAIL no managing choice in the sim dialog');
          click('[data-act=simmanyauto][data-v="wall"]'); if (S.simAuto !== 'wall' || !/rival wall-builder would/.test(document.querySelector('#modal, .modal, body').textContent)) log.push('FAIL the managing choice did not take');
          click('[data-act=simmanygo]');
          log.push('year ' + S.season + ' week ' + S.week + ' leagues ' + nLeagues() + ' ver ' + UPDATES[0].ver + ' key ' + SAVE_KEY);
          return log; }""")
        await pg.wait_for_timeout(4000)
        after = await pg.evaluate("""() => { const done = !!(modal && modal.done), autoTxt = /Run as a wall-builder/.test(document.body.textContent), simRun = !!S.simRun; document.querySelector('[data-act=simmanyclose]') && document.querySelector('[data-act=simmanyclose]').click(); save(); return { done, autoTxt, simRun, season: S.season, phase: S.phase, n: Object.keys(S.trainers).length }; }""")
        await pg.wait_for_timeout(1500)
        keys = await pg.evaluate("() => Object.keys(localStorage)")
        # 0.30.0: the save is in IndexedDB, not localStorage
        idb = await pg.evaluate("""() => new Promise(res => { const rq = indexedDB.open('plb-save-db'); rq.onsuccess = () => { try { const g = rq.result.transaction('save').objectStore('save').get('world'); g.onsuccess = () => res(g.result ? { v: g.result.v, bytes: g.result.z ? g.result.z.length : -1 } : null); g.onerror = () => res(null); } catch (e) { res(null); } }; rq.onerror = () => res(null); })""")
        await pg.reload(); await pg.wait_for_timeout(1500)
        back = await pg.evaluate("() => S ? { season: S.season, phase: S.phase, n: Object.keys(S.trainers).length, view } : null")
        if not after['done']: out.append('FAIL the sim dialog did not finish')
        if after['done'] and not after.get('autoTxt'): out.append('FAIL the sim dialog did not report managing your League')
        if after.get('simRun'): out.append('FAIL S.simRun left set after the sim')
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
