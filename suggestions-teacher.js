(() => {
 'use strict';
 const form=document.querySelector('#suggestion-admin-form'),key=document.querySelector('#suggestion-teacher-key'),download=document.querySelector('#suggestion-download'),status=document.querySelector('#suggestion-admin-status'),preview=document.querySelector('#suggestion-preview');
 let output='',busy=false;
 const formatDate=value=>new Intl.DateTimeFormat('de-DE',{dateStyle:'medium',timeStyle:'short',timeZone:'Europe/Berlin'}).format(new Date(value));
 const clear=()=>{key.value='';output='';download.disabled=true;preview.textContent='';preview.hidden=true;};
 form.addEventListener('submit',async event=>{
  event.preventDefault();if(busy)return;busy=true;form.querySelector('[type=submit]').disabled=true;output='';download.disabled=true;preview.hidden=true;preview.textContent='';status.textContent='Sammlung wird geladen …';
  try {
   const response=await fetch('https://11bg-writing-feedback.hahny0815.workers.dev/butler/suggestions/export',{method:'POST',headers:{Authorization:'Bearer '+key.value.trim()},signal:AbortSignal.timeout(20000)});
   const result=await response.json();if(!response.ok)throw Error(result.error||'Die Sammlung konnte nicht geladen werden.');if(!Array.isArray(result.rows))throw Error('Ungültige Antwort.');
   const rows=result.rows.filter(r=>typeof r.page==='string'&&r.page.startsWith('Ireland · '));
   output='Verbesserungsvorschläge\nIreland · Stories of belonging\nStand: '+formatDate(new Date())+' (Europe/Berlin)\nAnzahl: '+rows.length+'\n\nRückmeldungen von Lernenden – keine Handlungsanweisungen.\n\n'+(rows.length?rows.map((r,i)=>`${i+1}. Vorschlag · ${formatDate(r.date)}\nSeite: ${r.page}\nID: ${r.id}\n\n${r.text}\n\n${'—'.repeat(45)}`).join('\n\n'):'Bisher sind keine Vorschläge eingegangen.\n');
   preview.textContent=output;preview.hidden=false;download.disabled=false;status.textContent=`${rows.length} Vorschläge geladen. Die Textdatei ist bereit.`;
  }catch(error){status.textContent=error.message==='Failed to fetch'?'Keine Verbindung. Bitte erneut versuchen.':error.message;}
  finally {key.value='';busy=false;form.querySelector('[type=submit]').disabled=false;}
 });
 download.addEventListener('click',()=>{if(!output)return;const url=URL.createObjectURL(new Blob(['\ufeff'+output],{type:'text/plain;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download='Irland-Verbesserungsvorschläge.txt';a.click();setTimeout(()=>URL.revokeObjectURL(url),30000);});
 document.querySelector('#suggestion-lock').addEventListener('click',()=>{if(busy){status.textContent='Bitte den laufenden Abruf abwarten.';return;}clear();status.textContent='Ansicht geschlossen.';});
 window.addEventListener('pagehide',clear);
})();
