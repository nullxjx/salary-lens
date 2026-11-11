// 金额以人民币元输入，逐项按分取整；公积金个人、单位各按元四舍五入。
export const DEFAULTS = Object.freeze({socialCap:25611, fundCap:42151, fundRate:12, deduction:0});
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
  const c={...DEFAULTS,...config};
  if (!Number.isFinite(monthly) || monthly<40000 || monthly>200000) throw new RangeError('本模型月薪范围为 4 万至 20 万元');
  for(const k of ['socialCap','fundCap']) if(!Number.isFinite(c[k]) || c[k]<1000 || c[k]>100000) throw new RangeError('缴费上限须在 1,000 至 100,000 元之间');
  if(!Number.isFinite(c.fundRate)||c.fundRate<5||c.fundRate>12) throw new RangeError('公积金比例须为 5% 至 12%');
  if(!Number.isFinite(c.deduction)||c.deduction<0||c.deduction>100000) throw new RangeError('月度专项附加扣除须在 0 至 100,000 元之间');
  const gross=monthly*16, average=gross/12;
  const socialBase=Math.min(average,c.socialCap), fundBase=Math.min(average,c.fundCap);
  const socialMonthly=cents([.08,.02,.005].reduce((sum,rate)=>sum+cents(socialBase*rate),0));
  const fundMonthly=Math.round(fundBase*c.fundRate/100);
  const social=cents(socialMonthly*12), personalFund=fundMonthly*12, employerFund=personalFund;
  const wages=monthly*12, bonus=monthly*4;
  const wageTax=annualTax(cents(wages-social-personalFund-60000-c.deduction*12));
  const yearBonusTax=bonusTax(bonus);
  const tax=cents(wageTax.tax+yearBonusTax.tax);
  const cash=cents(gross-social-personalFund-tax);
  const total=cents(cash+personalFund+employerFund);
  return {monthly,gross,wages,bonus,average,socialBase,fundBase,socialMonthly,fundMonthly,social,personalFund,employerFund,wageTax,bonusTax:yearBonusTax,tax,cash,total,
    incomeTaxRate:tax/gross, burdenRate:1-total/gross, personalBurdenRate:(tax+social)/gross};
}
export function series(config=DEFAULTS) {
  return Array.from({length:17},(_,i)=>calculate((i+4)*10000,config)).map((r,i,all)=>({...r,increase:i?cents(r.cash-all[i-1].cash):null,crossBonus:i? r.bonusTax.rate!==all[i-1].bonusTax.rate:false}));
}
