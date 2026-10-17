import {readFile} from 'node:fs/promises';
const rows=JSON.parse(await readFile('.local/seo-patches.json','utf8')).filter(r=>!process.argv[2]||r.locale===process.argv[2]);
const json=JSON.stringify(rows).replaceAll("'","''");
console.log(`with patches as (select * from jsonb_to_recordset('${json}'::jsonb) as p(locale text,source_route text,before_title text,before_description text,title text,description text)) update public.editorial_pages e set title=p.title,description=p.description,revision=e.revision+1,updated_at=now() from patches p where e.locale=p.locale and e.source_route=p.source_route and e.title=p.before_title and e.description=p.before_description;`);
