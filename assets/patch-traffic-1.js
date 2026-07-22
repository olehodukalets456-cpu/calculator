'use strict';
if(!window.__BP_TRAFFIC_ER_PATCH_V1__){
window.__BP_TRAFFIC_ER_PATCH_V1__=true;
var validationErrors=[];
Object.assign(I18N.uk,{"trafficModeLabel": "Як рахувати кліки", "trafficByCpc": "Через CPC", "trafficByCpm": "Через CPM + CTR", "cpcModeHint": "Введи бюджет і фактичний або плановий CPC.", "cpmModeHint": "CPM рахується по показах. Кліки = покази × CTR. Охоплення необов’язкове й потрібне для частоти.", "cpm": "CPM", "cpmHelp": "Вартість 1 000 показів.", "ctr": "CTR", "ctrHelp": "Частка показів, які дали клік.", "reach": "Охоплення", "reachHelp": "Необов’язково. Унікальні користувачі за той самий період. Потрібно для частоти.", "engagements": "Взаємодії", "engagementsHelp": "Необов’язково. Лайки, коментарі, збереження, поширення та інші цільові взаємодії за період.", "audienceBase": "База аудиторії", "audienceBaseHelp": "Необов’язково. Середня або стартова кількість підписників за період. Потрібна для ER за підписниками.", "errorPercent": "Введи значення більше 0 і не більше 100%", "errorReachTooHigh": "Охоплення не може бути більшим за кількість показів.", "errorStage": "Введи CR етапу більше 0 і не більше 100%.", "fixInputs": "Що треба виправити", "incompleteData": "Заповни обов’язкові поля — після цього результат з’явиться автоматично.", "calculationError": "Сталася помилка розрахунку. Скинь поточну вертикаль або онови сторінку.", "impressions": "Покази", "reachMetric": "Охоплення", "frequency": "Частота", "effectiveCpc": "Розрахунковий CPC", "engagementsMetric": "Взаємодії", "costPerEngagement": "Ціна взаємодії", "errReach": "ERR за охопленням", "erImpressions": "ER за показами", "erAudience": "ER за підписниками"});
Object.assign(I18N.en,{"trafficModeLabel": "How to calculate clicks", "trafficByCpc": "From CPC", "trafficByCpm": "From CPM + CTR", "cpcModeHint": "Enter ad spend and actual or planned CPC.", "cpmModeHint": "CPM is based on impressions. Clicks = impressions × CTR. Reach is optional and is used to calculate frequency.", "cpm": "CPM", "cpmHelp": "Cost per 1,000 impressions.", "ctr": "CTR", "ctrHelp": "Share of impressions that produced a click.", "reach": "Reach", "reachHelp": "Optional. Unique users for the same period. Used to calculate frequency.", "brandResultValue": "Estimated result value", "brandResultValueHelp": "Optional. Business value of one follower or target brand interaction. Used only for ROI.", "brandTargetCost": "Target result cost", "brandTargetCostHelp": "Planned CPF, CPS, or cost per target brand interaction.", "activeRate": "Active after 30 days", "activeRateHelp": "Share of acquired users who remain subscribed and continue engaging.", "engagements": "Engagements", "engagementsHelp": "Optional. Likes, comments, saves, shares, and other target engagements for the period.", "audienceBase": "Audience base", "audienceBaseHelp": "Optional. Average or starting follower count for the period. Used for follower-based ER.", "errorPercent": "Enter a value above 0 and no more than 100%", "errorReachTooHigh": "Reach cannot be higher than impressions.", "errorStage": "Enter a stage CR above 0 and no more than 100%.", "fixInputs": "What to fix", "incompleteData": "Complete the required fields and the result will appear automatically.", "calculationError": "A calculation error occurred. Reset the current vertical or reload the page.", "impressions": "Impressions", "reachMetric": "Reach", "frequency": "Frequency", "effectiveCpc": "Calculated CPC", "engagementsMetric": "Engagements", "costPerEngagement": "Cost per engagement", "errReach": "ERR by reach", "erImpressions": "ER by impressions", "erAudience": "ER by followers"});
Object.values(VERTICALS).forEach(cfg=>{ cfg.defaults={cpm:'',ctr:'',reach:'',...cfg.defaults}; });
if(!VERTICALS.brand.money.some(x=>x.id==='engagements')) VERTICALS.brand.money.splice(-1,0,f('engagements','engagements','engagementsHelp','number',false),f('audienceBase','audienceBase','audienceBaseHelp','number',false));
VERTICALS.brand.defaults={...VERTICALS.brand.defaults,engagements:'',audienceBase:''};
state.trafficMode=state.trafficMode||{};
const patchStyle=document.createElement('style'); patchStyle.id='bp-traffic-er-patch-style'; patchStyle.textContent="\n.traffic-mode-box{display:grid;gap:8px;margin-bottom:10px;padding:10px;border:1px solid var(--line);border-radius:var(--radius-sm);background:var(--surface-2)}\n.traffic-mode-head{display:flex;align-items:center;justify-content:space-between;gap:12px}.traffic-mode-head strong{font-size:11px}.traffic-mode-box .segmented{width:min(310px,100%)}\n.traffic-derived{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:7px;margin-top:9px}.traffic-derived[hidden]{display:none}.traffic-derived-item{min-height:60px;padding:9px;border:1px solid var(--line);border-radius:7px;background:#fff}.traffic-derived-item span{display:block;color:var(--muted);font-size:9px}.traffic-derived-item strong{display:block;margin-top:5px;font-size:13px}\n.validation-summary{margin-top:14px;padding:11px 12px;border:1px solid #efbcbc;border-left:4px solid var(--negative);border-radius:7px;background:var(--negative-soft);color:#7e2424;font-size:10.5px;line-height:1.45}.validation-summary[hidden]{display:none}.validation-summary strong{display:block;margin-bottom:4px;color:var(--negative)}.validation-summary p{margin:2px 0}\n@media(max-width:920px){.traffic-derived{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:520px){.traffic-mode-head{display:grid}.traffic-mode-box .segmented{width:100%}}\n"; document.head.append(patchStyle);
const trafficSection=dom.trafficFields.closest('.input-section');
const oldHint=trafficSection?.querySelector('.input-section-header span');
if(oldHint){oldHint.id='trafficHintText';oldHint.removeAttribute('data-i18n');}
if(trafficSection&&!document.getElementById('trafficMode')){
  const mode=document.createElement('div'); mode.className='traffic-mode-box'; mode.innerHTML='<div class="traffic-mode-head"><strong data-i18n="trafficModeLabel">Як рахувати кліки</strong><div id="trafficMode" class="segmented"></div></div><p id="trafficModeHint" class="basis-hint"></p>';
  dom.trafficFields.before(mode);
  const derived=document.createElement('div'); derived.id='trafficDerived'; derived.className='traffic-derived'; derived.hidden=true; dom.trafficFields.after(derived);
}
if(!document.getElementById('validationSummary')){ const summary=document.createElement('div');summary.id='validationSummary';summary.className='validation-summary';summary.hidden=true;dom.copy.closest('.actions').before(summary); }
Object.assign(dom,{trafficMode:document.getElementById('trafficMode'),trafficModeHint:document.getElementById('trafficModeHint'),trafficHintText:document.getElementById('trafficHintText'),trafficDerived:document.getElementById('trafficDerived'),validationSummary:document.getElementById('validationSummary')});
try{
 const hash=new URLSearchParams(location.hash.slice(1)).get(HASH_KEY); let saved=null;
 if(hash){const normalized=hash.replaceAll('-','+').replaceAll('_','/');saved=JSON.parse(decodeURIComponent(escape(atob(normalized))));}
 else saved=JSON.parse(localStorage.getItem(STORAGE_KEY)||'null');
 if(saved?.trafficMode&&typeof saved.trafficMode==='object')state.trafficMode=saved.trafficMode;
}catch(_){}
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
function currentTrafficMode(){ return state.trafficMode[state.vertical]||'cpc'; }
function trafficDefinitions(){
  const base=[f('adSpend','adSpend','adSpendHelp','money')];
  if(currentTrafficMode()==='cpm') return [...base,f('cpm','cpm','cpmHelp','money'),f('ctr','ctr','ctrHelp','percent'),f('reach','reach','reachHelp','number',false)];
  return [...base,f('cpc','cpc','cpcHelp','money')];
}
function renderTrafficMode(){
  const mode=currentTrafficMode();
  dom.trafficMode.replaceChildren();
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
  dom.trafficHintText.textContent=t(mode==='cpm'?'trafficByCpm':'trafficByCpc');
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
  dom.moneyHintText.textContent=t(state.vertical==='brand'?'brandMoneyHint':'moneyHint');
  renderTrafficMode();
  renderFieldSet(dom.trafficFields,trafficDefinitions());
  renderFunnelEditor();
  renderFieldSet(dom.moneyFields,cfg.money);
  renderBasis();
}
