function calculateAndRender(){
  if(!validate()) return renderInvalid();
  try{
    const result=calculate();
    renderTrafficDerived(result);
    renderResults(result);
  } catch(error){
    console.error(error);
    validationErrors=[t('calculationError')];
    dom.validationSummary.hidden=false;
    dom.validationSummary.innerHTML=`<strong>${esc(t('fixInputs'))}</strong><p>• ${esc(t('calculationError'))}</p>`;
    renderInvalid(true);
  }
}

function renderInvalid(runtime=false){
  renderTrafficDerived(null);
  dom.heroMainLabel.textContent=t(state.vertical==='brand'?'brandCost':'netProfit');
  dom.limitsTitle.textContent=t(state.vertical==='brand'?'brandLimits':'buyingLimits');
  dom.limitsHintText.textContent=t(state.vertical==='brand'?'brandLimitsHint':'limitsHint');
  dom.resultBasis.textContent=state.vertical==='brand'?t('brandTitle'):'—';
  dom.heroSideLabel.textContent=state.vertical==='brand'?t('brandTarget'):'ROI';
  dom.statusBox.className='status warning'; dom.statusText.textContent=t('invalid'); dom.heroResult.className='hero-result warning';
  dom.profitValue.textContent='—'; dom.roiValue.textContent='—'; dom.keyMetrics.replaceChildren(); dom.compareGrid.replaceChildren(); dom.funnel.replaceChildren(); dom.advancedGrid.replaceChildren();
  dom.insightText.textContent=runtime?t('calculationError'):(validationErrors[0]||t('incompleteData'));
  dom.dashboardFunnel.replaceChildren(); dom.dashboardStats.replaceChildren(); dom.recommendations.replaceChildren();
  dom.quickResult.hidden=true; dom.quickFinal.textContent='—'; dom.quickCost.textContent='—';
}

function renderResults(r){
  const resultTone=tone(r);
  dom.quickFinal.textContent=count(r.sales);
  dom.quickCost.textContent=money(r.allInCpa);
  dom.quickResult.hidden=false;

  if(state.vertical==='brand'&&!r.brandHasValue){
    const statusKey=resultTone==='positive'?'profitable':resultTone==='negative'?'loss':'nearLimit';
    dom.statusBox.className='status '+resultTone;
    dom.statusText.textContent=Number.isFinite(r.brandTarget)?t(statusKey):t('brandEfficiency');
    dom.heroResult.className='hero-result '+resultTone;
    dom.heroMainLabel.textContent=t('brandCost');
    dom.heroSideLabel.textContent=t('brandTarget');
    dom.profitValue.textContent=money(r.allInCpa);
    dom.roiValue.textContent=Number.isFinite(r.brandTarget)?money(r.brandTarget):'—';
    dom.resultBasis.textContent=t('brandTitle');
    dom.limitsTitle.textContent=t('brandLimits');
    dom.limitsHintText.textContent=t('brandLimitsHint');

    renderCards(dom.keyMetrics,[
      card('salesMetric',count(r.sales),'salesMetricHelp'),
      card('overallCvr',pct(r.overallCvr)),
      card('activeAudience',Number.isFinite(r.activeAudience)?count(r.activeAudience):'—'),
      card('costPerActive',Number.isFinite(r.costPerActive)?money(r.costPerActive):'—')
    ],'metric-card');

    renderCards(dom.compareGrid,[
      card('currentCpc',money(r.cpc)),
      card('brandCost',money(r.allInCpa),'',Number.isFinite(r.brandTarget)?(r.allInCpa<=r.brandTarget?'positive':'negative'):''),
      card('brandTarget',Number.isFinite(r.brandTarget)?money(r.brandTarget):'—'),
      card('brandGap',Number.isFinite(r.brandGap)?pct(r.brandGap):'—','',Number.isFinite(r.brandGap)?(r.brandGap<=0?'positive':'negative'):''),
      card('firstStageCost',money(r.firstStageCost)),
      card('finalConversion',pct(r.overallCvr))
    ],'compare-item');

    renderFunnel(r);
    renderAdvanced(r);
    renderDashboard(r,resultTone);
    dom.insightText.textContent=buildInsight(r,resultTone);
    return;
  }

  const statusKey=resultTone==='positive'?'profitable':resultTone==='negative'?'loss':'nearLimit';
  dom.limitsTitle.textContent=t('buyingLimits');
  dom.limitsHintText.textContent=t('limitsHint');
  dom.statusBox.className='status '+resultTone; dom.statusText.textContent=t(statusKey); dom.heroResult.className='hero-result '+resultTone;
  dom.heroMainLabel.textContent=t('netProfit');
  dom.heroSideLabel.textContent='ROI';
  dom.profitValue.textContent=money(r.profit); dom.roiValue.textContent=pct(r.roi);
  dom.resultBasis.textContent=t(r.basis==='ltv'?'basisLifetime':(state.vertical==='saas'?'basisFirstMonth':'basisFirstOrder'));

  renderCards(dom.keyMetrics,[
    card('revenue',money(r.revenue),'revenueHelp'),
    card('salesMetric',count(r.sales),'salesMetricHelp'),
    card('cpa',money(r.cpa),'cpaHelp',r.cpa<=r.maxCpa?'positive':'negative'),
    card('roas',ratio(r.roas),'roasHelp',r.roas>=r.breakEvenRoas?'positive':'negative')
  ],'metric-card');

  renderCards(dom.compareGrid,[
    card('currentCpa',money(r.cpa),'',r.cpa<=r.maxCpa?'positive':'negative'),
    card('maxCpa',money(Math.max(0,r.maxCpa))),
    card('currentCpc',money(r.cpc),'',r.cpc<=r.maxCpc?'positive':'negative'),
    card('maxCpc',money(Math.max(0,r.maxCpc))),
    card('safety',Number.isFinite(r.safety)?pct(r.safety):'—','',r.safety>=.12?'positive':r.safety>=0?'':'negative'),
    card('requiredCvr',pct(r.requiredCvr))
  ],'compare-item');

  renderFunnel(r);
  renderAdvanced(r);
  renderDashboard(r,resultTone);
  dom.insightText.textContent=buildInsight(r,resultTone);
}

function renderFunnel(r){
  dom.funnel.replaceChildren();
  const max=Math.max(1,...r.funnel.map(stage=>Number(stage.value)||0));
  r.funnel.forEach(stage=>{
    const row=document.createElement('div'); row.className='funnel-row';
    const width=Math.max(.6,Math.min(100,stage.value/max*100));
    row.innerHTML=`<span class="funnel-label" title="${esc(stage.label)}">${esc(stage.label)}</span><span class="funnel-track"><span class="funnel-fill" style="width:${width}%"></span></span><strong class="funnel-value">${esc(count(stage.value))}</strong>`;
    dom.funnel.append(row);
  });
}

