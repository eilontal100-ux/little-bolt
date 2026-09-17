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
   await page.goto(base);await page.locator('#menu-back').click();await page.screenshot({path:'test-results/'+(mobile?'phone':'desktop')+'.png'});
   assert.equal(await page.locator('#lives').textContent(),'Lives: 3');
   if(mobile){assert.equal(await page.locator('[data-action=jump]').isVisible(),true);const bounds=await page.locator('.touch-controls button').evaluateAll(bs=>bs.map(b=>{const r=b.getBoundingClientRect();return {left:r.left,right:r.right}}));for(let i=0;i<bounds.length;i++){assert.ok(bounds[i].left>=0&&bounds[i].right<=390);if(i)assert.ok(bounds[i].left>=bounds[i-1].right);}await page.setViewportSize({width:844,height:390});await page.screenshot({path:'test-results/phone-landscape.png'});}
   assert.deepEqual(errors,[]);await context.close();
  }
  // Expose internals only in the intercepted test page; the served game has no debug API.
  const page=await browser.newPage({viewport:{width:390,height:844},hasTouch:true,isMobile:true});
  await page.addInitScript(()=>{window.requestAnimationFrame=()=>1;});
  await page.route(base+'/',async route=>{
   const source=process.env.TEST_URL?await(await route.fetch()).text():html;
   await route.fulfill({contentType:'text/html',body:source.replace("window.addEventListener('resize', resize);", `window.test={update,restart,frame,get obstacles(){return obstacles},get current(){return current},get stage(){return stage},get stageIndex(){return stageIndex},get player(){return player},get coins(){return coins},get lives(){return lives},get state(){return state},get camera(){return camera},get viewWidth(){return viewWidth},keys,touches};window.addEventListener('resize', resize);`)});
  });
  await page.goto(base);
  await page.locator('#menu-back').click();
  const step=n=>page.evaluate(n=>{for(let i=0;i<n;i++)window.test.update(1/120)},n);
  const snapshot=()=>page.evaluate(()=>({x:test.player.x,y:test.player.y,vy:test.player.vy,lives:test.lives,state:test.state,grounded:test.player.grounded,keys:test.keys.size,touches:test.touches.size}));
  await page.keyboard.down('d');await step(20);await page.keyboard.up('d');assert.ok((await snapshot()).x>85);
  await page.keyboard.down('Space');await step(1);await page.keyboard.up('Space');assert.ok((await snapshot()).vy<0);
  await page.evaluate(()=>test.restart());
  const cdp=await page.context().newCDPSession(page);
  const center=async selector=>{const b=await page.locator(selector).boundingBox();return{x:b.x+b.width/2,y:b.y+b.height/2}};
  const right=await center('[data-action=right]'),jump=await center('[data-action=jump]');
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{...right,id:1}]});await step(20);
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{...right,id:1},{...jump,id:2}]});await step(1);
  let s=await snapshot();assert.ok(s.x>85&&s.vy<0);assert.equal(s.touches,2);
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[{...right,id:1}]});assert.equal((await snapshot()).touches,1);
  await cdp.send('Input.dispatchTouchEvent',{type:'touchCancel',touchPoints:[]});assert.equal((await snapshot()).touches,0);const x=(await snapshot()).x;await step(10);assert.equal((await snapshot()).x,x);
  await page.keyboard.down('ArrowRight');await page.evaluate(()=>window.dispatchEvent(new Event('blur')));assert.equal((await snapshot()).keys,0);await page.keyboard.up('ArrowRight');
  await page.evaluate(()=>test.restart());
  const ability=await center('[data-action=ability]');
  await page.evaluate(()=>{const rock=test.obstacles.find(o=>o.type==='rock');Object.assign(test.player,{x:rock.x-40,y:452,vy:0,grounded:true});});
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{...ability,id:3}]});await step(1);
  assert.equal(await page.evaluate(()=>test.obstacles.find(o=>o.type==='rock').solved),true);
  await cdp.send('Input.dispatchTouchEvent',{type:'touchCancel',touchPoints:[]});
  await page.evaluate(()=>test.restart());
  assert.equal(await page.evaluate(()=>test.current),'crag');
  assert.equal(await page.evaluate(()=>test.obstacles.find(o=>o.type==='rock').solved),false);
  console.log('PASS: desktop and phone rendering; keyboard; real multitouch movement/jump/release/cancel; blur; touch smash and restart. Campaign traversal is covered by npm test.');
 }finally{await browser.close();if(server)server.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
