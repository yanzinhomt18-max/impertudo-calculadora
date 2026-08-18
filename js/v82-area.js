/* IMPERTUDO V8.2 overlay: cálculo paramétrico e arredondamento comercial */
function commonAreaFields(area=''){
 const current=products[selectedIndex]||{};
 const techText=JSON.stringify(getTech(current)||{});
 const defaultBasis=(current.name==='IMPERTUDO PRIMER'||/por demão|\/demão|por demao/i.test(techText))?'perCoat':'system';
 return `<div class="parametric-area-box">
  <div class="parametric-area-head"><div><b>Geometria da aplicação</b><span>Informe a área direta ou deixe a calculadora obter a metragem.</span></div><span class="param-badge">m²</span></div>
  <div class="grid2">
   <div class="field"><label>Forma de calcular a área</label><select id="pAreaMode" onchange="renderProductAreaFields()">
    <option value="direct">m² direto</option>
    <option value="rectangle">Retângulo — comprimento × largura</option>
    <option value="perimeter">Perímetro × altura de rodapé / viga</option>
   </select></div>
   <div class="field"><label>Perda / margem adicional (%)</label><input id="pWaste" type="number" value="5" min="0" step="0.1"></div>
   <div id="pAreaDynamic" class="field full"></div>
  </div>
  <div class="grid2 coat-config">
   <div class="field"><label>Número de demãos / camadas</label><input id="pCoats" type="number" value="1" min="1" step="1"></div>
   <div class="field"><label>O consumo informado representa</label><select id="pConsBasis">
    <option value="system" ${defaultBasis==='system'?'selected':''}>Consumo total do sistema</option>
    <option value="perCoat" ${defaultBasis==='perCoat'?'selected':''}>Consumo por demão</option>
   </select></div>
  </div>
  <input id="pAreaSeed" type="hidden" value="${area||lastArea||''}">
  <div class="param-note">Quando a ficha técnica já informa o consumo total para todas as demãos, mantenha <b>Consumo total do sistema</b>. Use “por demão” somente quando a ficha apresentar rendimento/consumo por camada.</div>
 </div>`;
}
function renderProductAreaFields(){
 const mode=$('#pAreaMode')?.value||'direct', box=$('#pAreaDynamic');if(!box)return;
 const seed=num('pAreaSeed')||lastArea||'';
 const f=(lab,id,val,extra='')=>`<div class="field"><label>${lab}</label><input id="${id}" type="number" min="0" step="0.01" value="${val??''}" ${extra}></div>`;
 if(mode==='direct') box.innerHTML=`<div class="grid1">${f('Área da aplicação (m²)','pAreaDirect',seed,'placeholder="Ex.: 120"')}</div>`;
 if(mode==='rectangle') box.innerHTML=`<div class="grid2">${f('Comprimento (m)','pAreaLength',5)}${f('Largura (m)','pAreaWidth',4)}</div>`;
 if(mode==='perimeter') box.innerHTML=`<div class="grid2">${f('Perímetro total (m)','pPerimeter',20)}${f('Altura do rodapé / viga (m)','pBandHeight',0.3)}</div>`;
}
function productAreaRaw(){
 const mode=$('#pAreaMode')?.value||'direct';
 if(mode==='rectangle') return num('pAreaLength')*num('pAreaWidth');
 if(mode==='perimeter') return num('pPerimeter')*num('pBandHeight');
 return num('pAreaDirect');
}
function productAreaWithLoss(){return productAreaRaw()*(1+num('pWaste')/100);}
function consumptionMultiplier(){return $('#pConsBasis')?.value==='perCoat'?Math.max(1,num('pCoats')||1):1;}
function consumptionBasisLabel(){return $('#pConsBasis')?.value==='perCoat'?`${Math.max(1,num('pCoats')||1)} demãos`:'consumo total do sistema';}
function exactCommercialCeil(required,pack){
 required=Number(required)||0;pack=Number(pack)||0;if(required<=0||pack<=0)return 0;
 const ratio=required/pack;
 const nearest=Math.round(ratio);
 if(Math.abs(ratio-nearest)<1e-9)return nearest;
 return Math.ceil(ratio-1e-12);
}
function optimizePackageCombination(p,total,totalUnit='kg'){
 const packs=parsePackageSizes(p).map(pk=>({...pk,converted:convertPackSize(pk.size,pk.unit,totalUnit)})).filter(pk=>pk.converted).sort((a,b)=>b.converted-a.converted);
 if(!packs.length || packs.length>4) return null;
 if(packs.length===1){const count=exactCommercialCeil(total,packs[0].converted);return {packs,counts:[count],sum:count*packs[0].converted,excess:count*packs[0].converted-total,score:(count*packs[0].converted-total)*1000+count};}
 let best=null;const counts=new Array(packs.length).fill(0);
 function evaluate(lastCount,sumBefore){counts[packs.length-1]=lastCount;const sum=sumBefore+lastCount*packs[packs.length-1].converted;if(sum+1e-9<total)return;const excess=sum-total,units=counts.reduce((a,b)=>a+b,0),score=excess*1000+units;if(!best||score<best.score)best={packs,counts:[...counts],sum,excess,score};}
 function walk(i,sum){if(i===packs.length-1){const rem=Math.max(0,total-sum),size=packs[i].converted,need=exactCommercialCeil(rem,size);for(let c=Math.max(0,need-1);c<=need+2;c++)evaluate(c,sum);return;}const size=packs[i].converted,max=exactCommercialCeil(total,size)+1;for(let c=0;c<=max;c++){counts[i]=c;const next=sum+c*size;if(next>total+(packs[packs.length-1].converted*2)&&c>0)break;walk(i+1,next);}}
 walk(0,0);return best;
}
function bestPackageHTML(p,total,totalUnit='kg'){const best=optimizePackageCombination(p,total,totalUnit);if(!best)return '';const parts=best.counts.map((c,i)=>c?`${c} × ${fmt(best.packs[i].size,best.packs[i].size%1?1:0)} ${best.packs[i].unit}`:'').filter(Boolean);if(!parts.length)return '';return `<div class="best-combo"><b>Combinação com menor sobra: ${parts.join(' + ')}</b><span>Compra total: ${fmt(best.sum,2)} ${totalUnit} • sobra estimada: ${fmt(best.excess,2)} ${totalUnit}</span></div>`;}
function packageAlternatives(p,total,totalUnit='kg',manualPack=0){
 if(!(total>0)) return '';
 let packs=parsePackageSizes(p);if(!packs.length&&manualPack>0)packs=[{size:manualPack,unit:totalUnit}];
 const compatible=packs.map(pk=>({...pk,converted:convertPackSize(pk.size,pk.unit,totalUnit)})).filter(pk=>pk.converted);
 if(!compatible.length)return `<div class="info">Quantidade técnica calculada. Para transformar em embalagens, informe o tamanho da embalagem ou use um produto com embalagem cadastrada.</div>`;
 const cards=compatible.map(pk=>{const count=exactCommercialCeil(total,pk.converted),purchased=count*pk.converted,leftover=Math.max(0,purchased-total),noun=packageWord(p,pk.size,pk.unit),unitLabel=pk.unit==='L'?'L':pk.unit;return `<div class="pack-card"><span class="pack-qtd">${count} ${pluralPackage(noun,count)}</span><span class="pack-name">${fmt(pk.size,pk.size%1?1:0)} ${unitLabel} cada</span><span class="pack-sub">Compra total: ${fmt(purchased,2)} ${totalUnit} • sobra estimada: ${fmt(leftover,2)} ${totalUnit}</span></div>`;}).join('');
 return `<div class="pack-title">Total de embalagens para compra</div><div class="pack-grid">${cards}</div>${bestPackageHTML(p,total,totalUnit)}<div class="formula-line">ARREDONDAR.PARA.CIMA(quantidade necessária ÷ embalagem). A calculadora não arredonda compra para baixo.</div>`;
}
