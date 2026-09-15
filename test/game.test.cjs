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
 const g=harness();tick(g);assert.equal(g.api.camera,0);g.player.x=1500;tick(g);assert.ok(g.api.camera>1000);g.player.x=g.WORLD.width-34;tick(g);assert.equal(g.api.camera,g.WORLD.width-g.api.viewWidth);
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
 for(const [start,end] of [[585,750],[1395,1580],[2225,2410],[3085,3290],[3925,4130],[4585,4810]]){
 const g=harness();g.player.x=start;g.keys.add('right');g.api.jump();let landed=false;
 for(let i=0;i<115;i++){tick(g);if(g.player.grounded&&g.player.x>=end){landed=true;break;}}
 assert.equal(landed,true,'gap ending '+end);assert.equal(g.api.lives,3);
 }
});
test('flag wins, stops motion and reports the collected coins',()=>{
 const g=harness();g.player.x=185;tick(g);g.player.x=g.WORLD.flagX-10;tick(g);assert.equal(g.api.state,'won');assert.equal(g.elements['end-title'].textContent,'Star delivered!');assert.match(g.elements['end-detail'].textContent,/Coins: 1\//);const x=g.player.x;g.keys.add('right');tick(g,120);assert.equal(g.player.x,x);
});
test('both endings restart all state without scheduling extra loops',()=>{
 for(const ending of ['won','gameover']){
 const g=harness();g.player.x=185;tick(g);g.api.enemies[0].defeated=true;
 if(ending==='won'){g.player.x=g.WORLD.flagX-10;tick(g);}else for(let i=0;i<3;i++){g.player.y=705;tick(g);}
 g.keys.add('right');g.touches.set(1,'jump');g.api.jump();g.restart();
 assert.equal(g.api.state,'playing');assert.equal(g.api.lives,3);assert.equal(g.api.coinCount,0);assert.equal(g.api.camera,0);assert.equal(g.api.damageTimer,0);assert.equal(g.api.player.x,80);assert.equal(g.api.player.vx,0);assert.equal(g.api.player.vy,0);assert.equal(g.keys.size,0);assert.equal(g.touches.size,0);assert.ok(g.api.coins.every(c=>!c.collected));assert.equal(g.api.enemies[0].x,910);assert.equal(g.api.enemies[0].defeated,false);assert.equal(g.elements['end-screen'].hidden,true);tick(g);assert.equal(g.api.player.x,80);assert.equal(g.api.player.y,452);
 }
});

test('safe checkpoints persist through falling and full restart clears them',()=>{
 const g=harness();g.player.x=1610;tick(g);assert.equal(g.api.checkpoint,0);g.player.y=705;tick(g);assert.equal(g.player.x,1610);assert.equal(g.player.y,452);g.api.restart();assert.equal(g.api.checkpoint,-1);assert.equal(g.api.player.x,80);
});
test('shield absorbs exactly one hit, does not protect against pits',()=>{
 const g=harness();g.player.x=1645;tick(g);assert.equal(g.api.shield,true);g.loseLife();assert.equal(g.api.lives,3);assert.equal(g.api.shield,false);tick(g,150);g.loseLife();assert.equal(g.api.lives,2);
 const pit=harness();pit.player.x=1645;tick(pit);pit.player.y=705;tick(pit);assert.equal(pit.api.lives,2);
});
test('Starleap grants one air jump, expires and resets on death',()=>{
 const g=harness();g.player.x=3380;tick(g);assert.ok(g.api.leapTimer>0);g.api.jump();tick(g,12);g.api.releaseJump();g.api.jump();tick(g);assert.ok(g.player.vy<-550);tick(g,5);const before=g.player.vy;g.api.jump();tick(g);assert.ok(g.player.vy>before);g.loseLife(true);assert.equal(g.api.leapTimer,0);
 const expiry=harness();expiry.player.x=3380;tick(expiry);expiry.player.x=3320;tick(expiry,1450);assert.equal(expiry.api.leapTimer,0);
});
test('jump release produces a short hop and coyote jump works just beyond ledge',()=>{
 const g=harness();g.api.jump();tick(g,8);const vy=g.player.vy;g.api.releaseJump();assert.ok(g.player.vy>vy);assert.ok(g.player.vy<0);
 const c=harness();c.player.x=617;c.keys.add('right');tick(c,5);assert.equal(c.player.grounded,false);c.api.jump();tick(c);assert.ok(c.player.vy<-600);
});
test('jump pressed shortly before landing is buffered',()=>{
 const g=harness();Object.assign(g.player,{x:100,y:439,vy:200,grounded:false});g.api.jump();tick(g,14);assert.ok(g.player.vy<0);assert.ok(g.player.y<452);
});
test('powerups and optional fragments fully reset',()=>{
 const g=harness();g.player.x=1645;tick(g);Object.assign(g.player,{x:1068,y:310,grounded:false});tick(g);assert.equal(g.api.shards[0].collected,true);g.restart();assert.equal(g.api.shield,false);assert.ok(g.api.pickups.every(p=>!p.taken));assert.ok(g.api.shards.every(p=>!p.collected));
});
