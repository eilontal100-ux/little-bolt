const {test}=require('node:test');
const assert=require('node:assert/strict');
const harness=require('./harness.cjs');
const tick=(g,n=1)=>{for(let i=0;i<n;i++)g.api.update(1/120)};

test('gravity pulls the player down and stops at the ground',()=>{
 const g=harness();Object.assign(g.api.player,{x:100,y:200,vy:0,grounded:false});tick(g,5);
 assert.ok(g.api.player.vy>0);
 tick(g,200);
 assert.equal(g.api.player.grounded,true);assert.ok(Math.abs(g.api.player.y-452)<1);
});

test('platforms block from both sides and the top',()=>{
 const g=harness();const platform=g.api.solids.find(s=>s.kind==='platform'&&s.y===390);
 assert.ok(platform,'stage 1 has an authored platform at y=390');
 Object.assign(g.api.player,{x:platform.x-40,y:platform.y-48,vy:0,vx:280,grounded:false});
 tick(g,40);assert.ok(g.api.player.x<=platform.x);
});

test('fixed-timestep update is deterministic for identical input',()=>{
 const a=harness();const b=harness();
 for(const g of [a,b])Object.assign(g.api.player,{x:40,y:452,vx:0,vy:0});
 a.keys.add('right');b.keys.add('right');
 tick(a,90);tick(b,90);
 assert.equal(a.api.player.x,b.api.player.x);assert.equal(a.api.player.y,b.api.player.y);
});

test('camera clamps within stage bounds',()=>{
 const g=harness();g.api.player.x=0;g.api.update(1/120);assert.equal(g.api.camera,0);
 g.api.player.x=g.api.stage.width-40;tick(g,10);
 assert.ok(g.api.camera<=g.api.stage.width-g.api.viewWidth+0.01);
});

test('coins are collected once and counted',()=>{
 const g=harness();const coin=g.api.coins[0];
 Object.assign(g.api.player,{x:coin.x-17,y:coin.y-24,vy:0});tick(g,3);
 assert.equal(coin.collected,true);assert.equal(g.api.coinCount,1);
 tick(g,3);assert.equal(g.api.coinCount,1);
});

test('falling into a pit costs a life and respawns at the last checkpoint, keeping coins',()=>{
 const g=harness();const coin=g.api.coins[1];
 Object.assign(g.api.player,{x:coin.x-17,y:coin.y-24,vy:0});tick(g,3);assert.equal(g.api.coinCount,1);
 Object.assign(g.api.player,{x:400,y:900,vy:0});tick(g);
 assert.equal(g.api.lives,2);assert.equal(g.api.coinCount,1);
 assert.ok(Math.abs(g.api.player.x-g.api.stage.spawn.x)<1);
});

test('jump release cuts height short of a full hold',()=>{
 const full=harness();full.api.jump();tick(full,60);
 const short=harness();short.api.jump();tick(short,3);short.api.releaseJump();tick(short,57);
 assert.ok(short.api.player.y>full.api.player.y,'released jump should not rise as high');
});

test('stage 1: crag starts unlocked and can smash the rock barrier, but glint/sprig cannot',()=>{
 const g=harness();
 assert.deepEqual([...g.api.unlockedCreatures],['crag']);
 const rock=g.api.obstacles.find(o=>o.type==='rock');
 Object.assign(g.api.player,{x:rock.x-20,y:452,vy:0,grounded:true});
 g.api.triggerAbility();tick(g,2);
 assert.equal(rock.solved,true,'crag must be able to smash a rock barrier');
 assert.ok(!g.api.solids.find(s=>s.obstacleRef===rock));
});

test('rock barrier physically blocks the wrong creature and cannot be jumped over',()=>{
 const g=harness();const rock=g.api.obstacles.find(o=>o.type==='rock');
 Object.assign(g.api.player,{x:rock.x-60,y:452,vx:280,vy:0,grounded:true});
 g.api.jump();tick(g,120);
 assert.ok(g.api.player.x<rock.x,'a plain jump must not clear a 200px rock wall');
 assert.equal(rock.solved,false);
});

