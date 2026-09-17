'use strict';
const express = require('express');
const app = express();

// The entire browser game is embedded in this file. Coordinates are world units.
function gameClient() {
  'use strict';
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const SCENE = { width: 2400, height: 600, groundY: 500 };

  const PAL = {};
  [
    ['habitat',['#192b52','#406587','#88c8b0'],'#456d68','#355457','#213a49','#a8edb0'],
    ['garden',['#394c83','#799ec1','#c1e4e7'],'#526b89','#414f73','#293652','#d0f2cd'],
    ['grotto',['#181f3f','#323c66','#52647c'],'#545a81','#424765','#292e4e','#b9a5fa'],
    ['tide',['#0d3a52','#1c6b82','#7fd9d0'],'#1c5f6e','#164a56','#0d2f3a','#a8f2e8'],
    ['foundry',['#2a1a12','#5c3a24','#c98a4a'],'#5a3f28','#432e1e','#2a1a10','#ffb86b'],
    ['aurora',['#1a1040','#3a2570','#7fe8c8'],'#3a2a60','#2a1f4a','#180f30','#c8a8ff'],
  ].forEach(([id,sky,ground,mid,deep,edge])=>{PAL[id]={sky,ground,mid,deep,edge,pillar:mid,accent:edge};});

function createCreatureArt(){
  const colors={
    crag:['#25333c','#626d80','#909ba5','#d7d2b7','#e9b25e','#fff0bd'],
    glint:['#282f52','#635ca6','#a398de','#e5daf7','#79e1de','#e9ffff'],
    sprig:['#213d3a','#3c8573','#79bd87','#d6eab0','#edb670','#fff4d0'],
    cinder:['#442c3c','#b05456','#ed8971','#f9cfa0','#ffe076','#fff7d5'],
    floe:['#24435e','#4f88aa','#88c6d4','#d4f0e8','#b1a5e8','#ffffff'],
    volt:['#33313f','#897344','#d4b967','#f6e7a0','#91e1c4','#f2fff2']
  };
  // Six independently drawn silhouettes: shell, wings, leaf ears, curled horns,
  // fins and segmented antennae. Palette indexes: outline/shadow/mid/light/accent/glint.
  const grids={
    crag:[
      '        00          ','       0440         ','    0004554000      ','   012204402210     ',
      '  01233222233210    ',' 0123310110133210   ','012221122211222210  ','013321233321233210  ',
      '013210233321012210  ','012210122210122210  ','012221011101222210  ',' 012222222222210   ',
      ' 011111111111110   ','  03333000333330   ',' 0333333333333330  ',' 0355033330355030  ',
      ' 0350033330350030  ',' 0333333433333330  ','  03333000333330   ','  01333333333310   ',
      '  0121000001210    ','  0330    0330     ','  0000    0000     '
    ],
    glint:[
      '     00     00      ','    0440   0440     ','    0420000240     ','    0122222210     ',
      '   012333333210    ','   023553355320    ','   023503350320    ','   023332333320    ',
      '  00123300332100   ',' 0420123333210240  ','042221222222122240 ', '042232222222232240 ',
      '012332233332233210 ',' 0123333333333210  ','  01233333333210   ','   012333333210    ',
      '    001222100      ','      01210        ','      0440         ','      0440         ',
      '     0440          ','     040           ','      0            '
    ],
    sprig:[
      '  000         000   ',' 01220       02210  ',' 012320     023210  ','  012320   023210   ',
      '   012320 023210    ','    00120002100     ','    0222222220      ','   023332333320     ',
      '  0235533355320     ','  0235033350320     ','  0233333333320     ','   02333033320      ',
      '    023333320       ','   01233333210      ','  0122333332210     ',' 012223333322210    ',
      ' 012233333332210    ','  0223333333220     ',' 023223333322320    ','02332100000123320   ',
      '0333210   0123330   ','0000000   0000000   ','                    '
    ],
    cinder:[
      '   0000     0000    ','  043340   043340   ',' 04300340 04300340  ',' 04304340 04304340  ',
      '  04334000043340   ','   000033330000    ','  0033333333300    ',' 033323332333330   ',
      '03323333333323330  ','03333222222233330  ',' 0332255225522330  ',' 0322250225022230  ',
      ' 0322222222222230  ','  03222300322230   ',' 0333222332223330  ','033333222222333330 ',
      '033233333333332330 ',' 0333333333333330  ','  03332333323330   ','   001100001100    ',
      '    0110  0110     ','    0220  0220     ','    0000  0000     '
    ],
    floe:[
      '         00         ','        0440        ','       043340       ','    000433334000    ',
      '   0222244422220    ','  023332223333320   ',' 0235553333555320   ',' 0235053333505320   ',
      ' 0233333333333320   ','  02333300333320    ','   023333333320     ',' 0001223333221000   ',
      '043301233332103340  ','043330233332033340  ',' 0443023333203440   ','  00023333332000    ',
      '    0233333320      ','   022333333220     ','  02332333323320    ',' 0233320000233320   ',
      ' 033320    023330   ',' 00000      00000   ','                    '
    ],
    volt:[
      '  0440        0440  ','   0440      0440   ','    010      010    ','     010000010     ',
      '    02222222220    ','   0233322333320   ','   0235533553320   ','   0235033503320   ',
      '    02333033320    ','   000233332000    ','  01222200222210   ',' 0123332002333210  ',
      '012333320023333210 ','012344320023443210 ','012333320023333210 ',' 0123332002333210  ',
      '  0122200022210    ','  0100122210010    ',' 010  00100  010   ','  00   0440   00   ',
      '        040        ','       0440        ','        00         '
    ]
  };
  const regions={
    habitat:{sky:'#b9dfd4',haze:'#def0d0',far:'#88b9ad',mid:'#639c99',ink:'#314e57',soil:'#856954',dark:'#604f48',top:'#b9dc86',trim:'#76ad79',stone:'#d4c9a3'},
    tide:{sky:'#adcddd',haze:'#e3e1c1',far:'#7aa6b8',mid:'#4e8199',ink:'#304c69',soil:'#777b85',dark:'#515b71',top:'#dce4d2',trim:'#8dbbb4',stone:'#d8d2b0'},
    foundry:{sky:'#573d60',haze:'#c47e79',far:'#754f69',mid:'#603f56',ink:'#2c3045',soil:'#796477',dark:'#494258',top:'#e8b37c',trim:'#ba7f64',stone:'#baa1a0'},
    aurora:{sky:'#252f52',haze:'#526777',far:'#3b526c',mid:'#324760',ink:'#1d2d49',soil:'#6b7394',dark:'#465575',top:'#d2eddf',trim:'#91bfc6',stone:'#c5c7df'}
  };
  function box(c,x,y,w,h,col){c.fillStyle=col;c.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h));}
  function pixelGrid(c,rows,pal,x,y,unit,flip){const w=22;rows.forEach((row,j)=>{for(let i=0;i<row.length;i++){if(row[i]===' ')continue;box(c,x+(flip?w-1-i:i)*unit,y+j*unit,unit,unit,pal[Number(row[i])]);}});}
  function drawCreature(c,id,x,y,facing,pose,t){
    id=grids[id]?id:'crag';const frame=Math.floor(t*10)%2,run=pose==='run',air=pose==='jump',act=pose==='ability';
    let rows=grids[id].slice();
    // Separate limb/tip pose changes, alongside body bob; outlines stay on-grid.
    if(run&&frame){rows[20]='   000       000    ';rows[21]='  0330      0330    ';rows[22]='  0000      0000    ';}
    if(air){rows[21]='    000    000      ';rows[22]='                    ';}
    if(id==='glint'&&(act||air||run&&frame)){
      rows[9]='440001233332100044  ';rows[10]='043221233332122340  ';rows[11]=' 0433222222223340   ';rows[12]='  04333333333340    ';
    }
    if(act&&id==='sprig'){rows[0]='0440         0440   ';rows[1]='04340       04340   ';}
    if(act&&id==='cinder')rows[6]='  0044444444400    ';
    if(act&&id==='volt'){rows[0]='44540        04544  ';rows[1]=' 0440        0440   ';}
    const yy=y+2+(run?frame*2:Math.floor(t*2)%2*2)-(air?2:0);
    pixelGrid(c,rows,colors[id],x-5,yy,2,facing<0);
    if(act){for(let i=0;i<5;i++){const a=t*5+i*1.256;box(c,x+17+Math.cos(a)*27,y+25+Math.sin(a)*25,4,4,colors[id][4]);}}
  }
  function drawBackdrop(c,view,camera,region,t){
    const p=regions[region]||regions.habitat;box(c,0,0,view.w,view.h,p.sky);
    for(let i=0;i<8;i++)box(c,0,220+i*20,view.w,20,i%2?p.haze:p.sky);
    // Pixel cloud banks / aurora ribbons.
    for(let i=-1;i<Math.ceil(view.w/180)+2;i++){
      const x=i*180-(camera*.08%180),y=70+((i+9)%3)*25;
      box(c,x,y+10,100,12,p.haze);box(c,x+20,y,54,12,p.haze);
      if(region==='aurora'){box(c,x+30,y-20,8,42,'#70afa8');box(c,x+44,y-14,8,42,'#8c9ec0');}
    }
    for(let layer=0;layer<2;layer++){
      const step=layer?260:170,par=layer?.3:.15;
      for(let i=-2;i<Math.ceil(view.w/step)+3;i++){
        const x=i*step-(camera*par%step),y=240+((i+12)%3)*25+layer*40,col=layer?p.mid:p.far;
        if(region==='habitat'){
          box(c,x,y+50,170,150,col);box(c,x+18,y+20,134,40,col);box(c,x+38,y,94,24,col);
          box(c,x+40,y+25,12,85,p.sky);box(c,x+120,y+25,12,85,p.sky);
          box(c,x-6,y+48,182,8,p.haze);box(c,x+70,y+76,30,65,p.sky);
        }else if(region==='tide'){
          box(c,x+30,y,42,210,col);box(c,x+18,y-12,66,16,col);box(c,x+40,y+14,22,16,p.haze);
          box(c,x+44,y-40,14,28,col);box(c,x-30,y+100,150,8,col);
          for(let k=0;k<4;k++)box(c,x-20+k*42,y+108,8,70,col);
        }else if(region==='foundry'){
          box(c,x,y+50,160,150,col);box(c,x+24,y-40,30,92,col);box(c,x+90,y-15,24,70,col);
          box(c,x+18,y-48,42,10,col);for(let k=0;k<4;k++)box(c,x+14+k*36,y+74,16,24,p.haze);
          box(c,x+44,y-85,32,14,p.far);box(c,x+56,y-109,42,14,p.far);
        }else{
          box(c,x+25,y+20,120,130,col);box(c,x+45,y,80,20,col);box(c,x+65,y-20,40,20,col);
          box(c,x+16,y+18,140,8,p.haze);for(let k=0;k<3;k++)box(c,x+42+k*35,y+45,14,60,p.sky);
          box(c,x+78,y-46,14,25,p.haze);
        }
      }
    }
    // Foreground scenery is quiet and sits behind collision terrain.
    box(c,0,476,view.w,124,p.mid);
    for(let x=-camera*.5%48;x<view.w;x+=48){box(c,x,470,6,12,p.trim);box(c,x+4,464,10,6,p.trim);}
  }
  function drawTerrain(c,s,region){const p=regions[region]||regions.habitat;
    box(c,s.x,s.y,s.w,s.h,p.dark);box(c,s.x,s.y,s.w,6,p.top);box(c,s.x,s.y+6,s.w,8,p.trim);
    if(region==='habitat'){
      for(let y=s.y+18;y<s.y+s.h;y+=16)for(let x=s.x+4;x<s.x+s.w-14;x+=30){
        const shift=(Math.floor(y/16)%2)*7;box(c,x+shift,y,10,4,p.soil);box(c,x+shift+2,y+4,4,2,p.stone);
      }
      for(let x=s.x+26;x<s.x+s.w-18;x+=96){box(c,x,s.y+12,4,22,p.trim);box(c,x+4,s.y+26,10,4,p.trim);}
    }else if(region==='foundry'){
      for(let x=s.x+2;x<s.x+s.w-3;x+=48){const ww=Math.min(44,s.x+s.w-x-2);box(c,x,s.y+17,ww,Math.max(0,s.h-20),p.soil);box(c,x+3,s.y+19,4,4,p.top);if(ww>20)box(c,x+ww-7,s.y+19,4,4,p.top);}
      if(s.h>40)for(let x=s.x+8;x<s.x+s.w-18;x+=48){box(c,x,s.y+34,18,3,p.dark);box(c,x,s.y+41,18,3,p.dark);}
    }else if(region==='aurora'){
      for(let x=s.x+8;x<s.x+s.w-20;x+=40){box(c,x,s.y+10,12,6,p.top);box(c,x+4,s.y+16,6,8,p.top);if(s.h>44){box(c,x+12,s.y+36,6,18,p.stone);box(c,x+8,s.y+42,14,6,p.stone);}}
    }else{
      for(let y=s.y+16;y<s.y+s.h;y+=24)for(let x=s.x;x<s.x+s.w;x+=32){
        const off=(Math.floor((y-s.y)/24)%2)*12,xx=Math.min(x+off,s.x+s.w);
        box(c,xx,y,Math.min(28,s.x+s.w-xx),Math.min(20,s.y+s.h-y),p.soil);
        if((Math.floor(x/32)+Math.floor(y/24))%3===0)box(c,xx+2,y+2,Math.max(0,Math.min(9,s.x+s.w-xx-2)),3,p.stone);
      }
    }
    if(s.kind==='ground')for(let x=s.x+16;x<s.x+s.w-12;x+=80){box(c,x,s.y-8,4,8,p.trim);box(c,x+4,s.y-12,6,6,p.top);}
  }
  function drawObstacle(c,o,t){const {x,y,w,h}=o;
    if(o.type==='rock'){
      if(o.solved){box(c,x,488,w,12,'#77808e');return;}
      box(c,x,y,w,h,'#30394b');for(let yy=y+4;yy<y+h;yy+=28){box(c,x+4,yy,w-8,24,'#8d96a0');box(c,x+6,yy+2,w-14,4,'#c5c9bc');box(c,x+w/2,yy+8,4,14,'#535e72');}
    }else if(o.type==='thorn'){
      if(o.solved){box(c,x,492,w,8,'#976e61');return;}
      for(let yy=y;yy<y+h;yy+=20){box(c,x+10,yy,20,24,'#34424d');box(c,x+4,yy+4,32,6,'#846483');box(c,x-4,yy,12,6,'#d1949b');box(c,x+30,yy+12,14,6,'#d1949b');}
    }else if(o.type==='wind'){
      const active=!o.link||o.active;for(let i=0;i<7;i++){const xx=x+15+i*(w-30)/7,yy=y+((t*(active?80:12)+i*70)%h);box(c,xx,yy,4,30,active?'#e1fff0':'#657587');box(c,xx-4,yy+4,12,4,active?'#a2d8d3':'#657587');}
      box(c,x,494,w,6,'#577c91');
    }else if(o.type==='seed'||o.type==='water'){
      if(o.solved){const top=500;box(c,x,top,w,6,o.type==='water'?'#e0fffc':'#c7dfa2');box(c,x,top+6,w,12,o.type==='water'?'#7dbacc':'#689677');for(let xx=x+6;xx<x+w-8;xx+=24)box(c,xx,top+8,12,3,o.type==='water'?'#bde5e1':'#a6c884');}
      else if(o.type==='water'){box(c,x,548,w,52,'#375f8b');for(let xx=x;xx<x+w-12;xx+=24)box(c,xx,546+Math.floor(Math.sin(t*3+xx)*2)*2,16,4,'#a9d9e0');}
      else{box(c,x-18,481,18,19,'#44745f');box(c,x-12,472,6,18,'#a8d28b');box(c,x-20,468,14,6,'#dbeeb4');}
      if(o.remaining>0){box(c,x,520,w,4,'#334b6b');box(c,x,520,w*o.remaining/o.duration,4,'#defff3');}
    }else if(o.type==='relay'){
      box(c,x-4,y+5,w+8,h-5,'#303c57');box(c,x,y,w,12,o.active?'#f7e6a0':'#988989');box(c,x+8,y+16,14,18,o.active?'#a9e4c0':'#555d7d');box(c,x+12,y+19,6,11,'#fff4ba');
    }else if(o.type==='gate'){
      box(c,x-6,y,6,h,'#8d90a9');box(c,x+w,y,6,h,'#8d90a9');box(c,x-6,y,w+12,12,'#d9ddce');
      if(!o.active&&!o.solved)for(let xx=x+4;xx<x+w;xx+=10)box(c,xx,y+12,5,h-12,'#e0be78');
    }
  }
  function drawCollectibleCoin(c,x,y,t){const w=Math.floor(t*5)%3===0?4:10;box(c,x-w/2-2,y-8,w+4,16,'#765742');box(c,x-w/2,y-6,w,12,'#f3cd77');box(c,x-w/2,y-6,2,10,'#fff0ae');}
  function drawCollectibleShard(c,x,y,t){const bob=Math.floor(Math.sin(t*3)*2)*2;box(c,x-4,y-12+bob,8,24,'#d9ccf6');box(c,x-8,y-6+bob,16,12,'#bca9e0');box(c,x-4,y-6+bob,4,8,'#f5efff');}
  return {drawCreature,drawBackdrop,drawObstacle,drawTerrain,drawCollectibleCoin,drawCollectibleShard,palettes:colors,regions};
}

  const ART=createCreatureArt();
  const SPECIES = [
    { id:'crag', label:'CRAG', ability:'SMASH', prompt:'C/K to smash rock barriers',
      colors:{o:'#241c15',h:'#8a7358',l:'#f0e2bd',s:'#b89f72',k:'#3a2e22',e:'#e08a3f',c:'#5b4a36',b:'#4a3d2c'} },
    { id:'glint', label:'GLINT', ability:'GLIDE', prompt:'hold C/K in wind currents to glide',
      colors:{o:'#132229',h:'#7ec8d8',l:'#eefdff',s:'#a9e3ec',k:'#22414c',e:'#fff4b0',c:'#3d6b7a',b:'#284650'} },
    { id:'sprig', label:'SPRIG', ability:'GROW', prompt:'C/K near a seed node to grow a bridge',
      colors:{o:'#182a19',h:'#5fa860',l:'#e3f7c4',s:'#8ecb7f',k:'#2b4a2c',e:'#ffe07a',c:'#3f6b3f',b:'#31502d'} },
  ];
  SPECIES.push(
    {id:'cinder',label:'CINDER',ability:'BURN',prompt:'C/K to burn thorn walls'},
    {id:'floe',label:'FLOE',ability:'FREEZE',prompt:'C/K at water to freeze a temporary crossing'},
    {id:'volt',label:'VOLT',ability:'CHARGE',prompt:'C/K at a relay to power linked machinery'}
  );
  function speciesOf(id){return SPECIES.find(s=>s.id===id);}

  /* ---------------- Campaign / stage data ---------------- */
  // World/state contract: obstacles are {type:'rock'|'wind'|'seed', x,y,w,h, solved}.
  // rock: tall wall, blocks movement until Crag smashes it (cannot be jumped, h=200 > max jump height ~128).
  // wind: a marked zone above a wide ravine (w=300 > max jump distance ~211); only Glint gets lift while holding the ability inside it.
  // seed: a trigger at a gap edge; Sprig grows a solid bridge spanning the full gap width. A fixed ceiling above the gap blocks a glide bypass.
  function mkStage(o){
    const groundSolids = o.grounds.map(g=>({x:g.x,y:500,w:g.w,h:100,kind:'ground'}));
    const platformSolids = (o.platforms||[]).map(([x,y,w])=>({x,y,w,h:22,kind:'platform'}));
    const ceilingSolids = (o.ceilings||[]).map(([x,y,w])=>({x,y,w,h:20,kind:'platform'}));
    return {
      name: o.name, palette: PAL[o.palette], region: o.palette, width: o.width,
      spawn: o.spawn, baseSolids: [...groundSolids, ...platformSolids, ...ceilingSolids],
      obstacleTemplate: o.obstacles || [],
      coinStarts: o.coins || [], shardStarts: o.shards || [], checkpointStarts: o.checkpoints || [],
      creatureStarts: o.creatures || [], flagX: o.flagX,
    };
  }

  const STAGES = [
    mkStage({
      name:'Hollow Path', palette:'habitat',
      grounds:[{x:0,w:760},{x:1060,w:440},{x:1780,w:520}],
      width:2700, flagX:2230, spawn:{x:40,y:452},
      obstacles:[
        {type:'rock',x:640,y:300,w:40,h:200},
        {type:'wind',x:760,y:100,w:300,h:650},
        {type:'seed',x:1500,y:470,w:280,h:30},
      ],
      ceilings:[[1500,260,280]],
      creatures:[{id:'glint',x:700,y:450},{id:'sprig',x:1330,y:450}],
      platforms:[[200,390,120],[1150,390,120],[1850,390,100],[2060,320,90]],
      coins:[[120,465],[300,355],[450,465],[900,355],[1150,465],[1300,355],[1850,465],[2050,355]],
      shards:[[2100,285]],
      checkpoints:[100,1120],
    }),
    mkStage({
      name:'Windswept Terraces', palette:'garden',
      grounds:[{x:0,w:600},{x:880,w:420},{x:1600,w:500}],
      width:2500, flagX:2030, spawn:{x:40,y:452},
      obstacles:[
        {type:'rock',x:520,y:300,w:40,h:200},
        {type:'seed',x:600,y:470,w:280,h:30},
        {type:'rock',x:1220,y:300,w:40,h:200},
        {type:'wind',x:1300,y:100,w:300,h:650},
      ],
      ceilings:[[600,260,280]],
      creatures:[],
      platforms:[[890,410,90],[950,320,90],[1080,240,90],[1200,170,90],[1650,390,110]],
      coins:[[80,465],[300,355],[950,285],[1650,465],[1800,355],[1950,465]],
      shards:[[1230,140]],
      checkpoints:[80,950],
    }),
    mkStage({
      name:'Rootbound Ruins', palette:'grotto',
      grounds:[{x:0,w:520},{x:820,w:460},{x:1560,w:520},{x:2380,w:420}],
      width:3200, flagX:2730, spawn:{x:40,y:452},
      obstacles:[
        {type:'rock',x:460,y:300,w:40,h:200},
        {type:'wind',x:520,y:100,w:300,h:650},
        {type:'rock',x:980,y:300,w:40,h:200},
        {type:'seed',x:1280,y:470,w:280,h:30},
        {type:'wind',x:2080,y:100,w:300,h:650},
      ],
      ceilings:[[1280,260,280]],
      creatures:[],
      platforms:[[130,410,90],[260,330,90],[1650,390,110],[1900,320,90]],
      coins:[[80,465],[900,355],[1150,465],[1650,465],[1950,355],[2450,465],[2650,355]],
      shards:[[290,300]],
      checkpoints:[80,1620],
    }),
  ];
  // Each expedition has its own layout. Helpers only build geometry, never repeat maps.
  function expedition(name,region,width,gaps,barriers,devices,rescues,platforms,checkpoints,hint){
    const sorted=[...gaps].sort((a,b)=>a.x-b.x);let cursor=0;
    const grounds=[];for(const gap of sorted){grounds.push({x:cursor,w:gap.x-cursor});cursor=gap.x+gap.w;}grounds.push({x:cursor,w:width-cursor});
    const o=mkStage({name,palette:region,width,flagX:width-100,spawn:{x:40,y:452},grounds,
      obstacles:[...barriers.map(([type,x])=>({type,x,y:280,w:44,h:220})),...gaps.map(g=>({...g,y:g.type==='wind'?100:470,h:g.type==='wind'?650:30})),...devices],
      ceilings:gaps.filter(g=>g.type!=='wind').map(g=>[g.x,260,g.w]),
      creatures:rescues.map(([id,x])=>({id,x,y:450})),platforms,checkpoints,
      coins:platforms.map(([x,y,w])=>[x+w/2,y-30]).concat(checkpoints.map(x=>[x+50,465])),
      shards:platforms.length?[[platforms[platforms.length-1][0]+40,platforms[platforms.length-1][1]-30]]:[]});
    o.hint=hint;return o;
  }
  const relay=(id,x,duration=9,y=454)=>({type:'relay',id,x,y,w:30,h:46,duration});
  const gate=(link,x)=>({type:'gate',link,x,y:260,w:36,h:240});
  STAGES[1].region='habitat';STAGES[2].region='habitat';
  STAGES.push(
    expedition('Bramble Estuary','tide',2500,[{type:'seed',x:780,w:300},{type:'wind',x:1680,w:360}],
      [['thorn',560],['rock',1280],['thorn',1570]],[],[['cinder',320]],
      [[1150,410,90],[1280,330,90],[1410,250,90]],[100,1150,2120],'Rescue Cinder. Burn the tangled thorns, then grow a crossing.'),
    expedition('Glasswater Locks','tide',2800,[{type:'water',x:620,w:370,duration:5},{type:'seed',x:1360,w:320},{type:'water',x:2010,w:440,duration:4}],
      [['thorn',1140],['rock',1830]],[],[['floe',340]],
      [[1050,405,90],[1160,325,90],[1270,245,90]],[100,1050,1760,2530],'Floe freezes water briefly. Cross before the ice melts; refreeze from either bank.'),
    expedition('Dynamo Causeway','tide',2800,[{type:'wind',x:800,w:380,link:'a'},{type:'water',x:1740,w:340,duration:5}],
      [['rock',570],['thorn',1470]],[relay('a',680,10),gate('a',1240),relay('b',1580,8),gate('b',2160)],[['volt',320]],
      [[2220,410,90],[2350,330,90],[2470,250,90]],[100,1370,2260],'Volt powers matching lettered machines. Charge A, switch to Glint, and ride its current.'),
    expedition('Kilnroot Works','foundry',3000,[{type:'seed',x:770,w:330},{type:'water',x:1540,w:400,duration:4},{type:'wind',x:2340,w:330}],
      [['thorn',580],['rock',1210],['thorn',2220]],[relay('a',1390,7),gate('a',1990)],[],
      [[1120,405,70],[1250,325,80],[1380,245,80]],[100,1160,2120],'Burn the roots, grow a bridge, then charge and freeze the furnace channel.'),
    expedition('Switchback Turbines','foundry',3000,[{type:'wind',x:740,w:440,link:'a'},{type:'seed',x:1640,w:310},{type:'wind',x:2310,w:400,link:'b'}],
      [['rock',480],['thorn',1440]],[relay('a',620,9),gate('a',1230),relay('b',2160,8),gate('b',2770)],[],
      [[1290,405,80],[1400,325,80],[1510,245,80]],[100,1320,2020],'Two turbines, two circuits. Watch the matching letters and recharge before takeoff.'),
    expedition('The Tempering Trial','foundry',3300,[{type:'water',x:760,w:430,duration:4},{type:'seed',x:1590,w:330},{type:'water',x:2370,w:440,duration:4}],
      [['thorn',450],['rock',1360],['thorn',2150]],[relay('a',620,8),gate('a',1240),relay('b',1990,9),gate('b',2860)],[],
      [[2910,405,80],[3020,325,80],[3130,245,80]],[100,1320,1990],'Charge, freeze, switch, cross. The second circuit includes a thorn wall: clear it first.'),
    expedition('Moonlit Reservoir','aurora',3300,[{type:'wind',x:610,w:400},{type:'water',x:1520,w:480,duration:4},{type:'seed',x:2520,w:340}],
      [['rock',430],['thorn',1250],['rock',2290]],[relay('a',1120,11),gate('a',2070)],[],
      [[2100,405,80],[2210,325,80],[2320,245,80]],[100,1080,2160,2940],'Prepare the channel before starting its timer. Frozen water and a distant gate share your crossing window.'),
    expedition('Starlight Engine','aurora',3500,[{type:'seed',x:590,w:330},{type:'wind',x:1570,w:480,link:'a'},{type:'water',x:2540,w:460,duration:4}],
      [['thorn',440],['rock',1160],['thorn',2340]],[relay('a',1310,10),gate('a',2110),relay('b',2220,10),gate('b',3080)],[],
      [[970,405,80],[1080,325,80],[1190,245,80]],[100,1010,2200,3210],'Restore both engine circuits. Clear permanent barriers before attempting the timed run.'),
    expedition('The Skyheart','aurora',4000,[{type:'seed',x:620,w:340},{type:'wind',x:1610,w:480,link:'a'},{type:'water',x:2640,w:490,duration:4},{type:'seed',x:3440,w:310}],
      [['thorn',460],['rock',1170],['thorn',2380],['rock',3250]],[relay('a',1400,10),gate('a',2150),relay('b',2240,13),gate('b',3800)],[],
      [[1000,405,80],[1110,325,80],[1220,245,80]],[100,1060,2240,3220],'Finale: prepare the last circuit, then burn, freeze, smash and grow before its gate closes.')
  );
  const totalCoins = STAGES.reduce((n,s)=>n+s.coinStarts.length,0);
  const totalShards = STAGES.reduce((n,s)=>n+s.shardStarts.length,0);

  let stageIndex = 0, stage = STAGES[0];
  let player = { x:0, y:0, w:34, h:48, vx:0, vy:0, grounded:true, facing:1 };
  let camera = 0, viewWidth = 960, viewHeight = 600;
  let solids = [], obstacles = [];
  let coins = [], coinCount = 0, fragmentCount = 0, shards = [], creatures = [];
  let lives = 3, damageTimer = 0, state = 'playing';
  let checkpointStarts = [], checkpoint = -1, spawn = { x:0, y:0 };
  let coyoteTimer = 0, jumpBufferTimer = 0, jumpCut = false, elapsed = 0, toastTimer = 0;
  let particles = [];
  let unlockedCreatures = new Set(['crag']), current = 'crag', gliding = false, abilityRequested = false, abilityPoseTimer = 0;
  const STEP = 1 / 120, SPEED = 280, GRAVITY = 1800, JUMP = 680, LIFT = 2600, LIFT_CAP = 260;

  function burst(x,y,color,n=10) {
    for(let i=0;i<n;i++) {const a=i/n*Math.PI*2;particles.push({x,y,vx:Math.cos(a)*90,vy:Math.sin(a)*90-35,life:0.55,color});}
    if(particles.length>180)particles.splice(0,particles.length-180);
  }
  function toast(message) {document.getElementById('toast').textContent=message;toastTimer=2.8;}
  function overlaps(a, b) { return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y; }
  function nearObstacle(p,o,pad=24){ return overlaps(p,{x:o.x-pad,y:o.y-pad,w:o.w+pad*2,h:o.h+pad*2}); }
  const keys = new Set();
  const touches = new Map();
  let jumpQueued = false;
  function held(action) { return keys.has(action) || [...touches.values()].includes(action); }

  function speciesOrder(){ return SPECIES.filter(s=>unlockedCreatures.has(s.id)).map(s=>s.id); }
  function setCurrent(id){ if(id===current)return; current=id; gliding=false; toast(speciesOf(id).label+' active · '+speciesOf(id).prompt); }
  function cycleCreature(dir){ const order=speciesOrder(); if(order.length<2)return; let i=order.indexOf(current); i=(i+dir+order.length)%order.length; setCurrent(order[i]); }
  function selectCreature(id){ if(unlockedCreatures.has(id)) setCurrent(id); }

  let campaignRecords={},highestStage=0,completedStages=new Set();
  const SAVE_KEY='creature-call-campaign-v2';
  let menuPrevious='playing';
  function loadStage(index) {
    if(!Number.isInteger(index)||index<0||index>=STAGES.length)return;
    stageIndex = index; stage = STAGES[index];
    solids = stage.baseSolids.map(s=>({...s}));
    obstacles = stage.obstacleTemplate.map(o=>({...o,solved:false}));
    obstacles.filter(o=>['rock','thorn','gate'].includes(o.type)).forEach(o=>{ solids.push({x:o.x,y:o.y,w:o.w,h:o.h,kind:o.type,obstacleRef:o}); });
    coins = stage.coinStarts.map(([x,y]) => ({x,y,collected:false}));
    shards = stage.shardStarts.map(([x,y]) => ({x,y,collected:false}));
    creatures = stage.creatureStarts.map(c => ({...c,rescued:unlockedCreatures.has(c.id)}));
    checkpointStarts = stage.checkpointStarts;
    checkpoint = -1;
    spawn = { ...stage.spawn };
    gliding = false; abilityRequested = false; abilityPoseTimer = 0; damageTimer = 0;
    coyoteTimer = 0; jumpBufferTimer = 0; jumpCut = false; toastTimer = 0; particles = [];
    player = { ...spawn, w:34, h:48, vx:0, vy:0, grounded:true, facing:1 };
    restoreStageRecord();
    camera = 0;
    clearInput(); physicalKeys.clear(); previousTime = null; accumulator = 0;
    document.getElementById('coins').textContent = 'Coins: ' + coinCount;
    document.getElementById('lives').textContent = 'Lives: ' + lives;
    updateHud(); canvas.focus();
    toast(stage.hint||'Q/E switch companion · C/K use ability');
  }

  function updateHud() {
    document.getElementById('crew').textContent = speciesOf(current).label+' · '+speciesOf(current).ability+'  /  '+unlockedCreatures.size+' friends';
    document.getElementById('shards').textContent = '◆ ' + fragmentCount + '/' + totalShards;
    const pct = Math.min(100,Math.floor(player.x/(stage.flagX||1)*100));
    document.getElementById('route').textContent = String(stageIndex+1).padStart(2,'0')+' · '+stage.name.toUpperCase()+'  /  '+pct+'%';
    document.getElementById('progress').style.width = pct+'%';
    document.getElementById('toast').style.opacity = String(Math.min(1,toastTimer));
  }
  function releaseJump() {if(!held('jump') && player.vy<0 && !jumpCut){player.vy*=0.45;jumpCut=true;}}

  function update(dt) {
    if (state !== 'playing') return;
    const p = player;
    const pal = stage.palette;
    updateMachinery(dt);
    elapsed += dt; toastTimer=Math.max(0,toastTimer-dt); abilityPoseTimer=Math.max(0,abilityPoseTimer-dt);
    particles=particles.filter(q=>{q.life-=dt;q.x+=q.vx*dt;q.y+=q.vy*dt;q.vy+=180*dt;return q.life>0;});
    coyoteTimer=p.grounded?0.1:Math.max(0,coyoteTimer-dt);
    jumpBufferTimer=jumpQueued?0.12:Math.max(0,jumpBufferTimer-dt);
    damageTimer = Math.max(0, damageTimer - dt);

    p.vx = (Number(held('right')) - Number(held('left'))) * SPEED; if (p.vx) p.facing = Math.sign(p.vx);

    if(jumpBufferTimer>0 && coyoteTimer>0) {
      p.vy=-JUMP;p.grounded=false;coyoteTimer=0;jumpBufferTimer=0;jumpCut=false;
      if(!held('jump')) {p.vy*=0.45;jumpCut=true;}
    }
    jumpQueued = false;
    p.x += p.vx * dt;
    for (const s of solids) if (overlaps(p, s)) {
      if (p.vx > 0) p.x = s.x - p.w;
      else if (p.vx < 0) p.x = s.x + s.w;
      p.vx = 0;
    }
    p.x = Math.max(0, Math.min(stage.width - p.w, p.x));

    let windZone = null;
    if (current === 'glint' && held('ability') && !p.grounded) {
      windZone = obstacles.find(o => o.type==='wind' && powered(o) && overlaps(p,o));
    }
    gliding = !!windZone;
    if (windZone) windZone.solved = true;
    if (gliding) { p.vy = Math.max(p.vy - LIFT*dt, -LIFT_CAP); }
    else { p.vy = Math.min(900, p.vy + GRAVITY * dt); }
    p.y += p.vy * dt;
    const landingSpeed=p.vy;
    p.grounded = false;
    for (const s of solids) if (overlaps(p, s)) {
      if (p.vy > 0) { p.y = s.y - p.h; p.grounded = true; }
      else if (p.vy < 0) p.y = s.y + s.h;
      p.vy = 0;
    }
    if(p.grounded && landingSpeed>200)burst(p.x+17,p.y+48,pal.edge,5);
    if (p.y > SCENE.height + 100) { loseLife(true); return; }
    updateCamera();

    for (const coin of coins) if (!coin.collected && overlaps(p, {x:coin.x-10,y:coin.y-10,w:20,h:20})) {
      coin.collected = true; coinCount++; burst(coin.x,coin.y,'#ffcf6b',7);
      document.getElementById('coins').textContent = 'Coins: ' + coinCount;saveProgress();
    }
    for(let i=0;i<checkpointStarts.length;i++) if(i>checkpoint && overlaps(p,{x:checkpointStarts[i],y:410,w:24,h:90})) {
      checkpoint=i;spawn={x:checkpointStarts[i],y:452};burst(p.x,450,pal.edge,18);toast('Beacon saved · respawn here');saveProgress();
    }
    for(const shard of shards) if(!shard.collected && overlaps(p,{x:shard.x-13,y:shard.y-13,w:26,h:26})) {
      shard.collected=true;fragmentCount++;burst(shard.x,shard.y,'#b9abff',16);toast('Relic found · '+fragmentCount+' / '+totalShards);saveProgress();
    }
    for(const c of creatures) if(!c.rescued && overlaps(p,{x:c.x-18,y:c.y-24,w:36,h:48})) {
      c.rescued=true; unlockedCreatures.add(c.id); current=c.id; gliding=false;
      burst(c.x,c.y,'#ffe6a0',20); toast(speciesOf(c.id).label+' joins you · '+speciesOf(c.id).prompt);saveProgress();
    }

    if(abilityRequested){abilityRequested=false;useAbility();}

    updateHud();
    if (overlaps(p, {x:stage.flagX,y:310,w:20,h:190})) {
      if(obstacles.some(o=>!o.completed&&!o.solved)){toast('Restore every crossing and circuit before leaving.');return;}
      if (stageIndex === STAGES.length-1) finish('won'); else finishStage();
    }
  }

  function powered(o){return !o.link||obstacles.some(r=>r.type==='relay'&&r.id===o.link&&r.remaining>0);}
  function solidFor(o){return solids.find(s=>s.obstacleRef===o);}
  function removeSolid(o){solids=solids.filter(s=>s.obstacleRef!==o);}
  function updateMachinery(dt){
    for(const o of obstacles){
      if(o.remaining>0)o.remaining=Math.max(0,o.remaining-dt);
      if(o.type==='water'&&o.solved&&!(o.remaining>0)){o.solved=false;removeSolid(o);}
      if(o.type==='gate'){
        o.active=powered(o);o.remaining=obstacles.find(r=>r.id===o.link&&r.type==='relay')?.remaining||0;
        if(o.active){o.solved=true;o.completed=true;removeSolid(o);}
        // Occupancy prevents a closing gate from embedding the player in a solid.
        else if(!overlaps(player,o)){o.solved=false;if(!solidFor(o))solids.push({...o,kind:'gate',obstacleRef:o});}
      }
      if(o.type==='relay')o.active=o.remaining>0;
    }
  }
  function useAbility(){
    abilityPoseTimer=0.35;
    const expected={rock:'crag',thorn:'cinder',seed:'sprig',water:'floe',relay:'volt'};
    let success=false;
    for(const o of obstacles){
      if(!expected[o.type]||!nearObstacle(player,o,40))continue;
      if(current!==expected[o.type])continue;
      if(o.solved&&!['water','relay'].includes(o.type))continue;
      success=true;o.solved=true;o.completed=true;
      if(['rock','thorn'].includes(o.type))removeSolid(o);
      if(['seed','water'].includes(o.type)){
        if(!solidFor(o))solids.push({x:o.x,y:500,w:o.w,h:18,kind:o.type==='water'?'ice':'bridge',obstacleRef:o});
      }
      if(['water','relay'].includes(o.type))o.remaining=o.duration||8;
      burst(o.x+16,470,{crag:'#eaba75',cinder:'#ff996c',sprig:'#9ee392',floe:'#a7e9ff',volt:'#ffe89a'}[current],14);
      toast({rock:'Stone cleared',thorn:'Thorns cleared',seed:'Living bridge grown',water:'Ice holds for '+o.duration+' seconds',relay:'Circuit '+(o.id||'').toUpperCase()+' charged · '+o.duration+' seconds'}[o.type]);
    }
    if(!success&&current!=='glint')toast(speciesOf(current).prompt);
    updateMachinery(0);if(success)saveProgress();
  }

  function finish(nextState) {
    if(nextState==='won'){completedStages.add(stageIndex);saveProgress();}
    state = nextState; clearInput(); physicalKeys.clear();
    player.vx = 0; player.vy = 0;
    document.getElementById('end-title').textContent = state === 'won' ? 'Every companion is home' : 'The journey pauses here';
    document.getElementById('end-detail').textContent = state === 'won' ? 'Campaign complete. Coins: ' + coinCount + '/' + totalCoins + ' · Relics: ' + fragmentCount + '/' + totalShards : 'Take a breath and try again.';
    document.getElementById('restart').textContent = state === 'won' ? 'Play again' : 'Try again';
    document.getElementById('end-screen').hidden = false;
    document.getElementById('restart').focus();
  }
  function finishStage() {
    completedStages.add(stageIndex);highestStage=Math.max(highestStage,stageIndex+1);saveProgress();
    state = 'stageComplete'; clearInput(); physicalKeys.clear();
    player.vx = 0; player.vy = 0;
    document.getElementById('end-title').textContent = 'Stage clear — ' + stage.name;
    document.getElementById('end-detail').textContent = 'Coins: ' + coinCount + '/' + totalCoins + ' · Relics: ' + fragmentCount + '/' + totalShards;
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
    campaignRecords={};highestStage=0;completedStages=new Set();
    lives = 3; coinCount = 0; fragmentCount = 0; state = 'playing';
    unlockedCreatures = new Set(['crag']); current = 'crag';
    document.getElementById('end-screen').hidden = true;
    loadStage(0);saveProgress();
  }
  function onEndButton() {
    if (state === 'stageComplete') nextStage(); else restart();
  }
  function loseLife(fell = false) {
    if (state !== 'playing' || (!fell && damageTimer > 0)) return;
    coyoteTimer=0;jumpBufferTimer=0;
    lives--; document.getElementById('lives').textContent = 'Lives: ' + lives;
    clearInput(); physicalKeys.clear();
    if(lives<=0){lives=3;document.getElementById('lives').textContent='Lives: 3';toast('Fresh energy · checkpoint and companions kept');}
    Object.assign(player, spawn, {vx:0,vy:0,grounded:true,facing:1});
    gliding=false; abilityRequested=false; abilityPoseTimer=0;
    damageTimer = 1; updateCamera();
  }
  function updateCamera() { camera = Math.max(0, Math.min(stage.width - viewWidth, player.x + player.w / 2 - viewWidth * 0.35)); }
  function rememberStage(){
    campaignRecords[stageIndex]={checkpoint,coins:coins.map(c=>c.collected),shards:shards.map(c=>c.collected),
      obstacles:obstacles.map(o=>({solved:!!o.solved,completed:!!(o.completed||o.solved)}))};
  }
  function restoreStageRecord(){
    const r=campaignRecords[stageIndex];if(!r)return;
    coins.forEach((c,i)=>c.collected=!!r.coins?.[i]);shards.forEach((c,i)=>c.collected=!!r.shards?.[i]);
    obstacles.forEach((o,i)=>{
      o.completed=!!r.obstacles?.[i]?.completed;
      if(!r.obstacles?.[i]?.solved||!['rock','thorn','seed'].includes(o.type))return;
      o.solved=true;removeSolid(o);
      if(o.type==='seed')solids.push({x:o.x,y:500,w:o.w,h:18,kind:'bridge',obstacleRef:o});
    });
    if(Number.isInteger(r.checkpoint)&&r.checkpoint>=0&&r.checkpoint<checkpointStarts.length){
      checkpoint=r.checkpoint;spawn={x:checkpointStarts[checkpoint],y:452};Object.assign(player,spawn);
    }
  }
  function saveProgress(){
    rememberStage();
    try{window.localStorage?.setItem(SAVE_KEY,JSON.stringify({version:2,stageIndex,highestStage,records:campaignRecords,
      unlocked:[...unlockedCreatures],current,completed:[...completedStages]}));}
    catch{document.getElementById('save-status').textContent='Saving unavailable · this session still works';}
  }
  function readSave(){try{
    const raw=window.localStorage?.getItem(SAVE_KEY);if(!raw)return null;const s=JSON.parse(raw);
    if(s.version!==2||!Number.isInteger(s.stageIndex)||s.stageIndex<0||s.stageIndex>=STAGES.length||
      !Number.isInteger(s.highestStage)||s.highestStage<s.stageIndex||s.highestStage>=STAGES.length||
      !Array.isArray(s.unlocked)||!s.unlocked.includes('crag')||!s.records||typeof s.records!=='object')return null;
    // Bound data to the shipped campaign and reject malformed stage records.
    for(const [key,r] of Object.entries(s.records)){
      const st=STAGES[Number(key)];if(!st||!r||!Array.isArray(r.coins)||!Array.isArray(r.shards)||!Array.isArray(r.obstacles))return null;
    }
    return s;
  }catch{return null;}}
  function resumeSaved(){
    const s=readSave();if(!s){document.getElementById('save-status').textContent='No compatible saved journey yet';return;}
    campaignRecords=s.records;highestStage=s.highestStage;
    unlockedCreatures=new Set(s.unlocked.filter(id=>SPECIES.some(c=>c.id===id)));
    current=unlockedCreatures.has(s.current)?s.current:'crag';
    completedStages=new Set((Array.isArray(s.completed)?s.completed:[]).filter(i=>Number.isInteger(i)&&i>=0&&i<STAGES.length));
    coinCount=0;fragmentCount=0;
    for(const [i,r] of Object.entries(campaignRecords)){coinCount+=r.coins.slice(0,STAGES[i].coinStarts.length).filter(Boolean).length;fragmentCount+=r.shards.slice(0,STAGES[i].shardStarts.length).filter(Boolean).length;}
    loadStage(s.stageIndex);state='playing';document.getElementById('campaign-menu').hidden=true;document.getElementById('end-screen').hidden=true;
  }
  function openMenu(){
    if(state==='menu')return;menuPrevious=state;state='menu';clearInput();physicalKeys.clear();
    document.getElementById('campaign-menu').hidden=false;
    for(let i=0;i<STAGES.length;i++){const b=document.getElementById('level-'+i);b.disabled=i>highestStage;b.textContent=String(i+1).padStart(2,'0')+' · '+STAGES[i].name+(completedStages.has(i)?' ✓':'');}
    document.getElementById('saved-journey').disabled=!readSave();
    document.getElementById('menu-back').focus();
  }
  function closeMenu(){state=menuPrevious;document.getElementById('campaign-menu').hidden=true;clearInput();canvas.focus();previousTime=null;accumulator=0;}
  function visitStage(i){if(i>highestStage||i<0||!Number.isInteger(i))return;rememberStage();loadStage(i);state='playing';document.getElementById('campaign-menu').hidden=true;document.getElementById('end-screen').hidden=true;saveProgress();}
  document.getElementById('journey-menu').addEventListener('click',openMenu);
  document.getElementById('menu-back').addEventListener('click',closeMenu);
  document.getElementById('saved-journey').addEventListener('click',resumeSaved);
  document.getElementById('new-journey').addEventListener('click',()=>{if(window.confirm('Start a new journey? This replaces your saved progress.')){restart();document.getElementById('campaign-menu').hidden=true;}});
  for(let i=0;i<STAGES.length;i++)document.getElementById('level-'+i).addEventListener('click',()=>visitStage(i));
  const keyActions = { ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right', Space: 'jump', KeyW: 'jump', KeyC:'ability', KeyK:'ability' };
  const physicalKeys = new Set();
  window.addEventListener('keydown', event => {
    if(event.code==='KeyF'&&!event.repeat){event.preventDefault();toggleFullscreen();return;}
    if(event.code==='Tab'&&state==='menu'){
      const controls=[...document.getElementById('campaign-menu').querySelectorAll('button:not(:disabled)')];
      const first=controls[0],last=controls[controls.length-1];
      if(first&&event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
      else if(last&&!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
      return;
    }
    if(event.code==='Escape'&&state==='menu'){closeMenu();return;}
    if(event.code==='Escape'&&expanded){setExpanded(false);return;}
    if (state !== 'playing') return;
    if(!event.repeat){
      if(event.code==='KeyQ'){event.preventDefault();cycleCreature(-1);return;}
      if(event.code==='KeyE'){event.preventDefault();cycleCreature(1);return;}
      if(event.code==='Digit1'){event.preventDefault();selectCreature('crag');return;}
      if(event.code==='Digit2'){event.preventDefault();selectCreature('glint');return;}
      if(/^Digit[1-6]$/.test(event.code)){event.preventDefault();selectCreature(SPECIES[Number(event.code.slice(-1))-1].id);return;}
    }
    const action = keyActions[event.code]; if (!action) return;
    event.preventDefault();
    if (action === 'jump' && !physicalKeys.has(event.code) && !held('jump')) jumpQueued = true;
    if (action === 'ability' && !physicalKeys.has(event.code)) abilityRequested = true;
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
    keys.clear(); touches.clear(); jumpQueued = false; jumpBufferTimer=0; abilityRequested=false; releaseJump();
    document.querySelectorAll('[data-action]').forEach(button => button.classList.toggle('pressed',false));
  }
  for (const button of document.querySelectorAll('[data-action]')) {
    button.addEventListener('pointerdown', event => {
      event.preventDefault(); if (state !== 'playing') return;
      const action = button.dataset.action;
      if (action === 'jump' && !held('jump')) jumpQueued = true;
      if (action === 'ability') abilityRequested = true;
      if (action === 'switch') cycleCreature(1);
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
    canvas.width = Math.round(viewWidth);
    canvas.height = Math.round(viewHeight);
    ctx.imageSmoothingEnabled = false;
    updateCamera();
    draw();
  }
  function rect(x, y, w, h, color) { ctx.fillStyle = color; ctx.fillRect(x, y, w, h); }
  function circle(x, y, r, color) { ctx.fillStyle = color; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); }
  function label(text, x, y, size, color) { ctx.fillStyle = color; ctx.font = '600 ' + size + 'px monospace'; ctx.fillStyle='#192a42';ctx.fillText(text,x+1,y+1);ctx.fillStyle=color;ctx.fillText(text,x,y); }
  function drawPlayer() {
    const p = player;
    const pose = gliding ? 'ability' : abilityPoseTimer>0 ? 'ability' : !p.grounded ? 'jump' : p.vx ? 'run' : 'idle';
    ART.drawCreature(ctx,current,p.x,p.y,p.facing,pose,elapsed);
  }
  function star(x,y,r,color) {
    ctx.fillStyle=color;ctx.beginPath();for(let i=0;i<10;i++){const a=i*Math.PI/5-Math.PI/2,rr=i%2?r*0.45:r;const px=x+Math.cos(a)*rr,py=y+Math.sin(a)*rr;if(i===0)ctx.moveTo(px,py);else ctx.lineTo(px,py);}ctx.closePath();ctx.fill();
  }
  function draw() {
    const pal = stage.palette;
    const offsetY = Math.max(0,(viewHeight-SCENE.height)*0.42);
    ctx.setTransform(canvas.width/viewWidth,0,0,canvas.height/viewHeight,0,offsetY*canvas.height/viewHeight);
    rect(0,-offsetY,viewWidth,viewHeight,(ART.regions[stage.region]||ART.regions.habitat).sky);
    const view={w:viewWidth,h:viewHeight};
    ART.drawBackdrop(ctx,view,camera,stage.region,elapsed);
    ctx.save();ctx.translate(-camera,0);
    for(const solid of solids){
      if(solid.x+solid.w<camera-60||solid.x>camera+viewWidth+60)continue;
      if(['rock','thorn','gate','bridge','ice'].includes(solid.kind)) continue;
      else ART.drawTerrain(ctx,solid.kind==='ground'?{...solid,h:Math.max(solid.h,viewHeight-offsetY-solid.y)}:solid,stage.region);
    }
    for(let i=0;i<checkpointStarts.length;i++){
      const x=checkpointStarts[i],col=i<=checkpoint?pal.edge:'#59627c';rect(x,410,24,90,'#26334e');rect(x+4,416,16,62,col);circle(x+12,407,9,col);label('BEACON',x-14,392,10,col);
    }
    for(const o of obstacles){
      // Bridge artwork's top edge matches its collision surface at y=500.
      ART.drawObstacle(ctx,o.type==='wind'?{...o,active:powered(o)}:o,elapsed);
      const names={rock:'CRAG · SMASH',thorn:'CINDER · BURN',wind:'GLINT · HOLD'+(o.link?' · '+o.link.toUpperCase():''),seed:'SPRIG · GROW',water:'FLOE · FREEZE',relay:'VOLT · '+(o.id||'').toUpperCase(),gate:'CIRCUIT '+(o.link||'').toUpperCase()};
      label(o.remaining>0?Math.ceil(o.remaining)+'s · '+names[o.type]:names[o.type],o.x-18,['seed','water'].includes(o.type)?450:Math.max(210,o.y-14),10,'#eafcff');
    }
    for(const c of creatures) if(!c.rescued){
      const species=speciesOf(c.id);
      circle(c.x,c.y,20,'#26304d');
      ART.drawCreature(ctx,c.id,c.x-17,c.y-24,1,'idle',elapsed);
      label('RESCUE '+species.label,c.x-38,c.y-30,10,'#ffe6a0');
    }
    for(const coin of coins)if(!coin.collected)ART.drawCollectibleCoin(ctx,coin.x,coin.y,elapsed);
    for(const shard of shards)if(!shard.collected)ART.drawCollectibleShard(ctx,shard.x,shard.y,elapsed);
    rect(stage.flagX-32,482,86,18,'#687087');rect(stage.flagX-20,462,62,20,'#343955');rect(stage.flagX+2,324,14,138,pal.accent+'22');circle(stage.flagX+9,344,31,pal.accent+'22');star(stage.flagX+9,344,22,pal.accent);label('HABITAT BEACON',stage.flagX-90,290,13,'#fff2c4');
    ctx.globalAlpha = damageTimer>0?0.55+Math.sin(damageTimer*30)*0.2:1;drawPlayer();ctx.globalAlpha=1;
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
  for(const species of SPECIES){const portrait=document.getElementById('portrait-'+species.id);ART.drawCreature(portrait.getContext('2d'),species.id,11,5,1,'idle',0);}
  openMenu();
  requestAnimationFrame(frame);
}
const page = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>Creature Call — The Skyheart Journey</title>
<style>
*{box-sizing:border-box}html,body{margin:0;width:100%;height:100%;overflow:hidden;background:#0d1130;color:#f2ecff;font-family:ui-monospace,SFMono-Regular,Consolas,monospace}body{display:flex;align-items:center;justify-content:center}main{position:relative;width:100%;height:100%;max-width:1600px;max-height:1000px}canvas{display:block;width:100%;height:100%;image-rendering:pixelated;image-rendering:crisp-edges;touch-action:none;outline:none}
.hud{position:absolute;left:24px;right:24px;top:max(20px,env(safe-area-inset-top));display:flex;justify-content:space-between;gap:12px;pointer-events:none;padding:14px 18px;background:#111a35dc;border:2px solid #637da333;align-items:center}.brand{font-size:12px;font-weight:800;letter-spacing:2px}.stats{display:flex;gap:18px;font-size:14px;font-weight:750}#coins{color:#ffcf6b}#lives,#crew{color:#ffdb91}
.journey{position:absolute;top:max(90px,calc(env(safe-area-inset-top) + 76px));left:42px;font-size:10px;letter-spacing:1.5px;color:#edf5ff;background:#192a42ed;padding:10px 12px;pointer-events:none}.track{margin:10px 0;width:220px;height:4px;background:#38405c}#progress{height:4px;background:#7cf0ff}.powers{display:flex;gap:16px;font-size:12px}#shards{color:#c7bcff}
#toast{position:absolute;top:180px;left:50%;transform:translateX(-50%);width:max-content;max-width:90%;padding:10px 16px;background:#192a42ed;border:2px solid #7cf0ff55;text-align:center;font-size:13px;pointer-events:none}
.help{position:absolute;bottom:22px;left:24px;font-size:13px;color:#edf5ff;background:#192a42ed;padding:8px 12px}
.overlay{position:absolute;inset:0;display:grid;place-items:center;background:#080f26bb;z-index:3}.overlay[hidden]{display:none}.card{width:min(88%,380px);background:#151b36;border:2px solid #7cf0ff55;padding:36px;text-align:center;box-shadow:0 20px 70px #0008}.card h1{font-size:34px;letter-spacing:-1px;margin:8px 0 12px}.card p{line-height:1.6;color:#b7c3dd}.card button{background:#7cf0ff;color:#0d1130;border:0;padding:16px 32px;font:750 16px inherit;cursor:pointer}.card button:focus-visible{outline:3px solid #ffcf6b;outline-offset:4px}
.touch-controls{display:none;position:absolute;bottom:max(20px,env(safe-area-inset-bottom));left:max(20px,env(safe-area-inset-left));right:max(20px,env(safe-area-inset-right));justify-content:space-between;pointer-events:none;user-select:none;-webkit-user-select:none}.directions,.actions{display:flex;gap:12px}.touch-controls button{width:70px;height:70px;border:2px solid #7cf0ff66;background:#192a42ed;color:#dffbff;font:750 26px inherit;pointer-events:auto;touch-action:none;-webkit-touch-callout:none}.touch-controls .jump{width:86px;font-size:14px;background:#32647a}.touch-controls .ability{width:70px;font-size:12px;background:#966343}.touch-controls .switch{width:64px;font-size:12px;background:#3a5a4a}.touch-controls button.pressed{background:#458b94;transform:translateY(2px)}
html,body,canvas{overscroll-behavior:none}
@media(pointer:coarse),(max-width:760px){.touch-controls{display:flex}.help{display:none}.brand{font-size:10px}.stats{font-size:12px;gap:12px}.hud{left:12px;right:12px;padding:12px}.journey{left:25px;top:90px}.powers{gap:10px;font-size:11px}#toast{top:162px;font-size:12px}}
@media(max-height:450px){.touch-controls{bottom:12px}.touch-controls button{height:58px;width:60px}.hud{top:10px}.journey{top:75px}.card{padding:20px}}
@media(max-width:420px){.touch-controls{left:12px;right:12px}.directions,.actions{gap:8px}.touch-controls button{width:56px;height:60px}.touch-controls .jump{width:66px}}
#fullscreen{position:absolute;right:24px;top:max(88px,calc(env(safe-area-inset-top) + 74px));z-index:5;background:#17233e;color:#dffbff;border:2px solid #7cf0ff88;padding:10px 12px;font:700 11px inherit;cursor:pointer;touch-action:manipulation}
#fullscreen:focus-visible{outline:3px solid #ffcf6b;outline-offset:3px}
main:fullscreen,main.expanded{width:100vw;height:100dvh;max-width:none;max-height:none;background:#0d1130}main.expanded{position:fixed;inset:0;z-index:10}
@media(max-width:760px){#fullscreen{right:12px;font-size:0;width:36px;height:34px;padding:0}#fullscreen::after{content:"\\26f6";font-size:22px}#fullscreen[aria-pressed="true"]::after{content:"\\d7"}}
@media(max-height:450px){#fullscreen{top:74px}}

#journey-menu{position:absolute;right:170px;top:88px;z-index:2;background:#17233e;color:#f5e6c3;border:2px solid #8fb2b0;padding:10px 14px;font:700 11px inherit;cursor:pointer}
#campaign-menu{z-index:6;overflow:auto;padding:20px;background:#18263bf2;place-items:start center}
.atlas{width:min(960px,100%);margin:auto;color:#e9ecd8}.atlas header{display:flex;align-items:center;justify-content:space-between;gap:20px}.atlas h1{font:900 clamp(28px,5vw,48px) ui-monospace,monospace;letter-spacing:-2px;margin:10px 0;color:#f7e5b2}.atlas p{line-height:1.6;color:#bed3d2;font-size:13px}.eyebrow{letter-spacing:3px;font-size:10px;color:#b1d99c}.atlas button{background:#283e51;border:1px solid #789c9b;color:#f4efd9;font:600 13px ui-monospace,monospace;padding:12px;cursor:pointer}.atlas button:hover:enabled{background:#3b5b69}.atlas button:disabled{opacity:.35;cursor:default}.atlas button:focus-visible{outline:3px solid #f4d99b;outline-offset:3px}.menu-actions{display:flex;gap:10px;flex-wrap:wrap;margin:14px 0}.worlds{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin:20px 0}.world{border-top:4px solid #91bc91;background:#223447;padding:12px}.world:nth-child(2){border-color:#8dcbd4}.world:nth-child(3){border-color:#e6a083}.world:nth-child(4){border-color:#bcafe0}.world h2{font-size:14px;margin:0 0 14px}.world button{width:100%;text-align:left;margin:4px 0;min-height:60px;font-size:11px}.field-guide{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}.friend{background:#223447;padding:12px;display:flex;align-items:center;gap:8px}.friend canvas{width:55px;height:60px;flex:none}.friend strong{color:#f3d9a3;font-size:12px}.friend p{font-size:11px;margin:5px 0}#save-status{font-size:11px;color:#d7c6a5}
@media(max-width:760px){#journey-menu{right:60px;font-size:10px;padding:9px}.worlds{grid-template-columns:repeat(2,1fr)}.field-guide{grid-template-columns:repeat(2,1fr)}.journey{max-width:calc(100% - 24px);left:12px;top:132px}.journey .powers{font-size:10px;gap:8px}.track{margin:5px 0}.journey{font-size:9px;padding:8px}#toast{top:220px;font-size:11px}.hud{gap:4px}.stats{gap:8px}.touch-controls{left:8px;right:8px}.directions,.actions{gap:5px}.touch-controls button{width:48px;height:56px}.touch-controls .switch,.touch-controls .ability{width:54px;font-size:10px}.touch-controls .jump{width:56px;font-size:11px}.atlas header{display:block}.atlas h1{font-size:30px}.atlas{padding-bottom:20px}}
@media(max-height:450px){.touch-controls{display:flex}.journey{top:65px;left:12px;max-width:52%}#journey-menu{top:10px;right:155px}#fullscreen{top:10px}.hud{right:260px}#toast{top:126px}.help{display:none}}
</style></head><body><main id="game-shell" aria-label="Creature Call game">
<button id="journey-menu" type="button">MAP / GUIDE</button>
<button id="fullscreen" type="button" aria-label="Toggle fullscreen" aria-pressed="false">FULLSCREEN</button>
<canvas id="game" tabindex="-1" aria-label="A rescue platformer. Move with A and D or arrow keys; jump with Space or W; use your companion's ability with C or K; switch companions with Q, E, or the number keys."></canvas>
<header class="hud"><span class="brand">CREATURE CALL</span><div class="stats"><span id="coins">Coins: 0</span><span id="lives">Lives: 3</span></div></header>
<div class="journey"><span id="route"></span><div class="track"><div id="progress"></div></div><div class="powers"><span id="crew"></span><span id="shards">◆ 0/0</span></div></div><div id="toast" role="status"></div>
<div class="help">← → / A D &nbsp; Move &nbsp; · &nbsp; Space / W &nbsp; Jump &nbsp; · &nbsp; C / K &nbsp; Ability &nbsp; · &nbsp; Q / E or 1-6 &nbsp; Switch companion</div>
<div class="touch-controls" aria-label="Touch controls"><div class="directions"><button type="button" data-action="left" aria-label="Move left">←</button><button type="button" data-action="right" aria-label="Move right">→</button></div><div class="actions"><button type="button" class="switch" data-action="switch" aria-label="Switch companion">SWITCH</button><button type="button" class="ability" data-action="ability" aria-label="Use companion ability">ABILITY</button><button type="button" class="jump" data-action="jump" aria-label="Jump">JUMP</button></div></div>
<section id="end-screen" class="overlay" role="dialog" aria-modal="true" aria-labelledby="end-title" aria-describedby="end-detail" hidden><div class="card"><h1 id="end-title"></h1><p id="end-detail"></p><button id="restart" type="button">Play again</button></div></section>
<section id="campaign-menu" class="overlay" role="dialog" aria-modal="true" aria-label="Journey map" hidden><div class="atlas"><header><div><span class="eyebrow">SIX FRIENDS · FOUR WORLDS · ONE SKYHEART</span><h1>CREATURE CALL</h1><p>Find your crew. Learn their gifts. Bring the islands back to life.</p></div><button id="menu-back">Play / return →</button></header><div class="menu-actions"><button id="saved-journey">Resume saved journey</button><button id="new-journey">New journey</button></div><div id="save-status">Progress saves in this browser at checkpoints, discoveries and stage clears.</div><div class="worlds"><div class="world"><h2>Mosslight Isles</h2><p>Learn to smash, glide and grow</p><button id="level-0">Stage 1</button><button id="level-1">Stage 2</button><button id="level-2">Stage 3</button></div><div class="world"><h2>Glasswater Coast</h2><p>Meet fire, ice and electricity</p><button id="level-3">Stage 4</button><button id="level-4">Stage 5</button><button id="level-5">Stage 6</button></div><div class="world"><h2>Copperfall Works</h2><p>Combine abilities under pressure</p><button id="level-6">Stage 7</button><button id="level-7">Stage 8</button><button id="level-8">Stage 9</button></div><div class="world"><h2>Aurora Heights</h2><p>Restore the Skyheart</p><button id="level-9">Stage 10</button><button id="level-10">Stage 11</button><button id="level-11">Stage 12</button></div></div><div class="field-guide"><div class="friend"><canvas id="portrait-crag" width="56" height="60" aria-label="crag portrait"></canvas><div><strong>CRAG</strong><p>Break tall stone barriers.</p></div></div><div class="friend"><canvas id="portrait-glint" width="56" height="60" aria-label="glint portrait"></canvas><div><strong>GLINT</strong><p>Hold ability in wind to fly.</p></div></div><div class="friend"><canvas id="portrait-sprig" width="56" height="60" aria-label="sprig portrait"></canvas><div><strong>SPRIG</strong><p>Grow lasting vine bridges.</p></div></div><div class="friend"><canvas id="portrait-cinder" width="56" height="60" aria-label="cinder portrait"></canvas><div><strong>CINDER</strong><p>Burn tangled thorn walls.</p></div></div><div class="friend"><canvas id="portrait-floe" width="56" height="60" aria-label="floe portrait"></canvas><div><strong>FLOE</strong><p>Freeze water. Watch the timer.</p></div></div><div class="friend"><canvas id="portrait-volt" width="56" height="60" aria-label="volt portrait"></canvas><div><strong>VOLT</strong><p>Power matching lettered circuits.</p></div></div></div><p>Move ← → / A D · Jump Space / W · Ability C / K · Switch Q / E or 1–6 · Fullscreen F<br>Charge circuits again to retry. Checkpoints keep your companions and cleared obstacles.</p></div></section></main><script>(${gameClient.toString()})();</script></body></html>`;
app.get('/', (req, res) => res.type('html').send(page));
if (require.main === module) {
  const port = process.env.PORT || 3000;
  app.listen(port, '0.0.0.0', () => console.log('Creature Call listening on ' + port));
}
module.exports = { app, page, gameClient };
