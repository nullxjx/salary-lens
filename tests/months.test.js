import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {calculate,series,bonusBreakpoints} from '../calc.js';
import {cityConfig} from '../cities.js';
const baseline=JSON.parse(readFileSync(new URL('./months-baseline.json',import.meta.url)));
for(const b of baseline)test(`${b.city} ${b.wageMonths}+${b.bonusMonths} 薪，月薪 ${b.monthly} Decimal 基线`,()=>{
 const r=calculate(b.monthly,{...cityConfig(b.city),wageMonths:b.wageMonths,bonusMonths:b.bonusMonths});
 for(const k of ['gross','social','personalFund','cash','total'])assert.equal(r[k],b[k],k);
 assert.equal(r.wageTax.tax,b.wageTax);assert.equal(r.bonusTax.tax,b.bonusTax);
 assert.ok(Math.abs(r.burdenRate-(r.tax+r.social-r.employerFund)/r.gross)<1e-12);
});
test('工资和奖金拆分正确，社保仍缴12个月',()=>{
 const a=calculate(100000,{wageMonths:13,bonusMonths:3}),b=calculate(100000);
 assert.equal(a.gross,b.gross);assert.equal(a.social,b.social);assert.equal(a.personalFund,b.personalFund);
 assert.equal(a.wages,1300000);assert.equal(a.bonus,300000);assert.notEqual(a.tax,b.tax);
 assert.equal(a.bonusTax.tax,58590);
});
test('杭州2万：12+4社保封顶，12+0未封顶',()=>{
 const a=calculate(20000),b=calculate(20000,{bonusMonths:0});
 assert.equal(a.socialBase,25611);assert.equal(a.social,32269.92);
 assert.equal(b.socialBase,20000);assert.equal(b.social,25200);assert.equal(b.bonusTax.tax,0);
 assert.ok(series({bonusMonths:0}).every(r=>!r.crossBonus));
});
test('奖金税档随奖金月数移动，包括96万档，零奖金无分界',()=>{
 assert.deepEqual(bonusBreakpoints({bonusMonths:0}),[]);
 assert.deepEqual(bonusBreakpoints({bonusMonths:4}),[36000,75000,105000,165000]);
 assert.deepEqual(bonusBreakpoints({bonusMonths:6}),[24000,50000,70000,110000,160000]);
 for(const t of bonusBreakpoints({bonusMonths:6}))assert.ok(calculate(t+.01,{bonusMonths:6}).bonusTax.tax>calculate(t,{bonusMonths:6}).bonusTax.tax);
});
test('低薪数使用下限，不接受非法薪数或倒置上下限',()=>{
 const r=calculate(20000,{...cityConfig('beijing'),wageMonths:1,bonusMonths:0});
 assert.equal(r.socialItems[0].base,7270);assert.equal(r.fundBase,2540);
 for(const config of [{wageMonths:0},{wageMonths:37},{bonusMonths:-1},{bonusMonths:37},{bonusMonths:NaN},{wageMonths:Infinity},{bonusMonths:2.55},{pensionCap:1000}])assert.throws(()=>calculate(20000,config));
});
