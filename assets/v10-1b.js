const field=(key,label,help,type='number',required=true)=>({key,label,help,type,required});
const VERTICALS={
 ecom:{title:'ecomTitle',desc:'ecomDesc',basis:true,defaultBasis:'first',fields:[field('aov','aov','aovHelp','money',false),field('customerLtv','customerLtv','customerLtvHelp','money',false),field('margin','margin','marginHelp','percent'),field('fixedCosts','fixedCosts','fixedCostsHelp','money',false)],stages:[['Покупка','Purchase']]},
 leadgen:{title:'leadgenTitle',desc:'leadgenDesc',basis:false,fields:[field('valuePerSale','valuePerSale','valuePerSaleHelp','money'),field('margin','margin','marginHelp','percent'),field('fixedCosts','fixedCosts','fixedCostsHelp','money',false)],stages:[['Лід','Lead'],['Кваліфікований лід','Qualified lead'],['Продаж','Sale']]},
 edtech:{title:'edtechTitle',desc:'edtechDesc',basis:false,cohort:true,fields:[field('studentValue','studentValue','studentValueHelp','money'),field('monthlyStudentValue','monthlyStudentValue','monthlyStudentValueHelp','money',false),field('margin','margin','marginHelp','percent'),field('fixedCosts','fixedCosts','fixedCostsHelp','money',false)],stages:[['Лід','Lead'],['Дзвінок / анкета','Call / application'],['Оплата','Payment']]},
 saas:{title:'saasTitle',desc:'saasDesc',basis:true,defaultBasis:'ltv',cohort:true,fields:[field('monthlyArpu','monthlyArpu','monthlyArpuHelp','money'),field('lifetimeMonths','lifetimeMonths','lifetimeMonthsHelp','number',false),field('margin','margin','marginHelp','percent'),field('fixedCosts','fixedCosts','fixedCostsHelp','money',false)],stages:[['Signup / trial','Signup / trial'],['Paid-клієнт','Paid customer']]},
 brand:{title:'brandTitle',desc:'brandDesc',basis:false,brand:true,fields:[field('brandResultValue','brandResultValue','brandResultValueHelp','money',false),field('brandTargetCost','brandTargetCost','brandTargetCostHelp','money'),field('activeRate','activeRate','activeRateHelp','percent',false),field('fixedCosts','fixedCosts','fixedCostsHelp','money',false)],stages:[['Перехід у профіль / канал','Profile / channel visit'],['Підписка / бренд-дія','Follow / brand action']]}
};

const state={lang:'uk',currency:'USD',vertical:'ecom',basis:{},values:{},stages:{},scalingEnabled:false,cohortEnabled:false,scenarios:[null,null,null]};
const $=s=>document.querySelector(s);
const dom={
 currency:$('#currency'),langs:[...document.querySelectorAll('[data-lang]')],verticalTabs:$('#verticalTabs'),trafficFields:$('#trafficFields'),moneyFields:$('#moneyFields'),adjustmentFields:$('#adjustmentFields'),scalingFields:$('#scalingFields'),cohortFields:$('#cohortFields'),
 funnelEditor:$('#funnelEditor'),addStage:$('#addStage'),basisBox:$('#basisBox'),basisMode:$('#basisMode'),basisHint:$('#basisHint'),reset:$('#reset'),copy:$('#copy'),share:$('#share'),csvTop:$('#csvTop'),actionMessage:$('#actionMessage'),
 statusBox:$('#statusBox'),statusText:$('#statusText'),resultBasis:$('#resultBasis'),heroResult:$('#heroResult'),profitValue:$('#profitValue'),roiValue:$('#roiValue'),keyMetrics:$('#keyMetrics'),insightText:$('#insightText'),compareGrid:$('#compareGrid'),funnel:$('#funnel'),advancedGrid:$('#advancedGrid'),
 scalingEnabled:$('#scalingEnabled'),cohortEnabled:$('#cohortEnabled'),cohortDetails:$('#cohortDetails'),scaleSection:$('#scaleSection'),scaleSummary:$('#scaleSummary'),scaleDelta:$('#scaleDelta'),cohortSection:$('#cohortSection'),cohortSummary:$('#cohortSummary'),cohortChart:$('#cohortChart'),cohortTable:$('#cohortTable'),
 dashboardFunnel:$('#dashboardFunnel'),dashboardStats:$('#dashboardStats'),recommendations:$('#recommendations'),downloadReport:$('#downloadReport'),downloadCsv:$('#downloadCsv'),googleSheets:$('#googleSheets'),scenarioSlots:$('#scenarioSlots'),scenarioComparison:$('#scenarioComparison'),
 reportModal:$('#reportModal'),reportModalBackdrop:$('#reportModalBackdrop'),reportForm:$('#reportForm'),projectNameInput:$('#projectNameInput'),projectNameError:$('#projectNameError'),cancelReport:$('#cancelReport'),reportRender:$('#reportRender'),fieldTemplate:$('#fieldTemplate')
};
const t=k=>I18N[state.lang][k]??k;
const L=(uk,en)=>state.lang==='uk'?uk:en;
const money=v=>Number.isFinite(v)?`${CURR[state.currency]}${Math.abs(v).toLocaleString(state.lang==='uk'?'uk-UA':'en-US',{maximumFractionDigits:Math.abs(v)>0&&Math.abs(v)<.01?8:2})}`.replace(CURR[state.currency],v<0?`-${CURR[state.currency]}`:CURR[state.currency]):'—';
const pct=v=>Number.isFinite(v)?`${v.toLocaleString(state.lang==='uk'?'uk-UA':'en-US',{maximumFractionDigits:Math.abs(v)>0&&Math.abs(v)<.01?8:2})}%`:'—';
const count=v=>Number.isFinite(v)?v.toLocaleString(state.lang==='uk'?'uk-UA':'en-US',{maximumFractionDigits:Math.abs(v)>0&&Math.abs(v)<.01?8:v<100?2:0}):'—';
const dateAfter=days=>{if(!days)return '—';const d=new Date();d.setDate(d.getDate()+days);return d.toLocaleDateString(state.lang==='uk'?'uk-UA':'en-US')};

