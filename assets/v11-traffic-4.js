renderScenarios=function(){
 dom.scenarioSlots.innerHTML=state.scenarios.map((s,i)=>`<div class="scenario-slot"><input data-slot-name="${i}" aria-label="${esc(t(`scenario${i+1}`))}" value="${esc(state.scenarioNames[i]??s?.name??t(`scenario${i+1}`))}" maxlength="40"><div class="scenario-slot-actions"><button class="scenario-button" data-save-slot="${i}" type="button">${t('saveScenario')}</button><button class="scenario-button delete" data-delete-slot="${i}" type="button" aria-label="${esc(t('deleteScenario')+' '+t(`scenario${i+1}`))}">×</button></div></div>`).join('');
 dom.scenarioSlots.querySelectorAll('[data-slot-name]').forEach(input=>input.oninput=()=>{state.scenarioNames[Number(input.dataset.slotName)]=input.value;save()});
 dom.scenarioSlots.querySelectorAll('[data-save-slot]').forEach(b=>b.onclick=()=>saveScenario(Number(b.dataset.saveSlot)));
 dom.scenarioSlots.querySelectorAll('[data-delete-slot]').forEach(b=>b.onclick=()=>{const i=Number(b.dataset.deleteSlot);state.scenarios[i]=null;state.scenarioNames[i]=null;save();renderScenarios()});
 const active=state.scenarios.filter(Boolean);
 if(!active.length){dom.scenarioComparison.innerHTML=`<p class="scenario-note">${t('noScenarios')}</p>`;return}
 const trafficValue=x=>`${x.result.mode==='stage'?x.result.startLabel:'CPC'}: ${moneyScenario(x.result.trafficCost,x.currency)}`;
 const rows=[[L('Вертикаль','Vertical'),x=>t(VERTICALS[x.vertical].title)],[L('Валюта','Currency'),x=>x.currency],[t('budget'),x=>moneyScenario(x.result.spend,x.currency)],[t('trafficCost'),trafficValue],[t('conversionFromStart'),x=>pct(x.result.overallCvr)],[t('paidFinal'),x=>count(x.result.paidFinal)],[t('allInCpa'),x=>moneyScenario(x.result.allInCpa,x.currency)],[t('revenue'),x=>x.result.hasRevenue?moneyScenario(x.result.grossRevenue,x.currency):'—'],[t('profit'),x=>x.result.hasRevenue?moneyScenario(x.result.profit,x.currency):'—'],['ROI',x=>x.result.hasRevenue?pct(x.result.roi):'—']];
 dom.scenarioComparison.innerHTML=`<p class="scenario-note">${t('snapshotHint')}</p><table class="scenario-table"><thead><tr><th>${t('scenariosTitle')}</th>${active.map(x=>`<th>${esc(x.name)}</th>`).join('')}</tr></thead><tbody>${rows.map(([label,fn])=>`<tr><td>${esc(label)}</td>${active.map(x=>`<td>${esc(fn(x))}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
};

function resultRows(r,currency=state.currency){
 const cash=v=>moneyScenario(v,currency);
 return [[t('paidFinal'),count(r.paidFinal)],[t('allInCpa'),cash(r.allInCpa)],...(r.hasRevenue?[[t('revenue'),cash(r.grossRevenue)],[t('profit'),cash(r.profit)],['ROI',pct(r.roi)],['ROAS',Number.isFinite(r.roas)?r.roas.toFixed(2)+'×':'—'],[t('maxCpa'),cash(r.maxCpa)],[r.mode==='cpc'?t('maxCpc'):t('maxTrafficCost'),cash(r.maxTrafficCost)]]:[[t('activeAudience'),count(r.activeAudience)],[t('costPerActive'),cash(r.costPerActive)]])];
}
function inputUnit(key){
 if(['margin','approveRate','refundRate','paymentFee','taxRate','agencyFee','cpcGrowth','crDrop','churnRate','activeRate'].includes(key))return '%';
 if(key==='holdDays')return L('днів','days');
 if(['lifetimeMonths','projectionMonths'].includes(key))return L('місяців','months');
 return state.currency;
}
function inputRows(){
 const vals=state.values[state.vertical];
 return Object.keys(inputRules()).map(key=>{
  let value=isBlank(vals[key])?(key==='approveRate'?100:['fixedCosts','refundRate','holdDays','paymentFee','taxRate','agencyFee'].includes(key)?0:'—'):parseNumeric(vals[key]);
  return [`${t(key)} (${inputUnit(key)})`,value];
 });
}
summaryText=function(){
 const r=calculate(),cfg=VERTICALS[state.vertical];
 return [t(cfg.title),`${L('Валюта','Currency')}: ${state.currency}`,`${t('budget')}: ${money(r.spend)}`,`${r.mode==='cpc'?'CPC':r.startLabel}: ${money(r.trafficCost)}`,...resultRows(r).map(([label,value])=>`${label}: ${value}`)].join('\n');
};
function scenarioPayload(){
 const k=state.vertical;
 return {version:12,lang:state.lang,currency:state.currency,vertical:k,basis:{[k]:state.basis[k]},values:{[k]:state.values[k]},stages:{[k]:state.stages[k]},trafficMode:{[k]:state.trafficMode[k]},anchorStage:{[k]:state.anchorStage[k]},scalingEnabled:state.scalingEnabled,cohortEnabled:state.cohortEnabled};
}
copyLink=async function(){
 const hash=btoa(encodeURIComponent(JSON.stringify(scenarioPayload()))),url=`${location.origin}${location.pathname}#${HASH_KEY}=${encodeURIComponent(hash)}`;
 const ok=await copyText(url);showMessage(t(ok?'linkCopied':'copyError'),!ok);
};
csvRows=function(){
 const r=calculate(),rows=[['Section','Metric','Value','Unit'],['Current',L('Вертикаль','Vertical'),t(VERTICALS[state.vertical].title),''],['Current',L('Валюта','Currency'),state.currency,''],['Current',t('calculationBasis'),VERTICALS[state.vertical].basis?state.basis[state.vertical]:'',''],['Current',t('trafficCost'),r.mode==='cpc'?'CPC':r.startLabel,'']];
 inputRows().forEach(([label,value],i)=>rows.push(['Input',label,value,inputUnit(Object.keys(inputRules())[i])]));
 r.funnel.forEach((s,i)=>{rows.push(['Funnel volume',s.label,s.value,'']);if(i)rows.push(['Funnel CR (%)',s.label,s.rate*100,''])});
 const addResults=(section,model,currency)=>{
  const metrics=[['startVolume','startCount'],['paidFinal','paidFinal'],['allInCpa','allInCpa'],['totalCosts','totalCosts'],...(model.hasRevenue?[['revenue','grossRevenue'],['profit','profit'],['roi','roi'],['roas','roas'],['maxCpa','maxCpa'],['maxTrafficCost','maxTrafficCost']]:[['activeAudience','activeAudience'],['costPerActive','costPerActive']])];
  metrics.forEach(([label,key])=>rows.push([section,t(label),Number.isFinite(model[key])?model[key]:'',['startCount','paidFinal','activeAudience'].includes(key)?'':key==='roi'?'%':key==='roas'?'×':currency]));
 };
 addResults('Result',r,state.currency);
 if(r.scaled){rows.push(['Scaling',t('budget'),r.scaled.spend,state.currency],['Scaling',t('trafficCost'),r.scaled.trafficCost,state.currency]);addResults('Scaling',r.scaled,state.currency);if(r.hasRevenue)rows.push(['Scaling',t('maxScaleBudget'),Number.isFinite(r.maxScaleBudget)&&r.maxScaleBudget>0?r.maxScaleBudget:scaleLimitText(r.maxScaleBudget),state.currency])}
 if(r.cohort){rows.push(['Cohort',t('payback'),r.cohort.payback??t('noPayback'),'']);r.cohort.rows.forEach(x=>{for(const [label,key] of [['activeCustomers','active'],['monthlyGrossProfit','gp'],['cumulativeGrossProfit','cumulative'],['cumulativeProfit','cumProfit']])rows.push(['Cohort',`${t('month')} ${x.month}: ${t(label)}`,x[key],key==='active'?'':state.currency])})}
 state.scenarios.filter(Boolean).forEach(s=>{rows.push([`Scenario: ${s.name}`,t('budget'),s.result.spend,s.currency],[`Scenario: ${s.name}`,t('trafficCost'),s.result.trafficCost,s.currency]);addResults(`Scenario: ${s.name}`,s.result,s.currency)});
 if(r.holdDays>0)rows.push(['Assumption',t('cashGap'),t('cashAssumption'),'']);if(r.cohort)rows.push(['Assumption',t('cohortTitle'),t('cohortAssumption'),'']);
 return rows;
};

function reportTable(rows){return `<table class="report-table">${rows.map(row=>`<tr>${row.map(value=>`<td>${esc(value)}</td>`).join('')}</tr>`).join('')}</table>`}
reportHtml=function(project,r,recs){
 const basis=VERTICALS[state.vertical].basis?t(state.basis[state.vertical]==='ltv'?'lifetime':state.vertical==='saas'?'firstMonth':'firstOrder'):'—';
 const inputs=[[L('Вертикаль','Vertical'),t(VERTICALS[state.vertical].title)],[L('Валюта','Currency'),state.currency],[t('calculationBasis'),basis],[t('trafficCost'),r.mode==='cpc'?'CPC':r.startLabel],...inputRows()];
 return `<h1>${esc(project)}</h1><p>${esc(t('reportTitle'))} · ${esc(new Date().toLocaleString(state.lang==='uk'?'uk-UA':'en-US'))}</p><h2>${t('reportResults')}</h2><div class="report-grid">${resultRows(r).map(([label,value])=>`<div class="report-box"><small>${esc(label)}</small><strong>${esc(value)}</strong></div>`).join('')}</div><h2>${t('reportInputs')}</h2>${reportTable(inputs)}<h2>${t('reportFunnel')}</h2>${reportTable([[t('stageConversion'),t('rawFinal'),'CR'],...r.funnel.map((s,i)=>[s.label,count(s.value),i?pct(s.rate*100):'100%'])])}${r.scaled?`<h2>${t('reportScaling')}</h2>${reportTable([[t('budget'),money(r.scaled.spend)],[t('trafficCost'),money(r.scaled.trafficCost)],...resultRows(r.scaled),...(r.hasRevenue?[[t('maxScaleBudget'),scaleLimitText(r.maxScaleBudget)]]:[])])}`:''}${r.cohort?`<h2>${t('reportCohort')}</h2>${reportTable([[t('payback'),r.cohort.payback??t('noPayback')],[t('month'),t('activeCustomers'),t('monthlyGrossProfit'),t('cumulativeProfit')],...r.cohort.rows.map(x=>[x.month,count(x.active),money(x.gp),money(x.cumProfit)])])}`:''}<h2>${t('reportRecommendations')}</h2>${recs.map(x=>`<div class="report-rec">${esc(x.text)}</div>`).join('')}${state.scenarios.some(Boolean)?`<h2>${t('reportScenarios')}</h2><p>${esc(t('snapshotHint'))}</p>${reportTable([[t('scenariosTitle'),L('Вертикаль','Vertical'),L('Валюта','Currency'),t('budget'),t('allInCpa'),t('profit'),'ROI'],...state.scenarios.filter(Boolean).map(s=>[s.name,t(VERTICALS[s.vertical].title),s.currency,moneyScenario(s.result.spend,s.currency),moneyScenario(s.result.allInCpa,s.currency),s.result.hasRevenue?moneyScenario(s.result.profit,s.currency):'—',s.result.hasRevenue?pct(s.result.roi):'—'])])}`:''}<p>${esc(t('disclaimer'))}</p>`;
};
resetCurrent=function(){
 state.values[state.vertical]={};state.stages[state.vertical]=defaultStages(state.vertical);state.basis[state.vertical]=VERTICALS[state.vertical].defaultBasis||'first';state.trafficMode[state.vertical]='cpc';state.anchorStage[state.vertical]=state.stages[state.vertical][0]?.id||'';state.scalingEnabled=false;state.cohortEnabled=false;save();renderAll();
};

load();renderAll();
dom.reset.onclick=resetCurrent;dom.share.onclick=copyLink;
