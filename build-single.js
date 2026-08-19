const fs=require('fs');
const path=require('path');
const root=__dirname;
const out=path.join(root,'dist');

fs.rmSync(out,{recursive:true,force:true});
fs.mkdirSync(out,{recursive:true});

function copyDir(src,dst){
 fs.mkdirSync(dst,{recursive:true});
 for(const entry of fs.readdirSync(src,{withFileTypes:true})){
  const a=path.join(src,entry.name),b=path.join(dst,entry.name);
  if(entry.isDirectory()) copyDir(a,b); else fs.copyFileSync(a,b);
 }
}

for(const name of ['index.html','manifest.webmanifest','sw.js']){
 fs.copyFileSync(path.join(root,name),path.join(out,name));
}
for(const dir of ['assets','css','data','js']) copyDir(path.join(root,dir),path.join(out,dir));

// Biblioteca PDF local: permite gerar proposta mesmo sem internet depois do cache da PWA.
const vendorDir=path.join(out,'vendor');
fs.mkdirSync(vendorDir,{recursive:true});
const jspdfSource=path.join(root,'node_modules','jspdf','dist','jspdf.umd.min.js');
if(!fs.existsSync(jspdfSource)) throw new Error('jsPDF local não encontrado. Execute npm install antes do build.');
fs.copyFileSync(jspdfSource,path.join(vendorDir,'jspdf.umd.min.js'));

let html=fs.readFileSync(path.join(out,'index.html'),'utf8');

// Catálogo persistente precisa carregar depois do catálogo embarcado e antes do core.
html=html.replace(
 '<script src="./js/core.js"></script>',
 '<script src="./js/catalog-cache.js"></script>\n<script src="./js/core.js"></script>'
);

html=html.replace('</head>','<link rel="stylesheet" href="./css/v82.css">\n<link rel="stylesheet" href="./css/v83.css">\n</head>');

const extras=[
 '<script src="./vendor/jspdf.umd.min.js"></script>',
 '<script src="./js/v82-area.js"></script>',
 '<script src="./js/v82-calc.js"></script>',
 '<script src="./js/v82-package-range.js"></script>',
 '<script src="./js/v82-proposal.js"></script>',
 '<script src="./js/v82-init.js"></script>',
 '<script src="./js/v83-stability.js"></script>',
 '<script src="./js/v83-commercial.js"></script>'
].join('\n');
html=html.replace('</body>',extras+'\n</body>');
html=html.replace(/Versão 8[^<]*/,'Versão 8.3 • estabilidade, offline e proposta revisada');
html=html.replace(/<title>[^<]*<\/title>/,'<title>Calculadora Técnica IMPERTUDO — V8.3</title>');

fs.writeFileSync(path.join(out,'index.html'),html);
console.log('Build V8.3 gerado em dist/ com catálogo persistente, jsPDF local e PWA modular.');
