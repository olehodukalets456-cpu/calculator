'use strict';
var __bpBaseRecommendations=buildRecommendations;
function buildRecommendations(r,resultTone){
  const ua=state.language==='uk';
  const recs=[];
  const add=text=>{if(text)recs.push(text)};

  if(r.trafficMode==='cpm'){
    const limit=state.vertical==='brand'&&!r.brandHasValue?r.brandMaxCpc:r.maxCpc;
    if(Number.isFinite(limit)&&limit>0&&r.cpc>limit){
      add(ua
        ? `CPM ${money(r.cpm)} і CTR ${pct(r.ctr)} дають CPC ${money(r.cpc)}, тоді як робоча межа — близько ${money(limit)}. За незмінного CPM CTR треба підняти до ${pct(r.requiredCtr)}; за незмінного CTR CPM має бути не вище ${money(r.maxCpm)}. Так видно, проблема в ціні показу чи в реакції на креатив.`
        : `CPM ${money(r.cpm)} and CTR ${pct(r.ctr)} produce a CPC of ${money(r.cpc)}, while the workable limit is about ${money(limit)}. With CPM unchanged, CTR needs to reach ${pct(r.requiredCtr)}; with CTR unchanged, CPM should stay below ${money(r.maxCpm)}. This separates an auction-cost problem from a creative-response problem.`);
    }else{
      add(ua
        ? `CPM ${money(r.cpm)} + CTR ${pct(r.ctr)} формують CPC ${money(r.cpc)}. Порівнюй ці три показники разом по креативах: дешеві покази не рятують слабкий CTR, а вищий CPM може бути нормальним, якщо дає дешевий якісний клік.`
        : `CPM ${money(r.cpm)} + CTR ${pct(r.ctr)} produce a CPC of ${money(r.cpc)}. Compare all three by creative: cheap impressions do not compensate for weak CTR, while a higher CPM can still work when it produces inexpensive qualified clicks.`);
    }
    if(Number.isFinite(r.frequency)) add(ua
      ? `Частота — ${count(r.frequency)}. Дивись її в динаміці разом із CTR і конверсією після кліку: якщо частота росте, а обидва показники падають, креатив або аудиторія вигорають. Сама по собі висока частота ще не є проблемою.`
      : `Frequency is ${count(r.frequency)}. Read it over time together with CTR and post-click conversion: if frequency rises while both fall, the creative or audience is saturating. Frequency alone is not proof of a problem.`);
  }

  if(state.vertical!=='brand'){
    const base=__bpBaseRecommendations(r,resultTone)||[];
    return [...recs,...base].slice(0,5);
  }

  const {rows}=getFunnelAnalysis(r);
  const conversions=rows.filter(row=>row.kind==='conversion');
  const first=conversions[0];
  const final=conversions.at(-1);
  if(first&&final){
    if(first.rate<.25){
      add(ua
        ? `У профіль або канал переходить лише ${pct(first.rate)} кліків. Креатив привертає увагу, але не створює достатнього інтересу до бренду. Зроби конкретною обіцянку після кліку й розділи кампанії за мотивом: кейси, експертність, новини, ком’юніті або промо.`
        : `Only ${pct(first.rate)} of clicks reach the profile or channel. The creative attracts attention but does not create enough brand intent. Make the post-click promise specific and split campaigns by motivation: cases, expertise, news, community, or promotion.`);
    }else if(final.rate<.2){
      add(ua
        ? `Перехід у профіль/канал працює, але в підписку або цільову дію переходить лише ${pct(final.rate)}. Проблема вже не в закупці кліку. Перевір біо, закріплений пост, останні публікації та одну чітку причину підписатись. Порівнюй subscription rate окремо по креативах.`
        : `Profile/channel visits work, but only ${pct(final.rate)} continue to a follow or meaningful action. This is no longer mainly a click-buying problem. Review the bio, pinned post, recent content, and one clear reason to follow. Compare subscription rate by creative.`);
    }else{
      add(ua
        ? `Після кліку у профіль/канал переходить ${pct(first.rate)}, а в підписку або цільову дію — ${pct(final.rate)} від попереднього етапу. Розкладай кінцеву ціну саме на CPC → visit rate → subscription rate: це покаже, де реально втрачається аудиторія.`
        : `After the click, ${pct(first.rate)} reach the profile/channel and ${pct(final.rate)} of those complete the follow or target action. Break final cost into CPC → visit rate → subscription rate to see where audience is actually lost.`);
    }
  }

  if(Number.isFinite(r.brandTarget)){
    add(ua
      ? `All-in ціна результату — ${money(r.allInCpa)}, ціль — ${money(r.brandTarget)}; відхилення ${pct(r.brandGap)}. Якщо ціна завелика, не ріж бюджет навмання: окремо перевір CPC, visit rate і subscription rate — кожен із них відповідає за іншу частину проблеми.`
      : `All-in result cost is ${money(r.allInCpa)} versus a ${money(r.brandTarget)} target, a ${pct(r.brandGap)} gap. If cost is too high, do not cut budget blindly: inspect CPC, visit rate, and subscription rate separately because each points to a different problem.`);
  }else{
    add(ua
      ? `Додай цільову ціну підписника або бренд-дії. Без неї видно фактичний CPF/CPS, але немає межі, за якою кампанія вже стала занадто дорогою для бізнесу.`
      : `Add a target cost per follower or brand action. Without it, you can see actual CPF/CPS but not the point where acquisition becomes too expensive for the business.`);
  }

  if(Number.isFinite(r.activeAudience)&&Number.isFinite(r.costPerActive)){
    const rate=(Number(r.v.activeRate)||0)/100;
    add(ua
      ? `Через 30 днів активними лишається ${pct(rate)} залученої аудиторії, тому ціна активного користувача — ${money(r.costPerActive)}. Порівнюй відписки, перегляди постів і reach по джерелах: найнижчий CPF не завжди дає найкращу аудиторію.`
      : `${pct(rate)} of acquired users remain active after 30 days, so cost per active member is ${money(r.costPerActive)}. Compare unfollows, post views, and reach by source: the lowest CPF does not always produce the best audience.`);
  }else{
    add(ua
      ? `Для перевірки якості додай частку активних через 30 днів. Інакше калькулятор бачить лише приріст підписок, але не відрізняє реальну аудиторію від людей, які швидко відписались або не дивляться контент.`
      : `To check quality, add the share active after 30 days. Otherwise the calculator sees follower growth but cannot separate real audience from users who quickly unsubscribe or ignore the content.`);
  }

  if(Number.isFinite(r.engagements)){
    const rates=[];
    if(Number.isFinite(r.errReach))rates.push(`${t('errReach')}: ${pct(r.errReach)}`);
    if(Number.isFinite(r.erImpressions))rates.push(`${t('erImpressions')}: ${pct(r.erImpressions)}`);
    if(Number.isFinite(r.erAudience))rates.push(`${t('erAudience')}: ${pct(r.erAudience)}`);
    if(rates.length)add(ua
      ? `${rates.join(' · ')}. Не змішуй ці ER в одному порівнянні: ERR за охопленням показує реакцію тих, хто реально побачив контент; ER за показами — ефективність показів; ER за підписниками — стан власної аудиторії. Збереження й поширення аналізуй окремо від лайків.`
      : `${rates.join(' · ')}. Do not mix these ER definitions: ERR by reach measures response among people actually reached; ER by impressions measures impression efficiency; follower-based ER measures owned-audience health. Analyse saves and shares separately from likes.`);
  }

  if(!r.brandHasValue)add(ua
    ? `Без оціненої цінності підписника або бренд-дії тут коректно рахувати ефективність залучення, а не ROI. Щоб перейти до дохідності, зв’яжи джерело підписки з наступною дією: сайтом, заявкою, реєстрацією, промокодом або продажем.`
    : `Without an estimated follower or brand-action value, measure acquisition efficiency rather than ROI. To reach profitability analysis, connect acquisition source to a downstream action such as a site visit, lead, signup, promo code, or sale.`);

  return recs.slice(0,5);
}
