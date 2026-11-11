// 金额以人民币元输入，逐项按分取整；公积金个人、单位各按元四舍五入。
import {cityConfig} from './cities.js?v=20261111-3';
export const DEFAULTS = Object.freeze(cityConfig('hangzhou'));
export const BANDS = Object.freeze([
  [36000,.03,0], [144000,.10,2520], [300000,.20,16920],
  [420000,.25,31920], [660000,.30,52920], [960000,.35,85920], [Infinity,.45,181920]
]);
export const cents = v => Math.round((v + Number.EPSILON) * 100) / 100;
export function annualTax(taxable) {
  const a = Math.max(0,taxable), [,rate,quick] = BANDS.find(b => a <= b[0]);
  return {tax:cents(a*rate-quick), rate, quick, taxable:a};
}
export function bonusTax(bonus) {
  if (!Number.isFinite(bonus) || bonus < 0) throw new RangeError('奖金不能为负数');
  const [,rate,q] = BANDS.find(b => bonus <= b[0]);
  return {tax:cents(bonus*rate-q/12), rate, quick:q/12};
}
export function calculate(monthly, config=DEFAULTS) {
  const c={...cityConfig(config.city || 'hangzhou'),...config};
  // 兼容旧版统一社保上限参数；新界面按险种分别输入。
  if(Object.hasOwn(config,'socialCap'))for(const k of ['pensionCap','medicalCap','unemploymentCap'])c[k]=config.socialCap;
  if (!Number.isFinite(monthly) || monthly<20000 || monthly>200000) throw new RangeError('本模型月薪范围为 2 万至 20 万元');
  for(const k of ['pensionCap','medicalCap','unemploymentCap','fundCap']) if(!Number.isFinite(c[k]) || c[k]<1000 || c[k]>100000) throw new RangeError('缴费上限须在 1,000 至 100,000 元之间');
  if(!Number.isFinite(c.fundRate)||c.fundRate<5||c.fundRate>12) throw new RangeError('公积金比例须为 5% 至 12%');
  for(const k of ['pensionRate','medicalRate','unemploymentRate'])if(!Number.isFinite(c[k])||c[k]<0||c[k]>20)throw new RangeError('个人社保比例须为 0% 至 20%');
  if(!Number.isFinite(c.medicalFixed)||c.medicalFixed<0||c.medicalFixed>1000)throw new RangeError('医疗固定额须为 0 至 1,000 元');
  if(!Number.isInteger(c.supplementRate)||c.supplementRate<0||c.supplementRate>5||(c.city!=='shanghai'&&c.supplementRate!==0)||(c.city==='shanghai'&&c.fundRate>7))throw new RangeError('上海基础公积金为 5% 至 7%，补充为 0% 至 5%；其他城市不设补充');
  if(!Number.isFinite(c.deduction)||c.deduction<0||c.deduction>100000) throw new RangeError('月度专项附加扣除须在 0 至 100,000 元之间');
  for(const [key,min] of [['wageMonths',1],['bonusMonths',0]])if(!Number.isFinite(c[key])||c[key]<min||c[key]>36||Math.abs(c[key]*10-Math.round(c[key]*10))>1e-8)throw new RangeError(`${key==='wageMonths'?'工资':'年终奖'}月数须为 ${min} 至 36，最多一位小数`);
  for(const key of ['pension','medical','unemployment','fund'])if(!Number.isFinite(c[key+'Floor'])||c[key+'Floor']<0||c[key+'Floor']>c[key+'Cap'])throw new RangeError('缴费基数上限不能低于当地预设下限');
  const totalMonths=cents(c.wageMonths+c.bonusMonths);
  const wages=cents(monthly*c.wageMonths),bonus=cents(monthly*c.bonusMonths),gross=cents(wages+bonus),average=gross/12;
  const base=key=>Math.max(c[key+'Floor'],Math.min(average,c[key+'Cap']));
  const socialBase=base('pension'), fundBase=base('fund');
  const socialItems=['pension','medical','unemployment'].map(key=>({key,base:base(key),rate:c[key+'Rate'],amount:cents(base(key)*c[key+'Rate']/100)}));
  const socialMonthly=cents(socialItems.reduce((sum,item)=>sum+item.amount,c.medicalFixed));
  const basicFundMonthly=Math.round(fundBase*c.fundRate/100), supplementFundMonthly=Math.round(fundBase*c.supplementRate/100);
  const fundMonthly=basicFundMonthly+supplementFundMonthly;
  const social=cents(socialMonthly*12), personalFund=fundMonthly*12, employerFund=personalFund;
  const wageTax=annualTax(cents(wages-social-personalFund-60000-c.deduction*12));
  const yearBonusTax=bonusTax(bonus);
  const tax=cents(wageTax.tax+yearBonusTax.tax);
  const cash=cents(gross-social-personalFund-tax);
  const total=cents(cash+personalFund+employerFund);
  return {wageMonths:c.wageMonths,bonusMonths:c.bonusMonths,totalMonths,city:c.city,socialItems,medicalFixed:c.medicalFixed,basicFundMonthly,supplementFundMonthly,monthly,gross,wages,bonus,average,socialBase,fundBase,socialMonthly,fundMonthly,social,personalFund,employerFund,wageTax,bonusTax:yearBonusTax,tax,cash,total,
    incomeTaxRate:tax/gross, burdenRate:1-total/gross, personalBurdenRate:(tax+social)/gross};
}
export function series(config=DEFAULTS) {
  return Array.from({length:19},(_,i)=>calculate((i+2)*10000,config)).map((r,i,all)=>({...r,increase:i?cents(r.cash-all[i-1].cash):null,crossBonus:i? r.bonusTax.rate!==all[i-1].bonusTax.rate:false}));
}

// 奖金按整笔年奖÷12查档；税档位置随奖金月数移动，而非固定月薪点。
export function bonusBreakpoints(config=DEFAULTS){
 const months=config.bonusMonths??DEFAULTS.bonusMonths;
 if(months<=0)return [];
 return BANDS.slice(0,-1).map(([limit])=>limit/months).filter(m=>m>=20000&&m<=200000);
}
