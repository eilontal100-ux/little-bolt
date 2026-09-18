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
    ['warren',['#241a10','#5c4632','#a8865a'],'#4a3826','#382a1c','#241a10','#e0c98a'],
    ['hollow',['#131a3a','#2e3c72','#7f97e8'],'#2c3a66','#1f2952','#141a38','#c8d4ff'],
    ['crossing',['#1c3325','#3f6d4a','#8fd39d'],'#356a49','#254a36','#162c22','#e3f7c4'],
    ['ember',['#331411','#7a2f22','#e07a4a'],'#5e2a1f','#421c15','#2a110d','#ffcf8f'],
    ['gale',['#0e2b3f','#1f5b73','#6fd6e0'],'#1c4f5f','#153a47','#0c222c','#c8f7ff'],
    ['zenith',['#1a1330','#3d2c66','#a892f0'],'#382a5c','#241a42','#160f2a','#e6d9ff'],
  ].forEach(([id,sky,ground,mid,deep,edge])=>{PAL[id]={sky,ground,mid,deep,edge,pillar:mid,accent:edge};});

  PAL.resonance=PAL.hollow;PAL.burrow=PAL.warren;

function createCreatureArt(){
  const colors={
    crag:['#25333c','#626d80','#909ba5','#d7d2b7','#e9b25e','#fff0bd'],
    glint:['#282f52','#635ca6','#a398de','#e5daf7','#79e1de','#e9ffff'],
    sprig:['#213d3a','#3c8573','#79bd87','#d6eab0','#edb670','#fff4d0'],
    cinder:['#442c3c','#b05456','#ed8971','#f9cfa0','#ffe076','#fff7d5'],
    floe:['#24435e','#4f88aa','#88c6d4','#d4f0e8','#b1a5e8','#ffffff'],
    volt:['#33313f','#897344','#d4b967','#f6e7a0','#91e1c4','#f2fff2'],
    burrow:['#1e140f','#6b4a34','#a17a54','#e6c9a0','#ffb454','#fff3cf'],
    echo:['#241528','#5c3160','#9a5aa0','#e6c2e8','#ff8fc0','#ffe9f7'],
    tether:['#211a2b','#4b3f5e','#7c6f92','#cfc4e6','#f5efe0','#ffffff'],
    zip:['#3a2418','#8a6a48','#c9a06c','#f0dcb0','#ff9bbd','#fff6e8'],
    tempo:['#1a2e28','#3f6b52','#6fa387','#c8e8d4','#e8c15a','#fff6d8']
  };
  // Six independently drawn silhouettes: shell, wings, leaf ears, curled horns,
  // fins and segmented antennae. Palette indexes: outline/shadow/mid/light/accent/glint.
  const grids={
    tether:["      000000      ", "    0012222100    ", "   012334433210   ", "   023445544320   ", "   023455554320   ", "   012344443210   ", "    0123333210    ", " 00 0122222210 00 ", " 020 00122100 020 ", "  02002333320020  ", "   002355553200   ", "000023503305320000", "022023333333320220", " 0022333333332200 ", "   012233332210   ", " 000012222210000  ", "020  01222210  020", "020   000000   020", " 020          020 ", "  00          00  ", "   00        00   ", "  030        030  ", "  000        000  "],
    zip:["   00       00    ", "  0440     0440   ", "  0420     0240   ", "  0420     0240   ", "  04220   02240   ", "   0120000210     ", "   0222222220     ", "  023333333320    ", "  023553355320    ", "  023503350320    ", "  023333333320    ", "   0233443320     ", "    02333320      ", "   0123333210     ", "   0233333320     ", "   0223333220  00 ", "  022223322220 020", " 0232222222320020 ", " 023330000333020  ", "  0330    03300   ", " 03330    03330   ", "033330    033330  ", "000000    000000  "],
    tempo:["                  ", "                  ", "     000000       ", "   0024444200     ", "  024333333420    ", " 02433044333420   ", "0243304224333420  ", "0233042332433320  ", "0233042342433320  ", "0233042342433320  ", "0233042222433320  ", "0233304444333320  ", "0243333333333420  ", " 02433333333420   ", "  024444444420    ", "   0000000000 050 ", "  01222222210 050 ", " 012333333321020  ", "01233333333322320 ", "023333333333333320", " 0233333333333320 ", "  01111111111110  ", "   000000000000   "],

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
    ],
    // Stout digger: rounded head/back, small dark eye dots, an amber lamp-nose
    // (accent+bright clusters), and wide mitten forepaws breaking the silhouette.
    burrow:[
      '   0000      0000   ','  022220    022220  ',' 0222222222222222220',
      '02222222222222222220','0223333333333333220 ','022330033330033220  ',
      '02233333333333320   ','0223334444444332200 ',' 02234555555543220  ',
      ' 022345555555432200 ','  0223344444322000  ','  02233333333220    ',
      '1440222222222204411 ','144111111111111441  ',' 01111111111111110  ',
      '  0222222222222220  ','  0233333333333320  ','   02222222222220   ',
      '   0111111111111 0  ','    011      110    ','   000       000    ',
      '  0330      0330    ','  0000      0000    '
    ],
    // Small bat: notched scalloped ears, dark eye dots, and broad wings whose
    // trailing edge is cut with blank gaps to read as a scalloped membrane.
    echo:[
      '  0440      0440   ',' 042240    042240   ',' 022222222222222220 ',
      '  022222222222220   ',' 0222233333322220   ','02233003333003322 0',
      '0223333333333333220','022333333333333322 ','444402222222220444 ',
      '4444402222222044444 ','4 44402222222044 44',' 0222222222222220   ',
      '  02333333333320    ','   0222222222220    ','   0111111111110    ',
      '    01111111100     ','     011111100      ','      0111100       ',
      '       01100        ','        00          ','   000       000    ',
      '  0330      0330    ','  0000      0000    '
    ]
  };
  const regions={
    habitat:{sky:'#b9dfd4',haze:'#def0d0',far:'#88b9ad',mid:'#639c99',ink:'#314e57',soil:'#856954',dark:'#604f48',top:'#b9dc86',trim:'#76ad79',stone:'#d4c9a3'},
    tide:{sky:'#adcddd',haze:'#e3e1c1',far:'#7aa6b8',mid:'#4e8199',ink:'#304c69',soil:'#777b85',dark:'#515b71',top:'#dce4d2',trim:'#8dbbb4',stone:'#d8d2b0'},
    foundry:{sky:'#573d60',haze:'#c47e79',far:'#754f69',mid:'#603f56',ink:'#2c3045',soil:'#796477',dark:'#494258',top:'#e8b37c',trim:'#ba7f64',stone:'#baa1a0'},
    aurora:{sky:'#252f52',haze:'#526777',far:'#3b526c',mid:'#324760',ink:'#1d2d49',soil:'#6b7394',dark:'#465575',top:'#d2eddf',trim:'#91bfc6',stone:'#c5c7df'},
    burrow:{sky:'#241a2e',haze:'#3a2a3f',far:'#4a3550',mid:'#3a2840',ink:'#1a1220',soil:'#5c4030',dark:'#3a281e',top:'#caa15a',trim:'#8a6a42',stone:'#a68f6a'},
    resonance:{sky:'#1a2440',haze:'#2e3f5e',far:'#28405c',mid:'#1f3350',ink:'#101a30',soil:'#3a4a68',dark:'#25314a',top:'#cfe6ff',trim:'#7ea8c9',stone:'#b8cfe0'}
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
    if(id==='echo'&&(act||air||run&&frame)){
      rows[8]='4444402222222044444 ';rows[9]='444444022222204444440';rows[10]='44 4440222222044 4444';
    }
    if(act&&id==='burrow'){rows[7]='0223345555555543320 ';rows[8]=' 02235555555555532200';rows[9]='  022355555555553220 ';}
    if(act&&id==='tether'){rows[8]='040 0122222210 040 ';rows[9]='044002333333200440 ';}
    if(act&&id==='zip'){rows[0]='   0000     0000   ';rows[1]='  044440   044440  ';}
    if(act&&id==='tempo'){rows[7]='0233042552433320  ';rows[8]='0233042552433320  ';}
    const yy=y+2+(run?frame*2:Math.floor(t*2)%2*2)-(air?2:0);
    pixelGrid(c,rows,colors[id],x-5,yy,2,facing<0);
    if(act){for(let i=0;i<5;i++){const a=t*5+i*1.256;box(c,x+17+Math.cos(a)*27,y+25+Math.sin(a)*25,4,4,colors[id][4]);}}
  }
  function drawBackdrop(c,view,camera,region,t){
    const p=regions[region]||regions.habitat;box(c,0,0,view.w,view.h,p.sky);
    for(let i=0;i<8;i++)box(c,0,220+i*20,view.w,20,i%2?p.haze:p.sky);
    // Pixel cloud banks / aurora ribbons / cave ceiling drips / night stars.
    if(region==='burrow'){
      for(let i=-1;i<Math.ceil(view.w/140)+2;i++){
        const x=i*140-(camera*.08%140);
        box(c,x+14,0,10,50+((i+3)%3)*20,p.ink);box(c,x+40,0,7,30+((i+5)%2)*22,p.ink);
      }
    }else if(region==='resonance'){
      box(c,view.w*0.76,42,50,50,'#eef4ff');box(c,view.w*0.76+8,42,50,50,p.sky);
      for(let i=0;i<26;i++){const sx=(i*97+camera*.02)%view.w,sy=(i*53)%170;box(c,sx,sy,2,2,'#eaf3ff');}
    }else{
      for(let i=-1;i<Math.ceil(view.w/180)+2;i++){
        const x=i*180-(camera*.08%180),y=70+((i+9)%3)*25;
        box(c,x,y+10,100,12,p.haze);box(c,x+20,y,54,12,p.haze);
        if(region==='aurora'){box(c,x+30,y-20,8,42,'#70afa8');box(c,x+44,y-14,8,42,'#8c9ec0');}
      }
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
        }else if(region==='aurora'){
          box(c,x+25,y+20,120,130,col);box(c,x+45,y,80,20,col);box(c,x+65,y-20,40,20,col);
          box(c,x+16,y+18,140,8,p.haze);for(let k=0;k<3;k++)box(c,x+42+k*35,y+45,14,60,p.sky);
          box(c,x+78,y-46,14,25,p.haze);
        }else if(region==='burrow'){
          // Underground archive: standing stone shelf-pillars threaded with root veins.
          box(c,x+10,y,26,180,col);box(c,x+70,y-10,26,190,col);box(c,x+130,y+10,26,170,col);
          for(let k=0;k<5;k++)box(c,x+4,y+10+k*32,150,6,p.haze);
          box(c,x+40,y-30,10,40,col);box(c,x+100,y-20,10,36,col);
        }else if(region==='resonance'){
          // Moonlit lake: reed silhouettes, a crystal spire, and a still water band.
          box(c,x+20,y+60,8,90,col);box(c,x+34,y+40,8,110,col);box(c,x+140,y+70,8,80,col);
          box(c,x+80,y-10,14,150,col);box(c,x+74,y-30,26,24,col);
          box(c,x-10,y+150,190,6,p.haze);
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
    }else if(region==='burrow'){
      // Rooted earth strata braced with amber support beams.
      for(let x=s.x+10;x<s.x+s.w-10;x+=44){box(c,x,s.y+14,6,Math.max(0,s.h-18),p.trim);box(c,x-3,s.y+10,12,6,p.top);}
      for(let y=s.y+22;y<s.y+s.h;y+=18)for(let x=s.x+2;x<s.x+s.w-2;x+=26){if((Math.floor(x/26)+Math.floor(y/18))%3===0)box(c,x,y,14,4,p.stone);}
    }else if(region==='resonance'){
      // Damp lakebed stone with faint luminous vein inlays.
      for(let x=s.x+6;x<s.x+s.w-8;x+=34)box(c,x,s.y+14,20,Math.max(0,s.h-18),p.soil);
      for(let x=s.x+14;x<s.x+s.w-14;x+=68)box(c,x,s.y+20,4,Math.max(0,s.h-28),p.top);
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
    if(o.type==='anchor'){
      box(c,x+w/2-2,y-16,4,16,'#8a7b9d');box(c,x,y,w,h,'#493c62');box(c,x+3,y+3,w-6,h-6,'#f5efd8');box(c,x+7,y+7,w-14,h-14,'#493c62');
    }else if(o.type==='movingPlatform'){
      box(c,x,y,w,h,'#334b56');box(c,x,y,w,5,'#c1f5d9');
      for(let xx=x+6;xx<x+w-8;xx+=16){box(c,xx,y+7,9,5,'#72b19b');box(c,xx+2,y+h-4,5,4,'#d9ba6c');}
    }else if(o.type==='saw'){
      const cx=x+w/2,cy=y+h/2,r=Math.min(w,h)/2;
      c.fillStyle='#f5c0ab';c.beginPath();
      for(let i=0;i<24;i++){const a=i*Math.PI/12+t*3,rr=i%2?r*.66:r;const xx=cx+Math.cos(a)*rr,yy=cy+Math.sin(a)*rr;if(i)c.lineTo(xx,yy);else c.moveTo(xx,yy);}
      c.closePath();c.fill();box(c,cx-5,cy-5,10,10,'#704f66');box(c,cx-2,cy-2,4,4,'#fff3d4');
    }else if(['grappleGap','dashGap','clockGap'].includes(o.type)){
      box(c,x-8,y-8,8,8,'#ffe0a3');box(c,x+w,y-8,8,8,'#ffe0a3');
    }else if(o.type==='rock'){
      if(o.solved){box(c,x,488,w,12,'#77808e');return;}
      box(c,x,y,w,h,'#30394b');for(let yy=y+4;yy<y+h;yy+=28){box(c,x+4,yy,w-8,24,'#8d96a0');box(c,x+6,yy+2,w-14,4,'#c5c9bc');box(c,x+w/2,yy+8,4,14,'#535e72');}
    }else if(o.type==='thorn'){
      if(o.solved){box(c,x,492,w,8,'#976e61');return;}
      for(let yy=y;yy<y+h;yy+=20){box(c,x+10,yy,20,24,'#34424d');box(c,x+4,yy+4,32,6,'#846483');box(c,x-4,yy,12,6,'#d1949b');box(c,x+30,yy+12,14,6,'#d1949b');}
    }else if(o.type==='wind'){
      const active=!o.link||o.active;for(let i=0;i<7;i++){const xx=x+15+i*(w-30)/7,yy=y+((t*(active?80:12)+i*70)%h);box(c,xx,yy,4,30,active?'#e1fff0':'#657587');box(c,xx-4,yy+4,12,4,active?'#a2d8d3':'#657587');}
      box(c,x,494,w,6,'#577c91');
    }else if(o.type==='seed'||o.type==='water'||o.type==='crystal'){
      if(o.solved){
        const top=500;
        const topCol=o.type==='water'?'#e0fffc':o.type==='crystal'?'#eafcff':'#c7dfa2';
        const bodyCol=o.type==='water'?'#7dbacc':o.type==='crystal'?'#8fd8ff':'#689677';
        const specCol=o.type==='water'?'#bde5e1':o.type==='crystal'?'#d8f4ff':'#a6c884';
        box(c,x,top,w,6,topCol);box(c,x,top+6,w,12,bodyCol);
        for(let xx=x+6;xx<x+w-8;xx+=24)box(c,xx,top+8,12,3,specCol);
        if(o.type==='crystal'){const pulse=0.4+Math.sin(t*3)*0.2;c.globalAlpha=pulse;box(c,x,top-4,w,3,'#bfefff');c.globalAlpha=1;}
      }
      else if(o.type==='water'){box(c,x,548,w,52,'#375f8b');for(let xx=x;xx<x+w-12;xx+=24)box(c,xx,546+Math.floor(Math.sin(t*3+xx)*2)*2,16,4,'#a9d9e0');}
      else if(o.type==='crystal'){
        // Unsolved: a clearly marked resonant crystal trigger at the bank, pulsing.
        box(c,x-16,486,16,20,'#2b3a55');
        const pulse=0.5+Math.sin(t*3)*0.3;c.globalAlpha=pulse;box(c,x-13,472,10,18,'#8fd8ff');c.globalAlpha=1;
        box(c,x-15,468,14,6,'#e0f7ff');
      }
      else{box(c,x-18,481,18,19,'#44745f');box(c,x-12,472,6,18,'#a8d28b');box(c,x-20,468,14,6,'#dbeeb4');}
      if(o.remaining>0){box(c,x,520,w,4,'#334b6b');box(c,x,520,w*o.remaining/o.duration,4,'#defff3');}
    }else if(o.type==='relay'){
      box(c,x-4,y+5,w+8,h-5,'#303c57');box(c,x,y,w,12,o.active?'#f7e6a0':'#988989');box(c,x+8,y+16,14,18,o.active?'#a9e4c0':'#555d7d');box(c,x+12,y+19,6,11,'#fff4ba');
    }else if(o.type==='gate'){
      box(c,x-6,y,6,h,'#8d90a9');box(c,x+w,y,6,h,'#8d90a9');box(c,x-6,y,w+12,12,'#d9ddce');
      if(!o.active&&!o.solved)for(let xx=x+4;xx<x+w;xx+=10)box(c,xx,y+12,5,h-12,'#e0be78');
    }else if(o.type==='clay'){
      // Layered ochre wall; disappears entirely once solved (no rubble left behind).
      if(o.solved)return;
      box(c,x,y,w,h,'#5a3a22');
      let row=0;
      for(let yy=y+3;yy<y+h-3;yy+=16){
        const off=(row%2)*10;row++;
        for(let xx=x+off;xx<x+w;xx+=20){
          const bw=Math.min(16,x+w-xx-2);if(bw<=0)continue;
          box(c,xx+1,yy,bw,12,'#c98a4a');box(c,xx+1,yy,bw,3,'#e8b06a');box(c,xx+1,yy+9,bw,3,'#8a5a30');
        }
      }
      c.strokeStyle='#3a2414';c.lineWidth=2;
      c.beginPath();c.moveTo(x+w*0.3,y+4);c.lineTo(x+w*0.45,y+h*0.5);c.lineTo(x+w*0.25,y+h-4);c.stroke();
      c.beginPath();c.moveTo(x+w*0.7,y+2);c.lineTo(x+w*0.6,y+h*0.6);c.lineTo(x+w*0.8,y+h-2);c.stroke();
    }else if(o.type==='spikes'){
      // Ground-supported teeth exactly filling the given rectangle.
      box(c,x,y,w,Math.min(6,h),'#2a2333');
      const cols=Math.max(1,Math.round(w/16)),tooth=w/cols;
      c.fillStyle=o.solved?'#5a6070':'#d7d2c0';
      for(let i=0;i<cols;i++){
        const xx=x+i*tooth;
        c.beginPath();c.moveTo(xx,y+h);c.lineTo(xx+tooth/2,y);c.lineTo(xx+tooth,y+h);c.closePath();c.fill();
      }
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
  SPECIES.push(
    {id:'burrow',label:'BURROW',ability:'DIG',prompt:'C/K to dig through clay walls'},
    {id:'echo',label:'ECHO',ability:'SING',prompt:'C/K near a crystal node to ring a permanent bridge into being'}
  );
  SPECIES.push(
    {id:'tether',label:'TETHER',ability:'GRAPPLE',prompt:'C/K pulls you to a ring ahead. Press again to release'},
    {id:'zip',label:'ZIP',ability:'AIR DASH',prompt:'Jump, then C/K to dash in your facing direction. Land to recharge'},
    {id:'tempo',label:'TEMPO',ability:'STASIS',prompt:'C/K freezes moving platforms and saws for 4s. Recharge takes 7s'}
  );
  function speciesOf(id){return SPECIES.find(s=>s.id===id);}

  /* ---------------- Campaign / stage data ---------------- */
  // World/state contract: obstacles are {type:'rock'|'wind'|'seed'|'thorn'|'water'|'relay'|'gate'|'clay'|'crystal'|'spikes', x,y,w,h, solved}.
  // rock: tall wall, blocks movement until Crag smashes it (cannot be jumped, h=200 > max jump height ~128).
  // wind: a marked zone above a wide ravine (w=300 > max jump distance ~211); only Glint gets lift while holding the ability inside it.
  // seed: a trigger at a gap edge; Sprig grows a solid bridge spanning the full gap width. A fixed ceiling above the gap blocks a glide bypass.
  // thorn: a permanent wall like rock, cleared by Cinder. water: a timed freeze-bridge like seed, activated by Floe, reverts on expiry.
  // relay/gate: Volt charges a timed relay that powers a linked gate (opens while charged) or wind zone.
  // clay: a permanent wall like rock/thorn, cleared by Burrow. crystal: a permanent bridge like seed, rung into place by Echo (needs a ceiling too).
  // spikes: a ground hazard, not a puzzle gate — touching it costs a life through the normal loseLife() path, respecting the invulnerability grace window.
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
  function expedition(name,region,width,gaps,barriers,devices,rescues,platforms,checkpoints,hint,hazards=[]){
    const sorted=[...gaps].sort((a,b)=>a.x-b.x);let cursor=0;
    const grounds=[];for(const gap of sorted){grounds.push({x:cursor,w:gap.x-cursor});cursor=gap.x+gap.w;}grounds.push({x:cursor,w:width-cursor});
    const o=mkStage({name,palette:region,width,flagX:width-100,spawn:{x:40,y:452},grounds,
      obstacles:[...barriers.map(([type,x])=>({type,x,y:280,w:44,h:220})),...gaps.map(g=>({...g,y:g.type==='wind'?100:470,h:g.type==='wind'?650:30})),...devices,...hazards.map(([x,w])=>({type:'spikes',x,y:480,w,h:20}))],
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
  STAGES.push(
    expedition('Underroot Warren','warren',2600,[],
      [['clay',680],['clay',1680]],[],[['burrow',300]],
      [[1050,410,90],[1180,330,90],[1310,250,90]],[100,1100,2000],
      'Rescue Burrow. Dig through packed clay walls — the upper ledges hide a relic.'),
    expedition('Glassbell Hollow','hollow',2800,[{type:'crystal',x:820,w:310}],
      [],[],[['echo',300]],
      [[1250,410,90],[1380,330,90],[1510,250,90]],[100,1220,2100],
      'Rescue Echo. Sing at crystal nodes to ring a permanent bridge across the chasm.'),
    expedition('Rootlight Crossing','crossing',2900,[{type:'seed',x:1400,w:300}],
      [['clay',2000]],[],[],
      [[600,410,80],[720,330,80],[840,250,80]],[100,900,1900],
      'Old paths return, guarded by new ground. Clear the spike run, grow a crossing, then dig the last wall.',
      [[300,60]]),
    expedition('Cinderclay Foundry','ember',3100,[{type:'wind',x:820,w:400,link:'a'}],
      [['clay',560],['thorn',1750]],[relay('a',700,10),gate('a',1300)],[],
      [[1850,410,80],[1980,330,80],[2110,250,80]],[100,1780,2400],
      'Charge the relay before the wind current fades, then dig and burn what blocks the foundry floor.',
      [[2600,50]]),
    expedition('Stormglass Reach','gale',3200,[{type:'water',x:700,w:380,duration:5},{type:'crystal',x:1680,w:320}],
      [],[],[],
      [[2100,410,80],[2230,330,80],[2360,250,80],[2490,170,80]],[100,1620,2050],
      'Freeze first, ring the crystal second — the rising ledges across the spikes hide a relic route.',
      [[1300,60]]),
    expedition('The Last Chorus','zenith',3800,[{type:'crystal',x:640,w:320},{type:'wind',x:1650,w:420,link:'a'}],
      [['clay',420],['thorn',2260],['rock',3000]],[relay('a',1500,11),gate('a',2160)],[],
      [[2350,410,80],[2480,330,80],[2610,250,80],[2740,170,80]],[100,1080,2200,3080],
      'Finale: dig, ring the crystal, charge the last circuit before its gate closes, then burn and smash your way to the Skyheart.',
      [[3350,60]])
  );
  STAGES[12].region='burrow';STAGES[13].region='resonance';STAGES[14].region='burrow';
  STAGES[15].region='foundry';STAGES[16].region='resonance';STAGES[17].region='aurora';
  // Open-air trials use movement and timing rather than a barrier/bridge ability gate.
  function motionTrial(name,region,width,gaps,devices,rescue,platforms,checkpoints,hint){
    let cursor=0;const grounds=[];
    for(const [type,x,w] of gaps){grounds.push({x:cursor,w:x-cursor});cursor=x+w;}
    grounds.push({x:cursor,w:width-cursor});
    const st=mkStage({name,palette:region,width,flagX:width-100,spawn:{x:40,y:452},grounds,
      obstacles:[...gaps.map(([type,x,w])=>({type,x,y:500,w,h:20})),...devices],
      creatures:rescue?[{id:rescue,x:240,y:450}]:[],platforms,checkpoints,
      coins:checkpoints.map(x=>[x+45,465]),shards:platforms.map(([x,y,w])=>[x+w/2,y-28])});
    st.hint=hint;return st;
  }
  const anchor=(x,y=250)=>({type:'anchor',x,y,w:24,h:24});
  const ferry=(x,range=55,speed=0.8)=>({type:'movingPlatform',x,y:455,w:150,h:18,range,speed});
  const saw=(x,y=454,range=45,speed=1.2)=>({type:'saw',x,y,w:34,h:34,range,speed});
  STAGES.push(
    motionTrial('Silkway Canopy','habitat',2400,[['grappleGap',650,360],['grappleGap',1490,380]],
      [anchor(930),anchor(1790,220)],'tether',[[1110,410,100],[1230,330,90]],[100,1120,2010],
      'Meet Tether. Face a ring and tap C/K to pull upward. Release near it and steer to the far bank.'),
    motionTrial('Comet Run','aurora',2500,[['dashGap',660,300],['dashGap',1660,320]],
      [saw(1400)],'zip',[[1090,410,90],[1190,330,90]],[100,1050,2090],
      'Meet Zip. Jump at the lip, then dash in midair. One dash per landing; solid walls still stop you.'),
    motionTrial('The Stillwater Clock','tide',2500,[['clockGap',670,330],['clockGap',1670,330]],
      [ferry(760),saw(1400),ferry(1760,60)],'tempo',[[1120,400,100]],[100,1110,2110],
      'Meet Tempo. Freeze a ferry near the middle, jump onto it, then jump to shore. Saws freeze too.'),
    motionTrial('Thread the Needle','resonance',2800,[['grappleGap',580,390],['dashGap',1420,320],['grappleGap',2050,380]],
      [anchor(890,210),anchor(2350,245),saw(1280)],null,[[990,400,90],[1090,315,80]],[100,1020,1840,2520],
      'Pull high with Tether, land to charge Zip, then reach the moonlit rings.'),
    motionTrial('Pendulum Gardens','habitat',2700,[['clockGap',590,330],['grappleGap',1790,380]],
      [ferry(680,65),saw(1180),saw(1490,454,65),anchor(2090,215)],null,[[2260,410,90],[2370,325,90]],[100,1020,1620,2300],
      'Stop the garden clock to choose your moment. Stasis ends after four seconds; its recharge keeps counting.'),
    motionTrial('Meteor Switchbacks','foundry',2800,[['dashGap',620,320],['dashGap',1470,310],['clockGap',2160,330]],
      [saw(1300),ferry(2250)],null,[[980,410,95],[1090,325,90]],[100,1030,1900,2570],
      'Dash across the broken foundry, land between bursts, then stop the final ferry.'),
    motionTrial('Borrowed Seconds','burrow',3000,[['clockGap',570,330],['dashGap',1410,320],['clockGap',2330,330]],
      [ferry(660),saw(1110),saw(2150,454,45),ferry(2420,65)],null,[[1810,410,100],[1920,325,90]],[100,1010,1830,2790],
      'Borrow time at the first ferry. Dash through the archive and wait safely for your clock to recharge.'),
    motionTrial('Silk and Lightning','resonance',3100,[['grappleGap',620,380],['clockGap',1590,330],['dashGap',2430,320]],
      [anchor(920,225),ferry(1680),saw(2140)],null,[[1140,400,100],[1250,315,90]],[100,1120,2040,2830],
      'Grapple above the lake, stop its drifting platform, then take one long air dash home.'),
    motionTrial('Beyond the Skyheart','aurora',3600,[['dashGap',570,320],['grappleGap',1350,380],['clockGap',2210,330],['grappleGap',2920,380]],
      [anchor(1650,220),ferry(2300),anchor(3220,210),saw(1940)],null,[[990,410,90],[1100,325,90]],[100,1010,1820,2650,3380],
      'The final ascent: leap, dash, pull, and stop time. Every landing is a chance to plan your next move.')
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

  // Only timers, lives and damage grace vary by difficulty; movement physics above stay identical so every mode is completable.
  const DIFFICULTIES = {
    easy:   { label:'EASY',       timerMul:1.5, lives:5, grace:2   },
    normal: { label:'NORMAL',     timerMul:1,   lives:3, grace:1.2 },
    hard:   { label:'HARD',       timerMul:0.85,lives:2, grace:0.8 },
    extra:  { label:'EXTRA HARD', timerMul:0.7, lives:1, grace:0.5 },
  };
  const DIFFICULTY_ORDER = ['easy','normal','hard','extra'];
  let difficulty = 'normal';
  let grapple=null,dashTime=0,dashReady=true,dashDirection=1,stasisTime=0,stasisCooldown=0;
  let etStarted=0,adminPrevious='playing',adminFocus=null,adminActive=false,adminInvincible=false,adminSnapshot=null;
  function resetMotion(){grapple=null;dashTime=0;dashReady=true;stasisTime=0;stasisCooldown=0;}
  function clearSight(a){
    const x=player.x+17,y=player.y+24,dx=a.x+12-x,dy=a.y+36-y;
    const n=Math.ceil(Math.hypot(dx,dy)/8);
    for(let i=1;i<n;i++){const point={x:x+dx*i/n-2,y:y+dy*i/n-2,w:4,h:4};
      if(solids.some(s=>s.kind!=='movingPlatform'&&overlaps(point,s)))return false;}
    return true;
  }
  function updateMotion(dt){
    const frozen=stasisTime>0;
    stasisTime=Math.max(0,stasisTime-dt);stasisCooldown=Math.max(0,stasisCooldown-dt);
    for(const o of obstacles){
      if(!['movingPlatform','saw'].includes(o.type))continue;
      if(frozen)continue;
      const phase=o.phase+dt*o.speed,nx=o.originX+Math.sin(phase)*o.range,dx=nx-o.x;
      const riding=o.type==='movingPlatform'&&player.grounded&&Math.abs(player.y+player.h-o.y)<2&&player.x+player.w>o.x&&player.x<o.x+o.w;
      // A ferry waits rather than carrying its passenger into static geometry.
      if(riding&&solids.some(s=>s.kind!=='movingPlatform'&&overlaps({...player,x:player.x+dx},s)))continue;
      o.phase=phase;o.x=nx;if(riding)player.x+=dx;
      const s=solidFor(o);if(s)s.x=nx;
    }
  }

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
  function setCurrent(id){ if(id===current)return; current=id; gliding=false;grapple=null;dashTime=0; toast(speciesOf(id).label+' active · '+speciesOf(id).prompt); }
  function cycleCreature(dir){ const order=speciesOrder(); if(order.length<2)return; let i=order.indexOf(current); i=(i+dir+order.length)%order.length; setCurrent(order[i]); }
  function selectCreature(id){ if(unlockedCreatures.has(id)) setCurrent(id); }

  let campaignRecords={},highestStage=0,completedStages=new Set();
  const SAVE_KEY='creature-call-campaign-v2';
  let menuPrevious='playing';
  function loadStage(index) {
    if(!Number.isInteger(index)||index<0||index>=STAGES.length)return;
    resetMotion();etStarted=0;
    stageIndex = index; stage = STAGES[index];
    solids = stage.baseSolids.map(s=>({...s}));
    obstacles = stage.obstacleTemplate.map(o=>({...o,solved:false}));
    const mul = DIFFICULTIES[difficulty].timerMul;
    obstacles.forEach(o=>{ if(o.duration!=null) o.duration = o.duration * mul; });
    obstacles.filter(o=>['rock','thorn','clay','gate'].includes(o.type)).forEach(o=>{ solids.push({x:o.x,y:o.y,w:o.w,h:o.h,kind:o.type,obstacleRef:o}); });
    for(const o of obstacles)if(['movingPlatform','saw'].includes(o.type)){
      o.originX=o.x;o.phase=0;
      if(o.type==='movingPlatform')solids.push({x:o.x,y:o.y,w:o.w,h:o.h,kind:'movingPlatform',obstacleRef:o});
    }
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
    document.getElementById('difficulty').textContent = DIFFICULTIES[difficulty].label;
    document.getElementById('motion-status').textContent=stasisTime>0?'TIME FROZEN · '+stasisTime.toFixed(1)+'s':
      current==='tempo'?(stasisCooldown>0?'STASIS RECHARGE · '+stasisCooldown.toFixed(1)+'s':'STASIS READY'):
      current==='zip'?(dashReady?'AIR DASH READY':'LAND TO RECHARGE'):current==='tether'?(grapple?'GRAPPLE · TAP TO RELEASE':'FACE A RING · TAP TO PULL'):'';
    document.getElementById('cheat-status').textContent=adminActive?'ADMIN PRACTICE · SAVE PROTECTED'+(adminInvincible?' · INVINCIBLE':''):'';
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
    updateMachinery(dt);updateMotion(dt);
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
    let pulling=false;
    if(grapple){
      const dx=grapple.x+12-(p.x+17),dy=grapple.y+36-(p.y+24),dist=Math.hypot(dx,dy);
      if(dist<14||!clearSight(grapple)){grapple=null;}
      else{pulling=true;p.vx=dx/dist*600;p.vy=dy/dist*600;p.grounded=false;}
    }
    if(dashTime>0){dashTime=Math.max(0,dashTime-dt);p.vx=dashDirection*850;p.vy=0;}
    p.x += p.vx * dt;
    for (const s of solids) if (s.kind!=='movingPlatform'&&overlaps(p, s)) {
      if (p.vx > 0) p.x = s.x - p.w;
      else if (p.vx < 0) p.x = s.x + s.w;
      p.vx = 0;grapple=null;dashTime=0;
    }
    p.x = Math.max(0, Math.min(stage.width - p.w, p.x));

    let windZone = null;
    if (current === 'glint' && held('ability') && !p.grounded) {
      windZone = obstacles.find(o => o.type==='wind' && powered(o) && overlaps(p,o));
    }
    gliding = !!windZone;
    if (windZone) windZone.solved = true;
    if(pulling||dashTime>0){}
    else if (gliding) { p.vy = Math.max(p.vy - LIFT*dt, -LIFT_CAP); }
    else { p.vy = Math.min(900, p.vy + GRAVITY * dt); }
    const previousBottom=p.y+p.h;
    p.y += p.vy * dt;
    const landingSpeed=p.vy;
    p.grounded = false;
    for (const s of solids) if (overlaps(p, s)&&(s.kind!=='movingPlatform'||(p.vy>=0&&previousBottom<=s.y+1))) {
      if (p.vy > 0) { p.y = s.y - p.h; p.grounded = true; }
      else if (p.vy < 0) p.y = s.y + s.h;
      p.vy = 0;grapple=null;
    }
    if(p.grounded){dashReady=true;dashTime=0;}
    if(p.grounded && landingSpeed>200)burst(p.x+17,p.y+48,pal.edge,5);
    if (p.y > SCENE.height + 100) { loseLife(true); return; }
    for(const o of obstacles) if(['spikes','saw'].includes(o.type) && overlaps(p,o)) { loseLife(false); break; }
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
      c.rescued=true; unlockedCreatures.add(c.id); current=c.id; gliding=false;grapple=null;dashTime=0;
      burst(c.x,c.y,'#ffe6a0',20); toast(speciesOf(c.id).label+' joins you · '+speciesOf(c.id).prompt);saveProgress();
    }

    if(abilityRequested){abilityRequested=false;useAbility();}

    updateHud();
    if (overlaps(p, {x:stage.flagX,y:310,w:20,h:190})) {
      // Reaching the exit grants every companion this stage could have introduced, even a skipped one,
      // so a shortcut never locks a required ability out of a later stage.
      unlockStageCompanions(stageIndex);
      if (stageIndex === STAGES.length-1) finish('won'); else finishStage();
    }
  }
  function unlockStageCompanions(index){
    const st=STAGES[index];if(!st)return;
    st.creatureStarts.forEach(c=>unlockedCreatures.add(c.id));
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
    if(current==='tether'){
      if(grapple){grapple=null;return;}
      grapple=obstacles.filter(o=>o.type==='anchor'&&(o.x+12-player.x-17)*player.facing>0&&
        Math.hypot(o.x+12-player.x-17,o.y+36-player.y-24)<490&&clearSight(o))
        .sort((a,b)=>Math.hypot(a.x-player.x,a.y-player.y)-Math.hypot(b.x-player.x,b.y-player.y))[0]||null;
      toast(grapple?'Silk attached · tap again to release':'Face a ring within reach');return;
    }
    if(current==='zip'){
      if(!player.grounded&&dashReady){dashReady=false;dashTime=.26;dashDirection=player.facing;grapple=null;}
      else toast(player.grounded?'Jump before dashing':'Land to recharge your dash');return;
    }
    if(current==='tempo'){
      if(stasisCooldown<=0){stasisTime=4;stasisCooldown=7;toast('Time stopped · 4 seconds');}
      else toast('Clock recharging · '+Math.ceil(stasisCooldown)+'s');return;
    }
    const expected={rock:'crag',thorn:'cinder',seed:'sprig',water:'floe',relay:'volt',clay:'burrow',crystal:'echo'};
    let success=false;
    for(const o of obstacles){
      if(!expected[o.type]||!nearObstacle(player,o,40))continue;
      if(current!==expected[o.type])continue;
      if(o.solved&&!['water','relay'].includes(o.type))continue;
      success=true;o.solved=true;o.completed=true;
      if(['rock','thorn','clay'].includes(o.type))removeSolid(o);
      if(['seed','water','crystal'].includes(o.type)){
        if(!solidFor(o))solids.push({x:o.x,y:500,w:o.w,h:18,kind:o.type==='water'?'ice':'bridge',obstacleRef:o});
      }
      if(['water','relay'].includes(o.type))o.remaining=o.duration||8;
      burst(o.x+16,470,{crag:'#eaba75',cinder:'#ff996c',sprig:'#9ee392',floe:'#a7e9ff',volt:'#ffe89a',burrow:'#c9a06b',echo:'#c9b8ff'}[current],14);
      toast({rock:'Stone cleared',thorn:'Thorns cleared',seed:'Living bridge grown',water:'Ice holds for '+o.duration+' seconds',relay:'Circuit '+(o.id||'').toUpperCase()+' charged · '+o.duration+' seconds',clay:'Clay wall cleared',crystal:'Crystal bridge rings into place'}[o.type]);
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
    adminActive=false;adminInvincible=false;adminSnapshot=null;
    campaignRecords={};highestStage=0;completedStages=new Set();
    lives = DIFFICULTIES[difficulty].lives; coinCount = 0; fragmentCount = 0; state = 'playing';
    unlockedCreatures = new Set(['crag']); current = 'crag';
    document.getElementById('end-screen').hidden = true;
    loadStage(0);saveProgress();
  }
  function onEndButton() {
    if(adminActive&&state==='won'){endAdminPractice();return;}
    if (state === 'stageComplete') nextStage(); else restart();
  }
  function loseLife(fell = false) {
    if (state !== 'playing' || (!fell && damageTimer > 0)) return;
    if(adminInvincible&&!fell)return;
    resetMotion();
    const mode = DIFFICULTIES[difficulty];
    coyoteTimer=0;jumpBufferTimer=0;
    if(!adminInvincible)lives--; document.getElementById('lives').textContent = 'Lives: ' + lives;
    clearInput(); physicalKeys.clear();
    if(lives<=0){lives=mode.lives;document.getElementById('lives').textContent='Lives: '+lives;toast('Fresh energy · checkpoint and companions kept');}
    Object.assign(player, spawn, {vx:0,vy:0,grounded:true,facing:1});
    gliding=false; abilityRequested=false; abilityPoseTimer=0;
    damageTimer = mode.grace; updateCamera();
  }
  function setDifficulty(id){
    if(state!=='menu'||!Object.prototype.hasOwnProperty.call(DIFFICULTIES,id)||id===difficulty)return;
    difficulty=id;
    lives=DIFFICULTIES[difficulty].lives;
    document.getElementById('lives').textContent='Lives: '+lives;
    loadStage(stageIndex);
    saveProgress();
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
      if(!r.obstacles?.[i]?.solved||!['rock','thorn','seed','clay','crystal'].includes(o.type))return;
      o.solved=true;removeSolid(o);
      if(o.type==='seed'||o.type==='crystal')solids.push({x:o.x,y:500,w:o.w,h:18,kind:'bridge',obstacleRef:o});
    });
    if(Number.isInteger(r.checkpoint)&&r.checkpoint>=0&&r.checkpoint<checkpointStarts.length){
      checkpoint=r.checkpoint;spawn={x:checkpointStarts[checkpoint],y:452};Object.assign(player,spawn);
    }
  }
  function saveProgress(){
    rememberStage();if(adminActive)return;
    try{window.localStorage?.setItem(SAVE_KEY,JSON.stringify({version:2,stageIndex,highestStage,records:campaignRecords,
      unlocked:[...unlockedCreatures],current,completed:[...completedStages],difficulty}));}
    catch{document.getElementById('save-status').textContent='Saving unavailable · this session still works';}
  }
  function readSave(){try{
    const raw=window.localStorage?.getItem(SAVE_KEY);if(!raw)return null;const s=JSON.parse(raw);
    if(s.version!==2||!Number.isInteger(s.stageIndex)||s.stageIndex<0||s.stageIndex>=STAGES.length||
      !Number.isInteger(s.highestStage)||s.highestStage<s.stageIndex||s.highestStage>=STAGES.length||
      !Array.isArray(s.unlocked)||!s.unlocked.includes('crag')||!s.records||typeof s.records!=='object')return null;
    // Old saves predate difficulty modes; a missing or unknown value defaults to Normal rather than invalidating the save.
    s.difficulty = Object.prototype.hasOwnProperty.call(DIFFICULTIES,s.difficulty) ? s.difficulty : 'normal';
    // Bound data to the shipped campaign and reject malformed stage records.
    for(const [key,r] of Object.entries(s.records)){
      const st=STAGES[Number(key)];if(!st||!r||!Array.isArray(r.coins)||!Array.isArray(r.shards)||!Array.isArray(r.obstacles))return null;
    }
    return s;
  }catch{return null;}}
  function resumeSaved(){
    if(adminActive){endAdminPractice();return;}
    const s=readSave();if(!s){document.getElementById('save-status').textContent='No compatible saved journey yet';return;}
    applySave(s);
  }
  function applySave(s){
    campaignRecords=s.records;highestStage=s.highestStage;difficulty=s.difficulty;
    unlockedCreatures=new Set(s.unlocked.filter(id=>SPECIES.some(c=>c.id===id)));
    completedStages=new Set((Array.isArray(s.completed)?s.completed:[]).filter(i=>Number.isInteger(i)&&i>=0&&i<STAGES.length));
    // Backfills companions for saves made before shortcut-granting existed, or any stage completed while skipping its rescue.
    for(let i=0;i<highestStage;i++)unlockStageCompanions(i);
    for(const i of completedStages) unlockStageCompanions(i);
    current=unlockedCreatures.has(s.current)?s.current:'crag';
    coinCount=0;fragmentCount=0;lives=DIFFICULTIES[difficulty].lives;
    for(const [i,r] of Object.entries(campaignRecords)){coinCount+=r.coins.slice(0,STAGES[i].coinStarts.length).filter(Boolean).length;fragmentCount+=r.shards.slice(0,STAGES[i].shardStarts.length).filter(Boolean).length;}
    loadStage(s.stageIndex);state='playing';document.getElementById('campaign-menu').hidden=true;document.getElementById('end-screen').hidden=true;
  }
  function refreshMenu(){
    for(let i=0;i<STAGES.length;i++){const b=document.getElementById('level-'+i);b.disabled=i>highestStage;b.textContent=String(i+1).padStart(2,'0')+' · '+STAGES[i].name+(completedStages.has(i)?' ✓':'');}
    for(const key of DIFFICULTY_ORDER){const b=document.getElementById('difficulty-'+key);b.textContent=DIFFICULTIES[key].label+(difficulty===key?' ✓':'');}
    document.getElementById('saved-journey').disabled=!readSave();
  }
  function openMenu(){
    if(state==='menu')return;menuPrevious=state;state='menu';clearInput();physicalKeys.clear();
    document.getElementById('campaign-menu').hidden=false;
    refreshMenu();
    document.getElementById('menu-back').focus();
  }
  function closeMenu(){state=menuPrevious;document.getElementById('campaign-menu').hidden=true;clearInput();canvas.focus();previousTime=null;accumulator=0;}
  function visitStage(i){if(i>highestStage||i<0||!Number.isInteger(i))return;rememberStage();loadStage(i);state='playing';document.getElementById('campaign-menu').hidden=true;document.getElementById('end-screen').hidden=true;saveProgress();}
  document.getElementById('journey-menu').addEventListener('click',openMenu);
  document.getElementById('menu-back').addEventListener('click',closeMenu);
  document.getElementById('saved-journey').addEventListener('click',resumeSaved);
  document.getElementById('new-journey').addEventListener('click',()=>{if(window.confirm('Start a new journey? This replaces your saved progress.')){restart();document.getElementById('campaign-menu').hidden=true;}});
  for(let i=0;i<STAGES.length;i++)document.getElementById('level-'+i).addEventListener('click',()=>visitStage(i));
  for(const key of DIFFICULTY_ORDER)document.getElementById('difficulty-'+key).addEventListener('click',()=>{setDifficulty(key);refreshMenu();});
  function openAdmin(){
    if(state==='admin')return;
    adminPrevious=state;adminFocus=document.activeElement;state='admin';etStarted=0;
    clearInput();physicalKeys.clear();document.getElementById('admin-panel').hidden=false;
    document.getElementById('admin-level').value=String(stageIndex);
    refreshAdmin();document.getElementById('admin-close').focus();
  }
  function refreshAdmin(){
    document.getElementById('admin-invincible').textContent='Invincibility: '+(adminInvincible?'ON':'OFF');
    document.getElementById('admin-return').disabled=!adminActive;
    document.getElementById('admin-note').textContent=adminActive?'Practice active. Campaign saving is paused. Return to campaign restores your checkpoint.':'Controls start a separate practice session. Your campaign save stays untouched.';
    updateHud();
  }
  function closeAdmin(){
    if(state!=='admin')return;
    state=adminPrevious;document.getElementById('admin-panel').hidden=true;clearInput();physicalKeys.clear();
    previousTime=null;accumulator=0;(adminFocus||canvas).focus();
  }
  function beginAdminPractice(){
    if(adminActive)return;
    rememberStage();adminSnapshot=JSON.parse(JSON.stringify({version:2,stageIndex,highestStage,records:campaignRecords,
      unlocked:[...unlockedCreatures],current,completed:[...completedStages],difficulty}));adminActive=true;
  }
  function adminAction(action){
    if(state!=='admin')return;
    const i=Number(document.getElementById('admin-level').value);
    if(action==='jump'&&(!Number.isInteger(i)||i<0||i>=STAGES.length))return;
    beginAdminPractice();
    if(action==='unlock'){SPECIES.forEach(s=>unlockedCreatures.add(s.id));creatures.forEach(c=>c.rescued=true);}
    if(action==='refill')lives=DIFFICULTIES[difficulty].lives;
    if(action==='invincible')adminInvincible=!adminInvincible;
    if(action==='jump'){
      for(let n=0;n<i;n++)unlockStageCompanions(n);
      loadStage(i);adminPrevious='playing';document.getElementById('campaign-menu').hidden=true;document.getElementById('end-screen').hidden=true;
      adminFocus=canvas;document.getElementById('admin-close').focus();
    }
    document.getElementById('lives').textContent='Lives: '+lives;refreshAdmin();
  }
  function endAdminPractice(){
    if(!adminActive)return;
    const snapshot=adminSnapshot;adminActive=false;adminInvincible=false;adminSnapshot=null;
    document.getElementById('admin-panel').hidden=true;applySave(snapshot);document.getElementById('end-screen').hidden=true;
    document.getElementById('lives').textContent='Lives: '+lives;updateHud();
  }
  document.getElementById('admin-open').addEventListener('click',openAdmin);
  document.getElementById('admin-close').addEventListener('click',closeAdmin);
  document.getElementById('admin-return').addEventListener('click',endAdminPractice);
  for(const action of ['jump','unlock','refill','invincible'])document.getElementById('admin-'+action).addEventListener('click',()=>adminAction(action));
  const keyActions = { ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right', Space: 'jump', KeyW: 'jump', KeyC:'ability', KeyK:'ability' };
  const physicalKeys = new Set();
  window.addEventListener('keydown', event => {
    const textEntry=event.target?.isContentEditable||['INPUT','TEXTAREA','SELECT'].includes(event.target?.tagName);
    if(event.code==='Escape'&&state==='admin'){event.preventDefault();closeAdmin();return;}
    if(event.code==='Tab'&&state==='admin'){
      const controls=[...document.getElementById('admin-panel').querySelectorAll('button:not(:disabled),select')];
      const first=controls[0],last=controls[controls.length-1];
      if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
      else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}return;
    }
    if(textEntry||event.ctrlKey||event.metaKey||event.altKey){etStarted=0;return;}
    if(!event.repeat){
      const now=Date.now();
      if(event.code==='KeyT'&&etStarted&&now-etStarted<=1000){event.preventDefault();etStarted=0;openAdmin();return;}
      if(event.code==='KeyE')etStarted=now;
      else if(event.code!=='Minus')etStarted=0;
    }
    if(state==='admin')return;
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
      if(/^Digit[0-9]$/.test(event.code)){event.preventDefault();selectCreature(SPECIES[(Number(event.code.slice(-1))+9)%10].id);return;}
      if(event.code==='Minus'){event.preventDefault();selectCreature('tempo');return;}
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
  window.addEventListener('blur', () => { etStarted=0;clearInput(); physicalKeys.clear(); previousTime = null; accumulator = 0; });
  document.addEventListener('visibilitychange', () => { etStarted=0;clearInput(); physicalKeys.clear(); previousTime = null; accumulator = 0; });
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
      if(['rock','thorn','clay','gate','bridge','ice','movingPlatform'].includes(solid.kind)) continue;
      else ART.drawTerrain(ctx,solid.kind==='ground'?{...solid,h:Math.max(solid.h,viewHeight-offsetY-solid.y)}:solid,stage.region);
    }
    for(let i=0;i<checkpointStarts.length;i++){
      const x=checkpointStarts[i],col=i<=checkpoint?pal.edge:'#59627c';rect(x,410,24,90,'#26334e');rect(x+4,416,16,62,col);circle(x+12,407,9,col);label('BEACON',x-14,392,10,col);
    }
    for(const o of obstacles){
      // Bridge artwork's top edge matches its collision surface at y=500.
      if(['saw','movingPlatform'].includes(o.type)){
        ctx.strokeStyle=stasisTime>0?'#a8ffee':'#b3a5a0';ctx.lineWidth=2;ctx.setLineDash([5,7]);ctx.beginPath();
        ctx.moveTo(o.originX-o.range+o.w/2,o.y+o.h/2);ctx.lineTo(o.originX+o.range+o.w/2,o.y+o.h/2);ctx.stroke();ctx.setLineDash([]);
      }
      ART.drawObstacle(ctx,o.type==='wind'?{...o,active:powered(o)}:o,o.type==='saw'?o.phase:elapsed);
      const names={rock:'CRAG · SMASH',thorn:'CINDER · BURN',wind:'GLINT · HOLD'+(o.link?' · '+o.link.toUpperCase():''),seed:'SPRIG · GROW',water:'FLOE · FREEZE',relay:'VOLT · '+(o.id||'').toUpperCase(),gate:'CIRCUIT '+(o.link||'').toUpperCase(),clay:'BURROW · DIG',crystal:'ECHO · SING',spikes:'SPIKES · JUMP',anchor:'TETHER · GRAPPLE',dashGap:'ZIP · JUMP + DASH',grappleGap:'FOLLOW THE RING',clockGap:'TEMPO · FREEZE FERRY',movingPlatform:'MOVING FERRY',saw:'MOVING SAW'};
      label(o.remaining>0?Math.ceil(o.remaining)+'s · '+names[o.type]:names[o.type],o.x-18,['seed','water','crystal'].includes(o.type)?450:Math.max(210,o.y-14),10,'#eafcff');
    }
    if(grapple){ctx.strokeStyle='#fff4d9';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(player.x+17,player.y+20);ctx.lineTo(grapple.x+12,grapple.y+12);ctx.stroke();}
    if(dashTime>0){ctx.globalAlpha=.35;rect(player.x-player.facing*45,player.y+12,70,20,'#ff9bbd');ctx.globalAlpha=1;}
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
.hud{position:absolute;left:24px;right:24px;top:max(20px,env(safe-area-inset-top));display:flex;justify-content:space-between;gap:12px;pointer-events:none;padding:14px 18px;background:#111a35dc;border:2px solid #637da333;align-items:center}.brand{font-size:12px;font-weight:800;letter-spacing:2px}.stats{display:flex;gap:18px;font-size:14px;font-weight:750}#coins{color:#ffcf6b}#lives,#crew{color:#ffdb91}#difficulty{color:#7cf0ff}
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
.atlas{width:min(960px,100%);margin:auto;color:#e9ecd8}.atlas header{display:flex;align-items:center;justify-content:space-between;gap:20px}.atlas h1{font:900 clamp(28px,5vw,48px) ui-monospace,monospace;letter-spacing:-2px;margin:10px 0;color:#f7e5b2}.atlas p{line-height:1.6;color:#bed3d2;font-size:13px}.eyebrow{letter-spacing:3px;font-size:10px;color:#b1d99c}.atlas button{background:#283e51;border:1px solid #789c9b;color:#f4efd9;font:600 13px ui-monospace,monospace;padding:12px;cursor:pointer}.atlas button:hover:enabled{background:#3b5b69}.atlas button:disabled{opacity:.35;cursor:default}.atlas button:focus-visible{outline:3px solid #f4d99b;outline-offset:3px}.menu-actions{display:flex;gap:10px;flex-wrap:wrap;margin:14px 0}.difficulty-select{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin:0 0 14px}.difficulty-select button{padding:8px 12px}.worlds{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin:20px 0}.world{border-top:4px solid #91bc91;background:#223447;padding:12px}.world:nth-child(2){border-color:#8dcbd4}.world:nth-child(3){border-color:#e6a083}.world:nth-child(4){border-color:#bcafe0}.world:nth-child(5){border-color:#e0c98a}.world:nth-child(6){border-color:#9fb8ff}.world h2{font-size:14px;margin:0 0 14px}.world button{width:100%;text-align:left;margin:4px 0;min-height:60px;font-size:11px}.field-guide{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}.friend{background:#223447;padding:12px;display:flex;align-items:center;gap:8px}.friend canvas{width:55px;height:60px;flex:none}.friend strong{color:#f3d9a3;font-size:12px}.friend p{font-size:11px;margin:5px 0}#save-status{font-size:11px;color:#d7c6a5}
@media(max-width:760px){#journey-menu{right:60px;font-size:10px;padding:9px}.worlds{grid-template-columns:repeat(2,1fr)}.field-guide{grid-template-columns:repeat(2,1fr)}.journey{max-width:calc(100% - 24px);left:12px;top:132px}.journey .powers{font-size:10px;gap:8px}.track{margin:5px 0}.journey{font-size:9px;padding:8px}#toast{top:220px;font-size:11px}.hud{gap:4px}.stats{gap:8px}.touch-controls{left:8px;right:8px}.directions,.actions{gap:5px}.touch-controls button{width:48px;height:56px}.touch-controls .switch,.touch-controls .ability{width:54px;font-size:10px}.touch-controls .jump{width:56px;font-size:11px}.atlas header{display:block}.atlas h1{font-size:30px}.atlas{padding-bottom:20px}}
@media(max-height:450px){.touch-controls{display:flex}.journey{top:65px;left:12px;max-width:52%}#journey-menu{top:10px;right:155px}#fullscreen{top:10px}.hud{right:260px}#toast{top:126px}.help{display:none}}
#admin-open{position:absolute;right:24px;top:138px;z-index:5;background:#17233e;color:#ffe2a2;border:2px solid #bca573;padding:8px 12px;cursor:pointer}
#admin-panel{z-index:20;overflow:auto;padding:20px;background:#111e32f5}#admin-panel .atlas{max-width:580px}
#admin-panel select{width:100%;padding:12px;background:#223447;color:#fff;font:inherit;margin:8px 0 16px}#admin-panel button{min-height:44px}#admin-panel label{display:block}
#motion-status,#cheat-status{display:block;letter-spacing:0;margin-top:5px;color:#afffea}#cheat-status{color:#ffdc8e}
@media(max-width:760px){#admin-open{right:12px;top:180px;padding:6px 10px}.powers{flex-wrap:wrap}.track{width:180px}}
@media(max-height:450px){#admin-open{top:62px;right:12px}}
</style></head><body><main id="game-shell" aria-label="Creature Call game">
<button id="admin-open" type="button" aria-label="Open admin panel (E then T)">ET</button>
<button id="journey-menu" type="button">MAP / GUIDE</button>
<button id="fullscreen" type="button" aria-label="Toggle fullscreen" aria-pressed="false">FULLSCREEN</button>
<canvas id="game" tabindex="-1" aria-label="A rescue platformer. Move with A and D or arrow keys; jump with Space or W; use your companion's ability with C or K; switch companions with Q, E, or the number keys."></canvas>
<header class="hud"><span class="brand">CREATURE CALL</span><div class="stats"><span id="difficulty">NORMAL</span><span id="coins">Coins: 0</span><span id="lives">Lives: 3</span></div></header>
<div class="journey"><span id="route"></span><div class="track"><div id="progress"></div></div><div class="powers"><span id="crew"></span><span id="shards">◆ 0/0</span></div><span id="motion-status"></span><span id="cheat-status" role="status"></span></div><div id="toast" role="status"></div>
<div class="help">← → / A D &nbsp; Move &nbsp; · &nbsp; Space / W &nbsp; Jump &nbsp; · &nbsp; C / K &nbsp; Ability &nbsp; · &nbsp; Q / E or 1–9 / 0 / − &nbsp; Switch companion</div>
<div class="touch-controls" aria-label="Touch controls"><div class="directions"><button type="button" data-action="left" aria-label="Move left">←</button><button type="button" data-action="right" aria-label="Move right">→</button></div><div class="actions"><button type="button" class="switch" data-action="switch" aria-label="Switch companion">SWITCH</button><button type="button" class="ability" data-action="ability" aria-label="Use companion ability">ABILITY</button><button type="button" class="jump" data-action="jump" aria-label="Jump">JUMP</button></div></div>
<section id="end-screen" class="overlay" role="dialog" aria-modal="true" aria-labelledby="end-title" aria-describedby="end-detail" hidden><div class="card"><h1 id="end-title"></h1><p id="end-detail"></p><button id="restart" type="button">Play again</button></div></section>
<section id="campaign-menu" class="overlay" role="dialog" aria-modal="true" aria-label="Journey map" hidden><div class="atlas"><header><div><span class="eyebrow">ELEVEN FRIENDS · NINE CHAPTERS · ONE SKYHEART</span><h1>CREATURE CALL</h1><p>Find your crew. Learn their gifts. Bring the islands back to life.</p></div><button id="menu-back">Play / return →</button></header><div class="menu-actions"><button id="saved-journey">Resume saved journey</button><button id="new-journey">New journey</button></div><div class="difficulty-select" role="group" aria-label="Difficulty"><span class="eyebrow">DIFFICULTY</span><button id="difficulty-easy">Easy</button><button id="difficulty-normal">Normal</button><button id="difficulty-hard">Hard</button><button id="difficulty-extra">Extra Hard</button></div><div id="save-status">Progress saves in this browser at checkpoints, discoveries and stage clears.</div><div class="worlds"><div class="world"><h2>Mosslight Isles</h2><p>Learn to smash, glide and grow</p><button id="level-0">Stage 1</button><button id="level-1">Stage 2</button><button id="level-2">Stage 3</button></div><div class="world"><h2>Glasswater Coast</h2><p>Meet fire, ice and electricity</p><button id="level-3">Stage 4</button><button id="level-4">Stage 5</button><button id="level-5">Stage 6</button></div><div class="world"><h2>Copperfall Works</h2><p>Combine abilities under pressure</p><button id="level-6">Stage 7</button><button id="level-7">Stage 8</button><button id="level-8">Stage 9</button></div><div class="world"><h2>Aurora Heights</h2><p>Restore the Skyheart</p><button id="level-9">Stage 10</button><button id="level-10">Stage 11</button><button id="level-11">Stage 12</button></div><div class="world"><h2>Underroot Reaches</h2><p>Meet the dig and the song</p><button id="level-12">Stage 13</button><button id="level-13">Stage 14</button></div><div class="world"><h2>The Last Circuit</h2><p>Every gift, combined</p><button id="level-14">Stage 15</button><button id="level-15">Stage 16</button><button id="level-16">Stage 17</button><button id="level-17">Stage 18</button></div><div class="world"><h2>The Moving Frontier</h2><p>Learn silk, momentum, and time</p><button id="level-18">Stage 19</button><button id="level-19">Stage 20</button><button id="level-20">Stage 21</button></div><div class="world"><h2>Pendulum Trails</h2><p>Find your rhythm in moving worlds</p><button id="level-21">Stage 22</button><button id="level-22">Stage 23</button><button id="level-23">Stage 24</button></div><div class="world"><h2>Beyond the Skyheart</h2><p>Combine your new movement powers</p><button id="level-24">Stage 25</button><button id="level-25">Stage 26</button><button id="level-26">Stage 27</button></div></div><div class="field-guide"><div class="friend"><canvas id="portrait-crag" width="56" height="60" aria-label="crag portrait"></canvas><div><strong>CRAG</strong><p>Break tall stone barriers.</p></div></div><div class="friend"><canvas id="portrait-glint" width="56" height="60" aria-label="glint portrait"></canvas><div><strong>GLINT</strong><p>Hold ability in wind to fly.</p></div></div><div class="friend"><canvas id="portrait-sprig" width="56" height="60" aria-label="sprig portrait"></canvas><div><strong>SPRIG</strong><p>Grow lasting vine bridges.</p></div></div><div class="friend"><canvas id="portrait-cinder" width="56" height="60" aria-label="cinder portrait"></canvas><div><strong>CINDER</strong><p>Burn tangled thorn walls.</p></div></div><div class="friend"><canvas id="portrait-floe" width="56" height="60" aria-label="floe portrait"></canvas><div><strong>FLOE</strong><p>Freeze water. Watch the timer.</p></div></div><div class="friend"><canvas id="portrait-volt" width="56" height="60" aria-label="volt portrait"></canvas><div><strong>VOLT</strong><p>Power matching lettered circuits.</p></div></div><div class="friend"><canvas id="portrait-burrow" width="56" height="60" aria-label="burrow portrait"></canvas><div><strong>BURROW</strong><p>Dig through packed clay walls.</p></div></div><div class="friend"><canvas id="portrait-echo" width="56" height="60" aria-label="echo portrait"></canvas><div><strong>ECHO</strong><p>Sing crystal nodes into bridges.</p></div></div><div class="friend"><canvas id="portrait-tether" width="56" height="60" aria-label="tether portrait"></canvas><div><strong>TETHER</strong><p>Tap ability to pull toward a ring ahead.</p></div></div><div class="friend"><canvas id="portrait-zip" width="56" height="60" aria-label="zip portrait"></canvas><div><strong>ZIP</strong><p>Jump, then dash. Land to recharge.</p></div></div><div class="friend"><canvas id="portrait-tempo" width="56" height="60" aria-label="tempo portrait"></canvas><div><strong>TEMPO</strong><p>Freeze moving ferries and saws for 4s.</p></div></div></div><p>Move ← → / A D · Jump Space / W · Ability C / K · Switch Q / E or 1–9 / 0 / − · Fullscreen F<br>Charge circuits again to retry. Checkpoints keep your companions and cleared obstacles. Spikes cost a life on touch, just like a fall.</p></div></section><section id="admin-panel" class="overlay" role="dialog" aria-modal="true" aria-labelledby="admin-title" hidden><div class="atlas"><header><div><span class="eyebrow">E → T · PRACTICE TOOLS</span><h1 id="admin-title">Admin panel</h1></div><button id="admin-close">Close / Escape</button></header><p id="admin-note"></p><label for="admin-level">Choose a level</label><select id="admin-level"><option value="0">Level 1</option><option value="1">Level 2</option><option value="2">Level 3</option><option value="3">Level 4</option><option value="4">Level 5</option><option value="5">Level 6</option><option value="6">Level 7</option><option value="7">Level 8</option><option value="8">Level 9</option><option value="9">Level 10</option><option value="10">Level 11</option><option value="11">Level 12</option><option value="12">Level 13</option><option value="13">Level 14</option><option value="14">Level 15</option><option value="15">Level 16</option><option value="16">Level 17</option><option value="17">Level 18</option><option value="18">Level 19</option><option value="19">Level 20</option><option value="20">Level 21</option><option value="21">Level 22</option><option value="22">Level 23</option><option value="23">Level 24</option><option value="24">Level 25</option><option value="25">Level 26</option><option value="26">Level 27</option></select><div class="menu-actions"><button id="admin-jump">Play selected level</button><button id="admin-unlock">Unlock all creatures</button><button id="admin-refill">Refill lives</button><button id="admin-invincible">Invincibility: OFF</button><button id="admin-return">Return to campaign checkpoint</button></div><p>Practice changes stay in this session. Your saved campaign is protected. Falling still returns you to safe ground.</p></div></section></main><script>(${gameClient.toString()})();</script></body></html>`;
app.get('/', (req, res) => res.type('html').send(page));
if (require.main === module) {
  const port = process.env.PORT || 3000;
  app.listen(port, '0.0.0.0', () => console.log('Creature Call listening on ' + port));
}
module.exports = { app, page, gameClient };
