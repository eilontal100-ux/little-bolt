/*
 * CREATURE-ART.js — original art module for the creature-switching puzzle platformer overhaul.
 *
 * Self-contained: no globals, no image/asset loading, no DOM access outside the ctx passed in.
 * Call createCreatureArt() once to get { drawCreature, drawBackdrop, drawObstacle, palettes }.
 *
 * Body anchor contract: drawCreature(ctx, id, x, y, facing, pose, time) — x, y is the TOP-LEFT
 * corner of the existing 34x48 physics body (same box used by every creature). Call it directly
 * with the physics object's own x/y, no extra translate/offset math needed by the caller:
 *   art.drawCreature(ctx, player.creature, player.x, player.y, player.facing, pose, elapsed);
 * Art may visually overflow the 34x48 box (wide wings, wide rock shell) — that's expected, only
 * the box itself is used for collision.
 *
 * Obstacle contract: { type: 'rock' | 'wind' | 'seed', x, y, w, h, solved }.
 *   rock — a rubble wall crag must smash through (cracked/open once solved).
 *   wind — a gust barrier glint must glide across (calms/opens once solved).
 *   seed — a chasm sprig must grow a bridge over (sprouted/bridged once solved).
 *
 * No commercial sprites, characters, or settings are referenced or copied — all shapes, poses,
 * and palettes below are original to this project.
 */
