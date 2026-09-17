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
