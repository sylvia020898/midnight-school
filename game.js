'use strict';
(function(){
const $=id=>document.getElementById(id);
const isTouch=(window.matchMedia&&matchMedia('(pointer: coarse)').matches)||('ontouchstart' in window);
if(isTouch)document.body.classList.add('touch');
const SPEEDRUN=!!window.SPEEDRUN;
let seed=10081;
function rnd(){seed=(seed+0x6D2B79F5)|0;let t=Math.imul(seed^(seed>>>15),1|seed);t=(t+Math.imul(t^(t>>>7),61|t))^t;return((t^(t>>>14))>>>0)/4294967296;}
const R=(a,b)=>a+(b-a)*rnd();
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const FH=3.6, DUR=GAME_DATA.timeLimitSec, FONT='"Noto Sans TC","Microsoft JhengHei","PingFang TC","Heiti TC",sans-serif';
const LV=['一','二','三'], CL=['一','二','三','四'];

/* ---------- renderer ---------- */
const canvas=$('c');
const renderer=new THREE.WebGLRenderer({canvas,antialias:!isTouch,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,isTouch?1.25:1.5));
renderer.setSize(innerWidth,innerHeight);
renderer.outputEncoding=THREE.sRGBEncoding;
const SHADOWS=!isTouch;
renderer.shadowMap.enabled=SHADOWS;
renderer.shadowMap.type=THREE.PCFSoftShadowMap;
const scene=new THREE.Scene();
const FOGC=0x05070b;
scene.background=new THREE.Color(FOGC);
scene.fog=new THREE.FogExp2(FOGC,0.048);
const camera=new THREE.PerspectiveCamera(72,innerWidth/innerHeight,0.04,400);
camera.rotation.order='YXZ';
scene.add(camera);
addEventListener('resize',()=>{renderer.setSize(innerWidth,innerHeight);camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();});

/* ---------- lights ---------- */
const hemi=new THREE.HemisphereLight(0x24324c,0x0a0807,0.12);scene.add(hemi);
const SKY_NIGHT=new THREE.Color(FOGC),SKY_PRE=new THREE.Color(0x2c3448),SKY_DAWN=new THREE.Color(0x8d9bb2);
function setSky(t){// t: 0 night → 1 pre-dawn → 2 morning
  const c=t<=1?SKY_NIGHT.clone().lerp(SKY_PRE,t):SKY_PRE.clone().lerp(SKY_DAWN,t-1);scene.background.copy(c);scene.fog.color.copy(c);
  hemi.intensity=.12+(t<=1?t*.12:.12+(t-1)*.5);moonL.intensity=.09+Math.max(0,t-1)*.4;}
const moonL=new THREE.DirectionalLight(0x8094c4,0.09);moonL.position.set(-30,40,40);scene.add(moonL);
const flash=new THREE.SpotLight(0xffecd0,3,28,0.5,0.55,1.3);
flash.position.set(0.12,-0.1,0);camera.add(flash);flash.target.position.set(0,-0.08,-1);camera.add(flash.target);
if(SHADOWS){flash.castShadow=true;flash.shadow.mapSize.set(1024,1024);flash.shadow.camera.near=0.1;flash.shadow.camera.far=26;flash.shadow.bias=-0.0006;}
const pool=[];for(let i=0;i<4;i++){const l=new THREE.PointLight(0xd8eee4,0,6,2);scene.add(l);pool.push(l);}

/* ---------- textures ---------- */
function mk(w,h){const c=document.createElement('canvas');c.width=w;c.height=h;return[c,c.getContext('2d')];}
const ANISO=Math.min(8,renderer.capabilities.getMaxAnisotropy());
function T(c,meters,clampW){const t=new THREE.CanvasTexture(c);t.encoding=THREE.sRGBEncoding;t.anisotropy=ANISO;
  t.wrapS=t.wrapT=clampW?THREE.ClampToEdgeWrapping:THREE.RepeatWrapping;if(meters)t.repeat.set(1/meters,1/meters);return t;}
function grain(g,w,h,amt){const d=g.getImageData(0,0,w,h),a=d.data;for(let i=0;i<a.length;i+=4){const n=(Math.random()-.5)*amt;a[i]+=n;a[i+1]+=n;a[i+2]+=n;}g.putImageData(d,0,0);}
function stains(g,w,h,n,col,rmax){for(let i=0;i<n;i++){const x=Math.random()*w,y=Math.random()*h,r=rmax*(.3+Math.random());const gr=g.createRadialGradient(x,y,0,x,y,r);gr.addColorStop(0,col);gr.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=gr;g.fillRect(x-r,y-r,2*r,2*r);}}

const texPink=(()=>{const[c,g]=mk(256,256);g.fillStyle='#5e4446';g.fillRect(0,0,256,256);
  for(let y=0;y<16;y++)for(let x=0;x<16;x++){g.fillStyle=`hsl(${348+Math.random()*10},${24+Math.random()*12}%,${54+Math.random()*12}%)`;g.fillRect(x*16+1,y*16+1,14,14);}
  stains(g,256,256,6,'rgba(40,25,25,.25)',60);
  for(let i=0;i<10;i++){const x=Math.random()*256,len=Math.random()*256;const gr=g.createLinearGradient(0,0,0,len);gr.addColorStop(0,'rgba(35,22,22,.32)');gr.addColorStop(1,'rgba(35,22,22,0)');g.fillStyle=gr;g.fillRect(x,0,2+Math.random()*8,len);}
  grain(g,256,256,16);return T(c,0.5);})();
const texPlaster=(()=>{const[c,g]=mk(512,512);g.fillStyle='#b5ae98';g.fillRect(0,0,512,512);
  const wy=512*(1-1.05/3.6);g.fillStyle='#6f7e6d';g.fillRect(0,wy,512,512-wy);g.fillStyle='#46534a';g.fillRect(0,wy-4,512,5);
  stains(g,512,512,18,'rgba(70,60,40,.24)',90);stains(g,512,512,10,'rgba(20,25,15,.28)',30);
  for(let i=0;i<7;i++){g.strokeStyle='rgba(40,35,30,.4)';g.lineWidth=1;g.beginPath();let x=Math.random()*512,y=Math.random()*wy;g.moveTo(x,y);for(let k=0;k<8;k++){x+=(Math.random()-.5)*30;y+=Math.random()*25;g.lineTo(x,y);}g.stroke();}
  grain(g,512,512,14);return T(c,3.6);})();
const texCeil=(()=>{const[c,g]=mk(256,256);g.fillStyle='#7c7b75';g.fillRect(0,0,256,256);stains(g,256,256,8,'rgba(90,70,40,.35)',70);stains(g,256,256,6,'rgba(30,30,25,.3)',30);grain(g,256,256,14);return T(c,2.5);})();
const texTerr=(()=>{const[c,g]=mk(256,256);g.fillStyle='#78766f';g.fillRect(0,0,256,256);const cols=['#c9c6bd','#3a3936','#9a8f86','#5f6a5c','#b2a99a','#24231f'];
  for(let i=0;i<2600;i++){g.fillStyle=cols[i%cols.length];const r=Math.random()*2.2+.4;g.fillRect(Math.random()*256,Math.random()*256,r,r);}
  stains(g,256,256,8,'rgba(30,28,22,.3)',60);g.fillStyle='rgba(30,30,28,.6)';g.fillRect(0,0,256,1);g.fillRect(0,0,1,256);grain(g,256,256,10);return T(c,1.2);})();
const texWood=(()=>{const[c,g]=mk(256,256);g.fillStyle='hsl(27,40%,35%)';g.fillRect(0,0,256,256);
  for(let y=0;y<256;y+=2){g.strokeStyle=`rgba(${40+Math.random()*30},${20+Math.random()*15},10,${.15+Math.random()*.25})`;g.lineWidth=1+Math.random()*1.5;g.beginPath();g.moveTo(0,y);for(let x=0;x<=256;x+=16)g.lineTo(x,y+Math.sin(x*.03+y*.11)*3);g.stroke();}
  stains(g,256,256,6,'rgba(20,10,5,.3)',50);grain(g,256,256,12);return T(c,0.8);})();
const texWhite=(()=>{const[c,g]=mk(256,256);g.fillStyle='#c5c1b5';g.fillRect(0,0,256,256);stains(g,256,256,10,'rgba(70,65,50,.25)',60);grain(g,256,256,12);return T(c,2);})();
const texGrass=(()=>{const[c,g]=mk(256,256);g.fillStyle='#141d0f';g.fillRect(0,0,256,256);for(let i=0;i<4000;i++){g.fillStyle=`rgba(${30+Math.random()*30},${50+Math.random()*40},${20+Math.random()*20},.6)`;g.fillRect(Math.random()*256,Math.random()*256,1,2+Math.random()*3);}const t=T(c);t.repeat.set(90,90);return t;})();

function bloodTex(kind){const[c,g]=mk(256,256);const col=a=>`rgba(${70+Math.random()*45|0},${Math.random()*6|0},${Math.random()*6|0},${a})`;
  function blob(x,y,r,n,a){for(let i=0;i<n;i++){g.fillStyle=col(a);g.beginPath();g.arc(x+(Math.random()-.5)*r,y+(Math.random()-.5)*r,r*(.25+Math.random()*.4),0,7);g.fill();}}
  if(kind==='splat'){blob(128,128,70,26,.85);for(let i=0;i<46;i++){const a=Math.random()*7,d=50+Math.random()*70,r=1.5+Math.random()*6;g.fillStyle=col(.9);g.beginPath();g.arc(128+Math.cos(a)*d,128+Math.sin(a)*d,r,0,7);g.fill();}
    for(let i=0;i<8;i++){const a=Math.random()*7;g.strokeStyle=col(.8);g.lineWidth=2+Math.random()*5;g.beginPath();g.moveTo(128,128);g.lineTo(128+Math.cos(a)*(70+Math.random()*50),128+Math.sin(a)*(70+Math.random()*50));g.stroke();}}
  else if(kind==='pool'){blob(128,128,120,40,.8);const gr=g.createRadialGradient(128,128,0,128,128,90);gr.addColorStop(0,'rgba(40,0,0,.7)');gr.addColorStop(1,'rgba(40,0,0,0)');g.fillStyle=gr;g.fillRect(0,0,256,256);}
  else if(kind==='drag'){for(let i=0;i<70;i++){const y=128+(Math.random()-.5)*80;g.strokeStyle=col(.12+Math.random()*.3);g.lineWidth=1+Math.random()*4;g.beginPath();g.moveTo(10+Math.random()*30,y);g.bezierCurveTo(90,y+(Math.random()-.5)*20,170,y+(Math.random()-.5)*20,246-Math.random()*40,y+(Math.random()-.5)*10);g.stroke();}blob(40,128,40,6,.5);}
  else if(kind==='hand'){g.fillStyle=col(.85);g.beginPath();g.ellipse(128,160,42,50,0,0,7);g.fill();
    const fing=[[-44,-40,-0.6,46],[-20,-78,-0.15,62],[4,-86,0,68],[28,-78,.15,60],[48,-52,.45,48]];
    for(const[fx,fy,rot,len]of fing){g.save();g.translate(128+fx,160+fy);g.rotate(rot);g.beginPath();g.ellipse(0,0,10,len/2,0,0,7);g.fill();g.restore();}
    for(let i=0;i<5;i++){const x=95+Math.random()*66;g.strokeStyle=col(.85);g.lineWidth=3+Math.random()*3;g.beginPath();g.moveTo(x,190);g.lineTo(x+(Math.random()-.5)*4,200+Math.random()*56);g.stroke();}
    g.globalCompositeOperation='destination-out';for(let i=0;i<500;i++){g.fillStyle='rgba(0,0,0,.6)';g.fillRect(Math.random()*256,Math.random()*256,2,2);}}
  else if(kind==='drip'){blob(128,40,90,18,.85);for(let i=0;i<18;i++){const x=40+Math.random()*176,len=40+Math.random()*190,w=2+Math.random()*6;g.strokeStyle=col(.85);g.lineWidth=w;g.lineCap='round';g.beginPath();g.moveTo(x,40);g.lineTo(x+(Math.random()-.5)*4,40+len);g.stroke();g.fillStyle=col(.9);g.beginPath();g.arc(x,40+len,w*.9,0,7);g.fill();}}
  return T(c,0,true);}

/* chalkboard / bulletin / sign */
const MSG=GAME_DATA.blackboards;
function boardTex(text,bloody){const[c,g]=mk(1024,288);g.fillStyle='#1d382c';g.fillRect(0,0,1024,288);stains(g,1024,288,14,'rgba(200,210,200,.06)',140);
  for(let i=0;i<12;i++){g.strokeStyle='rgba(220,230,220,.05)';g.lineWidth=30;g.beginPath();g.arc(Math.random()*1024,Math.random()*288+100,80+Math.random()*120,Math.PI*1.1,Math.PI*1.9);g.stroke();}
  const[tc,tg]=mk(1024,288);tg.fillStyle=bloody?'rgba(160,12,16,.95)':'rgba(236,236,226,.9)';tg.textBaseline='middle';
  const lines=text.split('\n');const fs=lines.length>1?60:88;tg.font=`700 ${fs}px ${FONT}`;
  lines.forEach((l,i)=>{tg.save();tg.translate(70+Math.random()*40,144+(i-(lines.length-1)/2)*fs*1.3);tg.rotate((Math.random()-.5)*.05);tg.fillText(l,0,0);tg.restore();});
  tg.font=`500 30px ${FONT}`;tg.fillStyle='rgba(236,236,226,.75)';tg.fillText('10月8日',850,40);tg.fillText('星期四',860,80);
  if(bloody){for(let i=0;i<14;i++){const x=70+Math.random()*520,len=20+Math.random()*120;tg.strokeStyle='rgba(140,8,12,.9)';tg.lineWidth=2+Math.random()*4;tg.beginPath();tg.moveTo(x,170);tg.lineTo(x,170+len);tg.stroke();}}
  tg.globalCompositeOperation='destination-out';for(let i=0;i<6000;i++){tg.fillStyle='rgba(0,0,0,.55)';tg.fillRect(Math.random()*1024,Math.random()*288,1.6,1.6);}
  g.drawImage(tc,0,0);grain(g,1024,288,8);return T(c,0,true);}
// illustrated ID-photo of the missing girl: long auburn hair with straight bangs, light-blue school polo with embroidered school name
function drawGirl(g,x,y,w,h,o){o=o||{};g.save();g.beginPath();g.rect(x,y,w,h);g.clip();const cx=x+w/2,s=w/60;
  if(!o.noBg){g.fillStyle='#cdd5dc';g.fillRect(x,y,w,h);}
  g.fillStyle='#7a3f26';g.beginPath();g.ellipse(cx,y+26*s,17*s,19*s,0,0,7);g.fill();g.fillRect(cx-17*s,y+26*s,34*s,40*s);
  g.fillStyle='#6f9fd6';g.beginPath();g.moveTo(cx-32*s,y+h);g.quadraticCurveTo(cx-27*s,y+44*s,cx-10*s,y+42*s);g.lineTo(cx+10*s,y+42*s);g.quadraticCurveTo(cx+27*s,y+44*s,cx+32*s,y+h);g.fill();
  g.fillStyle='#e9c7ae';g.fillRect(cx-4*s,y+34*s,8*s,9*s);
  g.fillStyle='#93bbe6';for(const d of[-1,1]){g.beginPath();g.moveTo(cx+d*10*s,y+41*s);g.lineTo(cx+d*1*s,y+51*s);g.lineTo(cx+d*2*s,y+41*s);g.fill();}
  g.fillStyle='#f0d2bb';g.beginPath();g.ellipse(cx,y+26*s,10.5*s,13*s,0,0,7);g.fill();
  g.fillStyle='#7a3f26';g.beginPath();g.ellipse(cx,y+18*s,12.5*s,8.5*s,0,Math.PI,0);g.fill();g.fillRect(cx-12.5*s,y+17.5*s,25*s,4*s);
  g.fillRect(cx-14.5*s,y+20*s,4.5*s,30*s);g.fillRect(cx+10*s,y+20*s,4.5*s,30*s);
  if(o.smile){g.strokeStyle='#2a1a14';g.lineWidth=.9*s;g.lineCap='round';
    for(const ex of[-4.8,4.8]){g.beginPath();g.arc(cx+ex*s,y+28*s,2*s,Math.PI*1.15,Math.PI*1.85);g.stroke();}
    g.fillStyle='rgba(230,140,140,.35)';g.beginPath();g.ellipse(cx-6.5*s,y+31*s,2.4*s,1.3*s,0,0,7);g.ellipse(cx+6.5*s,y+31*s,2.4*s,1.3*s,0,0,7);g.fill();
    g.strokeStyle='#b85a5a';g.beginPath();g.arc(cx,y+32*s,2.6*s,Math.PI*.2,Math.PI*.8);g.stroke();}
  else{g.fillStyle='#2a1a14';g.fillRect(cx-6.5*s,y+26.5*s,3.4*s,1.6*s);g.fillRect(cx+3.1*s,y+26.5*s,3.4*s,1.6*s);
    g.fillStyle='#c46a6a';g.fillRect(cx-2*s,y+33.5*s,4*s,1.3*s);}
  g.fillStyle='#1d3a78';g.font=`700 ${3.6*s}px ${FONT}`;g.fillText('市立○○高中',cx+4*s,y+52*s);
  if(!o.noBg){g.fillStyle='rgba(120,100,60,.2)';g.fillRect(x,y,w,h);}g.restore();}
// the dream: the illustration of her on the window sill; the sun slowly reaches her, the camera drifts in, then the line fades in
const DREAM_LINE=GAME_DATA.dreamLine;
const dreamImg=new Image();dreamImg.src='assets/dream.webp';
function drawDreamScene(g,W,H,t,noText,drift){const e=x=>{x=clamp(x,0,1);return x*x*(3-2*x);},L=e((t-1)/6.5);
  g.setTransform(1,0,0,1,0,0);g.fillStyle='#000';g.fillRect(0,0,W,H);
  if(dreamImg.complete&&dreamImg.naturalWidth){const iw=dreamImg.naturalWidth,ih=dreamImg.naturalHeight;
    // slow push-in toward her face (about 60% across, 24% down in the picture)
    // drift: the menu version keeps breathing slowly (zoom and pan on long sine waves) instead of settling
    const z=drift?1.1+.05*Math.sin(t*.09):1.04+e(t/14)*.14,fx=drift?.6+.04*Math.sin(t*.06):.6,fy=drift?.32+.03*Math.sin(t*.075+1):.3,sc=Math.max(W/iw,H/ih)*z,dw=iw*sc,dh=ih*sc;
    const ox=clamp(W/2-fx*dw+(fx-.5)*dw*.35,W-dw,0),oy=clamp(H/2-fy*dh+(fy-.5)*dh*.35,H-dh,0);
    g.drawImage(dreamImg,ox,oy+Math.sin(t*.5)*2,dw,dh);}
  // she starts in cool shade; warmth spreads as the sun reaches her
  g.fillStyle=`rgba(28,38,72,${.62*(1-L)})`;g.fillRect(0,0,W,H);
  g.save();g.globalCompositeOperation='lighter';
  g.fillStyle=`rgba(255,226,170,${.13*L})`;g.beginPath();g.moveTo(W*.78,0);g.lineTo(W*1.05,0);g.lineTo(W*.62,H);g.lineTo(W*.3,H);g.closePath();g.fill();
  g.fillStyle=`rgba(255,226,170,${.08*L})`;g.beginPath();g.moveTo(W*.55,0);g.lineTo(W*.66,0);g.lineTo(W*.32,H);g.lineTo(W*.18,H);g.closePath();g.fill();
  const glow=g.createRadialGradient(W*.62,H*.3,10,W*.62,H*.3,H*.7);glow.addColorStop(0,`rgba(255,236,196,${.32*L*(.9+.1*Math.sin(t*1.7))})`);glow.addColorStop(1,'rgba(255,236,196,0)');g.fillStyle=glow;g.fillRect(0,0,W,H);
  for(let i=0;i<110;i++){const px=(Math.sin(i*12.9898)*43758.5453%1+1)%1,py=(Math.sin(i*78.233)*12345.678%1+1)%1;
    const x=px*W+Math.sin(t*.35+i)*14,y=(py*H-t*(6+i%9)+H*4)%H;g.fillStyle=`rgba(255,250,232,${(.12+.4*((i*7)%10)/10)*L})`;g.beginPath();g.arc(x,y,.8+(i%3)*.9,0,7);g.fill();}
  g.restore();
  const vg=g.createRadialGradient(W/2,H/2,H*.35,W/2,H/2,H*.95);vg.addColorStop(0,'rgba(0,0,0,0)');vg.addColorStop(1,'rgba(20,12,4,.45)');g.fillStyle=vg;g.fillRect(0,0,W,H);
  // the line, faint, in the middle of the frame
  const ta=noText?0:clamp((t-7.5)/2.5,0,1)*.85;if(ta>0){const band=g.createLinearGradient(0,H*.42,0,H*.58);band.addColorStop(0,'rgba(30,20,10,0)');band.addColorStop(.5,`rgba(30,20,10,${.22*ta})`);band.addColorStop(1,'rgba(30,20,10,0)');g.fillStyle=band;g.fillRect(0,H*.42,W,H*.16);g.textAlign='center';g.textBaseline='middle';g.font=`700 ${Math.round(H*.05)}px "Noto Serif TC",${FONT}`;
    g.shadowColor='rgba(70,45,20,.7)';g.shadowBlur=H*.035;g.fillStyle=`rgba(255,253,246,${ta})`;g.fillText(`「${DREAM_LINE}」`,W/2,H*.5);g.shadowBlur=0;g.textAlign='left';g.textBaseline='alphabetic';}
  const fi=t<1.4?1-t/1.4:0;if(fi>0){g.fillStyle=`rgba(0,0,0,${fi})`;g.fillRect(0,0,W,H);}}
function drawDream(){const c=$('dream'),g=c.getContext('2d');const go=()=>drawDreamScene(g,c.width,c.height,9,true);if(dreamImg.complete)go();else dreamImg.onload=go;}function corkTex(k){const[c,g]=mk(1024,320);g.scale(2,2);g.fillStyle='#5b3f26';g.fillRect(0,0,512,160);for(let i=0;i<3000;i++){g.fillStyle=`rgba(${30+Math.random()*60},${20+Math.random()*40},10,.5)`;g.fillRect(Math.random()*512,Math.random()*160,2,2);}
  for(let i=0;i<7;i++){const x=20+i*70+Math.random()*10,y=15+Math.random()*30,w=50+Math.random()*20,h=70+Math.random()*30;g.save();g.translate(x+w/2,y+h/2);g.rotate((Math.random()-.5)*.25);g.fillStyle=`hsl(45,${10+Math.random()*20}%,${62+Math.random()*15}%)`;g.fillRect(-w/2,-h/2,w,h);
    g.fillStyle='rgba(40,40,40,.6)';for(let l=0;l<6;l++)g.fillRect(-w/2+6,-h/2+10+l*10,w-12-Math.random()*15,2);g.fillStyle='#8a1a1a';g.beginPath();g.arc(0,-h/2+4,3,0,7);g.fill();g.restore();}
  g.save();g.translate(380,80);g.rotate(.05);g.fillStyle='#d8d2c0';g.fillRect(-50,-66,100,132);g.fillStyle='#8a1a1a';g.font=`900 16px ${FONT}`;g.fillText('尋人啟事',-32,-46);
  drawGirl(g,-30,-38,60,62);g.fillStyle='#2a2320';g.font=`500 7px ${FONT}`;g.fillText('二年級女學生 · 身高約 158 公分',-42,34);g.fillText('失蹤時穿著學校制服',-34,44);g.fillText('若有消息請與家屬聯絡',-38,54);
  g.fillStyle='rgba(60,40,20,.25)';g.fillRect(-50,40,100,26);g.restore();
  grain(g,1024,320,10);const t=T(c,0,true);corkList.push({g,t});if(portraitImg.complete&&portraitImg.naturalWidth)paintPortrait(g,t);return t;}
// the missing-person photo on every bulletin board: the illustrated ID portrait (portrait.webp), painted over the drawn placeholder once loaded
const corkList=[];const portraitImg=new Image();portraitImg.src='assets/portrait.webp';
function paintPortrait(g,t){const im=portraitImg,iw=im.naturalWidth,ih=im.naturalHeight,ar=60/62,sh=Math.min(ih,iw/ar),sw=sh*ar;
  g.save();g.setTransform(2,0,0,2,0,0);g.translate(380,80);g.rotate(.05);g.drawImage(im,(iw-sw)/2,ih*.06,sw,Math.min(sh,ih*.94),-30,-38,60,62);g.restore();t.needsUpdate=true;}
portraitImg.onload=()=>corkList.forEach(o=>paintPortrait(o.g,o.t));
function signTex(text){const[c,g]=mk(256,80);g.fillStyle='#d9d4c4';g.fillRect(0,0,256,80);g.strokeStyle='#2a2a2a';g.lineWidth=6;g.strokeRect(3,3,250,74);g.fillStyle='#1b1b1b';g.font=`700 40px ${FONT}`;g.textAlign='center';g.textBaseline='middle';g.fillText(text,128,42);stains(g,256,80,4,'rgba(60,50,30,.35)',40);grain(g,256,80,10);return T(c,0,true);}

/* ---------- materials ---------- */
const std=o=>new THREE.MeshStandardMaterial(Object.assign({roughness:.92,metalness:0},o));
const M={
  pink:std({map:texPink}),plaster:std({map:texPlaster}),ceil:std({map:texCeil}),
  terr:std({map:texTerr,roughness:.5}),wood:std({map:texWood,roughness:.7}),woodDark:std({map:texWood,color:0x75594a,roughness:.75}),
  glass:std({color:0x0b1318,roughness:.06,metalness:.7,transparent:true,opacity:.3,depthWrite:false}),
  frame:std({color:0x3a3d3c,roughness:.5,metalness:.6}),white:std({map:texWhite}),blue:std({color:0x5f8fb8,roughness:.8}),
  metal:std({color:0x6c7a72,roughness:.6,metalness:.4}),grey:std({color:0x5d5e5a}),dark:std({color:0x0e0f11}),
  teal:std({color:0x1d3a36,roughness:.4,metalness:.3}),trunk:std({color:0x1a130f}),leaf:std({color:0x0d190e,flatShading:true}),
  track:std({color:0x56211c}),line:std({color:0x85827a})};
M.glass.userData.noShadow=true;
const BM={};
for(const k of['splat','pool','drag','hand','drip']){const m=std({map:bloodTex(k),transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-4,polygonOffsetUnits:-4,roughness:.28,metalness:.05});m.userData.noShadow=true;BM[k]=m;}

/* ---------- merged static geometry ---------- */
const buckets=new Map();
function bk(x){if(x.p)return x;let b=buckets.get(x);if(!b){b={p:[],n:[],u:[]};buckets.set(x,b);}return b;}
function quad(b,a,bb,c,d,n,uvs){const pts=[a,bb,c,a,c,d];const us=uvs?[uvs[0],uvs[1],uvs[2],uvs[0],uvs[2],uvs[3]]:null;
  const ax=Math.abs(n.x),ay=Math.abs(n.y),az=Math.abs(n.z);
  for(let i=0;i<6;i++){const p=pts[i];b.p.push(p.x,p.y,p.z);b.n.push(n.x,n.y,n.z);
    if(us)b.u.push(us[i][0],us[i][1]);else if(ax>=ay&&ax>=az)b.u.push(n.x>0?-p.z:p.z,p.y);else if(ay>=az)b.u.push(p.x,p.z);else b.u.push(n.z>0?p.x:-p.x,p.y);}}
const FACES=[[0,3,2,1],[4,5,6,7],[0,4,7,3],[1,2,6,5],[3,7,6,2],[0,1,5,4]];
function box(t,x0,y0,z0,x1,y1,z1,m){const b=bk(t);
  const P=[[x0,y0,z0],[x1,y0,z0],[x1,y1,z0],[x0,y1,z0],[x0,y0,z1],[x1,y0,z1],[x1,y1,z1],[x0,y1,z1]].map(a=>{const v=new THREE.Vector3(a[0],a[1],a[2]);return m?v.applyMatrix4(m):v;});
  const C=new THREE.Vector3((x0+x1)/2,(y0+y1)/2,(z0+z1)/2);if(m)C.applyMatrix4(m);
  for(const f of FACES){let a=P[f[0]],bb=P[f[1]],c=P[f[2]],d=P[f[3]];
    const n=new THREE.Vector3().subVectors(bb,a).cross(new THREE.Vector3().subVectors(c,a));
    const fc=new THREE.Vector3().add(a).add(bb).add(c).add(d).multiplyScalar(.25).sub(C);
    if(n.dot(fc)<0){const tmp=bb;bb=d;d=tmp;n.negate();}
    if(n.lengthSq()<1e-12)continue;n.normalize();quad(b,a,bb,c,d,n);}}
function decalQuad(mat,a,b,c,d,n){let uv=[[0,0],[1,0],[1,1],[0,1]];
  const cr=new THREE.Vector3().subVectors(b,a).cross(new THREE.Vector3().subVectors(c,a));
  if(cr.dot(n)<0){const t=b;b=d;d=t;uv=[[0,0],[0,1],[1,1],[1,0]];}quad(bk(mat),a,b,c,d,n,uv);}
const _nm=new THREE.Matrix3(),_v=new THREE.Vector3();
function addGeo(mat,geo,m){const b=bk(mat);const g=geo.index?geo.toNonIndexed():geo;const p=g.attributes.position,n=g.attributes.normal,u=g.attributes.uv;_nm.getNormalMatrix(m);
  for(let i=0;i<p.count;i++){_v.fromBufferAttribute(p,i).applyMatrix4(m);b.p.push(_v.x,_v.y,_v.z);_v.fromBufferAttribute(n,i).applyMatrix3(_nm).normalize();b.n.push(_v.x,_v.y,_v.z);b.u.push(u?u.getX(i):0,u?u.getY(i):0);}}
function geoFrom(b){const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(b.p,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(b.n,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(b.u,2));g.computeBoundingSphere();return g;}

/* ---------- collision world ---------- */
const solids=[],occ=[],surfaces=[];
function solid(x0,y0,z0,x1,y1,z1,o){const s=Object.assign({x0,y0,z0,x1,y1,z1},o||{});solids.push(s);if(s.occlude)occ.push(s);return s;}
function flat(x0,x1,z0,z1,y){surfaces.push({x0,x1,z0,z1,y});}
function ramp(x0,x1,za,ya,zb,yb){surfaces.push({x0,x1,z0:Math.min(za,zb),z1:Math.max(za,zb),za,ya,zb,yb,r:1});}
function groundAt(x,z,y,climb){if(climb===undefined)climb=.45;let best=0;
  for(const s of surfaces){if(x<s.x0||x>s.x1||z<s.z0||z>s.z1)continue;let h=s.y;
    if(s.r){const t=clamp((z-s.za)/(s.zb-s.za),0,1);h=s.ya+(s.yb-s.ya)*t;}
    if(h<=y+climb&&h>best)best=h;}return best;}
function segBlocked(ax,ay,az,bx,by,bz){const dx=bx-ax,dy=by-ay,dz=bz-az;
  for(const b of occ){let t0=0,t1=1;const o=[ax,ay,az],d=[dx,dy,dz],mn=[b.x0,b.y0,b.z0],mx=[b.x1,b.y1,b.z1];let ok=true;
    for(let i=0;i<3;i++){if(Math.abs(d[i])<1e-9){if(o[i]<mn[i]||o[i]>mx[i]){ok=false;break;}}
      else{let ta=(mn[i]-o[i])/d[i],tb=(mx[i]-o[i])/d[i];if(ta>tb){const t=ta;ta=tb;tb=t;}t0=Math.max(t0,ta);t1=Math.min(t1,tb);if(t0>t1){ok=false;break;}}}
    if(ok)return true;}return false;}

/* wall along an axis with openings; t = thickness coord, a = run coord */
function wallA(axis,t0,t1,a0,a1,yb,h,open,matLo,matHi,opt){
  const bx=(A0,Y0,T0,A1,Y1,T1)=>axis==='x'?[A0,Y0,T0,A1,Y1,T1]:[T0,Y0,A0,T1,Y1,A1];
  const tm=(t0+t1)/2;const cuts=new Set([a0,a1]);
  for(const o of open){cuts.add(clamp(o.a,a0,a1));cuts.add(clamp(o.b,a0,a1));}
  const arr=[...cuts].sort((p,q)=>p-q);
  for(let i=0;i<arr.length-1;i++){const A=arr[i],Bb=arr[i+1];if(Bb-A<1e-4)continue;const mid=(A+Bb)/2;
    const os=open.filter(o=>o.a<mid&&o.b>mid).sort((p,q)=>p.y0-q.y0);
    let y=0;const pcs=[];for(const o of os){if(o.y0>y+1e-4)pcs.push([y,o.y0]);y=Math.max(y,o.y1);}if(y<h-1e-4)pcs.push([y,h]);
    for(const[p0,p1]of pcs){
      if(matLo===matHi)box(matLo,...bx(A,yb+p0,t0,Bb,yb+p1,t1));
      else{box(matLo,...bx(A,yb+p0,t0,Bb,yb+p1,tm));box(matHi,...bx(A,yb+p0,tm,Bb,yb+p1,t1));}
      solid(...bx(A,yb+p0,t0,Bb,yb+p1,t1),Object.assign({occlude:true},opt||{}));}}
  for(const o of open){if(!o.glass)continue;const ya=yb+o.y0,yc=yb+o.y1;
    if(o.sep){const c=bx(o.a,ya,tm-.008,o.b,yc,tm+.008);const pm=new THREE.Mesh(new THREE.BoxGeometry(c[3]-c[0],c[4]-c[1],c[5]-c[2]),M.glass);pm.position.set((c[0]+c[3])/2,(c[1]+c[4])/2,(c[2]+c[5])/2);scene.add(pm);o.sep.pane=pm;}
    else box(M.glass,...bx(o.a,ya,tm-.008,o.b,yc,tm+.008));solid(...bx(o.a,ya,t0,o.b,yc,t1),opt);
    const fw=.05;box(M.frame,...bx(o.a,ya,tm-.03,o.b,ya+fw,tm+.03));box(M.frame,...bx(o.a,yc-fw,tm-.03,o.b,yc,tm+.03));
    const n=Math.max(1,Math.round((o.b-o.a)/.9));for(let k=0;k<=n;k++){const ax=o.a+(o.b-o.a)*k/n;box(M.frame,...bx(ax-fw/2,ya,tm-.03,ax+fw/2,yc,tm+.03));}
    if(yc-ya>1){const ym=(ya+yc)/2;box(M.frame,...bx(o.a,ym-.02,tm-.03,o.b,ym+.02,tm+.03));}}}

/* blood decals */
function floorBlood(kind,x,y,z,w,h,rot){const cs=Math.cos(rot),sn=Math.sin(rot);
  const P=[[-w/2,-h/2],[w/2,-h/2],[w/2,h/2],[-w/2,h/2]].map(([u,v])=>new THREE.Vector3(x+u*cs-v*sn,y+.012,z+u*sn+v*cs));
  decalQuad(BM[kind],P[0],P[1],P[2],P[3],new THREE.Vector3(0,1,0));}
function wallBloodZ(kind,x,y,z,w,h,nz){const P=[[-w/2,-h/2],[w/2,-h/2],[w/2,h/2],[-w/2,h/2]].map(([u,v])=>new THREE.Vector3(x+u*nz,y+v,z+.012*nz));
  decalQuad(BM[kind],P[0],P[1],P[2],P[3],new THREE.Vector3(0,0,nz));}
function wallBloodX(kind,x,y,z,w,h,nx){const P=[[-w/2,-h/2],[w/2,-h/2],[w/2,h/2],[-w/2,h/2]].map(([u,v])=>new THREE.Vector3(x+.012*nx,y+v,z-u*nx));
  decalQuad(BM[kind],P[0],P[1],P[2],P[3],new THREE.Vector3(nx,0,0));}

/* light fixtures */
const fixtures=[];const tubeGeo=new THREE.BoxGeometry(1.22,.045,.09);
function fixture(x,y,z,alongZ){const mat=new THREE.MeshBasicMaterial({color:0xdff3ea});const m=new THREE.Mesh(tubeGeo,mat);m.position.set(x,y,z);if(alongZ)m.rotation.y=Math.PI/2;scene.add(m);
  if(alongZ)box(M.metal,x-.09,y+.02,z-.66,x+.09,y+.07,z+.66);else box(M.metal,x-.66,y+.02,z-.09,x+.66,y+.07,z+.09);
  const roll=rnd();const type=roll<.26?'dead':roll<.55?'steady':'flicker';
  fixtures.push({x,y,z,mat,type,base:type==='steady'?.85:.95,on:type!=='dead',b:0,t:Math.random()*4,burst:0,level:Math.floor(y/FH)});}

/* ---------- build the school ---------- */
const fans=[],deskMs=[],chairMs=[];
const _e=new THREE.Euler(),_q=new THREE.Quaternion(),_one=new THREE.Vector3(1,1,1);
function mat4(x,y,z,ry,rz,rx){_e.set(rx||0,ry||0,rz||0,'YXZ');_q.setFromEuler(_e);return new THREE.Matrix4().compose(new THREE.Vector3(x,y,z),_q,_one);}

// ground & floors
const groundMesh=new THREE.Mesh(new THREE.PlaneGeometry(400,400),std({map:texGrass}));groundMesh.rotation.x=-Math.PI/2;groundMesh.position.y=-.03;groundMesh.receiveShadow=true;scene.add(groundMesh);
box(M.terr,-.2,-.03,-9.2,42,0,3.1);
for(let L=0;L<3;L++){const y=L*FH;
  if(L>0){box(M.ceil,-.2,y-.3,-8.2,36.2,y-.02,3.1);box(M.terr,-.2,y-.02,-8.2,36.2,y,3.1);flat(-.2,36.2,-8.2,3.1,y);
    box(M.ceil,36.2,y-.3,0,41.8,y-.02,3);box(M.terr,36.2,y-.02,0,41.8,y,3);flat(36.2,41.8,0,3,y);
    box(M.pink,-.2,y-.5,3.1,36.2,y,3.35);}}
box(M.ceil,-.2,10.5,-8.2,36.2,10.78,3.1);box(M.pink,-.8,10.78,-8.8,36.8,11.1,4);
box(M.ceil,36.2,11.1,-9,41.8,11.4,3);box(M.pink,35.9,11.4,-9.4,42.3,11.7,3.4);

// tower stairs (switchback)
for(let L=0;L<2;L++){const y=L*FH,n=11,run=6.5/n,rise=1.8/n;
  ramp(36.2,38.9,0,y,-6.5,y+1.8);ramp(39.1,41.8,-6.5,y+1.8,0,y+3.6);flat(36.2,41.8,-9,-6.5,y+1.8);
  box(M.ceil,36.2,y+1.5,-9,41.8,y+1.78,-6.5);box(M.terr,36.2,y+1.78,-9,41.8,y+1.8,-6.5);
  for(let i=0;i<n;i++){const ta=y+(i+1)*rise;box(M.terr,36.2,ta-.32,-(i+1)*run,38.9,ta,-i*run);
    const tb=y+1.8+(i+1)*rise;box(M.terr,39.1,tb-.32,-6.5+i*run,41.8,tb,-6.5+(i+1)*run);}}
box(M.plaster,38.9,0,-6.5,39.1,11.1,0);solid(38.9,0,-6.5,39.1,11.1,0,{occlude:true});
box(M.plaster,39.1,0,-.2,41.8,1.6,0);solid(39.1,0,-.2,41.8,1.6,0);
box(M.plaster,36.2,7.2,-.1,38.9,8.2,.1);solid(36.2,7.2,-.1,38.9,9.2,.1);

// walls per level
const SAVE_KEY=SPEEDRUN?'ms-save-speedrun':'ms-save-v1';
function readSave(){try{const s=localStorage.getItem(SAVE_KEY);return s?JSON.parse(s):null;}catch(err){return null;}}
const bootSave=readSave();
const escR=bootSave&&bootSave.escR>=0?bootSave.escR:Math.floor(Math.random()*4);
const escWin={x:escR*9+2.4,z:-7.95,room:escR,pane:null};
for(let L=0;L<3;L++){const y=L*FH;
  const front=[],back=[];
  for(let r=0;r<4;r++){const s=r*9;
    if(L===0&&r===escR){back.push({a:s+.6,b:s+4.2,y0:.9,y1:2.5,glass:1,sep:escWin},{a:s+4.8,b:s+8.4,y0:.9,y1:2.5,glass:1});}
    else back.push({a:s+.6,b:s+4.2,y0:.9,y1:2.5,glass:1},{a:s+4.8,b:s+8.4,y0:.9,y1:2.5,glass:1});
    front.push({a:s+1.2,b:s+2.4,y0:0,y1:2.3},{a:s+6.6,b:s+7.8,y0:0,y1:2.3},
      {a:s+2.7,b:s+6.3,y0:1,y1:2.3,glass:1},{a:s+2.7,b:s+6.3,y0:2.6,y1:3.2,glass:1},
      {a:s+8.05,b:s+8.8,y0:1,y1:2.3,glass:1},{a:s+.25,b:s+.95,y0:1,y1:2.3,glass:1});}
  wallA('x',-.1,.1,-.2,36,y,FH,front,M.plaster,M.pink);
  wallA('x',-8.2,-8,-.2,36.2,y,FH,back,M.pink,M.plaster);
  wallA('z',-.2,0,-8.2,-.1,y,FH,[{a:-6,b:-2.2,y0:.9,y1:2.5,glass:1}],M.pink,M.plaster);
  for(let r=1;r<4;r++)wallA('z',r*9-.1,r*9+.1,-8,-.1,y,FH,[],M.plaster,M.plaster);
  // corridor edge
  if(L===0){solid(-.4,0,3,42,3.4,3.35,{barrier:1});solid(-.45,0,.1,-.2,3.4,3.1,{barrier:1});}
  else{box(M.pink,-.2,y,2.9,36.2,y+1,3.1);box(M.pink,-.25,y+1,2.85,36.2,y+1.08,3.15);solid(-.2,y,2.9,36.2,y+1.9,3.1,{barrier:1});
    box(M.pink,-.45,y,.1,-.2,y+1,3.1);solid(-.45,y,.1,-.2,y+1.9,3.1,{barrier:1});}}
// tower walls (full height)
{const towerSide=[],towerFront=[],towerBack=[];
  for(let L=0;L<3;L++){const y=L*FH;towerFront.push({a:38.5,b:40.2,y0:y+1.3,y1:y+2.2,glass:1});towerSide.push({a:-4.4,b:-3.4,y0:y+2.4,y1:y+3.2,glass:1});}
  towerBack.push({a:39.6,b:40.8,y0:3.0,y1:3.8,glass:1},{a:39.6,b:40.8,y0:6.6,y1:7.4,glass:1});
  wallA('z',36,36.2,-9.2,-.1,0,11.1,[],M.plaster,M.plaster);
  wallA('z',41.8,42,-9.2,3.2,0,11.4,towerSide,M.plaster,M.pink);
  wallA('x',-9.2,-9,36,42,0,11.4,towerBack,M.pink,M.plaster);
  wallA('x',3,3.2,36.2,41.8,0,11.4,towerFront,M.plaster,M.pink);}

// front columns, beams, blue column, balcony
for(let i=0;i<=8;i++){const x=i*4.5;box(M.pink,x-.2,0,3,x+.2,10.8,3.4);solid(x-.2,0,3,x+.2,10.8,3.4,{barrier:1});}
box(M.dark,-.2,0,3.0,42,.35,3.45);
{const cg=new THREE.CylinderGeometry(.2,.2,3.6,14);addGeo(M.blue,cg,mat4(18,1.8,3.25));addGeo(M.blue,new THREE.CylinderGeometry(.2,.2,2.6,14),mat4(18,5.9+.4,3.25));
  const half=new THREE.CylinderGeometry(1.3,1.3,1.0,22,1,true,-Math.PI/2,Math.PI);addGeo(M.pink,half,mat4(18,FH+.5,3.1));
  addGeo(M.pink,new THREE.CylinderGeometry(1.3,1.3,.25,22,1,false,-Math.PI/2,Math.PI),mat4(18,FH-.12,3.1));}

// the diagonal front stair + white wall with moon gate (exterior, visual only)
{const sx0=7,sx1=25.5,sy=FH,z0=3.5,z1=4.9,n=22,run=(sx1-sx0)/n,rise=sy/n;
  for(let i=0;i<n;i++){const x=sx0+i*run,top=(i+1)*rise;box(M.terr,x,Math.max(0,top-.45),z0,x+run,top,z1-.15);}
  const len=Math.hypot(sx1-sx0,sy),ang=Math.atan2(sy,sx1-sx0);
  const m=new THREE.Matrix4().makeTranslation((sx0+sx1)/2,sy/2+.5,z1-.08).multiply(new THREE.Matrix4().makeRotationZ(ang));
  box(M.pink,-len/2,-.6,-.09,len/2,.55,.09,m);
  const m2=new THREE.Matrix4().makeTranslation((sx0+sx1)/2,sy/2-.42,(z0+z1)/2).multiply(new THREE.Matrix4().makeRotationZ(ang));
  box(M.pink,-len/2,-.12,-(z1-z0)/2,len/2,.12,(z1-z0)/2,m2);
  box(M.pink,sx1,FH-.4,3.35,36.2,FH,z1);box(M.terr,sx1,FH-.02,3.35,36.2,FH,z1-.15);box(M.pink,sx1,FH,z1-.17,36.2,FH+1.05,z1);
  const holes=xc=>{const iv=[];const dx=xc-21.6;if(Math.abs(dx)<.85){const hh=Math.sqrt(.7225-dx*dx);iv.push([1.1-hh,1.1+hh]);}
    const dx2=xc-29;if(Math.abs(dx2)<.8)iv.push([0,1.4+Math.sqrt(.64-dx2*dx2)]);return iv.sort((a,b)=>a[0]-b[0]);};
  for(let x=15.5;x<33.4;x+=.2){const xc=x+.1;const top=xc<sx1?(xc-sx0)/(sx1-sx0)*sy-.5:FH-.4;let yy=0;
    for(const[a,b]of holes(xc)){if(a>yy)box(M.white,x,yy,4.05,x+.2,a,4.3);yy=Math.max(yy,b);}if(yy<top)box(M.white,x,yy,4.05,x+.2,top,4.3);}}

// neighbours, field, trees, sky
box(M.grey,-15,0,-9,-.7,7,1.6);for(let i=0;i<5;i++)for(let j=0;j<2;j++)box(M.dark,-14+i*2.7,1+j*3.2,1.6,-12.2+i*2.7,3+j*3.2,1.65);
box(M.grey,42.6,0,-9,56,8,1);for(let i=0;i<10;i++)box(M.teal,43+i*1.3,.6,1,43.9+i*1.3,7.4,1.06);
box(M.track,-80,-.02,9,120,.01,17);for(let k=0;k<5;k++)box(M.line,-80,.011,9.6+k*1.6,120,.016,9.66+k*1.6);
{const trunkG=new THREE.CylinderGeometry(.16,.28,3.2,6),leafG=new THREE.IcosahedronGeometry(1,0);
  const spots=[[45,4,1.3],[48.5,7,1.1],[52,3,1.4],[44,-12,1.2],[50,-13,1],[-4,6,1],[-8,4,1.2],[-12,7,.9],[-3,-12,1.2],[4,-14,1.4],[11,-13,1.1],[18,-15,1.3],[25,-13,1],[31,-14,1.2],[38,-15,1.3],[58,-3,1.5],[-20,-4,1.3],[60,8,1.2]];
  for(const[x,z,s]of spots){addGeo(M.trunk,trunkG,new THREE.Matrix4().makeTranslation(x,1.6*s,z).multiply(new THREE.Matrix4().makeScale(s,s,s)));
    for(let k=0;k<6;k++){const r=(1.3+rnd()*1.1)*s;addGeo(M.leaf,leafG,new THREE.Matrix4().makeTranslation(x+R(-1.6,1.6)*s,(3.4+R(0,2.4))*s,z+R(-1.6,1.6)*s).multiply(new THREE.Matrix4().makeScale(r,r*.8,r)));}}}
{const moon=new THREE.Mesh(new THREE.CircleGeometry(5,40),new THREE.MeshBasicMaterial({color:0xd9d6c3,fog:false}));moon.position.set(-60,58,130);moon.lookAt(20,0,0);scene.add(moon);
  const[c,g]=mk(128,128);const gr=g.createRadialGradient(64,64,0,64,64,64);gr.addColorStop(0,'rgba(200,210,230,.35)');gr.addColorStop(1,'rgba(200,210,230,0)');g.fillStyle=gr;g.fillRect(0,0,128,128);
  const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:new THREE.CanvasTexture(c),fog:false,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending}));sp.scale.set(40,40,1);sp.position.copy(moon.position);scene.add(sp);
  const sg=new THREE.BufferGeometry(),pts=[];for(let i=0;i<500;i++){const a=Math.random()*Math.PI*2,e=.15+Math.random()*1.3,r=180;pts.push(Math.cos(a)*Math.cos(e)*r,Math.sin(e)*r,Math.sin(a)*Math.cos(e)*r);}
  sg.setAttribute('position',new THREE.Float32BufferAttribute(pts,3));scene.add(new THREE.Points(sg,new THREE.PointsMaterial({color:0x9aa3b8,size:1.4,sizeAttenuation:false,fog:false})));}

