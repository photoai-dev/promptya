import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,stat} from 'node:fs/promises';
import {parse} from 'parse5';
const maps=JSON.parse(await readFile('dist/public-language-routes.json','utf8'));
const config=JSON.parse(await readFile('content/locales/config.json','utf8'));
test('English is published at root and French at /fr with complete reciprocal SEO',async()=>{
 assert.equal(maps.en['/'],'/');assert.equal(maps.fr['/'],'/fr/');
 const errors=[];
 for(const [locale,routes] of Object.entries(maps))for(const [source,path] of Object.entries(routes)){
  const html=await readFile('dist'+path+'index.html','utf8');
  assert.ok(html.includes('<html lang="'+(config.languages[locale].htmlLang||locale)+'"'),path);
  assert.ok(html.includes('rel="canonical" href="https://www.promptya.app'+path+'"'),path);
  assert.ok(html.includes('hreflang="x-default" href="https://www.promptya.app'+maps.en[source]+'"'),path);
  for(const other of config.enabled)assert.ok(html.includes('hreflang="'+(config.languages[other].htmlLang||other)+'" href="https://www.promptya.app'+maps[other][source]+'"'),path+' '+other);
  const links=[];function walk(n){for(const a of n.attrs||[])if(['href','action','src'].includes(a.name)&&a.value.startsWith('/')&&!a.value.startsWith('//')){assert.ok(!a.value.startsWith('/en/'),path+' uses legacy English link '+a.value);links.push(a.value.split(/[?#]/)[0]);}for(const c of n.childNodes||[])walk(c);}walk(parse(html));
  for(const link of new Set(links)){if(link.startsWith('/api/'))continue;try{await stat('dist'+link+(link.endsWith('/')?'index.html':''));}catch{errors.push(path+' -> '+link);}}
 }
 assert.deepEqual(errors,[]);
});
test('all language sitemaps list canonical, existing pages and no private area',async()=>{
 const index=await readFile('dist/sitemap.xml','utf8');assert.ok(index.includes('<sitemapindex'));
 for(const locale of config.enabled){
  assert.ok(index.includes('https://www.promptya.app/sitemaps/'+locale+'.xml'));
  const xml=await readFile('dist/sitemaps/'+locale+'.xml','utf8');
  const urls=[...xml.matchAll(/<loc>https:\/\/www\.promptya\.app([^<]*)<\/loc>/g)].map(m=>m[1]);
  assert.ok(urls.length>140);assert.equal(new Set(urls).size,urls.length);
  const own=new Set(Object.values(maps[locale]));for(const path of urls){assert.ok(own.has(path),path);await stat('dist'+path+'index.html');}
  assert.ok(!xml.includes('/admin/'));assert.ok(!xml.includes('promptya.app/en/'));
 }
});
test('public client resources keep French and English orders in their language',async()=>{
 const fr=await readFile('dist/fr/assets/home.js','utf8'),en=await readFile('dist/assets/home.js','utf8');
 assert.ok(fr.includes('/fr/studio/'));assert.ok(!en.includes('/en/'));
 const english=JSON.parse(await readFile('dist/assets/locale-data.json','utf8'));
 assert.equal(english.routes['/compte/'],'/account/');
 assert.equal(english.routes['/panier/'],'/cart/');
});
test('French stylesheets and assets do not depend on the current page directory',async()=>{
 const html=await readFile('dist/fr/index.html','utf8');
 assert.ok(html.includes('rel="stylesheet" href="/assets/style.css"'));
 assert.ok(!/(?:href|src|poster)="assets\//.test(html));
 const css=await readFile('dist/assets/style.css','utf8');assert.ok(css.length>1000);
});
test('legacy English and French pages have static redirect fallbacks preserving query and fragment',async()=>{
 for(const [path,target] of [['/en/how-it-works/','/how-it-works/'],['/comment-ca-marche/','/fr/comment-ca-marche/']]){
  const html=await readFile('dist'+path+'index.html','utf8');
  assert.ok(html.includes('http-equiv="refresh" content="0;url=https://www.promptya.app'+target+'"'));
  assert.ok(html.includes('location.search+location.hash'));
 }
});
