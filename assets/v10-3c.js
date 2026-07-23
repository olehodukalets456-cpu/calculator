function reportHtml(project,r,recs){
 const cfg=VERTICALS[state.vertical];
 const inputs=[['Vertical',t(cfg.title)],[t('budget'),money(r.spend)],[t('cpc'),money(r.cpc)],...Object.entries(state.values[state.vertical]).filter(([,v])=>v!=='').map(([k,v])=>[t(k),String(v)])];
 const results=[[t('paidFinal'),count(r.paidFinal)],[t('revenue'),money(r.grossRevenue)],[t('profit'),money(r.profit)],['ROI',pct(r.roi)],[t('allInCpa'),money(r.allInCpa)],[t('maxCpc'),money(r.maxCpc)]];
 return `<h1>${esc(project)}</h1><p>${esc(t('reportTitle'))} · ${esc(new Date().toLocaleString(state.lang==='uk'?'uk-UA':'en-US'))}</p>
 <h2>${t('reportResults')}</h2><div class="report-grid">${results.map(([a,b])=>`<div class="report-box"><small>${esc(a)}</small><strong>${esc(b)}</strong></div>`).join('')}</div>
 <h2>${t('reportInputs')}</h2><table class="report-table">${inputs.map(([a,b])=>`<tr><td>${esc(a)}</td><td>${esc(b)}</td></tr>`).join('')}</table>
 <h2>${t('reportFunnel')}</h2><table class="report-table"><tr><th>${t('stageConversion')}</th><th>${t('rawFinal')}</th><th>CR</th></tr>${r.funnel.map((x,i)=>`<tr><td>${esc(x.label)}</td><td>${count(x.value)}</td><td>${i?pct(x.rate*100):'100%'}</td></tr>`).join('')}</table>
 ${r.scaled?`<h2>${t('reportScaling')}</h2><div class="report-grid">${[[t('budget'),money(r.scaled.spend)],[t('scaledCpc'),money(r.scaled.cpc)],[t('scaledCvr'),pct(r.scaled.overallCvr)],[t('profit'),money(r.scaled.profit)],['ROI',pct(r.scaled.roi)]].map(([a,b])=>`<div class="report-box"><small>${esc(a)}</small><strong>${esc(b)}</strong></div>`).join('')}</div>`:''}
 ${r.cohort?`<h2>${t('reportCohort')}</h2><table class="report-table"><tr><th>${t('month')}</th><th>${t('activeCustomers')}</th><th>${t('monthlyGrossProfit')}</th><th>${t('cumulativeProfit')}</th></tr>${r.cohort.rows.map(x=>`<tr><td>${x.month}</td><td>${count(x.active)}</td><td>${money(x.gp)}</td><td>${money(x.cumProfit)}</td></tr>`).join('')}</table>`:''}
 <h2>${t('reportRecommendations')}</h2>${recs.map(x=>`<div class="report-rec">${esc(x.text)}</div>`).join('')}
 ${state.scenarios.filter(Boolean).length?`<h2>${t('reportScenarios')}</h2><table class="report-table"><tr><th>${t('scenariosTitle')}</th><th>${t('budget')}</th><th>${t('allInCpa')}</th><th>${t('profit')}</th><th>ROI</th></tr>${state.scenarios.filter(Boolean).map(s=>`<tr><td>${esc(s.name)}</td><td>${moneyScenario(s.result.spend,s.currency)}</td><td>${moneyScenario(s.result.allInCpa,s.currency)}</td><td>${moneyScenario(s.result.profit,s.currency)}</td><td>${pct(s.result.roi)}</td></tr>`).join('')}</table>`:''}`;
}
async function createPdf(project){
 const r=calculate();let weakest={i:0,drop:-1};r.funnel.slice(1).forEach((s,i)=>{if(s.drop>weakest.drop)weakest={i:i+1,drop:s.drop}});const recs=buildRecommendations(r,weakest.i);
 dom.reportRender.innerHTML=reportHtml(project,r,recs);
 await new Promise(res=>requestAnimationFrame(()=>requestAnimationFrame(res)));
 if(window.html2canvas&&window.jspdf?.jsPDF){
  const canvas=await html2canvas(dom.reportRender,{scale:1.5,backgroundColor:'#ffffff',useCORS:true,logging:false});
  const {jsPDF}=window.jspdf,pdf=new jsPDF('p','mm','a4'),pageW=210,pageH=297,margin=8,imgW=pageW-margin*2,pxPerMm=canvas.width/imgW,pagePx=(pageH-margin*2)*pxPerMm;
  let offset=0,page=0;
  while(offset<canvas.height){
   const slice=document.createElement('canvas');slice.width=canvas.width;slice.height=Math.min(pagePx,canvas.height-offset);
   slice.getContext('2d').drawImage(canvas,0,offset,canvas.width,slice.height,0,0,canvas.width,slice.height);
   if(page++)pdf.addPage();
   pdf.addImage(slice.toDataURL('image/jpeg',.9),'JPEG',margin,margin,imgW,slice.height/pxPerMm);
   offset+=slice.height;
  }
  return pdf.output('blob');
 }
 return null;
}
async function submitReport(e){
 e.preventDefault();const project=dom.projectNameInput.value.trim();if(!project){dom.projectNameError.textContent=t('projectNameRequired');return}
 closeReportModal();const old=dom.downloadReport.textContent;dom.downloadReport.disabled=true;dom.downloadReport.textContent=t('reportGenerating');
 try{
  const blob=await createPdf(project);
  if(blob){
   const filename=`${fileSlug(project)}-${new Date().toISOString().slice(0,10)}.pdf`,file=new File([blob],filename,{type:'application/pdf'});
   if(/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)&&navigator.share&&navigator.canShare?.({files:[file]})){
    try{await navigator.share({files:[file],title:project});showMessage(t('reportDownloaded'));return}catch(err){if(err.name==='AbortError')return}
   }
   const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=filename;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);showMessage(t('reportDownloaded'));
  }else{
   const win=window.open('','_blank');win.document.write(`<html><head><title>${esc(project)}</title><style>body{font-family:Arial;padding:24px;max-width:900px;margin:auto}.report-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}.report-box{border:1px solid #ddd;padding:8px}.report-table{width:100%;border-collapse:collapse}.report-table td,.report-table th{border:1px solid #ddd;padding:6px}.report-rec{padding:8px;margin:6px 0;background:#f4f4f4}</style></head><body>${dom.reportRender.innerHTML}<script>setTimeout(()=>window.print(),300)<\/script></body></html>`);win.document.close();showMessage(t('reportOpened'));
  }
 }catch(err){console.error(err);showMessage(t('reportError'),true)}
 finally{dom.downloadReport.disabled=false;dom.downloadReport.textContent=old}
}

