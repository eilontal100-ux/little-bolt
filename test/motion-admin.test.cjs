const {test}=require('node:test');
const assert=require('node:assert/strict');
const harness=require('./harness.cjs');
const tick=(g,n=1)=>{for(let i=0;i<n;i++)g.api.update(1/120)};
const key=(g,code,extras={})=>g.events.keydown({code,repeat:false,preventDefault(){},...extras});
function fixture(stage,id){const g=harness();g.api.loadStage(stage);g.api.unlockedCreatures.add(id);g.api.selectCreature(id);return g;}
const memory=()=>{const m=new Map();return{getItem:k=>m.get(k)||null,setItem:(k,v)=>m.set(k,v)}};

test('E then T and E-hyphen-T open admin; unrelated keys, blur, repeat, fields, and modifiers do not',()=>{
 for(const seq of [['KeyE','KeyT'],['KeyE','Minus','KeyT']]){const g=harness();seq.forEach(c=>key(g,c));assert.equal(g.api.state,'admin');key(g,'Escape');assert.equal(g.api.state,'playing');}
 for(const seq of [['KeyT'],['KeyE','KeyD','KeyT']]){const g=harness();seq.forEach(c=>key(g,c));assert.equal(g.api.state,'playing');}
 for(const extra of [{repeat:true},{ctrlKey:true},{metaKey:true},{altKey:true},{target:{tagName:'INPUT'}},{target:{isContentEditable:true}}]){
  const g=harness();key(g,'KeyE',extra);key(g,'KeyT');assert.equal(g.api.state,'playing');
 }
 const g=harness();key(g,'KeyE');g.events.blur();key(g,'KeyT');assert.equal(g.api.state,'playing');
 key(g,'KeyE');g.api.loadStage(0);key(g,'KeyT');assert.equal(g.api.state,'playing');
 let now=1000;const h=harness({now:()=>now});key(h,'KeyE');now=2001;key(h,'KeyT');assert.equal(h.api.state,'playing');
});
test('E still cycles creatures; admin pauses machinery and restores its exact prior state',()=>{
 const g=fixture(20,'tempo');g.api.unlockedCreatures.add('zip');g.api.selectCreature('crag');key(g,'KeyE');assert.equal(g.api.current,'zip');
 g.keys.add('right');g.api.openAdmin();const p={...g.api.player},x=g.api.obstacles.find(o=>o.type==='movingPlatform').x;
 tick(g,500);assert.deepEqual({...g.api.player},p);assert.equal(g.api.obstacles.find(o=>o.type==='movingPlatform').x,x);assert.equal(g.keys.size,0);
 g.api.closeAdmin();assert.equal(g.api.state,'playing');g.api.openMenu();g.api.openAdmin();g.api.closeAdmin();assert.equal(g.api.state,'menu');
});
test('admin actions are session-only, level jump supplies companions, and returning restores original progress',()=>{
 const store=memory(),g=harness({storage:store});g.api.saveProgress();const saved=store.getItem('creature-call-campaign-v2');
 g.api.openAdmin();g.elements['admin-level'].value='26';g.api.adminAction('jump');assert.equal(g.api.stageIndex,26);
 assert.equal(g.api.unlockedCreatures.size,11);assert.equal(g.api.adminActive,true);g.api.adminAction('invincible');g.api.closeAdmin();
 assert.equal(g.api.state,'playing');Object.assign(g.api.player,{x:100,y:900});tick(g);assert.equal(g.api.lives,3);assert.ok(g.api.player.y<600);
 Object.assign(g.api.player,{x:g.api.stage.flagX,y:452});tick(g);assert.equal(g.api.state,'won');assert.equal(store.getItem('creature-call-campaign-v2'),saved);
 g.api.onEndButton();assert.equal(g.api.adminActive,false);assert.equal(g.api.stageIndex,0);assert.equal(g.api.adminInvincible,false);
 assert.deepEqual([...g.api.unlockedCreatures],['crag']);assert.equal(store.getItem('creature-call-campaign-v2'),saved);
});
test('opening/closing admin alone makes no cheat changes; refill/unlock require the panel',()=>{
 const g=harness();g.api.adminAction('unlock');assert.equal(g.api.unlockedCreatures.size,1);
 g.api.openAdmin();g.api.closeAdmin();assert.equal(g.api.adminActive,false);
 g.api.loseLife(true);g.api.openAdmin();g.api.adminAction('refill');assert.equal(g.api.lives,3);
 g.api.adminAction('unlock');assert.equal(g.api.unlockedCreatures.size,11);g.api.endAdminPractice();assert.equal(g.api.unlockedCreatures.size,1);
});
test('admin rejects invalid stage selection and focus wraps within the panel',()=>{
 const g=harness();g.api.openAdmin();for(const v of ['NaN','-1','27','2.5']){g.elements['admin-level'].value=v;g.api.adminAction('jump');assert.equal(g.api.stageIndex,0);assert.equal(g.api.adminActive,false);}
 const first=g.elements['admin-close'],last=g.elements['admin-return'];last.disabled=false;
 g.elements['admin-panel'].querySelectorAll=()=>[first,last];first.focus();key(g,'Tab',{shiftKey:true});assert.equal(g.document.activeElement,last);
 key(g,'Tab');assert.equal(g.document.activeElement,first);key(g,'Escape');assert.equal(g.document.activeElement,g.elements.game);
});
test('Zip dash is airborne-only, moves faster, cannot recharge by switching and stops at solid walls',()=>{
 const g=fixture(19,'zip');g.api.triggerAbility();tick(g);assert.equal(g.api.dashTime,0);
 g.api.jump();tick(g,15);g.api.triggerAbility();tick(g);const x=g.api.player.x;tick(g,12);assert.ok(g.api.player.x-x>70);assert.equal(g.api.dashReady,false);
 g.api.selectCreature('crag');g.api.selectCreature('zip');g.api.triggerAbility();tick(g);assert.equal(g.api.dashTime,0);
 tick(g,180);assert.equal(g.api.dashReady,true);
 g.api.loadStage(0);const rock=g.api.obstacles.find(o=>o.type==='rock');Object.assign(g.api.player,{x:rock.x-60,y:390,vy:0,grounded:false});
 g.api.triggerAbility();tick(g,30);assert.ok(g.api.player.x+g.api.player.w<=rock.x+.01);assert.equal(rock.solved,false);
});
test('Tether pulls through space, respects range and occlusion, releases and clears on death',()=>{
 const g=fixture(18,'tether');g.api.triggerAbility();tick(g);assert.equal(g.api.grapple,null);
 Object.assign(g.api.player,{x:590,y:452});g.api.selectCreature('crag');g.api.triggerAbility();tick(g);assert.equal(g.api.grapple,null);
 g.api.selectCreature('tether');g.api.triggerAbility();tick(g);assert.ok(g.api.grapple);const x=g.api.player.x;tick(g,30);assert.ok(g.api.player.x>x+60);assert.ok(g.api.player.y<400);
 g.api.triggerAbility();tick(g);assert.equal(g.api.grapple,null);
 Object.assign(g.api.player,{x:590,y:452,grounded:true});g.api.solids.push({x:650,y:0,w:50,h:500,kind:'rock'});g.api.triggerAbility();tick(g);assert.equal(g.api.grapple,null);
 g.api.solids.pop();g.api.triggerAbility();tick(g);assert.ok(g.api.grapple);g.api.loseLife(true);assert.equal(g.api.grapple,null);
});
test('Tempo freezes ferries and saws, has a real cooldown and does not freeze the player',()=>{
 const g=fixture(20,'tempo'),o=g.api.obstacles.find(o=>o.type==='movingPlatform'),s=g.api.obstacles.find(o=>o.type==='saw');
 tick(g,10);const x=o.x;tick(g,10);assert.notEqual(o.x,x);
 g.api.selectCreature('crag');g.api.triggerAbility();tick(g);assert.equal(g.api.stasisTime,0);
 g.api.selectCreature('tempo');g.api.triggerAbility();tick(g);const frozen=[o.x,s.x],p=g.api.player.x;
 g.keys.add('right');tick(g,30);g.keys.clear();assert.deepEqual([o.x,s.x],frozen);assert.ok(g.api.player.x>p);
 g.api.triggerAbility();tick(g);assert.ok(g.api.stasisTime<4);tick(g,490);assert.equal(g.api.stasisTime,0);assert.notEqual(o.x,frozen[0]);assert.ok(g.api.stasisCooldown>0);
 g.api.triggerAbility();tick(g);assert.equal(g.api.stasisTime,0);tick(g,400);g.api.triggerAbility();tick(g);assert.ok(g.api.stasisTime>0);
 g.api.loadStage(20);assert.equal(g.api.stasisTime,0);assert.equal(g.api.stasisCooldown,0);
});
test('moving platforms carry riders and never push a rider into a wall',()=>{
 const g=fixture(20,'tempo'),o=g.api.obstacles.find(o=>o.type==='movingPlatform');
 Object.assign(g.api.player,{x:o.x+40,y:o.y-48,vy:0,grounded:true});const offset=g.api.player.x-o.x;tick(g,30);assert.ok(Math.abs(g.api.player.x-o.x-offset)<1);assert.equal(g.api.player.grounded,true);
 const wall={x:g.api.player.x+35,y:0,w:40,h:455,kind:'rock'};g.api.solids.push(wall);tick(g,90);assert.ok(g.api.player.x+34<=wall.x);
});
test('saws damage once per grace window and stasis does not make touching them harmless',()=>{
 const g=fixture(20,'tempo'),s=g.api.obstacles.find(o=>o.type==='saw');g.api.triggerAbility();tick(g);
 Object.assign(g.api.player,{x:s.x,y:452});tick(g);assert.equal(g.api.lives,2);Object.assign(g.api.player,{x:s.x,y:452});tick(g);assert.equal(g.api.lives,2);
});
test('legacy highestStage restores prior companions even without completed list',()=>{
 const store=memory();store.setItem('creature-call-campaign-v2',JSON.stringify({version:2,stageIndex:21,highestStage:21,records:{},unlocked:['crag'],current:'crag'}));
 const g=harness({storage:store});g.api.resumeSaved();assert.equal(g.api.unlockedCreatures.size,11);
});
test('resuming campaign after practice does not import admin unlocks even when storage is unavailable',()=>{
 const g=harness({storage:{getItem(){throw Error('blocked')},setItem(){throw Error('blocked')}}});
 g.api.openAdmin();g.api.adminAction('unlock');g.api.closeAdmin();g.api.openMenu();g.api.resumeSaved();
 assert.equal(g.api.state,'playing');assert.equal(g.api.adminActive,false);assert.deepEqual([...g.api.unlockedCreatures],['crag']);
});
test('paused admin panel preserves stage-complete state and cannot run behind map controls',()=>{
 const g=harness();Object.assign(g.api.player,{x:g.api.stage.flagX,y:452});tick(g);assert.equal(g.api.state,'stageComplete');
 g.api.openAdmin();g.api.closeAdmin();assert.equal(g.api.state,'stageComplete');g.api.onEndButton();assert.equal(g.api.stageIndex,1);
});
test('transient motion does not persist through save/resume; old saves keep their normal difficulty',()=>{
 const store=memory(),g=harness({storage:store});
 for(let i=0;i<21;i++){Object.assign(g.api.player,{x:g.api.stage.flagX,y:452});tick(g);g.api.nextStage();}
 g.api.selectCreature('tempo');g.api.triggerAbility();tick(g);assert.ok(g.api.stasisTime>0);g.api.saveProgress();
 const h=harness({storage:store});h.api.resumeSaved();assert.equal(h.api.stageIndex,21);assert.equal(h.api.stasisTime,0);assert.equal(h.api.stasisCooldown,0);assert.equal(h.api.grapple,null);assert.equal(h.api.dashTime,0);
});
