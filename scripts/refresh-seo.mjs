import {readFile,mkdir} from 'node:fs/promises';
import {writeFile} from '../lib/fs-safe.mjs';
import {seoMetadata,seoLocales,titleUnits,trialOffer} from '../content/seo-copy.mjs';
import {reviewedAdditionalCopy} from '../content/locales/pl-ja-copy.mjs';
const path='content/locales/editorial-snapshot.json';
const records=JSON.parse(await readFile(path,'utf8'));
const catalog=JSON.parse(await readFile('Promptya_Site/assets/catalog.json','utf8'));
const report=[],patches=[];
for(const locale of seoLocales){
 const dictionary=locale==='fr'?{}:{...JSON.parse(await readFile(`content/locales/${locale}.json`,'utf8')),...JSON.parse(await readFile(`content/locales/${locale}-overrides.json`,'utf8'))};
 if(['pl','ja'].includes(locale))Object.assign(dictionary,reviewedAdditionalCopy(locale,dictionary));
 for(const r of records.filter(r=>r.locale===locale)){
  const meta=seoMetadata(r.source_route,locale,dictionary,r,catalog);
  if(meta.title!==r.title||meta.description!==r.description)patches.push({locale,source_route:r.source_route,before_title:r.title,before_description:r.description,title:meta.title,description:meta.description});
  Object.assign(r,{title:meta.title,description:meta.description});
  report.push({locale,source_route:r.source_route,...meta,titleUnits:titleUnits(meta.title),descriptionCharacters:meta.description.length});
 }
}
await writeFile(path,JSON.stringify(records));await mkdir('.local',{recursive:true});
await writeFile('.local/seo-patches.json',JSON.stringify(patches));
await writeFile('content/seo-audit.json',JSON.stringify({trialOffer,rows:report},null,2)+'\n');
console.log(JSON.stringify({pages:report.length,changed:patches.length,longestTitle:Math.max(...report.map(r=>r.titleUnits)),longestDescription:Math.max(...report.map(r=>r.descriptionCharacters))}));
console.log(report.filter(r=>r.locale==='fr'&&['/','/packs/france/','/packs/paris/','/guides/','/blog/photo-ia-realiste/'].includes(r.source_route)));
