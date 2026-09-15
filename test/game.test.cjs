const { test } = require('node:test');
const assert = require('node:assert/strict');
const harness = require('./harness.cjs');
const tick = (g,n=1) => {for(let i=0;i<n;i++)g.update(1/120)};
test('walk, jump, gravity, landing, no midair jump',()=>{
 const g=harness();g.keys.add('right');tick(g,30);assert.ok(g.player.x>145);g.keys.clear();g.api.jump();tick(g);assert.ok(g.player.vy<0);tick(g,10);const vy=g.player.vy;g.api.jump();tick(g);assert.ok(g.player.vy>vy);tick(g,120);assert.equal(g.player.y,452);assert.equal(g.player.grounded,true);
});
test('floating platform top, underside and both sides are solid',()=>{
 for (const [x,y,vx,vy,expectX,expectY] of [[310,340,0,200,310,342],[310,414,0,-500,310,412],[244,395,280,0,246,null],[432,395,-280,0,430,null]]) {
 const g=harness();Object.assign(g.player,{x,y,vy,grounded:false});if(vx)g.keys.add(vx>0?'right':'left');tick(g,2);if(expectX!==null)assert.equal(g.player.x,expectX);if(expectY!==null)assert.ok(Math.abs(g.player.y-expectY)<1); }
});
test('fixed loop produces same movement at 30, 60 and 120 Hz',()=>{
 const results=[30,60,120].map(hz=>{const g=harness();g.keys.add('right');for(let i=0;i<=hz;i++)g.frame(i*1000/hz);return g.player.x});assert.ok(Math.max(...results)-Math.min(...results)<3);
});
test('camera follows horizontally and clamps to both level boundaries',()=>{
 const g=harness();tick(g);assert.equal(g.api.camera,0);g.player.x=1500;tick(g);assert.ok(g.api.camera>1000);g.player.x=3166;tick(g);assert.equal(g.api.camera,3200-g.api.viewWidth);
});
test('coins collect once and counter updates',()=>{
 const g=harness();g.player.x=185;tick(g);assert.equal(g.api.coinCount,1);assert.equal(g.api.coins[0].collected,true);tick(g,60);assert.equal(g.api.coinCount,1);assert.equal(g.elements.coins.textContent,'Coins: 1');
});
test('enemy patrols stay on their solid surface and within limits',()=>{
 const g=harness();for(let i=0;i<3000;i++){tick(g);for(const e of g.api.enemies){assert.ok(e.x>=e.min&&e.x<=e.max);assert.ok(g.solids.some(s=>s.y===e.y+e.h&&e.min>=s.x&&e.max+e.w<=s.x+s.w));}}
});
test('descending top contact stomps and bounces; side contact loses one life',()=>{
 const g=harness();const e=g.api.enemies[0];Object.assign(g.player,{x:e.x,y:e.y-49,vy:200,grounded:false});tick(g);assert.equal(e.defeated,true);assert.ok(g.player.vy<0);assert.equal(g.api.lives,3);
 const side=harness();Object.assign(side.player,{x:900,y:452,vy:0});tick(side);assert.equal(side.api.lives,2);assert.equal(side.api.enemies[0].defeated,false);tick(side,20);assert.equal(side.api.lives,2);assert.equal(side.player.x,80);
});
test('rising and deep side overlaps never count as stomps',()=>{
 for(const vy of [-100,100]){const g=harness();Object.assign(g.player,{x:910,y:450,vy});tick(g);assert.equal(g.api.enemies[0].defeated,false);assert.equal(g.api.lives,2);}
});
test('falls cost exactly one life; respawn resets motion and preserves progress',()=>{
 const g=harness();g.player.x=185;tick(g);g.api.enemies[0].defeated=true;
 for(const expected of [2,1,0]){
 Object.assign(g.player,{x:690,y:705,vx:280,vy:600,grounded:false});tick(g);assert.equal(g.api.lives,expected);assert.equal(g.api.coinCount,1);assert.equal(g.api.enemies[0].defeated,true);
 if(expected){assert.equal(g.player.x,80);assert.equal(g.player.y,452);assert.equal(g.player.vx,0);assert.equal(g.player.vy,0);tick(g,130);assert.equal(g.api.lives,expected);}
 }assert.equal(g.api.state,'gameover');tick(g,500);assert.equal(g.api.lives,0);
});
test('every required gap can be crossed at normal movement settings',()=>{
 for(const [start,end] of [[575,750],[1385,1580],[2175,2360]]){
 const g=harness();g.player.x=start;g.keys.add('right');g.api.jump();let landed=false;
 for(let i=0;i<115;i++){tick(g);if(g.player.grounded&&g.player.x>=end){landed=true;break;}}
 assert.equal(landed,true,'gap ending '+end);assert.equal(g.api.lives,3);
 }
});
test('flag wins, stops motion and reports the collected coins',()=>{
 const g=harness();g.player.x=185;tick(g);g.player.x=3050;tick(g);assert.equal(g.api.state,'won');assert.equal(g.elements['end-title'].textContent,'You win!');assert.equal(g.elements['end-detail'].textContent,'Coins collected: 1');const x=g.player.x;g.keys.add('right');tick(g,120);assert.equal(g.player.x,x);
});
test('both endings restart all state without scheduling extra loops',()=>{
 for(const ending of ['won','gameover']){
 const g=harness();g.player.x=185;tick(g);g.api.enemies[0].defeated=true;
 if(ending==='won'){g.player.x=3050;tick(g);}else for(let i=0;i<3;i++){g.player.y=705;tick(g);}
 g.keys.add('right');g.touches.set(1,'jump');g.api.jump();g.restart();
 assert.equal(g.api.state,'playing');assert.equal(g.api.lives,3);assert.equal(g.api.coinCount,0);assert.equal(g.api.camera,0);assert.equal(g.api.damageTimer,0);assert.equal(g.api.player.x,80);assert.equal(g.api.player.vx,0);assert.equal(g.api.player.vy,0);assert.equal(g.keys.size,0);assert.equal(g.touches.size,0);assert.ok(g.api.coins.every(c=>!c.collected));assert.equal(g.api.enemies[0].x,910);assert.equal(g.api.enemies[0].defeated,false);assert.equal(g.elements['end-screen'].hidden,true);tick(g);assert.equal(g.api.player.x,80);assert.equal(g.api.player.y,452);
 }
});
