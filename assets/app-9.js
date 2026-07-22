function stageBenchmark(label,index){
  const name=String(label||'').toLowerCase();
  const has=(...words)=>words.some(word=>name.includes(word));
  if(has('profile','профіл','channel','канал')) return .32;
  if(has('follow','subscriber','підпис')) return .22;
  if(has('cart','кошик')) return .08;
  if(has('checkout','оформлен')) return .42;
  if(has('purchase','payment','покуп','оплат')) return index===1?.025:.5;
  if(has('qualified','кваліф')) return .42;
  if(has('consult','call','дзвін','анкет')) return .42;
  if(has('sale','продаж','угод')) return .18;
  if(has('trial','активац')) return .3;
  if(has('paid','платн')) return .16;
  if(has('lead','лід','application','заявк','signup','реєстрац')) return index===1?.08:.3;
  return .25;
}
function getFunnelAnalysis(r){
  const rows=r.funnel.map((stage,index)=>{
    const previous=index>0?r.funnel[index-1].value:null;
    const rate=index===0?1:(previous>0?stage.value/previous:0);
    const lost=index===0?0:Math.max(0,previous-stage.value);
    const benchmark=index===0?1:stageBenchmark(stage.label,index);
    const score=index===0?1:(benchmark>0?rate/benchmark:rate);
    return {...stage,index,rate,lost,benchmark,score};
  });
  const transitions=rows.slice(1);
  const weakest=transitions.length?transitions.reduce((a,b)=>b.score<a.score?b:a):null;
  return {rows,weakest};
}

