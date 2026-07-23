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
const money=v=>Number.isFinite(v)?`${CURR[state.currency]}${Math.abs(v).toLocaleString(state.lang==='uk'?'uk-UA':'en-US',{maximumFractionDigits:2})}`.replace(CURR[state.currency],v<0?`-${CURR[state.currency]}`:CURR[state.currency]):'—';
const pct=v=>Number.isFinite(v)?`${v.toLocaleString(state.lang==='uk'?'uk-UA':'en-US',{maximumFractionDigits:2})}%`:'—';
const count=v=>Number.isFinite(v)?v.toLocaleString(state.lang==='uk'?'uk-UA':'en-US',{maximumFractionDigits:v<100?2:0}):'—';
const dateAfter=days=>{if(!days)return '—';const d=new Date();d.setDate(d.getDate()+days);return d.toLocaleDateString(state.lang==='uk'?'uk-UA':'en-US')};

function defaultStages(key){return VERTICALS[key].stages.map(([uk,en])=>({id:uid(),nameUk:uk,nameEn:en,rate:''}))}
function ensureState(){
 Object.keys(VERTICALS).forEach(k=>{
   if(!state.values[k]) state.values[k]={};
   if(!state.stages[k]) state.stages[k]=defaultStages(k);
   if(!state.basis[k]) state.basis[k]=VERTICALS[k].defaultBasis||'first';
 });
}
function save(){localStorage.setItem(STORAGE_KEY,JSON.stringify(state))}
function load(){
 try{
   const raw=localStorage.getItem(STORAGE_KEY);
   if(raw){const x=JSON.parse(raw);Object.assign(state,x)}
   const hash=new URLSearchParams(location.hash.slice(1)).get(HASH_KEY);
   if(hash){const x=JSON.parse(decodeURIComponent(atob(hash)));Object.assign(state,x);history.replaceState(null,'',location.pathname+location.search)}
 }catch(e){console.warn(e)}
 ensureState();
}

function applyTranslations(){
 document.documentElement.lang=state.lang;
 document.querySelectorAll('[data-i18n]').forEach(el=>el.textContent=t(el.dataset.i18n));
 dom.projectNameInput.placeholder=t('projectNamePlaceholder');
 dom.langs.forEach(b=>b.classList.toggle('active',b.dataset.lang===state.lang));
}
function renderVerticals(){
 dom.verticalTabs.innerHTML=Object.entries(VERTICALS).map(([k,c])=>`<button type="button" class="vertical-tab ${k===state.vertical?'active':''}" data-vertical="${k}"><strong>${esc(t(c.title))}</strong><span>${esc(t(c.desc))}</span></button>`).join('');
 dom.verticalTabs.querySelectorAll('button').forEach(b=>b.onclick=()=>{state.vertical=b.dataset.vertical;renderAll();save()});
}
function isFieldRequired(def){
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
 if(def.type==='money') prefix.textContent=CURR[state.currency];
 if(def.type==='percent') suffix.textContent='%';
 if(def.type==='days') suffix.textContent=state.lang==='uk'?'дн.':'days';
 input.oninput=()=>{state.values[state.vertical][def.key]=input.value;save();calculateAndRender()};
 return node;
}
