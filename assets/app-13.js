function openReportModal(){
  if(!validate()) return showMessage(t('invalid'),true);
  dom.projectNameInput.value='';
  dom.projectNameError.textContent='';
  dom.reportModal.hidden=false;
  document.body.style.overflow='hidden';
  requestAnimationFrame(()=>{ dom.projectNameInput.focus(); dom.projectNameInput.select(); });
}
function closeReportModal(){
  dom.reportModal.hidden=true;
  document.body.style.overflow='';
  dom.projectNameError.textContent='';
}
function fileSlug(value){
  const normalized=String(value).trim().toLowerCase()
    .normalize('NFKD').replace(/[\u0300-\u036f]/g,'')
    .replace(/[^a-z0-9\u0400-\u04ff]+/gi,'-')
    .replace(/^-+|-+$/g,'');
  return normalized||'buying-report';
}
async function downloadReport(projectName){
  const button=dom.downloadReport;
  const isMobile=/Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  let previewWindow=null;
  try{
    button.disabled=true;
    button.textContent=t('reportGenerating');

    const shareProbe=new File([new Blob(['pdf'],{type:'application/pdf'})],'report.pdf',{type:'application/pdf'});
    const canShareFiles=Boolean(isMobile&&navigator.share&&navigator.canShare&&navigator.canShare({files:[shareProbe]}));
    if(isMobile&&!canShareFiles){
      previewWindow=window.open('about:blank','_blank');
      if(previewWindow){
        previewWindow.document.write(`<p style="font-family:Arial,sans-serif;padding:24px">${esc(t('reportGenerating'))}</p>`);
      }
    }

    await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
    const r=calculate();
    const resultTone=tone(r);
    const blob=createReportPdf(r,resultTone,projectName);
    const filename=`${fileSlug(projectName)}-${new Date().toISOString().slice(0,10)}.pdf`;
    const file=new File([blob],filename,{type:'application/pdf'});

    if(isMobile&&navigator.share&&navigator.canShare&&navigator.canShare({files:[file]})){
      try{
        await navigator.share({files:[file],title:projectName,text:t('reportTitle')});
        showMessage(t('reportShared'));
        return;
      } catch(error){
        if(error?.name==='AbortError') return;
      }
    }

    const url=URL.createObjectURL(blob);
    if(isMobile){
      if(previewWindow&&!previewWindow.closed) previewWindow.location.href=url;
      else {
        const opened=window.open(url,'_blank');
        if(!opened){
          const a=document.createElement('a');
          a.href=url; a.download=filename;
          document.body.append(a); a.click(); a.remove();
        }
      }
      showMessage(t('reportOpened'));
      setTimeout(()=>URL.revokeObjectURL(url),120000);
    } else {
      const a=document.createElement('a');
      a.href=url; a.download=filename;
      document.body.append(a); a.click(); a.remove();
      setTimeout(()=>URL.revokeObjectURL(url),30000);
      showMessage(t('reportDownloaded'));
    }
  } catch(error){
    console.error(error);
    if(previewWindow&&!previewWindow.closed) previewWindow.close();
    showMessage(t('reportError'),true);
  } finally {
    button.disabled=false;
    button.textContent=t('downloadReport');
  }
}
async function submitReport(event){
  event.preventDefault();
  const projectName=dom.projectNameInput.value.trim();
  if(!projectName){
    dom.projectNameError.textContent=t('projectNameRequired');
    dom.projectNameInput.focus();
    return;
  }
  closeReportModal();
  await downloadReport(projectName.slice(0,80));
}

function buildInsight(r,resultTone){
  if(!Number.isFinite(r.sales)||r.sales<.01) return t('insightNoSales');
  if(state.vertical==='brand'&&!r.brandHasValue){
    if(!Number.isFinite(r.brandTarget)) return t('noBrandValue');
    if(r.allInCpa<=r.brandTarget) return `${t('brandCost')}: ${money(r.allInCpa)}. ${t('brandTarget')}: ${money(r.brandTarget)}.`;
    return `${t('brandCost')}: ${money(r.allInCpa)}. ${t('brandTarget')}: ${money(r.brandTarget)}. ${t('brandGap')}: ${pct(r.brandGap)}.`;
  }
  if(resultTone==='positive') return fill(t('insightStrong'),{gap:pct(Math.max(0,r.safety))});
  if(resultTone==='warning'&&r.profit>=0) return fill(t('insightThin'),{gap:pct(Math.max(0,r.safety))});
  return fill(t('insightLoss'),{delta:money(Math.max(0,r.cpa-r.maxCpa)),cvr:pct(r.requiredCvr)});
}

function renderAll(){ ensureState(); renderTranslations(); renderVerticals(); renderFields(); calculateAndRender(); }

