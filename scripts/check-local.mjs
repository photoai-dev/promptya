import assert from 'node:assert/strict';
const origin='http://127.0.0.1:3000';
for(const path of ['/','/packs/','/packs/paris/','/categories/voyage/','/studio/','/commandes/','/admin/','/compte/','/assets/premium.css']){const r=await fetch(origin+path);assert.equal(r.status,200,path);}
const config=await fetch(origin+'/api/config');const cookie=config.headers.get('set-cookie').split(';')[0];assert.equal((await config.json()).mode,'demo');
const headers={'Content-Type':'application/json',Cookie:cookie};
const input={count:1,model:'flux-schnell',ratio:'1:1',pack:'paris',consent:true};
const invalid=await fetch(origin+'/api/orders',{method:'POST',headers,body:JSON.stringify({...input,count:101})});assert.equal(invalid.status,400);
const created=await fetch(origin+'/api/orders',{method:'POST',headers,body:JSON.stringify(input)});assert.equal(created.status,201);const {id}=await created.json();
const others=await fetch(origin+'/api/orders').then(r=>r.json());assert.ok(!others.some(o=>o.id===id),'session isolation');
await new Promise(r=>setTimeout(r,8500));
const orders=await fetch(origin+'/api/orders',{headers}).then(r=>r.json());assert.equal(orders.find(o=>o.id===id).status,'completed');
const denied=await fetch(origin+'/api/download/'+id);assert.equal(denied.status,404);
const archive=await fetch(origin+'/api/download/'+id,{headers});assert.equal(archive.status,200);const data=Buffer.from(await archive.arrayBuffer());assert.equal(data.readUInt32LE(0),0x04034b50);assert.ok(data.includes(Buffer.from('DEMONSTRATION.txt')));
console.log('HTTP: 9 pages/assets OK; invalid quantity rejected; session isolation OK; asynchronous demo and ZIP download OK.');
