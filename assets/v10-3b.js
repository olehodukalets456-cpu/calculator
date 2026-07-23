function renderScaling(r){
 dom.scaleSection.hidden=!(state.scalingEnabled&&r.scaled);if(dom.scaleSection.hidden)return;
 const s=r.scaled;
 dom.scaleSummary.innerHTML=[
  compare(t('budget'),`${money(r.spend)} → ${money(s.spend)}`),compare(t('scaledCpc'),`${money(r.cpc)} → ${money(s.cpc)}`),compare(t('scaledCvr'),`${pct(r.overallCvr)} → ${pct(s.overallCvr)}`),compare(t('profit'),`${money(r.profit)} → ${money(s.profit)}`),compare(t('maxScaleBudget'),money(r.maxScaleBudget))
 ].join('');
 dom.scaleDelta.textContent=`${t('scaleDoublings')}: ${s.doublings.toFixed(2)}. ROI: ${pct(r.roi)} → ${pct(s.roi)}. CPA: ${money(r.allInCpa)} → ${money(s.allInCpa)}.`;
}
function renderCohort(r){
 dom.cohortSection.hidden=!r.cohort;if(!r.cohort)return;
 const c=r.cohort;
 dom.cohortSummary.innerHTML=[compare(t('payback'),c.payback?`${c.payback} ${state.lang==='uk'?'міс.':'mo.'}`:t('noPayback')),compare(t('ltv3'),money(c.ltv3)),compare(t('ltv6'),money(c.ltv6)),compare(t('ltv12'),money(c.ltv12)),compare(t('churnRate'),pct(c.churn*100))].join('');
 const w=720,h=230,p=34,max=Math.max(...c.rows.map(x=>Math.max(x.cumulative,x.cumProfit,0)),r.totalCosts,1),min=Math.min(...c.rows.map(x=>Math.min(x.cumProfit,0)),0),range=max-min;
 const pts=c.rows.map((x,i)=>`${p+i*(w-2*p)/Math.max(1,c.rows.length-1)},${h-p-(x.cumProfit-min)/range*(h-2*p)}`).join(' ');
 const zeroY=h-p-(0-min)/range*(h-2*p);
 dom.cohortChart.innerHTML=`<svg viewBox="0 0 ${w} ${h}" role="img"><line x1="${p}" y1="${zeroY}" x2="${w-p}" y2="${zeroY}" stroke="#bfc5cd" stroke-dasharray="5 4"/><polyline fill="none" stroke="#1f55d5" stroke-width="3" points="${pts}"/>${c.rows.map((x,i)=>`<circle cx="${p+i*(w-2*p)/Math.max(1,c.rows.length-1)}" cy="${h-p-(x.cumProfit-min)/range*(h-2*p)}" r="3" fill="#1f55d5"/><text x="${p+i*(w-2*p)/Math.max(1,c.rows.length-1)}" y="${h-8}" text-anchor="middle" font-size="9">${x.month}</text>`).join('')}<text x="${p}" y="12" font-size="10">${esc(t('cumulativeProfit'))}</text></svg>`;
 dom.cohortTable.innerHTML=`<table class="cohort-table"><thead><tr><th>${t('month')}</th><th>${t('activeCustomers')}</th><th>${t('monthlyGrossProfit')}</th><th>${t('cumulativeGrossProfit')}</th><th>${t('cumulativeProfit')}</th></tr></thead><tbody>${c.rows.map(x=>`<tr><td>${x.month}</td><td>${count(x.active)}</td><td>${money(x.gp)}</td><td>${money(x.cumulative)}</td><td>${money(x.cumProfit)}</td></tr>`).join('')}</tbody></table>`;
}
function renderScenarios(){
 dom.scenarioSlots.innerHTML=state.scenarios.map((s,i)=>`<div class="scenario-slot"><input data-slot-name="${i}" value="${esc(s?.name||t(`scenario${i+1}`))}" maxlength="40"><div class="scenario-slot-actions"><button class="scenario-button" data-save-slot="${i}" type="button">${t('saveScenario')}</button><button class="scenario-button delete" data-delete-slot="${i}" type="button" title="${t('deleteScenario')}">×</button></div></div>`).join('');
 dom.scenarioSlots.querySelectorAll('[data-save-slot]').forEach(b=>b.onclick=()=>saveScenario(Number(b.dataset.saveSlot)));
 dom.scenarioSlots.querySelectorAll('[data-delete-slot]').forEach(b=>b.onclick=()=>{state.scenarios[Number(b.dataset.deleteSlot)]=null;save();renderScenarios()});
 const active=state.scenarios.filter(Boolean);
 if(!active.length){dom.scenarioComparison.innerHTML=`<p style="color:var(--muted);font-size:10px">${t('noScenarios')}</p>`;return}
 const rows=[
  [t('budget'),x=>moneyScenario(x.result.spend,x.currency)],[t('cpc'),x=>moneyScenario(x.result.cpc,x.currency)],[t('overallCvr'),x=>pct(x.result.overallCvr)],[t('paidFinal'),x=>count(x.result.paidFinal)],[t('allInCpa'),x=>moneyScenario(x.result.allInCpa,x.currency)],[t('revenue'),x=>moneyScenario(x.result.grossRevenue,x.currency)],[t('profit'),x=>moneyScenario(x.result.profit,x.currency)],[t('roi'),x=>pct(x.result.roi)]
 ];
 dom.scenarioComparison.innerHTML=`<table class="scenario-table"><thead><tr><th>${t('scenariosTitle')}</th>${active.map(x=>`<th>${esc(x.name)}</th>`).join('')}</tr></thead><tbody>${rows.map(([lab,fn])=>`<tr><td>${esc(lab)}</td>${active.map(x=>`<td>${esc(fn(x))}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
}
function moneyScenario(v,c){const sym=CURR[c]||c;return Number.isFinite(v)?`${v<0?'-':''}${sym}${Math.abs(v).toLocaleString(undefined,{maximumFractionDigits:2})}`:'—'}
function saveScenario(i){
 if(!validate(true))return showMessage(t('invalid'),true);
 const name=dom.scenarioSlots.querySelector(`[data-slot-name="${i}"]`).value.trim()||t(`scenario${i+1}`);
 const r=calculate();
 state.scenarios[i]={name,currency:state.currency,vertical:state.vertical,result:JSON.parse(JSON.stringify(r)),savedAt:new Date().toISOString()};
 save();renderScenarios();showMessage(t('scenarioSaved'));
}

function calculateAndRender(){const r=calculate();renderResults(r)}
function renderAll(){ensureState();applyTranslations();renderVerticals();renderFields();calculateAndRender()}

function showMessage(msg,error=false){dom.actionMessage.style.color=error?'var(--negative)':'var(--positive)';dom.actionMessage.textContent=msg;clearTimeout(showMessage._t);showMessage._t=setTimeout(()=>dom.actionMessage.textContent='',3500)}
async function copyText(text){try{await navigator.clipboard.writeText(text);return true}catch{const ta=document.createElement('textarea');ta.value=text;document.body.append(ta);ta.select();const ok=document.execCommand('copy');ta.remove();return ok}}
function summaryText(){
 const r=calculate(),cfg=VERTICALS[state.vertical];
 return [`${t(cfg.title)}`,`${t('budget')}: ${money(r.spend)}`,`${t('cpc')}: ${money(r.cpc)}`,`${t('paidFinal')}: ${count(r.paidFinal)}`,`${t('allInCpa')}: ${money(r.allInCpa)}`,`${t('revenue')}: ${money(r.grossRevenue)}`,`${t('profit')}: ${money(r.profit)}`,`ROI: ${pct(r.roi)}`,`${t('maxCpc')}: ${money(r.maxCpc)}`].join('\n');
}
async function copySummary(){if(!validate(true))return showMessage(t('invalid'),true);showMessage(await copyText(summaryText())?t('copied'):t('copyError'),false)}
async function copyLink(){
 const payload={lang:state.lang,currency:state.currency,vertical:state.vertical,basis:state.basis,values:state.values,stages:state.stages,scalingEnabled:state.scalingEnabled,cohortEnabled:state.cohortEnabled};
 const hash=btoa(encodeURIComponent(JSON.stringify(payload)));const url=`${location.origin}${location.pathname}#${HASH_KEY}=${encodeURIComponent(hash)}`;
 showMessage(await copyText(url)?t('linkCopied'):t('copyError'));
}
function csvRows(){
 const r=calculate(),cfg=VERTICALS[state.vertical],rows=[];
 rows.push(['Section','Metric','Value'],['Current',t(cfg.title),''],['Input',t('budget'),r.spend],['Input',t('cpc'),r.cpc]);
 Object.entries(state.values[state.vertical]).forEach(([k,v])=>rows.push(['Input',t(k),v]));
 state.stages[state.vertical].forEach((s,i)=>rows.push(['Funnel',state.lang==='uk'?s.nameUk:s.nameEn,s.rate]));
 [['Result',t('clicks'),r.clicks],['Result',t('paidFinal'),r.paidFinal],['Result',t('revenue'),r.grossRevenue],['Result',t('profit'),r.profit],['Result','ROI',r.roi],['Result',t('allInCpa'),r.allInCpa],['Limit',t('maxCpa'),r.maxCpa],['Limit',t('maxCpc'),r.maxCpc]].forEach(x=>rows.push(x));
 if(r.scaled)[['Scaling',t('budget'),r.scaled.spend],['Scaling',t('scaledCpc'),r.scaled.cpc],['Scaling',t('scaledCvr'),r.scaled.overallCvr],['Scaling',t('profit'),r.scaled.profit],['Scaling','ROI',r.scaled.roi]].forEach(x=>rows.push(x));
 state.scenarios.filter(Boolean).forEach(s=>[['Scenario',`${s.name} - ${t('budget')}`,s.result.spend],['Scenario',`${s.name} - ${t('profit')}`,s.result.profit],['Scenario',`${s.name} - ROI`,s.result.roi]].forEach(x=>rows.push(x)));
 return rows;
}
function csvText(delim=','){return csvRows().map(row=>row.map(v=>`"${String(v??'').replace(/"/g,'""')}"`).join(delim)).join('\n')}
function downloadCsv(){if(!validate(true))return showMessage(t('invalid'),true);const blob=new Blob(['\uFEFF'+csvText()],{type:'text/csv;charset=utf-8'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`buying-report-${new Date().toISOString().slice(0,10)}.csv`;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),2000);showMessage(t('csvDownloaded'))}
async function openSheets(){if(!validate(true))return showMessage(t('invalid'),true);const win=window.open('about:blank','_blank');const tsv=csvRows().map(r=>r.join('\t')).join('\n');const ok=await copyText(tsv);if(ok){if(win)win.location='https://sheets.new';else location.href='https://sheets.new';showMessage(t('sheetsCopied'))}else{if(win)win.close();showMessage(t('copyError'),true)}}

function openReportModal(){if(!validate(true))return showMessage(t('invalid'),true);dom.projectNameInput.value='';dom.projectNameError.textContent='';dom.reportModal.hidden=false;document.body.style.overflow='hidden';setTimeout(()=>dom.projectNameInput.focus(),50)}
function closeReportModal(){dom.reportModal.hidden=true;document.body.style.overflow='';dom.projectNameError.textContent=''}
function fileSlug(v){return String(v).trim().toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9\u0400-\u04ff]+/gi,'-').replace(/^-+|-+$/g,'')||'buying-report'}
