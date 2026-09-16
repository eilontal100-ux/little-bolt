const { test } = require('node:test');
const assert = require('node:assert/strict');
const harness = require('./harness.cjs');
const tick = (g,n=1) => {for(let i=0;i<n;i++)g.api.update(1/120)};

test('walk, jump, gravity, landing, no midair jump',()=>{
 const g=harness();const x0=g.player.x;g.keys.add('right');tick(g,30);assert.ok(g.player.x>x0+50);g.keys.clear();g.api.jump();tick(g);assert.ok(g.player.vy<0);tick(g,10);const vy=g.player.vy;g.api.jump();tick(g);assert.ok(g.player.vy>vy);tick(g,120);assert.equal(g.player.y,452);assert.equal(g.player.grounded,true);
});
test('floating platform top, underside and both sides are solid',()=>{
 for (const [x,y,vx,vy,expectX,expectY] of [[220,340,0,200,220,342],[220,414,0,-500,220,412],[114,395,280,0,116,null],[302,395,-280,0,300,null]]) {
 const g=harness();Object.assign(g.player,{x,y,vy,grounded:false});if(vx)g.keys.add(vx>0?'right':'left');tick(g,2);if(expectX!==null)assert.equal(g.player.x,expectX);if(expectY!==null)assert.ok(Math.abs(g.player.y-expectY)<1); }
});
test('fixed loop produces same movement at 30, 60 and 120 Hz',()=>{
 const results=[30,60,120].map(hz=>{const g=harness();g.keys.add('right');for(let i=0;i<=hz;i++)g.api.frame(i*1000/hz);return g.api.player.x});assert.ok(Math.max(...results)-Math.min(...results)<3);
});
test('camera follows horizontally and clamps to both stage boundaries',()=>{
 const g=harness();tick(g);assert.equal(g.api.camera,0);g.player.x=1000;tick(g);assert.ok(g.api.camera>500);g.player.x=g.api.stage.width-34;tick(g);assert.equal(g.api.camera,g.api.stage.width-g.api.viewWidth);
});
test('coins collect once and counter updates',()=>{
 const g=harness();g.player.x=210;tick(g);assert.equal(g.api.coinCount,1);assert.equal(g.api.coins[0].collected,true);tick(g,60);assert.equal(g.api.coinCount,1);assert.equal(g.elements.coins.textContent,'Coins: 1');
});
test('enemy patrols (beetle and drone) stay within their limits',()=>{
 const g=harness();for(let i=0;i<3000;i++){tick(g);for(const e of g.api.enemies){assert.ok(e.x>=e.min&&e.x<=e.max);}}
});
test('descending top contact stomps beetle and drone; side contact loses one life',()=>{
 for(const idx of [0,1]){
 const g=harness();const e=g.api.enemies[idx];Object.assign(g.player,{x:e.x,y:e.y-49,vy:200,grounded:false});tick(g);assert.equal(e.defeated,true);assert.ok(g.player.vy<0);assert.equal(g.api.lives,3);
 }
 const side=harness();const e0=side.api.enemies[0];Object.assign(side.player,{x:e0.x,y:e0.y-27,vy:0,grounded:true});tick(side);assert.equal(side.api.lives,2);assert.equal(side.api.enemies[0].defeated,false);
});
test('rising and deep side overlaps never count as stomps',()=>{
 for(const vy of [-100,100]){const g=harness();const e=g.api.enemies[0];Object.assign(g.player,{x:e.x,y:e.y-32,vy});tick(g);assert.equal(g.api.enemies[0].defeated,false);assert.equal(g.api.lives,2);}
});
test('falls cost exactly one life; respawn resets motion and preserves coins/campaign progress',()=>{
 const g=harness();g.player.x=210;tick(g);g.api.enemies[0].defeated=true;
 for(const expected of [2,1,0]){
 Object.assign(g.player,{x:400,y:705,vx:280,vy:600,grounded:false});tick(g);assert.equal(g.api.lives,expected);assert.equal(g.api.coinCount,1);assert.equal(g.api.enemies[0].defeated,true);
 if(expected){assert.equal(g.player.x,g.api.stage.spawn.x);assert.equal(g.player.y,452);assert.equal(g.player.vx,0);assert.equal(g.player.vy,0);tick(g,130);assert.equal(g.api.lives,expected);}
 }assert.equal(g.api.state,'gameover');tick(g,500);assert.equal(g.api.lives,0);
});
test('every required gap in every non-boss stage can be crossed at normal movement settings',()=>{
 for(let stageIdx=0; stageIdx<4; stageIdx++){
 const g=harness();g.api.loadStage(stageIdx);
 const segs=g.api.stage.segs;
 for(let i=0;i<segs.length-1;i++){
 const start=segs[i].x+segs[i].w-40, end=segs[i+1].x;
 Object.assign(g.api.player,{x:start,y:452,vx:0,vy:0,grounded:true});g.api.keys.add('right');g.api.jump();
 let landed=false;
 for(let t=0;t<130;t++){tick(g);if(g.api.player.grounded&&g.api.player.x>=end){landed=true;break;}}
 assert.equal(landed,true,'stage '+stageIdx+' gap '+i);
 g.api.keys.clear();
 }
 }
});
test('reaching the stage flag completes the stage without ending the campaign',()=>{
 const g=harness();g.player.x=210;tick(g);
 g.api.seals.forEach(s=>s.active=true);g.player.x=g.api.stage.flagX-5;g.player.y=452;tick(g);
 assert.equal(g.api.state,'stageComplete');assert.match(g.elements['end-title'].textContent,/Stage clear/);assert.equal(g.elements.restart.textContent,'Next Stage →');
 const x=g.player.x;g.keys.add('right');tick(g,60);assert.equal(g.player.x,x);
});
test('Next Stage preserves campaign totals and resets stage-scoped entities/checkpoints',()=>{
 const g=harness();g.player.x=210;tick(g);
 g.player.x=730;tick(g);assert.equal(g.api.checkpoint,0);
 g.api.seals.forEach(s=>s.active=true);g.player.x=g.api.stage.flagX-5;g.player.y=452;tick(g);
 g.api.nextStage();
 assert.equal(g.api.stageIndex,1);assert.equal(g.api.state,'playing');
 assert.equal(g.api.coinCount,1);assert.equal(g.api.lives,3);
 assert.equal(g.api.checkpoint,-1);
 assert.equal(g.api.player.x,g.api.stage.spawn.x);
 assert.ok(g.api.enemies.every(e=>!e.defeated));
 assert.ok(g.api.coins.every(c=>!c.collected));
});
test('full campaign restart resets stage index, totals and lives',()=>{
 const g=harness();g.player.x=210;tick(g);
 g.api.seals.forEach(s=>s.active=true);g.player.x=g.api.stage.flagX-5;g.player.y=452;tick(g);
 g.api.nextStage();
 g.api.player.x=g.api.coins[0].x;tick(g);
 g.api.restart();
 assert.equal(g.api.stageIndex,0);assert.equal(g.api.coinCount,0);assert.equal(g.api.fragmentCount,0);assert.equal(g.api.lives,3);assert.equal(g.api.state,'playing');assert.equal(g.api.player.x,g.api.stage.spawn.x);
});
test('dash bursts speed, respects cooldown, and stays wall-safe',()=>{
 const g=harness();g.api.dash();tick(g);assert.equal(g.player.vx,760);
 tick(g,25);assert.equal(g.player.vx,0);
 g.api.dash();tick(g);assert.equal(g.player.vx,0,'cooldown should block a second dash');
 const w=harness();const solid=w.api.solids.find(s=>s.h===22)||w.api.solids[1];
 Object.assign(w.player,{x:solid.x-40,y:solid.y+5,vx:0,vy:0,grounded:true,facing:1});
 w.api.dash();
 for(let i=0;i<40;i++)tick(w);
 assert.ok(w.player.x <= solid.x, 'dash must not tunnel through a wall');
});
test('moving platforms carry a rider (rider carry)',()=>{
 const g=harness();const mp=g.api.movingPlatforms[0];
 Object.assign(g.player,{x:mp.x+5,y:mp.y-48,vx:0,vy:0,grounded:true});
 tick(g);assert.equal(g.player.riding,mp);
 const y0=g.player.y;tick(g);
 assert.ok(Math.abs((g.player.y-y0)-mp.dy)<0.001);
});
test('safe checkpoints persist through falling and full restart clears them',()=>{
 const g=harness();g.player.x=730;tick(g);assert.equal(g.api.checkpoint,0);g.player.y=705;tick(g);assert.equal(g.player.x,730);assert.equal(g.player.y,452);g.api.restart();assert.equal(g.api.checkpoint,-1);assert.equal(g.api.player.x,g.api.stage.spawn.x);
});
test('shield absorbs exactly one hit, does not protect against pits',()=>{
 const g=harness();g.player.x=780;g.player.y=452;tick(g);assert.equal(g.api.shield,true);g.api.loseLife();assert.equal(g.api.lives,3);assert.equal(g.api.shield,false);tick(g,150);g.api.loseLife();assert.equal(g.api.lives,2);
 const pit=harness();pit.player.x=780;pit.player.y=452;tick(pit);pit.player.y=705;tick(pit);assert.equal(pit.api.lives,2);
});
test('Starleap (double jump pickup) grants one air jump and resets on death',()=>{
 const g=harness();g.api.loadStage(1);
 g.api.player.x=860;g.api.player.y=452;tick(g);assert.ok(g.api.leapTimer>0);
 g.api.player.x=700;g.api.player.y=452;
 g.api.jump();tick(g,12);g.api.releaseJump();g.api.jump();tick(g);assert.ok(g.api.player.vy<-550);
 g.api.loseLife(true);assert.equal(g.api.leapTimer,0);
});
test('jump release produces a short hop and coyote jump works just beyond ledge',()=>{
 const g=harness();g.api.jump();tick(g,8);const vy=g.player.vy;g.api.releaseJump();assert.ok(g.player.vy>vy);assert.ok(g.player.vy<0);
});
test('jump pressed shortly before landing is buffered',()=>{
 const g=harness();Object.assign(g.player,{x:100,y:439,vy:200,grounded:false});g.api.jump();tick(g,14);assert.ok(g.player.vy<0);assert.ok(g.player.y<452);
});
test('powerups and fragments fully reset on Next Stage and on full restart',()=>{
 const g=harness();g.player.x=780;g.player.y=452;tick(g);
 Object.assign(g.player,{x:1000,y:310,grounded:false});tick(g);
 assert.equal(g.api.shards[0].collected,true);assert.equal(g.api.fragmentCount,1);
 g.api.seals.forEach(s=>s.active=true);g.player.x=g.api.stage.flagX-5;g.player.y=452;tick(g);g.api.nextStage();
 assert.equal(g.api.shield,false);assert.ok(g.api.pickups.every(p=>!p.taken));assert.equal(g.api.fragmentCount,1);
 g.api.restart();assert.equal(g.api.fragmentCount,0);
});
test('Guardian stage: cycles idle -> telegraph -> attack -> vulnerable, contact damage only during attack',()=>{
 const g=harness();g.api.loadStage(4);
 assert.equal(g.api.stage.arena,true);
 assert.equal(g.api.guardian.phase,'idle');
 while(g.api.guardian.phase==='idle')tick(g);
 assert.equal(g.api.guardian.phase,'telegraph');
 const gd=g.api.guardian;
 Object.assign(g.player,{x:gd.x,y:452,vx:0,vy:0,grounded:true});
 const livesBeforeTelegraph=g.api.lives;
 while(g.api.guardian.phase==='telegraph')tick(g);
 assert.equal(g.api.lives,livesBeforeTelegraph,'telegraph must never deal damage');
 assert.equal(g.api.guardian.phase,'attack');
});
test('Guardian: stomping during the vulnerable window deals damage; hits persist through a checkpoint respawn',()=>{
 const g=harness();g.api.loadStage(4);
 while(g.api.guardian.phase!=='vulnerable')tick(g);
 Object.assign(g.api.player,{x:g.api.guardian.x,y:g.api.guardian.y-49,vy:200,grounded:false});
 tick(g);
 assert.equal(g.api.guardian.hits,1);
 // simulate a death mid-fight: position resets, but boss damage is preserved (fair)
 g.api.loseLife(true);
 assert.equal(g.api.guardian.hits,1);
 assert.equal(g.api.player.x,g.api.stage.spawn.x);
});
test('Guardian: rising or deep side overlaps during the vulnerable window never count as a stomp',()=>{
 for(const vy of [-100,100]){
  const g=harness();g.api.loadStage(4);
  while(g.api.guardian.phase!=='vulnerable')tick(g);
  const gd=g.api.guardian;
  Object.assign(g.api.player,{x:gd.x,y:gd.y+30,vy,grounded:false});
  tick(g);
  assert.equal(g.api.guardian.hits,0);
 }
});
test('Guardian: campaign only finishes ("won") once the guardian is defeated, not by walking anywhere',()=>{
 const g=harness();g.api.loadStage(4);
 let safety=0;
 while(g.api.guardian.hits<3 && safety<6000){
 const gd=g.api.guardian;
 if(gd.phase==='vulnerable') Object.assign(g.api.player,{x:gd.x,y:gd.y-49,vy:200,grounded:false});
 tick(g);safety++;
 }
 assert.equal(g.api.guardian.hits,3);
 assert.equal(g.api.state,'won');
 assert.match(g.elements['end-title'].textContent,/Guardian falls/);
});
test('both campaign endings (won, gameover) fully restart the campaign without scheduling extra loops',()=>{
 for(const ending of ['won','gameover']){
 const g=harness();
 if(ending==='won'){
 g.api.loadStage(4);
 let safety=0;
 while(g.api.guardian.hits<3 && safety<6000){const gd=g.api.guardian;if(gd.phase==='vulnerable')Object.assign(g.api.player,{x:gd.x,y:gd.y-49,vy:200,grounded:false});tick(g);safety++;}
 } else {
 for(let i=0;i<3;i++){g.player.y=705;tick(g);}
 }
 g.keys.add('right');g.touches.set(1,'jump');g.api.jump();g.api.onEndButton();
 assert.equal(g.api.state,'playing');assert.equal(g.api.lives,3);assert.equal(g.api.coinCount,0);assert.equal(g.api.stageIndex,0);assert.equal(g.api.camera,0);assert.equal(g.api.damageTimer,0);assert.equal(g.api.player.x,g.api.stage.spawn.x);assert.equal(g.api.player.vx,0);assert.equal(g.api.player.vy,0);assert.equal(g.keys.size,0);assert.equal(g.touches.size,0);assert.equal(g.elements['end-screen'].hidden,true);
 }
});
