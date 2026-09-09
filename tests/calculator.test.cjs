const {test}=require('node:test');
const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');
const {execFileSync}=require('node:child_process');
const {JSDOM}=require('jsdom');
const vm=require('node:vm');
const baseline=process.env.CALCULATOR_BASELINE==='1';
const read=path=>baseline?execFileSync('git',['show',`2019453:${path}`],{encoding:'utf8'}):readFileSync(path,'utf8');
function app(t,{storage,hash='',blockStorage=false}={}){
 const dom=new JSDOM(read('index.html'),{url:`https://leadsuni.site/${hash}`,runScripts:'outside-only',pretendToBeVisual:true});
 t.after(()=>dom.window.close());
 if(storage!==undefined)dom.window.localStorage.setItem('leadsuni-buying-calculator-v10',storage);
 if(blockStorage)Object.defineProperty(dom.window,'localStorage',{get(){throw new Error('Storage denied')}});
 const ctx=dom.getInternalVMContext();
 const run=code=>vm.runInContext(code,ctx);
 for(const tag of dom.window.document.querySelectorAll('script[src^="assets/"]'))run(read(tag.getAttribute('src').split('?')[0]));
 return {run,window:dom.window,doc:dom.window.document,
  setup(code=''){run(`state.vertical='ecom';ensureState();state.values.ecom={adSpend:'1000',cpc:'1',aov:'100',margin:'50',fixedCosts:'100',agencyFee:'10'};state.stages.ecom=[{id:'purchase',nameUk:'Покупка',nameEn:'Purchase',rate:'5'}];state.basis.ecom='first';${code};renderAll()`);},
  input(key,value){const el=dom.window.document.querySelector(`[data-key="${key}"]`);el.value=value;el.dispatchEvent(new dom.window.Event('input',{bubbles:true}));},
  result(){return run('calculate()')}
 };
}
const near=(actual,expected)=>assert.ok(Math.abs(actual-expected)<1e-7*Math.max(1,Math.abs(expected)),`${actual} != ${expected}`);

