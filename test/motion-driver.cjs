// Traversal controller: reads geometry, issues movement/ability input only.
// No position writes, unlock injection, stage skipping, or admin actions.
module.exports = function(g){
 const a=g.api,p=a.player;
 if(a.damageTimer>0)throw Error("Damage at stage "+(a.stageIndex+1)+" x="+p.x);
 if(g.lastRouteStage===a.stageIndex&&p.x<g.lastRouteX-100)throw Error('Unexpected respawn at stage '+(a.stageIndex+1)+' x='+p.x);
 g.lastRouteStage=a.stageIndex;g.lastRouteX=p.x;
 if(a.stageIndex<18)return;
 const gap=a.obstacles.find(o=>o.type.endsWith('Gap')&&p.x<o.x+o.w&&p.x+p.w>o.x-65);
 const saw=a.obstacles.find(o=>o.type==='saw'&&o.x+o.w>p.x&&o.x-p.x-p.w<55);
 if(gap){
  if(gap.type==='grappleGap'){
   a.selectCreature('tether');if(!a.grapple&&p.grounded)a.triggerAbility();
  }else if(gap.type==='dashGap'){
   a.selectCreature('zip');
   if(p.grounded&&p.x+p.w>gap.x-12)a.jump();
   if(!p.grounded&&p.x>gap.x+20&&a.dashReady)a.triggerAbility();
  }else{
   a.selectCreature('tempo');
   const platform=a.obstacles.find(o=>o.type==='movingPlatform'&&o.originX>=gap.x&&o.originX<gap.x+gap.w);
   if(p.grounded&&p.x<gap.x){
    // Wait on safe shore for a centered ferry and a ready clock.
    if(p.x+p.w>gap.x-15){
     if(a.stasisCooldown>0||Math.abs(platform.x+platform.w/2-(gap.x+gap.w/2))>12)g.keys.delete('right');
     else{a.triggerAbility();a.jump();}
    }
   }else if(p.grounded&&p.x>=gap.x&&p.x+p.w>platform.x+platform.w-25)a.jump();
  }
 }else if(saw&&p.grounded){a.jump();}
};
