import {readFile,mkdir,writeFile} from 'node:fs/promises';import {createHash} from 'node:crypto';
const collections=JSON.parse(await readFile('private/catalog.json','utf8'));try{collections.push(...JSON.parse(await readFile('private/mascot-catalog.json','utf8')));}catch(e){if(e.code!=='ENOENT')throw e;}
const quote=s=>"'"+s.replaceAll("'","''")+"'";
const rows=collections.flatMap(p=>p.prompts.map((content,position)=>({slug:p.slug,position,content})));
await mkdir('private/import-batches',{recursive:true});
for(let i=0;i<rows.length;i+=75){const sql='insert into public.collection_prompts(collection_slug,position,content) values\n'+rows.slice(i,i+75).map(r=>`(${quote(r.slug)},${r.position},${quote(r.content)})`).join(',\n')+'\non conflict(collection_slug,position) do update set content=excluded.content;';await writeFile('private/import-batches/'+String(i/75).padStart(3,'0')+'.sql',sql);}
const manifest=collections.map(p=>({slug:p.slug,count:p.prompts.length,md5:createHash('md5').update(p.prompts.join('\n')).digest('hex')}));await writeFile('private/import-batches/manifest.json',JSON.stringify(manifest));console.log(JSON.stringify({collections:collections.length,rows:rows.length,batches:Math.ceil(rows.length/75)}));