test('CPC economics: approvals, refunds, margin, both revenue fees, agency and fixed costs',t=>{
 const a=app(t);a.setup("Object.assign(state.values.ecom,{approveRate:'80',refundRate:'25',paymentFee:'3',taxRate:'2'})");const r=a.result();
 near(r.clicks,1000);near(r.rawFinal,50);near(r.paidFinal,30);near(r.grossRevenue,3000);near(r.contribution,1350);near(r.totalCosts,1200);near(r.profit,150);near(r.roi,12.5);near(r.allInCpa,40);
});
test('CPC ceiling actually breaks even at unchanged budget and fixed costs',t=>{const a=app(t);a.setup();const r=a.result();a.input('cpc',String(r.maxCpc));near(a.result().profit,0)});
test('equivalent CPC and known-stage modes produce identical economics and ceilings',t=>{
 const a=app(t);a.setup();const c=a.result();a.run("state.trafficMode.ecom='stage';state.anchorStage.ecom='purchase';state.values.ecom.anchorCost='20';renderAll()");const s=a.result();
 near(s.profit,c.profit);near(s.paidFinal,c.paidFinal);near(s.maxTrafficCost,c.maxCpc/.05);
 a.input('anchorCost',String(s.maxTrafficCost));near(a.result().profit,0);assert.ok(Number.isNaN(s.clicks));
});
test('0% conversion is a valid complete loss, not missing data',t=>{const a=app(t);a.setup("state.stages.ecom[0].rate='0'");assert.equal(a.run('validate()'),true);near(a.result().profit,-1200);assert.notEqual(a.doc.querySelector('#profitValue').textContent,'—')});
test('zero approve and full refund give zero paid conversions without a fake attainable CR',t=>{
 const a=app(t);for(const extra of ["approveRate:'0'","refundRate:'100'"]){a.setup(`Object.assign(state.values.ecom,{${extra}})`);assert.equal(a.run('validate()'),true);near(a.result().paidFinal,0);assert.equal(a.result().requiredCvr,Infinity)}
});
test('all optional costs and percentage ranges are validated',t=>{
 const a=app(t);for(const [key,value] of [['fixedCosts','-1'],['agencyFee','-1'],['approveRate','101'],['refundRate','-1'],['paymentFee','120'],['taxRate','-3'],['holdDays','1.5'],['holdDays','-1']]){a.setup();a.input(key,value);assert.equal(a.run('validate(true)'),false,`${key}=${value}`);assert.equal(a.doc.querySelector(`[data-key="${key}"]`).getAttribute('aria-invalid'),'true')}
});
test('validation is independent of rendered controls',t=>{const a=app(t);a.setup();a.doc.querySelector('[data-key="aov"]').closest('.field').remove();a.run("state.values.ecom.aov=''");assert.equal(a.run('validate()'),false)});
test('blank scaling assumptions must not silently become zero',t=>{const a=app(t);a.setup("state.scalingEnabled=true;state.values.ecom.targetBudget='2000'");assert.equal(a.run('validate()'),false)});
test('100% CR decline gives zero final results after doubling',t=>{const a=app(t);a.setup("state.scalingEnabled=true;Object.assign(state.values.ecom,{targetBudget:'2000',cpcGrowth:'0',crDrop:'100'})");near(a.result().scaled.paidFinal,0)});
test('growth above 100% is supported and uses the entered value',t=>{const a=app(t);a.setup("state.scalingEnabled=true;Object.assign(state.values.ecom,{targetBudget:'2000',cpcGrowth:'200',crDrop:'0'})");assert.equal(a.run('validate()'),true);near(a.result().scaled.trafficCost,3)});
test('multi-stage CR decline applies once to the entire active funnel',t=>{
 const a=app(t);a.setup("state.scalingEnabled=true;Object.assign(state.values.ecom,{targetBudget:'2000',cpcGrowth:'20',crDrop:'20'});state.stages.ecom=[{id:'a',nameUk:'A',nameEn:'A',rate:'10'},{id:'b',nameUk:'B',nameEn:'B',rate:'50'}]");const r=a.result();near(r.scaled.overallCvr,4);near(r.scaled.trafficCost,1.2);
});
test('unchanged unit economics do not invent a finite scaling ceiling',t=>{const a=app(t);a.setup("state.scalingEnabled=true;Object.assign(state.values.ecom,{targetBudget:'2000',cpcGrowth:'0',crDrop:'0'})");assert.equal(a.result().maxScaleBudget,Infinity)});
test('scaling ceiling has near-zero profit and is negative above it',t=>{const a=app(t);a.setup("state.scalingEnabled=true;Object.assign(state.values.ecom,{targetBudget:'2000',cpcGrowth:'30',crDrop:'15'})");const ceiling=a.result().maxScaleBudget;assert.ok(ceiling>1000);near(a.run(`scaledModel(flexibleInputs(),${ceiling}).profit`),0);assert.ok(a.run(`scaledModel(flexibleInputs(),${ceiling*1.01}).profit`)<0)});
test('initial loss can become profitable as fixed costs are spread',t=>{const a=app(t);a.setup("state.scalingEnabled=true;Object.assign(state.values.ecom,{fixedCosts:'2000',targetBudget:'4000',cpcGrowth:'1',crDrop:'1'})");assert.ok(a.result().profit<0);assert.ok(a.result().scaled.profit>0);assert.ok(a.result().maxScaleBudget>4000)});
test('no profitable scale is distinct from the losing base budget',t=>{const a=app(t);a.setup("state.scalingEnabled=true;Object.assign(state.values.ecom,{aov:'1',targetBudget:'2000',cpcGrowth:'50',crDrop:'50'})");assert.equal(a.result().maxScaleBudget,0)});
test('brand 0% activity stays zero; blank activity remains unknown',t=>{
 const a=app(t);a.setup("state.vertical='brand';state.values.brand={adSpend:'100',cpc:'1',brandTargetCost:'10',activeRate:'0'};state.stages.brand=[{id:'x',nameUk:'X',nameEn:'X',rate:'50'}]");near(a.result().activeAudience,0);a.input('activeRate','');assert.ok(Number.isNaN(a.result().activeAudience));
});
test('brand without a value has no fictional profit or ROI in any export',t=>{
 const a=app(t);a.setup("state.vertical='brand';state.values.brand={adSpend:'100',cpc:'1',brandTargetCost:'10'};state.stages.brand=[{id:'x',nameUk:'X',nameEn:'X',rate:'50'}]");assert.ok(Number.isNaN(a.result().profit));assert.ok(!a.run('summaryText()').includes('-$100'));assert.equal(a.run('csvRows().some(row=>row.includes(-100))'),false);
});
test('zero revenue and zero margin are valid losing outcomes',t=>{const a=app(t);a.setup("state.values.ecom.aov='0';state.values.ecom.margin='0'");assert.equal(a.run('validate()'),true);near(a.result().profit,-1200)});
test('negative monthly contribution is not clamped away in cohorts',t=>{
 const a=app(t);a.setup("state.vertical='saas';state.values.saas={adSpend:'1000',cpc:'1',monthlyArpu:'10',lifetimeMonths:'12',margin:'5',paymentFee:'10',projectionMonths:'3',churnRate:'0'};state.stages.saas=[{id:'paid',nameUk:'Paid',nameEn:'Paid',rate:'10'}];state.cohortEnabled=true");const r=a.result();near(r.cohort.rows[0].gp,-50);near(r.cohort.rows[2].cumProfit,-1150);
});
test('cohort retention, payback and integer horizon',t=>{
 const a=app(t);a.setup("state.vertical='saas';state.values.saas={adSpend:'1000',cpc:'1',monthlyArpu:'10',lifetimeMonths:'12',margin:'100',projectionMonths:'3',churnRate:'50'};state.stages.saas=[{id:'paid',nameUk:'Paid',nameEn:'Paid',rate:'10'}];state.cohortEnabled=true");const c=a.result().cohort;near(c.rows[1].active,50);near(c.rows[2].cumulative,1750);assert.equal(c.payback,1);for(const value of ['','0','3.5','37']){a.input('projectionMonths',value);assert.equal(a.run('validate()'),false)}
});
test('LTV is not reported as a lump-sum held payout',t=>{const a=app(t);a.setup("state.basis.ecom='ltv';Object.assign(state.values.ecom,{customerLtv:'300',holdDays:'30'})");assert.ok(Number.isNaN(a.result().heldAmount));near(a.result().cashGap,1200)});
test('invalid stored state recovers safely',t=>{for(const storage of ['{"lang":"xx","currency":"XXX","vertical":"__proto__","values":null,"stages":null,"scenarios":[{}]}','{"stages":{"ecom":[]},"values":{"ecom":5},"basis":null}','{"scenarios":true,"trafficMode":[],"anchorStage":null}']){const a=app(t,{storage});assert.equal(a.run('state.vertical'),'ecom');assert.equal(a.run('state.scenarios.length'),3);assert.ok(a.doc.querySelector('#trafficFields input'))}});
test('storage denial does not break calculator or valid shared scenario',t=>{const hash='#scenario='+encodeURIComponent(Buffer.from(encodeURIComponent(JSON.stringify({vertical:'leadgen'}))).toString('base64'));const a=app(t,{blockStorage:true,hash});assert.equal(a.run('state.vertical'),'leadgen');a.setup();a.input('cpc','2');near(a.result().clicks,500)});
test('legacy CPC scenario migrates its traffic cost',t=>{const a=app(t,{storage:JSON.stringify({scenarios:[{name:'Old',vertical:'ecom',currency:'USD',result:{cpc:2,spend:1000,unitRevenue:10}}]})});assert.equal(a.run('state.scenarios[0].result.trafficCost'),2)});
test('new stages update anchor options, and deleting the anchor repairs the selection',t=>{const a=app(t);a.setup("state.trafficMode.ecom='stage';state.values.ecom.anchorCost='20'");a.doc.querySelector('#addStage').click();assert.equal(a.doc.querySelectorAll('#anchorStageSelect option').length,2);a.doc.querySelector('.delete-stage').click();assert.equal(a.run('state.anchorStage.ecom'),a.run('state.stages.ecom[0].id'))});
test('disabled forecasting controls are disabled for keyboard users',t=>{const a=app(t);a.setup();assert.ok(a.doc.querySelector('#scalingFields input').disabled)});
test('scenario names survive calculator edits',t=>{const a=app(t);a.setup();const el=a.doc.querySelector('[data-slot-name="0"]');el.value='Test name';el.dispatchEvent(new a.window.Event('input',{bubbles:true}));a.input('cpc','2');assert.equal(a.doc.querySelector('[data-slot-name="0"]').value,'Test name')});
test('CSV preserves numbers, currency, funnel volumes and cohort rows; sanitizes formulas',t=>{const a=app(t);a.setup("state.stages.ecom[0].nameUk='=1+1'");const csv=a.run('csvText()');assert.ok(csv.includes("'=1+1"));assert.ok(csv.includes('USD'));const rows=a.run('csvRows()');assert.ok(rows.some(row=>row.includes(50)&&row[0]==='Funnel volume'))});
test('all verticals, bases, currencies and traffic anchors render consistently',t=>{
 const a=app(t);
 for(const vertical of ['ecom','leadgen','edtech','saas','brand'])for(const lang of ['uk','en'])for(const currency of ['USD','EUR','UAH','GBP'])for(const mode of ['cpc','stage']){
  a.setup(`state.vertical='${vertical}';state.lang='${lang}';state.currency='${currency}';state.trafficMode['${vertical}']='${mode}';state.values['${vertical}']={adSpend:'1000',cpc:'1',anchorCost:'10',aov:'100',customerLtv:'200',margin:'50',valuePerSale:'100',studentValue:'200',monthlyArpu:'20',lifetimeMonths:'12',brandTargetCost:'100',activeRate:'50'};state.stages['${vertical}'].forEach(s=>s.rate='50')`);
  assert.equal(a.run('validate()'),true,`${vertical}/${lang}/${currency}/${mode}`);assert.notEqual(a.doc.querySelector('#profitValue').textContent,'—');assert.ok(!/NaN|undefined|Infinity/.test(a.doc.body.textContent));
 }
});
test('every known-stage anchor and downstream scaling ignore earlier conversions',t=>{
 const a=app(t);
 for(let index=0;index<3;index++){
  a.setup(`state.vertical='leadgen';state.values.leadgen={adSpend:'1000',anchorCost:'10',valuePerSale:'100',margin:'100',targetBudget:'2000',cpcGrowth:'0',crDrop:'20'};state.stages.leadgen=[{id:'a',nameUk:'A',nameEn:'A',rate:'n/a'},{id:'b',nameUk:'B',nameEn:'B',rate:'50'},{id:'c',nameUk:'C',nameEn:'C',rate:'20'}];state.trafficMode.leadgen='stage';state.anchorStage.leadgen=['a','b','c'][${index}];state.scalingEnabled=true`);
  assert.equal(a.run('validate()'),true);const r=a.result();near(r.startCount,100);near(r.rawFinal,[10,20,100][index]);assert.equal(r.funnel.length,3-index);near(r.scaled.rawFinal,index===2?200:r.rawFinal*2*.8);
 }
});
test('shared links round-trip Unicode and only share the active vertical',async t=>{
 const a=app(t);a.setup("state.values.leadgen.valuePerSale='SECRET_OTHER_PROJECT';state.stages.ecom[0].nameUk='Покупка 🛒'");let shared='';Object.defineProperty(a.window.navigator,'clipboard',{value:{writeText:async value=>{shared=value}}});await a.run('copyLink()');assert.ok(!decodeURIComponent(Buffer.from(new URL(shared).hash.split('=')[1],'base64').toString()).includes('SECRET_OTHER_PROJECT'));
 const b=app(t,{storage:JSON.stringify({values:{leadgen:{valuePerSale:'1234'}}}),hash:new URL(shared).hash});near(b.result().profit,a.result().profit);assert.equal(b.run('state.stages.ecom[0].nameUk'),'Покупка 🛒');assert.equal(b.run('state.values.leadgen.valuePerSale'),'1234');
});
test('PDF without CDN libraries prints in the current page and restores controls',async t=>{
 const a=app(t);a.setup();let printed=0;a.window.print=()=>{printed++;assert.ok(a.doc.body.classList.contains('printing-report'));assert.ok(a.doc.querySelector('#reportRender').textContent.includes('Test project'))};
 a.doc.querySelector('#downloadReport').click();a.doc.querySelector('#projectNameInput').value='Test project';await a.run('submitReport({preventDefault(){}})');assert.equal(printed,1);assert.equal(a.doc.querySelector('#downloadReport').disabled,false);assert.equal(a.doc.querySelector('#reportRender').innerHTML,'');assert.equal(a.doc.querySelector('main').inert,false);
});
test('PDF report escapes text and reflects cohort and scenario currency',t=>{
 const a=app(t);a.setup("state.scenarioNames[0]='<img src=x onerror=alert(1)>'");a.doc.querySelector('[data-save-slot="0"]').click();a.run("state.currency='EUR';renderAll()");const html=a.run("reportHtml('<script>alert(1)</script>',calculate(),buildRecommendations(calculate(),greatestDrop(calculate())))");assert.ok(!html.includes('<script>'));assert.ok(html.includes('&lt;script&gt;'));assert.ok(html.includes('USD'));assert.ok(html.includes('EUR'));
});
test('small traffic costs are not rounded to zero',t=>{const a=app(t);a.setup();assert.equal(a.run('money(0.0005)'),'$0,0005');assert.equal(a.run("moneyScenario(0.0005,'USD')").replace(',','.'),'$0.0005')});
test('nonfinite and malformed inputs are rejected; decimal commas load visibly',t=>{
 const a=app(t);for(const value of ['Infinity','NaN','1e309','0x20']){a.setup(`state.values.ecom.aov='${value}'`);assert.equal(a.run('validate()'),false)}a.setup("state.values.ecom.cpc='0,5'");assert.equal(a.doc.querySelector('[data-key="cpc"]').value,'0.5');near(a.result().clicks,2000);
});
test('0% churn and 100% churn preserve first-month cash earning correctly',t=>{
 const a=app(t);for(const churn of [0,100]){a.setup(`state.vertical='edtech';state.values.edtech={adSpend:'1000',cpc:'1',studentValue:'300',monthlyStudentValue:'10',margin:'100',projectionMonths:'3',churnRate:'${churn}'};state.stages.edtech=[{id:'paid',nameUk:'Paid',nameEn:'Paid',rate:'10'}];state.cohortEnabled=true`);const c=a.result().cohort;near(c.rows[0].gp,1000);near(c.rows[2].cumulative,churn===0?3000:1000)}});
