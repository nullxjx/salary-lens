# 独立 Decimal 参考实现；参数有意手写，不读取 JS 计算结果。
from decimal import Decimal as D, ROUND_HALF_UP
from pathlib import Path
import json
cfg={'beijing':([36348]*3,36348,[7+5],3,'0.5'),'shanghai':([37731]*3,37731,[7,5],0,'0.5'),'guangzhou':([27603,31170,42933],41697,[12],0,'0.2'),'shenzhen':([27603,33633,48471],48471,[12],0,'0.2'),'hangzhou':([25611]*3,42151,[12],0,'0.5')}
bands=[(36000,'0.03',0),(144000,'0.1',2520),(300000,'0.2',16920),(420000,'0.25',31920),(660000,'0.3',52920),(960000,'0.35',85920),(D('Infinity'),'0.45',181920)]
def rd(x,unit='.01'):return x.quantize(D(unit),rounding=ROUND_HALF_UP)
def tax(x,bonus=False):
 x=max(D(0),x)
 for lim,rate,quick in bands:
  if x<=lim:return rd(x*D(rate)-D(quick)/(12 if bonus else 1))
rows=[]
for city,(caps,fund,rates,fixed,unemp) in cfg.items():
 for m in range(10000,200001,10000):
  avg=D(m)*16/12
  social=sum(rd(min(avg,D(cap))*D(rate)/100) for cap,rate in zip(caps,['8','2',unemp]))+fixed
  pf=sum(rd(min(avg,D(fund))*D(rate)/100,'1') for rate in rates)*12
  social*=12
  wt=tax(D(m)*12-social-pf-60000);bt=tax(D(m)*4,True)
  cash=D(m)*16-social-pf-wt-bt
  rows.append(dict(city=city,monthly=m,social=float(social),personalFund=float(pf),wageTax=float(wt),bonusTax=float(bt),cash=float(cash),total=float(cash+pf*2)))
Path(__file__).with_name('cities-baseline.json').write_text(json.dumps(rows,indent=2)+'\n')
