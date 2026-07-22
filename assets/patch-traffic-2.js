'use strict';
function validateField(node,def){
  const input=node.querySelector('input');
  const raw=input.value;
  const val=Number(raw);
  let error='';
  if(def.required && (raw==='' || !Number.isFinite(val) || val<=0)) error='errorPositive';
  if(!def.required && raw!=='' && (!Number.isFinite(val)||val<0)) error='errorNonNegative';
  if(def.id==='reach' && raw!=='' && (!Number.isFinite(val)||val<=0)) error='errorPositive';
  if(def.type==='percent' && raw!=='' && (!Number.isFinite(val)||val<=0||val>100)) error='errorPercent';
  node.classList.toggle('invalid',Boolean(error));
  node.querySelector('.field-error').textContent=error?t(error):'';
  return {ok:!error,error:error?t(error):''};
}
function validate(){
  const cfg=VERTICALS[state.vertical];
  const defs=[...trafficDefinitions(),...cfg.money];
  const errors=[];
  defs.forEach(def=>{
    const node=document.querySelector(`[data-field="${def.id}"]`);
    if(!node) return;
    const result=validateField(node,def);
    if(!result.ok) errors.push(`${t(def.label)}: ${result.error}`);
  });

  if(currentTrafficMode()==='cpm'){
    const v=state.values[state.vertical];
    const spend=Number(v.adSpend), cpm=Number(v.cpm), reach=Number(v.reach);
    const impressions=spend>0&&cpm>0?spend/cpm*1000:NaN;
    if(v.reach!==''&&Number.isFinite(reach)&&Number.isFinite(impressions)&&reach>impressions){
      const node=document.querySelector('[data-field="reach"]');
      if(node){ node.classList.add('invalid'); node.querySelector('.field-error').textContent=t('errorReachTooHigh'); }
      errors.push(`${t('reach')}: ${t('errorReachTooHigh')}`);
    }
  }

  const stages=state.stages[state.vertical]||[];
  if(!stages.length) errors.push(t('errorStage'));
  [...dom.funnelEditor.querySelectorAll('.stage-rate')].forEach((input,index)=>{
    const stage=stages[index];
    const raw=stage?.rate;
    const val=Number(raw);
    const invalid=raw===''||raw===null||raw===undefined||!Number.isFinite(val)||val<=0||val>100;
    input.parentElement.classList.toggle('invalid',invalid);
    input.closest('.stage-row')?.classList.toggle('invalid',invalid);
    input.title=invalid?t('errorStage'):'';
    if(invalid) errors.push(`${stageName(stage||{} )}: ${t('errorStage')}`);
  });

  validationErrors=[...new Set(errors)];
  dom.validationSummary.hidden=!validationErrors.length;
  dom.validationSummary.innerHTML=validationErrors.length
    ? `<strong>${esc(t('fixInputs'))}</strong>${validationErrors.slice(0,5).map(error=>`<p>• ${esc(error)}</p>`).join('')}`
    : '';
  return !validationErrors.length;
}
function calculate(){
  const cfg=VERTICALS[state.vertical];
  const v=state.values[state.vertical];
  const trafficMode=currentTrafficMode();
  const spend=Number(v.adSpend)||0;
  const fixed=Math.max(0,Number(v.fixedCosts)||0);
  const totalCosts=spend+fixed;

  let cpc=NaN, cpm=NaN, ctr=NaN, impressions=NaN, reach=NaN, frequency=NaN, clicks=0;
  if(trafficMode==='cpm'){
    cpm=Number(v.cpm)||0;
    ctr=(Number(v.ctr)||0)/100;
    impressions=cpm>0?spend/cpm*1000:0;
    clicks=impressions*ctr;
    cpc=clicks>0?spend/clicks:Infinity;
    reach=Number(v.reach)>0?Number(v.reach):NaN;
    frequency=Number.isFinite(reach)&&reach>0?impressions/reach:NaN;
  } else {
    cpc=Number(v.cpc)||0;
    clicks=cpc>0?spend/cpc:0;
  }

  const funnel=[];
  if(trafficMode==='cpm'){
    if(Number.isFinite(reach)) funnel.push({label:t('reachMetric'),value:reach,kind:'reach'});
    funnel.push({label:t('impressions'),value:impressions,kind:'impressions'});
  }
  funnel.push({label:t('clicks'),value:clicks,kind:'click'});

  let current=clicks;
  const stageCounts=[];
  state.stages[state.vertical].forEach(stage=>{
    current*=Math.min(100,Math.max(0,Number(stage.rate)||0))/100;
    const item={label:stageName(stage),value:current,kind:'conversion'};
    funnel.push(item); stageCounts.push(item);
  });
  const sales=current;

  let firstRevenuePerSale=0, ltvRevenuePerSale=0;
  if(state.vertical==='ecom'){ firstRevenuePerSale=Number(v.aov)||0; ltvRevenuePerSale=Math.max(Number(v.customerLtv)||0,firstRevenuePerSale); }
  if(state.vertical==='leadgen'){ firstRevenuePerSale=Number(v.valuePerSale)||0; ltvRevenuePerSale=firstRevenuePerSale; }
  if(state.vertical==='edtech'){ firstRevenuePerSale=Number(v.studentValue)||0; ltvRevenuePerSale=firstRevenuePerSale; }
  if(state.vertical==='saas'){ firstRevenuePerSale=Number(v.monthlyArpu)||0; ltvRevenuePerSale=firstRevenuePerSale*(Number(v.lifetimeMonths)||0); }
  if(state.vertical==='brand'){ firstRevenuePerSale=Number(v.brandResultValue)||0; ltvRevenuePerSale=firstRevenuePerSale; }

  const margin=state.vertical==='brand'?1:(Number(v.margin)||0)/100;
  const basis=cfg.basis?state.basis[state.vertical]:'first';
  const revenuePerSale=basis==='ltv'?ltvRevenuePerSale:firstRevenuePerSale;
  const revenue=sales*revenuePerSale;
  const grossProfit=revenue*margin;
  const profit=grossProfit-totalCosts;
  const roi=totalCosts>0?profit/totalCosts:NaN;
  const roas=spend>0?revenue/spend:NaN;
  const cpa=sales>0?spend/sales:Infinity;
  const allInCpa=sales>0?totalCosts/sales:Infinity;
  const overallCvr=clicks>0?sales/clicks:0;
  const contributionPerSale=revenuePerSale*margin;
  const maxCpa=sales>0?contributionPerSale-(fixed/sales):contributionPerSale;
  const maxCpc=totalCosts>0?overallCvr*contributionPerSale*(spend/totalCosts):0;
  const safety=maxCpa>0?(maxCpa-cpa)/maxCpa:NaN;
  const breakEvenSales=contributionPerSale>0?totalCosts/contributionPerSale:Infinity;
  const requiredCvr=clicks>0?breakEvenSales/clicks:Infinity;
  const breakEvenRoas=margin>0&&spend>0?totalCosts/(spend*margin):Infinity;
  const firstStageCost=stageCounts[0]?.value>0?spend/stageCounts[0].value:Infinity;
  const secondStageCost=stageCounts[1]?.value>0?spend/stageCounts[1].value:Infinity;

  const monthlyGrossPerCustomer=state.vertical==='saas'?firstRevenuePerSale*margin:NaN;
  const grossLtvPerCustomer=ltvRevenuePerSale*margin;
  const ltvCac=state.vertical==='saas'&&allInCpa>0&&Number.isFinite(allInCpa)?grossLtvPerCustomer/allInCpa:NaN;
  const payback=state.vertical==='saas'&&monthlyGrossPerCustomer>0?allInCpa/monthlyGrossPerCustomer:NaN;
  const mrr=state.vertical==='saas'?sales*firstRevenuePerSale:NaN;
  const brandHasValue=state.vertical==='brand'&&Number(v.brandResultValue)>0;
  const brandTarget=state.vertical==='brand'&&Number(v.brandTargetCost)>0?Number(v.brandTargetCost):NaN;
  const brandGap=state.vertical==='brand'&&Number.isFinite(brandTarget)&&Number.isFinite(allInCpa)?allInCpa/brandTarget-1:NaN;
  const activeAudience=state.vertical==='brand'&&Number(v.activeRate)>0?sales*(Number(v.activeRate)/100):NaN;
  const costPerActive=Number.isFinite(activeAudience)&&activeAudience>0?totalCosts/activeAudience:NaN;
  const engagements=state.vertical==='brand'&&Number(v.engagements)>0?Number(v.engagements):NaN;
  const audienceBase=state.vertical==='brand'&&Number(v.audienceBase)>0?Number(v.audienceBase):NaN;
  const costPerEngagement=Number.isFinite(engagements)?totalCosts/engagements:NaN;
  const errReach=Number.isFinite(engagements)&&Number.isFinite(reach)&&reach>0?engagements/reach:NaN;
  const erImpressions=Number.isFinite(engagements)&&Number.isFinite(impressions)&&impressions>0?engagements/impressions:NaN;
  const erAudience=Number.isFinite(engagements)&&Number.isFinite(audienceBase)&&audienceBase>0?engagements/audienceBase:NaN;

  const targetAdCpa=state.vertical==='brand'&&Number.isFinite(brandTarget)&&sales>0?Math.max(0,brandTarget-fixed/sales):NaN;
  const brandMaxCpc=Number.isFinite(targetAdCpa)?targetAdCpa*overallCvr:NaN;
  const trafficCpcLimit=state.vertical==='brand'&&!brandHasValue?brandMaxCpc:maxCpc;
  const maxCpm=trafficMode==='cpm'&&Number.isFinite(trafficCpcLimit)&&trafficCpcLimit>0?trafficCpcLimit*1000*ctr:NaN;
  const requiredCtr=trafficMode==='cpm'&&Number.isFinite(trafficCpcLimit)&&trafficCpcLimit>0&&cpm>0?cpm/(1000*trafficCpcLimit):NaN;

  return {cfg,v,trafficMode,spend,cpc,cpm,ctr,impressions,reach,frequency,fixed,totalCosts,clicks,funnel,stageCounts,sales,basis,revenuePerSale,revenue,grossProfit,profit,roi,roas,cpa,allInCpa,overallCvr,maxCpa,maxCpc,safety,breakEvenSales,requiredCvr,breakEvenRoas,firstStageCost,secondStageCost,grossLtvPerCustomer,ltvCac,payback,mrr,brandHasValue,brandTarget,brandGap,activeAudience,costPerActive,engagements,audienceBase,costPerEngagement,errReach,erImpressions,erAudience,brandMaxCpc,maxCpm,requiredCtr};
}
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
function renderAdvanced(r){
  const items=[
    card('totalCosts',money(r.totalCosts)), card('allInCpa',money(r.allInCpa)), card('overallCvr',pct(r.overallCvr)),
    card('grossProfit',money(r.grossProfit)), card('breakEvenSales',count(r.breakEvenSales)), card('breakEvenRoas',ratio(r.breakEvenRoas))
  ];
  if(r.trafficMode==='cpm'){
    items.unshift(card('cpm',money(r.cpm)),card('ctr',pct(r.ctr)),card('impressions',count(r.impressions)));
    if(Number.isFinite(r.reach)) items.unshift(card('reachMetric',count(r.reach)),card('frequency',count(r.frequency)));
  }
  if(r.stageCounts.length>=1) items.push(card('firstStageCost',money(r.firstStageCost)));
  if(r.stageCounts.length>=2) items.push(card('secondStageCost',money(r.secondStageCost)));
  if(state.vertical==='saas') items.push(card('mrr',money(r.mrr)),card('grossLtv',money(r.grossLtvPerCustomer)),card('ltvCac',ratio(r.ltvCac)),card('payback',Number.isFinite(r.payback)?`${count(r.payback)} ${t('months')}`:'—'));
  if(state.vertical==='brand'){
    const remove=['grossProfit','breakEvenSales','breakEvenRoas'];
    remove.forEach(label=>{ const index=items.findIndex(item=>item.label===label); if(index>=0) items.splice(index,1); });
    items.push(card('activeAudience',Number.isFinite(r.activeAudience)?count(r.activeAudience):'—'));
    items.push(card('costPerActive',Number.isFinite(r.costPerActive)?money(r.costPerActive):'—'));
    items.push(card('brandTarget',Number.isFinite(r.brandTarget)?money(r.brandTarget):'—'));
    if(Number.isFinite(r.engagements)) items.push(card('engagementsMetric',count(r.engagements)),card('costPerEngagement',money(r.costPerEngagement)));
    if(Number.isFinite(r.errReach)) items.push(card('errReach',pct(r.errReach)));
    if(Number.isFinite(r.erImpressions)) items.push(card('erImpressions',pct(r.erImpressions)));
    if(Number.isFinite(r.erAudience)) items.push(card('erAudience',pct(r.erAudience)));
  }
  renderCards(dom.advancedGrid,items,'advanced-item');
}
function getFunnelAnalysis(r){
  const rows=r.funnel.map((stage,index)=>{
    const previous=index>0?r.funnel[index-1].value:null;
    let rate=1,lost=0,benchmark=1,score=Infinity;
    if(stage.kind==='impressions'&&r.funnel[index-1]?.kind==='reach'){
      rate=previous>0?stage.value/previous:0;
    } else if(stage.kind==='click'&&r.funnel[index-1]?.kind==='impressions'){
      rate=previous>0?stage.value/previous:0;
      lost=Math.max(0,previous-stage.value);
    } else if(stage.kind==='conversion'){
      rate=previous>0?stage.value/previous:0;
      lost=Math.max(0,previous-stage.value);
      benchmark=stageBenchmark(stage.label,index);
      score=benchmark>0?rate/benchmark:rate;
    }
    return {...stage,index,rate,lost,benchmark,score};
  });
  const transitions=rows.filter(row=>row.kind==='conversion');
  const weakest=transitions.length?transitions.reduce((a,b)=>b.score<a.score?b:a):null;
  return {rows,weakest};
}
