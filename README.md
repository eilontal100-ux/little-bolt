# Duneshade Warden

An original five-stage desert platformer with a cloaked human adventurer, sandstone tiles, market awnings, palace towers, scarabs, sand wraiths, and a Sun Colossus. Characters use authored pixel grids and distinct idle/run/jump/throw poses; the canvas is no longer downsampled to simulate pixel art.

The four exploration stages are Canyon Outskirts, Buried Cistern, Silk Bazaar, and Astral Palace (4,060–4,180 world units each), followed by the Sun Throne boss arena. Each exploration stage has three required sun seals, five gaps, elevated relic routes, moving platforms, enemy encounters and three checkpoints. There are 73 coins and eight optional relic fragments across the campaign. The extra sections add objectives and encounters; no playtime claim has been verified.

## Run

```sh
npm ci
npm start
```

Open http://localhost:3000. This single-file Node/Express app listens on `process.env.PORT || 3000` at `0.0.0.0`. No external assets, fonts, accounts or database are required.

## Play

- Move: arrows or A/D. Jump: Space/W; hold for height, release for a short hop.
- Throw a returning glaive: C/K or the phone THROW button. It defeats scarabs/wraiths and lights sun seals. One glaive at a time; it returns automatically and can pass through terrain.
- Light all three seals before reaching each stage gate. Climb the bright-edged ledges to reach the upper seals. HUD tracks the seal count. Select Next Stage after completing the objective.
- Dash: Shift/X or DASH, with a 0.9-second cooldown. Dash is not invulnerability.
- Fullscreen: button or F. Escape exits. Unsupported/rejected fullscreen uses a reversible expanded view.
- Shield absorbs one enemy hit, not a fall. Double jump grants a second air jump for 12 seconds. Optional upper routes hold relic fragments.
- Checkpoints preserve lit seals, collected items, defeated enemies and boss damage when losing a life. Throws clear on death. Stage transitions reset seals and powers; a new campaign resets everything.
- Sun Colossus: evade the telegraphed charge, then throw or stomp while its core is gold. Three hits win. Contact during charging costs a life.
- Mobile has independent direction, THROW, DASH and JUMP buttons for simultaneous touches.

## Verification

`npm test` covers movement, required gap crossing, seal-ledges, glaive hits/return, locked exits, reset behavior, boss vulnerability, fullscreen fallback, and server startup. The browser integration script (`npm run test:browser`) uses Playwright and controlled positions for seal/transition checks; it is not an end-to-end unassisted playthrough. Run it only in an environment authorized to launch an isolated browser.

For this update, 37 automated checks passed and the mounted browser rendered the desktop game successfully. The legacy Playwright browser suite has been updated but was not rerun because this session uses mounted browser tools. Independent review is unavailable: Pixel's implementation timed out and the team handoff lifetime limit blocked further requests. Physical phone/Safari and overall campaign playtime remain unverified.

Research used [Shovel Knight](https://old.yachtclubgames.com/shovel-knight-treasure-trove/) and [Eastward](https://chucklefish.org/blog/eastward-launches-today-on-xbox-game-pass/) as references for silhouettes, architectural detail, readable foregrounds and objectives. All shipped sprites are original. See `PIXEL-REFERENCE-NOTES.md` and `PIXEL-DIRECTIONS.md` for research and concepts; those concept documents include mechanics beyond the implemented scope.

## Deploy

`render.yaml` uses `npm ci`, `npm start`, and health check `/`. Merge the pull request, then deploy on Render. Reloading restarts the campaign; no persistence or audio is implemented.
