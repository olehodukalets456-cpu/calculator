renderScenarios=function(){
  dom.scenarioSlots.innerHTML=state.scenarios.map((s,i)=>`<div class="scenario-slot"><input data-slot-name="${i}" value="${esc(s?.name||t(`scenario${i+1}`))}" maxlength="40"><div class="scenario-slot-actions"><button class="scenario-button" data-save-slot="${i}" type="button">${t('saveScenario')}</button><button class="scenario-button delete" data-delete-slot="${i}" type="button" title="${t('deleteScenario')}">×</button></div></div>`).join('');
  dom.scenarioSlots.querySelectorAll('[data-save-slot]').forEach(b=>b.onclick=()=>saveScenario(Number(b.dataset.saveSlot)));dom.scenarioSlots.querySelectorAll('[data-delete-slot]').forEach(b=>b.onclick=()=>{state.scenarios[Number(b.dataset.deleteSlot)]=null;save();renderScenarios()});
  const active=state.scenarios.filter(Boolean);if(!active.length){dom.scenarioComparison.innerHTML=`<p style="color:var(--muted);font-size:10px">${t('noScenarios')}</p>`;return}
  const trafficValue=x=>x.result.mode==='stage'?`${x.result.startLabel}: ${moneyScenario(x.result.trafficCost,x.currency)}`:`CPC: ${moneyScenario(x.result.trafficCost,x.currency)}`;
  const rows=[[t('budget'),x=>moneyScenario(x.result.spend,x.currency)],[t('trafficCost'),trafficValue],[t('conversionFromStart'),x=>pct(x.result.overallCvr)],[t('paidFinal'),x=>count(x.result.paidFinal)],[t('allInCpa'),x=>moneyScenario(x.result.allInCpa,x.currency)],[t('revenue'),x=>moneyScenario(x.result.grossRevenue,x.currency)],[t('profit'),x=>moneyScenario(x.result.profit,x.currency)],[t('roi'),x=>pct(x.result.roi)]];
  dom.scenarioComparison.innerHTML=`<table class="scenario-table"><thead><tr><th>${t('scenariosTitle')}</th>${active.map(x=>`<th>${esc(x.name)}</th>`).join('')}</tr></thead><tbody>${rows.map(([lab,fn])=>`<tr><td>${esc(lab)}</td>${active.map(x=>`<td>${esc(fn(x))}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
};

summaryText=function(){
  const r=calculate(),cfg=VERTICALS[state.vertical],trafficLine=r.mode==='cpc'?`${t('cpc')}: ${money(r.trafficCost)}`:`${r.startLabel}: ${money(r.trafficCost)} (${t('trafficCost')})`;
  return [`${t(cfg.title)}`,`${t('budget')}: ${money(r.spend)}`,trafficLine,`${t('paidFinal')}: ${count(r.paidFinal)}`,`${t('allInCpa')}: ${money(r.allInCpa)}`,`${t('revenue')}: ${money(r.grossRevenue)}`,`${t('profit')}: ${money(r.profit)}`,`ROI: ${pct(r.roi)}`,`${r.mode==='cpc'?t('maxCpc'):t('maxTrafficCost')}: ${money(r.maxTrafficCost)}`].join('\n');
};
copyLink=async function(){
  const payload={lang:state.lang,currency:state.currency,vertical:state.vertical,basis:state.basis,values:state.values,stages:state.stages,trafficMode:state.trafficMode,anchorStage:state.anchorStage,scalingEnabled:state.scalingEnabled,cohortEnabled:state.cohortEnabled};
  const hash=btoa(encodeURIComponent(JSON.stringify(payload))),url=`${location.origin}${location.pathname}#${HASH_KEY}=${encodeURIComponent(hash)}`;showMessage(await copyText(url)?t('linkCopied'):t('copyError'));
};
csvRows=function(){
  const r=calculate(),cfg=VERTICALS[state.vertical],rows=[];
  rows.push(['Section','Metric','Value'],['Current',t(cfg.title),''],['Input',t('budget'),r.spend],['Input',r.mode==='cpc'?t('cpc'):`${t('trafficCost')}: ${r.startLabel}`,r.trafficCost]);
  Object.entries(state.values[state.vertical]).filter(([k])=>!['adSpend','cpc','anchorCost'].includes(k)).forEach(([k,v])=>rows.push(['Input',t(k),v]));
  r.funnel.forEach((s,i)=>rows.push(['Funnel',s.label,i?`${s.rate*100}%`:'Start']));
  [['Result',t('startVolume'),r.startCount],['Result',t('paidFinal'),r.paidFinal],['Result',t('revenue'),r.grossRevenue],['Result',t('profit'),r.profit],['Result','ROI',r.roi],['Result',t('allInCpa'),r.allInCpa],['Limit',t('maxCpa'),r.maxCpa],['Limit',r.mode==='cpc'?t('maxCpc'):t('maxTrafficCost'),r.maxTrafficCost]].forEach(x=>rows.push(x));
  if(r.scaled)[['Scaling',t('budget'),r.scaled.spend],['Scaling',t('scaledTrafficCost'),r.scaled.trafficCost],['Scaling',t('conversionFromStart'),r.scaled.overallCvr],['Scaling',t('profit'),r.scaled.profit],['Scaling','ROI',r.scaled.roi]].forEach(x=>rows.push(x));
  state.scenarios.filter(Boolean).forEach(s=>[['Scenario',`${s.name} - ${t('budget')}`,s.result.spend],['Scenario',`${s.name} - ${t('trafficCost')}`,s.result.trafficCost],['Scenario',`${s.name} - ${t('profit')}`,s.result.profit],['Scenario',`${s.name} - ROI`,s.result.roi]].forEach(x=>rows.push(x)));
  return rows;
};

reportHtml=function(project,r,recs){
  const cfg=VERTICALS[state.vertical],trafficInput=r.mode==='cpc'?[t('cpc'),money(r.trafficCost)]:[`${t('trafficCost')}: ${r.startLabel}`,money(r.trafficCost)];
  const inputs=[['Vertical',t(cfg.title)],[t('budget'),money(r.spend)],trafficInput,...Object.entries(state.values[state.vertical]).filter(([k,v])=>v!==''&&!['adSpend','cpc','anchorCost'].includes(k)).map(([k,v])=>[t(k),String(v)])];
  const results=[[t('paidFinal'),count(r.paidFinal)],[t('revenue'),money(r.grossRevenue)],[t('profit'),money(r.profit)],['ROI',pct(r.roi)],[t('allInCpa'),money(r.allInCpa)],[r.mode==='cpc'?t('maxCpc'):t('maxTrafficCost'),money(r.maxTrafficCost)]];
  return `<h1>${esc(project)}</h1><p>${esc(t('reportTitle'))} · ${esc(new Date().toLocaleString(state.lang==='uk'?'uk-UA':'en-US'))}</p><h2>${t('reportResults')}</h2><div class="report-grid">${results.map(([a,b])=>`<div class="report-box"><small>${esc(a)}</small><strong>${esc(b)}</strong></div>`).join('')}</div><h2>${t('reportInputs')}</h2><table class="report-table">${inputs.map(([a,b])=>`<tr><td>${esc(a)}</td><td>${esc(b)}</td></tr>`).join('')}</table><h2>${t('reportFunnel')}</h2><table class="report-table"><tr><th>${t('stageConversion')}</th><th>${t('rawFinal')}</th><th>CR</th></tr>${r.funnel.map((x,i)=>`<tr><td>${esc(x.label)}</td><td>${count(x.value)}</td><td>${i?pct(x.rate*100):'100%'}</td></tr>`).join('')}</table>${r.scaled?`<h2>${t('reportScaling')}</h2><div class="report-grid">${[[t('budget'),money(r.scaled.spend)],[t('scaledTrafficCost'),money(r.scaled.trafficCost)],[t('conversionFromStart'),pct(r.scaled.overallCvr)],[t('profit'),money(r.scaled.profit)],['ROI',pct(r.scaled.roi)]].map(([a,b])=>`<div class="report-box"><small>${esc(a)}</small><strong>${esc(b)}</strong></div>`).join('')}</div>`:''}${r.cohort?`<h2>${t('reportCohort')}</h2><table class="report-table"><tr><th>${t('month')}</th><th>${t('activeCustomers')}</th><th>${t('monthlyGrossProfit')}</th><th>${t('cumulativeProfit')}</th></tr>${r.cohort.rows.map(x=>`<tr><td>${x.month}</td><td>${count(x.active)}</td><td>${money(x.gp)}</td><td>${money(x.cumProfit)}</td></tr>`).join('')}</table>`:''}<h2>${t('reportRecommendations')}</h2>${recs.map(x=>`<div class="report-rec">${esc(x.text)}</div>`).join('')}${state.scenarios.filter(Boolean).length?`<h2>${t('reportScenarios')}</h2><table class="report-table"><tr><th>${t('scenariosTitle')}</th><th>${t('budget')}</th><th>${t('trafficCost')}</th><th>${t('allInCpa')}</th><th>${t('profit')}</th><th>ROI</th></tr>${state.scenarios.filter(Boolean).map(s=>`<tr><td>${esc(s.name)}</td><td>${moneyScenario(s.result.spend,s.currency)}</td><td>${moneyScenario(s.result.trafficCost,s.currency)}</td><td>${moneyScenario(s.result.allInCpa,s.currency)}</td><td>${moneyScenario(s.result.profit,s.currency)}</td><td>${pct(s.result.roi)}</td></tr>`).join('')}</table>`:''}`;
};

resetCurrent=function(){
  state.values[state.vertical]={};state.stages[state.vertical]=defaultStages(state.vertical);state.basis[state.vertical]=VERTICALS[state.vertical].defaultBasis||'first';state.trafficMode[state.vertical]='cpc';state.anchorStage[state.vertical]=state.stages[state.vertical][0]?.id||'';state.scalingEnabled=false;state.cohortEnabled=false;save();renderAll();
};

ensureState();save();renderAll();
dom.reset.onclick=resetCurrent;dom.share.onclick=copyLink;
