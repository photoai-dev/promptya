// Export only public routes and artwork references for the offline image optimiser.
import {readdir,readFile,mkdir} from 'node:fs/promises';
import {writeFile} from '../lib/fs-safe.mjs';
import {socialSource,socialAsset} from '../content/social-images.mjs';
const config=JSON.parse(await readFile('content/locales/config.json','utf8'));
const catalog=JSON.parse(await readFile('Promptya_Site/assets/catalog.json','utf8'));
const images=[];
async function scan(dir,path='/'){
 for(const item of await readdir(dir,{withFileTypes:true})){
  if(item.isDirectory()){
   if(['assets','admin','connexion-admin',...config.enabled.filter(l=>l!=='fr')].includes(item.name))continue;
   await scan(dir+'/'+item.name,path+item.name+'/');
  }else if(item.name==='index.html')images.push({path,source:'Promptya_Site'+socialSource(path,catalog),output:'Promptya_Site'+socialAsset(path)});
 }
}
await scan('Promptya_Site');await mkdir('.local',{recursive:true});
await writeFile('.local/social-assets.json',JSON.stringify(images));
console.log(images.length+' sharing images queued.');
