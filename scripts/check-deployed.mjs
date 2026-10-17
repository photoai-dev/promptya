import assert from 'node:assert/strict';
const origin='https://promptya.app';
for(const path of ['/','/blog/','/blog/shooting-paris-ia/','/packs/','/admin/','/admin/recadrage/','/connexion-admin/','/api/config']){
 const r=await fetch(origin+path,{signal:AbortSignal.timeout(20000)}),text=await r.text();
 assert.equal(r.status,path.startsWith('/admin/')?401:200,path);
 if(path==='/blog/')assert.equal((text.match(/class="journal-card"/g)||[]).length,30);
 if(path.startsWith('/admin/')){assert.ok(!text.includes('admin-previews'));assert.match(r.headers.get('cache-control'),/no-store/);}
 console.log(JSON.stringify({path,status:r.status,title:text.match(/<title>(.*?)<\/title>/)?.[1],...(path==='/api/config'?{mode:JSON.parse(text).mode}:{})}));
}
