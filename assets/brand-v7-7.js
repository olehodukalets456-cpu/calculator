const buildRecommendationsV6=buildRecommendations;
buildRecommendations=function(r,resultTone){
  const ua=state.language==='uk';
  const recs=[];
  const analysis=getFunnelAnalysis(r);
  const conversionRows=analysis.rows.filter(row=>row.kind==='conversion');
  if(r.trafficMode==='cpm'){
    const limit=state.vertical==='brand'&&!r.brandHasValue?r.brandMaxCpc:r.maxCpc;
    if(Number.isFinite(limit)&&limit>0&&r.cpc>limit){
      recs.push(ua
        ? `CPM ${money(r.cpm)} + CTR ${pct(r.ctr)} дають CPC ${money(r.cpc)}, а робоча межа — близько ${money(limit)}. За незмінного CPM CTR має зрости приблизно до ${Number.isFinite(r.requiredCtr)?pct(r.requiredCtr):'—'}; за незмінного CTR CPM має бути не вище ${Number.isFinite(r.maxCpm)?money(r.maxCpm):'—'}. Так видно, проблема в ціні показу чи у реакції на креатив.`
        : `CPM ${money(r.cpm)} + CTR ${pct(r.ctr)} produce CPC ${money(r.cpc)}, while the workable limit is about ${money(limit)}. With CPM unchanged, CTR needs to reach roughly ${Number.isFinite(r.requiredCtr)?pct(r.requiredCtr):'—'}; with CTR unchanged, CPM should stay below ${Number.isFinite(r.maxCpm)?money(r.maxCpm):'—'}. This separates auction cost from creative response.`);
    } else {
      recs.push(ua
        ? `CPM ${money(r.cpm)}, CTR ${pct(r.ctr)} і розрахунковий CPC ${money(r.cpc)} треба дивитися разом по креативах. Низький CPM не рятує слабкий CTR, а дорожчі покази можуть бути нормальними, якщо дають дешевший якісний клік.`
        : `Read CPM ${money(r.cpm)}, CTR ${pct(r.ctr)}, and calculated CPC ${money(r.cpc)} together by creative. Low CPM does not rescue weak CTR, while more expensive impressions can still work when they produce cheaper qualified clicks.`);
    }
    if(Number.isFinite(r.frequency)) recs.push(ua
      ? `Частота — ${count(r.frequency)}. Якщо вона росте, а CTR і конверсія після кліку падають, креатив або аудиторія вигорають. Якщо CTR стабільний, сама частота ще не є проблемою.`
      : `Frequency is ${count(r.frequency)}. If it rises while CTR and post-click conversion fall, the creative or audience is saturating. If CTR stays stable, frequency alone is not a problem.`);
  }
  if(state.vertical==='brand'){
    const first=conversionRows[0], final=conversionRows.at(-1);
    if(first&&final){
      if(first.rate>=.35&&final.rate<.2) recs.push(ua
        ? `Перехід у профіль або канал працює, але підписка / цільова дія просідає (${pct(final.rate)}). Проблема вже не в закупці кліку: перевір біо, закріплений пост, останній контент і одну чітку причину підписатись. Порівнюй subscription rate по креативах — дешевий клік без підписки не є дешевим ростом.`
        : `Profile or channel visits work, but follow / meaningful-action conversion is weak (${pct(final.rate)}). This is no longer mainly a click-buying issue: review the bio, pinned post, recent content, and one clear reason to follow. Compare subscription rate by creative—a cheap click without a follow is not cheap growth.`);
      else if(first.rate<.25) recs.push(ua
        ? `Перший перехід після кліку — ${pct(first.rate)}. Креатив привертає увагу, але не створює достатнього інтересу до бренду. Зроби конкретнішою обіцянку того, що людина отримає в профілі або каналі, і розділи кампанії за мотивом: кейси, експертність, новини, ком’юніті чи промо.`
        : `The first post-click transition is only ${pct(first.rate)}. The creative attracts attention but does not create enough brand intent. Make the destination value more specific and split campaigns by motivation: cases, expertise, news, community, or promotion.`);
    }
    if(Number.isFinite(r.brandTarget)) recs.push(ua
      ? `All-in ціна результату — ${money(r.allInCpa)}, ціль — ${money(r.brandTarget)}. Розклади різницю на CPM → CTR/CPC → перехід у профіль → підписку: так видно, де саме дорожчає результат.`
      : `All-in result cost is ${money(r.allInCpa)} versus a ${money(r.brandTarget)} target. Break the gap into CPM → CTR/CPC → profile visit → follow to see exactly where the result becomes expensive.`);
    if(Number.isFinite(r.errReach)||Number.isFinite(r.erImpressions)||Number.isFinite(r.erAudience)){
      const metrics=[];
      if(Number.isFinite(r.errReach)) metrics.push(`${t('errReach')}: ${pct(r.errReach)}`);
      if(Number.isFinite(r.erImpressions)) metrics.push(`${t('erImpressions')}: ${pct(r.erImpressions)}`);
      if(Number.isFinite(r.erAudience)) metrics.push(`${t('erAudience')}: ${pct(r.erAudience)}`);
      recs.push(ua
        ? `${metrics.join(' · ')}. Не змішуй ці показники: ERR оцінює реакцію охоплених людей, ER за показами — ефективність усіх контактів, ER за підписниками — стан власної аудиторії. Збереження й поширення дивись окремо від лайків.`
        : `${metrics.join(' · ')}. Do not mix these metrics: ERR measures response among reached users, impression ER measures all exposures, and follower ER reflects owned-audience health. Track saves and shares separately from likes.`);
    }
    if(Number.isFinite(r.activeAudience)&&Number.isFinite(r.costPerActive)) recs.push(ua
      ? `Через 30 днів активними лишається ${pct((Number(r.v.activeRate)||0)/100)} залученої аудиторії, тому реальна ціна активного користувача — ${money(r.costPerActive)}. Порівнюй джерела не лише за CPF, а й за відписками, переглядами та повторною взаємодією.`
      : `${pct((Number(r.v.activeRate)||0)/100)} of acquired users remain active after 30 days, so the real cost per active user is ${money(r.costPerActive)}. Compare sources not only by CPF but also by unfollows, views, and repeat engagement.`);
  }
  const base=buildRecommendationsV6(r,resultTone)||[];
  return [...recs,...base].filter((value,index,array)=>value&&array.indexOf(value)===index).slice(0,5);
};

// Existing listeners were already mounted by the base app; only reset needs the new mode state.
dom.reset.onclick=()=>{ const cfg=VERTICALS[state.vertical]; state.values[state.vertical]={...cfg.defaults}; state.basis[state.vertical]=cfg.defaultBasis; state.trafficMode[state.vertical]='cpc'; state.stages[state.vertical]=cloneStages(cfg.stages); renderAll(); save(); };
restore(); ensureState(); renderAll();
