from decimal import Decimal as D, ROUND_HALF_UP
from pathlib import Path
import json
# 独立手写参数，不读取或调用生产 JS。
configs={'beijing':([36348]*3,[7270]*3,36348,2540,[12],3,'.5'),'shanghai':([37731]*3,[7546]*3,37731,2740,[7,5],0,'.5'),'guangzhou':([27603,31170,42933],[5521,6234,2680],41697,2680,[12],0,'.2'),'shenzhen':([27603,33633,48471],[5521,6727,2700],48471,2700,[12],0,'.2'),'hangzhou':([25611]*3,[5122]*3,42151,2660,[12],0,'.5')}
bands=[(36000,'.03',0),(144000,'.1',2520),(300000,'.2',16920),(420000,'.25',31920),(660000,'.3',52920),(960000,'.35',85920),(D('Infinity'),'.45',181920)]
def rd(x,unit='.01'):return x.quantize(D(unit),rounding=ROUND_HALF_UP)
def tax(x,bonus=False):
 x=max(D(0),x)
 for lim,rate,quick in bands:
  if x<=lim:return rd(x*D(rate)-D(quick)/(12 if bonus else 1))
rows=[]
for city,(caps,floors,fc,ff,rates,fixed,ur) in configs.items():
 for wm,bm in [(12,0),(13,3),(12,2.5),(6,1),(1,0),(36,36),(12.1,4.2)]:
  for m in [20000,100000,200000]:
   wages=rd(D(m)*D(str(wm)));bonus=rd(D(m)*D(str(bm)));gross=wages+bonus;avg=gross/12
   social=(sum(rd(max(D(floor),min(avg,D(cap)))*D(rate)/100) for cap,floor,rate in zip(caps,floors,['8','2',ur]))+fixed)*12
   pf=sum(rd(max(D(ff),min(avg,D(fc)))*D(rate)/100,'1') for rate in rates)*12
   wt=tax(wages-social-pf-60000);bt=tax(bonus,True);cash=gross-social-pf-wt-bt
   rows.append(dict(city=city,monthly=m,wageMonths=wm,bonusMonths=bm,gross=float(gross),social=float(social),personalFund=float(pf),wageTax=float(wt),bonusTax=float(bt),cash=float(cash),total=float(cash+pf*2)))
Path(__file__).with_name('months-baseline.json').write_text(json.dumps(rows,indent=2)+'\n')