// furniture geometry
const deskB={p:[],n:[],u:[]};
box(deskB,-.225,.72,-.3,.225,.76,.3);for(const[a,b]of[[-1,-1],[-1,1],[1,-1],[1,1]])box(deskB,a*.2-.02,0,b*.27-.02,a*.2+.02,.72,b*.27+.02);
box(deskB,-.2,.56,-.27,.2,.58,.27);box(deskB,-.225,.58,-.28,-.205,.72,.28);box(deskB,-.2,.58,-.29,.2,.72,-.27);box(deskB,-.2,.58,.27,.2,.72,.29);box(deskB,-.2,.1,-.27,-.18,.14,.27);
const chairB={p:[],n:[],u:[]};
box(chairB,-.19,.42,-.19,.19,.45,.19);for(const[a,b]of[[-1,-1],[-1,1],[1,-1],[1,1]])box(chairB,a*.16-.016,0,b*.16-.016,a*.16+.016,.42,b*.16+.016);
box(chairB,.155,.45,-.18,.185,.85,-.15);box(chairB,.155,.45,.15,.185,.85,.18);box(chairB,.16,.6,-.18,.18,.82,.18);box(chairB,-.16,.15,-.17,-.13,.18,.17);

// classrooms
const roomNames=[],deskSpots=[],noteSpots=[],drawers=[];
for(let L=0;L<3;L++)for(let r=0;r<4;r++){const y=L*FH,s=r*9,k=L*4+r;deskSpots[k]=[];
  roomNames[k]=LV[L]+'年'+CL[r]+'班';
  // desks
  const chaos=k===9?.95:k===0?.18:R(.25,.75);
  for(let i=0;i<5;i++)for(let j=0;j<5;j++){if(rnd()<.05)continue;
    let x=s+2.8+i*1.15,z=-7.1+j*1.3,ry=0,cdx=.12,cdz=0,cry=0,cTop=false,dTop=false,skew=false,tucked=false;
    if(rnd()<chaos*.55){skew=true;x+=R(-.18,.18);z+=R(-.15,.15);ry=R(-.55,.55);cdx=R(.5,.95);cdz=R(-.35,.35);cry=ry+R(-1.4,1.4);cTop=rnd()<.3;dTop=rnd()<.07;}
    else if(rnd()<.5){cdx=.12;tucked=true;}else cdx=.52;
    if(dTop){deskMs.push(mat4(x,y+.225,z,ry,Math.PI/2));solid(x-.45,y,z-.45,x+.45,y+.6,z+.45,{desk:1});}
    else{deskMs.push(mat4(x,y,z,ry));const c=Math.abs(Math.cos(ry)),sn=Math.abs(Math.sin(ry)),ex=c*.225+sn*.3,ez=sn*.225+c*.3;
      // tucked desk+chair (合著) is a solid block; desks with the chair pulled out can be crawled under
      solid(x-ex,y,z-ez,x+ex,y+.76,z+ez,{desk:1,crawl:!tucked,hide:!tucked});flat(x-ex+.05,x+ex-.05,z-ez+.05,z+ez-.05,y+.76);
      deskSpots[k].push({x,y,z,ry});
      noteSpots.push({kind:'desk',room:k,x,y,z,ry});}
    const cx=x+Math.cos(ry)*cdx+Math.sin(ry)*cdz,cz=z-Math.sin(ry)*cdx+Math.cos(ry)*cdz;
    if(cTop){chairMs.push(mat4(cx,y+.19,cz,cry,0,Math.PI/2));solid(cx-.3,y,cz-.3,cx+.3,y+.4,cz+.3);}
    else{chairMs.push(mat4(cx,y,cz,skew?cry:ry));if(!tucked){const a=skew?cry:ry,c2=Math.abs(Math.cos(a)),s2=Math.abs(Math.sin(a)),e=(c2+s2)*.19;solid(cx-e,y,cz-e,cx+e,y+.47,cz+e);}}}
  // podium, with a real drawer on the teacher's (blackboard) side: the body is built around an open slot
  box(M.woodDark,s+.95,y,-4.7,s+1.6,y+.78,-3.5);box(M.woodDark,s+.95,y+.92,-4.7,s+1.6,y+1.05,-3.5);
  box(M.woodDark,s+.95,y+.78,-4.7,s+1.6,y+.92,-4.36);box(M.woodDark,s+.95,y+.78,-3.84,s+1.6,y+.92,-3.5);box(M.dark,s+1.42,y+.78,-4.36,s+1.6,y+.92,-3.84);
  box(M.wood,s+.9,y+1.05,-4.75,s+1.65,y+1.09,-3.45);solid(s+.95,y,-4.7,s+1.6,y+1.05,-3.5,{occlude:true});
  {const dg=new THREE.Group(),dw=std({map:texWood,color:0x9a7a5c,roughness:.75});
    const part=(x0,y0,z0,x1,y1,z1,m)=>{const me=new THREE.Mesh(new THREE.BoxGeometry(x1-x0,y1-y0,z1-z0),m||dw);me.position.set((x0+x1)/2,(y0+y1)/2,(z0+z1)/2);me.castShadow=me.receiveShadow=true;dg.add(me);};
    part(0,-.067,-.255,.02,.067,.255);part(-.03,-.012,-.07,0,.012,.07,M.metal);
    part(.02,-.067,-.245,.44,-.057,.245);part(.02,-.057,-.245,.44,.04,-.235);part(.02,-.057,.235,.44,.04,.245);part(.43,-.057,-.235,.44,.04,.235);
    dg.position.set(s+.95,y+.85,-4.1);scene.add(dg);drawers[k]={grp:dg,x0:s+.95,open:false,t:0,hx:s+.92,hy:y+.85,hz:-4.1};}
  noteSpots.push({kind:'podium',room:k,x:s+.95,y,z:-4.1});
  // blackboard
  const bxw=r===0?0:s+.1;
  const bm=new THREE.Mesh(new THREE.PlaneGeometry(4.6,1.25),std({map:boardTex(MSG[k][0],MSG[k][1]),roughness:.85}));bm.rotation.y=Math.PI/2;bm.position.set(bxw+.035,y+1.55,-4);scene.add(bm);
  box(M.woodDark,bxw,y+.88,-6.4,bxw+.06,y+.93,-1.6);box(M.woodDark,bxw,y+2.17,-6.4,bxw+.06,y+2.24,-1.6);box(M.woodDark,bxw,y+.88,-6.4,bxw+.06,y+2.24,-6.3);box(M.woodDark,bxw,y+.88,-1.7,bxw+.06,y+2.24,-1.6);
  box(M.wood,bxw,y+.86,-6.3,bxw+.12,y+.9,-1.7);
  // bulletin board
  const bkx=r===3?36:s+8.9;
  const cm=new THREE.Mesh(new THREE.PlaneGeometry(4,1.25),std({map:corkTex(k)}));cm.rotation.y=-Math.PI/2;cm.position.set(bkx-.02,y+1.65,-4);scene.add(cm);
  noteSpots.push({kind:'board',room:k,x:bkx-.03,y,z:-4});
  // class sign
  const sm=new THREE.Mesh(new THREE.PlaneGeometry(.9,.28),std({map:signTex(roomNames[k])}));sm.position.set(s+1.8,y+2.55,.115);scene.add(sm);
  // sliding doors
  let closedOne=false;
  for(const a of[s+1.2,s+6.6]){const b=a+1.2;let roll=rnd();if(closedOne&&roll>.6)roll=.1;
    if(roll<.6)box(M.woodDark,b,y,.11,b+1.2,y+2.3,.17);
    else if(roll<.94){box(M.woodDark,a+.72,y,.11,b+.72,y+2.3,.17);solid(a+.72,y,.1,b,y+2.3,.2);}
    else{closedOne=true;box(M.woodDark,a,y,.11,b,y+2.3,.17);solid(a,y,.1,b,y+2.3,.2,{occlude:true});}}
  // ceiling fan
  const fan=new THREE.Group();const rod=new THREE.Mesh(new THREE.CylinderGeometry(.015,.015,.5,6),M.metal);rod.position.y=-.25;fan.add(rod);
  const rotor=new THREE.Group();rotor.position.y=-.52;fan.add(rotor);rotor.add(new THREE.Mesh(new THREE.CylinderGeometry(.12,.1,.09,12),M.metal));
  for(let q=0;q<3;q++){const bl=new THREE.Mesh(new THREE.BoxGeometry(.85,.012,.13),M.metal);bl.position.x=.5;const p=new THREE.Group();p.rotation.y=q*Math.PI*2/3;p.add(bl);rotor.add(p);}
  fan.position.set(s+4.9,y+FH,-4.2);fan.userData={rotor,spin:rnd()<.45?R(.4,2.8):0};scene.add(fan);fans.push(fan);
  fixture(s+3.2,y+FH-.09,-4.2,false);fixture(s+6.7,y+FH-.09,-4.2,false);
  // blood in rooms
  if(k===9){floorBlood('pool',s+5.1,y,-4.4,2.4,2.4,R(0,6));for(let q=0;q<5;q++)floorBlood('drag',s+5.4+q*.45-1.6,y,-3.2+q*.55,1.3,.7,-.9);
    wallBloodX('hand',bkx,y+1.2,-6.6,.45,.45,-1);wallBloodX('hand',bkx,y+.8,-1.5,.4,.4,-1);wallBloodX('drip',bkx,y+2.5,-2.6,1,1,-1);
    wallBloodZ('hand',s+3.4,y+1.1,-.1,.4,.4,-1);wallBloodZ('drip',s+7,y+2.3,-.1,1,1.1,-1);}
  else{const n=Math.floor(rnd()*3);for(let q=0;q<n;q++)floorBlood(rnd()<.6?'splat':'pool',s+R(1.5,8.4),y,R(-7.5,-.8),R(.5,1.3),R(.5,1.3),R(0,6));
    if(rnd()<.35)wallBloodX('drip',bkx,y+2.4,R(-7,-1.5),R(.7,1.1),R(.8,1.2),-1);}}

