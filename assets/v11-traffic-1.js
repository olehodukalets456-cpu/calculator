'use strict';

/* Flexible traffic input: CPC or the known cost of any funnel stage. */
Object.assign(I18N.uk,{
  trafficHint:'Бюджет і відома ціна залучення',
  trafficModeCpc:'Рахувати від CPC',
  trafficModeStage:'Рахувати від ціни етапу',
  trafficModeCpcHelp:'Бюджет ÷ CPC = кліки, далі працюють усі етапи воронки.',
  trafficModeStageHelp:'Вкажи CPL, CPQL, CPS або ціну іншого відомого етапу. Кліки та попередні етапи не потрібні.',
  anchorCost:'Вартість вибраного етапу',
  anchorCostHelp:'Фактичний CPL, CPQL, CPS, CPF або інша ціна результату.',
  anchorStage:'Відомий етап воронки',
  anchorStageHelp:'Прогноз почнеться з цього етапу. Його кількість = бюджет ÷ вартість етапу.',
  calculationStartsHere:'Старт розрахунку',
  notCalculated:'Не рахується →',
  startVolume:'Стартовий обсяг',
  trafficCost:'Вартість стартового результату',
  maxTrafficCost:'Вартість стартового результату в нуль',
  trafficCostGrowth:'Зростання вартості трафіку за подвоєння',
  trafficCostGrowthHelp:'У режимі CPC росте CPC. В режимі CPL/CPA росте ціна вибраного стартового етапу.',
  enableScalingHelp:'При збільшенні бюджету дорожчає обрана одиниця трафіку, а CR наступних етапів може падати.',
  scaledTrafficCost:'Прогнозна вартість трафіку',
  conversionFromStart:'CR від стартового етапу',
  knownStageCostProblem:'Ціна «{stage}» — {current}, а для беззбитковості потрібна не вище {limit}. Розрив — {gap}. Спочатку перевір якість джерел усередині цієї ціни: дешевший результат не допоможе, якщо далі падає кваліфікація або продаж.',
  knownStageCostHealthy:'Ціна «{stage}» має запас {gap} до межі беззбитковості. Масштабуй лише поки downstream-конверсії не погіршуються швидше, ніж росте обсяг.',
  stageCostModeNote:'Калькулятор не відновлює вигадані кліки. Воронка та CR рахуються від вибраного відомого етапу.'
});
Object.assign(I18N.en,{
  trafficHint:'Budget and known acquisition cost',
  trafficModeCpc:'Calculate from CPC',
  trafficModeStage:'Calculate from stage cost',
  trafficModeCpcHelp:'Budget ÷ CPC = clicks, then every funnel stage is applied.',
  trafficModeStageHelp:'Enter CPL, CPQL, CPS, or the cost of another known stage. Clicks and earlier stages are not required.',
  anchorCost:'Cost of selected stage',
  anchorCostHelp:'Actual CPL, CPQL, CPS, CPF, or another result cost.',
  anchorStage:'Known funnel stage',
  anchorStageHelp:'The forecast starts here. Volume = budget ÷ stage cost.',
  calculationStartsHere:'Calculation starts here',
  notCalculated:'Not calculated →',
  startVolume:'Starting volume',
  trafficCost:'Starting-result cost',
  maxTrafficCost:'Break-even starting-result cost',
  trafficCostGrowth:'Traffic-cost growth per doubling',
  trafficCostGrowthHelp:'In CPC mode, CPC increases. In stage-cost mode, the selected starting-stage cost increases.',
  enableScalingHelp:'As budget grows, the selected traffic unit gets more expensive and downstream conversion may decline.',
  scaledTrafficCost:'Forecast traffic cost',
  conversionFromStart:'CR from starting stage',
  knownStageCostProblem:'“{stage}” costs {current}, while break-even requires {limit} or less. The gap is {gap}. First inspect source quality inside that cost: a cheaper result does not help if qualification or sales collapse downstream.',
  knownStageCostHealthy:'“{stage}” has {gap} headroom before break-even. Scale only while downstream conversion does not deteriorate faster than volume grows.',
  stageCostModeNote:'The calculator does not invent click volume. Funnel counts and conversion are calculated from the selected known stage.'
});

