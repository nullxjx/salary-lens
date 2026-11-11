import {initSelects,refreshSelects} from './select.js?v=20261111-5';
import {DEFAULTS,calculate,series,bonusBreakpoints} from './calc.js?v=20261111-5';
import {CITIES,cityConfig} from './cities.js?v=20261111-5';
const $=id=>document.getElementById(id);
const wan=n=>(n/10000).toFixed(2), pct=n=>(n*100).toFixed(2), yuan=n=>n.toLocaleString('zh-CN',{minimumFractionDigits:2,maximumFractionDigits:2});
let config={...DEFAULTS}, selected=10, mode='income', rows=series(config);
const colors={cash:'#173f37',total:'#ca703d',tax:'#55788a',muted:'#65716b',grid:'#e6ebe3'};
const el=(tag,attrs={},children='')=>`<${tag} ${Object.entries(attrs).map(([k,v])=>`${k}="${v}"`).join(' ')}>${children}</${tag}>`;
const txt=(x,y,text,attrs={})=>el('text',{x,y,fill:colors.muted,'font-size':11,...attrs},text);
const line=(x1,y1,x2,y2,attrs={})=>el('line',{x1,y1,x2,y2,stroke:colors.grid,'stroke-width':1,...attrs});
const insurance=[['pension','养老'],['medical','医疗'],['unemployment','失业']];
$('insurance-fields').innerHTML=insurance.map(([key,name])=>`<div class="field"><label for="${key}-cap">${name}基数上限 <span>元 / 月</span></label><input id="${key}-cap" type="number" min="1000" max="100000" step="1"></div><div class="field"><label for="${key}-rate">${name}个人比例 <span>%</span></label><input id="${key}-rate" type="number" min="0" max="20" step="0.01"></div>`).join('');
const formMap={'wage-months':'wageMonths','bonus-months':'bonusMonths','fund-rate':'fundRate','supplement-rate':'supplementRate',deduction:'deduction','fund-cap':'fundCap','medical-fixed':'medicalFixed',...Object.fromEntries(insurance.flatMap(([k])=>[[k+'-cap',k+'Cap'],[k+'-rate',k+'Rate']]))};
const formIds=Object.keys(formMap);
function populate(){
 const sh=config.city==='shanghai';
 $('city').value=config.city;
 $('fund-rate').innerHTML=Array.from({length:sh?3:8},(_,i)=>(sh?7:12)-i).map(n=>`<option value="${n}">${n}%</option>`).join('');
 $('fund-rate-label').textContent=sh?'基础公积金比例':'公积金比例';
 $('supplement-field').hidden=!sh;$('medical-tier-field').hidden=config.city!=='shenzhen';
 for(const [id,key] of Object.entries(formMap)){$(id).value=config[key];$(id).removeAttribute('aria-invalid');}
 $('medical-tier').value=String(config.medicalRate);
 $('error').hidden=true;$('download').disabled=false;
 refreshSelects();
}
function readConfig(){
 const c={...config};
 for(const [id,key] of Object.entries(formMap)){const f=$(id),valid=f.value!==''&&f.checkValidity();f.setAttribute('aria-invalid',String(!valid));c[key]=valid?Number(f.value):NaN;}
 try{calculate(selected*10000,c);$('error').hidden=true;$('download').disabled=false;return c;}
 catch(e){$('error').hidden=false;$('error').textContent=`${e.message}。结果保留上一组有效参数。`;$('download').disabled=true;return null;}
}
function choose(n){selected=n;$('salary').value=n;render();}
function render(){
 const r=rows[selected-1];
 const city=CITIES[config.city];
 const totalMonths=Number((config.wageMonths+config.bonusMonths).toFixed(1));
 $('pay-summary').textContent=`工资 ${config.wageMonths} + 年终奖 ${config.bonusMonths}`;
 $('table-description').textContent=`每档月薪 +1 万，税前年薪 +${totalMonths} 万；* 表示年终奖换档。`;
 $('floor-note').textContent=`当前预设基数下限（元/月）：养老 ${config.pensionFloor}、医保 ${config.medicalFloor}、失业 ${config.unemploymentFloor}、公积金 ${config.fundFloor}。`;
 $('city-note').textContent=city.note;
 const extraChanged=['deduction','medicalFixed','pensionCap','medicalCap','unemploymentCap','fundCap','pensionRate','medicalRate','unemploymentRate'].some(key=>config[key]!==city.config[key]);
 $('more-settings-hint').textContent=extraChanged?'已有自定义设置':'扣除 / 缴费参数';
 $('base-explanation').textContent=`${city.name} · 月薪 ${selected} 万 ×（工资 ${config.wageMonths} + 年终奖 ${config.bonusMonths}）÷ 12 = 折算月均 ${yuan(r.average)} 元。`;
 const cappedCount=r.socialItems.filter(item=>r.average>=config[item.key+'Cap']).length;
 $('contribution-status').textContent=`${cappedCount===3?'社保已封顶':cappedCount?'社保部分封顶':'社保未封顶'} · ${r.average>=config.fundCap?'公积金已封顶':'公积金未封顶'}`;
 const contributionItems=[...r.socialItems.map((item,i)=>({...item,name:insurance[i][1]})),{key:'fund',name:'公积金',base:r.fundBase}];
 $('base-cards').innerHTML=contributionItems.map(item=>{
  const cap=config[item.key+'Cap'],floor=config[item.key+'Floor'],capped=r.average>=cap;
  const status=capped?'已封顶':r.average<=floor?'按下限缴纳':'未封顶';
  return `<article class="base-card"><div><b>${item.name}</b><span class="base-status ${capped?'capped':''}">${status}</span></div><strong>${yuan(item.base)}<small> 元 / 月</small></strong><p>基数上限 ${yuan(cap)} 元<br>本情景月薪约 ${wan(cap*12/totalMonths)} 万起封顶</p></article>`;
 }).join('');
 $('limits-body').innerHTML=Object.entries(CITIES).map(([id,entry])=>{const current=id===config.city,c=current?config:entry.config;return `<tr class="${current?'selected':''}"><th scope="row">${entry.name}${current?' · 本次参数':''}</th>${['pension','medical','unemployment','fund'].map(k=>`<td>${c[k+'Cap'].toLocaleString('zh-CN')}</td>`).join('')}</tr>`;}).join('');
 $('city-source-title').textContent=`${city.name} · 参数来源`;
 $('city-sources').innerHTML=city.sources.map(s=>`<li><a href="${s.url}" target="_blank" rel="noopener noreferrer">${s.title} ↗</a></li>`).join('');
 $('social-detail-content').innerHTML=`<p><b>${city.name} · 每月个人缴费</b><br>${r.socialItems.map((a,i)=>`${insurance[i][1]}：${yuan(a.base)} × ${a.rate}% = ${yuan(a.amount)} 元`).join('<br>')}<br>医疗固定额：${yuan(r.medicalFixed)} 元<br>个人社保合计：${yuan(r.socialMonthly)} 元 / 月<br>单边公积金：${yuan(r.fundBase)} × ${config.fundRate}%（按元取整）${config.city==='shanghai'?` + ${yuan(r.fundBase)} × ${config.supplementRate}%（另行按元取整）`:''} = ${yuan(r.fundMonthly)} 元 / 月</p>`;
 $('salary-value').value=selected;$('salary').setAttribute('aria-valuetext',`${selected} 万元每月`);
 $('result-label').textContent=`${CITIES[config.city].name} · 月薪 ${selected} 万`;
 $('cash').textContent=wan(r.cash);$('total').textContent=wan(r.total);$('burden').textContent=pct(r.burdenRate);
 $('cash-note').textContent=`含税后年终奖 ${wan(r.bonus-r.bonusTax.tax)} 万`;
 $('fund-note').textContent=`其中公积金 ${wan(r.personalFund+r.employerFund)} 万，非即时现金`;
 $('gross-label').textContent=`税前 ${totalMonths} 薪共 ${wan(r.gross)} 万`;
 const parts=[['现金到手',r.cash,colors.cash],['工资个税',r.wageTax.tax,colors.tax],['年终奖个税',r.bonusTax.tax,'#90a3aa'],['个人社保',r.social,colors.total],['个人公积金',r.personalFund,'#b8c99e']];
 $('money-bar').innerHTML=parts.map(([label,value,color])=>`<span style="width:${value/r.gross*100}%;background:${color}" title="${label}：${yuan(value)} 元"></span>`).join('');
 $('money-bar').setAttribute('aria-label',parts.map(([l,v])=>`${l} ${yuan(v)} 元`).join('；'));
 $('breakdown-list').innerHTML=parts.map(([label,value,color])=>`<div><dt><i style="background:${color}"></i>${label}</dt><dd>${wan(value)} 万</dd></div>`).join('');
 $('extra-fund').textContent=`另有单位公积金 ${wan(r.employerFund)} 万，不包含在税前年收入中；双边公积金都算入「含公积金到手」。`;
 $('tax-detail-content').innerHTML=`<p><b>薪酬结构</b><br>工资：${yuan(r.monthly)} × ${config.wageMonths} = ${yuan(r.wages)} 元；年终奖：${yuan(r.monthly)} × ${config.bonusMonths} = ${yuan(r.bonus)} 元。<br>社保、公积金与专项附加扣除按 12 个月计算，奖金查档仍除以 12。</p><p><b>工资应纳税所得额</b><br>max(0, ${yuan(r.wages)} − ${yuan(r.social)} − ${yuan(r.personalFund)} − 60,000 − ${yuan(config.deduction*12)}) = ${yuan(r.wageTax.taxable)} 元</p><p><b>工资个税</b><br>${yuan(r.wageTax.taxable)} × ${pct(r.wageTax.rate)}% − ${yuan(r.wageTax.quick)} = ${yuan(r.wageTax.tax)} 元</p><p><b>年终奖单独计税</b><br>奖金 ${yuan(r.bonus)} ÷ 12 = ${yuan(r.bonus/12)} 元，用此数查月度税率表。<br>奖金税 = ${yuan(r.bonus)} × ${pct(r.bonusTax.rate)}% − ${yuan(r.bonusTax.quick)} = ${yuan(r.bonusTax.tax)} 元（速算扣除数只减一次）</p><p><b>现金到手</b><br>${yuan(r.gross)} − ${yuan(r.social)} − ${yuan(r.personalFund)} − ${yuan(r.tax)} = ${yuan(r.cash)} 元</p><p><b>综合税率</b><br>1 − ${yuan(r.total)} ÷ ${yuan(r.gross)} = ${pct(r.burdenRate)}%</p>`;
 $('table-body').innerHTML=rows.map(a=>`<tr data-month="${a.monthly/10000}" class="${a.monthly/10000===selected?'selected':''}"><td><button type="button" aria-label="查看月薪 ${a.monthly/10000} 万元" aria-pressed="${a.monthly/10000===selected}">${a.monthly/10000} 万</button></td><td>${wan(a.gross)}</td><td><b>${wan(a.cash)}</b></td><td>${wan(a.total)}</td><td>${wan(a.tax)}</td><td>${wan(a.social)}</td><td>${pct(a.incomeTaxRate)}%</td><td>${pct(a.burdenRate)}%</td><td class="${a.crossBonus?'cross-value':''}">${a.increase===null?'—':`${wan(a.increase)}${a.crossBonus?' *':''}`}</td></tr>`).join('');
 refreshSelects();
 drawChart();
}
function drawChart(){
 const container=$('chart'),w=Math.max(240,container.clientWidth),h=w<420?240:250;
 const left=47,right=17,top=23,bottom=40,pw=w-left-right,ph=h-top-bottom;
 const x=n=>left+(n-1)/19*pw;
 const totalMonths=Number((config.wageMonths+config.bonusMonths).toFixed(1));
 let minimum=0,maximum=1,step=1;
 if(mode==='income'){maximum=Math.ceil(Math.max(...rows.map(r=>r.total))/10000/40)*40;step=40;}
 if(mode==='burden'){minimum=Math.floor(Math.min(0,...rows.map(r=>r.burdenRate*100))/10)*10;maximum=Math.max(10,Math.ceil(Math.max(...rows.map(r=>r.incomeTaxRate*100),...rows.map(r=>r.burdenRate*100))/10)*10);step=10;}
 if(mode==='increase'){minimum=Math.floor(Math.min(0,...rows.slice(1).map(r=>r.increase/10000))/4)*4;maximum=Math.ceil(Math.max(totalMonths,...rows.slice(1).map(r=>r.increase/10000))/4)*4;step=4;}
 const y=v=>top+(maximum-v)/(maximum-minimum)*ph;
 let content='';
 for(let v=minimum;v<=maximum;v+=step){content+=line(left,y(v),w-right,y(v));content+=txt(left-10,y(v)+4,mode==='burden'?`${v}%`:v,{'text-anchor':'end'});}
 const ticks=w<420?[1,5,10,15,20]:w<600?[1,4,6,8,10,12,14,16,18,20]:rows.map(r=>r.monthly/10000);
 for(const n of ticks) content+=txt(x(n),h-19,n,{'text-anchor':'middle'});
 content+=txt(w-right,h-1,'税前月薪 · 万元 / 月',{'text-anchor':'end','font-size':10});
 content+=txt(left,12,mode==='income'?'年收入 · 万元':mode==='burden'?'占税前年收入比例':'现金年增量 · 万元',{'font-size':10});
 content+=line(x(selected),top,x(selected),h-bottom,{stroke:'#9eaea4','stroke-dasharray':'3 4'});
 let description,legend,note;
 const r=rows[selected-1];
 if(mode==='income'||mode==='burden'){
  const ms=new Set(Array.from({length:381},(_,i)=>10000+i*500));
  for(const t of bonusBreakpoints(config)){ms.add(t);const next=t+.011/config.bonusMonths;if(next<=200000)ms.add(next);}
  const dense=[...ms].sort((a,b)=>a-b).map(m=>calculate(m,config));
  const plots=mode==='income'?[['cash',colors.cash,'现金到手'],['total',colors.total,'含双边公积金']]:[['incomeTaxRate',colors.tax,'仅个税比例'],['burdenRate',colors.cash,'综合税率']];
  for(const [key,color,label] of plots){
   const get=a=>mode==='income'?a[key]/10000:a[key]*100;
   const d=dense.map((a,i)=>`${i?'L':'M'}${x(a.monthly/10000).toFixed(2)},${y(get(a)).toFixed(2)}`).join(' ');
   content+=el('path',{d,fill:'none',stroke:color,'stroke-width':2.3,'stroke-linejoin':'round'});
   for(const a of rows){const n=a.monthly/10000;content+=el('circle',{cx:x(n),cy:y(get(a)),r:n===selected?5.5:3.3,fill:color,stroke:'white','stroke-width':n===selected?2:0,'data-month':n},el('title',{},`月薪 ${n} 万 · ${label} ${get(a).toFixed(2)}${mode==='income'?' 万元':'%'}`));}
  }
  legend=plots.map(([,c,l])=>`<span><i style="background:${c}"></i>${l}</span>`).join('');
  if(mode==='income'){
   description='月薪 1–20 万 · 点击图中节点切换档位';
   note=config.bonusMonths>0?'年终奖换档可能带来短暂回落，并非计算异常。':'当前不发年终奖，全部工资按综合所得计税。';
  }else{
   description='分母均为税前年收入，不含单位公积金。';
   note='综合税率 =（个税 + 个人社保 − 单位公积金）÷ 税前年收入，非标准个税税率。';
  }
 }else{
  content+=line(left,y(totalMonths),w-right,y(totalMonths),{stroke:'#9eaea4','stroke-dasharray':'4 4'});
  const barw=Math.min(26,pw/20);
  for(const a of rows.slice(1)){
   const n=a.monthly/10000,v=a.increase/10000,color=a.crossBonus?colors.total:colors.cash;
   content+=el('rect',{x:x(n)-barw/2,y:Math.min(y(v),y(0)),width:barw,height:Math.abs(y(0)-y(v)),fill:color,opacity:n===selected?1:.8,rx:2,'data-month':n},el('title',{},`${n-1} → ${n} 万：年现金增加 ${wan(a.increase)} 万元${a.crossBonus?'，跨年终奖税档':''}`));
   if(w>600||n===selected)content+=txt(x(n),v>=0?y(v)-8:y(v)+14,wan(a.increase),{'text-anchor':'middle','font-size':w>600?10:11,fill:colors.cash});
  }
  legend=`<span><i style="background:${colors.cash}"></i>税后现金增量</span><span><i style="background:${colors.total}"></i>跨年终奖税率档</span>`;
  description=`横轴为涨薪后的月薪 · 虚线为税前年增量 ${totalMonths} 万`;
  note=r.increase===null?'1 万是起始档，没有上一档；选择 2 万及以上可查看涨薪收益。':`从 ${selected-1} 万涨到 ${selected} 万：税前年收入增加 ${totalMonths} 万，现金多拿 ${wan(r.increase)} 万。${r.crossBonus?'这一档跨越年终奖税率分界，增量暂时变小。':''}`;
 }
 $('chart-description').textContent=description;$('legend').innerHTML=legend;$('chart-note').textContent=note;
 container.setAttribute('aria-label',`${description} ${note} 完整数值见下方明细表。`);
 container.innerHTML=el('svg',{xmlns:'http://www.w3.org/2000/svg',viewBox:`0 0 ${w} ${h}`,width:w,height:h,'aria-hidden':'true'},content);
}
$('salary').addEventListener('input',()=>choose(Number($('salary').value)));
for(const id of formIds) $(id).addEventListener('input',()=>{const c=readConfig();if(c){config=c;rows=series(config);render();}});
$('city').addEventListener('change',()=>{config={...cityConfig($('city').value),deduction:config.deduction,wageMonths:config.wageMonths,bonusMonths:config.bonusMonths};populate();rows=series(config);render();});
$('medical-tier').addEventListener('change',()=>{$('medical-rate').value=$('medical-tier').value;const c=readConfig();if(c){config=c;rows=series(config);render();}});
$('medical-rate').addEventListener('input',()=>{$('medical-tier').value=$('medical-rate').value;refreshSelects();});
$('reset').addEventListener('click',()=>{config=cityConfig(config.city);selected=10;mode='income';$('salary').value=10;populate();rows=series(config);document.querySelectorAll('[data-chart]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.chart===mode)));render();});
document.querySelectorAll('[data-chart]').forEach(b=>b.addEventListener('click',()=>{mode=b.dataset.chart;document.querySelectorAll('[data-chart]').forEach(t=>t.setAttribute('aria-pressed',String(t===b)));drawChart();}));
$('table-body').addEventListener('click',e=>{const tr=e.target.closest('tr[data-month]');if(tr){const fromButton=!!e.target.closest('button');const n=Number(tr.dataset.month);choose(n);if(fromButton)$('table-body').querySelector(`tr[data-month="${n}"] button`).focus({preventScroll:true});}});
$('chart').addEventListener('click',e=>{const mark=e.target.closest('[data-month]');if(mark)choose(Number(mark.dataset.month));});
$('download').addEventListener('click',()=>{
 const data=[[`${CITIES[config.city].name} ${config.wageMonths}+${config.bonusMonths} 薪测算；金额单位：人民币元；参数快照日期：2026-11-11`],['说明',CITIES[config.city].note],['工资发放月数',config.wageMonths,'年终奖月数',config.bonusMonths,'社保公积金缴纳月数',12],...insurance.map(([k,n])=>[n+'上限',config[k+'Cap'],'下限',config[k+'Floor'],'个人比例',config[k+'Rate']+'%']),['医疗固定额',config.medicalFixed,'公积金基数上限',config.fundCap,'公积金基数下限',config.fundFloor,'双边各基础比例',config.fundRate+'%','双边各补充比例',config.supplementRate+'%','月专项附加扣除',config.deduction],['税前月薪','税前年薪','现金到手','含双边公积金','全年个税','全年工资个税','全年奖金个税','全年个人社保','全年个人公积金','全年单位公积金','个税比例','综合税率','较上一档现金增量'],...rows.map(r=>[r.monthly,r.gross,r.cash,r.total,r.tax,r.wageTax.tax,r.bonusTax.tax,r.social,r.personalFund,r.employerFund,pct(r.incomeTaxRate)+'%',pct(r.burdenRate)+'%',r.increase??''])];
 const csv='\uFEFF'+data.map(row=>row.map(v=>'"'+String(v).replaceAll('"','""')+'"').join(',')).join('\r\n');
 const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8;'}));const a=document.createElement('a');a.href=url;a.download=`${CITIES[config.city].name}${config.wageMonths}+${config.bonusMonths}薪税后收入测算.csv`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
});
initSelects();
populate();
new ResizeObserver(()=>drawChart()).observe($('chart'));
render();

// 悬停、键盘聚焦及触屏点击均可查看；浮层挂在 body，避免被横滚表格裁切。
const helpButtons=[...document.querySelectorAll('[data-tax-help]')],tooltip=$('burden-tooltip');
let help=helpButtons[0],helpPinned=false,helpTimer;
function positionHelp(){
 const rect=help.getBoundingClientRect(),width=tooltip.offsetWidth,height=tooltip.offsetHeight;
 tooltip.style.left=`${Math.max(12,Math.min(rect.right-width,window.innerWidth-width-12))}px`;
 tooltip.style.top=`${Math.max(12,rect.bottom+10+height<=window.innerHeight-12?rect.bottom+10:rect.top-height-10)}px`;
}
function showHelp(button=help){clearTimeout(helpTimer);if(help!==button){help.setAttribute('aria-expanded','false');helpPinned=false;}help=button;tooltip.hidden=false;help.setAttribute('aria-expanded','true');positionHelp();}
function hideHelp(){clearTimeout(helpTimer);helpPinned=false;tooltip.hidden=true;helpButtons.forEach(b=>b.setAttribute('aria-expanded','false'));}
function leaveHelp(){if(!helpPinned)helpTimer=setTimeout(()=>{if(document.activeElement!==help)hideHelp();},140);}
for(const button of helpButtons){
 button.addEventListener('pointerenter',()=>showHelp(button));
 button.addEventListener('pointerleave',leaveHelp);
 button.addEventListener('focus',()=>showHelp(button));
 button.addEventListener('blur',leaveHelp);
 button.addEventListener('click',()=>{if(help===button&&helpPinned)hideHelp();else{showHelp(button);helpPinned=true;}});
}
tooltip.addEventListener('pointerenter',()=>clearTimeout(helpTimer));
tooltip.addEventListener('pointerleave',leaveHelp);
document.addEventListener('pointerdown',e=>{if(!helpButtons.some(b=>b.contains(e.target))&&!tooltip.contains(e.target))hideHelp();});
document.addEventListener('keydown',e=>{if(e.key==='Escape')hideHelp();});
window.addEventListener('resize',()=>{if(!tooltip.hidden)positionHelp();});
document.addEventListener('scroll',()=>{if(!tooltip.hidden)positionHelp();},true);
// 深链接先展开目标折叠区，说明仍然随时可达。
function revealSection(id){const target=$(id);if(!target)return;let p=target;while(p){if(p.tagName==='DETAILS')p.open=true;p=p.parentElement;}target.scrollIntoView({behavior:'smooth',block:'start'});}
document.querySelectorAll('a[href^="#"]').forEach(a=>a.addEventListener('click',()=>{const id=a.getAttribute('href').slice(1);revealSection(id);}));
if(location.hash)revealSection(location.hash.slice(1));
