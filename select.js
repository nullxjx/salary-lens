// 保留原生 select 作为数据源，外观和交互使用无依赖的可访问下拉组件。
const controls=[];
let opened=null;
const chevron='<svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true"><path d="m5.5 7.5 4.5 4.5 4.5-4.5" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const check='<svg viewBox="0 0 20 20" width="17" height="17" aria-hidden="true"><path d="m4.5 10 3.5 3.5 7.5-7" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
export function initSelects(){
 for(const select of document.querySelectorAll('select')){
  if(select.dataset.enhanced)continue;
  const label=document.querySelector(`label[for="${select.id}"]`);
  const button=document.createElement('button');
  button.type='button';button.id=select.id+'-trigger';button.className='select-trigger';
  button.setAttribute('role','combobox');button.setAttribute('aria-haspopup','listbox');button.setAttribute('aria-expanded','false');
  button.setAttribute('aria-controls',select.id+'-listbox');
  const value=document.createElement('span');value.className='select-value';value.id=select.id+'-display';
  button.append(value);button.insertAdjacentHTML('beforeend',chevron);
  if(label){label.id ||= select.id+'-label';label.htmlFor=button.id;button.setAttribute('aria-labelledby',label.id+' '+value.id);}
  else button.setAttribute('aria-label',select.getAttribute('aria-label')||select.id);
  const menu=document.createElement('div');menu.id=select.id+'-listbox';menu.className='select-menu';menu.hidden=true;menu.setAttribute('role','listbox');
  if(label)menu.setAttribute('aria-labelledby',label.id);
  select.insertAdjacentElement('afterend',button);document.body.append(menu);
  select.hidden=true;select.tabIndex=-1;select.setAttribute('aria-hidden','true');select.dataset.enhanced='true';
  let active=-1,items=[],signature='',buffer='',typedAt=0;
  function position(){
   if(menu.hidden)return;
   const rect=button.getBoundingClientRect(),vw=document.documentElement.clientWidth,vh=window.innerHeight;
   if(!button.getClientRects().length||rect.bottom<=0||rect.top>=vh){close();return;}
   menu.style.width=`${Math.min(rect.width,vw-24)}px`;
   menu.style.left=`${Math.max(12,Math.min(rect.left,vw-menu.offsetWidth-12))}px`;
   const below=vh-rect.bottom-16,above=rect.top-16,up=below<Math.min(menu.scrollHeight,220)&&above>below;
   menu.style.maxHeight=`${Math.max(44,Math.min(292,up?above:below))}px`;
   menu.dataset.direction=up?'up':'down';
   menu.style.top=`${up?Math.max(8,rect.top-menu.offsetHeight-7):rect.bottom+7}px`;
  }
  function setActive(index,scroll=true){
   if(index<0||!items[index]||select.options[index].disabled)return;
   active=index;
   items.forEach((item,i)=>item.classList.toggle('active',i===index));
   button.setAttribute('aria-activedescendant',items[index].id);
   if(scroll){const item=items[index];if(item.offsetTop<menu.scrollTop)menu.scrollTop=item.offsetTop-6;else if(item.offsetTop+item.offsetHeight>menu.scrollTop+menu.clientHeight)menu.scrollTop=item.offsetTop+item.offsetHeight-menu.clientHeight+6;}
  }
  function sync(){
   value.textContent=select.selectedOptions[0]?.textContent||'自定义';button.disabled=select.disabled;
   if(select.getAttribute('aria-invalid')==='true')button.setAttribute('aria-invalid','true');else button.removeAttribute('aria-invalid');
   const next=JSON.stringify([...select.options].map(o=>[o.value,o.textContent,o.disabled]));
   if(next!==signature){
    signature=next;menu.replaceChildren();items=[...select.options].map((option,index)=>{
     const item=document.createElement('div');item.id=`${select.id}-option-${index}`;item.className='select-option';item.setAttribute('role','option');
     const text=document.createElement('span');text.textContent=option.textContent;item.append(text);item.insertAdjacentHTML('beforeend',check);
     if(option.disabled)item.setAttribute('aria-disabled','true');
     item.addEventListener('pointermove',e=>{if(e.pointerType!=='touch')setActive(index,false);});
     item.addEventListener('click',()=>choose(index));menu.append(item);return item;
    });
   }
   items.forEach((item,i)=>item.setAttribute('aria-selected',String(i===select.selectedIndex)));
   if(!menu.hidden){position();setActive(select.selectedIndex>=0?select.selectedIndex:0);}
  }
  function open(){
   if(button.disabled)return;
   if(opened&&opened!==control)opened.close();
   sync();menu.hidden=false;button.setAttribute('aria-expanded','true');opened=control;
   position();setActive(select.selectedIndex>=0?select.selectedIndex:[...select.options].findIndex(o=>!o.disabled));
  }
  function close(){menu.hidden=true;button.setAttribute('aria-expanded','false');button.removeAttribute('aria-activedescendant');buffer='';if(opened===control)opened=null;}
  function choose(index){
   if(!select.options[index]||select.options[index].disabled)return;
   const changed=select.selectedIndex!==index;select.selectedIndex=index;close();sync();
   if(changed){select.dispatchEvent(new Event('input',{bubbles:true}));select.dispatchEvent(new Event('change',{bubbles:true}));}
   refreshSelects();button.focus({preventScroll:true});
  }
  function move(direction){let next=active;do{next+=direction;}while(next>=0&&next<items.length&&select.options[next].disabled);if(next>=0&&next<items.length)setActive(next);}
  const control={button,menu,close,sync,position};controls.push(control);
  button.addEventListener('click',()=>menu.hidden?open():close());
  button.addEventListener('keydown',e=>{
   if(e.key==='Escape'){if(!menu.hidden){e.preventDefault();e.stopPropagation();close();}return;}
   if(e.key==='Tab'){close();return;}
   if(['ArrowDown','ArrowUp','Home','End','Enter',' '].includes(e.key)){
    e.preventDefault();const wasClosed=menu.hidden;if(wasClosed)open();
    if(e.key==='Home')setActive([...select.options].findIndex(o=>!o.disabled));
    else if(e.key==='End'){for(let i=items.length-1;i>=0;i--)if(!select.options[i].disabled){setActive(i);break;}}
    else if(!wasClosed&&e.key==='ArrowDown')move(1);
    else if(!wasClosed&&e.key==='ArrowUp')move(-1);
    else if(!wasClosed&&(e.key==='Enter'||e.key===' '))choose(active);
    return;
   }
   if(e.key.length===1&&!e.ctrlKey&&!e.metaKey&&!e.altKey){
    if(Date.now()-typedAt>700)buffer='';typedAt=Date.now();buffer+=e.key.toLocaleLowerCase();
    if(menu.hidden)open();const found=[...select.options].findIndex(o=>!o.disabled&&o.textContent.trim().toLocaleLowerCase().startsWith(buffer));if(found>=0)setActive(found);
   }
  });
  menu.addEventListener('pointerdown',e=>{if(e.pointerType==='mouse')e.preventDefault();});
  select.addEventListener('change',sync);select.addEventListener('input',sync);
  sync();
 }
}
export function refreshSelects(){controls.forEach(control=>control.sync());}
document.addEventListener('pointerdown',e=>{if(opened&&!opened.button.contains(e.target)&&!opened.menu.contains(e.target))opened.close();});
window.addEventListener('resize',()=>opened?.position());
document.addEventListener('scroll',e=>{if(opened&&!opened.menu.contains(e.target))opened.position();},true);

document.addEventListener('focusin',e=>{if(opened&&!opened.button.contains(e.target)&&!opened.menu.contains(e.target))opened.close();});
