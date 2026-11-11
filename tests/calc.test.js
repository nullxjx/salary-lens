import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {DEFAULTS,annualTax,bonusTax,calculate,series} from '../calc.js';
const baseline=JSON.parse(readFileSync(new URL('./baseline.json',import.meta.url),'utf8'));
for(const b of baseline.rows) test(`默认月薪 ${b.month} 与独立 Decimal 基线一致`,()=>{
 const r=calculate(b.month);
 assert.equal(r.cash,b.cash);assert.equal(r.total,b.cash_fund);assert.equal(r.wageTax.tax,b.tax_wage);assert.equal(r.bonusTax.tax,b.tax_bonus);
 assert.equal(r.social,b.social);assert.equal(r.personalFund,b.fund_personal);
 assert.ok(Math.abs(r.burdenRate-(r.tax+r.social-r.employerFund)/r.gross)<1e-12);
});
test('工资累进税逐段相加与速算公式一致',()=>{
 for(const amount of [0,36000,144000,300000,420000,660000,960000,1047034.08,2247034.08]){
 const bands=[[36000,.03],[144000,.1],[300000,.2],[420000,.25],[660000,.3],[960000,.35],[Infinity,.45]];
 let total=0,previous=0;for(const [upper,rate]of bands){total+=Math.max(0,Math.min(upper,amount)-previous)*rate;previous=upper;if(amount<=upper)break;}
 assert.equal(annualTax(amount).tax,Math.round((total+Number.EPSILON)*100)/100);
 }
});
test('年终奖 30 / 42 / 66 万分界及速算扣除数只减一次',()=>{
 for(const [a,before,after]of [[144000,.1,.2],[300000,.2,.25],[420000,.25,.3],[660000,.3,.35]]){
 assert.equal(bonusTax(a).rate,before);assert.equal(bonusTax(a+.01).rate,after);assert.ok(bonusTax(a+.01).tax>bonusTax(a).tax);
 }
 assert.equal(bonusTax(400000).tax,97340);
});
test('工资个税零下限',()=>{assert.equal(annualTax(-100).tax,0);assert.equal(calculate(40000,{deduction:100000}).wageTax.tax,0);});
test('公积金按元取整且双方独立计入',()=>{const r=calculate(40000);assert.equal(r.fundMonthly,5058);assert.equal(Math.round((r.total-r.cash)*100),12139200);});
test('默认 4 万及以上档位封顶，增量与双边公积金口径一致',()=>{const data=series().filter(r=>r.monthly>=40000);for(let i=1;i<data.length;i++){assert.equal(data[i].fundMonthly,5058);assert.ok(Math.abs(data[i].increase-(data[i].total-data[i-1].total))<1e-7);}assert.equal(data[13].increase,62750);});
test('调整比例、附加扣除、基数后响应',()=>{
 const base=calculate(100000);assert.ok(calculate(100000,{fundRate:5}).cash>base.cash);
 assert.ok(calculate(100000,{deduction:1500}).tax<base.tax);
 assert.equal(calculate(40000,{fundCap:100000}).fundMonthly,6400);
 assert.equal(calculate(50000,{fundCap:100000}).fundMonthly,8000);
});
test('无效输入拒绝而非 NaN 静默流入',()=>{
 for(const value of [0,9999,200001,NaN,Infinity])assert.throws(()=>calculate(value));
 for(const c of [{fundRate:13},{deduction:-1},{socialCap:NaN},{fundCap:0}])assert.throws(()=>calculate(40000,c));
});
