import {readFile} from 'node:fs/promises';
const rows=JSON.parse(await readFile('.local/new-editorial-seed.json','utf8'));
const offset=Number(process.argv[2]||0),limit=Number(process.argv[3]||20);
const json=JSON.stringify(rows.slice(offset,offset+limit)).replaceAll("'","''");
console.log(`insert into public.editorial_pages (source_route,locale,kind,title,description,blocks,published) select source_route,locale,kind,title,description,blocks,published from jsonb_to_recordset('${json}'::jsonb) as r(source_route text,locale text,kind text,title text,description text,blocks jsonb,published boolean) on conflict (source_route,locale) do nothing;`);
