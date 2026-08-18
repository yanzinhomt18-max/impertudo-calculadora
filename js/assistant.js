function renderAssistantFields(){
 const type=$('#assistArea')?.value,box=$('#assistDynamic');if(!box)return;
 if(type==='reservatorio')box.innerHTML=`<label>Condição da estrutura</label><select id="assistCond"><option value="enterrado">Enterrado</option><option value="elevado">Elevado</option><option value="apoiado">Apoiado</option></select>`;
 else if(type==='laje')box.innerHTML=`<label>Condição de uso</label><select id="assistCond"><option value="exposta">Exposta, sem tráfego</option><option value="protegida">Com proteção/acabamento</option></select>`;
 else if(type==='parede')box.innerHTML=`<label>Objetivo</label><select id="assistCond"><option value="impermeabilizar">Impermeabilizar</option><option value="selar">Selar / preparar</option><option value="acabamento">Acabamento</option></select>`;
 else box.innerHTML=`<label>Condição</label><select id="assistCond"><option value="padrao">Aplicação padrão</option></select>`;
}
function productIndexByName(name){return products.findIndex(p=>p.name===name);}
function assistantCard(name,reason){const idx=productIndexByName(name),p=products[idx];if(!p)return '';return `<div class="assistant-option"><h4>${p.name}</h4><p>${reason}</p><p><b>${productSummary(p)}</b></p><button class="use-product" onclick="openAssistantProduct(${idx})">Calcular este produto →</button></div>`;}
function openAssistantProduct(idx){selectedIndex=idx;document.querySelector('[data-view="products"]')?.click();renderProduct(idx,lastArea||'');}
function runAssistant(){
 const t=$('#assistArea')?.value,c=$('#assistCond')?.value;let cards=[],note='';
 if(t==='reservatorio'){
  if(c==='enterrado'){cards.push(assistantCard('IMPERTUDO TOP','Pode compor a barreira inicial contra pressão negativa conforme a condição da estrutura.'));cards.push(assistantCard('IMPERTUDO TOP FLEX FIBRAS','Opção flexível cadastrada para reservatórios, com consumo de referência de 4,5 kg/m².'));cards.push(assistantCard('IMPERTUDO ULTRAFLEX UV','Outra opção cadastrada para reservatórios, conforme ficha técnica.'));note='Em reservatório enterrado, verifique pressão negativa, fissuras, juntas e passagens de tubulação antes de definir o sistema.';}
  else{cards.push(assistantCard('IMPERTUDO TOP FLEX FIBRAS','Opção cadastrada para reservatórios elevados ou apoiados.'));cards.push(assistantCard('IMPERTUDO ULTRAFLEX UV','Alternativa cadastrada para reservatórios.'));}
 }
 if(t==='area-fria'){cards.push(assistantCard('IMPERTUDO TOP FLEX FIBRAS','Consumo cadastrado de 3,0 kg/m² para áreas frias.'));cards.push(assistantCard('IMPERTUDO ULTRAFLEX UV','Consumo cadastrado de 3,0 kg/m² para áreas frias.'));}
 if(t==='laje'){cards.push(assistantCard('IMPERTUDO MANTA LÍQUIDA ACRÍLICA','Membrana acrílica cadastrada para lajes/coberturas sem tráfego, conforme condições da ficha.'));cards.push(assistantCard('IMPERTUDO ULTRAFLEX UV','Opção cadastrada para lajes expostas com reforço conforme ficha.'));cards.push(assistantCard('IMPERTUDO MANTA ASFÁLTICA III B POLIÉSTER','Sistema em manta para áreas que exigem solução asfáltica estruturada.'));}
 if(t==='parede'){cards.push(assistantCard('IMPERTUDO PAREDE PREMIUM','Permite selecionar finalidade de selador, impermeabilizante ou acabamento.'));cards.push(assistantCard('IMPERTUDO RESINA ACRÍLICA','Proteção superficial com rendimento variável conforme a superfície.'));}
 if(t==='junta'){cards.push(assistantCard('IMPERTUDO PU 40 FLEX','Cálculo disponível por largura × profundidade × metragem da junta.'));cards.push(assistantCard('IMPERTUDO PU 40','Selante PU disponível no catálogo para cálculo geométrico.'));cards.push(assistantCard('IMPERTUDO PU CONSTRUÇÃO','Outra opção de selante disponível no catálogo.'));}
 if(t==='manta'){cards.push(assistantCard('IMPERTUDO MANTA ASFÁLTICA III B POLIÉSTER','Manta estruturada com cálculo por rolos.'));cards.push(assistantCard('IMPERTUDO PRIMER','Produto complementar de preparação do substrato em sistemas compatíveis.'));}
 const r=$('#assistResult');r.classList.remove('hidden');r.innerHTML=`<div class="assistant-option-grid">${cards.join('')}</div>${note?`<div class="note">${note}</div>`:''}<div class="repo-note">Pré-seleção orientativa: confirme sempre a ficha técnica vigente, projeto e condição real da obra.</div>`;
}
renderProdList();renderProduct(0);renderCatalog();renderAssistantFields();loadQuote();
