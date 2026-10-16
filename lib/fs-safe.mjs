import {readFile,writeFile as rawWrite,rename,unlink} from 'node:fs/promises';
import {randomUUID} from 'node:crypto';
import {resolve} from 'node:path';
// Atomic page replacement avoids partially read HTML during live reload on Windows.
export async function writeFile(path,data){
 const actual=path instanceof URL?path:resolve(path);
 try{if((await readFile(actual)).equals(Buffer.from(data)))return;}catch(e){if(e.code!=='ENOENT')throw e;}
 const tempPath=actual instanceof URL?new URL(actual.href+'.building-'+randomUUID()):actual+'.building-'+randomUUID();
 await rawWrite(tempPath,data);
 for(let attempt=0;;attempt++){try{await rename(tempPath,actual);return;}catch(e){if(attempt>=8||!['EPERM','EBUSY','EACCES','UNKNOWN'].includes(e.code)){await unlink(tempPath).catch(()=>{});throw e;}await new Promise(r=>setTimeout(r,70+attempt*70));}}
}
