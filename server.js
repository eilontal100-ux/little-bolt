'use strict';
const express = require('express');
const app = express();

// The entire browser game is embedded in this file. Coordinates are world units.
function gameClient() {
  'use strict';
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const SCENE = { width: 2400, height: 600, groundY: 500 };

  function mulberry32(seed){return function(){seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}

  const PAL = {
    forest:      { sky:['#070a1e','#0d1130','#181b3c'], ground:'#241a3d', mid:'#1a1330', deep:'#150f26', edge:'#8ff7de', glow:'#35e6c4', moss:'#1f6b5c', leaf:'#2c8a72', accent:'#35e6c4', hill:'#161d42', pillar:'#232a52' },
    ruins:       { sky:['#031522','#062230','#0a2f3c'], ground:'#12313a', mid:'#0c232a', deep:'#081a1f', edge:'#7cf0ff', glow:'#2fb8d9', moss:'#1f4a52', leaf:'#2f7d8f', accent:'#4fd0e0', hill:'#0d2530', pillar:'#173846' },
    canopy:      { sky:['#1a1030','#241542','#2e1a52'], ground:'#3a2350', mid:'#2b1a3d', deep:'#1e1230', edge:'#e0a6ff', glow:'#b96bff', moss:'#5c2f78', leaf:'#8446a8', accent:'#c77dff', hill:'#241638', pillar:'#3a2456' },
    observatory: { sky:['#05070f','#0a0e1e','#10152c'], ground:'#20243a', mid:'#171a2c', deep:'#0f1120', edge:'#ffd27a', glow:'#ffb84d', moss:'#3a3f5c', leaf:'#4c5480', accent:'#ffcf6b', hill:'#141830', pillar:'#242a48' },
    guardian:    { sky:['#170608','#240a0d','#2e0d10'], ground:'#3a1218', mid:'#2a0d12', deep:'#1c0810', edge:'#ff6b6b', glow:'#ff3b3b', moss:'#5c1a1a', leaf:'#7a2424', accent:'#ff5a5a', hill:'#220a0d', pillar:'#3a1418' }
  };

  /* --- precomputed decoration (computed once per stage load, not per frame) --- */
  function buildStars(seed){const rnd=mulberry32(seed);const a=[];for(let i=0;i<140;i++)a.push({x:rnd()*SCENE.width*1.4,y:rnd()*260,r:rnd()<0.15?1.8:0.9,phase:rnd()*10});return a;}
  function buildHills(seed,width){const rnd=mulberry32(seed);const a=[];let x=-200;while(x<width*1.3){const w=260+rnd()*180,peak=90+rnd()*70;a.push({x,w,peak});x+=w*0.62;}return a;}
  function buildCanopyBlobs(seed,width){
    const rnd=mulberry32(seed);const a=[];let x=-150;
    while(x<width*1.2){
      const baseY=250+rnd()*130,spread=100+rnd()*90,n=4+Math.floor(rnd()*4);
      const lobes=[];for(let i=0;i<n;i++)lobes.push({dx:(i-n/2)*spread*0.5+ (rnd()-0.5)*24,dy:(rnd()-0.5)*46,r:30+rnd()*36});
      a.push({x,baseY,lobes});
      x+=spread*1.15;
    }
    return a;
  }
  function buildVines(seed,width){const rnd=mulberry32(seed);const a=[];let x=80;while(x<width){a.push({x,len:60+rnd()*90,sway:rnd()*Math.PI*2,leaves:2+Math.floor(rnd()*3)});x+=220+rnd()*260;}return a;}
  function terrainTexture(seg){
    const rnd=mulberry32(Math.floor(seg.x)+1);
    const roots=[];for(let x=seg.x+14;x<seg.x+seg.w-14;x+=26+rnd()*14)roots.push({x,depth:14+rnd()*22,lean:(rnd()-0.5)*10});
    const tufts=[];for(let x=seg.x+6;x<seg.x+seg.w-6;x+=16+rnd()*10)tufts.push({x,h:5+rnd()*9});
    return {roots,tufts};
  }

  const ART = {};

  // ---- screen-space (parallax) ----
  ART.drawSky = function(ctx, view, t, pal){
    for(let i=0;i<3;i++){ctx.fillStyle=pal.sky[i];ctx.fillRect(0,i*view.h/3,view.w,view.h/3+1);}
  };
  ART.drawStars = function(ctx, view, camera, t, stars){
    for(const s of stars){
      const x = ((s.x - camera*0.05) % (view.w+60) + view.w+60) % (view.w+60);
      if(s.y>view.h) continue;
      const tw = 0.55+0.45*Math.sin(t*1.4+s.phase);
      ctx.globalAlpha = tw; ctx.fillStyle='#dfe6ff'; ctx.beginPath(); ctx.arc(x,s.y,s.r,0,Math.PI*2); ctx.fill();
    }
    ctx.globalAlpha=1;
  };
  ART.drawMoon = function(ctx, view, t){
    const mx = view.w*0.76, my = 96;
    const halo = ctx.createRadialGradient(mx,my,10,mx,my,120);
    halo.addColorStop(0,'#f6ead055'); halo.addColorStop(1,'#f6ead000');
    ctx.fillStyle=halo; ctx.beginPath(); ctx.arc(mx,my,120,0,Math.PI*2); ctx.fill();
    ctx.fillStyle='#f6ead0'; ctx.beginPath(); ctx.arc(mx,my,46,0,Math.PI*2); ctx.fill();
    ctx.fillStyle='#0d1130'; ctx.beginPath(); ctx.arc(mx+16,my-10,40,0,Math.PI*2); ctx.fill();
    ctx.save(); ctx.globalAlpha=0.05+0.02*Math.sin(t*0.6);
    const shaft = ctx.createLinearGradient(mx,my,mx-70,Math.min(view.h,600));
    shaft.addColorStop(0,'#f6ead0'); shaft.addColorStop(1,'#f6ead000');
    ctx.fillStyle=shaft; ctx.beginPath(); ctx.moveTo(mx-30,my); ctx.lineTo(mx+30,my); ctx.lineTo(mx+120,Math.min(view.h,600)); ctx.lineTo(mx-220,Math.min(view.h,600)); ctx.closePath(); ctx.fill();
    ctx.restore();
  };
  ART.drawFarHills = function(ctx, view, camera, pal, hills){
    ctx.fillStyle=pal.hill;
    for(const h of hills){
      const x = h.x - camera*0.12;
      if(x+h.w<0 || x>view.w) continue;
      ctx.beginPath(); ctx.moveTo(x,SCENE.groundY);
      ctx.quadraticCurveTo(x+h.w*0.5, SCENE.groundY-h.peak, x+h.w, SCENE.groundY);
      ctx.fill();
    }
  };
  ART.drawArchitectureBackdrop = function(ctx, x, camera, scale, t, pal){
    const sx = x - camera*0.22;
    const gy = SCENE.groundY;
    ctx.save(); ctx.translate(sx, gy); ctx.scale(scale, scale);
    ctx.fillStyle=pal.pillar;
    ctx.fillRect(-90,-190,26,190); ctx.fillRect(64,-230,26,230);
    ctx.beginPath(); ctx.moveTo(-64,-190); ctx.quadraticCurveTo(-14,-270,90,-230); ctx.lineTo(90,-206); ctx.quadraticCurveTo(-14,-244,-64,-166); ctx.closePath(); ctx.fill();
    ctx.globalAlpha=0.5+0.25*Math.sin(t*1.1+x); ctx.fillStyle=pal.accent;
    ctx.fillRect(-6,-150,4,60); ctx.globalAlpha=1;
    ctx.restore();
  };
  ART.drawCanopyMid = function(ctx, view, camera, t, pal, blobs){
    for(const tree of blobs){
      const x=Math.floor((tree.x-camera*0.45)/4)*4;
      ctx.fillStyle=pal.pillar;ctx.fillRect(x,280,12,230);
      for(let i=0;i<5;i++){
        const y=190+i*36,w=40+i*24;
        ctx.fillStyle=i%2?pal.moss:pal.hill;ctx.fillRect(x-w/2,y,w,32);
        ctx.fillStyle=pal.leaf;ctx.fillRect(x-w/2,y,Math.max(8,w/3),4);
      }
    }
  };
  ART.drawWaterBand = function(ctx, view, camera, t, pal){
    const y = SCENE.groundY + 8;
    ctx.save();
    const g = ctx.createLinearGradient(0,y,0,view.h);
    g.addColorStop(0,pal.glow+'33'); g.addColorStop(1,pal.deep+'55');
    ctx.fillStyle=g; ctx.fillRect(0,y,view.w,view.h-y);
    ctx.strokeStyle=pal.edge+'55'; ctx.lineWidth=2;
    for(let i=0;i<6;i++){const ry=y+16+i*14+Math.sin(t*0.6+i)*3;ctx.beginPath();ctx.moveTo(0,ry);for(let x=0;x<view.w;x+=40)ctx.lineTo(x,ry+Math.sin(t*1.2+x*0.02+i)*2);ctx.stroke();}
    ctx.restore();
  };
  ART.drawWindStreaks = function(ctx, view, camera, t, pal){
    ctx.save(); ctx.strokeStyle=pal.accent+'44'; ctx.lineWidth=2;
    for(let i=0;i<9;i++){
      const speed=40+i*6;
      const x=((i*260 + t*speed*6 - camera*0.3) % (view.w+240)) - 120;
      const y=60+i*38;
      ctx.beginPath(); ctx.moveTo(x,y); ctx.lineTo(x+70,y+10); ctx.stroke();
    }
    ctx.restore();
  };
  ART.drawObservatoryRings = function(ctx, view, camera, t, pal){
    const cx=view.w*0.5 - camera*0.08, cy=140;
    ctx.save(); ctx.strokeStyle=pal.accent+'33'; ctx.lineWidth=2;
    for(let i=1;i<=3;i++){ctx.beginPath();ctx.ellipse(cx,cy,90*i,26*i,0.3,0,Math.PI*2);ctx.stroke();}
    ctx.restore();
  };
  ART.drawFogBand = function(ctx, view, camera, t, pal){
    const y = SCENE.groundY - 40 + Math.sin(t*0.3)*4;
    const g = ctx.createLinearGradient(0,y-30,0,y+30);
    g.addColorStop(0,pal.deep+'00'); g.addColorStop(0.5,pal.accent+'14'); g.addColorStop(1,pal.deep+'00');
    ctx.fillStyle=g; ctx.fillRect(0,y-30,view.w,60);
  };
  ART.drawForegroundVines = function(ctx, view, camera, t, pal, vines){
    ctx.strokeStyle=pal.deep; ctx.lineWidth=5; ctx.lineCap='round';
    for(const v of vines){
      const x = v.x - camera*1.08;
      if(x<-30||x>view.w+30) continue;
      const sway = Math.sin(t*0.8+v.sway)*10;
      ctx.beginPath(); ctx.moveTo(x,-4); ctx.quadraticCurveTo(x+sway,v.len*0.6, x+sway*0.6, v.len);
      ctx.stroke();
      for(let i=0;i<v.leaves;i++){
        ctx.fillStyle=pal.moss;
        const ly = v.len*0.35*(i+1);
        ctx.beginPath(); ctx.ellipse(x+sway*(i/v.leaves), ly, 8,5, sway*0.05, 0, Math.PI*2); ctx.fill();
      }
    }
  };

  // ---- world-space (call inside ctx.translate(-camera,0)) ----
  ART.drawTerrainGround = function(ctx, s, t, pal){
    ctx.fillStyle=pal.ground; ctx.fillRect(s.x, s.y, s.w, s.h);
    ctx.fillStyle=pal.mid; ctx.fillRect(s.x, s.y+38, s.w, s.h-38);
    ctx.fillStyle=pal.deep; ctx.fillRect(s.x, s.y+78, s.w, s.h-78);
    ctx.save();
    ctx.shadowColor=pal.glow; ctx.shadowBlur=10;
    ctx.fillStyle=pal.edge; ctx.fillRect(s.x, s.y-2, s.w, 4);
    ctx.restore();
    ctx.fillStyle=pal.moss; ctx.fillRect(s.x, s.y+2, s.w, 5);
    ctx.strokeStyle=pal.deep+'99'; ctx.lineWidth=3;
    for(const r of s.tex.roots){ ctx.beginPath(); ctx.moveTo(r.x,s.y+8); ctx.quadraticCurveTo(r.x+r.lean,s.y+r.depth*0.6, r.x+r.lean*1.6, s.y+r.depth); ctx.stroke(); }
    for(const tf of s.tex.tufts){
      ctx.fillStyle=pal.leaf;
      ctx.beginPath();
      ctx.moveTo(tf.x-5,s.y+1);
      ctx.quadraticCurveTo(tf.x-3,s.y-tf.h, tf.x, s.y-tf.h*0.7);
      ctx.quadraticCurveTo(tf.x+3,s.y-tf.h, tf.x+5,s.y+1);
      ctx.quadraticCurveTo(tf.x,s.y-tf.h*0.25, tf.x-5,s.y+1);
      ctx.fill();
    }
  };
  ART.drawTerrainPlatform = function(ctx, s, t, pal){
    ctx.fillStyle=pal.ground; ctx.fillRect(s.x, s.y, s.w, s.h);
    ctx.save(); ctx.shadowColor=pal.glow; ctx.shadowBlur=8;
    ctx.fillStyle=pal.edge; ctx.fillRect(s.x, s.y-2, s.w, 3);
    ctx.restore();
    ctx.fillStyle=pal.deep; ctx.fillRect(s.x+6, s.y+s.h, s.w-12, 4);
  };
  ART.drawMovingPlatform = function(ctx, s, t, pal){
    ctx.fillStyle=pal.mid; ctx.fillRect(s.x, s.y, s.w, s.h);
    ctx.save(); ctx.shadowColor=pal.accent; ctx.shadowBlur=12;
    ctx.fillStyle=pal.accent; ctx.fillRect(s.x, s.y-2, s.w, 3); ctx.fillRect(s.x, s.y+s.h-1, s.w, 3);
    ctx.restore();
    for(let x=s.x+6;x<s.x+s.w-4;x+=10){ctx.fillStyle=pal.accent+'55';ctx.fillRect(x,s.y+s.h*0.4,3,s.h*0.3);}
  };

  ART.drawCollectibleCoin = function(ctx, x, y, t){
    const by = y + Math.sin(t*3+x)*3;
    ctx.save(); ctx.translate(x,by);
    ctx.fillStyle='#7a5a2a55'; ctx.beginPath(); ctx.arc(0,4,11,0,Math.PI*2); ctx.fill();
    ctx.fillStyle='#654d35'; ctx.beginPath(); ctx.arc(0,0,12,0,Math.PI*2); ctx.fill();
    const g = ctx.createRadialGradient(-3,-3,1,0,0,10);
    g.addColorStop(0,'#fff2c4'); g.addColorStop(1,'#ffcf6b');
    ctx.fillStyle=g; ctx.beginPath(); ctx.arc(0,0,9,0,Math.PI*2); ctx.fill();
    const shine = ((t*60+x)%40)/40;
    ctx.globalAlpha = shine<0.5? (0.6-shine):0;
    ctx.strokeStyle='#fffef0'; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(-9+shine*18,-9); ctx.lineTo(-3+shine*18,9); ctx.stroke();
    ctx.restore();
  };
  ART.drawCollectibleShard = function(ctx, x, y, t){
    ctx.save(); ctx.translate(x,y);
    const pulse = 0.7+0.3*Math.sin(t*2.4);
    ctx.globalAlpha = pulse*0.5;
    ctx.fillStyle='#7c6bff'; ctx.beginPath(); ctx.arc(0,0,22,0,Math.PI*2); ctx.fill();
    ctx.globalAlpha=1;
    ctx.rotate(Math.sin(t*0.8)*0.15);
    ctx.fillStyle='#cdb8ff';
    ctx.beginPath(); ctx.moveTo(0,-16); ctx.lineTo(9,-2); ctx.lineTo(5,16); ctx.lineTo(-5,16); ctx.lineTo(-9,-2); ctx.closePath(); ctx.fill();
    ctx.fillStyle='#efe6ffcc';
    ctx.beginPath(); ctx.moveTo(0,-16); ctx.lineTo(9,-2); ctx.lineTo(0,2); ctx.closePath(); ctx.fill();
    ctx.restore();
  };

  ART.drawBeetle = function(ctx, x, y, facing, t){
    ctx.save(); ctx.translate(x,y); ctx.scale(facing,1);
    const legPhase = t*10;
    ctx.strokeStyle='#241633'; ctx.lineWidth=3; ctx.lineCap='round';
    for(let i=0;i<3;i++){
      const swing = Math.sin(legPhase+i*2)*6;
      ctx.beginPath(); ctx.moveTo(-8+i*8,6); ctx.lineTo(-8+i*8+swing,16); ctx.stroke();
    }
    const shellGrad = ctx.createLinearGradient(-16,-14,16,10);
    shellGrad.addColorStop(0,'#b23fae'); shellGrad.addColorStop(1,'#3a1f52');
    ctx.fillStyle=shellGrad;
    ctx.beginPath(); ctx.ellipse(0,-2,17,13,0,0,Math.PI*2); ctx.fill();
    ctx.strokeStyle='#241633'; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(0,-14); ctx.lineTo(0,10); ctx.stroke();
    ctx.fillStyle='#ffffff33'; ctx.beginPath(); ctx.ellipse(-6,-8,6,3,-0.4,0,Math.PI*2); ctx.fill();
    ctx.fillStyle='#ff5a5a'; ctx.beginPath(); ctx.arc(12,-4,2.6,0,Math.PI*2); ctx.fill();
    ctx.strokeStyle='#ff5a5a55'; ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(13,-9); ctx.lineTo(19,-15); ctx.stroke();
    ctx.restore();
  };
  ART.drawDrone = function(ctx, x, y, t, alert){
    ctx.save(); ctx.translate(x,y);
    if(alert){
      const beam = ctx.createLinearGradient(0,10,0,150);
      beam.addColorStop(0,'#66f0ff55'); beam.addColorStop(1,'#66f0ff00');
      ctx.fillStyle=beam; ctx.beginPath(); ctx.moveTo(-4,10); ctx.lineTo(4,10); ctx.lineTo(26,150); ctx.lineTo(-26,150); ctx.closePath(); ctx.fill();
    }
    for(const dx of [-14,14]){
      ctx.save(); ctx.translate(dx,-6); ctx.rotate(t*18);
      ctx.strokeStyle='#9aa2bb99'; ctx.lineWidth=2;
      ctx.beginPath(); ctx.moveTo(-9,0); ctx.lineTo(9,0); ctx.stroke();
      ctx.restore();
      ctx.strokeStyle='#394158'; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(dx*0.5,0); ctx.lineTo(dx,-6); ctx.stroke();
    }
    const body = ctx.createLinearGradient(-13,-10,13,10);
    body.addColorStop(0,'#4a5170'); body.addColorStop(1,'#2a3046');
    ctx.fillStyle=body;
    ctx.beginPath();
    for(let i=0;i<6;i++){const a=i*Math.PI/3;const px=Math.cos(a)*14,py=Math.sin(a)*10;i===0?ctx.moveTo(px,py):ctx.lineTo(px,py);}
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = (Math.sin(t*8)>0)?'#ff5a5a':'#7a2a2a';
    ctx.beginPath(); ctx.arc(0,0,3,0,Math.PI*2); ctx.fill();
    ctx.fillStyle='#66f0ffaa'; ctx.fillRect(-6,5,12,3);
    ctx.restore();
  };

  ART.drawGuardian = function(ctx, g, t, phase){
    ctx.save(); ctx.translate(g.x+g.w/2, g.y+g.h/2);
    const glowColor = phase==='telegraph' ? '#ff5a5a' : phase==='attack' ? '#ff2b2b' : phase==='vulnerable' ? '#7cf0ff' : '#8a2f3a';
    ctx.save(); ctx.globalAlpha=0.35+0.2*Math.sin(t*6);
    const halo = ctx.createRadialGradient(0,0,10,0,0,g.w*0.9);
    halo.addColorStop(0,glowColor+'aa'); halo.addColorStop(1,glowColor+'00');
    ctx.fillStyle=halo; ctx.beginPath(); ctx.arc(0,0,g.w*0.9,0,Math.PI*2); ctx.fill();
    ctx.restore();
    const bodyGrad = ctx.createLinearGradient(-g.w/2,-g.h/2,g.w/2,g.h/2);
    bodyGrad.addColorStop(0,'#4a1820'); bodyGrad.addColorStop(1,'#1c0810');
    ctx.fillStyle=bodyGrad;
    ctx.beginPath();
    for(let i=0;i<6;i++){const a=i*Math.PI/3+t*0.15;const px=Math.cos(a)*g.w*0.48,py=Math.sin(a)*g.h*0.48;i===0?ctx.moveTo(px,py):ctx.lineTo(px,py);}
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle=glowColor; ctx.lineWidth=3; ctx.stroke();
    ctx.fillStyle=glowColor;
    ctx.beginPath(); ctx.arc(0,0,phase==='vulnerable'?14:8,0,Math.PI*2); ctx.fill();
    ctx.restore();
  };

  ART.drawRobotCourier = function(ctx, x, y, facing, pose, t){
    ctx.save(); ctx.translate(x,y); ctx.scale(facing,1);
    const bob = pose==='idle' ? Math.sin(t*2.4)*2 : pose==='run' ? Math.abs(Math.sin(t*11))*3 : 0;
    const legPhase = t*13;
    const squash = pose==='jump' ? 0.9 : 1;
    ctx.translate(0,bob);

    const trail = pose==='run'?1:pose==='jump'?1.4:0.5;
    ctx.fillStyle='#ff9d5c';
    ctx.beginPath();
    ctx.moveTo(-6,-2);
    ctx.quadraticCurveTo(-18-8*trail, 2+Math.sin(t*9)*4, -30-14*trail, 8+Math.sin(t*7)*6);
    ctx.quadraticCurveTo(-20-8*trail, 10+Math.sin(t*9)*4, -10,6);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle='#7a3f22';
    ctx.beginPath();
    ctx.moveTo(-8,0); ctx.quadraticCurveTo(-20-9*trail, 4+Math.sin(t*9+1)*4, -32-16*trail, 12+Math.sin(t*7+1)*6);
    ctx.lineWidth=3; ctx.strokeStyle='#7a3f22'; ctx.stroke();

    ctx.strokeStyle='#123f38'; ctx.lineWidth=7; ctx.lineCap='round';
    if(pose==='run'){
      const s1=Math.sin(legPhase)*11, s2=Math.sin(legPhase+Math.PI)*11;
      ctx.beginPath(); ctx.moveTo(-6,30); ctx.lineTo(-6+s1,44); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(6,30); ctx.lineTo(6+s2,44); ctx.stroke();
    } else if(pose==='jump'){
      ctx.beginPath(); ctx.moveTo(-6,30); ctx.lineTo(-10,40); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(6,30); ctx.lineTo(10,40); ctx.stroke();
    } else {
      ctx.beginPath(); ctx.moveTo(-6,30); ctx.lineTo(-6,44); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(6,30); ctx.lineTo(6,44); ctx.stroke();
    }

    ctx.scale(1,squash);
    const chassis = ctx.createLinearGradient(-14,-4,14,26);
    chassis.addColorStop(0,'#3df0cf'); chassis.addColorStop(1,'#159085');
    ctx.fillStyle=chassis;
    roundRect(ctx,-15,-4,30,32,8); ctx.fill();
    ctx.fillStyle='#0e2a26'; roundRect(ctx,-13,4,26,14,4); ctx.fill();
    ctx.fillStyle='#ffcf6b'; roundRect(ctx,-6,20,12,6,2); ctx.fill();

    ctx.fillStyle='#10263a'; roundRect(ctx,-14,-28,28,26,10); ctx.fill();
    const visor = ctx.createLinearGradient(-10,-22,10,-8);
    visor.addColorStop(0,'#eafcff'); visor.addColorStop(1,'#7cf0ff');
    ctx.fillStyle=visor; roundRect(ctx,-10,-22,20,12,5); ctx.fill();
    ctx.fillStyle='#ffffffcc';
    ctx.beginPath(); ctx.arc(-2+facing*0,-17+ (pose==='jump'?-2:0),2.4,0,Math.PI*2); ctx.fill();
    ctx.strokeStyle='#0e2a26'; ctx.lineWidth=3; ctx.beginPath(); ctx.moveTo(0,-28); ctx.lineTo(0,-34); ctx.stroke();
    ctx.fillStyle='#ffcf6b'; ctx.beginPath(); ctx.arc(0,-35,2.6,0,Math.PI*2); ctx.fill();

    ctx.strokeStyle='#159085'; ctx.lineWidth=6; ctx.lineCap='round';
    const armSwing = pose==='run'?Math.sin(legPhase+Math.PI)*14:pose==='jump'?-10:0;
    ctx.beginPath(); ctx.moveTo(13,2); ctx.lineTo(19,14+armSwing*0.2); ctx.stroke();
    ctx.restore();
  };

  function roundRect(ctx,x,y,w,h,r){
    ctx.beginPath();
    ctx.moveTo(x+r,y);
    ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r);
    ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r);
    ctx.closePath();
  }

  // Hand-authored sprite grids share one four-world-unit pixel scale.
  function sprite(rows,x,y,colors,unit=4,flip=false){
    const w=rows[0].length*unit;
    rows.forEach((row,j)=>[...row].forEach((c,i)=>{
      if(colors[c]){ctx.fillStyle=colors[c];ctx.fillRect(Math.round(x+(flip?w-(i+1)*unit:i*unit)),Math.round(y+j*unit),unit,unit);}
    }));
  }
  ART.drawRobotCourier = function(ctx,x,y,facing,pose,t){
    const step=pose==='run'&&Math.floor(t*10)%2;
    const rows=['...oooo...','..otttto..','..owwwwo..','..otttto..','...oooo...','.rrrrrrr..','ooottttooo','otttttttoo','ootggttoo.','..otttto..','..oooooo..',pose==='jump'?'.oo....oo.':step?'..oo..oo..':'..oo..oo..',pose==='jump'?'..........':step?'.ooo..oo..':'..oo..ooo.'];
    ctx.save();ctx.translate(x,y-20);ctx.scale(0.85,48/52);
    sprite(rows,-20,0,{o:'#10162c',t:'#42cbb5',w:'#e2fff0',r:'#ed7853',g:'#ffe08a'},4,facing<0);
    ctx.restore();
    ctx.fillStyle='#ed7853';ctx.fillRect(x+(facing<0?12:-36),y+4+(step?4:0),20,4);
  };
  ART.drawBeetle = function(ctx,x,y,facing,t){
    sprite(['..ooooo..','.opppppo.','opphhpppo','oppppppro','.ooooooo.',Math.floor(t*8)%2?'oo..oo.oo':'.oo.oo.oo'],x-18,y-12,{o:'#18152e',p:'#9951a9',h:'#df89ce',r:'#ffe08a'},4,facing<0);
  };
  ART.drawDrone = function(ctx,x,y,t,alert){
    sprite(['ooo...ooo','...ooo...','..ottto..','.ottwtto.','..ooooo..','...o.o...'],x-18,y-12,{o:'#17172f',t:'#6b96b4',w:alert?'#ff765e':'#ffdf87'});
  };
  ART.drawCollectibleCoin = function(ctx,x,y,t){
    sprite(['.ooo.','oyywo','oyywo','oyyyo','.ooo.'],x-10,y-10+Math.floor(Math.sin(t*3+x)*2)*2,{o:'#9d632d',y:'#ffc75b',w:'#fff0b3'});
  };
  ART.drawCollectibleShard = function(ctx,x,y,t){
    sprite(['...w...','..wvw..','.wvvvw.','wvvvvvw','.wvvvw.','..wvw..','...w...'],x-14,y-14,{w:'#e6d5ff',v:'#a080e8'});
  };
  ART.drawGuardian = function(ctx,g,t,phase){
    const light=phase==='vulnerable'?'#7cf0ff':phase==='attack'?'#ff463e':phase==='telegraph'?'#ffbd69':'#c16983';
    ctx.save();ctx.translate(Math.round(g.x),Math.round(g.y));ctx.scale(g.w/48,g.h/48);
    sprite(['..o.o..o.o..','..orroorro..','..orrrrrro..','.orrhhhhrro.','oorrrrrrrroo','orrrllllrrro','orrrllllrrro','oorrrrrrrroo','.orrhhhhrro.','..orrrrrro..','..ooo..ooo..','.oooo..oooo.'],0,0,{o:'#160e25',r:'#633047',h:'#97506b',l:light});
    ctx.restore();
    if(phase==='telegraph'){ctx.fillStyle=light;ctx.fillRect(g.x+g.w/2-3,g.y-24,6,12);ctx.fillRect(g.x+g.w/2-3,g.y-8,6,4);}
  };
  ART.drawTerrainGround = function(ctx,s,t,pal){
    ctx.fillStyle=pal.deep;ctx.fillRect(s.x,s.y,s.w,s.h);
    for(let y=s.y+8;y<s.y+s.h;y+=20)for(let x=s.x;x<s.x+s.w;x+=32){
      ctx.fillStyle=(Math.floor((x-s.x)/32+(y-s.y)/20)%3)?pal.ground:pal.mid;
      ctx.fillRect(x+2,y,Math.min(28,s.x+s.w-x-2),16);
      ctx.fillStyle=pal.pillar;ctx.fillRect(x+4,y+2,Math.min(8,s.x+s.w-x-4),2);
    }
    ctx.fillStyle=pal.edge;ctx.fillRect(s.x,s.y,s.w,4);
    ctx.fillStyle=pal.moss;ctx.fillRect(s.x,s.y+4,s.w,6);
    for(let x=s.x+8;x<s.x+s.w-8;x+=24){ctx.fillStyle=pal.leaf;ctx.fillRect(x,s.y+4,8,8);}
  };
  ART.drawTerrainPlatform = function(ctx,s,t,pal){
    ctx.fillStyle=pal.deep;ctx.fillRect(s.x,s.y,s.w,s.h);
    ctx.fillStyle=pal.edge;ctx.fillRect(s.x,s.y,s.w,4);
    for(let x=s.x+4;x<s.x+s.w-4;x+=16){ctx.fillStyle=pal.pillar;ctx.fillRect(x,s.y+6,Math.min(12,s.x+s.w-x),Math.max(2,s.h-8));}
  };

  /* ---------------- Campaign / stage data ---------------- */
  function layout(lengths, gap){
    let x=0; const segs=[];
    for(const w of lengths){ segs.push({x,w}); x += w+gap; }
    return { segs, end: x-gap };
  }

  function buildStage(opts){
    const { segs, end } = layout(opts.groundLengths, 150);
    const groundSolids = segs.map(s=>({x:s.x,y:500,w:s.w,h:100}));
    const platformSolids = (opts.platforms||[]).map(([x,y,w])=>({x,y,w,h:22}));
    const solids = [...groundSolids, ...platformSolids];
    solids.forEach(s=>{ s.tex = terrainTexture(s); });
    const width = opts.arena ? opts.arenaWidth : end + 400;
    return {
      name: opts.name,
      palette: PAL[opts.palette],
      decor: opts.decor,
      width,
      arena: !!opts.arena,
      groundEnd: end,
      spawn: opts.spawn || { x: segs[0].x + 46, y: 452 },
      solids,
      segs,
      movingPlatforms: (opts.moving||[]).map(m=>({ x0:m.x, y0:m.y, x:m.x, y:m.y, w:m.w, h:22, axis:m.axis, range:m.range, speed:m.speed, phase:0, dx:0, dy:0 })),
      coinStarts: opts.coins || [],
      shardStarts: opts.shards || [],
      pickupStarts: opts.pickups || [],
      checkpointStarts: opts.checkpoints || [],
      beetleStarts: opts.beetles || [],
      droneStarts: opts.drones || [],
      flagX: opts.arena ? null : end - 70,
      stars: buildStars(opts.seed), hills: buildHills(opts.seed+1,width), blobs: buildCanopyBlobs(opts.seed+2,width), vines: buildVines(opts.seed+3,width),
    };
  }

  const STAGES = [
    buildStage({
      name:'Whispering Forest', palette:'forest', decor:'forest', seed:1,
      groundLengths:[560,520,480],
      platforms:[[150,390,150],[790,390,140],[960,320,100],[1430,390,130]],
      moving:[{x:1130,y:420,w:70,axis:'y',range:-100,speed:1.1}],
      coins:[[210,465],[300,355],[400,355],[600,390],[830,355],[1000,285],[1100,465],[1460,355],[1600,465],[1720,465]],
      shards:[[1000,285]],
      pickups:[{x:780,y:450,type:'shield'}],
      checkpoints:[730],
      beetles:[{x:300,min:260,max:480,dir:1}],
      drones:[{x:850,y:350,min:790,max:930,dir:1}],
    }),
    buildStage({
      name:'Flooded Ruins', palette:'ruins', decor:'ruins', seed:11,
      groundLengths:[520,540,560],
      platforms:[[160,390,140],[420,320,90],[820,390,150],[1000,320,110],[1470,390,140],[1470,260,90]],
      moving:[{x:660,y:340,w:80,axis:'x',range:120,speed:0.9}],
      coins:[[220,465],[350,355],[470,285],[860,355],[1040,285],[1120,285],[1520,465],[1650,355],[1750,465],[1900,465]],
      shards:[[1500,225]],
      pickups:[{x:900,y:450,type:'leap'}],
      checkpoints:[790],
      beetles:[{x:1650,min:1630,max:1790,dir:1}],
      drones:[{x:1080,y:350,min:1000,max:1180,dir:-1}],
    }),
    buildStage({
      name:'Wind Canopy', palette:'canopy', decor:'canopy', seed:21,
      groundLengths:[540,500,540],
      platforms:[[150,390,140],[760,390,150],[960,320,100],[1420,390,140]],
      moving:[{x:1090,y:350,w:80,axis:'y',range:-160,speed:0.8},{x:330,y:280,w:80,axis:'x',range:160,speed:0.7}],
      coins:[[210,465],[300,355],[860,355],[1040,285],[1480,355],[1620,465],[1750,465],[1880,465]],
      shards:[[370,245]],
      pickups:[{x:820,y:450,type:'shield'}],
      checkpoints:[770],
      beetles:[{x:1650,min:1600,max:1750,dir:1}],
      drones:[{x:1000,y:340,min:950,max:1110,dir:1}],
    }),
    buildStage({
      name:'Star Observatory', palette:'observatory', decor:'observatory', seed:31,
      groundLengths:[560,560,560],
      platforms:[[170,390,150],[400,320,90],[800,390,150],[1440,390,140],[1440,320,90]],
      moving:[{x:1000,y:340,w:90,axis:'x',range:170,speed:0.85}],
      coins:[[230,465],[360,355],[420,285],[850,355],[1500,355],[1500,285],[1650,465],[1780,465],[1900,465]],
      shards:[[1490,225]],
      pickups:[{x:840,y:450,type:'leap'}],
      checkpoints:[810],
      beetles:[{x:1700,min:1630,max:1820,dir:1}],
      drones:[{x:1080,y:350,min:1010,max:1180,dir:-1}],
    }),
    buildStage({
      name:'Guardian Spire', palette:'guardian', decor:'guardian', seed:41,
      arena:true, arenaWidth:1400,
      groundLengths:[1400],
      spawn:{x:70,y:452},
      checkpoints:[560],
      beetles:[], drones:[], coins:[], shards:[], pickups:[],
    }),
  ];
  const totalCoins = STAGES.reduce((n,s)=>n+s.coinStarts.length,0);
  const totalShards = STAGES.reduce((n,s)=>n+s.shardStarts.length,0);

  let stageIndex = 0, stage = STAGES[0];
  let player = { x:0, y:0, w:34, h:48, vx:0, vy:0, grounded:true, facing:1, riding:null };
  let camera = 0, viewWidth = 960, viewHeight = 600;
  let solids = [], movingPlatforms = [];
  let coins = [], coinCount = 0, fragmentCount = 0;
  let enemies = [];
  let guardian = null;
  let lives = 3, damageTimer = 0, state = 'playing';
  let checkpointStarts = [], checkpoint = -1, spawn = { x:0, y:0 };
  let shield = false, leapTimer = 0, airJumpUsed = false;
  let coyoteTimer = 0, jumpBufferTimer = 0, jumpCut = false, elapsed = 0, toastTimer = 0;
  let pickups = [], shards = [];
  let particles = [];
  let dashCooldown = 0, dashTimer = 0, dashRequested = false;
  const STEP = 1 / 120, SPEED = 280, GRAVITY = 1800, JUMP = 680;
  const DASH_SPEED = 760, DASH_TIME = 0.16, DASH_COOLDOWN = 0.9;

  function burst(x,y,color,n=10) {
    for(let i=0;i<n;i++) {const a=i/n*Math.PI*2;particles.push({x,y,vx:Math.cos(a)*90,vy:Math.sin(a)*90-35,life:0.55,color});}
    if(particles.length>180)particles.splice(0,particles.length-180);
  }
  function toast(message) {document.getElementById('toast').textContent=message;toastTimer=2.8;}
  function overlaps(a, b) { return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y; }
  const keys = new Set();
  const touches = new Map();
  let jumpQueued = false;
  function held(action) { return keys.has(action) || [...touches.values()].includes(action); }

  function loadStage(index) {
    stageIndex = index; stage = STAGES[index];
    solids = stage.solids;
    movingPlatforms = stage.movingPlatforms.map(m=>({...m}));
    coins = stage.coinStarts.map(([x,y]) => ({x,y,collected:false}));
    shards = stage.shardStarts.map(([x,y]) => ({x,y,collected:false}));
    pickups = stage.pickupStarts.map(p=>({...p,taken:false}));
    checkpointStarts = stage.checkpointStarts;
    checkpoint = -1;
    spawn = { ...stage.spawn };
    enemies = [
      ...stage.beetleStarts.map(e => ({...e,type:'beetle',w:34,h:28,defeated:false,y:472})),
      ...stage.droneStarts.map(e => ({...e,type:'drone',w:34,h:28,defeated:false})),
    ];
    guardian = stage.arena ? {
      x: stage.width/2 - 40, y: 390, w:80, h:110,
      arenaMin: 60, arenaMax: stage.width-60,
      baseX: stage.width/2 - 40,
      phase:'idle', timer:2.2, vx:0, hits:0, maxHits:3, attackDir:1,
    } : null;
    shield = false; leapTimer = 0; airJumpUsed = false; damageTimer = 0;
    coyoteTimer = 0; jumpBufferTimer = 0; jumpCut = false; toastTimer = 0; particles = [];
    dashCooldown = 0; dashTimer = 0; dashRequested = false;
    player = { ...spawn, w:34, h:48, vx:0, vy:0, grounded:true, facing:1, riding:null };
    camera = 0;
    clearInput(); physicalKeys.clear(); previousTime = null; accumulator = 0;
    document.getElementById('coins').textContent = 'Coins: ' + coinCount;
    document.getElementById('lives').textContent = 'Lives: ' + lives;
    updateHud(); canvas.focus();
  }

  function updateHud() {
    document.getElementById('shards').textContent='✦ '+fragmentCount+'/'+totalShards;
    document.getElementById('shield').textContent=shield?'⬡ Shield ready':'⬡ Shield —';
    document.getElementById('leap').textContent=leapTimer>0?'✧ Double jump '+leapTimer.toFixed(1)+'s':'✧ Double jump —';
    document.getElementById('shield').classList.toggle('active',shield);
    document.getElementById('leap').classList.toggle('active',leapTimer>0);
    const pct = stage.arena ? Math.floor((guardian? guardian.hits/guardian.maxHits*100:0)) : Math.min(100,Math.floor(player.x/(stage.flagX||1)*100));
    document.querySelectorAll('[data-action=dash]').forEach(b=>{b.textContent=dashCooldown>0?dashCooldown.toFixed(1)+'s':'DASH';});
    document.getElementById('route').textContent='0'+(stageIndex+1)+' · '+stage.name.toUpperCase()+'  /  '+pct+'%';
    document.getElementById('progress').style.width=pct+'%';
    document.getElementById('toast').style.opacity=String(Math.min(1,toastTimer));
  }
  function releaseJump() {if(!held('jump') && player.vy<0 && !jumpCut){player.vy*=0.45;jumpCut=true;}}

  function update(dt) {
    if (state !== 'playing') return;
    const p = player;
    const pal = stage.palette;
    elapsed += dt; toastTimer=Math.max(0,toastTimer-dt); leapTimer=Math.max(0,leapTimer-dt);
    dashCooldown=Math.max(0,dashCooldown-dt); if(dashTimer>0)dashTimer=Math.max(0,dashTimer-dt);
    particles=particles.filter(q=>{q.life-=dt;q.x+=q.vx*dt;q.y+=q.vy*dt;q.vy+=180*dt;return q.life>0;});
    coyoteTimer=p.grounded?0.1:Math.max(0,coyoteTimer-dt);
    jumpBufferTimer=jumpQueued?0.12:Math.max(0,jumpBufferTimer-dt);
    if(p.grounded)airJumpUsed=false;
    damageTimer = Math.max(0, damageTimer - dt);
    const previousBottom = p.y + p.h;

    let carryDX=0, carryDY=0;
    for(const mp of movingPlatforms){
      const prevX=mp.x, prevY=mp.y;
      mp.phase += dt;
      const s=(1-Math.cos(mp.phase*mp.speed))/2;
      if(mp.axis==='x') mp.x = mp.x0 + s*mp.range; else mp.y = mp.y0 + s*mp.range;
      mp.dx = mp.x-prevX; mp.dy = mp.y-prevY;
      if(p.riding===mp){ carryDX+=mp.dx; carryDY+=mp.dy; }
    }
    if(carryDX||carryDY){ p.x+=carryDX; p.y+=carryDY; }

    if(dashRequested && dashCooldown<=0 && dashTimer<=0){
      dashTimer=DASH_TIME; dashCooldown=DASH_COOLDOWN; burst(p.x+17,p.y+24,pal.accent,14);
    }
    dashRequested=false;

    if(dashTimer>0){ p.vx = p.facing*DASH_SPEED; }
    else { p.vx = (Number(held('right')) - Number(held('left'))) * SPEED; if (p.vx) p.facing = Math.sign(p.vx); }

    if(jumpBufferTimer>0 && (coyoteTimer>0 || (leapTimer>0 && !airJumpUsed))) {
      const extra=coyoteTimer<=0;
      p.vy=extra?-580:-JUMP;p.grounded=false;coyoteTimer=0;jumpBufferTimer=0;jumpCut=false;
      if(extra){airJumpUsed=true;burst(p.x+17,p.y+48,'#fff2c4');}
      if(!held('jump')) {p.vy*=0.45;jumpCut=true;}
    }
    jumpQueued = false;
    p.x += p.vx * dt;
    p.riding = null;
    for (const s of solids) if (overlaps(p, s)) {
      if (p.vx > 0) p.x = s.x - p.w;
      else if (p.vx < 0) p.x = s.x + s.w;
      p.vx = 0;
    }
    for (const mp of movingPlatforms) if (overlaps(p, mp)) {
      if (p.vx > 0) p.x = mp.x - p.w;
      else if (p.vx < 0) p.x = mp.x + mp.w;
      p.vx = 0;
    }
    p.x = Math.max(0, Math.min(stage.width - p.w, p.x));
    p.vy = Math.min(900, p.vy + GRAVITY * dt);
    p.y += p.vy * dt;
    const landingSpeed=p.vy;
    p.grounded = false;
    for (const s of solids) if (overlaps(p, s)) {
      if (p.vy > 0) { p.y = s.y - p.h; p.grounded = true; }
      else if (p.vy < 0) p.y = s.y + s.h;
      p.vy = 0;
    }
    for (const mp of movingPlatforms) if (overlaps(p, mp)) {
      if (p.vy > 0) { p.y = mp.y - p.h; p.grounded = true; p.riding = mp; }
      else if (p.vy < 0) p.y = mp.y + mp.h;
      p.vy = 0;
    }
    if(p.grounded && landingSpeed>200)burst(p.x+17,p.y+48,pal.edge,5);
    if (p.y > SCENE.height + 100) { loseLife(true); return; }
    updateCamera();
    for (const coin of coins) if (!coin.collected && overlaps(p, {x:coin.x-10,y:coin.y-10,w:20,h:20})) {
      coin.collected = true; coinCount++; burst(coin.x,coin.y,'#ffcf6b',7);
      document.getElementById('coins').textContent = 'Coins: ' + coinCount;
    }
    for(let i=0;i<checkpointStarts.length;i++) if(i>checkpoint && overlaps(p,{x:checkpointStarts[i],y:410,w:24,h:90})) {
      checkpoint=i;spawn={x:checkpointStarts[i],y:452};burst(p.x,450,pal.edge,18);toast('Beacon saved · respawn here');
    }
    for(const item of pickups) if(!item.taken && overlaps(p,{x:item.x-16,y:item.y-16,w:32,h:32})) {
      item.taken=true;if(item.type==='shield'){shield=true;toast('Shield ready · absorbs one enemy hit');}else{leapTimer=12;airJumpUsed=false;toast('Starleap · press jump again in the air');}
      burst(item.x,item.y,item.type==='shield'?pal.edge:'#ffcf6b',16);
    }
    for(const shard of shards) if(!shard.collected && overlaps(p,{x:shard.x-13,y:shard.y-13,w:26,h:26})) {
      shard.collected=true;fragmentCount++;burst(shard.x,shard.y,'#b9abff',16);toast('Star fragment found · '+fragmentCount+' / '+totalShards);
    }
    updateHud();

    if(stage.arena) {
      updateGuardian(dt, p, previousBottom);
      if(state!=='playing') return;
    } else {
      for (const enemy of enemies) {
        if (enemy.defeated) continue;
        enemy.x += enemy.dir * 60 * dt;
        if (enemy.x >= enemy.max) { enemy.x = enemy.max; enemy.dir = -1; }
        if (enemy.x <= enemy.min) { enemy.x = enemy.min; enemy.dir = 1; }
        if (!overlaps(p, enemy)) continue;
        if (p.vy > 0 && previousBottom <= enemy.y + 1 && p.y + p.h >= enemy.y) {
          enemy.defeated = true; burst(enemy.x+17,enemy.y,'#ff6b57'); p.y = enemy.y - p.h; p.vy = -420; p.grounded = false;
        } else if (damageTimer === 0) { loseLife(); return; }
      }
      if (overlaps(p, {x:stage.flagX,y:310,w:20,h:190})) finishStage();
    }
  }

  function updateGuardian(dt, p, previousBottom) {
    const g = guardian; if (!g) return;
    g.timer -= dt;
    if (g.phase === 'idle') {
      g.x = g.baseX + Math.sin(elapsed*1.2)*20;
      if (g.timer <= 0) { g.phase='telegraph'; g.timer=0.9; g.attackDir = p.x < g.x ? -1 : 1; }
    } else if (g.phase === 'telegraph') {
      if (g.timer <= 0) { g.phase='attack'; g.y=444;g.h=56; g.timer=0.55; g.vx=g.attackDir*520; }
    } else if (g.phase === 'attack') {
      g.x += g.vx*dt;
      g.x = Math.max(g.arenaMin, Math.min(g.arenaMax-g.w, g.x));
      if (overlaps(p,g) && damageTimer===0) { hurtByGuardian(); if(state!=='playing') return; }
      if (g.timer <= 0) { g.phase='vulnerable';g.y=390;g.h=110; g.timer=1.6; g.vx=0; }
    } else if (g.phase === 'vulnerable') {
      if (overlaps(p,g) && p.vy>0 && previousBottom <= g.y + 1 && p.y + p.h >= g.y) {
        g.hits++; burst(g.x+g.w/2,g.y,'#ff5a5a',22); p.vy=-420; p.grounded=false;
        g.phase='recover'; g.timer=0.5;
        if (g.hits >= g.maxHits) { finish('won'); return; }
      } else if (g.timer <= 0) { g.phase='recover'; g.timer=0.4; }
    } else if (g.phase === 'recover') {
      if (g.timer <= 0) { g.phase='idle'; g.timer=1.1; g.baseX = g.arenaMin + (g.arenaMax-g.arenaMin)/2 - g.w/2; }
    }
  }
  function hurtByGuardian() {
    loseLife();
    if(state==='playing'){guardian.phase='idle';guardian.y=390;guardian.h=110;guardian.timer=1;guardian.vx=0;}
  }

  function finish(nextState) {
    state = nextState; clearInput(); physicalKeys.clear();
    player.vx = 0; player.vy = 0;
    document.getElementById('end-title').textContent = state === 'won' ? 'The Guardian falls — star delivered!' : 'Signal lost';
    document.getElementById('end-detail').textContent = state === 'won' ? 'Campaign complete. Coins: ' + coinCount + '/' + totalCoins + ' · Fragments: ' + fragmentCount + '/' + totalShards : 'The journey is waiting. Take a breath and try again.';
    document.getElementById('restart').textContent = state === 'won' ? 'Play again' : 'Try again';
    document.getElementById('end-screen').hidden = false;
    document.getElementById('restart').focus();
  }
  function finishStage() {
    state = 'stageComplete'; clearInput(); physicalKeys.clear();
    player.vx = 0; player.vy = 0;
    document.getElementById('end-title').textContent = 'Stage clear — ' + stage.name;
    document.getElementById('end-detail').textContent = 'Coins: ' + coinCount + '/' + totalCoins + ' · Fragments: ' + fragmentCount + '/' + totalShards;
    document.getElementById('restart').textContent = 'Next Stage →';
    document.getElementById('end-screen').hidden = false;
    document.getElementById('restart').focus();
  }
  function nextStage() {
    document.getElementById('end-screen').hidden = true;
    loadStage(stageIndex + 1);
    state = 'playing';
  }
  function restart() {
    lives = 3; coinCount = 0; fragmentCount = 0; state = 'playing';
    document.getElementById('end-screen').hidden = true;
    loadStage(0);
  }
  function onEndButton() {
    if (state === 'stageComplete') nextStage(); else restart();
  }
  function loseLife(fell = false) {
    if (state !== 'playing' || (!fell && damageTimer > 0)) return;
    if(!fell && shield){shield=false;damageTimer=1.2;burst(player.x+17,player.y+24,'#7cf0ff',18);toast('Shield absorbed the hit');updateHud();return;}
    leapTimer=0;airJumpUsed=false;coyoteTimer=0;jumpBufferTimer=0;
    lives--; document.getElementById('lives').textContent = 'Lives: ' + lives;
    clearInput(); physicalKeys.clear();
    if (lives === 0) { finish('gameover'); return; }
    Object.assign(player, spawn, {vx:0,vy:0,grounded:true,facing:1,riding:null});
    dashTimer=0; shield=false;
    damageTimer = 1; updateCamera();
  }
  function updateCamera() { camera = Math.max(0, Math.min(stage.width - viewWidth, player.x + player.w / 2 - viewWidth * 0.35)); }
  const keyActions = { ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right', Space: 'jump', KeyW: 'jump', ShiftLeft: 'dash', ShiftRight: 'dash', KeyX: 'dash' };
  const physicalKeys = new Set();
  window.addEventListener('keydown', event => {
    if(event.code==='KeyF'&&!event.repeat){event.preventDefault();toggleFullscreen();return;}
    if(event.code==='Escape'&&expanded){setExpanded(false);return;}
    const action = keyActions[event.code]; if (!action) return;
    if (state !== 'playing') return;
    event.preventDefault();
    if (action === 'jump' && !physicalKeys.has(event.code) && !held('jump')) jumpQueued = true;
    if (action === 'dash' && !physicalKeys.has(event.code)) dashRequested = true;
    physicalKeys.add(event.code); keys.add(action);
  });
  window.addEventListener('keyup', event => {
    const action = keyActions[event.code]; if (!action) return;
    event.preventDefault(); physicalKeys.delete(event.code);
    if (![...physicalKeys].some(code => keyActions[code] === action)) keys.delete(action);
    if(action==='jump')releaseJump();
  });
  let previousTime = null, accumulator = 0;
  function frame(time) {
    if (previousTime !== null) accumulator += Math.min((time - previousTime) / 1000, 0.1);
    previousTime = time;
    while (accumulator >= STEP) { update(STEP); accumulator -= STEP; }
    draw(); requestAnimationFrame(frame);
  }
  window.addEventListener('blur', () => { clearInput(); physicalKeys.clear(); previousTime = null; accumulator = 0; });
  document.addEventListener('visibilitychange', () => { clearInput(); physicalKeys.clear(); previousTime = null; accumulator = 0; });
  function clearInput() {
    keys.clear(); touches.clear(); jumpQueued = false; jumpBufferTimer=0; dashRequested=false; releaseJump();
    document.querySelectorAll('[data-action]').forEach(button => button.classList.toggle('pressed',false));
  }
  for (const button of document.querySelectorAll('[data-action]')) {
    button.addEventListener('pointerdown', event => {
      event.preventDefault(); if (state !== 'playing') return;
      const action = button.dataset.action;
      if (action === 'jump' && !held('jump')) jumpQueued = true;
      if (action === 'dash') dashRequested = true;
      touches.set(event.pointerId, action); button.setPointerCapture(event.pointerId);
      button.classList.toggle('pressed',true);
    });
    const release = event => {
      event.preventDefault(); touches.delete(event.pointerId); releaseJump();
      button.classList.toggle('pressed',[...touches.values()].includes(button.dataset.action));
    };
    button.addEventListener('pointerup',release);
    button.addEventListener('pointercancel',release);
    button.addEventListener('lostpointercapture',release);
    button.addEventListener('contextmenu',event => event.preventDefault());
  }
  function resize() {
    const rect = canvas.getBoundingClientRect();

    const scale = Math.min(rect.width / 600, rect.height / SCENE.height);
    viewWidth = Math.min(stage.width, rect.width / scale);
    viewHeight = viewWidth * rect.height / rect.width;
    canvas.width = Math.round(viewWidth / 2);
    canvas.height = Math.round(viewHeight / 2);
    ctx.imageSmoothingEnabled = false;
    updateCamera();
    draw();
  }
  function rect(x, y, w, h, color) { ctx.fillStyle = color; ctx.fillRect(x, y, w, h); }
  function circle(x, y, r, color) { ctx.fillStyle = color; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); }
  function label(text, x, y, size, color) { ctx.fillStyle = color; ctx.font = '600 ' + size + 'px monospace'; ctx.fillText(text, x, y); }
  function drawRobot() {
    const p = player;
    if(shield){ctx.strokeStyle='#7cf0ff';ctx.lineWidth=2;ctx.beginPath();ctx.arc(p.x+17,p.y+24,34,0,Math.PI*2);ctx.stroke();}
    ctx.save();ctx.translate(p.x+p.w/2,p.y+20);ctx.scale(1,1);
    ART.drawRobotCourier(ctx,0,0,p.facing,!p.grounded?'jump':p.vx?'run':'idle',elapsed);ctx.restore();
  }
  function star(x,y,r,color) {
    ctx.fillStyle=color;ctx.beginPath();for(let i=0;i<10;i++){const a=i*Math.PI/5-Math.PI/2,rr=i%2?r*0.45:r;const px=x+Math.cos(a)*rr,py=y+Math.sin(a)*rr;if(i===0)ctx.moveTo(px,py);else ctx.lineTo(px,py);}ctx.closePath();ctx.fill();
  }
  function draw() {
    const pal = stage.palette;
    const offsetY = Math.max(0,(viewHeight-SCENE.height)*0.42);
    ctx.setTransform(canvas.width/viewWidth,0,0,canvas.height/viewHeight,0,offsetY*canvas.height/viewHeight);
    rect(0,-offsetY,viewWidth,viewHeight,pal.sky[1]);
    const view={w:viewWidth,h:viewHeight};
    ART.drawSky(ctx,view,elapsed,pal);ART.drawStars(ctx,view,camera,elapsed,stage.stars);ART.drawMoon(ctx,view,elapsed);
    ART.drawFarHills(ctx,view,camera,pal,stage.hills);
    for(const x of [stage.width*0.3,stage.width*0.65])ART.drawArchitectureBackdrop(ctx,x,camera,1,elapsed,pal);
    if(stage.decor==='ruins') ART.drawWaterBand(ctx,view,camera,elapsed,pal);
    else if(stage.decor==='canopy') ART.drawWindStreaks(ctx,view,camera,elapsed,pal);
    else if(stage.decor==='observatory') ART.drawObservatoryRings(ctx,view,camera,elapsed,pal);
    else ART.drawCanopyMid(ctx,view,camera,elapsed,pal,stage.blobs);
    ART.drawFogBand(ctx,view,camera,elapsed,pal);
    ctx.save();ctx.translate(-camera,0);
    for(const solid of solids){
      if(solid.x+solid.w<camera-60||solid.x>camera+viewWidth+60)continue;
      if(solid.h===100)ART.drawTerrainGround(ctx,solid,elapsed,pal);
      else ART.drawTerrainPlatform(ctx,solid,elapsed,pal);
    }
    for(const mp of movingPlatforms) ART.drawMovingPlatform(ctx,mp,elapsed,pal);
    for(let i=0;i<checkpointStarts.length;i++){
      const x=checkpointStarts[i],col=i<=checkpoint?pal.edge:'#59627c';rect(x,410,24,90,'#26334e');rect(x+4,416,16,62,col);circle(x+12,407,9,col);label('BEACON',x-14,392,10,col);
    }
    for(const item of pickups)if(!item.taken){const y=item.y+Math.sin(elapsed*3+item.x)*4;circle(item.x,y,22,'#26304d');if(item.type==='shield'){ctx.strokeStyle=pal.edge;ctx.lineWidth=3;ctx.beginPath();for(let i=0;i<7;i++){const a=i*Math.PI/3;ctx.lineTo(item.x+Math.cos(a)*14,y+Math.sin(a)*14);}ctx.stroke();}else star(item.x,y,16,'#ffcf6b');label(item.type==='shield'?'SHIELD':'DOUBLE JUMP',item.x-34,y-31,10,'#f2ecff');}
    for(const coin of coins)if(!coin.collected)ART.drawCollectibleCoin(ctx,coin.x,coin.y,elapsed);
    for(const shard of shards)if(!shard.collected)ART.drawCollectibleShard(ctx,shard.x,shard.y,elapsed);
    for(const e of enemies)if(!e.defeated){ if(e.type==='drone') ART.drawDrone(ctx,e.x+17,e.y+14,elapsed,Math.abs(player.x-e.x)<220); else ART.drawBeetle(ctx,e.x+17,e.y+14,e.dir,elapsed); }
    if(stage.arena && guardian){ ART.drawGuardian(ctx,guardian,elapsed,guardian.phase); label('GUARDIAN '+(guardian.maxHits-guardian.hits)+' / '+guardian.maxHits,guardian.x-25,guardian.y-45,14,'#fff2c4'); label(guardian.phase==='vulnerable'?'STOMP NOW':guardian.phase==='telegraph'?'CHARGE INCOMING':guardian.phase.toUpperCase(),guardian.x-35,guardian.y-23,11,'#7cf0ff'); }
    if(!stage.arena){
      rect(stage.flagX-32,482,86,18,'#687087');rect(stage.flagX-20,462,62,20,'#343955');rect(stage.flagX+2,324,14,138,pal.accent+'22');circle(stage.flagX+9,344,31,pal.accent+'22');star(stage.flagX+9,344,22,pal.accent);label('NEXT STAGE',stage.flagX-90,290,13,'#fff2c4');
    }
    ctx.globalAlpha = dashTimer>0 ? 0.7 : (damageTimer>0?0.55+Math.sin(damageTimer*30)*0.2:1);drawRobot();ctx.globalAlpha=1;
    for(const q of particles){ctx.globalAlpha=Math.min(1,q.life*2);rect(q.x,q.y,4,4,q.color);}ctx.globalAlpha=1;
    ctx.restore();
  }
  const fullscreenButton=document.getElementById('fullscreen');
  const gameShell=document.getElementById('game-shell');
  let expanded=false;
  function syncFullscreen(){
    const active=!!document.fullscreenElement||expanded;
    fullscreenButton.textContent=active?'EXIT FULLSCREEN':'FULLSCREEN';
    fullscreenButton.setAttribute('aria-pressed',String(active));
    clearInput();physicalKeys.clear();resize();
  }
  function setExpanded(value){
    expanded=value;gameShell.classList.toggle('expanded',value);syncFullscreen();
  }
  async function toggleFullscreen(){
    try{
      if(document.fullscreenElement){await document.exitFullscreen();}
      else if(expanded){setExpanded(false);}
      else if(gameShell.requestFullscreen){await gameShell.requestFullscreen();}
      else {setExpanded(true);toast('Expanded view · browser controls may remain visible');}
    }catch(error){setExpanded(true);toast('Expanded view · native fullscreen is unavailable');}
    syncFullscreen();
  }
  fullscreenButton.addEventListener('click',toggleFullscreen);
  document.addEventListener('fullscreenchange',syncFullscreen);
  window.addEventListener('resize', resize);
  document.getElementById('restart').addEventListener('click', onEndButton);
  loadStage(0);
  resize();
  requestAnimationFrame(frame);
}
const page = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>Moonlight Courier — bring the light home</title>
<style>
*{box-sizing:border-box}html,body{margin:0;width:100%;height:100%;overflow:hidden;background:#f6efd9;color:#244941;font-family:system-ui,sans-serif}body{display:flex;align-items:center;justify-content:center}main{position:relative;width:100%;height:100%;max-width:1600px;max-height:1000px}canvas{display:block;width:100%;height:100%}.hud{position:absolute;left:24px;right:24px;top:max(20px,env(safe-area-inset-top));display:flex;justify-content:space-between;gap:12px;pointer-events:none}.brand{font-size:13px;font-weight:800;letter-spacing:3px}.stats{display:flex;gap:22px;font-size:16px;font-weight:750}.help{position:absolute;bottom:22px;left:24px;font-size:13px;color:#fff4dc}
.overlay{position:absolute;inset:0;display:grid;place-items:center;background:#09182c77;backdrop-filter:blur(5px);z-index:3}.overlay[hidden]{display:none}.card{width:min(88%,380px);background:#fff9e8;border:1px solid #e8d8b7;border-radius:24px;padding:36px;text-align:center;box-shadow:0 20px 70px #09182c30}.card h1{font-size:40px;letter-spacing:-2px;margin:8px 0 12px}.card p{line-height:1.6}.card button{background:#247e71;color:white;border:0;border-radius:12px;padding:16px 32px;font:750 16px system-ui;cursor:pointer}.card button:focus-visible{outline:3px solid #d28c36;outline-offset:4px}
.touch-controls{display:none;position:absolute;bottom:max(20px,env(safe-area-inset-bottom));left:max(20px,env(safe-area-inset-left));right:max(20px,env(safe-area-inset-right));justify-content:space-between;pointer-events:none;user-select:none;-webkit-user-select:none}.directions,.actions{display:flex;gap:12px}.touch-controls button{width:72px;height:72px;border:2px solid #f6efd9aa;border-radius:20px;background:#244941e8;color:#fff5d8;font:750 28px system-ui;pointer-events:auto;touch-action:none;-webkit-touch-callout:none}.touch-controls .jump{width:88px;font-size:15px;background:#247e71}.touch-controls .dash{width:72px;font-size:13px;background:#7a3f22}.touch-controls button.pressed{background:#cf8850;transform:translateY(2px)}html,body,canvas{overscroll-behavior:none}canvas{touch-action:none;outline:none}@media(pointer:coarse),(max-width:760px){.touch-controls{display:flex}.help{display:none}.brand{font-size:11px;letter-spacing:2px}.stats{font-size:15px;gap:14px}.hud{left:18px;right:18px}}@media(max-height:450px){.touch-controls{bottom:12px}.touch-controls button{height:58px;width:64px;border-radius:16px}.hud{top:12px}}

html,body{background:#0d1130;color:#f2ecff}.hud{padding:14px 18px;background:#111a35dc;border:1px solid #637da333;border-radius:14px;align-items:center}.brand{font-size:12px;letter-spacing:2px}.stats{font-size:14px;gap:18px}#coins{color:#ffcf6b}#lives{color:#7cf0ff}.journey{position:absolute;top:max(90px,calc(env(safe-area-inset-top) + 76px));left:42px;font-size:10px;letter-spacing:1.5px;color:#b7c3dd;pointer-events:none}.track{margin:10px 0;width:220px;height:3px;background:#38405c}#progress{height:3px;background:#7cf0ff}.powers{display:flex;gap:16px;letter-spacing:0;font-size:12px}.chip{color:#8791ac}.chip.active{color:#7cf0ff}#shards{color:#c7bcff}#toast{position:absolute;top:180px;left:50%;transform:translateX(-50%);width:max-content;max-width:90%;padding:10px 16px;background:#192a42ed;border:1px solid #7cf0ff55;border-radius:10px;text-align:center;font-size:13px;pointer-events:none}.help{color:#a6b7ce}.card{background:#151b36;border-color:#7cf0ff55;box-shadow:0 20px 70px #0008}.card h1{font-size:36px;letter-spacing:-1px}.card p{color:#b7c3dd}.card button{background:#7cf0ff;color:#0d1130}.overlay{background:#080f26bb}.touch-controls button{background:#192a42ed;border-color:#7cf0ff66;color:#dffbff}.touch-controls .jump{background:#32647a}.touch-controls .dash{background:#7a4a32}.touch-controls button.pressed{background:#458b94}@media(max-width:760px){.hud{padding:12px;left:12px;right:12px;gap:8px}.brand{font-size:9px;letter-spacing:1px;max-width:105px}.stats{font-size:12px;gap:12px}.journey{left:25px;top:90px}.powers{gap:12px;font-size:11px}#toast{top:162px;font-size:12px}}@media(max-height:450px){.journey{top:75px}.powers{font-size:10px}.track{margin:6px 0}#toast{top:115px}.hud{top:10px}.card{padding:20px}}
@media(max-width:420px){.touch-controls{left:12px;right:12px}.directions,.actions{gap:8px}.touch-controls button{width:58px;height:62px}.touch-controls .dash{width:58px}.touch-controls .jump{width:70px}}
/* Pixel-art presentation: nearest-neighbor scene, crisp interface borders. */
canvas{image-rendering:pixelated;image-rendering:crisp-edges}
html,body,button,.card button{font-family:ui-monospace,SFMono-Regular,Consolas,monospace}
.hud,.card,.card button,.touch-controls button,#toast{border-radius:0;box-shadow:4px 4px 0 #060b1c;border-width:2px}
.overlay{backdrop-filter:none}.brand{letter-spacing:2px}.track,#progress{height:4px}
#fullscreen{position:absolute;right:24px;top:max(88px,calc(env(safe-area-inset-top) + 74px));z-index:5;background:#17233e;color:#dffbff;border:2px solid #7cf0ff88;padding:10px 12px;font:700 11px ui-monospace,monospace;cursor:pointer;touch-action:manipulation;box-shadow:3px 3px #060b1c}
#fullscreen:focus-visible{outline:3px solid #ffcf6b;outline-offset:3px}main:fullscreen,main.expanded{width:100vw;height:100dvh;max-width:none;max-height:none;background:#0d1130}main.expanded{position:fixed;inset:0;z-index:10}@media(max-width:760px){#fullscreen{right:12px;font-size:9px;padding:9px 7px}}@media(max-height:450px){#fullscreen{top:74px}}
</style></head><body><main id="game-shell" aria-label="Moonlight Courier game">
<button id="fullscreen" type="button" aria-label="Toggle fullscreen" aria-pressed="false">FULLSCREEN</button>
<canvas id="game" tabindex="-1" aria-label="A robot platformer. Move with A and D or arrow keys; jump with Space or W; dash with Shift or X."></canvas>
<header class="hud"><span class="brand">MOONLIGHT COURIER</span><div class="stats"><span id="coins">Coins: 0</span><span id="lives">Lives: 3</span></div></header>
<div class="journey"><span id="route"></span><div class="track"><div id="progress"></div></div><div class="powers"><span id="shards">✦ 0/0</span><span class="chip" id="shield"></span><span class="chip" id="leap"></span></div></div><div id="toast" role="status"></div>
<div class="help">← → / A D &nbsp; Move &nbsp; · &nbsp; Space / W &nbsp; Hold for a high jump &nbsp; · &nbsp; Shift / X &nbsp; Dash &nbsp; · &nbsp; Deliver the star through 5 stages · defeat the Guardian</div>
<div class="touch-controls" aria-label="Touch controls"><div class="directions"><button type="button" data-action="left" aria-label="Move left">←</button><button type="button" data-action="right" aria-label="Move right">→</button></div><div class="actions"><button type="button" class="dash" data-action="dash" aria-label="Dash">DASH</button><button type="button" class="jump" data-action="jump" aria-label="Jump">JUMP</button></div></div>
<section id="end-screen" class="overlay" role="dialog" aria-modal="true" aria-labelledby="end-title" aria-describedby="end-detail" hidden><div class="card"><h1 id="end-title"></h1><p id="end-detail"></p><button id="restart" type="button">Play again</button></div></section>
</main><script>(${gameClient.toString()})();</script></body></html>`;
app.get('/', (req, res) => res.type('html').send(page));
if (require.main === module) {
  const port = process.env.PORT || 3000;
  app.listen(port, '0.0.0.0', () => console.log('Moonlight Courier listening on ' + port));
}
module.exports = { app, page, gameClient };
