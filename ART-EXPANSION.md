# Skyheart art and expansion — implementation record

Implemented locally by Dev after Ava and Pixel's expansion assignments failed with session limits. Their failed reports are not evidence of code or review.

## Delivered

- Six separate hand-authored sprite grids: stone-backed Crag, winged Glint, leaf-eared Sprig, curled-horn Cinder, finned Floe, segmented Volt. Shared 34×48 collision anchor; rendered on a two-world-unit grid, with idle/run/jump/ability pose changes.
- Four layered architectural environments: overgrown island arcades, coast watchtowers and piers, foundry chimneys and vents, aurora observatories. Materials differ: earth with rootlets, limestone, riveted metal, frosted crystal.
- Physical rock/thorn walls, seed bridges, temporary ice, lettered relays, powered wind and timed gates, with countdown feedback.
- Twelve stages (three retained and nine new), six creatures, map/guide, replayable unlocked stages, versioned browser-local progress, and a six-ability finale.

## API

`createCreatureArt()` exports `drawCreature(ctx,id,x,y,facing,pose,time)`, `drawBackdrop(ctx,{w,h},camera,region,time)`, `drawTerrain(ctx,solid,region)`, `drawObstacle(ctx,obstacle,time)`, coin/shard renderers, palettes and region palettes. Standalone module and inline game art are identical; a test enforces this. No assets are downloaded at runtime.

## Reference principles

Prior research is recorded in EXPANSION-BRIEF.md, citing official Pokémon Ruby/Sapphire and Super Mario World pages. Applied principles: independent silhouettes, readable facial features, clear terrain edges, quiet layered backgrounds, introduce/alternate/combine abilities, and optional elevated collectible paths. All sprites/maps are original; no commercial assets or characters were copied.

## Evidence and limitations

- `node -c server.js` passes.
- `npm test`: 45 tests pass, including movement-input completion of all twelve stages without teleporting or losing a life, wrong-creature behavior, linked machinery, ice expiry/retriggering, gate occupancy safety, checkpoint retention, save/reload and fullscreen.
- Actual desktop rendering, world map and six creature portraits inspected using the mounted browser tool in its isolated Chromium session.
- Portrait (390×844) and landscape (844×390) rendering inspected through fixed-size iframes using the same mounted browser. Native window resizing was refused because the window lacked an AXWindow. No foreground or alternative browser automation was used.
- No full human playthrough or real-device multitouch test; automated traversal demonstrates reachability, not subjective difficulty or play feel. Legacy Playwright test script was updated for the new startup menu but was not executed.
- Independent Pixel review is pending. Nothing in this file claims a review that has not happened.

## Bounded extension (Ava, 2026-09-18)

Extended the existing six-creature/four-region baseline above; did not touch server.js, tests, package files, or README.

- Two new sprites: `burrow` (stout mole, rounded dark-outlined body, wide mitten forepaws, amber lamp-nose that brightens on `ability`) and `echo` (small bat, notched scalloped ears, violet/rose wing membrane with scalloped trailing gaps that flare on `ability`/`jump`/running-frame-B). Same 34×48 anchor, same 22-column/23-row grid convention as the existing six; idle/run/jump/ability all supported (run/jump reuse the existing generic leg-row overrides; each has its own ability-pose row override).
- Three new obstacle types in `drawObstacle`: `clay` (layered ochre wall with alternating brick coursing and two diagonal crack strokes; returns without drawing anything once `solved`, so it disappears completely), `crystal` (same fixed-`y=500` bridge geometry as `seed`/`water`, gated by a `solved` boolean — unsolved shows a small pulsing trigger marker at the bank, solved shows a luminous crossing with a pulsing glow overlay), `spikes` (triangular teeth computed from the obstacle's own `{x,y,w,h}` rectangle, so they exactly match ground-supported spike geometry; dulled color when `solved`).
- Two new regions, `burrow` and `resonance`, each with a distinct `drawBackdrop` atmosphere layer (cave-ceiling drips for burrow, moon disc + starfield for resonance), distinct parallax landmarks (root-threaded stone pillars for burrow; reed silhouettes, a crystal spire, and a still-water band for resonance), and distinct `drawTerrain` tile treatment (amber support beams over earth strata for burrow; lakebed stone with luminous vein inlays for resonance). `drawBackdrop`'s landmark loop also gained an explicit final `else` fallback (reusing the aurora shape set) so an unrecognized region string still renders something coherent instead of nothing.
- API surface is unchanged: `drawCreature(ctx,id,x,y,facing,pose,time)`, `drawBackdrop(ctx,{w,h},camera,region,time)`, `drawObstacle(ctx,obstacle,time)`, `drawTerrain(ctx,solid,region)`, coin/shard renderers, `palettes`, `regions`. No new parameters were added to any function; the extension is entirely new data (creature ids, obstacle type strings, region keys) plus matching branches.
- `CREATURE-ART.html`'s embedded module copy was re-synced to stay byte-identical to `CREATURE-ART.js` (verified by direct string comparison, not just eyeballing), and its standalone preview driver was rewritten to iterate `Object.keys(a.palettes)` (now 8 creatures, 3-column/3-row pose grid) and `Object.keys(a.regions)` (now 6 regions) generically instead of the old hardcoded 4-element arrays, and to include `clay`, `spikes`, and `crystal` in its obstacle-type sample row alongside the original seven.

### Evidence and limitations

- `node -c CREATURE-ART.js` passes.
- Exhaustive Node.js exception sweep using a stub canvas-context Proxy: 908 calls across all 8 creatures × 4 poses × 2 facings × a dense time range, all 6 regions × `drawBackdrop`/`drawTerrain` (both `ground` and `platform` kinds) × a dense time range, and all 21 obstacle-type/solved/active/remaining combinations — zero exceptions. A separate 116-call sweep against the exact obstacle/backdrop/terrain/pose parameters used by the HTML preview's own driver script also passed with zero exceptions.
- Row-count/row-length structural check on the two new sprite grids: both have 23 rows; all rows are ≤22 characters (the fixed mirror-width constant `pixelGrid` uses), consistent with how the existing six creatures' grids are authored.
- Real-browser check: navigated an isolated, driver-owned Chromium instance (via the mounted browser tool, `browser_prepare`/`browser_navigate`/`get_browser_state`, serving the project directory over a local `http.server` on an ephemeral port that was torn down afterward) to `CREATURE-ART.html` and inspected screenshots. Confirmed all 8 creature portraits render distinctly across idle/run/jump/ability, and all 6 region sections (habitat/tide/foundry/aurora/burrow/resonance) render distinct backdrops, terrain, and the full obstacle sample row including `clay`, `spikes`, and `crystal`, with no blank/broken tiles observed. This was a visual spot-check of the standalone preview, not a test of server.js's actual in-game rendering, and not a full-resolution pixel-by-pixel audit of every obstacle at every solved/unsolved state.
- No coordination round-trip was performed for this handoff, per the request that the lead would pass the contract directly; independent review of this specific extension is pending.
