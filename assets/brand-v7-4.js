function calculate(){
  const cfg=VERTICALS[state.vertical];
  const v=state.values[state.vertical];
  const trafficMode=currentTrafficMode();
  const spend=Number(v.adSpend)||0;
  const fixed=Math.max(0,Number(v.fixedCosts)||0);
  const totalCosts=spend+fixed;

  let cpc=NaN, cpm=NaN, ctr=NaN, impressions=NaN, reach=NaN, frequency=NaN, clicks=0;
  if(trafficMode==='cpm'){
    cpm=Number(v.cpm)||0;
    ctr=(Number(v.ctr)||0)/100;
    impressions=cpm>0?spend/cpm*1000:0;
    clicks=impressions*ctr;
    cpc=clicks>0?spend/clicks:Infinity;
    reach=Number(v.reach)>0?Number(v.reach):NaN;
    frequency=Number.isFinite(reach)&&reach>0?impressions/reach:NaN;
  } else {
    cpc=Number(v.cpc)||0;
    clicks=cpc>0?spend/cpc:0;
  }

  const funnel=[];
  if(trafficMode==='cpm'){
    if(Number.isFinite(reach)) funnel.push({label:t('reachMetric'),value:reach,kind:'reach'});
    funnel.push({label:t('impressions'),value:impressions,kind:'impressions'});
  }
  funnel.push({label:t('clicks'),value:clicks,kind:'click'});

  let current=clicks;
  const stageCounts=[];
  state.stages[state.vertical].forEach(stage=>{
    current*=Math.min(100,Math.max(0,Number(stage.rate)||0))/100;
    const item={label:stageName(stage),value:current,kind:'conversion'};
    funnel.push(item); stageCounts.push(item);
  });
  const sales=current;

  let firstRevenuePerSale=0, ltvRevenuePerSale=0;
  if(state.vertical==='ecom'){ firstRevenuePerSale=Number(v.aov)||0; ltvRevenuePerSale=Math.max(Number(v.customerLtv)||0,firstRevenuePerSale); }
  if(state.vertical==='leadgen'){ firstRevenuePerSale=Number(v.valuePerSale)||0; ltvRevenuePerSale=firstRevenuePerSale; }
  if(state.vertical==='edtech'){ firstRevenuePerSale=Number(v.studentValue)||0; ltvRevenuePerSale=firstRevenuePerSale; }
  if(state.vertical==='saas'){ firstRevenuePerSale=Number(v.monthlyArpu)||0; ltvRevenuePerSale=firstRevenuePerSale*(Number(v.lifetimeMonths)||0); }
  if(state.vertical==='brand'){ firstRevenuePerSale=Number(v.brandResultValue)||0; ltvRevenuePerSale=firstRevenuePerSale; }

  const margin=state.vertical==='brand'?1:(Number(v.margin)||0)/100;
  const basis=cfg.basis?state.basis[state.vertical]:'first';
  const revenuePerSale=basis==='ltv'?ltvRevenuePerSale:firstRevenuePerSale;
  const revenue=sales*revenuePerSale;
  const grossProfit=revenue*margin;
  const profit=grossProfit-totalCosts;
  const roi=totalCosts>0?profit/totalCosts:NaN;
  const roas=spend>0?revenue/spend:NaN;
  const cpa=sales>0?spend/sales:Infinity;
  const allInCpa=sales>0?totalCosts/sales:Infinity;
  const overallCvr=clicks>0?sales/clicks:0;
  const contributionPerSale=revenuePerSale*margin;
  const maxCpa=sales>0?contributionPerSale-(fixed/sales):contributionPerSale;
  const maxCpc=totalCosts>0?overallCvr*contributionPerSale*(spend/totalCosts):0;
  const safety=maxCpa>0?(maxCpa-cpa)/maxCpa:NaN;
  const breakEvenSales=contributionPerSale>0?totalCosts/contributionPerSale:Infinity;
  const requiredCvr=clicks>0?breakEvenSales/clicks:Infinity;
  const breakEvenRoas=margin>0&&spend>0?totalCosts/(spend*margin):Infinity;
  const firstStageCost=stageCounts[0]?.value>0?spend/stageCounts[0].value:Infinity;
  const secondStageCost=stageCounts[1]?.value>0?spend/stageCounts[1].value:Infinity;

  const monthlyGrossPerCustomer=state.vertical==='saas'?firstRevenuePerSale*margin:NaN;
  const grossLtvPerCustomer=ltvRevenuePerSale*margin;
  const ltvCac=state.vertical==='saas'&&allInCpa>0&&Number.isFinite(allInCpa)?grossLtvPerCustomer/allInCpa:NaN;
  const payback=state.vertical==='saas'&&monthlyGrossPerCustomer>0?allInCpa/monthlyGrossPerCustomer:NaN;
  const mrr=state.vertical==='saas'?sales*firstRevenuePerSale:NaN;
  const brandHasValue=state.vertical==='brand'&&Number(v.brandResultValue)>0;
  const brandTarget=state.vertical==='brand'&&Number(v.brandTargetCost)>0?Number(v.brandTargetCost):NaN;
  const brandGap=state.vertical==='brand'&&Number.isFinite(brandTarget)&&Number.isFinite(allInCpa)?allInCpa/brandTarget-1:NaN;
  const activeAudience=state.vertical==='brand'&&Number(v.activeRate)>0?sales*(Number(v.activeRate)/100):NaN;
  const costPerActive=Number.isFinite(activeAudience)&&activeAudience>0?totalCosts/activeAudience:NaN;
  const engagements=state.vertical==='brand'&&Number(v.engagements)>0?Number(v.engagements):NaN;
  const audienceBase=state.vertical==='brand'&&Number(v.audienceBase)>0?Number(v.audienceBase):NaN;
  const costPerEngagement=Number.isFinite(engagements)?totalCosts/engagements:NaN;
  const errReach=Number.isFinite(engagements)&&Number.isFinite(reach)&&reach>0?engagements/reach:NaN;
  const erImpressions=Number.isFinite(engagements)&&Number.isFinite(impressions)&&impressions>0?engagements/impressions:NaN;
  const erAudience=Number.isFinite(engagements)&&Number.isFinite(audienceBase)&&audienceBase>0?engagements/audienceBase:NaN;

  const targetAdCpa=state.vertical==='brand'&&Number.isFinite(brandTarget)&&sales>0?Math.max(0,brandTarget-fixed/sales):NaN;
  const brandMaxCpc=Number.isFinite(targetAdCpa)?targetAdCpa*overallCvr:NaN;
  const trafficCpcLimit=state.vertical==='brand'&&!brandHasValue?brandMaxCpc:maxCpc;
  const maxCpm=trafficMode==='cpm'&&Number.isFinite(trafficCpcLimit)&&trafficCpcLimit>0?trafficCpcLimit*1000*ctr:NaN;
  const requiredCtr=trafficMode==='cpm'&&Number.isFinite(trafficCpcLimit)&&trafficCpcLimit>0&&cpm>0?cpm/(1000*trafficCpcLimit):NaN;

  return {cfg,v,trafficMode,spend,cpc,cpm,ctr,impressions,reach,frequency,fixed,totalCosts,clicks,funnel,stageCounts,sales,basis,revenuePerSale,revenue,grossProfit,profit,roi,roas,cpa,allInCpa,overallCvr,maxCpa,maxCpc,safety,breakEvenSales,requiredCvr,breakEvenRoas,firstStageCost,secondStageCost,grossLtvPerCustomer,ltvCac,payback,mrr,brandHasValue,brandTarget,brandGap,activeAudience,costPerActive,engagements,audienceBase,costPerEngagement,errReach,erImpressions,erAudience,brandMaxCpc,maxCpm,requiredCtr};
}

