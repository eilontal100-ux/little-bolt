# Five New Art & Game Directions (post-robot/forest reset)

Context read before writing this: `server.js` (906 lines — 5 stages, `SCENE 2400×600`, run/jump/dash, stomp-only combat, moving platforms, checkpoints, one guardian-arena boss, coins+shards as the only pickups), `README.md`, and `ART-DIRECTION.md` (the rejected robot-in-ruined-forest repaint). None of the five directions below reuse a robot or forest/canopy setting, and none is a palette swap of the old rects — see `PIXEL-DIRECTIONS.html` for hand-placed pixel grids (character/enemy/terrain/hazard/HUD), not filtered shapes.

Companion visual artifact: `PIXEL-DIRECTIONS.html` — open directly in a browser, five self-contained canvas scenes stacked vertically, each rendered at a 240×135 backing resolution with `image-rendering: pixelated` (no smoothing anywhere), so what you see is the actual nearest-neighbor-scaled pixel grid, not a downsized vector render.

Shared engine-reuse assumption for feasibility notes below: `server.js`'s `STAGES` array, `solids`/`movingPlatforms`/`enemyStarts`/checkpoint/guardian-arena structures, and the fixed-timestep `STEP=1/120` loop stay as the skeleton. Each direction is scored on how much *new* physics/state it needs beyond that skeleton.

## Research applied (`PIXEL-REFERENCE-NOTES.md`)

A teammate researched Shovel Knight (press kit + a cavern-encounter review screenshot) and Eastward (publisher page + a town review screenshot) for design *principles* — no commercial sprites, palettes, or assets were copied into this project; only the conclusions below were applied to originally-authored art in `PIXEL-DIRECTIONS.html`. Per concept, what changed:

