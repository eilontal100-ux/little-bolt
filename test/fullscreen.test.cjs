const {test}=require('node:test');
const assert=require('node:assert/strict');
const harness=require('./harness.cjs');

test('fullscreen button enters/exits native fullscreen and clears held movement',async()=>{
  const g=harness(),shell=g.elements['game-shell'],button=g.elements.fullscreen;
  shell.requestFullscreen=async()=>{g.document.fullscreenElement=shell};
  g.document.exitFullscreen=async()=>{g.document.fullscreenElement=null};
  g.keys.add('right');
  await button.listeners.click();
  assert.equal(g.document.fullscreenElement,shell);
  assert.equal(button.attributes['aria-pressed'],'true');
  assert.equal(g.keys.size,0);
  await button.listeners.click();
  assert.equal(button.attributes['aria-pressed'],'false');
});
test('native Escape fullscreenchange synchronizes button and canvas',async()=>{
  const g=harness(),shell=g.elements['game-shell'];
  shell.requestFullscreen=async()=>{g.document.fullscreenElement=shell};
  await g.elements.fullscreen.listeners.click();
  g.document.fullscreenElement=null;g.documentEvents.fullscreenchange();
  assert.equal(g.elements.fullscreen.textContent,'FULLSCREEN');
  assert.ok(g.elements.game.width>0);
});
test('unsupported fullscreen expands the game and Escape restores it',async()=>{
  const g=harness();await g.elements.fullscreen.listeners.click();
  assert.equal(g.elements['game-shell'].classList.expanded,true);
  g.events.keydown({code:'Escape'});
  assert.equal(g.elements['game-shell'].classList.expanded,false);
  assert.equal(g.elements.fullscreen.attributes['aria-pressed'],'false');
});
test('rejected fullscreen uses a reversible fallback; F ignores key repeats',async()=>{
  const g=harness();g.elements['game-shell'].requestFullscreen=async()=>{throw Error('denied')};
  await g.elements.fullscreen.listeners.click();
  assert.equal(g.elements['game-shell'].classList.expanded,true);
  g.events.keydown({code:'KeyF',repeat:true});
  assert.equal(g.elements['game-shell'].classList.expanded,true);
  g.events.keydown({code:'KeyF',repeat:false,preventDefault(){}});
  assert.equal(g.elements['game-shell'].classList.expanded,false);
});
