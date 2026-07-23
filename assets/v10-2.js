function computeModel({spend,cpc,rates,vals}){
 const clicks=cpc>0?spend/cpc:0;
 let current=clicks;const funnel=[{label:t('clicks'),value:clicks,rate:1,drop:0}];
 rates.forEach((r,i)=>{const prev=current;current*=r;const s=state.stages[state.vertical][i];funnel.push({label:state.lang==='uk'?s.nameUk:s.nameEn,value:current,rate:r,drop:Math.max(0,prev-current)})});
 const rawFinal=current;
 const approve=vals.approveRate===''||vals.approveRate==null?1:clamp(n(vals.approveRate),0,100)/100;
 const refund=vals.refundRate===''||vals.refundRate==null?0:clamp(n(vals.refundRate),0,100)/100;
 const paidFinal=rawFinal*approve*(1-refund);
 const unitRevenue=valuePerResult(vals);
 const grossRevenue=paidFinal*unitRevenue;
 const margin=state.vertical==='brand'?1:clamp(n(vals.margin),0,100)/100;
 const paymentFee=grossRevenue*clamp(n(vals.paymentFee),0,100)/100;
 const tax=grossRevenue*clamp(n(vals.taxRate),0,100)/100;
 const agency=spend*clamp(n(vals.agencyFee),0,100)/100;
 const fixed=n(vals.fixedCosts);
 const contribution=grossRevenue*margin-paymentFee-tax;
 const totalCosts=spend+agency+fixed;
 const profit=contribution-totalCosts;
 const roi=totalCosts>0?profit/totalCosts*100:NaN;
 const roas=spend>0?grossRevenue/spend:NaN;
 const cpa=paidFinal>0?spend/paidFinal:NaN;
 const allInCpa=paidFinal>0?totalCosts/paidFinal:NaN;
 const unitContribution=unitRevenue*Math.max(0,margin-clamp(n(vals.paymentFee),0,100)/100-clamp(n(vals.taxRate),0,100)/100);
 const agencyRate=clamp(n(vals.agencyFee),0,100)/100;
 const maxSpend=paidFinal>0?(paidFinal*unitContribution-fixed)/(1+agencyRate):NaN;
 const maxCpa=paidFinal>0&&maxSpend>0?maxSpend/paidFinal:NaN;
 const maxCpc=clicks>0&&maxSpend>0?maxSpend/clicks:NaN;
 const reqPaid=unitContribution>0?(spend*(1+agencyRate)+fixed)/unitContribution:NaN;
 const reqRaw=reqPaid/(Math.max(.000001,approve*(1-refund)));
 const requiredCvr=clicks>0?reqRaw/clicks*100:NaN;
 const overallCvr=clicks>0?rawFinal/clicks*100:NaN;
 const holdDays=Math.max(0,n(vals.holdDays));
 const heldAmount=holdDays>0?Math.max(0,grossRevenue-paymentFee-tax):0;
 const cashGap=holdDays>0?totalCosts:0;
 const activeRate=clamp(n(vals.activeRate),0,100)/100;
 const activeAudience=state.vertical==='brand'?paidFinal*(activeRate||1):NaN;
 const costPerActive=state.vertical==='brand'&&activeAudience>0?totalCosts/activeAudience:NaN;
 return {spend,cpc,clicks,funnel,rawFinal,approve,refund,paidFinal,unitRevenue,grossRevenue,margin,paymentFee,tax,agency,fixed,contribution,totalCosts,profit,roi,roas,cpa,allInCpa,unitContribution,maxSpend,maxCpa,maxCpc,requiredCvr,overallCvr,holdDays,heldAmount,cashGap,activeAudience,costPerActive,fees:paymentFee+tax+agency};
}
function calculate(){
 const vals=state.values[state.vertical],spend=n(vals.adSpend),cpc=n(vals.cpc),rates=rawRates();
 const base=computeModel({spend,cpc,rates,vals});
 let scaled=null,maxScaleBudget=NaN;
 if(state.scalingEnabled&&spend>0&&n(vals.targetBudget)>=spend&&cpc>0){
  const target=n(vals.targetBudget),doublings=Math.max(0,Math.log2(target/spend));
  const scaledCpc=cpc*Math.pow(1+clamp(n(vals.cpcGrowth),0,500)/100,doublings);
  const overallFactor=Math.pow(1-clamp(n(vals.crDrop),0,99.9)/100,doublings);
  const perStageFactor=Math.pow(overallFactor,1/Math.max(1,rates.length));
  const scaledRates=rates.map(r=>r*perStageFactor);
  scaled={...computeModel({spend:target,cpc:scaledCpc,rates:scaledRates,vals}),doublings,scaledRates};
  maxScaleBudget=findMaxScaleBudget(spend,cpc,rates,vals);
 }
 const cohort=(state.cohortEnabled&&VERTICALS[state.vertical].cohort)?computeCohort(base,vals):null;
 return {...base,scaled,maxScaleBudget,cohort};
}
function findMaxScaleBudget(baseSpend,cpc,rates,vals){
 if(baseSpend<=0)return NaN;
 let lo=baseSpend,hi=baseSpend*128;
 const profitAt=budget=>{
  const d=Math.max(0,Math.log2(budget/baseSpend)),sc=cpc*Math.pow(1+clamp(n(vals.cpcGrowth),0,500)/100,d);
  const overall=Math.pow(1-clamp(n(vals.crDrop),0,99.9)/100,d),perStage=Math.pow(overall,1/Math.max(1,rates.length));
  return computeModel({spend:budget,cpc:sc,rates:rates.map(r=>r*perStage),vals}).profit;
 };
 if(profitAt(lo)<0)return lo;
 while(profitAt(hi)>0&&hi<baseSpend*10000)hi*=2;
 for(let i=0;i<50;i++){const mid=(lo+hi)/2;if(profitAt(mid)>=0)lo=mid;else hi=mid}
 return lo;
}
function computeCohort(base,vals){
 const months=clamp(Math.round(n(vals.projectionMonths)),1,36),churn=clamp(n(vals.churnRate),0,100)/100;
 const monthlyValue=state.vertical==='saas'?n(vals.monthlyArpu):n(vals.monthlyStudentValue);
 if(monthlyValue<=0)return null;
 const margin=clamp(n(vals.margin),0,100)/100,payment=clamp(n(vals.paymentFee),0,100)/100,tax=clamp(n(vals.taxRate),0,100)/100;
 const unitMonthlyContribution=monthlyValue*Math.max(0,margin-payment-tax);
 let active=base.paidFinal,cumulative=0,payback=null;const rows=[];
 for(let m=1;m<=months;m++){
  const gp=active*unitMonthlyContribution;cumulative+=gp;
  const cumProfit=cumulative-base.totalCosts;if(payback===null&&cumProfit>=0)payback=m;
  rows.push({month:m,active,gp,cumulative,cumProfit});active*=1-churn;
 }
 const unitLtvFor=k=>{let a=1,sum=0;for(let m=1;m<=k;m++){sum+=a*unitMonthlyContribution;a*=1-churn}return sum};
 return {months,churn,monthlyValue,unitMonthlyContribution,rows,payback,ltv3:unitLtvFor(3),ltv6:unitLtvFor(6),ltv12:unitLtvFor(12)};
}

