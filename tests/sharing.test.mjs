import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,stat} from 'node:fs/promises';
import {socialAsset} from '../content/social-images.mjs';
const root='Promptya_Site';
test('each public language page has one matching JPEG sharing image and browser icons',async()=>{
 const config=JSON.parse(await readFile('content/locales/config.json','utf8'));
 const routes=JSON.parse(await readFile(root+'/en/routes.json','utf8'));
 for(const locale of config.enabled){
  const map=locale==='fr'?Object.fromEntries(Object.keys(routes).map(p=>[p,p])):JSON.parse(await readFile(root+'/'+locale+'/routes.json','utf8'));
  for(const [source,path] of Object.entries(map)){
   const html=await readFile(root+path+'index.html','utf8');
   const image='https://promptya.app'+socialAsset(source);
   assert.equal([...html.matchAll(/property="og:image"/g)].length,1,path);
   assert.ok(html.includes(`property="og:image" content="${image}"`),path);
   assert.ok(html.includes(`name="twitter:image" content="${image}"`),path);
   assert.ok(html.includes('property="og:image:width" content="1200"'),path);
   assert.ok(html.includes('property="og:image:height" content="630"'),path);
   assert.ok(html.includes('href="/favicon.svg"'),path);
   assert.ok(html.includes('href="/favicon.ico"'),path);
   assert.ok(html.includes('href="/apple-touch-icon.png"'),path);
   assert.ok((await stat(root+socialAsset(source))).size>1000,path);
  }
 }
});
test('specific packs and articles do not share the generic home image',()=>{
 assert.notEqual(socialAsset('/packs/miami/'),socialAsset('/'));
 assert.notEqual(socialAsset('/packs/miami/'),socialAsset('/packs/milan/'));
 assert.notEqual(socialAsset('/blog/formats-photo-ia/'),socialAsset('/guides/'));
});
