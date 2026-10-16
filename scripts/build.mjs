import {readFile,writeFile,readdir,mkdir,cp} from 'node:fs/promises';
const root=new URL('../Promptya_Site/',import.meta.url);
export const catalog=JSON.parse(await readFile(new URL('assets/catalog.json',root),'utf8'));
catalog.sort((a,b)=>a.name.localeCompare(b.name,'fr'));
if(catalog.some(p=>'prompts' in p))throw Error('Le catalogue public ne doit contenir aucun texte de prompt.');
const escape=s=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
for(const category of ['voyage','mode','sport','creation','gourmandise']){
  const file=new URL(`categories/${category}/index.html`,root);let html=await readFile(file,'utf8');
  const cards=catalog.filter(p=>p.category===category).map(p=>`<a class="tile" href="/packs/${p.slug}/"><img loading="lazy" src="/assets/${p.image}" alt="Exemple de la collection ${escape(p.name)}"><div class="tilemain"><h2 style="font-size:20px">${escape(p.name)}</h2><p>Pack personnalisable · jusqu’à 100 images</p><strong>19,90 € →</strong></div></a>`).join('');
  html=html.replace(new RegExp(`<div class="cards section" data-category="${category}">[\\s\\S]*?<\\/div><!-- catalog-end -->`),`<div class="cards section" data-category="${category}">${cards}</div><!-- catalog-end -->`);
  if(!html.includes('<!-- catalog-end -->'))html=html.replace(`<div class="cards section" data-category="${category}"></div>`,`<div class="cards section" data-category="${category}">${cards}</div><!-- catalog-end -->`);
  await writeFile(file,html);
}
const paths=[];
async function walk(dir,relative=''){for(const e of await readdir(dir,{withFileTypes:true})){const rel=relative+e.name;if(e.isDirectory())await walk(new URL(e.name+'/',dir),rel+'/');else if(e.name==='index.html'&&!/^(studio|admin|commandes|compte)\//.test(rel))paths.push('/'+rel.replace('index.html',''));}}
await walk(root);
await writeFile(new URL('sitemap.xml',root),'<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'+paths.map(p=>`<url><loc>https://promptya.com${p}</loc></url>`).join('')+'</urlset>');
await mkdir('dist',{recursive:true});await cp(root,'dist',{recursive:true});
console.log(JSON.stringify({collections:catalog.length,promptsInternes:catalog.reduce((n,p)=>n+p.promptCount,0),pages:'dist/'}));