function defaultStages(key){return VERTICALS[key].stages.map(([uk,en])=>({id:uid(),nameUk:uk,nameEn:en,rate:''}))}
function ensureState(){
 const record=x=>!!x&&typeof x==='object'&&!Array.isArray(x);
 if(!['uk','en'].includes(state.lang))state.lang='uk';
 if(!Object.hasOwn(CURR,state.currency))state.currency='USD';
 if(!Object.hasOwn(VERTICALS,state.vertical))state.vertical='ecom';
 for(const key of ['values','stages','basis'])if(!record(state[key]))state[key]={};
 state.scalingEnabled=state.scalingEnabled===true;state.cohortEnabled=state.cohortEnabled===true;
 Object.keys(VERTICALS).forEach(k=>{
   const allowed=['adSpend','cpc','anchorCost','approveRate','refundRate','holdDays','paymentFee','taxRate','agencyFee','targetBudget','cpcGrowth','crDrop','churnRate','projectionMonths',...VERTICALS[k].fields.map(f=>f.key)];
   const old=record(state.values[k])?state.values[k]:{};
   state.values[k]=Object.fromEntries(allowed.filter(key=>Object.hasOwn(old,key)).map(key=>[key,['string','number'].includes(typeof old[key])?String(old[key]).slice(0,100).replace(',','.'):'']));
   if(!Array.isArray(state.stages[k])||!state.stages[k].length)state.stages[k]=defaultStages(k);
   const ids=new Set();
   state.stages[k]=state.stages[k].slice(0,20).map(s=>{
    s=record(s)?s:{};
    const id=typeof s.id==='string'&&/^[a-zA-Z0-9_-]{1,80}$/.test(s.id)&&!ids.has(s.id)?s.id:uid();ids.add(id);
    return {id,nameUk:typeof s.nameUk==='string'?s.nameUk.slice(0,120):I18N.uk.newStage,nameEn:typeof s.nameEn==='string'?s.nameEn.slice(0,120):I18N.en.newStage,rate:['string','number'].includes(typeof s.rate)?String(s.rate).slice(0,100).replace(',','.'):''};
   });
   if(!['first','ltv'].includes(state.basis[k]))state.basis[k]=VERTICALS[k].defaultBasis||'first';
 });
 const names=Array.isArray(state.scenarioNames)?state.scenarioNames:[];
 state.scenarioNames=Array.from({length:3},(_,i)=>typeof names[i]==='string'?names[i].slice(0,40):null);
 const slots=Array.isArray(state.scenarios)?state.scenarios:[];
 state.scenarios=Array.from({length:3},(_,i)=>{
  const s=slots[i];if(!record(s)||!record(s.result)||!Object.hasOwn(VERTICALS,s.vertical)||!Object.hasOwn(CURR,s.currency))return null;
  const result={...s.result};
  if(!['cpc','stage'].includes(result.mode)){result.mode='cpc';result.trafficCost=result.cpc;result.startLabel=I18N[state.lang].clicks}
  result.hasRevenue=typeof result.hasRevenue==='boolean'?result.hasRevenue:!(s.vertical==='brand'&&!(result.unitRevenue>0));
  if(!result.hasRevenue)for(const key of ['grossRevenue','profit','roi'])result[key]=null;
  return {...s,name:typeof s.name==='string'?s.name.slice(0,40):t(`scenario${i+1}`),result};
 });
}
function save(){try{localStorage.setItem(STORAGE_KEY,JSON.stringify(state))}catch{showMessage(t('storageError'),true)}}
function load(){
 const apply=x=>{if(!x||typeof x!=='object'||Array.isArray(x))return;for(const key of ['lang','currency','vertical','basis','values','stages','trafficMode','anchorStage','scalingEnabled','cohortEnabled','scenarios','scenarioNames'])if(Object.hasOwn(x,key)){if(x.version===12&&['values','stages','basis','trafficMode','anchorStage'].includes(key))state[key]={...state[key],...x[key]};else state[key]=x[key]}};
 try{const raw=localStorage.getItem(STORAGE_KEY);if(raw)apply(JSON.parse(raw))}catch{showMessage(t('storageError'),true)}
 try{
  const hash=new URLSearchParams(location.hash.slice(1)).get(HASH_KEY);
  if(hash){if(hash.length>100000)throw new Error('Scenario too large');apply(JSON.parse(decodeURIComponent(atob(hash))));history.replaceState(null,'',location.pathname+location.search)}
 }catch{showMessage(t('scenarioError'),true)}
 ensureState();
}

