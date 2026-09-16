const {test}=require('node:test');
const assert=require('node:assert/strict');
const harness=require('./harness.cjs');
const tick=(g,n=1)=>{for(let i=0;i<n;i++)g.api.update(1/120)};
test('all four extended stages have reachable seals and optional elevated routes',()=>{
 for(let i=0;i<4;i++){
  const g=harness();g.api.loadStage(i);assert.ok(g.api.stage.width>=3500);assert.equal(g.api.seals.length,3);
  for(const seal of g.api.seals){
   const ledge=g.api.solids.find(s=>s.y===seal.y+38&&s.x<=seal.x&&s.x+s.w>=seal.x);
   assert.ok(ledge,'seal must sit above reachable ledge');
   const steps=g.api.solids.filter(s=>s.h===22&&s.x<=ledge.x&&s.x>ledge.x-250&&s.y>=ledge.y).sort((a,b)=>b.y-a.y);
   let y=500;for(const s of steps){assert.ok(y-s.y<=128,'steps within normal jump height');y=s.y;}
   Object.assign(g.api.player,{x:seal.x-75,y:ledge.y-48,vy:0,facing:1,grounded:true});g.api.throwGlaive();tick(g,20);assert.equal(seal.active,true);tick(g,250);assert.equal(g.api.glaive,null);
  }
  assert.equal(g.api.state,'playing');Object.assign(g.api.player,{x:g.api.stage.flagX,y:452,vy:0});tick(g);assert.equal(g.api.state,'stageComplete');
 }
});
test('gate rejects missing seals; respawn preserves lit seals and clears projectile; restart resets seals',()=>{
 const g=harness();g.api.player.x=g.api.stage.flagX;tick(g);assert.equal(g.api.state,'playing');g.api.seals[0].active=true;
 g.api.throwGlaive();tick(g);assert.ok(g.api.glaive);g.api.loseLife(true);assert.equal(g.api.glaive,null);assert.equal(g.api.seals[0].active,true);
 g.api.restart();assert.ok(g.api.seals.every(s=>!s.active));g.api.loadStage(1);assert.ok(g.api.seals.every(s=>!s.active));
});
test('glaive defeats enemies and returns even when player moves away',()=>{
 const g=harness();const e=g.api.enemies[0];Object.assign(g.api.player,{x:e.x-130,y:452,facing:1});g.api.throwGlaive();tick(g,30);assert.equal(e.defeated,true);
 g.api.keys.add('left');tick(g,240);assert.equal(g.api.glaive,null);
});
test('glaive damages colossus only while vulnerable and once per throw',()=>{
 const g=harness();g.api.loadStage(4);const b=g.api.guardian;
 Object.assign(g.api.player,{x:b.x-100,y:452,facing:1});g.api.throwGlaive();tick(g,25);assert.equal(b.hits,0);tick(g,240);
 b.phase='vulnerable';b.timer=2;Object.assign(g.api.player,{x:b.x-100,y:452,facing:1});g.api.throwGlaive();tick(g,25);assert.equal(b.hits,1);tick(g,60);assert.equal(b.hits,1);
});
test('C and K throw keys fire once per press and blur clears pending throws',()=>{
 const g=harness();g.events.keydown({code:'KeyC',preventDefault(){}});tick(g);assert.ok(g.api.glaive);tick(g,250);assert.equal(g.api.glaive,null);
 g.events.keyup({code:'KeyC',preventDefault(){}});g.events.keydown({code:'KeyK',preventDefault(){}});g.events.blur();tick(g);assert.equal(g.api.glaive,null);
});
