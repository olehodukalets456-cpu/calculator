// Cost ceilings hold the entered budget, funnel rates and fixed costs constant.
computeModel=function({spend,cpc,rates,vals,mode=trafficMode(),aIndex=anchorIndex(),stages=currentStages()}){
 const anchorCost=n(vals.anchorCost),startIndex=mode==='stage'?aIndex:-1,trafficCost=mode==='cpc'?cpc:anchorCost;
 const startCount=trafficCost>0?spend/trafficCost:0,clicks=mode==='cpc'?startCount:NaN;
 const startLabel=mode==='cpc'?t('clicks'):L(stages[startIndex]?.nameUk,stages[startIndex]?.nameEn);
 let current=startCount;const funnel=[{label:startLabel,value:current,rate:1,drop:0,stageIndex:startIndex}];
 for(let i=startIndex+1;i<rates.length;i++){
  const prev=current,rate=rates[i];current*=rate;
  funnel.push({label:L(stages[i]?.nameUk,stages[i]?.nameEn),value:current,rate,drop:prev-current,stageIndex:i});
 }
 const rawFinal=current,approve=isBlank(vals.approveRate)?1:n(vals.approveRate)/100,refund=isBlank(vals.refundRate)?0:n(vals.refundRate)/100;
 const paidFinal=rawFinal*approve*(1-refund),unitRevenue=valuePerResult(vals),hasRevenue=state.vertical!=='brand'||!isBlank(vals.brandResultValue);
 const grossRevenue=hasRevenue?paidFinal*unitRevenue:NaN,margin=state.vertical==='brand'?1:n(vals.margin)/100;
 const paymentRate=n(vals.paymentFee)/100,taxRate=n(vals.taxRate)/100,agencyRate=n(vals.agencyFee)/100;
 const paymentFee=grossRevenue*paymentRate,tax=grossRevenue*taxRate,agency=spend*agencyRate,fixed=n(vals.fixedCosts);
 // A negative contribution is a real loss, including in the cohort model.
 const unitContribution=hasRevenue?unitRevenue*(margin-paymentRate-taxRate):NaN;
 const contribution=paidFinal*unitContribution,totalCosts=spend+agency+fixed,profit=contribution-totalCosts;
 const roi=totalCosts>0?profit/totalCosts*100:NaN,roas=spend>0?grossRevenue/spend:NaN;
 const cpa=paidFinal>0?spend/paidFinal:NaN,allInCpa=paidFinal>0?totalCosts/paidFinal:NaN;
 const paidRateFromStart=startCount>0?paidFinal/startCount:0;
 const maxCpa=hasRevenue&&totalCosts>0?Math.max(0,spend*unitContribution/totalCosts):NaN;
 const maxTrafficCost=maxCpa*paidRateFromStart,maxCpc=mode==='cpc'?maxTrafficCost:NaN;
 const maxSpend=hasRevenue?Math.max(0,(contribution-fixed)/(1+agencyRate)):NaN;
 const reqRaw=unitContribution>0&&approve*(1-refund)>0?totalCosts/unitContribution/(approve*(1-refund)):Infinity;
 const requiredCvr=hasRevenue&&startCount>0?reqRaw/startCount*100:NaN,overallCvr=startCount>0?rawFinal/startCount*100:0;
 const holdDays=n(vals.holdDays),lifetimeBasis=!!VERTICALS[state.vertical].basis&&state.basis[state.vertical]==='ltv';
 // Future LTV has no receipt schedule; it is not all payable after the hold.
 const heldAmount=hasRevenue&&!lifetimeBasis?(holdDays>0?grossRevenue-paymentFee-tax:0):NaN,cashGap=holdDays>0?totalCosts:0;
 const activeRate=isBlank(vals.activeRate)?NaN:n(vals.activeRate)/100,activeAudience=state.vertical==='brand'?paidFinal*activeRate:NaN;
 const costPerActive=activeAudience>0?totalCosts/activeAudience:NaN;
 return {mode,anchorIndex:startIndex,startLabel,trafficCost,maxTrafficCost,startCount,spend,cpc,anchorCost,clicks,funnel,rawFinal,approve,refund,paidFinal,unitRevenue,hasRevenue,grossRevenue,margin,paymentFee,tax,agency,fixed,contribution,totalCosts,profit,roi,roas,cpa,allInCpa,unitContribution,maxSpend,maxCpa,maxCpc,requiredCvr,overallCvr,holdDays,heldAmount,cashGap,activeAudience,costPerActive,fees:paymentFee+tax+agency};
};

