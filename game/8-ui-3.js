const verName = u => u.ver || u.id;
const UPDATES = [
  { id: 27, ver: '0.27.0', date: 'November 17, 2026', time: '11:20 AM ET', title: 'Regional encounters', items: [
    "Pokémon are regional now. Kanto, Johto, Hoenn and Sinnoh each have their own species (about 350, counting evolutions): a family belongs to every region of its generations (Pichu is found in Kanto and Johto), regional forms go with the species they are forms of (Hisuian ones with Sinnoh), and Generations V to IX are shared out among the four regions until their own regions are added. Every type has at least five strong lines in every region. Wild Pokémon, new challengers' teams, mass outbreaks, the market, area trips and stopgaps all come from the region.",
    "Migration: three or four times a year, 10 to 20 kinds of Pokémon from a neighbouring region (now and then from further off) arrive for about two months, for challengers and for your ranch alike.",
    "Shipping lanes: build one in a port city where you have a gym (Goldenrod has the railway instead) and choose a region on the Ranch page. Its Pokémon can then be caught on your targeted trips and turn up at your market all the time. 60,000 to build, 400 a week to run, 10,000 to change the route.",
    "Charters: a one-off shipment of two or three Pokémon from any other region, 12,000, three weeks.",
    "The Safari Zone: one per League, in a gym city. It holds 10 Pokémon from other regions (13 and 16 at higher levels), changing every 12 weeks, that only your own targeted trips can catch; higher levels also bring back better grades.",
    "When a steer asks for something your region can't give (say, a Ground type to cover weaknesses), staff use the best they can get, and the Ranch page flags it and says where that Pokémon lives.",
    "A challenger moving to a League in another region brings at most three Pokémon from outside it (their best, special ones first). For now the rest are released.",
    "Rival Leagues build lanes and safaris by their aim and send charters when a post is stuck with stopgaps.",
    "Fixed: leaving your League to found another could crash if a waiting seat challenge moved one of the staff coming with you.",
    "Regional encounters is a feature in Advanced options (on by default). Turn it off to play with every species everywhere.",
  ] },
  { id: 26, ver: '0.26.0', date: 'November 17, 2026', time: '9:40 AM ET', title: 'Clearing out the ranch', items: [
    "Any ranch Pokémon can now be sold, released or listed straight from the Ranch page, even one a member of staff is fielding: they swap it out on the spot for the best fitting Pokémon left in the ranch (or a stopgap if nothing fits). The page says who is fielding it and what will happen.",
    "Rival Leagues clear out their ranches: spares beyond the few their aim keeps are listed for other Leagues, then sold back once they have sat unused for a while (two months for a money-maker, three for a star-maker, four for a wall-builder).",
  ] },
  { id: 25, ver: '0.25.0', date: 'November 16, 2026', time: '11:59 PM ET', title: 'The ranch', items: [
    "Every League now has a ranch: its own pool of Pokémon. Your Gym Leaders, Elite Four and Champion field their own Pokémon plus Pokémon from the ranch, and nothing comes free any more, so a new League starts thin and its teams grow as it catches and buys. Gym trainers keep their own teams.",
    "A new Ranch page (League menu) shows who fields what, the whole pool, catching trips and the market. Each Pokémon has a grade, 1 to 5 stars from its IVs, and takes the form its line has at the level of the post that fields it, one post at a time.",
    "Staff swap one Pokémon a month for a better one from the ranch, by their steer and as well as their Strategy lets them. A swap is an exchange: what they drop goes into the ranch (theirs to take back while they stay), and a ranch Pokémon they hold leaves with them if they go. Reserve a Pokémon for a post, or lock it away.",
    "Pokémon come in from catching trips (a targeted trip after one line, or a cheaper area trip; your best senior member's Scouting and the scouting office set the odds and grades), from the market (a few each week, plus other Leagues' sales) and from what staff drop. Sell back for a third of the value, release, or list for other Leagues.",
    "A new League starts with a small stock of low-grade commons, about enough for every post to field a full team. Each Pokémon costs upkeep a week by grade, and the ranch holds 60 until you build the Ranch at your seat (no slot, five levels). If nothing fits a post, weak stopgaps stand in and the page warns you.",
    "Every species can be caught anywhere for now; regional encounters, migration, ports and the safari come next. Rival Leagues run their ranches by their aim. All the numbers are provisional.",
  ] },
  { id: 24, ver: '0.24.0', date: 'November 16, 2026', time: '11:45 PM ET', title: 'Growth', items: [
    "Everyone grows on one curve, staff and challengers alike. Trainers improve on each birthday, fastest while young: a teenager is typically 6 to 10 OVR better within three years, a young adult 4 to 6. They peak in their late 20s, hold, and decline slowly from their mid 30s, faster with age. This replaces the old potential ceiling.",
    "Late starters grow too. Growth counts from the start of a career, not age, so someone who comes to the circuit or a post at 30 still improves for four years, and only declines six years in (by 40 at the latest).",
    "Talent varies from trainer to trainer, and so does coaching: a gym trainer is coached by their Gym Leader, Gym Leaders and the Elite Four by the Champion, and a coach with high Training speeds growth. A cheap young Gym Leader under a good Champion can grow into the post.",
    "The training hall now speeds growth at its post (12% a level) and slows the decline of older staff, in place of its flat rating point a level.",
    "Potential (POT) on a trainer's card is where their growth is heading at their own pace. The glossary has a Growth entry.",
    "Old saves don't load (save version 13).",
  ] },
  { id: 23, ver: '0.23.0', date: 'November 16, 2026', time: '10:30 PM ET', title: 'Prestige decides who will sign', items: [
    "A weaker start. Every League now founds from a pool of about 40 candidates who are mostly OVR 45 to 55, with four to six standouts at 58 to 62, plus the founding field. There are no stars and no famous trainers at founding. Your rival Leagues found the same way, from the same kind of pool, so the early years are a level race and walls start loose.",
    "Every trainer has a prestige minimum for joining a League. Nothing up to OVR 62, then 4.5 for each point above it, plus part of their own record (titles, the Hall of Fame, badges and years) and more for a famous trainer. Trainers hungry for a post sign below their bar: another League's staff who want promotion, a claimant, and about one challenger in four. So do trainers holding a grudge against another League. A new League starts with no prestige, so a Champion-calibre trainer (around OVR 72) waits until your League has earned about 45, usually in three to five years.",
    "The founding screen and the hiring pages show each candidate's minimum as Prestige X. Anyone your League can't sign yet shows needs prestige X (you have Y) instead of a button. Rival Leagues are held to the same rule, and they hire Gym Leaders from OVR 48 and Elite Four members from 54.",
    "Outsiders the game finds for a vacancy are no stronger than your League's prestige can attract (scouting still finds a little better), and a famous outsider turns up only once a League could sign one. Your own staff moving between posts, and staff who follow you to a new League, are never held back.",
    "Old saves don't load (save version 12).",
  ] },
  { id: 22, ver: '0.22.0', date: 'November 16, 2026', time: '7:45 PM ET', title: 'Title claims', items: [
    "Title claims. Beating the Champion still wins the title, not the seat, but at New Year the strongest of the year's title winners who wants a seat can claim the Champion's seat. Most would rather keep travelling, so most titles stay just titles. A claim takes the place of the year's other challenge for the Champion's seat.",
    "In your League a claim never goes ahead without you. Allow the claim battle (one battle at the Champion's level, your Champion with their full team and a little more than the seat's usual edge), turn it down, or offer the claimant a post from the hiring pages: a claimant is glad to take one (tagged Claimant), and the claim ends there. A claim you turn down, or leave unanswered for eight weeks, costs your League 2 prestige, and the claimant leaves unhappy, often for another League, which may sign them as a contender against you.",
    "A Champion who loses a claim battle leaves the post: they retire after a long career, or head for another League's circuit, from where they can challenge you again.",
    "A new Champion can't be challenged for the seat, by a claim or by anyone else, in their first two calendar years.",
    "Rival Leagues allow or turn down claims by their aim; the multi-year sim turns every claim down for you. The year report lists claims among the seat challenges, and the glossary has a Title claims entry.",
  ] },
  { id: 21, ver: '0.21.0', date: 'November 16, 2026', time: '7:30 PM ET', title: 'Three Leagues, the progress board and the Hall of Fame on winning', items: [
    "The world starts with three Leagues: yours in the region you choose and two rivals, each in a different region, founded on their own. A new setup option, Starting Leagues (1 to 3), keeps the one-League start. The rivals count toward the prestige a founder needs, so the next League to open needs 50, then 60 and 70.",
    "The progress board, a page of its own (League menu, or Board in the header). One row per gym, Elite Four seat and the Champion: who is there now, how many it let through and walled this year, and the share of tries it held. Open a row for the line, who is there and on which try, who got through lately with the core of their team, who was walled and by whom, and the types beating it this year. A threats strip lists challengers with six badges or more, contenders and anyone who impressed. The League switcher shows any League's board.",
    "The Hall of Fame on winning. Every title win enters the Hall at once, with the team that beat the Champion (species, moves, items and abilities), the year, the League, the Champion beaten and a contender tag, and a Watch button while the title battle is kept. A trainer who wins again gets another entry, and their page gathers them all. Anyone with an entry is a Hall of Famer; each entry adds to their prestige. Nobody is inducted at retirement any more, and folded Leagues stay in the Hall's League filter.",
    "Gym memory. A challenger who loses at a gym remembers the types of the trainer who beat them there, picks their squad against those types on later tries and leans their catches toward counters; Strategy sets how well they learn. The memory stays with that League across runs and is wiped when the gym changes (a new leader or gym trainer, or enough of its Pokémon replaced), so gyms that change hold and gyms that don't wear down.",
    "Old saves don't load (save version 11).",
  ] },
  { id: 20, ver: '0.20.0', date: 'November 16, 2026', time: '1:45 PM ET', title: 'Legendaries reworked', items: [
    "Legendaries obey by badges. A legendary (an Ultra Beast, Missingno or a Paradox Pokémon too) only battles for a challenger with enough badges for its strength: base stats under 600 from 4 badges, under 680 from 6, the box legendaries from 8. Below that it sits out and the challenger fields the rest of the team. At the Elite Four and the title every Pokémon obeys. Your staff are never held back. Legendaries used to sweep the early gyms, so walls are now much harder to get past.",
    "One of each legendary in the world. A legendary held or waiting anywhere can't turn up in another League, and one that moves on waits for a new partner from wherever it is. A world with several Leagues has far fewer legendaries.",
    "Legendaries belong to regions. Kanto's, Johto's, Hoenn's and Sinnoh's own legendaries turn up about three times as often in a League of their region and half as often elsewhere.",
    "Six legendaries that had no way in since the start get events: the Swords of Justice (Cobalion, Terrakion, Virizion) and Keldeo choose challengers by how their year went, Genesect breaks out of a laboratory, and Xerneas awakens.",
    "Paradox Pokémon are back. When an expedition to Area Zero finds Koraidon, Miraidon or Terapagos, the crater stays open in that League for a year and exploring challengers may find a Paradox Pokémon. One of each in the world at a time; they aren't legendaries, so a trainer can hold one beside a legendary.",
    "Legendary sites and Sanctuaries. A gym city where a legendary appeared or was caught becomes a legendary site for ten years. Every League with a gym there can build a Sanctuary (a city slot, three levels): it earns 250, 500 or 800 a week while the site lasts (an attraction's income after) and adds a point of prestige a level each New Year. Rival Leagues build them too. Sites show on the Cities page.",
    "Old saves don't load (save version 10).",
  ] },
  { id: 19, ver: '0.19.0', date: 'November 16, 2026', time: '5:30 AM ET', title: 'Restoring what was lost', items: [
    "Restore what the red cost you. A building level a League lost while in the red (sold in the red, or lost to unpaid upkeep) leaves a ruin, and rebuilding that level in the same place costs only 30% of its price. The Cities page shows it as a Restore button. A level sold while you are solvent leaves no ruin. A League that crashed now climbs back in about six years instead of ten.",
    "Distress sales come to you first. When a rival League loses a building level in a city where you have a gym (to unpaid upkeep, or when it folds), you're offered that level at 30% of its price for four weeks, with a stop and a Distress sales panel on the Cities page. The rival is paid if you buy; otherwise the level is simply lost.",
    "Choose where to start again. When your League folds, the founding screen lets you pick the region of your new League (any region with room) before it opens.",
    "Titles won in a League that has since folded count toward the Triple Crown again.",
    "Fixed: the game could stop when a folded League's former staff were taken on as gym trainers the same week it folded.",
  ] },
  { id: 18, ver: '0.18.0', date: 'November 15, 2026', time: '9:45 PM ET', title: 'Debts, sales and Leagues that fold', items: [
    "Being in the red now costs your buildings. While a League is below zero it stops paying upkeep and everything it has built lapses: attractions earn nothing, and training halls, gym features, the scouting office and the youth academy do nothing until it is back in the black.",
    "Unpaid upkeep wears buildings down. Every 24 weeks in the red in a row, a League's costliest building loses a level. In a city it shares with another League, that League may buy the level at a distress price of 30% of its cost, and the seller gets the money.",
    "Sell buildings. Any building level can now be sold from the Cities page for half what it cost (your standing in that city drops by what it had added). Rival Leagues in the red sell one a month, attractions last.",
    "Leagues can fold. A League in the red at three New Years running, whose buildings sold at half could no longer clear its debts, closes for good: rivals buy what they can, the rest is lost, its staff and challengers scatter to other circuits (older or struggling ones retire) and contracts with it end. Old records still name it. If it is yours, you found a fresh League by hand in your region, with the usual starting fund. You get a warning after two years in the red.",
    "New Leagues come sooner. A retired trainer needs prestige 30 to found the world's second League, then 40, 50, 60 and 70 for the third to sixth. Leaving your own League still needs 60.",
    "Prestige draws trainers. Challengers and staff are up to 6% likelier to take an offer or a sponsorship from a prestigious League, and challengers moving between Leagues lean toward the more prestigious ones.",
  ] },
  { id: 17, ver: '0.17.0', date: 'November 15, 2026', time: '7:30 PM ET', title: 'Contenders, prestige and a League of your own', items: [
    "Send contenders. From the new Contenders page you can send challengers at another League: your academy prospects (who always agree) or anyone on your circuit you sign (who may say no). They run only at that League for two years, and nobody else can hire them meanwhile. You pay a weekly stipend; that League pays you a bounty of 40,000 for each title they win there and 5,000 for each run that reaches its Elite Four. Recall them, renew them, or hire them back. At most four at once.",
    "Rival Leagues send contenders too, by their aim (star-makers most), at Leagues where runs go further, and may send them at you. The year report lists each year's contenders, yours and those sent at you; the League table counts them.",
    "Prestige: every League earns it each New Year from a perfect year, letting through fewer than the world's average, the World Championship, the cities it controls and its rank by wealth, and it fades by a tenth a year. Trainers have it from their careers. The League table shows it.",
    "Found a League of your own. Once your League's prestige reaches 60, you can leave it for 750,000 (on the Money page) if the world has room. Your old League carries on as a rival. Up to three members of staff who want promotion come with you, your academy prospects follow, and you place the new League's staff by hand.",
    "New Leagues are founded by retirees with a prestige of 60 or more, at least eight years apart, instead of on a timer. The world now holds up to six Leagues, two to a region.",
    "Fixed: the League table page could not be opened from the menu.",
    "Fixed: a new Gym Leader could keep a Pokémon that evolved off the gym's type at its level.",
  ] },
  { id: 16, ver: '0.16.0', date: 'November 15, 2026', time: '1:45 PM ET', title: 'Tuning the economy', items: [
    "Leagues now stay closer to level. Attractions pay less (120, 240 and 360 a week by level), the entry fee is 700 a run, and the wall prize falls by 15,000 for each trainer let through (was 20,000).",
    "Money has more to buy. Training halls and gym features go on to levels 4 and 5 (200,000 and 400,000). A new youth academy at your seat (no slot; 100,000, 200,000 and 400,000) raises a young prospect a year per level. They set out on your circuit as one of your own: likelier to take your offers and paid 15% less by you.",
    "Buildings cost upkeep: 5% of what you paid for them a year, paid weekly. The Cities page shows the levels, your upkeep and the academy; the Money page lists upkeep and city income.",
    "Rich rival Leagues now bid over the asking pay when they hire, so challengers and other Leagues' staff are likelier to come to them. With plenty to spare, a rival may also pay at New Year to replace its weakest Elite Four member or Gym Leader with a clearly better trainer. Rivals never build more than their income can keep up.",
    "A rival League in the red now turns money-maker only until it is back on its feet, then goes back to its old aim. It used to stay a money-maker and race ahead of everyone.",
    "Bids and the scouting office now help every League's offers, not just yours. The League table shows what each League has built.",
  ] },
  { id: 15, ver: '0.15.0', date: 'November 15, 2026', time: '10:02 AM ET', title: 'Rival Leagues', items: [
    "Every League now keeps books, not just yours. Rival Leagues earn and spend like you do, each by its aim: a wall-builder hires the best, counters the meta, builds gym features and pays for bans; a star-maker hires young and builds training halls; a money-maker keeps wages down and builds attractions. A rival changes aim when it falls into the red or a money-maker grows rich. Aims replace rivals' old steering rule and their trainers' ban vote.",
    "Being in the red now costs you: every four weeks in the red, your best-paid member of staff (never the Champion) gives twelve weeks' notice, and leaves unless you are back above zero by then. While in the red, automatic hires take the cheapest trainer who fits and cost no signing fee.",
    "The second League of a region opens in yours: when a new League is due it opens in your region first (then elsewhere, four Leagues at most), taking the region's three towns with no gym and five of your cities. A distinguished recent retiree founds each new League as a final act and gives it their name; rarely, a champion still fit enough takes its Champion's seat for ten years.",
    "Cities: a League gains standing in a city where it has a gym by spending there and by how its gym holds against the region's average, and standing fades each year. The League with most standing controls the city. Every city with a gym now earns income each week by its size; its controller takes half and the rest is shared by standing.",
    "Catch-up, gently: challengers whose runs keep ending early drift toward Leagues where runs go further, so a leaky wall draws more entry fees; and stars ask a little more (up to a fifth) of a League far richer than the world's average.",
    "Hiring between Leagues: staff who want promotion can take a bigger post in another League (a gym trainer leading a gym, a Gym Leader joining the Elite Four), and their old League receives the signing fee. Any League can also offer a post to a challenger resting between runs on another League's circuit. Your hiring page lists both, and rival Leagues can take yours.",
    "Title challenges across Leagues: a restless Elite Four member of another League can challenge your Champion at New Year (you approve or refuse); if they win, the two trade places.",
    "A League table page ranks every League by money, with income, spending, wages, cities held and the wall beside it; the year report shows every League's year side by side; the Cities page shows standing, control and your share of each city's income.",
    "The Triple Crown now counts title wins (beating a League's Champion) in three Leagues, not who held a Champion's seat at a year's end.",
    "Saves are smaller: trainers keep fewer former Pokémon and head-to-head records.",
  ] },
  { id: 14, ver: '0.14.0', date: 'November 14, 2026', time: '9:54 PM ET', title: 'Balance retune', items: [
    "The wall was far too hard to get past, so it has been retuned: staff build their teams a little less well than before, and the best challengers stay on the circuit to chase the title instead of being taken onto Leagues' staff.",
    "A challenger who impressed (reached the Elite Four, or won six or more badges in a run, this year or last) is much likelier to turn down an offer of a post, from your League or any other.",
    "Gym trainer places filled automatically go to challengers from the lower half of the circuit, who can turn the place down; the circuit's best are left to chase the title. You can still pick anyone by hand.",
    "A challenger who reached the Elite Four challenges for an Elite Four seat only when its holder is 50 or older.",
  ] },
  { id: 13, ver: '0.13.0', date: 'November 14, 2026', time: '7:34 PM ET', title: 'Money and cities', items: [
    "Your League has money. It comes from an entry fee for every run begun on your circuit, a wall prize at New Year that shrinks with every trainer you let through, and attractions you build. It pays your staff's salaries every week, signing fees, severance, raises, bans and buildings. The new Money page has the books.",
    "Salaries follow the post and the trainer's OVR, reviewed each New Year; famous trainers and title winners ask more. Hiring from outside costs a signing fee and letting someone go costs severance; moves, swaps and steers within your staff are free.",
    "Give a raise to a restless member of staff, or one who gave notice over promotion, to keep them another year (once per post). Bid over the asking pay when you make an offer to improve the odds it is taken.",
    "The founding screen shows each candidate's pay and your wage bill. You start with a fund; there is no cap, but you can start in the red.",
    "In the red, salaries are still paid but you can't hire from outside, ban, build or give raises until you are back above zero.",
    "Cities: build in your gym cities and at your League's seat on the new Cities page. Training halls help staff grow, gym features give a home edge, attractions bring in money, and a scouting office at the seat brings better outsiders and better odds on offers. A city gets more slots as money is spent there. Each region has three more cities without a gym, and you can move a gym to one (everything you built in the old city is lost).",
    "Your banlist is a paid League rule now: ban any Pokémon seen on your circuit, in any week, for one to three years, priced by how high it ranks in the meta. Up to three at once, and a ban that runs out protects that Pokémon for two years. Other Leagues still vote.",
  ] },
  { id: 12, ver: '0.12.0', date: 'November 14, 2026', time: '10:15 AM ET', title: 'Steers and the meta', items: [
    "Steer how your staff build their teams. Each Gym Leader's gym, each Elite Four seat and the Champion's seat can have a steer: Balanced, Counter the trend, Counter the year's meta, Favour bulk, Hit hard, Cover weaknesses or Keep their own Pokémon. A League line covers every post without one, and gym trainers follow their gym's steer. Set them on Your staff in any week.",
    "A steer belongs to the post, so a new holder follows it too. Everyone follows a steer, as closely as their Strategy allows, and each steer trades a little raw strength for what it asks.",
    "Teams follow a steer one Pokémon a month, swapping the Pokémon that fits it worst for a better fit. Someone new to a post builds to the steer at once.",
    "The meta is now read every month: the trend (the circuit's top performers of the last 12 weeks) and the year (last year plus this year so far). The new Meta page shows both, the types that answer them, which of your posts can answer them on their own type, and a button to counter on those posts. The sim stops when the trend shifts.",
    "A trainer steered to counter the meta may field one Pokémon off their type that answers it.",
    "Keep their own Pokémon stops the monthly swaps. A move keeps up to four of the trainer's own Pokémon instead of two, and a famous trainer works their signature Pokémon back in, one a month.",
    "Rival Leagues steer themselves: a gym that can answer the trend on its type counters it, and so does an Elite Four member or Champion who can answer the year's meta. Everyone else stays Balanced.",
    "A staff member who loses a Pokémon to a ban now leans toward the meta's counters only when their post is steered to counter it. A Gym Leader's swap after a losing streak is unchanged, and newcomers still lean toward types that counter the year's top performers.",
    "The year report shows each gym's and seat's steer, the League line and the trend at the year's end. The profile shows a staff member's steer. Glossary entries for Steers and The meta.",
    "Saves from earlier versions can't be loaded." ] },
  { id: 11, ver: '0.11.0', date: 'November 14, 2026', time: '12:09 AM ET', title: 'Seat challenges', items: [
    "Seats can now be won in battle. At New Year each League holds at most one challenge for the Champion's seat and one for an Elite Four seat.",
    "An Elite Four member who wants promotion, has held the seat in two calendar years and didn't have the worst record of the four can challenge the Champion. A Gym Leader who wants promotion and whose gym was one of the year's three best-holding, or a challenger who reached the Elite Four this year and is clearly stronger than the seat's holder (or whose holder is 50 or older), can challenge the weakest Elite Four seat.",
    "A challenge is one battle at the seat's level. The challenger fields a team built for the seat, and keeps it if they win. A beaten Champion takes the winner's Elite Four seat; a beaten Elite Four member takes over the winning Gym Leader's gym, or goes back to the circuit (or retires) if a challenger beat them.",
    "In your League each challenge waits for your answer: approve or refuse it from the staff notices or the year report, within four weeks (unanswered, it goes ahead). A member of staff whose challenge you refuse, or who loses, turns restless: their promotion clock moves a year on. Anyone who challenged waits two years to try again. The Champion still can't be replaced by hand.",
    "Elite Four members' wish for promotion now has a clock for every seat, seat #4 included, since the Champion's seat can be challenged for.",
    "Every challenge shows as news, stops the sim in your League, and appears in a new Seat challenges section of the year report. The last six challenge battles of each League are kept to watch. Rival Leagues hold their challenges at once, and the multi-year sim approves yours.",
    "Fixed: a legendary joining a gym trainer or Gym Leader was added on top of their team, so they could field one Pokémon more than the gym allows.",
    "Fixed: a challenger who won the title and was hired by a League later that year dropped out of the year report's top ten.",
    "A glossary entry for Seat challenges. Saves from earlier versions no longer load.",
  ] },
  { id: 10, ver: '0.10.0', date: 'November 13, 2026', time: '10:13 PM ET', title: 'Ambitions', items: [
    "Every member of staff now has an ambition: promotion (a gym trainer wants a gym of their own, a Gym Leader a later gym or the Elite Four, an Elite Four member a higher seat), staying put, or another run as a challenger. It is set when they take a post, from their age, ratings, post and record, and can change on a birthday. The Champion always stays put. It shows on Your staff, the hiring pages and their profile.",
    "Promotion waits three years in the post, and shows as Restless in the last. Then a Gym Leader or Elite Four member gives 12 weeks' notice (a news item, a stop and a line in the staff notices) and leaves unless you promote them; the post opens with an acting holder, as when someone steps down. A gym trainer just goes, and their place is refilled. Seat #4 of the Elite Four wants the Champion's seat and waits for it.",
    "Staff who leave over an ignored ambition hold a grudge: back to the circuit (or retired, if over 45 with ten years behind them), and with another League open, half the time to that League's circuit, where it can hire them. Staff let go after announcing they would step down can take their grudge to another League the same way.",
    "Another run: a Gym Leader with five outstanding years in a row (and now and then a younger member of staff without a title) may ask to go back to the circuit as a challenger. Let them go on their run, and they come back sharper, guaranteed five years on the circuit; hold them, and they leave anyway a year after asking. This replaces the old automatic Gym Leader comeback.",
    "Staff can refuse a move. Anyone takes a move up. A step down (Elite Four to a gym, a gym to a gym trainer's place) is refused unless their record is poor (two poor years in a row, or the Elite Four's worst record two years running). Anyone who wants to stay put or wants another run refuses a sideways move or a swap. Letting someone go always works, and retirees and outsiders always accept.",
    "Career length now depends on the trainer: those who start young have the longest careers (about 22 to 30 years from age 10 to 14), late starters the shortest (about 8 to 16 from 35). Strong ratings and a title add up to three years, and long service in posts up to two more. Staff step down once past it (and ten years in posts), more likely each year past it.",
    "Rival Leagues answer ambitions: when a post opens they promote one of their own staff who wants it if they're nearly as good as the best newcomer, and fill the post they leave. The multi-year sim does the same for your League.",
    "A challenger who accepted your offer and then wins the title on their last run before arriving backs out half the time.",
    "Glossary entries for Ambitions, Another run, Refusing a move and Career length. Saves from earlier versions no longer load.",
  ] },
  { id: 9, ver: '0.9.0', date: 'November 13, 2026', time: '9:36 PM ET', title: 'Hiring and turnover', items: [
    "Hiring a challenger is now an offer. They can turn it down (and then aren't asked again for half a year); younger trainers, title winners, those doing well on a run and anyone holding a grudge are less keen. One out on a run who accepts finishes it first, for up to 8 weeks, and the post's holder (an acting holder, or the gym trainer you're replacing) stays until they arrive. You can withdraw an offer that was accepted.",
    "Recent retirees can be hired: trainers who retired in the last three years, under 55 and still OVR 55 or better. They come out of retirement at once, and a Hall of Famer stays one.",
    "Picking a gym trainer by hand now offers recent retirees and two outsiders of the leader's type as well. Outsiders nobody picks set out as challengers.",
    "When a gym trainer's place is filled automatically, the best fitting challenger takes it as before, then a recent retiree who fits, and only then a new trainer.",
    "Challengers who impressed you (reached the Elite Four, or won six or more badges in a run, this year or last) are tagged on the circuit and the hiring pages. A hired challenger shows where they're headed.",
    "Warnings: a Gym Leader's poor years in a row (the gym held under 30% of its tries) and an Elite Four member with the worst record of the four two or more years running show on Your staff and in the year report. In your League nothing happens unless you act.",
    "Rival Leagues now replace poor staff: a Gym Leader after three poor years in a row, and an Elite Four member after three years with the worst record of the four if someone clearly better is available. At most one gym and one seat a year.",
    "Rival Leagues fill a vacant post with the best of their circuit and recent retirees (a challenger can turn them down too), and bring in an outsider only when nobody fits. That holds for Elite Four seats as well as gyms.",
    "Glossary entries for Hiring, Impressed and Poor years.",
  ] },
  { id: 8, ver: '0.8.0', date: 'November 13, 2026', time: '8:45 PM ET', title: 'The year report', items: [
    "The year report replaces the year in review. It opens at New Year from the League menu and leads with the trainers let through (who beat the Champion, and when), then perfect years and the streak, how far the best challenger got and the badges conceded.",
    "Each headline number is set against last year, your best year (fewest let through, then fewest badges) and your average so far.",
    "The gyms: for each gym, its leader at year's end and anyone else who led it that year (acting leaders, swaps, moves), its gym trainers, the tries turned back by the gym trainers and by the leader, the badges conceded and the share of tries held. Badges conceded that your gyms still keep can be watched from the row.",
    "The Elite Four and the Champion: for each seat, who held it, how many runs reached it, how many it stopped and how many got past.",
    "The year's ten furthest challengers, every run at the Elite Four, and the year's awards.",
    "Any past year can be opened: step back and forward from the report, or click a year's number in the History page's wall report. Every League keeps its own reports, through the League switcher.",
    "Saves from earlier versions no longer load.",
  ] },
  { id: 7, ver: '0.7.0', date: 'November 13, 2026', time: '7:50 PM ET', title: 'Manage your staff', items: [
    "A new page, Your staff (under League), lists every post in your League. You can change your staff at any time, with no cost or limit for now.",
    "Let go: a Gym Leader's or Elite Four seat you open waits for you with an acting holder, just as when someone steps down. Whoever you let go returns to the circuit as a challenger, or retires if they are over 45 with ten years behind them. Someone who had already announced they were stepping down usually just retires, but now and then they take it as a slight and come back to the circuit to challenge you.",
    "Moving staff: the list of candidates for an open post now includes your other Gym Leaders and Elite Four members. Pick one and they move up, down or sideways; the post they leave opens with an acting holder, and you go straight to choosing for it. Fill it for me still picks only from the circuit, your gym trainers and outsiders, so nothing else opens.",
    "Swap trades two Gym Leaders' gyms or two Elite Four members' seats in one step. Each builds a team for their new post, and a gym trainer who no longer shares a type with the new leader is replaced from the circuit.",
    "Gym trainers: places still fill automatically from the circuit, but you can now Replace a gym trainer with someone you pick (a challenger, another gym trainer, or a Gym Leader or Elite Four member who fits), or let one go and have the place filled at once.",
    "The Champion can't be replaced by hand: the seat changes only when the Champion steps down.",
    "A challenger part-way through a gym whose staff change keeps the tries they have used, but must beat the gym's line from the first trainer again.",
    "Badges conceded lately: each of your gyms keeps its last three badges conceded (the battles its leader lost), to watch from the gym's card on the Gyms page.",
    "Fixes: a new gym trainer whose Pokémon would evolve off the gym's type at its level (a Dartrix becoming Decidueye in a Flying gym) gets an on-type Pokémon instead; a gym whose acting leader steps down takes on a gym trainer so it is never left with none; and the outsiders offered for a post that opens again join the circuit instead of waiting forever.",
  ] },
  { id: 6, ver: '0.6.0', date: 'November 13, 2026', time: '5:45 PM ET', title: 'Found your League by hand', items: [
    "You now found your League yourself. After choosing a region you place its Champion, four Elite Four members and eight Gym Leaders. You can pick from about 40 candidates the game finds (with a few stars and a handful of famous trainers among them) and from the founding field. Each trainer shows their type, age, OVR and all five ratings, and a type that another post already holds is flagged. Repeats are allowed.",
    "A gym's type is still its leader's class. Each gym takes on two gym trainers from the circuit, the best challengers who share a type with the leader, and the game makes one only when nobody fits. Anyone you don't place sets out as a challenger. The founding field is larger (36 instead of 24), so the circuit stays full.",
    "Fill the rest for me places the best available trainer in every empty post, preferring types that aren't taken yet. Your choices are saved as you go, and Back to setup starts again.",
    "Staff now step down only after a long career: once they are past their career length and have held posts for at least ten years. They announce it a year ahead with a news item, a stop and a Steps down tag, and they leave on their next birthday.",
    "When a Gym Leader or Elite Four member leaves your League, the post waits for you. Until you choose, the gym's stronger gym trainer is acting leader (the gym runs one gym trainer short), or a stand-in holds the Elite Four seat. The Champion's seat is never empty: the strongest Elite Four member moves up, and their seat is the one that waits.",
    "To fill a post, choose from everyone on the circuit, your own gym trainers and two outsiders, or press Fill it for me. Open posts and coming departures are listed at the top of the circuit and gym pages. Rival Leagues still fill their posts at once, and the multi-year sim fills yours for you.",
    "The sim now stops only for your own League (and for New Year).",
  ] },
  { id: 5, ver: '0.5.0', date: 'November 13, 2026', time: '4:30 PM ET', title: 'The wall, tuned', items: [
    "The wall is tuned. Every League's staff now build their teams as a trainer 45 rating points weaker would have before. Scouting, Strategy and Training still decide how good a team is, and the gap between strong and poor staff is unchanged, but no League is close to unbeatable any more. Even a League with excellent staff should expect to let a few trainers through each year, and a perfect year is now a rare feat.",
    "The Elite Four and Champion are still one run: a single loss ends it. Only an excellent challenger gets through all five battles.",
    "Challengers stay on the circuit longer. One who keeps going out early now gives up only after their first three years, and less often, so the field is older and larger (about 50 to 70 in a one-League world).",
    "A challenger who reached the Elite Four now takes their next run to another League three times in four, where there is one.",
    "The wall report on the History page leads with the number of trainers let through (titles conceded), then perfect years and the streak.",
  ] },
  { id: 4, ver: '0.4.0', date: 'November 13, 2026', time: '11:30 AM ET', title: 'One continuous world: no more seasons', items: [
    "There are no seasons any more. The world runs week by week on one calendar that never stops: a year is 48 weeks, twelve months of four. Nothing waits for a League tournament or an offseason.",
    "Every challenger is on their own clock. They set out on a run from the first gym with their best three Pokémon, get three tries at each gym, and take on the Elite Four and the Champion as soon as they have eight badges and are ready (up to three weeks spent filling their team first). A third loss at one gym ends the run. Then they rest for 6 to 10 weeks and set out again from the first gym with no badges.",
    "The wall is scored by the calendar year. A perfect year is one with no title conceded, and the streak counts perfect years in a row. The header also shows how long it has been since a title was last conceded, and the circuit page keeps a running tally of the year so far.",
    "Time moves with three buttons: Next week, Next month and To New Year. The longer steps stop early when something needs you: a title conceded, a post that fell vacant, or the New Year report. Sim years still plays whole years without stopping.",
    "The world's slow changes are spread through the year. Every trainer has a birthday week, when they grow a year older and their ratings move. Staff retire on their birthday and the post is filled at once; a challenger who decides to retire sees their run through first. New trainers set out one at a time, about eight a year.",
    "A circuit no longer has 24 places. Everyone who wants to challenge does. A challenger who keeps going out early (three or more runs in a row that end sooner than a typical run) gives up after their first two years, which keeps the field at around 30 to 40.",
    "New Year brings the year in review: the wall report, the awards, the meta report, the ban vote and, with two or more Leagues, the World Championship. History, records and profiles now count years, and a profile shows a challenger's best run of each year.",
    "Legendary encounters, roaming legendaries, storms, outbreaks and Ultra Wormholes can now begin in any week and leave on their own timers. They happen about as often per year as before.",
    "With more than one League, a challenger who reached the Elite Four often takes their next run to a different League after only 2 or 3 weeks of rest.",
    "Not tuned yet. The wall is still far too strong for a well-staffed League: tests showed that starting teams, squad picking, gym trainers and tries per gym barely move it, because almost nobody gets through the Elite Four and Champion. What to change instead is the next decision.",
    "Saves from earlier versions can't be loaded: the calendar changed too much. Start a new world.",
  ] },
  { id: 3, ver: '0.3.0', date: 'November 13, 2026', time: '9:50 AM ET', title: 'Gym types from the class, and staff who build their own teams', items: [
    "A gym's type is now its leader's class. A dual-type leader keeps both types: a Rock/Flying leader leads a Rock/Flying gym. A leader with no type focus (an Ace Trainer or a Veteran) leads a gym with a mixed team.",
    "Gym trainers follow the leader. In a typed gym each gym trainer shares at least one type with the leader and fields Pokémon of their own class's types, so a Rock/Flying gym can have a Rock/Fighting or a Flying/Fairy gym trainer. In an untyped gym they can be of any class. Gym trainers can now have a dual-type class too.",
    "Staff build their own teams, and their ratings decide how well. Scouting sets how strong the Pokémon they can find. Strategy decides how well the team fits together (fewer shared weaknesses, answers to what beats their type) and how many of their Pokémon hold an item. Training raises each Pokémon: better IVs, and more often a nature that suits it and coverage moves that cover its weak spots. Bond and Nerve still act inside the battle.",
    "Gym teams stay on their type. A leader on a losing streak, a ban replacement or a returning former Pokémon now always comes from the leader's own types, so a Fire gym can no longer end up with no Fire Pokémon.",
    "The meta report still names the season's top Pokémon, but the Gym Leaders and Elite Four no longer swap in off-type counters for them. How a League answers the meta will be redesigned.",
    "Staff now leave only by retiring with age. A leader is no longer replaced after three poor seasons, a leader no longer returns to the circuit after a long run of strong ones, and a challenger no longer takes an Elite Four seat after a deep League run. These come back later as your decisions.",
    "Gym weather now comes from the gym: the first of its leader's types that brings weather sets it for every battle there, gym trainers included.",
    "Not tuned yet. Strong staff now hold the wall far better than poor staff, and the wall is still too strong overall. Tuning waits for the next change to how the calendar works.",
  ] },
  { id: 2, ver: '0.2.0', date: 'November 12, 2026', time: '9:45 PM ET', title: 'The wall: set levels, three tries and gym trainers', items: [
    "Every battle on the circuit is now fought at a set level for both sides: gyms at 16, 24, 32, 41, 51, 61, 70 and 77, the Elite Four at 81, 84, 87 and 89, and the Champion at 96. Nobody can out-level a gym any more, so gym 1 can be a wall too.",
    "Challengers' Pokémon no longer have levels of their own. Each one takes the form and moves it would have at the level of its trainer's next battle, so a trainer with a Charizard meets gym 1 with a Charmander. Challengers spend the season building a team and taking on the gyms. The Lucky Egg is gone, since there are no levels to gain.",
    "A challenger fields as many Pokémon as the trainer in front of them, picked for the matchup. A higher Strategy rating picks better.",
    "Gym teams are bigger at the early gyms: 3, 3, 4, 4, 5, 5, 6 and 6 Pokémon. Every Elite Four member now fields six.",
    "Every gym has two gym trainers of the leader's type, each with one Pokémon fewer than the leader. A challenger must beat both, then the leader, and is healed between battles. A gym trainer already beaten stays beaten. Gym trainers are placed automatically for now.",
    "Three tries per gym. A loss to a gym trainer or the leader costs one, and a third loss at the same gym ends that challenger's season. The circuit page shows each challenger's tries left, or the week they went out.",
    "Your Champion keeps the seat when beaten. The winner is credited with a title and stays a challenger, and the League records a title conceded. If several challengers beat the Champion in one season, each win counts.",
    "The Champion now leaves only by retiring with age; the strongest Elite Four member moves up, automatically for now. The Elite Four title shot and the Interim Champion rule are gone.",
    "Gym rotation is removed: leaders and their gym trainers stay at their gym.",
    "New wall report on the History page: perfect seasons (no title conceded) and the streak, and for each season the titles and badges conceded and how far the best challenger got. The Gyms page shows each gym's set level, its gym trainers and its record of tries turned back and badges conceded.",
    "Saves from 0.1.0 can't be loaded, because the rules of the world changed. Start a new League.",
    "Nothing is balanced yet. These rules are measured, not tuned; tuning comes with the next version.",
  ] },
  { id: 1, ver: '0.1.0', date: 'November 12, 2026', time: '9:03 PM ET', title: 'The seed: a world that runs on its own', items: [
    "Pokémon League Builder starts here, seeded from Pokémon League GM 2.0.2. It has its own save, its own version numbers and this fresh changelog. The two games don't share saves.",
    "You don't run a League yet. For now the world runs itself: 24 challengers travel the badge circuit each season, and the Gym Leaders, the Elite Four and the Champion try to stop them. You pick the region, play or sim the seasons, and watch.",
    "Taken out, because they don't serve a game about running a League: the draft, teams and travelling parties, trust and sit-downs, trades and road trades, the ranch, the Team Battle Cup, the Midseason Tournament, villain events and Shadow Pokémon, Pokérus and Lucky Pokémon, and the office, party and trade screens.",
    "With no draft, new trainers set out on their own each offseason. They and the free agents compete for the 24 places on a League's circuit.",
    "The banlist is decided by the League's trainers alone for now. Challengers let banned Pokémon go.",
    "Kept: the battle engine and all Pokémon, move and ability data; catching and wild Pokémon; trainer ratings, traits and classes; famous trainers, trainer packs and My Pokédex; Gym Leaders adapting and gym weather; legendary events; several Leagues and the World Championship; records, the Hall of Fame and god mode (open a League, edit any trainer).",
    "Cities are now things of their own in the world, and a gym sits in a city. Nothing looks different yet; it is groundwork for Leagues sharing cities later.",
  ] },
];
const UPDATES_SEEN_KEY = 'plb-updates-seen';
const updatesSeen = () => { try { return +(localStorage.getItem(UPDATES_SEEN_KEY) || 0); } catch (e) { return 0; } };
const updatesNew = () => UPDATES.length && UPDATES[0].id > updatesSeen();
function markUpdatesSeen() { try { localStorage.setItem(UPDATES_SEEN_KEY, String(UPDATES[0].id)); } catch (e) {} }
const UPDATES_RULE = 'Every version is numbered, dated and timestamped (Eastern Time). All the changes made in one round of work are listed together under that one version.';
function updStamp(u) { return `v${verName(u)} · ${u.date}${u.time ? ` · ${u.time}` : ''}`; }
function viewUpdates() {
  const back = S ? '' : '<button class="btn small" data-act="nav" data-v="circuit">← Back to setup</button>';
  return `<section class="panel callout"><div class="ph"><h1>Updates</h1>${back}</div>
    <p class="muted">What's changed in ${GAME_NAME}, newest first. Current version: <span class="num">${updStamp(UPDATES[0])}</span></p>
    <p class="fine"><strong>Versioning rule:</strong> ${UPDATES_RULE}</p></section>
  <section class="panel"><div class="ph"><h2>Changelog</h2><span class="muted">${UPDATES.length} updates</span></div>
    ${UPDATES.map(u => `<section class="upd"><div class="upd-h"><h3>${u.title}</h3><span class="muted small num">${updStamp(u)}</span></div><ul class="changes">${u.items.map(x => `<li>${x}</li>`).join('')}</ul></section>`).join('')}</section>
  <section class="panel"><div class="ph"><h2>Copyright disclaimer</h2></div>
    <p>${GAME_NAME} is an unofficial, fan-made game. It is not affiliated with, endorsed, sponsored or approved by Nintendo, Creatures Inc., GAME FREAK inc. or The Pokémon Company.</p>
    <p>Pokémon, Pokémon names, moves, abilities, items and all related names and trademarks are © and ™ Nintendo, Creatures Inc. and GAME FREAK inc. They are used here for non-commercial fan purposes only, and no infringement is intended.</p>
    <p>Any other names, including real people, teams and brands in optional trainer packs, are trademarks of their respective owners and are used only for fun. Those owners have no connection to this game.</p>
    <p>${GAME_NAME} is open source. To get access to the project, ask in the Discord: <a href="https://discord.gg/2mbaC7gUMk" target="_blank" rel="noopener noreferrer">discord.gg/2mbaC7gUMk</a>.</p></section>
  <section class="panel"><div class="ph"><h2>AI use disclosure</h2></div>
    <p>This game was made with generative AI. Its code, in-game text and game data were written with Claude, an AI model made by Anthropic, following the creator's design, direction and testing.</p>
    <p>The game uses no AI-generated images, music or voices. Pokémon data is adapted from the main series games, and AI-written content may contain mistakes.</p></section>`;
}
function updatesBody() {
  return `<div class="mh"><h2>Updates</h2><button class="btn icon" data-act="close" aria-label="Close">×</button></div>
  <p class="muted small">What's changed in ${GAME_NAME}, newest first.</p>
  ${UPDATES.map(u => `<section class="upd"><div class="upd-h"><h3>${u.title}</h3><span class="muted small">${u.date}</span></div><ul class="changes">${u.items.map(x => `<li>${x}</li>`).join('')}</ul></section>`).join('')}`;
}
function menuBody() {
  const m = modal;
  return `<div class="mh"><h2>World file</h2><button class="btn icon" data-act="close" aria-label="Close">×</button></div>
  <div class="confirm-row"><button class="btn" data-act="simmany">Sim multiple years…</button><button class="btn" data-act="glossary">Glossary</button><button class="btn" data-act="images">Images</button><button class="btn" data-act="updates">Updates${updatesNew() ? ' <span class="newdot" aria-label="new"></span>' : ''}</button></div>
  <p class="muted">Progress saves automatically in this browser after every week. Copy the save to back it up or move it to another device.</p>
  <div class="confirm-row"><button class="btn" data-act="export">Copy save to clipboard</button>${canSaveFile() ? '<button class="btn" data-act="savefile">Download save file</button>' : ''}<button class="btn" data-act="importshow">Load a save</button></div>
  ${m.copying ? '<p class="fine">Preparing the save…</p>' : m.copied ? '<p class="fine">Save copied to the clipboard. Paste it into Load a save to bring this world back.</p>' : ''}
  ${m.exportText ? `<textarea id="exportbox" class="box" readonly rows="4">${m.exportText}</textarea><p class="fine">The clipboard isn't available here. Select the text above and copy it.</p>` : ''}
  ${m.importing ? `<label class="fine" for="importbox">Paste a save:</label><textarea id="importbox" class="box" rows="4"></textarea><div class="confirm-row"><button class="btn primary" data-act="importgo">Load this save</button></div>${m.err ? `<p class="warn">${m.err}</p>` : ''}` : ''}
  <hr><div class="confirm-row">${m.confirmNew ? `<span>This erases the current world.</span><button class="btn danger" data-act="newgo">Erase and start over</button><button class="btn" data-act="newcancel">Cancel</button>` : `<button class="btn danger" data-act="newask">Start a new world</button>`}</div>`;
}

// ---------- battle viewer ----------
function battleShell() {
  const r = modal.r;
  const side = (s, si) => `<div class="bside s${si}"><div class="bname">${trMini(T(s.id), 32)}<span>${s.name}</span></div><div class="pips">${s.team.map((m, i) => `<span class="pip" id="pip-${si}-${i}" title="${m.sp}"></span>`).join('')}</div>
    <div class="active" id="act-${si}"><span class="a-pic" id="apic-${si}"></span><span class="a-name">—</span><span class="a-lv"></span><div class="hp"><i id="hp-${si}"></i></div></div></div>`;
  return `<div class="mh"><h2>${r.title}</h2><button class="btn icon" data-act="close" aria-label="Close">×</button></div>
  <div class="arena">${side(r.sides[0], 0)}<div class="vs">VS</div>${side(r.sides[1], 1)}</div>
  <ol class="blog" id="blog"></ol>
  <div class="bspeed" id="bspeed"><span class="bspeed-l">Speed</span><span class="segs bspeed-segs" role="group" aria-label="Battle speed">${BSPEEDS.map(([k, , label]) => `<button class="seg${bSpeed === k ? ' on' : ''}" data-act="bspeed" data-v="${k}" aria-pressed="${bSpeed === k}">${label}</button>`).join('')}</span><button class="btn small" data-act="bpause" id="bpause">Pause</button></div>
  <div class="confirm-row"><button class="btn" data-act="bskip" id="bskip">Skip to the result</button><span class="bresult" id="bres"></span></div>`;
}
// Battle speed (v202): milliseconds per line of the battle log; the choice is remembered in this browser.
const BSPEEDS = [['slow', 1100, 'Slow'], ['normal', 600, 'Normal'], ['fast', 260, 'Fast'], ['vfast', 80, 'Very fast']];
const BSPEED_KEY = 'plb-battle-speed';
let bSpeed = (() => { try { const v = localStorage.getItem(BSPEED_KEY); return BSPEEDS.some(b => b[0] === v) ? v : 'normal'; } catch (e) { return 'normal'; } })();
const bSpeedMs = () => (BSPEEDS.find(b => b[0] === bSpeed) || BSPEEDS[1])[1];
function setBattleSpeed(v) {
  if (!BSPEEDS.some(b => b[0] === v)) return; bSpeed = v; try { localStorage.setItem(BSPEED_KEY, v); } catch (e) {}
  document.querySelectorAll('[data-act="bspeed"]').forEach(b => { const on = b.dataset.v === v; b.classList.toggle('on', on); b.setAttribute('aria-pressed', on); });
  if (modal && modal.kind === 'battle' && modal.resume && !modal.paused && !modal.done) modal.resume();
}
function toggleBattlePause() {
  if (!modal || modal.kind !== 'battle' || modal.done) return;
  modal.paused = !modal.paused; const b = $('#bpause'); if (b) b.textContent = modal.paused ? 'Play' : 'Pause';
  if (modal.paused) clearInterval(player); else modal.resume && modal.resume();
}
function startPlayback() {
  clearInterval(player);
  const r = modal.r; let k = 0;
  const hp = [[], []]; r.sides.forEach((s, si) => s.team.forEach((m, i) => hp[si][i] = m.max));
  const act = [-1, -1];
  const logEl = $('#blog');
  const megaName = [{}, {}];
  const nm = (si, i) => megaName[si][i] || r.sides[si].team[i].sp;
  function line(text, cls = '') { const li = document.createElement('li'); li.className = cls; li.innerHTML = text; logEl.appendChild(li); logEl.scrollTop = logEl.scrollHeight; }
  function updActive(si) { const i = act[si]; if (i < 0) return; const m = r.sides[si].team[i]; const box = $('#act-' + si);
    { const pic = $('#apic-' + si), key = m.sp + (m.shiny ? '*' : ''); if (pic && pic.dataset.k !== key) { pic.dataset.k = key; const u = monImg(m.sp, m.shiny || m.radiant); pic.innerHTML = u ? `<img class="pic${si ? ' flip' : ''}" src="${u}" alt="" width="76" height="76">` : ''; } } box.querySelector('.a-name').textContent = m.sp; box.querySelector('.a-lv').textContent = 'Lv ' + (SP[m.sp] && SP[m.sp].glitch ? '??' : m.L); const pct = Math.max(0, hp[si][i] / m.max * 100); const bar = $('#hp-' + si); bar.style.width = pct + '%'; bar.className = pct < 25 ? 'red' : pct < 50 ? 'amb' : ''; }
  function step() {
    const e = r.ev[k++]; if (!e) { clearInterval(player); return false; }
    if (e.k === 'send') { act[e.s] = e.i; $(`#pip-${e.s}-${e.i}`)?.classList.add('out'); line(`<b>${r.sides[e.s].name}</b> sends out <b>${nm(e.s, e.i)}</b> (Lv ${SP[r.sides[e.s].team[e.i].sp] && SP[r.sides[e.s].team[e.i].sp].glitch ? '??' : r.sides[e.s].team[e.i].L}).`, 'send'); updActive(e.s); }
    if (e.k === 'hit') { const ts = 1 - e.s; const prev = hp[ts][e.ti]; hp[ts][e.ti] = e.hp; const pct = Math.round((prev - e.hp) / r.sides[ts].team[e.ti].max * 100);
      const tags = (e.mult >= 2 ? ' <em class="se">super effective</em>' : e.mult < 1 ? ' <em class="nve">not very effective</em>' : '') + (e.crit ? ' <em class="crit">critical hit</em>' : '') + (e.feel === 'solid' ? ' <em class="solid">solid hit</em>' : e.feel === 'glance' ? ' <em class="glance">glancing blow</em>' : '') + (e.mo ? ' <em class="mo">on a roll</em>' : '');
      line(e.mn ? `${nm(e.s, e.i)} used <b>${e.mn}</b>! ${nm(ts, e.ti)} loses ${pct}%.${tags}` : `${nm(e.s, e.i)} hits ${nm(ts, e.ti)}${e.mt ? ` with a ${e.mt} move` : ''} for ${pct}%.${tags}`, 'hit s' + e.s); updActive(ts); }
    if (e.k === 'miss') line(`${nm(e.s, e.i)} used <b>${e.mn}</b>, but it missed${e.guard ? ` — ${nm(1 - e.s, e.ti)} was ready for it` : ''}!`, 'miss');
    if (e.k === 'dodge') line(`${nm(e.s, e.i)} used <b>${e.mn}</b>, but ${nm(1 - e.s, e.ti)} dodged it!`, 'miss');
    if (e.k === 'use') line(`${nm(e.s, e.i)} used <b>${e.mn}</b>!`, 'hit s' + e.s);
    if (e.k === 'mega') { line(`<b>${r.sides[e.s].name}</b>'s Key Stone reacts! ${nm(e.s, e.i)} Mega Evolved into <b>${e.to}</b>!`, 'mega'); megaName[e.s][e.i] = e.to; updActive(e.s); }
    if (e.k === 'bond') { line(`${nm(e.s, e.i)} and <b>${r.sides[e.s].name}</b> are in perfect sync! It became <b>${e.to}</b>!`, 'bond'); megaName[e.s][e.i] = e.to; updActive(e.s); }
    if (e.k === 'pain') line(`<b>${r.sides[e.s].name}</b> feels ${nm(e.s, e.i)}'s pain, and the rest of the team falters.`, 'pain');
    if (e.k === 'endure') line(`${nm(e.s, e.i)} hung on at 1 HP!`, 'endure');
    if (e.k === 'note') { if (e.hp != null && e.s >= 0) { hp[e.s][e.i] = e.hp; updActive(e.s); }
      line(e.txt.replace('{0}', e.s >= 0 ? `<b>${nm(e.s, e.i)}</b>` : '').replace('{1}', e.os != null ? `<b>${nm(e.os, e.oi)}</b>` : ''), 'note ' + (e.cls || '')); }
    if (e.k === 'item') { const it = ITEMS[e.it] ? ITEMS[e.it].name : e.it; if (e.hp != null) { hp[e.s][e.i] = e.hp; updActive(e.s); }
      line(e.it === 'focussash' ? `${nm(e.s, e.i)} hung on with its <b>${it}</b>!` : e.it === 'sitrus' ? `${nm(e.s, e.i)} ate its <b>${it}</b> and restored some HP.` : e.it === 'leftovers' ? `${nm(e.s, e.i)} restored a little HP with its <b>${it}</b>.` : e.it === 'lifeorb' ? `${nm(e.s, e.i)} lost some HP to its <b>${it}</b>.` : `${nm(e.s, e.i)}'s ${it}.`, 'item'); }
    if (e.k === 'faint') { $(`#pip-${e.s}-${e.i}`)?.classList.add('down'); line(`${nm(e.s, e.i)} fainted.`, 'faint'); }
    if (e.k === 'end') { const w = r.sides[e.w]; line(`<b>${w.name}</b> wins with ${w.left} Pokémon left.`, 'end'); $('#bres').textContent = w.name + ' wins'; $('#bskip').hidden = true; modal.done = true; const sp = $('#bspeed'); if (sp) sp.hidden = true; }
    return true;
  }
  modal.skip = () => { while (step()) {} };
  const reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  modal.paused = false; modal.done = false;
  modal.resume = () => { clearInterval(player); player = setInterval(step, bSpeedMs()); };
  if (reduce) modal.skip(); else modal.resume();
}

