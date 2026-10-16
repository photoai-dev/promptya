import {writeFile} from '../lib/fs-safe.mjs';

const {SUPABASE_URL:url,SUPABASE_SERVICE_ROLE_KEY:key}=process.env;
if(url&&key){try{
 const r=await fetch(url+'/rest/v1/pack_preview_batches?published=eq.true&select=pack_slug,id,preview_manifest',{headers:{apikey:key,Authorization:'Bearer '+key},signal:AbortSignal.timeout(20000)});
 // Missing migration must not break the initial static deployment.
 if(r.ok){const rows=await r.json(),data={};for(const row of rows){if(Array.isArray(row.preview_manifest)&&row.preview_manifest.length===4)data[row.pack_slug]=row.preview_manifest;}
 await writeFile('Promptya_Site/assets/examples.json',JSON.stringify(data));console.log('Aperçus validés synchronisés : '+Object.keys(data).length+' packs.');}
 else console.log('Aperçus : synchronisation indisponible, conservation du manifeste validé existant.');
 const inventory=await fetch(url+'/rest/v1/mascot_inventory?select=slug,status',{headers:{apikey:key,Authorization:'Bearer '+key},signal:AbortSignal.timeout(20000)});if(inventory.ok){const rows=await inventory.json();await writeFile('Promptya_Site/assets/mascots-inventory.json',JSON.stringify(Object.fromEntries(rows.map(m=>[m.slug,m.status]))));}
}catch{console.log('Synchronisation Supabase indisponible ; conservation des manifestes publics existants.');}
}
