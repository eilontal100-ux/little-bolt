/* Original, self-contained pixel art. No downloaded sprites or external assets.
   Player anchor: top-left of 34x48 collision body. Sprites use a 2-unit grid. */
function createCreatureArt(){
  const colors={
    crag:['#25333c','#626d80','#909ba5','#d7d2b7','#e9b25e','#fff0bd'],
    glint:['#282f52','#635ca6','#a398de','#e5daf7','#79e1de','#e9ffff'],
    sprig:['#213d3a','#3c8573','#79bd87','#d6eab0','#edb670','#fff4d0'],
    cinder:['#442c3c','#b05456','#ed8971','#f9cfa0','#ffe076','#fff7d5'],
    floe:['#24435e','#4f88aa','#88c6d4','#d4f0e8','#b1a5e8','#ffffff'],
    volt:['#33313f','#897344','#d4b967','#f6e7a0','#91e1c4','#f2fff2'],
    burrow:['#1e140f','#6b4a34','#a17a54','#e6c9a0','#ffb454','#fff3cf'],
    echo:['#241528','#5c3160','#9a5aa0','#e6c2e8','#ff8fc0','#ffe9f7']
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
    if(o.type==='rock'){
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
if(typeof module!=='undefined')module.exports={createCreatureArt};
