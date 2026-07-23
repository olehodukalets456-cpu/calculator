function renderDashboard(r){
 dom.dashboardFunnel.innerHTML=r.funnel.map((s,i)=>`<div class="dashboard-stage"><strong>${esc(s.label)}</strong><span>${count(s.value)}</span><small>${i?`${pct(s.rate*100)} · -${count(s.drop)}`:'100%'}</small></div>`).join('');
 let weakest={i:0,drop:-1};r.funnel.slice(1).forEach((s,i)=>{if(s.drop>weakest.drop)weakest={i:i+1,drop:s.drop}});
 dom.dashboardStats.innerHTML=[
  compare(t('weakestStage'),r.funnel[weakest.i]?.label||'—'),compare(t('finalConversion'),pct(r.overallCvr)),compare(t('costPerFinal'),money(r.allInCpa)),compare(t('approveRate'),pct(r.approve*100))
 ].join('');
 const recs=buildRecommendations(r,weakest.i);
 dom.recommendations.innerHTML=recs.map(x=>`<div class="recommendation ${x.tone||''}">${esc(x.text)}</div>`).join('');
}
function stageAdvice(label){
 const x=label.toLowerCase();
 if(/профіл|канал|visit|click|перехід/.test(x))return L('Перевір зв’язку креатив → обіцянка → перший екран. Якщо люди клікають, але не доходять до профілю або каналу, проблема частіше в невідповідності меседжу, швидкості завантаження або випадковому трафіку.','Check the creative → promise → first screen chain. If users click but do not reach the profile or channel, the issue is often message mismatch, load speed, or low-intent traffic.');
 if(/підпис|follow|subscription|brand action/.test(x))return L('Підсиль причину підписатися саме зараз: зрозумілий опис користі, сильні закріплені матеріали, контент-прев’ю та один чіткий CTA. Дешевий перехід без підписки не дає цінності.','Strengthen the reason to follow now: clear value, strong pinned content, a content preview, and one clear CTA. A cheap visit without a follow has little value.');
 if(/лід|lead|signup|trial|анкета|application/.test(x))return L('Розклади втрату на дві причини: слабка мотивація та зайве тертя. Перевір офер, кількість полів, довіру, швидкість форми й відповідність аудиторії обіцянці в рекламі.','Split the loss into two causes: weak motivation and excess friction. Check the offer, field count, trust, form speed, and whether the audience matches the ad promise.');
 if(/кваліф|qualif/.test(x))return L('Низька кваліфікація означає, що реклама купує не тих людей або обіцяє не те. Порівняй креативи за часткою кваліфікованих лідів, а не лише за CPL, і додай ранню фільтрацію.','Low qualification means the ads attract the wrong people or make the wrong promise. Compare creatives by qualified-lead share, not only CPL, and add earlier filtering.');
 if(/дзвін|call|sale|продаж/.test(x))return L('Перевір швидкість першого контакту, кількість спроб, скрипт і головні відмови. Якщо ліди якісні, але продажів мало, зниження CPC не вилікує проблему відділу продажів.','Check speed to lead, contact attempts, the script, and main objections. If leads are qualified but sales are weak, a lower CPC will not fix the sales process.');
 if(/оплат|payment|purchase|покуп/.test(x))return L('Шукай бар’єр між наміром і оплатою: ціна, спосіб платежу, довіра, дедлайн, повернення та технічні помилки. Окремо дивись, скільки людей почали checkout і не завершили.','Look for friction between intent and payment: price, payment method, trust, deadlines, refunds, and technical errors. Track checkout starts versus completed payments separately.');
 if(/paid|платн/.test(x))return L('Для trial → paid ключові речі: швидкість до першої користі, onboarding, активація ключової функції, нагадування перед завершенням trial і зрозуміла різниця між free та paid.','For trial → paid, focus on time to value, onboarding, activation of the core feature, reminders before trial end, and a clear free-versus-paid difference.');
 return L('Перевір цей етап окремим зрізом: джерело трафіку, креатив, пристрій, GEO і день. Середня CR може приховувати одну зв’язку, яка зливає більшість бюджету.','Break this stage down by traffic source, creative, device, GEO, and day. The average CR can hide one combination that wastes most of the budget.');
}
function buildRecommendations(r,weakIndex){
 const recs=[],vals=state.values[state.vertical],weak=r.funnel[weakIndex];
 if(weakIndex>0)recs.push({tone:'warning',text:L(
  `Найбільша абсолютна втрата — на етапі «${weak.label}»: відсіюється ${count(weak.drop)} користувачів, проходить ${pct(weak.rate*100)}. ${stageAdvice(weak.label)}`,
  `The largest absolute loss is at “${weak.label}”: ${count(weak.drop)} users drop off and ${pct(weak.rate*100)} continue. ${stageAdvice(weak.label)}`
 )});
 if(Number.isFinite(r.maxCpc)&&r.cpc>r.maxCpc)recs.push({tone:'negative',text:L(
  `Проблема вже на рівні закупки: CPC ${money(r.cpc)} вищий за беззбитковий ${money(r.maxCpc)}. Потрібно знизити ціну кліку приблизно на ${pct((1-r.maxCpc/r.cpc)*100)} або підняти цінність фінальної конверсії.`,
  `The problem already starts at traffic cost: CPC ${money(r.cpc)} is above the break-even ${money(r.maxCpc)}. Reduce CPC by about ${pct((1-r.maxCpc/r.cpc)*100)} or increase the value of the final conversion.`
 )});
 else if(Number.isFinite(r.requiredCvr)&&r.requiredCvr>r.overallCvr)recs.push({tone:'negative',text:L(
  `Поточна фінальна CR — ${pct(r.overallCvr)}, а для нуля потрібно ${pct(r.requiredCvr)}. Це приріст у ${((r.requiredCvr/r.overallCvr)||0).toFixed(2)}×. Не розмазуй оптимізацію по всій воронці: почни з етапу, де найбільша втрата в людях і є зрозуміла операційна причина.`,
  `Current final CR is ${pct(r.overallCvr)}, while break-even requires ${pct(r.requiredCvr)} — a ${((r.requiredCvr/r.overallCvr)||0).toFixed(2)}× lift. Do not optimize everything at once; start with the stage that loses the most users and has a clear operational cause.`
 )});
 if(r.approve<.85)recs.push({tone:'negative',text:L(
  `Approve лише ${pct(r.approve*100)}. Частина “дешевих” конверсій не монетизується. Розбий approve за креативами, джерелами та GEO і оптимізуй під approved CPA, а не під цифру в кабінеті.`,
  `Approve is only ${pct(r.approve*100)}. Some “cheap” conversions never monetize. Break approve down by creative, source, and GEO, and optimize for approved CPA rather than the platform CPA.`
 )});
 if(r.refund>.08)recs.push({tone:'warning',text:L(
  `Refund / chargeback — ${pct(r.refund*100)}. Перевір джерела з найбільшою часткою повернень, очікування в креативах, якість продукту та платіжний флоу. ROAS до refund тут оманливий.`,
  `Refund / chargeback is ${pct(r.refund*100)}. Check the sources with the highest refund share, ad expectations, product quality, and payment flow. Pre-refund ROAS is misleading here.`
 )});
 const feeShare=r.grossRevenue>0?(r.fees/r.grossRevenue*100):0;
 if(feeShare>15)recs.push({tone:'warning',text:L(
  `Комісії, податки та сервісний fee забирають ${pct(feeShare)} виручки. Порівнюй кампанії за чистим contribution після цих витрат, інакше масштабування виглядатиме кращим, ніж є насправді.`,
  `Fees, taxes, and service charges consume ${pct(feeShare)} of revenue. Compare campaigns by contribution after these costs, otherwise scaling will look better than it really is.`
 )});
 if(r.holdDays>=14)recs.push({tone:'warning',text:L(
  `Холд ${r.holdDays} днів заморожує приблизно ${money(r.heldAmount)} виплати. Для безперервного заливу тримай cash buffer не менше ${money(r.cashGap)} на один цикл; при масштабуванні збільшуй його пропорційно бюджету.`,
  `A ${r.holdDays}-day hold delays about ${money(r.heldAmount)} in payouts. Keep at least ${money(r.cashGap)} as cash buffer for one cycle and scale it with spend.`
 )});
 if(state.scalingEnabled&&r.scaled){
  const roiDrop=r.roi-r.scaled.roi;
  if(r.scaled.profit<0)recs.push({tone:'negative',text:L(
   `Після масштабування модель переходить у мінус: прогнозний ROI ${pct(r.scaled.roi)}. CPC росте до ${money(r.scaled.cpc)}, а фінальна CR падає до ${pct(r.scaled.overallCvr)}. Орієнтовна межа плюсового бюджету — ${money(r.maxScaleBudget)}.`,
   `The scaled model turns negative with forecast ROI ${pct(r.scaled.roi)}. CPC rises to ${money(r.scaled.cpc)} while final CR falls to ${pct(r.scaled.overallCvr)}. Estimated profitable budget ceiling: ${money(r.maxScaleBudget)}.`
  )});
  else if(roiDrop>10)recs.push({tone:'warning',text:L(
   `Масштабування лишається плюсовим, але ROI падає на ${pct(roiDrop)}. Підвищуй бюджет кроками й після кожного кроку звіряй фактичні CPC та CR з моделлю.`,
   `Scaling remains profitable, but ROI drops by ${pct(roiDrop)}. Increase budget in steps and compare actual CPC and CR with the model after each step.`
  )});
 }
 if(r.cohort){
  if(r.cohort.payback===null)recs.push({tone:'negative',text:L(
   `Когорта не повертає витрати за ${r.cohort.months} міс. Поточний CAC не підтримується ARPU, маржею та churn. Потрібно зменшувати CAC, скорочувати churn або піднімати місячний дохід.`,
   `The cohort does not recover acquisition costs within ${r.cohort.months} months. Current CAC is not supported by ARPU, margin, and churn. Reduce CAC, lower churn, or increase monthly revenue.`
  )});
  else if(r.cohort.payback>6)recs.push({tone:'warning',text:L(
   `Payback — ${r.cohort.payback} міс. Перевір churn у перші 1–2 місяці: саме ранній відтік найсильніше ламає довгий LTV і потребу в cash buffer.`,
   `Payback is ${r.cohort.payback} months. Check churn in months 1–2: early churn has the largest impact on long-term LTV and cash needs.`
  )});
 }
 if(state.vertical==='brand'){
  const target=n(vals.brandTargetCost),active=clamp(n(vals.activeRate),0,100);
  if(target>0&&r.allInCpa>target)recs.push({tone:'negative',text:L(
   `All-in ціна результату ${money(r.allInCpa)} вища за ціль ${money(target)}. Розділи CR переходу в профіль/канал і CR підписки: це покаже, чи проблема в рекламі, чи в упаковці майданчика.`,
   `All-in result cost ${money(r.allInCpa)} is above the ${money(target)} target. Separate visit CR from follow CR to see whether the issue is the ads or the destination profile/channel.`
  )});
  if(active>0&&active<60)recs.push({tone:'warning',text:L(
   `Через 30 днів активними лишається ${pct(active)} аудиторії. Оцінюй креативи не лише за CPF/CPS, а й за ціною активного користувача ${money(r.costPerActive)}.`,
   `Only ${pct(active)} of the audience remains active after 30 days. Judge creatives not only by CPF/CPS, but also by cost per active user: ${money(r.costPerActive)}.`
  )});
 }
 if(r.clicks<300||r.paidFinal<10)recs.push({text:L(
  `Даних поки мало: ${count(r.clicks)} кліків і ${count(r.paidFinal)} фінальних результатів. Не роби жорсткий висновок по ROI, доки CPC, approve і ключові CR не стабілізуються.`,
  `The sample is still small: ${count(r.clicks)} clicks and ${count(r.paidFinal)} final results. Avoid a hard ROI conclusion until CPC, approve, and key CRs stabilize.`
 )});
 return recs.slice(0,6);
}
