computeModel=function({spend,cpc,rates,vals,mode=trafficMode(),anchorIndex:aIndex=anchorIndex(),anchorCost=n(vals.anchorCost),stages=currentStages()}){
  const startIndex=mode==='stage'?clamp(aIndex,0,Math.max(0,stages.length-1)):-1;
  const clicks=mode==='cpc'&&cpc>0?spend/cpc:NaN;
  const startCount=mode==='cpc'?clicks:(anchorCost>0?spend/anchorCost:0);
  let current=startCount;const funnel=[];
  if(mode==='cpc')funnel.push({label:t('clicks'),value:clicks,rate:1,drop:0,stageIndex:-1});
  else funnel.push({label:L(stages[startIndex]?.nameUk||'',stages[startIndex]?.nameEn||''),value:startCount,rate:1,drop:0,stageIndex:startIndex});
  const from=mode==='cpc'?0:startIndex+1;
  for(let i=from;i<rates.length;i++){
    const prev=current,rate=clamp(rates[i],0,1);current*=rate;
    const stage=stages[i];funnel.push({label:L(stage?.nameUk||'',stage?.nameEn||''),value:current,rate,drop:Math.max(0,prev-current),stageIndex:i});
  }
  const rawFinal=current;
  const approve=vals.approveRate===''||vals.approveRate==null?1:clamp(n(vals.approveRate),0,100)/100;
  const refund=vals.refundRate===''||vals.refundRate==null?0:clamp(n(vals.refundRate),0,100)/100;
  const paidFinal=rawFinal*approve*(1-refund);
  const unitRevenue=valuePerResult(vals),grossRevenue=paidFinal*unitRevenue;
  const margin=state.vertical==='brand'?1:clamp(n(vals.margin),0,100)/100;
  const paymentRate=clamp(n(vals.paymentFee),0,100)/100,taxRate=clamp(n(vals.taxRate),0,100)/100,agencyRate=clamp(n(vals.agencyFee),0,100)/100;
  const paymentFee=grossRevenue*paymentRate,tax=grossRevenue*taxRate,agency=spend*agencyRate,fixed=n(vals.fixedCosts);
  const contribution=grossRevenue*margin-paymentFee-tax,totalCosts=spend+agency+fixed,profit=contribution-totalCosts;
  const roi=totalCosts>0?profit/totalCosts*100:NaN,roas=spend>0?grossRevenue/spend:NaN,cpa=paidFinal>0?spend/paidFinal:NaN,allInCpa=paidFinal>0?totalCosts/paidFinal:NaN;
  const unitContribution=unitRevenue*Math.max(0,margin-paymentRate-taxRate);
  const maxSpend=paidFinal>0?(paidFinal*unitContribution-fixed)/(1+agencyRate):NaN,maxCpa=paidFinal>0&&maxSpend>0?maxSpend/paidFinal:NaN;
  const maxCpc=mode==='cpc'&&clicks>0&&maxSpend>0?maxSpend/clicks:NaN;
  const paidRateFromStart=startCount>0?paidFinal/startCount:0;
  const maxTrafficCost=mode==='cpc'?maxCpc:(spend>0&&paidRateFromStart>0&&unitContribution>0?spend*paidRateFromStart*unitContribution/(spend*(1+agencyRate)+fixed):NaN);
  const reqPaid=unitContribution>0?(spend*(1+agencyRate)+fixed)/unitContribution:NaN,reqRaw=reqPaid/Math.max(.000001,approve*(1-refund));
  const requiredCvr=startCount>0?reqRaw/startCount*100:NaN,overallCvr=startCount>0?rawFinal/startCount*100:NaN;
  const holdDays=Math.max(0,n(vals.holdDays)),heldAmount=holdDays>0?Math.max(0,grossRevenue-paymentFee-tax):0,cashGap=holdDays>0?totalCosts:0;
  const activeRate=clamp(n(vals.activeRate),0,100)/100,activeAudience=state.vertical==='brand'?paidFinal*(activeRate||1):NaN,costPerActive=state.vertical==='brand'&&activeAudience>0?totalCosts/activeAudience:NaN;
  return {mode,anchorIndex:startIndex,startLabel:mode==='cpc'?t('clicks'):L(stages[startIndex]?.nameUk||'',stages[startIndex]?.nameEn||''),trafficCost:mode==='cpc'?cpc:anchorCost,maxTrafficCost,startCount,spend,cpc,anchorCost,clicks,funnel,rawFinal,approve,refund,paidFinal,unitRevenue,grossRevenue,margin,paymentFee,tax,agency,fixed,contribution,totalCosts,profit,roi,roas,cpa,allInCpa,unitContribution,maxSpend,maxCpa,maxCpc,requiredCvr,overallCvr,holdDays,heldAmount,cashGap,activeAudience,costPerActive,fees:paymentFee+tax+agency};
};

