const {test}=require('node:test');const assert=require('node:assert/strict');const harness=require('./harness.cjs');
const tick=(g,n=1)=>{for(let i=0;i<n;i++)g.api.update(1/120)};
function setup(stage,id){const g=harness();g.api.loadStage(stage);g.api.SPECIES.forEach(s=>g.api.unlockedCreatures.add(s.id));g.api.selectCreature(id);return g;}
function approach(g,o){Object.assign(g.api.player,{x:o.x-40,y:452,vy:0,grounded:true});}
const storage=()=>{const m=new Map();return{getItem:k=>m.get(k)||null,setItem:(k,v)=>m.set(k,v)}};
test('each new barrier rejects wrong creatures and requires its specific ability',()=>{
 for(const [stage,type,id] of [[3,'thorn','cinder'],[4,'water','floe'],[5,'relay','volt']]){
  const g=setup(stage,'crag'),o=g.api.obstacles.find(o=>o.type===type);approach(g,o);g.api.triggerAbility();tick(g);assert.equal(o.solved,false);
  g.api.selectCreature(id);g.api.triggerAbility();tick(g);assert.equal(o.solved,true);
 }
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
 for(const [i,id,type] of [[3,'cinder','thorn'],[4,'floe','water'],[5,'volt','relay']]){const g=harness();g.api.loadStage(i);assert.ok(g.api.creatures.find(c=>c.id===id).x<g.api.obstacles.find(o=>o.type===type).x);}
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
test('all six creatures can be selected by number once rescued',()=>{const g=setup(5,'crag');for(let n=1;n<=6;n++){g.events.keydown({code:'Digit'+n,repeat:false,preventDefault(){}});assert.equal(g.api.current,g.api.SPECIES[n-1].id);}});
test('art module matches the embedded game art and all six species render every pose',()=>{
 const fs=require('node:fs'),{createCreatureArt}=require('../CREATURE-ART');
 const source=fs.readFileSync(require.resolve('../server'),'utf8');assert.ok(source.includes(createCreatureArt.toString()));
 const art=createCreatureArt();for(const id of ['crag','glint','sprig','cinder','floe','volt'])for(const pose of ['idle','run','jump','ability']){
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
