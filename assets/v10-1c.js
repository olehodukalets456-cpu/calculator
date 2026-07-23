function renderFields(){
 const cfg=VERTICALS[state.vertical],vals=state.values[state.vertical];
 dom.currency.value=state.currency;
 dom.trafficFields.innerHTML='';[field('adSpend','adSpend','adSpendHelp','money'),field('cpc','cpc','cpcHelp','money')].forEach(f=>dom.trafficFields.append(fieldHtml(f,'traffic')));
 dom.moneyFields.innerHTML='';cfg.fields.forEach(f=>dom.moneyFields.append(fieldHtml(f,'money')));
 dom.adjustmentFields.innerHTML='';
 [
   field('approveRate','approveRate','approveRateHelp','percent',false),field('refundRate','refundRate','refundRateHelp','percent',false),field('holdDays','holdDays','holdDaysHelp','days',false),
   field('paymentFee','paymentFee','paymentFeeHelp','percent',false),field('taxRate','taxRate','taxRateHelp','percent',false),field('agencyFee','agencyFee','agencyFeeHelp','percent',false)
 ].forEach(f=>dom.adjustmentFields.append(fieldHtml(f,'adjustment')));
 dom.scalingEnabled.checked=!!state.scalingEnabled;
 dom.scalingFields.innerHTML='';
 [field('targetBudget','targetBudget','targetBudgetHelp','money'),field('cpcGrowth','cpcGrowth','cpcGrowthHelp','percent'),field('crDrop','crDrop','crDropHelp','percent')].forEach(f=>dom.scalingFields.append(fieldHtml(f,'scaling')));
 dom.scalingFields.style.opacity=state.scalingEnabled?'1':'.45';dom.scalingFields.style.pointerEvents=state.scalingEnabled?'auto':'none';
 dom.cohortDetails.hidden=!cfg.cohort;dom.cohortEnabled.checked=!!state.cohortEnabled;
 dom.cohortFields.innerHTML='';
 if(cfg.cohort)[field('churnRate','churnRate','churnRateHelp','percent'),field('projectionMonths','projectionMonths','projectionMonthsHelp','number')].forEach(f=>dom.cohortFields.append(fieldHtml(f,'cohort')));
 dom.cohortFields.style.opacity=state.cohortEnabled?'1':'.45';dom.cohortFields.style.pointerEvents=state.cohortEnabled?'auto':'none';
 renderFunnelEditor();renderBasis();
}
function renderBasis(){
 const cfg=VERTICALS[state.vertical];dom.basisBox.hidden=!cfg.basis;
 if(!cfg.basis)return;
 const options=state.vertical==='saas'?[['first','firstMonth'],['ltv','lifetime']]:[['first','firstOrder'],['ltv','lifetime']];
 dom.basisMode.innerHTML=options.map(([v,k])=>`<button type="button" class="${state.basis[state.vertical]===v?'active':''}" data-basis="${v}">${esc(t(k))}</button>`).join('');
 dom.basisMode.querySelectorAll('button').forEach(b=>b.onclick=()=>{state.basis[state.vertical]=b.dataset.basis;save();renderFields();calculateAndRender()});
 dom.basisHint.textContent=t(state.vertical==='saas'?'saasBasisHint':'ecomBasisHint');
}
function renderFunnelEditor(){
 const stages=state.stages[state.vertical];dom.funnelEditor.innerHTML='';
 stages.forEach((s,i)=>{
  const row=document.createElement('div');row.className='stage-row';
  const src=i===0?t('clicksSource'):`${state.lang==='uk'?stages[i-1].nameUk:stages[i-1].nameEn} →`;
  row.innerHTML=`<span class="stage-source">${esc(src)}</span><input class="stage-name" value="${esc(state.lang==='uk'?s.nameUk:s.nameEn)}"><span class="stage-rate-wrap"><input class="stage-rate" type="number" inputmode="decimal" step="any" value="${esc(s.rate)}"><span>%</span></span><button class="delete-stage" type="button" ${stages.length===1?'disabled':''}>×</button>`;
  const name=row.querySelector('.stage-name'),rate=row.querySelector('.stage-rate'),del=row.querySelector('.delete-stage');
  name.oninput=()=>{if(state.lang==='uk')s.nameUk=name.value;else s.nameEn=name.value;save();calculateAndRender()};
  rate.oninput=()=>{s.rate=rate.value;save();calculateAndRender()};
  del.title=t('deleteStage');del.onclick=()=>{state.stages[state.vertical]=stages.filter(x=>x.id!==s.id);save();renderFunnelEditor();calculateAndRender()};
  dom.funnelEditor.append(row);
 });
}
function addStage(){state.stages[state.vertical].push({id:uid(),nameUk:t('newStage'),nameEn:I18N.en.newStage,rate:''});save();renderFunnelEditor();calculateAndRender()}

function valuePerResult(vals){
 const cfg=VERTICALS[state.vertical],basis=state.basis[state.vertical];
 if(state.vertical==='ecom')return basis==='ltv'?n(vals.customerLtv):n(vals.aov);
 if(state.vertical==='leadgen')return n(vals.valuePerSale);
 if(state.vertical==='edtech')return n(vals.studentValue);
 if(state.vertical==='saas')return n(vals.monthlyArpu)*(basis==='ltv'?n(vals.lifetimeMonths):1);
 if(state.vertical==='brand')return n(vals.brandResultValue);
 return 0;
}
function rawRates(stages=state.stages[state.vertical]){return stages.map(s=>clamp(n(s.rate),0,100)/100)}
