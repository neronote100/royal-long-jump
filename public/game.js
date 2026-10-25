import {TAKEOFF,TAKEOFF_START,VIEW_SCALE,flightStep,centimeters} from './physics.js';
const $=id=>document.getElementById(id),canvas=$('game'),ctx=canvas.getContext('2d');
let state='ready',p,time,angle,items,holes,wind,windTarget,windClock,boost,feather,jumpBoost,score=0,last=0,acc=0,notice='',noticeClock=0;
const rand=(a,b)=>a+Math.random()*(b-a),fmt=cm=>(cm/100).toFixed(2)+' m';
function say(text){notice=text;noticeClock=2;$('hint').textContent=text;}
function start(){p={x:0,y:0,vx:10,vy:0};time=30;angle=2;boost=0;feather=0;jumpBoost=0;wind=0;windTarget=0;windClock=2;score=0;acc=0;state='run';holes=[{x:rand(39,44),w:4},{x:rand(85,92),w:4},{x:rand(145,152),w:5},{x:rand(205,212),w:5}];items=[{x:20,y:1.5,type:0,taken:false},{x:112,y:2,type:1,taken:false},{x:183,y:2,type:2,taken:false}];$('overlay').hidden=true;$('submitBox').hidden=true;say('助走開始！ タップ / SPACEで穴を跳び越えよう');}
function finish(reason,valid){if(state==='done')return;state='done';score=valid?centimeters(p.x-TAKEOFF):0;$('resultTitle').textContent=valid?fmt(score):reason;$('resultText').textContent=valid?'風を味方にした、王子の大跳躍！':'次の挑戦で記録を狙おう。';$('start').textContent='もう一度挑戦';$('overlay').hidden=false;$('submitBox').hidden=!valid||score===0;say(valid?'記録をランキングに登録できます。':reason);}
function action(){if(state==='ready'||state==='done'){start();return;}if(state==='run'&&p.y>=-0.01){if(p.x>=TAKEOFF_START&&p.x<=TAKEOFF){p.vy=-(12+jumpBoost+Math.max(0,1-(TAKEOFF-p.x)/(TAKEOFF-TAKEOFF_START))*4);p.y=-0.1;state='fly';say('飛行中！ ↑で上昇、↓で水平。風の予兆を見よう');}else if(p.x<TAKEOFF_START){p.vy=-7.8;p.y=-0.01;}}}
function pose(n){if(state==='fly')angle=Math.max(0,Math.min(4,angle+n));}
$('start').onclick=start;$('action').onclick=action;$('up').onclick=()=>pose(1);$('down').onclick=()=>pose(-1);
canvas.addEventListener('pointerdown',e=>{e.preventDefault();if(state==='fly'){const r=canvas.getBoundingClientRect();pose(e.clientY-r.top<r.height/2?1:-1);}else action();});
window.addEventListener('keydown',e=>{if(e.target.matches('input,textarea'))return;if(['Space','ArrowUp','ArrowDown'].includes(e.code)){e.preventDefault();if(e.repeat)return;if(e.code==='Space'){if(state!=='fly')action();}else pose(e.code==='ArrowUp'?1:-1);}});
function step(dt){if(!['run','fly'].includes(state))return;time=Math.max(0,time-dt);noticeClock-=dt;if(time<=0){finish('時間切れ',false);return;}if(state==='run'){p.vx=Math.min(20+boost,p.vx+1.7*dt);p.x+=p.vx*dt;p.vy+=18*dt;p.y+=p.vy*dt;if(p.y>=0){p.y=0;p.vy=0;if(holes.some(h=>p.x>=h.x&&p.x<=h.x+h.w)){finish('穴に落ちてしまった！',false);return;}}for(const item of items){if(!item.taken&&Math.abs(item.x-p.x)<1.5&&Math.abs(-p.y-item.y)<2.2){item.taken=true;if(item.type===0){boost=5;say('黄金の靴：助走速度アップ！');}if(item.type===1){jumpBoost=4;say('バネの勲章：ジャンプ力アップ！');}if(item.type===2){feather=1;say('魔法の羽根：風の力アップ！');}}}if(p.x>TAKEOFF){finish('踏切板を越えた！ ファウル',false);return;}if(p.x>TAKEOFF_START-30&&noticeClock<=0)say(p.x>=TAKEOFF_START?'今だ！ 板の端ぎりぎりで大ジャンプ！':'踏み切りまで '+Math.ceil(TAKEOFF_START-p.x)+'m！ 金色の板でタップ');}else{windClock-=dt;if(windClock<=0){windTarget=rand(-9,9);windClock=rand(2,4);say('風の予兆：'+(windTarget<-2?'向かい風が来る':windTarget>2?'追い風が来る':'穏やかな風へ'));}wind+=(windTarget-wind)*Math.min(1,dt*1.4);flightStep(p,wind,angle,feather,dt);if(p.y>=0){p.y=0;finish('',true);}}}
// Follow the runner continuously; only about 56m of the 260m runway is visible.
function drawPrince(x,y){
 const grounded=state==='run'&&p.y>=-0.01;
 const cycle=p.x*0.95, stride=grounded?Math.sin(cycle):0;
 const bounce=grounded?Math.abs(Math.cos(cycle))*2.5:0;
 const flutter=Math.sin(performance.now()/75+p.x)*4;
 ctx.save();ctx.translate(x,y-bounce);ctx.scale(1.25,1.25);
 ctx.rotate(state==='fly'?(2-angle)*.17:grounded?.12:-.08);
 // Cape flutters with speed and opens wider when catching wind.
 ctx.fillStyle='#a5375d';ctx.beginPath();ctx.moveTo(-7,-20);
 ctx.bezierCurveTo(-26,-25-flutter,-40-(state==='fly'?angle*5:0),-5+flutter,-44,8+(state==='fly'?angle*4:0));
 ctx.lineTo(-7,10);ctx.closePath();ctx.fill();
 ctx.strokeStyle='#edbe76';ctx.lineWidth=1.5;ctx.stroke();
 const limb=(points,color,width)=>{ctx.strokeStyle=color;ctx.lineWidth=width;ctx.lineCap='round';ctx.lineJoin='round';ctx.beginPath();points.forEach(([a,b],i)=>i?ctx.lineTo(a,b):ctx.moveTo(a,b));ctx.stroke();};
 // Arms swing opposite to the legs. Bent knees alternate on each stride.
 const leg=(phase,back)=>{
  const swing=Math.sin(phase),lift=Math.max(0,-Math.cos(phase));
  const knee=[swing*13,12-lift*8],foot=[-swing*19,24-lift*16];
  limb([[0,3],knee,foot],back?'#63748d':'#d8e7f2',6);
  limb([foot,[foot[0]+7,foot[1]+1]],back?'#987039':'#eac16c',5);
 };
 if(grounded)leg(cycle+Math.PI,true);
 else limb([[-3,4],[-15,12],[-23,6]],'#63748d',6);
 limb([[-3,-17],[stride*12-3,-7],[-stride*13,0]],'#aebfda',5);
 ctx.fillStyle='#e6edf7';ctx.fillRect(-9,-21,19,27);
 ctx.fillStyle='#eac16c';ctx.fillRect(-10,-2,22,4);
 if(grounded)leg(cycle,false);
 else limb([[4,4],[14,14],[27,state==='fly'?15:23]],'#e6edf7',6);
 limb([[4,-17],[-stride*13+4,-8],[stride*13+12,-15]],'#e6edf7',5);
 ctx.fillStyle='#ffe0bd';ctx.beginPath();ctx.arc(1,-31,10,0,Math.PI*2);ctx.fill();
 ctx.fillStyle='#312b35';ctx.beginPath();ctx.arc(-2,-36,8,Math.PI,Math.PI*2);ctx.fill();
 ctx.fillStyle='#1c2434';ctx.fillRect(6,-33,2,2);
 ctx.fillStyle='#f4c65b';ctx.beginPath();ctx.moveTo(-10,-38);ctx.lineTo(-12,-49);ctx.lineTo(-4,-44);ctx.lineTo(0,-53);ctx.lineTo(5,-44);ctx.lineTo(12,-49);ctx.lineTo(11,-38);ctx.closePath();ctx.fill();
 ctx.restore();
}
function draw(){
 const active=!!p;
 const camera=active?p.x-14:-14;
 const sx=x=>(x-camera)*VIEW_SCALE;
 const sky=ctx.createLinearGradient(0,0,0,520);sky.addColorStop(0,'#182841');sky.addColorStop(1,'#6b8e9c');ctx.fillStyle=sky;ctx.fillRect(0,0,1000,520);
 ctx.fillStyle='#efdba3';ctx.beginPath();ctx.arc(840,85,32,0,Math.PI*2);ctx.fill();
 // Different scrolling speeds give the palace and garden depth.
 ctx.fillStyle='#304861';
 for(let i=-1;i<7;i++){const x=i*230-((camera*2)%230+230)%230;ctx.fillRect(x,250,160,150);ctx.fillRect(x+20,200,35,200);ctx.fillRect(x+100,225,35,175);ctx.fillStyle='#e9bf6c44';ctx.fillRect(x+30,218,8,16);ctx.fillStyle='#304861';}
 ctx.fillStyle='#365c5d';
 for(let i=-1;i<10;i++){const x=i*140-((camera*6)%140+140)%140;ctx.fillRect(x+35,330,7,70);ctx.beginPath();ctx.arc(x+38,323,28,0,Math.PI*2);ctx.fill();}
 ctx.fillStyle='#4b6a5c';ctx.fillRect(0,400,1000,120);
 ctx.fillStyle='#7e7373';ctx.fillRect(0,400,1000,73);
 if(sx(TAKEOFF)<1000){ctx.fillStyle='#e2c48b';ctx.fillRect(Math.max(0,sx(TAKEOFF)),400,1000-Math.max(0,sx(TAKEOFF)),120);}
 ctx.strokeStyle='#d3c7a399';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(0,464);ctx.lineTo(1000,464);ctx.stroke();
 for(let i=Math.floor(camera/10)*10;i<camera+1000/VIEW_SCALE;i+=10){const x=sx(i);ctx.fillStyle='#d7c4a3';ctx.fillRect(x,410,2,15);ctx.font='12px sans-serif';ctx.fillText(i>=TAKEOFF?'+'+(i-TAKEOFF)+'m':i+'m',x+5,447);}
 // Golden approach lane and precise white takeoff edge.
 const boardX=sx(TAKEOFF_START);ctx.fillStyle='#e8ba55';ctx.fillRect(boardX,399,(TAKEOFF-TAKEOFF_START)*VIEW_SCALE,12);
 ctx.fillStyle='#fff2ca';ctx.fillRect(sx(TAKEOFF)-4,397,4,28);
 if(boardX>-250&&boardX<1000){ctx.font='bold 20px sans-serif';ctx.fillStyle='#ffdc8b';ctx.fillText('ここで大ジャンプ！',boardX,365);}
 for(const h of holes||[]){const x=sx(h.x);ctx.fillStyle='#101929';ctx.fillRect(x,400,h.w*VIEW_SCALE,120);ctx.fillStyle='#e0a67e';ctx.fillRect(x-3,400,3,10);ctx.fillRect(x+h.w*VIEW_SCALE,400,3,10);}
 for(const item of items||[]){if(item.taken)continue;const x=sx(item.x),y=400-item.y*7-18+Math.sin(performance.now()/220+item.x)*3;ctx.fillStyle=['#ffda6c','#fb8bac','#8ce7dc'][item.type];ctx.beginPath();ctx.arc(x,y,14,0,Math.PI*2);ctx.fill();ctx.fillStyle='#182841';ctx.font='bold 14px sans-serif';ctx.fillText(['靴','跳','羽'][item.type],x-7,y+5);}
 if(active){
  const x=sx(p.x),y=Math.max(110,370+p.y*7);
  ctx.fillStyle='#0e172544';ctx.beginPath();ctx.ellipse(x,402,23,5,0,0,Math.PI*2);ctx.fill();
  if(state==='run'&&p.y>=-0.01){ctx.fillStyle='#e4d4ac88';for(let i=0;i<5;i++){const t=(p.x*.5+i*.2)%1;ctx.beginPath();ctx.arc(x-12-t*70,399-t*10,2+t*3,0,Math.PI*2);ctx.fill();}}
  drawPrince(x,y);
  if(p.y*7+370<110){ctx.fillStyle='#fff';ctx.font='14px sans-serif';ctx.fillText('高度 '+(-p.y).toFixed(1)+' m',x-35,84);}
  if(state==='run'){
   const remaining=Math.max(0,TAKEOFF-p.x);
   ctx.fillStyle='#10192aaa';ctx.fillRect(24,62,340,54);
   ctx.fillStyle='#ffdc8b';ctx.font='bold 17px sans-serif';ctx.fillText('踏み切りまで '+remaining.toFixed(0)+' m',38,86);
   ctx.fillStyle='#465b70';ctx.fillRect(38,98,310,5);ctx.fillStyle='#e9bf6c';ctx.fillRect(38,98,310*Math.min(1,p.x/TAKEOFF),5);
   if(p.x>=TAKEOFF_START){ctx.fillStyle='#ffdf85';ctx.font='bold 25px sans-serif';ctx.fillText('今だ！ タップ / SPACE',390,110);}
  }
  if(state==='fly'){
   ctx.fillStyle='#fff';ctx.font='bold 18px sans-serif';ctx.fillText((wind<-1?'← 向かい風':wind>1?'追い風 →':'穏やかな風')+' '+Math.abs(wind).toFixed(1),700,100);ctx.font='14px sans-serif';ctx.fillText('姿勢 '+['水平','低め','中間','高め','マント全開'][angle],700,128);
   for(let i=0;i<12;i++){const x=((i*95+performance.now()*.03*wind)%1000+1000)%1000;ctx.fillStyle='#ffffff44';ctx.fillRect(x,170+i%4*38,20,2);}
  }
 }
 $('phase').textContent=state==='run'?'助走 / '+(p?.vx||0).toFixed(1)+' m/s':state==='fly'?'飛行中':state==='done'?'RESULT':'READY';
 $('timer').textContent=(time??30).toFixed(1)+'秒';$('distance').textContent=fmt(state==='done'?score:centimeters(Math.max(0,(p?.x||0)-TAKEOFF)));
}
function frame(now){const dt=Math.min(.1,(now-last)/1000||0);last=now;acc+=dt;while(acc>=1/120){step(1/120);acc-=1/120;}draw();requestAnimationFrame(frame);}requestAnimationFrame(frame);
const date=s=>new Date(s).toLocaleString('ja-JP',{timeZone:'Asia/Tokyo'});
async function api(url,options){const r=await fetch(url,options);const data=await r.json();if(!r.ok)throw new Error(data.error||'通信に失敗しました');return data;}
async function history(name){$('history').textContent='履歴を取得中…';try{const d=await api('/api/ranking?name='+encodeURIComponent(name));$('history').replaceChildren();const title=document.createElement('h3');title.textContent=name+' の更新履歴';$('history').append(title);for(const row of d.history){const line=document.createElement('div');line.textContent=(row.previous_cm==null?'初回':fmt(row.previous_cm))+' → '+fmt(row.distance_cm)+' ／ '+date(row.updated_at);$('history').append(line);}}catch(e){$('history').textContent=e.message;}}
async function ranking(){try{$('boardStatus').textContent='取得中…';const d=await api('/api/ranking');$('ranking').replaceChildren();d.ranking.forEach((row,i)=>{const tr=document.createElement('tr');const nameButton=document.createElement('button');nameButton.textContent=row.name;nameButton.onclick=()=>history(row.name);for(const value of [i+1,nameButton,fmt(row.distance_cm),date(row.updated_at)]){const td=document.createElement('td');if(value instanceof Node)td.append(value);else td.textContent=value;tr.append(td);}$('ranking').append(tr);});$('boardStatus').textContent=d.ranking.length?'名前をタップすると更新履歴が見られます。':'最初の記録を残そう！';}catch(e){$('boardStatus').textContent=e.message+' 公開前でもゲームは遊べます。';}}
$('refresh').onclick=ranking;
try{$('name').value=localStorage.getItem('royal-name')||'';}catch{}
$('recordForm').onsubmit=async e=>{e.preventDefault();const submitted=score;if(!submitted)return;$('submit').disabled=true;try{const name=$('name').value;const d=await api('/api/ranking',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name,distance_cm:submitted})});try{localStorage.setItem('royal-name',d.record.name);}catch{}$('submitStatus').textContent=d.improved?'記録を登録しました！ '+fmt(d.record.distance_cm):'自己ベストは '+fmt(d.record.distance_cm)+' です。';await ranking();}catch(e){$('submitStatus').textContent=e.message;}finally{$('submit').disabled=false;}};ranking();