// ---------- render ----------
// ---------- playing inside another site's page (itch.io and the like) ----------
// There the game is a frame from another site, and many browsers (every iPhone / iPad browser, Safari, Brave) keep its
// storage only until the browser closes. Opening the game in its own tab saves normally; the league is handed over.
const EMBEDDED = (() => { if (window.claude) return false; try { return window.self !== window.top && !window.top.location.href; } catch (e) { return true; } })();
let embedNoteHidden = (() => { try { return sessionStorage.getItem('plb-embed-note') === '1'; } catch (e) { return false; } })();
function embedNote() {
  if (!EMBEDDED || embedNoteHidden) return '';
  return `<div class="embednote" role="note"><div class="embednote-in"><span><b>Your saves may not last here.</b> Some browsers (every iPhone and iPad browser, Safari, Brave) wipe a game's saves when it's played inside another site's page. Open the game in its own tab to keep your progress${S ? ' (your world comes with it)' : ''}, and copy your save from the ⋯ menu now and then as a backup.</span>
    <span class="embednote-act"><button class="btn small primary" data-act="ownTab">Open in its own tab</button><button class="btn small ghost" data-act="embedhide">Hide</button></span></div></div>`;
}
// the itch page's copy opens a new tab and, when that tab says it's ready, hands it the current league as a save code
function openOwnTab() {
  const url = location.href.split('#')[0] + '#from-embed';
  const w = window.open(url, '_blank');
  if (!w) { toast("The browser blocked the new tab. Allow pop-ups for this page, or copy your save and load it in a new tab."); return; }
  const onMsg = async ev => {
    if (ev.source !== w || ev.origin !== location.origin || !ev.data || ev.data.type !== 'plb-ready') return;
    window.removeEventListener('message', onMsg);
    w.postMessage({ type: 'plb-save-msg', code: S ? await saveCode() : null }, location.origin);
  };
  window.addEventListener('message', onMsg);
  setTimeout(() => window.removeEventListener('message', onMsg), 60000);
}
// the new tab: ask the page that opened it for its league, and take it unless this tab already has a later season
function receiveFromEmbed() {
  if (typeof location === 'undefined' || location.hash !== '#from-embed' || !window.opener) return;
  history.replaceState(null, '', location.href.split('#')[0]);
  const onMsg = async ev => {
    if (ev.source !== window.opener || ev.origin !== location.origin || !ev.data || ev.data.type !== 'plb-save-msg') return;
    window.removeEventListener('message', onMsg);
    if (!ev.data.code) return;
    const v = await parseSave(ev.data.code); if (!v) return;
    if (S && (S.season || 0) > (v.season || 0)) { toast('This tab already has a later year of your world, so it was kept.'); return; }
    adoptSave(v); save(); render(); toast(`Your world came over from the other page: Year ${S.season || 1}. Progress now saves in this tab.`);
  };
  window.addEventListener('message', onMsg);
  try { window.opener.postMessage({ type: 'plb-ready' }, location.origin); } catch (e) {}
}
function render() {
  applyDex(dexWanted());
  ensureCustom();
  const app = $('#app');
  if (S) fixView();
  if (!S) { app.innerHTML = `<header class="top"><div class="top-in"><div class="mark"><span class="mark-ball" aria-hidden="true"></span><div><div class="mark-name">${GAME_NAME} <span class="mark-ver">v${verName(UPDATES[0])}</span></div><div class="mark-sub">New world</div></div></div><div class="top-act"><button class="btn ghost" data-act="glossary">Glossary</button><button class="btn ghost" data-act="updates">Updates${updatesNew() ? '<span class="newdot"></span>' : ''}</button></div></div></header>` + embedNote() + (view === 'updates' ? `<main class="wrap" id="main">${viewUpdates()}</main>` : viewSetup()); if (view === 'updates') applyFolds(app, 'updates'); return; }
  if (S.founding) useLeague(ME());
  if (S.founding) { app.innerHTML = `<header class="top"><div class="top-in"><div class="mark"><span class="mark-ball" aria-hidden="true"></span><div><div class="mark-name">${GAME_NAME} <span class="mark-ver">v${verName(UPDATES[0])}</span></div><div class="mark-sub">Founding the ${S.lgName}</div></div></div><div class="top-act"><button class="btn ghost" data-act="glossary">Glossary</button></div></div></header>` + embedNote() + viewFounding() + '<div id="toast" class="toast" role="status" hidden></div>'; return; }
  bindView();
  if (['hire', 'staff', 'gtpick', 'money', 'cities', 'contenders', 'ranch'].includes(view)) useLeague(ME());
  let v = '';
  if (view === 'circuit') v = viewCircuit();
  if (view === 'gyms') v = viewGyms();
  if (view === 'news') v = viewNews();
  if (view === 'history') v = viewHistory();
  if (view === 'records') v = viewRecords();
  if (view === 'hof') v = viewHof();
  if (view === 'dex') v = viewDex();
  if (view === 'trainers') v = viewTrainers();
  if (view === 'recap') v = viewRecap();
  if (view === 'god') v = viewGod();
  if (view === 'hire') v = viewHire();
  if (view === 'staff') v = viewStaff();
  if (view === 'meta') v = viewMeta();
  if (view === 'money') v = viewMoney();
  if (view === 'table') v = viewTable();
  if (view === 'board') v = viewBoard();
  if (view === 'cities') v = viewCities();
  if (view === 'ranch') v = viewRanch();
  if (view === 'contenders') v = viewContenders();
  if (view === 'gtpick') v = viewGtPick();
  if (view === 'updates') v = viewUpdates();
  app.innerHTML = header() + nav() + embedNote() + `<main class="wrap" id="main">${lgBar()}${v}</main><div id="toast" class="toast" role="status" hidden></div>`;
  applyFolds(app, foldScope());
}
// ---------- collapsible boxes (v171) ----------
// Any panel with a heading, and each Records board, folds down to its header when its title is tapped. What's
// folded is remembered per page (a trainer's page counts as one page for every trainer), in this browser only.
const FOLD_STORE = 'plb-folds';
let folded = (() => { try { return new Set(JSON.parse(localStorage.getItem(FOLD_STORE) || '[]')); } catch (e) { return new Set(); } })();
const foldScope = () => view;
function saveFolds() { try { localStorage.setItem(FOLD_STORE, JSON.stringify([...folded].slice(-400))); } catch (e) {} }
function applyFolds(root, scope) {
  if (!root || !root.querySelectorAll) return;
  const mark = (box, head, key) => {
    if (!head || head.dataset.act || head.querySelector('.fchev')) return;
    key = key.replace(/▾/g, '').replace(/\d+/g, '#').replace(/\s+/g, ' ');
    const shut = folded.has(key);
    box.classList.add('can-fold'); box.classList.toggle('folded', shut); head.classList.add('fold-head');
    head.dataset.act = 'fold'; head.dataset.k = key;
    head.setAttribute('role', 'button'); head.setAttribute('tabindex', '0'); head.setAttribute('aria-expanded', String(!shut));
    head.insertAdjacentHTML('afterbegin', '<span class="fchev" aria-hidden="true">▾</span>');
  };
  for (const box of root.querySelectorAll('section.panel')) {
    if (box.classList.contains('fold')) continue; // the Advanced page has its own folding
    const head = box.querySelector(':scope > .ph > h2, :scope > .ph > h3') || box.querySelector(':scope > h2, :scope > h3');
    if (head) mark(box, head, `${scope}|${head.textContent.trim()}`);
  }
  for (const box of root.querySelectorAll('.upd')) { const head = box.querySelector(':scope > .upd-h > h3'); if (head) mark(box, head, `${scope}|upd|${head.textContent.trim()}`); }
  for (const box of root.querySelectorAll('.gl-sec')) { const head = box.querySelector(':scope > .gl-h > h3'); if (head) mark(box, head, `${scope}|gloss|${head.textContent.trim()}`); }
  for (const box of root.querySelectorAll('.recboard:not(.big)')) {
    const head = box.querySelector(':scope > .rec-h');
    const sec = box.closest('section.panel'), secH = sec && sec.querySelector(':scope > .ph > h2');
    if (head) mark(box, head, `${scope}|board|${secH ? secH.textContent.replace('▾', '').trim() : ''}|${head.textContent.trim()}`);
  }
}
function toggleFold(el) {
  const k = el.dataset.k, box = el.closest('.can-fold'); if (!k || !box) return;
  const shut = !folded.has(k);
  if (shut) folded.add(k); else folded.delete(k);
  box.classList.toggle('folded', shut); el.setAttribute('aria-expanded', String(!shut));
  saveFolds();
}
// with several Leagues, the league-wide pages show one League at a time; a trainer's page shows their own League
const VIEWS = ['circuit', 'gyms', 'news', 'history', 'records', 'hof', 'dex', 'trainers', 'recap', 'god', 'updates', 'hire', 'staff', 'meta', 'money', 'cities', 'gtpick', 'contenders', 'table', 'board', 'ranch'];
const LG_VIEWS = ['circuit', 'gyms', 'news', 'history', 'recap', 'records', 'board'];
function bindView() {
  if (!S || nLeagues() < 2) return;
  viewLg = Math.min(viewLg, nLeagues() - 1);
  useLeague(viewLg);
}
function lgBar() {
  if (nLeagues() < 2 || !LG_VIEWS.includes(view)) return '';
  return `<nav class="lgbar segs" aria-label="League">${Array.from({ length: nLeagues() }, (_, i) => `<button class="seg${i === viewLg ? ' on' : ''}" data-act="lgview" data-v="${i}" aria-pressed="${i === viewLg}">${leagueName(i)}</button>`).join('')}</nav>`;
}
function toast(msg) { const el = $('#toast'); if (!el) return; el.textContent = msg; el.hidden = false; clearTimeout(toastTimer); toastTimer = setTimeout(() => { el.hidden = true; }, 3400); }
function go(v) { view = v; render(); window.scrollTo(0, 0); }
// a view that no longer fits (a year in review before the first New Year, god mode in a world without it) falls back to the circuit
function fixView() { if (!VIEWS.includes(view) || (view === 'recap' && !S.history.some(x => x.titles != null)) || (view === 'god' && !godOn()) || (['staff', 'gtpick', 'contenders'].includes(view) && !handOn()) || (view === 'gtpick' && !gtSel)) view = 'circuit'; }

