function buildRecommendations(r,resultTone){
const {rows,weakest}=getFunnelAnalysis(r);
const recs=[];
const ua=state.language==='uk';
const transition=(from,to)=>`«${from} → ${to}»`;
const lastTransition=rows.length>1?rows.at(-1):null;
const previousToLast=rows.length>1?rows.at(-2):null;
if(weakest){
const from=rows[weakest.index-1].label;
const to=weakest.label;
const pair=transition(from,to);
const rate=pct(weakest.rate);
const first=weakest.index===1;
const final=weakest.index===rows.length-1;
if(state.vertical==='ecom' && (first||final)){
recs.push(ua
? `Найслабший перехід — ${pair} (${rate}). Тут спочатку перевір не CPC, а зв’язку креатив → сторінка → чек-аут: чи збігаються ціна й офер, чи одразу видно доставку, повернення та CTA, чи немає зайвих кроків на мобільному. Розбий цю CR по креативах і плейсментах — так стане видно, проблема в якості трафіку чи в сторінці.`
: `The weakest transition is ${pair} (${rate}). Check the creative → product page → checkout chain before blaming CPC: price and offer consistency, visible shipping/returns/CTA, and mobile friction. Split this conversion by creative and placement to see whether the issue is traffic quality or the page.`);
} else if(first && (state.vertical==='leadgen'||state.vertical==='edtech')){
recs.push(ua
? `Найслабший перехід — ${pair} (${rate}). Низький click-to-lead зазвичай означає розрив між обіцянкою в рекламі та формою або лендом. Перевір довжину форми, перший екран, швидкість і CTA, але паралельно дивись якість ліда по кожному креативу та аудиторії — дешевший лід не має сенсу, якщо далі він не кваліфікується.`
: `The weakest transition is ${pair} (${rate}). Low click-to-lead usually points to a mismatch between the ad promise and the form or landing page. Check form length, first screen, speed, and CTA, while also comparing downstream lead quality by creative and audience—cheaper leads do not help if they fail qualification.`);
} else if(first && state.vertical==='saas'){
recs.push(ua
? `Найслабший перехід — ${pair} (${rate}). Перевір, чи креатив приводить саме на ту цінність, яку людина бачить на першому екрані, і скільки тертя є до signup/trial. Окремо порівняй не лише signup rate, а й подальшу активацію по джерелах — канал із дорожчим signup може давати значно більше paid-клієнтів.`
: `The weakest transition is ${pair} (${rate}). Check whether the value promised in the creative is immediately visible on the first screen and how much friction exists before signup/trial. Compare not only signup rate but also downstream activation by source—a more expensive signup can still produce far more paid customers.`);
} else if(final && (state.vertical==='leadgen'||state.vertical==='edtech')){
recs.push(ua
? `Найслабший перехід — ${pair} (${rate}). На цьому етапі проблема вже не обов’язково в закупці кліку. Розклади відмови на причини: не зв’язались, не підходить, дорого, не готовий, відвалився на оплаті. Потім порівняй результат по джерелах і менеджерах — так відділиш слабкий трафік від проблеми в продажі або самому офері.`
: `The weakest transition is ${pair} (${rate}). At this point the issue is not necessarily media buying. Break losses into reasons: unreachable, unqualified, price objection, not ready, or payment drop-off. Then compare by source and sales rep to separate weak traffic from a sales-process or offer problem.`);
} else if(final && state.vertical==='saas'){
recs.push(ua
? `Найслабший перехід — ${pair} (${rate}). Для SaaS це зазвичай питання активації, а не просто paywall. Подивись, яку ключову дію роблять paid-клієнти до оплати, і порівняй її по джерелах. Якщо trial є, перевір onboarding, нагадування та момент показу тарифу — користувач має відчути цінність до прохання заплатити.`
: `The weakest transition is ${pair} (${rate}). In SaaS this is usually an activation issue, not just the paywall. Identify the key action paid users complete before upgrading and compare it by source. If there is a trial, review onboarding, reminders, and paywall timing—the user should feel value before being asked to pay.`);
} else if(state.vertical==='ecom'){
recs.push(ua
? `Найслабший перехід — ${pair} (${rate}). Перевір аналітику події та сам крок: наявність товару, умови доставки, помилки форми, способи оплати й мобільну версію. Якщо просідання різке лише в окремому джерелі, проблема, скоріше за все, у невідповідності трафіку; якщо всюди — у самому кроці воронки.`
: `The weakest transition is ${pair} (${rate}). Verify both event tracking and the step itself: stock, shipping terms, form errors, payment methods, and mobile UX. If the drop appears only in one source, traffic mismatch is more likely; if it appears everywhere, the funnel step itself is the issue.`);
} else {
recs.push(ua
? `Найслабший перехід — ${pair} (${rate}). Не оптимізуй його лише за загальною цифрою: розбий перехід по джерелах, креативах, пристроях і менеджерах. Якщо провал локальний — чисть сегмент; якщо системний — змінюй сам процес, офер або комунікацію на цьому етапі.`
: `The weakest transition is ${pair} (${rate}). Do not optimize from the blended number alone: split it by source, creative, device, and sales owner. If the problem is local, cut the segment; if it is systematic, change the process, offer, or communication at this stage.`);
}
}
if(!(state.vertical==='brand'&&!r.brandHasValue)&&resultTone==='negative'&&weakest&&weakest.rate>0&&r.overallCvr>0&&Number.isFinite(r.requiredCvr)){
const otherStages=r.overallCvr/weakest.rate;
const neededRate=otherStages>0?r.requiredCvr/otherStages:Infinity;
if(Number.isFinite(neededRate)&&neededRate>weakest.rate&&neededRate<=1){
recs.push(ua
? `Якщо CPC та всі інші етапи не зміняться, перехід «${rows[weakest.index-1].label} → ${weakest.label}» має зрости з ${pct(weakest.rate)} до приблизно ${pct(neededRate)}, щоб дійти до нуля. Це дає конкретну ціль для тесту, а не абстрактне “покращити воронку”.`
: `If CPC and every other stage stay unchanged, the “${rows[weakest.index-1].label} → ${weakest.label}” transition needs to rise from ${pct(weakest.rate)} to about ${pct(neededRate)} to break even. This creates a concrete test target instead of a vague “improve the funnel”.`);
} else if(Number.isFinite(neededRate)&&neededRate>1){
recs.push(ua
? `Навіть 100% конверсії на найслабшому етапі недостатньо для виходу в нуль за поточного CPC та економіки. Тут не варто нескінченно докручувати ленд або скрипт — треба одночасно змінювати CPC, чек, маржу, LTV чи сам офер.`
: `Even 100% conversion at the weakest stage would not reach break-even with the current CPC and unit economics. Do not endlessly optimise the page or script — CPC, price, margin, LTV, or the offer must also change.`);
}
}
if(!(state.vertical==='brand'&&!r.brandHasValue)){
const cpcCut=r.cpc>0&&Number.isFinite(r.maxCpc)?Math.max(0,1-Math.max(0,r.maxCpc)/r.cpc):NaN;
const cvrLift=r.overallCvr>0&&Number.isFinite(r.requiredCvr)?Math.max(0,r.requiredCvr/r.overallCvr-1):NaN;
if(resultTone==='negative'){
let priority='';
if(Number.isFinite(cpcCut)&&Number.isFinite(cvrLift)){
priority=cpcCut<=cvrLift
? (ua?`Менший розрив зараз у CPC: ціль — не вище ${money(Math.max(0,r.maxCpc))}.`:`The smaller gap is currently in CPC: target no more than ${money(Math.max(0,r.maxCpc))}.`)
: (ua?`Менший розрив зараз у конверсії: загальна CR має зрости до ${pct(r.requiredCvr)}.`:`The smaller gap is currently in conversion: overall CR needs to reach ${pct(r.requiredCvr)}.`);
}
recs.push(ua
? `Кампанія дає ${money(Math.abs(r.profit))} збитку. До нуля є два вимірювані шляхи: CPC ≤ ${money(Math.max(0,r.maxCpc))} або загальна CR ≥ ${pct(r.requiredCvr)}. ${priority} Другий показник залиш контрольним, щоб економія на трафіку не зіпсувала якість.`
: `The campaign is losing ${money(Math.abs(r.profit))}. There are two measurable paths to break-even: CPC ≤ ${money(Math.max(0,r.maxCpc))} or overall CR ≥ ${pct(r.requiredCvr)}. ${priority} Keep the second metric as a control so cheaper traffic does not destroy quality.`);
} else if(resultTone==='warning'){
recs.push(ua
? `Запас до беззбитковості лише ${pct(Math.max(0,r.safety))}. Масштабування зараз ризикове: зафіксуй стоп-ліміт CPA на рівні ${money(Math.max(0,r.maxCpa))} і спочатку підтягни найслабший перехід. Інакше невелике зростання CPC або просідання CR з’їсть увесь плюс.`
: `The break-even buffer is only ${pct(Math.max(0,r.safety))}. Scaling is risky now: set a hard CPA limit at ${money(Math.max(0,r.maxCpa))} and improve the weakest transition first. A small CPC increase or CR drop can erase the entire profit.`);
} else {
recs.push(ua
? `Запас до беззбитковості — ${pct(Math.max(0,r.safety))}. Масштабуй бюджет кроками приблизно по 15–20%, але не допускай CPA вище ${money(Math.max(0,r.maxCpa))}. Після кожного кроку дивись не лише загальний CPA, а й чи не погіршився найслабший перехід — саме він першим покаже, що аудиторія почала вигоряти.`
: `The break-even buffer is ${pct(Math.max(0,r.safety))}. Scale in roughly 15–20% budget steps, but do not let CPA exceed ${money(Math.max(0,r.maxCpa))}. After each step, watch not only blended CPA but also the weakest transition—it will usually show audience fatigue first.`);
}
}
if((state.vertical==='leadgen'||state.vertical==='edtech')&&lastTransition&&previousToLast&&r.overallCvr>0&&r.requiredCvr>r.overallCvr){
const preFinalCvr=r.clicks>0?previousToLast.value/r.clicks:0;
const neededFinal=preFinalCvr>0?r.requiredCvr/preFinalCvr:Infinity;
if(Number.isFinite(neededFinal)&&neededFinal>lastTransition.rate&&neededFinal<=1){
recs.push(ua
? `Без зміни CPC та верхньої частини воронки фінальний перехід ${transition(previousToLast.label,lastTransition.label)} має зрости з ${pct(lastTransition.rate)} до приблизно ${pct(neededFinal)}. Перевір причини відмов, швидкість контакту, кількість повторних дотиків і конверсію окремо по менеджерах — це покаже, чи ціль реальна без зміни офера.`
: `Without changing CPC or the upper funnel, the final transition ${transition(previousToLast.label,lastTransition.label)} needs to rise from ${pct(lastTransition.rate)} to about ${pct(neededFinal)}. Review loss reasons, contact speed, follow-up count, and conversion by sales rep to see whether that target is realistic without changing the offer.`);
}
}
if(state.vertical==='ecom'){
const margin=(Number(r.v.margin)||0)/100;
const firstContribution=(Number(r.v.aov)||0)*margin;
const ltvContribution=Math.max(Number(r.v.customerLtv)||0,Number(r.v.aov)||0)*margin;
if(r.basis==='ltv'&&firstContribution<r.allInCpa&&ltvContribution>=r.allInCpa){
recs.push(ua
? `Модель виходить у плюс лише за рахунок LTV: валовий внесок першого замовлення — ${money(firstContribution)}, а all-in CAC — ${money(r.allInCpa)}. Перед масштабуванням перевір, за скільки часу приходять повторні покупки та який відсоток повернень; інакше прибуток на папері може створити касовий розрив.`
: `The model is profitable only because of LTV: first-order gross contribution is ${money(firstContribution)}, while all-in CAC is ${money(r.allInCpa)}. Before scaling, verify how quickly repeat purchases arrive and the refund rate; otherwise paper profit can create a cash-flow gap.`);
} else if(Number.isFinite(r.breakEvenRoas)&&r.breakEvenRoas>=2.5){
recs.push(ua
? `ROAS у нуль — ${ratio(r.breakEvenRoas)}, тому модель сильно залежить від маржі та чека. Тут часто вигідніше підняти валовий дохід з покупки — наборами, upsell, порогом безкоштовної доставки або меншою знижкою — ніж нескінченно полювати за дешевшим CPC.`
: `Break-even ROAS is ${ratio(r.breakEvenRoas)}, so the model is highly sensitive to margin and order value. Increasing gross revenue per order through bundles, upsells, free-shipping thresholds, or smaller discounts can be more effective than endlessly chasing cheaper CPC.`);
}
}
if(state.vertical==='saas'){
if(Number.isFinite(r.ltvCac)&&Number.isFinite(r.payback)&&(r.ltvCac<3||r.payback>6)){
recs.push(ua
? `Для SaaS LTV:CAC зараз ${ratio(r.ltvCac)}, payback — ${count(r.payback)} міс. Якщо це нижче 3× або довше 6 місяців, масштабування тиснутиме на кеш. Пріоритет: активація в перші дні, зниження churn, річний план або передплата, і лише потім — більший бюджет.`
: `For SaaS, LTV:CAC is ${ratio(r.ltvCac)} and payback is ${count(r.payback)} months. If this is below 3× or longer than 6 months, scaling will pressure cash flow. Prioritize early activation, lower churn, annual plans or prepayment, and only then increase media spend.`);
}
}
const fixedShare=r.totalCosts>0?r.fixed/r.totalCosts:0;
if(fixedShare>=.1&&Number.isFinite(r.cpa)&&Number.isFinite(r.allInCpa)){
const delta=r.allInCpa-r.cpa;
recs.push(ua
? `У рекламному кабінеті CPA — ${money(r.cpa)}, але з командою, fee та сервісами all-in CPA вже ${money(r.allInCpa)} (+${money(Math.max(0,delta))}). Рішення про масштабування приймай по all-in CPA, інакше кабінет виглядатиме прибутковим, а проєкт — ні.`
: `Platform CPA is ${money(r.cpa)}, but after team, fees, and tools the all-in CPA is ${money(r.allInCpa)} (+${money(Math.max(0,delta))}). Make scaling decisions from all-in CPA; otherwise the ad account can look profitable while the project is not.`);
}
if(r.sales>0&&r.sales<10){
recs.push(ua
? `Фінальних конверсій лише ${count(r.sales)}. На такій вибірці ROI та CR можуть сильно стрибати через 1–2 події. Не перебудовуй воронку після одного дня: спочатку добери хоча б 10–20 фінальних результатів або об’єднай довший період.`
: `There are only ${count(r.sales)} final conversions. At this sample size, one or two events can move ROI and CR sharply. Do not rebuild the funnel from a single day—collect at least 10–20 final outcomes or use a longer period first.`);
}
return recs.slice(0,5);
}
