import {quotePacks} from '../Promptya_Site/assets/pricing.js';
export const models = [
  {id:'flux-3-image',name:'FLUX 3 Image',slug:'black-forest-labs/flux-3-image',reference:true,referenceRequired:false,lora:false},
  {id:'flux-schnell', name:'FLUX Schnell', slug:'black-forest-labs/flux-schnell', reference:false, lora:false},
  {id:'flux-kontext-pro', name:'FLUX Kontext Pro · référence', slug:'black-forest-labs/flux-kontext-pro', reference:true, lora:false},
  {id:'flux-dev-lora', name:'FLUX Dev LoRA', slug:'black-forest-labs/flux-dev-lora', reference:false, lora:true}
];
export function validateOrder(body, catalog) {
  const model=models.find(m=>m.id===body.model);
  if(!model) throw Error('Modèle non reconnu.');
  if(!Number.isInteger(body.count)||body.count<1||body.count>100) throw Error('Choisissez un nombre entier de 1 à 100.');
  if(!['1:1','3:4','9:16','16:9'].includes(body.ratio)) throw Error('Format non reconnu.');
  const pack=catalog.find(p=>p.slug===body.pack);
  if(body.pack&&!pack) throw Error('Collection introuvable.');
  if(!pack && (typeof body.prompt!=='string'||!body.prompt.trim()||body.prompt.length>6000)) throw Error('Ajoutez un prompt de 1 à 6 000 caractères.');
  if(body.reference && !model.reference) throw Error('Ce modèle ne prend pas de photo de référence.');
  if(model.reference&&model.referenceRequired!==false&&!body.reference) throw Error('Ce modèle nécessite une photo de référence.');
  if(model.id==='flux-3-image'&&body.resolution&&!['768sq','1k','1.5k','2k','4k'].includes(body.resolution))throw Error('Résolution non reconnue.');
  if(body.lora && (!model.lora || !/^https:\/\/huggingface\.co\/.+\.safetensors(?:\?.*)?$/.test(body.lora))) throw Error('LoRA : utilisez un fichier HTTPS .safetensors Hugging Face compatible avec FLUX Dev.');
  if(body.consent!==true) throw Error('Confirmez les droits sur les références et le contenu.');
  return {model:model.id,count:body.count,ratio:body.ratio,pack:pack?.slug||null,prompt:pack?null:body.prompt.trim(),reference:body.reference||null,lora:body.lora||null,resolution:model.id==='flux-3-image'?(body.resolution||'768sq'):null,amount:quotePacks(1).total};
}
export function validateBundle(body,catalog){if(!Array.isArray(body.items))throw Error('Panier invalide.');const quote=quotePacks(body.items.length);const items=body.items.map(input=>{const order=validateOrder(input,catalog);if(!order.pack)throw Error('Un forfait doit contenir des collections identifiées.');return {...order,count:100,amount:quote.unit};});return {items,quote};}
export function predictionInput(order,prompt) {
  const model=models.find(m=>m.id===order.model);
  if(model?.id==='flux-3-image')return {prompt,images:order.reference?[order.reference]:[],aspect_ratio:order.ratio,resolution:order.resolution||'768sq',grounding:false,safety_tolerance:2,output_format:'webp',output_quality:90};
  const input={prompt,aspect_ratio:order.ratio,output_format:'webp'};
  if(model.reference) input.input_image=order.reference;
  else input.num_outputs=1;
  if(order.lora) input.lora_weights=order.lora;
  return input;
}
// ZIP store format: independent files, CRC32 and central directory; no native dependency.
export function zip(files) {
  let offset=0;const chunks=[],central=[];
  for(const file of files){
    const name=Buffer.from(file.name),data=Buffer.from(file.data);let crc=0xffffffff;
    for(const b of data){crc^=b;for(let k=0;k<8;k++)crc=(crc>>>1)^((crc&1)?0xedb88320:0);}crc=(crc^0xffffffff)>>>0;
    const h=Buffer.alloc(30);h.writeUInt32LE(0x04034b50);h.writeUInt16LE(20,4);h.writeUInt32LE(crc,14);h.writeUInt32LE(data.length,18);h.writeUInt32LE(data.length,22);h.writeUInt16LE(name.length,26);
    chunks.push(h,name,data);const c=Buffer.alloc(46);c.writeUInt32LE(0x02014b50);c.writeUInt16LE(20,4);c.writeUInt16LE(20,6);c.writeUInt32LE(crc,16);c.writeUInt32LE(data.length,20);c.writeUInt32LE(data.length,24);c.writeUInt16LE(name.length,28);c.writeUInt32LE(offset,42);central.push(c,name);offset+=h.length+name.length+data.length;
  }
  const cd=Buffer.concat(central),end=Buffer.alloc(22);end.writeUInt32LE(0x06054b50);end.writeUInt16LE(files.length,8);end.writeUInt16LE(files.length,10);end.writeUInt32LE(cd.length,12);end.writeUInt32LE(offset,16);return Buffer.concat([...chunks,cd,end]);
}