// after a staffing move: a post it opened (a vacancy) goes straight to its hiring page; otherwise back to the staff page
function afterMove(r, msg) {
  const vi = typeof r === 'object' ? (S.vacancies || []).indexOf(r) : -1;
  if (vi >= 0) { hireIdx = vi; hireFit = false; go('hire'); toast(`${msg} ${vacancyName(r)} is now waiting for you.`); }
  else { go('staff'); toast(msg); }
}
// what came of picking someone on a hiring page (0.9.0): taken at once, accepted for after their run, or turned down
function hireResult(o, id, name) {
  const t = T(id);
  if (!o || !o.res || (o.res === 'now' && !o.r)) { render(); return; }
  save();
  if (o.res === 'now') afterMove(o.r, `${dn(t)} takes the post: ${name}.`);
  else if (o.res === 'later') { go('staff'); toast(`${t.name} accepted (${name}) and comes after their run, by ${turnDate(t.hired.by)} at the latest.`); }
  else if (o.res === 'refused') { render(); toast(`${t.name} turned the offer down.`); }
  else if (o.res === 'broke') { render(); toast('The League is in the red: nobody new can be hired until it is back above zero.'); }
  else render();
}
// ---------- actions ----------


// Move time on by up to n weeks. A step of more than a week stops early when something needs you: a title
// conceded, a post that fell vacant, or the New Year report (which opens the year report).
function playWeeks(n) {
  const y = S.season, stop = simWeeks(n, n > 1);
  save();
  if (S.season !== y) { repYear = null; go('recap'); toast(`Year ${y} is over. Here is the year report.`); return; }
  render();
  toast(stop ? `Stopped in ${weekName(S.week)}: ${stop.text}` : `It is now ${weekName(S.week)}, Year ${S.season}.`);
}

