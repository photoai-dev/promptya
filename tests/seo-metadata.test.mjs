import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {parse} from 'parse5';
const report=JSON.parse(await readFile('content/seo-audit.json','utf8'));
const maps=JSON.parse(await readFile('dist/public-language-routes.json','utf8'));
test('all public titles are unique per language and exclude price-led boilerplate',()=>{
 for(const locale of Object.keys(maps)){
  const rows=report.rows.filter(r=>r.locale===locale);assert.equal(rows.length,176);
  assert.equal(new Set(rows.map(r=>r.title)).size,rows.length,locale);
  for(const row of rows){assert.ok(row.titleUnits<=76,row.title);assert.doesNotMatch(row.title,/€|\b22[,.]90\b/);assert.ok(row.description.length>0);assert.ok(row.description.length<=220,row.description);}
  const home=rows.find(r=>r.source_route==='/');assert.ok(home.title.includes('3'),home.title);
  for(const pack of rows.filter(r=>r.kind==='pack'))assert.doesNotMatch(pack.title,/gratuit|\bfree\b|gratis|kostenlos|grátis|zdarma|darmow|無料/i);
 }
});
test('French destination, guide and free trial pages target distinct search intentions',()=>{
 const fr=report.rows.filter(r=>r.locale==='fr'),at=p=>fr.find(r=>r.source_route===p);
 assert.match(at('/').title,/Générateur de photos IA gratuit.*3 photos offertes/);
 assert.match(at('/packs/france/').title,/Photo IA en France/);
 assert.match(at('/packs/paris/').title,/Photo IA à Paris/);
 assert.match(at('/blog/photo-ia-realiste/').title,/Photo IA réaliste/);
 assert.match(at('/inscription/').title,/3 photos IA gratuites/);
});
test('published HTML uses revised title and description consistently across sharing metadata',async()=>{
 for(const row of report.rows){
  const file='dist'+maps[row.locale][row.source_route]+'index.html',doc=parse(await readFile(file,'utf8'));
  const found={};function walk(n){if(n.tagName==='title')found.title=n.childNodes.map(c=>c.value||'').join('');if(n.tagName==='meta'){const k=n.attrs.find(a=>['name','property'].includes(a.name))?.value,v=n.attrs.find(a=>a.name==='content')?.value;if(k)found[k]=v;}for(const c of n.childNodes||[])walk(c);}walk(doc);
  assert.equal(found.title,row.title,file);
  for(const key of ['og:title','twitter:title','og:image:alt','twitter:image:alt'])assert.equal(found[key],row.title,file+' '+key);
  for(const key of ['description','og:description','twitter:description'])assert.equal(found[key],row.description,file+' '+key);
 }
});
