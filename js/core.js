const products = window.IMPERTUDO_PRODUCTS || [];
const $ = s => document.querySelector(s);
const fmt=(n,d=2)=>Number(n||0).toLocaleString('pt-BR',{minimumFractionDigits:d,maximumFractionDigits:d});
const num=id=>{const e=$('#'+id);return e?parseFloat(String(e.value).replace(',','.'))||0:0};
let lastArea=0, selectedIndex=0;

document.querySelector('#countTag').textContent = products.length + ' produtos cadastrados';

document.querySelectorAll('.tab').forEach(b=>b.addEventListener('click',()=>{
 document.querySelectorAll('.tab').forEach(x=>x.classList.remove('active'));
 document.querySelectorAll('.view').forEach(x=>x.classList.remove('active'));
 b.classList.add('active'); $('#'+b.dataset.view).classList.add('active');
}));

function renderBasicFields(){
 const t=$('#basicType').value, box=$('#basicFields');
 const f=(lab,id,val)=>`<div class="field"><label>${lab}</label><input id="${id}" type="number" value="${val}" min="0" step="0.01"></div>`;
 if(t==='rectangle') box.innerHTML=`<div class="grid2">${f('Comprimento (m)','bL',5)}${f('Largura (m)','bW',4)}</div>`;
 if(t==='wall') box.innerHTML=`<div class="grid3">${f('Largura total (m)','bL',5)}${f('Altura (m)','bH',3)}${f('Área de portas/janelas a descontar (m²)','bOpen',0)}</div>`;
 if(t==='floorWall') box.innerHTML=`<div class="grid3">${f('Comprimento (m)','bL',4)}${f('Largura (m)','bW',3)}${f('Altura da subida nas paredes (m)','bH',0.3)}</div>`;
 if(t==='circle') box.innerHTML=`<div class="grid2">${f('Diâmetro (m)','bD',3)}${f('Área adicional manual (m²)','bExtra',0)}</div>`;
 if(t==='cylinder') box.innerHTML=`<div class="grid2">${f('Diâmetro externo/interno (m)','bD',4)}${f('Altura (m)','bH',5)}</div><div class="info">Fórmula da planilha: área total do cilindro fechado = 2 × π × r × (r + h). Para reservatório aberto, use a aba “Reservatórios”.</div>`;
 if(t==='multiple') box.innerHTML=`<div class="grid3">${f('Área 1 (m²)','a1',10)}${f('Área 2 (m²)','a2',0)}${f('Área 3 (m²)','a3',0)}${f('Área 4 (m²)','a4',0)}${f('Área 5 (m²)','a5',0)}${f('Área 6 (m²)','a6',0)}</div>`;
}
$('#basicType').addEventListener('change',renderBasicFields); renderBasicFields();

function calcBasic(){
 const t=$('#basicType').value, waste=1+num('basicWaste')/100; let base=0, detail='';
 if(t==='rectangle'){base=num('bL')*num('bW'); detail='Comprimento × largura';}
 if(t==='wall'){base=Math.max(0,num('bL')*num('bH')-num('bOpen')); detail='Largura × altura − vãos';}
 if(t==='floorWall'){const L=num('bL'),W=num('bW'),H=num('bH');base=L*W+2*(L+W)*H;detail='Piso + perímetro × altura de subida';}
 if(t==='circle'){base=Math.PI*Math.pow(num('bD')/2,2)+num('bExtra');detail='π × raio² + adicional';}
 if(t==='cylinder'){const r=num('bD')/2,H=num('bH');base=2*Math.PI*r*(r+H);detail='2 × π × r × (r + h)';}
 if(t==='multiple'){base=[1,2,3,4,5,6].reduce((s,i)=>s+num('a'+i),0);detail='Soma das áreas informadas';}
 const total=base*waste; lastArea=total;
 $('#basicResult').classList.remove('hidden');
 $('#basicResult').innerHTML=`<div class="kpis"><div class="kpi"><b>${fmt(base)} m²</b><span>Área geométrica</span></div><div class="kpi"><b>${fmt((waste-1)*100,0)}%</b><span>Margem</span></div><div class="kpi"><b>${fmt(total)} m²</b><span>Área considerada</span></div><div class="kpi"><b>${detail}</b><span>Método</span></div></div><div class="info">Área salva para uso na aba “Calcular por produto”.</div>`;
}
function sendAreaToProduct(){ if(!lastArea) calcBasic(); document.querySelector('[data-view="products"]').click(); renderProduct(selectedIndex,lastArea); }

const cats=['Todos',...Array.from(new Set(products.map(p=>p.cat))).sort()];
function fillSelect(id){ const s=$('#'+id);s.innerHTML=cats.map(c=>`<option>${c}</option>`).join('');}
fillSelect('prodCat');fillSelect('catFilter');

