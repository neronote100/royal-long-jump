import test from 'node:test';
import assert from 'node:assert/strict';
import {flightStep,centimeters} from '../public/physics.js';
import {validateRecord} from '../functions/api/ranking.js';
test('距離をセンチメートル整数へ丸める',()=>{assert.equal(centimeters(123.456),12346);assert.equal(centimeters(-1),0);});
test('向かい風でマントを開くと上昇を助ける',()=>{const a={x:0,y:0,vx:20,vy:-10},b={...a};flightStep(a,-8,4,1,1);flightStep(b,-8,0,1,1);assert.ok(a.y<b.y);assert.ok(a.vx<b.vx);});
test('追い風で水平姿勢のほうが加速する',()=>{const a={x:0,y:0,vx:20,vy:-10},b={...a};flightStep(a,8,0,1,1);flightStep(b,8,4,1,1);assert.ok(a.vx>b.vx);});
test('名前の正規化と記録の検証',()=>{assert.deepEqual(validateRecord({name:' 王子 ',distance_cm:12345}),{name:'王子',distance_cm:12345});for(const distance_cm of [0,1.1,NaN,100001])assert.throws(()=>validateRecord({name:'王子',distance_cm}));assert.throws(()=>validateRecord({name:'',distance_cm:1}));assert.throws(()=>validateRecord({name:'a\nb',distance_cm:1}));});
