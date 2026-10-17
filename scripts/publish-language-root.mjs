// Keep French authoring sources stable; publish English at / and French at /fr/.
import {readFile,mkdir,cp,unlink,readdir} from 'node:fs/promises';
import {writeFile} from '../lib/fs-safe.mjs';
import {parse,serialize} from 'parse5';
const origin=(process.env.SITE_URL||process.env.APP_URL||'https://promptya.app').replace(/\/$/,'');
const config=JSON.parse(await readFile('content/locales/config.json','utf8'));
const stored={fr:{}};
for(const locale of config.enabled.filter(l=>l!=='fr'))stored[locale]=JSON.parse(await readFile(`Promptya_Site/${locale}/routes.json`,'utf8'));
const sources=Object.keys(stored.en);
stored.fr=Object.fromEntries(sources.map(p=>[p,p]));
const publicMaps={};
for(const locale of config.enabled)publicMaps[locale]=Object.fromEntries(sources.map(p=>[p,locale==='en'?stored.en[p].replace(/^\/en(?=\/)/,''):locale==='fr'?'/fr'+p:stored[locale][p]]));
const frenchRoutes=new Set(sources);
function publicURL(value){
 if(typeof value!=='string')return value;
 const absolute=value.startsWith(origin+'/'),raw=absolute?value.slice(origin.length):value;
 if(!raw.startsWith('/')||raw.startsWith('//'))return value;
 const [,path,tail]=raw.match(/^([^?#]*)(.*)$/);
 let next=path;
 if(path==='/en'||path.startsWith('/en/'))next=path.slice(3)||'/';
 else if(frenchRoutes.has(path))next='/fr'+path;
 return (absolute?origin:'')+next+tail;
}
function jsonURLs(data,key=''){
 if(Array.isArray(data))return data.map(x=>jsonURLs(x,key));
 if(data&&typeof data==='object')return Object.fromEntries(Object.entries(data).map(([k,v])=>[k,jsonURLs(v,k)]));
 return typeof data==='string'?publicURL(data):data;
}
async function rewriteHTML(html,locale,source){
 const doc=parse(html);
 function visit(node){
  for(const a of node.attrs||[]){
   if(['href','action'].includes(a.name))a.value=publicURL(a.value);
   if(a.name==='src'&&node.tagName==='script'){
    if(locale==='fr'&&a.value.startsWith('/assets/'))a.value='/fr'+a.value;
    else if(locale==='en')a.value=a.value.replace(/^\/en\/assets\//,'/assets/');
   }
   if(a.name==='content'&&node.tagName==='meta')a.value=publicURL(a.value);
  }
  if(node.tagName==='link'&&node.attrs.some(a=>a.name==='hreflang'&&a.value==='x-default'))node.attrs.find(a=>a.name==='href').value=origin+publicMaps.en[source];
  if(node.tagName==='script'&&node.attrs.some(a=>a.name==='type'&&a.value==='application/ld+json')){
   for(const c of node.childNodes||[])if(c.nodeName==='#text'){
    const json=jsonURLs(JSON.parse(c.value));
    function language(x){if(Array.isArray(x))x.forEach(language);else if(x&&typeof x==='object'){if('inLanguage' in x)x.inLanguage=config.languages[locale].htmlLang||locale;Object.values(x).forEach(language);}}
    language(json);c.value=JSON.stringify(json).replaceAll('<','\\u003c');
   }
   return;
  }
  for(const c of node.childNodes||[])visit(c);
 }
 visit(doc);return serialize(doc);
}
// Save French client resources before English resources replace those at /assets/.
await mkdir('dist/fr/assets',{recursive:true});
for(const item of await readdir('Promptya_Site/assets',{withFileTypes:true})){
 if(!item.isFile()||!(/\.(js|json)$/.test(item.name)))continue;
 const path='Promptya_Site/assets/'+item.name;
 let data=await readFile(path,'utf8');
 if(item.name.endsWith('.js')){
  for(const source of sources.filter(p=>p!=='/').sort((a,b)=>b.length-a.length))for(const q of ["'",'"','`'])data=data.replaceAll(q+source,q+'/fr'+source);
  for(const name of ['catalog.json','mascots.json'])data=data.replaceAll('/assets/'+name,'/fr/assets/'+name);
 }
 await writeFile('dist/fr/assets/'+item.name,data);
}
for(const locale of config.enabled){
 for(const source of sources){
  const from=locale==='fr'?'Promptya_Site'+source+'index.html':'Promptya_Site'+stored[locale][source]+'index.html';
  const to='dist'+publicMaps[locale][source];
  await mkdir(to,{recursive:true});
  await writeFile(to+'index.html',await rewriteHTML(await readFile(from,'utf8'),locale,source));
 }
}
// Remove French aliases from / when they are not also English destination pages.
const englishDestinations=new Set(Object.values(publicMaps.en));
for(const source of sources)if(!englishDestinations.has(source))await unlink('dist'+source+'index.html').catch(e=>{if(e.code!=='ENOENT')throw e;});
await cp('Promptya_Site/en/assets','dist/assets',{recursive:true});
for(const item of await readdir('Promptya_Site/en/assets',{withFileTypes:true})){
 if(!item.isFile()||!(/\.(js|json)$/.test(item.name)))continue;
 const path='dist/assets/'+item.name;
 let data=await readFile(path,'utf8');
 if(item.name.endsWith('.js'))data=data.replaceAll('/en/','/');
 else if(item.name==='locale-data.json'){
  const json=JSON.parse(data);json.routes=publicMaps.en;data=JSON.stringify(json);
 }
 await writeFile(path,data);
}
await writeFile('dist/routes.json',JSON.stringify(publicMaps.en,null,2));
// Build one sitemap for each language/region, plus the public sitemap index.
const oldSitemap=await readFile('Promptya_Site/sitemap.xml','utf8');
const indexedSources=sources.filter(p=>oldSitemap.includes('<loc>'+origin+p+'</loc>'));
await mkdir('dist/sitemaps',{recursive:true});
const xmlEscape=s=>s.replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;');
for(const locale of config.enabled){
 const entries=indexedSources.map(p=>{
  const alternates=config.enabled.map(l=>`<xhtml:link rel="alternate" hreflang="${config.languages[l].htmlLang||l}" href="${xmlEscape(origin+publicMaps[l][p])}"/>`).join('');
  return `<url><loc>${xmlEscape(origin+publicMaps[locale][p])}</loc>${alternates}<xhtml:link rel="alternate" hreflang="x-default" href="${xmlEscape(origin+publicMaps.en[p])}"/></url>`;
 }).join('');
 await writeFile(`dist/sitemaps/${locale}.xml`,'<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">'+entries+'</urlset>');
}
await writeFile('dist/sitemap.xml','<?xml version="1.0" encoding="UTF-8"?><sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'+config.enabled.map(l=>`<sitemap><loc>${origin}/sitemaps/${l}.xml</loc></sitemap>`).join('')+'</sitemapindex>');
await writeFile('dist/llms.txt',`# Promptya\nPersonalised AI image packs. English: ${origin}/ — Français : ${origin}/fr/\n106 collections. Generate 1–100 images per pack. Internal generation prompts are not sold or published.\n\n- [Packs](${origin+publicMaps.en['/packs/']})\n- [Guides](${origin+publicMaps.en['/guides/']})\n- [Pricing](${origin+publicMaps.en['/tarifs/']})\n- [Sitemap](${origin}/sitemap.xml)\n`);
await writeFile('dist/public-language-routes.json',JSON.stringify(publicMaps));
console.log('Published English at /, French at /fr/, '+config.enabled.length+' language sitemaps.');
