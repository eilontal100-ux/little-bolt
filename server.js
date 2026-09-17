'use strict';
const express = require('express');
const app = express();

// The entire browser game is embedded in this file. Coordinates are world units.
function gameClient() {
  'use strict';
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const SCENE = { width: 2400, height: 600, groundY: 500 };

  const PAL = {};
  [
    ['habitat',['#192b52','#406587','#88c8b0'],'#456d68','#355457','#213a49','#a8edb0'],
    ['garden',['#394c83','#799ec1','#c1e4e7'],'#526b89','#414f73','#293652','#d0f2cd'],
    ['grotto',['#181f3f','#323c66','#52647c'],'#545a81','#424765','#292e4e','#b9a5fa'],
  ].forEach(([id,sky,ground,mid,deep,edge])=>{PAL[id]={sky,ground,mid,deep,edge,pillar:mid,accent:edge};});

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
  
  
  const ART = createCreatureArt();

  // Hand-authored sprite grids share one four-world-unit pixel scale.
  function sprite(rows,x,y,colors,unit=4,flip=false){
    const w=rows[0].length*unit;
    rows.forEach((row,j)=>[...row].forEach((c,i)=>{
      if(colors[c]){ctx.fillStyle=colors[c];ctx.fillRect(Math.round(x+(flip?w-(i+1)*unit:i*unit)),Math.round(y+j*unit),unit,unit);}
    }));
  }
  ART.drawCollectibleCoin = function(ctx,x,y,t){
    sprite(['.ooo.','oyywo','oyywo','oyyyo','.ooo.'],x-10,y-10+Math.floor(Math.sin(t*3+x)*2)*2,{o:'#9d632d',y:'#ffc75b',w:'#fff0b3'});
  };
  ART.drawCollectibleShard = function(ctx,x,y,t){
    sprite(['...w...','..wvw..','.wvvvw.','wvvvvvw','.wvvvw.','..wvw..','...w...'],x-14,y-14,{w:'#e6d5ff',v:'#a080e8'});
  };
  ART.drawTerrainGround = function(ctx,s,pal){
    ctx.fillStyle=pal.deep;ctx.fillRect(s.x,s.y,s.w,s.h);
    for(let y=s.y+8;y<s.y+s.h;y+=20)for(let x=s.x;x<s.x+s.w;x+=32){
      ctx.fillStyle=(Math.floor((x-s.x)/32+(y-s.y)/20)%3)?pal.ground:pal.mid;
      ctx.fillRect(x+2,y,Math.min(28,s.x+s.w-x-2),16);
    }
    ctx.fillStyle=pal.edge;ctx.fillRect(s.x,s.y,s.w,4);
  };
  ART.drawTerrainPlatform = function(ctx,s,pal){
    ctx.fillStyle=pal.deep;ctx.fillRect(s.x,s.y,s.w,s.h);
    ctx.fillStyle=pal.edge;ctx.fillRect(s.x,s.y,s.w,4);
    for(let x=s.x+4;x<s.x+s.w-4;x+=16){ctx.fillStyle=pal.pillar;ctx.fillRect(x,s.y+6,Math.min(12,s.x+s.w-x),Math.max(2,s.h-8));}
  };
  const SPECIES = [
    { id:'crag', label:'CRAG', ability:'SMASH', prompt:'C/K to smash rock barriers',
      colors:{o:'#241c15',h:'#8a7358',l:'#f0e2bd',s:'#b89f72',k:'#3a2e22',e:'#e08a3f',c:'#5b4a36',b:'#4a3d2c'} },
    { id:'glint', label:'GLINT', ability:'GLIDE', prompt:'hold C/K in wind currents to glide',
      colors:{o:'#132229',h:'#7ec8d8',l:'#eefdff',s:'#a9e3ec',k:'#22414c',e:'#fff4b0',c:'#3d6b7a',b:'#284650'} },
    { id:'sprig', label:'SPRIG', ability:'GROW', prompt:'C/K near a seed node to grow a bridge',
      colors:{o:'#182a19',h:'#5fa860',l:'#e3f7c4',s:'#8ecb7f',k:'#2b4a2c',e:'#ffe07a',c:'#3f6b3f',b:'#31502d'} },
  ];
  function speciesOf(id){return SPECIES.find(s=>s.id===id);}

  /* ---------------- Campaign / stage data ---------------- */
  // World/state contract: obstacles are {type:'rock'|'wind'|'seed', x,y,w,h, solved}.
  // rock: tall wall, blocks movement until Crag smashes it (cannot be jumped, h=200 > max jump height ~128).
  // wind: a marked zone above a wide ravine (w=300 > max jump distance ~211); only Glint gets lift while holding the ability inside it.
  // seed: a trigger at a gap edge; Sprig grows a solid bridge spanning the full gap width. A fixed ceiling above the gap blocks a glide bypass.
  function mkStage(o){
    const groundSolids = o.grounds.map(g=>({x:g.x,y:500,w:g.w,h:100,kind:'ground'}));
    const platformSolids = (o.platforms||[]).map(([x,y,w])=>({x,y,w,h:22,kind:'platform'}));
    const ceilingSolids = (o.ceilings||[]).map(([x,y,w])=>({x,y,w,h:20,kind:'platform'}));
    return {
      name: o.name, palette: PAL[o.palette], region: o.palette, width: o.width,
      spawn: o.spawn, baseSolids: [...groundSolids, ...platformSolids, ...ceilingSolids],
      obstacleTemplate: o.obstacles || [],
      coinStarts: o.coins || [], shardStarts: o.shards || [], checkpointStarts: o.checkpoints || [],
      creatureStarts: o.creatures || [], flagX: o.flagX,
    };
  }

  const STAGES = [
    mkStage({
      name:'Hollow Path', palette:'habitat',
      grounds:[{x:0,w:760},{x:1060,w:440},{x:1780,w:520}],
      width:2700, flagX:2230, spawn:{x:40,y:452},
      obstacles:[
        {type:'rock',x:640,y:300,w:40,h:200},
        {type:'wind',x:760,y:100,w:300,h:650},
        {type:'seed',x:1500,y:470,w:280,h:30},
      ],
      ceilings:[[1500,260,280]],
      creatures:[{id:'glint',x:700,y:450},{id:'sprig',x:1330,y:450}],
      platforms:[[200,390,120],[1150,390,120],[1850,390,100],[2060,320,90]],
      coins:[[120,465],[300,355],[450,465],[900,355],[1150,465],[1300,355],[1850,465],[2050,355]],
      shards:[[2100,285]],
      checkpoints:[100,1120],
    }),
    mkStage({
      name:'Windswept Terraces', palette:'garden',
      grounds:[{x:0,w:600},{x:880,w:420},{x:1600,w:500}],
      width:2500, flagX:2030, spawn:{x:40,y:452},
      obstacles:[
        {type:'rock',x:520,y:300,w:40,h:200},
        {type:'seed',x:600,y:470,w:280,h:30},
        {type:'rock',x:1220,y:300,w:40,h:200},
        {type:'wind',x:1300,y:100,w:300,h:650},
      ],
      ceilings:[[600,260,280]],
      creatures:[],
      platforms:[[890,410,90],[950,320,90],[1080,240,90],[1200,170,90],[1650,390,110]],
      coins:[[80,465],[300,355],[950,285],[1650,465],[1800,355],[1950,465]],
      shards:[[1230,140]],
      checkpoints:[80,950],
    }),
    mkStage({
      name:'Rootbound Ruins', palette:'grotto',
      grounds:[{x:0,w:520},{x:820,w:460},{x:1560,w:520},{x:2380,w:420}],
      width:3200, flagX:2730, spawn:{x:40,y:452},
      obstacles:[
        {type:'rock',x:460,y:300,w:40,h:200},
        {type:'wind',x:520,y:100,w:300,h:650},
        {type:'rock',x:980,y:300,w:40,h:200},
        {type:'seed',x:1280,y:470,w:280,h:30},
        {type:'wind',x:2080,y:100,w:300,h:650},
      ],
      ceilings:[[1280,260,280]],
      creatures:[],
      platforms:[[130,410,90],[260,330,90],[1650,390,110],[1900,320,90]],
      coins:[[80,465],[900,355],[1150,465],[1650,465],[1950,355],[2450,465],[2650,355]],
      shards:[[290,300]],
      checkpoints:[80,1620],
    }),
  ];
  const totalCoins = STAGES.reduce((n,s)=>n+s.coinStarts.length,0);
  const totalShards = STAGES.reduce((n,s)=>n+s.shardStarts.length,0);

  let stageIndex = 0, stage = STAGES[0];
  let player = { x:0, y:0, w:34, h:48, vx:0, vy:0, grounded:true, facing:1 };
  let camera = 0, viewWidth = 960, viewHeight = 600;
  let solids = [], obstacles = [];
  let coins = [], coinCount = 0, fragmentCount = 0, shards = [], creatures = [];
  let lives = 3, damageTimer = 0, state = 'playing';
  let checkpointStarts = [], checkpoint = -1, spawn = { x:0, y:0 };
  let coyoteTimer = 0, jumpBufferTimer = 0, jumpCut = false, elapsed = 0, toastTimer = 0;
  let particles = [];
  let unlockedCreatures = new Set(['crag']), current = 'crag', gliding = false, abilityRequested = false, abilityPoseTimer = 0;
  const STEP = 1 / 120, SPEED = 280, GRAVITY = 1800, JUMP = 680, LIFT = 2600, LIFT_CAP = 260;

  function burst(x,y,color,n=10) {
    for(let i=0;i<n;i++) {const a=i/n*Math.PI*2;particles.push({x,y,vx:Math.cos(a)*90,vy:Math.sin(a)*90-35,life:0.55,color});}
    if(particles.length>180)particles.splice(0,particles.length-180);
  }
  function toast(message) {document.getElementById('toast').textContent=message;toastTimer=2.8;}
  function overlaps(a, b) { return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y; }
  function nearObstacle(p,o,pad=24){ return overlaps(p,{x:o.x-pad,y:o.y-pad,w:o.w+pad*2,h:o.h+pad*2}); }
  const keys = new Set();
  const touches = new Map();
  let jumpQueued = false;
  function held(action) { return keys.has(action) || [...touches.values()].includes(action); }

  function speciesOrder(){ return SPECIES.filter(s=>unlockedCreatures.has(s.id)).map(s=>s.id); }
  function setCurrent(id){ if(id===current)return; current=id; gliding=false; toast(speciesOf(id).label+' active · '+speciesOf(id).prompt); }
  function cycleCreature(dir){ const order=speciesOrder(); if(order.length<2)return; let i=order.indexOf(current); i=(i+dir+order.length)%order.length; setCurrent(order[i]); }
  function selectCreature(id){ if(unlockedCreatures.has(id)) setCurrent(id); }

  function loadStage(index) {
    stageIndex = index; stage = STAGES[index];
    solids = stage.baseSolids.map(s=>({...s}));
    obstacles = stage.obstacleTemplate.map(o=>({...o,solved:false}));
    obstacles.filter(o=>o.type==='rock').forEach(o=>{ solids.push({x:o.x,y:o.y,w:o.w,h:o.h,kind:'rock',obstacleRef:o}); });
    coins = stage.coinStarts.map(([x,y]) => ({x,y,collected:false}));
    shards = stage.shardStarts.map(([x,y]) => ({x,y,collected:false}));
    creatures = stage.creatureStarts.map(c => ({...c,rescued:unlockedCreatures.has(c.id)}));
    checkpointStarts = stage.checkpointStarts;
    checkpoint = -1;
    spawn = { ...stage.spawn };
    gliding = false; abilityRequested = false; abilityPoseTimer = 0; damageTimer = 0;
    coyoteTimer = 0; jumpBufferTimer = 0; jumpCut = false; toastTimer = 0; particles = [];
    player = { ...spawn, w:34, h:48, vx:0, vy:0, grounded:true, facing:1 };
    camera = 0;
    clearInput(); physicalKeys.clear(); previousTime = null; accumulator = 0;
    document.getElementById('coins').textContent = 'Coins: ' + coinCount;
    document.getElementById('lives').textContent = 'Lives: ' + lives;
    updateHud(); canvas.focus();
    toast('Q/E switch companion · C/K use ability');
  }

  function updateHud() {
    document.getElementById('crew').textContent = 'CREW ' + SPECIES.filter(s=>unlockedCreatures.has(s.id)).map(s=>s.id===current?'['+s.label+']':s.label).join(' ');
    document.getElementById('shards').textContent = '◆ ' + fragmentCount + '/' + totalShards;
    const pct = Math.min(100,Math.floor(player.x/(stage.flagX||1)*100));
    document.getElementById('route').textContent = '0'+(stageIndex+1)+' · '+stage.name.toUpperCase()+'  /  '+pct+'%';
    document.getElementById('progress').style.width = pct+'%';
    document.getElementById('toast').style.opacity = String(Math.min(1,toastTimer));
  }
  function releaseJump() {if(!held('jump') && player.vy<0 && !jumpCut){player.vy*=0.45;jumpCut=true;}}

  function update(dt) {
    if (state !== 'playing') return;
    const p = player;
    const pal = stage.palette;
    elapsed += dt; toastTimer=Math.max(0,toastTimer-dt); abilityPoseTimer=Math.max(0,abilityPoseTimer-dt);
    particles=particles.filter(q=>{q.life-=dt;q.x+=q.vx*dt;q.y+=q.vy*dt;q.vy+=180*dt;return q.life>0;});
    coyoteTimer=p.grounded?0.1:Math.max(0,coyoteTimer-dt);
    jumpBufferTimer=jumpQueued?0.12:Math.max(0,jumpBufferTimer-dt);
    damageTimer = Math.max(0, damageTimer - dt);

    p.vx = (Number(held('right')) - Number(held('left'))) * SPEED; if (p.vx) p.facing = Math.sign(p.vx);

    if(jumpBufferTimer>0 && coyoteTimer>0) {
      p.vy=-JUMP;p.grounded=false;coyoteTimer=0;jumpBufferTimer=0;jumpCut=false;
      if(!held('jump')) {p.vy*=0.45;jumpCut=true;}
    }
    jumpQueued = false;
    p.x += p.vx * dt;
    for (const s of solids) if (overlaps(p, s)) {
      if (p.vx > 0) p.x = s.x - p.w;
      else if (p.vx < 0) p.x = s.x + s.w;
      p.vx = 0;
    }
    p.x = Math.max(0, Math.min(stage.width - p.w, p.x));

    let windZone = null;
    if (current === 'glint' && held('ability') && !p.grounded) {
      windZone = obstacles.find(o => o.type==='wind' && overlaps(p,o));
    }
    gliding = !!windZone;
    if (windZone) windZone.solved = true;
    if (gliding) { p.vy = Math.max(p.vy - LIFT*dt, -LIFT_CAP); }
    else { p.vy = Math.min(900, p.vy + GRAVITY * dt); }
    p.y += p.vy * dt;
    const landingSpeed=p.vy;
    p.grounded = false;
    for (const s of solids) if (overlaps(p, s)) {
      if (p.vy > 0) { p.y = s.y - p.h; p.grounded = true; }
      else if (p.vy < 0) p.y = s.y + s.h;
      p.vy = 0;
    }
    if(p.grounded && landingSpeed>200)burst(p.x+17,p.y+48,pal.edge,5);
    if (p.y > SCENE.height + 100) { loseLife(true); return; }
    updateCamera();

    for (const coin of coins) if (!coin.collected && overlaps(p, {x:coin.x-10,y:coin.y-10,w:20,h:20})) {
      coin.collected = true; coinCount++; burst(coin.x,coin.y,'#ffcf6b',7);
      document.getElementById('coins').textContent = 'Coins: ' + coinCount;
    }
    for(let i=0;i<checkpointStarts.length;i++) if(i>checkpoint && overlaps(p,{x:checkpointStarts[i],y:410,w:24,h:90})) {
      checkpoint=i;spawn={x:checkpointStarts[i],y:452};burst(p.x,450,pal.edge,18);toast('Beacon saved · respawn here');
    }
    for(const shard of shards) if(!shard.collected && overlaps(p,{x:shard.x-13,y:shard.y-13,w:26,h:26})) {
      shard.collected=true;fragmentCount++;burst(shard.x,shard.y,'#b9abff',16);toast('Relic found · '+fragmentCount+' / '+totalShards);
    }
    for(const c of creatures) if(!c.rescued && overlaps(p,{x:c.x-18,y:c.y-24,w:36,h:48})) {
      c.rescued=true; unlockedCreatures.add(c.id); current=c.id; gliding=false;
      burst(c.x,c.y,'#ffe6a0',20); toast(speciesOf(c.id).label+' joins you · '+speciesOf(c.id).prompt);
    }

    if(abilityRequested){
      abilityRequested=false; abilityPoseTimer=0.25;
      if(current==='crag'){
        for(const o of obstacles) if(o.type==='rock' && !o.solved && nearObstacle(p,o)){
          o.solved=true;
          const idx=solids.findIndex(s=>s.obstacleRef===o); if(idx>=0)solids.splice(idx,1);
          burst(o.x+o.w/2,o.y+o.h/2,'#caa06a',20); toast('Rock barrier smashed');
        }
      } else if(current==='sprig'){
        for(const o of obstacles) if(o.type==='seed' && !o.solved && nearObstacle(p,o)){
          o.solved=true;
          solids.push({x:o.x,y:500,w:o.w,h:18,kind:'bridge'});
          burst(o.x+o.w/2,470,'#8ecb7f',20); toast('Vine bridge grown');
        }
      } else {
        if(obstacles.some(o=>(o.type==='rock'||o.type==='seed')&&!o.solved&&nearObstacle(p,o))) toast('Wrong companion for this obstacle');
      }
    }

    updateHud();
    if (overlaps(p, {x:stage.flagX,y:310,w:20,h:190})) {
      if (stageIndex === STAGES.length-1) finish('won'); else finishStage();
    }
  }

  function finish(nextState) {
    state = nextState; clearInput(); physicalKeys.clear();
    player.vx = 0; player.vy = 0;
    document.getElementById('end-title').textContent = state === 'won' ? 'Every companion is home' : 'The journey pauses here';
    document.getElementById('end-detail').textContent = state === 'won' ? 'Campaign complete. Coins: ' + coinCount + '/' + totalCoins + ' · Relics: ' + fragmentCount + '/' + totalShards : 'Take a breath and try again.';
    document.getElementById('restart').textContent = state === 'won' ? 'Play again' : 'Try again';
    document.getElementById('end-screen').hidden = false;
    document.getElementById('restart').focus();
  }
  function finishStage() {
    state = 'stageComplete'; clearInput(); physicalKeys.clear();
    player.vx = 0; player.vy = 0;
    document.getElementById('end-title').textContent = 'Stage clear — ' + stage.name;
    document.getElementById('end-detail').textContent = 'Coins: ' + coinCount + '/' + totalCoins + ' · Relics: ' + fragmentCount + '/' + totalShards;
    document.getElementById('restart').textContent = 'Next Stage →';
    document.getElementById('end-screen').hidden = false;
    document.getElementById('restart').focus();
  }
  function nextStage() {
    document.getElementById('end-screen').hidden = true;
    loadStage(stageIndex + 1);
    state = 'playing';
  }
  function restart() {
    lives = 3; coinCount = 0; fragmentCount = 0; state = 'playing';
    unlockedCreatures = new Set(['crag']); current = 'crag';
    document.getElementById('end-screen').hidden = true;
    loadStage(0);
  }
  function onEndButton() {
    if (state === 'stageComplete') nextStage(); else restart();
  }
  function loseLife(fell = false) {
    if (state !== 'playing' || (!fell && damageTimer > 0)) return;
    coyoteTimer=0;jumpBufferTimer=0;
    lives--; document.getElementById('lives').textContent = 'Lives: ' + lives;
    clearInput(); physicalKeys.clear();
    if (lives === 0) { finish('gameover'); return; }
    Object.assign(player, spawn, {vx:0,vy:0,grounded:true,facing:1});
    gliding=false; abilityRequested=false; abilityPoseTimer=0;
    damageTimer = 1; updateCamera();
  }
  function updateCamera() { camera = Math.max(0, Math.min(stage.width - viewWidth, player.x + player.w / 2 - viewWidth * 0.35)); }
  const keyActions = { ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right', Space: 'jump', KeyW: 'jump', KeyC:'ability', KeyK:'ability' };
  const physicalKeys = new Set();
  window.addEventListener('keydown', event => {
    if(event.code==='KeyF'&&!event.repeat){event.preventDefault();toggleFullscreen();return;}
    if(event.code==='Escape'&&expanded){setExpanded(false);return;}
    if (state !== 'playing') return;
    if(!event.repeat){
      if(event.code==='KeyQ'){event.preventDefault();cycleCreature(-1);return;}
      if(event.code==='KeyE'){event.preventDefault();cycleCreature(1);return;}
      if(event.code==='Digit1'){event.preventDefault();selectCreature('crag');return;}
      if(event.code==='Digit2'){event.preventDefault();selectCreature('glint');return;}
      if(event.code==='Digit3'){event.preventDefault();selectCreature('sprig');return;}
    }
    const action = keyActions[event.code]; if (!action) return;
    event.preventDefault();
    if (action === 'jump' && !physicalKeys.has(event.code) && !held('jump')) jumpQueued = true;
    if (action === 'ability' && !physicalKeys.has(event.code)) abilityRequested = true;
    physicalKeys.add(event.code); keys.add(action);
  });
  window.addEventListener('keyup', event => {
    const action = keyActions[event.code]; if (!action) return;
    event.preventDefault(); physicalKeys.delete(event.code);
    if (![...physicalKeys].some(code => keyActions[code] === action)) keys.delete(action);
    if(action==='jump')releaseJump();
  });
  let previousTime = null, accumulator = 0;
  function frame(time) {
    if (previousTime !== null) accumulator += Math.min((time - previousTime) / 1000, 0.1);
    previousTime = time;
    while (accumulator >= STEP) { update(STEP); accumulator -= STEP; }
    draw(); requestAnimationFrame(frame);
  }
  window.addEventListener('blur', () => { clearInput(); physicalKeys.clear(); previousTime = null; accumulator = 0; });
  document.addEventListener('visibilitychange', () => { clearInput(); physicalKeys.clear(); previousTime = null; accumulator = 0; });
  function clearInput() {
    keys.clear(); touches.clear(); jumpQueued = false; jumpBufferTimer=0; abilityRequested=false; releaseJump();
    document.querySelectorAll('[data-action]').forEach(button => button.classList.toggle('pressed',false));
  }
  for (const button of document.querySelectorAll('[data-action]')) {
    button.addEventListener('pointerdown', event => {
      event.preventDefault(); if (state !== 'playing') return;
      const action = button.dataset.action;
      if (action === 'jump' && !held('jump')) jumpQueued = true;
      if (action === 'ability') abilityRequested = true;
      if (action === 'switch') cycleCreature(1);
      touches.set(event.pointerId, action); button.setPointerCapture(event.pointerId);
      button.classList.toggle('pressed',true);
    });
    const release = event => {
      event.preventDefault(); touches.delete(event.pointerId); releaseJump();
      button.classList.toggle('pressed',[...touches.values()].includes(button.dataset.action));
    };
    button.addEventListener('pointerup',release);
    button.addEventListener('pointercancel',release);
    button.addEventListener('lostpointercapture',release);
    button.addEventListener('contextmenu',event => event.preventDefault());
  }
  function resize() {
    const rect = canvas.getBoundingClientRect();
    const scale = Math.min(rect.width / 600, rect.height / SCENE.height);
    viewWidth = Math.min(stage.width, rect.width / scale);
    viewHeight = viewWidth * rect.height / rect.width;
    canvas.width = Math.round(viewWidth);
    canvas.height = Math.round(viewHeight);
    ctx.imageSmoothingEnabled = false;
    updateCamera();
    draw();
  }
  function rect(x, y, w, h, color) { ctx.fillStyle = color; ctx.fillRect(x, y, w, h); }
  function circle(x, y, r, color) { ctx.fillStyle = color; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); }
  function label(text, x, y, size, color) { ctx.fillStyle = color; ctx.font = '600 ' + size + 'px monospace'; ctx.fillStyle='#192a42';ctx.fillText(text,x+1,y+1);ctx.fillStyle=color;ctx.fillText(text,x,y); }
  function drawPlayer() {
    const p = player;
    const pose = gliding ? 'ability' : abilityPoseTimer>0 ? 'ability' : !p.grounded ? 'jump' : p.vx ? 'run' : 'idle';
    ART.drawCreature(ctx,current,p.x,p.y,p.facing,pose,elapsed);
  }
  function star(x,y,r,color) {
    ctx.fillStyle=color;ctx.beginPath();for(let i=0;i<10;i++){const a=i*Math.PI/5-Math.PI/2,rr=i%2?r*0.45:r;const px=x+Math.cos(a)*rr,py=y+Math.sin(a)*rr;if(i===0)ctx.moveTo(px,py);else ctx.lineTo(px,py);}ctx.closePath();ctx.fill();
  }
  function draw() {
    const pal = stage.palette;
    const offsetY = Math.max(0,(viewHeight-SCENE.height)*0.42);
    ctx.setTransform(canvas.width/viewWidth,0,0,canvas.height/viewHeight,0,offsetY*canvas.height/viewHeight);
    rect(0,-offsetY,viewWidth,viewHeight,pal.sky[1]);
    const view={w:viewWidth,h:viewHeight};
    ART.drawBackdrop(ctx,view,camera,stage.region,elapsed);
    ctx.save();ctx.translate(-camera,0);
    for(const solid of solids){
      if(solid.x+solid.w<camera-60||solid.x>camera+viewWidth+60)continue;
      if(solid.kind==='rock'||solid.kind==='bridge') continue;
      else if(solid.kind==='ground') ART.drawTerrainGround(ctx,solid,pal);
      else ART.drawTerrainPlatform(ctx,solid,pal);
    }
    for(let i=0;i<checkpointStarts.length;i++){
      const x=checkpointStarts[i],col=i<=checkpoint?pal.edge:'#59627c';rect(x,410,24,90,'#26334e');rect(x+4,416,16,62,col);circle(x+12,407,9,col);label('BEACON',x-14,392,10,col);
    }
    for(const o of obstacles){
      // Bridge artwork's top edge matches its collision surface at y=500.
      ART.drawObstacle(ctx,o.type==='seed'&&o.solved?{...o,y:480}:o,elapsed);
      if(!o.solved) label(o.type==='rock'?'CRAG · SMASH':o.type==='wind'?'GLINT · HOLD ABILITY':'SPRIG · GROW',o.x-18,o.type==='seed'?450:o.y-12,10,'#eafcff');
    }
    for(const c of creatures) if(!c.rescued){
      const species=speciesOf(c.id);
      circle(c.x,c.y,20,'#26304d');
      ART.drawCreature(ctx,c.id,c.x-17,c.y-24,1,'idle',elapsed);
      label('RESCUE '+species.label,c.x-38,c.y-30,10,'#ffe6a0');
    }
    for(const coin of coins)if(!coin.collected)ART.drawCollectibleCoin(ctx,coin.x,coin.y,elapsed);
    for(const shard of shards)if(!shard.collected)ART.drawCollectibleShard(ctx,shard.x,shard.y,elapsed);
    rect(stage.flagX-32,482,86,18,'#687087');rect(stage.flagX-20,462,62,20,'#343955');rect(stage.flagX+2,324,14,138,pal.accent+'22');circle(stage.flagX+9,344,31,pal.accent+'22');star(stage.flagX+9,344,22,pal.accent);label('HABITAT BEACON',stage.flagX-90,290,13,'#fff2c4');
    ctx.globalAlpha = damageTimer>0?0.55+Math.sin(damageTimer*30)*0.2:1;drawPlayer();ctx.globalAlpha=1;
    for(const q of particles){ctx.globalAlpha=Math.min(1,q.life*2);rect(q.x,q.y,4,4,q.color);}ctx.globalAlpha=1;
    ctx.restore();
  }
  const fullscreenButton=document.getElementById('fullscreen');
  const gameShell=document.getElementById('game-shell');
  let expanded=false;
  function syncFullscreen(){
    const active=!!document.fullscreenElement||expanded;
    fullscreenButton.textContent=active?'EXIT FULLSCREEN':'FULLSCREEN';
    fullscreenButton.setAttribute('aria-pressed',String(active));
    clearInput();physicalKeys.clear();resize();
  }
  function setExpanded(value){
    expanded=value;gameShell.classList.toggle('expanded',value);syncFullscreen();
  }
  async function toggleFullscreen(){
    try{
      if(document.fullscreenElement){await document.exitFullscreen();}
      else if(expanded){setExpanded(false);}
      else if(gameShell.requestFullscreen){await gameShell.requestFullscreen();}
      else {setExpanded(true);toast('Expanded view · browser controls may remain visible');}
    }catch(error){setExpanded(true);toast('Expanded view · native fullscreen is unavailable');}
    syncFullscreen();
  }
  fullscreenButton.addEventListener('click',toggleFullscreen);
  document.addEventListener('fullscreenchange',syncFullscreen);
  window.addEventListener('resize', resize);
  document.getElementById('restart').addEventListener('click', onEndButton);
  loadStage(0);
  resize();
  requestAnimationFrame(frame);
}
const page = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>Creature Call — rescue your crew</title>
<style>
*{box-sizing:border-box}html,body{margin:0;width:100%;height:100%;overflow:hidden;background:#0d1130;color:#f2ecff;font-family:ui-monospace,SFMono-Regular,Consolas,monospace}body{display:flex;align-items:center;justify-content:center}main{position:relative;width:100%;height:100%;max-width:1600px;max-height:1000px}canvas{display:block;width:100%;height:100%;image-rendering:pixelated;image-rendering:crisp-edges;touch-action:none;outline:none}
.hud{position:absolute;left:24px;right:24px;top:max(20px,env(safe-area-inset-top));display:flex;justify-content:space-between;gap:12px;pointer-events:none;padding:14px 18px;background:#111a35dc;border:2px solid #637da333;align-items:center}.brand{font-size:12px;font-weight:800;letter-spacing:2px}.stats{display:flex;gap:18px;font-size:14px;font-weight:750}#coins{color:#ffcf6b}#lives,#crew{color:#ffdb91}
.journey{position:absolute;top:max(90px,calc(env(safe-area-inset-top) + 76px));left:42px;font-size:10px;letter-spacing:1.5px;color:#edf5ff;background:#192a42ed;padding:10px 12px;pointer-events:none}.track{margin:10px 0;width:220px;height:4px;background:#38405c}#progress{height:4px;background:#7cf0ff}.powers{display:flex;gap:16px;font-size:12px}#shards{color:#c7bcff}
#toast{position:absolute;top:180px;left:50%;transform:translateX(-50%);width:max-content;max-width:90%;padding:10px 16px;background:#192a42ed;border:2px solid #7cf0ff55;text-align:center;font-size:13px;pointer-events:none}
.help{position:absolute;bottom:22px;left:24px;font-size:13px;color:#edf5ff;background:#192a42ed;padding:8px 12px}
.overlay{position:absolute;inset:0;display:grid;place-items:center;background:#080f26bb;z-index:3}.overlay[hidden]{display:none}.card{width:min(88%,380px);background:#151b36;border:2px solid #7cf0ff55;padding:36px;text-align:center;box-shadow:0 20px 70px #0008}.card h1{font-size:34px;letter-spacing:-1px;margin:8px 0 12px}.card p{line-height:1.6;color:#b7c3dd}.card button{background:#7cf0ff;color:#0d1130;border:0;padding:16px 32px;font:750 16px inherit;cursor:pointer}.card button:focus-visible{outline:3px solid #ffcf6b;outline-offset:4px}
.touch-controls{display:none;position:absolute;bottom:max(20px,env(safe-area-inset-bottom));left:max(20px,env(safe-area-inset-left));right:max(20px,env(safe-area-inset-right));justify-content:space-between;pointer-events:none;user-select:none;-webkit-user-select:none}.directions,.actions{display:flex;gap:12px}.touch-controls button{width:70px;height:70px;border:2px solid #7cf0ff66;background:#192a42ed;color:#dffbff;font:750 26px inherit;pointer-events:auto;touch-action:none;-webkit-touch-callout:none}.touch-controls .jump{width:86px;font-size:14px;background:#32647a}.touch-controls .ability{width:70px;font-size:12px;background:#966343}.touch-controls .switch{width:64px;font-size:12px;background:#3a5a4a}.touch-controls button.pressed{background:#458b94;transform:translateY(2px)}
html,body,canvas{overscroll-behavior:none}
@media(pointer:coarse),(max-width:760px){.touch-controls{display:flex}.help{display:none}.brand{font-size:10px}.stats{font-size:12px;gap:12px}.hud{left:12px;right:12px;padding:12px}.journey{left:25px;top:90px}.powers{gap:10px;font-size:11px}#toast{top:162px;font-size:12px}}
@media(max-height:450px){.touch-controls{bottom:12px}.touch-controls button{height:58px;width:60px}.hud{top:10px}.journey{top:75px}.card{padding:20px}}
@media(max-width:420px){.touch-controls{left:12px;right:12px}.directions,.actions{gap:8px}.touch-controls button{width:56px;height:60px}.touch-controls .jump{width:66px}}
#fullscreen{position:absolute;right:24px;top:max(88px,calc(env(safe-area-inset-top) + 74px));z-index:5;background:#17233e;color:#dffbff;border:2px solid #7cf0ff88;padding:10px 12px;font:700 11px inherit;cursor:pointer;touch-action:manipulation}
#fullscreen:focus-visible{outline:3px solid #ffcf6b;outline-offset:3px}
main:fullscreen,main.expanded{width:100vw;height:100dvh;max-width:none;max-height:none;background:#0d1130}main.expanded{position:fixed;inset:0;z-index:10}
@media(max-width:760px){#fullscreen{right:12px;font-size:0;width:36px;height:34px;padding:0}#fullscreen::after{content:"\\26f6";font-size:22px}#fullscreen[aria-pressed="true"]::after{content:"\\d7"}}
@media(max-height:450px){#fullscreen{top:74px}}
</style></head><body><main id="game-shell" aria-label="Creature Call game">
<button id="fullscreen" type="button" aria-label="Toggle fullscreen" aria-pressed="false">FULLSCREEN</button>
<canvas id="game" tabindex="-1" aria-label="A rescue platformer. Move with A and D or arrow keys; jump with Space or W; use your companion's ability with C or K; switch companions with Q, E, or the number keys."></canvas>
<header class="hud"><span class="brand">CREATURE CALL</span><div class="stats"><span id="coins">Coins: 0</span><span id="lives">Lives: 3</span></div></header>
<div class="journey"><span id="route"></span><div class="track"><div id="progress"></div></div><div class="powers"><span id="crew"></span><span id="shards">◆ 0/0</span></div></div><div id="toast" role="status"></div>
<div class="help">← → / A D &nbsp; Move &nbsp; · &nbsp; Space / W &nbsp; Jump &nbsp; · &nbsp; C / K &nbsp; Ability &nbsp; · &nbsp; Q / E or 1-3 &nbsp; Switch companion</div>
<div class="touch-controls" aria-label="Touch controls"><div class="directions"><button type="button" data-action="left" aria-label="Move left">←</button><button type="button" data-action="right" aria-label="Move right">→</button></div><div class="actions"><button type="button" class="switch" data-action="switch" aria-label="Switch companion">SWITCH</button><button type="button" class="ability" data-action="ability" aria-label="Use companion ability">ABILITY</button><button type="button" class="jump" data-action="jump" aria-label="Jump">JUMP</button></div></div>
<section id="end-screen" class="overlay" role="dialog" aria-modal="true" aria-labelledby="end-title" aria-describedby="end-detail" hidden><div class="card"><h1 id="end-title"></h1><p id="end-detail"></p><button id="restart" type="button">Play again</button></div></section>
</main><script>(${gameClient.toString()})();</script></body></html>`;
app.get('/', (req, res) => res.type('html').send(page));
if (require.main === module) {
  const port = process.env.PORT || 3000;
  app.listen(port, '0.0.0.0', () => console.log('Creature Call listening on ' + port));
}
module.exports = { app, page, gameClient };
