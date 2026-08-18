function resultBox(items,note=''){
 return `<div class="kpis">${items.map(x=>`<div class="kpi"><b>${x[0]}</b><span>${x[1]}</span></div>`).join('')}</div>${note?`<div class="note">${note}</div>`:''}`;
}
function parsePackageSizes(p){
 const txt=(p.pack||'').replace(/,/g,'.'); const out=[]; const re=/(\d+(?:\.\d+)?)\s*(kg|g|L)\b/gi; let m;
 while((m=re.exec(txt))!==null){const size=parseFloat(m[1]),unit=m[2].toLowerCase()==='l'?'L':m[2].toLowerCase();if(size>0&&!out.some(x=>x.size===size&&x.unit===unit))out.push({size,unit});}
 return out;
}
function inferProductUnit(p){const packs=parsePackageSizes(p);if(p.unit&&String(p.unit).toLowerCase().startsWith('kg'))return 'kg';if(packs.length&&packs.every(x=>x.unit==='L'))return 'L';if(packs.length&&packs.every(x=>x.unit==='g'))return 'g';return 'kg';}
function convertPackSize(size,packUnit,totalUnit){if(totalUnit==='kg'&&packUnit==='g')return size/1000;if(totalUnit==='g'&&packUnit==='kg')return size*1000;if(packUnit===totalUnit)return size;return null;}
function packageWord(p,size,unit){
 const n=p.name.toUpperCase(),cat=(p.cat||'').toUpperCase();const liquid=cat.includes('MEMBRAN')||cat.includes('ASFÁLT')||cat.includes('PRIMER')||cat.includes('PROTEÇÃO')||cat.includes('DESMOLD')||n.includes('RESINA');
 if(cat.includes('GRAUTE')||cat.includes('REPARO'))return 'saco';if(n.includes('TOP FLEX')||n==='IMPERTUDO TOP'||n.includes('ULTRAFLEX'))return 'caixa';if(liquid&&unit==='kg'&&Math.abs(size-3.6)<0.01)return 'galão';if(liquid&&unit==='kg'&&(Math.abs(size-18)<0.01||Math.abs(size-20)<0.01))return 'balde';if(liquid&&unit==='kg'&&size>=180)return 'tambor';if(unit==='L'&&size>=180)return 'tambor';if(unit==='L'&&size>=18)return 'balde';if(unit==='L'&&size<=5)return 'galão';return 'embalagem';
}
function pluralPackage(noun,count){if(count===1)return noun;const map={caixa:'caixas',saco:'sacos',galão:'galões',balde:'baldes',tambor:'tambores',embalagem:'embalagens'};return map[noun]||noun+'s';}
function optimizePackageCombination(p,total,totalUnit='kg'){
 const packs=parsePackageSizes(p).map(pk=>({...pk,converted:convertPackSize(pk.size,pk.unit,totalUnit)})).filter(pk=>pk.converted).sort((a,b)=>b.converted-a.converted);
 if(!packs.length||packs.length>4)return null;
 if(packs.length===1){const count=Math.ceil(total/packs[0].converted);return {packs,counts:[count],sum:count*packs[0].converted,excess:count*packs[0].converted-total,score:(count*packs[0].converted-total)*1000+count};}
 let best=null;const counts=new Array(packs.length).fill(0);
 function evaluate(lastCount,sumBefore){counts[packs.length-1]=lastCount;const sum=sumBefore+lastCount*packs[packs.length-1].converted;if(sum+1e-9<total)return;const excess=sum-total,units=counts.reduce((a,b)=>a+b,0),score=excess*1000+units;if(!best||score<best.score)best={packs,counts:[...counts],sum,excess,score};}
 function walk(i,sum){if(i===packs.length-1){const rem=Math.max(0,total-sum),size=packs[i].converted,need=Math.ceil(rem/size);for(let c=Math.max(0,need-1);c<=need+2;c++)evaluate(c,sum);return;}const size=packs[i].converted,max=Math.ceil(total/size)+1;for(let c=0;c<=max;c++){counts[i]=c;const next=sum+c*size;if(next>total+(packs[packs.length-1].converted*2)&&c>0)break;walk(i+1,next);}}
 walk(0,0);return best;
}
function bestPackageHTML(p,total,totalUnit='kg'){const best=optimizePackageCombination(p,total,totalUnit);if(!best)return '';const parts=best.counts.map((c,i)=>c?`${c} × ${fmt(best.packs[i].size,best.packs[i].size%1?1:0)} ${best.packs[i].unit}`:'').filter(Boolean);if(!parts.length)return '';return `<div class="best-combo"><b>Combinação com menor sobra: ${parts.join(' + ')}</b><span>Compra total: ${fmt(best.sum,2)} ${totalUnit} • sobra estimada: ${fmt(best.excess,2)} ${totalUnit}</span></div>`;}
function packageAlternatives(p,total,totalUnit='kg',manualPack=0){
 if(!(total>0))return '';let packs=parsePackageSizes(p);if(!packs.length&&manualPack>0)packs=[{size:manualPack,unit:totalUnit}];const compatible=packs.map(pk=>({...pk,converted:convertPackSize(pk.size,pk.unit,totalUnit)})).filter(pk=>pk.converted);
 if(!compatible.length)return `<div class="info">Quantidade técnica calculada. Para transformar em embalagens, informe o tamanho da embalagem ou use um produto com embalagem cadastrada.</div>`;
 const cards=compatible.map(pk=>{const count=Math.ceil(total/pk.converted),purchased=count*pk.converted,leftover=Math.max(0,purchased-total),noun=packageWord(p,pk.size,pk.unit),unitLabel=pk.unit==='L'?'L':pk.unit;return `<div class="pack-card"><span class="pack-qtd">${count} ${pluralPackage(noun,count)}</span><span class="pack-name">${fmt(pk.size,pk.size%1?1:0)} ${unitLabel} cada</span><span class="pack-sub">Compra total: ${fmt(purchased,2)} ${totalUnit} • sobra estimada: ${fmt(leftover,2)} ${totalUnit}</span></div>`;}).join('');
 return `<div class="pack-title">Total de embalagens para compra</div><div class="pack-grid">${cards}</div>${bestPackageHTML(p,total,totalUnit)}<div class="formula-line">Fórmula: ARREDONDAR.PARA.CIMA(quantidade necessária ÷ conteúdo da embalagem). A calculadora nunca arredonda a embalagem para baixo.</div>`;
}
function toggleJointPackMode(){const mode=$('#jPackMode')?.value;if(!mode)return;$('#jVolumePackField')?.classList.toggle('hidden',mode!=='volume');$('#jMassPackField')?.classList.toggle('hidden',mode!=='mass');$('#jDensityField')?.classList.toggle('hidden',mode!=='mass');}
function toggleProLaje(){const mode=$('#proMode')?.value;if(!mode)return;$('#proArea')?.classList.toggle('hidden',mode!=='area');$('#proJoint')?.classList.toggle('hidden',mode!=='joint');}