function copyText(){
  if(!validate()) return showMessage(t('invalid'),true);
  const r=calculate(), cfg=VERTICALS[state.vertical];
  const funnelLines=r.funnel.map(stage=>`${stage.label}: ${count(stage.value)}`);
  let lines;
  if(state.vertical==='brand'&&!r.brandHasValue){
    lines=[
      `${t(cfg.title)} — ${t('brandEfficiency')}`,
      `${t('adSpend')}: ${money(r.spend)}`,
      `${t('cpc')}: ${money(r.cpc)}`,
      ...funnelLines,
      `${t('brandCost')}: ${money(r.allInCpa)}`,
      `${t('brandTarget')}: ${Number.isFinite(r.brandTarget)?money(r.brandTarget):'—'}`,
      `${t('overallCvr')}: ${pct(r.overallCvr)}`,
      `${t('activeAudience')}: ${Number.isFinite(r.activeAudience)?count(r.activeAudience):'—'}`,
      `${t('costPerActive')}: ${Number.isFinite(r.costPerActive)?money(r.costPerActive):'—'}`
    ];
  } else {
    lines=[
      `${t(cfg.title)} — ${t(r.basis==='ltv'?'basisLifetime':(state.vertical==='saas'?'basisFirstMonth':'basisFirstOrder'))}`,
      `${t('adSpend')}: ${money(r.spend)}`,
      `${t('cpc')}: ${money(r.cpc)}`,
      ...funnelLines,
      `${t('revenue')}: ${money(r.revenue)}`,
      `${t('netProfit')}: ${money(r.profit)}`,
      `ROI: ${pct(r.roi)}`,
      `${t('cpa')}: ${money(r.cpa)}`,
      `${t('maxCpa')}: ${money(Math.max(0,r.maxCpa))}`,
      `${t('roas')}: ${ratio(r.roas)}`,
      `${t('breakEvenRoas')}: ${ratio(r.breakEvenRoas)}`
    ];
  }
  writeClipboard(lines.join('\n')).then(ok=>showMessage(t(ok?'copied':'copyError'),!ok));
}
function copyLink(){
  try {
    const shareState={...state,projectName:''};
    const payload=btoa(unescape(encodeURIComponent(JSON.stringify(shareState)))).replaceAll('+','-').replaceAll('/','_').replaceAll('=','');
    const url=new URL(location.href); url.hash=`${HASH_KEY}=${payload}`;
    writeClipboard(url.toString()).then(ok=>showMessage(t(ok?'linkCopied':'copyError'),!ok));
  } catch(_){ showMessage(t('copyError'),true); }
}
async function writeClipboard(text){
  try { await navigator.clipboard.writeText(text); return true; }
  catch(_){
    const ta=document.createElement('textarea'); ta.value=text; ta.style.position='fixed'; ta.style.opacity='0'; document.body.append(ta); ta.select();
    const ok=document.execCommand('copy'); ta.remove(); return ok;
  }
}
function showMessage(msg,error=false){
  dom.actionMessage.textContent=msg; dom.actionMessage.style.color=error?'var(--negative)':'var(--positive)';
  clearTimeout(showMessage.timer); showMessage.timer=setTimeout(()=>dom.actionMessage.textContent='',2500);
}

function bind(){
  dom.langButtons.forEach(btn=>btn.onclick=()=>{ state.language=btn.dataset.lang; renderAll(); save(); });
  dom.currency.onchange=e=>{ state.currency=e.target.value; renderFields(); calculateAndRender(); save(); };
  dom.addStage.onclick=()=>{
    state.stages[state.vertical].push({id:cryptoId(),nameUk:'Новий етап',nameEn:'New stage',rate:''});
    renderFunnelEditor(); calculateAndRender(); save();
  };
  dom.reset.onclick=()=>{
    const cfg=VERTICALS[state.vertical];
    state.values[state.vertical]={...cfg.defaults};
    state.basis[state.vertical]=cfg.defaultBasis;
    state.stages[state.vertical]=cloneStages(cfg.stages);
    renderAll(); save();
  };
  dom.copy.onclick=copyText;
  dom.share.onclick=copyLink;
  dom.downloadReport.onclick=openReportModal;
  dom.reportForm.onsubmit=submitReport;
  dom.cancelReport.onclick=closeReportModal;
  dom.reportModalBackdrop.onclick=closeReportModal;
  dom.projectNameInput.oninput=()=>{ dom.projectNameError.textContent=''; };
  document.addEventListener('keydown',event=>{ if(event.key==='Escape'&&!dom.reportModal.hidden) closeReportModal(); });
}

restore(); ensureState(); bind(); renderAll();