test('glint must be rescued before wind-glide is available, and only glint gets lift in a wind zone',()=>{
 const g=harness();
 const glintSpot=g.api.creatures.find(c=>c.id==='glint');
 assert.equal(g.api.unlockedCreatures.has('glint'),false);
 Object.assign(g.api.player,{x:glintSpot.x-18,y:glintSpot.y-24,vy:0,grounded:true});tick(g,2);
 assert.equal(g.api.unlockedCreatures.has('glint'),true);assert.equal(g.api.current,'glint');
 const wind=g.api.obstacles.find(o=>o.type==='wind');
 Object.assign(g.api.player,{x:wind.x+20,y:450,vy:100,grounded:false});
 g.keys.add('ability');tick(g,10);
 assert.equal(g.api.gliding,true);assert.ok(g.api.player.vy<0,'holding ability inside a wind zone must grant lift');
 g.api.selectCreature('crag');g.keys.add('ability');Object.assign(g.api.player,{vy:100});tick(g,1);
 assert.equal(g.api.gliding,false,'only glint gets lift, even while holding the ability');
});

test('releasing the glide ability restores normal gravity immediately',()=>{
 const g=harness();const glintSpot=g.api.creatures.find(c=>c.id==='glint');
 Object.assign(g.api.player,{x:glintSpot.x-18,y:glintSpot.y-24,vy:0,grounded:true});tick(g,2);
 const wind=g.api.obstacles.find(o=>o.type==='wind');
 Object.assign(g.api.player,{x:wind.x+20,y:450,vy:0,grounded:false});
 g.keys.add('ability');tick(g,5);assert.equal(g.api.gliding,true);
 const liftedVy=g.api.player.vy;
 g.keys.delete('ability');tick(g,1);
 assert.equal(g.api.gliding,false,'ability release must end gliding on the very next frame');
 assert.ok(g.api.player.vy>liftedVy,'gravity must start pulling down again the instant ability is released');
 tick(g,25);assert.ok(g.api.player.vy>0,'gravity fully takes back over within a few frames');
});

test('a wide seed gap needs a grown vine bridge; gliding cannot bypass it because there is no wind zone there and a ceiling blocks overhead flight',()=>{
 const g=harness();
 const seed=g.api.obstacles.find(o=>o.type==='seed');
 const wind=g.api.obstacles.filter(o=>o.type==='wind');
 assert.ok(!wind.some(w=>w.x<seed.x+seed.w&&w.x+w.w>seed.x),'no wind zone should overlap the seed gap');
 const ceiling=g.api.solids.find(s=>s.kind==='platform'&&s.x===seed.x&&s.w===seed.w);
 assert.ok(ceiling,'the seed gap must have a physical ceiling above it');
 Object.assign(g.api.player,{x:seed.x-40,y:452,vx:280,vy:0,grounded:true});
 g.api.jump();tick(g,120);
 assert.ok(g.api.player.x<seed.x+seed.w,'a plain jump must not clear the seed gap');
});

test('sprig must be rescued before growing a bridge, and only sprig can grow one',()=>{
 const g=harness();const seed=g.api.obstacles.find(o=>o.type==='seed');
 Object.assign(g.api.player,{x:seed.x-20,y:452,vy:0,grounded:true});
 g.api.triggerAbility();tick(g,2);
 assert.equal(seed.solved,false,'crag cannot grow a bridge');
 const sprigSpot=g.api.creatures.find(c=>c.id==='sprig');
 Object.assign(g.api.player,{x:sprigSpot.x-18,y:sprigSpot.y-24,vy:0,grounded:true});tick(g,2);
 assert.equal(g.api.unlockedCreatures.has('sprig'),true);assert.equal(g.api.current,'sprig');
 Object.assign(g.api.player,{x:seed.x-20,y:452,vy:0,grounded:true});
 g.api.triggerAbility();tick(g,2);
 assert.equal(seed.solved,true);
 assert.ok(g.api.solids.some(s=>s.kind==='bridge'&&s.x===seed.x&&s.w===seed.w));
 Object.assign(g.api.player,{x:seed.x+seed.w/2-17,y:400,vx:0,vy:0,grounded:false});tick(g,60);
 assert.equal(g.api.player.grounded,true,'the grown bridge must actually support the player');
});

