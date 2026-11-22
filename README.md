# Midnight Vault — The Amber Heist

[![make.fun · best-heist-game-20261122-0559](https://make.fun/badge/best-heist-game-20261122-0559.svg)](https://make.fun/bounty/best-heist-game-20261122-0559?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)
[![rank](https://make.fun/badge/best-heist-game-20261122-0559/memelljk/best-heist-game-20261122-0559/rank.svg)](https://make.fun/bounty/best-heist-game-20261122-0559/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)
[![reward](https://make.fun/badge/best-heist-game-20261122-0559/memelljk/best-heist-game-20261122-0559/reward.svg)](https://make.fun/bounty/best-heist-game-20261122-0559?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)

A complete top-down heist game for the make.fun bounty
[best-heist-game-20261122-0559](https://make.fun/bounty/best-heist-game-20261122-0559).
One night, one museum room, one Amber Star. Cross the hall past four patrolling
guards and three sweeping cameras, steal the Star from its vault, and reach the
getaway door before the alarm meter fills.

Every screenshot shows the whole heist in one frame: the room the thief is
crossing, guards with red vision cones, wall cameras with orange cones, the
glowing loot, and the alarm meter in the HUD.

## How to play

- **WASD / arrow keys** — move
- **SHIFT** — sneak (slower, safer in cover)
- **Click** — walk to that spot
- **Q** — throw a noisemaker: the nearest guard leaves its patrol to investigate (2 per run, −75 score)
- **E** — EMP pulse: freezes every camera for 5 seconds (2 per run, −75 score)
- **P / ESC** — pause · **R** — retry

Three routes cross the room: the open main floor (fast, watched), the west
service corridor, and the north vent run behind the display cases. Green
dashed strips are cover — detection is slower there and the alarm drains
fast. The alarm rises while a cone sees you (a yellow warning first, then
SPOTTED), and only a full 100% — or walking into a guard — ends the run.
Grab the loot and the getaway door opens: escape for the loot points, a time
bonus, and +250 if you were never seen at all.

## Screenshots

Four real renders of the game running in a desktop browser
(`game/src/shots.js`, `?shot=cover|start|play|end&seed=1`):

1. **Cover** — the thief mid-room: guard cones, camera cones, the vault loot,
   green cover and the alarm meter, all in one frame.
2. **Start** — the title over the live, patrolling room.
3. **Play** — SPOTTED at 47% alarm, a noisemaker ticking in the east hall.
4. **End** — CLEAN GETAWAY: the Star taken, the thief at the open door.

## How it is built

- `game/index.html` — the page, a 1280×720 canvas, no network requests
- `game/src/config.js` — every tuning constant and colour in one place
- `game/src/world.js` — the room, routes, cover, patrols, cameras, alarm and score rules
- `game/src/input.js` — keyboard and mouse
- `game/src/render.js` — canvas drawing: cones, room, HUD, screens
- `game/src/audio.js` — synthesized WebAudio blips, no audio files
- `game/src/shots.js` — deterministic screenshot scenes (`?shot=…&seed=1`)
- `game/src/random.js` — seeded RNG (mulberry32)
- `game/src/main.js` — the loop and the screen state machine
- `main.ts` — the entrypoint (Node 22, standard library only): copies
  `game/` and `screenshots/` to the output directory and writes `dossier.json`

Play it locally:

```sh
node serve.ts
# open http://localhost:8080
```

Hand it in:

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

## License

MIT — see `LICENSE`.