// open / close the page menu's dropdowns in place (no full re-render)
function syncNav() { document.querySelectorAll('.navgrp').forEach(g => { const b = g.querySelector('.navbtn'), on = !!b && b.dataset.k === navOpen; g.classList.toggle('open', on); if (b) b.setAttribute('aria-expanded', String(on)); }); }
document.addEventListener('click', ev => {
  if (navOpen && !ev.target.closest('.navgrp')) { navOpen = null; syncNav(); }
  const el = ev.target.closest('[data-act]'); if (!el) return;
  if (el.dataset.act === 'fold') { toggleFold(el); return; }
  const a = el.dataset.act;
  if (el.disabled) return;
  if (!S && dexAction(a, el)) { render(); return; }
  // an action on a trainer works in that trainer's League
  if (S && nLeagues() > 1 && el.dataset.id && T(+el.dataset.id)) useLeague(lgOf(T(+el.dataset.id)));
  switch (a) {
    case 'imgup': openImgUp(el.dataset.k, el.dataset.c); break;
    case 'imgopt': if (modal && modal.draft) { modal.draft[el.dataset.k] = !modal.draft[el.dataset.k]; imgRedraft(); } break;
    case 'imgsave': imgSaveDraft(); break;
    case 'imgdel': { const k = modal.key; imgDel(k).then(() => { modal = modal && modal.kind === 'img' ? modal.back || null : modal; renderModal(); render(); toast(`Removed the image for ${imgLabel(k)}.`); }); break; }
    case 'images': imgMsg = ''; imgClearArm = false; modal = { kind: 'images', back: modal }; renderModal(); break;
    case 'imgtab': imgTab = el.dataset.v; imgQ = ''; imgRefresh(); break;
    case 'imgexport': imgExport(); break;
    case 'imgclear': imgClearArm = true; imgRefresh(); break;
    case 'imgclearno': imgClearArm = false; imgRefresh(); break;
    case 'imgclearyes': imgClearAll().then(() => render()); break;
    case 'setleagues': setupLeagues = +el.dataset.v; render(); break;
    case 'setgrowth': setupGrowth = el.dataset.v === '1'; render(); break;
    case 'setgod': setupGod = el.dataset.v === '1'; render(); break;
    case 'godleague': { const why = godOpenLeague(); save(); render(); toast(why || `The ${leagueName(nLeagues() - 1)} is open.`); break; }
    case 'lgview': viewLg = +el.dataset.v; boardSel = null; render(); break;
    case 'setuppage': setupPage = el.dataset.v; render(); window.scrollTo(0, 0); break;
    case 'advtoggle': setupAdv[el.dataset.k] = !setupAdv[el.dataset.k]; render(); break;
    case 'packlist': setupPackOpen[el.dataset.k] = !setupPackOpen[el.dataset.k]; render(); break;
    case 'feattoggle': setupOff[el.dataset.k] = !setupOff[el.dataset.k]; render(); break;
    case 'featreset': setupOff = {}; render(); break;
    case 'cfexport': cfExport = cfExport === el.dataset.k ? null : el.dataset.k; if (setupPage === 'custom') cfRead(); render(); { const b = $('.cf-export'); if (b) b.scrollIntoView({ block: 'nearest' }); } break;
    case 'cfexpclose': cfExport = null; if (setupPage === 'custom') cfRead(); render(); break;
    case 'cfexpcopy': { const ta = $('#cf-exptext'); if (!ta) break; const done = () => toast('Pack copied. Paste it into Import trainers on another device.');
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(ta.value).then(done, () => { ta.select(); toast('Select all and copy the text.'); }); else { ta.select(); toast('Select all and copy the text.'); } break; }
    case 'cfexpfile': { const k = el.dataset.k, packs = exportPacksFor(k); if (packs.length) downloadText(packFileName(k), packExportText(packs)); break; }
    case 'cfimport': cfImp = cfImpBlank(el.dataset.k || 'text'); if (cfImp.src !== 'text') cfImpLoad(); setupPage = 'import'; cfExport = null; render(); window.scrollTo(0, 0); break;
    case 'cfimpread': { const ta = $('#cfimptext'); if (ta) cfImp.text = ta.value; cfImpLoad(); render(); break; }
    case 'cfimpall': { const on = el.dataset.v === '1'; cfImp.groups.forEach((g, gi) => g.rows.forEach((r, i) => { if (r.entry && cfImpMatch(r, cfImp.q)) { if (on) cfImp.sel.add(gi + ':' + i); else cfImp.sel.delete(gi + ':' + i); } }));
      const nm = $('#cfimpname'); if (nm) cfImp.newName = nm.value; render(); break; }
    case 'cfimpgo': cfImpCommit(); render(); window.scrollTo(0, 0); break;
    case 'cfopen': cfOpen(el.dataset.k); render(); window.scrollTo(0, 0); break;
    case 'cfnewpack': { const inp = $('#cf-newpack'); cfNewPackName = inp ? inp.value : ''; const r = checkPackName(cfNewPackName); cfNewPackErr = r.err || '';
      if (r.name) { const key = newCustomKey(); const ok = setCustomLib(customLib.concat([{ key, name: r.name, trainers: [] }])); setupPacks[key] = true; cfNewPackName = ''; cfOpen(key);
        cfMsg = `Created ${r.name} and switched it on.${ok ? '' : " This browser couldn't store it, so it will be gone when the page closes."}`; window.scrollTo(0, 0); }
      render(); break; }
    case 'cfrename': { cfRead(); const pk = customPack(cfPack); if (!pk) break; const r = checkPackName(($('#cf-packname') || {}).value, pk.key); cfErrs = []; cfMsg = '';
      if (r.err) cfErrs = [r.err]; else { setCustomLib(customLib.map(p => p.key === pk.key ? { ...p, name: r.name } : p)); cfMsg = `Renamed the pack to ${r.name}.`; }
      render(); break; }
    case 'cfdelpack': cfRead(); cfDelArm = true; render(); break;
    case 'cfdelpackno': cfRead(); cfDelArm = false; render(); break;
    case 'cfdelpackyes': { const pk = customPack(cfPack); cfDelArm = false; if (pk) { setCustomLib(customLib.filter(p => p.key !== pk.key)); delete setupPacks[pk.key]; toast(`Deleted ${pk.name}.`); } cfPack = null; setupPage = 'advanced'; render(); window.scrollTo(0, 0); break; }
    case 'cfsave': { cfRead(); const target = cfDraft.pack || cfPack, ed = cfEdit != null ? { key: cfPack, i: cfEdit } : null;
      const r = checkCustom(cfDraft, target, ed); cfErrs = r.errs; cfMsg = '';
      if (r.entry) {
        const list = customLib.map(p => ({ ...p, trainers: p.trainers.slice() })), from = ed && list.find(p => p.key === ed.key), to = list.find(p => p.key === target);
        if (from && from === to) to.trainers[ed.i] = r.entry; else { if (from) from.trainers.splice(ed.i, 1); to.trainers.push(r.entry); }
        const ok = setCustomLib(list);
        cfMsg = `${ed ? 'Saved' : 'Added'} ${r.entry.cls} ${r.entry.name}${target !== cfPack ? ` to ${to.name}` : ''}.${ok ? '' : " This browser couldn't store it, so it will be gone when the page closes."}`;
        cfDraft = cfBlank(); cfEdit = null;
      }
      render(); if (!r.entry) { const e = $('.cf-errs'); if (e) e.scrollIntoView({ block: 'center' }); } break; }
    case 'cfclear': cfDraft = cfBlank(); cfEdit = null; cfErrs = []; cfMsg = ''; render(); break;
    case 'cfedit': { const pk = customPack(cfPack), i = +el.dataset.v; if (!pk || !pk.trainers[i]) break; cfEdit = i; cfDraft = cfFrom(pk.trainers[i], pk.key); cfErrs = []; cfMsg = ''; render(); const f = $('#cf-form'); if (f) f.scrollIntoView({ block: 'start' }); break; }
    case 'cfdel': { cfRead(); const pk = customPack(cfPack), i = +el.dataset.v, f = pk && pk.trainers[i]; if (!f) break;
      setCustomLib(customLib.map(p => p.key === pk.key ? { ...p, trainers: p.trainers.filter((_, j) => j !== i) } : p));
      if (cfEdit === i) { cfEdit = null; cfDraft = cfBlank(); } else if (cfEdit != null && cfEdit > i) cfEdit--; cfErrs = []; cfMsg = `Deleted ${f.cls} ${f.name}.`; render(); break; }
    case 'packtoggle': if (setupPage === 'custom') cfRead(); setupPacks[el.dataset.k] = !setupPacks[el.dataset.k]; render(); break;
    case 'basetoggle': setupBaseOff = !setupBaseOff; render(); break;
    case 'packall': { const on = el.dataset.v === '1'; setupBaseOff = !on; setupPacks = { ...setupPacks, ...Object.fromEntries(Object.keys(FAMOUS_PACKS).filter(k => !FAMOUS_PACKS[k].custom).map(k => [k, on])) }; render(); break; }
    case 'advfold': setupFold[el.dataset.k] = !setupFold[el.dataset.k]; render(); break;
    case 'advfoldall': { const shut = el.dataset.v === '1'; setupFold = Object.fromEntries(['rules', 'features', 'packs', 'mypacks', 'dex', 'images', 'load', ...FEATURES.map(g => 'feat-' + g.group)].map(k => [k, shut])); render(); break; }
    case 'newworld': viewLg = 0; newWorld({ hand: true, leagues: setupLeagues, region: +el.dataset.v, growth: setupGrowth, god: setupGod, allFamous: setupAdv.allFamous, baseOff: setupBaseOff, packs: Object.keys(setupPacks).filter(k => setupPacks[k]), off: Object.keys(setupOff).filter(k => setupOff[k]) }); setupPage = 'main'; view = 'circuit'; foundSel = { post: 'champion', slot: 0 }; foundShow = 'all'; save(); render(); window.scrollTo(0, 0); break;
    case 'foundsel': foundSel = { post: el.dataset.k, slot: +el.dataset.v }; render(); { const p = $('#found-pool'); if (p) p.scrollIntoView({ block: 'start' }); } break;
    case 'foundshow': foundShow = el.dataset.v; render(); break;
    case 'foundpick': if (foundSel && foundPlace(foundSel.post, foundSel.slot, +el.dataset.id)) { const nx = foundPosts().find(p => p.id == null); foundSel = nx ? { post: nx.post, slot: nx.slot } : null; save(); } render(); break;
    case 'foundclear': foundPlace(el.dataset.k, +el.dataset.v, null); foundSel = { post: el.dataset.k, slot: +el.dataset.v }; save(); render(); break;
    case 'foundfill': foundingFill(); foundSel = null; save(); render(); break;
    case 'foundgo': { const mid = !!S.founding.mid; finishFounding(); view = 'circuit'; viewLg = ME(); save(); render(); window.scrollTo(0, 0); toast(mid ? `The ${S.lgName} is open.` : `The ${S.lgName} is open. Year 1 is underway.`); break; }
    case 'ranchtrip': case 'rancharea': { const w = inLeague(ME(), () => startTrip(a === 'ranchtrip' ? 'target' : 'area', el.dataset.b)); save(); render(); toast(w || 'The trip has set out.'); break; }
    case 'ranchcharter': { const w = inLeague(ME(), () => startTrip('charter', +el.dataset.v)); save(); render(); toast(w || 'The charter is on its way.'); break; }
    case 'ranchbuy': { const w = inLeague(ME(), () => buyShop(+el.dataset.id)); save(); render(); toast(w || 'Bought: it is in the ranch.'); break; }
    case 'ranchlbuy': { const w = inLeague(ME(), () => buyListing(+el.dataset.lg, +el.dataset.id)); save(); render(); toast(w || 'Bought: it is in the ranch.'); break; }
    case 'ranchsell': case 'ranchrel': { const who = inLeague(ME(), () => { const e = ranchEntry(+el.dataset.id); return e && e.at != null && T(e.at) ? T(e.at).name : null; }); const w = inLeague(ME(), () => sellMon(+el.dataset.id, a === 'ranchrel')); save(); render(); toast(w || (a === 'ranchrel' ? 'Released.' : 'Sold back.') + (!w && who ? ` ${who} swapped it out.` : '')); break; }
    case 'ranchlock': { const w = inLeague(ME(), () => { const e = ranchEntry(+el.dataset.id); return e ? lockMon(e.uid, !e.lock) : 'Not in the ranch.'; }); save(); render(); if (w) toast(w); break; }
    case 'ranchlist': case 'ranchunlist': { const w = inLeague(ME(), () => (a === 'ranchlist' ? listMon : unlistMon)(+el.dataset.id)); save(); render(); toast(w || (a === 'ranchlist' ? 'Listed for other Leagues.' : 'Withdrawn.')); break; }
    case 'sendcon': { const r = inLeague(ME(), () => sendContender(+el.dataset.id, sendTo)); save(); render(); toast(r === 'ok' ? `${T(+el.dataset.id).name} is on the way.` : r === 'later' ? `${T(+el.dataset.id).name} signed, and goes after their run.` : r === 'refused' ? `${T(+el.dataset.id).name} turned the contract down.` : r); break; }
    case 'recallcon': { const ok = recallContender(+el.dataset.id); save(); render(); toast(ok ? `${T(+el.dataset.id).name} is coming home.` : 'Could not recall them.'); break; }
    case 'renewcon': { const ok = renewContender(+el.dataset.id); save(); render(); toast(ok ? `Renewed for ${SPON_YEARS} more years.` : 'Could not renew.'); break; }
    case 'leaveask': leaveAsk = !leaveAsk; render(); break;
    case 'leavego': { const w = leaveLeague(leaveRegion, [...leaveTake]); leaveAsk = false; leaveTake = new Set(); save(); render(); window.scrollTo(0, 0); toast(w || 'Place your new League\'s staff.'); break; }
    case 'foundquit': saveSeq++; S = null; view = 'circuit'; foundSel = null; try { localStorage.removeItem(SAVE_KEY); } catch (e) {} render(); break;
    case 'repyear': repYear = el.dataset.v === 'latest' ? null : +el.dataset.v; go('recap'); break;
    case 'hire': hireIdx = +el.dataset.v; hireFit = false; go('hire'); break;
    case 'hirefit': hireFit = !hireFit; render(); break;
    case 'hirepick': { const v = (S.vacancies || [])[hireIdx], name = v && vacancyName(v), id = +el.dataset.id; hireResult(v && hireForVacancy(v, id, hireBid), id, name); break; }
    case 'hirebid': hireBid = +el.dataset.v; render(); break;
    case 'raise': { const w = giveRaise(+el.dataset.id); save(); render(); toast(w || `${T(+el.dataset.id).name} took the raise.`); break; }
    case 'distbuy': { const w = buyDistress(+el.dataset.v); save(); render(); toast(w || 'Bought at a distress price.'); break; }
    case 'distno': { declineDistress(+el.dataset.v); save(); render(); break; }
    case 'sellb': { const wh = el.dataset.w === 'seat' ? 'seat' : +el.dataset.w, w = sellBuilding(wh, el.dataset.k); save(); render(); toast(w || `Sold a level of ${UPGRADES[el.dataset.k].name.toLowerCase()}.`); break; }
    case 'build': { const wh = el.dataset.w === 'seat' ? 'seat' : +el.dataset.w, w = build(wh, el.dataset.k); save(); render(); toast(w || `${UPGRADES[el.dataset.k].name} built.`); break; }
    case 'movegym': { const sel = $('#move-' + el.dataset.c), i = sel ? +sel.value : 0, w = moveGym(i, +el.dataset.c); save(); render(); toast(w || `Gym ${i + 1} moved to ${townName(i)}.`); break; }
    case 'ban': { const w = payBan(el.dataset.sp, +el.dataset.v); save(); render(); toast(w || `${el.dataset.sp} is banned.`); break; }
    case 'hireauto': { const v = (S.vacancies || [])[+el.dataset.v], name = v && vacancyName(v); if (booksOn() && S.fin.money < 0) { toast('The League is in the red: nobody new can be hired until it is back above zero.'); break; } const r = v && autoFillVacancy(v); if (r) { save(); go('staff'); toast(r === 'later' && v.incoming != null ? `${T(v.incoming).name} accepted ${name} and comes after their run.` : `${name} is filled.`); } else render(); break; }
    case 'hirewd': { const t = T(+el.dataset.id); if (t && withdrawOffer(t.id)) { save(); render(); toast(`You withdrew the offer to ${t.name}.`); } break; }
    case 'staffask': staffAsk = el.dataset.id ? +el.dataset.id : null; staffSwap = null; render(); break;
    case 'staffgo': { const t = T(+el.dataset.id), r = t && releaseStaff(t.id); staffAsk = null; if (r) { save(); afterMove(r, `${t.name} was let go.`); } else render(); break; }
    case 'staffswap': staffSwap = el.dataset.id ? +el.dataset.id : null; staffAsk = null; render(); break;
    case 'staffswapto': { const a = staffSwap; staffSwap = null; if (a != null && swapStaff(a, +el.dataset.id)) { save(); toast(`${T(a).name} and ${T(+el.dataset.id).name} swapped posts.`); } render(); break; }
    case 'gtpick': gtSel = { g: +el.dataset.g, k: +el.dataset.k }; gymOutsiders(gtSel.g); save(); go('gtpick'); break;
    case 'gtplace': { const id = +el.dataset.id, name = gtSel && `gym trainer at ${townName(gtSel.g)} Gym`, o = gtSel && hireForGymTrainer(gtSel.g, gtSel.k, id, hireBid); if (o && o.res === 'now' && o.r) gtSel = null; hireResult(o, id, name); break; }
    case 'watchgym': { const g = S.gyms[+el.dataset.g], r = g && (g.watch || [])[+el.dataset.i]; if (r) { modal = { kind: 'battle', r }; renderModal(); } break; }
    case 'nav': navOpen = null; modal = null; renderModal(); go(el.dataset.v); break;
    case 'navgrp': navOpen = navOpen === el.dataset.k ? null : el.dataset.k; syncNav(); break;
    case 'profile': modal = { kind: 'profile', id: +el.dataset.id, back: recBack() }; renderModal(); break;
    case 'ownTab': openOwnTab(); break;
    case 'embedhide': embedNoteHidden = true; try { sessionStorage.setItem('plb-embed-note', '1'); } catch (e) {} render(); break;
    case 'glossary': navOpen = null; syncNav(); modal = { kind: 'glossary' }; renderModal(); break;
    case 'glosssec': glossSec = el.dataset.v; if (modal && modal.kind === 'glossary') { renderModal(); const sh = document.querySelector('.sheet'); if (sh) sh.scrollTop = 0; } break;
    case 'updates': navOpen = null; modal = null; renderModal(); markUpdatesSeen(); go('updates'); break;
    case 'close': if (modal && modal.kind === 'simmany' && modal.running) break; clearInterval(player); modal = modal && modal.back ? modal.back : null; renderModal(); break;
    case 'simmany': modal = { kind: 'simmany', n: 5 }; renderModal(); break;
    case 'hoflg': hofLg = el.dataset.v; render(); break;
    case 'hofsort': hofSort = el.dataset.v; render(); break;
    case 'recmore': modal = { kind: 'recmore', key: el.dataset.k }; renderModal(); break;
    case 'simmanyn': modal.n = +el.dataset.v; renderModal(); break;
    case 'simmanygo': modal.running = true; modal.log = []; renderModal(); simTimer = setTimeout(simManyTick, 30); break;
    case 'simmanystop': modal.stopRequested = true; renderModal(); break;
    case 'simmanyclose': modal = null; renderModal(); go('circuit'); break;
    case 'simmanyrecords': modal = null; renderModal(); go('records'); break;
    case 'playweek': playWeeks(1); break;
    case 'playmonth': playWeeks(4); break;
    case 'playyear': playWeeks(YEAR_WEEKS - S.week); break;
    case 'godlgsel': godLg = +el.dataset.i; godPick = null; render(); break;
    case 'godpick': godPick = godPick === +el.dataset.id ? null : +el.dataset.id; render(); break;
    case 'godsave': { const id = +el.dataset.id, val = k => { const x = $('#ge-' + k); return x ? x.value : null; }; const errs = [];
      for (const f of ['name', 'age', ...RK, 'pot']) { const v = val(f); if (v != null) { const w = godEdit(id, f, v); if (w) errs.push(w); } }
      save(); render(); toast(errs[0] || 'Saved.'); break; }
    case 'godrolesel': godRole = el.dataset.k; godPick = null; render(); break;
    case 'watchworld': { const m = S.worlds && S.worlds.matches[+el.dataset.i]; if (m) { modal = { kind: 'battle', r: m.log }; renderModal(); } break; }
    case 'boardrow': { const v = el.dataset.v; boardSel = /^\d+$/.test(v) ? +v : v; render(); break; }
    case 'watchhof': { const e = (S.hof || []).find(x => x.uid === +el.dataset.u), w = e && hofLog(e); const r = w && inLeague(w[0], () => (w[1] === 'last' ? S.lastLeague : S.league).logs[w[2]]); if (r) { modal = { kind: 'battle', r }; renderModal(); } break; }
    case 'watchseat': { const r = (S.seatLogs || [])[+el.dataset.i]; if (r) { modal = { kind: 'battle', r }; renderModal(); } break; }
    case 'steerall': { const st = el.dataset.v; let n = 0; inLeague(ME(), () => { for (const p of steerPosts()) if (answersOnType(p.t, st)) { setSteer(p.key, st); n++; } }); save(); render(); toast(`${steerName(st)} set on ${n} post${n === 1 ? '' : 's'}`); break; }
    case 'chalyes': case 'chalno': { const msg = answerChallenge(+el.dataset.v, a === 'chalyes'); if (msg) { save(); render(); toast(msg); } break; }
    case 'watch': { const L = el.dataset.y === 'last' ? S.lastLeague : S.league, r = L && L.logs[+el.dataset.i]; if (r) { modal = { kind: 'battle', r }; renderModal(); } break; }
    case 'bskip': clearInterval(player); modal.skip && modal.skip(); break;
    case 'bspeed': setBattleSpeed(el.dataset.v); break;
    case 'bpause': toggleBattlePause(); break;
    case 'nf': newsFilter = el.dataset.v; render(); break;
    case 'mon': modal = { kind: 'mon', t: +el.dataset.t, u: +el.dataset.u, back: recBack() }; renderModal(); break;
    case 'alum': modal = { kind: 'mon', t: +el.dataset.t, alum: +el.dataset.i, back: recBack() }; renderModal(); break;
    case 'dexsort': { const k = el.dataset.k; dexSort = dexSort.k === k ? { k, dir: -dexSort.dir } : { k, dir: k === 'sp' ? 1 : -1 }; render(); break; }
    case 'dexkind': dexKind = el.dataset.v; render(); break;
    case 'dextrait': dexTrait = el.dataset.v; render(); break;
    case 'dexscope': dexScope = el.dataset.v; render(); break;
    case 'trsort': { const k = el.dataset.k; trSort = trSort.k === k ? { k, dir: -trSort.dir } : { k, dir: ['name', 'pos'].includes(k) ? 1 : -1 }; render(); break; }
    case 'trscope': trScope = el.dataset.v; render(); break;
    case 'trgroup': trGroup = el.dataset.v; trFam = 'all'; render(); break;
    case 'trfam': trFam = el.dataset.v; render(); break;
    case 'dexmin': dexMin = +el.dataset.v; render(); break;
    case 'menu': modal = { kind: 'menu' }; renderModal(); break;
    case 'export': {
      const m0 = modal; m0.exportText = null; m0.copied = false; m0.copying = true; renderModal();
      saveCode().then(txt => {
        const showBox = () => { if (modal !== m0) return; m0.copying = false; m0.exportText = txt.replace(/</g, '\\u003c'); renderModal(); const b = $('#exportbox'); if (b) b.select(); };
        try { navigator.clipboard.writeText(txt).then(() => { if (modal !== m0) return; m0.copying = false; m0.copied = true; renderModal(); }, showBox); } catch (e) { showBox(); }
      });
      break; }
    case 'importshow': modal.importing = true; renderModal(); break;
    case 'importgo': { const m0 = modal; parseSave($('#importbox').value).then(v => { if (modal !== m0) return; if (!v) { m0.err = SAVE_ERR; renderModal(); return; } adoptSave(v); save(); modal = null; renderModal(); go(view); toast('Save loaded.'); }); break; }
    case 'savefile': saveFile(); break;
    case 'setuploadgo': { parseSave(($('#setupload') || {}).value).then(v => { if (!v) { setupLoadErr = SAVE_ERR; render(); return; } setupLoadErr = ''; setupPage = 'main'; adoptSave(v); save(); go(view); toast(`Loaded Year ${S.season || 1}.`); }); break; }
    case 'newask': modal.confirmNew = true; renderModal(); break;
    case 'newcancel': modal.confirmNew = false; renderModal(); break;
    case 'newgo': try { localStorage.removeItem(SAVE_KEY); } catch (e) {} S = null; modal = null; renderModal(); render(); break;
  }
});
document.addEventListener('input', e => {
  const id = e.target && e.target.id;
  if (id === 'trsearch') { trQ = e.target.value; const r = $('#trres'); if (r) r.innerHTML = trainersResults(); }
  if (id === 'glosssearch') { glossQ = e.target.value; const r = $('#glossres'); if (r) { r.innerHTML = glossResults(); applyFolds(r, 'modal-glossary'); } }
  if (id === 'dexsearch') { dexQ = e.target.value; const r = $('#dexres'); if (r) r.innerHTML = dexResults(); }
  if (id === 'setupload') setupLoadText = e.target.value;
  if (id === 'dx-pick') dxPickText = e.target.value;
  if (id === 'dx-imp') dxImpText = e.target.value;
  if (id === 'dx-from' || id === 'dx-legend') dxSyncChecks();
  if (e.target && e.target.classList && e.target.classList.contains('dx-stat')) { const b = $('#dx-bst'); if (b) b.textContent = '· total ' + dxBst([0, 1, 2, 3, 4, 5].map(i => Number((($('#dx-st' + i) || {}).value) || 0))); dxSyncWarn(); }
  if (id === 'cfimpq' && cfImp) { cfImp.q = e.target.value; const r = $('#cfimplist'); if (r) r.innerHTML = cfImpList(); }
  if (id === 'cfimptext' && cfImp) cfImp.text = e.target.value;
  if (id === 'cfimpname' && cfImp) cfImp.newName = e.target.value;
  if (id === 'imgq') { imgQ = e.target.value; const r = $('#imggrid'); if (r) r.innerHTML = imgGrid(); }
  if (id === 'hofsearch') { hofQ = e.target.value; const r = $('#hofres'); if (r) r.innerHTML = hofResults(); }
});
// a chosen save file is read into the paste box, so it can be checked and loaded the same way
document.addEventListener('change', e => {
  if (e.target && e.target.classList && e.target.classList.contains('sendtosel')) { sendTo = +e.target.value; return; }
  if (e.target && e.target.classList && e.target.classList.contains('ranchtypesel')) { ranchType = e.target.value; ranchSp = null; render(); return; }
  if (e.target && e.target.classList && e.target.classList.contains('ranchspsel')) { ranchSp = e.target.value; render(); return; }
  if (e.target && e.target.classList && e.target.classList.contains('charterreg')) { charterReg = +e.target.value; render(); return; }
  if (e.target && e.target.classList && e.target.classList.contains('lanesel')) { const w = setLane(+e.target.dataset.g, +e.target.value); save(); render(); toast(w || 'The route has changed.'); return; }
  if (e.target && e.target.classList && e.target.classList.contains('ranchressel')) { const w = inLeague(ME(), () => reserveMon(+e.target.dataset.id, e.target.value || null)); save(); render(); if (w) toast(w); return; }
  if (e.target && e.target.classList && e.target.classList.contains('foundregsel')) { const w = foldRegion(+e.target.value); if (w) toast(w); save(); render(); return; }
  if (e.target && e.target.classList && e.target.classList.contains('leaveregsel')) { leaveRegion = +e.target.value; render(); return; }
  if (e.target && e.target.classList && e.target.classList.contains('leavetake')) { const id = +e.target.dataset.id; if (e.target.checked) leaveTake.add(id); else leaveTake.delete(id); render(); return; }
  if (e.target && e.target.classList && e.target.classList.contains('steersel')) { const k = e.target.dataset.k, v = e.target.value || null; inLeague(ME(), () => setSteer(k, v)); save(); render(); toast(k === 'line' ? `League line: ${steerName(v)}` : `Steer set: ${v ? steerName(v) : 'follows the League line'}`); return; }
  if (e.target && e.target.id === 'imgfile' && e.target.files && e.target.files[0]) { imgPickFile(e.target.files[0]); return; }
  if (e.target && e.target.id === 'imgpackfile' && e.target.files && e.target.files.length) { imgImport(e.target.files).then(() => render()); return; }
  if (e.target && e.target.id === 'dx-legend') { dxSyncChecks(); return; }
  if (e.target && e.target.id === 'cf-trait') { cfRead(); render(); return; }
  if (e.target && e.target.classList && e.target.classList.contains('cf-imp-chk') && cfImp) { const k = e.target.dataset.k; if (e.target.checked) cfImp.sel.add(k); else cfImp.sel.delete(k); const b = $('#cfimpgo'); if (b) b.textContent = cfImpGoLabel(); return; }
  if (e.target && e.target.id === 'cfimpsrc' && cfImp) { const src = e.target.value; cfImp = cfImpBlank(src); if (src !== 'text') cfImpLoad(); render(); return; }
  if (e.target && e.target.id === 'cfimpdest' && cfImp) { const nm = $('#cfimpname'); if (nm) cfImp.newName = nm.value; cfImp.dest = e.target.value; render(); return; }
  if (e.target && e.target.id === 'cfimpfile' && e.target.files && e.target.files[0] && cfImp) { const f = e.target.files[0], rd = new FileReader();
    rd.onload = () => { cfImp.text = String(rd.result || ''); cfImp.fileName = f.name; cfImpLoad(); render(); }; rd.onerror = () => { cfImp.err = "Couldn't read that file."; render(); }; rd.readAsText(f); return; }
  if (!e.target || e.target.id !== 'setupfile' || !e.target.files || !e.target.files[0]) return;
  const f = e.target.files[0], rd = new FileReader();
  rd.onload = async () => { setupLoadText = String(rd.result || ''); setupLoadName = f.name; setupLoadErr = (await parseSave(setupLoadText)) ? '' : SAVE_ERR; render(); };
  rd.onerror = () => { setupLoadErr = "Couldn't read that file."; render(); };
  rd.readAsText(f);
});
document.addEventListener('keydown', e => { if ((e.key === 'Enter' || e.key === ' ') && e.target && e.target.dataset && e.target.dataset.act === 'fold') { e.preventDefault(); toggleFold(e.target); return; } if (e.key === 'Escape' && navOpen) { navOpen = null; syncNav(); return; } if (e.key === 'Escape' && modal && !(modal.kind === 'simmany' && modal.running)) { clearInterval(player); modal = modal.back || null; renderModal(); } });

