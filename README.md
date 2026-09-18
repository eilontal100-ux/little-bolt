# Creature Call — The Skyheart Journey

An original creature-switching puzzle platformer: 27 expeditions across Mosslight Isles, Glasswater Coast, Copperfall Works, Aurora Heights, the Underroot Reaches and The Last Circuit. Hand-authored pixel sprites and scenery are embedded in a single Node/Express server; no external assets or game services are required.

## Play

```sh
npm install
npm start
```

Open http://localhost:3000. `PORT` overrides the 3000 fallback. Render can use `npm install` as build command and `npm start` as start command.

Move with arrows/A/D, jump with Space/W, use an ability with C/K, switch with Q/E or 1–9, 0, −, and toggle fullscreen with F. Phone controls provide movement, jump, switch and ability buttons. Open **Map / Guide** to pause, revisit unlocked levels, read the creature guide, or change **difficulty**. The start screen offers **Play / return**, **Resume saved journey**, and a confirmed **New journey** action.

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
| Tether | Pull through the air to a ring ahead; tap again to detach | Level 19 |
| Zip | Air dash in the facing direction; land to recharge | Level 20 |
| Tempo | Freeze moving ferries and saws for 4 seconds; 7-second recharge from activation | Level 21 |

The first three stages teach traversal. Later stages combine permanent terrain changes with temporary ice, linked electrical circuits, dug-out clay walls, sung crystal bridges and spike hazards. Timed obstacles can be retriggered; closing gates wait for an occupying player to leave. Reaching a stage's exit always completes it, even if a puzzle along the way was skipped — nothing gates the flag on a solved obstacle. Upper platform routes contain optional relics.

Spikes sit on solid ground with a jumpable width and a clear run-up; touching them costs a life the same way a fall does, and the same brief invulnerability window protects you from a second hit immediately after.

### Difficulty

Four modes — **Easy, Normal, Hard, Extra Hard** — are selectable from the map/menu and shown in the HUD. They scale the timer on machinery (relays, gates, freezing water), the number of lives before a checkpoint refill, and the invulnerability grace window after taking damage. Jump height, run speed, gravity and glide lift are identical on every mode, so no difficulty changes how the game feels to move — only how much time and error margin you're given. Difficulty can only be changed from the menu (never mid-run), which reloads the current stage and resets lives to the new mode's maximum, so there is no way to bank an easy-mode timer and switch to a harder mode mid-crossing. Your choice is saved with your progress; older saves without a stored difficulty default to Normal.

Retries preserve the roster, collected items, checkpoints and permanent solutions, including after exhausting all of a mode's energy/life points — no difficulty ever ends the campaign on death. Browser-local saves use a versioned key and restore at a checkpoint; temporary machinery expires on reload. Completed stages remain available from the map. New journey clears campaign progress only after confirmation. Save failures do not stop gameplay. Saves are local to the browser and site origin, not cloud synced; this expansion does not import the earlier three-stage build's progress.

## New movement chapters

Levels 19–27 introduce grappling, momentum, and time control. Tether pulls toward visible rings within range; walls block the rope and movement. Zip dashes once per airtime and still collides with solid terrain. Tempo stops moving platforms and saws, including their visible motion; the player can still move. Frozen saws still hurt on contact. Platforms carry riders and wait instead of pushing them into walls. All three abilities use the same C/K or touch Ability control. Switching companions cancels a grapple or dash, but never refills an airborne dash. Time freeze continues across switches until its duration expires.

## E–T admin panel

Press **E, then T within one second** (optional hyphen), or tap the **ET** button. E still cycles companions during play. The panel pauses the game and offers level selection, all-creature unlock, life refill, and invincibility. Escape closes it.

Using a control starts **admin practice**: campaign writes stop, and a visible banner identifies the practice session. The **Return to campaign checkpoint** button restores the pre-practice progress from memory, including when browser storage is unavailable. Reloading also returns to the ordinary saved campaign. Level jumps grant prior-level companions. Invincibility prevents damage; falls return you safely to a checkpoint. Finishing the practice campaign returns to normal progress rather than overwriting it. These are local single-player tools, not server administration or an authenticated service.

## Artwork

`CREATURE-ART.js` contains independently authored sprite grids with idle/run/jump/ability poses, six layered architectural backdrops, and region-specific terrain materials. `CREATURE-ART.html` is a standalone preview. The same art function is embedded in `server.js`; tests verify the source stays synchronized. All eleven creatures have original sprite grids; clay walls, crystal bridges, spikes, grapple rings, ferries, and saws have dedicated art. Inspiration: readable creature silhouettes in handheld Pokémon games and ability progression/secrets in Super Mario World. No commercial sprites, characters, maps or music are included.

## Verification

```sh
npm test
```

Coverage includes deterministic movement, ability restrictions, physical bridge support, circuit power/expiration, safe gate closing, rescue ordering, campaign exit requirements (including the unconditional-exit behavior), retries, saves, map access, inputs, fullscreen, spike collision/invulnerability, and difficulty (timer scaling, lives, grace, menu-only switching, save defaulting for older saves). A deterministic movement-input test completes all 27 stages from spawn without teleporting or losing a life on Normal difficulty, and a second pass proves the same 27 stages remain completable on Extra Hard. Automated traversal is not a substitute for a human difficulty/play-feel assessment.

Visual checks use the mounted OpenMausBot browser tools. Desktop and fixed portrait/landscape iframe viewports can be checked without changing the user's browser window. Real-device touch testing and independent teammate review are separate from the automated tests. The legacy `test/browser.cjs` is not used as evidence for this expansion.
