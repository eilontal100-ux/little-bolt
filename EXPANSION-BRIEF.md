# Creature Call — major expansion

User request: fully improve pixel art with Pokémon/Mario inspiration, a much bigger game, more levels, more creatures and harder puzzles. This is implementation work, not a proposal-only deliverable.

## Target
- 12 authored levels, four worlds (habitat, tide, foundry, aurora), six original playable creatures.
- Crag: smash. Glint: wind glide. Sprig: vine bridge. Cinder (`cinder`): ember-wool ram clears thorn barriers. Floe (`floe`): round finned amphibian temporarily freezes water crossings. Volt (`volt`): spring-tailed beetle charges timed relays powering linked gates/wind.
- Shared 34x48 collision body; poses idle/run/jump/ability. Rendering anchored at top-left player x/y. Expressive original 20–24-column sprite grids rendered around 2 world units per pixel, clear facial features, species-specific silhouettes/animation.
- Ability inputs C/K, Q/E and 1–6 switching, touch controls and fullscreen retained.
- Four worlds with three distinct stages each. Gradual acquisition, safe introduction, combined puzzles, challenging finale. Each stage has purposeful encounters and at least one optional relic route. Avoid length through empty ground or twelve copies of a single obstacle sequence.
- Harder puzzles involve dependencies and timing: relay powers wind to reach another route; temporary ice creates a crossing while a gate timer runs; burn then grow then switch to cross. Physical traversal and visible linked feedback, not invisible color-key checks.
- Fair retries/checkpoints, no one-way softlocks, no duplicate collection rewards, no unlock reset on death. Short hints introduce verbs and links. Returning to an earlier level should remain possible once campaign navigation is integrated.
- Lead integrates title/world map, creature guide and versioned local campaign progress after mechanics/art return. Save failures must degrade gracefully, new game needs explicit confirmation, resume never silently overwrites current play.

## Art bar
No recolor-only creatures, no reduced-resolution filter as substitute for art, no old desert props, giant featureless mushroom-shaped backdrops, or uniform brick rectangles everywhere. Use clustered shading, outlines, material-specific tiles, controlled background contrast, original landmarks and creature personality. UI has high contrast, active creature portraits, clear ability availability and objective feedback. Original work; no copied Pokémon or Mario sprites/maps.

## Reference research (2026-09-17)
https://www.pokemon.com/us/pokemon-video-games/pokemon-ruby-version-and-pokemon-sapphire-version/
https://www.nintendo.com/en-gb/Games/Super-Nintendo/Super-Mario-World-752133.html
Design interpretation: readable creature identity and collectible roster; distinct terrain and exploration; introduce, vary, then combine mechanics; optional secrets with actual traversal rewards. Nintendo's official description specifically discusses new abilities, companion Yoshi, and levels packed with secrets. These are inspiration, not assets or a claim of equivalent production quality.

## Ownership / integration
- Ava owns CREATURE-ART.js and CREATURE-ART.html plus ART-EXPANSION.md. Do not edit server.js/tests.
- Pixel owns server.js gameplay/campaign, test files and README. Preserve inline art until lead replaces it. Do not edit Ava files.
- Lead integrates art, UI/navigation/save, checks the result, requests review and publishes a new PR against latest main. No automatic merge/deploy.
- Art API createCreatureArt(): drawCreature(ctx,id,x,y,facing,pose,time); drawBackdrop(ctx,{w,h},camera,region,time); drawObstacle(ctx,{type,x,y,w,h,solved,active?,remaining?,id?,link?},time); drawTerrain(ctx,solid,region,time) optional new API. Obstacle types rock/wind/seed/thorn/water/relay/gate. Solved water = active frozen bridge; draw top at obstacle y (actual collision top) only if engine passes physical geometry. Relay/gate active/remaining should show expiration clearly. Keep all functions self-contained to embed in server.js.

## Validation
Current baseline npm test: 31/31 pass. PR #5 is merged, main commit 59dd2d6. Workspace root is not Git; .publish is an old clean checkout used for fetch/publishing. Do not overwrite the workspace from that checkout. New implementation needs meaningful wrong-ability tests, timer expiration/retrigger/checkpoint behavior, acquisition prerequisites, and movement-input traversal of all stages without teleportation to prove required routes. Browser tests through mounted tools only. Report exactly what was executed, and limits; no invented reviews or playtimes. Save incremental working changes to avoid timeout loss.