const v10EnsureState=ensureState;
ensureState=function(){
  v10EnsureState();
  if(!state.trafficMode||typeof state.trafficMode!=='object')state.trafficMode={};
  if(!state.anchorStage||typeof state.anchorStage!=='object')state.anchorStage={};
  Object.keys(VERTICALS).forEach(key=>{
    if(!['cpc','stage'].includes(state.trafficMode[key]))state.trafficMode[key]='cpc';
    const stages=state.stages[key]||[];
    if(!stages.some(s=>s.id===state.anchorStage[key]))state.anchorStage[key]=stages[0]?.id||'';
    if(state.values[key]&&state.values[key].anchorCost==null)state.values[key].anchorCost='';
  });
};

function trafficMode(){return state.trafficMode?.[state.vertical]||'cpc'}
function currentStages(){return state.stages[state.vertical]||[]}
function anchorIndex(){
  const stages=currentStages();
  const idx=stages.findIndex(s=>s.id===state.anchorStage?.[state.vertical]);
  return idx>=0?idx:0;
}
function stageLabelByIndex(i){const s=currentStages()[i];return s?L(s.nameUk,s.nameEn):t('anchorStage')}
function activeTrafficLabel(r=null){
  const mode=r?.mode||trafficMode();
  return mode==='cpc'?t('cpc'):(r?.startLabel||stageLabelByIndex(anchorIndex()));
}
function ensureTrafficModeUi(){
  if(!document.getElementById('trafficModeWrap')){
    const wrap=document.createElement('div');
    wrap.id='trafficModeWrap';wrap.className='traffic-mode-wrap';
    wrap.innerHTML='<div id="trafficModeButtons" class="segmented traffic-mode-buttons"></div><p id="trafficModeHelp" class="traffic-mode-help"></p>';
    dom.trafficFields.parentNode.insertBefore(wrap,dom.trafficFields);
  }
  dom.trafficModeButtons=document.getElementById('trafficModeButtons');
  dom.trafficModeHelp=document.getElementById('trafficModeHelp');
}
function anchorSelectField(){
  const box=document.createElement('label');box.className='field full anchor-stage-field';
  const stages=currentStages();
  box.innerHTML=`<span class="field-head"><span class="field-label">${esc(t('anchorStage'))}</span></span><span class="select-wrap"><select id="anchorStageSelect">${stages.map(s=>`<option value="${esc(s.id)}" ${s.id===state.anchorStage[state.vertical]?'selected':''}>${esc(L(s.nameUk,s.nameEn))}</option>`).join('')}</select></span><span class="field-help">${esc(t('anchorStageHelp'))}</span>`;
  const select=box.querySelector('select');
  select.onchange=()=>{state.anchorStage[state.vertical]=select.value;save();renderFields();calculateAndRender()};
  return box;
}

renderFields=function(){
  const cfg=VERTICALS[state.vertical];
  ensureState();ensureTrafficModeUi();
  dom.currency.value=state.currency;
  const mode=trafficMode();
  dom.trafficModeButtons.innerHTML=[['cpc','trafficModeCpc'],['stage','trafficModeStage']].map(([value,key])=>`<button type="button" data-traffic-mode="${value}" class="${mode===value?'active':''}">${esc(t(key))}</button>`).join('');
  dom.trafficModeButtons.querySelectorAll('button').forEach(button=>button.onclick=()=>{
    state.trafficMode[state.vertical]=button.dataset.trafficMode;
    if(!state.anchorStage[state.vertical])state.anchorStage[state.vertical]=currentStages()[0]?.id||'';
    save();renderFields();calculateAndRender();
  });
  dom.trafficModeHelp.textContent=t(mode==='cpc'?'trafficModeCpcHelp':'trafficModeStageHelp');
  dom.trafficFields.innerHTML='';
  dom.trafficFields.append(fieldHtml(field('adSpend','adSpend','adSpendHelp','money'),'traffic'));
  if(mode==='cpc')dom.trafficFields.append(fieldHtml(field('cpc','cpc','cpcHelp','money'),'traffic'));
  else{
    dom.trafficFields.append(fieldHtml(field('anchorCost','anchorCost','anchorCostHelp','money'),'traffic'));
    dom.trafficFields.append(anchorSelectField());
  }
  dom.moneyFields.innerHTML='';cfg.fields.forEach(def=>dom.moneyFields.append(fieldHtml(def,'money')));
  dom.adjustmentFields.innerHTML='';[
    field('approveRate','approveRate','approveRateHelp','percent',false),field('refundRate','refundRate','refundRateHelp','percent',false),field('holdDays','holdDays','holdDaysHelp','days',false),field('paymentFee','paymentFee','paymentFeeHelp','percent',false),field('taxRate','taxRate','taxRateHelp','percent',false),field('agencyFee','agencyFee','agencyFeeHelp','percent',false)
  ].forEach(def=>dom.adjustmentFields.append(fieldHtml(def,'adjustment')));
  dom.scalingEnabled.checked=!!state.scalingEnabled;
  dom.scalingFields.innerHTML='';[
    field('targetBudget','targetBudget','targetBudgetHelp','money'),field('cpcGrowth','trafficCostGrowth','trafficCostGrowthHelp','percent'),field('crDrop','crDrop','crDropHelp','percent')
  ].forEach(def=>dom.scalingFields.append(fieldHtml(def,'scaling')));
  dom.scalingFields.style.opacity=state.scalingEnabled?'1':'.45';dom.scalingFields.style.pointerEvents=state.scalingEnabled?'auto':'none';
  dom.cohortDetails.hidden=!cfg.cohort;dom.cohortEnabled.checked=!!state.cohortEnabled;
  dom.cohortFields.innerHTML='';
  if(cfg.cohort)[field('churnRate','churnRate','churnRateHelp','percent'),field('projectionMonths','projectionMonths','projectionMonthsHelp','number')].forEach(def=>dom.cohortFields.append(fieldHtml(def,'cohort')));
  dom.cohortFields.style.opacity=state.cohortEnabled?'1':'.45';dom.cohortFields.style.pointerEvents=state.cohortEnabled?'auto':'none';
  renderFunnelEditor();renderBasis();
};

