# Moonlight Courier — Design Spec

Upgrade of "Little Bolt" into **Moonlight Courier**: a little robot carrying a lost star home through a glowing alien forest at night. Single-file Node/Express canvas runtime is retained; everything below is procedural canvas art (rects, circles, `createRadialGradient`) — no images/sprites. Base physics constants (`SPEED 280`, `GRAVITY 1800`, `JUMP 680`, apex ≈128, max ground-jump range ≈210, world height 600, ground surface `y=500`) are kept as-is; only feel, layout, and content expand. Design work only — no code was changed.

Original: `/Users/talia/.openmausbot/task-workspaces/cb4b78b1-29be-4553-a3aa-c50062b22776/dff5e7be-3341-4613-a6a1-22dfc949b568/server.js`

---

## 1. Palette (exact hex)

Shared night base + one glow-accent per stretch. Danger stays one consistent color everywhere for readability.

| Role | Hex | Use |
|---|---|---|
| `BG-DEEP` | `#0d1130` | Sky base fill |
| `BG-MID` | `#1b2450` | Distant hill silhouettes (parallax, same triangles as today) |
| `MOON` | `#f6ead0` | Moon core circle |
| `MOON-HALO` | `#f6ead055` | Radial gradient outer stop (alpha) around moon |
| `GROUND-SHADOW` | `#241a3d` | Universal soil/rock body under all ground blocks |
| `GROUND-TRIM` | `#0b0f24` | Ground top trim / outline, robot outline, enemy outline |
| `TEXT-LIGHT` | `#f2ecff` | HUD text on dark bar |
| `ACCENT-GOLD` | `#ffcf6b` | Coins, star cargo, altar, "safe/reward" color family |
| `ACCENT-GOLD-CORE` | `#fff2c4` | Coin/star highlight, robot visor glow |
| `DANGER` | `#ff6b57` | All enemies, everywhere (consistent hazard read) |
| `DANGER-DARK` | `#7a2418` | Enemy shading |
| `SAFE-CYAN` | `#7cf0ff` | Shield, checkpoints, player body accent (ties courier to "safe" color family) |

Per-stretch foliage/glow accent (background midground + platform trim only — ground trim/shadow stay universal above):

| Stretch | Glow | Mid-fill | Dark-fill |
|---|---|---|---|
| 1 — Landing Glade | `#35e6c4` (cyan moss) | `#1f6b5c` | `#123f38` |
| 2 — Mushroom Canopy | `#e364e0` (magenta spore) | `#6b2f77` | `#3c1a46` |
| 3 — Crystal Hollow | `#7c7bff` (violet crystal) | `#3a3a82` | `#201f52` |

Star shard (rare optional collectible, distinct from coins): core `#d7e8ff`, ring `#7c7bff`.

Robot recolor: chassis `#2be3c2` (cyan, echoes stretch-1 moss + safe-cyan family), dark plating `#123f38`, visor/eyes `#fff2c4`, carried star on its back: core `#ffe17a`, ring `#ffcf6b`, gently pulsing (`sin(time)` alpha 0.7–1.0).

---

## 2. Fonts

One Google Font, used sparingly, so gameplay never blocks on a font load:

- **Headline/wordmark/HUD brand/end-screen `<h1>`**: `Orbitron`, weight 700/900 — `font-family: 'Orbitron', 'Segoe UI', system-ui, sans-serif;`
- **Everything else** (HUD numbers, help text, end-screen paragraph, canvas labels): unchanged `system-ui, sans-serif` — zero extra network dependency for anything gameplay-critical.