calculate=function(){
  const input=flexibleInputs();
  const base=computeModel(input);let scaled=null,maxScaleBudget=NaN;
  if(state.scalingEnabled&&input.spend>0&&n(input.vals.targetBudget)>=input.spend&&base.trafficCost>0){
    const target=n(input.vals.targetBudget),doublings=Math.max(0,Math.log2(target/input.spend));
    const scaledTrafficCost=base.trafficCost*Math.pow(1+clamp(n(input.vals.cpcGrowth),0,500)/100,doublings);
    const overallFactor=Math.pow(1-clamp(n(input.vals.crDrop),0,99.9)/100,doublings);
    const activeRateIndexes=[];
    for(let i=input.mode==='cpc'?0:input.aIndex+1;i<input.rates.length;i++)activeRateIndexes.push(i);
    const perStageFactor=Math.pow(overallFactor,1/Math.max(1,activeRateIndexes.length));
    const scaledRates=[...input.rates];activeRateIndexes.forEach(i=>scaledRates[i]*=perStageFactor);
    scaled=computeModel({...input,spend:target,cpc:input.mode==='cpc'?scaledTrafficCost:NaN,anchorCost:input.mode==='stage'?scaledTrafficCost:NaN,rates:scaledRates});
    scaled.doublings=doublings;scaled.scaledRates=scaledRates;
    maxScaleBudget=findMaxScaleBudget(input);
  }
  const cohort=(state.cohortEnabled&&VERTICALS[state.vertical].cohort)?computeCohort(base,input.vals):null;
  return {...base,scaled,maxScaleBudget,cohort};
};

findMaxScaleBudget=function(input){
  if(input.spend<=0)return NaN;
  const baseCost=input.mode==='cpc'?input.cpc:input.anchorCost;
  let lo=input.spend,hi=input.spend*128;
  const profitAt=budget=>{
    const d=Math.max(0,Math.log2(budget/input.spend)),cost=baseCost*Math.pow(1+clamp(n(input.vals.cpcGrowth),0,500)/100,d);
    const overall=Math.pow(1-clamp(n(input.vals.crDrop),0,99.9)/100,d),indexes=[];
    for(let i=input.mode==='cpc'?0:input.aIndex+1;i<input.rates.length;i++)indexes.push(i);
    const factor=Math.pow(overall,1/Math.max(1,indexes.length)),rates=[...input.rates];indexes.forEach(i=>rates[i]*=factor);
    return computeModel({...input,spend:budget,cpc:input.mode==='cpc'?cost:NaN,anchorCost:input.mode==='stage'?cost:NaN,rates}).profit;
  };
  if(profitAt(lo)<0)return lo;
  while(profitAt(hi)>0&&hi<input.spend*10000)hi*=2;
  for(let i=0;i<50;i++){const mid=(lo+hi)/2;if(profitAt(mid)>=0)lo=mid;else hi=mid}
  return lo;
};

validate=function(mark=false){
  let ok=true;
  if(mark){document.querySelectorAll('.field.invalid').forEach(x=>x.classList.remove('invalid'));document.querySelectorAll('.stage-rate-wrap.invalid').forEach(x=>x.classList.remove('invalid'))}
  const vals=state.values[state.vertical],mode=trafficMode(),required=['adSpend',mode==='cpc'?'cpc':'anchorCost','margin'];
  if(state.vertical==='brand')required.splice(required.indexOf('margin'),1);
  if(state.vertical==='ecom')required.push(state.basis.ecom==='ltv'?'customerLtv':'aov');
  if(state.vertical==='leadgen')required.push('valuePerSale');
  if(state.vertical==='edtech')required.push('studentValue');
  if(state.vertical==='saas'){required.push('monthlyArpu');if(state.basis.saas==='ltv')required.push('lifetimeMonths')}
  if(state.vertical==='brand')required.push('brandTargetCost');
  if(state.scalingEnabled)required.push('targetBudget','cpcGrowth','crDrop');
  if(state.cohortEnabled&&VERTICALS[state.vertical].cohort){required.push('churnRate','projectionMonths');if(state.vertical==='edtech')required.push('monthlyStudentValue')}
  const percentKeys=['margin','approveRate','refundRate','paymentFee','taxRate','agencyFee','cpcGrowth','crDrop','churnRate','activeRate'],allowZero=['cpcGrowth','crDrop','churnRate'];
  required.forEach(key=>{
    const inp=document.querySelector(`input[data-key="${key}"]`);if(!inp)return;
    const value=n(vals[key]);let bad=percentKeys.includes(key)?value<0||value>100||(!allowZero.includes(key)&&value<=0):value<=0;
    if(key==='targetBudget'&&value<n(vals.adSpend))bad=true;
    if(bad){if(mark){const box=inp.closest('.field');box?.classList.add('invalid');const err=box?.querySelector('.field-error');if(err)err.textContent=percentKeys.includes(key)?t('errorPercent'):t('errorPositive')}ok=false}
  });
  const firstRequiredRate=mode==='cpc'?0:anchorIndex()+1;
  currentStages().forEach((stage,i)=>{if(i>=firstRequiredRate&&(n(stage.rate)<=0||n(stage.rate)>100)){if(mark)dom.funnelEditor.children[i]?.querySelector('.stage-rate-wrap')?.classList.add('invalid');ok=false}});
  return ok;
};