test('creature rescues happen in a physically forced order on stage 1: glint then sprig, both before their gaps',()=>{
 const g=harness();
 const glintSpot=g.api.creatures.find(c=>c.id==='glint');
 const sprigSpot=g.api.creatures.find(c=>c.id==='sprig');
 const wind=g.api.obstacles.find(o=>o.type==='wind');
 const seed=g.api.obstacles.find(o=>o.type==='seed');
 assert.ok(glintSpot.x<wind.x,'glint must be reachable before the wind gap that needs it');
 assert.ok(sprigSpot.x<seed.x,'sprig must be reachable before the seed gap that needs it');
 assert.ok(glintSpot.x<sprigSpot.x,'glint is rescued before sprig on stage 1');
});

test('losing a life preserves unlocked creatures and solved obstacles, but a full restart resets both',()=>{
 const g=harness();
 const glintSpot=g.api.creatures.find(c=>c.id==='glint');
 Object.assign(g.api.player,{x:glintSpot.x-18,y:glintSpot.y-24,vy:0,grounded:true});tick(g,2);
 const rock=g.api.obstacles.find(o=>o.type==='rock');
 g.api.selectCreature('crag');
 Object.assign(g.api.player,{x:rock.x-20,y:452,vy:0,grounded:true});g.api.triggerAbility();tick(g,2);
 assert.equal(rock.solved,true);
 g.api.loseLife(true);
 assert.equal(g.api.unlockedCreatures.has('glint'),true);
 assert.equal(g.api.obstacles.find(o=>o.type==='rock').solved,true);
 assert.equal(g.api.lives,2);
 g.api.restart();
 assert.deepEqual([...g.api.unlockedCreatures],['crag']);
 assert.equal(g.api.obstacles.find(o=>o.type==='rock').solved,false);
 assert.equal(g.api.lives,3);
});

test('restart rebuilds solids without leaking references across stage loads',()=>{
 const g=harness();
 const rock=g.api.obstacles.find(o=>o.type==='rock');
 Object.assign(g.api.player,{x:rock.x-20,y:452,vy:0,grounded:true});g.api.triggerAbility();tick(g,2);
 assert.ok(!g.api.solids.find(s=>s.obstacleRef===rock));
 g.api.restart();
 assert.ok(g.api.solids.find(s=>s.obstacleRef&&s.obstacleRef.type==='rock'),'reloading the stage must reconstruct the rock solid fresh');
 assert.equal(g.api.obstacles.find(o=>o.type==='rock').solved,false);
});

test('Q/E cycle and 1/2/3 select only creatures that are already unlocked',()=>{
 const g=harness();
 g.api.selectCreature('glint');assert.equal(g.api.current,'crag','cannot select a creature that has not been rescued');
 g.api.cycleCreature(1);assert.equal(g.api.current,'crag','cycling with only one unlocked creature is a no-op');
 const glintSpot=g.api.creatures.find(c=>c.id==='glint');
 Object.assign(g.api.player,{x:glintSpot.x-18,y:glintSpot.y-24,vy:0,grounded:true});tick(g,2);
 assert.equal(g.api.current,'glint');
 g.api.selectCreature('crag');assert.equal(g.api.current,'crag');
 g.api.cycleCreature(1);assert.equal(g.api.current,'glint');
});

test('switching away from glint mid-glide clears the glide state so it cannot be exploited across a switch',()=>{
 const g=harness();const glintSpot=g.api.creatures.find(c=>c.id==='glint');
 Object.assign(g.api.player,{x:glintSpot.x-18,y:glintSpot.y-24,vy:0,grounded:true});tick(g,2);
 const wind=g.api.obstacles.find(o=>o.type==='wind');
 Object.assign(g.api.player,{x:wind.x+20,y:450,vy:0,grounded:false});
 g.keys.add('ability');tick(g,5);assert.equal(g.api.gliding,true);
 g.api.selectCreature('crag');
 assert.equal(g.api.gliding,false,'switching creature must clear an active glide immediately');
});

