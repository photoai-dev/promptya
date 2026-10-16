import {randomBytes,scryptSync} from 'node:crypto';import {readFile,writeFile} from 'node:fs/promises';
let source='';try{source=await readFile('.env','utf8');}catch(e){if(e.code!=='ENOENT')throw e;}
if(/^ADMIN_PASSWORD_HASH=.+$/m.test(source))throw Error('Un accès existe déjà. Aucun mot de passe modifié.');
const password='Pya!'+randomBytes(15).toString('base64url'),salt=randomBytes(24).toString('hex'),hash=scryptSync(password,salt,64).toString('hex');
if(!/^APP_URL=/m.test(source))source+='\nAPP_URL=http://127.0.0.1:3000\n';
source+=`\nADMIN_LOGIN=admin\nADMIN_PASSWORD_HASH=${salt}:${hash}\nADMIN_SESSION_SECRET=${randomBytes(48).toString('hex')}\n`;
await writeFile('.env',source,{mode:0o600});console.log(JSON.stringify({login:'admin',password}));
