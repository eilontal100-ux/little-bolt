# Little Bolt

One small, original canvas platformer: cross three gaps, collect coins, stomp three patrol robots, and reach the flag. Three lives. No assets, audio, accounts, database, or saved progress.

## Run

```sh
npm install
npm start
```

Open http://localhost:3000. `PORT=8080 npm start` uses port 8080. The server binds to `0.0.0.0`.

## Controls

- Move: Left/Right arrows or A/D.
- Jump: Space or W, while grounded. Release before jumping again.
- Phone: hold either direction and press JUMP with another finger.
- Reach the flag to win. Both ending buttons start a fully fresh game.

## Implementation

`server.js` contains Express and all HTML, CSS, canvas drawing, inputs, and gameplay JavaScript. Physics use a fixed 1/120-second step, capped catch-up after stalls, axis-separated solid collisions, and world coordinates independent of screen size. The maximum level-ground jump range is approximately 210 world units; required gaps are 130, 150, and 140 units. Floating platforms are 110 units high, below the approximately 126-unit jump apex.

Coin and enemy progress survives life loss. Restart recreates all gameplay state, clears held keys and pointers, and resets timers without adding listeners or animation loops. Focus loss clears input and accumulated time. Everything stays in browser memory.

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