{const dg=geoFrom(deskB),cg=geoFrom(chairB);
  const dm=new THREE.InstancedMesh(dg,M.wood,deskMs.length);deskMs.forEach((m,i)=>dm.setMatrixAt(i,m));dm.castShadow=dm.receiveShadow=true;scene.add(dm);
  const chm=new THREE.InstancedMesh(cg,M.wood,chairMs.length);chairMs.forEach((m,i)=>chm.setMatrixAt(i,m));chm.castShadow=chm.receiveShadow=true;scene.add(chm);}

// corridor lights + blood on the walkways
for(let L=0;L<3;L++){const y=L*FH;
  for(let c=0;c<4;c++)fixture(4.5+9*c,y+FH-.07,1.5,true);
  fixture(39,y+FH-.07,1.5,false);
  if(L<2)fixture(39,y+1.8+2.5,-7.75,false);
  const n=3+Math.floor(rnd()*4);for(let q=0;q<n;q++)floorBlood(rnd()<.7?'splat':'pool',R(1,35),y,R(.5,2.6),R(.45,1.2),R(.45,1.2),R(0,6));
  for(let q=0;q<3;q++){const s=Math.floor(rnd()*4)*9;wallBloodZ(rnd()<.6?'hand':'drip',s+R(.3,1.1),y+R(1,1.5),.1,.42,.42,1);}
  if(L<2){floorBlood('splat',37.5,y+1.8,-7.8,.9,.9,R(0,6));floorBlood('drag',40.5,y+1.8,-8,1.2,.6,0);}}
// a drag trail along 2F leading into 二年三班
for(let x=8;x<19.6;x+=.95)floorBlood('drag',x,FH,1.6+Math.sin(x*.7)*.25,1.15,.6,(Math.random()-.5)*.25);
for(let z=1.5;z>-3;z-=.9)floorBlood('drag',19.8,FH,z,1.1,.6,Math.PI/2+(Math.random()-.5)*.3);
floorBlood('pool',19.9,FH,-3.6,1.4,1.4,1);
floorBlood('splat',5,0,1.2,1,1,.3);wallBloodZ('hand',10.2,1.3,.1,.45,.45,1);

// flush static buckets
for(const[mat,b]of buckets){if(!b.p.length)continue;const mesh=new THREE.Mesh(geoFrom(b),mat);mesh.receiveShadow=!mat.userData.noShadow;mesh.castShadow=!mat.userData.noShadow&&mat!==M.leaf;scene.add(mesh);}
buckets.clear();

/* ---------- navigation graph for the seeker ---------- */
const nodes=[],roomNodes=[];
function N(x,y,z,room){nodes.push({x,y,z,adj:[]});const i=nodes.length-1;if(room)roomNodes.push(i);return i;}
function E(a,b){nodes[a].adj.push(b);nodes[b].adj.push(a);}
const padA=[],padB=[];
for(let L=0;L<3;L++){const y=L*FH;const dx=[];for(let r=0;r<4;r++)dx.push(r*9+1.8,r*9+7.2);
  const cor=dx.map(x=>N(x,y,1.5,true));for(let i=1;i<cor.length;i++)E(cor[i-1],cor[i]);
  padA[L]=N(37.6,y,1.5,true);padB[L]=N(40.4,y,1.5);E(cor[cor.length-1],padA[L]);E(padA[L],padB[L]);
  for(let r=0;r<4;r++){const s=r*9;const A=N(s+1.8,y,-1,true),B=N(s+7.2,y,-1,true),C=N(s+1.9,y,-4.2,true),D=N(s+1.9,y,-7.3,true),F=N(s+8.4,y,-7.3,true),G2=N(s+8.4,y,-4,true);
    E(cor[2*r],A);E(cor[2*r+1],B);E(A,B);E(A,C);E(C,D);E(D,F);E(F,G2);E(G2,B);}}
for(let L=0;L<2;L++){const y=L*FH;const a0=N(37.6,y,0),a1=N(37.6,y+1.8,-6.5),l1=N(37.6,y+1.8,-7.75,true),l2=N(40.4,y+1.8,-7.75),b1=N(40.4,y+1.8,-6.5),b0=N(40.4,y+FH,0);
  E(padA[L],a0);E(a0,a1);E(a1,l1);E(l1,l2);E(l2,b1);E(b1,b0);E(b0,padB[L+1]);}
function nd(a,b){const p=nodes[a],q=nodes[b];return Math.hypot(p.x-q.x,p.y-q.y,p.z-q.z);}
function nearestNode(p){let best=0,bd=Infinity;for(let i=0;i<nodes.length;i++){const n=nodes[i];const d=(n.x-p.x)**2+(n.z-p.z)**2+((n.y-p.y)*4)**2;if(d<bd){bd=d;best=i;}}return best;}
function route(a,b){const n=nodes.length,dist=new Array(n).fill(Infinity),prev=new Array(n).fill(-1),done=new Array(n).fill(false);dist[a]=0;
  for(;;){let u=-1,best=Infinity;for(let i=0;i<n;i++)if(!done[i]&&dist[i]<best){best=dist[i];u=i;}if(u<0||u===b)break;done[u]=true;
    for(const v of nodes[u].adj){const w=dist[u]+nd(u,v);if(w<dist[v]){dist[v]=w;prev[v]=u;}}}
  const path=[];for(let v=b;v!==-1;v=prev[v])path.unshift(v);return path[0]===a?path:[b];}

/* ---------- the seeker ---------- */
const GH=(()=>{const g=new THREE.Group();
  const cloth=std({color:0xbcb7a7,emissive:0x1c1b18,side:THREE.DoubleSide}),skin=std({color:0x9b9588,emissive:0x141311}),hair=std({color:0x040404,roughness:.55});
  const dress=new THREE.Mesh(new THREE.CylinderGeometry(.17,.36,1.2,14,1,true),cloth);dress.position.y=.78;g.add(dress);
  const torso=new THREE.Mesh(new THREE.CylinderGeometry(.13,.17,.5,12),cloth);torso.position.y=1.6;g.add(torso);
  const neck=new THREE.Mesh(new THREE.CylinderGeometry(.045,.05,.14,8),skin);neck.position.y=1.9;g.add(neck);
  const head=new THREE.Group();head.position.y=1.95;g.add(head);
  const sk=new THREE.Mesh(new THREE.SphereGeometry(.115,16,12),skin);sk.scale.set(1,1.12,1);sk.position.y=.1;head.add(sk);
  const cap=new THREE.Mesh(new THREE.SphereGeometry(.128,16,10,0,Math.PI*2,0,Math.PI*.55),hair);cap.position.y=.11;head.add(cap);
  const strandL=new THREE.Mesh(new THREE.BoxGeometry(.12,.8,.03),hair);strandL.position.set(-.066,-.22,.11);head.add(strandL);
  const strandR=strandL.clone();strandR.position.x=.066;head.add(strandR);
  const backH=new THREE.Mesh(new THREE.BoxGeometry(.28,.9,.06),hair);backH.position.set(0,-.25,-.09);head.add(backH);
  const eyeMat=new THREE.MeshBasicMaterial({color:0x330000});const eye=new THREE.Mesh(new THREE.SphereGeometry(.014,8,6),eyeMat);eye.position.set(.004,.1,.118);head.add(eye);
  const arms=[];for(const sx of[-1,1]){const p=new THREE.Group();p.position.set(sx*.19,1.8,0);const arm=new THREE.Mesh(new THREE.CylinderGeometry(.03,.026,.82,8),skin);arm.position.y=-.41;p.add(arm);
    const hand=new THREE.Mesh(new THREE.BoxGeometry(.06,.2,.03),skin);hand.position.y=-.9;p.add(hand);g.add(p);arms.push(p);}
  g.scale.setScalar(1.05);g.traverse(o=>{if(o.isMesh)o.castShadow=true;});scene.add(g);
  return{group:g,head,eye,eyeMat,armL:arms[0],armR:arms[1],ht:0};})();

/* ---------- items, notes, escape window ---------- */
const mode='mission';
const ITEM=JSON.parse(JSON.stringify(GAME_DATA.items));
const R2=(a,b)=>a+(b-a)*Math.random();
function itemMesh(t){const g=new THREE.Group();const m=(c,o)=>std(Object.assign({color:c},o||{}));
  if(t==='scissors'){const metal=m(0xb8bcc0,{metalness:.8,roughness:.3}),red=m(0x9a1f1f);
    const b1=new THREE.Mesh(new THREE.BoxGeometry(.14,.006,.014),metal);b1.position.set(.05,.006,0);b1.rotation.y=.18;g.add(b1);const b2=b1.clone();b2.rotation.y=-.18;g.add(b2);
    for(const s of[-1,1]){const h=new THREE.Mesh(new THREE.TorusGeometry(.022,.006,6,12),red);h.rotation.x=Math.PI/2;h.position.set(-.04,.006,s*.022);g.add(h);}}
  else if(t==='ext'){const red=m(0xa3161a,{roughness:.45,metalness:.2});const c=new THREE.Mesh(new THREE.CylinderGeometry(.075,.075,.42,14),red);c.position.y=.21;g.add(c);
    const top=new THREE.Mesh(new THREE.SphereGeometry(.075,12,8,0,Math.PI*2,0,Math.PI/2),red);top.position.y=.42;g.add(top);
    const lbl=new THREE.Mesh(new THREE.CylinderGeometry(.077,.077,.1,14),m(0xd8d0b0));lbl.position.y=.22;g.add(lbl);
    const v=new THREE.Mesh(new THREE.BoxGeometry(.05,.06,.03),m(0x222222,{metalness:.6}));v.position.y=.49;g.add(v);
    const hose=new THREE.Mesh(new THREE.CylinderGeometry(.01,.01,.25,6),m(0x111111));hose.position.set(.085,.36,0);hose.rotation.z=.2;g.add(hose);}
  else if(t==='chalk'){const bx=new THREE.Mesh(new THREE.BoxGeometry(.1,.035,.065),m(0xd9d3c3));bx.position.y=.018;g.add(bx);
    [0xf2efe6,0xe2a0aa,0xe6d580].forEach((c,i)=>{const s=new THREE.Mesh(new THREE.CylinderGeometry(.006,.006,.08,6),m(c));s.rotation.z=Math.PI/2;s.position.set(0,.042,-.02+i*.02);g.add(s);});}
  else if(t==='bag'){const navy=m(0x22304a),dark=m(0x141c2c);const b=new THREE.Mesh(new THREE.BoxGeometry(.34,.12,.26),navy);b.position.y=.06;g.add(b);
    const f=new THREE.Mesh(new THREE.BoxGeometry(.3,.02,.2),dark);f.position.set(0,.125,.03);g.add(f);
    const st=new THREE.Mesh(new THREE.TorusGeometry(.07,.008,6,14,Math.PI),dark);st.position.set(0,.12,-.11);g.add(st);}
  else{const e=new THREE.Mesh(new THREE.BoxGeometry(.06,.02,.03),m(0xeeeae0));e.position.y=.01;g.add(e);
    const sl=new THREE.Mesh(new THREE.BoxGeometry(.035,.022,.032),m(0x3d6aa3));sl.position.set(.01,.011,0);g.add(sl);}
  g.traverse(o=>{if(o.isMesh)o.castShadow=true;});return g;}
