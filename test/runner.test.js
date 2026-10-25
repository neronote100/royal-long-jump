import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import * as physics from '../public/physics.js';

function game(){
 const events={},nodes=new Map(),lines=[];
 const ctx=new Proxy({}, {get:(obj,key)=>{
  if(key==='createLinearGradient')return ()=>({addColorStop(){}});
  if(key==='lineTo')return (...args)=>lines.push(args);
  return (...args)=>{for(const arg of args)if(typeof arg==='number')assert.ok(Number.isFinite(arg),key+' must be finite');};
 },set:()=>true});
 const node=id=>{if(!nodes.has(id))nodes.set(id,{value:'',textContent:'',hidden:false,disabled:false,getContext:()=>ctx,addEventListener(){},getBoundingClientRect:()=>({top:0,height:520}),replaceChildren(){},append(){}});return nodes.get(id);};
 const math=Object.create(Math);math.random=()=>.5;
 const sandbox={...physics,Math:math,document:{getElementById:node,createElement:()=>node('new')},window:{addEventListener:(key,fn)=>events[key]=fn},performance:{now:()=>1000},requestAnimationFrame(){},fetch:async()=>({ok:true,json:async()=>({ranking:[]})}),localStorage:{getItem:()=>'',setItem(){}},Node:class{}};
 vm.createContext(sandbox);
 const source=readFileSync(new URL('../public/game.js',import.meta.url),'utf8').replace(/^import .*;\n/,'');
 vm.runInContext(source+'\n globalThis.gameTest={start,step,action,draw,pose,get:()=>({state,p:{...p},holes,items,time,score})};',sandbox);
 return {...sandbox.gameTest,events,lines};
}

test('260m助走は画面の4倍以上、穴を越えてアイテムを集め最後に踏み切れる',()=>{
 assert.ok(physics.TAKEOFF>1000/physics.VIEW_SCALE*4);
 const g=game();g.start();let frames=0;
 while(g.get().state==='run'&&frames++<3600){
  const {p,holes}=g.get();
  const next=holes.find(h=>h.x>p.x);
  if(p.y===0&&next&&next.x-p.x<Math.max(4,p.vx*.3))g.action();
  if(p.x>physics.TAKEOFF-1&&p.y===0)g.action();
  g.step(1/120);if(frames%30===0)g.draw();
 }
 let current=g.get();assert.equal(current.state,'fly');
 assert.ok(30-current.time>12&&30-current.time<18,'long run takes 12–18 seconds');
 assert.ok(current.items.every(item=>item.taken),'all three items can be collected');
 assert.ok(current.p.x>=physics.TAKEOFF_START&&current.p.x<=physics.TAKEOFF+1);
 while(g.get().state==='fly'&&frames++<7200){g.step(1/120);if(frames%30===0)g.draw();}
 current=g.get();assert.equal(current.state,'done');assert.ok(current.score>0,'lands within 30 seconds');g.draw();
});

test('踏切を過ぎればファウル、穴へ走り込めば失敗',()=>{
 const g=game();g.start();for(let i=0;i<1200&&g.get().state==='run';i++)g.step(1/120);
 assert.equal(g.get().state,'done');assert.equal(g.get().score,0);
 const h=game();h.start();let frames=0;
 while(h.get().state==='run'&&frames++<3600){const {p,holes}=h.get(),next=holes.find(x=>x.x>p.x);if(p.y===0&&next&&next.x-p.x<Math.max(4,p.vx*.3))h.action();h.step(1/120);}
 assert.equal(h.get().state,'done');assert.ok(h.get().p.x>physics.TAKEOFF);assert.equal(h.get().score,0);
});

test('走ると足の描画が変わり、開始ボタンにフォーカスがあってもスペースで操作できる',()=>{
 const g=game();g.start();g.draw();const initial=JSON.stringify(g.lines);g.lines.length=0;
 for(let i=0;i<15;i++)g.step(1/120);g.draw();assert.notEqual(JSON.stringify(g.lines),initial);
 let prevented=false;
 g.events.keydown({target:{matches:()=>false},code:'Space',repeat:false,preventDefault(){prevented=true;}});
 assert.ok(prevented);assert.ok(g.get().p.vy<0);
});