function resetCurrent(){
 state.values[state.vertical]={};state.stages[state.vertical]=defaultStages(state.vertical);state.basis[state.vertical]=VERTICALS[state.vertical].defaultBasis||'first';state.scalingEnabled=false;state.cohortEnabled=false;save();renderAll()
}

dom.currency.onchange=()=>{state.currency=dom.currency.value;save();renderAll()};
dom.langs.forEach(b=>b.onclick=()=>{state.lang=b.dataset.lang;save();renderAll()});
dom.addStage.onclick=addStage;dom.reset.onclick=resetCurrent;dom.copy.onclick=copySummary;dom.share.onclick=copyLink;dom.csvTop.onclick=downloadCsv;dom.downloadCsv.onclick=downloadCsv;dom.googleSheets.onclick=openSheets;
dom.scalingEnabled.onchange=()=>{state.scalingEnabled=dom.scalingEnabled.checked;save();renderFields();calculateAndRender()};
dom.cohortEnabled.onchange=()=>{state.cohortEnabled=dom.cohortEnabled.checked;save();renderFields();calculateAndRender()};
dom.downloadReport.onclick=openReportModal;dom.cancelReport.onclick=closeReportModal;dom.reportModalBackdrop.onclick=closeReportModal;dom.reportForm.onsubmit=submitReport;
window.addEventListener('keydown',e=>{if(e.key==='Escape'&&!dom.reportModal.hidden)closeReportModal()});
load();renderAll();
