function calcProduct(){
 const p=products[selectedIndex], r=$('#pResult'); r.classList.remove('hidden'); let html='';
 const waste=1+num('pWaste')/100;
 if(p.calc==='guided_range'){
  const area=productAreaWithLoss(), rows=numericConsumptionRows(p), idx=parseInt($('#guidedApp')?.value||0), row=rows[idx], mult=consumptionMultiplier();
  if(!row){html='<div class="note">Consumo técnico não cadastrado para esta opção.</div>';}
  else{const minQty=area*row.min*mult,maxQty=area*row.max*mult;html=resultBox([[fmt(productAreaRaw())+' m²','Área geométrica'],[fmt(area)+' m²','Área com perdas'],[(row.min===row.max?fmt(row.max,2):fmt(row.min,2)+' a '+fmt(row.max,2))+' '+row.unit+'/m²','Consumo'],[(minQty===maxQty?fmt(maxQty):fmt(minQty)+' a '+fmt(maxQty))+' '+row.unit,'Quantidade técnica']],`Base de consumo: ${consumptionBasisLabel()}. Para a compra, é usado o maior valor da faixa.`)+packageAlternatives(p,maxQty,row.unit,0);}
 }
 if(p.calc==='top_conditions'){
  const area=productAreaWithLoss(),parts=$('#topCondition').value.split('|'),minC=parseFloat(parts[0]),maxC=parseFloat(parts[1]),coats=parts[2],pack=num('pPack')||18,mult=consumptionMultiplier(),minKg=area*minC*mult,maxKg=area*maxC*mult;
  html=resultBox([[fmt(area)+' m²','Área com margem'],[minC===maxC?fmt(maxC,1)+' kg/m²':fmt(minC,1)+' a '+fmt(maxC,1)+' kg/m²','Consumo selecionado'],[minC===maxC?fmt(maxKg)+' kg':fmt(minKg)+' a '+fmt(maxKg)+' kg','Quantidade técnica'],[coats+' demãos','Aplicação']],'Para compra, a calculadora utiliza o limite superior do consumo.')+packageAlternatives(p,maxKg,'kg',pack);
 }
 if(p.calc==='usage_select'){
  const area=productAreaWithLoss(),cons=parseFloat($('#usageCons').value),pack=num('pPack')||18,mult=consumptionMultiplier(),kg=area*cons*mult;
  html=resultBox([[fmt(area)+' m²','Área com margem'],[fmt(cons,2)+' kg/m²','Consumo selecionado'],[fmt(kg)+' kg','Quantidade técnica'],['Embalagem inteira','Compra']])+packageAlternatives(p,kg,'kg',pack);
 }
 if(p.calc==='yield_range'){
  const area=productAreaWithLoss(),vals=$('#yieldUse').value.split('|').map(Number),minYield=vals[0],maxYield=vals[1],pack=num('yieldPack')||1,mult=consumptionMultiplier(),litersMin=(area/maxYield)*mult,litersMax=(area/minYield)*mult;
  html=resultBox([[fmt(area)+' m²','Área com margem'],[fmt(minYield,0)+' a '+fmt(maxYield,0)+' m²/L','Rendimento'],[fmt(litersMin)+' a '+fmt(litersMax)+' L','Quantidade estimada'],[exactCommercialCeil(litersMax,pack)+' un.','Compra pela condição mais absorvente']],'Quanto mais porosa a superfície, menor o rendimento. Para compra, foi usado o maior consumo de produto.')+packageAlternatives(p,litersMax,'L',pack);
 }
 if(p.calc==='pro_laje'){
  const mode=$('#proMode').value,pack=parseFloat($('#proPack').value)||4.3;
  if(mode==='area'){const area=productAreaWithLoss(),kg=area*3.5*consumptionMultiplier();html=resultBox([[fmt(area)+' m²','Área com margem'],['3,5 kg/m²','Consumo mínimo'],[fmt(kg)+' kg','Quantidade técnica'],[exactCommercialCeil(kg,pack)+' un.','Embalagens']])+packageAlternatives(p,kg,'kg',pack);}
  else{const m=num('proJointM')*(1+num('proJointWaste')/100),kg=m*0.143;html=resultBox([[fmt(m)+' m','Junta com margem'],['143 g/m','Junta 1 × 1 cm'],[fmt(kg)+' kg','Quantidade técnica'],[exactCommercialCeil(kg,pack)+' un.','Embalagens']],'Para outra dimensão de junta, utilizar o cálculo geométrico específico do selante.')+packageAlternatives(p,kg,'kg',pack);}
 }
 if(['area','area_manual'].includes(p.calc)){
  const area=productAreaWithLoss(),cons=num('pCons'),pack=num('pPack'),mult=consumptionMultiplier(),qty=area*cons*mult,unit=inferProductUnit(p);
  html=resultBox([[fmt(area)+' m²','Área com margem'],[cons?fmt(cons,2)+' '+unit+'/m²':'—','Consumo por m²'],[cons?fmt(qty)+' '+unit:'Informe consumo','Quantidade técnica'],[cons?'Compra em embalagem inteira':'—','Resultado comercial']],`Geometria: ${fmt(productAreaRaw())} m². Base de consumo: ${consumptionBasisLabel()}. A compra é arredondada para a próxima embalagem comercial inteira.`)+(cons?packageAlternatives(p,qty,unit,pack):'');
 }
 if(p.calc==='area_range'){
  const area=productAreaWithLoss(),mult=consumptionMultiplier(),min=num('pMin')*area*mult,max=num('pMax')*area*mult,pack=num('pPack');
  html=resultBox([[fmt(area)+' m²','Área com margem'],[fmt(min)+' kg','Quantidade mínima'],[fmt(max)+' kg','Quantidade máxima'],['Faixa superior','Base para compra']],'Para evitar falta de material, a conversão em embalagens abaixo usa a faixa superior de consumo.')+packageAlternatives(p,max,'kg',pack);
 }
 if(p.calc==='topflex'){
  const area=productAreaWithLoss(),cons=parseFloat($('#pApp').value),mult=consumptionMultiplier(),kg=area*cons*mult,pack=num('pPack'),neg=$('#pNegative').checked;
  html=resultBox([[fmt(area)+' m²','Área com margem'],[fmt(cons,1)+' kg/m²','Consumo selecionado'],[fmt(kg)+' kg','Quantidade técnica'],['Embalagem inteira','Compra']],neg?`Estrutura enterrada/pressão negativa marcada: considerar também IMPERTUDO TOP a 2,0 kg/m² como barreira inicial. Quantidade técnica adicional: <b>${fmt(area*2)} kg</b> de TOP.`:'')+packageAlternatives(p,kg,'kg',pack);
  if(neg){const topP=products.find(x=>x.name==='IMPERTUDO TOP')||{name:'IMPERTUDO TOP',cat:'Impermeabilizantes cimentícios',pack:'18 kg'};html+=`<div class="pack-title">Barreira de pressão negativa — IMPERTUDO TOP</div>`+packageAlternatives(topP,area*2,'kg',18);}
 }
 if(['roll','roll_manual'].includes(p.calc)){
  const area=productAreaWithLoss(),ra=num('pRoll'),rolls=ra?exactCommercialCeil(area,ra):0;
  html=resultBox([[fmt(area)+' m²','Área com margem'],[ra?fmt(ra)+' m²':'—','Área nominal por rolo'],[ra?rolls+' rolos':'Informe rendimento','Quantidade para compra'],[fmt((waste-1)*100,0)+'%','Margem aplicada']],'Rolos são sempre arredondados para cima. Sobreposições e recortes dependem da paginação.');
 }
 if(p.calc==='joint'){
  const L=num('jL'),W=num('jW'),D=num('jD'),passes=Math.max(1,num('jPasses')||1),vol=L*W*D*passes*waste,mode=$('#jPackMode')?.value||'volume';
  if(mode==='volume'){const pack=num('jPackMl')||300,units=exactCommercialCeil(vol,pack),purchased=units*pack;html=resultBox([[fmt(L)+' m','Comprimento'],[fmt(W,1)+' × '+fmt(D,1)+' mm','Seção da junta'],[fmt(vol,0)+' mL','Volume com perdas'],[units+' un. de '+fmt(pack,0)+' mL','Embalagens']],'Cálculo direto por volume; não necessita densidade.')+`<div class="purchase-summary"><strong>${units} embalagens de ${fmt(pack,0)} mL</strong><span>Compra total: ${fmt(purchased,0)} mL • sobra estimada: ${fmt(purchased-vol,0)} mL</span></div>`;}
  else{const density=num('jDensity'),pack=num('jPackG')||400,mass=vol*density,units=density?exactCommercialCeil(mass,pack):0;html=resultBox([[fmt(L)+' m','Comprimento'],[fmt(W,1)+' × '+fmt(D,1)+' mm','Seção da junta'],[fmt(vol,0)+' mL','Volume com perdas'],[density?units+' un. de '+fmt(pack,0)+' g':'Informe densidade','Embalagens']],'Para compra por peso, informe a densidade da ficha técnica.')+(density?`<div class="purchase-summary"><strong>${units} embalagens de ${fmt(pack,0)} g</strong><span>Massa necessária: ${fmt(mass,0)} g • compra total: ${fmt(units*pack,0)} g</span></div>`:'');}
 }
 if(p.calc==='joint_manual'||p.calc==='linear_manual'){
  const q=num('linM')*waste,y=num('linYield');html=resultBox([[fmt(q)+' m','Metragem com margem'],[y?fmt(y)+' m':'—','Rendimento por embalagem/rolo'],[y?exactCommercialCeil(q,y)+' un.':'Informe rendimento','Quantidade para compra'],[fmt((waste-1)*100,0)+'%','Margem']],'A quantidade de rolos/unidades é arredondada para cima.');
 }
 if(p.calc==='linear_or_area_manual'){
  const q=num('laQty')*waste,y=num('laYield'),u=$('#laMode').value==='linear'?'m':'m²';html=resultBox([[fmt(q)+' '+u,'Necessidade com margem'],[y?fmt(y)+' '+u:'—','Rendimento por rolo'],[y?exactCommercialCeil(q,y)+' rolos':'Informe rendimento','Quantidade para compra'],[fmt((waste-1)*100,0)+'%','Margem']],'A quantidade de rolos é arredondada para cima.');
 }
 if(p.calc==='volume_manual'){
  const v=num('vL')*num('vW')*(num('vD')/1000),cons=num('vCons'),kg=v*cons*waste,pack=num('pPack');html=resultBox([[fmt(v,4)+' m³','Volume do reparo'],[fmt(v*1000,1)+' L','Volume equivalente'],[cons?fmt(kg)+' kg':'Informe rendimento','Quantidade técnica'],[cons?'Embalagem inteira':'—','Compra']])+(cons?packageAlternatives(p,kg,'kg',pack):'');
 }
 if(p.calc==='concrete_dose'){
  const v=num('cVol'),d=num('cDose'),q=v*d,pack=num('pPack');html=resultBox([[fmt(v)+' m³','Concreto'],[d?fmt(d)+' kg/m³':'—','Dosagem'],[d?fmt(q)+' kg':'Informe dosagem','Quantidade técnica'],[d?'Embalagem inteira':'—','Compra']])+(d?packageAlternatives(p,q,'kg',pack):'');
 }
 if(p.calc==='cement_percent'){
  const v=num('cVol'),cm=num('cementM3'),pct=num('cPct'),cement=v*cm,q=cement*pct/100,pack=num('pPack');html=resultBox([[fmt(cement)+' kg','Cimento total'],[pct?fmt(pct,2)+'%':'—','Dosagem'],[pct?fmt(q)+' kg':'Informe %','Quantidade técnica'],[pct?'Embalagem inteira':'—','Compra']])+(pct?packageAlternatives(p,q,'kg',pack):'');
 }
 if(p.calc==='cement_dose'){
  const bags=num('bags'),dose=num('doseBag'),q=bags*dose,pack=num('pPack');html=resultBox([[fmt(bags,0)+' sacos','Cimento 50 kg'],[dose?fmt(dose):'—','Dose por saco'],[dose?fmt(q):'Informe dose','Produto total'],[dose&&pack?exactCommercialCeil(q,pack)+' embalagens':'—','Compra']],'Use a mesma unidade para “dosagem por saco” e “conteúdo da embalagem”. O número de embalagens é arredondado para cima.');
 }
 if(p.calc==='dilution'){
  const prod=num('dProd'),a=num('dA'),b=num('dB'),mix=prod*(a+b)/a,cons=num('dCons');html=resultBox([[fmt(prod)+' L','Concentrado'],[`${fmt(a,0)}:${fmt(b,0)}`,'Diluição produto:água'],[fmt(mix)+' L','Mistura pronta'],[cons?fmt(mix/cons)+' m²':'—','Área estimada']],'A área só é calculada quando o consumo da mistura pronta é informado.');
 }
 if(p.calc==='manual'){
  const q=num('mQty'),c=num('mCons'),tot=q*c,pack=num('pPack');html=resultBox([[fmt(q),'Quantidade da obra'],[c?fmt(c):'—','Consumo unitário'],[c?fmt(tot):'Informe consumo','Quantidade técnica'],[c&&pack?exactCommercialCeil(tot,pack)+' embalagens':'—','Compra']],'A embalagem é sempre arredondada para cima.');
 }
 r.innerHTML=html+`<div class="actions summary-actions"><button class="btn secondary" onclick="addResultToQuote('product')">Adicionar ao resumo / proposta</button></div>`;
}
function calcReservoir(){
 const sh=$('#resShape').value,ceil=$('#resCeiling').checked,waste=1+num('resWaste')/100;let area=0,vol=0;
 if(sh==='ret'){const L=num('rL'),W=num('rW'),H=num('rH'),floor=L*W;area=floor+2*L*H+2*W*H+(ceil?floor:0);vol=L*W*H;}else{const D=num('rD'),H=num('rH'),r=D/2,floor=Math.PI*r*r;area=floor+Math.PI*D*H+(ceil?floor:0);vol=floor*H;}
 const buy=area*waste,buried=$('#resCond').value==='enterrado',prod=$('#resProduct').value;let extra='';
 if(prod==='topflex'){
  const kg=buy*4.5,topFlexP=products.find(x=>x.name==='IMPERTUDO TOP FLEX FIBRAS')||{name:'IMPERTUDO TOP FLEX FIBRAS',cat:'Impermeabilizantes cimentícios',pack:'18 kg'},topP=products.find(x=>x.name==='IMPERTUDO TOP')||{name:'IMPERTUDO TOP',cat:'Impermeabilizantes cimentícios',pack:'18 kg'};
  extra=`<div class="table-wrap"><table class="table"><tr><th>Produto</th><th>Consumo</th><th>Quantidade técnica</th></tr>${buried?`<tr><td>IMPERTUDO TOP</td><td>2,0 kg/m²</td><td>${fmt(buy*2)} kg</td></tr>`:''}<tr><td>IMPERTUDO TOP FLEX FIBRAS</td><td>4,5 kg/m²</td><td>${fmt(kg)} kg</td></tr></table></div>`;
  if(buried)extra+=`<div class="pack-title">IMPERTUDO TOP — compra</div>`+packageAlternatives(topP,buy*2,'kg',18);extra+=`<div class="pack-title">TOP FLEX FIBRAS — compra</div>`+packageAlternatives(topFlexP,kg,'kg',18);
 }else if(prod==='top'){
  const topP=products.find(x=>x.name==='IMPERTUDO TOP')||{name:'IMPERTUDO TOP',cat:'Impermeabilizantes cimentícios',pack:'18 kg'},minCons=buried?4:3,maxCons=5,minKg=buy*minCons,maxKg=buy*maxCons;
  extra=`<div class="table-wrap"><table class="table"><tr><th>Produto</th><th>Consumo</th><th>Quantidade técnica</th></tr><tr><td>IMPERTUDO TOP</td><td>${fmt(minCons,1)} a ${fmt(maxCons,1)} kg/m²</td><td>${fmt(minKg)} a ${fmt(maxKg)} kg</td></tr></table></div>`+`<div class="pack-title">IMPERTUDO TOP — compra</div>`+packageAlternatives(topP,maxKg,'kg',18)+`<div class="note">${buried?'Estrutura enterrada: considerada pressão negativa até 10 m.c.a.':'Estrutura elevada/apoiada: considerada pressão positiva até 25 m.c.a.'} A compra usa o limite superior do consumo.</div>`;
 }else extra=`<div class="info">Área calculada. Escolha “Calcular por produto” e informe o consumo do sistema desejado.</div>`;
 $('#resResult').classList.remove('hidden');$('#resResult').innerHTML=resultBox([[fmt(area)+' m²','Área interna'],[fmt(buy)+' m²','Área com margem'],[fmt(vol)+' m³','Volume'],[fmt(vol*1000,0)+' L','Capacidade']])+extra+(buried&&prod==='topflex'?`<div class="note">Reservatório enterrado: no sistema TOP FLEX FIBRAS, considerar barreira inicial de IMPERTUDO TOP a 2,0 kg/m² para pressão negativa.</div>`:'');$('#resAddBtn')?.classList.remove('hidden');
}
