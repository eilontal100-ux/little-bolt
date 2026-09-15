'use strict';
const express = require('express');
const app = express();

// The entire browser game is embedded in this file. Coordinates are world units.
function gameClient() {
  'use strict';
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const WORLD = { width: 5300, height: 600, spawn: { x: 80, y: 452 }, flagX: 5150 };
  const solids = [
    ...[[0,620],[750,680],[1580,680],[2410,710],[3290,670],[4130,490],[4810,490]].map(([x,w])=>({x,y:500,w,h:100})),
    ...[[280,390,150],[990,390,160],[1790,390,170],[2000,320,110],[2170,260,110],[3450,390,140],[3640,330,110],[4350,280,120]].map(([x,y,w])=>({x,y,w,h:22}))
  ];
  let player = { ...WORLD.spawn, w: 34, h: 48, vx: 0, vy: 0, grounded: true, facing: 1 };
  let camera = 0, viewWidth = 960, viewHeight = 600;
  const coinStarts = [[200,465],[315,355],[390,355],[560,455],[685,390],[830,465],[1030,355],[1110,355],[1370,455],[1500,390],[1650,465],[1830,355],[1920,355],[2040,285],[2210,225],[2310,390],[2450,465],[2790,465],[3050,455],[3200,390],[3340,465],[3490,355],[3680,295],[3870,455],[4045,390],[4180,465],[4380,245],[4440,245],[4550,455],[4715,390],[4870,465],[5090,465]];
  let coins = coinStarts.map(([x,y]) => ({x,y,collected:false})), coinCount = 0;
  const enemyStarts = [{x:910,y:472,min:900,max:950,dir:1},{x:1700,y:472,min:1700,max:1740,dir:-1},{x:2700,y:472,min:2600,max:2800,dir:1},{x:3840,y:472,min:3790,max:3900,dir:1},{x:4300,y:472,min:4250,max:4450,dir:-1},{x:4950,y:472,min:4900,max:5050,dir:1}];
  let enemies = enemyStarts.map(e => ({...e,w:34,h:28,defeated:false}));
  let lives = 3, damageTimer = 0, state = 'playing';
  const checkpointStarts = [1610,3320];
  let checkpoint = -1, spawn = {...WORLD.spawn}, shield = false, leapTimer = 0, airJumpUsed = false;
  let coyoteTimer = 0, jumpBufferTimer = 0, jumpCut = false, elapsed = 0, toastTimer = 0;
  const pickupStarts = [{x:1645,y:450,type:'shield'},{x:3380,y:450,type:'leap'},{x:4180,y:450,type:'leap'}];
  let pickups = pickupStarts.map(p=>({...p,taken:false}));
  let shards = [[1080,330],[2210,225],[4400,245]].map(([x,y])=>({x,y,collected:false}));
  let particles = [];
  function burst(x,y,color,n=10) {
    for(let i=0;i<n;i++) {const a=i/n*Math.PI*2;particles.push({x,y,vx:Math.cos(a)*90,vy:Math.sin(a)*90-35,life:0.55,color});}
    if(particles.length>180)particles.splice(0,particles.length-180);
  }
  function toast(message) {document.getElementById('toast').textContent=message;toastTimer=2.8;}
  function updateHud() {
    document.getElementById('shards').textContent='✦ '+shards.filter(s=>s.collected).length+'/3';
    document.getElementById('shield').textContent=shield?'⬡ Shield ready':'⬡ Shield —';
    document.getElementById('leap').textContent=leapTimer>0?'✧ Double jump '+leapTimer.toFixed(1)+'s':'✧ Double jump —';
    document.getElementById('shield').classList.toggle('active',shield);
    document.getElementById('leap').classList.toggle('active',leapTimer>0);
    document.getElementById('route').textContent=(player.x<1600?'01 · LANDING GLADE':player.x<3300?'02 · MUSHROOM CANOPY':'03 · CRYSTAL HOLLOW')+'  /  '+Math.min(100,Math.floor(player.x/WORLD.flagX*100))+'%';
    document.getElementById('progress').style.width=Math.min(100,player.x/WORLD.flagX*100)+'%';
    document.getElementById('toast').style.opacity=String(Math.min(1,toastTimer));
  }
  function releaseJump() {if(!held('jump') && player.vy<0 && !jumpCut){player.vy*=0.45;jumpCut=true;}}
  const keys = new Set();
  const touches = new Map();
  let jumpQueued = false;
  const STEP = 1 / 120, SPEED = 280, GRAVITY = 1800, JUMP = 680;
  function overlaps(a, b) { return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y; }
  function held(action) { return keys.has(action) || [...touches.values()].includes(action); }
  function update(dt) {
    if (state !== 'playing') return;
    const p = player;
    elapsed += dt; toastTimer=Math.max(0,toastTimer-dt); leapTimer=Math.max(0,leapTimer-dt);
    particles=particles.filter(q=>{q.life-=dt;q.x+=q.vx*dt;q.y+=q.vy*dt;q.vy+=180*dt;return q.life>0;});
    coyoteTimer=p.grounded?0.1:Math.max(0,coyoteTimer-dt);
    jumpBufferTimer=jumpQueued?0.12:Math.max(0,jumpBufferTimer-dt);
    if(p.grounded)airJumpUsed=false;
    damageTimer = Math.max(0, damageTimer - dt);
    const previousBottom = p.y + p.h;
    p.vx = (Number(held('right')) - Number(held('left'))) * SPEED;
    if (p.vx) p.facing = Math.sign(p.vx);
    if(jumpBufferTimer>0 && (coyoteTimer>0 || (leapTimer>0 && !airJumpUsed))) {
      const extra=coyoteTimer<=0;
      p.vy=extra?-580:-JUMP;p.grounded=false;coyoteTimer=0;jumpBufferTimer=0;jumpCut=false;
      if(extra){airJumpUsed=true;burst(p.x+17,p.y+48,'#fff2c4');}
      if(!held('jump')) {p.vy*=0.45;jumpCut=true;}
    }
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
    const landingSpeed=p.vy;
    p.grounded = false;
    for (const s of solids) if (overlaps(p, s)) {
      if (p.vy > 0) { p.y = s.y - p.h; p.grounded = true; }
      else if (p.vy < 0) p.y = s.y + s.h;
      p.vy = 0;
    }
    if(p.grounded && landingSpeed>200)burst(p.x+17,p.y+48,'#7cf0ff',5);
    if (p.y > WORLD.height + 100) { loseLife(true); return; }
    updateCamera();
    for (const coin of coins) if (!coin.collected && overlaps(p, {x:coin.x-10,y:coin.y-10,w:20,h:20})) {
      coin.collected = true; coinCount++; burst(coin.x,coin.y,'#ffcf6b',7);
      document.getElementById('coins').textContent = 'Coins: ' + coinCount;
    }
    for(let i=0;i<checkpointStarts.length;i++) if(i>checkpoint && overlaps(p,{x:checkpointStarts[i],y:410,w:24,h:90})) {
      checkpoint=i;spawn={x:checkpointStarts[i],y:452};burst(p.x,450,'#7cf0ff',18);toast('Beacon saved · respawn here');
    }
    for(const item of pickups) if(!item.taken && overlaps(p,{x:item.x-16,y:item.y-16,w:32,h:32})) {
      item.taken=true;if(item.type==='shield'){shield=true;toast('Shield ready · absorbs one enemy hit');}else{leapTimer=12;airJumpUsed=false;toast('Starleap · press jump again in the air');}
      burst(item.x,item.y,item.type==='shield'?'#7cf0ff':'#ffcf6b',16);
    }
    for(const shard of shards) if(!shard.collected && overlaps(p,{x:shard.x-13,y:shard.y-13,w:26,h:26})) {
      shard.collected=true;burst(shard.x,shard.y,'#b9abff',16);toast('Star fragment found · '+shards.filter(s=>s.collected).length+' / 3');
    }
    updateHud();
    for (const enemy of enemies) {
      if (enemy.defeated) continue;
      enemy.x += enemy.dir * 60 * dt;
      if (enemy.x >= enemy.max) { enemy.x = enemy.max; enemy.dir = -1; }
      if (enemy.x <= enemy.min) { enemy.x = enemy.min; enemy.dir = 1; }
      if (!overlaps(p, enemy)) continue;
      if (p.vy > 0 && previousBottom <= enemy.y + 1 && p.y + p.h >= enemy.y) {
        enemy.defeated = true; burst(enemy.x+17,enemy.y,'#ff6b57'); p.y = enemy.y - p.h; p.vy = -420; p.grounded = false;
      } else if (damageTimer === 0) { loseLife(); return; }
    }
    if (overlaps(p, {x:WORLD.flagX,y:310,w:20,h:190})) finish('won');
  }
  function finish(nextState) {
    state = nextState; clearInput(); physicalKeys.clear();
    player.vx = 0; player.vy = 0;
    document.getElementById('end-title').textContent = state === 'won' ? 'Star delivered!' : 'Signal lost';
    document.getElementById('end-detail').textContent = state === 'won' ? 'You brought the light home. Coins: ' + coinCount + '/' + coins.length + ' · Fragments: ' + shards.filter(s=>s.collected).length + '/3' : 'The forest is waiting. Take a breath and try again.';
    document.getElementById('restart').textContent = state === 'won' ? 'Play again' : 'Try again';
    document.getElementById('end-screen').hidden = false;
    document.getElementById('restart').focus();
  }
  function restart() {
    checkpoint=-1;spawn={...WORLD.spawn};shield=false;leapTimer=0;airJumpUsed=false;coyoteTimer=0;jumpBufferTimer=0;jumpCut=false;elapsed=0;toastTimer=0;particles=[];
    pickups=pickupStarts.map(p=>({...p,taken:false}));shards.forEach(s=>s.collected=false);
    lives = 3; coinCount = 0; damageTimer = 0; state = 'playing'; camera = 0;
    player = { ...WORLD.spawn, w:34,h:48,vx:0,vy:0,grounded:true,facing:1 };
    coins = coinStarts.map(([x,y]) => ({x,y,collected:false}));
    enemies = enemyStarts.map(e => ({...e,w:34,h:28,defeated:false}));
    clearInput(); physicalKeys.clear(); previousTime = null; accumulator = 0;
    document.getElementById('coins').textContent = 'Coins: 0';
    document.getElementById('lives').textContent = 'Lives: 3';
    document.getElementById('end-screen').hidden = true;
    updateHud(); canvas.focus();
  }
  function loseLife(fell = false) {
    if (state !== 'playing' || (!fell && damageTimer > 0)) return;
    if(!fell && shield){shield=false;damageTimer=1.2;burst(player.x+17,player.y+24,'#7cf0ff',18);toast('Shield absorbed the hit');updateHud();return;}
    leapTimer=0;airJumpUsed=false;coyoteTimer=0;jumpBufferTimer=0;
    lives--; document.getElementById('lives').textContent = 'Lives: ' + lives;
    clearInput(); physicalKeys.clear();
    if (lives === 0) { finish('gameover'); return; }
    Object.assign(player, spawn, {vx:0,vy:0,grounded:true,facing:1});
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
    keys.clear(); touches.clear(); jumpQueued = false; jumpBufferTimer=0; releaseJump();
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
    if(shield){ctx.strokeStyle='#7cf0ff';ctx.lineWidth=2;ctx.beginPath();ctx.arc(p.x+17,p.y+24,34,0,Math.PI*2);ctx.stroke();}
    star(p.x-8*p.facing+17,p.y+28,10,'#ffcf6b');
    rect(p.x + 4, p.y + 40, 10, 8, '#09182c'); rect(p.x + 21, p.y + 40, 10, 8, '#09182c');
    rect(p.x + 3, p.y + 20, 28, 22, '#199c98'); rect(p.x, p.y + 2, 34, 25, '#7cf0ff');
    rect(p.x + 4, p.y + 7, 26, 12, '#09182c');
    rect(p.x + 8 + p.facing, p.y + 10, 5, 5, '#fff2c4'); rect(p.x + 21 + p.facing, p.y + 10, 5, 5, '#fff2c4');
    rect(p.x + 15, p.y - 4, 3, 7, '#09182c'); circle(p.x + 16.5, p.y - 5, 3, '#ffcf6b');
    rect(p.x + 12, p.y + 29, 10, 5, '#ffcf6b');
  }
  function star(x,y,r,color) {
    ctx.fillStyle=color;ctx.beginPath();for(let i=0;i<10;i++){const a=i*Math.PI/5-Math.PI/2,rr=i%2?r*0.45:r;const px=x+Math.cos(a)*rr,py=y+Math.sin(a)*rr;if(i===0)ctx.moveTo(px,py);else ctx.lineTo(px,py);}ctx.closePath();ctx.fill();
  }
  function accent(x){return x<1600?'#35e6c4':x<3300?'#e364e0':'#9790ff';}
  function draw() {
    const offsetY = Math.max(0,(viewHeight-WORLD.height)*0.42);
    ctx.setTransform(canvas.width/viewWidth,0,0,canvas.height/viewHeight,0,offsetY*canvas.height/viewHeight);
    rect(0,-offsetY,viewWidth,viewHeight,'#0d1130');
    for(let i=0;i<95;i++){const x=((i*137.3-camera*0.08)%(viewWidth+40)+viewWidth+40)%(viewWidth+40);circle(x,((i*73)%410)-offsetY, i%4===0?1.6:0.8,'#8d9dbb');}
    circle(viewWidth*0.79-camera*0.018,105,65,'#1b2547');circle(viewWidth*0.79-camera*0.018,105,48,'#f6ead0');circle(viewWidth*0.79-camera*0.018+18,90,43,'#0d1130');
    for(let i=-2;i<24;i++) {
      const x=i*310-camera*0.24;ctx.fillStyle='#192344';ctx.beginPath();ctx.moveTo(x-150,500);ctx.quadraticCurveTo(x+80,120+(i%3)*50,x+350,500);ctx.fill();
    }
    for(let i=0;i<42;i++){
      const wx=i*150,x=wx-camera*0.55,y=360+(i%4)*28,col=accent(wx);
      rect(x,y-100,9,260,'#1a2643');
      if(wx<1600){for(let j=0;j<3;j++){ctx.fillStyle='#183e46';ctx.beginPath();ctx.moveTo(x-54+j*8,y+j*33);ctx.lineTo(x+4,y-95+j*32);ctx.lineTo(x+65-j*8,y+j*33);ctx.fill();}}
      else if(wx<3300){circle(x+5,y-90,58,'#3c224f');rect(x-56,y-85,122,65,'#0d1130');rect(x-45,y-91,100,3,'#754575');}
      else {ctx.fillStyle='#292951';ctx.beginPath();ctx.moveTo(x-30,500);ctx.lineTo(x-10,y-130);ctx.lineTo(x+35,y-65);ctx.lineTo(x+45,500);ctx.fill();}
      circle(x+30,y+Math.sin(elapsed+i)*10,2,col);
    }
    ctx.save();ctx.translate(-camera,0);
    for(const s of solids){
      if(s.x+s.w<camera-50||s.x>camera+viewWidth+50)continue;
      const col=accent(s.x);rect(s.x,s.y,s.w,s.h,'#241a3d');rect(s.x,s.y,s.w,4,col);rect(s.x,s.y+4,s.w,5,'#314154');
      if(s.h===100){for(let x=s.x+12;x<s.x+s.w;x+=29){rect(x,s.y+20+(x%23),4,3,'#4c4265');rect(x,s.y-4-(x%7),2,5+(x%7),col);}}
      else {rect(s.x+10,s.y+s.h,s.w-20,5,'#11162d');if(s.x>=1600&&s.x<3300)rect(s.x+s.w/2-5,s.y+22,10,90,'#3c224f');}
    }
    for(let i=0;i<checkpointStarts.length;i++){
      const x=checkpointStarts[i],col=i<=checkpoint?'#7cf0ff':'#59627c';rect(x,410,24,90,'#26334e');rect(x+4,416,16,62,col);circle(x+12,407,9,col);label('BEACON',x-14,392,10,col);
    }
    for(const item of pickups)if(!item.taken){const y=item.y+Math.sin(elapsed*3+item.x)*4;circle(item.x,y,22,'#26304d');if(item.type==='shield'){ctx.strokeStyle='#7cf0ff';ctx.lineWidth=3;ctx.beginPath();for(let i=0;i<7;i++){const a=i*Math.PI/3;ctx.lineTo(item.x+Math.cos(a)*14,y+Math.sin(a)*14);}ctx.stroke();}else star(item.x,y,16,'#ffcf6b');label(item.type==='shield'?'SHIELD':'DOUBLE JUMP',item.x-34,y-31,10,'#f2ecff');}
    for(const coin of coins)if(!coin.collected){const y=coin.y+Math.sin(elapsed*3+coin.x)*2;circle(coin.x,y,12,'#654d35');circle(coin.x,y,8,'#ffcf6b');rect(coin.x-1,y-5,2,10,'#fff2c4');}
    for(const shard of shards)if(!shard.collected){circle(shard.x,shard.y,19,'#343159');star(shard.x,shard.y,14,'#c7bcff');}
    for(const e of enemies)if(!e.defeated){
      rect(e.x+3,e.y+22,8,6,'#7a2418');rect(e.x+23,e.y+22,8,6,'#7a2418');circle(e.x+17,e.y+13,17,'#ff6b57');rect(e.x,e.y+17,34,7,'#b93b48');rect(e.x+5,e.y+8,24,8,'#391c35');rect(e.x+8,e.y+10,5,3,'#fff2c4');rect(e.x+22,e.y+10,5,3,'#fff2c4');
    }
    rect(WORLD.flagX-32,482,86,18,'#687087');rect(WORLD.flagX-20,462,62,20,'#343955');rect(WORLD.flagX+2,324,14,138,'#ffcf6b22');circle(WORLD.flagX+9,344,31,'#ffcf6b22');star(WORLD.flagX+9,344,22,'#ffcf6b');label('BRING THE LIGHT HOME',WORLD.flagX-100,290,13,'#fff2c4');
    if(player.x<560){label('A LOST STAR. A LONG WAY HOME.',55,260,13,'#7cf0ff');label('MOONLIGHT',54,298,32,'#f2ecff');label('COURIER',54,332,32,'#f2ecff');label('Carry the star to the ancient altar →',55,360,13,'#acb9d3');}
    label('HOLD JUMP TO GO FARTHER',485,310,12,'#f2ecff');label('Stomp the red sentries ↓',805,285,12,'#ffb0a3');
    ctx.globalAlpha=damageTimer>0?0.55+Math.sin(damageTimer*30)*0.2:1;drawRobot();ctx.globalAlpha=1;
    for(const q of particles){ctx.globalAlpha=Math.min(1,q.life*2);rect(q.x,q.y,4,4,q.color);}ctx.globalAlpha=1;
    ctx.restore();
  }
  updateHud();
  window.addEventListener('resize', resize);
  document.getElementById('restart').addEventListener('click', restart);
  resize();
  requestAnimationFrame(frame);
}
const page = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>Moonlight Courier — bring the light home</title>
<style>
*{box-sizing:border-box}html,body{margin:0;width:100%;height:100%;overflow:hidden;background:#f6efd9;color:#244941;font-family:system-ui,sans-serif}body{display:flex;align-items:center;justify-content:center}main{position:relative;width:100%;height:100%;max-width:1600px;max-height:1000px}canvas{display:block;width:100%;height:100%}.hud{position:absolute;left:24px;right:24px;top:max(20px,env(safe-area-inset-top));display:flex;justify-content:space-between;gap:12px;pointer-events:none}.brand{font-size:13px;font-weight:800;letter-spacing:3px}.stats{display:flex;gap:22px;font-size:16px;font-weight:750}.help{position:absolute;bottom:22px;left:24px;font-size:13px;color:#fff4dc}
.overlay{position:absolute;inset:0;display:grid;place-items:center;background:#09182c77;backdrop-filter:blur(5px);z-index:3}.overlay[hidden]{display:none}.card{width:min(88%,380px);background:#fff9e8;border:1px solid #e8d8b7;border-radius:24px;padding:36px;text-align:center;box-shadow:0 20px 70px #09182c30}.card h1{font-size:40px;letter-spacing:-2px;margin:8px 0 12px}.card p{line-height:1.6}.card button{background:#247e71;color:white;border:0;border-radius:12px;padding:16px 32px;font:750 16px system-ui;cursor:pointer}.card button:focus-visible{outline:3px solid #d28c36;outline-offset:4px}
.touch-controls{display:none;position:absolute;bottom:max(20px,env(safe-area-inset-bottom));left:max(20px,env(safe-area-inset-left));right:max(20px,env(safe-area-inset-right));justify-content:space-between;pointer-events:none;user-select:none;-webkit-user-select:none}.directions{display:flex;gap:12px}.touch-controls button{width:72px;height:72px;border:2px solid #f6efd9aa;border-radius:20px;background:#244941e8;color:#fff5d8;font:750 28px system-ui;pointer-events:auto;touch-action:none;-webkit-touch-callout:none}.touch-controls .jump{width:88px;font-size:15px;background:#247e71}.touch-controls button.pressed{background:#cf8850;transform:translateY(2px)}html,body,canvas{overscroll-behavior:none}canvas{touch-action:none;outline:none}@media(pointer:coarse),(max-width:760px){.touch-controls{display:flex}.help{display:none}.brand{font-size:11px;letter-spacing:2px}.stats{font-size:15px;gap:14px}.hud{left:18px;right:18px}}@media(max-height:450px){.touch-controls{bottom:12px}.touch-controls button{height:58px;width:64px;border-radius:16px}.hud{top:12px}}

html,body{background:#0d1130;color:#f2ecff}.hud{padding:14px 18px;background:#111a35dc;border:1px solid #637da333;border-radius:14px;align-items:center}.brand{font-size:12px;letter-spacing:2px}.stats{font-size:14px;gap:18px}#coins{color:#ffcf6b}#lives{color:#7cf0ff}.journey{position:absolute;top:max(90px,calc(env(safe-area-inset-top) + 76px));left:42px;font-size:10px;letter-spacing:1.5px;color:#b7c3dd;pointer-events:none}.track{margin:10px 0;width:220px;height:3px;background:#38405c}#progress{height:3px;background:#7cf0ff}.powers{display:flex;gap:16px;letter-spacing:0;font-size:12px}.chip{color:#8791ac}.chip.active{color:#7cf0ff}#shards{color:#c7bcff}#toast{position:absolute;top:180px;left:50%;transform:translateX(-50%);width:max-content;max-width:90%;padding:10px 16px;background:#192a42ed;border:1px solid #7cf0ff55;border-radius:10px;text-align:center;font-size:13px;pointer-events:none}.help{color:#a6b7ce}.card{background:#151b36;border-color:#7cf0ff55;box-shadow:0 20px 70px #0008}.card h1{font-size:36px;letter-spacing:-1px}.card p{color:#b7c3dd}.card button{background:#7cf0ff;color:#0d1130}.overlay{background:#080f26bb}.touch-controls button{background:#192a42ed;border-color:#7cf0ff66;color:#dffbff}.touch-controls .jump{background:#32647a}.touch-controls button.pressed{background:#458b94}@media(max-width:760px){.hud{padding:12px;left:12px;right:12px;gap:8px}.brand{font-size:9px;letter-spacing:1px;max-width:105px}.stats{font-size:12px;gap:12px}.journey{left:25px;top:90px}.powers{gap:12px;font-size:11px}#toast{top:162px;font-size:12px}}@media(max-height:450px){.journey{top:75px}.powers{font-size:10px}.track{margin:6px 0}#toast{top:115px}.hud{top:10px}.card{padding:20px}}
</style></head><body><main aria-label="Moonlight Courier game">
<canvas id="game" tabindex="-1" aria-label="A robot platformer. Move with A and D or arrow keys; jump with Space or W."></canvas>
<header class="hud"><span class="brand">MOONLIGHT COURIER</span><div class="stats"><span id="coins">Coins: 0</span><span id="lives">Lives: 3</span></div></header>
<div class="journey"><span id="route"></span><div class="track"><div id="progress"></div></div><div class="powers"><span id="shards">✦ 0/3</span><span class="chip" id="shield"></span><span class="chip" id="leap"></span></div></div><div id="toast" role="status"></div>
<div class="help">← → / A D &nbsp; Move &nbsp; · &nbsp; Space / W &nbsp; Hold for a high jump &nbsp; · &nbsp; Deliver the star · Find 3 fragments</div>
<div class="touch-controls" aria-label="Touch controls"><div class="directions"><button type="button" data-action="left" aria-label="Move left">←</button><button type="button" data-action="right" aria-label="Move right">→</button></div><button type="button" class="jump" data-action="jump" aria-label="Jump">JUMP</button></div>
<section id="end-screen" class="overlay" role="dialog" aria-modal="true" aria-labelledby="end-title" aria-describedby="end-detail" hidden><div class="card"><h1 id="end-title"></h1><p id="end-detail"></p><button id="restart" type="button">Play again</button></div></section>
</main><script>(${gameClient.toString()})();</script></body></html>`;
app.get('/', (req, res) => res.type('html').send(page));
if (require.main === module) {
  const port = process.env.PORT || 3000;
  app.listen(port, '0.0.0.0', () => console.log('Little Bolt listening on ' + port));
}
module.exports = { app, page, gameClient };
