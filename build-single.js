const fs=require('fs');
const path=require('path');
const root=__dirname;
const out=path.join(root,'dist');
fs.rmSync(out,{recursive:true,force:true});
fs.mkdirSync(out,{recursive:true});
let html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const read=rel=>fs.readFileSync(path.join(root,rel.replace(/^\.\//,'')),'utf8');

html=html.replace(/<link rel="stylesheet" href="(\.\/[^\"]+\.css)">/g,(_,src)=>`<style>\n${read(src)}\n</style>`);
html=html.replace('</head>',`<style>\n${read('./css/v82.css')}\n</style>\n</head>`);

let manifest={name:'Calculadora Técnica IMPERTUDO',short_name:'IMPERTUDO Calc',display:'standalone',background_color:'#f5f8f6',theme_color:'#087548',lang:'pt-BR',start_url:'/',scope:'/'};
try{manifest={...manifest,...JSON.parse(read('./manifest.webmanifest'))};}catch(e){}
manifest.start_url='/';manifest.scope='/';
const iconPath=path.join(root,'assets/icon.svg');
if(fs.existsSync(iconPath)){
 const icon=fs.readFileSync(iconPath).toString('base64');
 manifest.icons=[{src:`data:image/svg+xml;base64,${icon}`,sizes:'any',type:'image/svg+xml',purpose:'any maskable'}];
}
const manifestData=Buffer.from(JSON.stringify(manifest)).toString('base64');
html=html.replace(/<link rel="manifest"[^>]*>/,`<link rel="manifest" href="data:application/manifest+json;base64,${manifestData}">`);

const logoPath=path.join(root,'assets/logo-impertudo.svg');
if(fs.existsSync(logoPath)){
 const logo=fs.readFileSync(logoPath).toString('base64');
 html=html.replace(/src="\.\/assets\/logo-impertudo\.svg"/g,`src="data:image/svg+xml;base64,${logo}"`);
}

html=html.replace(/<script src="(\.\/[^\"]+\.js)"><\/script>/g,(_,src)=>{
 let code=read(src);let extra='';
 if(src==='./data/products.js')extra=`\n${read('./js/catalog-cache.js')}`;
 return `<script>\n${code.replace(/<\/script>/gi,'<\\/script>')}\n${extra.replace(/<\/script>/gi,'<\\/script>')}\n</script>`;
});

const jspdf='<script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/4.2.1/jspdf.umd.min.js" crossorigin="anonymous"></script>';
const overlayFiles=['./js/v82-area.js','./js/v82-calc.js','./js/v82-package-range.js','./js/v82-proposal.js','./js/v82-init.js'];
const overlay=overlayFiles.map(f=>`<script>\n${read(f).replace(/<\/script>/gi,'<\\/script>')}\n</script>`).join('\n');
html=html.replace('</body>',`${jspdf}\n${overlay}\n</body>`);
html=html.replace(/Versão 8[^<]*/,'Versão 8.2 • cálculo paramétrico + PDF nativo + PWA');
html=html.replace(/<title>[^<]*<\/title>/,'<title>Calculadora Técnica IMPERTUDO — V8.2</title>');

fs.writeFileSync(path.join(out,'index.html'),html);
fs.copyFileSync(path.join(root,'sw.js'),path.join(out,'sw.js'));
console.log(`V8.2 gerada: ${path.join(out,'index.html')} (${Buffer.byteLength(html)} bytes)`);