const ICON={};
{const draw={
  scissors(g){g.beginPath();g.arc(20,47,8,0,7);g.stroke();g.beginPath();g.arc(44,47,8,0,7);g.stroke();g.beginPath();g.moveTo(25,40);g.lineTo(46,8);g.moveTo(39,40);g.lineTo(18,8);g.stroke();},
  ext(g){g.fillStyle='#b3121a';g.fillRect(22,20,20,38);g.beginPath();g.arc(32,20,10,Math.PI,0);g.fill();g.fillStyle='#ebe3d5';g.fillRect(22,34,20,7);g.fillRect(27,6,10,8);g.beginPath();g.moveTo(37,10);g.lineTo(50,18);g.lineTo(50,34);g.stroke();},
  chalk(g){g.fillStyle='#e3d27a';g.fillRect(16,18,32,7);g.fillStyle='#ebe3d5';g.fillRect(10,29,42,7);g.fillStyle='#d98a95';g.fillRect(14,40,34,7);},
  bag(g){g.strokeRect(13,22,38,32);g.beginPath();g.moveTo(13,36);g.lineTo(51,36);g.stroke();g.beginPath();g.arc(32,22,9,Math.PI,0);g.stroke();},
  eraser(g){g.fillStyle='#ebe3d5';g.fillRect(10,25,44,16);g.fillStyle='#4a78b0';g.fillRect(30,23,24,20);},
  note(g){g.fillStyle='#d8d0bb';g.beginPath();g.moveTo(14,8);g.lineTo(42,8);g.lineTo(52,18);g.lineTo(52,56);g.lineTo(14,56);g.closePath();g.fill();
    g.fillStyle='#9a8c7c';g.beginPath();g.moveTo(42,8);g.lineTo(42,18);g.lineTo(52,18);g.closePath();g.fill();
    g.strokeStyle='#5a1416';g.lineWidth=2.5;for(let i=0;i<4;i++){g.beginPath();g.moveTo(20,26+i*7);g.lineTo(i===3?36:46,26+i*7);g.stroke();}},
  clue(g){g.save();g.translate(6,4);g.rotate(-.12);g.fillStyle='#b8a477';g.fillRect(10,10,34,42);g.restore();g.save();g.translate(14,10);g.rotate(.1);g.fillStyle='#d2c39a';g.fillRect(10,8,32,42);
    g.fillStyle='#8a1a1a';g.beginPath();g.arc(34,40,6,0,7);g.fill();g.strokeStyle='#3a3026';g.lineWidth=2;for(let i=0;i<3;i++){g.beginPath();g.moveTo(15,18+i*7);g.lineTo(37,18+i*7);g.stroke();}g.restore();},
  diary(g){g.fillStyle='#3d5a7a';g.fillRect(14,8,36,48);g.fillStyle='#2a3f57';g.fillRect(14,8,6,48);g.fillStyle='#e9dfc8';g.fillRect(24,16,20,12);
    g.strokeStyle='#8a1a1a';g.lineWidth=2;g.beginPath();g.moveTo(26,22);g.lineTo(42,22);g.stroke();}};
  ITEM.note={name:'紙條',noise:0};ITEM.clue={name:'線索',noise:0};ITEM.diary={name:'日記',noise:0};
  for(const t in ITEM){const[c,g]=mk(64,64);g.strokeStyle='#ebe3d5';g.fillStyle='#ebe3d5';g.lineWidth=3;g.lineCap='round';draw[t](g);ICON[t]=c.toDataURL();}}
const glintTex=(()=>{const[c,g]=mk(64,64);const gr=g.createRadialGradient(32,32,0,32,32,32);gr.addColorStop(0,'rgba(255,245,215,1)');gr.addColorStop(.25,'rgba(255,235,190,.5)');gr.addColorStop(1,'rgba(255,235,190,0)');g.fillStyle=gr;g.fillRect(0,0,64,64);return new THREE.CanvasTexture(c);})();
const KIND_TXT={desk:'裡某張桌子的抽屜',podium:'的講桌裡',board:'後面的布告欄上'},KIND_SHORT={desk:'桌子抽屜',podium:'講桌',board:'後面布告欄'};
function nextNote(){return notes.find(n=>!n.taken)||null;}
function makeGlint(x,y,z){const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:glintTex,transparent:true,opacity:0,depthWrite:false,blending:THREE.AdditiveBlending,fog:false}));sp.scale.set(.1,.1,1);sp.position.set(x,y,z);scene.add(sp);return{sp,ph:Math.random()*6,active:true};}
const lockMesh=new THREE.Mesh(new THREE.BoxGeometry(.07,.09,.035),std({color:0x9a7a3a,metalness:.8,roughness:.35}));lockMesh.position.set(escWin.x,.99,-7.98);scene.add(lockMesh);
const winGlint=makeGlint(escWin.x,1.06,-7.92);

const worldItems=[],inv=[null,null,null,null,null];let sel=0;
function spawnItem(t,x,y,z){const mesh=itemMesh(t);mesh.position.set(x,y,z);mesh.rotation.y=Math.random()*6.28;scene.add(mesh);
  const it={t,mesh,state:'world',vel:new THREE.Vector3(),spin:new THREE.Vector3(),noised:false,hits:0,sndT:0};worldItems.push(it);return it;}
const NOTE_ITEM={t:'note'},CLUE_ITEM={t:'clue'},DIARY_ITEM={t:'diary'},SPECIAL={note:NOTE_ITEM,clue:CLUE_ITEM,diary:DIARY_ITEM};
const isSpecial=it=>it===NOTE_ITEM||it===CLUE_ITEM||it===DIARY_ITEM;
// put a story item into a fixed slot; whatever was there moves to a free slot or is dropped at your feet
function putSpecial(slot,obj){const cur=inv[slot];if(cur===obj)return;
  if(cur){let j=-1;for(let i=0;i<5;i++)if(!inv[i]&&i!==slot){j=i;break;}
    if(j>=0)inv[j]=cur;else{cur.state='world';cur.mesh.visible=true;cur.mesh.position.set(P.x,P.y,P.z);showMsg(ITEM[cur.t].name+'掉在地上了',1.6);}}
  inv[slot]=obj;renderBar();}
function clearItems(){for(const it of worldItems)scene.remove(it.mesh);worldItems.length=0;inv.fill(null);inv[0]=NOTE_ITEM;sel=0;}
function placeItems(){clearItems();
  const pickT=()=>{const r=Math.random();return r<.28?'chalk':r<.52?'eraser':r<.78?'scissors':'bag';};
  for(let L=0;L<3;L++){const y=L*FH;spawnItem('ext',R2(3,33),y,.32);
    for(let r=0;r<4;r++){const s=r*9,k=L*4+r,n=2+(Math.random()<.4?1:0);
      for(let q=0;q<n;q++){const t=pickT(),roll=Math.random();
        if(roll<.45&&deskSpots[k].length){const d=deskSpots[k][Math.floor(Math.random()*deskSpots[k].length)];spawnItem(t,d.x+R2(-.1,.1),d.y+.76,d.z+R2(-.15,.15));}
        else if(roll<.6)spawnItem(t,s+1.27+R2(-.15,.15),y+1.09,-4.1+R2(-.4,.4));
        else if(roll<.75&&r===0)spawnItem('ext',s+R2(7.6,8.6),y,R2(-1.2,-.4));
        else spawnItem(t,s+R2(1.2,8.6),y,R2(-7.7,-.5));}}}
  renderBar();}
function renderBar(){const bar=$('bar');bar.innerHTML='';
  inv.forEach((it,i)=>{const b=document.createElement('button');b.className='slot';b.id='slot'+i;b.setAttribute('role','option');b.setAttribute('aria-selected',String(i===sel));
    b.setAttribute('aria-label',(i+1)+'：'+(it?ITEM[it.t].name:'空'));b.innerHTML=`<span class="k">${i+1}</span>`+(it?`<img alt="" src="${ICON[it.t]}"><span class="nm">${ITEM[it.t].name}</span>`:'');
    b.addEventListener('click',e=>{sel=i;renderBar();e.stopPropagation();});
    b.addEventListener('touchstart',e=>{sel=i;renderBar();e.preventDefault();e.stopPropagation();},{passive:false});bar.appendChild(b);});}
function selectSlot(i){sel=(i+5)%5;renderBar();}
function noteSelected(){return isSpecial(inv[sel]);}
function pickUp(it){const i=inv[sel]?inv.indexOf(null):sel;if(i<0){showMsg('手上拿不下了（最多五樣）',1.6);return;}
  inv[i]=it;it.state='held';it.mesh.visible=false;sel=i;renderBar();sfxPick();showMsg('撿起了'+ITEM[it.t].name,1.2);}
const _f=new THREE.Vector3();
function throwSel(){if(state!=='play')return;const it=inv[sel];if(!it){showMsg('手上沒有東西可以丟',1.2);return;}
  if(isSpecial(it)){toggleJournal();return;}
  inv[sel]=null;renderBar();camera.getWorldDirection(_f);it.mesh.position.copy(camera.position);
  const sp=it.t==='ext'?7:it.t==='bag'?8:10.5;it.vel.copy(_f).multiplyScalar(sp);it.vel.y+=1.6;it.vel.x+=P.vx;it.vel.z+=P.vz;
  it.spin.set(R2(-12,12),R2(-12,12),R2(-12,12));it.state='fly';it.noised=false;it.hits=0;it.mesh.visible=true;sfxWhoosh();}
function land(it){it.state='world';it.vel.set(0,0,0);it.mesh.rotation.x=0;it.mesh.rotation.z=0;}
function hitSound(it){const p=it.mesh.position;
  if(!it.noised){it.noised=true;it.sndT=.12;sfxImpact(it.t,p.x,p.z,false);makeNoiseAt(p.x,p.y,p.z,ITEM[it.t].noise,true);}
  else if(it.sndT<=0&&it.vel.length()>1.5){it.sndT=.12;sfxImpact(it.t,p.x,p.z,true);}}
function updateItems(dt){for(const it of worldItems){if(it.state!=='fly')continue;const p=it.mesh.position;it.sndT-=dt;
  it.mesh.rotation.x+=it.spin.x*dt;it.mesh.rotation.y+=it.spin.y*dt;it.mesh.rotation.z+=it.spin.z*dt;
  const n=4,h=dt/n;
  for(let k=0;k<n&&it.state==='fly';k++){it.vel.y-=9.8*h;const nx=p.x+it.vel.x*h,ny=p.y+it.vel.y*h,nz=p.z+it.vel.z*h;
    let hs=null;for(const s of solids){if(nx>s.x0-.04&&nx<s.x1+.04&&nz>s.z0-.04&&nz<s.z1+.04&&ny>s.y0&&ny<s.y1){hs=s;break;}}
    if(hs){const inX=p.x>hs.x0-.04&&p.x<hs.x1+.04,inZ=p.z>hs.z0-.04&&p.z<hs.z1+.04;
      if(inX&&inZ){if(it.vel.y<0&&p.y>=hs.y1-.06){p.y=hs.y1;hitSound(it);land(it);break;}it.vel.y=-Math.abs(it.vel.y)*.3;}
      else{if(!inX)it.vel.x*=-.3;if(!inZ)it.vel.z*=-.3;it.vel.y*=.8;}
      hitSound(it);if(++it.hits>40){p.y=groundAt(p.x,p.z,p.y,.02);land(it);}continue;}
    p.set(nx,ny,nz);const g=groundAt(p.x,p.z,p.y,.02);
    if(p.y<=g){p.y=g;hitSound(it);if(it.vel.y<-3){it.vel.y*=-.25;it.vel.x*=.5;it.vel.z*=.5;}else land(it);}}}}

const NOTE_TXT=GAME_DATA.noteTexts;
const WHERE=GAME_DATA.hidingPlaces;
const NUM=['零','一','二','三','四','五','六','七','八','九','十','十一','十二'];
// riddles that point to a classroom: arithmetic on 年/班, the chalkboard text, or counting from the stairs
function roomRiddle(k,type){const L=Math.floor(k/4),r=k%4,a=L+1,b=r+1;
  if(type==='math')return `那間教室的年級和班級，加起來是${NUM[a+b]}，乘起來是${NUM[a*b]}，而且${a<b?'年級比班級小':a>b?'年級比班級大':'年級和班級一樣'}。`;
  if(type==='board')return `${NUM[a]}樓有一間教室，黑板上用粉筆寫著「${MSG[k][0].split('\n')[0]}」。`;
  return `站在樓梯間門口，沿著走廊數過去第${NUM[4-r]}間教室。${L===0?'不用爬樓梯。':'不過得先往上爬'+NUM[L]+'層樓。'}`;}
const notes=[],sideNotes=[],journal=[];let notesGot=0,sideGot=0,riddleTypes=[];
/* the hidden things themselves: a folded note, or for the side quest a roll book, an envelope, a manila folder.
   Built flat in the XY plane (face = +z); laid flat in drawers / under the podium lid, pinned upright on boards. */
const objTexCache={};
function objFaceTex(type){if(objTexCache[type])return objTexCache[type];const[c,g]=mk(256,192);
  if(type==='note'){g.fillStyle='#ebe4d2';g.fillRect(0,0,256,192);g.strokeStyle='rgba(90,110,150,.35)';for(let y=24;y<192;y+=18){g.beginPath();g.moveTo(10,y);g.lineTo(246,y);g.stroke();}
    g.strokeStyle='rgba(40,30,30,.75)';g.lineWidth=2.4;for(let k=0;k<6;k++){g.beginPath();let x=22;g.moveTo(x,32+k*18);while(x<200-k*12){x+=8+Math.random()*10;g.lineTo(x,32+k*18+(Math.random()-.5)*4);}g.stroke();}
    g.fillStyle='rgba(0,0,0,.12)';g.fillRect(126,0,3,192);}
  else if(type==='roll'){g.fillStyle='#2f4a3a';g.fillRect(0,0,256,192);g.fillStyle='#e6dcc0';g.fillRect(56,40,144,62);g.fillStyle='#2a2320';g.font=`700 26px ${FONT}`;g.textAlign='center';g.fillText('點名簿',128,70);g.font=`500 18px ${FONT}`;g.fillText('二年三班',128,94);
    g.fillStyle='rgba(255,255,255,.08)';for(let i=0;i<400;i++)g.fillRect(Math.random()*256,Math.random()*192,2,2);}
  else if(type==='letter'){g.fillStyle='#efe6cf';g.fillRect(0,0,256,192);g.strokeStyle='rgba(120,100,70,.5)';g.lineWidth=2;g.beginPath();g.moveTo(0,0);g.lineTo(128,100);g.lineTo(256,0);g.stroke();
    g.fillStyle='#3a2a24';g.font=`500 24px ${FONT}`;g.textAlign='center';g.fillText('對不起',128,150);g.fillStyle='rgba(120,90,40,.2)';g.beginPath();g.arc(60,140,26,0,7);g.fill();}
  else{g.fillStyle='#c9a86a';g.fillRect(0,0,256,192);g.fillStyle='#b39257';g.fillRect(0,0,256,26);g.fillStyle='#2a2320';g.font=`700 24px ${FONT}`;g.textAlign='center';g.fillText('訓導處　密件',128,92);
    g.strokeStyle='#b0141c';g.lineWidth=4;g.beginPath();g.arc(200,140,28,0,7);g.stroke();g.fillStyle='#b0141c';g.font=`900 18px ${FONT}`;g.fillText('校長',200,147);}
  return objTexCache[type]=T(c,0,true);}
function makeHiddenObj(s){const type=s.side?['roll','letter','folder'][s.doc]:'note';
  const dims={note:[.17,.12,.006],roll:[.22,.16,.018],letter:[.17,.1,.006],folder:[.23,.17,.012]}[type];
  const side=std({color:{note:0xd8d0bc,roll:0x22382b,letter:0xd9cfb6,folder:0xa88a52}[type]});const face=std({map:objFaceTex(type)});
  const m=new THREE.Mesh(new THREE.BoxGeometry(dims[0],dims[1],dims[2]),[side,side,side,side,face,side]);m.castShadow=true;
  const grp=new THREE.Group();grp.add(m);
  if(s.kind==='board'){const pin=new THREE.Mesh(new THREE.SphereGeometry(.012,8,6),std({color:0x9a1a1a}));pin.position.set(0,dims[1]/2-.02,.01);grp.add(pin);}
  return grp;}
function buildNote(s,arr){arr=arr||notes;
  const mesh=makeHiddenObj(s);
  mesh.rotation.order='YXZ';mesh.rotation.set(s.kind==='board'?0:-Math.PI/2,s.mry,s.kind==='board'?(Math.random()-.5)*.12:0);mesh.position.set(s.mx,s.my,s.mz);
  // podium: the object lies inside the drawer tray and slides out with it
  const parent=s.kind==='podium'&&drawers[s.room]?drawers[s.room].grp:scene;if(s.kind==='podium'){mesh.position.set(.23,-.045,s.lz||0);mesh.rotation.set(-Math.PI/2,s.mry||0,0);}
  const n={kind:s.kind,room:s.room,mesh,gx:s.gx,gy:s.gy,gz:s.gz,taken:!!s.taken,spec:s,g:makeGlint(s.gx,s.gy,s.gz)};if(!n.taken)parent.add(mesh);arr.push(n);}
function dropMesh(n){if(n.mesh.parent)n.mesh.parent.remove(n.mesh);}
const _wp=new THREE.Vector3();
function updateDrawers(dt){for(const d of drawers){if(!d)continue;d.t+=((d.open?1:0)-d.t)*Math.min(1,dt*9);d.grp.position.x=d.x0-.36*d.t;}}
function closeDrawers(){for(const d of drawers)if(d){d.open=false;d.t=0;d.grp.position.x=d.x0;}}
function sfxDrawer(open){if(!A.ctx)return;const t=A.ctx.currentTime;const f=burst(t,open?380:300,1.2,.18,.28,0,'bandpass',true);f.frequency.setValueAtTime(open?260:420,t);f.frequency.linearRampToValueAtTime(open?520:240,t+.25);if(!open)thump(t+.26,.2,140);}
function makeSpec(k){const roll=Math.random();let kind=roll<.36?'desk':roll<.7?'podium':'board';
  let cands=noteSpots.filter(s=>s.room===k&&s.kind===kind);if(!cands.length){kind='podium';cands=noteSpots.filter(s=>s.room===k&&s.kind===kind);}
  const sp=cands[Math.floor(Math.random()*cands.length)];let s;
  // desk: lying on the shelf under the desktop, sticking out past the edge on the student's side
  if(kind==='desk'){const c=Math.cos(sp.ry),sn=Math.sin(sp.ry);s={mx:sp.x+c*.25,my:sp.y+.595,mz:sp.z-sn*.25,mry:sp.ry,gx:sp.x+c*.34,gy:sp.y+.61,gz:sp.z-sn*.34};}
  // podium: inside the drawer; the faint glint sits on the drawer handle
  else if(kind==='podium'){const d=drawers[k];s={mx:0,my:0,mz:0,lz:R2(-.1,.1),mry:R2(-.4,.4),gx:d.hx-.02,gy:d.hy,gz:d.hz};}
  // board: pinned to the cork among the other notices
  else{const z=R2(-5.6,-2.4),y=sp.y+R2(1.3,1.85);s={mx:sp.x-.008,my:y,mz:z,mry:-Math.PI/2,gx:sp.x-.04,gy:y,gz:z};}
  s.kind=kind;s.room=k;return s;}
function placeNotes(saved){for(const n of notes.concat(sideNotes)){dropMesh(n);scene.remove(n.g.sp);}notes.length=0;sideNotes.length=0;notesGot=0;sideGot=0;journal.length=0;
  lockMesh.visible=true;if(escWin.pane)escWin.pane.position.x=escWin.x;
  if(saved){riddleTypes=saved.riddleTypes;saved.specs.forEach(s=>buildNote(s));notesGot=saved.notesGot;saved.journal.forEach(j=>journal.push(j));
    (saved.side||[]).forEach(s=>buildNote(s,sideNotes));sideGot=saved.sideGot||0;return;}
  riddleTypes=['math','board','count'].sort(()=>Math.random()-.5);riddleTypes.push(['math','board','count'][Math.floor(Math.random()*3)]);
  const rooms=[];while(rooms.length<6){const k=Math.floor(Math.random()*12);if(!rooms.includes(k))rooms.push(k);}
  for(const k of rooms.slice(0,3))buildNote(makeSpec(k));
  // side-quest evidence: three documents in three other rooms; no riddle points to them, only the faint glint
  rooms.slice(3).forEach((k,i)=>{const s=makeSpec(k);s.side=1;s.doc=i;buildNote(s,sideNotes);});
  const first=notes[0];
  journal.push({title:'你口袋裡的紙條',html:`如果你看到這張紙條，代表你也被留下來了。湊齊三張紙條，就知道哪扇窗戶出得去。<span class="riddle">第一張：${roomRiddle(first.room,riddleTypes[0])}${WHERE[first.kind]}</span>`});}
function riddleFor(i){if(i<3){const n=notes[i];return `下一張：${roomRiddle(n.room,riddleTypes[i])}${WHERE[n.kind]}`;}
  return `出口：${roomRiddle(escR,riddleTypes[3]).replace(/^站在樓梯間門口/,'一樓，站在樓梯間門口')}窗戶在教室後面，靠黑板那一側。鎖是壞的，用力推就開。`;}
const sideJournal=[];
// her diary, written in the dark of the storage room
const DIARY=GAME_DATA.diary;
function showJournal(kind){kind=kind||(inv[sel]&&inv[sel].t)||'note';const p=$('paper');let html;
  if(kind==='diary')html=`<small>林語晴的日記 · 在掃具間寫的</small>`+DIARY.map(d=>`<b style="display:block;margin-top:10px;font-size:13px;color:#6b5f55">${d.t}</b>${d.h}`).join('');
  else{const list=kind==='clue'?sideJournal:journal;html=list.slice().reverse().map(j=>`<small>${j.title}</small>${j.html}`).join('<hr>');}
  p.innerHTML=html+`<span class="close">${isTouch?'點一下':'按 R 或 E'} 收起</span>`;p.hidden=false;paperT=0;p.scrollTop=0;sfxPaper();}
function toggleJournal(){if(state!=='play')return;if(!$('paper').hidden){hidePaper();return;}
  if(!noteSelected()){showMsg('先切到紙條、線索或日記那一格',1.4);return;}showJournal();}
function updateGlints(){camera.getWorldDirection(_f);const c=camera.position;winGlint.active=mode==='mission'&&notesGot>=3;
  const list=[winGlint];for(const n of notes.concat(sideNotes)){if(n.taken)n.g.sp.material.opacity=0;else list.push(n.g);}
  for(const g of list){if(!g.active||state!=='play'){g.sp.material.opacity=0;continue;}
    const dx=g.sp.position.x-c.x,dy=g.sp.position.y-c.y,dz=g.sp.position.z-c.z,d=Math.hypot(dx,dy,dz),dot=(_f.x*dx+_f.y*dy+_f.z*dz)/d;
    g.sp.material.opacity=d<9&&dot>.93?(dot-.93)/.07*(1-d/9*.7)*.7*(.55+.45*Math.sin(tAll*3+g.ph)):0;}}
