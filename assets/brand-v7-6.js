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

function reportValueRows(r){
  const cfg=VERTICALS[state.vertical];
  const defs=[...trafficDefinitions(),...cfg.money];
  const rows=defs.map(def=>{
    const raw=state.values[state.vertical][def.id];
    if((raw===''||raw===null||raw===undefined)&&!def.required) return [t(def.label),'—'];
    const value=def.type==='money'?money(Number(raw)||0):def.type==='percent'?`${count(Number(raw)||0)}%`:count(Number(raw)||0);
    return [t(def.label),value];
  });
  if(r.trafficMode==='cpm'){
    rows.push([t('impressions'),count(r.impressions)]);
    rows.push([t('effectiveCpc'),money(r.cpc)]);
    if(Number.isFinite(r.frequency)) rows.push([t('frequency'),count(r.frequency)]);
  }
  return rows;
}

function renderDashboard(r,resultTone){
  const {rows,weakest}=getFunnelAnalysis(r);
  dom.dashboardFunnel.replaceChildren();
  const step=rows.length>1?Math.min(10,54/(rows.length-1)):0;
  rows.forEach((stage,index)=>{
    const el=document.createElement('div');
    el.className='dashboard-stage';
    el.style.setProperty('--stage-width',`${Math.max(46,100-index*step)}%`);
    let meta='';
    if(stage.kind==='reach') meta=`${t('reachMetric')}: ${count(stage.value)}`;
    else if(stage.kind==='impressions') meta=`${t('cpm')}: ${money(r.cpm)}${Number.isFinite(r.frequency)?` · ${t('frequency')}: ${count(r.frequency)}`:''}`;
    else if(stage.kind==='click') meta=r.trafficMode==='cpm'?`${t('ctr')}: ${pct(r.ctr)} · ${t('effectiveCpc')}: ${money(r.cpc)}`:`${t('cpc')}: ${money(r.cpc)}`;
    else meta=`${t('stageConversion')}: ${pct(stage.rate)} · ${t('stageDrop')}: ${count(stage.lost)}`;
    el.innerHTML=`<div class="dashboard-stage-main"><strong title="${esc(stage.label)}">${esc(stage.label)}</strong><span>${esc(count(stage.value))}</span></div><div class="dashboard-stage-meta"><span>${esc(meta)}</span>${weakest&&stage.index===weakest.index?`<span class="drop">${esc(t('weakestStage'))}</span>`:''}</div>`;
    dom.dashboardFunnel.append(el);
  });

  const dashboardItems=state.vertical==='brand'&&!r.brandHasValue?[
    card('finalConversion',pct(r.overallCvr)),
    card('brandCost',money(r.allInCpa)),
    card('brandTarget',Number.isFinite(r.brandTarget)?money(r.brandTarget):'—'),
    card('costPerActive',Number.isFinite(r.costPerActive)?money(r.costPerActive):'—')
  ]:[
    card('finalConversion',pct(r.overallCvr)),
    card('costPerFinal',money(r.cpa)),
    card('maxCpa',money(Math.max(0,r.maxCpa))),
    card('safety',Number.isFinite(r.safety)?pct(r.safety):'—')
  ];
  renderCards(dom.dashboardStats,dashboardItems,'dashboard-stat');

  dom.recommendations.replaceChildren();
  buildRecommendations(r,resultTone).forEach(text=>{
    const p=document.createElement('p'); p.className='recommendation'; p.textContent=text; dom.recommendations.append(p);
  });
}


