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

let html=fs.readFileSync(path.join(out,'index.html'),'utf8');

// Carrega os refinamentos V8.2 como arquivos normais, sem injetar JS dentro do HTML.
html=html.replace('</head>','<link rel="stylesheet" href="./css/v82.css">\n</head>');

const extras=[
 '<script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/4.2.1/jspdf.umd.min.js" crossorigin="anonymous"></script>',
 '<script src="./js/v82-area.js"></script>',
 '<script src="./js/v82-calc.js"></script>',
 '<script src="./js/v82-package-range.js"></script>',
 '<script src="./js/v82-proposal.js"></script>',
 '<script src="./js/v82-init.js"></script>'
].join('\n');
html=html.replace('</body>',extras+'\n</body>');
html=html.replace(/Versão 8[^<]*/,'Versão 8.2 • cálculo paramétrico + PDF nativo + PWA');
html=html.replace(/<title>[^<]*<\/title>/,'<title>Calculadora Técnica IMPERTUDO — V8.2</title>');

fs.writeFileSync(path.join(out,'index.html'),html);
console.log('Build V8.2 modular gerado em dist/ — scripts e estilos permanecem externos para evitar HTML corrompido.');