function applyTranslations(){
 document.documentElement.lang=state.lang;dom.currency.title=t('currencyHelp');dom.currency.setAttribute('aria-label',L('Валюта','Currency'));
 dom.scalingEnabled.setAttribute('aria-label',t('enableScaling'));dom.cohortEnabled.setAttribute('aria-label',t('enableCohort'));
 document.querySelectorAll('[data-i18n]').forEach(el=>el.textContent=t(el.dataset.i18n));
 dom.projectNameInput.placeholder=t('projectNamePlaceholder');
 dom.langs.forEach(b=>b.classList.toggle('active',b.dataset.lang===state.lang));
}
function renderVerticals(){
 dom.verticalTabs.innerHTML=Object.entries(VERTICALS).map(([k,c])=>`<button type="button" class="vertical-tab ${k===state.vertical?'active':''}" data-vertical="${k}"><strong>${esc(t(c.title))}</strong><span>${esc(t(c.desc))}</span></button>`).join('');
 dom.verticalTabs.querySelectorAll('button').forEach(b=>b.onclick=()=>{state.vertical=b.dataset.vertical;renderAll();save()});
}
function isFieldRequired(def){
 if(def.key==='brandTargetCost')return isBlank(state.values.brand?.brandResultValue);
 if(def.key==='monthlyStudentValue')return state.cohortEnabled;
 if(def.required)return true;
 if(state.vertical==='ecom'&&def.key==='aov')return state.basis.ecom==='first';
 if(state.vertical==='ecom'&&def.key==='customerLtv')return state.basis.ecom==='ltv';
 if(state.vertical==='saas'&&def.key==='lifetimeMonths')return state.basis.saas==='ltv';
 return false;
}
function fieldHtml(def,group){
 const node=dom.fieldTemplate.content.firstElementChild.cloneNode(true);
 const input=node.querySelector('input'),label=node.querySelector('.field-label'),help=node.querySelector('.field-help'),optional=node.querySelector('.optional'),prefix=node.querySelector('.prefix'),suffix=node.querySelector('.suffix');
 label.textContent=t(def.label);help.textContent=t(def.help);optional.textContent=isFieldRequired(def)?'':t('optional');
 input.dataset.key=def.key;input.dataset.group=group;input.value=state.values[state.vertical][def.key]??'';
 input.id=`field-${def.key}`;input.setAttribute('aria-label',t(def.label));
 help.id=`help-${def.key}`;input.setAttribute('aria-describedby',help.id);
 const rule=inputRules()[def.key];
 if(rule){input.min=String(rule.min>0&&rule.min<1?0:rule.min);input.max=String(rule.max);input.required=rule.required;if(rule.integer)input.step='1'}
 if(!rule){input.disabled=true;help.textContent=L('Не використовується в обраному режимі.','Not used in the selected mode.')}
 if(def.type==='money') prefix.textContent=CURR[state.currency];
 if(def.type==='percent') suffix.textContent='%';
 if(def.type==='days') suffix.textContent=state.lang==='uk'?'дн.':'days';
 input.oninput=()=>{state.values[state.vertical][def.key]=input.value;save();calculateAndRender()};
 return node;
}
