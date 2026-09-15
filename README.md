# Moonlight Courier

Carry a lost star through a moonlit alien forest to its altar. One expanded level spans Landing Glade, Mushroom Canopy, and Crystal Hollow, with six gaps, six patrolling sentries, 32 coins, three optional star fragments, and two safe checkpoint beacons. All artwork is original procedural canvas drawing; no external assets, fonts, audio, accounts, database, or saved progress.

## Run

```sh
npm install
npm start
```

Open http://localhost:3000. `PORT=8080 npm start` uses port 8080. The server binds to `0.0.0.0`.

## Controls

- Move: Left/Right arrows or A/D.
- Jump: Space or W. Hold for height and distance; tap for a short hop. Jump presses are buffered for 120ms before landing, with 100ms grace after leaving a ledge. Release before jumping again.
- Phone: hold either direction and press JUMP with another finger.
- Carry the star to the glowing altar to win. Both ending buttons start a fully fresh game.

## Implementation

`server.js` contains Express and all HTML, CSS, canvas drawing, inputs, and gameplay JavaScript. Physics use a fixed 1/120-second step, capped catch-up after stalls, axis-separated solid collisions, and world coordinates independent of screen size. The maximum level-ground jump range is approximately 210 world units; required gaps are 130–190 units, all tested without power-ups. The first floating platforms are 110 units high; higher platforms form optional routes.

Coin, fragment, pickup, and defeated-enemy progress survives life loss. Activated beacons at x=1610 and x=3320 set a safe respawn point. A cyan shield absorbs one enemy hit, but never a fall. Gold Starleap pickups at x=3380 and x=4180 grant a 12-second double jump, with a visible countdown; one air jump refreshes on landing and the timer clears on death. The final high fragment route uses Starleap. Restart recreates all gameplay state, clears held keys and pointers, and resets timers without adding listeners or animation loops. Focus loss clears input and accumulated time. Everything stays in browser memory.

## Upgrade verification

20 automated checks cover physics, server ports, all required jumps, checkpoints, shield use, double-jump limits/expiry, short hops, coyote time, jump buffering, and fresh resets. Browser checks cover a complete keyboard playthrough plus desktop, portrait, landscape, and multi-touch behavior. Pixel review is tracked separately and is not implied by these checks.

## Verify

```sh
npm test
npm run test:browser
```

The browser tests use headless installed Google Chrome. Alternatively install Playwright Chromium (`npx playwright install chromium`) and set `PLAYWRIGHT_CHANNEL=chromium`. Screenshots go into ignored `test-results/`. Tests cover desktop/phone rendering, keyboard, simultaneous real touch events, release/cancellation, focus loss, a full keyboard playthrough, and both restart buttons. The deterministic test page exposes state via request interception only; no debug API is shipped in the actual game.

To check a deployed copy:

```sh
TEST_URL=https://YOUR-SERVICE.onrender.com npm run test:browser
```

Phone tests use Chrome device emulation; they do not certify physical iPhone/Safari behavior.

## Render

`render.yaml` specifies a Node web service, free plan, install command `npm ci`, start command `npm start`, and health check `/`. Deploy this repository as a Render Blueprint, or create a Node web service with those commands. No code changes or environment secrets are needed. Render supplies `PORT`.
