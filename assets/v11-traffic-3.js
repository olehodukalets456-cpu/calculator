function invalidFunnelItems(){
  const stages=currentStages();
  if(trafficMode()==='cpc')return [{label:t('clicks')},...stages.map(s=>({label:L(s.nameUk,s.nameEn)}))];
  return stages.slice(anchorIndex()).map(s=>({label:L(s.nameUk,s.nameEn)}));
}

renderResults=function(r){
  const valid=validate(false),brandNoValue=state.vertical==='brand'&&r.unitRevenue<=0,brandTarget=n(state.values.brand?.brandTargetCost),tt=brandNoValue?(r.allInCpa<=brandTarget?'positive':'negative'):tone(r);
  dom.statusBox.className=`status ${valid?tt:'warning'}`;dom.statusText.textContent=!valid?t('invalid'):tt==='positive'?t('profitable'):tt==='warning'?t('nearLimit'):t('loss');
  dom.resultBasis.textContent=VERTICALS[state.vertical].basis?t(state.basis[state.vertical]==='ltv'?'lifetime':state.vertical==='saas'?'firstMonth':'firstOrder'):'—';
  const startLabel=r.mode==='cpc'?t('clicks'):r.startLabel;
  if(!valid){
    dom.heroResult.className='hero-result';$('#heroMainLabel').textContent=t('netProfit');$('#heroSideLabel').textContent='ROI';dom.profitValue.textContent='—';dom.roiValue.textContent='—';
    dom.keyMetrics.innerHTML=[metric(startLabel,'—'),metric(t('paidFinal'),'—'),metric(t('revenue'),'—'),metric(t('allInCpa'),'—')].join('');
    dom.compareGrid.innerHTML=[compare(t('cpa'),'—'),compare(t('maxCpa'),'—'),compare(r.mode==='cpc'?t('cpc'):t('trafficCost'),'—'),compare(r.mode==='cpc'?t('maxCpc'):t('maxTrafficCost'),'—')].join('');
    dom.funnel.innerHTML=invalidFunnelItems().map((x,i)=>`${i?'<span class="funnel-arrow">→</span>':''}<div class="funnel-stage"><small>${esc(x.label)}</small><strong>—</strong></div>`).join('');
    dom.advancedGrid.innerHTML=[t('rawFinal'),t('approvedFinal'),t('paidFinal'),t('fees'),t('totalCosts'),t('heldAmount'),t('cashGap'),t('paybackDate')].map(x=>compare(x,'—')).join('');
    dom.insightText.textContent=t('invalid');dom.dashboardFunnel.innerHTML=invalidFunnelItems().map((x,i)=>`<div class="dashboard-stage"><strong>${esc(x.label)}</strong><span>—</span><small>${i?'—':'100%'}</small></div>`).join('');
    dom.dashboardStats.innerHTML=[compare(t('weakestStage'),'—'),compare(t('conversionFromStart'),'—'),compare(t('costPerFinal'),'—'),compare(t('approveRate'),'—')].join('');dom.recommendations.innerHTML=`<div class="recommendation">${esc(t('invalid'))}</div>`;dom.scaleSection.hidden=true;dom.cohortSection.hidden=true;renderScenarios();return;
  }
  dom.heroResult.className=`hero-result ${tt}`;dom.profitValue.textContent=brandNoValue?money(r.allInCpa):money(r.profit);$('#heroMainLabel').textContent=brandNoValue?t('allInCpa'):t('netProfit');$('#heroSideLabel').textContent=brandNoValue?t('activeAudience'):'ROI';dom.roiValue.textContent=brandNoValue?count(r.activeAudience):pct(r.roi);
  dom.keyMetrics.innerHTML=brandNoValue?[metric(startLabel,count(r.startCount)),metric(t('paidFinal'),count(r.paidFinal)),metric(t('activeAudience'),count(r.activeAudience)),metric(t('costPerActive'),money(r.costPerActive))].join(''):[metric(startLabel,count(r.startCount)),metric(t('paidFinal'),count(r.paidFinal)),metric(t('revenue'),money(r.grossRevenue)),metric(t('allInCpa'),money(r.allInCpa))].join('');
  dom.compareGrid.innerHTML=brandNoValue?[compare(t('allInCpa'),money(r.allInCpa)),compare(t('brandTargetCost'),money(brandTarget)),compare(L('Відхилення від цілі','Gap vs target'),pct((r.allInCpa/brandTarget-1)*100)),compare(t('costPerActive'),money(r.costPerActive))].join(''):[compare(t('cpa'),money(r.cpa)),compare(t('maxCpa'),money(r.maxCpa)),compare(r.mode==='cpc'?t('cpc'):`${t('trafficCost')}: ${r.startLabel}`,money(r.trafficCost)),compare(r.mode==='cpc'?t('maxCpc'):t('maxTrafficCost'),money(r.maxTrafficCost))].join('');
  dom.funnel.innerHTML=r.funnel.map((stage,i)=>`${i?'<span class="funnel-arrow">→</span>':''}<div class="funnel-stage"><small>${esc(stage.label)}</small><strong>${count(stage.value)}</strong>${i?`<small>${pct(stage.rate*100)}</small>`:''}</div>`).join('');
  dom.advancedGrid.innerHTML=[compare(t('rawFinal'),count(r.rawFinal)),compare(t('approvedFinal'),count(r.rawFinal*r.approve)),compare(t('paidFinal'),count(r.paidFinal)),compare(t('fees'),money(r.fees)),compare(t('totalCosts'),money(r.totalCosts)),compare(t('heldAmount'),money(r.heldAmount)),compare(t('cashGap'),money(r.cashGap)),compare(t('paybackDate'),dateAfter(r.holdDays))].join('');
  dom.insightText.textContent=buildInsight(r,tt);renderDashboard(r);renderScaling(r);renderCohort(r);renderScenarios();
};

