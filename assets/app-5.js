const state = {language:'uk',currency:'USD',vertical:'ecom',projectName:'',basis:{},values:{},stages:{}};
const $ = selector => document.querySelector(selector);
const dom = {
  currency: $('#currency'), langButtons:[...document.querySelectorAll('[data-lang]')], verticalTabs:$('#verticalTabs'),
  trafficFields:$('#trafficFields'), funnelEditor:$('#funnelEditor'), addStage:$('#addStage'), moneyFields:$('#moneyFields'),
  basisBox:$('#basisBox'), basisMode:$('#basisMode'), basisHint:$('#basisHint'), moneyHintText:$('#moneyHintText'), limitsTitle:$('#limitsTitle'), limitsHintText:$('#limitsHintText'), reset:$('#reset'), copy:$('#copy'), share:$('#share'), actionMessage:$('#actionMessage'),
  statusBox:$('#statusBox'), statusText:$('#statusText'), heroResult:$('#heroResult'), heroMainLabel:$('#heroMainLabel'), heroSideLabel:$('#heroSideLabel'), profitValue:$('#profitValue'), roiValue:$('#roiValue'), resultBasis:$('#resultBasis'),
  keyMetrics:$('#keyMetrics'), compareGrid:$('#compareGrid'), funnel:$('#funnel'), advancedGrid:$('#advancedGrid'), insightText:$('#insightText'), fieldTemplate:$('#fieldTemplate'),
  dashboardFunnel:$('#dashboardFunnel'), dashboardStats:$('#dashboardStats'), recommendations:$('#recommendations'), downloadReport:$('#downloadReport'),
  reportModal:$('#reportModal'), reportModalBackdrop:$('#reportModalBackdrop'), reportForm:$('#reportForm'), projectNameInput:$('#projectNameInput'), projectNameError:$('#projectNameError'), cancelReport:$('#cancelReport')
};

function t(key){ return I18N[state.language][key] ?? key; }
function esc(value){ return String(value).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c])); }
function cloneStages(stages){ return stages.map(s=>({...s,id:cryptoId()})); }
function cryptoId(){ return (globalThis.crypto?.randomUUID?.() || `s-${Date.now()}-${Math.random().toString(16).slice(2)}`); }

function ensureState(){
  Object.entries(VERTICALS).forEach(([key,cfg])=>{
    if(!state.values[key]) state.values[key]={...cfg.defaults};
    state.values[key]={...cfg.defaults,...state.values[key]};
    if(!state.basis[key]) state.basis[key]=cfg.defaultBasis;
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
      if(saved.values&&typeof saved.values==='object') state.values=saved.values;
      if(saved.stages&&typeof saved.stages==='object') state.stages=saved.stages;
    }
  } catch(_){}
}
function save(){ try{ localStorage.setItem(STORAGE_KEY,JSON.stringify(state)); }catch(_){} }

