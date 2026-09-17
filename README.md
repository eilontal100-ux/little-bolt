# Creature Call

An original three-stage rescue platformer. You start as Crag, a stout creature that smashes rock barriers. Rescue Glint, who glides on marked wind currents, and Sprig, who grows vine bridges over seed gaps — then use each companion's ability to open the path the other two can't. Original hand-authored pixel sprites give each creature a distinct silhouette and idle, run, jump, and ability poses. Floating habitats, cloud gardens, and crystal grottos replace the desert setting. All artwork is embedded in the single-file server.

Stages: Hollow Path (2700 units — teaches rescue, smash, glide, then grow, in a safe order), Windswept Terraces (2500 units), and Rootbound Ruins (3200 units). The second and third stages remix and combine all three abilities and each has an optional elevated relic-shard route. There are 21 coins and 3 relic shards across the campaign. Each stage ends at a habitat beacon; the third stage completes the campaign — there is no boss fight.

## Run

```sh
npm ci
npm start
```

Open http://localhost:3000. This single-file Node/Express app listens on `process.env.PORT || 3000` at `0.0.0.0`. No external assets, fonts, accounts, or database are required.

## Play

- Move: arrows or A/D. Jump: Space/W; hold for height, release for a short hop.
- Ability: C/K, or the phone ABILITY button. Crag smashes a nearby rock barrier; Sprig grows a persistent vine bridge at a nearby seed node; Glint gets lift only while the ability is held *and* Glint is airborne *and* inside a marked wind current — release, land, or leave the current and normal gravity resumes immediately.
- Switch companion: Q/E cycles between rescued companions, or press 1/2/3 to select Crag/Glint/Sprig directly, or use the phone SWITCH button. Switching is always allowed on the ground; switching in the air is also allowed, but it immediately clears any active glide so it can't be used to cheat extra lift.
- Rock barriers are tall walls a plain jump cannot clear. Wind gaps are wide ravines only Glint can cross. Seed gaps are wide too, and have a solid ceiling overhead specifically so gliding can't be used to skip growing the bridge — Sprig is required.
- Every companion is rescued by simply walking into them before their ability is ever needed to progress.
- Fullscreen: button or F. Escape exits. Unsupported/rejected fullscreen uses a reversible expanded view.
- Checkpoints preserve rescued companions and already-solved obstacles (smashed rocks, grown bridges) when you lose a life. A full restart resets the whole campaign back to just Crag.
- Mobile has independent direction, SWITCH, ABILITY, and JUMP buttons for simultaneous touches.

## Verification

`npm test` runs 31 automated checks covering movement/gravity/landing, platform collision, fixed-timestep determinism, camera clamp, coin collection, checkpoint respawn, jump buffering, ability-only traversal for each obstacle type (and proof the wrong or no companion cannot solve it), rescue-order correctness, hold/release glide physics, mid-air switch clearing an active glide, checkpoint/restart persistence of the roster and solved obstacles, solids being rebuilt fresh on every stage load (no reference leaks across a restart), stage completion/campaign-win flow, stage-width bounds, no-stuck-input on blur/visibility-change, fullscreen fallback, and server startup on `process.env.PORT`. All 31 pass. A scripted movement-and-ability traversal completes all three stages from spawn without teleporting or losing a life.

The integrated build passes the automated checks. Independent review was requested but blocked by the room handoff time limit. A full human campaign playthrough remains unverified.

## Deploy

`render.yaml` uses `npm ci`, `npm start`, and health check `/`. Merge the pull request, then deploy on Render. Reloading restarts the campaign; no persistence or audio is implemented.
