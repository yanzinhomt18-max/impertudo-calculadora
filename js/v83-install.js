/* IMPERTUDO V8.3 — instalação PWA em Android, iOS e desktop */
(function(){
 const isIOS=/iphone|ipad|ipod/i.test(navigator.userAgent)||(/Macintosh/i.test(navigator.userAgent)&&navigator.maxTouchPoints>1);
 const standalone=window.matchMedia('(display-mode: standalone)').matches||navigator.standalone===true;
 const btn=$('#installAppBtn');
 if(isIOS&&!standalone)btn?.classList.remove('hidden');
 if(standalone)btn?.classList.add('hidden');

 function closeHelp(){document.querySelector('.install-help')?.remove();}
 function iosHelp(){
  closeHelp();
  const el=document.createElement('div');el.className='install-help';
  el.innerHTML=`<div class="install-help-card"><h3>Instalar no iPhone / iPad</h3><p>No iOS, a instalação é feita pelo Safari e não pelo botão padrão dos outros navegadores.</p><div class="install-help-steps"><div class="install-help-step"><b>1.</b><span>Abra esta calculadora no <b>Safari</b>.</span></div><div class="install-help-step"><b>2.</b><span>Toque em <b>Compartilhar</b> (ícone de quadrado com seta).</span></div><div class="install-help-step"><b>3.</b><span>Escolha <b>Adicionar à Tela de Início</b> e confirme.</span></div></div><button class="btn primary" type="button">Entendi</button></div>`;
  el.addEventListener('click',e=>{if(e.target===el||e.target.closest('button'))closeHelp();});document.body.appendChild(el);
 }

 window.installPWA=async function(){
  if(isIOS){iosHelp();return;}
  if(typeof deferredInstallPrompt!=='undefined'&&deferredInstallPrompt){
   deferredInstallPrompt.prompt();await deferredInstallPrompt.userChoice;deferredInstallPrompt=null;btn?.classList.add('hidden');return;
  }
  const nav=/android/i.test(navigator.userAgent)?'menu do navegador → Instalar aplicativo':'menu do navegador → Instalar aplicativo / Criar atalho';
  alert(`A instalação automática ainda não foi oferecida pelo navegador. Use ${nav}.`);
 };
 window.addEventListener('appinstalled',()=>btn?.classList.add('hidden'));
})();
