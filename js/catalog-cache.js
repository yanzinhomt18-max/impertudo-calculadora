/* V8.3 — catálogo local persistente */
(function(){
 const KEY='impertudo_catalog_local_v82'; // mantém a mesma chave para preservar dados já salvos
 const VERSION='8.3.0-2026-08-18';
 const embedded=Array.isArray(window.IMPERTUDO_PRODUCTS)?window.IMPERTUDO_PRODUCTS:[];
 let selected=embedded;
 try{
   const cached=JSON.parse(localStorage.getItem(KEY)||'null');
   if(cached && Array.isArray(cached.items) && cached.items.length && cached.custom===true){
     selected=cached.items;
   }else if(cached && Array.isArray(cached.items) && cached.items.length && cached.version===VERSION){
     selected=cached.items;
   }else{
     selected=embedded;
     localStorage.setItem(KEY,JSON.stringify({version:VERSION,items:embedded,custom:false,updatedAt:new Date().toISOString()}));
   }
 }catch(e){console.warn('Catálogo local indisponível',e);}
 window.IMPERTUDO_PRODUCTS=selected;
 window.IMPERTUDO_CATALOG_VERSION=VERSION;
 window.saveCatalogLocal=function(items){
   if(!Array.isArray(items)||!items.length)throw new Error('Catálogo inválido');
   localStorage.setItem(KEY,JSON.stringify({version:VERSION,items,custom:true,updatedAt:new Date().toISOString()}));
   window.IMPERTUDO_PRODUCTS=items;
   return items.length;
 };
 window.resetCatalogLocal=function(){
   localStorage.setItem(KEY,JSON.stringify({version:VERSION,items:embedded,custom:false,updatedAt:new Date().toISOString()}));
   location.reload();
 };
})();
