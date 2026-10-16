import assert from 'node:assert/strict';import {articles} from '../content/blog.mjs';
const origin='http://127.0.0.1:3000';
for(const path of ['/admin/','/admin/index.html','/admin/recadrage/','/api/admin-page?path=recadrage']){const r=await fetch(origin+path);assert.equal(r.status,401,path);const html=await r.text();assert.ok(!html.includes('admin-previews'));assert.ok(!html.includes('id="crop-canvas"'));assert.match(r.headers.get('cache-control'),/no-store/);}
for(const a of articles){const r=await fetch(origin+'/blog/'+a.slug+'/');assert.equal(r.status,200);assert.ok((await r.text()).includes(a.sections[0][1]));}
const config=await fetch(origin+'/api/config').then(r=>r.json());assert.notEqual(config.mode,'demo');
const order=await fetch(origin+'/api/orders',{method:'POST',headers:{'Content-Type':'application/json',Origin:origin},body:JSON.stringify({pack:'paris',model:'flux-schnell',count:100,ratio:'1:1',consent:true})});assert.notEqual(order.status,201,'An anonymous visitor cannot create an order.');
for(const path of ['/.env','/private/catalog.json','/.server-ui/admin/index.html'])assert.equal((await fetch(origin+path)).status,404,path);
console.log('HTTP : administration bloquée sans session, 30 articles HTML accessibles, aucun mode démo, fichiers privés inaccessibles.');