function scaledModel(input,budget){
 const doublings=Math.max(0,Math.log2(budget/input.spend)),cost=input.mode==='cpc'?input.cpc:input.anchorCost;
 const scaledCost=cost*Math.pow(1+n(input.vals.cpcGrowth)/100,doublings);
 const first=input.mode==='cpc'?0:input.aIndex+1,activeCount=input.rates.length-first;
 const overallFactor=Math.pow(1-n(input.vals.crDrop)/100,doublings),factor=activeCount?Math.pow(overallFactor,1/activeCount):1;
 const scaledRates=input.rates.map((rate,i)=>i>=first?rate*factor:rate);
 const result=computeModel({...input,spend:budget,cpc:input.mode==='cpc'?scaledCost:NaN,vals:{...input.vals,anchorCost:scaledCost},rates:scaledRates});
 return {...result,doublings,scaledRates};
}
calculate=function(){
 const input=flexibleInputs(),base=computeModel(input);let scaled=null,maxScaleBudget=NaN;
 if(state.scalingEnabled&&input.spend>0&&n(input.vals.targetBudget)>=input.spend&&base.trafficCost>0){
  scaled=scaledModel(input,n(input.vals.targetBudget));maxScaleBudget=base.hasRevenue?findMaxScaleBudget(input):NaN;
 }
 const cohort=state.cohortEnabled&&VERTICALS[state.vertical].cohort?computeCohort(base,input.vals):null;
 return {...base,scaled,maxScaleBudget,cohort};
};
findMaxScaleBudget=function(input){
 const base=computeModel(input),b=input.spend,a=1+n(input.vals.agencyFee)/100;
 if(!(b>0)||!base.hasRevenue)return NaN;
 if(!(base.contribution>0))return 0;
 const downstream=input.mode==='cpc'?input.rates.length:input.rates.length-input.aIndex-1;
 const growth=n(input.vals.cpcGrowth)/100,drop=downstream?n(input.vals.crDrop)/100:0;
 if(growth===0&&drop===0){const slope=base.contribution/b-a;return slope>0||(slope===0&&base.fixed===0)?Infinity:0}
 if(drop===1)return base.profit>=0?b:0;
 const q=1-Math.log2(1+growth)+Math.log2(1-drop);
 const profitAt=budget=>base.contribution*Math.pow(budget/b,q)-a*budget-base.fixed;
 // For 0 < q < 1 profit is concave. Scaling can cover fixed costs even if
 // the base budget loses money, so inspect the peak before rejecting it.
 const peak=q>0?b*Math.pow(base.contribution*q/(a*b),1/(1-q)):b;
 let lo=Math.max(b,peak);if(!Number.isFinite(lo))return NaN;if(profitAt(lo)<0)return 0;
 let hi=lo*2;while(Number.isFinite(hi)&&profitAt(hi)>=0)hi*=2;
 if(!Number.isFinite(hi))return NaN;
 for(let i=0;i<90;i++){const mid=lo+(hi-lo)/2;if(profitAt(mid)>=0)lo=mid;else hi=mid}
 return lo;
};

