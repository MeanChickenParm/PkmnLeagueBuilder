// ================= FAMOUS TRAINERS =================
// Rarely, a newcomer or a founding Elite Four member is a trainer from the games or anime.
const FAMOUS = [
  { name: 'Ash', cls: 'Pokémon Trainer', spec: null, age: 10, g: 'm', team: ['Pikachu', ['Charmander', 'Bulbasaur', 'Squirtle', 'Caterpie', 'Pidgey', 'Krabby']] },
  // Kanto
  { name: 'Brock', cls: 'Kanto Leader', spec: 'Rock', age: 15, g: 'm', team: ['Onix', ['Geodude', 'Zubat', 'Vulpix']] },
  { name: 'Misty', cls: 'Kanto Leader', spec: 'Water', age: 12, g: 'f', team: ['Staryu', ['Psyduck', 'Goldeen', 'Togepi', 'Horsea']] },
  { name: 'Lt. Surge', cls: 'Kanto Leader', spec: 'Electric', age: 32, g: 'm', team: ['Pikachu', 'Voltorb'] },
  { name: 'Erika', cls: 'Kanto Leader', spec: 'Grass', age: 18, g: 'f', team: ['Oddish', ['Tangela', 'Bellsprout', 'Hoppip']] },
  { name: 'Koga', cls: 'Kanto Leader', spec: 'Poison', age: 40, g: 'm', team: ['Koffing', ['Grimer', 'Venonat', 'Zubat']] },
  { name: 'Sabrina', cls: 'Kanto Leader', spec: 'Psychic', age: 21, g: 'f', team: ['Abra', ['Mime Jr.', 'Venonat']] },
  { name: 'Blaine', cls: 'Kanto Leader', spec: 'Fire', age: 55, g: 'm', team: ['Growlithe', ['Ponyta', 'Magby']] },
  { name: 'Giovanni', cls: 'Kanto Leader', spec: 'Ground', age: 45, g: 'm', team: ['Rhyhorn', ['Nidoran♂', 'Nidoran♀', 'Meowth', 'Diglett']] },
  // Johto
  { name: 'Falkner', cls: 'Johto Leader', spec: 'Flying', age: 18, g: 'm', team: ['Pidgey', ['Hoothoot', 'Doduo']] },
  { name: 'Bugsy', cls: 'Johto Leader', spec: 'Bug', age: 14, g: 'm', team: ['Scyther', ['Caterpie', 'Weedle']] },
  { name: 'Whitney', cls: 'Johto Leader', spec: 'Normal', age: 15, g: 'f', team: ['Miltank', 'Clefairy'] },
  { name: 'Morty', cls: 'Johto Leader', spec: 'Ghost', age: 20, g: 'm', team: ['Gastly', 'Misdreavus'] },
  { name: 'Chuck', cls: 'Johto Leader', spec: 'Fighting', age: 38, g: 'm', team: ['Mankey', 'Poliwag'] },
  { name: 'Jasmine', cls: 'Johto Leader', spec: 'Steel', age: 16, g: 'f', team: ['Magnemite', 'Onix'] },
  { name: 'Pryce', cls: 'Johto Leader', spec: 'Ice', age: 70, g: 'm', team: ['Swinub', 'Seel'] },
  { name: 'Clair', cls: 'Johto Leader', spec: 'Dragon', age: 20, g: 'f', team: ['Dratini', 'Horsea'] },
  { name: 'Janine', cls: 'Johto Leader', spec: 'Poison', age: 16, g: 'f', team: ['Spinarak', ['Zubat', 'Venonat']] },
  // Hoenn
  { name: 'Roxanne', cls: 'Hoenn Leader', spec: 'Rock', age: 15, g: 'f', team: ['Nosepass', 'Geodude'] },
  { name: 'Brawly', cls: 'Hoenn Leader', spec: 'Fighting', age: 20, g: 'm', team: ['Makuhita', 'Meditite'] },
  { name: 'Wattson', cls: 'Hoenn Leader', spec: 'Electric', age: 60, g: 'm', team: ['Electrike', 'Magnemite'] },
  { name: 'Flannery', cls: 'Hoenn Leader', spec: 'Fire', age: 17, g: 'f', team: ['Torkoal', ['Slugma', 'Numel']] },
  { name: 'Norman', cls: 'Hoenn Leader', spec: 'Normal', age: 38, g: 'm', team: ['Slakoth', ['Zigzagoon', 'Spinda']] },
  { name: 'Winona', cls: 'Hoenn Leader', spec: 'Flying', age: 25, g: 'f', team: ['Swablu', ['Taillow', 'Wingull']] },
  { name: 'Tate & Liza', cls: 'Hoenn Leaders', spec: 'Psychic', age: 12, g: 'm', team: ['Solrock', 'Lunatone'] },
  { name: 'Wallace', cls: 'Hoenn Leader', spec: 'Water', age: 26, g: 'm', team: ['Feebas', ['Wailmer', 'Carvanha', 'Lotad']] },
  { name: 'Juan', cls: 'Hoenn Leader', spec: 'Water', age: 50, g: 'm', team: ['Luvdisc', ['Spheal', 'Corphish', 'Barboach']] },
  // Kanto and Johto Elite Four, Champions and rivals
  { name: 'Lorelei', cls: 'Elite Four', spec: 'Ice', age: 30, g: 'f', team: ['Lapras', ['Dewgong', 'Cloyster', 'Jynx']] },
  { name: 'Bruno', cls: 'Elite Four', spec: 'Fighting', age: 34, g: 'm', team: ['Machop', ['Onix', 'Hitmonlee', 'Hitmonchan']] },
  { name: 'Agatha', cls: 'Elite Four', spec: 'Ghost', age: 66, g: 'f', team: ['Gastly', ['Golbat', 'Arbok', 'Misdreavus']] },
  { name: 'Lance', cls: 'Dragon Master', spec: 'Dragon', age: 27, g: 'm', team: ['Dratini', ['Gyarados', 'Aerodactyl', 'Charizard']] },
  { name: 'Will', cls: 'Elite Four', spec: 'Psychic', age: 25, g: 'm', team: ['Natu', ['Exeggcute', 'Slowpoke', 'Jynx']] },
  { name: 'Karen', cls: 'Elite Four', spec: 'Dark', age: 26, g: 'f', team: ['Umbreon', ['Murkrow', 'Houndour', 'Sneasel']] },
  { name: 'Blue', cls: 'Rival', spec: null, age: 11, g: 'm', team: ['Eevee', ['Pidgey', 'Abra', 'Rattata']] },
  { name: 'Gary', cls: 'Pokémon Researcher', spec: null, age: 10, g: 'm', team: ['Squirtle', ['Eevee', 'Nidoran♂', 'Krabby']] },
  { name: 'Red', cls: 'Pokémon Trainer', spec: null, age: 11, g: 'm', team: ['Pikachu', ['Charmander', 'Bulbasaur', 'Squirtle', 'Snorlax']] },
  { name: 'Silver', cls: 'Rival', spec: 'Dark', age: 11, g: 'm', team: ['Totodile', ['Sneasel', 'Gastly', 'Zubat']] },
  // Hoenn Elite Four and Champions, rivals
  { name: 'Sidney', cls: 'Elite Four', spec: 'Dark', age: 26, g: 'm', team: ['Poochyena', ['Absol', 'Sableye', 'Cacnea']] },
  { name: 'Phoebe', cls: 'Elite Four', spec: 'Ghost', age: 19, g: 'f', team: ['Duskull', ['Shuppet', 'Sableye']] },
  { name: 'Glacia', cls: 'Elite Four', spec: 'Ice', age: 32, g: 'f', team: ['Snorunt', ['Spheal', 'Glalie']] },
  { name: 'Drake', cls: 'Elite Four', spec: 'Dragon', age: 52, g: 'm', team: ['Bagon', ['Swablu', 'Trapinch', 'Horsea']] },
  { name: 'Steven', cls: 'Champion', spec: 'Steel', age: 25, g: 'm', team: ['Beldum', ['Skarmory', 'Aron', 'Cradily']] },
  { name: 'May', cls: 'Coordinator', spec: null, age: 10, g: 'f', team: ['Torchic', ['Skitty', 'Eevee', 'Wurmple']] },
  { name: 'Brendan', cls: 'Rival', spec: null, age: 11, g: 'm', team: ['Mudkip', ['Treecko', 'Wingull', 'Lotad']] },
  { name: 'Wally', cls: 'Rival', spec: 'Psychic', age: 10, g: 'm', team: ['Ralts', ['Roselia', 'Magnemite', 'Altaria']] },
  // Sinnoh
  { name: 'Roark', cls: 'Sinnoh Leader', spec: 'Rock', age: 19, g: 'm', team: ['Cranidos', ['Geodude', 'Onix']] },
  { name: 'Gardenia', cls: 'Sinnoh Leader', spec: 'Grass', age: 20, g: 'f', team: ['Turtwig', ['Cherubi', 'Budew']] },
  { name: 'Maylene', cls: 'Sinnoh Leader', spec: 'Fighting', age: 16, g: 'f', team: ['Riolu', ['Meditite', 'Machop']] },
  { name: 'Crasher Wake', cls: 'Sinnoh Leader', spec: 'Water', age: 40, g: 'm', team: ['Buizel', ['Gyarados', 'Wooper']] },
  { name: 'Fantina', cls: 'Sinnoh Leader', spec: 'Ghost', age: 30, g: 'f', team: ['Drifloon', ['Gastly', 'Misdreavus']] },
  { name: 'Byron', cls: 'Sinnoh Leader', spec: 'Steel', age: 50, g: 'm', team: ['Shieldon', ['Bronzor', 'Magnemite']] },
  { name: 'Candice', cls: 'Sinnoh Leader', spec: 'Ice', age: 17, g: 'f', team: ['Snover', ['Sneasel', 'Snorunt']] },
  { name: 'Volkner', cls: 'Sinnoh Leader', spec: 'Electric', age: 24, g: 'm', team: ['Shinx', ['Electabuzz', 'Pachirisu']] },
  { name: 'Aaron', cls: 'Elite Four', spec: 'Bug', age: 21, g: 'm', team: ['Combee', ['Skorupi', 'Heracross', 'Yanma']] },
  { name: 'Bertha', cls: 'Elite Four', spec: 'Ground', age: 64, g: 'f', team: ['Hippopotas', ['Wooper', 'Gligar', 'Sudowoodo']] },
  { name: 'Flint', cls: 'Elite Four', spec: 'Fire', age: 27, g: 'm', team: ['Chimchar', ['Ponyta', 'Houndour', 'Magby']] },
  { name: 'Lucian', cls: 'Elite Four', spec: 'Psychic', age: 35, g: 'm', team: ['Chingling', ['Girafarig', 'Bronzor', 'Abra']] },
  { name: 'Cynthia', cls: 'Champion', spec: null, age: 26, g: 'f', team: ['Gible', ['Spiritomb', 'Roselia', 'Riolu', 'Munchlax']] },
  { name: 'Dawn', cls: 'Coordinator', spec: null, age: 10, g: 'f', team: ['Piplup', ['Buneary', 'Pachirisu', 'Swinub']] },
  { name: 'Barry', cls: 'Rival', spec: null, age: 11, g: 'm', team: ['Chimchar', ['Starly', 'Buizel', 'Munchlax']] },
  // Unova
  { name: 'Cilan', cls: 'Unova Leader', spec: 'Grass', age: 15, g: 'm', team: ['Pansage', ['Lillipup', 'Petilil']] },
  { name: 'Chili', cls: 'Unova Leader', spec: 'Fire', age: 15, g: 'm', team: ['Pansear', ['Lillipup', 'Darumaka']] },
  { name: 'Cress', cls: 'Unova Leader', spec: 'Water', age: 15, g: 'm', team: ['Panpour', ['Lillipup', 'Tympole']] },
  { name: 'Lenora', cls: 'Unova Leader', spec: 'Normal', age: 34, g: 'f', team: ['Lillipup', ['Patrat', 'Minccino']] },
  { name: 'Burgh', cls: 'Unova Leader', spec: 'Bug', age: 27, g: 'm', team: ['Sewaddle', ['Dwebble', 'Venipede']] },
  { name: 'Elesa', cls: 'Unova Leader', spec: 'Electric', age: 22, g: 'f', team: ['Emolga', ['Blitzle', 'Joltik']] },
  { name: 'Clay', cls: 'Unova Leader', spec: 'Ground', age: 48, g: 'm', team: ['Drilbur', ['Sandile', 'Palpitoad']] },
  { name: 'Skyla', cls: 'Unova Leader', spec: 'Flying', age: 23, g: 'f', team: ['Ducklett', ['Woobat', 'Pidove']] },
  { name: 'Brycen', cls: 'Unova Leader', spec: 'Ice', age: 45, g: 'm', team: ['Cubchoo', ['Vanillite', 'Cryogonal']] },
  { name: 'Drayden', cls: 'Unova Leader', spec: 'Dragon', age: 55, g: 'm', team: ['Axew', ['Druddigon', 'Deino']] },
  { name: 'Iris', cls: 'Unova Leader', spec: 'Dragon', age: 12, g: 'f', team: ['Axew', ['Dratini', 'Emolga', 'Gible']] },
  { name: 'Cheren', cls: 'Unova Leader', spec: 'Normal', age: 17, g: 'm', team: ['Lillipup', ['Snivy', 'Purrloin', 'Patrat']] },
  { name: 'Roxie', cls: 'Unova Leader', spec: 'Poison', age: 16, g: 'f', team: ['Koffing', ['Venipede', 'Trubbish', 'Grimer']] },
  { name: 'Marlon', cls: 'Unova Leader', spec: 'Water', age: 24, g: 'm', team: ['Frillish', ['Tirtouga', 'Wailmer', 'Carvanha']] },
  { name: 'Shauntal', cls: 'Elite Four', spec: 'Ghost', age: 24, g: 'f', team: ['Litwick', ['Yamask', 'Golett', 'Frillish']] },
  { name: 'Grimsley', cls: 'Elite Four', spec: 'Dark', age: 30, g: 'm', team: ['Pawniard', ['Sandile', 'Scraggy', 'Purrloin']] },
  { name: 'Caitlin', cls: 'Elite Four', spec: 'Psychic', age: 22, g: 'f', team: ['Gothita', ['Munna', 'Elgyem', 'Sigilyph']] },
  { name: 'Marshal', cls: 'Elite Four', spec: 'Fighting', age: 32, g: 'm', team: ['Timburr', ['Throh', 'Sawk', 'Mienfoo']] },
  { name: 'Alder', cls: 'Champion', spec: 'Bug', age: 58, g: 'm', team: ['Larvesta', ['Bouffalant', 'Druddigon', 'Escavalier']] },
  { name: 'N', cls: 'Pokémon Trainer', spec: null, age: 19, g: 'm', team: ['Purrloin', ['Zorua', 'Tympole', 'Timburr', 'Pidove']] },
  { name: 'Bianca', cls: 'Rival', spec: null, age: 15, g: 'f', team: ['Tepig', ['Munna', 'Pansage', 'Lillipup']] },
  // Kalos
  { name: 'Viola', cls: 'Kalos Leader', spec: 'Bug', age: 20, g: 'f', team: ['Surskit', ['Scatterbug', 'Venonat']] },
  { name: 'Grant', cls: 'Kalos Leader', spec: 'Rock', age: 25, g: 'm', team: ['Tyrunt', ['Amaura', 'Onix']] },
  { name: 'Korrina', cls: 'Kalos Leader', spec: 'Fighting', age: 16, g: 'f', team: ['Riolu', ['Mienfoo', 'Machop', 'Hawlucha']] },
  { name: 'Ramos', cls: 'Kalos Leader', spec: 'Grass', age: 65, g: 'm', team: ['Skiddo', ['Jumpluff', 'Weepinbell']] },
  { name: 'Clemont', cls: 'Kalos Leader', spec: 'Electric', age: 14, g: 'm', team: ['Helioptile', ['Bunnelby', 'Magnemite', 'Dedenne']] },
  { name: 'Valerie', cls: 'Kalos Leader', spec: 'Fairy', age: 22, g: 'f', team: ['Spritzee', ['Mawile', 'Ralts']] },
  { name: 'Olympia', cls: 'Kalos Leader', spec: 'Psychic', age: 40, g: 'f', team: ['Espurr', ['Sigilyph', 'Slowpoke']] },
  { name: 'Wulfric', cls: 'Kalos Leader', spec: 'Ice', age: 48, g: 'm', team: ['Bergmite', ['Snover', 'Cryogonal']] },
  { name: 'Malva', cls: 'Elite Four', spec: 'Fire', age: 30, g: 'f', team: ['Litleo', ['Houndour', 'Torkoal', 'Fletchinder']] },
  { name: 'Siebold', cls: 'Elite Four', spec: 'Water', age: 30, g: 'm', team: ['Clauncher', ['Staryu', 'Binacle', 'Gyarados']] },
  { name: 'Wikstrom', cls: 'Elite Four', spec: 'Steel', age: 35, g: 'm', team: ['Honedge', ['Klefki', 'Probopass', 'Scizor']] },
  { name: 'Drasna', cls: 'Elite Four', spec: 'Dragon', age: 55, g: 'f', team: ['Noibat', ['Druddigon', 'Altaria', 'Dragalge']] },
  { name: 'Diantha', cls: 'Champion', spec: null, age: 27, g: 'f', team: ['Ralts', ['Hawlucha', 'Tyrunt', 'Amaura', 'Goomy']] },
  { name: 'Serena', cls: 'Performer', spec: null, age: 10, g: 'f', team: ['Fennekin', ['Eevee', 'Pancham', 'Flabébé']] },
  { name: 'Calem', cls: 'Rival', spec: null, age: 11, g: 'm', team: ['Froakie', ['Chespin', 'Fletchling', 'Honedge']] },
  // Alola
  { name: 'Hala', cls: 'Island Kahuna', spec: 'Fighting', age: 62, g: 'm', team: ['Makuhita', ['Crabrawler', 'Mankey']] },
  { name: 'Olivia', cls: 'Island Kahuna', spec: 'Rock', age: 28, g: 'f', team: ['Rockruff', ['Nosepass', 'Geodude']] },
  { name: 'Nanu', cls: 'Island Kahuna', spec: 'Dark', age: 47, g: 'm', team: ['Meowth', ['Sableye', 'Sandile', 'Murkrow']] },
  { name: 'Hapu', cls: 'Island Kahuna', spec: 'Ground', age: 15, g: 'f', team: ['Mudbray', ['Shellos', 'Trapinch', 'Golett']] },
  { name: 'Ilima', cls: 'Trial Captain', spec: 'Normal', age: 18, g: 'm', team: ['Yungoos', ['Smeargle', 'Komala']] },
  { name: 'Lana', cls: 'Trial Captain', spec: 'Water', age: 11, g: 'f', team: ['Popplio', ['Wishiwashi', 'Dewpider']] },
  { name: 'Kiawe', cls: 'Trial Captain', spec: 'Fire', age: 15, g: 'm', team: ['Turtonator', ['Salandit', 'Growlithe']] },
  { name: 'Mallow', cls: 'Trial Captain', spec: 'Grass', age: 11, g: 'f', team: ['Bounsweet', ['Fomantis', 'Morelull']] },
  { name: 'Sophocles', cls: 'Trial Captain', spec: 'Electric', age: 12, g: 'm', team: ['Togedemaru', ['Grubbin', 'Pikachu']] },
  { name: 'Acerola', cls: 'Trial Captain', spec: 'Ghost', age: 13, g: 'f', team: ['Sandygast', ['Drifloon', 'Snorunt', 'Misdreavus']] },
  { name: 'Mina', cls: 'Trial Captain', spec: 'Fairy', age: 20, g: 'f', team: ['Cutiefly', ['Snubbull', 'Jigglypuff', 'Klefki']] },
  { name: 'Kahili', cls: 'Elite Four', spec: 'Flying', age: 30, g: 'f', team: ['Pikipek', ['Skarmory', 'Oricorio', 'Zubat']] },
  { name: 'Molayne', cls: 'Elite Four', spec: 'Steel', age: 26, g: 'm', team: ['Klefki', ['Bronzor', 'Magnemite', 'Skarmory']] },
  { name: 'Kukui', cls: 'Champion', spec: null, age: 38, g: 'm', team: ['Rockruff', ['Litten', 'Snorlax', 'Magnemite']] },
  { name: 'Hau', cls: 'Rival', spec: null, age: 11, g: 'm', team: ['Pichu', ['Rowlet', 'Eevee', 'Noibat']] },
  { name: 'Gladion', cls: 'Rival', spec: 'Dark', age: 14, g: 'm', team: ['Riolu', ['Zubat', 'Sneasel', 'Eevee']] },
  { name: 'Lillie', cls: 'Pokémon Trainer', spec: null, age: 11, g: 'f', team: ['Vulpix', ['Clefairy', 'Snorlax']] },
  { name: 'Guzma', cls: 'Team Boss', spec: 'Bug', age: 25, g: 'm', team: ['Wimpod', ['Pinsir', 'Spinarak', 'Surskit']] },
  { name: 'Plumeria', cls: 'Team Admin', spec: 'Poison', age: 24, g: 'f', team: ['Salandit', ['Mareanie', 'Grimer']] },
  { name: 'Lusamine', cls: 'Aether President', spec: null, age: 40, g: 'f', team: ['Feebas', ['Petilil', 'Misdreavus', 'Clefairy']] },
  // Pokémon Professors
  { name: 'Oak', cls: 'Pokémon Professor', spec: null, age: 60, g: 'm', team: ['Tauros', ['Exeggcute', 'Growlithe', 'Magikarp', 'Pidgey']] },
  { name: 'Elm', cls: 'Pokémon Professor', spec: null, age: 31, g: 'm', team: ['Togepi', ['Marill', 'Chikorita', 'Cyndaquil', 'Totodile']] },
  { name: 'Birch', cls: 'Pokémon Professor', spec: null, age: 40, g: 'm', team: ['Zigzagoon', ['Poochyena', 'Treecko', 'Torchic', 'Mudkip']] },
  { name: 'Rowan', cls: 'Pokémon Professor', spec: null, age: 62, g: 'm', team: ['Starly', ['Shinx', 'Bidoof', 'Turtwig', 'Chimchar', 'Piplup']] },
  { name: 'Juniper', cls: 'Pokémon Professor', spec: null, age: 26, g: 'f', team: ['Minccino', ['Snivy', 'Tepig', 'Oshawott']] },
  { name: 'Sycamore', cls: 'Pokémon Professor', spec: null, age: 32, g: 'm', team: ['Gible', ['Chespin', 'Fennekin', 'Froakie']] },
  { name: 'Magnolia', cls: 'Pokémon Professor', spec: null, age: 70, g: 'f', team: ['Duraludon', ['Applin', 'Snorlax']] },
  { name: 'Sada', cls: 'Pokémon Professor', spec: null, age: 38, g: 'f', team: ['Bagon', ['Deino', 'Larvitar', 'Sandile']] },
  { name: 'Turo', cls: 'Pokémon Professor', spec: null, age: 38, g: 'm', team: ['Beldum', ['Magnemite', 'Klink', 'Porygon']] },
  { name: 'Willow', cls: 'Pokémon Professor', spec: null, age: 41, g: 'm', team: ['Pikachu', ['Bulbasaur', 'Charmander', 'Squirtle', 'Eevee']] },
  // Pokémon GO team leaders (their teams' legendary birds are mascots, not partners)
  { name: 'Candela', cls: 'Team Valor Leader', spec: 'Fire', age: 25, g: 'f', team: ['Growlithe', ['Ponyta', 'Magby', 'Charmander', 'Vulpix']] },
  { name: 'Blanche', cls: 'Team Mystic Leader', spec: 'Ice', spec2: 'Water', age: 27, g: 'n', team: ['Lapras', ['Seel', 'Spheal', 'Snorunt', 'Shellder']] },
  { name: 'Spark', cls: 'Team Instinct Leader', spec: 'Electric', age: 23, g: 'm', team: ['Pikachu', ['Elekid', 'Magnemite', 'Voltorb', 'Mareep']] },
  // Galar
  { name: 'Milo', cls: 'Galar Leader', spec: 'Grass', age: 23, g: 'm', team: ['Gossifleur', ['Skiddo', 'Smoliv']] },
  { name: 'Nessa', cls: 'Galar Leader', spec: 'Water', age: 21, g: 'f', team: ['Chewtle', ['Arrokuda', 'Goldeen']] },
  { name: 'Kabu', cls: 'Galar Leader', spec: 'Fire', age: 50, g: 'm', team: ['Sizzlipede', ['Vulpix', 'Growlithe']] },
  { name: 'Bea', cls: 'Galar Leader', spec: 'Fighting', age: 17, g: 'f', team: ['Clobbopus', ['Machop', 'Galarian Farfetch\'d']] },
  { name: 'Allister', cls: 'Galar Leader', spec: 'Ghost', age: 13, g: 'm', team: ['Galarian Yamask', ['Gastly', 'Sinistea']] },
  { name: 'Opal', cls: 'Galar Leader', spec: 'Fairy', age: 88, g: 'f', team: ['Milcery', ['Togepi', 'Mawile', 'Galarian Ponyta']] },
  { name: 'Gordie', cls: 'Galar Leader', spec: 'Rock', age: 21, g: 'm', team: ['Rolycoly', ['Shuckle', 'Stonjourner']] },
  { name: 'Melony', cls: 'Galar Leader', spec: 'Ice', age: 45, g: 'f', team: ['Snom', ['Galarian Darumaka', 'Lapras']] },
  { name: 'Piers', cls: 'Galar Leader', spec: 'Dark', age: 26, g: 'm', team: ['Galarian Zigzagoon', ['Scraggy', 'Stunky']] },
  { name: 'Raihan', cls: 'Galar Leader', spec: 'Dragon', age: 23, g: 'm', team: ['Duraludon', ['Trapinch', 'Goomy']] },
  { name: 'Leon', cls: 'Champion', spec: null, age: 20, g: 'm', team: ['Charmander', ['Dreepy', 'Honedge', 'Axew']] },
  { name: 'Hop', cls: 'Rival', spec: null, age: 12, g: 'm', team: ['Wooloo', ['Rookidee', 'Grookey', 'Sobble']] },
  { name: 'Marnie', cls: 'Rival', spec: 'Dark', age: 14, g: 'f', team: ['Morpeko', ['Impidimp', 'Purrloin', 'Croagunk']] },
  { name: 'Bede', cls: 'Rival', spec: 'Fairy', age: 15, g: 'm', team: ['Hatenna', ['Ralts', 'Gothita']] },
  { name: 'Sonia', cls: 'Pokémon Professor', spec: null, age: 22, g: 'f', team: ['Yamper', ['Eevee', 'Galarian Meowth']] },
  { name: 'Rose', cls: 'Chairman', spec: 'Steel', age: 45, g: 'm', team: ['Cufant', ['Klink', 'Ferroseed', 'Karrablast']] },
  { name: 'Goh', cls: 'Pokémon Trainer', spec: null, age: 10, g: 'm', team: ['Scorbunny', ['Sobble', 'Rookidee', 'Eevee']] },
  { name: 'Chloe', cls: 'Pokémon Trainer', spec: null, age: 10, g: 'f', team: ['Eevee', ['Yamper', 'Milcery']] },
  // Paldea
  { name: 'Katy', cls: 'Paldea Leader', spec: 'Bug', age: 28, g: 'f', team: ['Nymble', ['Tarountula', 'Teddiursa']] },
  { name: 'Brassius', cls: 'Paldea Leader', spec: 'Grass', age: 40, g: 'm', team: ['Smoliv', ['Bonsly', 'Petilil']] },
  { name: 'Iono', cls: 'Paldea Leader', spec: 'Electric', age: 19, g: 'f', team: ['Wattrel', ['Tadbulb', 'Misdreavus', 'Shinx']] },
  { name: 'Kofu', cls: 'Paldea Leader', spec: 'Water', age: 50, g: 'm', team: ['Veluza', ['Wiglett', 'Crabrawler']] },
  { name: 'Larry', cls: 'Paldea Leader', spec: 'Normal', age: 40, g: 'm', team: ['Komala', ['Dunsparce', 'Tandemaus']] },
  { name: 'Ryme', cls: 'Paldea Leader', spec: 'Ghost', age: 26, g: 'f', team: ['Greavard', ['Mimikyu', 'Toxel']] },
  { name: 'Tulip', cls: 'Paldea Leader', spec: 'Psychic', age: 25, g: 'f', team: ['Flittle', ['Girafarig', 'Ralts']] },
  { name: 'Grusha', cls: 'Paldea Leader', spec: 'Ice', age: 20, g: 'm', team: ['Cetoddle', ['Snom', 'Swablu']] },
  { name: 'Rika', cls: 'Elite Four', spec: 'Ground', age: 30, g: 'f', team: ['Barboach', ['Phanpy', 'Diglett', 'Numel']] },
  { name: 'Poppy', cls: 'Elite Four', spec: 'Steel', age: 8, g: 'f', team: ['Tinkatink', ['Cufant', 'Magnemite', 'Bronzor']] },
  { name: 'Hassel', cls: 'Elite Four', spec: 'Dragon', age: 35, g: 'm', team: ['Noibat', ['Skrelp', 'Applin', 'Frigibax']] },
  { name: 'Geeta', cls: 'Champion', spec: null, age: 35, g: 'f', team: ['Glimmet', ['Flittle', 'Skiddo', 'Pawniard', 'Veluza']] },
  { name: 'Nemona', cls: 'Champion', spec: null, age: 16, g: 'f', team: ['Pawmi', ['Rockruff', 'Goomy', 'Sprigatito', 'Orthworm']] },
  { name: 'Arven', cls: 'Rival', spec: null, age: 17, g: 'm', team: ['Maschiff', ['Lechonk', 'Toedscool', 'Tadbulb']] },
  { name: 'Penny', cls: 'Team Star Boss', spec: null, age: 18, g: 'f', team: ['Eevee', ['Pawmi', 'Shroodle']] },
  { name: 'Kieran', cls: 'Rival', spec: null, age: 14, g: 'm', team: ['Applin', ['Horsea', 'Litten', 'Poltchageist']] },
  { name: 'Liko', cls: 'Pokémon Trainer', spec: null, age: 12, g: 'f', team: ['Sprigatito', ['Charcadet', 'Flittle']] },
  { name: 'Roy', cls: 'Pokémon Trainer', spec: null, age: 11, g: 'm', team: ['Fuecoco', ['Wattrel', 'Tarountula']] },
  { name: 'Dot', cls: 'Pokémon Trainer', spec: null, age: 12, g: 'f', team: ['Quaxly', ['Tinkatink', 'Smoliv']] },
  { name: 'Friede', cls: 'Rising Volt Captain', spec: null, age: 30, g: 'm', team: ['Pikachu', ['Charmander', 'Rookidee']] },
  // Battle Frontier Brains
  { name: 'Noland', cls: 'Factory Head', spec: null, age: 42, g: 'm', team: ['Tauros', ['Heracross', 'Starmie']] },
  { name: 'Greta', cls: 'Arena Tycoon', spec: 'Fighting', age: 30, g: 'f', team: ['Heracross', ['Makuhita', 'Meditite']] },
  { name: 'Tucker', cls: 'Dome Ace', spec: 'Dragon', age: 28, g: 'm', team: ['Bagon', ['Beldum', 'Swablu']] },
  { name: 'Lucy', cls: 'Pike Queen', spec: 'Poison', age: 24, g: 'f', team: ['Seviper', ['Feebas', 'Shuckle']] },
  { name: 'Spenser', cls: 'Palace Maven', spec: null, age: 72, g: 'm', team: ['Zubat', ['Slakoth', 'Lapras']] },
  { name: 'Brandon', cls: 'Pyramid King', spec: 'Rock', age: 50, g: 'm', team: ['Larvitar', ['Nosepass', 'Aron']] },
  { name: 'Anabel', cls: 'Salon Maiden', spec: 'Psychic', age: 18, g: 'f', team: ['Abra', ['Snorlax', 'Eevee']] },
  { name: 'Palmer', cls: 'Tower Tycoon', spec: null, age: 45, g: 'm', team: ['Rhyhorn', ['Feebas', 'Dratini']] },
  { name: 'Thorton', cls: 'Factory Head', spec: 'Steel', age: 17, g: 'm', team: ['Bronzor', ['Magnemite', 'Porygon']] },
  { name: 'Dahlia', cls: 'Arcade Star', spec: null, age: 25, g: 'f', team: ['Lotad', ['Togepi', 'Elekid']] },
  { name: 'Darach', cls: 'Castle Valet', spec: null, age: 20, g: 'm', team: ['Starly', ['Piplup', 'Houndour']] },
  { name: 'Argenta', cls: 'Hall Matron', spec: null, age: 50, g: 'f', team: ['Skarmory', ['Squirtle', 'Heracross']] },
  { name: 'Ingo', cls: 'Subway Boss', spec: null, age: 30, g: 'm', team: ['Drilbur', ['Litwick', 'Archen']] },
  { name: 'Emmet', cls: 'Subway Boss', spec: 'Electric', age: 30, g: 'm', team: ['Joltik', ['Tynamo', 'Archen']] },
  // Villain team bosses and admins
  { name: 'Maxie', cls: 'Magma Leader', spec: 'Ground', age: 40, g: 'm', team: ['Numel', ['Poochyena', 'Zubat']] },
  { name: 'Archie', cls: 'Aqua Leader', spec: 'Water', age: 40, g: 'm', team: ['Carvanha', ['Poochyena', 'Zubat']] },
  { name: 'Cyrus', cls: 'Galactic Boss', spec: 'Dark', age: 27, g: 'm', team: ['Sneasel', ['Murkrow', 'Zubat', 'Magikarp']] },
  { name: 'Ghetsis', cls: 'Plasma Sage', spec: 'Dark', age: 50, g: 'm', team: ['Deino', ['Croagunk', 'Tympole']] },
  { name: 'Lysandre', cls: 'Flare Boss', spec: 'Fire', age: 40, g: 'm', team: ['Litleo', ['Murkrow', 'Magikarp']] },
  { name: 'Volo', cls: 'Merchant', spec: null, age: 25, g: 'm', team: ['Spiritomb', ['Gible', 'Riolu', 'Togepi']] },
  { name: 'Archer', cls: 'Rocket Executive', spec: 'Dark', age: 32, g: 'm', team: ['Houndour', ['Koffing', 'Zubat']] },
  { name: 'Ariana', cls: 'Rocket Executive', spec: 'Poison', age: 28, g: 'f', team: ['Ekans', ['Oddish', 'Murkrow']] },
  { name: 'Courtney', cls: 'Magma Admin', spec: 'Fire', age: 22, g: 'f', team: ['Numel', ['Poochyena', 'Swablu']] },
  { name: 'Matt', cls: 'Aqua Admin', spec: 'Water', age: 25, g: 'm', team: ['Carvanha', ['Poochyena', 'Lotad']] },
  { name: 'Shelly', cls: 'Aqua Admin', spec: 'Water', age: 28, g: 'f', team: ['Carvanha', ['Poochyena', 'Zubat']] },
  { name: 'Mars', cls: 'Galactic Commander', spec: null, age: 20, g: 'f', team: ['Glameow', ['Bronzor', 'Zubat']] },
  { name: 'Jupiter', cls: 'Galactic Commander', spec: 'Poison', age: 24, g: 'f', team: ['Stunky', ['Bronzor', 'Zubat']] },
  { name: 'Saturn', cls: 'Galactic Commander', spec: 'Poison', age: 24, g: 'm', team: ['Croagunk', ['Abra', 'Bronzor']] },
  { name: 'Colress', cls: 'Plasma Scientist', spec: 'Steel', age: 30, g: 'm', team: ['Klink', ['Magnemite', 'Elgyem']] },
  // Ash's rivals from the anime
  { name: 'Paul', cls: 'Rival', spec: null, age: 12, g: 'm', team: ['Turtwig', ['Elekid', 'Teddiursa', 'Sneasel']] },
  { name: 'Trip', cls: 'Rival', spec: null, age: 11, g: 'm', team: ['Snivy', ['Pidove', 'Vanillite', 'Frillish']] },
  { name: 'Alain', cls: 'Rival', spec: null, age: 18, g: 'm', team: ['Charmander', ['Beldum', 'Larvitar', 'Pawniard']] },
  { name: 'Tobias', cls: 'Rival', spec: null, age: 25, g: 'm', team: ['Larvitar', ['Bagon', 'Absol']] },
  { name: 'Sawyer', cls: 'Rival', spec: null, age: 12, g: 'm', team: ['Treecko', ['Bagon', 'Clauncher', 'Honedge']] },
  { name: 'Ritchie', cls: 'Rival', spec: null, age: 10, g: 'm', team: ['Pikachu', ['Charmander', 'Caterpie']] },
  { name: 'Harrison', cls: 'Rival', spec: null, age: 12, g: 'm', team: ['Torchic', ['Chikorita', 'Houndour']] },
  { name: 'Morrison', cls: 'Rival', spec: null, age: 11, g: 'm', team: ['Growlithe', ['Beldum', 'Gligar']] },
  { name: 'Cameron', cls: 'Rival', spec: null, age: 12, g: 'm', team: ['Riolu', ['Ferroseed', 'Oshawott']] },
  // Ash's companions
  { name: 'Tracey', cls: 'Pokémon Watcher', spec: null, age: 13, g: 'm', team: ['Scyther', ['Venonat', 'Marill']] },
  { name: 'Max', cls: 'Pokémon Trainer', spec: 'Psychic', age: 8, g: 'm', team: ['Ralts', ['Treecko', 'Torchic']] },
  // player characters
  { name: 'Leaf', cls: 'Pokémon Trainer', spec: null, age: 11, g: 'f', team: [['Bulbasaur', 'Charmander', 'Squirtle'], ['Pidgey', 'Clefairy', 'Eevee']] },
  { name: 'Ethan', cls: 'Pokémon Trainer', spec: null, age: 11, g: 'm', team: [['Chikorita', 'Cyndaquil', 'Totodile'], ['Togepi', 'Marill', 'Sentret']] },
  { name: 'Lyra', cls: 'Pokémon Trainer', spec: null, age: 11, g: 'f', team: [['Chikorita', 'Cyndaquil', 'Totodile'], ['Marill', 'Togepi', 'Hoothoot']] },
  { name: 'Kris', cls: 'Pokémon Trainer', spec: null, age: 11, g: 'f', team: [['Chikorita', 'Cyndaquil', 'Totodile'], ['Mareep', 'Togepi', 'Hoothoot']] },
  { name: 'Lucas', cls: 'Pokémon Trainer', spec: null, age: 11, g: 'm', team: [['Turtwig', 'Chimchar', 'Piplup'], ['Starly', 'Bidoof', 'Shinx']] },
  { name: 'Hilbert', cls: 'Pokémon Trainer', spec: null, age: 14, g: 'm', team: [['Snivy', 'Tepig', 'Oshawott'], ['Lillipup', 'Pidove', 'Purrloin']] },
  { name: 'Hilda', cls: 'Pokémon Trainer', spec: null, age: 14, g: 'f', team: [['Snivy', 'Tepig', 'Oshawott'], ['Munna', 'Pidove', 'Lillipup']] },
  { name: 'Nate', cls: 'Pokémon Trainer', spec: null, age: 13, g: 'm', team: [['Snivy', 'Tepig', 'Oshawott'], ['Riolu', 'Patrat', 'Azurill']] },
  { name: 'Rosa', cls: 'Pokémon Trainer', spec: null, age: 13, g: 'f', team: [['Snivy', 'Tepig', 'Oshawott'], ['Purrloin', 'Azurill', 'Riolu']] },
  { name: 'Elio', cls: 'Pokémon Trainer', spec: null, age: 11, g: 'm', team: [['Rowlet', 'Litten', 'Popplio'], ['Pikipek', 'Rockruff', 'Yungoos']] },
  { name: 'Selene', cls: 'Pokémon Trainer', spec: null, age: 11, g: 'f', team: [['Rowlet', 'Litten', 'Popplio'], ['Rockruff', 'Grubbin', 'Cutiefly']] },
  { name: 'Victor', cls: 'Pokémon Trainer', spec: null, age: 12, g: 'm', team: [['Grookey', 'Scorbunny', 'Sobble'], ['Wooloo', 'Rookidee', 'Skwovet']] },
  { name: 'Gloria', cls: 'Pokémon Trainer', spec: null, age: 12, g: 'f', team: [['Grookey', 'Scorbunny', 'Sobble'], ['Wooloo', 'Yamper', 'Nickit']] },
  { name: 'Florian', cls: 'Pokémon Trainer', spec: null, age: 14, g: 'm', team: [['Sprigatito', 'Fuecoco', 'Quaxly'], ['Lechonk', 'Pawmi', 'Tarountula']] },
  { name: 'Juliana', cls: 'Pokémon Trainer', spec: null, age: 14, g: 'f', team: [['Sprigatito', 'Fuecoco', 'Quaxly'], ['Fidough', 'Pawmi', 'Smoliv']] },
  { name: 'Rei', cls: 'Survey Corps Member', spec: null, age: 15, g: 'm', team: [['Rowlet', 'Cyndaquil', 'Oshawott'], ['Starly', 'Bidoof', 'Shinx']] },
  { name: 'Akari', cls: 'Survey Corps Member', spec: null, age: 15, g: 'f', team: [['Rowlet', 'Cyndaquil', 'Oshawott'], ['Pichu', 'Buneary', 'Ponyta']] },
  // rivals and friends
  { name: 'Hugh', cls: 'Rival', spec: null, age: 14, g: 'm', team: ['Tepig', ['Pidove', 'Purrloin', 'Throh']] },
  { name: 'Shauna', cls: 'Rival', spec: null, age: 12, g: 'f', team: [['Chespin', 'Fennekin', 'Froakie'], ['Flabébé', 'Bunnelby', 'Fletchling']] },
  { name: 'Tierno', cls: 'Rival', spec: null, age: 12, g: 'm', team: ['Corphish', ['Squirtle', 'Budew', 'Fletchling']] },
  { name: 'Trevor', cls: 'Rival', spec: null, age: 12, g: 'm', team: ['Charmander', ['Flabébé', 'Fletchling', 'Pikachu']] },
  { name: 'Drew', cls: 'Coordinator', spec: null, age: 11, g: 'm', team: ['Budew', ['Surskit', 'Trapinch', 'Absol']] },
  { name: 'Zoey', cls: 'Coordinator', spec: null, age: 13, g: 'f', team: ['Glameow', ['Shellos', 'Misdreavus', 'Ralts']] },
  { name: 'Ursula', cls: 'Coordinator', spec: null, age: 11, g: 'f', team: ['Gible', ['Plusle', 'Minun', 'Eevee']] },
  { name: 'Kenny', cls: 'Coordinator', spec: null, age: 10, g: 'm', team: ['Piplup', ['Machop', 'Shroomish', 'Abra']] },
  // DLC: Galar (Isle of Armor, Crown Tundra)
  { name: 'Mustard', cls: 'Dojo Master', spec: null, age: 60, g: 'm', team: ['Mienfoo', ['Shinx', 'Rookidee', 'Jangmo-o']] },
  { name: 'Klara', cls: 'Dojo Student', spec: 'Poison', age: 16, g: 'f', team: ['Galarian Slowpoke', ['Skrelp', 'Koffing', 'Venipede']] },
  { name: 'Avery', cls: 'Dojo Student', spec: 'Psychic', age: 16, g: 'm', team: ['Abra', ['Galarian Slowpoke', 'Woobat', 'Galarian Ponyta']] },
  { name: 'Peony', cls: 'Former Gym Leader', spec: 'Steel', age: 45, g: 'm', team: ['Cufant', ['Galarian Meowth', 'Aron']] },
  // DLC: Paldea (Teal Mask, Indigo Disk)
  { name: 'Carmine', cls: 'Rival', spec: null, age: 15, g: 'f', team: ['Poltchageist', ['Lotad', 'Vulpix']] },
  { name: 'Briar', cls: 'Blueberry Academy Teacher', spec: 'Dragon', age: 25, g: 'f', team: ['Duraludon', ['Gible', 'Dreepy']] },
  { name: 'Lacey', cls: 'Blueberry Elite Four', spec: 'Fairy', age: 17, g: 'f', team: ['Snubbull', ['Cottonee', 'Popplio', 'Impidimp']] },
  { name: 'Drayton', cls: 'Blueberry Elite Four', spec: 'Dragon', age: 18, g: 'm', team: ['Dratini', ['Applin', 'Axew', 'Treecko']] },
  { name: 'Crispin', cls: 'Blueberry Elite Four', spec: 'Fire', age: 17, g: 'm', team: ['Torkoal', ['Fletchling', 'Torchic']] },
  { name: 'Amarys', cls: 'Blueberry Elite Four', spec: 'Steel', age: 19, g: 'f', team: ['Skarmory', ['Piplup', 'Rookidee', 'Shieldon']] },
  // DLC-era: Team Star squad bosses (Scarlet/Violet)
  { name: 'Mela', cls: 'Team Star Boss', spec: 'Fire', age: 17, g: 'f', team: ['Varoom', ['Houndour', 'Torkoal', 'Salandit']] },
  { name: 'Atticus', cls: 'Team Star Boss', spec: 'Poison', age: 18, g: 'm', team: ['Shroodle', ['Skrelp', 'Venipede', 'Grimer']] },
  { name: 'Ortega', cls: 'Team Star Boss', spec: 'Fairy', age: 16, g: 'm', team: ['Fidough', ['Azurill', 'Swirlix', 'Flabébé']] },
  { name: 'Eri', cls: 'Team Star Boss', spec: 'Fighting', age: 18, g: 'f', team: ['Mankey', ['Toxel', 'Riolu', 'Crabrawler']] },
  { name: 'Giacomo', cls: 'Team Star Boss', spec: 'Dark', age: 17, g: 'm', team: ['Pawniard', ['Murkrow', 'Impidimp', 'Nickit']] },
  // Orre: Pokémon XD: Gale of Darkness
  { name: 'Michael', cls: 'Snag Machine Tester', spec: null, age: 15, g: 'm', team: ['Eevee', ['Teddiursa', 'Togepi', 'Makuhita']] },
  { name: 'Jovi', cls: 'Pokémon Trainer', spec: 'Electric', age: 9, g: 'f', team: ['Plusle', ['Minun']] },
  { name: 'Krane', cls: 'Professor', spec: null, age: 45, g: 'm', team: ['Porygon', ['Magnemite', 'Natu']] },
  { name: 'Duking', cls: 'Pyrite Town Strongman', spec: null, age: 40, g: 'm', team: ['Meditite', ['Larvitar', 'Shuckle', 'Plusle']] },
  { name: 'Gonzap', cls: 'Team Snagem Boss', spec: null, age: 45, g: 'm', team: ['Skarmory', ['Seedot', 'Voltorb', 'Oddish', 'Barboach']] },
  { name: 'Miror B.', cls: 'Team Miror Boss', spec: 'Water', age: 35, g: 'm', team: ['Lotad', ['Voltorb', 'Nosepass']] },
  { name: 'Lovrina', cls: 'Cipher Admin', spec: null, age: 25, g: 'f', team: ['Luvdisc', ['Wurmple', 'Budew', 'Skitty']] },
  { name: 'Snattle', cls: 'Cipher Admin', spec: null, age: 50, g: 'm', team: ['Chinchou', ['Wooper', 'Lunatone', 'Castform', 'Beldum']] },
  { name: 'Gorigan', cls: 'Cipher Admin', spec: null, age: 40, g: 'm', team: ['Aron', ['Spheal', 'Slowpoke', 'Teddiursa', 'Mankey']] },
  { name: 'Ardos', cls: 'Cipher Admin', spec: null, age: 30, g: 'm', team: ['Abra', ['Taillow', 'Horsea', 'Heracross', 'Elekid']] },
  { name: 'Eldes', cls: 'Cipher Admin', spec: null, age: 30, g: 'm', team: ['Bagon', ['Nincada', 'Electrike', 'Trapinch', 'Cubone']] },
  { name: 'Greevil', cls: 'Cipher Grand Master', spec: null, age: 60, g: 'm', team: ['Rhyhorn', ['Exeggcute', 'Tauros']] },
  { name: 'Exol', cls: 'Cipher Cmdr', spec: null, age: 30, g: 'm', team: ['Whismur', ['Girafarig', 'Mawile', 'Pikachu']] },
  { name: 'Zook', cls: 'Street Thug', spec: 'Normal', age: 22, g: 'm', team: ['Zangoose'] },
];
// What each famous trainer is known as in the games and anime. A trainer can hold several.
const FAMOUS_TAG_LABELS = { hero: 'Player Character', orre: 'Orre', brain: 'Frontier Brain', leader: 'Gym Leader', kahuna: 'Island Kahuna', captain: 'Trial Captain', e4: 'Elite Four', champ: 'Champion', anime: 'Anime', rival: 'Rival', boss: 'Villain', prof: 'Professor', go: 'Pokémon GO' };
const FAMOUS_TAG_PLURAL = { hero: 'Player characters', orre: 'Orre (XD)', brain: 'Frontier Brains', leader: 'Gym Leaders', kahuna: 'Island Kahunas', captain: 'Trial Captains', e4: 'Elite Four', champ: 'Champions', anime: 'Anime characters', rival: 'Rivals', boss: 'Villains', prof: 'Professors', go: 'Pokémon GO' };
const FAMOUS_TAG_LIST = {
  leader: ['Brock', 'Misty', 'Lt. Surge', 'Erika', 'Koga', 'Sabrina', 'Blaine', 'Giovanni', 'Blue', 'Falkner', 'Bugsy', 'Whitney', 'Morty', 'Chuck', 'Jasmine', 'Pryce', 'Clair', 'Janine', 'Roxanne', 'Brawly', 'Wattson', 'Flannery', 'Norman', 'Winona', 'Tate & Liza', 'Wallace', 'Juan', 'Roark', 'Gardenia', 'Maylene', 'Crasher Wake', 'Fantina', 'Byron', 'Candice', 'Volkner', 'Cilan', 'Chili', 'Cress', 'Lenora', 'Burgh', 'Elesa', 'Clay', 'Skyla', 'Brycen', 'Drayden', 'Iris', 'Cheren', 'Roxie', 'Marlon', 'Viola', 'Grant', 'Korrina', 'Ramos', 'Clemont', 'Valerie', 'Olympia', 'Wulfric', 'Milo', 'Nessa', 'Kabu', 'Bea', 'Allister', 'Opal', 'Gordie', 'Melony', 'Piers', 'Raihan', 'Bede', 'Marnie', 'Katy', 'Brassius', 'Iono', 'Kofu', 'Larry', 'Ryme', 'Tulip', 'Grusha'],
  brain: ['Noland', 'Greta', 'Tucker', 'Lucy', 'Spenser', 'Brandon', 'Anabel', 'Palmer', 'Thorton', 'Dahlia', 'Darach', 'Argenta', 'Ingo', 'Emmet'],
  kahuna: ['Hala', 'Olivia', 'Nanu', 'Hapu'],
  captain: ['Ilima', 'Lana', 'Kiawe', 'Mallow', 'Sophocles', 'Acerola', 'Mina'],
  prof: ['Oak', 'Elm', 'Birch', 'Rowan', 'Juniper', 'Sycamore', 'Kukui', 'Magnolia', 'Sonia', 'Sada', 'Turo', 'Krane', 'Willow'],
  go: ['Candela', 'Blanche', 'Spark', 'Willow'],
  hero: ['Red', 'Leaf', 'Ethan', 'Lyra', 'Kris', 'Brendan', 'May', 'Lucas', 'Dawn', 'Hilbert', 'Hilda', 'Nate', 'Rosa', 'Calem', 'Serena', 'Elio', 'Selene', 'Victor', 'Gloria', 'Florian', 'Juliana', 'Rei', 'Akari', 'Michael'],
  orre: ['Michael', 'Jovi', 'Krane', 'Duking', 'Gonzap', 'Miror B.', 'Lovrina', 'Snattle', 'Gorigan', 'Ardos', 'Eldes', 'Greevil', 'Exol', 'Zook'],
  boss: ['Mela', 'Atticus', 'Ortega', 'Eri', 'Giacomo', 'Greevil', 'Ardos', 'Eldes', 'Lovrina', 'Snattle', 'Gorigan', 'Exol', 'Gonzap', 'Miror B.', 'Giovanni', 'Guzma', 'Plumeria', 'Lusamine', 'Rose', 'Penny', 'Maxie', 'Archie', 'Cyrus', 'Ghetsis', 'Lysandre', 'Volo', 'Archer', 'Ariana', 'Courtney', 'Matt', 'Shelly', 'Mars', 'Jupiter', 'Saturn', 'Colress'],
  e4: ['Lacey', 'Drayton', 'Crispin', 'Amarys', 'Rika', 'Poppy', 'Larry', 'Hassel', 'Hala', 'Olivia', 'Acerola', 'Kahili', 'Molayne', 'Lorelei', 'Bruno', 'Agatha', 'Lance', 'Koga', 'Will', 'Karen', 'Sidney', 'Phoebe', 'Glacia', 'Drake', 'Aaron', 'Bertha', 'Flint', 'Lucian', 'Shauntal', 'Grimsley', 'Caitlin', 'Marshal', 'Malva', 'Siebold', 'Wikstrom', 'Drasna'],
  champ: ['Blue', 'Red', 'Lance', 'Steven', 'Wallace', 'Cynthia', 'Alder', 'Iris', 'Diantha', 'Kukui', 'Leon', 'Geeta', 'Nemona', 'Kieran'],
  anime: ['Drew', 'Zoey', 'Ursula', 'Kenny', 'Ash', 'Misty', 'Brock', 'Gary', 'Tracey', 'May', 'Max', 'Dawn', 'Iris', 'Cilan', 'Clemont', 'Serena', 'Lana', 'Kiawe', 'Mallow', 'Sophocles', 'Lillie', 'Kukui', 'Gladion', 'Hau', 'Oak', 'Juniper', 'Leon', 'Goh', 'Chloe', 'Raihan', 'Liko', 'Roy', 'Dot', 'Friede', 'Paul', 'Trip', 'Alain', 'Tobias', 'Sawyer', 'Ritchie', 'Harrison', 'Morrison', 'Cameron'],
  rival: ['Hugh', 'Shauna', 'Tierno', 'Trevor', 'Carmine', 'Klara', 'Avery', 'Drew', 'Zoey', 'Ursula', 'Kenny', 'Blue', 'Gary', 'Silver', 'Brendan', 'Wally', 'Barry', 'Cheren', 'Bianca', 'N', 'Calem', 'Hau', 'Gladion', 'Hop', 'Marnie', 'Bede', 'Nemona', 'Arven', 'Kieran', 'Paul', 'Trip', 'Alain', 'Tobias', 'Sawyer', 'Ritchie', 'Harrison', 'Morrison', 'Cameron'],
};
for (const f of FAMOUS) f.tags = Object.keys(FAMOUS_TAG_LIST).filter(k => FAMOUS_TAG_LIST[k].includes(f.name));
// Optional packs of famous trainers from outside Pokémon, switched on in Advanced options when a league is created.
// Pack trainers can have a second signature type (spec2, optional); they turn up exactly as often as any other famous trainer.
const FAMOUS_PACKS = {
  mk: { name: 'Mortal Kombat Characters', tag: 'Mortal Kombat', desc: 'Fighters from across the Mortal Kombat series and its guest characters, each with two signature types.', trainers: [
    { name: 'Scorpion', cls: 'Netherrealm Specter', spec: 'Ghost', spec2: 'Fire', age: 34, g: 'm', team: ['Charcadet', ['Litwick', 'Houndour', 'Alolan Marowak', 'Sinistea']] },
    { name: 'Sub-Zero', cls: 'Lin Kuei Grandmaster', spec: 'Ice', spec2: 'Dark', age: 31, g: 'm', team: ['Sneasel', ['Frigibax', 'Snorunt', 'Cryogonal', 'Absol']] },
    { name: 'Raiden', cls: 'God of Thunder', spec: 'Electric', spec2: 'Flying', age: 40, g: 'm', team: ['Elekid', ['Wattrel', 'Mareep', 'Tynamo', 'Joltik']] },
    { name: 'Liu Kang', cls: 'Shaolin Champion', spec: 'Fighting', spec2: 'Fire', age: 25, g: 'm', team: ['Mienfoo', ['Chimchar', 'Tyrogue', 'Dratini']] },
    { name: 'Baraka', cls: 'Tarkatan Warrior', spec: 'Dark', spec2: 'Steel', age: 36, g: 'm', team: ['Pawniard', ['Scyther', 'Sandile', 'Carvanha', 'Honedge']] },
    { name: 'Johnny Cage', cls: 'Movie Star', spec: 'Fighting', spec2: 'Fairy', age: 29, g: 'm', team: ['Hawlucha', ['Meditite', 'Mime Jr.', 'Swirlix', 'Riolu']] },
    { name: 'Sonya Blade', cls: 'Special Forces Lieutenant', spec: 'Fighting', spec2: 'Steel', age: 27, g: 'f', team: ['Riolu', ['Timburr', 'Rookidee', 'Rufflet', 'Magnemite']] },
    { name: 'Kano', cls: 'Black Dragon Mercenary', spec: 'Dark', spec2: 'Fighting', age: 38, g: 'm', team: ['Scraggy', ['Pancham', 'Poochyena', 'Impidimp', 'Magnemite']] },
    { name: 'Reptile', cls: 'Zaterran Assassin', spec: 'Poison', spec2: 'Dragon', age: 30, g: 'm', team: ['Skrelp', ['Kecleon', 'Salandit', 'Croagunk', 'Ekans']] },
    { name: 'Goro', cls: 'Shokan Prince', spec: 'Fighting', spec2: 'Ground', age: 34, g: 'm', team: ['Machop', ['Makuhita', 'Rhyhorn', 'Larvitar', 'Mudbray']] },
    // Mortal Kombat II
    { name: 'Kung Lao', cls: 'Shaolin Monk', spec: 'Steel', spec2: 'Fighting', age: 26, g: 'm', team: ['Honedge', ['Klink', 'Riolu', 'Sawk', 'Bronzor']] },
    { name: 'Kitana', cls: 'Edenian Princess', spec: 'Fairy', spec2: 'Flying', age: 28, g: 'f', team: ['Togepi', ['Swablu', 'Ralts', 'Hoppip', 'Cutiefly']] },
    { name: 'Mileena', cls: 'Tarkatan Clone', spec: 'Dark', spec2: 'Fairy', age: 26, g: 'f', team: ['Mawile', ['Impidimp', 'Sableye', 'Carvanha', 'Nickit']] },
    { name: 'Jax', cls: 'Special Forces Major', spec: 'Steel', spec2: 'Ground', age: 37, g: 'm', team: ['Drilbur', ['Aron', 'Beldum', 'Crabrawler', 'Tinkatink']] },
    { name: 'Shao Kahn', cls: 'Emperor of Outworld', spec: 'Dark', spec2: 'Dragon', age: 40, g: 'm', team: ['Deino', ['Druddigon', 'Larvitar', 'Gible', 'Murkrow']] },
    { name: 'Kintaro', cls: 'Shokan General', spec: 'Fire', spec2: 'Fighting', age: 33, g: 'm', team: ['Litten', ['Tepig', 'Stufful', 'Throh', 'Growlithe']] },
    { name: 'Jade', cls: 'Edenian Bodyguard', spec: 'Grass', spec2: 'Fighting', age: 27, g: 'f', team: ['Shroomish', ['Chespin', 'Sprigatito', 'Snivy', 'Pansage']] },
    { name: 'Smoke', cls: 'Lin Kuei Warrior', spec: 'Poison', spec2: 'Steel', age: 30, g: 'm', team: ['Koffing', ['Varoom', 'Stunky', 'Trubbish', 'Grimer']] },
    { name: 'Noob Saibot', cls: 'Brotherhood of Shadow Wraith', spec: 'Ghost', spec2: 'Dark', age: 33, g: 'm', team: ['Duskull', ['Shuppet', 'Phantump', 'Purrloin', 'Greavard']] },
    // Mortal Kombat 3
    { name: 'Cyrax', cls: 'Lin Kuei Cyborg', spec: 'Steel', spec2: 'Electric', age: 32, g: 'm', team: ['Voltorb', ['Magnemite', 'Joltik', 'Spinarak', 'Tadbulb']] },
    { name: 'Sektor', cls: 'Lin Kuei Cyborg', spec: 'Steel', spec2: 'Fire', age: 34, g: 'm', team: ['Beldum', ['Sizzlipede', 'Remoraid', 'Rolycoly', 'Klink']] },
    { name: 'Nightwolf', cls: 'Matoka Shaman', spec: 'Rock', spec2: 'Psychic', age: 36, g: 'm', team: ['Rockruff', ['Natu', 'Growlithe', 'Elgyem', 'Baltoy']] },
    { name: 'Sindel', cls: 'Queen of Edenia', spec: 'Ghost', spec2: 'Flying', age: 40, g: 'f', team: ['Noibat', ['Drifloon', 'Whismur', 'Misdreavus', 'Hoothoot']] },
    { name: 'Stryker', cls: 'Riot Cop', spec: 'Normal', spec2: 'Fire', age: 35, g: 'm', team: ['Growlithe', ['Patrat', 'Lillipup', 'Litleo', 'Electrike']] },
    { name: 'Kabal', cls: 'Hookswords Vigilante', spec: 'Dark', spec2: 'Bug', age: 30, g: 'm', team: ['Nymble', ['Nincada', 'Galarian Zigzagoon', 'Shroodle', 'Sneasel']] },
    { name: 'Sheeva', cls: 'Shokan Queen', spec: 'Ground', spec2: 'Fighting', age: 32, g: 'f', team: ['Phanpy', ['Mankey', 'Hippopotas', 'Nidoran♀', 'Sandshrew']] },
    { name: 'Motaro', cls: 'Centaurian Warlord', spec: 'Fire', spec2: 'Ground', age: 38, g: 'm', team: ['Ponyta', ['Numel', 'Mudbray', 'Tauros', 'Sandile']] },
    // Ultimate Mortal Kombat 3
    { name: 'Rain', cls: 'Edenian Demigod', spec: 'Water', spec2: 'Electric', age: 29, g: 'm', team: ['Chinchou', ['Froakie', 'Wingull', 'Shellos', 'Tympole']] },
    { name: 'Ermac', cls: 'Soul-Fused Revenant', spec: 'Psychic', spec2: 'Dark', age: 33, g: 'm', team: ['Solosis', ['Inkay', 'Golett', 'Gothita', 'Yamask']] },
    // Mortal Kombat Mythologies: Sub-Zero
    { name: 'Quan Chi', cls: 'Netherrealm Sorcerer', spec: 'Ghost', spec2: 'Poison', age: 40, g: 'm', team: ['Galarian Yamask', ['Gastly', 'Litwick', 'Sandygast', 'Mareanie']] },
    { name: 'Shinnok', cls: 'Fallen Elder God', spec: 'Dark', spec2: 'Fire', age: 40, g: 'm', team: ['Houndour', ['Salandit', 'Litleo', 'Murkrow', 'Zorua']] },
    { name: 'Fujin', cls: 'God of Wind', spec: 'Flying', spec2: 'Dragon', age: 40, g: 'm', team: ['Bagon', ['Starly', 'Pidgey', 'Taillow', 'Swablu']] },
    { name: 'Sareena', cls: 'Netherrealm Demon', spec: 'Dark', spec2: 'Flying', age: 26, g: 'f', team: ['Vullaby', ['Murkrow', 'Purrloin', 'Inkay', 'Spritzee']] },
    { name: 'Kia', cls: 'Brotherhood of Shadow Assassin', spec: 'Poison', spec2: 'Dark', age: 25, g: 'f', team: ['Skorupi', ['Croagunk', 'Zubat', 'Shroodle', 'Venipede']] },
    { name: 'Jataaka', cls: 'Brotherhood of Shadow Assassin', spec: 'Ghost', spec2: 'Fighting', age: 28, g: 'f', team: ['Mankey', ['Frillish', 'Pumpkaboo', 'Timburr', 'Gastly']] },
    // Mortal Kombat 4
    { name: 'Reiko', cls: 'Outworld General', spec: 'Fighting', spec2: 'Psychic', age: 34, g: 'm', team: ['Ralts', ['Meditite', 'Tyrogue', "Galarian Farfetch'd", 'Croagunk']] },
    { name: 'Tanya', cls: 'Edenian Ambassador', spec: 'Fire', spec2: 'Psychic', age: 28, g: 'f', team: ['Fennekin', ['Fletchling', 'Darumaka', 'Galarian Ponyta', 'Slugma']] },
    { name: 'Jarek', cls: 'Black Dragon Enforcer', spec: 'Dark', spec2: 'Ground', age: 33, g: 'm', team: ['Sandile', ['Trapinch', 'Gligar', 'Poochyena', 'Nickit']] },
    { name: 'Kai', cls: 'White Lotus Monk', spec: 'Fighting', spec2: 'Water', age: 27, g: 'm', team: ['Poliwag', ['Lotad', 'Clobbopus', 'Makuhita', 'Mankey']] },
    { name: 'Meat', cls: 'Flesh Pit Experiment', spec: 'Ghost', spec2: 'Ground', age: 20, g: 'm', team: ['Cubone', ['Sandygast', 'Grimer', 'Ditto', 'Gulpin']] },
    // Mortal Kombat: Special Forces
    { name: 'Tremor', cls: 'Black Dragon Earthshaker', spec: 'Rock', spec2: 'Ground', age: 32, g: 'm', team: ['Roggenrola', ['Geodude', 'Diglett', 'Nacli', 'Onix']] },
    // Mortal Kombat: Deadly Alliance
    { name: "Bo' Rai Cho", cls: 'Drunken Master', spec: 'Fighting', spec2: 'Poison', age: 40, g: 'm', team: ['Croagunk', ['Gulpin', 'Spinda', 'Munchlax', 'Slakoth']] },
    { name: 'Drahmin', cls: 'Oni of the Netherrealm', spec: 'Ghost', spec2: 'Steel', age: 38, g: 'm', team: ['Honedge', ['Bronzor', 'Combee', 'Golett', 'Sinistea']] },
    { name: 'Frost', cls: 'Lin Kuei Prodigy', spec: 'Ice', spec2: 'Steel', age: 22, g: 'f', team: ['Alolan Sandshrew', ['Snorunt', 'Snom', 'Cubchoo', 'Bergmite']] },
    { name: 'Hsu Hao', cls: 'Red Dragon Strongman', spec: 'Fire', spec2: 'Electric', age: 37, g: 'm', team: ['Magby', ['Electrike', 'Rolycoly', 'Makuhita', 'Charcadet']] },
    { name: 'Kenshi', cls: 'Blind Swordsman', spec: 'Psychic', spec2: 'Steel', age: 32, g: 'm', team: ['Bronzor', ['Honedge', 'Abra', 'Hatenna', 'Elgyem']] },
    { name: 'Li Mei', cls: 'Outworld Champion', spec: 'Fighting', spec2: 'Bug', age: 21, g: 'f', team: ['Heracross', ['Combee', 'Kricketot', 'Riolu', 'Pawmi']] },
    { name: 'Mavado', cls: 'Red Dragon Leader', spec: 'Steel', spec2: 'Flying', age: 34, g: 'm', team: ['Rookidee', ['Skarmory', 'Klink', 'Spinarak', 'Pidove']] },
    { name: 'Nitara', cls: 'Vaeternian Vampire', spec: 'Flying', spec2: 'Poison', age: 30, g: 'f', team: ['Zubat', ['Woobat', 'Gligar', 'Noibat', 'Vullaby']] },
    { name: 'Blaze', cls: 'Fire Elemental', spec: 'Fire', spec2: 'Rock', age: 40, g: 'm', team: ['Slugma', ['Rolycoly', 'Numel', 'Charmander', 'Litwick']] },
    { name: 'Mokap', cls: 'Motion Capture Actor', spec: 'Normal', spec2: 'Electric', age: 29, g: 'm', team: ['Porygon', ['Helioptile', 'Smeargle', 'Pawmi', 'Ditto']] },
    { name: 'Moloch', cls: 'Oni Warlord', spec: 'Rock', spec2: 'Fighting', age: 40, g: 'm', team: ['Timburr', ['Rhyhorn', 'Binacle', 'Cranidos', 'Onix']] },
    // Mortal Kombat: Deception
    { name: 'Ashrah', cls: 'Redeemed Demon', spec: 'Fairy', spec2: 'Steel', age: 27, g: 'f', team: ['Tinkatink', ['Honedge', 'Flabébé', 'Snubbull', 'Klefki']] },
    { name: 'Darrius', cls: 'Seidan Resistance Leader', spec: 'Electric', spec2: 'Fighting', age: 35, g: 'm', team: ['Pawmi', ['Toxel', 'Blitzle', 'Crabrawler', 'Shinx']] },
    { name: 'Hotaru', cls: 'Seidan General', spec: 'Fire', spec2: 'Bug', age: 33, g: 'm', team: ['Larvesta', ['Sizzlipede', 'Volbeat', 'Illumise', 'Surskit']] },
    { name: 'Dairou', cls: 'Mercenary Assassin', spec: 'Dark', spec2: 'Rock', age: 35, g: 'm', team: ['Larvitar', ['Nickit', 'Rolycoly', 'Nacli', 'Pawniard']] },
    { name: 'Havik', cls: 'Cleric of Chaos', spec: 'Poison', spec2: 'Psychic', age: 31, g: 'm', team: ['Galarian Slowpoke', ['Spinda', 'Glimmet', 'Mime Jr.', 'Croagunk']] },
    { name: 'Kira', cls: 'Black Dragon Recruit', spec: 'Fire', spec2: 'Poison', age: 25, g: 'f', team: ['Salandit', ['Charmander', 'Torchic', 'Vulpix', 'Koffing']] },
    { name: 'Kobra', cls: 'Black Dragon Brawler', spec: 'Poison', spec2: 'Fighting', age: 26, g: 'm', team: ['Ekans', ['Croagunk', 'Seviper', 'Mankey', 'Shroodle']] },
    { name: 'Onaga', cls: 'Dragon King', spec: 'Dragon', spec2: 'Ground', age: 40, g: 'm', team: ['Gible', ['Axew', 'Jangmo-o', 'Trapinch', 'Dratini']] },
    { name: 'Shujinko', cls: 'Earthrealm Wanderer', spec: 'Normal', spec2: 'Fighting', age: 30, g: 'm', team: ['Eevee', ['Smeargle', 'Meditite', 'Tyrogue', 'Stufful']] },
    // Mortal Kombat: Armageddon
    { name: 'Daegon', cls: 'Red Dragon Founder', spec: 'Dragon', spec2: 'Fire', age: 30, g: 'm', team: ['Axew', ['Turtonator', 'Dreepy', 'Houndour', 'Salandit']] },
    { name: 'Taven', cls: 'Edenian Demigod', spec: 'Fire', spec2: 'Dragon', age: 28, g: 'm', team: ['Charmander', ['Fuecoco', 'Growlithe', 'Jangmo-o', 'Litleo']] },
    // Mortal Kombat (2011)
    { name: 'Skarlet', cls: 'Blood Mage', spec: 'Water', spec2: 'Dark', age: 26, g: 'f', team: ['Corphish', ['Carvanha', 'Basculin', 'Frillish', 'Spritzee']] },
    // Mortal Kombat X
    { name: 'Cassie Cage', cls: 'Special Forces Sergeant', spec: 'Fairy', spec2: 'Fighting', age: 22, g: 'f', team: ['Snubbull', ['Riolu', 'Hawlucha', 'Swirlix', 'Fidough']] },
    { name: "D'Vorah", cls: 'Kytinn Hive Mother', spec: 'Bug', spec2: 'Poison', age: 30, g: 'f', team: ['Weedle', ['Combee', 'Venonat', 'Skorupi', 'Joltik']] },
    { name: 'Erron Black', cls: 'Outworld Gunslinger', spec: 'Ground', spec2: 'Steel', age: 38, g: 'm', team: ['Silicobra', ['Cufant', 'Clauncher', 'Mudbray', 'Rufflet']] },
    { name: 'Ferra/Torr', cls: 'Outworld Brute Pair', spec: 'Normal', spec2: 'Dark', age: 25, g: 'f', team: ['Teddiursa', ['Stufful', 'Zangoose', 'Purrloin', 'Pancham']] },
    { name: 'Jacqui Briggs', cls: 'Special Forces Specialist', spec: 'Steel', spec2: 'Fighting', age: 21, g: 'f', team: ['Crabrawler', ['Aron', 'Tinkatink', 'Makuhita', 'Riolu']] },
    { name: 'Kotal Kahn', cls: 'Osh-Tekk Emperor', spec: 'Fire', spec2: 'Grass', age: 38, g: 'm', team: ['Litleo', ['Capsakid', 'Sunkern', 'Chespin', 'Larvesta']] },
    { name: 'Kung Jin', cls: 'Shaolin Archer', spec: 'Fighting', spec2: 'Grass', age: 24, g: 'm', team: ['Rowlet', ['Pikipek', 'Mienfoo', 'Fletchling', 'Pansage']] },
    { name: 'Takeda', cls: 'Shirai Ryu Ninja', spec: 'Psychic', spec2: 'Fighting', age: 22, g: 'm', team: ['Meditite', ['Hatenna', 'Litwick', 'Tangela', 'Mienfoo']] },
    // Guest fighters (Mortal Kombat vs. DC Universe characters left out)
    // Mortal Kombat (2011)
    { name: 'Freddy Krueger', cls: 'Dream Demon', spec: 'Ghost', spec2: 'Psychic', age: 40, g: 'm', team: ['Drowzee', ['Munna', 'Gastly', 'Misdreavus', 'Sneasel']] },
    { name: 'Kratos', cls: 'Ghost of Sparta', spec: 'Fighting', spec2: 'Ice', age: 40, g: 'm', team: ['Machop', ['Cubchoo', 'Snover', 'Crabrawler', 'Spheal']] },
    // Mortal Kombat X
    { name: 'Jason Voorhees', cls: 'Crystal Lake Slasher', spec: 'Ghost', spec2: 'Water', age: 40, g: 'm', team: ['Frillish', ['Honedge', 'Phantump', 'Wooper', 'Shellos']] },
    { name: 'Predator', cls: 'Yautja Hunter', spec: 'Dark', spec2: 'Electric', age: 38, g: 'm', team: ['Shinx', ['Kecleon', 'Nickit', 'Sneasel', 'Pawniard']] },
    { name: 'Alien', cls: 'Xenomorph', spec: 'Poison', spec2: 'Bug', age: 25, g: 'f', team: ['Venipede', ['Skrelp', 'Mareanie', 'Nincada', 'Wimpod']] },
    { name: 'Leatherface', cls: 'Chainsaw Butcher', spec: 'Steel', spec2: 'Normal', age: 35, g: 'm', team: ['Varoom', ['Lechonk', 'Klink', 'Pawniard', 'Zigzagoon']] },
    // Mortal Kombat 11
    { name: 'T-800', cls: 'Cyberdyne Infiltrator', spec: 'Steel', spec2: 'Psychic', age: 35, g: 'm', team: ['Beldum', ['Magnemite', 'Bronzor', 'Klink', 'Porygon']] },
    { name: 'Spawn', cls: 'Hellspawn', spec: 'Dark', spec2: 'Ghost', age: 35, g: 'm', team: ['Murkrow', ['Sableye', 'Shuppet', 'Pawniard', 'Spinarak']] },
    { name: 'RoboCop', cls: 'Detroit Police Cyborg', spec: 'Steel', spec2: 'Electric', age: 38, g: 'm', team: ['Magnemite', ['Patrat', 'Klink', 'Aron', 'Electrike']] },
    { name: 'Rambo', cls: 'Green Beret', spec: 'Grass', spec2: 'Dark', age: 40, g: 'm', team: ['Seedot', ['Sprigatito', 'Rowlet', 'Pikipek', 'Poochyena']] },
    // Mortal Kombat 1 (2023)
    { name: 'Omni-Man', cls: 'Viltrumite Conqueror', spec: 'Flying', spec2: 'Fighting', age: 40, g: 'm', team: ['Flamigo', ['Hawlucha', 'Machop', 'Starly', 'Taillow']] },
    { name: 'Homelander', cls: 'Vought Supe', spec: 'Flying', spec2: 'Fire', age: 40, g: 'm', team: ['Fletchling', ['Miltank', 'Starly', 'Hoothoot', 'Torchic']] },
    { name: 'Peacemaker', cls: 'Vigilante for Peace', spec: 'Normal', spec2: 'Flying', age: 36, g: 'm', team: ['Rufflet', ['Skarmory', 'Clauncher', 'Bronzor', 'Tandemaus']] },
    { name: 'Ghostface', cls: 'Woodsboro Killer', spec: 'Normal', spec2: 'Ghost', age: 30, g: 'm', team: ['Hisuian Zorua', ['Rotom', 'Phantump', 'Honedge', 'Zubat']] },
    { name: 'T-1000', cls: 'Liquid Metal Infiltrator', spec: 'Steel', spec2: 'Water', age: 30, g: 'm', team: ['Piplup', ['Ditto', 'Klink', 'Goomy', 'Tinkatink']] },
    { name: 'Conan', cls: 'Cimmerian Barbarian', spec: 'Fighting', spec2: 'Steel', age: 35, g: 'm', team: ['Sawk', ['Honedge', 'Pawniard', 'Tauros', 'Throh']] },
    { name: 'Shang Tsung', cls: 'Soul-Stealing Sorcerer', spec: 'Psychic', spec2: 'Ghost', age: 40, g: 'm', team: ['Abra', ['Spiritomb', 'Ditto', 'Zorua', 'Gastly']] },
  ] },
  wwe: { name: 'WWE Superstars', tag: 'WWE', desc: 'WWE Superstars from Raw, SmackDown and NXT, and every world champion of the last five years.', trainers: [
    { name: 'Roman Reigns', cls: 'Tribal Chief', spec: 'Dark', age: 41, g: 'm', team: ['Pawniard', ['Carvanha', 'Tyrunt', 'Wailmer', 'Poochyena']] },
    { name: 'Cody Rhodes', cls: 'American Nightmare', spec: 'Fighting', age: 41, g: 'm', team: ['Tyrogue', ['Rufflet', 'Growlithe', 'Litleo', 'Makuhita']] },
    { name: 'CM Punk', cls: 'Best in the World', spec: 'Electric', spec2: 'Poison', age: 47, g: 'm', team: ['Toxel', ['Scraggy', 'Croagunk', 'Murkrow', 'Grimer']] },
    { name: 'Gunther', cls: 'Ring General', spec: 'Fighting', age: 39, g: 'm', team: ['Makuhita', ['Throh', 'Cufant', 'Bergmite', 'Rhyhorn']] },
    { name: 'Sami Zayn', cls: 'Underdog from the Underground', spec: 'Normal', spec2: 'Fighting', age: 42, g: 'm', team: ['Stufful', ['Bidoof', 'Lillipup', 'Mankey', 'Rockruff']] },
    { name: 'Bron Breakker', cls: 'Steiner Powerhouse', spec: 'Electric', spec2: 'Fighting', age: 28, g: 'm', team: ['Yamper', ['Electrike', 'Pawmi', 'Tauros', 'Makuhita']] },
    { name: 'Penta', cls: 'Cero Miedo Luchador', spec: 'Fighting', spec2: 'Ghost', age: 41, g: 'm', team: ['Mankey', ['Hawlucha', 'Golett', 'Cubone', 'Sandygast']] },
    { name: 'Liv Morgan', cls: 'La Güerita', spec: 'Dark', spec2: 'Fairy', age: 32, g: 'f', team: ['Impidimp', ['Swirlix', 'Spritzee', 'Purrloin', 'Sneasel']] },
    { name: 'Iyo Sky', cls: 'Genius of the Sky', spec: 'Flying', age: 36, g: 'f', team: ['Swablu', ['Hoothoot', 'Pikipek', 'Natu', 'Wingull']] },
    { name: 'Tiffany Stratton', cls: 'Center of the Universe', spec: 'Fairy', age: 27, g: 'f', team: ['Ralts', ['Meowth', 'Swirlix', 'Flabébé', 'Snubbull']] },
    { name: 'Otis', cls: 'Human Caterpillar', spec: 'Normal', spec2: 'Bug', age: 34, g: 'm', team: ['Munchlax', ['Makuhita', 'Lechonk', 'Teddiursa', 'Wooper']] },
    { name: "Je'Von Evans", cls: 'Young OG', spec: 'Flying', spec2: 'Electric', age: 22, g: 'm', team: ['Wattrel', ['Taillow', 'Emolga', 'Pichu', 'Hawlucha']] },
    { name: 'Jey Uso', cls: 'Main Event', spec: 'Water', spec2: 'Fighting', age: 41, g: 'm', team: ['Wailmer', ['Buizel', 'Wingull', 'Clobbopus', 'Chewtle']] },
    { name: 'Trick Williams', cls: 'Whoop That', spec: 'Dark', age: 32, g: 'm', team: ['Zorua', ['Nickit', 'Poochyena', 'Scraggy', 'Mankey']] },
    { name: 'Oba Femi', cls: 'The Ruler', spec: 'Rock', age: 28, g: 'm', team: ['Nacli', ['Roggenrola', 'Rhyhorn', 'Tyrunt', 'Makuhita']] },
    { name: 'Jade Cargill', cls: 'Storm', spec: 'Electric', age: 34, g: 'f', team: ['Shinx', ['Wattrel', 'Blitzle', 'Tadbulb', 'Grubbin']] },
    { name: 'Rey Mysterio', cls: 'Master of the 619', spec: 'Fighting', spec2: 'Flying', age: 51, g: 'm', team: ['Hawlucha', ['Riolu', 'Pikipek', 'Taillow', 'Mime Jr.']] },
    { name: 'Sol Ruca', cls: 'Sol Snatcher', spec: 'Water', age: 27, g: 'f', team: ['Finizen', ['Wingull', 'Buizel', 'Corsola', 'Chewtle']] },
    { name: 'Brock Lesnar', cls: 'Beast Incarnate', spec: 'Fighting', spec2: 'Ground', age: 49, g: 'm', team: ['Mudbray', ['Machop', 'Tauros', 'Rhyhorn', 'Teddiursa']] },
    { name: 'Bobby Lashley', cls: 'The All Mighty', spec: 'Fighting', spec2: 'Steel', age: 50, g: 'm', team: ['Aron', ['Timburr', 'Cufant', 'Pancham', 'Makuhita']] },
    { name: 'John Cena', cls: 'Cenation Leader', spec: 'Fighting', spec2: 'Ghost', age: 49, g: 'm', team: ['Golett', ['Kecleon', 'Greavard', 'Tyrogue', 'Crabrawler']] },
    { name: 'Seth Rollins', cls: 'The Visionary', spec: 'Dark', spec2: 'Psychic', age: 40, g: 'm', team: ['Inkay', ['Zorua', 'Espurr', 'Abra', 'Sneasel']] },
    { name: 'Drew McIntyre', cls: 'Scottish Warrior', spec: 'Fighting', spec2: 'Dragon', age: 41, g: 'm', team: ['Jangmo-o', ['Honedge', 'Lapras', 'Druddigon', 'Sawk']] },
    { name: 'Damian Priest', cls: 'Archer of Infamy', spec: 'Ghost', spec2: 'Dark', age: 44, g: 'm', team: ['Rowlet', ['Sableye', 'Absol', 'Duskull', 'Poochyena']] },
    { name: 'Becky Lynch', cls: 'The Man', spec: 'Fire', spec2: 'Fighting', age: 39, g: 'f', team: ['Torchic', ['Vulpix', 'Darumaka', 'Riolu', 'Fletchling']] },
    { name: 'Charlotte Flair', cls: 'The Queen', spec: 'Fairy', spec2: 'Flying', age: 40, g: 'f', team: ['Hatenna', ['Spritzee', 'Rufflet', 'Cutiefly', 'Clefairy']] },
    { name: 'Ronda Rousey', cls: 'Rowdy', spec: 'Fighting', age: 39, g: 'f', team: ['Throh', ['Clobbopus', 'Mienfoo', 'Meditite', 'Tyrogue']] },
    { name: 'Bianca Belair', cls: 'The EST', spec: 'Fighting', spec2: 'Electric', age: 37, g: 'f', team: ['Pawmi', ['Blitzle', 'Riolu', 'Electrike', 'Tangela']] },
    { name: 'Asuka', cls: 'Empress of Tomorrow', spec: 'Poison', spec2: 'Fighting', age: 45, g: 'f', team: ['Koffing', ['Croagunk', 'Shroodle', 'Mankey', 'Venipede']] },
    { name: 'Bayley', cls: 'Role Model', spec: 'Normal', spec2: 'Fairy', age: 37, g: 'f', team: ['Stufful', ['Igglybuff', 'Fidough', 'Swirlix', 'Drifloon']] },
    { name: 'Nia Jax', cls: 'Irresistible Force', spec: 'Ground', spec2: 'Water', age: 42, g: 'f', team: ['Hippopotas', ['Wooper', 'Mudkip', 'Barboach', 'Wailmer']] },
    { name: 'Rhea Ripley', cls: 'The Eradicator', spec: 'Dark', spec2: 'Fighting', age: 30, g: 'f', team: ['Scraggy', ['Sneasel', 'Pancham', 'Murkrow', 'Kangaskhan']] },
    { name: 'Naomi', cls: 'The Glow', spec: 'Electric', spec2: 'Fairy', age: 38, g: 'f', team: ['Mareep', ['Chinchou', 'Morelull', 'Dedenne', 'Pichu']] },
    { name: 'Stephanie Vaquer', cls: 'La Primera', spec: 'Dark', spec2: 'Flying', age: 33, g: 'f', team: ['Vullaby', ['Murkrow', 'Impidimp', 'Hoothoot', 'Purrloin']] },
    { name: 'Chelsea Green', cls: 'Hot Mess', spec: 'Grass', spec2: 'Fairy', age: 35, g: 'f', team: ['Bounsweet', ['Cottonee', 'Fomantis', 'Hoppip', 'Smoliv']] },
    // v175: today's top names and all-time legends (the pack reaches 50)
    { name: 'Randy Orton', cls: 'The Viper', spec: 'Poison', spec2: 'Dark', age: 46, g: 'm', team: ['Seviper', ['Ekans', 'Sneasel', 'Purrloin', 'Skorupi']] },
    { name: 'AJ Styles', cls: 'Phenomenal', spec: 'Fighting', spec2: 'Flying', age: 49, g: 'm', team: ['Hawlucha', ['Tyrogue', 'Mienfoo', 'Pikipek', 'Riolu']] },
    { name: 'LA Knight', cls: 'The Megastar', spec: 'Normal', spec2: 'Electric', age: 43, g: 'm', team: ['Whismur', ['Electrike', 'Pichu', 'Bidoof', 'Shinx']] },
    { name: 'Logan Paul', cls: 'The Maverick', spec: 'Electric', spec2: 'Flying', age: 31, g: 'm', team: ['Rotom', ['Wattrel', 'Emolga', 'Smeargle', 'Hoothoot']] },
    { name: 'Kevin Owens', cls: 'The Prizefighter', spec: 'Fighting', spec2: 'Dark', age: 42, g: 'm', team: ['Pancham', ['Scraggy', 'Makuhita', 'Teddiursa', 'Croagunk']] },
    { name: 'Dominik Mysterio', cls: 'WWE Superstar', spec: 'Dark', spec2: 'Fighting', age: 29, g: 'm', team: ['Hawlucha', ['Zorua', 'Sneasel', 'Poochyena', 'Riolu']] },
    { name: 'Bronson Reed', cls: 'Auszilla', spec: 'Rock', spec2: 'Ground', age: 37, g: 'm', team: ['Larvitar', ['Wailmer', 'Rhyhorn', 'Phanpy', 'Roggenrola']] },
    { name: 'Chad Gable', cls: 'WWE Superstar', spec: 'Fighting', spec2: 'Normal', age: 40, g: 'm', team: ['Throh', ['Hawlucha', 'Clobbopus', 'Machop', 'Mankey']] },
    { name: 'Alexa Bliss', cls: 'The Goddess', spec: 'Fairy', spec2: 'Ghost', age: 35, g: 'f', team: ['Mimikyu', ['Shuppet', 'Sinistea', 'Togepi', 'Flabébé']] },
    { name: 'Raquel Rodriguez', cls: 'Big Mami Cool', spec: 'Ground', spec2: 'Dark', age: 35, g: 'f', team: ['Sandile', ['Trapinch', 'Mudbray', 'Nickit', 'Gligar']] },
    { name: 'The Undertaker', cls: 'Deadman', spec: 'Ghost', spec2: 'Dark', age: 61, g: 'm', team: ['Yamask', ['Litwick', 'Duskull', 'Murkrow', 'Gastly']] },
    { name: 'Steve Austin', cls: 'Stone Cold', spec: 'Rock', spec2: 'Normal', age: 61, g: 'm', team: ['Silicobra', ['Tauros', 'Geodude', 'Mankey', 'Sandshrew']] },
    { name: 'The Rock', cls: "People's Champion", spec: 'Rock', spec2: 'Normal', age: 54, g: 'm', team: ['Tauros', ['Rockruff', 'Bonsly', 'Rolycoly', 'Nosepass']] },
    { name: 'Triple H', cls: 'The Game', spec: 'Steel', spec2: 'Dark', age: 57, g: 'm', team: ['Tinkatink', ['Pawniard', 'Inkay', 'Bronzor', 'Houndour']] },
    { name: 'Shawn Michaels', cls: 'Heartbreak Kid', spec: 'Fighting', spec2: 'Fairy', age: 61, g: 'm', team: ['Tyrogue', ['Buneary', 'Luvdisc', 'Snubbull', 'Mienfoo']] },
  ] },
  nba: { name: 'NBA Superstars', tag: 'NBA', desc: "NBA stars past and present: recent MVPs and Finals MVPs, today's stars and all-time greats.", trainers: [
    { name: 'Shai Gilgeous-Alexander', cls: 'NBA Champion', spec: 'Electric', spec2: 'Dark', age: 28, g: 'm', team: ['Shinx', ['Zorua', 'Pawniard', 'Joltik', 'Elekid']] },
    { name: 'Nikola Jokić', cls: 'The Joker', spec: 'Psychic', spec2: 'Normal', age: 31, g: 'm', team: ['Galarian Ponyta', ['Munchlax', 'Abra', 'Slowpoke', 'Tauros']] },
    { name: 'Joel Embiid', cls: 'The Process', spec: 'Fighting', spec2: 'Ground', age: 32, g: 'm', team: ['Rhyhorn', ['Makuhita', 'Hippopotas', 'Timburr', 'Cubone']] },
    { name: 'Giannis Antetokounmpo', cls: 'Greek Freak', spec: 'Grass', spec2: 'Fighting', age: 31, g: 'm', team: ['Deerling', ['Skiddo', 'Chespin', 'Riolu', 'Tauros']] },
    { name: 'James Harden', cls: 'The Beard', spec: 'Dark', spec2: 'Fire', age: 37, g: 'm', team: ['Litleo', ['Houndour', 'Zorua', 'Purrloin', 'Sneasel']] },
    { name: 'Jalen Brunson', cls: 'Captain Clutch', spec: 'Fighting', spec2: 'Steel', age: 29, g: 'm', team: ['Riolu', ['Mankey', 'Meditite', 'Klink', 'Bronzor']] },
    { name: 'LeBron James', cls: 'King James', spec: 'Steel', spec2: 'Fighting', age: 41, g: 'm', team: ['Pawniard', ['Riolu', 'Tyrogue', 'Cufant', 'Litleo']] },
    { name: 'Kobe Bryant', cls: 'Black Mamba', spec: 'Poison', spec2: 'Dark', age: 41, g: 'm', team: ['Seviper', ['Ekans', 'Croagunk', 'Sneasel', 'Zubat']] },
    { name: "Shaquille O'Neal", cls: 'Big Diesel', spec: 'Steel', spec2: 'Normal', age: 54, g: 'm', team: ['Aron', ['Munchlax', 'Cufant', 'Wailmer', 'Rhyhorn']] },
    { name: 'Michael Jordan', cls: 'His Airness', spec: 'Flying', spec2: 'Fighting', age: 63, g: 'm', team: ['Hawlucha', ['Rufflet', 'Tauros', 'Riolu', 'Tyrogue']] },
    { name: 'Stephen Curry', cls: 'The Chef', spec: 'Water', spec2: 'Fairy', age: 38, g: 'm', team: ['Remoraid', ['Horsea', 'Popplio', 'Marill', 'Psyduck']] },
    { name: 'Magic Johnson', cls: 'Showtime', spec: 'Psychic', spec2: 'Fairy', age: 66, g: 'm', team: ['Ralts', ['Mime Jr.', 'Hatenna', 'Clefairy', 'Natu']] },
    { name: 'Jaylen Brown', cls: 'NBA Champion', spec: 'Psychic', spec2: 'Fighting', age: 29, g: 'm', team: ['Meditite', ['Ralts', 'Elgyem', 'Riolu', 'Natu']] },
    { name: 'Kawhi Leonard', cls: 'The Klaw', spec: 'Dark', spec2: 'Steel', age: 34, g: 'm', team: ['Sneasel', ['Scyther', 'Krabby', 'Purrloin', 'Skarmory']] },
    { name: 'Kevin Durant', cls: 'Slim Reaper', spec: 'Ghost', spec2: 'Dragon', age: 37, g: 'm', team: ['Dreepy', ['Duskull', 'Honedge', 'Phantump', 'Noibat']] },
    { name: 'Luka Dončić', cls: 'The Don', spec: 'Dragon', spec2: 'Psychic', age: 27, g: 'm', team: ['Dratini', ['Goomy', 'Swablu', 'Spoink', 'Sigilyph']] },
    { name: 'Victor Wembanyama', cls: 'The Alien', spec: 'Psychic', spec2: 'Steel', age: 22, g: 'm', team: ['Elgyem', ['Beldum', 'Staryu', 'Bronzor', 'Girafarig']] },
    { name: 'Anthony Edwards', cls: 'Ant-Man', spec: 'Bug', spec2: 'Fighting', age: 24, g: 'm', team: ['Durant', ['Heracross', 'Wimpod', 'Rockruff', 'Nincada']] },
    { name: 'Jayson Tatum', cls: 'NBA Champion', spec: 'Grass', spec2: 'Fighting', age: 28, g: 'm', team: ['Chespin', ['Grookey', 'Seedot', 'Mienfoo', 'Snivy']] },
    { name: 'Tim Duncan', cls: 'The Big Fundamental', spec: 'Water', spec2: 'Steel', age: 50, g: 'm', team: ['Piplup', ['Shellder', 'Bronzor', 'Squirtle', 'Nosepass']] },
    { name: 'Larry Bird', cls: 'Hick from French Lick', spec: 'Normal', spec2: 'Flying', age: 69, g: 'm', team: ['Starly', ['Pidgey', 'Doduo', 'Chatot', 'Pikipek']] },
    { name: 'Kareem Abdul-Jabbar', cls: 'Captain Hook', spec: 'Fighting', spec2: 'Rock', age: 79, g: 'm', team: ['Mienfoo', ['Kabuto', 'Onix', 'Tyrogue', 'Roggenrola']] },
    { name: 'Hakeem Olajuwon', cls: 'The Dream', spec: 'Psychic', spec2: 'Ground', age: 63, g: 'm', team: ['Munna', ['Baltoy', 'Spinda', 'Phanpy', 'Drilbur']] },
    { name: 'Dirk Nowitzki', cls: 'German Wunderkind', spec: 'Steel', spec2: 'Flying', age: 47, g: 'm', team: ['Flamigo', ['Rookidee', 'Skarmory', 'Ponyta', 'Magnemite']] },
    // v175: more of today's stars and all-time legends (the pack reaches 50)
    { name: 'Cade Cunningham', cls: 'All-NBA', spec: 'Steel', spec2: 'Fighting', age: 24, g: 'm', team: ['Varoom', ['Klink', 'Machop', 'Magnemite', 'Riolu']] },
    { name: 'Donovan Mitchell', cls: 'Spida', spec: 'Bug', spec2: 'Electric', age: 29, g: 'm', team: ['Joltik', ['Spinarak', 'Tarountula', 'Grubbin', 'Shinx']] },
    { name: 'Tyrese Maxey', cls: 'All-Star', spec: 'Electric', spec2: 'Normal', age: 25, g: 'm', team: ['Helioptile', ['Pachirisu', 'Emolga', 'Tynamo', 'Zigzagoon']] },
    { name: 'Karl-Anthony Towns', cls: 'NBA Champion', spec: 'Rock', spec2: 'Water', age: 30, g: 'm', team: ['Tirtouga', ['Binacle', 'Corsola', 'Omanyte', 'Relicanth']] },
    { name: 'Ja Morant', cls: 'All-Star', spec: 'Flying', spec2: 'Electric', age: 26, g: 'm', team: ['Wattrel', ['Hawlucha', 'Teddiursa', 'Rufflet', 'Taillow']] },
    { name: 'Devin Booker', cls: 'All-Star', spec: 'Fire', spec2: 'Ground', age: 29, g: 'm', team: ['Fletchling', ['Larvesta', 'Numel', 'Sandile', 'Trapinch']] },
    { name: 'Kyrie Irving', cls: 'Uncle Drew', spec: 'Fairy', spec2: 'Psychic', age: 34, g: 'm', team: ['Mime Jr.', ['Slowpoke', 'Snubbull', 'Hatenna', 'Wynaut']] },
    { name: 'Damian Lillard', cls: 'All-Star', spec: 'Dark', spec2: 'Flying', age: 35, g: 'm', team: ['Hoothoot', ['Noibat', 'Murkrow', 'Purrloin', 'Poochyena']] },
    { name: 'Anthony Davis', cls: 'The Brow', spec: 'Steel', spec2: 'Ground', age: 33, g: 'm', team: ['Drilbur', ['Onix', 'Shieldon', 'Mawile', 'Diglett']] },
    { name: 'Tyrese Haliburton', cls: 'All-Star', spec: 'Normal', spec2: 'Psychic', age: 26, g: 'm', team: ['Cyclizar', ['Drowzee', 'Lillipup', 'Indeedee', 'Chingling']] },
    { name: 'Chet Holmgren', cls: 'NBA Champion', spec: 'Electric', spec2: 'Ghost', age: 24, g: 'm', team: ['Rotom', ['Sinistea', 'Elekid', 'Litwick', 'Voltorb']] },
    { name: 'Cooper Flagg', cls: 'Rookie of the Year', spec: 'Ice', spec2: 'Normal', age: 19, g: 'm', team: ['Snorunt', ['Corphish', 'Cubchoo', 'Deerling', 'Skwovet']] },
    { name: 'Bill Russell', cls: 'Lord of the Rings', spec: 'Grass', spec2: 'Steel', age: 88, g: 'm', team: ['Ferroseed', ['Bulbasaur', 'Exeggcute', 'Klefki', 'Tropius']] },
    { name: 'Wilt Chamberlain', cls: 'The Big Dipper', spec: 'Normal', spec2: 'Fighting', age: 63, g: 'm', team: ['Munchlax', ['Tyrogue', 'Clefairy', 'Bouffalant', 'Komala']] },
    { name: 'Kevin Garnett', cls: 'The Big Ticket', spec: 'Dark', spec2: 'Grass', age: 50, g: 'm', team: ['Poochyena', ['Seedot', 'Sprigatito', 'Mankey', 'Pawniard']] },
    { name: 'Allen Iverson', cls: 'The Answer', spec: 'Dark', spec2: 'Electric', age: 50, g: 'm', team: ['Morpeko', ['Zorua', 'Electrike', 'Stunky', 'Pichu']] },
    { name: 'Dwyane Wade', cls: 'Flash', spec: 'Electric', spec2: 'Fire', age: 44, g: 'm', team: ['Charmander', ['Magby', 'Elekid', 'Eevee', 'Litleo']] },
    { name: 'Dennis Rodman', cls: 'The Worm', spec: 'Bug', spec2: 'Poison', age: 65, g: 'm', team: ['Wurmple', ['Scatterbug', 'Skorupi', 'Venonat', 'Ekans']] },
    { name: 'Scottie Pippen', cls: 'NBA Champion', spec: 'Normal', spec2: 'Steel', age: 60, g: 'm', team: ['Tauros', ['Lillipup', 'Magnemite', 'Galarian Meowth', 'Tinkatink']] },
    { name: 'Charles Barkley', cls: 'Round Mound of Rebound', spec: 'Ground', spec2: 'Normal', age: 63, g: 'm', team: ['Bunnelby', ['Swinub', 'Whismur', 'Sandshrew', 'Gligar']] },
    { name: 'Karl Malone', cls: 'The Mailman', spec: 'Ice', spec2: 'Flying', age: 62, g: 'm', team: ['Delibird', ['Pidove', 'Wingull', 'Snover', 'Spheal']] },
    { name: 'Chris Paul', cls: 'Point God', spec: 'Psychic', spec2: 'Normal', age: 41, g: 'm', team: ['Abra', ['Porygon', 'Smoochum', "Farfetch'd", 'Stantler']] },
    { name: 'Russell Westbrook', cls: 'Mr. Triple-Double', spec: 'Fighting', spec2: 'Electric', age: 37, g: 'm', team: ['Mankey', ['Shinx', 'Toxel', 'Croagunk', 'Electrike']] },
    { name: 'Steve Nash', cls: 'Captain Canada', spec: 'Water', spec2: 'Psychic', age: 52, g: 'm', team: ['Psyduck', ['Natu', 'Scorbunny', 'Seel', 'Chingling']] },
    { name: 'Julius Erving', cls: 'The Doctor', spec: 'Normal', spec2: 'Flying', age: 76, g: 'm', team: ['Audino', ['Happiny', 'Swablu', 'Hawlucha', 'Rufflet']] },
    { name: 'Isiah Thomas', cls: 'Bad Boy', spec: 'Dark', spec2: 'Fighting', age: 65, g: 'm', team: ['Pancham', ['Pawniard', 'Galarian Zigzagoon', 'Houndour', 'Croagunk']] },
  ] },
};
for (const [k, p] of Object.entries(FAMOUS_PACKS)) { FAMOUS_TAG_LABELS[k] = FAMOUS_TAG_PLURAL[k] = p.tag; for (const f of p.trainers) { f.pack = k; f.tags = [k]; FAMOUS.push(f); } }
Object.assign(FAMOUS_TRAITS, { 'Shai Gilgeous-Alexander': 'clutch', 'Nikola Jokić': 'steady', 'Joel Embiid': 'streaky', 'Giannis Antetokounmpo': 'grinder', 'James Harden': 'streaky', 'Jalen Brunson': 'clutch', 'LeBron James': 'lateBloomer', 'Kobe Bryant': 'clutch', "Shaquille O'Neal": 'hothead', 'Michael Jordan': 'competitor', 'Stephen Curry': 'streaky', 'Magic Johnson': 'mentor', Scorpion: 'hothead', 'Sub-Zero': 'steady', Raiden: 'mentor', 'Liu Kang': 'clutch', Baraka: 'competitor', 'Johnny Cage': 'streaky', 'Sonya Blade': 'competitor', Kano: 'hothead', Reptile: 'lateBloomer', Goro: 'grinder', 'Shang Tsung': 'collector', 'Kung Lao': 'steady', Kitana: 'clutch', Mileena: 'hothead', Jax: 'grinder', 'Shao Kahn': 'competitor', Kintaro: 'hothead', Jade: 'steady', Smoke: 'lateBloomer', 'Noob Saibot': 'streaky', Cyrax: 'steady', Sektor: 'competitor', Nightwolf: 'mentor', Sindel: 'clutch', Stryker: 'grinder', Kabal: 'streaky', Sheeva: 'grinder', Motaro: 'hothead', Rain: 'competitor', Ermac: 'steady', 'Quan Chi': 'clutch', Shinnok: 'competitor', Fujin: 'steady', Sareena: 'clutch', Kia: 'hothead', Jataaka: 'grinder', Reiko: 'hothead', Tanya: 'streaky', Jarek: 'grinder', Kai: 'steady', Meat: 'lateBloomer', Tremor: 'grinder', Ashrah: 'lateBloomer', Darrius: 'competitor', Hotaru: 'steady', Dairou: 'hothead', Havik: 'streaky', Kira: 'competitor', Kobra: 'hothead', Onaga: 'clutch', Shujinko: 'mentor', "Bo' Rai Cho": 'mentor', Drahmin: 'hothead', Frost: 'hothead', 'Hsu Hao': 'grinder', Kenshi: 'clutch', 'Li Mei': 'lateBloomer', Mavado: 'competitor', Nitara: 'streaky', Blaze: 'steady', Mokap: 'streaky', Moloch: 'grinder', Daegon: 'hothead', Taven: 'clutch', Skarlet: 'streaky', 'Cassie Cage': 'competitor', "D'Vorah": 'streaky', 'Erron Black': 'steady', 'Ferra/Torr': 'hothead', 'Jacqui Briggs': 'grinder', 'Kotal Kahn': 'clutch', 'Kung Jin': 'lateBloomer', Takeda: 'competitor', Leaf: 'collector', Ethan: 'competitor', Lyra: 'mentor', Kris: 'steady', Lucas: 'steady', Hilbert: 'clutch', Hilda: 'competitor', Nate: 'lateBloomer', Rosa: 'clutch', Elio: 'steady', Selene: 'collector', Victor: 'clutch', Gloria: 'competitor', Florian: 'lateBloomer', Juliana: 'streaky', Rei: 'collector', Akari: 'collector', Hugh: 'hothead', Shauna: 'streaky', Tierno: 'steady', Trevor: 'collector', Drew: 'competitor', Zoey: 'clutch', Ursula: 'hothead', Kenny: 'competitor', Mustard: 'mentor', Klara: 'hothead', Avery: 'hothead', Peony: 'grinder', Carmine: 'hothead', Briar: 'mentor', Lacey: 'streaky', Drayton: 'steady', Crispin: 'hothead', Amarys: 'clutch', Mela: 'hothead', Atticus: 'steady', Ortega: 'competitor', Eri: 'grinder', Giacomo: 'streaky', Michael: 'competitor', Jovi: 'lateBloomer', Krane: 'mentor', Duking: 'grinder', Gonzap: 'hothead', 'Miror B.': 'streaky', Lovrina: 'collector', Snattle: 'steady', Gorigan: 'grinder', Ardos: 'hothead', Eldes: 'steady', Greevil: 'clutch', Exol: 'competitor', Zook: 'hothead', 'Roman Reigns': 'clutch', 'Cody Rhodes': 'competitor', 'CM Punk': 'hothead', Gunther: 'steady', 'Sami Zayn': 'lateBloomer', 'Bron Breakker': 'hothead', Penta: 'streaky', 'Liv Morgan': 'streaky', 'Iyo Sky': 'clutch', 'Tiffany Stratton': 'competitor', Otis: 'streaky', "Je'Von Evans": 'lateBloomer', 'Jey Uso': 'competitor', 'Trick Williams': 'competitor', 'Oba Femi': 'steady', 'Jade Cargill': 'hothead', 'Rey Mysterio': 'mentor', 'Sol Ruca': 'clutch',
  'Jaylen Brown': 'competitor', 'Kawhi Leonard': 'clutch', 'Kevin Durant': 'steady', 'Luka Dončić': 'hothead', 'Victor Wembanyama': 'lateBloomer', 'Anthony Edwards': 'competitor', 'Jayson Tatum': 'steady',
  'Tim Duncan': 'steady', 'Larry Bird': 'clutch', 'Kareem Abdul-Jabbar': 'steady', 'Hakeem Olajuwon': 'clutch', 'Dirk Nowitzki': 'grinder',
  'Brock Lesnar': 'hothead', 'Bobby Lashley': 'competitor', 'John Cena': 'mentor', 'Seth Rollins': 'clutch', 'Drew McIntyre': 'hothead', 'Damian Priest': 'streaky',
  'Becky Lynch': 'competitor', 'Charlotte Flair': 'competitor', 'Ronda Rousey': 'hothead', 'Bianca Belair': 'competitor', Asuka: 'hothead', Bayley: 'mentor', 'Nia Jax': 'hothead',
  'Rhea Ripley': 'competitor', Naomi: 'streaky', 'Stephanie Vaquer': 'clutch', 'Chelsea Green': 'streaky',
  'Randy Orton': 'clutch', 'AJ Styles': 'lateBloomer', 'LA Knight': 'streaky', 'Logan Paul': 'streaky', 'Kevin Owens': 'hothead', 'Dominik Mysterio': 'streaky', 'Bronson Reed': 'hothead', 'Chad Gable': 'grinder', 'Alexa Bliss': 'streaky', 'Raquel Rodriguez': 'hothead', 'The Undertaker': 'steady', 'Steve Austin': 'hothead', 'The Rock': 'competitor', 'Triple H': 'mentor', 'Shawn Michaels': 'clutch', 'Cade Cunningham': 'competitor', 'Donovan Mitchell': 'streaky', 'Tyrese Maxey': 'steady', 'Karl-Anthony Towns': 'streaky', 'Ja Morant': 'hothead', 'Devin Booker': 'steady', 'Kyrie Irving': 'streaky', 'Damian Lillard': 'clutch', 'Anthony Davis': 'streaky', 'Tyrese Haliburton': 'clutch', 'Chet Holmgren': 'lateBloomer', 'Cooper Flagg': 'lateBloomer', 'Bill Russell': 'mentor', 'Wilt Chamberlain': 'competitor', 'Kevin Garnett': 'hothead', 'Allen Iverson': 'streaky', 'Dwyane Wade': 'clutch', 'Dennis Rodman': 'hothead', 'Scottie Pippen': 'steady', 'Charles Barkley': 'hothead', 'Karl Malone': 'steady', 'Chris Paul': 'mentor', 'Russell Westbrook': 'hothead', 'Steve Nash': 'mentor', 'Julius Erving': 'steady', 'Isiah Thomas': 'competitor',
  'Freddy Krueger': 'streaky', 'Kratos': 'hothead', 'Jason Voorhees': 'steady', 'Predator': 'competitor', 'Alien': 'hothead', 'Leatherface': 'streaky', 'T-800': 'steady', 'Spawn': 'clutch', 'RoboCop': 'grinder', 'Rambo': 'grinder', 'Omni-Man': 'competitor', 'Homelander': 'hothead', 'Peacemaker': 'streaky', 'Ghostface': 'streaky', 'T-1000': 'steady', 'Conan': 'grinder' });
