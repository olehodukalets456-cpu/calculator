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

