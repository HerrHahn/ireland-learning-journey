(() => {
 'use strict';
 const endpoint='https://11bg-writing-feedback.hahny0815.workers.dev/butler/suggestions';
 const key='ireland-suggestion-draft-v1';
 let clientId;try{clientId=localStorage.getItem('ireland-suggestion-browser-v1');}catch{}
 if(!/^[a-f0-9-]{36}$/i.test(clientId||'')){clientId=crypto.randomUUID();try{localStorage.setItem('ireland-suggestion-browser-v1',clientId);}catch{}}
 const launch=document.createElement('button');launch.className='suggestion-launch';launch.type='button';launch.textContent='✎ Verbesserungsvorschlag';launch.lang='de';launch.setAttribute('aria-haspopup','dialog');launch.setAttribute('aria-controls','suggestion-dialog');
 const dialog=document.createElement('dialog');dialog.id='suggestion-dialog';dialog.lang='de';dialog.setAttribute('aria-labelledby','suggestion-heading');
 dialog.innerHTML=`<form><div class="suggestion-heading"><h2 id="suggestion-heading">Deine Idee für die Website</h2><button type="button" class="suggestion-close" aria-label="Vorschlagsfeld schließen">×</button></div>
 <p>Was fehlt, ist unklar oder funktioniert nicht?</p><p class="suggestion-context"></p>
 <label for="suggestion-name">Dein Name</label><input id="suggestion-name" type="text" maxlength="80" required autocomplete="off" aria-describedby="suggestion-privacy">
 <label for="suggestion-text">Dein Verbesserungsvorschlag</label><textarea id="suggestion-text" rows="7" maxlength="1800" required placeholder="Hier kannst du deine Idee oder ein Problem beschreiben …" aria-describedby="suggestion-count suggestion-privacy"></textarea>
 <small id="suggestion-count">0 / 1.800 Zeichen</small><p class="suggestion-pencil">Apple Pencil: Bei aktiviertem „Kritzeln“ direkt in dieses Textfeld schreiben.</p>
 <p id="suggestion-privacy" class="suggestion-privacy">Mit „Vorschlag senden“ übermittelst du deinen Namen, deinen Vorschlag und den Seitenbezug an die Sammlung deiner Lehrkraft. Bitte keine weiteren persönlichen Daten oder Namen anderer Personen eintragen. Name, Text, Kapitel/Lernschritt und Zeitpunkt werden in der geschützten Sammlung deiner Lehrkraft bei Cloudflare gespeichert. Keine Weitergabe an eine KI. Ohne Anmeldung oder Code. Du kannst jederzeit weitere Vorschläge senden.</p>
 <button type="submit" class="suggestion-send">Vorschlag senden</button><p class="suggestion-status" role="status" aria-live="polite"></p><p class="suggestion-draft-status"></p>
 <a class="suggestion-teacher" href="suggestions-teacher.html" target="_blank" rel="noopener">Für die Lehrkraft: Sammlung herunterladen ↗</a></form>`;
 document.body.append(launch,dialog);
 const form=dialog.querySelector('form'),name=dialog.querySelector('#suggestion-name'),text=dialog.querySelector('textarea'),send=dialog.querySelector('[type=submit]'),status=dialog.querySelector('.suggestion-status');
 let context='',attemptId=crypto.randomUUID(),busy=false;
 function pageLabel(){return 'Ireland · '+currentPageLabel().slice(0,230);}
 function currentPageLabel(){
  if(location.pathname.endsWith('sources.html'))return 'Quellen & Bildnachweise';
  if(location.pathname.endsWith('suggestions-teacher.html'))return 'Lehrkraft: Vorschlagssammlung';
  if(document.querySelector('#teacher')&&!document.querySelector('#teacher').hidden)return 'Lehrkraftansicht';
  if(document.querySelector('#lesson')?.hidden)return 'Lernübersicht';
  const title=document.querySelector('#chapter-title')?.textContent.trim();
  const step=document.querySelector('.steps [aria-current="step"]')?.textContent.trim().replace(/^(\d+)(\D)/,'$1 $2');
  return [title||'Lernübersicht',step,document.querySelector('#content h2')?.textContent.trim()].filter(Boolean).join(' · ').replace(/\s+/g,' ').slice(0,240);
 }
 function save(){
  dialog.querySelector('#suggestion-count').textContent=text.value.length+' / 1.800 Zeichen';
  try{localStorage.setItem(key,JSON.stringify({name:name.value,text:text.value,page:context,attemptId,clientId}));dialog.querySelector('.suggestion-draft-status').textContent='Entwurf auf diesem Gerät gespeichert.';}
  catch{dialog.querySelector('.suggestion-draft-status').textContent='Browserspeicher nicht verfügbar. Entwurf bleibt nur solange diese Seite offen ist – bitte vor dem Schließen kopieren.';}
 }
 launch.onclick=()=>{
  if(!busy){
   if(!text.value.trim()){context=pageLabel();attemptId=crypto.randomUUID();}
   try{const d=JSON.parse(localStorage.getItem(key));if(d&&typeof d.text==='string'&&d.text.trim()){name.value=typeof d.name==='string'?d.name.slice(0,80):'';text.value=d.text.slice(0,1800);context=typeof d.page==='string'?d.page.slice(0,240):context;attemptId=/^[a-f0-9-]{36}$/i.test(d.attemptId||'')?d.attemptId:crypto.randomUUID();}}catch{}
   dialog.querySelector('.suggestion-context').textContent='Bezug: '+context;status.textContent='';save();
  }
  dialog.showModal();(name.value.trim()?text:name).focus();
 };
 dialog.querySelector('.suggestion-close').onclick=()=>dialog.close();dialog.addEventListener('close',()=>{launch.focus();});
 name.oninput=()=>{attemptId=crypto.randomUUID();save();};
 text.oninput=()=>{attemptId=crypto.randomUUID();save();};
 form.onsubmit=async event=>{
  event.preventDefault();if(busy)return;if(!name.value.trim()||name.value.trim().length>80||/[\r\n\u0000-\u001f\u007f]/u.test(name.value)){status.textContent='Bitte deinen Namen eingeben (höchstens 80 Zeichen).';return;}if(!text.value.trim()||text.value.length>1800){status.textContent='Bitte 1 bis 1.800 Zeichen schreiben.';return;}
  busy=true;send.disabled=true;text.readOnly=true;name.readOnly=true;save();status.textContent='Wird gesendet …';
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),20000);
  try{
   const response=await fetch(endpoint,{method:'POST',credentials:'omit',referrerPolicy:'no-referrer',headers:{'Content-Type':'application/json'},body:JSON.stringify({text:'Name: '+name.value.trim()+'\n\n'+text.value.trim(),page:context,attemptId,clientId}),signal:controller.signal});
   let result;try{result=await response.json();}catch{throw Error('Keine gültige Speicherbestätigung. Bitte erneut versuchen.');}
   if(!response.ok||result.saved!==true||result.id!==attemptId)throw Error(result.error||'Keine Speicherbestätigung. Bitte erneut versuchen.');
   // Do not erase a newer draft entered in another tab while this request was pending.
   try{const current=JSON.parse(localStorage.getItem(key));if(current?.attemptId===attemptId)localStorage.removeItem(key);}catch{}
   text.value='';name.value='';attemptId=crypto.randomUUID();dialog.querySelector('#suggestion-count').textContent='0 / 1.800 Zeichen';dialog.querySelector('.suggestion-draft-status').textContent='';
   status.textContent='Danke! Dein Vorschlag wurde bestätigt in der Sammlung deiner Lehrkraft gespeichert.';
  }catch(error){status.textContent=(error.name==='AbortError'||error instanceof TypeError)?'Keine Speicherbestätigung wegen eines Verbindungsfehlers. Dein Entwurf bleibt erhalten. Bitte unverändert erneut senden; dadurch entsteht kein doppelter Eintrag.':error.message;}
  finally{clearTimeout(timer);busy=false;send.disabled=false;text.readOnly=false;name.readOnly=false;}
 };
 // Keep the button reachable above other modal dialogs, including portfolio export.
 const follow=()=>{const parent=[...document.querySelectorAll('dialog[open]')].filter(d=>d!==dialog).at(-1)||document.body;if(launch.parentElement!==parent)parent.append(launch);};
 new MutationObserver(follow).observe(document.body,{subtree:true,attributes:true,attributeFilter:['open']});
})();
