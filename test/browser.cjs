const { chromium } = require('@playwright/test');
const assert = require('node:assert/strict');
const { app, page: html } = require('../server');
const base = process.env.TEST_URL || 'http://127.0.0.1:4318';
(async()=>{
 const server = process.env.TEST_URL ? null : app.listen(4318,'127.0.0.1');
 const browser = await chromium.launch({channel:process.env.PLAYWRIGHT_CHANNEL || 'chrome',headless:true});
 try {
  for(const mobile of [false,true]){
   const context=await browser.newContext({viewport:mobile?{width:390,height:844}:{width:1280,height:800},isMobile:mobile,hasTouch:mobile,deviceScaleFactor:mobile?2:1});
   const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.goto(base);await page.screenshot({path:'test-results/'+(mobile?'phone':'desktop')+'.png'});
   assert.equal(await page.locator('#lives').textContent(),'Lives: 3');
   if(mobile){assert.equal(await page.locator('[data-action=jump]').isVisible(),true);await page.setViewportSize({width:844,height:390});await page.screenshot({path:'test-results/phone-landscape.png'});}
   assert.deepEqual(errors,[]);await context.close();
  }
  // Expose internals only in the intercepted test page; the served game has no debug API.
  const page=await browser.newPage({viewport:{width:390,height:844},hasTouch:true,isMobile:true});
  await page.addInitScript(()=>{window.requestAnimationFrame=()=>1;});
  await page.route(base+'/',async route=>{
   const source=process.env.TEST_URL?await(await route.fetch()).text():html;
   await route.fulfill({contentType:'text/html',body:source.replace("window.addEventListener('resize', resize);", `window.test={update,restart,frame,get player(){return player},get enemies(){return enemies},get coins(){return coins},get lives(){return lives},get state(){return state},get camera(){return camera},get viewWidth(){return viewWidth},keys,touches};window.addEventListener('resize', resize);`)});
  });
  await page.goto(base);
  const step=n=>page.evaluate(n=>{for(let i=0;i<n;i++)window.test.update(1/120)},n);
  const snapshot=()=>page.evaluate(()=>({x:test.player.x,y:test.player.y,vy:test.player.vy,lives:test.lives,state:test.state,grounded:test.player.grounded,keys:test.keys.size,touches:test.touches.size}));
  await page.keyboard.down('d');await step(20);await page.keyboard.up('d');assert.ok((await snapshot()).x>120);
  await page.keyboard.down('Space');await step(1);await page.keyboard.up('Space');assert.ok((await snapshot()).vy<0);
  await page.evaluate(()=>test.restart());
  const cdp=await page.context().newCDPSession(page);
  const center=async selector=>{const b=await page.locator(selector).boundingBox();return{x:b.x+b.width/2,y:b.y+b.height/2}};
  const right=await center('[data-action=right]'),jump=await center('[data-action=jump]');
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{...right,id:1}]});await step(20);
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{...right,id:1},{...jump,id:2}]});await step(1);
  let s=await snapshot();assert.ok(s.x>120&&s.vy<0);assert.equal(s.touches,2);
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[{...right,id:1}]});assert.equal((await snapshot()).touches,1);
  await cdp.send('Input.dispatchTouchEvent',{type:'touchCancel',touchPoints:[]});assert.equal((await snapshot()).touches,0);const x=(await snapshot()).x;await step(10);assert.equal((await snapshot()).x,x);
  await page.keyboard.down('ArrowRight');await page.evaluate(()=>window.dispatchEvent(new Event('blur')));assert.equal((await snapshot()).keys,0);await page.keyboard.up('ArrowRight');
  await page.evaluate(()=>test.restart());
  // Traverse the entire actual level using only direction/jump key events.
  await page.keyboard.down('ArrowRight');
  let jumpDown=false;
  for(let i=0;i<2200;i++){
   const shouldJump=await page.evaluate(()=>{
    const p=test.player;if(!p.grounded)return false;
    return [620,1430,2220].some(edge=>edge-p.x>0&&edge-p.x<52)||test.enemies.some(e=>!e.defeated&&e.x>=p.x&&e.x-p.x<105);
   });
   if(shouldJump&&!jumpDown){await page.keyboard.down('Space');jumpDown=true;}
   else if(jumpDown){await page.keyboard.up('Space');jumpDown=false;}
   const before=await snapshot();await step(1);s=await snapshot();if(s.lives<before.lives)console.log('Life lost at',before);if(s.state!=='playing')break;
  }
  await page.keyboard.up('ArrowRight');await page.keyboard.up('Space');
  assert.equal(s.state,'won',JSON.stringify(s));assert.ok(s.lives>0);assert.equal(await page.locator('#end-title').textContent(),'You win!');
  await page.screenshot({path:'test-results/win.png'});await page.getByRole('button',{name:'Play again',exact:true}).click();s=await snapshot();assert.equal(s.x,80);assert.equal(s.lives,3);assert.equal(s.state,'playing');assert.equal(await page.locator('#coins').textContent(),'Coins: 0');
  for(let i=0;i<3;i++){await page.evaluate(()=>{test.player.y=705});await step(1);}
  assert.equal(await page.locator('#end-title').textContent(),'Game Over');await page.getByRole('button',{name:'Try again',exact:true}).click();assert.equal((await snapshot()).lives,3);assert.equal((await snapshot()).state,'playing');
  console.log('PASS: desktop and phone rendering; keyboard; real multi-touch hold/jump/release/cancel; blur; full keyboard playthrough; both restart buttons.');
 }finally{await browser.close();if(server)server.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
