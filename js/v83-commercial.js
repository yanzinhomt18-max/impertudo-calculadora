/* IMPERTUDO V8.3 — proposta comercial mais segura */
(function(){
 function grossOf(it){return (Number(it.priceQty)||0)*(Number(it.unitPrice)||0);}

 window.normalizeQuoteItem=function(it){
  it.packOptions=Array.isArray(it.packOptions)?it.packOptions:[];
  it.selectedPackIndex=Number.isInteger(it.selectedPackIndex)?it.selectedPackIndex:0;
  const opt=it.packOptions[it.selectedPackIndex]||it.packOptions[0];
  it.priceQty=Number(it.priceQty||opt?.qty||1);
  it.priceUnitLabel=it.priceUnitLabel||opt?.label||'un.';
  it.unitPrice=Number(it.unitPrice||0);
  if(!it.discountType){
   const oldPct=Math.max(0,Math.min(100,Number(it.discountPct||0)));
   const oldValue=Math.max(0,Number(it.discountValue||0));
   if(oldPct>0&&oldValue>0){
    const gross=grossOf(it);it.discountType='value';it.discountAmount=Math.min(gross,(gross*oldPct/100)+oldValue);
   }else if(oldPct>0){it.discountType='pct';it.discountAmount=oldPct;}
   else if(oldValue>0){it.discountType='value';it.discountAmount=oldValue;}
   else{it.discountType='pct';it.discountAmount=0;}
  }
  it.discountType=it.discountType==='value'?'value':'pct';
  it.discountAmount=Math.max(0,Number(it.discountAmount||0));
  delete it.discountPct;delete it.discountValue;
  return it;
 };

 window.updateItemDiscountType=function(id,type){
  const it=quoteItems.find(x=>x.id===id);if(!it)return;
  it.discountType=type==='value'?'value':'pct';it.discountAmount=0;saveQuote();
 };
 window.updateItemDiscountAmount=function(id,value){
  const it=quoteItems.find(x=>x.id===id);if(!it)return;
  const n=Math.max(0,parseFloat(String(value).replace(',','.'))||0);
  it.discountAmount=it.discountType==='pct'?Math.min(100,n):n;saveQuote();
 };
 window.itemGross=function(it){return grossOf(it);};
 window.itemDiscount=function(it){
  normalizeQuoteItem(it);const gross=grossOf(it),amount=Number(it.discountAmount)||0;
  return Math.min(gross,it.discountType==='pct'?gross*Math.min(100,amount)/100:amount);
 };
 window.itemSubtotal=function(it){return Math.max(0,grossOf(it)-itemDiscount(it));};
 window.quoteGrossTotal=function(){return quoteItems.reduce((s,it)=>s+grossOf(it),0);};
 window.quoteItemDiscountTotal=function(){return quoteItems.reduce((s,it)=>s+itemDiscount(it),0);};
 window.quoteNetBaseTotal=function(){return quoteItems.reduce((s,it)=>s+itemSubtotal(it),0);};
 window.quoteCashDiscountValue=function(){return quoteNetBaseTotal()*(cashDiscountPct()/100);};
 window.quoteCashTotal=function(){return quoteNetBaseTotal()-quoteCashDiscountValue();};

 function discountText(it){
  if(!itemDiscount(it))return 'Sem desconto';
  return it.discountType==='pct'?`${fmt(it.discountAmount,1)}% (${money(itemDiscount(it))})`:money(itemDiscount(it));
 }

 window.updateCommercialTotals=function(){
  const gross=quoteGrossTotal(),itemDisc=quoteItemDiscountTotal(),base=quoteNetBaseTotal(),pct=cashDiscountPct(),cashDisc=quoteCashDiscountValue(),cash=quoteCashTotal();
  if($('#quoteGross'))$('#quoteGross').textContent=money(gross);
  if($('#quoteItemDiscountTotal'))$('#quoteItemDiscountTotal').textContent=money(itemDisc);
  if($('#quoteNetBase'))$('#quoteNetBase').textContent=money(base);
  if($('#quoteDiscountValue'))$('#quoteDiscountValue').textContent=money(cashDisc);
  if($('#quoteDiscountPct'))$('#quoteDiscountPct').textContent=fmt(pct,1)+'% sobre a base';
  if($('#quoteCashTotal'))$('#quoteCashTotal').textContent=money(cash);
  if($('#quoteCardTotal'))$('#quoteCardTotal').textContent=money(base);
  const label=paymentMethod==='cartao'?'Cartão':paymentMethod==='dinheiro'?'Dinheiro':'PIX',final=paymentMethod==='cartao'?base:cash;
  const detail=paymentMethod==='cartao'?'sem desconto adicional à vista':pct>0?`com ${fmt(pct,1)}% de desconto adicional à vista`:'sem desconto adicional';
  if($('#selectedPaymentSummary'))$('#selectedPaymentSummary').innerHTML=`Forma selecionada: <b>${label} — ${money(final)}</b> <span style="opacity:.75">(${detail})</span>`;
 };

 window.renderQuote=function(){
  const count=$('#quoteCount');if(count)count.textContent=quoteItems.length;
  const empty=$('#quoteEmpty'),list=$('#quoteList');if(!list)return;empty?.classList.toggle('hidden',quoteItems.length>0);
  quoteItems=quoteItems.map(normalizeQuoteItem);
  list.innerHTML=quoteItems.map((it,i)=>{
   const gross=grossOf(it),discount=itemDiscount(it),subtotal=itemSubtotal(it),opts=it.packOptions||[];
   const packSelect=opts.length?`<select onchange="updateQuotePack(${it.id},this.value)">${opts.map((o,idx)=>`<option value="${idx}" ${idx===it.selectedPackIndex?'selected':''}>${o.qty} × ${escHtml(o.label)}</option>`).join('')}</select>`:`<input value="${escHtml(it.priceUnitLabel||'un.')}" disabled>`;
   const placeholder=it.discountType==='pct'?'0 a 100':'0,00';
   return `<div class="quote-item">
    <div class="quote-item-head"><div><h4>${i+1}. ${escHtml(it.title)}</h4><small>${escHtml(it.category||'')} • ${escHtml(it.createdAt||'')}</small></div><button class="quote-remove" onclick="removeQuoteItem(${it.id})">Remover</button></div>
    ${it.metrics?.length?`<div class="quote-metrics">${it.metrics.map(m=>`<div class="quote-metric"><b>${escHtml(m.value)}</b><span>${escHtml(m.label)}</span></div>`).join('')}</div>`:''}
    ${it.packs?.length?`<div class="quote-packs"><b>Quantitativo calculado</b><br>${it.packs.map(escHtml).join('<br>')}</div>`:''}
    <div class="quote-commercial"><div class="quote-commercial-grid">
     <div class="field"><label>Embalagem / unidade</label>${packSelect}</div>
     <div class="field"><label>Quantidade</label><input type="number" min="0" step="1" value="${it.priceQty||0}" onchange="updateQuoteQty(${it.id},this.value)"></div>
     <div class="field"><label>Preço unitário (R$)</label><input type="number" min="0" step="0.01" value="${it.unitPrice||''}" placeholder="0,00" onchange="updateUnitPrice(${it.id},this.value)"></div>
     <div class="field"><label>Tipo de desconto do item</label><select onchange="updateItemDiscountType(${it.id},this.value)"><option value="pct" ${it.discountType==='pct'?'selected':''}>Percentual (%)</option><option value="value" ${it.discountType==='value'?'selected':''}>Valor fixo (R$)</option></select></div>
     <div class="field"><label>Desconto comercial</label><input type="number" min="0" ${it.discountType==='pct'?'max="100" step="0.1"':'step="0.01"'} value="${it.discountAmount||0}" placeholder="${placeholder}" onchange="updateItemDiscountAmount(${it.id},this.value)"></div>
     <div class="item-subtotal"><span>Total líquido</span><b>${money(subtotal)}</b><small>Bruto ${money(gross)} • ${discountText(it)}</small></div>
    </div>${!it.unitPrice?'<div class="price-missing">Preço unitário ainda não informado.</div>':''}</div>
   </div>`;
  }).join('');
  updateCommercialTotals();
 };

 window.commercialLines=function(){
  const gross=quoteGrossTotal(),itemDiscount=quoteItemDiscountTotal(),base=quoteNetBaseTotal(),pct=cashDiscountPct(),cashDiscount=quoteCashDiscountValue(),cash=quoteCashTotal(),card=base;
  return {gross,itemDiscount,base,pct,cashDiscount,cash,card,selected:paymentMethod==='cartao'?card:cash};
 };

 window.proposalText=function(){
  const client=cleanText($('#quoteClient')?.value),consult=cleanText($('#quoteConsultant')?.value),note=cleanText($('#paymentNote')?.value),c=commercialLines();let t='IMPERTUDO - PROPOSTA / RESUMO DE MATERIAIS\n';
  if(client)t+='Cliente/obra: '+client+'\n';if(consult)t+='Responsável: '+consult+'\n';t+='\n';
  quoteItems.forEach((it,i)=>{normalizeQuoteItem(it);t+=`${i+1}. ${it.title}\n`;(it.metrics||[]).forEach(m=>t+=`• ${m.label}: ${m.value}\n`);t+=`• ${it.priceQty||0} × ${it.priceUnitLabel||'un.'} × ${money(it.unitPrice||0)}\n`;if(itemDiscount(it)>0)t+=`• Desconto comercial do item: ${discountText(it)}\n`;t+=`• Subtotal líquido: ${money(itemSubtotal(it))}\n\n`;});
  t+=`CONDIÇÕES COMERCIAIS\nTotal de tabela: ${money(c.gross)}\nDescontos comerciais dos itens: ${money(c.itemDiscount)}\nBase após itens: ${money(c.base)}\nDesconto adicional PIX/Dinheiro (${fmt(c.pct,1)}%): ${money(c.cashDiscount)}\nPIX / Dinheiro: ${money(c.cash)}\nCartão: ${money(c.card)}\nForma selecionada: ${paymentLabel()} — ${money(c.selected)}\n`;
  if(note)t+=`Observação: ${note}\n`;return t+'\nPré-dimensionamento: conferir ficha técnica vigente, projeto e condições reais da obra.';
 };

 function logoForPdf(){
  try{
   const img=document.querySelector('.hero-logo');if(!img||!img.complete)return null;
   const nw=img.naturalWidth||img.width,nh=img.naturalHeight||img.height;if(!(nw>0&&nh>0))return null;
   const max=900,scale=Math.min(1,max/Math.max(nw,nh)),w=Math.max(1,Math.round(nw*scale)),h=Math.max(1,Math.round(nh*scale));
   const c=document.createElement('canvas');c.width=w;c.height=h;const ctx=c.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,w,h);ctx.drawImage(img,0,0,w,h);
   return {data:c.toDataURL('image/png'),ratio:w/h};
  }catch(e){return null;}
 }

 window.generateProposalPDF=function(){
  if(!quoteItems.length){alert('Adicione algum cálculo.');return;}
  if(!window.jspdf?.jsPDF){alert('O módulo PDF não está disponível. Atualize a página após a instalação da V8.3.');return;}
  const {jsPDF}=window.jspdf,doc=new jsPDF({orientation:'p',unit:'mm',format:'a4',compress:true,putOnlyUsedFonts:true}),client=cleanText($('#quoteClient')?.value)||'Não informado',consult=cleanText($('#quoteConsultant')?.value)||'Não informado',note=cleanText($('#paymentNote')?.value),c=commercialLines(),pageW=210,margin=14,contentW=182;let y=14;
  const green=[8,117,72],dark=[23,53,42],muted=[93,112,103],light=[242,248,245],ensure=(n=18)=>{if(y+n>282){doc.addPage();y=15;}},txt=(text,x,yy,size=9,style='normal',color=dark,maxW,align)=>{doc.setFont('helvetica',style);doc.setFontSize(size);doc.setTextColor(...color);const opt={};if(maxW)opt.maxWidth=maxW;if(align)opt.align=align;doc.text(String(text??''),x,yy,opt);},line=yy=>{doc.setDrawColor(220,231,225);doc.line(margin,yy,pageW-margin,yy);};
  const logo=logoForPdf();let logoW=36,logoH=26;if(logo){logoH=logoW/logo.ratio;if(logoH>30){logoH=30;logoW=logoH*logo.ratio;}try{doc.addImage(logo.data,'PNG',margin,y,logoW,logoH,undefined,'FAST');}catch(e){}}
  txt('PROPOSTA / RESUMO DE MATERIAIS',58,y+7,16,'bold',green);txt('Calculadora Técnica IMPERTUDO • V8.3',58,y+14,9,'normal',muted);txt(`Emitido em ${new Date().toLocaleString('pt-BR')}`,58,y+20,8,'normal',muted);y+=Math.max(34,logoH+6);line(y);y+=7;
  txt('Cliente / obra',margin,y,7,'bold',muted);txt(client,margin,y+5,10,'bold',dark,85);txt('Responsável / consultor',112,y,7,'bold',muted);txt(consult,112,y+5,10,'bold',dark,82);y+=13;
  quoteItems.forEach((it,i)=>{normalizeQuoteItem(it);ensure(34);doc.setFillColor(...light);doc.roundedRect(margin,y,contentW,8,2,2,'F');txt(`${i+1}. ${it.title}`,margin+3,y+5.2,10,'bold',dark,125);y+=11;const cols=[['Qtd.',String(it.priceQty||0)],['Unidade',it.priceUnitLabel||'un.'],['Preço unit.',money(it.unitPrice||0)],['Desconto',discountText(it)],['Total',money(itemSubtotal(it))]],widths=[20,48,35,39,40];let x=margin;cols.forEach((col,idx)=>{doc.setDrawColor(222,233,227);doc.rect(x,y,widths[idx],14);txt(col[0],x+2,y+4,6.3,'bold',muted);txt(col[1],x+2,y+10,8,'bold',idx===4?green:dark,widths[idx]-4);x+=widths[idx];});y+=20;});
  ensure(60);line(y);y+=7;txt('CONDIÇÕES COMERCIAIS',margin,y,11,'bold',green);y+=7;
  [['Total de tabela',c.gross],['Descontos dos itens',c.itemDiscount],['Base após itens',c.base],['Desconto adicional à vista',c.cashDiscount],['PIX / Dinheiro',c.cash],['Cartão',c.card]].forEach((row,idx)=>{ensure(8);if(idx===4){doc.setFillColor(...green);doc.roundedRect(margin,y-4,contentW,8,1.5,1.5,'F');txt(row[0],margin+3,y,8,'bold',[255,255,255]);txt(money(row[1]),pageW-margin-3,y,10,'bold',[255,255,255],null,'right');}else{txt(row[0],margin,y,8,'normal',muted);txt(money(row[1]),pageW-margin,y,9,'bold',dark,null,'right');line(y+2.5);}y+=8;});
  y+=2;txt(`Forma selecionada: ${paymentLabel()} — ${money(c.selected)}`,margin,y,9,'bold',green);if(note){y+=7;const lines=doc.splitTextToSize(`Observação: ${note}`,contentW);doc.setFont('helvetica','normal');doc.setFontSize(8);doc.setTextColor(...muted);doc.text(lines,margin,y);}
  const safe=client.normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/gi,'-').replace(/^-|-$/g,'').toLowerCase();doc.save(`impertudo-proposta-${safe||'materiais'}.pdf`);
 };

 // Migra automaticamente propostas salvas da V8.2 sem duplicar desconto.
 try{quoteItems=quoteItems.map(normalizeQuoteItem);localStorage.setItem('impertudo_quote_v8',JSON.stringify(quoteItems));renderQuote();}catch(e){console.warn('Migração comercial V8.3',e);}
})();
