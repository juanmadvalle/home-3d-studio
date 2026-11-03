function setupInterface(onTheme){
  const sheet=document.querySelector('#sheet'),title=document.querySelector('#sheet-title');
  const tabs=[...document.querySelectorAll('[data-tab]')],panels=[...document.querySelectorAll('[data-panel]')];
  let active=null,lastTab=null,messageTimer;
  function closePanel(restoreFocus=false){
    active=null;sheet.hidden=true;document.body.classList.remove('sheet-open');
    for(const tab of tabs){tab.setAttribute('aria-pressed','false');tab.setAttribute('aria-expanded','false');}
    if(restoreFocus)lastTab?.focus();
  }
  for(const tab of tabs)tab.onclick=()=>{
    if(active===tab.dataset.tab){closePanel();return;}
    active=tab.dataset.tab;lastTab=tab;sheet.hidden=false;document.body.classList.add('sheet-open');
    title.textContent={view:'Vista',furniture:'Mobiliario',settings:'Ajustes'}[active];
    for(const panel of panels)panel.hidden=panel.dataset.panel!==active;
    for(const button of tabs){const selected=button===tab;button.setAttribute('aria-pressed',String(selected));button.setAttribute('aria-expanded',String(selected));}
  };
  document.querySelector('#close-sheet').onclick=()=>closePanel(true);
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!sheet.hidden){e.preventDefault();closePanel(true);}});
  const theme=document.querySelector('#theme');
  function applyTheme(value){
    if(value==='system')delete document.documentElement.dataset.theme;else document.documentElement.dataset.theme=value;
    theme.value=value;onTheme();
  }
  let preference='system';try{const saved=localStorage.getItem('home3d:interface:theme');if(['system','light','dark'].includes(saved))preference=saved;}catch{}
  applyTheme(preference);theme.onchange=()=>{applyTheme(theme.value);try{localStorage.setItem('home3d:interface:theme',theme.value);}catch{}};
  const systemTheme=matchMedia('(prefers-color-scheme:dark)');
  if(systemTheme.addEventListener)systemTheme.addEventListener('change',onTheme);else if(systemTheme.addListener)systemTheme.addListener(onTheme);
  const message=document.querySelector('#message');
  new MutationObserver(()=>{clearTimeout(messageTimer);if(message.textContent)messageTimer=setTimeout(()=>{message.textContent='';},6500);}).observe(message,{childList:true,characterData:true,subtree:true});
  return {closePanel,setView(view){
    for(const name of ['orbit','plan','walk'])document.querySelector('#'+name).setAttribute('aria-pressed',String(view===name));
    document.querySelector('#walkUI').hidden=view!=='walk';
  }};
}