test('checkpoints persist across a life loss and reset on full restart',()=>{
 const g=harness();
 const cp=g.api.stage.checkpointStarts[1];
 Object.assign(g.api.player,{x:cp,y:452,vy:0,grounded:true});tick(g,2);
 assert.equal(g.api.checkpoint,1);
 g.api.loseLife(true);
 assert.ok(Math.abs(g.api.player.x-cp)<1,'respawn must use the most recent checkpoint');
 assert.equal(g.api.checkpoint,1);
 g.api.restart();
 assert.equal(g.api.checkpoint,-1);
});

test('moving between stages does not require re-rescuing creatures already unlocked on stage 1',()=>{
 const g=harness();
 g.api.loadStage(0);
 const glintSpot=g.api.creatures.find(c=>c.id==='glint');
 Object.assign(g.api.player,{x:glintSpot.x-18,y:glintSpot.y-24,vy:0,grounded:true});tick(g,2);
 const sprigSpot=g.api.creatures.find(c=>c.id==='sprig');
 Object.assign(g.api.player,{x:sprigSpot.x-18,y:sprigSpot.y-24,vy:0,grounded:true});tick(g,2);
 assert.deepEqual([...g.api.unlockedCreatures].sort(),['crag','glint','sprig']);
 g.api.loadStage(1);
 assert.equal(g.api.creatures.length,0,'stage 2 has no rescue pickups; the roster is already complete');
 assert.deepEqual([...g.api.unlockedCreatures].sort(),['crag','glint','sprig']);
});

test('reaching the flag on stage 3 wins the campaign without a boss fight',()=>{
 const g=harness();g.api.loadStage(2);
 Object.assign(g.api.player,{x:g.api.stage.flagX,y:452,vy:0});tick(g);
 assert.equal(g.api.state,'won');
});

test('reaching the flag on stages 1 and 2 advances to the next stage',()=>{
 const g=harness();
 Object.assign(g.api.player,{x:g.api.stage.flagX,y:452,vy:0});tick(g);
 assert.equal(g.api.state,'stageComplete');
 g.api.nextStage();assert.equal(g.api.stageIndex,1);assert.equal(g.api.state,'playing');
});

test('every stage is a focused width and all three stages exist',()=>{
 const stages=harness().api.STAGES;
 assert.equal(stages.length,3);
 for(const stage of stages)assert.ok(stage.width>=2200&&stage.width<=3300);
});

test('no stuck input: blur and visibilitychange clear held movement and pending ability/jump',()=>{
 const g=harness();g.keys.add('right');g.keys.add('ability');g.touches.set(1,'jump');
 g.events.blur();
 assert.equal(g.keys.size,0);assert.equal(g.touches.size,0);
 g.keys.add('left');g.documentEvents.visibilitychange();
 assert.equal(g.keys.size,0);
});

test('all three stages can be completed from spawn using movement, rescues and abilities without teleporting',()=>{
 const g=harness();
 for(let frame=0;frame<15000;frame++){
  const a=g.api,p=a.player;
  if(a.state==='stageComplete'){a.nextStage();continue;}
  if(a.state!=='playing')break;
  g.keys.add('right');g.keys.delete('ability');
  if(a.creatures.some(c=>!c.rescued&&Math.abs(c.x-(p.x+17))<18))g.keys.delete('right');
  const near=a.obstacles.find(o=>!o.solved&&o.type!=='wind'&&p.x+p.w>o.x-22&&p.x<o.x+o.w);
  const wind=a.obstacles.find(o=>o.type==='wind'&&p.x+p.w>o.x-15&&p.x<o.x+o.w);
  if(near){a.selectCreature(near.type==='rock'?'crag':'sprig');a.triggerAbility();}
  else if(wind){a.selectCreature('glint');g.keys.add('ability');if(p.grounded)a.jump();}
  a.update(1/120);
 }
 assert.equal(g.api.state,'won');
 assert.equal(g.api.lives,3,'the required route must be completable without deaths');
 assert.deepEqual([...g.api.unlockedCreatures].sort(),['crag','glint','sprig']);
});
