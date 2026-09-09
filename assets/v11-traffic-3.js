function invalidFunnelItems(){
  const stages=currentStages();
  if(trafficMode()==='cpc')return [{label:t('clicks')},...stages.map(s=>({label:L(s.nameUk,s.nameEn)}))];
  return stages.slice(anchorIndex()).map(s=>({label:L(s.nameUk,s.nameEn)}));
}

renderResults=function(r){
  const valid=validate(false),brandNoValue=!r.hasRevenue,brandTarget=n(state.values.brand?.brandTargetCost),tt=brandNoValue?(r.allInCpa<=brandTarget?'positive':'negative'):tone(r);
  dom.statusBox.className=`status ${valid?tt:'warning'}`;dom.statusText.textContent=!valid?t('invalid'):brandNoValue?t(tt==='positive'?'withinTarget':'aboveTarget'):Math.abs(r.profit)<1e-8?t('atBreakEven'):tt==='positive'?t('profitable'):tt==='warning'?t('nearLimit'):t('loss');
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

function scaleLimitText(value){return value===Infinity?t('noScaleLimit'):value===0?t('noProfitableScale'):money(value)}
function greatestDrop(r){let index=-1,drop=0;r.funnel.forEach((s,i)=>{if(i>0&&s.drop>drop){index=i;drop=s.drop}});return index}
buildInsight=function(r,tt){
 if(!r.hasRevenue)return t('noRevenueValue');
 if(r.unitContribution<=0)return t('noUnitMargin');
 if(r.paidFinal===0)return t('noPaidResults');
 if(r.requiredCvr>100&&r.profit<0)return t('impossibleCvr');
 if(Math.abs(r.profit)<1e-8)return t('atBreakEven');
 if(r.profit>0)return L(`Ціна стартового результату має запас ${pct((r.maxTrafficCost/r.trafficCost-1)*100)} до беззбитковості за незмінного бюджету й CR.`,`Starting-result cost has ${pct((r.maxTrafficCost/r.trafficCost-1)*100)} headroom before break-even at unchanged budget and CR.`);
 return L(`Для виходу в нуль потрібна ціна стартового результату не вище ${money(r.maxTrafficCost)} або загальна CR не нижче ${pct(r.requiredCvr)}.`,`Break-even requires a starting-result cost of ${money(r.maxTrafficCost)} or less, or an overall CR of at least ${pct(r.requiredCvr)}.`);
};

renderDashboard=function(r){
  dom.dashboardFunnel.innerHTML=r.funnel.map((s,i)=>`<div class="dashboard-stage"><strong>${esc(s.label)}</strong><span>${count(s.value)}</span><small>${i?`${pct(s.rate*100)} · -${count(s.drop)}`:'100%'}</small></div>`).join('');
  const weakest={i:greatestDrop(r)};
  dom.dashboardStats.innerHTML=[compare(t('weakestStage'),r.funnel[weakest.i]?.label||'—'),compare(t('conversionFromStart'),pct(r.overallCvr)),compare(t('costPerFinal'),money(r.allInCpa)),compare(t('approveRate'),pct(r.approve*100))].join('');
  const recs=buildRecommendations(r,weakest.i);dom.recommendations.innerHTML=recs.map(x=>`<div class="recommendation ${x.tone||''}">${esc(x.text)}</div>`).join('');
};

buildRecommendations=function(r,weakIndex){
 const recs=[],weak=r.funnel[weakIndex];
 const add=(tone,text)=>recs.push({tone,text});
 if(r.mode==='stage')add('info',t('stageCostModeNote'));
 if(!r.hasRevenue)add('info',t('noRevenueValue'));
 else if(r.unitContribution<=0)add('negative',t('noUnitMargin'));
 else if(r.paidFinal===0)add('negative',t('noPaidResults'));
 else if(r.requiredCvr>100&&r.profit<0)add('negative',t('impossibleCvr'));
 else if(r.profit<0)add('negative',buildInsight(r,'negative'));
 if(state.scalingEnabled&&r.scaled&&r.hasRevenue){
  add(r.scaled.profit<0?'negative':'info',L(`При бюджеті ${money(r.scaled.spend)} прибуток моделі — ${money(r.scaled.profit)}, ROI — ${pct(r.scaled.roi)}. Межа: ${scaleLimitText(r.maxScaleBudget)}.`,`At a budget of ${money(r.scaled.spend)}, model profit is ${money(r.scaled.profit)} and ROI is ${pct(r.scaled.roi)}. Ceiling: ${scaleLimitText(r.maxScaleBudget)}.`));
 }
 if(weakIndex>0&&weak?.drop>0)add('info',L(`Найбільша втрата за кількістю — «${weak.label}»: ${count(weak.drop)}, CR ${pct(weak.rate*100)}. Це не доводить, що етап найгірший: порівняй його з власною історією та цінністю фінального результату. ${stageAdvice(weak.label)}`,`Largest loss by volume: “${weak.label}”, ${count(weak.drop)} lost, CR ${pct(weak.rate*100)}. This does not prove it is the worst stage: compare with your history and final-result value. ${stageAdvice(weak.label)}`));
 if(r.approve<1||r.refund>0)add('info',L(`Після approve ${pct(r.approve*100)} і refund ${pct(r.refund*100)} лишається ${count(r.paidFinal)} результатів. Комісії та податки рахуються від виручки після цих коригувань.`,`After ${pct(r.approve*100)} approval and ${pct(r.refund*100)} refunds, ${count(r.paidFinal)} results remain. Fees and taxes use revenue after these adjustments.`));
 if(r.holdDays>0)add('info',t('cashAssumption'));
 if(r.cohort)add('info',t('cohortAssumption'));
 if(state.vertical==='brand'){
  const target=n(state.values.brand.brandTargetCost);
  if(target>0&&Number.isFinite(r.allInCpa))add(r.allInCpa>target?'negative':'positive',L(`All-in ціна результату: ${money(r.allInCpa)}. Ціль: ${money(target)}.`,`All-in result cost: ${money(r.allInCpa)}. Target: ${money(target)}.`));
  if(r.activeAudience===0)add('warning',L('Активна аудиторія дорівнює нулю. Ціна активного користувача не визначена.','Active audience is zero. Cost per active user is undefined.'));
 }
 return recs;
};

renderScaling=function(r){
  dom.scaleSection.hidden=!(state.scalingEnabled&&r.scaled);if(dom.scaleSection.hidden)return;
  const s=r.scaled,label=activeTrafficLabel(r);
  dom.scaleSummary.innerHTML=[compare(t('budget'),`${money(r.spend)} → ${money(s.spend)}`),compare(`${t('scaledTrafficCost')}: ${label}`,`${money(r.trafficCost)} → ${money(s.trafficCost)}`),compare(t('conversionFromStart'),`${pct(r.overallCvr)} → ${pct(s.overallCvr)}`),...(r.hasRevenue?[compare(t('profit'),`${money(r.profit)} → ${money(s.profit)}`),compare(t('maxScaleBudget'),scaleLimitText(r.maxScaleBudget))]:[compare(t('allInCpa'),`${money(r.allInCpa)} → ${money(s.allInCpa)}`),compare(t('paidFinal'),`${count(r.paidFinal)} → ${count(s.paidFinal)}`)])].join('');
  dom.scaleDelta.textContent=`${t('scaleDoublings')}: ${s.doublings.toFixed(2)}. ${r.hasRevenue?`ROI: ${pct(r.roi)} → ${pct(s.roi)}. `:''}All-in CPA: ${money(r.allInCpa)} → ${money(s.allInCpa)}.`;
};