Load via standard `<link>` in `<head>`:
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@700;900&display=swap" rel="stylesheet">
```

---

## 3. World layout (concrete numbers)

`WORLD = { width: 5300, height: 600, spawn: {x:80,y:452}, altarX: 5150 }`. Ground collision surface stays `y=500, h=100` throughout — only fill color changes by x-range (see §4). This preserves all existing jump tuning.

**Ground segments / gaps** (reuses proven original gap widths for the first two, extends to slightly larger-but-still-fair gaps deeper in, all ≤190 so the main path is always completable on the base jump alone — power-ups are optional, never gating):

| # | Segment x-range | width | Gap after | width |
|---|---|---|---|---|
| 1 | 0–620 | 620 | A | 130 |
| 2 | 750–1430 | 680 | B | 150 |
| 3 | 1580–2260 | 680 | C | 150 |
| 4 | 2410–3120 | 710 | D | 170 |
| 5 | 3290–3960 | 670 | E | 170 |
| 6 | 4130–4620 | 490 | F | 190 |
| 7 | 4810–5300 | 490 | — final landing + altar | |

Stretch boundaries (art/theme only, not collision-aligned): **Landing Glade** x 0–1600, **Mushroom Canopy** x 1600–3300, **Crystal Hollow** x 3300–5300.

**Floating platforms** (`h=22`, all elevated 110 above the ground they serve — under the ≈126 apex, matching original tuning):

- P1 `x=280,y=390,w=150` and P2 `x=990,y=390,w=160` — Glade, same spots as today.
- P3 `x=1790,y=390,w=170` (base), P4 `x=2000,y=320,w=110` (+70), P5 `x=2190,y=260,w=90` (+60) — Canopy mushroom-cap trio, a vertical detour; P5 holds a star shard.
- P6 `x=3450,y=390,w=110` and P7 `x=3700,y=330,w=90` — Hollow crystal shards, narrower than earlier platforms for a precision feel.
- P8 (optional, `x=4350,y=250,w=90`) — reachable only using the Starleap extra air-jump; holds the 3rd star shard + a small bonus coin cluster.

**Coins**: keep the original's arc pattern (low arc `y≈465`, mid arc `y≈370`, platform-top `y≈355`) and density (~1 coin per 170 world units) extended across all 5300 units → **~31 coins total**. Mirror the existing `coinStarts` spacing formula into the new segments; exact per-coin coordinates are a mechanical extension, not a new pattern.

**Star shards** (3, rare/optional, silver-violet, r=13 vs coin r=11 for a visibly "special" read):
- Stretch 1: `x=1080,y=330` (small precision reach off P2).
- Stretch 2: `x=2210,y=225` (atop P5 — rewards the mushroom-trio detour).
- Stretch 3: `x=4380,y=225` (atop hidden P8 — Starleap-gated).

**Enemies** (6 total, `w=34,h=28`, patrol speed 60 — unchanged mechanic, only recolored; always `DANGER` red regardless of biome for consistent hazard reading):
- E1 `x=910,min=810,max=950,dir=1` (unchanged from original)
- E2 `x=1700,min=1630,max=1740,dir=-1` (unchanged from original)
- E3 `x=2600,min=2500,max=2700,dir=1` (new — guards the Canopy mushroom-trio approach)
- E4 `x=3600,min=3500,max=3800,dir=1` (new — Canopy/Hollow transition)
- E5 `x=4300,min=4200,max=4450,dir=-1` (new — light gauntlet near the Starleap gaps)
- E6 `x=4950,min=4900,max=5050,dir=1` (new — final guard before the altar, mirrors original's pre-flag pacing)

**Checkpoints** (2 beacon obelisks, `w=20,h=90`, on ground):
- CP1 `x=1550,y=410` — end of Landing Glade.
- CP2 `x=3250,y=410` — start of Crystal Hollow.

Behavior: touching a beacon updates the active respawn point to that beacon's ground position (replacing `WORLD.spawn` for life-loss respawns only). Coin/enemy-defeated/star-shard state already persists through life loss (as today) — checkpoints only change *where* you respawn, not what you keep. Full game-over (`lives===0`) still does a complete restart to `WORLD.spawn`, matching current `restart()` behavior. Visual: idle pillar `GROUND-SHADOW` fill / `#4a4a7a` trim; on activation, trim flashes to `SAFE-CYAN`, stays lit, small rising-particle burst, HUD toast "Checkpoint" fading over ~1.2s.

**Altar (replaces flag)**: `x=5150`, same touch geometry as today's flag (`x,310,w:20,h:190` hit-box, adapted to new x). Visual: dark pedestal `GROUND-SHADOW`, glowing star socket `ACCENT-GOLD` core with soft `MOON`-colored beam above it — the carried star "docks" into the altar on win.

---

## 4. Biome art per stretch

All three share the same ground trim/shadow and sky/moon treatment; only the glow accent and foliage silhouette shift, so the level reads as one continuous place, not three unrelated skins.

1. **Landing Glade** (tutorial pacing): soft cyan-moss foliage triangles/tufts along ground tops and platform edges, using `#35e6c4` glow over `#1f6b5c`/`#123f38` fill, low particle density. Calmest stretch — this is where onboarding hints live (§6).
2. **Mushroom Canopy**: magenta-spore mushroom-cap silhouettes behind the parallax hills, glow `#e364e0` over `#6b2f77`/`#3c1a46`; the P3–P5 platform trio is drawn as literal giant mushroom caps (rounded top rect + thin stem rect) in this palette. Occasional drifting spore dot (small `#e364e0` circle, slow upward float, alpha fade, purely decorative, ~1 per 3s per screen) for atmosphere.
3. **Crystal Hollow**: jagged violet crystal silhouettes, glow `#7c7bff` over `#3a3a82`/`#201f52`; P6/P7/P8 drawn as angular crystal shards (simple polygon via `ctx.moveTo/lineTo`, not rects, to read as "harder/sharper" than the earlier soft platforms) — reinforces that this is the toughest stretch purely through shape language.