function inputRules(){
 const rules={},cfg=VERTICALS[state.vertical];
 const add=(key,required=false,min=0,max=1e12,integer=false)=>rules[key]={required,min,max,integer};
 add('adSpend',true,Number.MIN_VALUE);add(trafficMode()==='cpc'?'cpc':'anchorCost',true,Number.MIN_VALUE);
 cfg.fields.forEach(def=>{
  if(state.vertical==='ecom'&&((def.key==='aov'&&state.basis.ecom==='ltv')||(def.key==='customerLtv'&&state.basis.ecom!=='ltv')))return;
  if(def.key==='lifetimeMonths'&&state.basis.saas!=='ltv')return;
  if(def.key==='monthlyStudentValue'&&!state.cohortEnabled)return;
  add(def.key,isFieldRequired(def),0,def.type==='percent'?100:1e12);
 });
 if(state.vertical==='brand')rules.brandTargetCost.min=Number.MIN_VALUE;
 if(state.vertical==='saas'&&state.basis.saas==='ltv')rules.lifetimeMonths.min=Number.MIN_VALUE;
 ['approveRate','refundRate','paymentFee','taxRate','agencyFee'].forEach(key=>add(key,false,0,100));add('holdDays',false,0,36500,true);
 if(state.scalingEnabled){add('targetBudget',true,Math.max(Number.MIN_VALUE,n(state.values[state.vertical].adSpend)));add('cpcGrowth',true,0,500);add('crDrop',true,0,100)}
 if(state.cohortEnabled&&cfg.cohort){add('churnRate',true,0,100);add('projectionMonths',true,1,36,true);if(state.vertical==='edtech')add('monthlyStudentValue',true)}
 return rules;
}
validate=function(mark=false){
 let ok=true;
 if(mark){document.querySelectorAll('.field.invalid,.stage-rate-wrap.invalid').forEach(x=>x.classList.remove('invalid'));document.querySelectorAll('input[aria-invalid]').forEach(x=>x.removeAttribute('aria-invalid'))}
 const vals=state.values[state.vertical];
 Object.entries(inputRules()).forEach(([key,rule])=>{
  const input=document.querySelector(`input[data-key="${key}"]`),raw=vals[key],value=parseNumeric(raw),empty=isBlank(raw);
  const bad=input?.validity.badInput||(empty?rule.required:!Number.isFinite(value)||value<rule.min||value>rule.max||(rule.integer&&!Number.isInteger(value)));
  if(!bad)return;ok=false;
  if(mark&&input){
   input.setAttribute('aria-invalid','true');const box=input.closest('.field');box.classList.add('invalid');
   box.querySelector('.field-error').textContent=key==='targetBudget'?L('Бюджет має бути не меншим за поточний.','Budget must be at least the current budget.'):
    rule.integer?L(`Введи ціле число від ${rule.min} до ${rule.max}.`,`Enter an integer from ${rule.min} to ${rule.max}.`):
    rule.max===100?t('errorPercent'):rule.max===500?L('Введи від 0 до 500%.','Enter 0–500%.'):
    rule.min>0?t('errorPositive'):L('Введи число від 0 до 1 000 000 000 000.','Enter a number from 0 to 1,000,000,000,000.');
   const details=box.closest('details');if(details)details.open=true;
  }
 });
 const first=trafficMode()==='cpc'?0:anchorIndex()+1;
 currentStages().forEach((stage,i)=>{
  if(i<first)return;
  const input=dom.funnelEditor.children[i]?.querySelector('.stage-rate'),value=parseNumeric(stage.rate);
  if(isBlank(stage.rate)||!Number.isFinite(value)||value<0||value>100||input?.validity.badInput){ok=false;if(mark&&input){input.closest('.stage-rate-wrap').classList.add('invalid');input.setAttribute('aria-invalid','true');input.title=t('errorPercent')}}
 });
 if(ok){
  const r=calculate(),models=[r,r.scaled].filter(Boolean);
  const finite=models.every(m=>[m.startCount,m.paidFinal,m.totalCosts,...(m.hasRevenue?[m.grossRevenue,m.profit,m.roi]:[])].every(Number.isFinite));
  if(!finite){ok=false;if(mark)showMessage(t('numericOverflow'),true)}
 }
 return ok;
};