renderFunnelEditor=function(){
  const stages=currentStages(),mode=trafficMode(),start=anchorIndex();dom.funnelEditor.innerHTML='';
  stages.forEach((s,i)=>{
    const row=document.createElement('div');
    const ignored=mode==='stage'&&i<start,anchor=mode==='stage'&&i===start,disabled=mode==='stage'&&i<=start;
    row.className=`stage-row${ignored?' stage-muted':''}${anchor?' stage-anchor':''}`;
    let src;
    if(mode==='cpc')src=i===0?t('clicksSource'):`${L(stages[i-1].nameUk,stages[i-1].nameEn)} →`;
    else if(anchor)src=`${t('calculationStartsHere')} →`;
    else if(ignored)src=t('notCalculated');
    else src=`${L(stages[i-1].nameUk,stages[i-1].nameEn)} →`;
    row.innerHTML=`<span class="stage-source">${esc(src)}</span><input class="stage-name" value="${esc(L(s.nameUk,s.nameEn))}"><span class="stage-rate-wrap ${disabled?'disabled':''}"><input class="stage-rate" type="number" inputmode="decimal" step="any" value="${esc(s.rate)}" ${disabled?'disabled':''}><span>${disabled?'—':'%'}</span></span><button class="delete-stage" type="button" ${stages.length===1?'disabled':''}>×</button>`;
    const name=row.querySelector('.stage-name'),rate=row.querySelector('.stage-rate'),del=row.querySelector('.delete-stage');
    name.oninput=()=>{
      if(state.lang==='uk')s.nameUk=name.value;else s.nameEn=name.value;
      const option=document.querySelector(`#anchorStageSelect option[value="${CSS.escape(s.id)}"]`);if(option)option.textContent=name.value;
      save();calculateAndRender();
    };
    if(!disabled)rate.oninput=()=>{s.rate=rate.value;save();calculateAndRender()};
    del.title=t('deleteStage');del.onclick=()=>{
      state.stages[state.vertical]=stages.filter(x=>x.id!==s.id);
      if(!state.stages[state.vertical].some(x=>x.id===state.anchorStage[state.vertical]))state.anchorStage[state.vertical]=state.stages[state.vertical][0]?.id||'';
      save();renderFields();calculateAndRender();
    };
    dom.funnelEditor.append(row);
  });
};

function flexibleInputs(){
  const vals=state.values[state.vertical],mode=trafficMode(),aIndex=anchorIndex();
  return {vals,mode,aIndex,spend:n(vals.adSpend),cpc:mode==='cpc'?n(vals.cpc):NaN,anchorCost:mode==='stage'?n(vals.anchorCost):NaN,rates:rawRates(),stages:currentStages()};
}

