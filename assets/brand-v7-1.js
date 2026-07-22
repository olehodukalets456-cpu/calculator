
'use strict';
Object.assign(I18N.uk,{"trafficModeLabel": "Як рахувати кліки", "trafficByCpc": "Через CPC", "trafficByCpm": "Через CPM + CTR", "cpcModeHint": "Введи бюджет і фактичний або плановий CPC.", "cpmModeHint": "CPM рахується по показах. Кліки = покази × CTR. Охоплення необов’язкове й потрібне для частоти.", "cpm": "CPM", "cpmHelp": "Вартість 1 000 показів.", "ctr": "CTR", "ctrHelp": "Частка показів, які дали клік.", "reach": "Охоплення", "reachHelp": "Необов’язково. Унікальні користувачі за той самий період. Потрібно для частоти.", "errorReachTooHigh": "Охоплення не може бути більшим за кількість показів.", "errorStage": "Введи CR етапу більше 0 і не більше 100%.", "fixInputs": "Що треба виправити", "incompleteData": "Заповни обов’язкові поля — після цього результат з’явиться автоматично.", "calculationError": "Сталася помилка розрахунку. Скинь поточну вертикаль або онови сторінку.", "impressions": "Покази", "reachMetric": "Охоплення", "frequency": "Частота", "effectiveCpc": "Розрахунковий CPC", "engagements": "Взаємодії", "engagementsHelp": "Необов’язково. Лайки, коментарі, збереження, поширення та інші цільові взаємодії за період.", "audienceBase": "База аудиторії", "audienceBaseHelp": "Необов’язково. Середня або стартова кількість підписників за період. Потрібна для ER за підписниками.", "engagementsMetric": "Взаємодії", "costPerEngagement": "Ціна взаємодії", "errReach": "ERR за охопленням", "erImpressions": "ER за показами", "erAudience": "ER за підписниками", "brandMetricsTitle": "Бренд-метрики та цілі", "brandMoneyHint": "Ціна, утримання та ER"});
Object.assign(I18N.en,{"trafficModeLabel": "How to calculate clicks", "trafficByCpc": "From CPC", "trafficByCpm": "From CPM + CTR", "cpcModeHint": "Enter ad spend and actual or planned CPC.", "cpmModeHint": "CPM is based on impressions. Clicks = impressions × CTR. Reach is optional and is used to calculate frequency.", "cpm": "CPM", "cpmHelp": "Cost per 1,000 impressions.", "ctr": "CTR", "ctrHelp": "Share of impressions that produced a click.", "reach": "Reach", "reachHelp": "Optional. Unique users for the same period. Used to calculate frequency.", "errorReachTooHigh": "Reach cannot be higher than impressions.", "errorStage": "Enter a stage CR above 0 and no more than 100%.", "fixInputs": "What to fix", "incompleteData": "Complete the required fields and the result will appear automatically.", "calculationError": "A calculation error occurred. Reset the current vertical or reload the page.", "impressions": "Impressions", "reachMetric": "Reach", "frequency": "Frequency", "effectiveCpc": "Calculated CPC", "engagements": "Engagements", "engagementsHelp": "Optional. Likes, comments, saves, shares, and other target engagements for the period.", "audienceBase": "Audience base", "audienceBaseHelp": "Optional. Average or starting follower count for the period. Used for follower-based ER.", "engagementsMetric": "Engagements", "costPerEngagement": "Cost per engagement", "errReach": "ERR by reach", "erImpressions": "ER by impressions", "erAudience": "ER by followers", "brandMetricsTitle": "Brand metrics and targets", "brandMoneyHint": "Cost, retention, and ER"});

VERTICALS.brand.money=[
  f('brandResultValue','brandResultValue','brandResultValueHelp','money',false),
  f('brandTargetCost','brandTargetCost','brandTargetCostHelp','money',false),
  f('activeRate','activeRate','activeRateHelp','percent',false),
  f('engagements','engagements','engagementsHelp','number',false),
  f('audienceBase','audienceBase','audienceBaseHelp','number',false),
  f('fixedCosts','fixedCosts','fixedCostsHelp','money',false)
];
VERTICALS.brand.defaults={...VERTICALS.brand.defaults,cpm:'',ctr:'',reach:'',engagements:'',audienceBase:''};
state.trafficMode=state.trafficMode||{};

(function mountV7Ui(){
  const trafficSection=dom.trafficFields.closest('.input-section');
  let modeBox=document.querySelector('#trafficModeBox');
  if(!modeBox){
    modeBox=document.createElement('div'); modeBox.id='trafficModeBox'; modeBox.className='traffic-mode-box';
    modeBox.innerHTML='<div class="traffic-mode-head"><strong data-i18n="trafficModeLabel">Як рахувати кліки</strong><div id="trafficMode" class="segmented"></div></div><p id="trafficModeHint" class="basis-hint"></p>';
    trafficSection.insertBefore(modeBox,dom.trafficFields);
  }
  let derived=document.querySelector('#trafficDerived');
  if(!derived){ derived=document.createElement('div'); derived.id='trafficDerived'; derived.className='traffic-derived'; derived.hidden=true; dom.trafficFields.after(derived); }
  const trafficHeader=trafficSection.querySelector('.input-section-header span'); if(trafficHeader) trafficHeader.id='trafficHintText';
  const moneySection=dom.moneyFields.closest('.input-section'); const moneyTitle=moneySection.querySelector('.input-section-header strong'); if(moneyTitle) moneyTitle.id='moneyTitleText';
  const moneyHint=moneySection.querySelector('.input-section-header span'); if(moneyHint) moneyHint.id='moneyHintText';
  let validation=document.querySelector('#validationSummary');
  if(!validation){ validation=document.createElement('div'); validation.id='validationSummary'; validation.className='validation-summary'; validation.hidden=true; }
  const actions=dom.copy.closest('.actions');
  if(!validation.parentElement) actions.before(validation);
  let quick=document.querySelector('#quickResult');
  if(!quick){ quick=document.createElement('div'); quick.id='quickResult'; quick.className='quick-result'; quick.hidden=true; quick.innerHTML='<div class="quick-result-item"><span data-i18n="finalResult">Фінальний результат</span><strong id="quickFinal">—</strong></div><div class="quick-result-item"><span data-i18n="costPerFinal">Ціна фінального результату</span><strong id="quickCost">—</strong></div>'; actions.before(quick); }
  Object.assign(dom,{trafficModeBox:modeBox,trafficMode:document.querySelector('#trafficMode'),trafficModeHint:document.querySelector('#trafficModeHint'),trafficHintText:document.querySelector('#trafficHintText'),trafficDerived:derived,validationSummary:validation,quickResult:quick,quickFinal:document.querySelector('#quickFinal'),quickCost:document.querySelector('#quickCost'),moneyTitleText:document.querySelector('#moneyTitleText'),moneyHintText:document.querySelector('#moneyHintText')});
})();
let validationErrors=[];