function validate(mark=false){
 let ok=true;
 if(mark){
  document.querySelectorAll('.field.invalid').forEach(x=>x.classList.remove('invalid'));
  document.querySelectorAll('.stage-rate-wrap.invalid').forEach(x=>x.classList.remove('invalid'));
 }
 const vals=state.values[state.vertical],required=['adSpend','cpc','margin'];
 if(state.vertical==='brand')required.splice(required.indexOf('margin'),1);
 if(state.vertical==='ecom')required.push(state.basis.ecom==='ltv'?'customerLtv':'aov');
 if(state.vertical==='leadgen')required.push('valuePerSale');
 if(state.vertical==='edtech')required.push('studentValue');
 if(state.vertical==='saas'){required.push('monthlyArpu');if(state.basis.saas==='ltv')required.push('lifetimeMonths')}
 if(state.vertical==='brand')required.push('brandTargetCost');
 if(state.scalingEnabled)required.push('targetBudget','cpcGrowth','crDrop');
 if(state.cohortEnabled&&VERTICALS[state.vertical].cohort){required.push('churnRate','projectionMonths');if(state.vertical==='edtech')required.push('monthlyStudentValue')}
 const percentKeys=['margin','approveRate','refundRate','paymentFee','taxRate','agencyFee','cpcGrowth','crDrop','churnRate','activeRate'];
 const allowZero=['cpcGrowth','crDrop','churnRate'];
 required.forEach(key=>{
  const inp=document.querySelector(`input[data-key="${key}"]`);if(!inp)return;
  const v=n(vals[key]);let bad;
  if(percentKeys.includes(key))bad=v<0||v>100||(!allowZero.includes(key)&&v<=0);
  else bad=v<=0;
  if(key==='targetBudget'&&v<n(vals.adSpend))bad=true;
  if(bad){
   if(mark){
    const box=inp.closest('.field');box?.classList.add('invalid');
    const err=box?.querySelector('.field-error');if(err)err.textContent=percentKeys.includes(key)?t('errorPercent'):t('errorPositive');
   }
   ok=false;
  }
 });
 state.stages[state.vertical].forEach((stage,i)=>{
  if(n(stage.rate)<=0||n(stage.rate)>100){
   if(mark)dom.funnelEditor.children[i]?.querySelector('.stage-rate-wrap')?.classList.add('invalid');
   ok=false;
  }
 });
 return ok;
}
function tone(r){if(!Number.isFinite(r.profit))return 'warning';if(r.profit<0)return 'negative';if(Number.isFinite(r.maxCpa)&&r.cpa>r.maxCpa*.85)return 'warning';return 'positive'}
function metric(label,value,help=''){return `<div class="metric"><small>${esc(label)}</small><strong>${esc(value)}</strong>${help?`<small>${esc(help)}</small>`:''}</div>`}
function compare(label,value){return `<div class="compare-item"><small>${esc(label)}</small><strong>${esc(value)}</strong></div>`}
function renderResults(r){
 const valid=validate(false),brandNoValue=state.vertical==='brand'&&r.unitRevenue<=0;
 const brandTarget=n(state.values.brand?.brandTargetCost),tt=brandNoValue?(r.allInCpa<=brandTarget?'positive':'negative'):tone(r);
 dom.statusBox.className=`status ${valid?tt:'warning'}`;
 dom.statusText.textContent=!valid?t('invalid'):tt==='positive'?t('profitable'):tt==='warning'?t('nearLimit'):t('loss');
 dom.resultBasis.textContent=VERTICALS[state.vertical].basis?t(state.basis[state.vertical]==='ltv'?'lifetime':state.vertical==='saas'?'firstMonth':'firstOrder'):'—';
 if(!valid){
  dom.heroResult.className='hero-result';
  $('#heroMainLabel').textContent=t('netProfit');$('#heroSideLabel').textContent='ROI';
  dom.profitValue.textContent='—';dom.roiValue.textContent='—';
  dom.keyMetrics.innerHTML=[metric(t('clicks'),'—'),metric(t('paidFinal'),'—'),metric(t('revenue'),'—'),metric(t('allInCpa'),'—')].join('');
  dom.compareGrid.innerHTML=[compare(t('cpa'),'—'),compare(t('maxCpa'),'—'),compare(t('maxCpc'),'—'),compare(t('requiredCvr'),'—')].join('');
  dom.funnel.innerHTML=[{label:t('clicks')},...state.stages[state.vertical].map(x=>({label:state.lang==='uk'?x.nameUk:x.nameEn}))].map((x,i)=>`${i?'<span class="funnel-arrow">→</span>':''}<div class="funnel-stage"><small>${esc(x.label)}</small><strong>—</strong></div>`).join('');
  dom.advancedGrid.innerHTML=[t('rawFinal'),t('approvedFinal'),t('paidFinal'),t('fees'),t('totalCosts'),t('heldAmount'),t('cashGap'),t('paybackDate')].map(x=>compare(x,'—')).join('');
  dom.insightText.textContent=t('invalid');
  dom.dashboardFunnel.innerHTML=[{label:t('clicks')},...state.stages[state.vertical].map(x=>({label:state.lang==='uk'?x.nameUk:x.nameEn}))].map((x,i)=>`<div class="dashboard-stage"><strong>${esc(x.label)}</strong><span>—</span><small>${i?'—':'100%'}</small></div>`).join('');
  dom.dashboardStats.innerHTML=[compare(t('weakestStage'),'—'),compare(t('finalConversion'),'—'),compare(t('costPerFinal'),'—'),compare(t('approveRate'),'—')].join('');
  dom.recommendations.innerHTML=`<div class="recommendation">${esc(t('invalid'))}</div>`;
  dom.scaleSection.hidden=true;dom.cohortSection.hidden=true;renderScenarios();return;
 }
 dom.heroResult.className=`hero-result ${tt}`;
 dom.profitValue.textContent=brandNoValue?money(r.allInCpa):money(r.profit);
 $('#heroMainLabel').textContent=brandNoValue?t('allInCpa'):t('netProfit');
 $('#heroSideLabel').textContent=brandNoValue?t('activeAudience'):'ROI';
 dom.roiValue.textContent=brandNoValue?count(r.activeAudience):pct(r.roi);
 dom.keyMetrics.innerHTML=brandNoValue?[
   metric(t('clicks'),count(r.clicks)),metric(t('paidFinal'),count(r.paidFinal)),metric(t('activeAudience'),count(r.activeAudience)),metric(t('costPerActive'),money(r.costPerActive))
 ].join(''):[
   metric(t('clicks'),count(r.clicks)),metric(t('paidFinal'),count(r.paidFinal)),metric(t('revenue'),money(r.grossRevenue)),metric(t('allInCpa'),money(r.allInCpa))
 ].join('');
 dom.compareGrid.innerHTML=brandNoValue?[
   compare(t('allInCpa'),money(r.allInCpa)),compare(t('brandTargetCost'),money(brandTarget)),compare(L('Відхилення від цілі','Gap vs target'),pct((r.allInCpa/brandTarget-1)*100)),compare(t('costPerActive'),money(r.costPerActive))
 ].join(''):[
   compare(t('cpa'),money(r.cpa)),compare(t('maxCpa'),money(r.maxCpa)),compare(t('maxCpc'),money(r.maxCpc)),compare(t('requiredCvr'),pct(r.requiredCvr))
 ].join('');
 dom.funnel.innerHTML=r.funnel.map((stage,i)=>`${i?'<span class="funnel-arrow">→</span>':''}<div class="funnel-stage"><small>${esc(stage.label)}</small><strong>${count(stage.value)}</strong>${i?`<small>${pct(stage.rate*100)}</small>`:''}</div>`).join('');
 dom.advancedGrid.innerHTML=[
  compare(t('rawFinal'),count(r.rawFinal)),compare(t('approvedFinal'),count(r.rawFinal*r.approve)),compare(t('paidFinal'),count(r.paidFinal)),compare(t('fees'),money(r.fees)),
  compare(t('totalCosts'),money(r.totalCosts)),compare(t('heldAmount'),money(r.heldAmount)),compare(t('cashGap'),money(r.cashGap)),compare(t('paybackDate'),dateAfter(r.holdDays))
 ].join('');
 dom.insightText.textContent=buildInsight(r,tt);
 renderDashboard(r);renderScaling(r);renderCohort(r);renderScenarios();
}
function buildInsight(r,tt){
 if(r.clicks<=0||r.rawFinal<=0)return t('invalid');
 if(state.vertical==='brand'&&r.unitRevenue<=0){
  const target=n(state.values.brand.brandTargetCost);
  if(target>0)return r.allInCpa<=target
   ?L(`Фактична ціна результату ${money(r.allInCpa)} нижча за ціль ${money(target)}.`,`Actual result cost ${money(r.allInCpa)} is below the target ${money(target)}.`)
   :L(`Фактична ціна результату ${money(r.allInCpa)} вища за ціль ${money(target)} на ${pct((r.allInCpa/target-1)*100)}.`,`Actual result cost ${money(r.allInCpa)} is above the target ${money(target)} by ${pct((r.allInCpa/target-1)*100)}.`);
 }
 if(tt==='positive')return L(`Поточний CPA має запас ${pct((r.maxCpa/r.cpa-1)*100)} до межі беззбитковості.`,`Current CPA has ${pct((r.maxCpa/r.cpa-1)*100)} headroom before break-even.`);
 if(tt==='warning'&&r.profit>=0)return L('Кампанія в плюсі, але запас малий: зміна CPC або CR приблизно на 10–15% може з’їсти прибуток.','The campaign is profitable, but the buffer is thin: a 10–15% move in CPC or CR can erase profit.');
 return L(`Для виходу в нуль потрібен CPA не вище ${money(r.maxCpa)} або фінальна CR не нижче ${pct(r.requiredCvr)}.`,`To break even, CPA must be no higher than ${money(r.maxCpa)} or final CR must reach at least ${pct(r.requiredCvr)}.`);
}
