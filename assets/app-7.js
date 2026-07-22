function calculate(){
  const cfg=VERTICALS[state.vertical];
  const v=state.values[state.vertical];
  const spend=Number(v.adSpend)||0;
  const cpc=Number(v.cpc)||0;
  const fixed=Math.max(0,Number(v.fixedCosts)||0);
  const totalCosts=spend+fixed;
  const clicks=spend/cpc;
  const funnel=[{label:t('clicks'),value:clicks}];
  let current=clicks;
  const stageCounts=[];
  state.stages[state.vertical].forEach(stage=>{
    current*=Math.min(100,Math.max(0,Number(stage.rate)||0))/100;
    const item={label:stageName(stage),value:current};
    funnel.push(item); stageCounts.push(item);
  });
  const sales=current;

  let firstRevenuePerSale=0, ltvRevenuePerSale=0;
  if(state.vertical==='brand'){
    const first=rows[1]||null;
    const final=rows.at(-1)||null;
    if(first&&final){
      if(first.rate>=.35&&final.rate<.2){
        recs.push(ua
          ? `Клік і перехід у профіль/канал працюють, але підписка або цільова дія просідає (${pct(final.rate)}). Це вже не проблема закупки трафіку. Перевір біо, аватар, закріплений пост, останні 6–9 публікацій і одну чітку причину підписатись. Порівняй follow/subscription rate по креативах: дешевий клік без підписки — це не дешевий ріст аудиторії.`
          : `Clicks and profile/channel visits are working, but the follow or meaningful-action rate is weak (${pct(final.rate)}). This is no longer mainly a traffic-buying issue. Review the bio, avatar, pinned post, latest content, and one clear reason to follow. Compare follow/subscription rate by creative: a cheap click without a follow is not cheap audience growth.`);
      } else if(first.rate<.25){
        recs.push(ua
          ? `Слабкий перший перехід (${pct(first.rate)}) означає, що креатив збирає увагу, але не формує достатньої цікавості до бренду. Перевір, чи є в рекламі конкретна обіцянка контенту або користі після кліку, і розділи кампанії за мотивом: експертність, кейси, новини, ком’юніті чи промо.`
          : `A weak first transition (${pct(first.rate)}) means the creative attracts attention but not enough brand intent. Make the post-click value specific and split campaigns by motivation: expertise, cases, news, community, or promotion.`);
      }
    }
    if(Number.isFinite(r.brandTarget)){
      recs.push(ua
        ? `All-in ціна результату — ${money(r.allInCpa)}, ціль — ${money(r.brandTarget)} (${pct(r.brandGap)} відхилення). Розбирай не лише CPF/CPS, а три рівні: CPC → перехід у профіль/канал → підписка. Так стане видно, чи дорожнеча виникає в аукціоні, у креативі або вже на самому майданчику.`
        : `All-in result cost is ${money(r.allInCpa)} versus a ${money(r.brandTarget)} target (${pct(r.brandGap)} gap). Break it into three layers: CPC → profile/channel visit → follow. This shows whether the cost problem comes from the auction, the creative, or the destination itself.`);
    }
    if(Number.isFinite(r.activeAudience)&&Number.isFinite(r.costPerActive)){
      const activeRate=(Number(r.v.activeRate)||0)/100;
      recs.push(ua
        ? `Через 30 днів активними лишається ${pct(activeRate)} залученої аудиторії, тому реальна ціна активного користувача — ${money(r.costPerActive)}. Порівнюй відписки, перегляди постів і reach по джерелах: кампанія з найнижчим CPF може приводити найменш цінну аудиторію.`
        : `${pct(activeRate)} of acquired users remain active after 30 days, so the real cost per active member is ${money(r.costPerActive)}. Compare unfollows, post views, and reach by source: the lowest CPF can still produce the least valuable audience.`);
    } else {
      recs.push(ua
        ? `Додай частку активних через 30 днів. Без цього калькулятор бачить лише кількість підписок, але не відрізняє реальний ріст аудиторії від короткого приросту, який потім відписується або не дивиться контент.`
        : `Add the share active after 30 days. Without it, the calculator sees follower volume but cannot separate real audience growth from short-lived follows that later unsubscribe or ignore the content.`);
    }
    if(!r.brandHasValue){
      recs.push(ua
        ? `Без оціненої цінності підписника або бренд-дії тут коректно говорити про ефективність залучення, а не про ROI. Щоб порахувати дохідність, зв’яжи джерело підписки з наступною дією: переходом на сайт, заявкою, реєстрацією, промокодом або продажем.`
        : `Without an estimated follower or brand-action value, this is acquisition efficiency, not ROI. To calculate profitability, connect acquisition source to a downstream action such as a site visit, lead, signup, promo code, or sale.`);
    }
  }

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
  const brandTarget=state.vertical==='brand'?Number(v.brandTargetCost)||NaN:NaN;
  const brandGap=state.vertical==='brand'&&Number.isFinite(brandTarget)&&brandTarget>0&&Number.isFinite(allInCpa)?allInCpa/brandTarget-1:NaN;
  const activeAudience=state.vertical==='brand'&&Number(v.activeRate)>0?sales*(Number(v.activeRate)/100):NaN;
  const costPerActive=Number.isFinite(activeAudience)&&activeAudience>0?totalCosts/activeAudience:NaN;

  return {cfg,v,spend,cpc,fixed,totalCosts,clicks,funnel,stageCounts,sales,basis,revenuePerSale,revenue,grossProfit,profit,roi,roas,cpa,allInCpa,overallCvr,maxCpa,maxCpc,safety,breakEvenSales,requiredCvr,breakEvenRoas,firstStageCost,secondStageCost,grossLtvPerCustomer,ltvCac,payback,mrr,brandHasValue,brandTarget,brandGap,activeAudience,costPerActive};
}

function tone(r){
  if(state.vertical==='brand'&&!r.brandHasValue){
    if(!Number.isFinite(r.brandTarget)||r.brandTarget<=0) return 'warning';
    if(r.allInCpa>r.brandTarget*1.15) return 'negative';
    if(r.allInCpa>r.brandTarget) return 'warning';
    return 'positive';
  }
  if(!Number.isFinite(r.profit)) return 'warning';
  const threshold=Math.max(1,r.totalCosts*.01);
  if(r.profit<-threshold) return 'negative';
  if(!Number.isFinite(r.safety)||r.safety<.12) return 'warning';
  return 'positive';
}

function money(value){
  if(!Number.isFinite(value)) return '—';
  const digits=Math.abs(value)<10?2:0;
  return new Intl.NumberFormat(state.language==='uk'?'uk-UA':'en-US',{style:'currency',currency:state.currency,maximumFractionDigits:digits,minimumFractionDigits:digits}).format(value);
}
function pct(value){ return Number.isFinite(value)?new Intl.NumberFormat(state.language==='uk'?'uk-UA':'en-US',{style:'percent',maximumFractionDigits:1}).format(value):'—'; }
function ratio(value){ return Number.isFinite(value)?`${new Intl.NumberFormat(state.language==='uk'?'uk-UA':'en-US',{maximumFractionDigits:2}).format(value)}×`:'—'; }
function count(value){ return Number.isFinite(value)?new Intl.NumberFormat(state.language==='uk'?'uk-UA':'en-US',{maximumFractionDigits:value<10?2:0}).format(value):'—'; }
function fill(text,vars){ return text.replace(/\{(\w+)\}/g,(_,k)=>vars[k]??''); }

