const {test}=require('node:test');const assert=require('node:assert/strict');const harness=require('./harness.cjs');
const tick=(g,n=1)=>{for(let i=0;i<n;i++)g.api.update(1/120)};
function setup(stage,id){const g=harness();g.api.loadStage(stage);g.api.SPECIES.forEach(s=>g.api.unlockedCreatures.add(s.id));g.api.selectCreature(id);return g;}
function approach(g,o){Object.assign(g.api.player,{x:o.x-40,y:452,vy:0,grounded:true});}
const storage=()=>{const m=new Map();return{getItem:k=>m.get(k)||null,setItem:(k,v)=>m.set(k,v)}};
test('each new barrier rejects wrong creatures and requires its specific ability',()=>{
 for(const [stage,type,id] of [[3,'thorn','cinder'],[4,'water','floe'],[5,'relay','volt'],[12,'clay','burrow'],[13,'crystal','echo']]){
  const g=setup(stage,'crag'),o=g.api.obstacles.find(o=>o.type===type);approach(g,o);g.api.triggerAbility();tick(g);assert.equal(o.solved,false);
  g.api.selectCreature(id);g.api.triggerAbility();tick(g);assert.equal(o.solved,true);
 }
});
test('clay clears permanently and crystal builds a lasting bridge, matching rock and seed behavior',()=>{
 const g=setup(12,'burrow'),clay=g.api.obstacles.find(o=>o.type==='clay');
 approach(g,clay);g.api.triggerAbility();tick(g);
 assert.equal(clay.solved,true);assert.ok(!g.api.solids.some(s=>s.x<clay.x+clay.w&&s.x+44>clay.x&&s.obstacleRef===clay));
 const h=setup(13,'echo'),crystal=h.api.obstacles.find(o=>o.type==='crystal');
 approach(h,crystal);h.api.triggerAbility();tick(h);
 assert.equal(crystal.solved,true);assert.ok(h.api.solids.some(s=>s.obstacleRef===crystal));
 Object.assign(h.api.player,{x:crystal.x+crystal.w/2,y:452,vy:0,grounded:true});tick(h,15);
 assert.equal(h.api.player.grounded,true,'the crystal bridge stays solid, unlike timed water');
});
test('frozen water supports the player, melts, and can be frozen again',()=>{
 const g=setup(4,'floe'),o=g.api.obstacles.find(o=>o.type==='water');approach(g,o);g.api.triggerAbility();tick(g);
 assert.ok(g.api.solids.some(s=>s.obstacleRef===o));
 Object.assign(g.api.player,{x:o.x+100,y:452,grounded:true,vy:0});tick(g,15);assert.equal(g.api.player.grounded,true);
 approach(g,o);tick(g,Math.ceil(o.duration*120)+1);assert.equal(o.solved,false);assert.ok(!g.api.solids.some(s=>s.obstacleRef===o));
 g.api.triggerAbility();tick(g);assert.equal(o.solved,true);assert.ok(o.remaining>o.duration-.1);
});
test('unpowered wind grants no lift; Volt powers linked wind and gate; both expire',()=>{
 const g=setup(5,'glint'),r=g.api.obstacles.find(o=>o.type==='relay'),w=g.api.obstacles.find(o=>o.type==='wind'),gate=g.api.obstacles.find(o=>o.type==='gate');
 Object.assign(g.api.player,{x:w.x+30,y:400,grounded:false,vy:0});g.keys.add('ability');tick(g,5);assert.equal(g.api.gliding,false);
 g.api.selectCreature('volt');approach(g,r);g.api.triggerAbility();tick(g);assert.equal(gate.active,true);assert.ok(!g.api.solids.some(s=>s.obstacleRef===gate));
 g.api.selectCreature('glint');Object.assign(g.api.player,{x:w.x+30,y:400,grounded:false,vy:0});tick(g,5);assert.equal(g.api.gliding,true);
 g.keys.clear();approach(g,r);tick(g,Math.ceil(r.duration*120)+1);assert.equal(gate.active,false);assert.ok(g.api.solids.some(s=>s.obstacleRef===gate));
 g.api.selectCreature('volt');g.api.triggerAbility();tick(g);assert.equal(gate.active,true);
});
test('a gate that expires around the player waits until the player leaves before closing',()=>{
 const g=setup(5,'volt'),r=g.api.obstacles.find(o=>o.type==='relay'),gate=g.api.obstacles.find(o=>o.type==='gate');approach(g,r);g.api.triggerAbility();tick(g);
 Object.assign(g.api.player,{x:gate.x+2,y:452,vy:0});r.remaining=.001;tick(g);assert.ok(!g.api.solids.some(s=>s.obstacleRef===gate));
 g.api.player.x=gate.x+gate.w+10;tick(g);assert.ok(g.api.solids.some(s=>s.obstacleRef===gate));
});
test('reaching any exit clears the stage even when every puzzle was skipped',()=>{
 const g=harness();
 for(let i=0;i<g.api.STAGES.length;i++){
  assert.equal(g.api.stageIndex,i);
  assert.ok(g.api.obstacles.some(o=>!o.completed&&!o.solved));
  Object.assign(g.api.player,{x:g.api.stage.flagX,y:452,vy:0});tick(g);
  assert.equal(g.api.state,i===g.api.STAGES.length-1?'won':'stageComplete');
  assert.ok(g.api.completedStages.has(i));
  if(i<g.api.STAGES.length-1){assert.equal(g.api.highestStage,i+1);g.api.nextStage();}
 }
});
test('a shortcut clear saves the next stage unlock for reload',()=>{
 const store=storage(),g=harness({storage:store});
 Object.assign(g.api.player,{x:g.api.stage.flagX,y:452});tick(g);
 const h=harness({storage:store});h.api.resumeSaved();h.api.openMenu();h.api.visitStage(1);
 assert.equal(h.api.stageIndex,1);assert.equal(h.api.state,'playing');
});
test('three deaths retain checkpoint, companions and permanent puzzle solutions',()=>{
 const g=setup(3,'cinder'),o=g.api.obstacles.find(o=>o.type==='thorn');approach(g,o);g.api.triggerAbility();tick(g);
 for(let i=0;i<3;i++)g.api.loseLife(true);assert.equal(g.api.state,'playing');assert.equal(o.solved,true);assert.ok(g.api.unlockedCreatures.has('cinder'));assert.equal(g.api.lives,3);
});
test('new companions are rescued before the first puzzle requiring them',()=>{
 for(const [i,id,type] of [[3,'cinder','thorn'],[4,'floe','water'],[5,'volt','relay'],[12,'burrow','clay'],[13,'echo','crystal']]){const g=harness();g.api.loadStage(i);assert.ok(g.api.creatures.find(c=>c.id===id).x<g.api.obstacles.find(o=>o.type===type).x);}
});
test('save/reload retains collected items and solved bridges without duplicate rewards',()=>{
 const store=storage(),g=harness({storage:store});const coin=g.api.coins[0];Object.assign(g.api.player,{x:coin.x-17,y:coin.y-24});tick(g);
 g.api.unlockedCreatures.add('sprig');g.api.selectCreature('sprig');const seed=g.api.obstacles.find(o=>o.type==='seed');approach(g,seed);g.api.triggerAbility();tick(g);g.api.saveProgress();
 const h=harness({storage:store});h.api.resumeSaved();assert.equal(h.api.coinCount,1);assert.ok(h.api.unlockedCreatures.has('sprig'));assert.equal(h.api.obstacles.find(o=>o.type==='seed').solved,true);
 Object.assign(h.api.player,{x:coin.x-17,y:coin.y-24});tick(h);assert.equal(h.api.coinCount,1);
 h.api.restart();assert.equal(h.api.coinCount,0);assert.deepEqual([...h.api.unlockedCreatures],['crag']);assert.equal(h.api.readSave().highestStage,0);
});
test('save resumes at checkpoint and map navigation respects unlocked stages',()=>{
 const store=storage(),g=harness({storage:store});g.api.obstacles.forEach(o=>o.completed=true);Object.assign(g.api.player,{x:g.api.stage.flagX,y:452});tick(g);g.api.nextStage();
 const cp=g.api.stage.checkpointStarts[1];Object.assign(g.api.player,{x:cp,y:452});tick(g);g.api.saveProgress();
 const h=harness({storage:store});h.api.resumeSaved();assert.equal(h.api.stageIndex,1);assert.equal(h.api.player.x,cp);assert.equal(h.api.highestStage,1);
 h.api.openMenu();h.api.visitStage(11);assert.equal(h.api.stageIndex,1);h.api.visitStage(0);assert.equal(h.api.stageIndex,0);
});
test('invalid and unavailable storage does not break gameplay',()=>{
 for(const store of [{getItem:()=>'{broken',setItem(){throw Error('blocked')}},{getItem:()=>JSON.stringify({version:2,stageIndex:999}),setItem(){}}]){
  const g=harness({storage:store});assert.equal(g.api.readSave(),null);assert.doesNotThrow(()=>g.api.saveProgress());tick(g);assert.equal(g.api.state,'playing');
 }
});
test('opening the map pauses time and clears held actions',()=>{const g=harness();g.keys.add('right');g.api.openMenu();const x=g.api.player.x;tick(g,100);assert.equal(g.api.player.x,x);assert.equal(g.keys.size,0);g.api.closeMenu();assert.equal(g.api.state,'playing');});
test('all eight creatures can be selected by number once rescued',()=>{const g=setup(5,'crag');for(let n=1;n<=8;n++){g.events.keydown({code:'Digit'+n,repeat:false,preventDefault(){}});assert.equal(g.api.current,g.api.SPECIES[n-1].id);}});
test('art module matches the embedded game art and all eleven species render every pose',()=>{
 const fs=require('node:fs'),{createCreatureArt}=require('../CREATURE-ART');
 const source=fs.readFileSync(require.resolve('../server'),'utf8');assert.ok(source.includes(createCreatureArt.toString()));
 const art=createCreatureArt();for(const id of ['crag','glint','sprig','cinder','floe','volt','burrow','echo','tether','zip','tempo'])for(const pose of ['idle','run','jump','ability']){
  let pixels=0;const ctx={set fillStyle(v){assert.match(v,/^#[0-9a-f]{6}$/i)},fillRect(...coords){assert.ok(coords.every(Number.isFinite));pixels++;}};
  art.drawCreature(ctx,id,0,0,-1,pose,.17);assert.ok(pixels>100);
 }
});
test('reloading a saved timed crossing requires reactivation and restores no ghost solid',()=>{
 const store=storage(),g=harness({storage:store});
 // Advance the campaign normally at the completion-state boundary; unit fixture only.
 for(let i=0;i<5;i++){g.api.obstacles.forEach(o=>o.completed=true);Object.assign(g.api.player,{x:g.api.stage.flagX,y:452});tick(g);g.api.nextStage();}
 g.api.unlockedCreatures.add('floe');g.api.selectCreature('floe');const w=g.api.obstacles.find(o=>o.type==='water');approach(g,w);g.api.triggerAbility();tick(g);g.api.saveProgress();
 const h=harness({storage:store});h.api.resumeSaved();const water=h.api.obstacles.find(o=>o.type==='water');assert.equal(water.solved,false);assert.equal(water.completed,true);assert.ok(!h.api.solids.some(s=>s.obstacleRef===water));
});
test('touching spikes costs a life and the invulnerability grace window blocks an immediate repeat hit',()=>{
 const g=setup(14,'crag'),spike=g.api.obstacles.find(o=>o.type==='spikes');
 const startLives=g.api.lives;
 Object.assign(g.api.player,{x:spike.x,y:452,vx:0,vy:0,grounded:true});
 tick(g);
 assert.equal(g.api.lives,startLives-1);
 assert.ok(g.api.damageTimer>0);
 Object.assign(g.api.player,{x:spike.x,y:452,vx:0,vy:0,grounded:true});
 tick(g,10);
 assert.equal(g.api.lives,startLives-1,'grace window blocks repeated spike damage for a short time');
 tick(g,Math.ceil(g.api.damageTimer*120)+5);
 assert.equal(g.api.lives,startLives-2,'once grace expires, sitting on spikes costs another life');
});
test('setDifficulty is menu-gated, rescales lives immediately, and cannot be swapped mid-run to exploit a timer',()=>{
 const g=harness({menu:true});
 assert.equal(g.api.state,'menu');
 assert.equal(g.api.difficulty,'normal');
 g.api.setDifficulty('extra');
 assert.equal(g.api.difficulty,'extra');
 assert.equal(g.api.lives,g.api.DIFFICULTIES.extra.lives);
 g.api.closeMenu();
 assert.equal(g.api.state,'playing');
 g.api.setDifficulty('easy');
 assert.equal(g.api.difficulty,'extra','difficulty cannot change outside the menu, preventing a mid-run timer exploit');
});
test('the timer multiplier scales machinery duration exactly per difficulty when a stage loads',()=>{
 for(const [id,mul] of Object.entries({easy:1.5,normal:1,hard:0.85,extra:0.7})){
  const g=harness({menu:true});
  const baseDuration=g.api.STAGES[5].obstacleTemplate.find(o=>o.type==='relay').duration;
  g.api.setDifficulty(id);g.api.loadStage(5);
  const scaled=g.api.obstacles.find(o=>o.type==='relay').duration;
  assert.ok(Math.abs(scaled-baseDuration*mul)<1e-9,id+' should scale the base duration by '+mul);
 }
});
test('lives refill to the active difficulty amount on both restart and running out of lives',()=>{
 for(const [id,lives] of Object.entries({easy:5,normal:3,hard:2,extra:1})){
  const g=harness({menu:true});g.api.setDifficulty(id);g.api.closeMenu();
  assert.equal(g.api.lives,lives);
  for(let i=0;i<lives;i++)g.api.loseLife(true);
  assert.equal(g.api.lives,lives,'exhausting all lives refills to the mode maximum rather than ending the run');
  g.api.restart();
  assert.equal(g.api.lives,lives);
 }
});
test('a saved journey without a difficulty field defaults to Normal, and an unrecognized value also normalizes',()=>{
 const store=storage();
 store.setItem('creature-call-campaign-v2',JSON.stringify({version:2,stageIndex:0,highestStage:0,records:{},unlocked:['crag'],current:'crag',completed:[]}));
 assert.equal(harness({storage:store}).api.readSave().difficulty,'normal');
 store.setItem('creature-call-campaign-v2',JSON.stringify({version:2,stageIndex:0,highestStage:0,records:{},unlocked:['crag'],current:'crag',completed:[],difficulty:'nonsense'}));
 assert.equal(harness({storage:store}).api.readSave().difficulty,'normal');
});
test('resuming an old save without a difficulty field applies Normal lives, and a valid saved difficulty survives resume',()=>{
 const oldStore=storage();
 oldStore.setItem('creature-call-campaign-v2',JSON.stringify({version:2,stageIndex:0,highestStage:0,records:{},unlocked:['crag'],current:'crag',completed:[]}));
 const g=harness({storage:oldStore});g.api.resumeSaved();
 assert.equal(g.api.difficulty,'normal');assert.equal(g.api.lives,g.api.DIFFICULTIES.normal.lives);
 const store=storage(),h=harness({storage:store,menu:true});
 h.api.setDifficulty('hard');h.api.closeMenu();
 const k=harness({storage:store});k.api.resumeSaved();
 assert.equal(k.api.difficulty,'hard');assert.equal(k.api.lives,k.api.DIFFICULTIES.hard.lives);
});
test('all twenty-seven stages remain completable on Extra Hard, proving the 0.7x timer multiplier leaves enough margin',()=>{
 const g=harness({menu:true});g.api.setDifficulty('extra');g.api.closeMenu();
 for(let frame=0;frame<90000;frame++){
  const a=g.api,p=a.player;
  if(a.state==='stageComplete'){a.nextStage();continue;}
  if(a.state!=='playing')break;
  g.keys.add('right');g.keys.delete('ability');
  if(a.creatures.some(c=>!c.rescued&&Math.abs(c.x-(p.x+17))<18))g.keys.delete('right');
  const near=a.obstacles.find(o=>['rock','thorn','seed','water','relay','clay','crystal'].includes(o.type)&&(!o.solved||(o.remaining!==undefined&&o.remaining<2))&&p.x+p.w>o.x-22&&p.x<o.x+o.w);
  const wind=a.obstacles.find(o=>o.type==='wind'&&p.x+p.w>o.x-15&&p.x<o.x+o.w);
  const spike=a.obstacles.find(o=>o.type==='spikes'&&o.x+o.w>p.x+p.w&&o.x-(p.x+p.w)<60);
  if(near){g.keys.delete('right');a.selectCreature(({rock:'crag',thorn:'cinder',seed:'sprig',water:'floe',relay:'volt',clay:'burrow',crystal:'echo'})[near.type]);a.triggerAbility();}
  else if(wind){a.selectCreature('glint');g.keys.add('ability');if(p.grounded)a.jump();}
  else if(spike&&p.grounded){a.jump();}
  require('./motion-driver.cjs')(g);
  a.update(1/120);
 }
 assert.equal(g.api.state,'won','stalled on Extra Hard at stage '+(g.api.stageIndex+1)+' x='+g.api.player.x+' y='+g.api.player.y);
});
test('skipping a companion rescue still grants it at the stage exit, and it survives save/reload for a later required ability',()=>{
 const store=storage(), g=harness({storage:store});
 g.api.loadStage(3); // Bramble Estuary introduces Cinder before its thorn wall
 assert.ok(!g.api.unlockedCreatures.has('cinder'));
 Object.assign(g.api.player,{x:g.api.stage.flagX,y:452,vy:0});tick(g);
 assert.equal(g.api.state,'stageComplete');
 assert.ok(g.api.unlockedCreatures.has('cinder'),'reaching the exit must grant the companion even though its rescue was skipped');
 g.api.nextStage();g.api.saveProgress();
 const h=harness({storage:store});h.api.resumeSaved();
 assert.ok(h.api.unlockedCreatures.has('cinder'),'the skip-granted companion must persist through save/reload');
 h.api.loadStage(6); // Kilnroot Works also has a thorn wall requiring Cinder
 const thorn=h.api.obstacles.find(o=>o.type==='thorn');
 approach(h,thorn);h.api.selectCreature('cinder');h.api.triggerAbility();tick(h);
 assert.equal(thorn.solved,true,'the skip-granted companion must actually work for a later required ability');
});
test('an old save that advanced past stages without recording their companions recovers those companions on resume',()=>{
 const store=storage();
 store.setItem('creature-call-campaign-v2',JSON.stringify({
  version:2,stageIndex:4,highestStage:4,records:{},unlocked:['crag'],current:'crag',completed:[0,1,2,3]
 }));
 const g=harness({storage:store});g.api.resumeSaved();
 assert.ok(g.api.unlockedCreatures.has('glint'),'stage 1 introduced Glint');
 assert.ok(g.api.unlockedCreatures.has('sprig'),'stage 1 introduced Sprig');
 assert.ok(g.api.unlockedCreatures.has('cinder'),'stage 3 introduced Cinder');
 assert.ok(!g.api.unlockedCreatures.has('floe'),'stage 4, the in-progress stage, is not yet completed and must not be granted for free');
});