buildInsight=function(r,tt){
  if(r.startCount<=0||r.rawFinal<=0)return t('invalid');
  if(state.vertical==='brand'&&r.unitRevenue<=0){const target=n(state.values.brand.brandTargetCost);return r.allInCpa<=target?L(`Фактична ціна результату ${money(r.allInCpa)} нижча за ціль ${money(target)}.`,`Actual result cost ${money(r.allInCpa)} is below the target ${money(target)}.`):L(`Фактична ціна результату ${money(r.allInCpa)} вища за ціль ${money(target)} на ${pct((r.allInCpa/target-1)*100)}.`,`Actual result cost ${money(r.allInCpa)} is above the target ${money(target)} by ${pct((r.allInCpa/target-1)*100)}.`)}
  if(tt==='positive')return r.mode==='stage'?I18N[state.lang].knownStageCostHealthy.replace('{stage}',r.startLabel).replace('{gap}',pct((r.maxTrafficCost/r.trafficCost-1)*100)):L(`Поточний CPA має запас ${pct((r.maxCpa/r.cpa-1)*100)} до межі беззбитковості.`,`Current CPA has ${pct((r.maxCpa/r.cpa-1)*100)} headroom before break-even.`);
  if(tt==='warning'&&r.profit>=0)return L('Кампанія в плюсі, але запас малий: невелике зростання вартості залучення або просідання CR може з’їсти прибуток.','The campaign is profitable, but the buffer is thin: a small increase in acquisition cost or decline in conversion can erase profit.');
  return L(`Для виходу в нуль потрібен CPA не вище ${money(r.maxCpa)} або CR від стартового етапу не нижче ${pct(r.requiredCvr)}.`,`To break even, CPA must be no higher than ${money(r.maxCpa)} or conversion from the starting stage must reach at least ${pct(r.requiredCvr)}.`);
};

renderDashboard=function(r){
  dom.dashboardFunnel.innerHTML=r.funnel.map((s,i)=>`<div class="dashboard-stage"><strong>${esc(s.label)}</strong><span>${count(s.value)}</span><small>${i?`${pct(s.rate*100)} · -${count(s.drop)}`:'100%'}</small></div>`).join('');
  let weakest={i:0,drop:-1};r.funnel.slice(1).forEach((s,i)=>{if(s.drop>weakest.drop)weakest={i:i+1,drop:s.drop}});
  dom.dashboardStats.innerHTML=[compare(t('weakestStage'),r.funnel[weakest.i]?.label||'—'),compare(t('conversionFromStart'),pct(r.overallCvr)),compare(t('costPerFinal'),money(r.allInCpa)),compare(t('approveRate'),pct(r.approve*100))].join('');
  const recs=buildRecommendations(r,weakest.i);dom.recommendations.innerHTML=recs.map(x=>`<div class="recommendation ${x.tone||''}">${esc(x.text)}</div>`).join('');
};