function createCreatureArt() {
  'use strict';

  /* ---------- shared low-level pixel-grid renderer ---------- */
  // unit = world pixels per grid cell (2-3 world units per cell, per spec).
  function drawGrid(ctx, rows, pal, x, y, unit, flip) {
    const width = rows[0].length;
    for (let j = 0; j < rows.length; j++) {
      const row = rows[j];
      for (let i = 0; i < row.length; i++) {
        const ch = row[i];
        const color = pal[ch];
        if (!color) continue;
        const col = flip ? (width - 1 - i) : i;
        ctx.fillStyle = color;
        ctx.fillRect(Math.round(x + col * unit), Math.round(y + j * unit), unit, unit);
      }
    }
  }

  // Swap a single character at `idx` in `str` without touching its length —
  // used to derive run/jump/ability leg & wing variants from one base grid
  // so every pose in a creature stays exactly the same width automatically.
  function setChar(str, idx, ch) {
    return str.slice(0, idx) + ch + str.slice(idx + 1);
  }
  function withRows(base, overrides) {
    const rows = base.slice();
    for (const idx in overrides) {
      let row = rows[idx];
      const edits = overrides[idx];
      for (const [col, ch] of edits) row = setChar(row, col, ch);
      rows[idx] = row;
    }
    return rows;
  }

  /* =====================================================================
     PALETTES — creatures + the three habitat regions
     ===================================================================== */
  const PALETTES = {
    crag: { // warm stone body, amber crystal glow
      o: '#241a17', // outline
      h: '#b08a6c', // rock highlight
      s: '#7c6151', // rock shadow
      b: '#e0c19c', // belly / underside
      c: '#ffb454', // crystal glow (back spikes)
      cc: '#ffe3a8', // crystal core, brightest
      p: '#241a17', // pupil (dark dot directly on the face highlight)
      l: '#3a2c26', // leg
      g: '#ffb454' // ground-impact glow (smash ability)
    },
    glint: { // cool manta body, cyan glow
      o: '#1b2140',
      h: '#7186d6',
      s: '#4358a8',
      b: '#d8ecff',
      c: '#7cf6ff', // wingtip / spine glow
      e: '#eef6ff', // eye white
      p: '#12162b', // pupil
      g: '#8fd8ff' // glide trail glow
    },
    sprig: { // green amphibian body, seedling glow
      o: '#1c3324',
      h: '#7fbf6a',
      s: '#4f8a48',
      b: '#c7edb0',
      ear: '#5fae5a', // leaf-ear
      earVein: '#2f6b3a',
      c: '#ffe08a', // seed / sprout glow
      p: '#1c3324',
      g: '#9be86a' // grow-ability glow
    },
    habitat: { // floating islands, daylight
      skyTop: '#bdeaff',
      skyBottom: '#eafff2',
      islandFar: '#9fd9c9',
      islandNear: '#5fb896',
      islandEdge: '#e7fff0',
      cloudFar: '#ffffff'
    },
    grotto: { // crystal grotto, dim glowing interior
      skyTop: '#1a1240',
      skyBottom: '#341a4a',
      rockFar: '#2c1f52',
      rockNear: '#40296a',
      crystal: '#8ef7ff',
      crystalWarm: '#ffb4f0'
    },
    garden: { // cloud garden, soft pastel sky
      skyTop: '#ffd9ef',
      skyBottom: '#fff3d6',
      cloudFar: '#ffffff',
      cloudNear: '#ffeaf7',
      cloudEdge: '#ffc8e6',
      bloom: '#ffe08a'
    }
  };

  /* =====================================================================
     CRAG — round rock-backed quadruped, ability: smash
     13 cols x 13 rows, unit 3 (39x39px art, anchored bottom-center of the
     34x48 box: offsetX -3, offsetY +9 so its feet sit on the box's floor).
     ===================================================================== */
  const CRAG_IDLE = [
    '.....oo......',
    '....occo.....',
    '...occcco....',
    '..occhhcco...',
    '.occhhhhcco..',
    'occhhhhhhcco.',
    'occchhhhhcco.',
    'occhh.p.phcco',
    '.occhhhhhcco.',
    '..occsssscco.',
    '..occbbbbcco.',
    '...ll....ll..',
    '..oo......oo.'
  ];
  const CRAG_RUN_A = withRows(CRAG_IDLE, { 11: [[2, 'l'], [3, 'l'], [4, '.'], [9, '.'], [10, '.']] });
  const CRAG_RUN_B = withRows(CRAG_IDLE, { 11: [[3, '.'], [4, '.'], [9, 'l'], [10, 'l']] });
  const CRAG_JUMP = withRows(CRAG_IDLE, {
    11: [[3, '.'], [4, '.'], [9, '.'], [10, '.']],
    12: [[2, '.'], [3, 'o'], [10, 'o'], [11, '.']]
  });
  const CRAG_ABILITY = withRows(CRAG_IDLE, {
    7: [[6, 'p'], [7, 'p']],
    11: [[3, '.'], [4, 'l'], [5, 'l'], [8, 'l'], [9, 'l'], [10, '.']],
    12: [[2, 'g'], [3, 'g'], [10, 'g'], [11, 'g']]
  });
  const CRAG_POSES = { idle: [CRAG_IDLE], run: [CRAG_RUN_A, CRAG_RUN_B], jump: [CRAG_JUMP], ability: [CRAG_ABILITY] };
  const CRAG_LAYOUT = { unit: 3, offsetX: -3, offsetY: 9 };

  /* =====================================================================
     GLINT — winged manta-like creature, ability: glide
     17 cols x 11 rows, unit 3 (51x33px art, vertically centered over the
     34x48 box: offsetX -9, offsetY 8).
     ===================================================================== */
  const GLINT_IDLE = [
    '.......oo........',
    '......occo.......',
    '.....ohhhoo......',
    '....ohhh.ep.ooooo',
    '...ommmmmm.ooo.c.',
    '..ommmmmmmmoo....',
    '.ommmmmmmmmmoo...',
    'ommmmmmmmmmmmoo..',
    '.obbbbbbbbbbo....',
    '..occ.cc.cco.....',
    '...o......o......'
  ];
  const GLINT_RUN_A = withRows(GLINT_IDLE, { 6: [[16, 'c']] });
  const GLINT_RUN_B = withRows(GLINT_IDLE, { 6: [[16, '.']] });
  const GLINT_JUMP = withRows(GLINT_IDLE, {
    2: [[5, 'o'], [6, 'h'], [7, 'h'], [8, 'o']],
    3: [[9, 'o'], [10, 'o'], [11, 'o'], [12, '.']]
  });
  const GLINT_ABILITY = withRows(GLINT_IDLE, {
    4: [[10, 'c'], [11, 'c']],
    5: [[0, 'c'], [1, '.']],
    9: [[3, 'c'], [4, 'c'], [12, 'c'], [13, 'c']],
    10: [[2, 'g'], [3, 'g'], [13, 'g'], [14, 'g']]
  });
  const GLINT_POSES = { idle: [GLINT_IDLE], run: [GLINT_RUN_A, GLINT_RUN_B], jump: [GLINT_JUMP], ability: [GLINT_ABILITY] };
  const GLINT_LAYOUT = { unit: 3, offsetX: -9, offsetY: 8 };

  /* =====================================================================
     SPRIG — leaf-eared amphibian, ability: grow bridges
     11 cols x 13 rows, unit 3 (33x39px art, anchored bottom-center of the
     34x48 box: offsetX 0, offsetY 9).
     ===================================================================== */
  const SPRIG_IDLE = [
    '..ee...ee..',
    '.eeee.eeee.',
    '.eeee.eeee.',
    '..oooooo...',
    '.ohhhhhho..',
    'ohhh.p.hhho',
    'ohhhhhhhhho',
    'ohhh.p.hhho',
    '.ohhhhhho..',
    '..obbbbo...',
    '..oll.llo..',
    '..oo..oo...',
    '...........'
  ];
  const SPRIG_RUN_A = withRows(SPRIG_IDLE, { 10: [[3, '.'], [4, 'l'], [6, 'l'], [7, '.']], 11: [[2, '.'], [8, '.']] });
  const SPRIG_RUN_B = withRows(SPRIG_IDLE, { 10: [[2, 'l'], [3, '.'], [7, '.'], [8, 'l']] });
  const SPRIG_JUMP = withRows(SPRIG_IDLE, {
    9: [[3, 'b'], [7, 'b']],
    10: [[3, '.'], [4, '.'], [6, '.'], [7, '.']],
    11: [[2, '.'], [3, 'o'], [7, 'o'], [8, '.']]
  });
  const SPRIG_ABILITY = withRows(SPRIG_IDLE, {
    5: [[4, 'c']],
    7: [[6, 'c']],
    9: [[2, 'c'], [3, 'g'], [7, 'g'], [8, 'c']],
    12: [[4, 'g'], [5, 'g'], [6, 'g']]
  });
  const SPRIG_POSES = { idle: [SPRIG_IDLE], run: [SPRIG_RUN_A, SPRIG_RUN_B], jump: [SPRIG_JUMP], ability: [SPRIG_ABILITY] };
  const SPRIG_LAYOUT = { unit: 3, offsetX: 0, offsetY: 9 };

  const CREATURES = {
    crag: { poses: CRAG_POSES, layout: CRAG_LAYOUT, pal: PALETTES.crag },
    glint: { poses: GLINT_POSES, layout: GLINT_LAYOUT, pal: PALETTES.glint },
    sprig: { poses: SPRIG_POSES, layout: SPRIG_LAYOUT, pal: PALETTES.sprig }
  };

  /* ---------- drawCreature(ctx, id, x, y, facing, pose, time) ---------- */
  function drawCreature(ctx, id, x, y, facing, pose, time) {
    const def = CREATURES[id];
    if (!def) return;
    const variants = def.poses[pose] || def.poses.idle;
    // Guard against a negative index: callers may pass a tiny negative time
    // (e.g. a browser rAF timestamp landing fractionally before the clock
    // read used to zero it), and JS's % does not floor negative dividends.
    const frameIndex = ((Math.floor(time * 8) % variants.length) + variants.length) % variants.length;
    const frame = variants.length > 1 ? variants[frameIndex] : variants[0];
    const { unit, offsetX, offsetY } = def.layout;
    drawGrid(ctx, frame, def.pal, x + offsetX, y + offsetY, unit, facing < 0);
  }

  /* =====================================================================
     drawBackdrop(ctx, view, camera, region, time)
     region: 'habitat' | 'grotto' | 'garden' — replaces all desert/human
     motifs with floating-island / crystal-grotto / cloud-garden scenery.
     view = {w,h} viewport size, camera = world-space scroll offset.
     Screen-space parallax only — call BEFORE any ctx.translate(-camera,0).
     ===================================================================== */
  function drawBackdrop(ctx, view, camera, region, time) {
    const pal = PALETTES[region] || PALETTES.habitat;
    const grad = ctx.createLinearGradient(0, 0, 0, view.h);
    grad.addColorStop(0, pal.skyTop);
    grad.addColorStop(1, pal.skyBottom);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, view.w, view.h);

    if (region === 'grotto') {
      // Far/near crystal clusters jutting from cave walls, slow glow pulse.
      drawParallaxCluster(ctx, view, camera, 0.25, pal.rockFar, pal.crystal, time, 0.35, 9);
      drawParallaxCluster(ctx, view, camera, 0.5, pal.rockNear, pal.crystalWarm, time, 0.55, 7);
    } else if (region === 'garden') {
      drawParallaxClouds(ctx, view, camera, 0.2, pal.cloudFar, time, 0.4);
      drawParallaxClouds(ctx, view, camera, 0.45, pal.cloudNear, time, 0.7, pal.cloudEdge);
    } else {
      // habitat: distant + near floating islands drifting slowly.
      drawParallaxIslands(ctx, view, camera, 0.2, pal.islandFar, time, 0.5);
      drawParallaxIslands(ctx, view, camera, 0.45, pal.islandNear, time, 0.8, pal.islandEdge);
    }
  }

  function drawParallaxIslands(ctx, view, camera, factor, color, time, speed, edgeColor) {
    const shift = (camera * factor) % 260;
    ctx.fillStyle = color;
    for (let x = -260 + -shift; x < view.w + 260; x += 260) {
      const bob = Math.sin(time * speed + x * 0.01) * 6;
      const y = view.h * 0.62 + bob;
      ctx.beginPath();
      ctx.ellipse(x, y, 96, 22, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(x - 40, y, 80, 30 + (view.h - y));
      if (edgeColor) {
        ctx.fillStyle = edgeColor;
        ctx.fillRect(x - 96, y - 3, 192, 4);
        ctx.fillStyle = color;
      }
    }
  }

  function drawParallaxCluster(ctx, view, camera, factor, rockColor, glowColor, time, speed, count) {
    const shift = (camera * factor) % 220;
    for (let x = -220 + -shift; x < view.w + 220; x += 220) {
      ctx.fillStyle = rockColor;
      ctx.beginPath();
      ctx.moveTo(x - 40, view.h);
      ctx.lineTo(x - 10, view.h * 0.45);
      ctx.lineTo(x + 30, view.h);
      ctx.closePath();
      ctx.fill();
      const pulse = 0.55 + Math.sin(time * speed + x) * 0.25;
      ctx.globalAlpha = pulse;
      ctx.fillStyle = glowColor;
      ctx.fillRect(x - 14, view.h * 0.5, 4, view.h * 0.35);
      ctx.fillRect(x - 6, view.h * 0.58, 4, view.h * 0.28);
      ctx.globalAlpha = 1;
    }
  }

  function drawParallaxClouds(ctx, view, camera, factor, color, time, speed, edgeColor) {
    const shift = (camera * factor) % 300;
    ctx.fillStyle = color;
    for (let x = -300 + -shift; x < view.w + 300; x += 300) {
      const bob = Math.sin(time * speed + x * 0.008) * 8;
      const y = view.h * 0.3 + bob;
      for (const [dx, dy, r] of [[-40, 10, 30], [0, -8, 40], [45, 8, 32], [85, 14, 24]]) {
        ctx.beginPath();
        ctx.arc(x + dx, y + dy, r, 0, Math.PI * 2);
        ctx.fill();
      }
      if (edgeColor) {
        ctx.fillStyle = edgeColor;
        ctx.beginPath();
        ctx.arc(x, y - 8, 42, 0, Math.PI);
        ctx.fill();
        ctx.fillStyle = color;
      }
    }
  }

  /* =====================================================================
     drawObstacle(ctx, obstacle, time)
     obstacle: { type: 'rock' | 'wind' | 'seed', x, y, w, h, solved }
     World-space — call inside the existing ctx.translate(-camera,0) block,
     same coordinate space as `solids`.
     ===================================================================== */
  function drawObstacle(ctx, obstacle, time) {
    const { type, x, y, w, h, solved } = obstacle;
    if (type === 'rock') drawRockObstacle(ctx, x, y, w, h, solved, time);
    else if (type === 'wind') drawWindObstacle(ctx, x, y, w, h, solved, time);
    else if (type === 'seed') drawSeedObstacle(ctx, x, y, w, h, solved, time);
  }

  function drawRockObstacle(ctx, x, y, w, h, solved, time) {
    // A rubble wall crag must smash. Solved = cracked open with rubble piles either side.
    if (!solved) {
      ctx.fillStyle = '#241a17';
      ctx.fillRect(x, y, w, h);
      // Offset brick/block courses read as a stone wall (a single grid of
      // evenly-spaced vertical stripes reads as wood planking instead).
      const blockW = 14, blockH = 10, gap = 2;
      let row = 0;
      for (let by = y + gap; by < y + h - gap; by += blockH + gap) {
        const rowOffset = (row % 2 === 0) ? 0 : -(blockW / 2);
        for (let bx = x + rowOffset; bx < x + w; bx += blockW + gap) {
          const left = Math.max(bx, x);
          const right = Math.min(bx + blockW, x + w);
          const bw = right - left - gap;
          if (bw <= 0) continue;
          ctx.fillStyle = '#7c6151';
          ctx.fillRect(left + gap / 2, by, bw, blockH);
          ctx.fillStyle = '#b08a6c';
          ctx.fillRect(left + gap / 2, by, bw, 3);
        }
        row++;
      }
      const pulse = 0.4 + Math.sin(time * 3) * 0.15;
      ctx.globalAlpha = pulse;
      ctx.fillStyle = '#ffb454';
      ctx.fillRect(x + w / 2 - 3, y + h / 2 - 3, 6, 6);
      ctx.globalAlpha = 1;
    } else {
      ctx.fillStyle = '#7c6151';
      ctx.fillRect(x, y + h - 10, w * 0.35, 10);
      ctx.fillRect(x + w * 0.65, y + h - 10, w * 0.35, 10);
      ctx.fillStyle = '#b08a6c';
      ctx.fillRect(x + 2, y + h - 6, w * 0.3, 6);
      ctx.fillRect(x + w * 0.68, y + h - 6, w * 0.3, 6);
    }
  }

  function drawWindObstacle(ctx, x, y, w, h, solved, time) {
    // A gust barrier glint must glide across. Solved = calmed to a gentle drift.
    const intensity = solved ? 0.35 : 1;
    ctx.strokeStyle = solved ? '#8fd8ff' : '#4358a8';
    ctx.lineWidth = 3;
    for (let i = 0; i < 5; i++) {
      const t = time * (solved ? 1.2 : 3) + i * 1.3;
      const cx = x + w / 2 + Math.sin(t) * (w / 2) * intensity;
      const cy = y + (i / 5) * h;
      ctx.beginPath();
      ctx.moveTo(cx - 16, cy);
      ctx.quadraticCurveTo(cx, cy - 10, cx + 16, cy);
      ctx.stroke();
    }
    if (!solved) {
      ctx.fillStyle = '#1b214033';
      ctx.fillRect(x, y, w, h);
    }
  }

  function drawSeedObstacle(ctx, x, y, w, h, solved, time) {
    // A chasm sprig grows a bridge over. Solved = sprouted vine-bridge spanning the gap.
    if (!solved) {
      ctx.fillStyle = '#4f8a48';
      ctx.beginPath();
      ctx.ellipse(x + w / 2, y + h - 6, w * 0.3, 10, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffe08a';
      const bob = Math.sin(time * 2) * 2;
      ctx.fillRect(x + w / 2 - 3, y + h - 16 + bob, 6, 10);
    } else {
      ctx.fillStyle = '#7fbf6a';
      ctx.fillRect(x, y + h - 8, w, 8);
      ctx.fillStyle = '#2f6b3a';
      for (let i = 0; i < w; i += 14) {
        ctx.fillRect(x + i + 4, y + h - 8, 3, 8);
      }
      ctx.fillStyle = '#9be86a';
      ctx.fillRect(x, y + h - 10, w, 2);
    }
  }

  return { drawCreature, drawBackdrop, drawObstacle, palettes: PALETTES };
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { createCreatureArt };
}
