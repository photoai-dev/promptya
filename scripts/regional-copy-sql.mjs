import {readFile} from 'node:fs/promises';
const locale=process.argv[2];
const patches=JSON.parse(await readFile('.local/regional-copy-patches.json','utf8')).filter(p=>p.locale===locale);
const json=JSON.stringify(patches).replaceAll("'","''");
// Match prior text as well as source identity: never overwrite an administrator's changed copy.
console.log(`with patches as (select * from jsonb_to_recordset('${json}'::jsonb) as p(locale text,route text,key text,source text,before text,after text,field text)),
 revised as (select e.source_route,e.locale,
 coalesce((select jsonb_object_agg(b.key,case when p.after is not null then jsonb_set(b.value,'{text}',to_jsonb(p.after)) else b.value end) from jsonb_each(e.blocks) b left join patches p on p.locale=e.locale and p.route=e.source_route and p.key=b.key and b.value->>'source'=p.source and b.value->>'text'=p.before),e.blocks) as blocks,
 coalesce((select p.after from patches p where p.locale=e.locale and p.route=e.source_route and p.field='title' and p.before=e.title),e.title) as title,
 coalesce((select p.after from patches p where p.locale=e.locale and p.route=e.source_route and p.field='description' and p.before=e.description),e.description) as description
 from public.editorial_pages e where e.locale='${locale}' and exists(select 1 from patches p where p.locale=e.locale and p.route=e.source_route))
 update public.editorial_pages e set blocks=r.blocks,title=r.title,description=r.description,revision=e.revision+1,updated_at=now() from revised r where e.locale=r.locale and e.source_route=r.source_route and (e.blocks is distinct from r.blocks or e.title is distinct from r.title or e.description is distinct from r.description);`);
