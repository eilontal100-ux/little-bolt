# Creature Call — The Skyheart Journey

An original creature-switching puzzle platformer: eighteen expeditions across Mosslight Isles, Glasswater Coast, Copperfall Works, Aurora Heights, the Underroot Reaches and The Last Circuit. Hand-authored pixel sprites and scenery are embedded in a single Node/Express server; no external assets or game services are required.

## Play

```sh
npm install
npm start
```

Open http://localhost:3000. `PORT` overrides the 3000 fallback. Render can use `npm install` as build command and `npm start` as start command.

Move with arrows/A/D, jump with Space/W, use an ability with C/K, switch with Q/E or 1–8, and toggle fullscreen with F. Phone controls provide movement, jump, switch and ability buttons. Open **Map / Guide** to pause, revisit unlocked levels, read the creature guide, or change **difficulty**. The start screen offers **Play / return**, **Resume saved journey**, and a confirmed **New journey** action.

| Creature | Ability | Acquisition |
|---|---|---|
| Crag | Smash tall stone barriers | Starting companion |
| Glint | Hold ability while airborne in a powered wind current | Level 1 |
| Sprig | Grow lasting vine bridges at seed nodes | Level 1 |
| Cinder | Burn thorn walls | Level 4 |
| Floe | Freeze water into a temporary solid crossing | Level 5 |
| Volt | Charge relays powering matching lettered gates and wind | Level 6 |
| Burrow | Dig through packed clay walls | Level 13 |
| Echo | Sing at crystal nodes to ring a permanent bridge into being | Level 14 |

The first three stages teach traversal. Later stages combine permanent terrain changes with temporary ice, linked electrical circuits, dug-out clay walls, sung crystal bridges and spike hazards. Timed obstacles can be retriggered; closing gates wait for an occupying player to leave. Reaching a stage's exit always completes it, even if a puzzle along the way was skipped — nothing gates the flag on a solved obstacle. Upper platform routes contain optional relics.

Spikes sit on solid ground with a jumpable width and a clear run-up; touching them costs a life the same way a fall does, and the same brief invulnerability window protects you from a second hit immediately after.

### Difficulty

Four modes — **Easy, Normal, Hard, Extra Hard** — are selectable from the map/menu and shown in the HUD. They scale the timer on machinery (relays, gates, freezing water), the number of lives before a checkpoint refill, and the invulnerability grace window after taking damage. Jump height, run speed, gravity and glide lift are identical on every mode, so no difficulty changes how the game feels to move — only how much time and error margin you're given. Difficulty can only be changed from the menu (never mid-run), which reloads the current stage and resets lives to the new mode's maximum, so there is no way to bank an easy-mode timer and switch to a harder mode mid-crossing. Your choice is saved with your progress; older saves without a stored difficulty default to Normal.

Retries preserve the roster, collected items, checkpoints and permanent solutions, including after exhausting all of a mode's energy/life points — no difficulty ever ends the campaign on death. Browser-local saves use a versioned key and restore at a checkpoint; temporary machinery expires on reload. Completed stages remain available from the map. New journey clears campaign progress only after confirmation. Save failures do not stop gameplay. Saves are local to the browser and site origin, not cloud synced; this expansion does not import the earlier three-stage build's progress.

## Artwork

`CREATURE-ART.js` contains independently authored sprite grids with idle/run/jump/ability poses, six layered architectural backdrops, and region-specific terrain materials. `CREATURE-ART.html` is a standalone preview. The same art function is embedded in `server.js`; tests verify the source stays synchronized. Burrow and Echo have original sprites; clay walls, crystal bridges and spikes have dedicated pixel art. Inspiration: readable creature silhouettes in handheld Pokémon games and ability progression/secrets in Super Mario World. No commercial sprites, characters, maps or music are included.

## Verification

```sh
npm test
```

Coverage includes deterministic movement, ability restrictions, physical bridge support, circuit power/expiration, safe gate closing, rescue ordering, campaign exit requirements (including the unconditional-exit behavior), retries, saves, map access, inputs, fullscreen, spike collision/invulnerability, and difficulty (timer scaling, lives, grace, menu-only switching, save defaulting for older saves). A deterministic movement-input test completes all eighteen stages from spawn without teleporting or losing a life on Normal difficulty, and a second pass proves the same eighteen stages remain completable on Extra Hard. Automated traversal is not a substitute for a human difficulty/play-feel assessment.

Visual checks use the mounted OpenMausBot browser tools. Desktop and fixed portrait/landscape iframe viewports can be checked without changing the user's browser window. Real-device touch testing and independent teammate review are separate from the automated tests. The legacy `test/browser.cjs` is not used as evidence for this expansion.
