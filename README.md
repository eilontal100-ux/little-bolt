# Moonlight Courier — The Five Beacons

An original, compact five-stage browser platformer: Whispering Forest, Flooded Ruins, Wind Canopy, Star Observatory, and Guardian Spire. Carry the star through eight required gaps, collect 37 coins and four optional fragments, and defeat the guardian. Layered procedural scenery, an animated scarf-wearing courier, beetles, drones, moving platforms, checkpoints, shield and double-jump pickups are all self-contained.

## Run

```sh
npm install
npm start
```

Open http://localhost:3000. The single-file Node/Express server binds to `0.0.0.0` and uses `process.env.PORT || 3000`.

## Play

- Move: arrows or A/D. Jump: Space or W; hold for height, release for a short hop.
- Dash: Shift or X, with a 0.9-second cooldown. Dash does not grant invulnerability or damage enemies.
- Phone: independent direction, DASH, and JUMP buttons support simultaneous touches.
- Jump onto enemies from above. Side contact costs a life. A shield absorbs one hit, but not a fall.
- Starleap grants one extra air jump for 12 seconds. Checkpoints preserve collectibles and defeated enemies when you respawn.
- Reach each star gate and choose Next Stage. Campaign totals and remaining lives carry forward; powers and checkpoints reset per stage.
- Guardian: red warns of a charge; evade it, then stomp its crown when cyan. Three successful stomps win. Boss damage persists across life loss. Both ending buttons restart the whole campaign.

## Verify

```sh
npm test
npm run test:browser
```

Unit/server checks cover movement, collisions, all required gaps without powers, checkpoint and campaign transitions, dash cooldown/wall collisions, moving-platform carry, power-ups, guardian phases/stomps, and restart behavior. The browser suite uses an isolated headless installed Google Chrome and checks desktop/phone layouts, real CDP multitouch, keyboard controls, a five-stage keyboard playthrough including the guardian, and both restart buttons. Screenshots are written to `test-results/`.

Set `PLAYWRIGHT_CHANNEL=chromium` to use installed Playwright Chromium. Set `TEST_URL` to check an already deployed copy. Browser test internals are injected only into an intercepted test response and are not shipped as a public debug API.

Physical iPhone/Safari has not been tested. This is a compact procedural-art campaign, not a commercial-length game. No audio, external assets, accounts, database, or persistent saves; reloading starts over. Pixel's independent review of this campaign is pending after its session limit. Earlier design documents describe previous iterations; this README describes the current implementation.

## Render

`render.yaml` configures `npm ci`, `npm start`, and health check `/`. Merge the campaign pull request into `main`, then deploy on Render. No secrets or code changes are required; Render supplies `PORT`.
