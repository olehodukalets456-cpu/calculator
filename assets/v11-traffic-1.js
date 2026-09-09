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
  if(!state.trafficMode||typeof state.trafficMode!=='object'||Array.isArray(state.trafficMode))state.trafficMode={};
  if(!state.anchorStage||typeof state.anchorStage!=='object'||Array.isArray(state.anchorStage))state.anchorStage={};
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
  dom.scalingFields.querySelectorAll('input').forEach(input=>input.disabled=!state.scalingEnabled);
  dom.scalingFields.style.opacity=state.scalingEnabled?'1':'.45';dom.scalingFields.style.pointerEvents=state.scalingEnabled?'auto':'none';
  dom.cohortDetails.hidden=!cfg.cohort;dom.cohortEnabled.checked=!!state.cohortEnabled;
  dom.cohortFields.innerHTML='';
  if(cfg.cohort)[field('churnRate','churnRate','churnRateHelp','percent'),field('projectionMonths','projectionMonths','projectionMonthsHelp','number')].forEach(def=>dom.cohortFields.append(fieldHtml(def,'cohort')));
  dom.cohortFields.querySelectorAll('input').forEach(input=>input.disabled=!state.cohortEnabled);
  dom.cohortFields.style.opacity=state.cohortEnabled?'1':'.45';dom.cohortFields.style.pointerEvents=state.cohortEnabled?'auto':'none';
  dom.addStage.disabled=currentStages().length>=20;
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
    name.maxLength=120;name.setAttribute('aria-label',L('Назва етапу','Stage name')+' '+(i+1));
    rate.min='0';rate.max='100';rate.setAttribute('aria-label',t('stageConversion')+' '+(i+1));
    del.setAttribute('aria-label',t('deleteStage')+' '+(i+1));
    name.oninput=()=>{
      if(state.lang==='uk')s.nameUk=name.value;else s.nameEn=name.value;
      const option=document.querySelector(`#anchorStageSelect option[value="${CSS.escape(s.id)}"]`);if(option)option.textContent=name.value;
      if(dom.funnelEditor.children[i+1])dom.funnelEditor.children[i+1].querySelector('.stage-source').textContent=name.value+' →';
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

Object.assign(I18N.uk,{
 invalid:'Заповни обов’язкові поля та перевір значення',numericOverflow:'Значення завеликі або вартість трафіку замала для надійного розрахунку.',
 storageError:'Автозбереження недоступне. Збережи сценарій посиланням або експортуй звіт.',scenarioError:'Не вдалося відкрити сценарій із посилання.',
 revenue:'Прогнозна виручка',profit:'Прибуток моделі',netProfit:'Прибуток моделі',totalCosts:'Бюджет + агентські + фіксовані',
 cashGap:'Витрати залучення до виплати',paybackDate:'Сьогодні + строк холду',
 limitsHint:'За незмінного бюджету, CR, маржі та фіксованих витрат',
 crDropHelp:'Падіння загальної CR активної воронки за подвоєння бюджету, розподілене між її етапами.',
 fixedCostsHelp:'Витрати за той самий період, що й бюджет. У масштабуванні та когорті враховуються один раз.',
 holdDaysHelp:'Затримка виплати. Сьогодні використовується лише як умовна дата початку холду.',
 activeRateHelp:'Частка активної аудиторії через 30 днів. Порожньо = невідомо, 0% = жодного активного.',
 projectionMonthsHelp:'Ціле число від 1 до 36 місяців.',
 cohortForecastHint:'Внесок після собівартості, платіжних комісій і податків; без графіка фактичних виплат.',
 monthlyGrossProfit:'Внесок за місяць',cumulativeGrossProfit:'Накопичений внесок',ltv3:'Чистий внесок / клієнт, 3 міс.',ltv6:'Чистий внесок / клієнт, 6 міс.',ltv12:'Чистий внесок / клієнт, 12 міс.',
 weakestStage:'Найбільша втрата за кількістю',noScaleLimit:'Модель не задає верхньої межі',noProfitableScale:'Немає беззбиткового бюджету вище поточного',
 withinTarget:'Ціну результату втримано',aboveTarget:'Ціна результату вища за ціль',atBreakEven:'Модель на межі беззбитковості',
 noRevenueValue:'Цінність результату не задана: оцінюємо ціну залучення, прибуток і ROI невідомі.',
 noPaidResults:'Оплачених результатів немає. Витрати залишаються, CPA поки не визначений.',
 noUnitMargin:'Внесок з результату нульовий або від’ємний. Зниження CPC саме по собі не зробить модель прибутковою.',
 impossibleCvr:'Потрібна CR перевищує 100%. За поточних витрат, ціни та маржі сама воронка не виведе модель у нуль.',
 snapshotHint:'Сценарії зберігають результат на момент запису. Різні валюти не конвертуються.',
 currencyHelp:'Валюта введених сум. Зміна валюти не перераховує числа за курсом.',
 cashAssumption:'Показано лише рекламний бюджет, агентські та фіксовані витрати на введений обсяг. Без щоденного spend, строків витрат і графіка надходжень резерв для безперервного заливу невідомий.',
 cohortAssumption:'Когорта містить лише залучених клієнтів без нових покупців; churn починається після першого місяця. Lifetime у головній моделі та churn у когорті — окремі припущення. Холд у payback не враховано.',
 disclaimer:' прогноз залежить від введених припущень. Маржа враховує собівартість; платіжні комісії й податки віднімаються від виручки, агентська комісія — від бюджету. LTV не означає кошти на рахунку.'
});
Object.assign(I18N.en,{
 invalid:'Complete required inputs and check the values',numericOverflow:'Values are too large or traffic cost is too small for a reliable calculation.',
 storageError:'Autosave is unavailable. Copy a scenario link or export the report.',scenarioError:'Could not open the scenario link.',
 revenue:'Forecast revenue',profit:'Model profit',netProfit:'Model profit',totalCosts:'Ad spend + agency + fixed costs',
 cashGap:'Acquisition costs before payout',paybackDate:'Today + hold duration',limitsHint:'At unchanged budget, CR, margin and fixed costs',
 crDropHelp:'Decline in the overall active funnel CR per budget doubling, distributed across its stages.',
 fixedCostsHelp:'Costs for the same period as ad spend. Counted once in scaling and cohort models.',
 holdDaysHelp:'Payout delay. Today is used only as an assumed start of the hold.',activeRateHelp:'Audience still active after 30 days. Blank = unknown; 0% = no active users.',
 projectionMonthsHelp:'An integer from 1 to 36 months.',cohortForecastHint:'Contribution after cost of goods, payment fees and taxes; not a cash receipt schedule.',
 monthlyGrossProfit:'Monthly contribution',cumulativeGrossProfit:'Cumulative contribution',ltv3:'Contribution / customer, 3M',ltv6:'Contribution / customer, 6M',ltv12:'Contribution / customer, 12M',
 weakestStage:'Largest loss by volume',noScaleLimit:'No upper ceiling in this model',noProfitableScale:'No break-even budget above the current one',
 withinTarget:'Result cost is within target',aboveTarget:'Result cost is above target',atBreakEven:'Model is at break-even',
 noRevenueValue:'No result value is provided: acquisition cost is measurable; profit and ROI are unknown.',
 noPaidResults:'There are no paid results. Costs remain; CPA is undefined.',
 noUnitMargin:'Contribution per result is zero or negative. Lowering CPC alone cannot make this model profitable.',
 impossibleCvr:'Required CR exceeds 100%. The funnel alone cannot break even at the current costs, value and margin.',
 snapshotHint:'Scenarios are snapshots of results when saved. Different currencies are not converted.',
 currencyHelp:'Currency of entered amounts. Changing it does not convert numbers using exchange rates.',
 cashAssumption:'Only ad spend, agency and fixed costs for the entered volume are shown. Continuous-buying reserves require daily spend, cost timing and a payout schedule.',
 cohortAssumption:'Only acquired customers are included, with no new acquisitions; churn starts after month one. Main-model lifetime and cohort churn are separate assumptions. Payback excludes hold delays.',
 disclaimer:' the forecast depends on entered assumptions. Margin includes cost of goods; payment fees and revenue taxes are deducted from revenue, agency fees from ad spend. LTV is not cash in the bank.'
});