let target=null;
function findTarget(){camera.getWorldDirection(_f);const c=camera.position;let best=null,bs=-9;
  const consider=(px,py,pz,maxD,minDot,obj)=>{const dx=px-c.x,dy=py-c.y,dz=pz-c.z,d=Math.hypot(dx,dy,dz);if(d>maxD||d<.01)return;
    const dot=(_f.x*dx+_f.y*dy+_f.z*dz)/d;if(dot<minDot)return;const sc=dot-d*.04;if(sc>bs&&!segBlocked(c.x,c.y,c.z,px,py,pz)){bs=sc;best=obj;}};
  for(const it of worldItems)if(it.state==='world'){const p=it.mesh.position;consider(p.x,p.y+.06,p.z,2.3,.9,{type:'item',it});}
  // every podium drawer can be pulled open or pushed shut
  for(const d of drawers)if(d)consider(d.hx-d.t*.36,d.hy,d.hz,1.9,.82,{type:'drawer',d});
  if(mode==='mission'){const at=(n,type)=>{if(n.taken)return;
      if(n.kind==='podium'){const d=drawers[n.room];if(!d||d.t<.8)return;n.mesh.getWorldPosition(_wp);consider(_wp.x,_wp.y+.03,_wp.z,2,.85,{type,n});}
      else consider(n.gx,n.gy,n.gz,2,.88,{type,n});};
    for(const n of notes)at(n,'note');for(const n of sideNotes)at(n,'side');
    if(notesGot>=3)consider(escWin.x,1.6,escWin.z,2.4,.75,{type:'window'});}
  return best;}
let lastHand='',lastNoteBtn=null;
function setHand(label){if(label===lastHand)return;lastHand=label;const h=$('bHand');h.hidden=!label;if(label)$('handLabel').textContent=label;}
function updatePrompt(){const pr=$('prompt');
  if(state!=='play'){pr.hidden=true;target=null;setHand('');if(lastNoteBtn!==false){$('noteOpen').hidden=true;lastNoteBtn=false;}return;}
  target=findTarget();let label='';
  if(target){if(target.type==='item')label='撿起'+ITEM[target.it.t].name;
    else if(target.type==='drawer')label=target.d.open?'關上講桌抽屜':'拉開講桌抽屜';
    else if(target.n&&target.n.kind==='podium')label='拿起'+(target.type==='side'?['點名簿','信封','資料夾'][target.n.spec.doc]:'紙條');
    else if(target.type==='note'||target.type==='side')label={desk:'翻找抽屜',board:'撕下布告欄上的紙'}[target.n.kind];
    else label=dawnDone?'從窗戶出去':'推開窗戶，翻出去';}
  // touch: one ghost hand does pick up / search, open the note, or throw what's in hand
  if(isTouch){pr.hidden=true;const it=inv[sel];
    setHand(!$('paper').hidden?'收起':label?label:isSpecial(it)?'看'+ITEM[it.t].name:it?'丟出'+ITEM[it.t].name:'');}
  else{if(label){pr.innerHTML=`<kbd>${padActive?'Y':'E'}</kbd>${label}`;pr.hidden=false;}else pr.hidden=true;
    const show=noteSelected()&&$('paper').hidden?inv[sel].t:false;
    if(show!==lastNoteBtn){$('noteOpen').hidden=!show;if(show)$('noteOpen').innerHTML=`<kbd>R</kbd>打開${ITEM[show].name}`;lastNoteBtn=show;}}}
function handAction(){if(state!=='play')return;if(!$('paper').hidden){hidePaper();return;}
  if(target){interact();return;}if(noteSelected()){showJournal();return;}if(inv[sel])throwSel();}
let paperT=0;
function showPaper(title,text){const p=$('paper');p.innerHTML=`<small>${title}</small>${text}<span class="close">${isTouch?'點一下':'按 E'} 收起</span>`;p.hidden=false;paperT=8;sfxPaper();}
function hidePaper(){$('paper').hidden=true;paperT=0;}$('paper').addEventListener('click',hidePaper);
function interact(){if(state!=='play')return;if(!$('paper').hidden){hidePaper();return;}if(!target)return;
  if(target.type==='item')pickUp(target.it);
  else if(target.type==='drawer'){const d=target.d;d.open=!d.open;sfxDrawer(d.open);makeNoise(3);}
  else if(target.type==='note'){collectNote(target.n,false);}
  else if(target.type==='side'){if(!sideActive){askSide(target.n);return;}collectSide(target.n,false);}
  else if(target.type==='window'){if(dawnDone)startTruth();else startEscape();}}
function collectNote(n,quiet){n.taken=true;n.spec.taken=true;dropMesh(n);notesGot++;if(!quiet)makeNoise(3);
  const ni=notes.findIndex(x=>!x.taken);
  const html=notesGot===3?`最後一張。<span class="riddle">${riddleFor(3)}</span>`:`${NOTE_TXT[notesGot-1]}<span class="riddle">${riddleFor(ni)}</span>`;
  journal.push({title:`紙條 ${notesGot} / 3 · 在${roomNames[n.room]}找到`,html});
  if(!quiet){putSpecial(0,NOTE_ITEM);sel=0;renderBar();showJournal('note');paperT=12;if(notesGot===3)stab(.07);}}
function collectSide(n,quiet){n.taken=true;n.spec.taken=true;dropMesh(n);sideGot++;if(!quiet)makeNoise(3);
  const d=SIDE_DOCS[n.spec.doc];sideJournal.push({title:`線索 ${sideGot} / 3 · ${d.t} · 在${roomNames[n.room]}找到`,html:d.h});
  putSpecial(1,CLUE_ITEM);
  if(sideGot===3){putSpecial(2,DIARY_ITEM);startDawn(quiet);}
  if(!quiet){sel=1;renderBar();showJournal('clue');paperT=14;}}
/* side-quest opt-in: asked before picking up the first piece of evidence */
let sideActive=false,pendingSide=null;
function askSide(n){pendingSide=n;state='confirm';$('askWrap').hidden=false;hidePaper();if(document.pointerLockElement)document.exitPointerLock();$('askYes').focus();}
function answerSide(yes){$('askWrap').hidden=true;const n=pendingSide;pendingSide=null;
  if(yes){sideActive=true;frenzy=false;hint('支線已開啟：沒有時間限制，但一樣要找齊三張紙條才能出去');}
  enterPlay();if(yes&&n)collectSide(n,false);}
const SIDE_DOCS=GAME_DATA.sideDocs;
/* hidden quest: once all three documents are found, a diary appears and you must last until dawn */
let dawnMode=false,dawnT=0,dawnDone=false;const DAWN_LEN=GAME_DATA.dawnSec;
/* dawn: she screams, shrinks back into the dark, and the light comes up; then you still have to leave by the window */
let dawnEndT=0;
function startDawnEnd(){state='dawn';dawnEndT=0;dawnMode=false;hidePaper();$('prompt').hidden=true;setHand('');scream();blackout=1.2;
  showMsg('天亮了。她發出一聲很長的慘叫，縮回了黑暗裡。',4.5);}
function updateDawnEnd(dt){dawnEndT+=dt;const t=dawnEndT;setSky(1+clamp(t/3.5,0,1));
  if(t<1.4){GH.group.visible=Math.random()<.6;GH.group.scale.setScalar(1.05*(1-t/1.6));}else GH.group.visible=false;
  if(t>3.6){dawnDone=true;G.state='gone';G.x=-500;G.z=-500;state='play';
    showMsg(notesGot>=3?'她不見了。從那扇窗戶出去吧。':`她不見了。還差 ${3-notesGot} 張紙條，才知道哪扇窗戶出得去。`,4);}}
function startDawn(quiet){dawnMode=true;dawnT=0;frenzy=false;if(!quiet){stab(.09);showMsg('三份證據都齊了。手裡多了一本日記……撐到天亮。',4.5);hint('隱藏任務：躲到天明');}}
/* hidden ending: climbing out after dawn — no chase. Then the livestream. */
function startTruth(){state='truthOut';escT=0;escFrom={x:P.x,y:P.y+P.eye,z:P.z,yaw:P.yaw,pitch:P.pitch};lockMesh.visible=false;hidePaper();setHand('');$('hud').hidden=true;$('touch').hidden=true;$('prompt').hidden=true;creak();}
function updateTruthOut(dt){escT+=dt;const T=escT,e=t=>{t=clamp(t,0,1);return t*t*(3-2*t);},a=e(T/.9),wx=escWin.x;if(escWin.pane)escWin.pane.position.x=wx+a*1.7;
  let dyaw=-escFrom.yaw;dyaw=Math.atan2(Math.sin(dyaw),Math.cos(dyaw));
  if(T<.9)camera.position.set(escFrom.x+(wx-escFrom.x)*a,escFrom.y+(1.5-escFrom.y)*a,escFrom.z+(-7.7-escFrom.z)*a);
  else{const c=e((T-.9)/1.4);camera.position.set(wx,1.5+Math.sin(c*Math.PI)*.25-.1*c,-7.7-2.6*c);}
  camera.rotation.set(escFrom.pitch*(1-a)+(T>.9?.12*e((T-.9)/1.4):0),escFrom.yaw+dyaw*a,0);
  if(T>2.2)$('fade').style.opacity='1';if(T>3.4)startLive();}
let escT=0,escFrom=null;
function startEscape(){state='escape';escT=0;escFrom={x:P.x,y:P.y+P.eye,z:P.z,yaw:P.yaw,pitch:P.pitch};escCue={};creak();lockMesh.visible=false;$('prompt').hidden=true;hidePaper();setHand('');$('hud').hidden=true;$('touch').hidden=true;}
let escCue={};
/* cutscene: push the window open, climb out, fall, look back — she has run to the window and is staring — scramble up and flee */
function updateEscape(dt){escT+=dt;const T=escT,e=t=>{t=clamp(t,0,1);return t*t*(3-2*t);},cue=(k,at,fn)=>{if(T>=at&&!escCue[k]){escCue[k]=1;fn();}};
  const wx=escWin.x,a=e(T/.9);if(escWin.pane)escWin.pane.position.x=wx+a*1.7;
  let cx,cy,cz,yaw=0,pitch=0,shake=0;let dyaw=-escFrom.yaw;dyaw=Math.atan2(Math.sin(dyaw),Math.cos(dyaw));
  if(T<.9){cx=escFrom.x+(wx-escFrom.x)*a;cy=escFrom.y+(1.5-escFrom.y)*a;cz=escFrom.z+(-7.7-escFrom.z)*a;yaw=escFrom.yaw+dyaw*a;pitch=escFrom.pitch*(1-a);}
  else if(T<1.5){const c=e((T-.9)/.6);cx=wx;cy=1.5+Math.sin(c*Math.PI)*.3;cz=-7.7-.9*c;pitch=-.25*c;}
  else if(T<1.8){const f=((T-1.5)/.3)**2;cx=wx;cy=1.5-1.15*f;cz=-8.6-1.3*f;pitch=-.25-.45*f;}
  else if(T<2.2){cx=wx;cy=.35;cz=-9.9;pitch=-.7+.4*e((T-1.8)/.4);shake=.04*(1-(T-1.8)/.4);}
  else if(T<4.1){const t=e((T-2.2)/.7);cx=wx;cy=.35;cz=-9.9;yaw=Math.PI*t;pitch=-.3+.78*t;shake=T>2.9?.006:0;}
  else{const u=e((T-4.1)/.5),r=clamp((T-4.6)/1,0,1);cx=wx+Math.sin(T*9)*.05*r;cy=.35+1.1*u+Math.abs(Math.sin(T*14))*.06*r;cz=-9.9-4.8*r*r;yaw=Math.PI*(1-u);pitch=.48*(1-u)-.05;shake=.02*r;}
  camera.position.set(cx+(Math.random()-.5)*shake,cy+(Math.random()-.5)*shake,cz);camera.rotation.set(pitch,yaw,0);
  // her: hears the window, rushes from the classroom door to stand at it
  const s=escR*9;
  cue('win',.85,()=>{if(A.ctx)burst(A.ctx.currentTime,900,1,.25,.3,0,'bandpass',true);});
  cue('her',1.5,()=>{G.x=s+1.8;G.z=-1.1;G.y=0;G.state='chase';GH.group.visible=true;});
  cue('arrive',2.6,()=>{G.state='stare';});
  if(T>=1.5){const h=e((T-1.5)/1.1);G.x=s+1.8+(wx-s-1.8)*h;G.z=-1.1+(-7.75+1.1)*h;G.y=0;G.yaw=Math.atan2(G.x-cx,G.z-cz)+Math.PI;
    if(T<2.6&&Math.floor(T*4)!==escCue.st){escCue.st=Math.floor(T*4);ghostStep(G.x,G.z,0,true,false);}}
  cue('fall',1.8,()=>{if(A.ctx){thump(A.ctx.currentTime,.7,95);sfxStep(.4);}});
  cue('stare',2.9,()=>{stab(.12);whisperShort(.22);});
  cue('flee',4.1,()=>{if(A.ctx)hit();});
  if(T>4.6&&Math.floor(T*4.5)!==escCue.fs){escCue.fs=Math.floor(T*4.5);sfxStep(.3);}
  if(T>5.1)$('fade').style.opacity='1';if(T>6.2)finish('escape');}

/* ---------- state ---------- */
const P={x:4,y:0,z:1.5,vx:0,vz:0,vy:0,yaw:-Math.PI/2,pitch:0,eye:1.6,crouch:false,grounded:true,bob:0,stepAcc:0,hidden:false,airPeak:0};
const G={x:0,y:0,z:0,yaw:0,state:'dormant',path:[],timer:0,pause:0,lostT:0,repath:0,last:{x:0,y:0,z:0}};
let state='menu',gameT=0,tAll=0,frenzy=false,flashOn=true,danger=0,blackout=0,eventT=20,barrierCD=0,caughtT=0,msgT=0,hintShown=false;

function resetGame(keepMusic){Object.assign(P,{x:4,y:0,z:1.5,vx:0,vz:0,vy:0,yaw:-Math.PI/2,pitch:0,eye:1.6,crouch:false,grounded:true,bob:0,stepAcc:0,hidden:false,lastNoise:-9});
  const sp=nearestNode({x:31.5,y:2*FH,z:-4.2});
  Object.assign(G,{x:nodes[sp].x,y:nodes[sp].y,z:nodes[sp].z,yaw:Math.PI,state:'dormant',path:[],timer:18,pause:0,lostT:0,repath:0});
  if(!keepMusic)stopWarm();closeDrawers();gameT=0;frenzy=false;dawnMode=false;dawnT=0;dawnDone=false;sideActive=false;sideJournal.length=0;setSky(0);GH.group.scale.setScalar(1.05);flashOn=true;danger=0;blackout=0;eventT=24;caughtT=0;hintShown=false;GH.group.visible=true;$('bLight').setAttribute('aria-pressed','true');
  placeItems();placeNotes();hidePaper();hint('');$('fade').style.opacity='0';}
resetGame();

/* ---------- input ---------- */
const keys={};let mouseDX=0,mouseDY=0,touchDX=0,touchDY=0,dragLook=false,dragging=false,jumpQ=false,touchStance='walk';
let sensMouse=1,sensTouch=1;
try{sensMouse=+localStorage.getItem('ms-sens-m')||1;sensTouch=+localStorage.getItem('ms-sens-t')||1;}catch(err){}
const stick={id:null,ox:0,oy:0,x:0,y:0},look={id:null,lx:0,ly:0};
addEventListener('keydown',e=>{keys[e.code]=true;if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code))e.preventDefault();
  if(e.repeat)return;
  if(state==='confirm'){if(e.code==='KeyE'||e.code==='Enter')answerSide(true);else if(e.code==='Escape'||e.code==='KeyN')answerSide(false);return;}
  if(e.code==='KeyM')setMuted(!A.muted);
  if(e.code==='Escape'||e.code==='KeyP'){if(state==='play')pauseGame();else if(state==='pause')enterPlay();return;}
  if(e.code==='Space')jumpQ=true;if(state!=='play')return;
  if(e.code==='KeyF')toggleFlash();if(e.code==='KeyE')interact();if(e.code==='KeyR')toggleJournal();if(e.code==='KeyQ'||e.code==='KeyG')throwSel();
  const dg=/^Digit([1-5])$/.exec(e.code);if(dg)selectSlot(+dg[1]-1);});
addEventListener('wheel',e=>{if(state==='play')selectSlot(sel+(e.deltaY>0?1:-1));},{passive:true});
addEventListener('keyup',e=>{keys[e.code]=false;});
addEventListener('blur',()=>{for(const k in keys)keys[k]=false;});
document.addEventListener('mousemove',e=>{if(state!=='play')return;if(document.pointerLockElement===canvas||(dragLook&&dragging)){mouseDX+=e.movementX||0;mouseDY+=e.movementY||0;}});
canvas.addEventListener('mousedown',e=>{dragging=true;if(state!=='play'||isTouch)return;
  if(document.pointerLockElement===canvas){if(e.button===0)throwSel();}else if(!dragLook)lockPointer();});
addEventListener('mouseup',()=>{dragging=false;});
function lockPointer(){try{const p=canvas.requestPointerLock&&canvas.requestPointerLock();if(p&&p.catch)p.catch(()=>{dragLook=true;hint('按住滑鼠拖曳來轉動視角');});}catch(err){dragLook=true;}}
document.addEventListener('pointerlockerror',()=>{dragLook=true;hint('按住滑鼠拖曳來轉動視角');});
document.addEventListener('pointerlockchange',()=>{if(!document.pointerLockElement&&state==='play'&&!dragLook&&!isTouch&&!padActive)pauseGame();});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&state==='play'){saveGame();pauseGame();}});
// autosave: every 30 s while playing and when the page is closed, so a refresh doesn't start you over
addEventListener('pagehide',()=>{if(state==='play'||state==='pause')saveGame();});
setInterval(()=>{if(state==='play')saveGame();},30000);
// touch
const zone=$('stickZone'),base=$('stickBase'),knob=$('knob');
zone.addEventListener('touchstart',e=>{const t=e.changedTouches[0];stick.id=t.identifier;stick.ox=t.clientX;stick.oy=t.clientY;stick.x=stick.y=0;const r=zone.getBoundingClientRect();base.style.left=(t.clientX-r.left)+'px';base.style.top=(t.clientY-r.top)+'px';knob.style.transform='';e.preventDefault();},{passive:false});
zone.addEventListener('touchmove',e=>{for(const t of e.changedTouches)if(t.identifier===stick.id){let dx=t.clientX-stick.ox,dy=t.clientY-stick.oy;const d=Math.hypot(dx,dy);if(d>50){dx*=50/d;dy*=50/d;}stick.x=dx/50;stick.y=dy/50;knob.style.transform=`translate(${dx}px,${dy}px)`;}e.preventDefault();},{passive:false});
const endStick=e=>{for(const t of e.changedTouches)if(t.identifier===stick.id){stick.id=null;stick.x=stick.y=0;knob.style.transform='';}};
zone.addEventListener('touchend',endStick);zone.addEventListener('touchcancel',endStick);
canvas.addEventListener('touchstart',e=>{const t=e.changedTouches[0];if(look.id===null){look.id=t.identifier;look.lx=t.clientX;look.ly=t.clientY;}e.preventDefault();},{passive:false});
canvas.addEventListener('touchmove',e=>{for(const t of e.changedTouches)if(t.identifier===look.id){touchDX+=t.clientX-look.lx;touchDY+=t.clientY-look.ly;look.lx=t.clientX;look.ly=t.clientY;}e.preventDefault();},{passive:false});
const endLook=e=>{for(const t of e.changedTouches)if(t.identifier===look.id)look.id=null;};
canvas.addEventListener('touchend',endLook);canvas.addEventListener('touchcancel',endLook);
const tap=(id,fn)=>{const el=$(id);el.addEventListener('touchstart',e=>{fn();e.preventDefault();e.stopPropagation();},{passive:false});el.addEventListener('click',fn);};
tap('bJump',()=>{jumpQ=true;});tap('bLight',toggleFlash);tap('bHand',handAction);tap('noteOpen',()=>{if(noteSelected())showJournal();});
function setStance(s){touchStance=s;document.querySelectorAll('.st').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.st===s)));}
document.querySelectorAll('.st').forEach(b=>tap(b.id,()=>setStance(b.dataset.st)));
function toggleFlash(){flashOn=!flashOn;$('bLight').setAttribute('aria-pressed',String(flashOn));sfxClick();}
// gamepad
let padActive=false;const padPrev={};const pad={mx:0,my:0,lx:0,ly:0,crouch:false};
function pollPad(){pad.mx=pad.my=pad.lx=pad.ly=0;pad.crouch=false;const gps=navigator.getGamepads?navigator.getGamepads():[];
  for(const gp of gps){if(!gp)continue;padActive=true;const dz=v=>Math.abs(v)<.16?0:v;
    pad.mx=dz(gp.axes[0]||0);pad.my=dz(gp.axes[1]||0);pad.lx=dz(gp.axes[2]||0);pad.ly=dz(gp.axes[3]||0);
    const b=i=>!!(gp.buttons[i]&&gp.buttons[i].pressed);const edge=i=>{const k=gp.index+':'+i;const now=b(i),was=padPrev[k];padPrev[k]=now;return now&&!was;};
    pad.crouch=b(1)||b(10);
    const a=edge(0),y=edge(3);
    if(a){if(state==='play')jumpQ=true;else if(state==='menu')newGame();else if(state==='pause')enterPlay();else if(state==='end')again();}
    if(y&&state==='play')interact();
    if(edge(8)&&state==='play')toggleJournal();
    if(edge(2)&&state==='play')toggleFlash();
    if(edge(4)&&state==='play')selectSlot(sel-1);if(edge(5)&&state==='play')selectSlot(sel+1);
    if(edge(7)&&state==='play')throwSel();
    if(edge(9)){if(state==='play')pauseGame();else if(state==='pause')enterPlay();else if(state==='menu')newGame();}
    edge(1);edge(10);break;}}

/* ---------- audio ---------- */
const A={ctx:null,muted:false};
try{A.muted=localStorage.getItem('ms-muted')==='1';}catch(err){}
function setMuted(m){A.muted=m;try{localStorage.setItem('ms-muted',m?'1':'0');}catch(err){}
  const b=$('muteBtn');b.setAttribute('aria-pressed',String(m));b.textContent=m?'聲音：關（M）':'聲音：開（M）';
  if(A.master){A.master.gain.cancelScheduledValues(0);A.master.gain.setTargetAtTime(m?0:.9,A.ctx.currentTime,.05);}}
