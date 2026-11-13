# Pokémon League Builder

A fan-made Pokémon League sim in which you run the League: eight gyms, the Elite Four and the Champion. The aim is to let no challenger through.

It is a fork of Pokémon League GM, seeded from version 2.0.2. Version 0.1.0 is the seed: the source with the team-management systems removed. The world runs on its own and the player doesn't control a League yet. Version 0.2.0 adds the wall rules: set-level battles, three tries per gym, gym trainers, and a Champion who keeps the seat. Version 0.3.0 takes a gym's type from its leader's class and has staff build their own teams from their ratings.

- `game/`: the source pieces and `build.py`
- `tests/`: checks to run before pushing
- `CLAUDE.md`: how to work on this repo

Build: `python3 game/build.py game dist` makes `dist/Pokémon League Builder.html` (the whole game in one file) and an itch.io zip.

Pokémon League Builder is an unofficial, fan-made game. It is not affiliated with, endorsed, sponsored or approved by Nintendo, Creatures Inc., GAME FREAK inc. or The Pokémon Company.
