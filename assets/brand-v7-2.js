function restore(){
  try {
    const hash=new URLSearchParams(location.hash.slice(1)).get(HASH_KEY);
    let saved=null;
    if(hash){
      const normalized=hash.replaceAll('-','+').replaceAll('_','/');
      saved=JSON.parse(decodeURIComponent(escape(atob(normalized))));
    } else saved=JSON.parse(localStorage.getItem(STORAGE_KEY)||'null');
    if(saved&&typeof saved==='object'){
      if(['uk','en'].includes(saved.language)) state.language=saved.language;
      if(['USD','EUR','UAH','GBP'].includes(saved.currency)) state.currency=saved.currency;
      if(VERTICALS[saved.vertical]) state.vertical=saved.vertical;
      if(saved.basis&&typeof saved.basis==='object') state.basis=saved.basis;
      if(saved.trafficMode&&typeof saved.trafficMode==='object') state.trafficMode=saved.trafficMode;
      if(saved.values&&typeof saved.values==='object') state.values=saved.values;
      if(saved.stages&&typeof saved.stages==='object') state.stages=saved.stages;
    }
  } catch(_){}
}

function ensureState(){
  Object.entries(VERTICALS).forEach(([key,cfg])=>{
    if(!state.values[key]) state.values[key]={...cfg.defaults};
    state.values[key]={...cfg.defaults,...state.values[key]};
    if(!state.basis[key]) state.basis[key]=cfg.defaultBasis;
    if(!['cpc','cpm'].includes(state.trafficMode[key])) state.trafficMode[key]='cpc';
    if(!Array.isArray(state.stages[key]) || !state.stages[key].length) state.stages[key]=cloneStages(cfg.stages);
    state.stages[key]=state.stages[key].map(s=>({
      id:s.id||cryptoId(),
      nameUk:String(s.nameUk||s.name||'Новий етап'),
      nameEn:String(s.nameEn||s.name||'New stage'),
      rate:s.rate===''||s.rate===null||s.rate===undefined?'':(Number.isFinite(Number(s.rate))?Number(s.rate):'')
    }));
  });
}

function currentTrafficMode(){ return state.vertical==='brand'?(state.trafficMode[state.vertical]||'cpc'):'cpc'; }

function trafficDefinitions(){
  const base=[f('adSpend','adSpend','adSpendHelp','money')];
  if(currentTrafficMode()==='cpm') return [...base,f('cpm','cpm','cpmHelp','money'),f('ctr','ctr','ctrHelp','percent'),f('reach','reach','reachHelp','number',false)];
  return [...base,f('cpc','cpc','cpcHelp','money')];
}

function renderTrafficMode(){
  const enabled=state.vertical==='brand';
  dom.trafficModeBox.hidden=!enabled;
  const mode=currentTrafficMode();
  dom.trafficMode.replaceChildren();
  if(enabled){
    [['cpc','trafficByCpc'],['cpm','trafficByCpm']].forEach(([value,label])=>{
      const button=document.createElement('button');
      button.type='button'; button.textContent=t(label); button.className=mode===value?'active':'';
      button.onclick=()=>{
        state.trafficMode[state.vertical]=value;
        renderTrafficMode(); renderFieldSet(dom.trafficFields,trafficDefinitions()); calculateAndRender(); save();
      };
      dom.trafficMode.append(button);
    });
    dom.trafficModeHint.textContent=t(mode==='cpm'?'cpmModeHint':'cpcModeHint');
  }
  dom.trafficHintText.textContent=t(enabled&&mode==='cpm'?'trafficByCpm':'trafficByCpc');
}

function renderTrafficDerived(r){
  if(!r||r.trafficMode!=='cpm'){
    dom.trafficDerived.hidden=true; dom.trafficDerived.replaceChildren(); return;
  }
  const items=[
    [t('impressions'),count(r.impressions)],
    [t('clicks'),count(r.clicks)],
    [t('effectiveCpc'),money(r.cpc)]
  ];
  if(Number.isFinite(r.reach)) items.splice(1,0,[t('reachMetric'),count(r.reach)]);
  if(Number.isFinite(r.frequency)) items.push([t('frequency'),count(r.frequency)]);
  dom.trafficDerived.replaceChildren();
  items.forEach(([label,value])=>{
    const el=document.createElement('div'); el.className='traffic-derived-item';
    el.innerHTML=`<span>${esc(label)}</span><strong>${esc(value)}</strong>`; dom.trafficDerived.append(el);
  });
  dom.trafficDerived.hidden=false;
}

function renderFields(){
  const cfg=VERTICALS[state.vertical];
  dom.moneyTitleText.textContent=t(state.vertical==='brand'?'brandMetricsTitle':'moneyData');
  dom.moneyHintText.textContent=t(state.vertical==='brand'?'brandMoneyHint':'moneyHint');
  renderTrafficMode();
  renderFieldSet(dom.trafficFields,trafficDefinitions());
  renderFunnelEditor();
  renderFieldSet(dom.moneyFields,cfg.money);
  renderBasis();
}

function validateField(node,def){
  const input=node.querySelector('input');
  const raw=input.value;
  const val=Number(raw);
  let error='';
  if(def.required && (raw==='' || !Number.isFinite(val) || val<=0)) error='errorPositive';
  if(!def.required && raw!=='' && (!Number.isFinite(val)||val<0)) error='errorNonNegative';
  if(def.id==='reach' && raw!=='' && (!Number.isFinite(val)||val<=0)) error='errorPositive';
  if(def.type==='percent' && raw!=='' && (!Number.isFinite(val)||val<=0||val>100)) error='errorPercent';
  node.classList.toggle('invalid',Boolean(error));
  node.querySelector('.field-error').textContent=error?t(error):'';
  return {ok:!error,error:error?t(error):''};
}