$('muteBtn').addEventListener('click',e=>{setMuted(!A.muted);e.currentTarget.blur();});
setMuted(A.muted);
function audioInit(){if(A.ctx){A.ctx.resume();return;}const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;
  const ctx=new AC();A.ctx=ctx;const sr=ctx.sampleRate;
  const master=ctx.createGain();master.gain.value=A.muted?0:.9;const comp=ctx.createDynamicsCompressor();comp.threshold.value=-14;comp.ratio.value=4;master.connect(comp);comp.connect(ctx.destination);A.master=master;
  const nb=ctx.createBuffer(1,sr*2,sr),ndat=nb.getChannelData(0);for(let i=0;i<ndat.length;i++)ndat[i]=Math.random()*2-1;A.noise=nb;
  const conv=ctx.createConvolver(),len=Math.floor(sr*3.2),ir=ctx.createBuffer(2,len,sr);for(let ch=0;ch<2;ch++){const d=ir.getChannelData(ch);for(let i=0;i<len;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/len,2.8);}
  conv.buffer=ir;const rg=ctx.createGain();rg.gain.value=.5;conv.connect(rg);rg.connect(master);A.rev=conv;
  const dl=ctx.createDelay(1.5);dl.delayTime.value=.43;const fb=ctx.createGain();fb.gain.value=.42;const dlp=ctx.createBiquadFilter();dlp.type='lowpass';dlp.frequency.value=1800;dl.connect(dlp);dlp.connect(fb);fb.connect(dl);dlp.connect(master);dlp.connect(conv);A.delay=dl;
  // cicadas: band-passed noise, pulsed
  const cicBus=ctx.createGain();cicBus.gain.value=.42;const cicLP=ctx.createBiquadFilter();cicLP.type='lowpass';cicLP.frequency.value=8000;cicBus.connect(cicLP);cicLP.connect(master);A.cicBus=cicBus;A.cicLP=cicLP;
  [[4300,47,-.6],[5200,61,.5],[6100,38,.1],[3700,53,-.25],[4800,71,.7]].forEach(([f,rate,pan],i)=>{
    const src=noiseSrc();src.playbackRate.value=.9+i*.05;const bp=ctx.createBiquadFilter();bp.type='bandpass';bp.frequency.value=f;bp.Q.value=6;
    const am=ctx.createGain();am.gain.value=.5;const lfo=ctx.createOscillator();lfo.frequency.value=rate;const lg=ctx.createGain();lg.gain.value=.5;lfo.connect(lg);lg.connect(am.gain);
    const sw=ctx.createGain();sw.gain.value=.6;const sl=ctx.createOscillator();sl.frequency.value=.06+i*.035;const sg=ctx.createGain();sg.gain.value=.4;sl.connect(sg);sg.connect(sw.gain);
    const pn=mkPan(pan);src.connect(bp);bp.connect(am);am.connect(sw);sw.connect(pn);pn.connect(cicBus);lfo.start();sl.start();});
  // drone
  const dg=ctx.createGain();dg.gain.value=0;dg.gain.linearRampToValueAtTime(.09,ctx.currentTime+6);const dlpf=ctx.createBiquadFilter();dlpf.type='lowpass';dlpf.frequency.value=360;dlpf.Q.value=5;
  [[55,'sawtooth',.3],[55.45,'sawtooth',.3],[82.6,'sine',.25],[77.8,'sine',.18],[110.6,'triangle',.12]].forEach(([f,t,v])=>{const o=ctx.createOscillator();o.type=t;o.frequency.value=f;const g=ctx.createGain();g.gain.value=v;o.connect(g);g.connect(dlpf);o.start();});
  const dl2=ctx.createOscillator();dl2.frequency.value=.045;const dlg=ctx.createGain();dlg.gain.value=180;dl2.connect(dlg);dlg.connect(dlpf.frequency);dl2.start();
  dlpf.connect(dg);dg.connect(master);dg.connect(conv);A.drone=dg;
  // whisper (seeker proximity)
  const ws=noiseSrc();const wbp=ctx.createBiquadFilter();wbp.type='bandpass';wbp.frequency.value=1400;wbp.Q.value=4;const wg=ctx.createGain();wg.gain.value=0;const wp=mkPan(0);
  ws.connect(wbp);wbp.connect(wg);wg.connect(wp);wp.connect(master);wp.connect(conv);A.wg=wg;A.wbp=wbp;A.wp=wp;
  // fluorescent buzz
  const bo=ctx.createOscillator();bo.type='sawtooth';bo.frequency.value=120;const bbp=ctx.createBiquadFilter();bbp.type='bandpass';bbp.frequency.value=360;bbp.Q.value=2;const bg=ctx.createGain();bg.gain.value=0;bo.connect(bbp);bbp.connect(bg);bg.connect(master);bo.start();A.bg=bg;
  A.nextNote=ctx.currentTime+3;A.nextStab=ctx.currentTime+30;A.nextBeat=0;}
function noiseSrc(){const s=A.ctx.createBufferSource();s.buffer=A.noise;s.loop=true;s.start(0,Math.random()*1.5);return s;}
function mkPan(v){const c=A.ctx;if(c.createStereoPanner){const p=c.createStereoPanner();p.pan.value=v;return p;}return c.createGain();}
function env(g,t,a,peak,d){g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(peak,t+a);g.gain.exponentialRampToValueAtTime(.0001,t+a+d);}
function burst(t,freq,q,vol,dur,pan,type,toRev){const c=A.ctx;const s=c.createBufferSource();s.buffer=A.noise;const f=c.createBiquadFilter();f.type=type||'bandpass';f.frequency.value=freq;f.Q.value=q;const g=c.createGain();env(g,t,.004,vol,dur);const p=mkPan(pan||0);
  s.connect(f);f.connect(g);g.connect(p);p.connect(A.master);if(toRev)p.connect(A.rev);s.start(t,Math.random()*1.5,dur+.1);return f;}
function thump(t,vol,f0){const c=A.ctx;const o=c.createOscillator();o.frequency.setValueAtTime(f0||75,t);o.frequency.exponentialRampToValueAtTime(36,t+.14);const g=c.createGain();env(g,t,.008,vol,.17);o.connect(g);g.connect(A.master);o.start(t);o.stop(t+.3);}
function bell(f,t,vol){const c=A.ctx;const g=c.createGain();env(g,t,.008,vol,2.6);
  const o=c.createOscillator();o.type='sine';o.frequency.value=f;const o2=c.createOscillator();o2.type='triangle';o2.frequency.value=f*2.01;const g2=c.createGain();g2.gain.value=.25;
  o.connect(g);o2.connect(g2);g2.connect(g);g.connect(A.delay);g.connect(A.rev);g.connect(A.master);o.start(t);o2.start(t);o.stop(t+2.8);o2.stop(t+2.8);}
function stab(vol){if(!A.ctx)return;const c=A.ctx,t=c.currentTime;const lp=c.createBiquadFilter();lp.type='lowpass';lp.Q.value=3;lp.frequency.setValueAtTime(180,t);lp.frequency.exponentialRampToValueAtTime(2600,t+4.5);
  const g=c.createGain();g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(vol,t+4.5);g.gain.exponentialRampToValueAtTime(.0001,t+4.9);
  [233.1,246.9,261.6,277.2,370].forEach(f=>{const o=c.createOscillator();o.type='sawtooth';o.frequency.value=f*(1+(Math.random()-.5)*.01);o.connect(lp);o.start(t);o.stop(t+5);});lp.connect(g);g.connect(A.master);g.connect(A.rev);}
function hit(){if(!A.ctx)return;const t=A.ctx.currentTime;thump(t,1,120);burst(t,3000,.7,.4,.9,0,'bandpass',true);
  [311,330,466,494].forEach(f=>{const o=A.ctx.createOscillator();o.type='sawtooth';o.frequency.value=f;const g=A.ctx.createGain();env(g,t,.01,.05,1.4);o.connect(g);g.connect(A.master);g.connect(A.rev);o.start(t);o.stop(t+1.5);});}
function creak(){if(!A.ctx)return;const c=A.ctx,t=c.currentTime;const o=c.createOscillator();o.type='sawtooth';o.frequency.setValueAtTime(70,t);
  for(let i=1;i<=12;i++)o.frequency.linearRampToValueAtTime(60+Math.random()*60,t+i*.1);const bp=c.createBiquadFilter();bp.type='bandpass';bp.frequency.value=800;bp.Q.value=7;
  const g=c.createGain();g.gain.setValueAtTime(.0001,t);g.gain.linearRampToValueAtTime(.12,t+.2);g.gain.linearRampToValueAtTime(.0001,t+1.25);const p=mkPan(Math.random()*1.6-.8);
  o.connect(bp);bp.connect(g);g.connect(p);p.connect(A.master);p.connect(A.rev);o.start(t);o.stop(t+1.3);}
function knock(){if(!A.ctx)return;const t=A.ctx.currentTime,pan=Math.random()*1.6-.8,n=2+Math.floor(Math.random()*3);for(let i=0;i<n;i++){burst(t+i*.32,180,1,.5,.12,pan,'lowpass',true);}}
function whisperShort(vol){if(!A.ctx)return;const t=A.ctx.currentTime;const f=burst(t,700,3,vol||.14,.9,Math.random()*1.6-.8,'bandpass',true);f.frequency.setValueAtTime(600,t);f.frequency.linearRampToValueAtTime(2200,t+.4);f.frequency.linearRampToValueAtTime(900,t+.9);}
function scream(){if(!A.ctx)return;const c=A.ctx,t=c.currentTime;for(let i=0;i<6;i++){const o=c.createOscillator();o.type='sawtooth';const f=380+Math.random()*900;o.frequency.setValueAtTime(f,t);o.frequency.exponentialRampToValueAtTime(f*1.5,t+.25);o.frequency.exponentialRampToValueAtTime(f*.6,t+1.4);
  const g=c.createGain();env(g,t,.01,.12,1.4);o.connect(g);g.connect(A.master);g.connect(A.rev);o.start(t);o.stop(t+1.6);}burst(t,2400,.6,.8,1.2,0,'bandpass',true);thump(t,1,140);}
function sfxStep(vol){if(!A.ctx)return;const t=A.ctx.currentTime;burst(t,900+Math.random()*500,1.2,vol,.09,0,'bandpass',true);}
function sfxClick(){if(!A.ctx)return;burst(A.ctx.currentTime,3500,2,.12,.03,0,'bandpass',false);}
function panFor(x,z){const dx=x-P.x,dz=z-P.z,d=Math.hypot(dx,dz)||1;return clamp((dx*Math.cos(P.yaw)-dz*Math.sin(P.yaw))/d,-1,1)*.8;}
function tone(t,f,type,vol,dur,pan){const c=A.ctx;const o=c.createOscillator();o.type=type;o.frequency.value=f;const g=c.createGain();env(g,t,.004,vol,dur);const p=mkPan(pan);o.connect(g);g.connect(p);p.connect(A.master);p.connect(A.rev);o.start(t);o.stop(t+dur+.05);}
function sfxImpact(type,x,z,soft){if(!A.ctx)return;const t=A.ctx.currentTime,pan=panFor(x,z),att=clamp(1-Math.hypot(x-P.x,z-P.z)/30,.15,1)*(soft?.35:1);
  if(type==='ext'){[220,563,891,1240].forEach((f,i)=>tone(t,f,i?'sine':'square',.1*att/(i+1),1.8-i*.3,pan));burst(t,1800,.8,.4*att,.25,pan,'bandpass',true);thump(t,.4*att,110);}
  else if(type==='scissors'){tone(t,2400,'sine',.1*att,.5,pan);tone(t,3710,'sine',.07*att,.35,pan);burst(t,5000,1,.2*att,.04,pan,'highpass',true);}
  else if(type==='chalk'){for(let i=0;i<3;i++)burst(t+i*.04,3500,1,.22*att,.03,pan,'highpass',true);}
  else if(type==='bag'){thump(t,.45*att,90);burst(t,400,.7,.35*att,.15,pan,'lowpass',true);}
  else burst(t,700,.7,.22*att,.06,pan,'lowpass',true);}
function ghostStep(x,z,dy,heavy,alt){if(!A.ctx||A.ctx.state!=='running')return;const c=A.ctx,t=c.currentTime;
  const d=Math.hypot(x-P.x,z-P.z),ady=Math.abs(dy);const att=clamp(1-d/26,0,1)*(ady<2?1:ady<5?.4:.15);if(att<.02)return;
  const pan=panFor(x,z);const s=c.createBufferSource();s.buffer=A.noise;const f=c.createBiquadFilter();f.type='lowpass';f.frequency.value=ady<2?(heavy?1500:950):320;
  const g=c.createGain();env(g,t,.006,(heavy?.5:.34)*att,heavy?.13:.2);const p=mkPan(pan);s.connect(f);f.connect(g);g.connect(p);p.connect(A.master);p.connect(A.rev);s.start(t,Math.random()*1.5,.35);
  const o=c.createOscillator();o.frequency.setValueAtTime(heavy?95:70,t);o.frequency.exponentialRampToValueAtTime(38,t+.12);const og=c.createGain();env(og,t,.006,(heavy?.4:.22)*att,.15);o.connect(og);og.connect(p);o.start(t);o.stop(t+.25);
  if(!heavy&&alt){const s2=c.createBufferSource();s2.buffer=A.noise;const f2=c.createBiquadFilter();f2.type='bandpass';f2.frequency.value=ady<2?700:300;f2.Q.value=1.5;
    const g2=c.createGain();g2.gain.setValueAtTime(.0001,t+.12);g2.gain.linearRampToValueAtTime(.07*att,t+.25);g2.gain.linearRampToValueAtTime(.0001,t+.55);
    s2.connect(f2);f2.connect(g2);g2.connect(p);s2.start(t+.1,Math.random()*1.5,.5);}}
function sfxPick(){if(!A.ctx)return;const t=A.ctx.currentTime;burst(t,1600,1.5,.12,.08,0,'bandpass',false);tone(t+.03,880,'sine',.03,.15,0);}
function sfxWhoosh(){if(!A.ctx)return;const t=A.ctx.currentTime;const f=burst(t,600,2,.14,.3,0,'bandpass',false);f.frequency.setValueAtTime(400,t);f.frequency.exponentialRampToValueAtTime(2200,t+.25);}
function sfxPaper(){if(!A.ctx)return;const t=A.ctx.currentTime;for(let i=0;i<5;i++)burst(t+i*.05+Math.random()*.03,2800+Math.random()*2000,1,.1,.05,0,'bandpass',false);}

function updateAudio(dt){if(!A.ctx||A.ctx.state!=='running')return;const c=A.ctx,t=c.currentTime;
  // calm: the walk home, the dream and the true-ending page — no drone, only faraway summer cicadas under the warm music
  const calm=state==='homeSeq'||state==='dreamSeq'||((state==='end'||state==='menu')&&warmOn);
  if(calm)A.drone.gain.cancelScheduledValues(t);
  const inside=P.z<-.1||P.x>36.1;A.cicLP.frequency.setTargetAtTime(calm?2600:inside?(P.x>36.1?1100:1700):7500,t,.4);
  A.cicBus.gain.setTargetAtTime(state==='homeSeq'?0:calm?.08:state==='end'?0:.42*(1-danger*.85),t,state==='homeSeq'?.3:.6);
  A.drone.gain.setTargetAtTime(calm?0:.08+danger*.12,t,calm?1.5:.8);
  if(calm){A.wg.gain.setTargetAtTime(0,t,.3);A.bg.gain.setTargetAtTime(0,t,.3);return;}
  // whisper pan + gain
  const dx=G.x-P.x,dz=G.z-P.z,d=Math.hypot(dx,dz)||1;const rx=Math.cos(P.yaw),rz=-Math.sin(P.yaw);
  if(A.wp.pan)A.wp.pan.setTargetAtTime(clamp((dx*rx+dz*rz)/d,-1,1)*.85,t,.1);
  A.wg.gain.setTargetAtTime(state==='play'&&G.state!=='dormant'?danger*danger*.22:0,t,.3);
  if(Math.random()<dt*3)A.wbp.frequency.setTargetAtTime(500+Math.random()*2200,t,.08);
  // buzz from nearest lit tube
  let bz=0;for(const f of fixtures){if(f.level!==Math.round(P.y/FH))continue;const dd=Math.hypot(f.x-P.x,f.z-P.z);if(dd<5)bz=Math.max(bz,f.b*(1-dd/5));}
  A.bg.gain.setTargetAtTime(bz*.03,t,.02);
  if(state!=='play')return;
  // music box
  if(t>A.nextNote){const notes=[440,466.2,523.3,622.3,659.3,415.3,349.2,311.1];bell(notes[Math.floor(Math.random()*notes.length)]*(1+(Math.random()-.5)*.018),t+.02,.05);
    if(Math.random()<.3)bell(notes[Math.floor(Math.random()*notes.length)]/2,t+.4,.035);A.nextNote=t+1.4+Math.random()*3.2;}
  if(t>A.nextStab){stab(.06);A.nextStab=t+28+Math.random()*30;}
  // heartbeat
  if(danger>.25&&t>A.nextBeat){const v=(danger-.2)*.7;thump(t+.02,v,70);thump(t+.24,v*.7,62);A.nextBeat=t+1.15-danger*.7;}}

/* ---------- player ---------- */
function collide(px,pz,py,height){let hitB=false;
  for(let it=0;it<2;it++)for(const s of solids){if(s.crawl&&P.crouch)continue;if(s.y1<=py+.3||s.y0>=py+height)continue;
    const cx=clamp(px,s.x0,s.x1),cz=clamp(pz,s.z0,s.z1);const dx=px-cx,dz=pz-cz,d2=dx*dx+dz*dz,RAD=.28;
    if(d2<RAD*RAD){if(d2>1e-8){const d=Math.sqrt(d2);px=cx+dx/d*RAD;pz=cz+dz/d*RAD;}
      else{const pen=[px-s.x0,s.x1-px,pz-s.z0,s.z1-pz];const m=Math.min(...pen);if(m===pen[0])px=s.x0-RAD;else if(m===pen[1])px=s.x1+RAD;else if(m===pen[2])pz=s.z0-RAD;else pz=s.z1+RAD;}
      if(s.barrier)hitB=true;}}
  if(hitB&&barrierCD<=0){barrierCD=5;const lines=['有什麼東西擋住了你。','你出不去。','……別想離開。','外面什麼都沒有。'];showMsg(lines[Math.floor(Math.random()*lines.length)],2.4);whisperShort(.2);}
  return[px,pz];}
function underDesk(){for(const s of solids){if(!s.hide)continue;if(P.x>s.x0-.05&&P.x<s.x1+.05&&P.z>s.z0-.05&&P.z<s.z1+.05&&Math.abs(s.y0-P.y)<.3)return true;}return false;}
function updatePlayer(dt){
  const sm=.0023*sensMouse,st=.0055*sensTouch;
  P.yaw-=mouseDX*sm+touchDX*st;P.pitch-=mouseDY*sm+touchDY*st;mouseDX=mouseDY=touchDX=touchDY=0;
  P.yaw-=pad.lx*2.8*sensMouse*dt;P.pitch-=pad.ly*2.2*sensMouse*dt;P.pitch=clamp(P.pitch,-1.45,1.45);
  let mx=(keys.KeyD||keys.ArrowRight?1:0)-(keys.KeyA||keys.ArrowLeft?1:0)+pad.mx+stick.x;
  let mz=(keys.KeyW||keys.ArrowUp?1:0)-(keys.KeyS||keys.ArrowDown?1:0)-pad.my-stick.y;
  const ml=Math.hypot(mx,mz);if(ml>1){mx/=ml;mz/=ml;}
  const ud=underDesk();
  const wantCrouch=keys.ShiftLeft||keys.ShiftRight||pad.crouch||touchStance==='crouch';
  P.crouch=wantCrouch||(P.crouch&&ud);
  P.hidden=P.crouch&&ud;
  const running=!P.crouch&&touchStance==='run';
  const speed=P.crouch?1.45:running?4.9:3.3;const fx=-Math.sin(P.yaw),fz=-Math.cos(P.yaw),rx=Math.cos(P.yaw),rz=-Math.sin(P.yaw);
  const wx=(fx*mz+rx*mx)*speed,wz=(fz*mz+rz*mx)*speed;const k=Math.min(1,dt*(P.grounded?11:3));P.vx+=(wx-P.vx)*k;P.vz+=(wz-P.vz)*k;
  const height=P.crouch?.85:1.75;
  let[nx,nz]=collide(P.x+P.vx*dt,P.z+P.vz*dt,P.y,height);
  if(jumpQ&&P.grounded&&!P.crouch){P.vy=5.1;P.grounded=false;P.airPeak=P.y;}jumpQ=false;
  P.vy-=16*dt;let ny=P.y+P.vy*dt;const g=groundAt(nx,nz,P.y);
  if(ny<=g){if(!P.grounded&&P.vy<-3.5){sfxStep(.35);makeNoise(13);}ny=g;P.vy=0;P.grounded=true;}
  else if(P.grounded&&P.vy<=0&&ny-g<.5){ny=g;P.vy=0;}
  else P.grounded=false;
  const moved=Math.hypot(nx-P.x,nz-P.z);P.x=nx;P.z=nz;P.y=ny;
  P.eye+=((P.crouch?.55:1.6)-P.eye)*Math.min(1,dt*10);
  if(P.grounded&&moved>.001){P.bob+=moved*(P.crouch?5:6.5);P.stepAcc+=moved;const stepLen=P.crouch?.55:running?.95:.7;
    if(P.stepAcc>stepLen){P.stepAcc=0;if(P.crouch){sfxStep(.03);if(frenzy)makeNoise(1.2);else{P.noiseLvl=0;P.noiseAt=tAll;}}else if(running){sfxStep(.24);makeNoise(9);}else{sfxStep(.14);makeNoise(4.5);}}}
  barrierCD-=dt;
  if(!hintShown&&gameT>6){hintShown=true;hint(isTouch?'切到蹲下的人形，可以鑽進椅子拉開的桌子底下':'按住 Shift 蹲下，可以鑽進椅子拉開的桌子底下');}}

/* ---------- seeker AI ---------- */
function setPath(p){const a=nearestNode(G),b=nearestNode(p);G.path=route(a,b);}
function newWander(){if(frenzy&&Math.random()<.4){setPath(P);return;}
  let pool=roomNodes;if(Math.random()<(frenzy?.85:.45)){const lv=Math.round(P.y/FH);pool=roomNodes.filter(i=>Math.round(nodes[i].y/FH)===lv);}
  const tgt=nodes[pool[Math.floor(Math.random()*pool.length)]];setPath(tgt);}
/* She is blind: she only ever hunts sounds. Standing or crouching still right in front of her is safe — she just hesitates. */
// posture sets how far your footsteps carry: crouch 0 m, walk 4.5 m, run 9 m, landing a jump 13 m (×2.2 once she's mad) — shown on the HUD meter
function makeNoise(radius){P.lastNoise=gameT;P.noiseLvl=radius*(frenzy?2.2:1);P.noiseAt=tAll;makeNoiseAt(P.x,P.y,P.z,radius,false);}
function makeNoiseAt(x,y,z,radius,thrown){if(state!=='play'||G.state==='gone')return;if(G.state==='dormant'&&!thrown)return;
  if(frenzy)radius*=2.2;
  const d=Math.hypot(G.x-x,G.z-z),dy=Math.abs(G.y-y);const r=dy<2?radius:dy<5?radius*.5:dy<8?radius*.25:0;if(d>=r)return;
  const wasHunting=G.state==='chase';G.last={x,y,z};G.lostT=0;G.pause=0;G.hes=0;
  if(d<7&&dy<2){G.state='chase';G.path=[];if(!wasHunting)onHeard(thrown);}
  else{G.state=wasHunting?'chase':'investigate';setPath({x,y,z});
    if(!wasHunting){if(thrown)showMsg('她被聲音吸引過去了……',2);else if(radius>8)showMsg('她聽見了。',1.8);}}}
