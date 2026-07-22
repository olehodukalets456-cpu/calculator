function renderTranslations(){
  document.documentElement.lang=state.language;
  document.querySelectorAll('[data-i18n]').forEach(el=>el.textContent=t(el.dataset.i18n));
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el=>el.placeholder=t(el.dataset.i18nPlaceholder));
  dom.langButtons.forEach(btn=>btn.classList.toggle('active',btn.dataset.lang===state.language));
  dom.currency.value=state.currency;
}

function renderVerticals(){
  dom.verticalTabs.replaceChildren();
  Object.entries(VERTICALS).forEach(([key,cfg])=>{
    const btn=document.createElement('button');
    btn.type='button';
    btn.className='vertical-tab'+(state.vertical===key?' active':'');
    btn.innerHTML=`<strong>${esc(t(cfg.title))}</strong><span>${esc(t(cfg.desc))}</span>`;
    btn.onclick=()=>{ state.vertical=key; renderAll(); save(); };
    dom.verticalTabs.append(btn);
  });
}

function moneySymbol(){ return ({USD:'$',EUR:'€',UAH:'₴',GBP:'£'})[state.currency]; }
function trafficDefinitions(){ return [f('adSpend','adSpend','adSpendHelp','money'),f('cpc','cpc','cpcHelp','money')]; }

function renderFieldSet(container,defs){
  container.replaceChildren();
  const values=state.values[state.vertical];
  defs.forEach(def=>{
    const node=dom.fieldTemplate.content.firstElementChild.cloneNode(true);
    if(defs.length%2===1 && def===defs.at(-1)) node.classList.add('full');
    node.dataset.field=def.id;
    node.querySelector('.field-label').textContent=t(def.label);
    node.querySelector('.optional').textContent=def.required?'':t('optional');
    node.querySelector('.field-help').textContent=t(def.help);
    const input=node.querySelector('input');
    input.value=values[def.id] ?? '';
    input.dataset.type=def.type;
    node.querySelector('.prefix').textContent=def.type==='money'?moneySymbol():'';
    node.querySelector('.suffix').textContent=def.type==='percent'?'%':'';
    input.oninput=()=>{
      state.values[state.vertical][def.id]=input.value===''?'':Number(input.value);
      validateField(node,def);
      calculateAndRender();
      save();
    };
    container.append(node);
  });
}

function stageName(stage){ return state.language==='uk'?stage.nameUk:stage.nameEn; }
function renderFunnelEditor(){
  const stages=state.stages[state.vertical];
  dom.funnelEditor.replaceChildren();
  stages.forEach((stage,index)=>{
    const row=document.createElement('div');
    row.className='stage-row';
    const source=index===0?t('clicksSource'):`${stageName(stages[index-1])} →`;
    row.innerHTML=`
      <span class="stage-source" title="${esc(source)}">${esc(source)}</span>
      <input class="stage-name" type="text" value="${esc(stageName(stage))}" aria-label="Stage name">
      <span class="stage-rate-wrap"><input class="stage-rate" type="number" inputmode="decimal" min="0" max="100" step="any" value="${esc(stage.rate)}" aria-label="Conversion rate"><span>%</span></span>
      <button class="delete-stage" type="button" title="${esc(t('deleteStage'))}" aria-label="${esc(t('deleteStage'))}" ${stages.length===1?'disabled':''}>×</button>`;
    const nameInput=row.querySelector('.stage-name');
    const rateInput=row.querySelector('.stage-rate');
    nameInput.oninput=()=>{
      if(state.language==='uk') stage.nameUk=nameInput.value || t('newStage');
      else stage.nameEn=nameInput.value || t('newStage');
      calculateAndRender();
      save();
      [...dom.funnelEditor.querySelectorAll('.stage-source')].forEach((el,i)=>{
        if(i>0){ const text=`${stageName(stages[i-1])} →`; el.textContent=text; el.title=text; }
      });
    };
    rateInput.oninput=()=>{
      if(rateInput.value==='') stage.rate='';
      else {
        const val=Number(rateInput.value);
        stage.rate=Number.isFinite(val)?Math.min(100,Math.max(0,val)):'';
      }
      rateInput.parentElement.classList.toggle('invalid',stage.rate==='');
      calculateAndRender(); save();
    };
    row.querySelector('.delete-stage').onclick=()=>{
      if(stages.length<=1) return;
      stages.splice(index,1);
      renderFunnelEditor(); calculateAndRender(); save();
    };
    dom.funnelEditor.append(row);
  });
}

function renderBasis(){
  const cfg=VERTICALS[state.vertical];
  dom.basisBox.hidden=!cfg.basis;
  if(!cfg.basis) return;
  const options=state.vertical==='saas'?[['first','firstMonth'],['ltv','lifetime']]:[['first','firstOrder'],['ltv','lifetime']];
  dom.basisMode.replaceChildren();
  options.forEach(([value,label])=>{
    const btn=document.createElement('button'); btn.type='button'; btn.textContent=t(label); btn.className=state.basis[state.vertical]===value?'active':'';
    btn.onclick=()=>{ state.basis[state.vertical]=value; renderBasis(); calculateAndRender(); save(); };
    dom.basisMode.append(btn);
  });
  dom.basisHint.textContent=t(state.vertical==='saas'?'saasBasisHint':'ecomBasisHint');
}

function renderFields(){
  const cfg=VERTICALS[state.vertical];
  dom.moneyHintText.textContent=t(state.vertical==='brand'?'brandMoneyHint':'moneyHint');
  renderFieldSet(dom.trafficFields,trafficDefinitions());
  renderFunnelEditor();
  renderFieldSet(dom.moneyFields,cfg.money);
  renderBasis();
}

function validateField(node,def){
  const input=node.querySelector('input');
  const val=Number(input.value);
  let error='';
  if(def.required && (!Number.isFinite(val) || val<=0)) error='errorPositive';
  if(!def.required && input.value!=='' && (!Number.isFinite(val)||val<0)) error='errorNonNegative';
  if(def.type==='percent' && (val<0||val>100||!Number.isFinite(val))) error='errorPercent';
  node.classList.toggle('invalid',Boolean(error));
  node.querySelector('.field-error').textContent=error?t(error):'';
  return !error;
}
function validate(){
  const cfg=VERTICALS[state.vertical];
  const defs=[...trafficDefinitions(),...cfg.money];
  let ok=true;
  defs.forEach(def=>{
    const node=document.querySelector(`[data-field="${def.id}"]`);
    if(node&&!validateField(node,def)) ok=false;
  });
  const stages=state.stages[state.vertical]||[];
  if(!stages.length) ok=false;
  [...dom.funnelEditor.querySelectorAll('.stage-rate')].forEach((input,index)=>{
    const stage=stages[index];
    const raw=stage?.rate;
    const val=Number(raw);
    const invalid=raw===''||raw===null||raw===undefined||!Number.isFinite(val)||val<0||val>100;
    input.parentElement.classList.toggle('invalid',invalid);
    if(invalid) ok=false;
  });
  return ok;
}

