const vm = require('node:vm');
const { gameClient } = require('../server');
module.exports = function harness() {
 const events = {}, elements = {}, documentEvents = {};
 const ctx = new Proxy({createLinearGradient:()=>({addColorStop(){}}),createRadialGradient:()=>({addColorStop(){}})}, { get: (o,k) => o[k] || (()=>{}), set: (o,k,v) => (o[k]=v,true) });
 const element = id => elements[id] ||= {textContent:'',hidden:true,style:{},classList:{toggle(name,value){this[name]=value}}, attributes:{}, setAttribute(name,value){this.attributes[name]=value}, listeners:{}, addEventListener(name,fn){this.listeners[name]=fn},focus(){},getContext:()=>ctx,getBoundingClientRect:()=>({width:960,height:600})};
 const window = {devicePixelRatio:1,addEventListener:(name,fn)=>events[name]=fn};
 const document = {getElementById:element,querySelectorAll:()=>[],addEventListener(name,fn){documentEvents[name]=fn},hidden:false};
 const source = gameClient.toString().replace("window.addEventListener('resize', resize);", `window.test = { update, frame, loseLife, restart, nextStage, loadStage, onEndButton, get enemies(){return enemies}, get guardian(){return guardian}, get lives(){return lives}, get damageTimer(){return damageTimer}, get state(){return state}, get solids(){return solids}, get movingPlatforms(){return movingPlatforms}, get stage(){return stage}, get stageIndex(){return stageIndex}, STAGES, get coins(){return coins}, get coinCount(){return coinCount}, get fragmentCount(){return fragmentCount}, keys, touches, clearInput, get player(){return player}, get camera(){return camera}, set camera(v){camera=v}, get viewWidth(){return viewWidth}, set viewWidth(v){viewWidth=v}, get pickups(){return pickups}, get shards(){return shards}, get shield(){return shield}, get leapTimer(){return leapTimer}, get checkpoint(){return checkpoint}, get dashCooldown(){return dashCooldown}, get dashTimer(){return dashTimer}, jump(){keys.add("jump");jumpQueued=true}, releaseJump(){keys.delete("jump");releaseJump()}, dash(){dashRequested=true} }; window.addEventListener('resize', resize);`);
 vm.runInNewContext('('+source+')()', {window,document,requestAnimationFrame(){},Math,Set,Map});
 return {...window.test, api:window.test, events,elements,document,documentEvents};
};