function onHeard(thrown){if(thrown){showMsg('她被聲音吸引過去了……',2);return;}hit();showMsg('她聽到你了！',2);blackout=Math.max(blackout,.5);}
function ghostUpdate(dt){if(G.state==='gone')return;
  if(G.state==='dormant'){G.timer-=dt;if(G.timer<=0){G.state='wander';G.pause=0;showMsg('……她醒了。',3);stab(.1);}}
  const pd=Math.hypot(P.x-G.x,P.z-G.z),pdy=Math.abs(P.y-G.y),silent=gameT-(P.lastNoise??-9)>.7;
  // bumped into her but holding still: she can't see you, she only pauses, unsure
  if(pd<1.4&&pdy<1.3&&silent&&G.state!=='dormant'&&G.state!=='hesitate'&&!(G.hesCD>0)){G.state='hesitate';G.hes=1.8+Math.random()*1.2;G.path=[];G.hesCD=6;whisperShort(.16);showMsg('她停在你面前……別動。',2.2);}
  G.hesCD=(G.hesCD||0)-dt;
  let speed=frenzy?2.3:1.25,direct=false;const ox=G.x,oz=G.z;
  switch(G.state){
    case'dormant':speed=0;break;
    case'hesitate':speed=0;G.hes-=dt;G.yaw+=Math.sin(tAll*3.1)*dt*1.5;if(G.hes<=0){G.state='wander';G.pause=0;G.path=[];}break;
    case'wander':if(G.pause>0){G.pause-=dt*(frenzy?3:1);speed=0;G.yaw+=Math.sin(tAll*1.3)*dt;}else if(!G.path.length)newWander();break;
    case'investigate':speed=frenzy?3.2:2;if(!G.path.length){G.state='search';G.timer=(frenzy?1.5:3)+Math.random()*2;}break;
    case'search':speed=0;G.timer-=dt;G.yaw+=Math.sin(tAll*2)*dt*2;if(G.timer<=0){G.state='wander';G.pause=0;}break;
    case'chase':speed=frenzy?3.45:2.9;{const t=G.last,dl=Math.hypot(t.x-G.x,t.z-G.z);
      if(Math.abs(t.y-G.y)<1.2&&!segBlocked(G.x,G.y+1,G.z,t.x,t.y+1,t.z)){direct=true;G.path=[];
        if(dl<.35){G.state='search';G.timer=(frenzy?2:3.5);}}
      else{G.repath-=dt;if(G.repath<=0||!G.path.length){G.repath=.8;setPath(t);}}
      G.lostT+=dt;if(G.lostT>(frenzy?12:6)){G.state='search';G.timer=3;showMsg('她……跟丟了你。',2.4);}}break;}
  if(direct){const t=G.last,dx=t.x-G.x,dz=t.z-G.z,d=Math.hypot(dx,dz);if(d>.01){const s=Math.min(d,speed*dt);G.x+=dx/d*s;G.z+=dz/d*s;G.yaw=Math.atan2(dx,dz);}
    G.y+=(groundAt(G.x,G.z,G.y,.4)-G.y)*Math.min(1,dt*8);}
  else if(speed>0&&G.path.length){const n=nodes[G.path[0]],dx=n.x-G.x,dy=n.y-G.y,dz=n.z-G.z,d=Math.hypot(dx,dy,dz);
    if(d<.08){G.path.shift();if(!G.path.length&&G.state==='wander'){G.pause=1+Math.random()*3;if(Math.random()<.3)creak();}}
    else{const s=Math.min(d,speed*dt);G.x+=dx/d*s;G.y+=dy/d*s;G.z+=dz/d*s;if(Math.hypot(dx,dz)>.05){let a=Math.atan2(dx,dz)-G.yaw;a=Math.atan2(Math.sin(a),Math.cos(a));G.yaw+=a*Math.min(1,dt*6);}}}
  // her footsteps: slow, bare, slightly dragging; heavier and faster when chasing
  G.stepAcc=(G.stepAcc||0)+Math.hypot(G.x-ox,G.z-oz);const chase=G.state==='chase'||frenzy;
  if(G.stepAcc>(chase?.95:.72)){G.stepAcc=0;G.foot=!G.foot;ghostStep(G.x,G.z,G.y-P.y,chase,G.foot);}
  // she only grabs you if you're making noise when she reaches you
  if(pd<.75&&pdy<1.3&&!silent&&G.state!=='dormant')caught();}
function ghostVisual(dt){const g=GH.group;if(G.state==='gone'){g.visible=false;return;}
  if(state!=='caught'){g.position.set(G.x,G.y+.05+Math.sin(tAll*1.7)*.04,G.z);g.rotation.y=G.yaw;g.rotation.x=G.state==='chase'?.12:0;}
  const chase=G.state==='chase'||state==='caught',stare=G.state==='stare';
  GH.eye.scale.setScalar(stare?2.2:1);
  const ta=stare?-.5:chase?-1.3:.05+Math.sin(tAll*.9)*.05;GH.armL.rotation.x+=(ta-GH.armL.rotation.x)*Math.min(1,dt*4);GH.armR.rotation.x+=(ta+.1-GH.armR.rotation.x)*Math.min(1,dt*3.5);
  if(Math.random()<dt*.7)GH.ht=(Math.random()-.5)*.9;GH.head.rotation.z+=(GH.ht-GH.head.rotation.z)*Math.min(1,dt*22);
  GH.eyeMat.color.setHex(chase||stare?0xff1a10:0x330000);
  const d=Math.hypot(G.x-P.x,G.z-P.z);g.visible=state==='caught'||!(G.state!=='chase'&&d<12&&d>3&&Math.random()<.04);}

/* ---------- world animation ---------- */
function updateFixtures(dt){blackout-=dt;const lv=Math.round(P.y/FH);
  for(const f of fixtures){f.t-=dt;const gNear=Math.hypot(G.x-f.x,G.z-f.z)<6&&Math.abs(G.y+2-f.y)<3&&G.state!=='dormant';
    if(f.burst>0){f.burst-=dt;if(f.t<=0){f.on=!f.on;f.t=.02+Math.random()*.11;}if(f.burst<=0){f.on=f.type!=='dead';f.t=f.type==='flicker'?1+Math.random()*4:f.type==='steady'?10+Math.random()*25:6+Math.random()*20;}}
    else if(f.t<=0)f.burst=.2+Math.random()*(f.type==='flicker'?1.6:.6);
    if(gNear&&f.burst<=0){f.burst=.4;f.t=0;}
    let b=f.on?(f.type==='dead'?.55:f.base)*(.96+.04*Math.sin(tAll*47+f.x)):0;if(blackout>0&&f.level===lv)b=0;f.b=b;
    f.mat.color.setRGB(.06+.55*b,.07+.6*b,.07+.58*b);}
  const sorted=fixtures.slice().sort((a,b)=>da(a)-da(b));
  function da(f){return(f.x-P.x)**2+(f.z-P.z)**2+(f.level!==lv?900:0);}
  for(let i=0;i<pool.length;i++){const f=sorted[i];pool[i].position.set(f.x,f.y-.15,f.z);pool[i].intensity=f.b*.5;}}
function updateFans(dt){for(const f of fans)if(f.userData.spin)f.userData.rotor.rotation.y+=f.userData.spin*dt;}
function events(dt){eventT-=dt;if(eventT>0)return;eventT=16+Math.random()*22;const r=Math.random();
  if(r<.3)creak();else if(r<.55)knock();else if(r<.75){blackout=1.6;showMsg('……',1.2);}else whisperShort(.12);}

/* ---------- livestream: re-enacting what happened to her ---------- */
const LIVE=GAME_DATA.liveScenes;
const SCENE_LEN=6.5;let liveT=0,liveIdx=-1,liveChatN=0;
function startLive(){state='live';liveT=0;liveIdx=-1;$('live').hidden=false;$('liveChat').innerHTML='';$('fade').style.opacity='0';
  if(document.pointerLockElement)document.exitPointerLock();if(A.ctx&&A.cicBus)A.cicBus.gain.setTargetAtTime(.12,A.ctx.currentTime,.5);}
function addChat(m){const d=document.createElement('div');d.innerHTML='<b></b><span></span>';d.children[0].textContent=m[0];d.children[1].textContent=m[1];
  const c=$('liveChat');c.appendChild(d);while(c.children.length>8)c.removeChild(c.firstChild);}
function updateLive(dt){liveT=Math.max(0,liveT+dt);const i=Math.floor(liveT/SCENE_LEN);if(i>=LIVE.length){endLive();return;}
  if(i!==liveIdx){liveIdx=i;liveChatN=0;$('liveCap').textContent=LIVE[i].cap;if(A.ctx&&A.ctx.state==='running')bell(i===2?233:392,A.ctx.currentTime+.05,.04);if(i===2)setTimeout(()=>{if(A.ctx)thump(A.ctx.currentTime,.5,160);},SCENE_LEN*450);}
  const st=liveT-i*SCENE_LEN,sc=LIVE[i],want=Math.min(sc.chat.length,Math.floor(st/(SCENE_LEN/(sc.chat.length+1))));
  while(liveChatN<want){addChat(sc.chat[liveChatN]);liveChatN++;}
  $('liveViewers').textContent=Math.floor(12*Math.pow(1.31,liveT)).toLocaleString()+' 人觀看';
  drawLiveScene(i,st/SCENE_LEN);}
function endLive(){if(state!=='live')return;$('live').hidden=true;startHomeSeq();}
/* between the stream and the dream: you end the stream and go home (home1.webp, home2.webp; skipped if a picture is missing) */
const HOME=GAME_DATA.homeScenes.map(h=>{const im=new Image();im.src=h.src;return{im,cap:h.cap};});
const HOME_LEN=6;let homeT=0,homeList=[];
function startHomeSeq(){homeList=HOME.filter(h=>h.im.complete&&h.im.naturalWidth);if(!homeList.length){startDreamSeq();return;}
  state='homeSeq';homeT=0;$('dreamSeq').hidden=false;$('seqCap').textContent='';}
function updateHomeSeq(dt){homeT+=dt;const i=Math.floor(homeT/HOME_LEN);if(i>=homeList.length){$('seqCap').textContent='';startDreamSeq();return;}
  const p=(homeT-i*HOME_LEN)/HOME_LEN,h=homeList[i],c=$('dreamCv'),g=c.getContext('2d'),W=c.width,H=c.height,im=h.im;
  g.setTransform(1,0,0,1,0,0);g.fillStyle='#000';g.fillRect(0,0,W,H);
  const sc=Math.max(W/im.naturalWidth,H/im.naturalHeight)*(1.03+.08*p),dw=im.naturalWidth*sc,dh=im.naturalHeight*sc;g.drawImage(im,(W-dw)/2-p*12,(H-dh)/2,dw,dh);
  const f=p<.12?1-p/.12:p>.88?(p-.88)/.12:0;if(f>0){g.fillStyle=`rgba(0,0,0,${f})`;g.fillRect(0,0,W,H);}
  if($('seqCap').textContent!==h.cap)$('seqCap').textContent=h.cap;$('seqCap').style.opacity=String(clamp(Math.min(p/.15,(1-p)/.15),0,1));}
/* the dream, animated: sun reaches her on the window sill, then the line fades in */
let dreamT=0;const DREAM_LEN=14;
function startDreamSeq(){state='dreamSeq';dreamT=0;$('dreamSeq').hidden=false;startWarm();}
/* warm, peaceful music for the dream: soft major-7 pads (Cmaj7 – Am7 – Fmaj7 – G6) and a slow music-box line on top */
var warmOn=false,warmBus=null,warmLoop=false;// var: resetGame() runs before this line on first load
function startWarm(){if(!A.ctx||warmOn)return;if(A.ctx.state!=='running')A.ctx.resume();warmOn=true;const c=A.ctx;let t0=c.currentTime+.3;
  warmBus=c.createGain();warmBus.gain.setValueAtTime(0,t0);warmBus.gain.linearRampToValueAtTime(1,t0+3);
  const lp=c.createBiquadFilter();lp.type='lowpass';lp.frequency.value=5200;warmBus.connect(lp);lp.connect(A.master);lp.connect(A.rev);
  const hz=n=>440*Math.pow(2,(n-69)/12);
  // solo piano: bass note + slow broken chord in the left hand, a simple melody in the right
  const chords=[[48,52,55,59],[45,48,52,55],[41,45,48,52],[43,47,50,52]];
  const melody=[[[0,76],[1.5,79],[3,83]],[[0,76],[1.5,72],[3,74]],[[0,72],[1.5,69],[2.5,77]],[[0,74],[1.5,71],[3,79]]],BAR=4;
  const bar=i=>{const r=Math.floor(i/4),ci=i%4,ch=chords[ci],t=t0+i*BAR;
    piano(hz(ch[0]-12),t,.09,3.9);
    [ch[0],ch[2],ch[3],ch[1]+12,ch[3],ch[2],ch[1]+12,ch[2]].forEach((n,k)=>piano(hz(n),t+k*.5+(Math.random()-.5)*.02,.034+(k%2?0:.008),2.6));
    if(r>0)melody[ci].forEach(([d,n])=>piano(hz(n),t+d,.07,3.2));};
  // schedule a few seconds ahead at a time instead of creating every note up front
  // on the unlocked main menu the piece loops (from the second pass, so the melody is in)
  let next=0;const tick=()=>{if(!warmOn||warmBus!==bus)return;
    if(next>=16&&warmLoop){t0+=12*BAR;next=4;}
    if(t0+next*BAR<c.currentTime)t0=c.currentTime+.3-next*BAR;
    while(next<16&&t0+next*BAR<c.currentTime+6){bar(next);next++;}if(next<16||warmLoop)setTimeout(tick,1000);else warmTick=tick;};const bus=warmBus;warmTick=null;tick();}
var warmTick=null;// set when the piece has run out, so the menu can pick it back up
/* hidden ending unlocked: the main menu keeps her picture and the piano */
const TRUTH_KEY=SPEEDRUN?'ms-truth-speedrun':'ms-truth';let truthUnlocked=false;try{truthUnlocked=localStorage.getItem(TRUTH_KEY)==='1';}catch(err){}
function applyMenuTruth(){$('menu').classList.toggle('truth',truthUnlocked);$('truthNote').hidden=!truthUnlocked;}
function menuMusic(){if(!truthUnlocked||state!=='menu')return;audioInit();if(!A.ctx)return;if(A.ctx.state!=='running')A.ctx.resume();
  warmLoop=true;if(warmOn){if(warmTick){const k=warmTick;warmTick=null;k();}}else startWarm();}
applyMenuTruth();
// browsers only allow sound after the first click or key press, so the menu music starts then (not on the start buttons themselves)
['pointerdown','keydown'].forEach(ev=>document.addEventListener(ev,e=>{if(state==='menu'&&!(e.target.closest&&e.target.closest('#modeRow')))menuMusic();},{capture:true}));
// a simple synthesized piano note: bright hammer attack, fast early decay, long soft tail, slightly stretched overtones
function piano(f,t,vol,dur){const c=A.ctx,g=c.createGain();g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(vol,t+.005);g.gain.exponentialRampToValueAtTime(vol*.3,t+.4);g.gain.exponentialRampToValueAtTime(.0001,t+dur);
  const lp=c.createBiquadFilter();lp.type='lowpass';lp.frequency.setValueAtTime(Math.min(9000,f*9),t);lp.frequency.exponentialRampToValueAtTime(Math.max(400,f*2.2),t+dur*.8);
  [[1,1],[2,.42],[3,.2],[4,.11],[5,.05],[6,.03]].forEach(([h,a])=>{const o=c.createOscillator();o.type='sine';o.frequency.value=f*h*(1+h*h*.00035);const og=c.createGain();og.gain.value=a;o.connect(og);og.connect(lp);o.start(t);o.stop(t+dur+.05);});
  lp.connect(g);g.connect(warmBus);}
function stopWarm(){warmLoop=false;if(!warmOn)return;warmOn=false;if(warmBus&&A.ctx){const t=A.ctx.currentTime;warmBus.gain.cancelScheduledValues(t);warmBus.gain.setTargetAtTime(0,t,.6);}}
function updateDreamSeq(dt){dreamT+=dt;const c=$('dreamCv');drawDreamScene(c.getContext('2d'),c.width,c.height,dreamT);
  if(dreamT>DREAM_LEN-1.2)$('dreamSeq').style.opacity=String(clamp((DREAM_LEN-dreamT)/1.2,0,1));if(dreamT>=DREAM_LEN)endDreamSeq();}
function endDreamSeq(){if(state==='homeSeq'){$('seqCap').textContent='';startDreamSeq();return;}if(state!=='dreamSeq')return;$('dreamSeq').hidden=true;$('dreamSeq').style.opacity='1';finish('truth');}
$('dreamSeq').addEventListener('click',endDreamSeq);
$('liveSkip').addEventListener('click',endLive);
function fig(g,x,y,s,col,girl){g.fillStyle=col;g.beginPath();g.arc(x,y-150*s,14*s,0,7);g.fill();
  if(girl){g.fillStyle='#6b3622';g.beginPath();g.ellipse(x,y-148*s,16*s,18*s,0,0,7);g.fill();g.fillRect(x-16*s,y-148*s,32*s,44*s);
    g.fillStyle='#e8c7ad';g.beginPath();g.ellipse(x,y-147*s,10*s,12*s,0,0,7);g.fill();g.fillStyle='#6b3622';g.fillRect(x-12*s,y-162*s,24*s,8*s);
    g.fillStyle='#6f9fd6';g.fillRect(x-17*s,y-132*s,34*s,44*s);g.fillStyle='#1b1d24';g.beginPath();g.moveTo(x-17*s,y-90*s);g.lineTo(x+17*s,y-90*s);g.lineTo(x+22*s,y-55*s);g.lineTo(x-22*s,y-55*s);g.fill();
    g.fillStyle='#e8c7ad';g.fillRect(x-11*s,y-55*s,7*s,50*s);g.fillRect(x+4*s,y-55*s,7*s,50*s);return;}
  g.fillRect(x-19*s,y-133*s,38*s,76*s);g.fillRect(x-17*s,y-58*s,14*s,58*s);g.fillRect(x+3*s,y-58*s,14*s,58*s);}
// illustrated re-enactment frames (live1.webp … live6.webp); a scene without its picture falls back to the drawn version below
const LIVE_IMG=GAME_DATA.liveScenes.map(s=>{const im=new Image();im.src=s.img;return im;});
// per-scene camera: focus point in the picture and how far to push in; shake for the lock scene
const LIVE_CAM=GAME_DATA.liveScenes.map(s=>s.cam);
function drawLiveScene(i,p){const c=$('liveCv'),g=c.getContext('2d'),W=1280,H=720;g.setTransform(1,0,0,1,0,0);g.fillStyle='#000';g.fillRect(0,0,W,H);
  const im=LIVE_IMG[i],cam=LIVE_CAM[i];
  if(im&&im.complete&&im.naturalWidth){const iw=im.naturalWidth,ih=im.naturalHeight,e=p*p*(3-2*p),sc=Math.max(W/iw,H/ih)*(1.02+cam.z*e),dw=iw*sc,dh=ih*sc;
    let ox=clamp(W/2-cam.fx*dw+(cam.fx-.5)*dw*.3,W-dw,0),oy=clamp(H/2-cam.fy*dh+(cam.fy-.5)*dh*.3,H-dh,0);
    if(cam.shake&&p>.4&&p<.55){ox+=(Math.random()-.5)*8;oy+=(Math.random()-.5)*8;}
    g.drawImage(im,ox,oy,dw,dh);
    if(i===2&&p>.45){g.fillStyle=`rgba(255,240,230,${Math.min(1,(p-.45)*4)})`;g.font=`900 90px ${FONT}`;g.shadowColor='rgba(0,0,0,.8)';g.shadowBlur=20;g.fillText('喀嚓',150,200);g.shadowBlur=0;}
    if(i===3){const k=Math.floor(p*6);g.fillStyle=`rgba(230,225,215,${.3+.5*((p*6)%1<.5?1:0)})`;g.font=`700 44px ${FONT}`;g.shadowColor='rgba(0,0,0,.9)';g.shadowBlur=14;if(k<4)g.fillText('叩　'.repeat(k+1),120,150);g.shadowBlur=0;}
  }else{
  const z=1+p*.06;g.setTransform(z,0,0,z,W/2*(1-z),H/2*(1-z));
  if(i===0){let gr=g.createLinearGradient(0,0,0,H);gr.addColorStop(0,'#1e2824');gr.addColorStop(1,'#0b0e0d');g.fillStyle=gr;g.fillRect(0,0,W,H);
    g.fillStyle='#21382c';g.fillRect(120,150,520,220);g.fillStyle='rgba(230,240,235,.5)';g.font=`700 40px ${FONT}`;g.fillText('晚自習',160,230);
    g.fillStyle='#eef7f2';g.fillRect(420,40,440,10);const gl=g.createRadialGradient(640,45,0,640,45,500);gl.addColorStop(0,'rgba(220,240,230,.35)');gl.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=gl;g.fillRect(0,0,W,H);
    g.fillStyle='#3a2a1e';for(let r=0;r<3;r++)for(let k=0;k<5;k++)g.fillRect(80+k*240+r*20,470+r*90,150+r*15,18);
    fig(g,380,640,1,'#000',true);
    for(let k=0;k<4;k++){const x=780+k*120,y=620+(k%2)*20;fig(g,x,y,1.05,'#050606');g.strokeStyle='rgba(240,240,230,.85)';g.lineWidth=3;g.beginPath();g.arc(x,y-152*1.05,8,.15*Math.PI,.85*Math.PI);g.stroke();}}
  else if(i===1){g.fillStyle='#14110f';g.fillRect(0,0,W,H);const vx=640,vy=330;
    g.fillStyle='#2b2421';g.beginPath();g.moveTo(0,H);g.lineTo(vx-60,vy+70);g.lineTo(vx+60,vy+70);g.lineTo(W,H);g.fill();
    g.fillStyle='#3a2729';g.beginPath();g.moveTo(0,0);g.lineTo(vx-60,vy-90);g.lineTo(vx-60,vy+70);g.lineTo(0,H);g.fill();g.beginPath();g.moveTo(W,0);g.lineTo(vx+60,vy-90);g.lineTo(vx+60,vy+70);g.lineTo(W,H);g.fill();
    g.fillStyle='#5a4636';g.fillRect(vx-48,vy-80,96,150);g.fillStyle='#000';g.fillRect(vx-40+p*10,vy-72,70,142);
    fig(g,vx-8+p*14,vy+70,.4,'#000',true);
    g.fillStyle='rgba(0,0,0,.85)';for(let k=0;k<3;k++){g.beginPath();g.moveTo(250+k*330,H);g.lineTo(vx-30+k*30,vy+80);g.lineTo(vx-10+k*30,vy+80);g.lineTo(380+k*330,H);g.fill();}}
  else if(i===2){g.fillStyle='#4a3324';g.fillRect(0,0,W,H);for(let k=0;k<7;k++){g.fillStyle=k%2?'#563c2a':'#4f3626';g.fillRect(300+k*100,0,96,H);}
    g.fillStyle='#8c8f90';g.fillRect(700,330,240,30);g.fillStyle='#6d7072';g.fillRect(650,310,60,70);const bx=700+Math.min(1,p*2.2)*160;g.fillStyle='#b5b8ba';g.fillRect(bx-70,322,90,46);
    g.fillStyle='#030303';g.beginPath();g.moveTo(bx+20,300);g.lineTo(bx+140,280);g.lineTo(W,330);g.lineTo(W,430);g.lineTo(bx+130,410);g.lineTo(bx+20,390);g.fill();
    g.fillStyle='rgba(120,0,0,.28)';g.fillRect(0,0,W,H);if(p>.45){g.fillStyle=`rgba(255,240,230,${Math.min(1,(p-.45)*4)})`;g.font=`900 90px ${FONT}`;g.fillText('喀嚓',180,220);}}
  else if(i===3){g.fillStyle='#020202';g.fillRect(0,0,W,H);const ly=610;const gl=g.createLinearGradient(0,ly-90,0,ly+10);gl.addColorStop(0,'rgba(255,230,180,0)');gl.addColorStop(1,'rgba(255,230,180,.25)');g.fillStyle=gl;g.fillRect(300,ly-90,680,100);
    g.fillStyle='#ffe9c0';g.fillRect(300,ly,680,4);g.fillStyle='rgba(40,34,30,.9)';g.beginPath();g.ellipse(560,ly-38,90,40,0,0,7);g.fill();g.beginPath();g.arc(470,ly-60,28,0,7);g.fill();
    g.strokeStyle='rgba(40,34,30,.9)';g.lineWidth=8;g.beginPath();g.moveTo(860,ly);g.lineTo(820,200);g.stroke();g.beginPath();g.moveTo(900,ly);g.lineTo(950,230);g.stroke();g.fillRect(760,ly-70,70,70);
    const k=Math.floor(p*6);g.fillStyle=`rgba(230,225,215,${.25+.5*((p*6)%1<.5?1:0)})`;g.font=`700 44px ${FONT}`;if(k<4)g.fillText('叩　'.repeat(k+1),420,200);}
  else if(i===4){g.fillStyle='#d8ccb0';g.fillRect(0,0,W,H);g.save();g.translate(640,360);g.rotate(-.03);g.translate(-640,-360);
    g.strokeStyle='rgba(90,110,150,.35)';g.lineWidth=2;for(let y=120;y<H;y+=48){g.beginPath();g.moveTo(120,y);g.lineTo(1160,y);g.stroke();}
    g.fillStyle='#2a2320';g.font=`500 32px ${FONT}`;const lines=['我在心裡數了好多次一百了。門打不開。','我把耳朵貼在門上，只要聽到腳步聲我就喊。','今天一次都沒有。','拜託告訴我媽媽，我不是自己跑掉的。','我一直都在等你們來找我。'];
    const n=Math.min(lines.length,Math.floor(p*lines.length*1.3)+1);for(let k=0;k<n;k++)g.fillText(lines[k],150+(k%2)*8,160+k*96);
    g.fillStyle='rgba(120,100,80,.25)';g.beginPath();g.arc(900,520,40,0,7);g.arc(300,610,28,0,7);g.fill();g.restore();}
  else{g.fillStyle='#1a1512';g.fillRect(0,0,W,H);g.save();g.translate(380,370);g.rotate(-.05);g.fillStyle='#e6dfcf';g.fillRect(-230,-300,460,600);g.fillStyle='#2a2320';g.font=`700 30px ${FONT}`;g.fillText('訓導處 內部公文',-200,-240);
    g.font=`500 22px ${FONT}`;['主旨：二年三班林姓學生事件','說明：對外一律以','「學生離家、下落不明」處理。','請勿與媒體及家屬多談。','三樓掃具間即日起封閉。'].forEach((l,k)=>g.fillText(l,-200,-170+k*46));
    g.strokeStyle='#b0141c';g.lineWidth=5;g.beginPath();g.arc(120,190,62,0,7);g.stroke();g.fillStyle='#b0141c';g.font=`900 34px ${FONT}`;g.fillText('校長',84,203);g.restore();
    g.save();g.translate(920,360);g.rotate(.06);g.fillStyle='#d8d2c0';g.fillRect(-190,-290,380,580);g.fillStyle='#8a1a1a';g.font=`900 52px ${FONT}`;g.fillText('尋人啟事',-108,-210);
    drawGirl(g,-120,-170,240,250);g.fillStyle='#2a2320';g.font=`500 24px ${FONT}`;g.fillText('林語晴　十六歲',-90,130);g.fillText('失蹤時穿著學校制服',-110,180);g.restore();}
  }
  g.setTransform(1,0,0,1,0,0);const vg=g.createRadialGradient(W/2,H/2,H*.3,W/2,H/2,H*.85);vg.addColorStop(0,'rgba(0,0,0,0)');vg.addColorStop(1,'rgba(0,0,0,.75)');g.fillStyle=vg;g.fillRect(0,0,W,H);
  g.fillStyle='rgba(255,255,255,.55)';g.font=`500 18px ${FONT}`;g.fillText('情境重現',W-110,H-24);
  const f=p<.08?1-p/.08:p>.92?(p-.92)/.08:0;if(f>0){g.fillStyle=`rgba(0,0,0,${f})`;g.fillRect(0,0,W,H);}}

