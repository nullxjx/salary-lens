import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {cityConfig,CITIES} from '../cities.js';
import {calculate,series} from '../calc.js';
const baseline=JSON.parse(readFileSync(new URL('./cities-baseline.json',import.meta.url)));
for(const b of baseline)test(`${b.city} 月薪 ${b.monthly} 独立 Decimal 基线`,()=>{
 const r=calculate(b.monthly,cityConfig(b.city));
 for(const key of ['social','personalFund','cash','total'])assert.equal(r[key],b[key],key);
 assert.equal(r.wageTax.tax,b.wageTax);assert.equal(r.bonusTax.tax,b.bonusTax);
 assert.ok(Math.abs(r.burdenRate-(r.tax+r.social-r.employerFund)/r.gross)<1e-12);
});
test('上海基础、补充独立取整，补充可为零',()=>{
 const r=calculate(100000,cityConfig('shanghai'));assert.equal(r.basicFundMonthly,2641);assert.equal(r.supplementFundMonthly,1887);assert.equal(r.fundMonthly,4528);
 assert.equal(calculate(100000,{...cityConfig('shanghai'),supplementRate:0}).fundMonthly,2641);
 assert.throws(()=>calculate(100000,{...cityConfig('shanghai'),fundRate:12}));
});
test('北京固定 3 元，广深三险分别封顶',()=>{
 assert.equal(calculate(100000,cityConfig('beijing')).medicalFixed,3);
 for(const city of ['guangzhou','shenzhen']){const c=cityConfig(city),r=calculate(40000,c);assert.deepEqual(r.socialItems.map(i=>i.base),[c.pensionCap,c.medicalCap,c.unemploymentCap]);}
});
test('深圳二档正确减少医保，不修改养老和失业',()=>{
 const c=cityConfig('shenzhen'),a=calculate(100000,c),b=calculate(100000,{...c,medicalRate:.5});
 assert.equal(b.socialItems[1].amount,168.17);assert.equal(a.socialItems[0].amount,b.socialItems[0].amount);assert.ok(b.cash>a.cash);
});
test('城市配置独立，85 档均有限值，非法城市/费率拒绝',()=>{
 const c=cityConfig('beijing');c.fundCap=1000;assert.equal(cityConfig('beijing').fundCap,36348);
 for(const id of Object.keys(CITIES)){const rows=series(cityConfig(id));assert.equal(rows.length,17);assert.ok(rows.every(r=>Number.isFinite(r.cash)));}
 assert.throws(()=>cityConfig('unknown'));assert.throws(()=>calculate(100000,{medicalRate:NaN}));
});
