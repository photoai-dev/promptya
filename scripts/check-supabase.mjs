import assert from 'node:assert/strict';try{process.loadEnvFile('.env');}catch{}
const base=process.env.SUPABASE_URL,key=process.env.SUPABASE_ANON_KEY;if(!base||!key)throw Error('Projet Supabase non relié.');
const request=path=>fetch(base+path,{headers:{apikey:key},signal:AbortSignal.timeout(20000)});
const catalog=await request('/rest/v1/collections?select=slug');assert.equal(catalog.status,200);assert.equal((await catalog.json()).length,106);
const privateLibrary=await request('/rest/v1/collection_prompts?select=content&limit=1');assert.ok([401,403].includes(privateLibrary.status));
const auth=await request('/auth/v1/settings');assert.equal(auth.status,200);const settings=await auth.json();console.log(JSON.stringify({catalogCollections:106,privateLibraryDenied:privateLibrary.status,emailAuth:settings.external?.email,signupDisabled:settings.disable_signup}));
