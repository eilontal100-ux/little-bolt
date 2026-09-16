# Moonlight Courier — Art Prototype & Integration Spec

Prototype file: `ART-PROTOTYPE.html` (same folder as `server.js`). Open it directly (double-click, or `python3 -m http.server` and visit it) — it's a fully self-contained page with no build step, no external fonts/images/audio, and no dependency on `server.js`. It shows the art system running live: an animated scarf-wearing robot cycling through idle/run/jump, a patrolling beetle, a hovering scanner drone, ruined stone architecture, glowing collectibles, and a full terrain/parallax stack, at both desktop and phone aspect ratios.

This replaces the earlier "palette-swap" direction in `DESIGN.md`. Treat this file as the new visual baseline; `DESIGN.md`'s world layout/numbers/power-up logic are still fine as gameplay content, but its §1–§5 art description is superseded by what's below.

---

## 1. What changed vs. the old direction

The old `DESIGN.md` direction recolored the existing flat-rect drawing (`rect()`/`circle()` primitives, straight-line hills, single-color enemy blobs). This prototype replaces the *drawing technique*, not just the palette:

- Terrain is no longer a flat-fill rect with a colored top line — it has strata (3 fill layers), a glowing rim-lit collision edge, procedurally rooted texture, and soft moss tufts (not spikes — see §5, this was caught and fixed during verification).
- Background is a real depth stack: gradient sky → stars → moon with light shaft → far hills → ruined architecture silhouettes → layered tree canopy (3-tone: shadow/base/highlight per lobe) → fog band → foreground hanging vines. Seven parallax speeds, not two.
- The robot is a distinct character (scarf, visor glow, antenna, articulated legs) with three genuinely different poses, not one static rect composition.
- Two new enemy silhouettes (beetle, drone) instead of one red blob reused everywhere.
- Ancient architecture exists as both a background storytelling element and a playable platform variant (broken-pillar-top platform), tying "premium ruin" mood into actual level geometry.

## 2. Palette (exact hex)

| Role | Hex | Use |
|---|---|---|
| `SKY-TOP` | `#070a1e` | Sky gradient top |
| `SKY-MID` | `#0d1130` | Sky gradient mid stop |
| `SKY-LOW` | `#181b3c` | Sky gradient bottom (horizon glow) |
| `AURORA-CYAN` | `#35e6c422` | Aurora glow band (low alpha) |
| `AURORA-VIOLET` | `#7c6bff1c` | Aurora glow band (low alpha) |
| `STAR` | `#dfe6ff` | Starfield dots |
| `MOON` | `#f6ead0` | Moon core + halo |
| `FAR-HILL` | `#161d42` | Farthest silhouette layer |
| `RUIN-STONE` | `#232a52` | Background architecture silhouette |
| `RUIN-RUNE` | `#ffcf6b` | Architecture carved rune glow (pulsing) |
| `CANOPY-SHADOW` | `#123f38` | Tree canopy lobe underside + trunk |
| `CANOPY-BASE` | `#1f6b5c` | Tree canopy lobe main fill |
| `CANOPY-HILIGHT` | `#2c8a72` | Tree canopy lobe top highlight |
| `FOG-CYAN` | `#7cf0ff14` | Midground fog band |
| `GROUND-BASE` | `#241a3d` | Ground/platform top fill |
| `GROUND-MID` | `#1a1330` | Ground strata layer 2 |
| `GROUND-DEEP` | `#150f26` | Ground strata layer 3 + platform shadow |
| `EDGE-GLOW` | `#8ff7de` | Collision-edge rim line (bright, glow via `shadowBlur`) — **always render this exact line at `s.y` across the full `s.w`; it is the player's only readable cue for "this is solid"** |
| `MOSS-TUFT` | `#2c8a72` | Ground-top decorative moss clump (rounded, not pointed) |
| `RUIN-PLATFORM` | `#4b4d68` / `#33344a` | Ancient-pillar platform variant top/shadow |
| `RUIN-EDGE-GLOW` | `#ffe9b0` | Ruin-platform collision edge (warm variant, still bright/unmistakable) |
| `COIN-CORE` | `#fff2c4` → `#ffcf6b` | Coin radial gradient |
| `SHARD-CORE` | `#cdb8ff` / `#efe6ff` | Star-shard gem faces |
| `SHARD-GLOW` | `#7c6bff` | Star-shard pulsing halo |
| `ROBOT-CHASSIS` | `#3df0cf` → `#159085` | Robot body gradient |
| `ROBOT-DARK` | `#0e2a26` / `#10263a` | Robot chest panel, head housing |
| `ROBOT-VISOR` | `#eafcff` → `#7cf0ff` | Visor gradient |
| `SCARF` | `#ff9d5c` | Scarf main (warm, complements cool chassis) |
| `SCARF-TRIM` | `#7a3f22` | Scarf underside/trim |
| `BEETLE-SHELL` | `#b23fae` → `#3a1f52` | Beetle shell gradient |
| `BEETLE-EYE` | `#ff5a5a` | Beetle glowing eye |
| `DRONE-BODY` | `#4a5170` → `#2a3046` | Drone hex-body gradient |
| `DRONE-LIGHT` | `#ff5a5a` / `#7a2a2a` | Drone blinking warning light (alternates) |
| `DRONE-BEAM` | `#66f0ff` | Drone scanner beam |
| `HUD-BG` | `#0e1226cc` | HUD pill background |
| `HUD-BORDER` | `#7cf0ff2e` | HUD pill border |
| `HUD-TEXT` | `#f2ecff` | HUD stat text |

