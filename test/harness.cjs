const vm = require('node:vm');
const { gameClient } = require('../server');
module.exports = function harness() {
 const events = {}, elements = {};
 const ctx = new Proxy({}, { get: (o,k) => o[k] || (()=>{}), set: (o,k,v) => (o[k]=v,true) });
 const element = id => elements[id] ||= {textContent:'',hidden:true,style:{},classList:{toggle(){}}, addEventListener(){},focus(){},getContext:()=>ctx,getBoundingClientRect:()=>({width:960,height:600})};
 const window = {devicePixelRatio:1,addEventListener:(name,fn)=>events[name]=fn};
 const document = {getElementById:element,querySelectorAll:()=>[],addEventListener(){},hidden:false};
 const source = gameClient.toString().replace("window.addEventListener('resize', resize);", `window.test = { update, frame, loseLife, restart, get enemies(){return enemies}, get lives(){return lives}, get damageTimer(){return damageTimer}, get state(){return state}, solids, WORLD, get coins(){return coins}, get coinCount(){return coinCount}, keys, touches, clearInput, get player(){return player}, get camera(){return camera}, set camera(v){camera=v}, get viewWidth(){return viewWidth}, set viewWidth(v){viewWidth=v}, jump(){jumpQueued=true} }; window.addEventListener('resize', resize);`);
 vm.runInNewContext('('+source+')()', {window,document,requestAnimationFrame(){},Math,Set,Map});
 return {...window.test, api:window.test, events,elements};
};