// take over a save and open the right screen for its phase
function adoptSave(v, keepView) {
  S = v; applyDex(S.cfg && S.cfg.dex); applyCfg();
  view = keepView || 'circuit';
}
// Download save file: inside claude.ai the viewer's downloads capability offers the file (with a confirmation);
// opened as a plain local file, an ordinary browser download does it
let downloadsNs = null, downloadsChecked = !window.claude;
if (window.claude && window.claude.use) window.claude.use('downloads').then(ns => { downloadsNs = ns; downloadsChecked = true; if (modal && modal.kind === 'menu') renderModal(); }, () => { downloadsChecked = true; });
const canSaveFile = () => !window.claude || !!downloadsNs;
async function saveFile() {
  const data = await saveCode(), filename = `pokemon-league-builder-year-${S.season || 1}.${data.startsWith(CODE_TAG) ? 'txt' : 'json'}`;
  if (downloadsNs) {
    try { await downloadsNs.save({ filename, data }); toast('Save file downloaded.'); }
    catch (e) { const c = e && e.code; if (c === 'declined') return; toast(c === 'rate_limited' ? 'A download is already waiting for your answer.' : "Couldn't download here. Use Copy save to clipboard instead."); }
    return;
  }
  try { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([data], { type: data.startsWith(CODE_TAG) ? 'text/plain' : 'application/json' })); a.download = filename; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 2000); toast('Save file downloaded.'); }
  catch (e) { toast("Couldn't download here. Use Copy save to clipboard instead."); }
}
// a save from the menu's export: pasted text or the contents of a downloaded file
async function parseSave(txt) {
  try {
    let t = String(txt || '').replace(/\s+/g, '');
    if (t.startsWith(CODE_TAG)) {
      if (!CAN_DEFLATE) return null;
      const ds = new Blob([b64ToBytes(t.slice(CODE_TAG.length))]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
      t = await new Response(ds).text();
    } else t = String(txt || '').trim();
    const v = JSON.parse(t); return v && v.trainers && v.version === SAVE_VERSION ? v : null;
  } catch (e) { return null; }
}
const SAVE_ERR = "That isn't a save from this version of Pokémon League Builder. Use the whole save text, or a file from the menu's Download save file.";
function boot(data) {
  imgBootDone = false; imgLoadAll();
  const saved = (data && data.S && data.S.version === SAVE_VERSION && data.S) || load();
  if (saved && saved.packed) {
    $('#app').innerHTML = '<p class="muted" style="padding:24px">Loading your world…</p>';
    if (!CAN_DEFLATE) { S = null; imgBootDone = true; render(); return; }
    inflateText(saved.packed).then(txt => { const v = JSON.parse(txt); if (v && v.version === SAVE_VERSION) adoptSave(v, data && data.view); else S = null; imgBootDone = true; render(); receiveFromEmbed(); }, () => { S = null; imgBootDone = true; render(); receiveFromEmbed(); });
    return;
  }
  if (saved) adoptSave(saved, data && data.view);
  else S = null;
  imgBootDone = true;
  render();
  receiveFromEmbed();
}
window.claude?.hot?.snapshot?.(() => ({ S, view }));
window.claude?.hot?.ready ? window.claude.hot.ready(boot) : boot(window.claude?.hot?.data ?? {});