---

## 5. HUD & screens

**In-game HUD bar** (top, DOM overlay over canvas, same positioning approach as today's `.hud`): left = wordmark "MOONLIGHT COURIER" in Orbitron 700, 13px, letter-spacing 3px, `TEXT-LIGHT`. Right = a stat cluster, left-to-right: star-shard count (small `★` glyph + "x/3", `ACCENT-GOLD-CORE`), coin count (`●` glyph + count, `ACCENT-GOLD`), lives as three heart glyphs (`♥`) that go from `SAFE-CYAN` (full) to `#3a3a5a` (lost) — no text label needed. Then two power-up chips, always visible but dim/inactive until picked up: shield chip (hex glyph, `SAFE-CYAN` when held, empties on use), Starleap chip (star glyph with a simple text countdown "4.2s" while active, dim otherwise).

**Mobile (<760px or coarse pointer)**: identical structure to today's responsive rules — HUD chips shrink to icon+number only (drop "MOONLIGHT COURIER" wordmark text to a small icon glyph at very narrow widths, matching the existing `@media(max-width:760px)` pattern already in the file), touch dpad bottom-left, jump button bottom-right, safe-area insets preserved exactly as today.

**Onboarding**: no separate start screen (game still starts immediately). Replace the current static in-world "LITTLE BOLT" canvas text with two small canvas-drawn hint labels near spawn that fade out (alpha ease over 600ms) the first time each action is used, or after 6s, whichever first: "→ MOVE" near `x=150`, "SPACE JUMP" near the first gap (`x≈560`). Same `label()` helper, `TEXT-LIGHT` at low alpha, no new system.

**End screens** (win/lose), same card structure and DOM ids as today, re-themed:
- Card background: `#151033` with a 1px border `SAFE-CYAN` at 25% alpha (win) or `DANGER` at 25% alpha (lose) — same card shape, different accent border tells the two apart instantly.
- Title font: Orbitron 900.
- Win: "Star Delivered!" / detail line shows coins **and** star shards collected ("Coins: 24/31 · Star shards: 2/3"). Lose: "Signal Lost" / same reassuring detail line as today.
- Button: flat `SAFE-CYAN` background (win) / flat `ACCENT-GOLD` background (lose) — kept as one solid color each, no gradients, for readability and contrast on the dark card.

### CSS (ready-to-use, extends today's stylesheet — same selectors, new values)

```css
:root{
  --bg-deep:#0d1130; --text-light:#f2ecff; --accent-gold:#ffcf6b;
  --safe-cyan:#7cf0ff; --danger:#ff6b57; --card-bg:#151033;
}
html,body{margin:0;width:100%;height:100%;overflow:hidden;background:var(--bg-deep);color:var(--text-light);font-family:system-ui,sans-serif}
.brand{font:700 13px 'Orbitron','Segoe UI',system-ui,sans-serif;letter-spacing:3px;color:var(--text-light)}
.stats{display:flex;gap:16px;font-size:15px;font-weight:750;color:var(--text-light)}
.chip{opacity:.35;transition:opacity .2s}
.chip.active{opacity:1;color:var(--safe-cyan)}
.overlay{position:absolute;inset:0;display:grid;place-items:center;background:#0d1130aa;backdrop-filter:blur(5px);z-index:3}
.overlay[hidden]{display:none}
.card{width:min(88%,380px);background:var(--card-bg);border:1px solid var(--safe-cyan)40;border-radius:24px;padding:36px;text-align:center;box-shadow:0 20px 70px #05061a80}
.card.lose{border-color:var(--danger)40}
.card h1{font:900 40px 'Orbitron','Segoe UI',system-ui,sans-serif;letter-spacing:-1px;margin:8px 0 12px;color:var(--text-light)}
.card p{line-height:1.6;color:var(--text-light)cc}
.card button{border:0;border-radius:12px;padding:16px 32px;font:750 16px system-ui;cursor:pointer;color:#0d1130}
.card button.win{background:var(--safe-cyan)}
.card button.lose{background:var(--accent-gold)}
.card button:focus-visible{outline:3px solid var(--accent-gold);outline-offset:4px}
.toast{position:absolute;left:50%;top:70px;transform:translateX(-50%);font:700 13px 'Orbitron',system-ui,sans-serif;color:var(--safe-cyan);opacity:0;pointer-events:none}
```

---

## 6. Power-ups

**Aegis Spark (one-hit shield)** — pickup: `x=1650,y=452` (ground, Canopy entrance, safe pickup before the E3 gauntlet). Visual: a slowly rotating hex outline, `SAFE-CYAN` at 60% alpha, `#fff` rim highlight, r≈16. Effect: absorbs exactly **one** enemy/hazard hit without losing a life or resetting position; does **not** protect against falling into a pit (keeps the rule simple and readable — shield is combat-only). On absorb: ring flashes white then bursts into 6 small cyan shard particles, HUD shield chip empties. Persists through checkpoint respawn if still held; consumed only on use.

**Starleap (timed double jump)** — pickup: `x=3350,y=452` (ground, Hollow entrance, right where the harder gaps begin). Duration: **8 seconds** from pickup, countdown shown in the HUD chip. Effect: while active, grants exactly one extra mid-air jump per airborne trip (impulse `vy=-580`, slightly weaker than the ground jump's `-680` so it reads as a distinct "float," not a stronger jump), refreshed every time the player next touches ground while the timer is still running. Visual while airborne on the bonus jump: a short trailing sparkle (3–4 `ACCENT-GOLD-CORE` particles behind the robot, 200ms fade). Timer does not pause or carry over — if it expires mid-level it's simply gone until next playthrough (single-use per attempt, like coins); dying resets the active timer to 0 (an incentive not to throw it away, without being punitive — coins/shards already collected are unaffected).

Both pickups use the same collision treatment as coins (circle test, `r≈14`), are one-time per attempt (state persists like coins through life loss/checkpoint), and are optional: the main path is always completable without either, but Starleap opens the P8 detour (3rd star shard) and Aegis Spark makes the E3/mushroom-trio stretch safer, not different in destination.

---

## 7. Jump feel

Applied inside the existing `update()` physics step, no new systems:

- **Coyote time**: 100ms grace window after walking off a ledge (tracked via a small `coyoteTimer` counting down from 0.1s, reset to 0.1s every frame `grounded` is true) during which a jump press still fires as a full jump.
- **Input buffer**: a jump press up to 120ms *before* landing is remembered (`jumpBufferTimer` set to 0.12s on press, counted down each frame) and fires automatically the instant `grounded` becomes true.
- **Variable jump height (short hop)**: if the jump button is released while `vy < 0` (still ascending), immediately set `vy = vy * 0.45` — a snappy tap gives a short hop, holding gives the full `-680` arc. This is the single biggest feel upgrade for the least code.

These three combined are what make the existing gaps (130–190) feel fair and responsive rather than precise-to-the-pixel, without changing any of the tuned distance/height numbers in §3.

---

## 8. Particles & feedback (all procedural rects/circles, same `rect()`/`circle()` helpers already in the file)

- **Landing dust**: 4–6 small fading squares at the feet on a hard landing (`vy` above a threshold at the grounded transition), tinted to the local ground color, 250ms lifespan.
- **Coin collect**: 5-particle gold burst + HUD coin number briefly scales up (CSS `.pulse` class, 150ms).
- **Star shard collect**: 8-particle silver-violet burst + HUD toast "Star Shard!" (uses the `.toast` CSS above), fades over 1.5s.
- **Enemy defeat**: existing squish kept, add 3–4 small `DANGER`-colored poof particles.
- **Shield absorb**: white flash ring → 6 cyan shard particles, chip empties.
- **Power-up pickup**: small burst in the power-up's own color, chip fades in.
- **Checkpoint activation**: vertical `SAFE-CYAN` light-beam pulse + 6 rising particles + "Checkpoint" toast.

---

## 9. Priority list (build order for a finished feel within scope)

1. Palette + biome-tinted rendering (background/ground/foliage per stretch) — highest visual payoff, zero logic risk.
2. Expanded level layout (§3 solids/coins/enemies) — reuses existing collision code unchanged.
3. Checkpoints (2 beacons + respawn-point override) — small, self-contained state change.
4. Jump feel (coyote time, input buffer, variable jump height) — physics-only, inside existing `update()`.
5. Power-ups (Aegis Spark, Starleap) + HUD chips — new state fields + pickup collision + two conditional behaviors.
6. Particle/feedback polish (dust, sparkles, toasts, beacon glow) — purely visual, safe to trim first if time runs short.
7. HUD/end-screen re-theme (Orbitron, CSS above, mobile icon-only chips) — CSS/DOM only, no gameplay risk.

Each step is independently testable and playable on its own, so Pixel can verify incrementally rather than only at the end.


## Implementation decisions

The lead corrected checkpoint positions to x=1610 and x=3320 because the proposed positions were inside gaps. The shield is at x=1645, before the second enemy. The first two patrols start at x=900 and x=1700 to leave landing room. Starleap lasts 12 seconds and has a second pickup at x=4180 so exploring does not consume the only chance at the high fragment. P5 is x=2170,w=110; P6 is w=140; P7 is x=3640,w=110; P8 is y=280,w=120. There are exactly 32 coins. Fonts use the system stack, keeping the entire game free of external asset requests. Runtime coordinates in server.js are authoritative.