This is a strict superset of `DESIGN.md`'s palette — the shared night-base/gold/cyan/danger families carry over so HUD, checkpoints, and power-up chips already speced in `DESIGN.md` §5–6 still work unchanged.

## 3. Fonts

Unchanged from `DESIGN.md`'s recommendation, kept sparing so gameplay never blocks on a font load:

- **Wordmark/HUD brand only**: `Orbitron`, weight 700/900 — `font-family:'Orbitron','Segoe UI',system-ui,sans-serif;`
- **Everything else**: `system-ui, sans-serif` (zero network dependency).

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@700;900&display=swap" rel="stylesheet">
```

The prototype itself doesn't load Orbitron (it has no wordmark on screen by design — restrained HUD, no title text over gameplay) but the HUD CSS below is written to accept it.

## 4. Screen layout

**Desktop**: canvas fills the viewport edge-to-edge (existing `server.js` `<main>`/`<canvas>` sizing, unchanged). HUD pill sits top-left, ~14px inset. No other chrome overlaps the play area.

**Phone (<760px or coarse pointer)**: same scale-to-fit canvas logic already in `server.js`'s `resize()` — this prototype's `resize()` is line-for-line the same approach (`Math.min(rect.width/600, rect.height/SCENE.height)`), so it drops in without changes. HUD pill shrinks (smaller padding/gap/font — see CSS below), stays top-left, never exceeds ~35% of screen width. Touch controls are unchanged from `server.js` (dpad bottom-left, jump bottom-right) — this prototype doesn't re-implement them since they're pure input, not art.

**HUD is intentionally minimal**: one pill, top-left, coin icon + count + a thin divider + life pips. No route/wordmark text drawn over the play area — that was the explicit note from the last round ("no oversized text covering gameplay"). If a route/progress readout is wanted, put it as a second small pill bottom-left the way `DESIGN.md` speced (`.journey`), not centered/large.

### HUD CSS (ready-to-use)

```css
.hud{position:absolute;left:max(14px,env(safe-area-inset-left));top:max(14px,env(safe-area-inset-top));display:flex;align-items:center;gap:10px;padding:6px 12px 6px 6px;background:#0e1226cc;border:1px solid #7cf0ff2e;border-radius:999px;backdrop-filter:blur(6px);pointer-events:none}
.hud .badge{width:20px;height:20px;border-radius:50%;background:radial-gradient(circle at 35% 30%,#fff2c4,#ffcf6b 60%,#a8781f 100%);box-shadow:0 0 6px #ffcf6b88}
.hud .stat{display:flex;align-items:center;gap:5px;font:700 12px/1 system-ui;color:#f2ecff;letter-spacing:.3px}
.hud .lives{display:flex;gap:5px;margin-left:4px;padding-left:8px;border-left:1px solid #7cf0ff2e}
.hud .life{width:8px;height:8px;border-radius:50%;background:#2c3358}
.hud .life.on{background:#7cf0ff;box-shadow:0 0 6px #7cf0ff}
@media(max-width:760px){.hud{padding:5px 10px 5px 5px;gap:7px}.hud .stat{font-size:11px}}
```

---

## 5. Function contracts (for lifting into `server.js`)

All functions are plain `function(ctx, ...)` calls — no classes, no external state beyond what's passed in or closed over, matching the existing `rect()`/`circle()`/`label()` helper style already inside `gameClient()`. Copy the function *bodies* (they're written exactly in this style already) into `gameClient()`'s scope in `server.js`, replacing the corresponding old drawing code. `ctx`, `elapsed`/`t`, and world coordinates all mean the same thing they already do in `server.js`.

Two coordinate conventions, matching what `server.js`'s `draw()` already does today with its hills/canopy loop vs. its `ctx.translate(-camera,0)` block:

**A. Screen-space / parallax (call *before* `ctx.translate(-camera,0)`, own offset math inside):**
```
drawSky(ctx, view, t)
drawStars(ctx, view, camera, t)
drawMoon(ctx, view, t)
drawFarHills(ctx, view, camera)
drawArchitectureBackdrop(ctx, x, camera, scale, t)   // x = world x of the ruin, called once per ruin placement
drawCanopyMid(ctx, view, camera, t)
drawFogBand(ctx, view, camera, t)
drawForegroundVines(ctx, view, camera, t)            // call AFTER ctx.restore(), drawn on top of everything for foreground framing
```
`view = {w: viewWidth, h: viewHeight}` — same values `server.js` already computes in `resize()`.

**B. World-space (call *inside* the existing `ctx.save(); ctx.translate(-camera,0);` block, in this order — background-to-foreground):**
```
drawTerrainGround(ctx, s, t)          // s = one entry of `solids` with h===100 (ground-height segments)
drawTerrainPlatform(ctx, s, t)        // s = a floating platform solid
drawAncientPillarPlatform(ctx, s, t)  // same solid shape, ruin-styled variant — use for 1-2 platforms per level for landmark variety
drawCollectibleCoin(ctx, x, y, t)
drawCollectibleShard(ctx, x, y, t)
drawBeetle(ctx, x, y, facing, t)      // facing: 1 or -1, same convention as player.facing / enemy.dir
drawDrone(ctx, x, y, t, alert)        // alert: bool, whether the scanner beam is drawn
drawRobotCourier(ctx, x, y, facing, pose, t)   // pose: 'idle' | 'run' | 'jump'
```

**Critical correctness note**: `drawTerrainGround`/`drawTerrainPlatform`/`drawAncientPillarPlatform` must be called with the *actual* `solids` array entries `server.js` already uses for collision (`{x,y,w,h}`), not a separate art-only copy. The bright `EDGE-GLOW` line is drawn at exactly `s.y` across exactly `s.w` — that line **is** the collision surface, visually. If art and physics ever read from different coordinate sources they will drift apart and the "unmistakable collision edge" promise breaks. In the prototype, `solids` already has this exact shape (`{x,y,w,h,kind}`) — `kind` is prototype-only sugar to pick which of the three terrain draw functions to call; `server.js`'s existing `solids` array can gain the same optional `kind` field without touching physics (physics only reads `x,y,w,h`).

**Pose-driving logic** (not written yet, this is the integration instruction): in the real game, derive `pose` from existing physics state instead of the prototype's scripted demo timeline:
```js
const pose = !player.grounded ? 'jump' : (player.vx !== 0 ? 'run' : 'idle');
```
`drawRobotCourier` already reads `t` (use the existing `elapsed` variable) to animate leg swing/scarf sway/bob — no new timers needed.

**New state required for beetle/drone as real enemies** (out of scope for this task — flagging so it's not missed): `enemyStarts` currently only has the one patrol shape (`min/max/dir`, horizontal). A drone needs vertical sinusoidal movement (`baseY + sin(t*speed)*range`, as in the prototype) which the current enemy update loop doesn't support — it'll need a `kind` field and a branch in the enemy update step, plus a decision on whether `drawBeetle` fully replaces today's single enemy look or `drawDrone` is a second, distinct hazard type with different collision (flying, so it can't be stomped) — that's a gameplay decision for a future spec, not an art one.

**Textures are precomputed, not per-frame**: `terrainTexture(seg)` (roots + tufts) and the canopy/hill/star/vine decoration arrays are all built once at load using a seeded PRNG (`mulberry32`), then just read every frame. Keep this pattern when lifting into `server.js` — computing random tuft/root positions inside `draw()` every frame would both cost performance and make the ground visibly "crawl."

---

## 6. Verification actually performed

I do have browser tooling available and used it — this was tested, not just written:

- Served the folder over a temporary local HTTP server (`python3 -m http.server 8934`, stopped afterward) since the browser tool refuses `file://` navigation.
- Launched a **separate, isolated, driver-owned Chromium instance** (not the user's real browser) in the background and loaded the prototype there.
- Took real screenshots at desktop aspect and, after clicking the "Phone" toggle, at phone aspect. Both confirmed the full render pipeline works: gradient sky, twinkling stars, moon with light shaft, ruined-architecture silhouette, layered 3-tone canopy, glowing terrain edge, animated robot with scarf/visor/legs, a beetle, a drone with scanner beam, coins, and a star shard, all rendering correctly and at the right relative scale in both layouts.
- The first screenshot caught two real problems, which I fixed and re-verified with a second round of screenshots: (1) the ground's decorative "moss tufts" were sharp triangles that read as a danger spike-strip on safe ground — replaced with rounded moss-clump shapes; (2) the HUD's coin badge was an empty circle — filled with an actual coin-gradient icon. Canopy was also flattened into a uniform scalloped band on first render — widened its vertical variance and added shadow/highlight tones per lobe so it reads as volumetric foliage rather than a repeating trim pattern.
- **One caught-but-unfixed issue**: in the phone/portrait screenshot, the moon's light shaft (`drawMoon`'s faint downward gradient cone) reads as a more prominent vertical band than on desktop, because its polygon endpoints are sized as a fraction of `view.w`/`view.h` and portrait `view.h` is much taller relative to width. It's not broken, just more visually dominant than intended in that aspect. Fix direction: clamp the shaft's world-unit length/width instead of scaling it off `view.h`, or lower its alpha further on narrow aspects. Left as-is rather than iterating further within this task's scope — flagging it explicitly rather than claiming a fully polished result.
- **Unintended side effect to disclose**: my first verification attempt used `launch_app` against the system's real, already-running Chrome (hoping to reuse it), which opened a new window that became visible/foregrounded — an existing tab of the user's real browser was already open to what looked like the live deployed game. I could not get a CDP attachment to it (permission-gated, as it should be), took no further action on that window, and switched entirely to an isolated driver-owned browser instance for all actual testing. No files, tabs, or state in the user's real browser were modified, but the window-focus interruption itself did happen and is worth knowing about.

## 7. Priority list for lifting this into `server.js`

1. Terrain draw functions (ground/platform/ruin-platform) — highest visual payoff, and the collision-edge correctness note above makes this safe to do first with zero physics risk.
2. Background stack (sky/stars/moon/hills/architecture/canopy/fog/vines) — replaces the current ~15-line background block in `draw()` wholesale.
3. `drawRobotCourier` wired to real `pose` derivation from physics state (one-line change, see §5) — replaces `drawRobot()`.
4. `drawCollectibleCoin`/`drawCollectibleShard` — direct swap for the current coin/shard inline drawing.
5. `drawBeetle` as a visual swap for the current single enemy look (no new gameplay yet — same collision, same patrol, new paint only).
6. `drawDrone` + `drawAncientPillarPlatform` — hold until the vertical-movement/flying-hazard gameplay decision in §5 is made; these are ready visually but need new physics support to use meaningfully.
7. HUD pill CSS/DOM swap — cosmetic only, no gameplay risk.

Each step is independently testable, same incremental philosophy as `DESIGN.md`'s original priority list.
