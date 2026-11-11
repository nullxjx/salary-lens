import {DEFAULTS,calculate,series} from './calc.js';
import {CITIES,cityConfig} from './cities.js';
const $=id=>document.getElementById(id);
const wan=n=>(n/10000).toFixed(2), pct=n=>(n*100).toFixed(2), yuan=n=>n.toLocaleString('zh-CN',{minimumFractionDigits:2,maximumFractionDigits:2});
let config={...DEFAULTS}, selected=10, mode='income', rows=series(config);
const colors={cash:'#173f37',total:'#ca703d',tax:'#55788a',muted:'#65716b',grid:'#e6ebe3'};
const el=(tag,attrs={},children='')=>`<${tag} ${Object.entries(attrs).map(([k,v])=>`${k}="${v}"`).join(' ')}>${children}</${tag}>`;
const txt=(x,y,text,attrs={})=>el('text',{x,y,fill:colors.muted,'font-size':11,...attrs},text);
const line=(x1,y1,x2,y2,attrs={})=>el('line',{x1,y1,x2,y2,stroke:colors.grid,'stroke-width':1,...attrs});
const insurance=[['pension','养老'],['medical','医疗'],['unemployment','失业']];
$('insurance-fields').innerHTML=insurance.map(([key,name])=>`<div class="field"><label for="${key}-cap">${name}基数上限 <span>元 / 月</span></label><input id="${key}-cap" type="number" min="1000" max="100000" step="1"></div><div class="field"><label for="${key}-rate">${name}个人比例 <span>%</span></label><input id="${key}-rate" type="number" min="0" max="20" step="0.01"></div>`).join('');
const formMap={'fund-rate':'fundRate','supplement-rate':'supplementRate',deduction:'deduction','fund-cap':'fundCap','medical-fixed':'medicalFixed',...Object.fromEntries(insurance.flatMap(([k])=>[[k+'-cap',k+'Cap'],[k+'-rate',k+'Rate']]))};
const formIds=Object.keys(formMap);
function populate(){
 const sh=config.city==='shanghai';
 $('city').value=config.city;
 $('fund-rate').innerHTML=Array.from({length:sh?3:8},(_,i)=>(sh?7:12)-i).map(n=>`<option value="${n}">${n}%</option>`).join('');
 $('fund-rate-label').textContent=sh?'基础公积金比例':'公积金缴存比例';
 $('supplement-field').hidden=!sh;$('medical-tier-field').hidden=config.city!=='shenzhen';
 for(const [id,key] of Object.entries(formMap)){$(id).value=config[key];$(id).removeAttribute('aria-invalid');}
 $('medical-tier').value=String(config.medicalRate);
 $('error').hidden=true;$('download').disabled=false;
}
function readConfig(){
 const c={...config};
 for(const [id,key] of Object.entries(formMap)){const f=$(id),valid=f.value!==''&&f.checkValidity();f.setAttribute('aria-invalid',String(!valid));c[key]=valid?Number(f.value):NaN;}
 try{calculate(selected*10000,c);$('error').hidden=true;$('download').disabled=false;return c;}
 catch(e){$('error').hidden=false;$('error').textContent=`${e.message}。结果保留上一组有效参数。`;$('download').disabled=true;return null;}
}
function choose(n){selected=n;$('salary').value=n;render();}
function render(){
 const r=rows[selected-4];
 const city=CITIES[config.city];
 $('city-note').textContent=city.note;
 $('city-source-title').textContent=`${city.name} · 参数来源`;
 $('city-sources').innerHTML=city.sources.map(s=>`<li><a href="${s.url}" target="_blank" rel="noopener noreferrer">${s.title} ↗</a></li>`).join('');
 $('social-detail-content').innerHTML=`<p><b>${city.name} · 每月个人缴费</b><br>${r.socialItems.map((a,i)=>`${insurance[i][1]}：${yuan(a.base)} × ${a.rate}% = ${yuan(a.amount)} 元`).join('<br>')}<br>医疗固定额：${yuan(r.medicalFixed)} 元<br>个人社保合计：${yuan(r.socialMonthly)} 元 / 月<br>单边公积金：${yuan(r.fundBase)} × ${config.fundRate}%（按元取整）${config.city==='shanghai'?` + ${yuan(r.fundBase)} × ${config.supplementRate}%（另行按元取整）`:''} = ${yuan(r.fundMonthly)} 元 / 月</p>`;
 $('salary-value').value=selected;$('salary').setAttribute('aria-valuetext',`${selected} 万元每月`);
 $('result-label').textContent=`${CITIES[config.city].name} · 月薪 ${selected} 万的年度收入`;
 $('cash').textContent=wan(r.cash);$('total').textContent=wan(r.total);$('burden').textContent=pct(r.burdenRate);
 $('cash-note').textContent=`含税后年终奖 ${wan(r.bonus-r.bonusTax.tax)} 万`;
 $('fund-note').textContent=`双边公积金 ${wan(r.personalFund+r.employerFund)} 万 / 年`;
 $('gross-label').textContent=`税前 16 薪共 ${wan(r.gross)} 万`;
 const parts=[['现金到手',r.cash,colors.cash],['工资个税',r.wageTax.tax,colors.tax],['年终奖个税',r.bonusTax.tax,'#90a3aa'],['个人社保',r.social,colors.total],['个人公积金',r.personalFund,'#b8c99e']];
 $('money-bar').innerHTML=parts.map(([label,value,color])=>`<span style="width:${value/r.gross*100}%;background:${color}" title="${label}：${yuan(value)} 元"></span>`).join('');
 $('money-bar').setAttribute('aria-label',parts.map(([l,v])=>`${l} ${yuan(v)} 元`).join('；'));
 $('breakdown-list').innerHTML=parts.map(([label,value,color])=>`<div><dt><i style="background:${color}"></i>${label}</dt><dd>${wan(value)} 万</dd></div>`).join('');
 $('extra-fund').textContent=`另有单位公积金 ${wan(r.employerFund)} 万，不包含在税前 16 薪中；双边公积金都算入「含公积金到手」。`;
 $('tax-detail-content').innerHTML=`<p><b>工资应纳税所得额</b><br>max(0, ${yuan(r.wages)} − ${yuan(r.social)} − ${yuan(r.personalFund)} − 60,000 − ${yuan(config.deduction*12)}) = ${yuan(r.wageTax.taxable)} 元</p><p><b>工资个税</b><br>${yuan(r.wageTax.taxable)} × ${pct(r.wageTax.rate)}% − ${yuan(r.wageTax.quick)} = ${yuan(r.wageTax.tax)} 元</p><p><b>年终奖单独计税</b><br>奖金 ${yuan(r.bonus)} ÷ 12 = ${yuan(r.bonus/12)} 元，用此数查月度税率表。<br>奖金税 = ${yuan(r.bonus)} × ${pct(r.bonusTax.rate)}% − ${yuan(r.bonusTax.quick)} = ${yuan(r.bonusTax.tax)} 元（速算扣除数只减一次）</p><p><b>现金到手</b><br>${yuan(r.gross)} − ${yuan(r.social)} − ${yuan(r.personalFund)} − ${yuan(r.tax)} = ${yuan(r.cash)} 元</p><p><b>自定义综合负担率</b><br>1 − ${yuan(r.total)} ÷ ${yuan(r.gross)} = ${pct(r.burdenRate)}%</p>`;
 $('table-body').innerHTML=rows.map(a=>`<tr data-month="${a.monthly/10000}" class="${a.monthly/10000===selected?'selected':''}"><td><button type="button" aria-label="查看月薪 ${a.monthly/10000} 万元" aria-pressed="${a.monthly/10000===selected}">${a.monthly/10000} 万</button></td><td>${wan(a.gross)}</td><td><b>${wan(a.cash)}</b></td><td>${wan(a.total)}</td><td>${pct(a.incomeTaxRate)}%</td><td>${pct(a.burdenRate)}%</td><td class="${a.crossBonus?'cross-value':''}">${a.increase===null?'—':`${wan(a.increase)}${a.crossBonus?' *':''}`}</td></tr>`).join('');
 drawChart();
}
function drawChart(){
 const container=$('chart'),w=Math.max(240,container.clientWidth),h=w<420?270:300;
 const left=47,right=17,top=23,bottom=40,pw=w-left-right,ph=h-top-bottom;
 const x=n=>left+(n-4)/16*pw;
 let minimum=0,maximum=1,step=1;
 if(mode==='income'){maximum=Math.ceil(Math.max(...rows.map(r=>r.total))/10000/40)*40;step=40;}
 if(mode==='burden'){minimum=Math.floor(Math.min(0,...rows.map(r=>r.burdenRate*100))/10)*10;maximum=Math.ceil(Math.max(...rows.map(r=>r.incomeTaxRate*100),...rows.map(r=>r.burdenRate*100))/10)*10;step=10;}
 if(mode==='increase'){minimum=Math.floor(Math.min(0,...rows.slice(1).map(r=>r.increase/10000))/4)*4;maximum=Math.ceil(Math.max(16,...rows.slice(1).map(r=>r.increase/10000))/4)*4;step=4;}
 const y=v=>top+(maximum-v)/(maximum-minimum)*ph;
 let content='';
 for(let v=minimum;v<=maximum;v+=step){content+=line(left,y(v),w-right,y(v));content+=txt(left-10,y(v)+4,mode==='burden'?`${v}%`:v,{'text-anchor':'end'});}
 const ticks=w<420?[4,8,12,16,20]:w<600?[4,6,8,10,12,14,16,18,20]:rows.map(r=>r.monthly/10000);
 for(const n of ticks) content+=txt(x(n),h-19,n,{'text-anchor':'middle'});
 content+=txt(w-right,h-1,'税前月薪 · 万元 / 月',{'text-anchor':'end','font-size':10});
 content+=txt(left,12,mode==='income'?'年收入 · 万元':mode==='burden'?'占税前 16 薪比例':'现金年增量 · 万元',{'font-size':10});
 content+=line(x(selected),top,x(selected),h-bottom,{stroke:'#9eaea4','stroke-dasharray':'3 4'});
 let description,legend,note;
 const r=rows[selected-4];
 if(mode==='income'||mode==='burden'){
  const ms=new Set(Array.from({length:321},(_,i)=>40000+i*500));
  for(const t of [75000,105000,165000]){ms.add(t);ms.add(t+.01);}
  const dense=[...ms].sort((a,b)=>a-b).map(m=>calculate(m,config));
  const plots=mode==='income'?[['cash',colors.cash,'现金到手'],['total',colors.total,'含双边公积金']]:[['incomeTaxRate',colors.tax,'仅个税比例'],['burdenRate',colors.cash,'自定义综合负担率']];
  for(const [key,color,label] of plots){
   const get=a=>mode==='income'?a[key]/10000:a[key]*100;
   const d=dense.map((a,i)=>`${i?'L':'M'}${x(a.monthly/10000).toFixed(2)},${y(get(a)).toFixed(2)}`).join(' ');
   content+=el('path',{d,fill:'none',stroke:color,'stroke-width':2.3,'stroke-linejoin':'round'});
   for(const a of rows){const n=a.monthly/10000;content+=el('circle',{cx:x(n),cy:y(get(a)),r:n===selected?5.5:3.3,fill:color,stroke:'white','stroke-width':n===selected?2:0,'data-month':n},el('title',{},`月薪 ${n} 万 · ${label} ${get(a).toFixed(2)}${mode==='income'?' 万元':'%'}`));}
  }
  legend=plots.map(([,c,l])=>`<span><i style="background:${c}"></i>${l}</span>`).join('');
  if(mode==='income'){
   description='税前月薪 4–20 万，每档增加 1 万。曲线保留年终奖换档时的真实跳变。';
   note=`月薪 ${selected} 万：现金 ${wan(r.cash)} 万，含公积金 ${wan(r.total)} 万。公积金是账户积累，不等同于随时可支取的现金。`;
  }else{
   description='个税比例只计个税；综合负担率同时计入个人社保，并用单位公积金抵减。两者分母都只含税前 16 薪。';
   note=`月薪 ${selected} 万：个税比例 ${pct(r.incomeTaxRate)}%，自定义综合负担率 ${pct(r.burdenRate)}%。这不是最高边际税率，也不宜直接用于国际排名。`;
  }
 }else{
  content+=line(left,y(16),w-right,y(16),{stroke:'#9eaea4','stroke-dasharray':'4 4'});
  const barw=Math.min(26,pw/18);
  for(const a of rows.slice(1)){
   const n=a.monthly/10000,v=a.increase/10000,color=a.crossBonus?colors.total:colors.cash;
   content+=el('rect',{x:x(n)-barw/2,y:Math.min(y(v),y(0)),width:barw,height:Math.abs(y(0)-y(v)),fill:color,opacity:n===selected?1:.8,rx:2,'data-month':n},el('title',{},`${n-1} → ${n} 万：年现金增加 ${wan(a.increase)} 万元${a.crossBonus?'，跨年终奖税档':''}`));
   if(w>600||n===selected)content+=txt(x(n),v>=0?y(v)-8:y(v)+14,wan(a.increase),{'text-anchor':'middle','font-size':w>600?10:11,fill:colors.cash});
  }
  legend=`<span><i style="background:${colors.cash}"></i>税后现金增量</span><span><i style="background:${colors.total}"></i>跨年终奖税率档</span>`;
  description='横坐标表示涨薪后的月薪：例如 10 对应从 9 万涨到 10 万。虚线为每次新增税前年薪 16 万。';
  note=r.increase===null?'4 万是起始档，没有上一档；选择 5 万及以上可查看涨薪收益。':`从 ${selected-1} 万涨到 ${selected} 万：税前年收入增加 16 万，现金实际多拿 ${wan(r.increase)} 万（${yuan(r.increase)} 元）。${r.crossBonus?'这一档跨越年终奖税率分界，增量暂时变小。':''}`;
 }
 $('chart-description').textContent=description;$('legend').innerHTML=legend;$('chart-note').textContent=note;
 container.setAttribute('aria-label',`${description} ${note} 完整数值见下方明细表。`);
 container.innerHTML=el('svg',{xmlns:'http://www.w3.org/2000/svg',viewBox:`0 0 ${w} ${h}`,width:w,height:h,'aria-hidden':'true'},content);
}
$('salary').addEventListener('input',()=>choose(Number($('salary').value)));
for(const id of formIds) $(id).addEventListener('input',()=>{const c=readConfig();if(c){config=c;rows=series(config);render();}});
$('city').addEventListener('change',()=>{config={...cityConfig($('city').value),deduction:config.deduction};populate();rows=series(config);render();});
$('medical-tier').addEventListener('change',()=>{$('medical-rate').value=$('medical-tier').value;const c=readConfig();if(c){config=c;rows=series(config);render();}});
$('medical-rate').addEventListener('input',()=>{$('medical-tier').value=$('medical-rate').value;});
$('reset').addEventListener('click',()=>{config=cityConfig(config.city);selected=10;mode='income';$('salary').value=10;populate();rows=series(config);document.querySelectorAll('[data-chart]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.chart===mode)));render();});
document.querySelectorAll('[data-chart]').forEach(b=>b.addEventListener('click',()=>{mode=b.dataset.chart;document.querySelectorAll('[data-chart]').forEach(t=>t.setAttribute('aria-pressed',String(t===b)));drawChart();}));
$('table-body').addEventListener('click',e=>{const tr=e.target.closest('tr[data-month]');if(tr){const fromButton=!!e.target.closest('button');const n=Number(tr.dataset.month);choose(n);if(fromButton)$('table-body').querySelector(`tr[data-month="${n}"] button`).focus({preventScroll:true});}});
$('chart').addEventListener('click',e=>{const mark=e.target.closest('[data-month]');if(mark)choose(Number(mark.dataset.month));});
$('download').addEventListener('click',()=>{
 const data=[[`${CITIES[config.city].name} 16 薪测算；金额单位：人民币元；参数快照日期：2026-11-11`],['说明',CITIES[config.city].note],...insurance.map(([k,n])=>[n+'上限',config[k+'Cap'],'个人比例',config[k+'Rate']+'%']),['医疗固定额',config.medicalFixed,'公积金基数上限',config.fundCap,'双边各基础比例',config.fundRate+'%','双边各补充比例',config.supplementRate+'%','月专项附加扣除',config.deduction],['税前月薪','税前年薪','现金到手','含双边公积金','全年工资个税','全年奖金个税','全年个人社保','全年个人公积金','全年单位公积金','个税比例','综合负担率','较上一档现金增量'],...rows.map(r=>[r.monthly,r.gross,r.cash,r.total,r.wageTax.tax,r.bonusTax.tax,r.social,r.personalFund,r.employerFund,pct(r.incomeTaxRate)+'%',pct(r.burdenRate)+'%',r.increase??''])];
 const csv='\uFEFF'+data.map(row=>row.map(v=>'"'+String(v).replaceAll('"','""')+'"').join(',')).join('\r\n');
 const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8;'}));const a=document.createElement('a');a.href=url;a.download=`${CITIES[config.city].name}16薪税后收入测算.csv`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
});
populate();
new ResizeObserver(()=>drawChart()).observe($('chart'));
render();
