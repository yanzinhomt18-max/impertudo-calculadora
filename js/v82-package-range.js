/* V8.2 — faixa mínima e máxima de embalagens */
function rangePackData(p,minTotal,maxTotal,totalUnit='kg',manualPack=0){
 if(!(maxTotal>0))return [];
 let packs=parsePackageSizes(p);
 if(!packs.length&&manualPack>0)packs=[{size:manualPack,unit:totalUnit}];
 return packs.map(pk=>{
  const converted=convertPackSize(pk.size,pk.unit,totalUnit);
  if(!converted)return null;
  const minCount=exactCommercialCeil(Math.max(0,minTotal),converted);
  const maxCount=exactCommercialCeil(maxTotal,converted);
  const noun=packageWord(p,pk.size,pk.unit);
  return {pk,converted,minCount,maxCount,noun};
 }).filter(Boolean);
}
function rangePackageHTML(p,minTotal,maxTotal,totalUnit='kg',manualPack=0){
 const rows=rangePackData(p,minTotal,maxTotal,totalUnit,manualPack);
 if(!rows.length||Math.abs(maxTotal-minTotal)<1e-9)return '';
 const cards=rows.map(({pk,minCount,maxCount,noun})=>{
  const unitLabel=pk.unit==='L'?'L':pk.unit;
  const same=minCount===maxCount;
  return `<div class="range-pack-card"><div class="range-pack-label">${fmt(pk.size,pk.size%1?1:0)} ${unitLabel} por ${packageWord(p,pk.size,pk.unit)}</div><div class="range-pack-values"><span><small>MÍNIMO</small><b>${minCount} ${pluralPackage(noun,minCount)}</b></span><span class="recommended"><small>MÁXIMO / COMPRA</small><b>${maxCount} ${pluralPackage(noun,maxCount)}</b></span></div><div class="range-pack-foot">${same?'A faixa de consumo resulta na mesma quantidade comercial.':`Variação comercial: ${maxCount-minCount} ${pluralPackage(noun,maxCount-minCount)}.`}</div></div>`;
 }).join('');
 return `<div class="best-combo package-range-summary"><div class="range-title"><b>Faixa de embalagens</b><span>mínimo técnico × máximo recomendado</span></div><div class="range-pack-grid">${cards}</div><div class="formula-line">O cenário <b>mínimo</b> usa o menor consumo técnico. O cenário <b>máximo</b> usa o maior consumo da faixa e é a referência recomendada para compra, reduzindo o risco de falta de material.</div></div>`;
}
function appendRangePackageSummary(){
 const r=$('#pResult');
 if(!r||r.classList.contains('hidden'))return;
 r.querySelectorAll('.package-range-summary').forEach(x=>x.remove());
 const p=products[selectedIndex];
 if(!p)return;
 let min=0,max=0,unit='kg',pack=0;
 try{
  if(p.calc==='guided_range'){
   const rows=numericConsumptionRows(p),idx=parseInt($('#guidedApp')?.value||0),row=rows[idx],area=productAreaWithLoss(),mult=consumptionMultiplier();
   if(row){min=area*row.min*mult;max=area*row.max*mult;unit=row.unit;}
  }else if(p.calc==='top_conditions'){
   const area=productAreaWithLoss(),parts=$('#topCondition').value.split('|'),mult=consumptionMultiplier();min=area*parseFloat(parts[0])*mult;max=area*parseFloat(parts[1])*mult;unit='kg';pack=num('pPack')||18;
  }else if(p.calc==='yield_range'){
   const area=productAreaWithLoss(),vals=$('#yieldUse').value.split('|').map(Number),mult=consumptionMultiplier();min=(area/vals[1])*mult;max=(area/vals[0])*mult;unit='L';pack=num('yieldPack')||1;
  }else if(p.calc==='area_range'){
   const area=productAreaWithLoss(),mult=consumptionMultiplier();min=num('pMin')*area*mult;max=num('pMax')*area*mult;unit='kg';pack=num('pPack');
  }
  const html=rangePackageHTML(p,min,max,unit,pack);
  if(html){const actions=r.querySelector('.summary-actions');if(actions)actions.insertAdjacentHTML('beforebegin',html);else r.insertAdjacentHTML('beforeend',html);}
 }catch(e){console.warn('Faixa de embalagens',e);}
}
(function wireRangePackages(){
 if(typeof calcProduct==='function'&&!window.__calcProductBeforePackRange){
  window.__calcProductBeforePackRange=calcProduct;
  calcProduct=function(...args){const out=window.__calcProductBeforePackRange(...args);appendRangePackageSummary();return out;};
 }
 if(typeof calcReservoir==='function'&&!window.__calcReservoirBeforePackRange){
  window.__calcReservoirBeforePackRange=calcReservoir;
  calcReservoir=function(...args){
   const out=window.__calcReservoirBeforePackRange(...args),r=$('#resResult');
   if(!r||r.classList.contains('hidden'))return out;
   r.querySelectorAll('.package-range-summary').forEach(x=>x.remove());
   try{
    if($('#resProduct')?.value==='top'){
     const sh=$('#resShape').value,ceil=$('#resCeiling').checked,waste=1+num('resWaste')/100;let area=0;
     if(sh==='ret'){const L=num('rL'),W=num('rW'),H=num('rH'),floor=L*W;area=floor+2*L*H+2*W*H+(ceil?floor:0);}else{const D=num('rD'),H=num('rH'),rr=D/2,floor=Math.PI*rr*rr;area=floor+Math.PI*D*H+(ceil?floor:0);}
     const buy=area*waste,buried=$('#resCond').value==='enterrado',minCons=buried?4:3,maxCons=5,p=products.find(x=>x.name==='IMPERTUDO TOP')||{name:'IMPERTUDO TOP',cat:'Impermeabilizantes cimentícios',pack:'18 kg'};
     const html=rangePackageHTML(p,buy*minCons,buy*maxCons,'kg',18);if(html)r.insertAdjacentHTML('beforeend',html);
    }
   }catch(e){console.warn('Faixa reservatório',e);}
   return out;
  };
 }
})();