buildRecommendations=function(r,weakIndex){
  const recs=[],vals=state.values[state.vertical],weak=r.funnel[weakIndex];
  if(r.mode==='stage')recs.push({tone:'info',text:t('stageCostModeNote')});
  if(weakIndex>0)recs.push({tone:'warning',text:L(`Найбільша абсолютна втрата — на етапі «${weak.label}»: відсіюється ${count(weak.drop)} користувачів, проходить ${pct(weak.rate*100)}. ${stageAdvice(weak.label)}`,`The largest absolute loss is at “${weak.label}”: ${count(weak.drop)} users drop off and ${pct(weak.rate*100)} continue. ${stageAdvice(weak.label)}`)});
  if(r.mode==='cpc'&&Number.isFinite(r.maxCpc)&&r.cpc>r.maxCpc)recs.push({tone:'negative',text:L(`CPC ${money(r.cpc)} вищий за беззбитковий ${money(r.maxCpc)}. Знизь його приблизно на ${pct((1-r.maxCpc/r.cpc)*100)} або підніми цінність фінальної конверсії.`,`CPC ${money(r.cpc)} is above the break-even ${money(r.maxCpc)}. Reduce it by about ${pct((1-r.maxCpc/r.cpc)*100)} or increase final-conversion value.`)});
  if(r.mode==='stage'&&Number.isFinite(r.maxTrafficCost)){
    const gap=Math.abs((r.trafficCost/r.maxTrafficCost-1)*100),key=r.trafficCost>r.maxTrafficCost?'knownStageCostProblem':'knownStageCostHealthy';
    recs.push({tone:r.trafficCost>r.maxTrafficCost?'negative':'positive',text:I18N[state.lang][key].replace('{stage}',r.startLabel).replace('{current}',money(r.trafficCost)).replace('{limit}',money(r.maxTrafficCost)).replace('{gap}',pct(gap))});
  }
  if(Number.isFinite(r.requiredCvr)&&r.requiredCvr>r.overallCvr)recs.push({tone:'negative',text:L(`Від «${r.startLabel}» до фіналу зараз доходить ${pct(r.overallCvr)}, а для нуля потрібно ${pct(r.requiredCvr)} — у ${((r.requiredCvr/r.overallCvr)||0).toFixed(2)}× більше. Не оптимізуй усе одразу: порахуй, який один downstream-етап здатен дати цей приріст без нереалістичного стрибка.`,`From “${r.startLabel}” to the final result, conversion is ${pct(r.overallCvr)}; break-even needs ${pct(r.requiredCvr)}, a ${((r.requiredCvr/r.overallCvr)||0).toFixed(2)}× lift. Do not optimize everything at once: identify the one downstream stage that can realistically create most of that gain.`)});
  if(r.approve<.85)recs.push({tone:'negative',text:L(`Approve лише ${pct(r.approve*100)}. Порівнюй зв’язки за approved CPA: CPL без апруву маскує неякісний трафік. Розбий approve за креативом, GEO, паблішером і причиною відхилення.`,`Approve is only ${pct(r.approve*100)}. Compare combinations by approved CPA: CPL without approve hides weak traffic. Break approve down by creative, GEO, publisher, and rejection reason.`)});
  if(r.refund>.08)recs.push({tone:'warning',text:L(`Refund / chargeback — ${pct(r.refund*100)}. Відокрем джерела, що продають через завищене очікування, від проблем продукту чи платежу. Оптимізація за дохідністю до refund тут бреше.`,`Refund / chargeback is ${pct(r.refund*100)}. Separate sources that sell through inflated expectations from product or payment issues. Pre-refund profitability is misleading here.`)});
  const feeShare=r.grossRevenue>0?r.fees/r.grossRevenue*100:0;if(feeShare>15)recs.push({tone:'warning',text:L(`Комісії, податки та fee забирають ${pct(feeShare)} виручки. Дивись contribution після цих витрат, а не лише payout або ROAS.`,`Fees and taxes consume ${pct(feeShare)} of revenue. Judge contribution after these costs, not only payout or ROAS.`)});
  if(r.holdDays>=14)recs.push({tone:'warning',text:L(`Холд ${r.holdDays} днів заморожує близько ${money(r.heldAmount)}. Для безперервного заливу потрібен cash buffer щонайменше ${money(r.cashGap)} на один цикл.`,`A ${r.holdDays}-day hold delays about ${money(r.heldAmount)}. Continuous buying needs at least ${money(r.cashGap)} of cash buffer for one cycle.`)});
  if(state.scalingEnabled&&r.scaled){const roiDrop=r.roi-r.scaled.roi;if(r.scaled.profit<0)recs.push({tone:'negative',text:L(`Після масштабування модель іде в мінус: вартість «${r.startLabel}» зростає до ${money(r.scaled.trafficCost)}, а CR від старту падає до ${pct(r.scaled.overallCvr)}. Орієнтовна межа плюсового бюджету — ${money(r.maxScaleBudget)}.`,`After scaling, the model turns negative: “${r.startLabel}” rises to ${money(r.scaled.trafficCost)} and conversion from start falls to ${pct(r.scaled.overallCvr)}. Estimated profitable budget ceiling: ${money(r.maxScaleBudget)}.`)});else if(roiDrop>10)recs.push({tone:'warning',text:L(`Масштабування лишається плюсовим, але ROI падає на ${pct(roiDrop)}. Збільшуй бюджет кроками й після кожного кроку звіряй фактичну ціну стартового етапу та downstream CR.`,`Scaling remains profitable, but ROI drops by ${pct(roiDrop)}. Increase budget in steps and verify the actual starting-stage cost and downstream conversion after each step.`)})}
  if(r.cohort){if(r.cohort.payback===null)recs.push({tone:'negative',text:L(`Когорта не повертає витрати за ${r.cohort.months} міс. CAC не підтримується доходом, маржею та churn.`,`The cohort does not recover acquisition cost within ${r.cohort.months} months. CAC is not supported by revenue, margin, and churn.`)});else if(r.cohort.payback>6)recs.push({tone:'warning',text:L(`Payback — ${r.cohort.payback} міс. Перевір ранній churn: саме перші 1–2 місяці найбільше ламають LTV.`,`Payback is ${r.cohort.payback} months. Check early churn: months 1–2 damage LTV the most.`)})}
  if(state.vertical==='brand'){const target=n(vals.brandTargetCost),active=clamp(n(vals.activeRate),0,100);if(target>0&&r.allInCpa>target)recs.push({tone:'negative',text:L(`All-in ціна результату ${money(r.allInCpa)} вища за ціль ${money(target)}. Розділи перехід і підписку, щоб зрозуміти: проблема в закупці чи в упаковці профілю/каналу.`,`All-in result cost ${money(r.allInCpa)} is above the ${money(target)} target. Separate visit and follow conversion to identify whether the issue is acquisition or destination packaging.`)});if(active>0&&active<60)recs.push({tone:'warning',text:L(`Через 30 днів активними лишається ${pct(active)} аудиторії. Дивись не лише CPF, а ціну активного користувача та відписки за джерелами.`,`Only ${pct(active)} of the audience remains active after 30 days. Track cost per active user and unfollows by source, not only CPF.`)})}
  return recs.slice(0,7);
};

renderScaling=function(r){
  dom.scaleSection.hidden=!(state.scalingEnabled&&r.scaled);if(dom.scaleSection.hidden)return;
  const s=r.scaled,label=activeTrafficLabel(r);
  dom.scaleSummary.innerHTML=[compare(t('budget'),`${money(r.spend)} → ${money(s.spend)}`),compare(`${t('scaledTrafficCost')}: ${label}`,`${money(r.trafficCost)} → ${money(s.trafficCost)}`),compare(t('conversionFromStart'),`${pct(r.overallCvr)} → ${pct(s.overallCvr)}`),compare(t('profit'),`${money(r.profit)} → ${money(s.profit)}`),compare(t('maxScaleBudget'),money(r.maxScaleBudget))].join('');
  dom.scaleDelta.textContent=`${t('scaleDoublings')}: ${s.doublings.toFixed(2)}. ROI: ${pct(r.roi)} → ${pct(s.roi)}. CPA: ${money(r.allInCpa)} → ${money(s.allInCpa)}.`;
};

