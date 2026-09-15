'use strict';
const express = require('express');
const app = express();

// The entire browser game is embedded in this file. Coordinates are world units.
function gameClient() {
  'use strict';
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const WORLD = { width: 3200, height: 600, spawn: { x: 80, y: 452 }, flagX: 3060 };
  const solids = [
    { x: 0, y: 500, w: 620, h: 100 },
    { x: 750, y: 500, w: 680, h: 100 },
    { x: 1580, y: 500, w: 640, h: 100 },
    { x: 2360, y: 500, w: 840, h: 100 },
    { x: 280, y: 390, w: 150, h: 22 },
    { x: 990, y: 390, w: 160, h: 22 },
    { x: 1790, y: 390, w: 170, h: 22 },
    { x: 2570, y: 390, w: 160, h: 22 }
  ];
  let player = { ...WORLD.spawn, w: 34, h: 48, vx: 0, vy: 0, grounded: true, facing: 1 };
  let camera = 0, viewWidth = 960, viewHeight = 600;
  const coinStarts = [[200,465],[315,355],[390,355],[560,455],[685,370],[830,465],[1030,355],[1110,355],[1335,455],[1500,370],[1680,465],[1830,355],[1920,355],[2130,455],[2290,370],[2450,465],[2610,355],[2690,355],[2890,465]];
  let coins = coinStarts.map(([x,y]) => ({x,y,collected:false})), coinCount = 0;
  const enemyStarts = [{x:910,y:472,min:810,max:950,dir:1},{x:1700,y:472,min:1630,max:1740,dir:-1},{x:2890,y:472,min:2840,max:2960,dir:1}];
  let enemies = enemyStarts.map(e => ({...e,w:34,h:28,defeated:false}));
  let lives = 3, damageTimer = 0, state = 'playing';
  const keys = new Set();
  const touches = new Map();
  let jumpQueued = false;
  const STEP = 1 / 120, SPEED = 280, GRAVITY = 1800, JUMP = 680;
  function overlaps(a, b) { return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y; }
  function held(action) { return keys.has(action) || [...touches.values()].includes(action); }
  function update(dt) {
    if (state !== 'playing') return;
    const p = player;
    damageTimer = Math.max(0, damageTimer - dt);
    const previousBottom = p.y + p.h;
    p.vx = (Number(held('right')) - Number(held('left'))) * SPEED;
    if (p.vx) p.facing = Math.sign(p.vx);
    if (jumpQueued && p.grounded) { p.vy = -JUMP; p.grounded = false; }
    jumpQueued = false;
    p.x += p.vx * dt;
    for (const s of solids) if (overlaps(p, s)) {
      if (p.vx > 0) p.x = s.x - p.w;
      else if (p.vx < 0) p.x = s.x + s.w;
      p.vx = 0;
    }
    p.x = Math.max(0, Math.min(WORLD.width - p.w, p.x));
    p.vy = Math.min(900, p.vy + GRAVITY * dt);
    p.y += p.vy * dt;
    p.grounded = false;
    for (const s of solids) if (overlaps(p, s)) {
      if (p.vy > 0) { p.y = s.y - p.h; p.grounded = true; }
      else if (p.vy < 0) p.y = s.y + s.h;
      p.vy = 0;
    }
    if (p.y > WORLD.height + 100) { loseLife(true); return; }
    updateCamera();
    for (const coin of coins) if (!coin.collected && overlaps(p, {x:coin.x-10,y:coin.y-10,w:20,h:20})) {
      coin.collected = true; coinCount++;
      document.getElementById('coins').textContent = 'Coins: ' + coinCount;
    }
    for (const enemy of enemies) {
      if (enemy.defeated) continue;
      enemy.x += enemy.dir * 60 * dt;
      if (enemy.x >= enemy.max) { enemy.x = enemy.max; enemy.dir = -1; }
      if (enemy.x <= enemy.min) { enemy.x = enemy.min; enemy.dir = 1; }
      if (!overlaps(p, enemy)) continue;
      if (p.vy > 0 && previousBottom <= enemy.y + 1 && p.y + p.h >= enemy.y) {
        enemy.defeated = true; p.y = enemy.y - p.h; p.vy = -420; p.grounded = false;
      } else if (damageTimer === 0) { loseLife(); return; }
    }
    if (overlaps(p, {x:WORLD.flagX,y:310,w:20,h:190})) finish('won');
  }
  function finish(nextState) {
    state = nextState; clearInput(); physicalKeys.clear();
    player.vx = 0; player.vy = 0;
    document.getElementById('end-title').textContent = state === 'won' ? 'You win!' : 'Game Over';
    document.getElementById('end-detail').textContent = state === 'won' ? 'Coins collected: ' + coinCount : 'A fresh start for a little robot.';
    document.getElementById('restart').textContent = state === 'won' ? 'Play again' : 'Try again';
    document.getElementById('end-screen').hidden = false;
    document.getElementById('restart').focus();
  }
  function restart() {
    lives = 3; coinCount = 0; damageTimer = 0; state = 'playing'; camera = 0;
    player = { ...WORLD.spawn, w:34,h:48,vx:0,vy:0,grounded:true,facing:1 };
    coins = coinStarts.map(([x,y]) => ({x,y,collected:false}));
    enemies = enemyStarts.map(e => ({...e,w:34,h:28,defeated:false}));
    clearInput(); physicalKeys.clear(); previousTime = null; accumulator = 0;
    document.getElementById('coins').textContent = 'Coins: 0';
    document.getElementById('lives').textContent = 'Lives: 3';
    document.getElementById('end-screen').hidden = true;
    canvas.focus();
  }
  function loseLife(fell = false) {
    if (state !== 'playing' || (!fell && damageTimer > 0)) return;
    lives--; document.getElementById('lives').textContent = 'Lives: ' + lives;
    clearInput(); physicalKeys.clear();
    if (lives === 0) { finish('gameover'); return; }
    Object.assign(player, WORLD.spawn, {vx:0,vy:0,grounded:true,facing:1});
    damageTimer = 1; updateCamera();
  }
  function updateCamera() { camera = Math.max(0, Math.min(WORLD.width - viewWidth, player.x + player.w / 2 - viewWidth * 0.35)); }
  const keyActions = { ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right', Space: 'jump', KeyW: 'jump' };
  const physicalKeys = new Set();
  window.addEventListener('keydown', event => {
    const action = keyActions[event.code]; if (!action) return;
    if (state !== 'playing') return;
    event.preventDefault();
    if (action === 'jump' && !physicalKeys.has(event.code) && !held('jump')) jumpQueued = true;
    physicalKeys.add(event.code); keys.add(action);
  });
  window.addEventListener('keyup', event => {
    const action = keyActions[event.code]; if (!action) return;
    event.preventDefault(); physicalKeys.delete(event.code);
    if (![...physicalKeys].some(code => keyActions[code] === action)) keys.delete(action);
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
    keys.clear(); touches.clear(); jumpQueued = false;
    document.querySelectorAll('[data-action]').forEach(button => button.classList.toggle('pressed',false));
  }
  for (const button of document.querySelectorAll('[data-action]')) {
    button.addEventListener('pointerdown', event => {
      event.preventDefault(); if (state !== 'playing') return;
      const action = button.dataset.action;
      if (action === 'jump' && !held('jump')) jumpQueued = true;
      touches.set(event.pointerId, action); button.setPointerCapture(event.pointerId);
      button.classList.toggle('pressed',true);
    });
    const release = event => {
      event.preventDefault(); touches.delete(event.pointerId);
      button.classList.toggle('pressed',[...touches.values()].includes(button.dataset.action));
    };
    button.addEventListener('pointerup',release);
    button.addEventListener('pointercancel',release);
    button.addEventListener('lostpointercapture',release);
    button.addEventListener('contextmenu',event => event.preventDefault());
  }
  function resize() {
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);
    const scale = Math.min(rect.width / 600, rect.height / WORLD.height);
    viewWidth = Math.min(WORLD.width, rect.width / scale);
    viewHeight = viewWidth * rect.height / rect.width;
    updateCamera();
    draw();
  }
  function rect(x, y, w, h, color) { ctx.fillStyle = color; ctx.fillRect(x, y, w, h); }
  function circle(x, y, r, color) { ctx.fillStyle = color; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); }
  function label(text, x, y, size, color) { ctx.fillStyle = color; ctx.font = '600 ' + size + 'px system-ui'; ctx.fillText(text, x, y); }
  function drawRobot() {
    const p = player;
    rect(p.x + 4, p.y + 40, 10, 8, '#173b40'); rect(p.x + 21, p.y + 40, 10, 8, '#173b40');
    rect(p.x + 3, p.y + 20, 28, 22, '#238d88'); rect(p.x, p.y + 2, 34, 25, '#65c7b0');
    rect(p.x + 4, p.y + 7, 26, 12, '#173b40');
    rect(p.x + 8 + p.facing, p.y + 10, 5, 5, '#f7eab9'); rect(p.x + 21 + p.facing, p.y + 10, 5, 5, '#f7eab9');
    rect(p.x + 15, p.y - 4, 3, 7, '#173b40'); circle(p.x + 16.5, p.y - 5, 3, '#ed8759');
    rect(p.x + 12, p.y + 29, 10, 5, '#f6df9d');
  }
  function draw() {
    const offsetY = Math.max(0,(viewHeight-WORLD.height)*0.42);
    ctx.setTransform(canvas.width / viewWidth, 0, 0, canvas.height / viewHeight, 0, offsetY * canvas.height / viewHeight);
    rect(0, -offsetY, viewWidth, viewHeight, '#f6efd9');
    circle(viewWidth * 0.77 - camera * 0.035, 120, 48, '#efb969');
    for (let i = -1; i < 12; i++) {
      const x = i * 350 - camera * 0.23;
      ctx.fillStyle = i % 2 ? '#d7dfc6' : '#e2e5cb'; ctx.beginPath();
      ctx.moveTo(x - 120, 500); ctx.lineTo(x + 110, 210 + (i % 3) * 35); ctx.lineTo(x + 340, 500); ctx.fill();
    }
    ctx.save(); ctx.translate(-camera, 0);
    for (const s of solids) {
      rect(s.x, s.y, s.w, s.h, s.h === 100 ? '#b9774f' : '#46685c');
      rect(s.x, s.y, s.w, 8, '#708b59');
      if (s.h === 100) for (let x = s.x + 18; x < s.x + s.w; x += 45) rect(x, s.y + 27 + (x % 3) * 6, 9, 4, '#d39367');
    }
    label('LITTLE BOLT', 54, 315, 26, '#274b45');
    label('A little robot. One big leap.', 54, 341, 14, '#5f7566');
    for (const coin of coins) if (!coin.collected) {
      circle(coin.x, coin.y, 11, '#bd8130'); circle(coin.x, coin.y-1, 8, '#f4ca63'); rect(coin.x-1,coin.y-6,2,10,'#b57e30');
    }
    for (const e of enemies) if (!e.defeated) {
      rect(e.x+3,e.y+22,8,6,'#533f3d'); rect(e.x+23,e.y+22,8,6,'#533f3d');
      rect(e.x,e.y+3,34,21,'#c66650'); rect(e.x+5,e.y,24,5,'#de9070');
      rect(e.x+6,e.y+10,6,5,'#f9ebd5'); rect(e.x+22,e.y+10,6,5,'#f9ebd5');
    }
    rect(WORLD.flagX,310,6,190,'#355b51'); circle(WORLD.flagX+3,308,6,'#e3b159');
    ctx.fillStyle='#248e82';ctx.beginPath();ctx.moveTo(WORLD.flagX+6,317);ctx.lineTo(WORLD.flagX+76,338);ctx.lineTo(WORLD.flagX+6,362);ctx.fill();
    label('HOME', WORLD.flagX-20, 285, 14, '#355b51');
    ctx.globalAlpha = damageTimer > 0 ? 0.55 + Math.sin(damageTimer*30)*0.2 : 1;
    drawRobot();
    ctx.globalAlpha = 1;
    ctx.restore();
  }
  window.addEventListener('resize', resize);
  document.getElementById('restart').addEventListener('click', restart);
  resize();
  requestAnimationFrame(frame);
}
const page = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>Little Bolt — a tiny platform adventure</title>
<style>
*{box-sizing:border-box}html,body{margin:0;width:100%;height:100%;overflow:hidden;background:#f6efd9;color:#244941;font-family:system-ui,sans-serif}body{display:flex;align-items:center;justify-content:center}main{position:relative;width:100%;height:100%;max-width:1600px;max-height:1000px}canvas{display:block;width:100%;height:100%}.hud{position:absolute;left:24px;right:24px;top:max(20px,env(safe-area-inset-top));display:flex;justify-content:space-between;gap:12px;pointer-events:none}.brand{font-size:13px;font-weight:800;letter-spacing:3px}.stats{display:flex;gap:22px;font-size:16px;font-weight:750}.help{position:absolute;bottom:22px;left:24px;font-size:13px;color:#fff4dc}
.overlay{position:absolute;inset:0;display:grid;place-items:center;background:#173b4077;backdrop-filter:blur(5px);z-index:3}.overlay[hidden]{display:none}.card{width:min(88%,380px);background:#fff9e8;border:1px solid #e8d8b7;border-radius:24px;padding:36px;text-align:center;box-shadow:0 20px 70px #173b4030}.card h1{font-size:40px;letter-spacing:-2px;margin:8px 0 12px}.card p{line-height:1.6}.card button{background:#247e71;color:white;border:0;border-radius:12px;padding:16px 32px;font:750 16px system-ui;cursor:pointer}.card button:focus-visible{outline:3px solid #d28c36;outline-offset:4px}
.touch-controls{display:none;position:absolute;bottom:max(20px,env(safe-area-inset-bottom));left:max(20px,env(safe-area-inset-left));right:max(20px,env(safe-area-inset-right));justify-content:space-between;pointer-events:none;user-select:none;-webkit-user-select:none}.directions{display:flex;gap:12px}.touch-controls button{width:72px;height:72px;border:2px solid #f6efd9aa;border-radius:20px;background:#244941e8;color:#fff5d8;font:750 28px system-ui;pointer-events:auto;touch-action:none;-webkit-touch-callout:none}.touch-controls .jump{width:88px;font-size:15px;background:#247e71}.touch-controls button.pressed{background:#cf8850;transform:translateY(2px)}html,body,canvas{overscroll-behavior:none}canvas{touch-action:none;outline:none}@media(pointer:coarse),(max-width:760px){.touch-controls{display:flex}.help{display:none}.brand{font-size:11px;letter-spacing:2px}.stats{font-size:15px;gap:14px}.hud{left:18px;right:18px}}@media(max-height:450px){.touch-controls{bottom:12px}.touch-controls button{height:58px;width:64px;border-radius:16px}.hud{top:12px}}
</style></head><body><main aria-label="Little Bolt game">
<canvas id="game" tabindex="-1" aria-label="A robot platformer. Move with A and D or arrow keys; jump with Space or W."></canvas>
<header class="hud"><span class="brand">LITTLE BOLT</span><div class="stats"><span id="coins">Coins: 0</span><span id="lives">Lives: 3</span></div></header>
<div class="help">← → / A D &nbsp; Move &nbsp; · &nbsp; Space / W &nbsp; Jump &nbsp; · &nbsp; Reach the flag</div>
<div class="touch-controls" aria-label="Touch controls"><div class="directions"><button type="button" data-action="left" aria-label="Move left">←</button><button type="button" data-action="right" aria-label="Move right">→</button></div><button type="button" class="jump" data-action="jump" aria-label="Jump">JUMP</button></div>
<section id="end-screen" class="overlay" role="dialog" aria-modal="true" aria-labelledby="end-title" aria-describedby="end-detail" hidden><div class="card"><h1 id="end-title"></h1><p id="end-detail"></p><button id="restart" type="button">Play again</button></div></section>
</main><script>(${gameClient.toString()})();</script></body></html>`;
app.get('/', (req, res) => res.type('html').send(page));
if (require.main === module) {
  const port = process.env.PORT || 3000;
  app.listen(port, '0.0.0.0', () => console.log('Little Bolt listening on ' + port));
}
module.exports = { app, page, gameClient };
