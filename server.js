'use strict';
const express = require('express');
const app = express();

// The entire browser game is embedded in this file. Coordinates are world units.
function gameClient() {
  'use strict';
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const SCENE = { width: 2400, height: 600, groundY: 500 };

  function mulberry32(seed){return function(){seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}

  const PAL = {};
  [
    ['forest',['#aa6770','#d98d77','#f0b985'],'#a67758','#86604f','#503c42','#ffe1a0','#8a6261'],
    ['ruins',['#4f526e','#747690','#a5a4ad'],'#927863','#6c5a59','#393544','#efce8a','#595775'],
    ['canopy',['#99627b','#c98387','#edb89b'],'#b48561','#926c58','#533e46','#ffe2a1','#916375'],
    ['observatory',['#242c4e','#39466a','#636583'],'#8b7581','#655569','#302d46','#edd89e','#4b4868'],
    ['guardian',['#3b283a','#643c49','#a66157'],'#a57155','#775043','#3a2c39','#ffd98c','#694653']
  ].forEach(([id,sky,ground,mid,deep,edge,hill])=>{PAL[id]={sky,ground,mid,deep,edge,hill,pillar:mid,moss:ground,leaf:edge,accent:edge,glow:edge};});

  /* --- precomputed decoration (computed once per stage load, not per frame) --- */
  function buildStars(seed){const rnd=mulberry32(seed);const a=[];for(let i=0;i<140;i++)a.push({x:rnd()*SCENE.width*1.4,y:rnd()*260,r:rnd()<0.15?1.8:0.9,phase:rnd()*10});return a;}
  function buildHills(seed,width){const rnd=mulberry32(seed);const a=[];let x=-200;while(x<width*1.3){const w=260+rnd()*180,peak=90+rnd()*70;a.push({x,w,peak});x+=w*0.62;}return a;}
  function buildCanopyBlobs(seed,width){
    const rnd=mulberry32(seed);const a=[];let x=-150;
    while(x<width*1.2){
      const baseY=250+rnd()*130,spread=100+rnd()*90,n=4+Math.floor(rnd()*4);
      const lobes=[];for(let i=0;i<n;i++)lobes.push({dx:(i-n/2)*spread*0.5+ (rnd()-0.5)*24,dy:(rnd()-0.5)*46,r:30+rnd()*36});
      a.push({x,baseY,lobes});
      x+=spread*1.15;
    }
    return a;
  }
  function buildVines(seed,width){const rnd=mulberry32(seed);const a=[];let x=80;while(x<width){a.push({x,len:60+rnd()*90,sway:rnd()*Math.PI*2,leaves:2+Math.floor(rnd()*3)});x+=220+rnd()*260;}return a;}
  function terrainTexture(seg){
    const rnd=mulberry32(Math.floor(seg.x)+1);
    const roots=[];for(let x=seg.x+14;x<seg.x+seg.w-14;x+=26+rnd()*14)roots.push({x,depth:14+rnd()*22,lean:(rnd()-0.5)*10});
    const tufts=[];for(let x=seg.x+6;x<seg.x+seg.w-6;x+=16+rnd()*10)tufts.push({x,h:5+rnd()*9});
    return {roots,tufts};
  }

  const ART = {};

  // Hand-authored sprite grids share one four-world-unit pixel scale.
  function sprite(rows,x,y,colors,unit=4,flip=false){
    const w=rows[0].length*unit;
    rows.forEach((row,j)=>[...row].forEach((c,i)=>{
      if(colors[c]){ctx.fillStyle=colors[c];ctx.fillRect(Math.round(x+(flip?w-(i+1)*unit:i*unit)),Math.round(y+j*unit),unit,unit);}
    }));
  }
  ART.drawWarden = function(ctx,x,y,facing,pose,t){
    const stride=Math.floor(t*10)%2;
    const rows=[
      '.....oooo.....','....ohhhho....','...ohhhhllo...','...ohhssssso..',
      '...ohhseksso..','....ohsssso...','...ocooooo....','..occlcccco...',
      '..occlccccos..','.occlcccocos..','.occlcccoco...', '.occlcccoco...',
      '..occlccco....','...obbbbo.....',
      pose==='jump'?'..obb..bbo....':pose==='run'&&stride?'..obb...bo....':'...ob..bo.....',
      pose==='jump'?'...oo...oo....':pose==='run'&&stride?'.oooo...ooo...':'..ooo..ooo....'
    ];
    if(pose==='throw'){rows[8]='..occlcccossss';rows[9]='.occlccccooooo';}
    sprite(rows,x-21,y-20,{o:'#302235',h:'#c27642',l:'#ffe0a0',s:'#e6a36e',k:'#4b2b32',e:'#152e3d',c:'#4f537e',b:'#684342'},3,facing<0);
  };
  ART.drawBeetle = function(ctx,x,y,facing,t){
    sprite(['..o...o..','...ooo...','..ogtgo..','.oggtggo.','ogggtgggo','.oggtggo.','..ooooo..',Math.floor(t*8)%2?'oo..o..oo':'.oo.o.oo.'],x-18,y-16,{o:'#372936',g:'#397477',t:'#e5ba68'},4,facing<0);
  };
  ART.drawDrone = function(ctx,x,y,t,alert){
    sprite(['...ooo...','..occco..','.occwcco.','.ocwcwco.','..occco..','..occco..','.occooco.','oo..o..oo'],x-18,y-16+Math.floor(Math.sin(t*4)*2)*2,{o:'#46334e',c:'#ab7891',w:alert?'#ffd899':'#eee4c2'});
  };
  ART.drawCollectibleCoin = function(ctx,x,y,t){
    sprite(['.ooo.','oyywo','oyywo','oyyyo','.ooo.'],x-10,y-10+Math.floor(Math.sin(t*3+x)*2)*2,{o:'#9d632d',y:'#ffc75b',w:'#fff0b3'});
  };
  ART.drawCollectibleShard = function(ctx,x,y,t){
    sprite(['...w...','..wvw..','.wvvvw.','wvvvvvw','.wvvvw.','..wvw..','...w...'],x-14,y-14,{w:'#e6d5ff',v:'#a080e8'});
  };
  ART.drawGuardian = function(ctx,g,t,phase){
    const light=phase==='vulnerable'?'#ffe5a5':phase==='attack'?'#ff463e':phase==='telegraph'?'#ffbd69':'#c16983';
    ctx.save();ctx.translate(Math.round(g.x),Math.round(g.y));ctx.scale(g.w/48,g.h/48);
    sprite(['..o.o..o.o..','..orroorro..','..orrrrrro..','.orrhhhhrro.','oorrrrrrrroo','orrrllllrrro','orrrllllrrro','oorrrrrrrroo','.orrhhhhrro.','..orrrrrro..','..ooo..ooo..','.oooo..oooo.'],0,0,{o:'#160e25',r:'#a16c48',h:'#ebbc79',l:light});
    ctx.restore();
    if(phase==='telegraph'){ctx.fillStyle=light;ctx.fillRect(g.x+g.w/2-3,g.y-24,6,12);ctx.fillRect(g.x+g.w/2-3,g.y-8,6,4);}
  };
  ART.drawTerrainGround = function(ctx,s,t,pal){
    ctx.fillStyle=pal.deep;ctx.fillRect(s.x,s.y,s.w,s.h);
    for(let y=s.y+8;y<s.y+s.h;y+=20)for(let x=s.x;x<s.x+s.w;x+=32){
      ctx.fillStyle=(Math.floor((x-s.x)/32+(y-s.y)/20)%3)?pal.ground:pal.mid;
      ctx.fillRect(x+2,y,Math.min(28,s.x+s.w-x-2),16);
      ctx.fillStyle=pal.pillar;ctx.fillRect(x+4,y+2,Math.min(8,s.x+s.w-x-4),2);
    }
    ctx.fillStyle=pal.edge;ctx.fillRect(s.x,s.y,s.w,4);
    ctx.fillStyle=pal.moss;ctx.fillRect(s.x,s.y+4,s.w,6);
    for(let x=s.x+8;x<s.x+s.w-8;x+=24){ctx.fillStyle=pal.leaf;ctx.fillRect(x,s.y+4,8,8);}
  };
  ART.drawTerrainPlatform = function(ctx,s,t,pal){
    ctx.fillStyle=pal.deep;ctx.fillRect(s.x,s.y,s.w,s.h);
    ctx.fillStyle=pal.edge;ctx.fillRect(s.x,s.y,s.w,4);
    for(let x=s.x+4;x<s.x+s.w-4;x+=16){ctx.fillStyle=pal.pillar;ctx.fillRect(x,s.y+6,Math.min(12,s.x+s.w-x),Math.max(2,s.h-8));}
  };

  // Original sandstone architecture: all edges and shading clusters sit on the pixel grid.
  ART.drawBackdrop=function(ctx,view,camera,pal,t){
    for(let i=0;i<3;i++){rect(0,i*200,view.w,200,pal.sky[i]);}
    const sunX=Math.floor(view.w*0.76/4)*4;
    rect(sunX-24,100,48,8,'#fbe5a2');rect(sunX-32,108,64,40,'#fbe5a2');rect(sunX-24,148,48,8,'#fbe5a2');
    for(let i=-2;i<view.w/160+4;i++){
      const x=i*160-Math.floor(camera*0.15%160/4)*4;
      const h=96+((i+20)%4)*28;
      rect(x,440-h,112,h,pal.hill);rect(x+12,424-h,88,16,pal.hill);rect(x+28,412-h,56,12,pal.hill);
      for(let j=0;j<3;j++)rect(x+18+j*30,456-h,12,24,pal.sky[1]);
    }
    for(let i=-1;i<view.w/260+3;i++){
      const x=i*260-Math.floor(camera*0.38%260/4)*4;
      rect(x,314,124,186,pal.pillar);rect(x-8,304,140,12,pal.mid);
      rect(x+8,322,108,4,pal.ground);
      for(let k=0;k<6;k++){rect(x+8+k*18,334,10,6,pal.ground);rect(x+12+k*18,330,2,14,pal.ground);}
      rect(x+12,366,16,44,pal.mid);rect(x+16,370,8,32,pal.hill);
      rect(x+96,366,16,44,pal.mid);rect(x+100,370,8,32,pal.hill);
      if(stageIndex===1){
        rect(x+34,434,56,64,pal.deep);rect(x+30,492,64,8,'#657e8c');
        for(let k=0;k<3;k++)rect(x+36+k*18,498,12,2,'#91a6ad');
      }
      if(stageIndex>=3){
        rect(x+44,252,36,52,pal.pillar);rect(x+52,236,20,16,pal.pillar);rect(x+60,216,4,20,pal.ground);
        for(let k=0;k<4;k++){rect(x+8+k*28,294,12,10,pal.pillar);}
      }
      for(let y=344;y<480;y+=32){rect(x+8,y,108,2,pal.mid);rect(x+((y/32)%2?40:80),y,2,32,pal.mid);}
      rect(x+40,380,44,120,pal.mid);rect(x+48,372,28,8,pal.mid);
      rect(x+144,414,80,6,pal.mid);rect(x+148,420,4,80,pal.pillar);rect(x+216,420,4,80,pal.pillar);
      for(let j=0;j<5;j++){rect(x+140+j*18,400,18,14,j%2?'#875667':'#b78670');rect(x+140+j*18,414,14,6,j%2?'#875667':'#b78670');}
      if(stageIndex===2){rect(x+154,426,56,38,'#8c596a');for(let k=0;k<4;k++)rect(x+160+k*12,432,4,26,'#c58c84');}
      rect(x+146,476,78,24,pal.pillar);rect(x+154,462,16,14,pal.ground);rect(x+184,458,24,18,pal.ground);
    }
  };
  ART.drawMovingPlatform=function(ctx,s,t,pal){ART.drawTerrainPlatform(ctx,s,t,pal);for(let x=s.x+10;x<s.x+s.w-4;x+=16){rect(x,s.y+8,6,6,'#dbab68');} };

  /* ---------------- Campaign / stage data ---------------- */
  function layout(lengths, gap){
    let x=0; const segs=[];
    for(const w of lengths){ segs.push({x,w}); x += w+gap; }
    return { segs, end: x-gap };
  }

  function buildStage(opts){
    const { segs, end } = layout(opts.groundLengths, 150);
    const groundSolids = segs.map(s=>({x:s.x,y:500,w:s.w,h:100}));
    const platformSolids = (opts.platforms||[]).map(([x,y,w])=>({x,y,w,h:22}));
    const solids = [...groundSolids, ...platformSolids];
    solids.forEach(s=>{ s.tex = terrainTexture(s); });
    const width = opts.arena ? opts.arenaWidth : end + 400;
    return {
      name: opts.name,
      palette: PAL[opts.palette],
      decor: opts.decor,
      width,
      arena: !!opts.arena,
      groundEnd: end,
      spawn: opts.spawn || { x: segs[0].x + 46, y: 452 },
      solids,
      segs,
      movingPlatforms: (opts.moving||[]).map(m=>({ x0:m.x, y0:m.y, x:m.x, y:m.y, w:m.w, h:22, axis:m.axis, range:m.range, speed:m.speed, phase:0, dx:0, dy:0 })),
      coinStarts: opts.coins || [],
      shardStarts: opts.shards || [],
      pickupStarts: opts.pickups || [],
      checkpointStarts: opts.checkpoints || [],
      beetleStarts: opts.beetles || [],
      droneStarts: opts.drones || [],
      flagX: opts.arena ? null : end - 70,
      stars: buildStars(opts.seed), hills: buildHills(opts.seed+1,width), blobs: buildCanopyBlobs(opts.seed+2,width), vines: buildVines(opts.seed+3,width),
    };
  }

  const STAGES = [
    buildStage({
      name:'Canyon Outskirts', palette:'forest', decor:'forest', seed:1,
      groundLengths:[560,520,480],
      platforms:[[150,390,150],[790,390,140],[960,320,100],[1430,390,130]],
      moving:[{x:1130,y:420,w:70,axis:'y',range:-100,speed:1.1}],
      coins:[[210,465],[300,355],[400,355],[600,390],[830,355],[1000,285],[1100,465],[1460,355],[1600,465],[1720,465]],
      shards:[[1000,285]],
      pickups:[{x:780,y:450,type:'shield'}],
      checkpoints:[730],
      beetles:[{x:300,min:260,max:480,dir:1}],
      drones:[{x:850,y:350,min:790,max:930,dir:1}],
    }),
    buildStage({
      name:'Buried Cistern', palette:'ruins', decor:'ruins', seed:11,
      groundLengths:[520,540,560],
      platforms:[[160,390,140],[420,320,90],[820,390,150],[1000,320,110],[1470,390,140],[1470,260,90]],
      moving:[{x:660,y:340,w:80,axis:'x',range:120,speed:0.9}],
      coins:[[220,465],[350,355],[470,285],[860,355],[1040,285],[1120,285],[1520,465],[1650,355],[1750,465],[1900,465]],
      shards:[[1500,225]],
      pickups:[{x:900,y:450,type:'leap'}],
      checkpoints:[790],
      beetles:[{x:1650,min:1630,max:1790,dir:1}],
      drones:[{x:1080,y:350,min:1000,max:1180,dir:-1}],
    }),
    buildStage({
      name:'Silk Bazaar', palette:'canopy', decor:'canopy', seed:21,
      groundLengths:[540,500,540],
      platforms:[[150,390,140],[760,390,150],[960,320,100],[1420,390,140]],
      moving:[{x:1090,y:350,w:80,axis:'y',range:-160,speed:0.8},{x:330,y:280,w:80,axis:'x',range:160,speed:0.7}],
      coins:[[210,465],[300,355],[860,355],[1040,285],[1480,355],[1620,465],[1750,465],[1880,465]],
      shards:[[370,245]],
      pickups:[{x:820,y:450,type:'shield'}],
      checkpoints:[770],
      beetles:[{x:1650,min:1600,max:1750,dir:1}],
      drones:[{x:1000,y:340,min:950,max:1110,dir:1}],
    }),
    buildStage({
      name:'Astral Palace', palette:'observatory', decor:'observatory', seed:31,
      groundLengths:[560,560,560],
      platforms:[[170,390,150],[400,320,90],[800,390,150],[1440,390,140],[1440,320,90]],
      moving:[{x:1000,y:340,w:90,axis:'x',range:170,speed:0.85}],
      coins:[[230,465],[360,355],[420,285],[850,355],[1500,355],[1500,285],[1650,465],[1780,465],[1900,465]],
      shards:[[1490,225]],
      pickups:[{x:840,y:450,type:'leap'}],
      checkpoints:[810],
      beetles:[{x:1700,min:1630,max:1820,dir:1}],
      drones:[{x:1080,y:350,min:1010,max:1180,dir:-1}],
    }),
    buildStage({
      name:'Sun Throne', palette:'guardian', decor:'guardian', seed:41,
      arena:true, arenaWidth:1400,
      groundLengths:[1400],
      spawn:{x:70,y:452},
      checkpoints:[560],
      beetles:[], drones:[], coins:[], shards:[], pickups:[],
    }),
  ];
  STAGES.slice(0,4).forEach((s,i)=>{
    const start=s.groundEnd+150;
    const lengths=[510,460,600];
    let x=start;
    lengths.forEach((w,j)=>{
      s.segs.push({x,w});
      s.solids.push({x,y:500,w,h:100,tex:terrainTexture({x,w})});
      const ledges=[[x+64,390,116],[x+220,300,112]];
      if(j===1)ledges.push([x+340,220,96]);
      for(const [px,y,pw] of ledges)s.solids.push({x:px,y,w:pw,h:22,tex:terrainTexture({x:px,w:pw})});
      s.coinStarts.push([x+104,355],[x+260,265],[x+w-130,465]);
      if(j===0)s.beetleStarts.push({x:x+330,min:x+300,max:x+w-45,dir:-1});
      if(j===1)s.droneStarts.push({x:x+240,y:260,min:x+210,max:x+340,dir:1});
      if(j===2)s.beetleStarts.push({x:x+400,min:x+350,max:x+520,dir:1});
      if(j===1)s.shardStarts.push([x+380,185]);
      x+=w+150;
    });
    s.groundEnd=x-150;s.width=s.groundEnd+180;s.flagX=s.groundEnd-70;
    s.checkpointStarts.push(start+20,start+510+150+20);
    s.pickupStarts.push({x:start+90,y:452,type:'shield'});
    // Required seals occupy reachable ledges; the high relic route is optional.
    s.sealStarts=[{x:270,y:352},{x:start+104,y:352},{x:start+510+150+260,y:262}];
  });
  const totalCoins = STAGES.reduce((n,s)=>n+s.coinStarts.length,0);
  const totalShards = STAGES.reduce((n,s)=>n+s.shardStarts.length,0);

  let stageIndex = 0, stage = STAGES[0];
  let player = { x:0, y:0, w:34, h:48, vx:0, vy:0, grounded:true, facing:1, riding:null };
  let camera = 0, viewWidth = 960, viewHeight = 600;
  let solids = [], movingPlatforms = [];
  let coins = [], coinCount = 0, fragmentCount = 0;
  let enemies = [];
  let guardian = null;
  let lives = 3, damageTimer = 0, state = 'playing';
  let checkpointStarts = [], checkpoint = -1, spawn = { x:0, y:0 };
  let shield = false, leapTimer = 0, airJumpUsed = false;
  let coyoteTimer = 0, jumpBufferTimer = 0, jumpCut = false, elapsed = 0, toastTimer = 0;
  let pickups = [], shards = [];
  let particles = [];
  let seals=[], glaive=null, throwRequested=false;
  let dashCooldown = 0, dashTimer = 0, dashRequested = false;
  const STEP = 1 / 120, SPEED = 280, GRAVITY = 1800, JUMP = 680;
  const DASH_SPEED = 760, DASH_TIME = 0.16, DASH_COOLDOWN = 0.9;

  function burst(x,y,color,n=10) {
    for(let i=0;i<n;i++) {const a=i/n*Math.PI*2;particles.push({x,y,vx:Math.cos(a)*90,vy:Math.sin(a)*90-35,life:0.55,color});}
    if(particles.length>180)particles.splice(0,particles.length-180);
  }
  function toast(message) {document.getElementById('toast').textContent=message;toastTimer=2.8;}
  function overlaps(a, b) { return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y; }
  const keys = new Set();
  const touches = new Map();
  let jumpQueued = false;
  function held(action) { return keys.has(action) || [...touches.values()].includes(action); }

  function loadStage(index) {
    stageIndex = index; stage = STAGES[index];
    seals=(stage.sealStarts||[]).map(s=>({...s,active:false}));glaive=null;throwRequested=false;
    solids = stage.solids;
    movingPlatforms = stage.movingPlatforms.map(m=>({...m}));
    coins = stage.coinStarts.map(([x,y]) => ({x,y,collected:false}));
    shards = stage.shardStarts.map(([x,y]) => ({x,y,collected:false}));
    pickups = stage.pickupStarts.map(p=>({...p,taken:false}));
    checkpointStarts = stage.checkpointStarts;
    checkpoint = -1;
    spawn = { ...stage.spawn };
    enemies = [
      ...stage.beetleStarts.map(e => ({...e,type:'beetle',w:34,h:28,defeated:false,y:472})),
      ...stage.droneStarts.map(e => ({...e,type:'drone',w:34,h:28,defeated:false})),
    ];
    guardian = stage.arena ? {
      x: stage.width/2 - 40, y: 390, w:80, h:110,
      arenaMin: 60, arenaMax: stage.width-60,
      baseX: stage.width/2 - 40,
      phase:'idle', timer:2.2, vx:0, hits:0, maxHits:3, attackDir:1,
    } : null;
    shield = false; leapTimer = 0; airJumpUsed = false; damageTimer = 0;
    coyoteTimer = 0; jumpBufferTimer = 0; jumpCut = false; toastTimer = 0; particles = [];
    dashCooldown = 0; dashTimer = 0; dashRequested = false;
    player = { ...spawn, w:34, h:48, vx:0, vy:0, grounded:true, facing:1, riding:null };
    camera = 0;
    clearInput(); physicalKeys.clear(); previousTime = null; accumulator = 0;
    document.getElementById('coins').textContent = 'Coins: ' + coinCount;
    document.getElementById('lives').textContent = 'Lives: ' + lives;
    updateHud(); canvas.focus();
    toast(stage.arena?'Sun Colossus · evade its charge, strike when gold':'C / K or THROW · light all three sun seals to open the gate');
  }

  function updateHud() {
    document.getElementById('seals').textContent=stage.arena?'SUN THRONE':'SEALS '+seals.filter(s=>s.active).length+'/'+seals.length;
    document.getElementById('shards').textContent='✦ '+fragmentCount+'/'+totalShards;
    document.getElementById('shield').textContent=shield?'⬡ Shield ready':'⬡ Shield —';
    document.getElementById('leap').textContent=leapTimer>0?'✧ Double jump '+leapTimer.toFixed(1)+'s':'✧ Double jump —';
    document.getElementById('shield').classList.toggle('active',shield);
    document.getElementById('leap').classList.toggle('active',leapTimer>0);
    const pct = stage.arena ? Math.floor((guardian? guardian.hits/guardian.maxHits*100:0)) : Math.min(100,Math.floor(player.x/(stage.flagX||1)*100));
    document.querySelectorAll('[data-action=dash]').forEach(b=>{b.textContent=dashCooldown>0?dashCooldown.toFixed(1)+'s':'DASH';});
    document.getElementById('route').textContent='0'+(stageIndex+1)+' · '+stage.name.toUpperCase()+'  /  '+pct+'%';
    document.getElementById('progress').style.width=pct+'%';
    document.getElementById('toast').style.opacity=String(Math.min(1,toastTimer));
  }
  function releaseJump() {if(!held('jump') && player.vy<0 && !jumpCut){player.vy*=0.45;jumpCut=true;}}

  function update(dt) {
    if (state !== 'playing') return;
    const p = player;
    const pal = stage.palette;
    elapsed += dt; toastTimer=Math.max(0,toastTimer-dt); leapTimer=Math.max(0,leapTimer-dt);
    dashCooldown=Math.max(0,dashCooldown-dt); if(dashTimer>0)dashTimer=Math.max(0,dashTimer-dt);
    particles=particles.filter(q=>{q.life-=dt;q.x+=q.vx*dt;q.y+=q.vy*dt;q.vy+=180*dt;return q.life>0;});
    coyoteTimer=p.grounded?0.1:Math.max(0,coyoteTimer-dt);
    jumpBufferTimer=jumpQueued?0.12:Math.max(0,jumpBufferTimer-dt);
    if(p.grounded)airJumpUsed=false;
    damageTimer = Math.max(0, damageTimer - dt);
    const previousBottom = p.y + p.h;

    let carryDX=0, carryDY=0;
    for(const mp of movingPlatforms){
      const prevX=mp.x, prevY=mp.y;
      mp.phase += dt;
      const s=(1-Math.cos(mp.phase*mp.speed))/2;
      if(mp.axis==='x') mp.x = mp.x0 + s*mp.range; else mp.y = mp.y0 + s*mp.range;
      mp.dx = mp.x-prevX; mp.dy = mp.y-prevY;
      if(p.riding===mp){ carryDX+=mp.dx; carryDY+=mp.dy; }
    }
    if(carryDX||carryDY){ p.x+=carryDX; p.y+=carryDY; }

    if(dashRequested && dashCooldown<=0 && dashTimer<=0){
      dashTimer=DASH_TIME; dashCooldown=DASH_COOLDOWN; burst(p.x+17,p.y+24,pal.accent,14);
    }
    dashRequested=false;

    if(dashTimer>0){ p.vx = p.facing*DASH_SPEED; }
    else { p.vx = (Number(held('right')) - Number(held('left'))) * SPEED; if (p.vx) p.facing = Math.sign(p.vx); }

    if(jumpBufferTimer>0 && (coyoteTimer>0 || (leapTimer>0 && !airJumpUsed))) {
      const extra=coyoteTimer<=0;
      p.vy=extra?-580:-JUMP;p.grounded=false;coyoteTimer=0;jumpBufferTimer=0;jumpCut=false;
      if(extra){airJumpUsed=true;burst(p.x+17,p.y+48,'#fff2c4');}
      if(!held('jump')) {p.vy*=0.45;jumpCut=true;}
    }
    jumpQueued = false;
    p.x += p.vx * dt;
    p.riding = null;
    for (const s of solids) if (overlaps(p, s)) {
      if (p.vx > 0) p.x = s.x - p.w;
      else if (p.vx < 0) p.x = s.x + s.w;
      p.vx = 0;
    }
    for (const mp of movingPlatforms) if (overlaps(p, mp)) {
      if (p.vx > 0) p.x = mp.x - p.w;
      else if (p.vx < 0) p.x = mp.x + mp.w;
      p.vx = 0;
    }
    p.x = Math.max(0, Math.min(stage.width - p.w, p.x));
    p.vy = Math.min(900, p.vy + GRAVITY * dt);
    p.y += p.vy * dt;
    const landingSpeed=p.vy;
    p.grounded = false;
    for (const s of solids) if (overlaps(p, s)) {
      if (p.vy > 0) { p.y = s.y - p.h; p.grounded = true; }
      else if (p.vy < 0) p.y = s.y + s.h;
      p.vy = 0;
    }
    for (const mp of movingPlatforms) if (overlaps(p, mp)) {
      if (p.vy > 0) { p.y = mp.y - p.h; p.grounded = true; p.riding = mp; }
      else if (p.vy < 0) p.y = mp.y + mp.h;
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
    for(const item of pickups) if(!item.taken && overlaps(p,{x:item.x-16,y:item.y-16,w:32,h:32})) {
      item.taken=true;if(item.type==='shield'){shield=true;toast('Shield ready · absorbs one enemy hit');}else{leapTimer=12;airJumpUsed=false;toast('Starleap · press jump again in the air');}
      burst(item.x,item.y,item.type==='shield'?pal.edge:'#ffcf6b',16);
    }
    for(const shard of shards) if(!shard.collected && overlaps(p,{x:shard.x-13,y:shard.y-13,w:26,h:26})) {
      shard.collected=true;fragmentCount++;burst(shard.x,shard.y,'#b9abff',16);toast('Star fragment found · '+fragmentCount+' / '+totalShards);
    }
    updateGlaive(dt);
    updateHud();

    if(state!=='playing')return;
    if(stage.arena) {
      updateGuardian(dt, p, previousBottom);
      if(state!=='playing') return;
    } else {
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
      if (overlaps(p, {x:stage.flagX,y:310,w:20,h:190})) {if(seals.every(s=>s.active))finishStage();else if(toastTimer<=0)toast('Gate sealed · light all sun seals with your glaive');}
    }
  }

  function updateGlaive(dt){
    if(throwRequested&&!glaive)glaive={x:player.x+17,y:player.y+24,dir:player.facing,age:0,returning:false,hit:new Set()};
    throwRequested=false;
    if(!glaive)return;
    const g=glaive;g.age+=dt;
    if(g.age>0.42)g.returning=true;
    if(g.returning){
      const dx=player.x+17-g.x,dy=player.y+24-g.y,d=Math.hypot(dx,dy);
      if(d<24||g.age>2){glaive=null;return;}
      g.x+=dx/d*640*dt;g.y+=dy/d*640*dt;
    }else g.x+=g.dir*560*dt;
    const box={x:g.x-12,y:g.y-12,w:24,h:24};
    for(const s of seals)if(!s.active&&overlaps(box,{x:s.x-16,y:s.y-20,w:32,h:40})){
      s.active=true;burst(s.x,s.y,'#ffda8d',18);toast(seals.every(s=>s.active)?'All seals lit · the gate is open':'Sun seal lit');
    }
    for(const e of enemies)if(!e.defeated&&overlaps(box,e)){e.defeated=true;burst(e.x+17,e.y,'#ffda8d',12);}
    if(guardian&&guardian.phase==='vulnerable'&&!g.hit.has(guardian)&&overlaps(box,guardian)){
      g.hit.add(guardian);guardian.hits++;guardian.phase='recover';guardian.timer=0.6;
      burst(guardian.x+40,guardian.y+40,'#ffda8d',24);
      if(guardian.hits>=guardian.maxHits)finish('won');
    }
  }

  function updateGuardian(dt, p, previousBottom) {
    const g = guardian; if (!g) return;
    g.timer -= dt;
    if (g.phase === 'idle') {
      g.x = g.baseX + Math.sin(elapsed*1.2)*20;
      if (g.timer <= 0) { g.phase='telegraph'; g.timer=0.9; g.attackDir = p.x < g.x ? -1 : 1; }
    } else if (g.phase === 'telegraph') {
      if (g.timer <= 0) { g.phase='attack'; g.y=444;g.h=56; g.timer=0.55; g.vx=g.attackDir*520; }
    } else if (g.phase === 'attack') {
      g.x += g.vx*dt;
      g.x = Math.max(g.arenaMin, Math.min(g.arenaMax-g.w, g.x));
      if (overlaps(p,g) && damageTimer===0) { hurtByGuardian(); if(state!=='playing') return; }
      if (g.timer <= 0) { g.phase='vulnerable';g.y=390;g.h=110; g.timer=1.6; g.vx=0; }
    } else if (g.phase === 'vulnerable') {
      if (overlaps(p,g) && p.vy>0 && previousBottom <= g.y + 1 && p.y + p.h >= g.y) {
        g.hits++; burst(g.x+g.w/2,g.y,'#ff5a5a',22); p.vy=-420; p.grounded=false;
        g.phase='recover'; g.timer=0.5;
        if (g.hits >= g.maxHits) { finish('won'); return; }
      } else if (g.timer <= 0) { g.phase='recover'; g.timer=0.4; }
    } else if (g.phase === 'recover') {
      if (g.timer <= 0) { g.phase='idle'; g.timer=1.1; g.baseX = g.arenaMin + (g.arenaMax-g.arenaMin)/2 - g.w/2; }
    }
  }
  function hurtByGuardian() {
    loseLife();
    if(state==='playing'){guardian.phase='idle';guardian.y=390;guardian.h=110;guardian.timer=1;guardian.vx=0;}
  }

  function finish(nextState) {
    state = nextState; clearInput(); physicalKeys.clear();
    player.vx = 0; player.vy = 0;
    document.getElementById('end-title').textContent = state === 'won' ? 'The Guardian falls — sun restored!' : 'The dunes claim you';
    document.getElementById('end-detail').textContent = state === 'won' ? 'Campaign complete. Coins: ' + coinCount + '/' + totalCoins + ' · Fragments: ' + fragmentCount + '/' + totalShards : 'The journey is waiting. Take a breath and try again.';
    document.getElementById('restart').textContent = state === 'won' ? 'Play again' : 'Try again';
    document.getElementById('end-screen').hidden = false;
    document.getElementById('restart').focus();
  }
  function finishStage() {
    state = 'stageComplete'; clearInput(); physicalKeys.clear();
    player.vx = 0; player.vy = 0;
    document.getElementById('end-title').textContent = 'Stage clear — ' + stage.name;
    document.getElementById('end-detail').textContent = 'Coins: ' + coinCount + '/' + totalCoins + ' · Fragments: ' + fragmentCount + '/' + totalShards;
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
    document.getElementById('end-screen').hidden = true;
    loadStage(0);
  }
  function onEndButton() {
    if (state === 'stageComplete') nextStage(); else restart();
  }
  function loseLife(fell = false) {
    if (state !== 'playing' || (!fell && damageTimer > 0)) return;
    if(!fell && shield){shield=false;damageTimer=1.2;burst(player.x+17,player.y+24,'#7cf0ff',18);toast('Shield absorbed the hit');updateHud();return;}
    leapTimer=0;airJumpUsed=false;coyoteTimer=0;jumpBufferTimer=0;
    lives--; document.getElementById('lives').textContent = 'Lives: ' + lives;
    clearInput(); physicalKeys.clear();
    if (lives === 0) { finish('gameover'); return; }
    Object.assign(player, spawn, {vx:0,vy:0,grounded:true,facing:1,riding:null});
    dashTimer=0; shield=false;glaive=null;throwRequested=false;
    if(guardian){guardian.phase='idle';guardian.y=390;guardian.h=110;guardian.timer=1.4;guardian.vx=0;guardian.x=guardian.baseX;}
    damageTimer = 1; updateCamera();
  }
  function updateCamera() { camera = Math.max(0, Math.min(stage.width - viewWidth, player.x + player.w / 2 - viewWidth * 0.35)); }
  const keyActions = { ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right', Space: 'jump', KeyW: 'jump', ShiftLeft: 'dash', ShiftRight: 'dash', KeyX: 'dash', KeyC:'throw', KeyK:'throw' };
  const physicalKeys = new Set();
  window.addEventListener('keydown', event => {
    if(event.code==='KeyF'&&!event.repeat){event.preventDefault();toggleFullscreen();return;}
    if(event.code==='Escape'&&expanded){setExpanded(false);return;}
    const action = keyActions[event.code]; if (!action) return;
    if (state !== 'playing') return;
    event.preventDefault();
    if (action === 'jump' && !physicalKeys.has(event.code) && !held('jump')) jumpQueued = true;
    if (action === 'dash' && !physicalKeys.has(event.code)) dashRequested = true;
    if(action==='throw'&&!physicalKeys.has(event.code))throwRequested=true;
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
    keys.clear(); touches.clear(); jumpQueued = false; jumpBufferTimer=0; dashRequested=false; throwRequested=false; releaseJump();
    document.querySelectorAll('[data-action]').forEach(button => button.classList.toggle('pressed',false));
  }
  for (const button of document.querySelectorAll('[data-action]')) {
    button.addEventListener('pointerdown', event => {
      event.preventDefault(); if (state !== 'playing') return;
      const action = button.dataset.action;
      if (action === 'jump' && !held('jump')) jumpQueued = true;
      if (action === 'dash') dashRequested = true;
      if(action==='throw')throwRequested=true;
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
  function label(text, x, y, size, color) { ctx.fillStyle = color; ctx.font = '600 ' + size + 'px monospace'; ctx.fillText(text, x, y); }
  function drawWarden() {
    const p = player;
    if(shield){ctx.strokeStyle='#7cf0ff';ctx.lineWidth=2;ctx.beginPath();ctx.arc(p.x+17,p.y+24,34,0,Math.PI*2);ctx.stroke();}
    ctx.save();ctx.translate(p.x+p.w/2,p.y+20);ctx.scale(1,1);
    ART.drawWarden(ctx,0,0,p.facing,glaive?'throw':!p.grounded?'jump':p.vx?'run':'idle',elapsed);ctx.restore();
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
    ART.drawBackdrop(ctx,view,camera,pal,elapsed);
    ctx.save();ctx.translate(-camera,0);
    for(const solid of solids){
      if(solid.x+solid.w<camera-60||solid.x>camera+viewWidth+60)continue;
      if(solid.h===100)ART.drawTerrainGround(ctx,solid,elapsed,pal);
      else ART.drawTerrainPlatform(ctx,solid,elapsed,pal);
    }
    for(const mp of movingPlatforms) ART.drawMovingPlatform(ctx,mp,elapsed,pal);
    for(let i=0;i<checkpointStarts.length;i++){
      const x=checkpointStarts[i],col=i<=checkpoint?pal.edge:'#59627c';rect(x,410,24,90,'#26334e');rect(x+4,416,16,62,col);circle(x+12,407,9,col);label('BEACON',x-14,392,10,col);
    }
    for(const item of pickups)if(!item.taken){const y=item.y+Math.sin(elapsed*3+item.x)*4;circle(item.x,y,22,'#26304d');if(item.type==='shield'){ctx.strokeStyle=pal.edge;ctx.lineWidth=3;ctx.beginPath();for(let i=0;i<7;i++){const a=i*Math.PI/3;ctx.lineTo(item.x+Math.cos(a)*14,y+Math.sin(a)*14);}ctx.stroke();}else star(item.x,y,16,'#ffcf6b');label(item.type==='shield'?'SHIELD':'DOUBLE JUMP',item.x-34,y-31,10,'#f2ecff');}
    for(const s of seals){
      rect(s.x-18,s.y-22,36,44,pal.deep);rect(s.x-14,s.y-18,28,36,pal.ground);
      sprite(['..g..','.ggg.','ggogg','.ggg.','..g..'],s.x-10,s.y-10,{g:s.active?'#ffdf8a':'#756779',o:s.active?'#fff0bc':'#322c44'},4);
      label(s.active?'LIT':'THROW',s.x-18,s.y-30,10,s.active?'#ffdf8a':'#ffe8b4');
    }
    if(glaive){ctx.save();ctx.translate(glaive.x,glaive.y);ctx.rotate(Math.floor(elapsed*18)*Math.PI/2);sprite(['..ggg','..g..','ggogg','..g..','ggg..'],-10,-10,{g:'#ffe5a5',o:'#865343'},4);ctx.restore();}
    for(const coin of coins)if(!coin.collected)ART.drawCollectibleCoin(ctx,coin.x,coin.y,elapsed);
    for(const shard of shards)if(!shard.collected)ART.drawCollectibleShard(ctx,shard.x,shard.y,elapsed);
    for(const e of enemies)if(!e.defeated){ if(e.type==='drone') ART.drawDrone(ctx,e.x+17,e.y+14,elapsed,Math.abs(player.x-e.x)<220); else ART.drawBeetle(ctx,e.x+17,e.y+14,e.dir,elapsed); }
    if(stage.arena && guardian){ ART.drawGuardian(ctx,guardian,elapsed,guardian.phase); label('SUN COLOSSUS '+(guardian.maxHits-guardian.hits)+' / '+guardian.maxHits,guardian.x-25,guardian.y-45,14,'#fff2c4'); label(guardian.phase==='vulnerable'?'THROW / STOMP':guardian.phase==='telegraph'?'CHARGE INCOMING':guardian.phase.toUpperCase(),guardian.x-35,guardian.y-23,11,'#7cf0ff'); }
    if(!stage.arena){
      rect(stage.flagX-32,482,86,18,'#687087');rect(stage.flagX-20,462,62,20,'#343955');rect(stage.flagX+2,324,14,138,pal.accent+'22');circle(stage.flagX+9,344,31,pal.accent+'22');star(stage.flagX+9,344,22,pal.accent);label(seals.every(s=>s.active)?'GATE OPEN':'LIGHT THE SEALS',stage.flagX-90,290,13,'#fff2c4');
    }
    ctx.globalAlpha = dashTimer>0 ? 0.7 : (damageTimer>0?0.55+Math.sin(damageTimer*30)*0.2:1);drawWarden();ctx.globalAlpha=1;
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
<title>Duneshade Warden — bring the light home</title>
<style>
*{box-sizing:border-box}html,body{margin:0;width:100%;height:100%;overflow:hidden;background:#f6efd9;color:#244941;font-family:system-ui,sans-serif}body{display:flex;align-items:center;justify-content:center}main{position:relative;width:100%;height:100%;max-width:1600px;max-height:1000px}canvas{display:block;width:100%;height:100%}.hud{position:absolute;left:24px;right:24px;top:max(20px,env(safe-area-inset-top));display:flex;justify-content:space-between;gap:12px;pointer-events:none}.brand{font-size:13px;font-weight:800;letter-spacing:3px}.stats{display:flex;gap:22px;font-size:16px;font-weight:750}.help{position:absolute;bottom:22px;left:24px;font-size:13px;color:#fff4dc}
.overlay{position:absolute;inset:0;display:grid;place-items:center;background:#09182c77;backdrop-filter:blur(5px);z-index:3}.overlay[hidden]{display:none}.card{width:min(88%,380px);background:#fff9e8;border:1px solid #e8d8b7;border-radius:24px;padding:36px;text-align:center;box-shadow:0 20px 70px #09182c30}.card h1{font-size:40px;letter-spacing:-2px;margin:8px 0 12px}.card p{line-height:1.6}.card button{background:#247e71;color:white;border:0;border-radius:12px;padding:16px 32px;font:750 16px system-ui;cursor:pointer}.card button:focus-visible{outline:3px solid #d28c36;outline-offset:4px}
.touch-controls{display:none;position:absolute;bottom:max(20px,env(safe-area-inset-bottom));left:max(20px,env(safe-area-inset-left));right:max(20px,env(safe-area-inset-right));justify-content:space-between;pointer-events:none;user-select:none;-webkit-user-select:none}.directions,.actions{display:flex;gap:12px}.touch-controls button{width:72px;height:72px;border:2px solid #f6efd9aa;border-radius:20px;background:#244941e8;color:#fff5d8;font:750 28px system-ui;pointer-events:auto;touch-action:none;-webkit-touch-callout:none}.touch-controls .jump{width:88px;font-size:15px;background:#247e71}.touch-controls .dash{width:72px;font-size:13px;background:#7a3f22}.touch-controls button.pressed{background:#cf8850;transform:translateY(2px)}html,body,canvas{overscroll-behavior:none}canvas{touch-action:none;outline:none}@media(pointer:coarse),(max-width:760px){.touch-controls{display:flex}.help{display:none}.brand{font-size:11px;letter-spacing:2px}.stats{font-size:15px;gap:14px}.hud{left:18px;right:18px}}@media(max-height:450px){.touch-controls{bottom:12px}.touch-controls button{height:58px;width:64px;border-radius:16px}.hud{top:12px}}

html,body{background:#0d1130;color:#f2ecff}.hud{padding:14px 18px;background:#111a35dc;border:1px solid #637da333;border-radius:14px;align-items:center}.brand{font-size:12px;letter-spacing:2px}.stats{font-size:14px;gap:18px}#coins{color:#ffcf6b}#lives{color:#7cf0ff}.journey{position:absolute;top:max(90px,calc(env(safe-area-inset-top) + 76px));left:42px;font-size:10px;letter-spacing:1.5px;color:#b7c3dd;pointer-events:none}.track{margin:10px 0;width:220px;height:3px;background:#38405c}#progress{height:3px;background:#7cf0ff}.powers{display:flex;gap:16px;letter-spacing:0;font-size:12px}.chip{color:#8791ac}.chip.active{color:#7cf0ff}#shards{color:#c7bcff}#toast{position:absolute;top:180px;left:50%;transform:translateX(-50%);width:max-content;max-width:90%;padding:10px 16px;background:#192a42ed;border:1px solid #7cf0ff55;border-radius:10px;text-align:center;font-size:13px;pointer-events:none}.help{color:#a6b7ce}.card{background:#151b36;border-color:#7cf0ff55;box-shadow:0 20px 70px #0008}.card h1{font-size:36px;letter-spacing:-1px}.card p{color:#b7c3dd}.card button{background:#7cf0ff;color:#0d1130}.overlay{background:#080f26bb}.touch-controls button{background:#192a42ed;border-color:#7cf0ff66;color:#dffbff}.touch-controls .jump{background:#32647a}.touch-controls .dash{background:#7a4a32}.touch-controls button.pressed{background:#458b94}@media(max-width:760px){.hud{padding:12px;left:12px;right:12px;gap:8px}.brand{font-size:9px;letter-spacing:1px;max-width:105px}.stats{font-size:12px;gap:12px}.journey{left:25px;top:90px}.powers{gap:12px;font-size:11px}#toast{top:162px;font-size:12px}}@media(max-height:450px){.journey{top:75px}.powers{font-size:10px}.track{margin:6px 0}#toast{top:115px}.hud{top:10px}.card{padding:20px}}
@media(max-width:420px){.touch-controls{left:12px;right:12px}.directions,.actions{gap:8px}.touch-controls button{width:58px;height:62px}.touch-controls .dash{width:58px}.touch-controls .jump{width:70px}}
/* Pixel-art presentation: nearest-neighbor scene, crisp interface borders. */
canvas{image-rendering:pixelated;image-rendering:crisp-edges}
html,body,button,.card button{font-family:ui-monospace,SFMono-Regular,Consolas,monospace}
.hud,.card,.card button,.touch-controls button,#toast{border-radius:0;box-shadow:4px 4px 0 #060b1c;border-width:2px}
.overlay{backdrop-filter:none}.brand{letter-spacing:2px}.track,#progress{height:4px}
#fullscreen{position:absolute;right:24px;top:max(88px,calc(env(safe-area-inset-top) + 74px));z-index:5;background:#17233e;color:#dffbff;border:2px solid #7cf0ff88;padding:10px 12px;font:700 11px ui-monospace,monospace;cursor:pointer;touch-action:manipulation;box-shadow:3px 3px #060b1c}
#fullscreen:focus-visible{outline:3px solid #ffcf6b;outline-offset:3px}main:fullscreen,main.expanded{width:100vw;height:100dvh;max-width:none;max-height:none;background:#0d1130}main.expanded{position:fixed;inset:0;z-index:10}@media(max-width:760px){#fullscreen{right:12px;font-size:0;width:36px;height:34px;padding:0}#fullscreen::after{content:"⛶";font-size:22px}#fullscreen[aria-pressed="true"]::after{content:"×"}}@media(max-height:450px){#fullscreen{top:74px}}
/* Warm parchment interface, sized for five simultaneous touch controls. */
html,body{background:#302235;color:#fff0cf}.hud,#toast,.card{background:#352b3eea;border-color:#b48967}.journey,.help,.card p{color:#f1d4af}#lives,#seals{color:#ffdb91}#progress{background:#ffdb91}.touch-controls button,#fullscreen{background:#493749;border-color:#c39877;color:#fff0cf}.touch-controls .jump{background:#745767}.touch-controls .throw{font-size:11px;width:64px;background:#966343}.powers{flex-wrap:wrap;max-width:380px;gap:8px}.card button{background:#f2c486;color:#302235}@media(max-width:420px){.directions,.actions{gap:5px}.touch-controls{left:8px;right:8px}.touch-controls button,.touch-controls .dash,.touch-controls .throw{width:48px}.touch-controls .jump{width:55px}.powers{max-width:270px;font-size:10px}.brand{max-width:110px}}
</style></head><body><main id="game-shell" aria-label="Duneshade Warden game">
<button id="fullscreen" type="button" aria-label="Toggle fullscreen" aria-pressed="false">FULLSCREEN</button>
<canvas id="game" tabindex="-1" aria-label="A desert adventure. Move with A and D or arrow keys; jump with Space or W; dash with Shift or X; throw glaive with C or K to light three seals in each stage."></canvas>
<header class="hud"><span class="brand">DUNESHADE WARDEN</span><div class="stats"><span id="coins">Coins: 0</span><span id="lives">Lives: 3</span></div></header>
<div class="journey"><span id="route"></span><div class="track"><div id="progress"></div></div><div class="powers"><span id="seals"></span><span id="shards">✦ 0/0</span><span class="chip" id="shield"></span><span class="chip" id="leap"></span></div></div><div id="toast" role="status"></div>
<div class="help">← → / A D &nbsp; Move &nbsp; · &nbsp; Space / W &nbsp; Hold for a high jump &nbsp; · &nbsp; Shift / X &nbsp; Dash &nbsp; · &nbsp; C / K &nbsp; Throw glaive · light seals · defeat the Colossus</div>
<div class="touch-controls" aria-label="Touch controls"><div class="directions"><button type="button" data-action="left" aria-label="Move left">←</button><button type="button" data-action="right" aria-label="Move right">→</button></div><div class="actions"><button type="button" class="throw" data-action="throw" aria-label="Throw returning glaive">THROW</button><button type="button" class="dash" data-action="dash" aria-label="Dash">DASH</button><button type="button" class="jump" data-action="jump" aria-label="Jump">JUMP</button></div></div>
<section id="end-screen" class="overlay" role="dialog" aria-modal="true" aria-labelledby="end-title" aria-describedby="end-detail" hidden><div class="card"><h1 id="end-title"></h1><p id="end-detail"></p><button id="restart" type="button">Play again</button></div></section>
</main><script>(${gameClient.toString()})();</script></body></html>`;
app.get('/', (req, res) => res.type('html').send(page));
if (require.main === module) {
  const port = process.env.PORT || 3000;
  app.listen(port, '0.0.0.0', () => console.log('Duneshade Warden listening on ' + port));
}
module.exports = { app, page, gameClient };
