# Creature Call — The Skyheart Journey

An original creature-switching puzzle platformer: twelve expeditions across Mosslight Isles, Glasswater Coast, Copperfall Works and Aurora Heights. Hand-authored pixel sprites and scenery are embedded in a single Node/Express server; no external assets or game services are required.

## Play

```sh
npm install
npm start
```

Open http://localhost:3000. `PORT` overrides the 3000 fallback. Render can use `npm install` as build command and `npm start` as start command.

Move with arrows/A/D, jump with Space/W, use an ability with C/K, switch with Q/E or 1–6, and toggle fullscreen with F. Phone controls provide movement, jump, switch and ability buttons. Open **Map / Guide** to pause, revisit unlocked levels, or read the creature guide. The start screen offers **Play / return**, **Resume saved journey**, and a confirmed **New journey** action.

| Creature | Ability | Acquisition |
|---|---|---|
| Crag | Smash tall stone barriers | Starting companion |
| Glint | Hold ability while airborne in a powered wind current | Level 1 |
| Sprig | Grow lasting vine bridges at seed nodes | Level 1 |
| Cinder | Burn thorn walls | Level 4 |
| Floe | Freeze water into a temporary solid crossing | Level 5 |
| Volt | Charge relays powering matching lettered gates and wind | Level 6 |

The first three stages teach traversal. Later stages combine permanent terrain changes with temporary ice and linked electrical circuits. Timed obstacles can be retriggered; closing gates wait for an occupying player to leave. Every required obstacle must have been activated before its exit accepts completion. Upper platform routes contain optional relics.

Retries preserve the roster, collected items, checkpoints and permanent solutions, including after exhausting three energy/life points. Browser-local saves use a versioned key and restore at a checkpoint; temporary machinery expires on reload. Completed stages remain available from the map. New journey clears campaign progress only after confirmation. Save failures do not stop gameplay. Saves are local to the browser and site origin, not cloud synced; this expansion does not import the earlier three-stage build's progress.

## Artwork

`CREATURE-ART.js` contains six independently authored sprite grids with idle/run/jump/ability poses, four layered architectural backdrops, and region-specific terrain materials. `CREATURE-ART.html` is a standalone preview. The same art function is embedded in `server.js`; tests verify the source stays synchronized. Inspiration: readable creature silhouettes in handheld Pokémon games and ability progression/secrets in Super Mario World. No commercial sprites, characters, maps or music are included.

## Verification

```sh
npm test
```

Coverage includes deterministic movement, ability restrictions, physical bridge support, circuit power/expiration, safe gate closing, rescue ordering, campaign exit requirements, retries, saves, map access, inputs and fullscreen. A deterministic movement-input test completes all twelve stages from spawn without teleporting or losing a life. Automated traversal is not a substitute for a human difficulty/play-feel assessment.

Visual checks use the mounted OpenMausBot browser tools. Desktop and fixed portrait/landscape iframe viewports can be checked without changing the user's browser window. Real-device touch testing and independent teammate review are separate from the automated tests. The legacy `test/browser.cjs` is not used as evidence for this expansion.
