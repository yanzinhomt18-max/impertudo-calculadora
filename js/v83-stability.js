/* IMPERTUDO V8.3 — estabilidade técnica e validações */
(function(){
 const areaCalcs=new Set(['guided_range','top_conditions','usage_select','yield_range','area','area_manual','area_range','topflex','roll','roll_manual']);

 function techBasisConfig(p){
  const tech=p?.tech||null;
  const text=JSON.stringify(tech||{});
  const perCoat=p?.name==='IMPERTUDO PRIMER'||/por demão|\/demão|por demao/i.test(text);
  return {confirmed:tech?.status==='confirmed',basis:perCoat?'perCoat':'system'};
 }

 window.commonAreaFields=function(area=''){
  const current=products[selectedIndex]||{};
  const cfg=techBasisConfig(current);
  let coatHTML='';
  if(cfg.confirmed&&cfg.basis==='perCoat'){
   coatHTML=`<div class="coat-config locked-basis"><input id="pConsBasis" type="hidden" value="perCoat"><div class="field"><label>Número de demãos / camadas</label><input id="pCoats" type="number" value="1" min="1" step="1"></div><div class="basis-lock"><b>Consumo por demão</b><span>Definido automaticamente pela ficha técnica cadastrada.</span></div></div>`;
  }else if(cfg.confirmed){
   coatHTML=`<input id="pCoats" type="hidden" value="1"><input id="pConsBasis" type="hidden" value="system"><div class="basis-lock system"><b>Consumo total do sistema</b><span>A quantidade de demãos informada na ficha já está contemplada no consumo técnico.</span></div>`;
  }else{
   coatHTML=`<div class="grid2 coat-config"><div class="field"><label>Número de demãos / camadas</label><input id="pCoats" type="number" value="1" min="1" step="1"></div><div class="field"><label>O consumo informado representa</label><select id="pConsBasis"><option value="system" selected>Consumo total do sistema</option><option value="perCoat">Consumo por demão</option></select></div></div>`;
  }
  return `<div class="parametric-area-box">
   <div class="parametric-area-head"><div><b>1. Geometria da aplicação</b><span>Informe a área diretamente ou deixe a calculadora obter a metragem.</span></div><span class="param-badge">m²</span></div>
   <div class="grid2">
    <div class="field"><label>Forma de calcular a área</label><select id="pAreaMode" onchange="renderProductAreaFields()"><option value="direct">m² direto</option><option value="rectangle">Retângulo — comprimento × largura</option><option value="perimeter">Perímetro × altura de rodapé / viga</option></select></div>
    <div class="field"><label>Perda / margem adicional (%)</label><input id="pWaste" type="number" value="5" min="0" max="100" step="0.1"></div>
    <div id="pAreaDynamic" class="field full"></div>
   </div>
   ${coatHTML}
   <input id="pAreaSeed" type="hidden" value="${area||lastArea||''}">
  </div>`;
 };

 function showError(target,msg){
  const r=$(target);if(!r)return false;r.classList.remove('hidden');r.innerHTML=`<div class="validation-error"><b>Revise os dados informados</b><span>${msg}</span></div>`;return false;
 }
 function nonNegative(id){return num(id)>=0;}
 function productAreaValid(){return !$('#pAreaMode')||productAreaRaw()>0;}

 const previousRender=window.renderProduct;
 window.renderProduct=function(...args){
  const out=previousRender(...args);
  try{
   if($('#pAreaDynamic'))renderProductAreaFields();
   // guided_range tinha um segundo controle de demãos; V8.3 usa apenas o controle da geometria.
   const duplicate=$('#guidedCoats');
   if(duplicate){const field=duplicate.closest('.field');if(field)field.remove();}
   const choice=$('#guidedApp')?.closest('.grid2');if(choice&&choice.children.length===1)choice.classList.add('single-choice');
  }catch(e){console.warn('V8.3 render',e);}
  return out;
 };

 const previousCalcProduct=window.calcProduct;
 window.calcProduct=function(...args){
  const p=products[selectedIndex];
  if(!p)return showError('#pResult','Produto não encontrado no catálogo local.');
  if(areaCalcs.has(p.calc)&&!productAreaValid())return showError('#pResult','Informe uma área maior que zero.');
  if($('#pWaste')&&!nonNegative('pWaste'))return showError('#pResult','A margem de perda não pode ser negativa.');
  if(p.calc==='area_range'&&num('pMin')>num('pMax'))return showError('#pResult','O consumo mínimo não pode ser maior que o consumo máximo.');
  if(p.calc==='joint'&&(num('jL')<=0||num('jW')<=0||num('jD')<=0))return showError('#pResult','Comprimento, largura e profundidade da junta devem ser maiores que zero.');
  if(p.calc==='dilution'&&num('dA')<=0)return showError('#pResult','“Partes de produto” deve ser maior que zero para calcular a diluição.');
  if(p.calc==='dilution'&&num('dProd')<=0)return showError('#pResult','Informe uma quantidade de produto concentrado maior que zero.');

  // Corrige a composição TOP FLEX + TOP quando a estrutura está marcada como enterrada/pressão negativa.
  if(p.calc==='topflex'&&$('#pNegative')?.checked){
   const box=$('#pNegative');box.checked=false;
   const out=previousCalcProduct(...args);
   box.checked=true;
   const r=$('#pResult'),area=productAreaWithLoss();
   if(r&&area>0){
    const top=products.find(x=>x.name==='IMPERTUDO TOP')||{name:'IMPERTUDO TOP',cat:'Impermeabilizantes cimentícios',pack:'18 kg'};
    const minKg=area*4,maxKg=area*5;
    const block=`<div class="system-complement"><div class="system-complement-head"><b>Complemento para pressão negativa</b><span>IMPERTUDO TOP</span></div><div class="table-wrap"><table class="table"><tr><th>Condição</th><th>Consumo</th><th>Quantidade técnica</th></tr><tr><td>Pressão negativa até 10 m.c.a.</td><td>4,0 a 5,0 kg/m²</td><td>${fmt(minKg)} a ${fmt(maxKg)} kg</td></tr></table></div>${rangePackageHTML(top,minKg,maxKg,'kg',18)}<div class="note">A V8.3 deixou de usar 2,0 kg/m² nessa condição. Para pressão negativa, o cálculo segue a faixa cadastrada de 4,0 a 5,0 kg/m² do IMPERTUDO TOP.</div></div>`;
    const actions=r.querySelector('.summary-actions');if(actions)actions.insertAdjacentHTML('beforebegin',block);else r.insertAdjacentHTML('beforeend',block);
   }
   return out;
  }
  return previousCalcProduct(...args);
 };

 // Reservatórios: valida dimensões e aplica TOP 4–5 kg/m² quando houver pressão negativa.
 window.calcReservoir=function(){
  const sh=$('#resShape').value,ceil=$('#resCeiling').checked,wastePct=num('resWaste');
  if(wastePct<0)return showError('#resResult','A margem adicional não pode ser negativa.');
  let area=0,vol=0;
  if(sh==='ret'){
   const L=num('rL'),W=num('rW'),H=num('rH');if(L<=0||W<=0||H<=0)return showError('#resResult','Comprimento, largura e altura do reservatório devem ser maiores que zero.');
   const floor=L*W;area=floor+2*L*H+2*W*H+(ceil?floor:0);vol=L*W*H;
  }else{
   const D=num('rD'),H=num('rH');if(D<=0||H<=0)return showError('#resResult','Diâmetro e altura do reservatório devem ser maiores que zero.');
   const r=D/2,floor=Math.PI*r*r;area=floor+Math.PI*D*H+(ceil?floor:0);vol=floor*H;
  }
  const buy=area*(1+wastePct/100),buried=$('#resCond').value==='enterrado',prod=$('#resProduct').value;let extra='';
  if(prod==='topflex'){
   const flex=products.find(x=>x.name==='IMPERTUDO TOP FLEX FIBRAS')||{name:'IMPERTUDO TOP FLEX FIBRAS',cat:'Impermeabilizantes cimentícios',pack:'18 kg'};
   const top=products.find(x=>x.name==='IMPERTUDO TOP')||{name:'IMPERTUDO TOP',cat:'Impermeabilizantes cimentícios',pack:'18 kg'};
   const flexKg=buy*4.5;
   extra=`<div class="table-wrap"><table class="table"><tr><th>Produto</th><th>Consumo</th><th>Quantidade técnica</th></tr>${buried?`<tr><td>IMPERTUDO TOP</td><td>4,0 a 5,0 kg/m²</td><td>${fmt(buy*4)} a ${fmt(buy*5)} kg</td></tr>`:''}<tr><td>IMPERTUDO TOP FLEX FIBRAS</td><td>4,5 kg/m²</td><td>${fmt(flexKg)} kg</td></tr></table></div>`;
   if(buried)extra+=`<div class="pack-title">IMPERTUDO TOP — pressão negativa</div>${rangePackageHTML(top,buy*4,buy*5,'kg',18)}${packageAlternatives(top,buy*5,'kg',18)}`;
   extra+=`<div class="pack-title">TOP FLEX FIBRAS — compra</div>${packageAlternatives(flex,flexKg,'kg',18)}`;
  }else if(prod==='top'){
   const top=products.find(x=>x.name==='IMPERTUDO TOP')||{name:'IMPERTUDO TOP',cat:'Impermeabilizantes cimentícios',pack:'18 kg'};
   const minCons=buried?4:3,maxCons=5,minKg=buy*minCons,maxKg=buy*maxCons;
   extra=`<div class="table-wrap"><table class="table"><tr><th>Produto</th><th>Consumo</th><th>Quantidade técnica</th></tr><tr><td>IMPERTUDO TOP</td><td>${fmt(minCons,1)} a ${fmt(maxCons,1)} kg/m²</td><td>${fmt(minKg)} a ${fmt(maxKg)} kg</td></tr></table></div>${rangePackageHTML(top,minKg,maxKg,'kg',18)}${packageAlternatives(top,maxKg,'kg',18)}<div class="note">${buried?'Estrutura enterrada: faixa de pressão negativa até 10 m.c.a.':'Estrutura elevada/apoiada: faixa de pressão positiva até 25 m.c.a.'} O máximo é usado como referência de compra.</div>`;
  }else{
   extra='<div class="info">Área calculada. Para outro produto, use “Calcular por produto” e informe o consumo correspondente.</div>';
  }
  const r=$('#resResult');r.classList.remove('hidden');r.innerHTML=resultBox([[fmt(area)+' m²','Área interna'],[fmt(buy)+' m²','Área com margem'],[fmt(vol)+' m³','Volume'],[fmt(vol*1000,0)+' L','Capacidade']])+extra;$('#resAddBtn')?.classList.remove('hidden');
 };

 // Re-renderiza o produto atual já com as regras V8.3.
 try{window.renderProduct(selectedIndex,lastArea||'');}catch(e){console.warn('V8.3 refresh',e);}
})();
