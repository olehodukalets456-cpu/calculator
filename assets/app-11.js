function renderDashboard(r,resultTone){
  const {rows,weakest}=getFunnelAnalysis(r);
  dom.dashboardFunnel.replaceChildren();
  const step=rows.length>1?Math.min(10,54/(rows.length-1)):0;
  rows.forEach((stage,index)=>{
    const el=document.createElement('div');
    el.className='dashboard-stage';
    el.style.setProperty('--stage-width',`${Math.max(46,100-index*step)}%`);
    const meta=index===0
      ? `${t('cpc')}: ${money(r.cpc)}`
      : `${t('stageConversion')}: ${pct(stage.rate)} · ${t('stageDrop')}: ${count(stage.lost)}`;
    el.innerHTML=`<div class="dashboard-stage-main"><strong title="${esc(stage.label)}">${esc(stage.label)}</strong><span>${esc(count(stage.value))}</span></div><div class="dashboard-stage-meta"><span>${esc(meta)}</span>${weakest&&stage.index===weakest.index?`<span class="drop">${esc(t('weakestStage'))}</span>`:''}</div>`;
    dom.dashboardFunnel.append(el);
  });

  const dashboardItems=state.vertical==='brand'&&!r.brandHasValue?[
    card('finalConversion',pct(r.overallCvr)),
    card('brandCost',money(r.allInCpa)),
    card('brandTarget',Number.isFinite(r.brandTarget)?money(r.brandTarget):'—'),
    card('costPerActive',Number.isFinite(r.costPerActive)?money(r.costPerActive):'—')
  ]:[
    card('finalConversion',pct(r.overallCvr)),
    card('costPerFinal',money(r.cpa)),
    card('maxCpa',money(Math.max(0,r.maxCpa))),
    card('safety',Number.isFinite(r.safety)?pct(r.safety):'—')
  ];
  renderCards(dom.dashboardStats,dashboardItems,'dashboard-stat');

  dom.recommendations.replaceChildren();
  buildRecommendations(r,resultTone).forEach(text=>{
    const p=document.createElement('p'); p.className='recommendation'; p.textContent=text; dom.recommendations.append(p);
  });
}

function reportValueRows(r){
  const cfg=VERTICALS[state.vertical];
  const defs=[...trafficDefinitions(),...cfg.money];
  return defs.map(def=>{
    const raw=state.values[state.vertical][def.id];
    if((raw===''||raw===null||raw===undefined)&&!def.required) return [t(def.label),'—'];
    const value=def.type==='money'?money(Number(raw)||0):def.type==='percent'?`${count(Number(raw)||0)}%`:count(Number(raw)||0);
    return [t(def.label),value];
  });
}

function bytesFromDataUrl(dataUrl){
  const binary=atob(dataUrl.split(',')[1]);
  const out=new Uint8Array(binary.length);
  for(let i=0;i<binary.length;i++) out[i]=binary.charCodeAt(i);
  return out;
}

function joinBytes(parts){
  const total=parts.reduce((sum,part)=>sum+part.length,0);
  const out=new Uint8Array(total);
  let offset=0;
  parts.forEach(part=>{ out.set(part,offset); offset+=part.length; });
  return out;
}

function buildImagePdf(jpegPages,pixelWidth,pixelHeight){
  const enc=new TextEncoder();
  const ascii=text=>enc.encode(text);
  const objectCount=2+jpegPages.length*3;
  const objects=new Array(objectCount+1);
  const pageRefs=[];

  jpegPages.forEach((jpeg,index)=>{
    const pageObject=3+index*3;
    const imageObject=pageObject+1;
    const contentObject=pageObject+2;
    pageRefs.push(`${pageObject} 0 R`);
    const imageName=`Im${index+1}`;
    const content=`q\n595.28 0 0 841.89 0 0 cm\n/${imageName} Do\nQ\n`;
    const contentBytes=ascii(content);
    objects[pageObject]=ascii(`${pageObject} 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595.28 841.89] /Resources << /XObject << /${imageName} ${imageObject} 0 R >> >> /Contents ${contentObject} 0 R >>\nendobj\n`);
    objects[imageObject]=joinBytes([
      ascii(`${imageObject} 0 obj\n<< /Type /XObject /Subtype /Image /Width ${pixelWidth} /Height ${pixelHeight} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpeg.length} >>\nstream\n`),
      jpeg,
      ascii('\nendstream\nendobj\n')
    ]);
    objects[contentObject]=joinBytes([
      ascii(`${contentObject} 0 obj\n<< /Length ${contentBytes.length} >>\nstream\n`),
      contentBytes,
      ascii('endstream\nendobj\n')
    ]);
  });

  objects[1]=ascii('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n');
  objects[2]=ascii(`2 0 obj\n<< /Type /Pages /Kids [${pageRefs.join(' ')}] /Count ${jpegPages.length} >>\nendobj\n`);

  const header=ascii('%PDF-1.4\n%âãÏÓ\n');
  const chunks=[header];
  const offsets=new Array(objectCount+1).fill(0);
  let position=header.length;
  for(let i=1;i<=objectCount;i++){
    offsets[i]=position;
    chunks.push(objects[i]);
    position+=objects[i].length;
  }
  const xrefPosition=position;
  let xref=`xref\n0 ${objectCount+1}\n0000000000 65535 f \n`;
  for(let i=1;i<=objectCount;i++) xref+=`${String(offsets[i]).padStart(10,'0')} 00000 n \n`;
  xref+=`trailer\n<< /Size ${objectCount+1} /Root 1 0 R >>\nstartxref\n${xrefPosition}\n%%EOF`;
  chunks.push(ascii(xref));
  return new Blob(chunks,{type:'application/pdf'});
}