/* ---------- flow ---------- */
function enterPlay(){audioInit();$('menu').hidden=true;$('end').hidden=true;$('setWrap').hidden=true;$('hud').hidden=false;if(isTouch)$('touch').hidden=false;
  state='play';if(SPEEDRUN){dragLook=true;$('dbgPanel').hidden=false;hint('按住滑鼠拖曳轉動視角 · 左下角可以直接播放各段動畫');}else if(!isTouch&&!padActive&&!dragLook)lockPointer();}
function newGame(){resetGame();$('red').style.opacity='0';enterPlay();hintShown=true;
  if(SPEEDRUN){speedrunSetup();return;}
  showMsg('凌晨三點。校門鎖上了。口袋裡好像有張紙條……',4);
  hint(isTouch?'第 1 格是紙條，按右下的手打開':padActive?'第 1 格是紙條，按 Back 打開':'第 1 格是紙條，按 R 或左鍵打開');}
/* ---- speedrun build: start with every note and clue, standing at the exit window, dawn 15 s away ---- */
function speedrunSetup(){notes.forEach(n=>{if(!n.taken)collectNote(n,true);});sideActive=true;sideNotes.forEach(n=>{if(!n.taken)collectSide(n,true);});
  dawnT=DAWN_LEN-15;G.state='wander';G.timer=0;
  Object.assign(P,{x:escWin.x+.6,y:0,z:-5.6,yaw:-.12,pitch:-.05});sel=1;renderBar();
  showMsg('速通測試：紙條 3/3、線索 3/3、日記都在手上。15 秒後天亮。',5);hint('左下角可以直接播放各段動畫');}
function speedrunPlay(k){if(state!=='play'){enterPlay();}hidePaper();
  if(k==='escape'){P.x=escWin.x;P.z=-6.9;P.yaw=0;dawnDone=false;startEscape();}
  else if(k==='dawn'){if(dawnDone){showMsg('已經天亮了，按「直播 + 真相結局」或從窗戶出去',2.5);return;}dawnMode=true;dawnT=DAWN_LEN-3;}
  else if(k==='truth'){P.x=escWin.x;P.z=-6.9;P.yaw=0;dawnDone=true;setSky(2);startTruth();}
  else if(k==='dream'){$('hud').hidden=true;$('touch').hidden=true;startDreamSeq();}
  else if(k==='caught'){if(G.state==='gone')G.state='wander';G.x=P.x-Math.sin(P.yaw)*.5;G.z=P.z-Math.cos(P.yaw)*.5;G.y=P.y;caught();}}
document.querySelectorAll('[data-dbg]').forEach(b=>b.addEventListener('click',e=>{e.stopPropagation();speedrunPlay(b.dataset.dbg);}));
$('askYes').addEventListener('click',()=>answerSide(true));$('askNo').addEventListener('click',()=>answerSide(false));
/* ---- save / load (this browser only) ---- */
function saveGame(){const data={v:1,escR,gameT,frenzy,flashOn,sel,
    P:{x:P.x,y:P.y,z:P.z,yaw:P.yaw,pitch:P.pitch},G:{x:G.x,y:G.y,z:G.z,yaw:G.yaw,dormant:G.state==='dormant',timer:G.timer},
    notes:{riddleTypes,specs:notes.map(n=>n.spec),notesGot,journal:journal.slice(),side:sideNotes.map(n=>n.spec),sideGot,sideJournal:sideJournal.slice()},dawnMode,dawnT,dawnDone,sideActive,
    items:worldItems.filter(it=>it.state!=='held').map(it=>{const p=it.mesh.position;return{t:it.t,x:p.x,y:it.state==='fly'?groundAt(p.x,p.z,p.y,.02):p.y,z:p.z,ry:it.mesh.rotation.y};}),
    inv:inv.map(it=>it?it.t:null)};
  try{localStorage.setItem(SAVE_KEY,JSON.stringify(data));return true;}catch(err){return false;}}
function clearSave(){try{localStorage.removeItem(SAVE_KEY);}catch(err){}}
function loadGame(){const s=readSave();if(!s||s.escR!==escR){clearSave();$('loadBtn').hidden=true;return newGame();}
  resetGame();clearItems();
  for(const d of s.items){const it=spawnItem(d.t,d.x,d.y,d.z);it.mesh.rotation.y=d.ry;}
  s.inv.forEach((t,i)=>{if(!t)return;if(SPECIAL[t]){inv[i]=SPECIAL[t];return;}const it=spawnItem(t,0,-50,0);it.state='held';it.mesh.visible=false;inv[i]=it;});
  sel=s.sel||0;renderBar();placeNotes(s.notes);(s.notes.sideJournal||[]).forEach(j=>sideJournal.push(j));
  Object.assign(P,s.P);Object.assign(G,{x:s.G.x,y:s.G.y,z:s.G.z,yaw:s.G.yaw,state:s.G.dormant?'dormant':'wander',timer:s.G.timer||0,path:[]});
  gameT=s.gameT;frenzy=s.frenzy;flashOn=s.flashOn;dawnMode=!!s.dawnMode;dawnT=s.dawnT||0;sideActive=!!s.sideActive;dawnDone=!!s.dawnDone;
  if(dawnDone){G.state='gone';G.x=G.z=-500;setSky(2);}$('bLight').setAttribute('aria-pressed',String(flashOn));
  $('red').style.opacity='0';enterPlay();hintShown=true;showMsg('讀取了上次的進度。',2.5);}
function updateLoadBtn(){$('loadBtn').hidden=!readSave();}
updateLoadBtn();
/* ---- settings panel (doubles as pause) ---- */
function syncSliders(){$('sensMouse').value=sensMouse;$('sensTouch').value=sensTouch;$('sensMouseV').textContent=sensMouse.toFixed(1);$('sensTouchV').textContent=sensTouch.toFixed(1);}
$('sensMouse').addEventListener('input',e=>{sensMouse=+e.target.value;syncSliders();try{localStorage.setItem('ms-sens-m',sensMouse);}catch(err){}});
$('sensTouch').addEventListener('input',e=>{sensTouch=+e.target.value;syncSliders();try{localStorage.setItem('ms-sens-t',sensTouch);}catch(err){}});
syncSliders();
$('setResume').addEventListener('click',enterPlay);
$('setSave').addEventListener('click',()=>{$('saveNote').textContent=saveGame()?`已儲存（剩 ${Math.max(0,Math.ceil(DUR-gameT))} 秒；可從主選單「繼續上次進度」讀取）`:'這個瀏覽器不允許儲存';});
$('setQuit').addEventListener('click',goMenu);
$('setWrap').addEventListener('click',e=>{if(e.target.id==='setWrap')enterPlay();});
function goFrenzy(){frenzy=true;showMsg('時間到了。她發狂了。',3.5);stab(.14);hit();blackout=2.2;if(G.state==='dormant')G.state='wander';
  hint('她現在走得很快，連很小的聲音都聽得到');}
function pauseGame(){if(state!=='play')return;state='pause';$('setWrap').hidden=false;$('saveNote').textContent='';syncSliders();$('touch').hidden=true;
  if(A.ctx)A.ctx.suspend();if(document.pointerLockElement)document.exitPointerLock();$('setResume').focus();}
function caught(){if(state!=='play')return;state='caught';caughtT=0;G.state='caught';scream();$('red').style.opacity='.55';
  if(document.pointerLockElement)document.exitPointerLock();}
function finish(win){state='end';clearSave();updateLoadBtn();$('hud').hidden=true;$('touch').hidden=true;$('end').hidden=false;$('red').style.opacity='0';hidePaper();
  if(A.ctx&&!(win==='truth'&&warmOn)){A.master.gain.setTargetAtTime(0,A.ctx.currentTime,.4);const c=A.ctx;setTimeout(()=>{if(state==='end'){c.suspend();A.master.gain.cancelScheduledValues(0);A.master.gain.setValueAtTime(A.muted?0:.9,c.currentTime);}},1800);}
  const used=`${Math.floor(gameT/60)} 分 ${String(Math.floor(gameT%60)).padStart(2,'0')} 秒`;
  // the menu shows how your last game ended: any ending other than the true one (escape or getting caught) puts the old dark menu back
  if(win!=='truth'&&truthUnlocked){truthUnlocked=false;try{localStorage.setItem(TRUTH_KEY,'0');}catch(err){}applyMenuTruth();}
  if(win==='escape'){$('endEyebrow').textContent=`用了 ${used} · 一樓 · ${roomNames[escR]} · 後窗${frenzy?' · 她已經發狂':''}`;$('endTitle').innerHTML='你逃出<span class="drip">去</span>了';
    $('endText').textContent='你翻過窗台，跌進教室後面的草叢裡。蟬聲一下子又變得好大聲。你回頭看了一眼，那扇窗戶後面，有一隻眼睛正從頭髮的縫隙裡看著你。';}
  $('dream').hidden=$('dreamLine').hidden=win!=='truth';
  if(win==='truth'){truthUnlocked=true;try{localStorage.setItem(TRUTH_KEY,'1');}catch(err){}applyMenuTruth();$('endEyebrow').textContent='隱藏結局 · 05:00 AM';$('endTitle').innerHTML='真<span class="drip">相</span>';
    $('endText').textContent='天一亮，她發出一聲很長的慘叫，縮回三樓的黑暗裡。你走出校門，打開手機直播，把點名簿、那封信和訓導處的公文一張一張念出來。那天晚上回到家，你很快就睡著了。夢裡是一個陽光很亮的下午，教室裡空空的，一個穿著淺藍色校服的女孩坐在第十三張椅子上，對你笑。';
    drawDream();}
  else if(win==='escape'){}
  else{$('endEyebrow').textContent=`你撐了 ${used} · 找到 ${notesGot} / 3 張紙條`;$('endTitle').innerHTML='她找到<span class="drip">你</span>了';$('endText').textContent='頭髮的縫隙裡，只有一隻眼睛在看你。下次蹲低一點，躲在窗台下，或鑽進桌子底下。';}
  if(document.pointerLockElement)document.exitPointerLock();}
function again(){newGame();}
function goMenu(){const keep=truthUnlocked&&warmOn;state='menu';resetGame(keep);$('red').style.opacity='0';$('end').hidden=true;$('hud').hidden=true;$('touch').hidden=true;$('setWrap').hidden=true;
  $('menu').hidden=false;updateLoadBtn();applyMenuTruth();
  if(truthUnlocked)menuMusic();else if(A.ctx)A.ctx.suspend();if(document.pointerLockElement)document.exitPointerLock();$('startBtn').focus();}
$('startBtn').addEventListener('click',newGame);$('loadBtn').addEventListener('click',loadGame);
$('homeBtn').addEventListener('click',goMenu);
$('menuBtn').addEventListener('click',e=>{e.stopPropagation();pauseGame();});
$('againBtn').addEventListener('click',again);

/* ---------- HUD ---------- */
function showMsg(t,dur){const m=$('msg');m.textContent=t;m.style.opacity='1';msgT=dur||2.5;}
function hint(t){$('hint').textContent=t;}
function placeName(){const lv=clamp(Math.round(P.y/FH),0,2);const fl=(lv+1)+'F';
  if(P.x>36.1)return fl+' · 樓梯間';if(P.z<-.1){const r=clamp(Math.floor(P.x/9),0,3);return fl+' · '+roomNames[lv*4+r];}return fl+' · 走廊';}
let hudT=0;
function updateHUD(dt){if(SPEEDRUN){const v=state==='play';if($('dbgPanel').hidden===v)$('dbgPanel').hidden=!v;}if(msgT>0){msgT-=dt;if(msgT<=0)$('msg').style.opacity='0';}
  hudT-=dt;if(hudT>0)return;hudT=.15;
  const left=Math.max(0,Math.ceil(DUR-gameT));
  if(dawnDone||state==='dawn')$('clock').innerHTML=`05:00<small>AM · 天亮了</small>`;
  else if(dawnMode){const m=30+Math.floor(dawnT/DAWN_LEN*30);$('clock').innerHTML=m>=60?`05:00<small>AM</small>`:`04:${m}<small>AM · 天亮之前</small>`;}
  else if(sideActive){const m=Math.min(59,Math.floor(gameT/12));$('clock').innerHTML=`03:${String(m).padStart(2,'0')}<small>AM · 沒有時間限制</small>`;}
  else $('clock').innerHTML=frenzy?`<span style="color:var(--blood)">她發狂了</span>`:`${String(Math.floor(left/60)).padStart(2,'0')}:${String(left%60).padStart(2,'0')}<small>她發狂之前</small>`;
  $('place').textContent=placeName();$('qMain').textContent=`${notesGot} / 3`;$('qMainRow').classList.toggle('done',notesGot>=3);
  $('qSideRow').hidden=sideGot<1;$('qSide').textContent=`${sideGot} / 3`;$('qSideRow').classList.toggle('done',sideGot>=3);$('qDawnRow').hidden=!(dawnMode||dawnDone||state==='dawn');$('qDawnRow').classList.toggle('done',dawnDone);
  $('qDawnRow').querySelector('span').textContent=dawnDone?'躲到天明 · 從窗戶出去':'躲到天明';
  let s='calm',txt='四周很安靜';
  if(G.state==='dormant')txt='她還沒醒';
  if(frenzy&&G.state!=='chase'){s='near';txt='她在找你，很急';}
  if(danger>.45){s='near';txt='她就在附近……';}
  if(G.state==='investigate'){s='hear';txt='她聽見了聲音';}
  if(G.state==='search'){s='hear';txt='她在附近仔細聽';}
  if(P.hidden&&G.state!=='chase'){s='hidden';txt='你躲在桌子底下';}
  if(G.state==='hesitate'){s='seen';txt='她就在你面前 · 別動';}
  if(G.state==='chase'){s='seen';txt='她聽到你了 · 快躲';}
  // buffer: a more dangerous status shows at once, but it only steps down after holding for 1.5 s, so the light doesn't flicker
  const rank={calm:0,hidden:1,hear:2,near:2,seen:3}[s];
  if(rank<statusHold.rank&&tAll-statusHold.at<1.5){s=statusHold.s;txt=statusHold.txt;}
  else Object.assign(statusHold,{rank,s,txt,at:tAll});
  const st=$('status');if(st.dataset.s!==s)st.dataset.s=s;$('statusText').textContent=txt;
  // footstep meter
  const nl=tAll-(P.noiseAt??-9)<.7?(P.noiseLvl||0):0,lv=nl<=0?0:nl<=2.5?1:nl<=5?2:nl<=10?3:4;
  const nm=$('noise');if(nm.dataset.l!==String(lv))nm.dataset.l=lv;
  $('noiseText').textContent=lv===0?(P.crouch?'腳步聲：無（蹲下）':'腳步聲：安靜'):`腳步聲：約 ${Math.round(nl*10)/10} 公尺內聽得到`;}
const statusHold={rank:0,s:'calm',txt:'',at:0};

/* ---------- grain ---------- */
{const[c,g]=mk(160,160);const d=g.createImageData(160,160);for(let i=0;i<d.data.length;i+=4){const v=Math.random()*255;d.data[i]=d.data[i+1]=d.data[i+2]=v;d.data[i+3]=255;}g.putImageData(d,0,0);$('grain').style.backgroundImage=`url(${c.toDataURL()})`;}
const reduceMotion=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- main loop ---------- */
let last=performance.now();
function frame(now,manual){if(!manual)requestAnimationFrame(frame);const dt=clamp((now-last)/1000,0,.05);last=now;tAll+=dt;
  pollPad();
  if(state==='play'){gameT+=dt;updatePlayer(dt);ghostUpdate(dt);events(dt);
    if(dawnMode){dawnT+=dt;setSky(clamp((dawnT-(DAWN_LEN-40))/40,0,1));if(dawnT>=DAWN_LEN)startDawnEnd();}
    else if(!frenzy&&!sideActive&&gameT>=DUR)goFrenzy();
    if(paperT>0){paperT-=dt;if(paperT<=0)hidePaper();}}
  else{mouseDX=mouseDY=0;jumpQ=false;}
  updateItems(dt);updateDrawers(dt);
  // danger level
  const gd=Math.hypot(G.x-P.x,G.y-P.y,G.z-P.z);let dg=clamp((16-gd)/16,0,1)*(Math.abs(G.y-P.y)<2?1:.35);if(G.state==='dormant')dg*=.3;if(G.state==='chase')dg=Math.max(dg,.85);
  danger+=(dg-danger)*Math.min(1,dt*2);
  updateFixtures(dt);updateFans(dt);ghostVisual(dt);
  // camera
  const bob=Math.sin(P.bob)*.035*(P.grounded?1:0);
  camera.position.set(P.x,P.y+P.eye+(reduceMotion?0:bob),P.z);
  camera.rotation.set(P.pitch,P.yaw+(state==='menu'?Math.sin(tAll*.15)*.25:0),0);
  if(state==='caught'){caughtT+=dt;const fx=-Math.sin(P.yaw),fz=-Math.cos(P.yaw);const dist=Math.max(.42,1.6-caughtT*4);
    GH.group.position.set(P.x+fx*dist,P.y+P.eye-2.05*1.05+.02,P.z+fz*dist);GH.group.rotation.set(0,Math.atan2(-fx,-fz),0);GH.group.visible=true;
    if(!reduceMotion){camera.position.x+=(Math.random()-.5)*.06;camera.position.y+=(Math.random()-.5)*.06;}
    $('red').style.opacity=String(.25+Math.random()*.4);if(caughtT>1.7)finish(false);}
  if(state==='escape')updateEscape(dt);
  if(state==='dawn')updateDawnEnd(dt);
  if(state==='truthOut')updateTruthOut(dt);
  if(state==='live')updateLive(dt);
  if(state==='dreamSeq')updateDreamSeq(dt);
  if(state==='homeSeq')updateHomeSeq(dt);
  updatePrompt();updateGlints();
  flash.intensity=flashOn&&state!=='end'?2.6*(danger>.45&&Math.random()<danger*.12?.15:1):0;
  $('danger').style.opacity=String(clamp(danger*1.1-.2,0,.9));
  if(!reduceMotion)$('grain').style.backgroundPosition=`${Math.random()*160|0}px ${Math.random()*160|0}px`;
  updateAudio(dt);updateHUD(dt);
  // unlocked menu: her picture, alive — slow drift, sun glow and floating dust (the 3D school isn't visible, so skip rendering it)
  if(state==='menu'&&truthUnlocked){const c=$('menuCv'),dpr=Math.min(window.devicePixelRatio||1,1.5),w=Math.round(innerWidth*dpr),h=Math.round(innerHeight*dpr);
    if(c.width!==w||c.height!==h){c.width=w;c.height=h;}drawDreamScene(c.getContext('2d'),w,h,20+tAll*(reduceMotion?0:1),true,true);return;}
  renderer.render(scene,camera);}
requestAnimationFrame(frame);
})();