- **Consistent-grid character silhouette, face, clothing, and distinct animation poses.** Every concept's `character` field was converted from a single static `grid` into `poses: {idle, run}` — same palette, same origin, same body outline, only the leg/hem/skate rows differ between poses, so the two poses read as one authored character rather than two different shapes. Clockwork's and Frost's faces gained a dedicated eye-color pixel (previously part of a flat skin-tone block) so the face reads at a glance. Each concept's canvas now has a small "IDLE / RUN" pose strip beneath the main scene so the two poses are directly comparable at 1:1 pixel scale.
- **Material-specific tiles and purposeful architectural props**, not random rectangles. Each concept gained a `prop` object — a hand-authored landmark placed once per scene, not a filler block: Tidewell's broken coral archway, Clockwork's gear-clock lamppost, Duneshade's market-stall awning and counter, Ember's forge chimney with a bellows pipe, Frost's frozen market awning. These sit in the midground, between the background silhouette and the ground line, the same layer a real stage would place its landmark set-dressing.
- **Quieter backgrounds, clear collision edges.** Every concept's background silhouette color gained alpha transparency (`...cc` appended to its hex) so it recedes visually, while each concept's `edge` color (the bright rim drawn exactly on the ground collision line, same principle as `ART-DIRECTION.md`'s "the glow line **is** the collision surface") is untouched and stays the highest-contrast element in the scene.
- **Level design built around verbs and encounters, not stretched gaps.** See the verb table below — this was already implicit in each concept's "core movement/interaction" and "meaningful objectives" sections above; the table makes the safe-intro → vary → combine progression explicit per concept, matching the note's "introduce a mechanic safely, then vary it, then combine it with another."
- **Fresh, non-robot/forest setting.** No concept was reworked here since none of the five were ever a robot/forest reskin (that was the whole point of the first pass); the note's explicit "sunlit desert bazaar and buried palace" candidate is addressed directly in the revised recommendation below.

### Verb repertoire per concept (safe intro → varied → combined)

| # | Concept | Core verb(s) | Introduced safely | Varied | Combined |
|---|---|---|---|---|---|
| 1 | Tidewell Diver | jet / grapple-swing | open-water jet with no hazards nearby | grapple-swing across a static chasm | swing while dodging a drifting jellyfish field |
| 2 | Clockwork Rooftops | wall-jump / evade | rebound off one isolated chimney stack | grapple-broom pendulum across a street gap | pendulum swing through an active guard-dog lantern cone |
| 3 | Duneshade Warden | throw (glaive) / slide | glaive hits a single static switch, no timing pressure | glaive redirects a light beam through one mirror to a socket | beam-redirect puzzle while a sand wraith ambush is active |
| 4 | Ember Forge Apprentice | smash / activate | one cracked crate, no enemy present (see stage beat 1) | smash a cooling-stone crossing under time pressure | smash-stun a cinder brute mid-crossing, then stomp before the stones cool |
| 5 | Frostmarket Runner | carry / rescue-equivalent | first crate carried on flat, hazard-free ground | crate carried across a thin-ice crossing | crate carried while a yeti-hound patrol cracks the same thin ice underfoot |

---

## 1. Tidewell Diver — bioluminescent deep-sea ruins

**World & protagonist.** A brass-and-glass diving suit courier descends through a drowned trade city lit only by bioluminescent fungus, jellyfish, and their own lantern-hook. Everything is submerged — the whole campaign is one long descent, not a walk-right.

**Palette (exact hex).**
| Role | Hex |
|---|---|
| Sky/water top | `#0a1c2e` |
| Water mid | `#123b52` |
| Suit dark | `#1f6f74` |
| Suit light | `#4fc9c4` |
| Helmet glass | `#bff3ff` |
| Brass trim | `#c98a3d` |
| Lantern glow | `#ffdd88` |
| Danger coral | `#ff6b5c` |

**Core movement/interaction.** Water buoyancy: fall is slower and floatier than a normal platformer (lower effective gravity, capped fall speed), jump arcs are longer and softer. Dash is replaced by a **current-jet**: a short omnidirectional thrust (8 directions, not just horizontal) on the same cooldown model as today's dash, used both for combat evasion and for closing vertical gaps buoyancy alone can't clear. A **harpoon-grapple** (aim with up/down + jet button) pulls the diver to fixed kelp-vine anchor points for swinging across chasms.

**Unique enemies/hazards.** Anglerfish (stationary lure light that pulls the camera's eye — telegraphs a lunge-bite if the diver lingers in range); eel (fast horizontal darter, only vulnerable to a stomp when it's mid-glide, not coiled); drifting electric jellyfish fields (non-defeatable, must be jetted around); sea-urchin clusters as static ground hazards; pressure zones (deep sections that throttle jump height and jet distance, forcing route choices).

**Meaningful objectives beyond walking right/coins.** A **breath meter** replaces the flat life pool as the moment-to-moment pressure — running out costs a life, refilled at air-bubble pockets and safe-room surfaces. Each stage has 4 **sunken relic fragments** off the critical path; collecting all 4 opens the stage's vault room (a bonus secret chamber, not required to finish) rather than just padding the coin count. Cracked coral hides sealed hatches the harpoon must pull open.

**Optional route/secret.** Vault rooms behind full relic sets; a few stages have a "high route" through a kelp canopy that skips a pressure zone but risks the jellyfish field.

**Difficulty evolution.** Later stages darken (lantern radius effectively shrinks against a bigger silhouette-only draw distance), currents actively push the diver off-course, pressure zones tighten jump arcs, and eel/jellyfish density rises. Final stage is a pitch-black trench navigated mostly by lantern glow and sound-coded (visual-flash) cues.

**Feasible campaign scope.** 6 stages, ~3800–5000px wide (vs. today's 2400), Shallow Reef → Sunken Trade Route → Kelp Abyss → Pressure Trench → Drowned Temple → Leviathan's Maw (boss, stationary jaw-arena reusing the existing guardian-phase pattern). **Feasibility flag:** buoyancy (new gravity/fall-speed model) and the harpoon-grapple (swing physics) are the two genuinely new physics systems here — grapple swinging in particular is the most implementation-risk of all five directions.

---

## 2. Clockwork Rooftops — steampunk skyline at dusk

**World & protagonist.** A slight, sharp-eyed chimney-sweep with a spring-loaded grapple-broom, running rooftops and telegraph wires over a brass-and-slate city at dusk, stealing back stolen blueprints from a clockwork syndicate.

**Palette (exact hex).**
| Role | Hex |
|---|---|
| Dusk sky top | `#2a1f3d` |
| Dusk sky bottom | `#6a3f55` |
| Roof dark | `#23222b` |
| Roof mid | `#3c3a46` |
| Brass/gears | `#d1963f` |
| Steam/lantern glow | `#ff9d5c` |
| Waistcoat | `#2f6e6a` |
| Skin | `#e8c9a0` |

**Core movement/interaction.** Wall-jump/rebound off chimney stacks; grapple-broom latches onto fixed gear-wheel anchors for pendulum swings across street gaps (same swing-physics risk as direction 1, but shorter, more forgiving arcs since it's a city, not open water). Dash is replaced by a **clockwork rewind**: 1–2 charges per checkpoint that snap the sweep back to their position ~0.6s ago — an escape tool, not a damage tool, refilling at checkpoints only (scarcity is the design point).

**Unique enemies/hazards.** Timed steam vents (knock back if crossed mid-burst); patrolling clockwork pigeons (flying, drop loose gears as projectiles); rooftop guard-dogs with a lantern vision cone — stepping into the cone doesn't cost a life immediately, it starts a short alarm timer that spawns a faster patrol until it expires or the sweep breaks line of sight (the campaign's one lightweight stealth beat, optional to engage with).

**Meaningful objectives beyond walking right/coins.** Pocket-watches (currency, coin-equivalent) plus 4 **blueprint pages** per stage needed to bypass the stage's locked vault gate. Telegraph-wire routes are a visible optional shortcut with real fall risk (no safety net below).

**Optional route/secret.** Wire routes; a couple of guard-dog cones can be avoided entirely via rooftop-only detours that take longer but skip the alarm risk.

**Difficulty evolution.** Guard density and cone size increase; gear-platforms start requiring rhythm-timed jumps (they retract on a beat); gaps widen enough that failing a grapple attempt costs real progress, not just a reset.

**Feasible campaign scope.** 6 stages, ~3800–5200px wide: Market Rooftops → Foundry District → Clock Tower Ascent → Guarded Manor → Sky Rail Yards → Grand Clockwork (boss — a giant gear-mechanism arena, stomp its exposed cog when telegraphed, same 3-hit pattern as today's guardian). **Feasibility flag:** grapple-swing physics + a stealth/alert-timer system are both new; this is the highest new-systems count of the five (swing *and* AI-state), so highest implementation risk despite being visually the most novel.

---

## 3. Duneshade Warden — sunbaked canyon temple

**World & protagonist.** A nomadic warden in a wind-worn cloak carries a returning glaive across a buried temple complex, using its throw to hit distant switches as much as to fight.

**Palette (exact hex).**
| Role | Hex |
|---|---|
| Sky/sun top | `#f2a154` |
| Far dune/horizon | `#7a3b2e` |
| Rock outline | `#5c4324` |
| Sandstone mid | `#a8763f` |
| Sandstone highlight | `#e0b877` |
| Cloak | `#3a3560` |
| Rune/eye glow | `#ffcf6b` |
| Danger ember | `#ff5a4a` |

**Core movement/interaction.** Sand-sliding: standing on a dune slope builds momentum downhill (a controlled slide, not a hazard) that can be canceled into a jump for extra distance — this is the one genuinely new *feel* to moving left/right, distinct from the current flat-run. The glaive throw (aim horizontal, arcs slightly, returns to hand) hits switches, torches, and enemies at range and is the traversal-safe alternative to the existing dash, which stays as a short forward burst for gap-closing. Quicksand patches sink the warden if they stand still more than ~1s — pressure to keep moving, not an instant-death gotcha.

**Unique enemies/hazards.** Scarab swarms (small, fast, ground-hugging, stomp-able in groups); sand wraiths (telegraphed emergence from the ground, only vulnerable during a brief post-emerge window); stationary scorpion turrets (ranged, must be glaive-hit or ducked under). Sandstorm segments cut visibility to a tight radius around the warden — a pacing beat, not a permanent state.

**Meaningful objectives beyond walking right/coins.** 4 **sun-idols** per stage, each solved by throwing the glaive to redirect a light beam into the idol's socket (a small line-of-sight puzzle, not just a pickup) — all 4 lit opens the temple gate. Some coin caches sit behind collapsing sand pillars that must be timed (glaive-hit to trigger the collapse, then run before the next block falls).

**Optional route/secret.** A high canyon-rim route bypasses a scorpion vault entirely but requires chaining 3 sand-slides without stopping.

**Difficulty evolution.** Sandstorm frequency and visibility loss increase; collapsing-floor timing windows shrink; wraith ambushes start chaining (two emerge points active at once); later idol puzzles need two beam redirects instead of one.

**Feasible campaign scope.** 6 stages, ~3800–5000px wide: Canyon Outskirts → Caravan Ruins → Whispering Dunes → Sunken Temple Steps → Scorpion Vaults → Sandstorm Colossus (boss — a sand-elemental that must be glaive-hit in weak points revealed only when it rears up, reusing the existing 3-hit guardian-phase skeleton). **Feasibility flag:** the glaive is a projectile-with-return and a puzzle trigger (moderate new system — projectile physics + a switch/beam state), but it doesn't touch player movement physics the way a grapple would; sand-slide is a momentum tweak, not a new movement mode. **Second-lowest overall risk of the five.**

---

## 4. Ember Forge Apprentice — volcanic foundry

**World & protagonist.** A stocky blacksmith's apprentice in a heat-scorched apron wields a tether-hammer — part tool, part weapon — through a foundry built into an active volcano.

**Palette (exact hex).**
| Role | Hex |
|---|---|
| Rock outline | `#1a1210` |
| Rock mid | `#4a3f3d` |
| Lava/glow | `#ff7a3d` |
| Hot-core highlight | `#ffd35c` |
| Apron dark | `#8a3a2a` |
| Apron light | `#c98a52` |
| Tool/glove | `#4a5568` |
| Skin | `#e0b58c` |

**Core movement/interaction.** Run/jump stay close to today's feel (lowest movement-physics risk of the five). Dash is reinterpreted as a **hammer-smash**: a short-range forward AOE that breaks cracked slag walls (revealing secrets), stuns cinder-wisps, and cracks specific "cooling-stone" platforms into a safe crossing state over a lava creek (they're molten/unsafe until smashed, then solid for a few seconds). Localized **heat-updraft** zones near vents give a one-time extra lift when jumped through, used for reaching upper routes.

**Unique enemies/hazards.** Ember wisps (drifting, contact damage, stunnable by smash); cinder brutes (a slow ground patrol of living ember-and-stone, not mechanical — needs a smash-stun before it can be stomped safely); lava pools (static hazard); a late-stage **rising-lava sequence** (a forced-scroll set-piece where the camera pushes the apprentice forward/upward under time pressure — reuses the existing camera-clamp system with a modified lower bound instead of new code).

**Meaningful objectives beyond walking right/coins.** 4 **ingots** per stage, tempered at anvil stations via a short timed hammer-rhythm interaction (hit the anvil on beat 3 times) — collecting all 4 unlocks the stage's furnace gate. Obsidian shard caches sit behind slag walls that only the hammer-smash reveals.

**Optional route/secret.** Slag-wall secrets throughout; one late stage has an optional upper route entirely via updraft-chaining that skips two cinder-brute encounters.

**Difficulty evolution.** Cooling-stone timing windows shrink stage over stage; cinder brute density rises; the rising-lava set-piece appears twice (once mid-campaign as an introduction, once at full difficulty near the end); anvil rhythm interactions add a second beat late-campaign.

**Feasible campaign scope.** 6 stages, ~3800–5200px wide: Foundry Outskirts → Slag Quarry → Molten Aqueduct → Cinder Vaults → Rising Furnace Core → The Slag Sovereign (boss — reuses the guardian-arena skeleton, vulnerable only right after a smash-stun instead of on a color-cycle timer). **Feasibility flag:** hammer-smash is a melee-AOE + breakable-tile-state system (new but self-contained, doesn't touch movement); updrafts are a localized one-shot force (trivial addition); rising-lava reuses the existing camera clamp. **Lowest overall new-systems risk of the five** while still reading as a fully distinct game.

---

## 5. Frostmarket Runner — floating ice bazaar

**World & protagonist.** A fur-hooded courier-trader skates (built-in ice-skate boots) across a caravan of frozen market platforms strung between ice cliffs under an aurora sky, hauling sealed trade-crates between posts.

**Palette (exact hex).**
| Role | Hex |
|---|---|
| Aurora/sky | `#2fe0c4` |
| Night sky top | `#16213a` |
| Snow/ice highlight | `#eaf6ff` |
| Ice mid | `#9fd8e8` |
| Ice shadow/outline | `#3d6a80` |
| Fur/coat accent | `#c9673f` |
| Lantern glow | `#ffcf6b` |
| Skin | `#e8c9a0` |

**Core movement/interaction.** Skating replaces flat run/stop with gradual accelerate/decelerate momentum — the single biggest *feel* change of the five, and the reason it's also the riskiest to tune (it changes the core input model the existing movement tests are written against). Ice patches extend slide distance further; the existing dash becomes a **grapple-lantern** pull toward fixed anchor points, doubling as a way to freeze a water gap into a temporary crossable platform for ~2s. A **carry mechanic**: picking up a trade-crate slows movement and disables the grapple-lantern until it's delivered — a real tradeoff, not a free pickup.

**Unique enemies/hazards.** Frost foxes (fast pounce attacks, stomp-able); drifting ice wisps (contact damage, non-defeatable); yeti-hounds (heavy ground patrol that cracks thin-ice platforms just by walking on them, forcing a route decision). Thin-ice tiles crack after one stand and respawn after a few seconds; wind-gust zones push sideways during the crossing; a late **avalanche chase** is a forced-scroll set-piece like direction 4's rising lava.

**Meaningful objectives beyond walking right/coins.** 4 **sealed trade-crates** per stage carried (with the movement penalty above) to specific caravan posts to open the stage's market gate — this is the most mechanically distinct "meaningful objective" of the five, since carrying is a stateful tradeoff, not a collect-and-forget pickup. Frozen chandeliers form an optional overhead secret route.

**Difficulty evolution.** Wind strength and thin-ice density increase; yeti-hounds are introduced mid-campaign; the avalanche chase appears once near the end at full intensity; crate-delivery distances get longer, making the movement-penalty tradeoff sharper.

**Feasible campaign scope.** 6 stages, ~3800–5200px wide: Frost Market Outskirts → Caravan Bridges → Aurora Cliffs → Yeti Hound Run → Avalanche Descent → The Frost Sovereign (boss, guardian-arena skeleton reused, vulnerable when its ice armor cracks after 3 lantern-freezes). **Feasibility flag:** momentum-skating rewrites the ground-movement model the current unit tests (`server.test.cjs`/`game.test.cjs`) are written against — every movement test would need rewriting, not just extending, which is real scope beyond art. Most visually striking of the five but highest test-suite disruption.

---

## Recommendation

**Revised after research (see above): Duneshade Warden**, not Ember Forge Apprentice. Reasoning, weighed against the other four:

- **Directly matches the researched reference direction.** `PIXEL-REFERENCE-NOTES.md` names "a sunlit desert bazaar and buried palace" as a strong candidate setting by name; Duneshade Warden's sunbaked canyon temple, buried temple complex, and market-stall prop are exactly that setting, not an adjacent guess. Ember Forge (volcanic foundry) and the other three don't match the named candidate as directly.
- **Silhouette distinctiveness is still strong**: a triangular hooded-cloak warden with glowing eyes and a returning glaive reads distinctly from a round-helmeted diver, a tall-hatted sweep, a stocky-apron smith, or a round-hooded skater.
- **Second-lowest new-physics risk of the five, not the highest.** The glaive is a projectile-with-return plus a switch/beam-state system (moderate, self-contained, doesn't touch `server.js`'s core velocity/dash logic), and sand-sliding is a momentum tweak on existing ground movement, not a new movement mode. It is one notch above Ember Forge's risk (which needs no new projectile system at all) but well below the grapple-swing directions (1, 2) or the momentum-skating rewrite (5) that would force rewriting the existing movement unit tests.
- **Directly answers "levels are too simple, short, and boring"** through the glaive's beam-redirect idol puzzles (a real spatial-reasoning objective, not a walk-to-pickup), collapsing sand-pillar timing gates, chained wraith ambushes, and an optional canyon-rim route gated behind a movement-skill chain (three sand-slides without stopping) — length and variety drivers that are about encounter design, not stretched corridors.
- **Verb repertoire fits the "introduce → vary → combine" principle cleanly** (see table above): throw-to-switch is taught with zero time pressure, varied into a multi-step beam puzzle, then combined with an active wraith ambush — a concrete progression the reference notes call for explicitly.
- **Runner-up, lowest overall build risk: Ember Forge Apprentice.** If the team wants to minimize new systems above all else, Ember Forge remains the safer pick — hammer-smash, heat-updrafts, and the rising-lava set-piece are all additive to the current movement model with no new projectile or puzzle-state system at all. Its full first-stage progression is kept below as the lower-risk alternative.
- Boldest visual swing regardless of build cost, if the team wants that instead: **Frostmarket Runner** (momentum-skating is the most fun-forward change but also the most expensive to build and retest, since it rewrites the ground-movement model the existing unit tests are written against).

### Concrete first-stage progression — "Canyon Outskirts" (Duneshade Warden, recommended)

Width ≈ 3800px (vs. today's 2400), height 600, same camera/HUD skeleton as `server.js`.

1. **0–400px, tutorial beat**: flat sandstone ground, one static switch across a narrow gap — teaches the glaive throw-and-return with no enemy present and no timing pressure.
2. **400–900px**: first downhill dune slope — teaches sand-sliding into a jump for extra distance, crossing a gap too wide for a standing jump alone.
3. **900–1300px**: first quicksand patch beside a coin cluster (6 coins) — teaches "don't stand still," not "avoid entirely," since the patch is small and skirts the intended path.
4. **1300–1700px**: first sun-idol puzzle — a single light beam, one glaive-hit redirects it into the socket, lighting idol 1/4. A cracked rock wall beside the idol hides a secret coin cache (visible rubble texture rewards noticing it).
5. **1700–2100px, checkpoint**: first sand wraith — telegraphed emergence from the ground with a clearly-timed vulnerable window right after it surfaces; no idol or hazard overlaps this encounter, so the fight is isolated and safe to learn.
6. **2100–2600px**: a scorpion turret guards idol 2/4's beam path — duck under its shot or glaive-hit it first, then redirect the beam — first section combining a hazard with a puzzle.
7. **2600–3100px**: second dune slope chained into a scarab-swarm crossing — stomp through the swarm mid-slide or slide past it, first section stacking a movement skill with an enemy group.
8. **3100–3500px**: two-beam idol puzzle (idol 3/4) — requires redirecting one beam, moving to a second switch, redirecting a second beam, while a sand wraith ambush activates partway through — the verb-combination beat named in the table above.
9. **3500–3800px**: final approach — idol 4/4 at a simple single-beam puzzle right before the temple gate; gate opens regardless of idol count, but all 4 lit opens a small bonus vault (same campaign-wide secret-reward pattern used across all five concepts) before the stage-end flag. The optional canyon-rim route (three chained sand-slides, no stopping) is visible from this section and bypasses the step-6 scorpion vault entirely.

**Estimated playtime — UNVERIFIED, not playtested or measured, rough authoring estimate only:**
- Stage 1 blind first playthrough: **~7–10 minutes** (slightly longer than Ember Forge's estimate below, since beam puzzles ask the player to backtrack between switches).
- Full 6-stage campaign blind: **~55–75 minutes**, less on replay once beam-puzzle solutions and slide chains are known.

### Alternate first-stage progression — "Foundry Outskirts" (Ember Forge Apprentice, lowest-risk runner-up)

Width ≈ 3800px (vs. today's 2400), height 600, same camera/HUD skeleton as `server.js`.

1. **0–400px, tutorial beat**: flat ground, one cracked crate the apprentice must hammer-smash to pass — teaches smash without any enemy present.
2. **400–900px**: first ember-wisp pair drifting over a short gap; one coin cluster (6 coins) on a raised ledge reachable by a normal jump — teaches vertical reads early.
3. **900–1300px**: first cooling-stone crossing — 3 molten tiles over a lava creek, each requires a smash before it's safe, on a ~4s solid window each — first real skill gate.
4. **1300–1700px**: first anvil station — 3-beat hammer rhythm tempers ingot 1/4. A slag wall beside the anvil hides a secret obsidian-shard cache (visible cracked texture, rewards noticing it).
5. **1700–2100px, checkpoint**: a heat-updraft vent lets the player reach an optional upper ledge with ingot 2/4 and skip a cinder-brute patrol below — first meaningful route choice.
6. **2100–2600px**: cinder brute patrol on the low route (smash-stun, then stomp) vs. the updraft skip from step 5 — same section, two valid approaches.
7. **2600–3100px**: second, longer cooling-stone crossing (5 tiles, tighter timing) combined with a drifting ember-wisp overhead — first section that stacks two hazard types.
8. **3100–3500px**: anvil station 2, ingot 3/4, plus a second slag-wall secret guarded by a stationary ember-wisp (light combat-before-reward beat).
9. **3500–3800px**: final approach — ingot 4/4 at a quick anvil right before the furnace gate; gate opens regardless of ingot count, but all 4 unlocks a small bonus vault (echoes the "vault" idea from direction 1, kept consistent as a campaign-wide secret-reward pattern) before the stage-end flag.

**Estimated playtime — UNVERIFIED, not playtested or measured, rough authoring estimate only:**
- Stage 1 blind first playthrough: **~6–9 minutes**.
- Full 6-stage campaign blind: **~50–70 minutes**, less on replay once routes/anvil rhythms are known.

No claim of AAA/$60 production quality is intended anywhere in this document — these are readable, appealing hand-pixel prototypes and feasible indie-scope level designs, not a promise of commercial-tier art or content volume.

---

## Reusable original art functions for integration (Duneshade Warden)

All originally authored in `PIXEL-DIRECTIONS.html` (no traced/copied commercial sprites — only general composition principles from the research were applied to new pixel grids). Written in the same plain `function(ctx, ...)` style as `ART-DIRECTION.md` §5, so they can be lifted directly into `gameClient()`'s scope in `server.js`. Each function is a thin wrapper around the shared `drawGrid(ctx, grid, pal, ox, oy)` helper already in `PIXEL-DIRECTIONS.html` — copy that helper in first, then these:

```js
// Generic hand-grid renderer, copy in once — every function below calls this.
function drawGrid(ctx, grid, pal, ox, oy) {
  for (let row = 0; row < grid.length; row++) {
    const line = grid[row];
    for (let col = 0; col < line.length; col++) {
      const ch = line[col];
      if (ch === '.') continue;
      ctx.fillStyle = pal[ch];
      ctx.fillRect(ox + col, oy + row, 1, 1);
    }
  }
}

drawWardenSprite(ctx, x, y, facing, pose, t)
// pose: 'idle' | 'run' | 'jump'. 'idle'/'run' grids are already authored
// (CONCEPT.character.poses.idle / .run in PIXEL-DIRECTIONS.html); 'jump' is
// not yet authored — reuse the 'idle' grid until a jump pose is drawn, same
// stopgap server.js already uses nowhere else, so this is a net-new TODO.
// facing mirrors horizontally around the sprite's own ox (ctx.scale(-1,1)
// pattern, same convention as drawRobotCourier's `facing` in ART-DIRECTION.md).

drawGlaive(ctx, x, y, angle, t)
// A thrown-and-returning projectile, not a static grid: draw a short rotated
// bar (glow color `#ffcf6b`, outline `#5c4324`) at `angle` radians around its
// own centroid. `angle` and position come from new physics state (see below),
// not from t alone — t is only used for a subtle glow-pulse on the blade.

drawSunIdolProp(ctx, x, y, lit)
// Architectural landmark + puzzle-socket state, drawn from the existing
// CONCEPT.collectible grid family (the small sun-idol glyph), scaled up as a
// stage prop. `lit`: bool — swap the glow pixel color from dim `#a8763f` to
// bright `#ffcf6b` once its beam has been redirected into the socket.

drawMarketStallProp(ctx, x, y)
// Purely decorative background landmark. Static — no animation state needed.
// Grid already authored as CONCEPT.prop in PIXEL-DIRECTIONS.html.

drawSandstoneTerrainGround(ctx, s, t)
drawSandstonePillarPlatform(ctx, s, t)
// s = an actual `solids` array entry ({x,y,w,h}), same critical-correctness
// rule as ART-DIRECTION.md §5: the bright edge line must be drawn at exactly
// s.y across exactly s.w, since physics reads x/y/w/h from the same object.
// `kind` field on `solids` (already optional/unused-by-physics in server.js
// today) picks which of the two to call, same pattern as the old terrain
// functions.

drawScarabSwarm(ctx, x, y, facing, t)
drawSandWraith(ctx, x, y, phase, t)
// phase: 'buried' | 'emerging' | 'vulnerable' | 'submerging' — drives which
// of a small hand-authored grid set to show; only 'emerging'/'vulnerable' are
// drawn in PIXEL-DIRECTIONS.html today (the enemy grid there is the
// 'emerging' pose). 'buried' and 'submerging' grids are a net-new TODO before
// this ships — flagging so it isn't missed, same as ART-DIRECTION.md's beetle/
// drone gap.
drawScorpionTurret(ctx, x, y, t, firing)
// firing: bool, whether to draw its ranged-shot sprite this frame.

drawCollectibleSunShard(ctx, x, y, t)
// Direct lift of CONCEPT.collectible grid; t drives a small vertical bob,
// same convention as drawCollectibleCoin/drawCollectibleShard in
// ART-DIRECTION.md.
```

**Pose-driving logic** (integration instruction, not yet wired): derive `pose` the same way `ART-DIRECTION.md` recommends for the robot courier —
```js
const pose = !player.grounded ? 'jump' : (player.vx !== 0 ? 'run' : 'idle');
```

**New state required, out of scope for this art task — flagging so it isn't missed:**
- **Glaive**: needs its own projectile object (position, velocity, angle, `state: 'thrown'|'returning'`, owner) tracked alongside `player`, plus AABB checks against switches/enemies on its flight path. This is the single largest new-systems item in this recommendation.
- **Beam/switch state**: each idol needs `{lit: bool, sockets: [...]}` and each switch needs to know which beam segment it redirects — a small new data shape on the stage definition, not a physics change.
- **Sand-slide**: a momentum multiplier applied while grounded on a `solids` entry flagged with a slope/`kind`, decaying like the existing dash rather than being a wholly new movement mode — lowest-risk of the three new-state items above.

**Textures precomputed, not per-frame**: same rule as `ART-DIRECTION.md` — any randomized dune-texture or rubble-tuft positions should be generated once at load with a seeded PRNG and read every frame, never recomputed inside `draw()`.
