function createReportPdf(r,resultTone,projectName){
  const WIDTH=1240, HEIGHT=1754, MARGIN=72, BOTTOM=HEIGHT-72;
  const pages=[];
  let canvas,ctx,y;
  const color={text:'#17191c',muted:'#6c727f',line:'#dfe2e7',soft:'#f7f7f8',positive:'#147a45',warning:'#956000',negative:'#bd2c2c'};
  const setFont=(size,weight=400)=>{ ctx.font=`${weight} ${size}px Arial, sans-serif`; };

  function newPage(){
    canvas=document.createElement('canvas');
    canvas.width=WIDTH; canvas.height=HEIGHT;
    ctx=canvas.getContext('2d',{alpha:false});
    ctx.fillStyle='#fff'; ctx.fillRect(0,0,WIDTH,HEIGHT);
    ctx.textBaseline='top';
    y=MARGIN;
    pages.push({canvas,ctx});
  }
  function ensure(height){ if(y+height>BOTTOM){ newPage(); return true; } return false; }
  function wrappedLines(text,maxWidth){
    const lines=[];
    String(text).split(/\n/).forEach(paragraph=>{
      const words=paragraph.split(/\s+/).filter(Boolean);
      if(!words.length){ lines.push(''); return; }
      let line='';
      words.forEach(word=>{
        const test=line?`${line} ${word}`:word;
        if(ctx.measureText(test).width<=maxWidth){ line=test; return; }
        if(line) lines.push(line);
        if(ctx.measureText(word).width<=maxWidth){ line=word; return; }
        let chunk='';
        for(const char of word){
          const next=chunk+char;
          if(ctx.measureText(next).width>maxWidth&&chunk){ lines.push(chunk); chunk=char; }
          else chunk=next;
        }
        line=chunk;
      });
      if(line) lines.push(line);
    });
    return lines;
  }
  function drawWrapped(text,x,top,maxWidth,lineHeight,fill=color.text){
    ctx.fillStyle=fill;
    const lines=wrappedLines(text,maxWidth);
    lines.forEach((line,index)=>ctx.fillText(line,x,top+index*lineHeight));
    return top+lines.length*lineHeight;
  }
  function fittedText(text,x,top,maxWidth,size,weight=700,fill=color.text,align='left'){
    let current=size; setFont(current,weight);
    while(current>15&&ctx.measureText(String(text)).width>maxWidth){ current-=1; setFont(current,weight); }
    ctx.fillStyle=fill; ctx.textAlign=align;
    ctx.fillText(String(text),x,top);
    ctx.textAlign='left';
  }
  function sectionTitle(title){
    ensure(58); setFont(25,700); ctx.fillStyle=color.text; ctx.fillText(title,MARGIN,y); y+=42;
  }
  function horizontalLine(top=y){ ctx.strokeStyle=color.line; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(MARGIN,top); ctx.lineTo(WIDTH-MARGIN,top); ctx.stroke(); }
  function drawMetricCards(items){
    const gap=14, cols=4, cardW=(WIDTH-MARGIN*2-gap*(cols-1))/cols, cardH=112;
    ensure(cardH*2+gap+10);
    items.forEach(([label,value],index)=>{
      const row=Math.floor(index/cols), col=index%cols;
      const x=MARGIN+col*(cardW+gap), top=y+row*(cardH+gap);
      ctx.fillStyle=color.soft; ctx.fillRect(x,top,cardW,cardH);
      ctx.strokeStyle=color.line; ctx.lineWidth=2; ctx.strokeRect(x,top,cardW,cardH);
      setFont(17,400); drawWrapped(label,x+16,top+15,cardW-32,21,color.muted);
      fittedText(value,x+16,top+61,cardW-32,26,700,color.text);
    });
    y+=cardH*2+gap+8;
  }
  function tableHeader(columns,widths){
    const rowH=38;
    ctx.fillStyle='#f2f3f4'; ctx.fillRect(MARGIN,y,WIDTH-MARGIN*2,rowH);
    let x=MARGIN;
    columns.forEach((label,index)=>{
      setFont(14,700); ctx.fillStyle=color.muted;
      const align=index===columns.length-1?'right':'left'; ctx.textAlign=align;
      ctx.fillText(label,align==='right'?x+widths[index]-10:x+10,y+10); ctx.textAlign='left';
      x+=widths[index];
    });
    y+=rowH;
  }
  function drawTable(columns,rows,widths){
    tableHeader(columns,widths);
    rows.forEach(row=>{
      setFont(17,400);
      const lineCounts=row.map((cell,index)=>wrappedLines(cell,widths[index]-20).length);
      const rowH=Math.max(42,Math.max(...lineCounts)*22+18);
      if(ensure(rowH+40)) tableHeader(columns,widths);
      let x=MARGIN;
      row.forEach((cell,index)=>{
        setFont(17,index===row.length-1?700:400);
        const align=index===row.length-1?'right':'left';
        const textX=align==='right'?x+widths[index]-10:x+10;
        ctx.textAlign=align;
        const lines=wrappedLines(cell,widths[index]-20);
        lines.forEach((line,lineIndex)=>ctx.fillText(line,textX,y+9+lineIndex*22));
        ctx.textAlign='left'; x+=widths[index];
      });
      ctx.strokeStyle=color.line; ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(MARGIN,y+rowH); ctx.lineTo(WIDTH-MARGIN,y+rowH); ctx.stroke();
      y+=rowH;
    });
    y+=12;
  }

  newPage();
  const cfg=VERTICALS[state.vertical];
  const locale=state.language==='uk'?'uk-UA':'en-US';
  const generated=new Intl.DateTimeFormat(locale,{dateStyle:'medium',timeStyle:'short'}).format(new Date());
  const basis=state.vertical==='brand'?t('brandEfficiency'):t(r.basis==='ltv'?'basisLifetime':(state.vertical==='saas'?'basisFirstMonth':'basisFirstOrder'));
  const statusLabel=state.vertical==='brand'&&!r.brandHasValue&&!Number.isFinite(r.brandTarget)?t('brandEfficiency'):t(resultTone==='positive'?'profitable':resultTone==='warning'?'nearLimit':'loss');
  const statusColor=resultTone==='positive'?color.positive:resultTone==='warning'?color.warning:color.negative;

  setFont(15,700); ctx.fillStyle=color.muted; ctx.fillText(t('reportTitle').toUpperCase(),MARGIN,y); y+=30;
  const statusW=285,statusH=56,statusX=WIDTH-MARGIN-statusW;
  fittedText(projectName,MARGIN,y,WIDTH-MARGIN*2-statusW-24,44,700,color.text);
  ctx.strokeStyle=color.line; ctx.lineWidth=2; ctx.strokeRect(statusX,y-4,statusW,statusH); ctx.fillStyle=statusColor; ctx.fillRect(statusX,y-4,7,statusH);
  setFont(17,700); drawWrapped(statusLabel,statusX+20,y+12,statusW-34,21,color.text);
  y+=62; setFont(18,400); ctx.fillStyle=color.muted; ctx.fillText(`${t(cfg.title)} · ${basis}`,MARGIN,y); y+=28;
  setFont(15,400); ctx.fillText(`${t('reportGenerated')}: ${generated}`,MARGIN,y); y+=38; horizontalLine(); y+=30;

  sectionTitle(t('reportResults'));
  const reportMetrics=state.vertical==='brand'&&!r.brandHasValue?[
    [t('brandCost'),money(r.allInCpa)],[t('brandTarget'),Number.isFinite(r.brandTarget)?money(r.brandTarget):'—'],[t('salesMetric'),count(r.sales)],[t('overallCvr'),pct(r.overallCvr)],
    [t('activeAudience'),Number.isFinite(r.activeAudience)?count(r.activeAudience):'—'],[t('costPerActive'),Number.isFinite(r.costPerActive)?money(r.costPerActive):'—'],[t('cpc'),money(r.cpc)],[t('totalCosts'),money(r.totalCosts)]
  ]:[
    [t('netProfit'),money(r.profit)],['ROI',pct(r.roi)],[t('revenue'),money(r.revenue)],[t('roas'),ratio(r.roas)],
    [t('cpa'),money(r.cpa)],[t('maxCpa'),money(Math.max(0,r.maxCpa))],[t('overallCvr'),pct(r.overallCvr)],[t('totalCosts'),money(r.totalCosts)]
  ];
  drawMetricCards(reportMetrics);

  horizontalLine(); y+=30; sectionTitle(t('reportInputs'));
  const inputRows=reportValueRows(r).concat(state.stages[state.vertical].map((stage,index)=>[
    `${index===0?t('clicks'):stageName(state.stages[state.vertical][index-1])} → ${stageName(stage)}`,
    `${count(stage.rate)}%`
  ]));
  drawTable([t('reportInputs'),''],inputRows,[760,WIDTH-MARGIN*2-760]);

  horizontalLine(); y+=30; sectionTitle(t('reportFunnel'));
  const {rows}=getFunnelAnalysis(r);
  drawTable(
    [t('reportStage'),t('reportCount'),t('reportConversion')],
    rows.map((stage,index)=>[stage.label,count(stage.value),index===0?'—':pct(stage.rate)]),
    [580,230,WIDTH-MARGIN*2-810]
  );

  horizontalLine(); y+=30; sectionTitle(t('recommendationsTitle'));
  const recommendations=buildRecommendations(r,resultTone);
  recommendations.forEach((text,index)=>{
    setFont(18,400);
    const lines=wrappedLines(text,WIDTH-MARGIN*2-50);
    const blockH=lines.length*25+18;
    ensure(blockH);
    ctx.fillStyle=color.text; ctx.fillText(`${index+1}.`,MARGIN,y);
    drawWrapped(text,MARGIN+38,y,WIDTH-MARGIN*2-38,25,color.text);
    y+=blockH;
  });

  ensure(95); y+=12; horizontalLine(); y+=22;
  setFont(14,400); drawWrapped(`${t('reportNote')}${t('disclaimer')}`,MARGIN,y,WIDTH-MARGIN*2,20,color.muted);

  pages.forEach((page,index)=>{
    const pageCtx=page.ctx;
    pageCtx.strokeStyle=color.line; pageCtx.lineWidth=1; pageCtx.beginPath(); pageCtx.moveTo(MARGIN,HEIGHT-50); pageCtx.lineTo(WIDTH-MARGIN,HEIGHT-50); pageCtx.stroke();
    pageCtx.font='400 13px Arial, sans-serif'; pageCtx.fillStyle=color.muted; pageCtx.textBaseline='top';
    pageCtx.fillText(projectName,MARGIN,HEIGHT-38);
    const pageNumber=`${index+1} / ${pages.length}`; pageCtx.textAlign='right'; pageCtx.fillText(pageNumber,WIDTH-MARGIN,HEIGHT-38); pageCtx.textAlign='left';
  });

  const jpegPages=pages.map(page=>bytesFromDataUrl(page.canvas.toDataURL('image/jpeg',.94)));
  return buildImagePdf(jpegPages,WIDTH,HEIGHT);
}

