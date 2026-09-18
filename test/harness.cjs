const vm = require('node:vm');
const { gameClient } = require('../server');
module.exports = function harness(options={}) {
 const events = {}, elements = {}, documentEvents = {};
 const ctx = new Proxy({createLinearGradient:()=>({addColorStop(){}}),createRadialGradient:()=>({addColorStop(){}})}, { get: (o,k) => o[k] || (()=>{}), set: (o,k,v) => (o[k]=v,true) });
 const element = id => elements[id] ||= {textContent:'',hidden:true,style:{},classList:{toggle(name,value){this[name]=value}}, attributes:{}, setAttribute(name,value){this.attributes[name]=value}, listeners:{}, addEventListener(name,fn){this.listeners[name]=fn},focus(){},getContext:()=>ctx,getBoundingClientRect:()=>({width:960,height:600})};
 const window = {localStorage:options.storage,confirm:()=>false,devicePixelRatio:1,addEventListener:(name,fn)=>events[name]=fn};
 const document = {getElementById:element,querySelectorAll:()=>[],addEventListener(name,fn){documentEvents[name]=fn},hidden:false};
 const source = gameClient.toString().replace("window.addEventListener('resize', resize);", `window.test = { closeMenu,openMenu,visitStage,saveProgress,resumeSaved,readSave, get highestStage(){return highestStage}, get completedStages(){return completedStages}, get obstacles(){return obstacles}, get gliding(){return gliding}, triggerAbility(){abilityRequested=true}, cycleCreature, selectCreature, get unlockedCreatures(){return unlockedCreatures}, get current(){return current}, get SPECIES(){return SPECIES}, update, frame, loseLife, restart, nextStage, loadStage, onEndButton, get lives(){return lives}, get damageTimer(){return damageTimer}, get state(){return state}, get solids(){return solids}, get stage(){return stage}, get stageIndex(){return stageIndex}, STAGES, get coins(){return coins}, get coinCount(){return coinCount}, get fragmentCount(){return fragmentCount}, get creatures(){return creatures}, keys, touches, clearInput, get player(){return player}, get camera(){return camera}, set camera(v){camera=v}, get viewWidth(){return viewWidth}, set viewWidth(v){viewWidth=v}, get shards(){return shards}, get checkpoint(){return checkpoint}, jump(){keys.add("jump");jumpQueued=true}, releaseJump(){keys.delete("jump");releaseJump()}, setDifficulty, get difficulty(){return difficulty}, DIFFICULTIES, DIFFICULTY_ORDER }; window.addEventListener('resize', resize);`);
 vm.runInNewContext('('+source+')()', {window,document,requestAnimationFrame(){},Math,Set,Map});
 if(!options.menu)window.test.closeMenu();
 return {...window.test, api:window.test, events,elements,document,documentEvents};
};