function filterProducts(search,cat){
 search=(search||'').toLowerCase();
 return products.map((p,i)=>({p,i})).filter(x=>(cat==='Todos'||x.p.cat===cat)&&x.p.name.toLowerCase().includes(search));
}
function renderProdList(){
 const rows=filterProducts($('#prodSearch').value,$('#prodCat').value);
 $('#prodList').innerHTML=rows.map(x=>`<button class="prodBtn ${x.i===selectedIndex?'active':''} ${x.p.tech?'':'no-tech'}" onclick="renderProduct(${x.i})"><b>${x.p.name}</b><span>${x.p.cat}</span><span class="prod-cons-summary">${productSummary(x.p)}</span></button>`).join('');
}
$('#prodSearch').addEventListener('input',renderProdList);$('#prodCat').addEventListener('change',renderProdList);

function commonAreaFields(area=''){
 return `<div class="grid2"><div class="field"><label>Área (m²)</label><input id="pArea" type="number" min="0" step="0.01" value="${area||lastArea||''}" placeholder="Informe ou use a calculadora de área"></div><div class="field"><label>Margem adicional (%)</label><input id="pWaste" type="number" value="5" min="0" step="1"></div></div>`;
}

function getTech(p){
 return p.tech || {status:'manual',source:'Ficha técnica do produto',summary:'Consumo varia conforme aplicação',lines:[['Consumo / rendimento','Consultar ficha técnica','Informe o valor no cálculo abaixo']]};
}
function techGuide(p){
 const t=getTech(p), manual=t.status!=='confirmed';
 return `<div class="consumption-guide ${manual?'manual':''}"><div class="cg-head"><div class="cg-head-left"><div class="cg-icon">${manual?'?':'kg'}</div><div><div class="cg-title">Consumo / rendimento</div><div class="cg-summary">${t.summary}</div></div></div><div class="cg-source">${t.source}</div></div><div class="cg-lines">${(t.lines||[]).map(x=>`<div class="cg-row"><div class="cg-use">${x[0]}</div><div class="cg-cons">${x[1]}</div><div class="cg-detail">${x[2]||''}</div></div>`).join('')}</div></div>`;
}
function numericConsumptionRows(p){
 const t=getTech(p);
 return (t.lines||[]).map((x,i)=>{const text=String(x[1]||'').replace(/,/g,'.');const range=text.match(/(\d+(?:\.\d+)?)\s*a\s*(\d+(?:\.\d+)?)\s*(kg|L|g)\/m²/i);const single=text.match(/(\d+(?:\.\d+)?)\s*(kg|L|g)\/m²/i);if(range)return {label:x[0],min:+range[1],max:+range[2],unit:range[3],detail:x[2]||''};if(single)return {label:x[0],min:+single[1],max:+single[1],unit:single[2],detail:x[2]||''};return null;}).filter(Boolean);
}
function guidedSelectHTML(p,id='guidedApp'){const rows=numericConsumptionRows(p);return `<div class="field"><label>Tipo de solicitação / aplicação</label><select id="${id}">${rows.map((r,i)=>`<option value="${i}">${r.label} — ${String(r.min).replace('.',',')}${r.max!==r.min?' a '+String(r.max).replace('.',','):''} ${r.unit}/m²</option>`).join('')}</select></div>`;}
function productSummary(p){const t=getTech(p);return t.summary || 'Consultar ficha técnica';}
function techStatus(p){const ok=p.tech && p.tech.status==='confirmed';return `<span class="tech-status ${ok?'ok':'manual'}"><span class="tech-dot"></span>${ok?'Consumo cadastrado':'Consumo manual'}</span>`;}
function calcName(calc){const m={area:'m² com consumo cadastrado',area_range:'m² com faixa de consumo',area_manual:'m² — consumo informado',area_top:'m² — aplicação específica',top_conditions:'m² por condição de pressão',guided_range:'m² com seletor guiado',usage_select:'m² por aplicação',yield_range:'m² por rendimento',pro_laje:'m² ou metro linear',topflex:'m² — consumo por aplicação',roll:'rolos por m²',roll_manual:'rolos — rendimento informado',joint:'junta / selante',joint_manual:'metro linear',volume_manual:'m³ de reparo/graute',linear_manual:'metro linear',linear_or_area_manual:'metro linear ou m²',cement_percent:'% sobre peso de cimento',cement_dose:'dosagem por cimento',concrete_dose:'dosagem por m³ de concreto',dilution:'diluição / rendimento',manual:'quantidade manual'};return m[calc]||calc;}
