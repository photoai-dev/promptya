// Run locally only: node --env-file=.env scripts/import-prompts.mjs
import {readFile} from 'node:fs/promises';
const {SUPABASE_URL:url,SUPABASE_SERVICE_ROLE_KEY:key}=process.env;
if(!url||!key)throw Error('Renseignez SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY dans .env local.');
const collections=JSON.parse(await readFile('private/catalog.json','utf8'));
const rows=collections.flatMap(p=>p.prompts.map((content,position)=>({collection_slug:p.slug,position,content})));
for(let i=0;i<rows.length;i+=250){const r=await fetch(url+'/rest/v1/collection_prompts?on_conflict=collection_slug,position',{method:'POST',headers:{apikey:key,Authorization:'Bearer '+key,'Content-Type':'application/json',Prefer:'resolution=merge-duplicates,return=minimal'},body:JSON.stringify(rows.slice(i,i+250)),signal:AbortSignal.timeout(30000)});if(!r.ok)throw Error('Échec de l’import au lot '+i+' ('+r.status+'). Relancez après correction ; les lignes sont dédupliquées.');}
console.log(`${rows.length} prompts importés dans la table privée Supabase.`);