const BASE_FAMOUS = FAMOUS.filter(f => !f.pack).length;
const packOn = k => !!(S && S.cfg && (S.cfg.packs || []).includes(k));
// v176: the game's own famous trainers can be switched off too (S.cfg.baseOff); older leagues keep them on
const famousOn = f => f.pack ? packOn(f.pack) : !(S && S.cfg && S.cfg.baseOff);
const FAMOUS_BY_NAME = Object.fromEntries(FAMOUS.map(f => [f.name, f]));
// v176: My trainer packs — famous trainers the player makes, grouped into packs they name. The library lives in this browser;
// a new league keeps its own copy of the packs switched on (S.customPacks), so later edits don't change it and it moves with the save.
const CUSTOM_KEY = 'pokemon-league-builder-custom-v1', CUSTOM_MAX = 200, CUSTOM_PACKS_MAX = 40;
const cleanPack = p => p && p.key && Array.isArray(p.trainers) ? { key: String(p.key), name: String(p.name || 'My pack').slice(0, 40), trainers: p.trainers.filter(f => f && f.name && Array.isArray(f.team)) } : null;
function loadCustomLib() {
  try {
    const v = JSON.parse(localStorage.getItem(CUSTOM_KEY) || 'null');
    if (v && Array.isArray(v.packs)) return v.packs.map(cleanPack).filter(Boolean);
  } catch (e) {}
  return [];
}
let customLib = typeof localStorage !== 'undefined' ? loadCustomLib() : [];
function saveCustomLib() { try { localStorage.setItem(CUSTOM_KEY, JSON.stringify({ packs: customLib })); return true; } catch (e) { return false; } }
let customFor; // the world whose packs FAMOUS holds right now (null = the library, on the setup screens)
function worldCustomPacks() {
  if (!S) return customLib;
  // a league started with the single-list version keeps its trainers as one pack
  if (!S.customPacks) { S.customPacks = S.customPack && S.customPack.length ? [{ key: 'custom', name: 'My Trainers', trainers: S.customPack }] : []; delete S.customPack; }
  return S.customPacks;
}
function useCustom(packs) {
  for (let i = FAMOUS.length - 1; i >= 0; i--) if (FAMOUS[i].custom) { if (FAMOUS_BY_NAME[FAMOUS[i].name] === FAMOUS[i]) delete FAMOUS_BY_NAME[FAMOUS[i].name]; FAMOUS.splice(i, 1); }
  for (const k of Object.keys(FAMOUS_PACKS)) if (FAMOUS_PACKS[k].custom) { delete FAMOUS_PACKS[k]; delete FAMOUS_TAG_LABELS[k]; delete FAMOUS_TAG_PLURAL[k]; }
  for (const p of packs || []) {
    if (!p || !p.key || FAMOUS_PACKS[p.key]) continue;
    const P = FAMOUS_PACKS[p.key] = { name: p.name, tag: p.name, desc: 'A pack you made.', trainers: [], custom: true };
    FAMOUS_TAG_LABELS[p.key] = FAMOUS_TAG_PLURAL[p.key] = p.name;
    for (const src of p.trainers || []) {
      // a custom trainer can share a built-in famous trainer's name (pulled from a built-in pack); if both are on, only one appears in a league
      if (!src || !src.name || FAMOUS.some(x => x.custom && x.name === src.name)) continue;
      const f = { ...src, team: src.team.map(x => Array.isArray(x) ? x.slice() : x), pack: p.key, tags: [p.key], custom: true };
      FAMOUS.push(f); P.trainers.push(f); if (!FAMOUS_BY_NAME[f.name]) FAMOUS_BY_NAME[f.name] = f;
    }
  }
}
function ensureCustom() { if (customFor !== undefined && customFor === S) return; customFor = S; useCustom(worldCustomPacks()); }
function setCustomLib(packs) { customLib = packs; const ok = saveCustomLib(); if (!S) { customFor = undefined; ensureCustom(); } return ok; }
const customPack = key => customLib.find(p => p.key === key) || null;
function newCustomKey() { let k; do k = 'c-' + Math.random().toString(36).slice(2, 8); while (customPack(k) || FAMOUS_PACKS[k]); return k; }
function checkPackName(raw, key = null) {
  const name = String(raw == null ? '' : raw).trim().replace(/\s+/g, ' ');
  if (!name) return { err: 'Give the pack a name.' };
  if (name.length > 40) return { err: 'Pack names can be up to 40 characters.' };
  const taken = Object.entries(FAMOUS_PACKS).some(([k, p]) => !p.custom && p.name.toLowerCase() === name.toLowerCase()) || customLib.some(p => p.key !== key && p.name.toLowerCase() === name.toLowerCase());
  if (taken) return { err: `There's already a pack called ${name}.` };
  if (!key && customLib.length >= CUSTOM_PACKS_MAX) return { err: `You can keep up to ${CUSTOM_PACKS_MAX} packs.` };
  return { name };
}
// Pokémon a custom trainer can carry: anything but legendaries, mythicals, Paradox Pokémon and Ultra Beasts
const customSpOk = sp => !!SP[sp] && !SP[sp].legend && !SP[sp].paradox && !SP[sp].ub && !isLegendLine(sp);
let CUSTOM_SPECIES = null, SP_LOWER = null;
function customSpecies() { if (!CUSTOM_SPECIES) { CUSTOM_SPECIES = Object.keys(SP).filter(customSpOk).sort(); SP_LOWER = Object.fromEntries(Object.keys(SP).map(n => [n.toLowerCase(), n])); } return CUSTOM_SPECIES; }
// ================= v185: MY POKÉDEX =================
// The player's own changes to the Pokédex: new types, base stats and abilities for any Pokémon, and new Pokémon of
// their own. Kept in this browser; a new league takes a copy when it's created (S.cfg.dex) and keeps it for good,
// so the save carries its Pokédex and nothing changes mid-league. The species tables are put back to the game's own
// and the league's changes laid over them whenever a league is created or loaded.
const DEX_KEY = 'pokemon-league-builder-dex-v1', DEX_MAX_NEW = 200, DEX_NAME_MAX = 24;
const DEX_STAT_LABEL = ['HP', 'Attack', 'Defense', 'Sp. Atk', 'Sp. Def', 'Speed'], DEX_STAT_SHORT = ['HP', 'Atk', 'Def', 'SpA', 'SpD', 'Spe'];
let dexLib = (() => {
  try { const v = JSON.parse(localStorage.getItem(DEX_KEY) || 'null'); if (v && typeof v === 'object') return { on: !!v.on, edits: v.edits && typeof v.edits === 'object' ? v.edits : {}, added: Array.isArray(v.added) ? v.added : [] }; } catch (e) {}
  return { on: false, edits: {}, added: [] };
})();
function saveDexLib() { try { localStorage.setItem(DEX_KEY, JSON.stringify(dexLib)); return true; } catch (e) { return false; } }
const dexCount = d => d ? Object.keys(d.edits || {}).length + (d.added || []).length : 0;
const dexHas = d => dexCount(d) > 0;
const dexCopy = d => dexHas(d) ? JSON.parse(JSON.stringify({ edits: d.edits || {}, added: d.added || [] })) : null;
// the game's own Pokédex, taken the first time it's needed (every species table is built by then)
let DEX_BASE = null, DEX_ADDED = [], DEX_LEGENDS = [], dexApplied = 'null';
// v185: your own legendary encounters need a total over this, and an unmarked Pokémon over it gets a warning
const DEX_LEGEND_BST = 650, DEX_LEGEND_CHANCE = 0.001; // per week, per custom legendary, in weeks 5–16
function dexSnapshot() {
  if (DEX_BASE) return;
  DEX_BASE = {};
  for (const [n, s] of Object.entries(SP)) DEX_BASE[n] = { types: s.types.slice(), bst: s.bst, evos: s.evos ? s.evos.map(e => ({ to: e.to, lvl: e.lvl })) : null, rare: s.rare, starter: s.starter,
    stats: BASE_STATS[n] ? BASE_STATS[n].slice() : null, ab: SPECIES_AB[n] ? Object.assign({}, SPECIES_AB[n]) : null };
}
// a species' six stats as the game uses them: its real spread scaled to the game's BST, rounded
function dexBaseStats(n) {
  dexSnapshot(); const b = DEX_BASE[n]; if (!b) return null;
  if (!b.stats) return Array(6).fill(Math.round(b.bst / 6));
  const sum = b.stats.reduce((a, x) => a + x, 0) || 1;
  return b.stats.map(x => Math.max(1, Math.round(x * b.bst / sum)));
}
// an evolution can only branch from an ordinary Pokémon (not a legendary, mythical, Paradox, Ultra Beast or baby legendary)
const dexParentOk = n => { const b = DEX_BASE && DEX_BASE[n], s = SP[n]; return !!s && !s.legend && !s.paradox && !s.baby && !s.ub && !s.glitch && !(b && BABY_LEGENDS.includes(LINE[n])); };
const dexEditable = n => { dexSnapshot(); return !!DEX_BASE[n] && n !== 'Missingno'; };
const dexInt = (x, a, b) => Number.isInteger(x) && x >= a && x <= b;
// the shape every saved entry must have before it's used
function dexEntryOk(e) {
  if (!e || !Array.isArray(e.types) || !e.types.length || e.types.length > 2 || !e.types.every(t => TYPES.includes(t)) || (e.types[1] && e.types[1] === e.types[0])) return false;
  if (!Array.isArray(e.stats) || e.stats.length !== 6 || !e.stats.every(x => dexInt(x, 1, 255))) return false;
  if (!Array.isArray(e.ab) || e.ab.length !== 3 || !e.ab.every(a => a === '' || a == null || typeof a === 'string')) return false;
  if (e.from != null && e.from !== '' && !dexInt(e.lvl, 2, 100)) return false;
  return true;
}
function applyDex(d) {
  dexSnapshot();
  const key = JSON.stringify(dexHas(d) ? { edits: d.edits || {}, added: d.added || [] } : null);
  if (key === dexApplied) return;
  dexApplied = key;
  // back to the game's own Pokédex
  for (const n of DEX_ADDED) { delete SP[n]; delete BASE_STATS[n]; delete SPECIES_AB[n]; }
  DEX_ADDED = []; DEX_LEGENDS = [];
  for (const [n, b] of Object.entries(DEX_BASE)) {
    const s = SP[n]; s.types = b.types.slice(); s.bst = b.bst; s.rare = b.rare; s.starter = b.starter; delete s.bs; delete s.dexMod;
    if (b.evos) { s.evos = b.evos.map(e => ({ to: e.to, lvl: e.lvl })); s.evo = s.evos[0]; } else { delete s.evos; delete s.evo; }
    if (b.stats) BASE_STATS[n] = b.stats.slice(); else delete BASE_STATS[n];
    if (b.ab) SPECIES_AB[n] = Object.assign({}, b.ab); else delete SPECIES_AB[n];
  }
  const abOf = e => ({ 0: e.ab[0] || null, 1: e.ab[1] || null, H: e.ab[2] || null });
  if (dexHas(d)) {
    for (const [n, e] of Object.entries(d.edits || {})) {
      if (!dexEditable(n) || !dexEntryOk(e)) continue;
      const s = SP[n]; s.types = e.types.slice(); BASE_STATS[n] = e.stats.slice(); s.bst = e.stats.reduce((a, x) => a + x, 0); SPECIES_AB[n] = abOf(e); s.dexMod = 'edited';
    }
    // new Pokémon, each added once whatever it evolves from is in
    const left = (d.added || []).filter(e => dexEntryOk(e) && typeof e.name === 'string' && e.name && !SP[e.name]);
    for (let moved = true; left.length && moved;) {
      moved = false;
      for (let i = 0; i < left.length; i++) {
        const e = left[i];
        if (e.from && !SP[e.from]) continue;
        if (e.from && !dexParentOk(e.from)) { left.splice(i--, 1); continue; }
        const bst = e.stats.reduce((a, x) => a + x, 0), legend = !!e.legend && !e.from && bst > DEX_LEGEND_BST;
        SP[e.name] = { name: e.name, types: e.types.slice(), bst, rare: !legend && !e.from && !!e.rare, starter: !legend && !e.from && !!e.starter, dexMod: 'new' };
        // a legendary of your own: like Missingno, a legendary in every rule but outside the game's own pools; it only comes as a rare encounter
        if (legend) { SP[e.name].legend = true; SP[e.name].dexLegend = true; DEX_LEGENDS.push(e.name); }
        // (0.31.0) a custom region's own Pokémon: e.reg names the region; e.home (a region index) keeps it there (locked)
        if (e.reg) SP[e.name].regionSp = e.reg;
        if (Number.isInteger(e.home)) SP[e.name].homeOnly = e.home;
        BASE_STATS[e.name] = e.stats.slice(); SPECIES_AB[e.name] = abOf(e); DEX_ADDED.push(e.name);
        if (e.from) { const p = SP[e.from]; p.evos = (p.evos || []).concat({ to: e.name, lvl: e.lvl }); p.evo = p.evos[0]; }
        left.splice(i--, 1); moved = true;
      }
    }
  }
  // rebuild the tables made from the species list
  EVOLVED.clear(); for (const s of Object.values(SP)) for (const e of s.evos || []) EVOLVED.add(e.to);
  BASES.length = 0; BASES.push(...Object.keys(SP).filter(n => !EVOLVED.has(n) && !SP[n].legend && !SP[n].paradox && !SP[n].baby));
  STARTERS.length = 0; STARTERS.push(...BASES.filter(n => SP[n].starter));
  for (const k of Object.keys(LINE)) delete LINE[k];
  for (const b of BASES) markLine(b, b);
  for (const n of LEGENDS.concat(PARADOX, ['Missingno'], DEX_LEGENDS)) LINE[n] = n;
  for (const b of BABY_LEGENDS) markLine(b, b);
  GREAT_LEGENDS.length = 0; GREAT_LEGENDS.push(...LEGENDS.filter(n => SP[n].bst >= 660));
  resetRegionCaches(); // (0.27.0)
  REWARD_LEGENDS.length = 0; REWARD_LEGENDS.push(...LEGENDS.filter(n => SP[n].bst < 660));
  CUSTOM_SPECIES = null;
}
// the Pokédex the screen in front of the player should be using
// (0.31.0) the region editor previews a region's own new Pokémon (dexPreview) while it is open
let dexPreview = null;
const dexWanted = () => S ? (S.cfg && S.cfg.dex) || null : dexPreview || (dexLib.on ? dexLib : null);
// abilities that work in battle (Missingno's Glitch is its own)
let DEX_ABILITIES = null;
const dexAbilities = () => DEX_ABILITIES || (DEX_ABILITIES = Object.keys(ABILITIES).filter(a => a !== 'Glitch').sort());
// check one entry from the editor: an edit of a game species (name = that species) or a new Pokémon.
// `was` is the name of the new Pokémon being changed, if any. Returns a list of problems.
function checkDexEntry(e, isNew, was, lib = dexLib) {
  dexSnapshot();
  const errs = [];
  if (isNew) {
    const n = String(e.name || '').trim();
    if (!n) errs.push('Give the new Pokémon a name.');
    else if (n.length > DEX_NAME_MAX) errs.push(`Names can be up to ${DEX_NAME_MAX} characters.`);
    else if (/[|/@<>"`\\]/.test(n)) errs.push('Names can\'t contain | / @ < > " ` or \\.');
    else if (/^mega /i.test(n)) errs.push('Names can\'t start with "Mega".');
    else {
      const low = n.toLowerCase();
      if (Object.keys(DEX_BASE).some(x => x.toLowerCase() === low) || Object.values(MEGA).flat().some(f => f.name.toLowerCase() === low)) errs.push(`${n} is already a Pokémon in the game.`);
      else if (lib.added.some(x => x.name.toLowerCase() === low && x.name !== was)) errs.push(`You already have a Pokémon called ${n}.`);
    }
  } else if (!dexEditable(e.name)) errs.push(`${e.name || 'That'} isn't a Pokémon you can change.`);
  if (!TYPES.includes(e.types[0])) errs.push('Choose its main type.');
  if (e.types[1] && e.types[1] === e.types[0]) errs.push("Its second type can't be the same as its main type.");
  e.stats.forEach((x, i) => { if (!dexInt(x, 1, 255)) errs.push(`${DEX_STAT_LABEL[i]} must be a whole number from 1 to 255.`); });
  if (!e.ab[0]) errs.push('Choose its first ability.');
  if (e.ab[1] && e.ab[1] === e.ab[0]) errs.push('Its second ability is the same as its first. Leave the second empty instead.');
  if (isNew && e.legend) {
    const bst = e.stats.reduce((a, x) => a + (Number.isFinite(x) ? x : 0), 0);
    if (e.from) errs.push("A legendary encounter can't evolve from another Pokémon. Clear \"Evolves from\" or untick Legendary encounter.");
    if (bst <= DEX_LEGEND_BST) errs.push(`Only Pokémon with a base stat total over ${DEX_LEGEND_BST} can be legendary encounters. This one's total is ${bst}.`);
    const kids = lib.added.filter(x => x.from && x.from === (was || String(e.name || '').trim())).map(x => x.name);
    if (kids.length) errs.push(`${kids.join(' and ')} ${kids.length === 1 ? 'evolves' : 'evolve'} from it, and nothing can evolve from a legendary. Change ${kids.length === 1 ? 'that' : 'those'} first.`);
  }
  if (isNew && e.from) {
    const name = String(e.name || '').trim(), own = lib.added.find(x => x.name === e.from && x.name !== was);
    if (e.from === name || e.from === was) errs.push("A Pokémon can't evolve from itself.");
    else if (own && own.legend) errs.push(`${e.from} is a legendary encounter, so nothing can evolve from it.`);
    else if (own) {
      // follow the chain back: it mustn't lead round to this Pokémon
      const seen = new Set(); let cur = own;
      while (cur && cur.from && !seen.has(cur.name)) { seen.add(cur.name); if (cur.from === name || cur.from === was) { errs.push(`${e.from} already evolves from ${name}, so ${name} can't evolve from it.`); break; } cur = lib.added.find(x => x.name === cur.from); }
    } else if (!DEX_BASE[e.from]) errs.push(`There's no Pokémon called ${e.from}. Pick one from the list.`);
    else { const s = SP[e.from]; if (s.legend || s.paradox || s.baby || s.ub || s.glitch || BABY_LEGENDS.includes(LINE[e.from])) errs.push(`${e.from} is a legendary, mythical, Paradox Pokémon or Ultra Beast, so nothing can evolve from it.`); }
    if (!dexInt(e.lvl, 2, 100)) errs.push('The evolution level must be a whole number from 2 to 100.');
  }
  if (isNew && !was && lib.added.length >= DEX_MAX_NEW) errs.push(`You can add up to ${DEX_MAX_NEW} new Pokémon.`);
  return errs;
}
// export and import as plain text
const dexExportText = () => JSON.stringify({ pokedex: 'pokemon-league-gm', v: 1, edits: dexLib.edits, added: dexLib.added });
function dexImport(txt) {
  let v; try { v = JSON.parse(String(txt || '').trim()); } catch (e) { return { err: "That isn't a Pokédex export. Paste the whole text from Export my Pokédex." }; }
  if (!v || typeof v !== 'object' || (!v.edits && !v.added)) return { err: "That isn't a Pokédex export. Paste the whole text from Export my Pokédex." };
  const lib = { on: dexLib.on, edits: Object.assign({}, dexLib.edits), added: dexLib.added.slice() };
  let ok = 0, bad = 0;
  for (const [n, e] of Object.entries(v.edits || {})) { const x = dexNorm(Object.assign({}, e, { name: n })); if (dexEntryOk(x) && !checkDexEntry(x, false, null, lib).length) { lib.edits[n] = dexStrip(x); ok++; } else bad++; }
  const mine = new Set();
  for (const e of Array.isArray(v.added) ? v.added : []) {
    const x = dexNorm(e);
    if (!dexEntryOk(x) || !x.name) { bad++; continue; }
    // an imported Pokémon replaces your own of the same name
    const at = lib.added.findIndex(a => a.name === x.name);
    if (at >= 0) lib.added[at] = x; else lib.added.push(x);
    mine.add(x.name);
  }
  // check them with every import in place (one can evolve from another); drop any that fail, until none do
  for (let changed = true; changed;) {
    changed = false;
    for (const x of lib.added.slice()) if (mine.has(x.name) && checkDexEntry(x, true, x.name, lib).length) { lib.added.splice(lib.added.indexOf(x), 1); mine.delete(x.name); bad++; changed = true; }
  }
  while (lib.added.length > DEX_MAX_NEW) { const x = lib.added.pop(); if (mine.has(x.name)) { mine.delete(x.name); bad++; } }
  ok += mine.size;
  return { lib, ok, bad };
}
// tidy an entry from the form or an import into its saved shape
function dexNorm(e) {
  e = e || {};
  const types = [e.types && e.types[0], e.types && e.types[1]].filter(Boolean).map(String);
  const stats = Array.isArray(e.stats) ? e.stats.map(x => Number(x)) : [];
  const ab = [0, 1, 2].map(i => (Array.isArray(e.ab) && e.ab[i] ? String(e.ab[i]) : ''));
  const out = { name: String(e.name || '').trim(), types, stats, ab };
  if (e.from) { out.from = String(e.from).trim(); out.lvl = Number(e.lvl); }
  if (e.legend) out.legend = true; else { if (e.rare) out.rare = true; if (e.starter) out.starter = true; }
  return out;
}
const dexStrip = e => ({ types: e.types, stats: e.stats, ab: e.ab });
// check a trainer from the editor; returns { errs, entry }. target = the pack it goes in; editing = { key, i } of the trainer it replaces
function checkCustom(d, target, editing = null) {
  customSpecies();
  const errs = [], s = v => String(v == null ? '' : v).trim().replace(/\s+/g, ' ');
  const name = s(d.name), cls = s(d.cls), age = Math.round(+d.age);
  const dupe = customLib.flatMap(p => p.trainers.map((f, i) => ({ p, f, i }))).find(x => !(editing && x.p.key === editing.key && x.i === editing.i) && x.f.name.toLowerCase() === name.toLowerCase());
  if (!name) errs.push('Give them a name.'); else if (name.length > 30) errs.push('Names can be up to 30 characters.');
  else if (dupe) errs.push(`You already have a trainer called ${dupe.f.name}${dupe.p.key !== target ? ` in ${dupe.p.name}` : ''}.`);
  else if (/ V\d+$/.test(name)) errs.push('Names can\'t end in V2, V3 and so on: those mark repeat rounds in all-famous leagues.');
  if (!cls) errs.push('Give them a title, like Gym Leader or Movie Star.'); else if (cls.length > 30) errs.push('Titles can be up to 30 characters.');
  if (!(age >= 8 && age <= 90)) errs.push('Age must be between 8 and 90.');
  const g = ['m', 'f', 'n'].includes(d.g) ? d.g : 'm';
  const spec = TYPES.includes(d.spec) ? d.spec : null, spec2 = spec && TYPES.includes(d.spec2) && d.spec2 !== spec ? d.spec2 : null;
  if (d.spec2 && !spec) errs.push('Pick a main type before a second type.');
  const trait = TRAITS[d.trait] ? d.trait : null;
  const lines = new Map();
  const parse = raw => {
    const out = [];
    for (const r of [].concat(raw || []).map(s).filter(Boolean)) {
      const sp = SP_LOWER[r.toLowerCase()];
      if (!sp) { errs.push(`${r} isn't a Pokémon in the game. Check the spelling, including regional forms like Alolan Vulpix.`); continue; }
      if (!customSpOk(sp)) { errs.push(`${sp} can't be on a starting team: legendaries, mythicals, Paradox Pokémon and Ultra Beasts only come through the game's own events.`); continue; }
      const ln = LINE[sp] || sp;
      if (lines.has(ln)) { errs.push(`${sp} is in the same evolution line as ${lines.get(ln)}. Each Pokémon must come from a different line.`); continue; }
      lines.set(ln, sp); out.push(sp);
    }
    return out;
  };
  const opts = raw => Array.isArray(raw) ? raw : String(raw == null ? '' : raw).split(/[\/,]/);
  const lead = parse(opts(d.lead)), second = parse(opts(d.second));
  if (!opts(d.lead).map(s).filter(Boolean).length) errs.push('Pick a lead Pokémon.');
  const tp = target == null ? null : customPack(target);
  if (target != null && !tp) errs.push('Pick a pack for this trainer.');
  else if (tp && !(editing && editing.key === target) && tp.trainers.length >= CUSTOM_MAX) errs.push(`A pack can hold up to ${CUSTOM_MAX} trainers.`);
  if (errs.length) return { errs, entry: null };
  return { errs, entry: { name, cls, spec, spec2, age, g, trait, team: [lead.length === 1 ? lead[0] : lead, ...(second.length ? [second.length === 1 ? second[0] : second] : [])] } };
}
// ---- pack export / import (v176) ----
// one trainer as it goes in a pack file; built-in trainers carry the trait the game gives them
const packEntry = f => ({ name: f.name, cls: f.cls, spec: f.spec || null, spec2: f.spec2 || null, age: f.age, g: f.g, trait: (f.custom ? f.trait : FAMOUS_TRAITS[f.name]) || null, team: f.team.map(x => Array.isArray(x) ? x.slice() : x) });
const BUILTIN_SOURCES = () => [['base', 'Pokémon famous trainers'], ...Object.entries(FAMOUS_PACKS).filter(([, p]) => !p.custom).map(([k, p]) => [k, p.name])];
function builtinSource(key) {
  const trainers = key === 'base' ? FAMOUS.filter(f => !f.pack) : FAMOUS_PACKS[key] && !FAMOUS_PACKS[key].custom ? FAMOUS_PACKS[key].trainers : null;
  return trainers ? { name: (BUILTIN_SOURCES().find(([k]) => k === key) || [, 'Pack'])[1], trainers: trainers.map(packEntry) } : null;
}
function packExportText(packs) { return JSON.stringify({ game: 'Pokémon League GM', kind: 'trainer-pack', v: 1, packs: packs.map(p => ({ name: p.name, trainers: p.trainers.map(packEntry) })) }, null, 1); }
const PACK_TEXT_ERR = "That isn't a trainer pack. Use the whole text from an export, or a file made with Export.";
// text copied through phones or chat apps often arrives with curly quotes and markdown escapes (\[ \]); those are tidied up
function tidyPackText(t) { return String(t || '').trim().replace(/^```[a-z]*\s*|```$/gi, '').replace(/[\u201C\u201D\u201E\u201F\u2033]/g, '"').replace(/[\u2018\u2019\u201A\u201B\u2032]/g, "'").replace(/\\([\[\]_*#])/g, '$1').replace(/\u00A0/g, ' ').trim(); }
function parsePackText(txt) {
  let v; try { v = JSON.parse(String(txt || '').trim()); } catch (e) { try { v = JSON.parse(tidyPackText(txt)); } catch (e2) { return { err: PACK_TEXT_ERR }; } }
  let packs = v && Array.isArray(v.packs) ? v.packs : v && Array.isArray(v.trainers) ? [v] : Array.isArray(v) ? [{ name: 'Imported trainers', trainers: v }] : null;
  if (!packs) return { err: PACK_TEXT_ERR };
  packs = packs.filter(p => p && Array.isArray(p.trainers)).map(p => ({ name: String(p.name || 'Imported trainers').trim().slice(0, 40) || 'Imported trainers', trainers: p.trainers.filter(f => f && typeof f === 'object').slice(0, 1000) }));
  if (!packs.some(p => p.trainers.length)) return { err: 'There are no trainers in that pack.' };
  return { packs };
}
// imported teams are tidied first: an option from the same evolution line as an earlier one is dropped (Hitmonlee or Hitmonchan)
function normImport(raw) {
  customSpecies();
  const s = v => String(v == null ? '' : v).trim(), lineOf = x => { const sp = SP_LOWER[x.toLowerCase()]; return sp ? LINE[sp] || sp : x.toLowerCase(); };
  const team = Array.isArray(raw.team) ? raw.team : [];
  const lead = [].concat(team[0] || []).map(s).filter(Boolean), seen = new Set(lead.map(lineOf)), second = [];
  for (const x of [].concat(team[1] || []).map(s).filter(Boolean)) { const ln = lineOf(x); if (seen.has(ln)) continue; seen.add(ln); second.push(x); }
  return { name: raw.name, cls: raw.cls, g: raw.g, age: raw.age, spec: raw.spec || '', spec2: raw.spec2 || '', trait: raw.trait || '', lead, second };
}
// check every trainer in an import; rows that can't come in say why
function prepImport(raws) {
  const seen = new Set();
  return raws.map(raw => {
    const r = checkCustom(normImport(raw || {}), null), errs = r.errs.slice(), nm = String((raw && raw.name) || '').trim().toLowerCase();
    if (!errs.length && seen.has(nm)) errs.push('Listed twice: only the first one is imported.');
    if (nm) seen.add(nm);
    return { raw, entry: errs.length ? null : r.entry, errs };
  });
}
// a pack name that's free, adding (2), (3)... when needed; list = the packs it must not clash with
function uniquePackName(name, list = customLib) {
  const base = String(name || 'Imported trainers').trim().replace(/\s+/g, ' ').slice(0, 34) || 'Imported trainers';
  const free = n => !list.some(p => p.name.toLowerCase() === n.toLowerCase()) && !Object.values(FAMOUS_PACKS).some(p => !p.custom && p.name.toLowerCase() === n.toLowerCase());
  if (free(base)) return base;
  for (let i = 2; i < 100; i++) if (free(`${base} (${i})`)) return `${base} (${i})`;
  return base + ' ' + Date.now().toString(36);
}
function famousTags(t) { return t && t.famous ? (t.famTags || (FAMOUS_BY_NAME[famBase(t)] || {}).tags || []) : []; }
const FAMOUS_NEWCOMER_CHANCE = 0.06; // per newcomer
const FAMOUS_POST_CHANCE = 0.2;   // per outsider appointed to a gym or an Elite Four seat later on
function famousAvailable(filter) { ensureCustom(); S.famousUsed = S.famousUsed || []; return FAMOUS.filter(f => famousOn(f) && !S.famousUsed.includes(f.name) && famousNameFree(f) && filter(f)); }
function makeFamous(f, role, quality, lvl) {
  const t = newTrainer({ age: f.age, quality, role, specialty: f.spec });
  t.name = f.name; t.cls = f.cls; t.gender = f.g; t.famous = true; t.famTags = f.tags.slice(); t.spec2 = f.spec2 || null; t.trait = (f.custom ? TRAITS[f.trait] && f.trait : FAMOUS_TRAITS[f.name]) || t.trait;
  t.pot = clamp(Math.max(t.pot, ovr(t) + (f.age <= 18 ? ri(14, 24) : ri(2, 8))), ovr(t), 99);
  t.team = signaturePicks(f.team).map((sp, i) => stamp(makeMon(sp, lvl - i * 2, f.spec), 'starter'));
  S.famousUsed.push(f.name);
  return t;
}

// a legendary is one per League: if a newcomer brings one that's already held there, it returns to the wild
function settleLegendClash(t) {
  const legs = t.team.filter(m => SP[m.sp].legend); if (!legs.length) return;
  inLeague(lgOf(t), () => {
    const others = new Set(); for (const x of leagueTrainers()) if (x !== t && !['retired', 'prospect', 'free'].includes(x.role)) for (const m of x.team) if (SP[m.sp].legend) others.add(m.sp);
    for (const m of legs) if (others.has(m.sp) && t.team.length > 1) { farewell(t, m, `could not follow them into the ${S.lgName}`); t.team = t.team.filter(x => x !== m); news(`${dn(t)}'s ${m.sp} could not follow them into the ${S.lgName}, where one is already held. It returned to the wild.`, 'move', t.id); }
  });
}
// ================= NEWCOMERS =================
// There is no draft: challengers travel on their own. New trainers set out one at a time through the year (see
// arrivals in 4-engine-2.js), and they and anyone without a place join the emptiest circuit. A circuit has no cap
// (0.4.0): the field is kept in check by weak challengers giving up (see endRun), not by a number of places.
const NEWCOMERS_PER_LEAGUE = 8; // new trainers setting out each year, per League, one at a time (see arrivals)
function makeNewcomers(n) {
  const cls = [];
  // legacy trainers whose time has come take the first places in the class (at most two a year)
  const due = (S.legacyQueue || []).filter(q => q.at <= S.season).slice(0, 2);
  for (const q of due) { S.legacyQueue = S.legacyQueue.filter(x => x !== q); const t = makeLegacy(q); if (t) { cls.push(t.id); n--; } }
  for (let i = 0; i < n; i++) {
    const r = rand();
    const age = r < 0.6 ? ri(10, 17) : r < 0.85 ? ri(18, 27) : ri(28, 40);
    // older newcomers arrive more developed; a few late bloomers are genuinely good
    const q = ri(28, 52) + Math.min(14, Math.max(0, age - 14)) * 0.8 + (rand() < 0.15 ? ri(6, 14) : 0);
    const ctrs = metaCounters();
    const spec = featOn('meta') && ctrs.length && rand() < 0.3 ? pick(ctrs) : null;
    const fam = !(S.cfg && S.cfg.allFamous) && rand() < FAMOUS_NEWCOMER_CHANCE ? famousAvailable(f => f.age <= 40 || f.tags.includes('prof')) : [];
    if (fam.length) {
      const f = pick(fam);
      const t = makeFamous(f, 'prospect', ri(50, 60) + Math.min(14, Math.max(0, f.age - 14)) * 0.8, 9);
      news(`${dn(t)} is setting out as a challenger.`, 'circuit', t.id);
      cls.push(t.id);
      continue;
    }
    const t = newTrainer({ age, quality: q, role: 'prospect', specialty: spec || undefined });
    starterTeam(t, 9);
    cls.push(t.id);
  }
  return cls;
}
// how a challenger rates for a place on a circuit: current skill, upside for the young, a discount for age
function circuitValue(t) {
  const young = t.age <= 22 ? t.pot * 0.35 : ovr(t) * 0.35;
  return ovr(t) * 0.65 + young - Math.max(0, t.age - 35) * 0.8;
}
// put a trainer on League i's circuit
function joinCircuit(t, i) {
  t.role = 'challenger'; t.lg = i;
  S.freeAgents = S.freeAgents.filter(x => x !== t.id);
  inLeague(i, () => { if (!S.challengers.includes(t.id)) S.challengers.push(t.id); });
  if (nLeagues() > 1) settleLegendClash(t);
}
// new trainers and free agents join a circuit, the emptiest first. A circuit has no cap (0.4.0). `stagger` spreads
// a founding field's setting out over that many weeks; anyone else sets out within a few weeks.
function fillCircuits(ids, stagger) {
  const pool = ids.map(T).filter(t => t && ['prospect', 'free'].includes(t.role)).sort((a, b) => circuitValue(b) - circuitValue(a));
  for (const t of pool) {
    const room = eachLeague(i => ({ i, n: S.challengers.length })).sort((a, b) => a.n - b.n)[0];
    joinCircuit(t, room.i);
    t.rest = S.turn + (stagger != null ? ri(0, stagger) : ri(1, 3)); t.early = 0;
  }
  S.freeAgents = S.freeAgents.filter(id => T(id) && T(id).role === 'free');
}
// ---------- simming ----------
// play to the next New Year (the wall report for the year just ended is the last entry of S.history)
function simYear() {
  const y = S.season; let guard = 0;
  while (S.season === y && guard++ < YEAR_WEEKS + 2) simWeek();
  return S.history[S.history.length - 1];
}
// play up to n weeks; with `stops`, pause as soon as something needs the player (see stopFor). Returns why it
// stopped, or null.
function simWeeks(n, stops) {
  for (let i = 0; i < n; i++) { simWeek(); if (stops && S.stop) return S.stop; if (S.founding) return S.stop || { why: 'money', text: 'Your League folded.' }; }
  return null;
}
// legendaries held anywhere in the world (0.20.0: one of each; was this League). A baby legendary (Cosmog, Type: Null, Kubfu…) counts as every legendary it can grow into,
// so nobody is handed a Solgaleo while a Cosmog that could become one is out there
// (0.31.0) a legendary at home in several regions of the world can be held once for each (`legendCap`): the set is those
// whose places are all taken, and `legendHeld(sp)` counts the holders
function legendCounts() {
  const c = {};
  for (const t of Object.values(S.trainers)) if (!['retired', 'prospect'].includes(t.role)) for (const m of t.team) {
    if (SP[m.sp].legend) c[m.sp] = (c[m.sp] || 0) + 1;
    if (SP[m.sp].baby) { const q = [m.sp], seen = new Set(); while (q.length) { const n = q.shift(); for (const e of SP[n].evos || []) { if (seen.has(e.to)) continue; seen.add(e.to); if (SP[e.to].legend) c[e.to] = (c[e.to] || 0) + 1; q.push(e.to); } } }
  }
  return c;
}
const legendHeld = sp => legendCounts()[sp] || 0;
function ownedLegends() {
  const c = legendCounts();
  return new Set(Object.keys(c).filter(sp => c[sp] >= legendCap(sp)));
}
// ================= LEAGUE BANLIST (v194) =================
// Each offseason the trainers of a League (challengers, Gym Leaders, the Elite Four and the Champion) vote on banning
// its top performers of the season just played. The ballot is five of the League's best by knockouts and wins per
// battle (at most two legendaries). Each ban's length (1 to BAN_MAX_SEASONS seasons) is voted on with the ban; a ban
// passes for the longest length backed by more than half the voters, runs its full length, then lifts.
// A ban covers the species, what it evolves from and what it evolves into, so banning Sylveon bans Eevee too, but not
// Vaporeon. Banned Pokémon leave everyone in that League: challengers let theirs go, and Gym Leaders, the Elite Four
// and the Champion get a replacement that fits their type and the season's meta.
// (In the League Builder design the player will set the banlist as a paid League rule; this vote is what the source did.)
const BAN_POOL = 20, BAN_BALLOT = 5, BAN_MAX_NEW = BAN_BALLOT, BAN_MAX_SEASONS = 3, BAN_CAP = BAN_MAX_NEW * BAN_MAX_SEASONS, BAN_MIN_B = 8, BAN_BALLOT_LEGENDS = 2;
let PREV_EVO = null, PREV_N = 0;
function prevEvo(sp) {
  const n = Object.keys(SP).length;
  if (!PREV_EVO || PREV_N !== n) { PREV_EVO = {}; PREV_N = n; for (const k of Object.keys(SP)) for (const e of SP[k].evos || []) if (!PREV_EVO[e.to]) PREV_EVO[e.to] = k; }
  return PREV_EVO[sp] || null;
}
function banMembers(sp) {
  const out = new Set([sp]);
  for (let p = prevEvo(sp), g = 0; p && g < 6; p = prevEvo(p), g++) out.add(p);
  const q = [sp]; while (q.length) { const n = q.shift(); for (const e of (SP[n] && SP[n].evos) || []) if (!out.has(e.to)) { out.add(e.to); q.push(e.to); } }
  return [...out];
}
function lgState(i) { return i == null || i === (S.lg || 0) ? S : (S.leagues && S.leagues[i]) || null; }
function bansIn(i) { const L = lgState(i); return (L && L.bans) || []; }
function banOf(sp, i) { return bansIn(i).find(b => b.members.includes(sp)) || null; }
function bannedIn(sp, i) { return !!(S && featOn('banlist') && sp && banOf(sp, i)); }
// the season's best performers in the bound League (built in the offseason before anyone moves or retires)
function buildBanBallot() {
  S.banBallot = null;
  if (!featOn('banlist')) return;
  const agg = {};
  for (const t of leagueTrainers()) {
    if (['retired', 'prospect', 'free'].includes(t.role)) continue;
    for (const m of t.team) {
      const ss = m.ss; if (!ss || ss.season !== S.season || !SP[m.sp]) continue;
      const a = agg[m.sp] = agg[m.sp] || { sp: m.sp, b: 0, ko: 0, w: 0, users: new Set() };
      a.b += ss.b || 0; a.ko += ss.ko || 0; a.w += ss.w || 0; a.users.add(t.id);
    }
  }
  const score = a => a.ko / a.b + 0.5 * a.w / a.b + Math.log2(1 + a.users.size) * 0.15;
  const list = Object.values(agg).filter(a => a.b >= BAN_MIN_B && !banOf(a.sp, S.lg || 0)).sort((x, y) => score(y) - score(x));
  // v195: the ballot is any five of the season's top BAN_POOL performers, so it varies from year to year.
  // The pool keeps one entry per evolutionary family; the draw keeps the two-legendary limit
  const pool = [], used = new Set();
  for (const a of list) {
    if (pool.length >= BAN_POOL) break;
    const mem = banMembers(a.sp); if (mem.some(x => used.has(x))) continue;
    mem.forEach(x => used.add(x));
    pool.push({ sp: a.sp, members: mem, b: a.b, ko: a.ko, w: a.w, users: a.users.size, score: Math.round(score(a) * 100) / 100, leg: isLegendLine(a.sp) || !!SP[a.sp].legend, top: pool.length + 1 });
  }
  const cands = []; let legs = 0;
  for (const c of shuffle(pool)) {
    if (cands.length >= BAN_BALLOT) break;
    if (c.leg && legs >= BAN_BALLOT_LEGENDS) continue;
    if (c.leg) legs++;
    cands.push(c);
  }
  cands.sort((x, y) => x.top - y.top);
  S.banBallot = { season: S.season, cands };
}
// the League's trainers who vote: everyone holding a challenger's spot or a League post there
const banTrainers = i => inLeague(i, () => leagueTrainers().filter(t => ['challenger', 'leader', 'e4', 'champion'].includes(t.role) && t.team.length));
// how hard this season's battles went against trainer t from a candidate's family: knockouts taken, losses it took part in
function banHurt(t, mem) {
  const h = t.hurt && t.hurt.season === S.season ? t.hurt.by : null; let ko = 0, loss = 0;
  if (h) for (const sp of mem) if (h[sp]) { ko += h[sp][0]; loss += h[sp][1]; }
  return { ko, loss };
}
// trainers vote with their grudges. A trainer never votes to ban something on their own team and goes easy on
// their own type; they push for a ban when it beat them this season, when it hits their specialty or much of their
// team super effectively, or when their rival uses it. The angrier, the longer
function trainerBanVote(t, c, rank) {
  if (t.team.some(m => c.members.includes(m.sp))) return { v: 0, why: 'uses' };
  const tys = SP[c.sp].types, spec = specTypes(t);
  let p = 0.3 + 0.05 * (BAN_BALLOT - 1 - rank), heat = 0, why = null;
  const { ko, loss } = banHurt(t, c.members);
  if (ko) { p += Math.min(0.3, 0.09 * ko); heat++; why = 'lost'; }
  if (loss) { p += Math.min(0.35, 0.18 * loss); heat += loss >= 2 ? 2 : 1; why = 'lost'; }
  const team = t.team.filter(m => SP[m.sp]);
  const weak = team.filter(m => tys.some(a => SP[m.sp].types.reduce((x, d) => x * effOne(a, d), 1) >= 2)).length / Math.max(1, team.length);
  const specHit = spec.some(d => tys.some(a => effOne(a, d) >= 2));
  if (specHit || weak >= 0.5) { heat++; why = why || 'weak'; }
  p += (specHit ? 0.2 : 0) + 0.25 * weak;
  const riv = t.rival != null ? T(t.rival) : null;
  if (riv && riv.team.some(m => c.members.includes(m.sp))) { p += 0.18; heat++; why = why || 'rival'; }
  if (spec.some(ty => tys.includes(ty))) p -= 0.25;
  if (c.leg) p += 0.1;
  if (rand() >= Math.min(0.95, Math.max(0.02, p))) return { v: 0, why: null };
  const q = Math.min(0.85, 0.45 + 0.12 * heat + (c.leg ? 0.1 : 0));
  let len = 1; while (len < BAN_MAX_SEASONS && rand() < q) len++;
  return { v: len, why: why || 'top' };
}
// a ban of length L passes when more than half the voters back a ban at least that long
function banShare(votes, L = 1) { return votes.length ? votes.filter(v => v >= L).length / votes.length : 0; }
function banLength(votes) { let len = 0; for (let L = 1; L <= BAN_MAX_SEASONS; L++) if (banShare(votes, L) > 0.5) len = L; return len; }
// the vote on one ballot entry
function trainerBanVotes(i, c, rank) {
  const out = { votes: [], why: { lost: 0, weak: 0, rival: 0, top: 0, uses: 0 }, loud: null };
  for (const t of banTrainers(i)) {
    const r = trainerBanVote(t, c, rank); out.votes.push(r.v); if (r.why) out.why[r.why]++;
    if (r.v) { const h = banHurt(t, c.members), sc = h.loss * 3 + h.ko; if (sc >= 3 && (!out.loud || sc > out.loud.sc)) out.loud = { id: t.id, ko: h.ko, loss: h.loss, sc }; }
  }
  return out;
}
// v201: seasons a ban covers (older saves' bans, made before lengths were voted on, run the full three)
const banLen = b => b.len || BAN_MAX_SEASONS;
const banLeft = b => Math.max(0, b.season + banLen(b) - S.season);
// lift every ban in League i whose time is up (each offseason, whether or not there's a vote there)
function expireBans(i, changes) {
  const L = lgState(i); if (!L || !(L.bans || []).length) return;
  inLeague(i, () => {
    const pre = nLeagues() > 1 ? `${lgShort(i)}: ` : '';
    S.banLog = S.banLog || [];
    for (const b of S.bans.filter(z => banLeft(z) <= 0)) {
      const age = S.season - b.season;
      S.bans = S.bans.filter(z => z !== b);
      S.banLog.unshift({ season: S.season, sp: b.sp, act: 'lift', n: b.n, limit: true, len: banLen(b) });
      changes.push(`${pre}The ban on ${b.sp} is lifted after ${age} year${age === 1 ? '' : 's'}.`);
      news(`The ${S.lgName}'s ban on ${b.sp} is over. It can battle there again in Year ${S.season + 1}.`, 'league');
    }
  });
}
// the offseason's ban vote, League by League
function settleBanVote() {
  S.banResults = null;
  if (!featOn('banlist')) return;
  const changes = S.changes = S.changes || [];
  for (let i = 0; i < nLeagues(); i++) expireBans(i, changes);
  const out = [];
  for (let i = 0; i < nLeagues(); i++) {
    const L = lgState(i); if (!L) continue;
    const cands = L.banBallot && L.banBallot.season === S.season ? L.banBallot.cands : [];
    if (cands.length) out.push(inLeague(i, () => resolveBanVote(i, cands, changes)));
  }
  if (out.length) S.banResults = { season: S.season, lgs: out };
}
// v195: how many times each Pokémon has been banned in the bound League. Kept apart from the ban log so the
// Records board survives the log's trim; older saves rebuild it from the log the first time it's needed
const BAN_LOG_MAX = 600;
function banCounts() {
  if (!S.banCount) { S.banCount = {}; for (const e of S.banLog || []) if (e.act === 'ban') S.banCount[e.sp] = (S.banCount[e.sp] || 0) + 1; }
  return S.banCount;
}
function resolveBanVote(i, cands, changes) {
  const pre = nLeagues() > 1 ? `${lgShort(i)}: ` : '';
  const res = { lg: i, rows: [] };
  S.bans = S.bans || []; S.banLog = S.banLog || [];
  const passed = [];
  cands.forEach((c, rank) => {
    const tr = trainerBanVotes(i, c, rank), tv = tr.votes;
    const len = banLength(tv), pct = Math.round(banShare(tv) * 100), ty = tv.filter(v => v).length;
    const row = { sp: c.sp, ty, tn: tv.length, pct, passed: false, leg: c.leg, len, loud: tr.loud };
    res.rows.push(row);
    if (len) passed.push({ row, c });
  });
  passed.sort((a, b) => b.row.pct - a.row.pct || b.c.score - a.c.score);
  let room = Math.min(BAN_MAX_NEW, BAN_CAP - S.bans.length);
  for (const { row, c } of passed) {
    if (room <= 0) { row.capped = true; continue; }
    room--; row.passed = true;
    const len = row.len, thru = S.season + len, span = len === 1 ? `Year ${thru}` : `Years ${S.season + 1}–${thru}`;
    S.bans.push({ sp: c.sp, members: c.members, season: S.season, ty: row.ty, tn: row.tn, pct: row.pct, len });
    const bc = banCounts(); bc[c.sp] = (bc[c.sp] || 0) + 1;
    S.banLog.unshift({ season: S.season, sp: c.sp, act: 'ban', ty: row.ty, tn: row.tn, pct: row.pct, len });
    const tally = `${row.ty} of ${row.tn} trainers voting for it`;
    changes.push(`${pre}${c.sp} is banned for ${len === 1 ? span : `${len} years (${span})`} (${tally}).`);
    const lt = row.loud && T(row.loud.id);
    const loud = lt ? ` ${dn(lt)}, ${row.loud.loss ? `beaten by it ${row.loud.loss === 1 ? 'once' : `${row.loud.loss} times`}` : `who lost ${row.loud.ko} Pokémon to it`} this season, led the push.` : '';
    news(`The ${S.lgName} banned ${c.sp}${c.members.length > 1 ? ` (and ${c.members.filter(s => s !== c.sp).join(', ')})` : ''} for ${len === 1 ? span : `${len} seasons, ${span}`}, with ${tally}.${loud}`, 'league', lt ? lt.id : undefined);
  }
  if (S.banLog.length > BAN_LOG_MAX) S.banLog.length = BAN_LOG_MAX;
  enforceBans();
  return res;
}
// clear every banned Pokémon out of the bound League (after the vote, and again as each season starts)
function enforceBans() {
  if (!featOn('banlist') || !(S.bans || []).length) return;
  const i = S.lg || 0;
  for (const t of leagueTrainers()) {
    if (['retired', 'prospect', 'free'].includes(t.role)) continue;
    const bench = (t.bench || []).filter(m => banOf(m.sp, i));
    if (bench.length) { t.bench = t.bench.filter(m => !bench.includes(m)); for (const m of bench) farewell(t, m, `banned in the ${S.lgName}`); }
    const out = t.team.filter(m => banOf(m.sp, i));
    if (!out.length) continue;
    const top = Math.max(...t.team.map(m => m.lvl));
    for (const m of out) pullBanned(t, m);
    if (STAFF_ROLES.includes(t.role)) banReplace(t, out);
    else if (!t.team.length) {
      const o = wildOffers(t)[0];
      if (o) { const nm = stamp(makeMon(o.sp, Math.max(5, Math.floor(top) - 2)), 'caught'); t.team.push(nm); news(`With all of their Pokémon banned in the ${S.lgName}, ${dn(t)} caught ${nm.sp} to keep going.`, 'move', t.id); }
    }
  }
}
function pullBanned(t, m) {
  if (m.item) { bagAdd(t, m.item); m.item = null; }
  if (t.mega && t.mega.uid === m.uid) t.mega.uid = null;
  farewell(t, m, `banned in the ${S.lgName}`);
  t.team = t.team.filter(x => x !== m);
  if (t.role === 'challenger') news(`${m.sp} is banned in the ${S.lgName}, so ${dn(t)} let it go.`, 'move', t.id);
}
// a Gym Leader, Elite Four member or Champion who lost Pokémon to a ban gets a replacement of their type (any type for a
// Champion with no specialty), close in strength to the one it replaces; since 0.12.0 it favours types that hit the
// meta only when the post is steered to counter it
function banReplace(t, outs) {
  const slot = eliteSlot(t); if (!slot) return;
  const i = S.lg || 0, st = steerOf(t), counters = isCounter(st) ? metaTypes(st) : [], ins = [];
  for (const gone of outs) {
    if (t.team.length >= slot.size) break;
    const lines = new Set(t.team.map(m => LINE[m.sp]));
    const pool = staffPicks(t, slot.lvl, 10, { lines, mixed: t.role === 'champion' || !t.specialty, noOff: t.team.some(m => m.offType) }).filter(m => !banOf(m.sp, i));
    const target = SP[gone.sp].bst;
    const sc = m => (onSpec(t, m.sp) ? 300 : 0) - Math.abs(SP[m.sp].bst - target) / 2 + (SP[m.sp].types.some(ty => counters.includes(ty)) ? 60 : 0) + rand() * 20;
    const best = pool.sort((a, b) => sc(b) - sc(a))[0];
    if (!best) continue;
    stamp(best, 'assigned'); t.team.push(best); ins.push(`${best.sp} for ${gone.sp}`);
  }
  relevelElite(t);
  if (ins.length) news(`With ${outs.map(m => m.sp).join(' and ')} banned in the ${S.lgName}, the League gave ${dn(t)} ${ins.join(', ')}.`, 'move', t.id);
}
// Before each season every challenger registers at most three Pokémon: they keep their strongest.
function bestThree(t) { const v = m => (isSpecial(m) ? 10000 : 0) + SP[m.top && SP[m.top] ? m.top : m.sp].bst * (1 + (onSpec(t, m.top && SP[m.top] ? m.top : m.sp) ? 0.1 : 0)); return t.team.slice().sort((a, b) => v(b) - v(a)).slice(0, START_TEAM).map(m => m.uid); }
function applyRegistration(t, uids) {
  const keep = t.team.filter(m => uids.includes(m.uid)).slice(0, START_TEAM);
  if (!keep.length) return;
  const gone = t.team.filter(m => !keep.includes(m));
  for (const m of gone) farewell(t, m, 'left behind for a new run');
  t.team = keep;
}
// the world's first year begins
function startWorld() {
  S.season = 1; S.lastOpen = 1; S.week = 0; S.turn = 0; S.phase = 'season'; S.dexSeason = {}; S.changes = null; S.progress = null; S.worlds = null;
  eachLeague(() => {
    S.league = null; S.lastLeague = null;
    for (const id of staffIds()) { const t = T(id); t.weekLog = []; t.badges = []; relevelElite(t); }
  });
  const circ = eachLeague(() => S.challengers.length);
  news(`Year 1 begins: ${nLeagues() > 1 ? circ.map((n, i) => `${n} challengers in the ${leagueName(i)}`).join(', ') : circ[0] + ' challengers'} are setting out.`, 'league');
}

function newWorld(cfg = {}) {
  S = { version: SAVE_VERSION, season: 0, week: 0, turn: 0, phase: 'season', trainers: {}, nextId: 1, nextUid: 1, usedNames: {}, famousUsed: [], dex: {}, dexSeason: {}, gyms: [], e4: [], champion: null, challengers: [], freeAgents: [], news: [], history: [], hof: [], stats: { ko: {}, use: {} }, meta: null, cities: {}, nextCity: 0 };
  customFor = undefined; useCustom(customLib);
  S.cfg = { leagues: Number.isInteger(cfg.leagues) && cfg.leagues >= 1 ? cfg.leagues : 1, growth: !!cfg.growth, god: !!cfg.god, allFamous: !!cfg.allFamous, baseOff: !!cfg.baseOff, packs: (cfg.packs || []).filter(k => FAMOUS_PACKS[k]), off: Object.fromEntries((cfg.off || []).filter(k => FEATURES.some(g => g.items.some(i => i[0] === k))).map(k => [k, true])) };
  // the wall report only: every staff member the game creates is this many rating points better or worse
  if (typeof cfg.staffBoost === 'number') S.cfg.staffBoost = cfg.staffBoost;
  // v185: the league's Pokédex is fixed now, for good
  S.cfg.dex = cfg.dex !== undefined ? dexCopy(cfg.dex) : (dexLib.on ? dexCopy(dexLib) : null);
  // (0.31.0) the world's regions: the built-in nine with any custom regions chosen (cfg.regions: [{ rec, mode, of }]);
  // their own new Pokémon join the world's Pokédex as if added to My Pokédex (a name already taken is left out)
  const choices = regionChoices(cfg.regions);
  S.cfg.dex = withRegionSpecies(S.cfg.dex, choices);
  applyDex(S.cfg.dex);
  S.regions = worldRegions(choices); applyRegions();
  if (S.cfg.leagues > maxStartLeagues()) S.cfg.leagues = maxStartLeagues();
  // the league keeps its own copy of the player's packs that are switched on
  S.customPacks = JSON.parse(JSON.stringify(customLib.filter(p => S.cfg.packs.includes(p.key))));
  customFor = undefined; ensureCustom();
  // every League after the first starts empty and is built in turn
  // which regions this world uses, in random order
  S.regionOrder = shuffle(LEAGUE_SETS.map((_, i) => i));
  // cfg.region: the region the first League sits in (left out: drawn at random)
  if (LEAGUE_SETS[cfg.region]) S.regionOrder = [cfg.region, ...S.regionOrder.filter(r => r !== cfg.region)];
  const regions = startRegions(S.regionOrder, S.cfg.leagues, cfg.rivals || []);
  S.cfg.leagues = regions.length;
  // a second League in a region at the start sits at its second seat and is named for it
  const second = i => regions.slice(0, i).includes(regions[i]);
  const blank = i => { const reg = LEAGUE_SETS[regions[i]], two = second(i);
    return { gyms: [], e4: [], champion: null, challengers: [], history: [], stats: { ko: {}, use: {} }, meta: null, region: regions[i], lgName: two ? `${reg.seat2} League` : reg.name, seatName: two ? reg.seat2 : reg.seat }; };
  S.leagues = [null]; S.lg = 0;
  S.region = regions[0]; S.lgName = LEAGUE_SETS[regions[0]].name;
  for (let i = 1; i < S.cfg.leagues; i++) S.leagues.push(blank(i));
  // cfg.hand: the player staffs League 0 by hand (0.6.0). The world waits in S.founding until finishFounding()
  if (cfg.hand) { S.cfg.hand = true; initBooks(); }
  for (let li = 0; li < S.cfg.leagues; li++) inLeague(li, () => (li === 0 && S.cfg.hand ? prepFounding() : foundLeague()));
  if (S.cfg.hand) return;
  foundingField(Array.from({ length: nLeagues() }, (_, i) => i));
  startWorld();
}
// (0.30.0) the most Leagues a world can start with: two a region (REGION_CAP)
// (0.31.0) a region closed to rival Leagues counts for one (yours)
const maxStartLeagues = () => LEAGUE_SETS.reduce((a, r, i) => a + (rivalOk(i) ? REGION_CAP : 1), 0);
// where the Leagues start: yours in order[0], then each rival where the player asked (picks[i]: a region index, or
// null for anywhere) if that region has room; the rest spread out, regions with no League first, then second seats in
// other regions. A rival goes into your region only when picked there, or when every other seat is taken.
function startRegions(order, n, picks) {
  const home = order[0], out = [home], count = r => out.filter(x => x === r).length;
  for (let i = 1; i < n; i++) { const p = picks[i - 1]; out.push(p != null && LEAGUE_SETS[p] && rivalOk(p) && count(p) < REGION_CAP ? p : null); }
  for (let i = 1; i < n; i++) {
    if (out[i] != null) continue;
    const r = order.find(x => x !== home && rivalOk(x) && !count(x)) ?? order.find(x => x !== home && rivalOk(x) && count(x) < REGION_CAP) ?? (rivalOk(home) && count(home) < REGION_CAP ? home : null);
    out[i] = r;
  }
  return out.filter(r => r != null);
}
// one League's founding staff: eight Gym Leaders, the Elite Four and a Champion
function foundLeague(opts = {}) {
  if (!fixedStaff()) { initBooks(); S.fin.quiet = true; } // (0.15.0) every League keeps books; no fees for its founding staff
  // (0.15.0) a League's 8 gym cities: those no other League uses first, then shared ones, the largest first (a second
  // League in a region takes its three towns with no gym and five of the first League's cities)
  const cities = leagueCities();
  for (let i = 0; i < 8; i++) S.gyms.push({ leader: null, city: cities[i].id, w: 0, l: 0, hist: [] });
  S.e4 = [null, null, null, null]; S.champion = null;
  // (0.23.0) every League founds the same way: from a founding pool like the player's (foundingCands), the best who
  // will sign for a League with no prestige yet, by the same rule as Fill the rest (foundingPick); everyone not placed
  // joins the League's circuit, and the gym trainers are then taken from it. The report's fixed tiers still found at
  // the old strengths, so a tier stays a tier.
  if (fixedStaff()) { foundFixed(opts); if (S.fin) S.fin.quiet = false; return; }
  const cands = foundingCands(), placed = { champion: opts.champ ? opts.champ.id : null, e4: [null, null, null, null], gyms: Array(8).fill(null) };
  foundingPick(placed, () => cands.filter(id => willSign(T(id)) && !foundPlaced(placed).includes(id)));
  ranchStock(stockPosts(placed)); // (0.25.0) the starting stock, before the teams are built from it
  placed.gyms.forEach((id, i) => installElite(T(id), 'leader', i));
  placed.e4.forEach((id, i) => installElite(T(id), 'e4', i));
  const c = T(placed.champion);
  if (opts.champ) c.founderUntil = S.season + FOUNDER_CHAMP_YEARS; else c.foundingChamp = true;
  installElite(c, 'champion');
  const used = new Set(foundPlaced(placed));
  for (const id of cands) { const t = T(id); if (used.has(id) || t.role !== 'free') continue; joinCircuit(t, S.lg || 0); t.rest = (S.turn || 0) + ri(0, FOUNDING_STAGGER); t.early = 0; }
  for (let i = 0; i < 8; i++) staffGym(i);
  if (S.fin) S.fin.quiet = false;
}
// the report's fixed tiers (tests only): the strengths every League founded with before 0.23.0
function foundFixed(opts) {
  const types = shuffle(TYPES);
  for (let i = 0; i < 8; i++) {
    const t = newTrainer({ age: ri(22, 50), quality: staffQ(50 + i * 2.2), role: 'leader', specialty: types[i] });
    installElite(t, 'leader', i);
    staffGym(i);
  }
  const e4t = types.slice(8, 12);
  for (let i = 0; i < 4; i++) {
    const taken = S.e4.filter(Boolean).map(id => T(id).specialty);
    const t = newTrainer({ age: ri(26, 50), quality: staffQ(64 + i), role: 'e4', specialty: taken.includes(e4t[i]) ? TYPES.find(ty => !taken.includes(ty) && !types.slice(0, 8).includes(ty)) : e4t[i] });
    installElite(t, 'e4', i);
  }
  const c = opts.champ || newTrainer({ age: ri(24, 40), quality: staffQ(72), role: 'champion', specialty: types[12] });
  if (opts.champ) c.founderUntil = S.season + FOUNDER_CHAMP_YEARS; else c.foundingChamp = true;
  installElite(c, 'champion');
}
// ---------- challengers changing Leagues ----------
// How well a trainer's types line up against League i: +1 for each foe Pokémon they hit super-effectively, −1 for
// each that hits all of their Pokémon super-effectively, with the Champion counting double and the meta half.
function leagueFit(t, i) {
  return inLeague(i, () => {
    const mine = t.team; if (!mine.length) return 0;
    const hits = (atkTypes, sp) => atkTypes.some(ty => effVs(ty, sp) >= 2);
    const score = (sp, w) => (mine.some(m => hits(monTypes(m), sp)) ? w : 0) - (mine.every(m => SP[sp].types.some(ty => effVs(ty, m.sp) >= 2)) ? w : 0);
    let v = 0, n = 0;
    const champ = T(S.champion);
    if (champ) for (const m of champ.team) { v += score(m.sp, 2); n += 2; }
    for (const id of S.e4) { const e = T(id); if (e) for (const m of e.team) { v += score(m.sp, 1); n += 1; } }
    for (const sp of S.metaMons || []) if (SP[sp]) { v += score(sp, 0.5); n += 0.5; }
    return n ? Math.round(v / n * 100) / 100 : 0;
  });
}
function shiftLeague(t, to) {
  const from = homeLeague(t); if (from === to) return;
  inLeague(from, () => { S.challengers = S.challengers.filter(x => x !== t.id); });
  t.lg = to;
  inLeague(to, () => { if (!S.challengers.includes(t.id)) S.challengers.push(t.id); });
  regionMove(t, inLeague(from, () => S.region), inLeague(to, () => S.region)); // (0.27.0) at most 3 foreign Pokémon
  (t.lgMoves = t.lgMoves || []).push({ season: S.season, from, to });
}
// ---------- Grand Slam: Champion (at a season's end) of every League in the world ----------
let champLgCache = { key: null, map: null };
function champLeagueMap() {
  const lens = eachLeague(() => S.history.length).join(',');
  const key = `${S.season}|${S.phase}|${lens}|${(S.folded || []).length}`;
  if (champLgCache.key === key && champLgCache.map) return champLgCache.map;
  const map = new Map();
  // 0.15.0: a League counts for a trainer who won its title (beat its Champion), not for whoever held the seat
  eachLeague(i => { for (const h of S.history) for (const w of h.winners || []) { const id = typeof w === 'object' ? w.id : w; if (!map.has(id)) map.set(id, new Set()); map.get(id).add(i); } });
  // 0.19.0: a folded League's history went with it, but its title winners keep it in their own list (t.titleLgs, where
  // it is a negative number naming S.folded), so those titles still count
  if ((S.folded || []).length) for (const t of Object.values(S.trainers)) for (const lg of t.titleLgs || []) if (lg < 0) { if (!map.has(t.id)) map.set(t.id, new Set()); map.get(t.id).add(lg); }
  champLgCache = { key, map };
  return map;
}
function champLeaguesOf(t) { return nLeagues() > 1 && t ? champLeagueMap().get(t.id) || new Set() : new Set(); }
const CROWN_LEAGUES = 3;
const isGrandSlam = t => nLeagues() >= CROWN_LEAGUES && champLeaguesOf(t).size >= CROWN_LEAGUES; // 2.0: the Triple Crown
// ---------- v175: chasing the Grand Slam ----------
// A Slam chaser has won at least one League but not all of them. The AI pulls chasers toward Leagues they haven't
// won, a dethroned chaser goes back to the circuit in an unwon League, and a contender (titles in 2+ Leagues) gets
// SLAM_EXTRA more seasons before age can retire them.
const SLAM_PULL = 0.5, SLAM_EXTRA = 3;
const slamChaser = t => nLeagues() >= CROWN_LEAGUES && !!t && ((t.titleSeasons || []).length || (t.career && t.career.titles)) && !isGrandSlam(t) && champLeaguesOf(t).size >= 1;
const slamContender = t => slamChaser(t) && champLeaguesOf(t).size >= 2;
// cheap checks first: this runs for every trainer in the retirement passes
const slamProtected = t => nLeagues() > 1 && !!t && ((t.titleSeasons || []).length >= 2 || (t.career && t.career.titles >= 2)) && (t.seasons || 0) < careerSpan(t) + SLAM_EXTRA && slamContender(t);
const unwonLeagues = t => Array.from({ length: nLeagues() }, (_, i) => i).filter(i => !champLeaguesOf(t).has(i));
// a League's matchup, plus a pull toward the Leagues a Slam chaser still needs
// v199: a Globetrotter feels the pull twice as strongly and looks for a move every offseason
const globetrotter = t => !!t && t.r && hasTrait(t, 'globetrotter');
const slamFit = (t, i) => leagueFit(t, i) + (slamChaser(t) && !champLeaguesOf(t).has(i) ? SLAM_PULL * (globetrotter(t) ? 2 : 1) : 0);
// can challenger t go to League i (a circuit has no cap; since 0.20.0 there is one of each legendary in the world, so
// a legendary can't clash with another League's)
const slamRoom = (t, i) => i !== lgOf(t);
// after the League offseasons: a dethroned Slam chaser looks for a new challenge in a League they haven't won
function slamReturns(changes) {
  const ids = S.slamReturn || []; S.slamReturn = [];
  if (nLeagues() < 2) return;
  for (const id of ids) {
    const t = T(id);
    if (!t || t.role !== 'challenger' || t.spon || !slamChaser(t)) continue;
    const from = homeLeague(t); if (from == null) continue;
    const opts = unwonLeagues(t).filter(i => slamRoom(t, i));
    if (!opts.length) continue;
    const to = opts.sort((a, b) => leagueFit(t, b) - leagueFit(t, a))[0];
    shiftLeague(t, to);
    const msg = `Former Champion ${t.name} wants a new challenge and moves from the ${leagueName(from)} to the ${leagueName(to)}, a League they haven't won yet (Triple Crown: ${champLeaguesOf(t).size} of ${CROWN_LEAGUES}).`;
    inLeague(to, () => news(msg, 'move', t.id));
    changes.push(msg);
  }
}
function checkGrandSlams() {
  if (nLeagues() < CROWN_LEAGUES) return;
  for (const id of eachLeague(() => S.champion)) {
    const t = T(id); if (!t) continue;
    // one League short of the Slam (4-League worlds): the chase makes the news, once per count
    const n = champLeaguesOf(t).size;
    if (!t.grandSlam && n === CROWN_LEAGUES - 1 && t.slamNews !== n) {
      t.slamNews = n;
      news(`${dn(t)} has now been Champion of ${n} Leagues and is one away from the Triple Crown. Still unwon: ${unwonLeagues(t).map(leagueName).join(', ')}.`, 'title', t.id);
    }
    if (t.grandSlam || !isGrandSlam(t)) continue;
    t.grandSlam = S.season;
    news(`TRIPLE CROWN! ${dn(t)} has now been Champion of three different Leagues: ${[...champLeaguesOf(t)].map(leagueName).join(', ')}.`, 'title', t.id);
  }
}
const MOVE_EDGE = 0.35; // how much better another League's matchups must look to a Triple Crown chaser or a Globetrotter (see leagueMove)
// a founding trainer's team: older, better rated, more evolved Pokémon than a newcomer
function fieldTeam(t, exp) {
  starterTeam(t, 9);
  { const o = wildOffers(t)[0]; if (o) t.team.push(stamp(makeMon(o.sp, 35), 'caught')); }
  t.team.forEach(m => { m.lvl = Math.max(m.lvl, 16 + exp * 6); evolveMon(m, t.specialty); });
}
function fieldTrainer() {
  const exp = ri(1, 5);
  const t = newTrainer({ age: ri(12, 16) + exp, quality: ri(36, 56) + exp * 2, role: 'free' });
  fieldTeam(t, exp);
  return t;
}
// the founding field: experienced trainers with no recorded League history fill the circuits of the Leagues listed
function foundingField(lgs) {
  for (const li of lgs) for (let i = 0; i < CIRCUIT_SIZE; i++) {
    const t = fieldTrainer();
    joinCircuit(t, li); t.rest = ri(0, FOUNDING_STAGGER); t.early = 0;
  }
  news(`The ${nLeagues() > 1 ? 'World Circuit' : S.lgName} has been founded${nLeagues() > 1 ? `: ${eachLeague(() => S.lgName).join(', ')}` : ''}.`, 'league');
}
// ================= FOUNDING BY HAND (0.6.0) =================
// The player's League (League 0 in a world made with cfg.hand) is staffed by hand. The game makes a pool of founding
// candidates (about three per senior post, at the strength the game would found with, a few stars and a handful of
// famous trainers) and the founding field. The player places the 13 senior posts from either group; everyone not
// placed starts on the circuit, and each gym's two gym trainers are then taken from the circuit (staffGym).
// (0.23.0, design doc 6.3) the founding pool is weaker and has no stars or famous trainers: FOUND_CANDS candidates,
// mostly OVR FOUND_OVR, with FOUND_STANDOUTS of them at FOUND_STANDOUT_OVR. Every trainer has a prestige minimum
// (prestMin), and a new League has none yet: the standouts are the best it can sign (up to PM_FREE needs nothing).
const FOUND_CANDS = 40, FOUND_OVR = [45, 55], FOUND_STANDOUTS = [4, 6], FOUND_STANDOUT_OVR = [58, 62];
// set a new trainer's OVR to `to` by moving every rating alike (OVR is a weighted mean of them)
function setOvr(t, to) {
  for (let n = 0; n < 3; n++) { const d = to - ovr(t); if (!d) break; for (const k of RK) t.r[k] = clamp(t.r[k] + d, 8, 96); }
  t.pot = growPot(t);
}
function foundingCands() {
  const n = ri(FOUND_STANDOUTS[0], FOUND_STANDOUTS[1]), out = [];
  for (let i = 0; i < FOUND_CANDS; i++) {
    const o = i < n ? ri(FOUND_STANDOUT_OVR[0], FOUND_STANDOUT_OVR[1]) : ri(FOUND_OVR[0], FOUND_OVR[1]);
    const t = newTrainer({ age: ri(20, 48), quality: o, role: 'free', specialty: rand() < 0.06 ? null : pick(TYPES), noFamous: true });
    setOvr(t, staffQ(o)); fieldTeam(t, 5); out.push(t.id);
  }
  return shuffle(out);
}
const handOn = () => !!(S && S.cfg && S.cfg.hand);
// is the bound League the player's own (staffed by hand, with vacancies that wait)?
const playerLeague = () => handOn() && (S.lg || 0) === ME() && !fixedStaff();
function prepFounding(opts = {}) {
  const cities = leagueCities();
  for (let i = 0; i < 8; i++) S.gyms.push({ leader: null, city: cities[i].id, w: 0, l: 0, hist: [] });
  S.e4 = [null, null, null, null]; S.champion = null;
  const cands = foundingCands();
  const field = []; for (let i = 0; i < CIRCUIT_SIZE; i++) field.push(fieldTrainer().id);
  S.founding = { cands, field, champion: null, e4: [null, null, null, null], gyms: Array(8).fill(null) };
  // (0.17.0) the player leaving to found a League mid-world: the staff who came along are placed at once (a Gym Leader
  // at the same gym number, an Elite Four member at the same seat, a gym trainer at the first open gym), and the
  // academy prospects who followed join the circuit when the League opens
  if (opts.mid) {
    const F = S.founding; F.mid = true; F.prospects = opts.prospects || []; F.carry = opts.carry || [];
    for (const id of F.carry) {
      const t = T(id), p = t.carriedFrom; F.cands.push(id);
      if (t.lastRole === 'e4' && p != null && F.e4[p] == null) F.e4[p] = id;
      else if (t.lastRole === 'leader' && p != null && F.gyms[p] == null) F.gyms[p] = id;
      else { const g = F.gyms.findIndex(x => x == null); if (g >= 0) F.gyms[g] = id; }
    }
  }
}
// (0.15.0) a League's 8 gym cities: those no other League uses first, then shared ones, the largest first (a second
// League in a region takes its three towns with no gym and five of the first League's cities)
function leagueCities() {
  const use = {}; for (const L of S.leagues || []) if (L && L !== S && L.region === S.region) for (const g of L.gyms || []) use[g.city] = (use[g.city] || 0) + 1;
  return regionCities(S.region).slice().sort((a, b) => (use[a.id] || 0) - (use[b.id] || 0) || citySpent(b) - citySpent(a) || a.id - b.id);
}
// everyone placed so far, and the founding pool still free to place
const foundPlaced = (F = S.founding) => [F.champion, ...F.e4, ...F.gyms].filter(x => x != null);
function foundPool() { const F = S.founding, used = new Set(foundPlaced()); return F.cands.concat(F.field).filter(id => !used.has(id)); }
// (0.23.0) the founding pool a new League can actually sign (with no prestige yet, mostly those under the bar and the
// hungry; staff who followed the player always come)
const foundSignable = () => inLeague(ME(), () => foundPool().filter(id => willSign(T(id))));
const foundBlock = id => inLeague(ME(), () => prestBlock(T(id)));
// the types already held by the other posts (the picker flags a repeat; repeats are allowed)
function foundTypesUsed(post, slot, F = S.founding) {
  const out = [];
  const add = (id, p, k) => { if (id != null && !(p === post && k === slot)) out.push(...specTypes(T(id))); };
  add(F.champion, 'champion', 0); F.e4.forEach((id, k) => add(id, 'e4', k)); F.gyms.forEach((id, k) => add(id, 'gym', k));
  return out;
}
// place trainer id at a post ('champion', 'e4' seat 0 to 3, 'gym' 0 to 7); id null clears it. A trainer placed
// elsewhere moves here.
function foundPlace(post, slot, id) {
  const F = S.founding; if (!F) return false;
  if (id != null && !F.cands.concat(F.field).includes(id)) return false;
  if (id != null && foundBlock(id)) return false; // (0.23.0) won't sign for a League with no prestige yet
  if (id != null) { if (F.champion === id) F.champion = null; F.e4 = F.e4.map(x => (x === id ? null : x)); F.gyms = F.gyms.map(x => (x === id ? null : x)); }
  if (post === 'champion') F.champion = id;
  else if (post === 'e4' && slot >= 0 && slot < 4) F.e4[slot] = id;
  else if (post === 'gym' && slot >= 0 && slot < 8) F.gyms[slot] = id;
  else return false;
  return true;
}
// "Fill the rest for me": the best available trainer for each empty post, Champion first, then the Elite Four from
// seat 4 down, then the gyms from 8 down, preferring a type not yet held when two are close
function foundingFill() {
  const F = S.founding; if (!F) return;
  foundingPick(F, foundSignable);
}
// fill the empty posts of placement F ({ champion, e4[4], gyms[8] }) from pool() (ids still free); shared by Fill the
// rest and every automatically founded League (0.23.0)
function foundingPick(F, pool) {
  const score = (t, post, slot) => ovr(t) - (specTypes(t).some(x => foundTypesUsed(post, slot, F).includes(x)) ? 6 : 0);
  const best = (post, slot) => pool().map(T).sort((a, b) => score(b, post, slot) - score(a, post, slot))[0];
  const fill = (post, slot) => { const t = best(post, slot); if (!t) return; if (post === 'champion') F.champion = t.id; else if (post === 'e4') F.e4[slot] = t.id; else F.gyms[slot] = t.id; };
  if (F.champion == null) fill('champion', 0);
  for (let k = 3; k >= 0; k--) if (F.e4[k] == null) fill('e4', k);
  for (let k = 7; k >= 0; k--) if (F.gyms[k] == null) fill('gym', k);
}
// open the League: install the placed staff, put everyone else on the circuit, take on the gym trainers, and start
// the world. Any post still empty is filled for the player first.
function finishFounding() {
  const F = S.founding; if (!F) return;
  inLeague(ME(), () => {
    foundingFill();
    ranchStock(stockPosts(F)); // (0.25.0)
    F.gyms.forEach((id, i) => installElite(T(id), 'leader', i));
    F.e4.forEach((id, i) => { const t = T(id); installElite(t, 'e4', i); if (t.famous) news(`${t.name} has joined the ${S.lgName} as a member of the Elite Four.`, 'move', t.id); });
    const c = T(F.champion); c.foundingChamp = true; installElite(c, 'champion');
    const placed = new Set(foundPlaced());
    for (const id of F.cands.concat(F.field)) { const t = T(id); if (placed.has(id) || t.role !== 'free') continue; joinCircuit(t, ME()); t.rest = (F.mid ? S.turn : 0) + ri(0, FOUNDING_STAGGER); t.early = 0; }
    for (const id of F.prospects || []) { const t = T(id); if (t && t.role === 'challenger') { shiftLeague(t, ME()); t.academy = ME(); } }
    for (const id of F.after || []) { const t = T(id); if (t && t.role === 'free') { joinCircuit(t, ME()); t.rest = S.turn + ri(1, 4); t.early = 0; } }
    for (const id of F.carry || []) { const t = T(id); if (t) { delete t.carried; delete t.carriedFrom; delete t.lastRole; } }
    S.founding = null; delete S.founding;
    if (S.fin) S.fin.quiet = true; // (0.13.0) no signing fees for the founding staff
    for (let i = 0; i < 8; i++) staffGym(i);
    if (S.fin) S.fin.quiet = false;
    if (F.mid) news(`The ${S.lgName} opens in Year ${S.season}, with its own gyms, Elite Four and Champion.`, 'league');
  });
  if (F.mid) return;
  foundingField(Array.from({ length: nLeagues() - 1 }, (_, i) => i + 1));
  startWorld();
}
// ================= MONEY AND CITIES (0.13.0, stage 3) =================
// Design doc 5.2, 5.3 and section 6. Only the player's League keeps books until rival Leagues are designed (stage
// 4): S.fin is world-level and belongs to League 0 when it is staffed by hand. Money comes from an entry fee for
// every run begun on the circuit (per run, not per battle, so a leaky wall earns no more), a New Year wall prize that
// shrinks with every trainer let through, and attractions. It pays salaries (post × OVR, every week), signing fees for
// anyone joining the staff from outside, severance for anyone let go, raises, paid bans, buildings and moving a gym.
// Salaries are always paid, even into the red; below zero the player can't spend. All numbers are provisional.
const START_FUND = 200000, ENTRY_FEE = 700, WALL_PRIZE = 150000, WALL_PRIZE_LOSS = 15000;
const PAY_BASE = { gymtrainer: 40, leader: 100, leaderStep: 15, e4: 260, e4Step: 30, champion: 450 };
const PAY_FAMOUS = 1.25, PAY_TITLE = 1.15, SIGN_WEEKS = 12, SEVER_WEEKS = 12, RAISE_WEEKS = 12, RAISE_MUL = 1.2;
const BIDS = [0, 0.25, 0.5], BID_ODDS = 0.12; // pay over the asking, and what each step adds to the odds an offer is taken
const BAN_PRICE = 15000, BAN_PAID_MAX = 3, BAN_PROTECT = 2; // a ban-year's price (×1 to ×3 by meta rank), bans at once, years protected after
const FIN_LOG = 60;
// (0.15.0, stage 4) every League keeps books (the League field S.fin), except in the wall report's fixed tiers;
// rival Leagues spend by their aim. booksOn() is the bound League; myBooks() the player's own League.
const booksOn = () => !!(S && S.fin);
const myBooks = () => booksOn() && playerLeague();
// the player's League's books, whichever League is bound (the header, the nav)
const playerFin = () => (S && handOn() ? inLeague(ME(), () => S.fin) : null);
// a member of staff's weekly pay: the post's base, scaled by OVR ((OVR / 60)², fixed at hire and reviewed each New
// Year), more for famous trainers and title winners, times any raise or bid
function payBase(post, slot) { return post === 'gymtrainer' ? PAY_BASE.gymtrainer : post === 'leader' ? PAY_BASE.leader + PAY_BASE.leaderStep * (slot || 0) : post === 'e4' ? PAY_BASE.e4 + PAY_BASE.e4Step * (slot || 0) : PAY_BASE.champion; }
function payFor(t, post, slot, o) {
  const v = o != null ? o : ovr(t);
  return Math.round(payBase(post, slot) * Math.pow(v / 60, 2) * (t.famous ? PAY_FAMOUS : 1) * ((t.titleSeasons || []).length ? PAY_TITLE : 1) * (ownAcademy(t) ? ACADEMY_PAY : 1));
}
function payOf(t) { const p = postOf(t); return p ? Math.round(payFor(t, p.post, p.slot, t.payOvr) * (t.payMul || 1)) : 0; }
// what a candidate would ask for a post (founding, hiring pages)
const askFor = (t, post, slot) => Math.round(payFor(t, post, slot) * richMul());
// the bound League's weekly wage bill
function wageBill() { return staffIds().map(T).filter(Boolean).reduce((a, t) => a + payOf(t), 0); }
// (0.15.0, catch-up) stars ask more of a League much richer than the world's average, fixed when they are hired: up to
// RICH_PAY_MAX more, reached at RICH_PAY_AT times the average. Gentle: pulling ahead is allowed, never punished.
const RICH_PAY_MAX = 0.2, RICH_PAY_AT = 4;
function richMul() {
  if (!S.fin || nLeagues() < 2) return 1;
  const avg = Math.max(START_FUND, S.moneyAvg || 0);
  return 1 + clamp((S.fin.money - avg) / (avg * (RICH_PAY_AT - 1)), 0, 1) * RICH_PAY_MAX;
}
function finYear() { const f = S.fin; if (!f.yr || f.yr.season !== S.season) { if (f.yr) f.last = f.yr; f.yr = { season: S.season, in: {}, out: {} }; } return f.yr; }
// money in (+) or out (−), under a heading; one line for the ledger unless it is routine weekly business
function book(amt, what, text) {
  if (!S.fin) return;
  const f = S.fin, before = f.money;
  f.money = Math.round(f.money + amt);
  const y = finYear(), side = amt >= 0 ? y.in : y.out; side[what] = (side[what] || 0) + Math.abs(Math.round(amt));
  if (text) { f.log.unshift({ turn: S.turn, amt: Math.round(amt), text }); if (f.log.length > FIN_LOG) f.log.length = FIN_LOG; }
  if (before >= 0 && f.money < 0) {
    f.redAt = S.turn;
    if (playerLeague()) { news(`The League is in the red (${money(f.money)}). Nothing new can be bought until it is back above zero, and every ${RED_BITE_WEEKS} weeks in the red the best-paid member of staff gives notice.`, 'league'); stopFor('money', `The League is in the red (${money(f.money)}).`); }
    else news(`The ${S.lgName} is in the red.`, 'league');
  }
}
const money = n => `${n < 0 ? '−' : ''}₽${Math.abs(Math.round(n)).toLocaleString('en-US')}`;
// can the player spend this much now? (below zero, or short of it, they can't)
const canSpend = amt => !booksOn() || S.fin.money >= amt;
function initBooks() {
  const mine = !!(S.cfg && S.cfg.hand) && (S.lg || 0) === ME();
  S.fin = { money: START_FUND, log: [], yr: null, last: null, raised: 0, aim: mine ? null : pickAim(), aimAt: S.season || 0, redAt: null };
  S.ranch = newRanch(); // (0.25.0) every League with books keeps a ranch
  finYear();
}
// a member of staff takes a post: their pay is set, and someone new to the staff costs a signing fee
function postPay(t, wasStaff) {
  t.payOvr = ovr(t); t.payMul = (t.bidMul || 1) * (wasStaff || t.acting ? 1 : richMul()); t.bidMul = null; t.raised = false; t.lastPay = payOf(t);
  // (0.15.0) no signing fee while in the red (only automatic hires happen then), so the red doesn't feed on itself
  if (!booksOn() || wasStaff || S.founding || S.fin.quiet || t.acting || S.fin.money < 0) return;
  const fee = SIGN_WEEKS * payOf(t);
  if (fee) book(-fee, 'signing', `Signing fee: ${t.name} (${postName(t)})`);
  // (0.15.0) staff from another League: their old League receives the fee
  // (0.19.0) a League that folded (a negative number) has no books to pay into
  if (fee && t.leftAt === S.turn && t.leftLg != null && t.leftLg >= 0 && t.leftLg !== (S.lg || 0) && t.leftLg < nLeagues()) { const to = S.lgName; inLeague(t.leftLg, () => { if (S.fin) book(fee, 'transfers', `Transfer fee: ${t.name} to the ${to}`); }); }
}
// severance for someone let go (not for someone you let go on another run they asked for)
function severance(t, was) {
  if (!booksOn()) return;
  const fee = SEVER_WEEKS * (t.lastPay || 0);
  if (fee) book(-fee, 'severance', `Severance: ${t.name} (${was})`);
}
// once a week for every League with books: salaries, attractions, city income, paid bans that run out, and the red
function moneyWeek() {
  const all = eachLeague(() => S.fin ? S.fin.money : null).filter(x => x != null);
  if (!all.length) return;
  S.moneyAvg = Math.round(all.reduce((a, b) => a + b, 0) / all.length); // world-level: the catch-up rules read it
  eachLeague(() => {
    if (!S.fin) return;
    // (0.18.0) in the red, upkeep goes unpaid and every building lapses: attractions earn nothing, and the rest stop
    // working (lapsed()); every DECAY_WEEKS unpaid in a row the costliest level is lost (decayWeek)
    const lap = lapsed();
    for (const t of staffIds().map(T).filter(Boolean)) t.lastPay = payOf(t);
    const w = wageBill(); if (w) book(-w, 'salaries');
    if (!lap) { const a = attractionIncome(); if (a) book(a, 'attractions'); const sn = sanctIncome(); if (sn) book(sn, 'sanctuary'); const u = upkeepWeek(); if (u) book(-u, 'upkeep'); }
    const ci = cityIncome(); if (ci) book(ci, 'cities');
    expirePaidBans();
    ranchWeek(); // (0.25.0) upkeep, trips, the market
    redWeek();
    decayWeek(lap);
  });
}
// (0.15.0) money limits what a League can field: every RED_BITE_WEEKS weeks in the red its best-paid member of staff
// (not the Champion) gives QUIT_NOTICE weeks' notice; back above zero, those notices are withdrawn
const RED_BITE_WEEKS = 4;
function redWeek() {
  const f = S.fin;
  if (f.money >= 0) {
    if (f.redAt != null) { f.redAt = null; for (const t of staffIds().map(T)) if (t && t.quit && t.quit.k === 'pay') { t.quit = null; news(`${dn(t)} will stay at ${postName(t)} now the ${S.lgName} is out of the red.`, 'move', t.id); } }
    return;
  }
  if (f.redAt == null) f.redAt = S.turn;
  const wk = S.turn - f.redAt;
  if (wk <= 0 || wk % RED_BITE_WEEKS) return;
  const t = staffIds().map(T).filter(x => x && x.role !== 'champion' && !x.acting && !x.quit && x.stepDown == null && postOf(x)).sort((a, b) => payOf(b) - payOf(a))[0];
  if (!t) return;
  t.quit = { at: S.turn + QUIT_NOTICE, k: 'pay' };
  const msg = `${dn(t)} (${postName(t)}) hasn't been paid in full and will leave on ${turnDate(t.quit.at)} unless the ${S.lgName} is back out of the red.`;
  news(msg, 'move', t.id); noteChange(msg);
  if (playerLeague()) stopFor('money', msg);
}
// New Year for League 0: the wall prize, and every salary reviewed against OVR now
function moneyNewYear(titles) {
  if (!booksOn()) return;
  const prize = Math.max(0, WALL_PRIZE - WALL_PRIZE_LOSS * titles);
  if (prize) book(prize, 'prize', `Wall prize for Year ${S.season} (${titles} let through)`);
  for (const t of staffIds().map(T).filter(Boolean)) t.payOvr = ovr(t);
  if (!playerLeague()) aimNewYear();
}
// the entry fee for a run begun on League 0's circuit
function entryFee() { if (booksOn()) book(ENTRY_FEE, 'entry'); }
// a raise: a restless member of staff (or one who gave notice over promotion) has their clock put back a year and
// their notice withdrawn, once per post, for RAISE_WEEKS weeks' pay up front and RAISE_MUL on their pay after
function canRaise(t) { return !!t && !t.raised && !!t.wish && t.wish.k === 'up' && (restless(t) || (t.quit && t.quit.k === 'up')); }
const raiseCost = t => RAISE_WEEKS * payOf(t);
function giveRaise(id) {
  return inLeague(ME(), () => {
    const t = T(id); if (!booksOn() || !canRaise(t)) return 'They can\'t be given a raise now.';
    const c = raiseCost(t); if (!canSpend(c)) return 'Not enough money.';
    book(-c, 'raises', `Raise: ${t.name} (${postName(t)})`);
    t.payMul = (t.payMul || 1) * RAISE_MUL; t.raised = true; t.wish.since = Math.min(S.turn, t.wish.since + YEAR_WEEKS); t.quit = null; S.fin.raised++;
    news(`${dn(t)} took a raise and will wait another year for promotion.`, 'move', t.id);
    return null;
  });
}
// ---------- cities ----------
// A region has its 8 gym cities and three more without a gym (LEAGUE_SETS extra); a League also has its seat (the Elite Four and the
// Champion). A League builds only where it has a gym (and at its seat). A city's slots grow with what all Leagues have
// spent there (1, then 2 at CITY_GROW[0], 3 at CITY_GROW[1]); the seat has SEAT_SLOTS. Each upgrade has 3 levels.
// (0.16.0) training halls and gym features go to level 5 (UP_COST[3], [4]); the youth academy is a League-level
// purchase at the seat that takes no slot and has its own prices. Every level owned costs UPKEEP of its price a year.
const CITY_GROW = [60000, 180000], SEAT_SLOTS = 3, UP_COST = [25000, 50000, 100000, 200000, 400000], MOVE_FEE = 40000, UPKEEP = 0.05;
const UPGRADES = {
  hall:    { name: 'Training hall',   text: 'Staff here grow faster while they are still improving (+12% a level) and decline more slowly once past their peak (10% a level).', max: 5 },
  feature: { name: 'Gym feature',     text: 'A home edge: staff here fight at +1.5% per level in their own battles.', max: 5 },
  attract: { name: 'Attraction',      text: 'Brings in income every week.', income: [120, 240, 360] },
  scout:   { name: 'Scouting office', text: 'Seat only. Each level adds an outsider to every hiring page, makes outsiders 2 points stronger and adds 4% to the odds an offer is taken.', seat: true },
  // (0.20.0) only in a gym city that is a legendary site: earns more than an attraction while the site lasts, and adds prestige
  sanct:   { name: 'Sanctuary',       text: 'Only in a city that is a legendary site. Brings in more than an attraction every week while the site lasts (an attraction\'s income after), and a point of prestige a level each New Year while it lasts.', site: true, income: [250, 500, 800] },
  // (0.25.0) the Ranch: how many Pokémon the League's ranch holds
  ranch:   { name: 'Ranch',           text: 'Seat only, takes no slot. Each level lets your ranch hold more Pokémon (60 with none, then 80, 105, 135, 170, 210).', seat: true, slotless: true, max: 5, cost: [30000, 60000, 120000, 240000, 480000] },
  // (0.27.0) a port city's shipping lane (Goldenrod's railway): a source region's Pokémon on trips and at the market
  lane:    { name: 'Shipping lane',   text: 'Only in a port city (Goldenrod: the railway). Choose a region on the Ranch page: its Pokémon can then be caught on your targeted trips and turn up at your market all the time. 400 a week on top of upkeep; changing the route costs 10,000.', port: true, max: 1, cost: [60000] },
  // (0.27.0) the safari: one per League, in a gym city; foreign Pokémon for its own trips, changing every few months
  safari:  { name: 'Safari Zone',     text: 'One per League, in a gym city. Holds 10 Pokémon from other regions (13, 16 at levels 2 and 3), changing every 12 weeks, that only your targeted trips can catch; each level also makes those finds better.', one: true },
  academy: { name: 'Youth academy',   text: 'Seat only, takes no slot. Each level raises a young prospect a year who sets out on your circuit as one of your own: likelier to take your offers and cheaper to hire.', seat: true, slotless: true, cost: [100000, 200000, 400000] },
};
const upMax = k => UPGRADES[k].max || 3;
const upCost = (k, lv) => (UPGRADES[k].cost || UP_COST)[lv];
// what a building has cost so far (every level paid), for upkeep and the economy report
const slotsUsed = b => b.filter(x => !UPGRADES[x.k].slotless).length;
const builtCost = x => { let c = 0; for (let n = 0; n < x.lv; n++) c += upCost(x.k, n); return c; };
const cityLg = () => S.lg || 0;
function cityB(c, i = cityLg()) { c.b = c.b || {}; return c.b[i] = c.b[i] || []; }
const citySpent = c => Object.values(c.spent || {}).reduce((a, b) => a + b, 0);
const citySlots = c => 1 + (citySpent(c) >= CITY_GROW[0]) + (citySpent(c) >= CITY_GROW[1]);
const seatPlace = () => S.seatName || LEAGUE_SETS[S.region].seat;
function seatB() { return S.seatB = S.seatB || []; }
// the League's places: its seat, then the gym cities in gym order, then the region's cities where it has no gym
function myPlaces() {
  const all = regionCities(S.region), gymC = S.gyms.map(g => g.city);
  return [{ seat: true, name: seatPlace(), slots: SEAT_SLOTS, b: seatB() }]
    .concat(S.gyms.map((g, i) => { const c = S.cities[g.city]; return { c, gym: i, name: c.name, slots: citySlots(c), b: cityB(c) }; }))
    .concat(all.filter(c => !gymC.includes(c.id)).map(c => ({ c, gym: null, name: c.name, slots: citySlots(c), b: cityB(c), none: true })));
}
const upLevel = (b, k) => (b.find(x => x.k === k) || { lv: 0 }).lv;
// the level of upgrade k at gym i ('seat' for the seat), in the bound League
function placeLv(where, k) { if (where === 'seat') return upLevel(seatB(), k); const g = S.gyms[where]; return g && S.cities[g.city] ? upLevel(cityB(S.cities[g.city]), k) : 0; }
// what the next level of upgrade k costs at a place, or a reason it can't be built
function buildCheck(where, k) {
  const U = UPGRADES[k]; if (!U) return { why: 'No such upgrade.' };
  if (U.seat && where !== 'seat') return { why: 'Only at the seat.' };
  if (U.site && (where === 'seat' || !siteOn(S.cities[(S.gyms[where] || {}).city]))) return { why: 'Only at a legendary site.' };
  // (0.27.0) lanes only in ports (and only with regional encounters), one safari a League
  if (U.port && (where === 'seat' || !isPort(S.cities[(S.gyms[where] || {}).city]) || !homeSet(S.region))) return { why: 'Only in a port city (or Goldenrod, for its railway).' };
  if ((U.one || U.port) && !homeSet(S.region)) return { why: 'Every species is found everywhere (National Dex rules).' };
  if (U.one && (where === 'seat' || S.gyms.some((g, i) => i !== where && S.cities[g.city] && upLevel(cityB(S.cities[g.city]), k)))) return { why: where === 'seat' ? 'Only in a gym city.' : 'Your League already has one.' };
  const pl = where === 'seat' ? { b: seatB(), slots: SEAT_SLOTS } : (() => { const g = S.gyms[where]; const c = g && S.cities[g.city]; return c ? { b: cityB(c), slots: citySlots(c) } : null; })();
  if (!pl) return { why: 'Your League has no gym there.' };
  const lv = upLevel(pl.b, k);
  if (lv >= upMax(k)) return { why: 'Fully built.' };
  if (!lv && !U.slotless && slotsUsed(pl.b) >= pl.slots) return { why: 'No free slot.' };
  // (0.19.0) a level the League lost here (sold or decayed) is restored at RESTORE_SHARE of its price
  const ru = ruinsAt(where, k) > 0;
  return { cost: Math.round(upCost(k, lv) * (ru ? RESTORE_SHARE : 1)), lv: lv + 1, restore: ru };
}
function build(where, k, lg = ME()) {
  return inLeague(lg, () => {
    if (!booksOn()) return 'Money is off.';
    const ck = buildCheck(where, k); if (ck.why) return ck.why;
    if (!canSpend(ck.cost)) return 'Not enough money.';
    const b = where === 'seat' ? seatB() : cityB(S.cities[S.gyms[where].city]);
    const ex = b.find(x => x.k === k); if (ex) ex.lv++; else b.push(k === 'lane' ? { k, lv: 1, src: (NEIGHBOURS[S.region] || [0])[0] } : { k, lv: 1 });
    if (ck.restore) addRuin(where === 'seat' ? 'seat' : S.gyms[where].city, k, -1);
    const name = where === 'seat' ? seatPlace() : townName(where);
    if (where !== 'seat') { const c = S.cities[S.gyms[where].city]; c.spent = c.spent || {}; c.spent[cityLg()] = (c.spent[cityLg()] || 0) + ck.cost; addStanding(c, ck.cost / STAND_SPEND); }
    book(-ck.cost, 'building', `${UPGRADES[k].name} ${ck.lv > 1 ? `to level ${ck.lv}` : 'built'} in ${name}${ck.restore ? ' (restored)' : ''}`);
    news(`The League ${ck.restore ? `restored its ${UPGRADES[k].name.toLowerCase()} in ${name}${ck.lv > 1 ? ` to level ${ck.lv}` : ''}` : ck.lv > 1 ? `raised its ${UPGRADES[k].name.toLowerCase()} in ${name} to level ${ck.lv}` : `built a ${UPGRADES[k].name.toLowerCase()} in ${name}`}.`, 'league');
    return null;
  });
}
// a gym moves to a city of the region where the League has no gym: the fee, and everything the League built in the
// old city is lost (the city keeps its size)
function moveGym(i, cityId, lg = ME()) {
  return inLeague(lg, () => {
    if (!booksOn()) return 'Money is off.';
    const g = S.gyms[i], to = S.cities[cityId];
    if (!g || !to || to.region !== S.region || S.gyms.some(x => x.city === cityId)) return 'That city is not free.';
    if (!canSpend(MOVE_FEE)) return 'Not enough money.';
    const from = S.cities[g.city], lost = cityB(from).length;
    from.b[cityLg()] = []; if (from.st) delete from.st[cityLg()];
    if (S.fin && S.fin.ruins) delete S.fin.ruins[from.id];
    g.city = cityId;
    book(-MOVE_FEE, 'building', `Moved ${from.name} Gym to ${to.name}`);
    const text = `${from.name} Gym moved to ${to.name}${lost ? `; what the League had built in ${from.name} is lost` : ''}.`;
    news(text, 'league'); noteChange(text);
    return null;
  });
}
// ---------- city standing, control and income (0.15.0, stage 4) ----------
// A League's standing in a city where it has a gym comes from what it spends there (a point per STAND_SPEND) and,
// each New Year, from how its gym held against the region's average (a point per percentage point); all standing then
// fades by STAND_FADE. The League with the most standing among those with a gym there controls the city (a tie keeps
// the controller). Each city with a gym earns CITY_INCOME a week by its size (slots); the controller takes
// CITY_CTRL_SHARE and the rest goes to the other Leagues with a gym there by their standing. All numbers provisional.
const STAND_SPEND = 2000, STAND_FADE = 0.25, CITY_INCOME = [250, 350, 500], CITY_CTRL_SHARE = 0.5;
// which Leagues have a gym in each city: { cityId: [league, …] }, read from every League without binding
function gymMap() {
  const out = {};
  for (let i = 0; i < nLeagues(); i++) { const L = i === (S.lg || 0) ? S : S.leagues[i]; for (const g of (L && L.gyms) || []) (out[g.city] = out[g.city] || []).push(i); }
  return out;
}
function addStanding(c, n, lg = cityLg()) { c.st = c.st || {}; c.st[lg] = Math.round(((c.st[lg] || 0) + n) * 10) / 10; }
const standing = (c, lg = cityLg()) => (c.st && c.st[lg]) || 0;
// the controlling League of city c (null if no gym there); lgs: the Leagues with a gym there
function cityCtrl(c, lgs) {
  if (!lgs || !lgs.length) return null;
  if (lgs.length === 1) return lgs[0];
  const best = Math.max(...lgs.map(i => standing(c, i)));
  return lgs.includes(c.ctrl) && standing(c, c.ctrl) >= best ? c.ctrl : lgs.find(i => standing(c, i) === best);
}
// the bound League's share of city c's weekly income
function cityShare(c, lgs, lg = cityLg()) {
  if (!lgs || !lgs.includes(lg)) return 0;
  const inc = CITY_INCOME[citySlots(c) - 1], ctrl = cityCtrl(c, lgs);
  if (lgs.length === 1) return inc;
  if (lg === ctrl) return Math.round(inc * CITY_CTRL_SHARE);
  const rest = lgs.filter(i => i !== ctrl), pos = rest.map(i => Math.max(0, standing(c, i))), tot = pos.reduce((a, b) => a + b, 0);
  return Math.round(inc * (1 - CITY_CTRL_SHARE) * (tot > 0 ? Math.max(0, standing(c, lg)) / tot : 1 / rest.length));
}
function cityIncome() { const m = gymMap(); return S.gyms.reduce((a, g) => a + cityShare(S.cities[g.city], m[g.city]), 0); }
// New Year, before the gyms' year is reset: standing from each gym's record against its region's average, fading,
// and control (news when it changes hands in a shared city)
function cityNewYear() {
  const held = g => g.w + g.l ? g.w / (g.w + g.l) : null, byRegion = {};
  eachLeague(() => S.gyms.forEach(g => { const h = held(g); if (h != null) (byRegion[S.region] = byRegion[S.region] || []).push(h); }));
  eachLeague(i => S.gyms.forEach(g => {
    const h = held(g), rs = byRegion[S.region] || []; if (h == null || !rs.length) return;
    addStanding(S.cities[g.city], (h - rs.reduce((a, b) => a + b, 0) / rs.length) * 100, i);
  }));
  const m = gymMap();
  for (const c of Object.values(S.cities)) {
    if (c.st) for (const k of Object.keys(c.st)) { if (!(m[c.id] || []).includes(+k)) delete c.st[k]; else c.st[k] = Math.round(c.st[k] * (1 - STAND_FADE) * 10) / 10; }
    const was = c.ctrl, now = cityCtrl(c, m[c.id]);
    c.ctrl = now;
    if (was != null && now != null && was !== now && (m[c.id] || []).length > 1) { const text = `The ${leagueName(now)} took control of ${c.name} from the ${leagueName(was)}.`; inLeague(now, () => { news(text, 'league'); noteChange(text); }); }
  }
}
// (0.16.0) what the bound League owns, at cost (its seat and the cities where it has a gym), and its weekly upkeep:
// UPKEEP of that a year, so a large estate costs to hold
function estateCost() { return myPlaces().filter(p => !p.none).reduce((a, p) => a + p.b.reduce((c, x) => c + builtCost(x), 0), 0); }
const upkeepWeek = () => Math.round(estateCost() * UPKEEP / YEAR_WEEKS);
// (0.16.0) the youth academy: each level raises a young prospect a year (in week ACADEMY_WEEK), a little better than
// an ordinary newcomer, who sets out on the League's circuit tagged as its own (t.academy = the League). The League
// pays them ACADEMY_PAY of the usual wage and they are ACADEMY_LOYAL likelier to take its offers. Stage 5 can later
// let a League send its own at other Leagues; nothing does yet.
const ACADEMY_WEEK = 20, ACADEMY_PAY = 0.85, ACADEMY_LOYAL = 0.25, ACADEMY_Q = 6;
const academyLv = () => S.seatB ? upLevel(S.seatB, 'academy') : 0;
const ownAcademy = t => !!t && t.academy != null && t.academy === (S.lg || 0);
function academyWeek() {
  if (S.week !== ACADEMY_WEEK) return;
  eachLeague(i => {
    if (lapsed()) return; // (0.18.0) a lapsed academy raises nobody
    for (let n = 0; n < academyLv(); n++) {
      const t = newTrainer({ age: ri(13, 16), quality: ri(36, 52) + ACADEMY_Q, role: 'prospect' });
      starterTeam(t, 9);
      t.academy = i;
      joinCircuit(t, i); t.rest = S.turn + ri(1, 3); t.early = 0;
      news(`${dn(t)} has come up through the ${S.lgName}'s youth academy and is setting out as a challenger.`, 'circuit', t.id);
    }
  });
}
// upgrade effects in the bound League
function homeEdge(where) { return lapsed() ? 1 : 1 + 0.015 * placeLv(where, 'feature'); }
function attractionIncome() { return myPlaces().filter(p => !p.none).reduce((a, p) => a + (p.b.find(x => x.k === 'attract') ? UPGRADES.attract.income[upLevel(p.b, 'attract') - 1] : 0), 0); }
// ---------- (0.20.0) legendary sites and sanctuaries ----------
// A gym city where a legendary appeared or was caught becomes a legendary site for SITE_YEARS (c.site = { sp, from, until },
// on the world's city object, so every League with a gym there shares it; a new legendary there renews it). A League with
// a gym in a site can build a Sanctuary there (a slot, 3 levels at the usual prices): it earns UPGRADES.sanct.income a week
// while the site lasts, an attraction's income after, and SANCT_PRESTIGE a level each New Year while the site lasts.
const SITE_YEARS = 10, SANCT_PRESTIGE = 1;
const siteOn = c => !!(c && c.site && S.season <= c.site.until);
function noteSite(gi, sp) {
  const g = S.gyms[gi]; const c = g && S.cities[g.city]; if (!c) return;
  const was = siteOn(c);
  c.site = { sp, from: was ? c.site.from : S.season, until: S.season + SITE_YEARS - 1 };
  if (!was) news(`${c.name} is now a legendary site, where ${sp} was found. Leagues with a gym there can build a Sanctuary until the end of Year ${c.site.until}.`, 'league');
}
function sanctIncome() { return myPlaces().filter(p => !p.none).reduce((a, p) => { const lv = upLevel(p.b, 'sanct'); return a + (lv ? (siteOn(p.c) ? UPGRADES.sanct.income : UPGRADES.attract.income)[lv - 1] : 0); }, 0); }
// sanctuary levels at live sites, for prestige
function sanctLevels() { return myPlaces().filter(p => !p.none && siteOn(p.c)).reduce((a, p) => a + upLevel(p.b, 'sanct'), 0); }
const scoutLv = () => S.seatB && !lapsed() ? upLevel(S.seatB, 'scout') : 0;
// where a member of staff works, for the training hall: their gym, or the seat
function hallLv(t) { const p = postOf(t); if (!p) return 0; return p.post === 'e4' || p.post === 'champion' ? placeLv('seat', 'hall') : placeLv(p.slot, 'hall'); }
// ---------- the paid banlist (League 0) ----------
// Any family seen on the circuit in the meta log can be banned, in any week, for 1 to 3 years; the price per year
// rises with its meta rank (×3 for the top, down to ×1). Up to BAN_PAID_MAX at once; a lapsed ban protects the family
// for BAN_PROTECT years. Bans bind both sides, as before.
function banProtected(sp) { return (S.banProt || []).find(p => p.members.includes(sp) && p.until > S.turn) || null; }
function banCands() {
  const agg = {};
  for (const mo of S.metaLog || []) for (const [sp, a] of Object.entries(mo.agg || {})) { const x = agg[sp] = agg[sp] || [0, 0, 0]; x[0] += a[0]; x[1] += a[1]; x[2] += a[2]; }
  const rows = Object.entries(agg).filter(([sp, a]) => SP[sp] && a[0] >= META_MIN_B).sort((x, y) => y[1][1] / y[1][0] - x[1][1] / x[1][0] || y[1][2] / y[1][0] - x[1][2] / x[1][0]);
  const out = [], used = new Set();
  for (const [sp, a] of rows) {
    const mem = banMembers(sp); if (mem.some(x => used.has(x))) continue; mem.forEach(x => used.add(x));
    out.push({ sp, members: mem, b: a[0], ko: +(a[1] / a[0]).toFixed(2), banned: !!banOf(sp, 0), prot: banProtected(sp) });
  }
  const n = Math.max(1, out.length - 1);
  out.forEach((c, r) => { c.rank = r + 1; c.price = Math.round(BAN_PRICE * (3 - 2 * r / n) / 500) * 500; });
  return out;
}
function paidBans() { return (S.bans || []).filter(b => b.until != null); }
function payBan(sp, len, lg = ME()) {
  return inLeague(lg, () => {
    if (!booksOn()) return 'Money is off.';
    len = Math.round(len); if (!(len >= 1 && len <= 3)) return 'A ban lasts 1 to 3 years.';
    const c = banCands().find(x => x.sp === sp); if (!c) return 'Not seen on your circuit.';
    if (c.banned) return 'Already banned.';
    if (c.prot) return `Protected until ${turnDate(c.prot.until)}.`;
    if (paidBans().length >= BAN_PAID_MAX) return `At most ${BAN_PAID_MAX} bans at once.`;
    const cost = c.price * len; if (!canSpend(cost)) return 'Not enough money.';
    S.bans = S.bans || []; S.banLog = S.banLog || [];
    S.bans.push({ sp, members: c.members, season: S.season, len, until: S.turn + len * YEAR_WEEKS, paid: cost });
    const bc = banCounts(); bc[sp] = (bc[sp] || 0) + 1;
    S.banLog.unshift({ season: S.season, sp, act: 'ban', len, paid: cost });
    book(-cost, 'bans', `Banned ${sp} for ${len} year${len === 1 ? '' : 's'}`);
    const text = `The ${S.lgName} banned ${sp}${c.members.length > 1 ? ` (and ${c.members.filter(s => s !== sp).join(', ')})` : ''} until ${turnDate(S.turn + len * YEAR_WEEKS)}.`;
    news(text, 'league'); noteChange(text);
    enforceBans();
    return null;
  });
}
// paid bans run out on their own date; the family is then protected
function expirePaidBans() {
  for (const b of paidBans().filter(z => z.until <= S.turn)) {
    S.bans = S.bans.filter(z => z !== b);
    (S.banLog = S.banLog || []).unshift({ season: S.season, sp: b.sp, act: 'lift', len: b.len, limit: true });
    S.banProt = (S.banProt || []).filter(p => p.until > S.turn);
    S.banProt.push({ sp: b.sp, members: b.members, until: S.turn + BAN_PROTECT * YEAR_WEEKS });
    news(`The ${S.lgName}'s ban on ${b.sp} is over; it can't be banned again until ${turnDate(S.turn + BAN_PROTECT * YEAR_WEEKS)}.`, 'league');
  }
}


// ---------- aims: how a rival League spends (0.15.0, stage 4) ----------
// Each League not staffed by hand has an aim, drawn at founding. It decides its steers (replacing the old simple rule),
// what it builds, whether it pays for bans (replacing the trainers' vote), and how it hires (rivalHire). A League keeps
// its aim at least AIM_MIN_YEARS; then one in the red turns money-maker, and a money-maker far ahead (AIM_RICH times the
// world's average) turns to a wall or to stars. All numbers are provisional.
const AIMS = {
  wall:  { name: 'Wall-builder',  text: 'Hires the best, counters the meta, builds gym features and pays for bans.', reserve: 60000, build: [['seat', 'feature'], ['gyms', 'feature'], ['gyms', 'sanct'], ['gyms', 'safari'], ['seat', 'hall'], ['gyms', 'lane'], ['seat', 'attract'], ['seat', 'academy']] },
  star:  { name: 'Star-maker',    text: 'Hires young, builds training halls, a youth academy and a scouting office; its staff are sought after.', reserve: 60000, build: [['seat', 'hall'], ['seat', 'academy'], ['gyms', 'sanct'], ['gyms', 'hall'], ['gyms', 'lane'], ['seat', 'scout'], ['gyms', 'safari'], ['seat', 'attract']] },
  money: { name: 'Money-maker',   text: 'Keeps wages down, builds attractions and holds a reserve.', reserve: 120000, build: [['seat', 'attract'], ['gyms', 'sanct'], ['gyms', 'attract'], ['seat', 'hall'], ['gyms', 'safari'], ['seat', 'academy']] },
};
const AIM_KEYS = Object.keys(AIMS), AIM_MIN_YEARS = 3, AIM_RICH = 2.5, AIM_BAN_ODDS = 0.25;
// (0.16.0) what a rich rival League does with its money besides building: bids over the asking pay when it hires
// (25% with AIM_BID[0] spare above its reserve, 50% with AIM_BID[1]), and at New Year, with AIM_UPGRADE spare, it
// replaces its weakest Elite Four member or Gym Leader with someone UPGRADE_EDGE OVR better, bidding 50% (severance paid)
const AIM_BID = [150000, 400000], AIM_UPGRADE = 300000, UPGRADE_EDGE = 6;
function aimBid() {
  const f = S.fin; if (!f || !f.aim || f.money < 0) return 0;
  const spare = f.money - AIMS[f.aim].reserve;
  return spare >= AIM_BID[1] ? 0.5 : spare >= AIM_BID[0] ? 0.25 : 0;
}
// last year's running balance (income less wages and running costs, not purchases): what a League can afford to add in upkeep
function runningNet() {
  const y = S.fin.last || S.fin.yr; if (!y) return 0;
  const sum = o => Object.values(o).reduce((a, b) => a + b, 0);
  return sum(y.in) - (sum(y.out) - (y.out.building || 0) - (y.out.bans || 0) - (y.out.ranchbuy || 0) - (y.out.trips || 0) - (y.out.signing || 0) - (y.out.severance || 0));
}
function aimUpgrade() {
  const f = S.fin; if (!f || !f.aim || fixedStaff() || f.money - AIMS[f.aim].reserve < AIM_UPGRADE) return;
  const ok = t => t && !t.acting && t.stepDown == null && !t.quit && !founderChamp(t);
  const e4 = S.e4.map((id, k) => ({ t: T(id), k })).filter(x => ok(x.t)).sort((a, b) => ovr(a.t) - ovr(b.t))[0];
  const gym = S.gyms.map((g, i) => ({ t: T(g.leader), i })).filter(x => ok(x.t) && !S.gyms[x.i].acting).sort((a, b) => ovr(a.t) - ovr(b.t))[0];
  for (const w of [e4, gym]) {
    if (!w) continue;
    const post = w.k != null ? 'e4' : 'leader', old = w.t;
    const c = rivalHire(Math.max(post === 'e4' ? E4_HIRE_MIN : GYM_HIRE_MIN, ovr(old) + UPGRADE_EDGE), [old.id], post, 0.5);
    if (!c) continue;
    const was = postName(old);
    if (post === 'e4') S.e4[w.k] = null; else S.gyms[w.i].leader = null;
    closePost(old); severance(old, was); old.letGoAt = S.turn;
    const fate = retireOrReturn(old, `was replaced as ${was} by a better-paid newcomer`);
    const back = c.role === 'retired', away = STAFF_ROLES.includes(c.role), from = away ? leagueName(homeLeague(c)) : null;
    if (back) unretire(c);
    if (away) leaveForPost(c, S.lgName);
    S.challengers = S.challengers.filter(x => x !== c.id);
    installElite(c, post, post === 'e4' ? w.k : w.i);
    if (post === 'leader') staffGym(w.i);
    const text = `The ${S.lgName} paid over the odds to bring in ${dn(c)}${away ? ` from the ${from}` : back ? ' out of retirement' : ''} as ${postName(c)}, replacing ${old.name}, who ${fate === 'retired' ? 'retired' : 'returns to the circuit'}.`;
    news(text, 'move', c.id); noteChange(text);
    return;
  }
}
const pickAim = () => { const r = rand(); return r < 0.4 ? 'wall' : r < 0.7 ? 'star' : 'money'; };
const aimOf = () => (S.fin && S.fin.aim) || null;
// once a month in a rival League: steers by aim, then at most one purchase
function aimMonth() {
  const aim = aimOf();
  if (!aim || aim === 'wall') rivalSteers();
  else { const st = steerState(); st.line = 'bal'; st.posts = {};
    // a star-maker lets its gyms build freely and has only its Elite Four and Champion counter the year
    if (aim === 'star') { S.e4.forEach((id, k) => { if (answersOnType(T(id), 'year')) st.posts['e4:' + k] = 'year'; }); if (answersOnType(T(S.champion), 'year')) st.posts.champion = 'year'; } }
  if (aim && S.fin.money < 0) aiSell(); // (0.18.0) in the red, one building level sold a month
  if (aim) { aimRanch(aim); aimSpend(aim); } // (0.25.0) the ranch first
}
function aimSpend(aim) {
  const f = S.fin, A = AIMS[aim], lg = S.lg || 0;
  if (f.money < 0) return;
  const spare = f.money - A.reserve;
  if (aim === 'wall' && paidBans().length < BAN_PAID_MAX && rand() < AIM_BAN_ODDS) {
    const c = banCands().find(x => !x.banned && !x.prot && x.rank <= 3);
    if (c && spare >= c.price + UP_COST[0]) { payBan(c.sp, 1, lg); return; }
  }
  // (0.16.0) never take on more upkeep than last year's running balance can carry (attractions pay their own way)
  const net = runningNet();
  for (const [w, k] of A.build) {
    const spots = w === 'seat' ? ['seat'] : S.gyms.map((_, i) => i).reverse();
    for (const where of spots) { const ck = buildCheck(where, k); if (!ck.why && ck.cost <= spare && (k === 'attract' || k === 'sanct' || net >= ck.cost * UPKEEP)) { build(where, k, lg); return; } }
  }
}
// New Year in a rival League: a change of aim when the books call for it
// (0.16.0) a League in the red turns money-maker at once, and only until it is back above a money-maker's reserve,
// when it goes back to its old aim (f.prevAim); a money-maker by choice keeps the old rule (rich after three years)
function aimNewYear() {
  const f = S.fin; if (!f || !f.aim) return;
  aimUpgrade();
  let to = null;
  if (f.money < 0 && f.aim !== 'money') { f.prevAim = f.aim; to = 'money'; }
  else if (f.prevAim && f.money >= AIMS.money.reserve) { to = f.prevAim; f.prevAim = null; }
  else if (!f.prevAim && f.aim === 'money' && S.season - (f.aimAt || 0) >= AIM_MIN_YEARS && f.money > AIM_RICH * Math.max(START_FUND, S.moneyAvg || 0)) to = rand() < 0.5 ? 'wall' : 'star';
  if (!to) return;
  f.aim = to; f.aimAt = S.season;
  const text = `The ${S.lgName} has a new aim: ${AIMS[to].name.toLowerCase()}.`;
  news(text, 'league'); noteChange(text);
}
// ================= STAGE 5: SPONSORED CONTENDERS AND LEAVING YOUR LEAGUE (0.17.0) =================
// Design doc 5.8. A League can send challengers at another League as its contenders: its own academy prospects, or a
// challenger from its own circuit it signs (who can turn it down, like an offer). A contender runs only at the target
// for a contract of SPON_YEARS (renewable): no League moves, and nobody else can hire them or seat them after a deep
// run. The sponsor pays a weekly stipend; the target still gets their entry fees; the sponsor collects a bounty from
// the target's money for each title they win there (a smaller one for each run that reaches the Elite Four). The
// sponsor can recall them, or hire them back. Rival Leagues send by their aim. The multi-year sim sends nobody for the
// player and renews nothing. All numbers are provisional.
const SPON_YEARS = 2, SPON_MAX = 4, SPON_BASE = 60, SPON_BOUNTY = 40000, SPON_E4_BOUNTY = 5000, SPON_ACCEPT = 0.6, SPON_RENEW_WEEKS = 24;
const SPON_AIM = { star: 3, wall: 2, money: 1 }, SPON_AIM_SPARE = 50000, SPON_AIM_ODDS = 0.5, SPON_AIM_OVR = 60;
const sponStipend = t => Math.round(SPON_BASE * Math.pow(ovr(t) / 60, 2));
const sponIds = () => (S.spons = (S.spons || []).filter(id => T(id) && T(id).spon));
// the contenders League lg has out (default: the bound League), and those sent at it
const contendersOf = lg => sponIds().map(T).filter(t => t.spon.lg === (lg == null ? (S.lg || 0) : lg));
const contendersAt = lg => sponIds().map(T).filter(t => t.spon.to === (lg == null ? (S.lg || 0) : lg));
// who the bound League could send now: challengers on its own circuit, its own academy prospects first
function sendCands() {
  if (nLeagues() < 2 || fixedStaff()) return [];
  return challengers().filter(t => t && t.role === 'challenger' && !t.spon && !t.hired && !t.hireDue && !t.leaving && t.age >= 13)
    .sort((a, b) => (ownAcademy(b) - ownAcademy(a)) || ovr(b) - ovr(a));
}
const sponTargets = () => Array.from({ length: nLeagues() }, (_, i) => i).filter(i => i !== (S.lg || 0) && !(S.founding && i === ME()));
// does a challenger take the bound League's sponsorship? Its own academy prospects always do
function acceptsSponsor(t) {
  if (ownAcademy(t)) return true;
  let p = SPON_ACCEPT;
  if (t.age < 20) p += 0.1;
  if (t.grudge != null) p -= 0.3;
  if ((t.titleSeasons || []).length) p -= 0.15;
  p += prestigePull(); // (0.18.0) trainers prefer a prestigious League
  return rand() < clamp(p, 0.1, 0.95);
}
// the bound League sends t at League `to`: 'ok' (resting: they go at once), 'later' (out on a run: they go when it
// ends), or why not
function sendContender(id, to) {
  const t = T(id), me = S.lg || 0;
  if (!t || !sendCands().includes(t)) return 'They can\'t be sent.';
  if (!sponTargets().includes(to)) return 'Not a League you can send at.';
  if (contendersOf(me).length >= SPON_MAX) return `At most ${SPON_MAX} contenders at once.`;
  if (S.fin && S.fin.money < 0) return 'Not while the League is in the red.';
  if (!canOffer(t)) return `${t.name} turned you down lately.`;
  if (!acceptsSponsor(t)) { t.refusedAt = S.turn; return 'refused'; }
  const later = t.rest == null;
  t.spon = { lg: me, to, at: S.turn, until: S.turn + SPON_YEARS * YEAR_WEEKS, earned: 0, paid: 0, runs: 0, best: 0, e4: 0, titles: 0, pending: later ? 'send' : null, yr: null };
  (S.spons = S.spons || []).push(t.id);
  news(`${dn(t)} signed as the ${S.lgName}'s contender against the ${leagueName(to)}${later ? ', going once their run is over' : ''}.`, 'move', t.id);
  if (!later) { shiftLeague(t, to); t.rest = Math.max(t.rest, S.turn + 1); }
  return later ? 'later' : 'ok';
}
// this year's tally of a contract (for the year report)
function sponYr(s) { if (!s.yr || s.yr.season !== S.season) s.yr = { season: S.season, runs: 0, best: 0, e4: 0, titles: 0, earned: 0 }; return s.yr; }
// money between the two Leagues: the target pays, the sponsor collects
function sponBounty(t, amt, what) {
  const s = t.spon, y = sponYr(s);
  const text = `${t.name}, the ${leagueName(s.lg)}'s contender, ${what} at the ${leagueName(s.to)}: a bounty of ${money(amt)}.`;
  inLeague(s.to, () => { if (S.fin) book(-amt, 'bounties', text); });
  inLeague(s.lg, () => { if (S.fin) book(amt, 'bounties', text); });
  s.earned += amt; y.earned += amt;
  if (what === 'won the title') news(text, 'title', t.id);
}
// a contender's run at the target ended (stage as in endRun: null out on a third loss, 0 to 4 Elite Four members
// beaten, 5 the title)
function sponRun(t, stage, depth) {
  const s = t.spon; if (!s || s.pending === 'send' || lgOf(t) !== s.to) return;
  const y = sponYr(s);
  s.runs++; y.runs++; s.best = Math.max(s.best, depth); y.best = Math.max(y.best, depth);
  if (stage != null) { s.e4++; y.e4++; sponBounty(t, SPON_E4_BOUNTY, 'reached the Elite Four'); }
  if (stage === 5) { s.titles++; y.titles++; sponBounty(t, SPON_BOUNTY - SPON_E4_BOUNTY, 'won the title'); }
}
// between runs: a contender waiting to be sent goes; one recalled, or whose contract is over, comes home (an AI
// sponsor renews a contract that paid its way). True if they moved.
function sponMove(t) {
  const s = t.spon; if (!s) return false;
  if (s.pending === 'send') { s.pending = null; shiftLeague(t, s.to); return true; }
  if (s.pending !== 'home' && S.turn >= s.until && !inLeague(s.lg, () => playerLeague()) && (s.e4 > 0 || s.earned >= s.paid) && inLeague(s.lg, () => S.fin && S.fin.money > SPON_AIM_SPARE)) {
    s.until = S.turn + SPON_YEARS * YEAR_WEEKS; return false;
  }
  if (s.pending === 'home' || S.turn >= s.until) { endContract(t, s.pending === 'home' ? 'recalled' : 'contract over'); shiftLeague(t, homeAcademy(t)); return true; }
  return false;
}
const homeAcademy = t => t.sponFrom != null ? t.sponFrom : lgOf(t);
// the contract ends: kept for this year's report
function endContract(t, why) {
  const s = t.spon; if (!s) return;
  t.sponFrom = s.lg;
  (S.sponEnded = S.sponEnded || []).push({ id: t.id, lg: s.lg, to: s.to, yr: sponYr(s), why, titles: s.titles, earned: s.earned });
  (t.sponHist = t.sponHist || []).push({ lg: s.lg, to: s.to, from: s.at, end: S.turn, titles: s.titles, e4: s.e4, earned: s.earned });
  t.spon = null;
  if (why !== 'contract over' || T(t.id).role === 'challenger') news(`${dn(t)}'s contract as the ${leagueName(s.lg)}'s contender against the ${leagueName(s.to)} ended (${why}).`, 'move', t.id);
}
function recallContender(id) {
  const t = T(id); if (!t || !t.spon || t.spon.lg !== ME()) return false;
  if (t.spon.pending === 'send') { endContract(t, 'withdrawn'); t.sponFrom = null; return true; }
  t.spon.pending = 'home';
  if (t.rest != null) { sponMove(t); t.sponFrom = null; }
  return true;
}
const canRenew = t => !!(t && t.spon && t.spon.lg === ME() && !t.spon.pending && t.spon.until - S.turn <= SPON_RENEW_WEEKS);
function renewContender(id) { const t = T(id); if (!canRenew(t)) return false; t.spon.until += SPON_YEARS * YEAR_WEEKS; return true; }
// once a week, after the books: stipends, contracts that ended (a contender who retired or took a post), contenders
// resting who are due to move; and at the start of each month rival Leagues send by their aim
function sponsorWeek() {
  for (const id of sponIds()) {
    const t = T(id), s = t.spon;
    if (t.role !== 'challenger') { endContract(t, t.role === 'retired' ? 'retired' : 'took a post'); t.sponFrom = null; continue; }
    const pay = sponStipend(t);
    inLeague(s.lg, () => { if (S.fin) book(-pay, 'contenders'); });
    s.paid += pay;
    if (t.rest != null && (s.pending || S.turn >= s.until)) { if (sponMove(t)) { t.rest = Math.max(t.rest, S.turn + 1); if (!t.spon) t.sponFrom = null; } }
  }
  if (S.week % 4 === 0 && nLeagues() > 1 && !S.founding) eachLeague(() => { if (!playerLeague() && S.fin && S.fin.aim && !fixedStaff()) aimSponsor(); });
}
// (rival Leagues) a League sends up to SPON_AIM[aim] contenders: its academy prospects first, then the best of its
// circuit at OVR SPON_AIM_OVR or better, at a League where runs go further (richer ones first), with money to spare
function aimSponsor() {
  const f = S.fin, me = S.lg || 0, cap = SPON_AIM[f.aim] || 0;
  if (contendersOf(me).length >= cap || rand() >= SPON_AIM_ODDS) return;
  if (f.money - (AIMS[f.aim] ? AIMS[f.aim].reserve : 0) < SPON_AIM_SPARE) return;
  const c = sendCands().filter(t => t.rest != null && (ownAcademy(t) || ovr(t) >= SPON_AIM_OVR) && canOffer(t))[0];
  if (!c) return;
  const ease = leagueEase(), wealth = eachLeague(() => S.fin ? S.fin.money + estateCost() : 0);
  const to = sponTargets().sort((a, b) => (ease[b] + (wealth[b] > wealth[me] ? 0.05 : 0)) - (ease[a] + (wealth[a] > wealth[me] ? 0.05 : 0)))[0];
  if (to != null) sendContender(c.id, to);
}
// at New Year, after each League's history entry: each League's contenders that year (its own, and those sent at it)
function sponsorNewYear() {
  const rows = sponIds().map(T).map(t => ({ id: t.id, lg: t.spon.lg, to: t.spon.to, yr: sponYr(t.spon), why: null, titles: t.spon.titles, earned: t.spon.earned }))
    .concat((S.sponEnded || []).filter(r => r.yr && r.yr.season === S.season));
  S.sponEnded = [];
  eachLeague(i => {
    const h = S.history[S.history.length - 1]; if (!h) return;
    const row = r => [r.id, r.lg, r.to, r.yr.runs, r.yr.best, r.yr.e4, r.yr.titles, r.yr.earned, r.why];
    h.spon = { out: rows.filter(r => r.lg === i).map(row), at: rows.filter(r => r.to === i).map(row) };
  });
}

// ---------- leaving your League to found your own ----------
// The player can leave their League for a new one of their own: it costs LEAVE_FEE from the League's money (which must
// stay at or above zero), the League's prestige must be at PRESTIGE_BAR, and the world needs room (REGION_CAP;
// no world cap since 0.29.0). The League left carries on as a rival with an aim drawn as any other, keeping its money, buildings,
// staff, contracts and history. Up to LEAVE_TAKE members of staff who want promotion come along (not the Champion);
// the League refills their posts at once. Academy prospects on its circuit follow and take the new League's tag. The
// new League opens with START_FUND and is founded by hand on the founding screen, the staff who came already placed.
const LEAVE_FEE = 750000, LEAVE_TAKE = 3;
function leaveCheck() {
  if (!handOn() || S.founding) return { ok: false, why: 'Not now.' };
  return inLeague(ME(), () => {
    const prest = Math.round(S.prest || 0), regions = regionsWithRoom(), money0 = S.fin ? S.fin.money : 0;
    const why = !regions.length ? 'The world is full: no region has room for another League.' : prest < PRESTIGE_BAR ? `The ${S.lgName}'s prestige is ${prest} of the ${PRESTIGE_BAR} needed.` : money0 - LEAVE_FEE < 0 ? `It costs ${money(LEAVE_FEE)}; the ${S.lgName} has ${money(money0)}.` : null;
    return { ok: !why, why, prest, regions, fee: LEAVE_FEE, money: money0 };
  });
}
// staff of the player's League who could come along, and whether they would
function leaveTakers() {
  return inLeague(ME(), () => staffIds().map(T).filter(t => t && t.role !== 'champion' && !t.acting && !t.stepDown && !t.quit)
    .map(t => ({ t, post: postName(t), willing: !!(t.wish && t.wish.k === 'up') })).sort((a, b) => ovr(b.t) - ovr(a.t)));
}
function leaveLeague(region, takeIds = [], name = null) {
  const chk = leaveCheck(); if (!chk.ok) return chk.why;
  if (!chk.regions.includes(region)) return 'That region has no room.';
  const old = ME(), willing = new Set(leaveTakers().filter(x => x.willing).map(x => x.t.id));
  const take = takeIds.filter(id => willing.has(id)).slice(0, LEAVE_TAKE);
  const second = regionsUsed().includes(region), reg = LEAGUE_SETS[region];
  const lgName = String(name || '').replace(/[<>&"]/g, '').trim().slice(0, 30) || (second ? `${regionWord(region)} Founders League` : reg.name);
  inLeague(old, () => {
    book(-LEAVE_FEE, 'founding', `Paid ${money(LEAVE_FEE)} to leave the ${S.lgName} and found the ${lgName}.`);
    // settle what waits for the player: challenges go ahead, offers accepted are withdrawn, vacancies take an outsider
    approveAllChallenges();
    for (const t of Object.values(S.trainers)) if (t.hired) cancelIncoming(t.hired, 'the League changed hands');
    for (let n = 0; n < 30 && (S.vacancies || []).length; n++) {
      const v = S.vacancies[0], o = (v.outsiders || []).find(x => T(x) && T(x).role === 'prospect');
      if (!(o != null && fillVacancy(v, o)) && autoFillVacancy(v) !== true) S.vacancies.shift();
    }
    S.gyms.forEach((g, i) => { if (g.outs) flushGymOutsiders(i); });
    S.fin.aim = pickAim(); S.fin.aimAt = S.season; S.fin.prevAim = null;
    news(`The ${S.lgName} carries on without its founder at the helm, now run as a ${AIMS[S.fin.aim].name.toLowerCase()}.`, 'league');
  });
  S.vacancies = []; S.chalPending = []; S.distress = [];
  const i = nLeagues();
  S.leagues.push({ gyms: [], e4: [], champion: null, challengers: [], history: [], stats: { ko: {}, use: {} }, meta: null, region, lgName, seatName: second ? reg.seat2 : reg.seat, founder: null });
  if (S.cfg) S.cfg.leagues = nLeagues();
  S.me = i;
  // (0.27.0) someone a waiting challenge just moved out of their post stays behind
  // (0.29.0) and so does anyone moved out of their post by an earlier carried member's leaving (the old League refills at once)
  const carried = [];
  for (const t of take.map(T)) {
    const p = t && inLeague(old, () => postOf(t)); if (!p) continue;
    t.lastRole = p.post; t.carriedFrom = p.slot; leaveForPost(t, lgName); t.carried = true; carried.push(t);
  }
  const prospects = Object.values(S.trainers).filter(t => t.academy === old && t.role === 'challenger' && !t.spon && !t.hired && !t.hireDue).map(t => t.id);
  inLeague(i, () => { initBooks(); prepFounding({ mid: true, carry: carried.map(t => t.id), prospects }); });
  (S.myLeagues = S.myLeagues || [{ lg: old, from: 1 }]).push({ lg: i, from: S.season });
  S.lastOpen = S.season; S.leagueOpened = { i, season: S.season };
  news(`You left the ${leagueName(old)} to found the ${lgName}${carried.length ? `, bringing ${carried.map(t => t.name).join(', ')}` : ''}.`, 'league');
  return null;
}
// ================= 0.18.0: THE RED, SELLING AND FOLDING =================
// Design doc 5.9. In the red a League stops paying upkeep and its buildings lapse: attractions earn nothing, training
// halls, gym features, the scouting office and the youth academy stop working. Every DECAY_WEEKS unpaid in a row its
// costliest building level is lost; in a city shared with another League, an AI League with a gym there buys it at
// DISTRESS_SHARE of what that level would cost it (the seller gets the money). Any League can sell a building level
// at any time for SELL_SHARE of its price; an AI League in the red sells one a month. A League in the red at
// FOLD_YEARS New Years running, whose buildings sold at half could not clear its debt, folds: it is removed and the
// Leagues after it renumbered (removeLeague). If it was the player's, they found a fresh League by hand. All provisional.
const RESTORE_SHARE = 0.3;
const SELL_SHARE = 0.5, DISTRESS_SHARE = 0.3, DECAY_WEEKS = 24, FOLD_YEARS = 3, FOLD_QUIT_AGE = 30, FOLD_QUIT_EARLY = 2;
const lapsed = () => !!(S.fin && S.fin.money < 0);
// a place of the bound League: 'seat' or a gym index
function placeOf(where) {
  if (where === 'seat') return { b: seatB(), c: null, name: seatPlace() };
  const g = S.gyms[where], c = g && S.cities[g.city];
  return c ? { b: cityB(c), c, name: c.name } : null;
}
// every building's top level in the bound League (seat and gym cities), with what that level cost
function topLevels() {
  const out = [], spots = ['seat'].concat(S.gyms.map((_, i) => i));
  for (const where of spots) { const pl = placeOf(where); if (pl) for (const x of pl.b) if (x.lv > 0) out.push({ where, k: x.k, lv: x.lv, cost: upCost(x.k, x.lv - 1), name: pl.name }); }
  return out;
}
// take the top level off a building (the city's standing for it goes too); returns what that level cost
function dropLevel(pl, k) {
  const x = pl.b.find(y => y.k === k), cost = upCost(k, x.lv - 1);
  x.lv--; if (!x.lv) pl.b.splice(pl.b.indexOf(x), 1);
  if (pl.c) addStanding(pl.c, -cost / STAND_SPEND);
  if (lapsed()) addRuin(pl.c ? pl.c.id : 'seat', k, 1);
  return cost;
}
// (0.19.0) restoring: a building level a League lost while in the red (sold in the red, or lost to unpaid upkeep)
// leaves a ruin, kept in its books (S.fin.ruins, by place: a city id or 'seat', then by upgrade). Rebuilding that level
// there costs RESTORE_SHARE of its price, a gentle way back for a League that crashed. A level sold while solvent
// leaves none (selling pays more than restoring costs). A ruin goes when the level is restored, and when the gym
// leaves the city. Wealth still counts a restored level at its full price.
function addRuin(place, k, n) {
  const f = S.fin; if (!f) return;
  const R = f.ruins = f.ruins || {}, p = R[place] = R[place] || {};
  p[k] = Math.max(0, (p[k] || 0) + n); if (!p[k]) delete p[k];
  if (!Object.keys(p).length) delete R[place];
}
function ruinsAt(where, k) {
  const f = S.fin; if (!f || !f.ruins) return 0;
  const place = where === 'seat' ? 'seat' : S.gyms[where] ? S.gyms[where].city : null;
  return place != null && f.ruins[place] ? f.ruins[place][k] || 0 : 0;
}
const sellValue = (where, k) => { const pl = placeOf(where), lv = pl ? upLevel(pl.b, k) : 0; return lv ? Math.round(upCost(k, lv - 1) * SELL_SHARE) : 0; };
// what the bound League's buildings would fetch if all were sold (for folding)
const salvage = () => Math.round(estateCost() * SELL_SHARE);
function sellBuilding(where, k, lg = ME()) {
  return inLeague(lg, () => {
    if (!booksOn()) return 'Money is off.';
    const pl = placeOf(where), lv = pl ? upLevel(pl.b, k) : 0; if (!lv) return 'Nothing to sell.';
    const got = Math.round(dropLevel(pl, k) * SELL_SHARE), nm = UPGRADES[k].name.toLowerCase();
    book(got, 'sales', `Sold ${nm} level ${lv} in ${pl.name}`);
    news(`The ${S.lgName} sold ${lv > 1 ? `a level of its ${nm} in ${pl.name} (now level ${lv - 1})` : `its ${nm} in ${pl.name}`} for ${money(got)}.`, 'league');
    return null;
  });
}
// (AI) in the red: sell the costliest level, halls, features, the scouting office and the academy before attractions
function aiSell() {
  const x = topLevels().sort((a, b) => ((a.k === 'attract') - (b.k === 'attract')) || b.cost - a.cost)[0];
  if (x) sellBuilding(x.where, x.k, S.lg || 0);
}
// a distress sale: another League with a gym in the city (an AI League, not in the red, with money above its reserve
// and room to build) buys its next level of k there at DISTRESS_SHARE of that level's price. Returns { j, price } or null
function distressSale(where, k) {
  if (where === 'seat') return null;
  const me = S.lg || 0, c = S.cities[S.gyms[where].city], from = S.lgName, nm = UPGRADES[k].name.toLowerCase();
  // (0.19.0) the player is asked first: a rival's level in a city where the player has a gym is lost now and offered
  // to the player at the same price for DISTRESS_OFFER_WEEKS; the seller is paid only if the player buys
  if (distressOffer(me, c, k)) return null;
  for (const j of (gymMap()[c.id] || []).filter(j => j !== me)) {
    const price = inLeague(j, () => {
      const f = S.fin; if (!f || !f.aim || f.money < 0 || fixedStaff()) return 0;
      const gi = S.gyms.findIndex(g => g.city === c.id); if (gi < 0) return 0;
      const ck = buildCheck(gi, k); if (ck.why) return 0;
      const pr = Math.round(upCost(k, ck.lv - 1) * DISTRESS_SHARE);
      if (f.money - (AIMS[f.aim] ? AIMS[f.aim].reserve : 0) < pr) return 0;
      const b = cityB(c), ex = b.find(x => x.k === k); if (ex) ex.lv++; else b.push({ k, lv: 1 });
      c.spent = c.spent || {}; c.spent[j] = (c.spent[j] || 0) + pr; addStanding(c, pr / STAND_SPEND);
      book(-pr, 'building', `Bought a ${nm} level in ${c.name} from the ${from} at a distress sale`);
      return pr;
    });
    if (price) return { j, price };
  }
  return null;
}
// (0.19.0) distress offers to the player: S.distress (world-level, belongs to ME()) holds { city, k, lv, from, price,
// due, at }. Offered when a rival League (from) loses a level of k in a city where the player has a gym and could
// build that level; bought with buyDistress (the player pays the price, the seller receives it if it still exists),
// declined with declineDistress, gone when due. The multi-year sim buys nothing, so its offers lapse.
const DISTRESS_OFFER_WEEKS = 4;
function distressOffer(from, c, k) {
  if (!handOn() || S.founding) return false;
  const P = ME(); if (from === P || !(gymMap()[c.id] || []).includes(P)) return false;
  return inLeague(P, () => {
    if (!booksOn()) return false;
    const gi = S.gyms.findIndex(g => g.city === c.id); if (gi < 0) return false;
    const ck = buildCheck(gi, k); if (ck.why) return false;
    const price = Math.round(upCost(k, ck.lv - 1) * DISTRESS_SHARE), nm = UPGRADES[k].name.toLowerCase(), fromName = leagueName(from);
    (S.distress = S.distress || []).push({ city: c.id, k, lv: ck.lv, from, price, due: S.turn + DISTRESS_OFFER_WEEKS, at: S.turn });
    const text = `The ${fromName} can't keep up its ${nm} in ${c.name}. You can build that level there at a distress price of ${money(price)} until ${turnDate(S.turn + DISTRESS_OFFER_WEEKS)} (Cities page).`;
    news(text, 'league'); stopFor('money', text);
    return true;
  });
}
// the offers still open (anything that no longer fits is dropped)
function distressOffers() {
  S.distress = (S.distress || []).filter(o => o.due > S.turn);
  return S.distress.map((o, i) => ({ ...o, i, ...inLeague(ME(), () => { const gi = S.gyms.findIndex(g => g.city === o.city); const ck = gi < 0 ? { why: 'Your League no longer has a gym there.' } : buildCheck(gi, o.k); return { gi, why: ck.why || (ck.lv !== o.lv ? 'You have built there since.' : null) }; }) }));
}
function buyDistress(i) {
  const o = distressOffers()[i]; if (!o) return 'That offer has gone.';
  if (o.why) return o.why;
  const err = inLeague(ME(), () => {
    if (!canSpend(o.price)) return 'Not enough money.';
    const c = S.cities[o.city], b = cityB(c), ex = b.find(x => x.k === o.k); if (ex) ex.lv++; else b.push({ k: o.k, lv: 1 });
    c.spent = c.spent || {}; c.spent[cityLg()] = (c.spent[cityLg()] || 0) + o.price; addStanding(c, o.price / STAND_SPEND);
    book(-o.price, 'building', `Bought a ${UPGRADES[o.k].name.toLowerCase()} level in ${c.name} from the ${leagueName(o.from)} at a distress sale`);
    return null;
  });
  if (err) return err;
  if (o.from >= 0 && o.from < nLeagues()) inLeague(o.from, () => { if (S.fin) book(o.price, 'sales', `Distress sale: ${UPGRADES[o.k].name.toLowerCase()} in ${S.cities[o.city].name} to the ${leagueName(ME())}`); });
  news(`The ${leagueName(ME())} bought the ${leagueName(o.from)}'s ${UPGRADES[o.k].name.toLowerCase()} level in ${S.cities[o.city].name} for ${money(o.price)}.`, 'league');
  S.distress.splice(i, 1);
  return null;
}
function declineDistress(i) { const o = (S.distress || [])[i]; if (o) S.distress.splice(i, 1); }
// one building level lost to unpaid upkeep (sold at a distress price where someone buys it)
function decayOne() {
  const x = topLevels().sort((a, b) => b.cost - a.cost)[0]; if (!x) return;
  const pl = placeOf(x.where), sale = distressSale(x.where, x.k), nm = UPGRADES[x.k].name.toLowerCase();
  dropLevel(pl, x.k);
  let text;
  if (sale) { book(sale.price, 'sales', `Distress sale: ${nm} level ${x.lv} in ${pl.name} to the ${leagueName(sale.j)}`); text = `Unable to pay its upkeep, the ${S.lgName} lost ${x.lv > 1 ? 'a level of ' : ''}its ${nm} in ${pl.name} to the ${leagueName(sale.j)} at a distress price of ${money(sale.price)}.`; }
  else text = `Unable to pay its upkeep, the ${S.lgName}'s ${nm} in ${pl.name} ${x.lv > 1 ? `fell to level ${x.lv - 1}` : 'fell into ruin'}.`;
  news(text, 'league'); noteChange(text);
  if (playerLeague()) stopFor('money', text);
}
function decayWeek(lap) {
  const f = S.fin;
  if (!lap) { f.unpaid = 0; return; }
  f.unpaid = (f.unpaid || 0) + 1;
  if (f.unpaid % DECAY_WEEKS === 0) decayOne();
}
// New Year, after the year's books: count years in the red, and fold a League that can't come back
function foldNewYear() {
  const due = [];
  eachLeague(i => {
    const f = S.fin; if (!f) return;
    f.redYears = f.money < 0 ? (f.redYears || 0) + 1 : 0;
    if (f.redYears >= FOLD_YEARS && f.money + salvage() < 0) due.push(i);
    else if (f.redYears === FOLD_YEARS - 1 && playerLeague()) { const text = `The ${S.lgName} has been in the red at ${f.redYears} New Years running. One more, with debts its buildings can't cover, and it folds.`; news(text, 'league'); stopFor('money', text); }
  });
  if (due.length) foldLeague(due[0]);
}
// a League folds: buildings in shared cities sold at distress prices (the rest lost), contracts end, staff go to other
// circuits or retire, its challengers move on, and it is removed. The player whose League folded founds a new one.
function foldLeague(k) {
  const mine = handOn() && k === ME();
  const info = inLeague(k, () => ({ name: S.lgName, region: S.region, from: (S.history[0] || {}).season || 1, prest: Math.round(S.prest || 0) }));
  const staff = [], field = [];
  inLeague(k, () => {
    for (let n = 0; n < 300; n++) {
      const x = topLevels().sort((a, b) => b.cost - a.cost)[0]; if (!x) break;
      const sale = distressSale(x.where, x.k); dropLevel(placeOf(x.where), x.k);
      if (sale) book(sale.price, 'sales', `Distress sale on folding: ${UPGRADES[x.k].name.toLowerCase()} in ${x.name} to the ${leagueName(sale.j)}`);
    }
    for (const id of staffIds()) { const t = T(id); if (!t) continue; closePost(t); t.quit = null; t.acting = false; t.stepDown = null; t.role = 'free'; staff.push(t); }
    for (const id of S.challengers) { const t = T(id); if (t) field.push(t); }
    S.challengers = []; S.gyms.forEach(g => { g.leader = null; g.trainers = []; for (const o of g.outs || []) { const t = T(o); if (t && t.role === 'prospect') field.push(t); } g.outs = null; });
    S.e4 = []; S.champion = null;
  });
  for (const id of sponIds()) { const t = T(id); if (t.spon.lg === k || t.spon.to === k) { endContract(t, `the ${info.name} folded`); t.sponFrom = null; } }
  if (mine) {
    for (const v of S.vacancies || []) for (const o of v.outsiders || []) { const t = T(o); if (t && t.role === 'prospect') field.push(t); }
    S.vacancies = []; S.chalPending = []; S.distress = [];
    for (const t of Object.values(S.trainers)) if (t.hired) { t.hired = null; t.hireDue = false; t.bidMul = null; }
  } else S.chalPending = (S.chalPending || []).filter(x => !(x.from === 'rival' && x.lg === k));
  const text = `The ${info.name} has folded after ${FOLD_YEARS} years in the red${mine ? '. You will found a new League' : ''}.`;
  news(text, 'league'); noteChange(text);
  // the player's fresh start: a new League in a region with room (their old one first), founded by hand, fee waived
  let neu = null;
  if (mine) {
    // the old region always has room once the folded League is gone
    const region = info.region, second = regionCount(region) >= 2, reg = LEAGUE_SETS[region];
    neu = nLeagues();
    S.leagues.push({ gyms: [], e4: [], champion: null, challengers: [], history: [], stats: { ko: {}, use: {} }, meta: null, region, lgName: second ? `${regionWord(region)} Founders League` : reg.name, seatName: second ? reg.seat2 : reg.seat, founder: null });
  }
  removeLeague(k, info);
  if (mine) {
    neu--; S.me = neu;
    inLeague(neu, () => { initBooks(); prepFounding({ mid: true, carry: [], prospects: [] }); S.founding.fold = true; });
    (S.myLeagues = S.myLeagues || []).push({ lg: neu, from: S.season });
    S.leagueOpened = { i: neu, season: S.season };
    stopFor('money', text);
  }
  // staff past it retire; everyone else joins the emptiest circuit (not a League still being founded)
  const homes = Array.from({ length: nLeagues() }, (_, i) => i).filter(i => !(S.founding && i === ME()));
  // a folded League's older or struggling challengers (FOLD_QUIT_AGE+, or FOLD_QUIT_EARLY runs in a row ended early) retire
  // rather than crowd another circuit
  for (const t of staff.concat(field)) if (staff.includes(t) ? retiresOnLosingPost(t) : t.role === 'challenger' && !t.spon && (t.age >= FOLD_QUIT_AGE || (t.early || 0) >= FOLD_QUIT_EARLY)) { t.lg = homes[0] || 0; inLeague(t.lg, () => retireHere(t, `when the ${info.name} folded`)); }
  for (const t of staff.concat(field).filter(t => t.role !== 'retired')) {
    t.hired = null; t.hireDue = false;
    // nowhere else to go (the player's League was the only one): they wait and join the new League when it opens
    if (!homes.length) { t.role = 'free'; t.lg = ME(); (S.founding.after = S.founding.after || []).push(t.id); continue; }
    const to = eachLeague(i => ({ i, n: S.challengers.length })).filter(x => homes.includes(x.i)).sort((a, b) => a.n - b.n)[0].i;
    joinCircuit(t, to); t.rest = S.turn + ri(1, 4); t.early = 0;
  }
}
// (0.19.0) after your League folds, the fresh League's region can be chosen on the founding screen, before it opens:
// any region with room (not counting the fresh League itself). Its gym cities, name and seat follow the region.
function foldRegions() {
  if (!S.founding || !S.founding.fold) return [];
  const me = ME(), used = eachLeague(i => (i === me ? null : S.region));
  return regionOrder().filter(r => used.filter(x => x === r).length < REGION_CAP);
}
function foldRegion(r) {
  if (!foldRegions().includes(r)) return 'No room there.';
  return inLeague(ME(), () => {
    if (S.region === r) return null;
    const second = eachLeague(() => S.region).filter(x => x === r).length >= 1, reg = LEAGUE_SETS[r];
    S.region = r; S.lgName = second ? `${regionWord(r)} Founders League` : reg.name; S.seatName = second ? reg.seat2 : reg.seat;
    const cities = leagueCities();
    S.gyms.forEach((g, i) => { g.city = cities[i].id; });
    return null;
  });
}
// remove League k and renumber the Leagues after it everywhere they are referred to. Records of the folded League
// keep its name through S.folded (its old number becomes -1, -2, … : leagueName reads it)
function removeLeague(k, info) {
  if ((S.lg || 0) === k) useLeague(k === 0 ? 1 : 0);
  const F = S.folded = S.folded || []; F.push({ name: info.name, region: info.region, from: info.from, to: S.season, prest: info.prest });
  const gone = -F.length, rm = i => (i == null || i < 0) ? i : i === k ? gone : i > k ? i - 1 : i;
  const keys = o => { if (!o) return o; const out = {}; for (const [key, v] of Object.entries(o)) { const n = +key; if (Number.isNaN(n)) out[key] = v; else if (n !== k) out[rm(n)] = v; } return out; };
  S.leagues.splice(k, 1);
  S.lg = rm(S.lg || 0);
  const rmArr = (a, f = 'lg') => { for (const x of a || []) if (x && x[f] != null) x[f] = rm(x[f]); };
  for (const t of Object.values(S.trainers)) {
    if (t.lg != null) { t.lg = rm(t.lg); if (t.lg < 0) t.lg = 0; }
    if (t.academy != null) t.academy = t.academy === k ? null : rm(t.academy);
    if (t.sponFrom != null) t.sponFrom = t.sponFrom === k ? null : rm(t.sponFrom);
    if (t.leftLg != null) t.leftLg = rm(t.leftLg);
    if (t.grudgeLg != null) t.grudgeLg = rm(t.grudgeLg); // (0.23.0)
    if (t.founded) t.founded.lg = rm(t.founded.lg);
    if (t.spon) { t.spon.lg = rm(t.spon.lg); t.spon.to = rm(t.spon.to); }
    if (t.titleLgs) t.titleLgs = t.titleLgs.map(rm);
    rmArr(t.posts); rmArr(t.seasonHist); rmArr(t.awards); rmArr(t.greatLegends); rmArr(t.comebacks);
    rmArr(t.sponHist); rmArr(t.sponHist, 'to'); rmArr(t.lgMoves, 'from'); rmArr(t.lgMoves, 'to');
  }
  for (const c of Object.values(S.cities)) {
    if (c.spent && c.spent[k] != null) { c.spent.gone = (c.spent.gone || 0) + c.spent[k]; }
    c.st = keys(c.st); c.b = keys(c.b); c.spent = keys(c.spent);
    if (c.ctrl != null) c.ctrl = c.ctrl === k ? null : rm(c.ctrl);
  }
  rmArr(S.news); rmArr(S.myLeagues); rmArr(S.chalPending); rmArr(S.distress, 'from'); rmArr(S.hof); rmArr(S.hof, 'spon'); // (0.21.0) Hall entries keep a folded League's name
  for (const w of S.worldHist || []) { w.winnerLg = rm(w.winnerLg); w.runnerLg = rm(w.runnerLg); }
  const hists = [S.history].concat(S.leagues.map((L, i) => i === (S.lg || 0) ? null : L.history));
  for (const hs of hists) for (const h of hs || []) {
    if (h.spon) for (const r of (h.spon.out || []).concat(h.spon.at || [])) { r[1] = rm(r[1]); r[2] = rm(r[2]); }
    rmArr(h.chal);
  }
  if (S.me != null) S.me = rm(S.me);
  if (S.leagueOpened) S.leagueOpened = S.leagueOpened.i === k ? null : { ...S.leagueOpened, i: rm(S.leagueOpened.i) };
  S.easeAt = null; S.ease = null;
  if (S.cfg) S.cfg.leagues = nLeagues();
}
// (0.18.0) prestige draws trainers: offers and sponsorships from the bound League are up to PRESTIGE_PULL likelier
// to be taken at prestige 100, and a challenger choosing a League to move to leans PRESTIGE_DRAW per 100 prestige
const PRESTIGE_PULL = 0.06, PRESTIGE_DRAW = 0.3;
const prestOf = i => i === (S.lg || 0) ? (S.prest || 0) : ((S.leagues && S.leagues[i]) || {}).prest || 0;
const prestigePull = () => PRESTIGE_PULL * Math.min(1, (S.prest || 0) / 100);
