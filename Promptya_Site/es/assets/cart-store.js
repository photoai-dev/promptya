import {quotePacks} from './pricing.js';
const key='promptya_cart_v1';
export function getCart(){try{const data=JSON.parse(localStorage.getItem(key)||'[]');return Array.isArray(data)?data.filter(x=>typeof x.pack==='string').slice(0,4):[];}catch{return [];}}
export function saveCart(items){if(items.length>4)throw Error("Un paquete contiene un máximo de cuatro paquetes.");localStorage.setItem(key,JSON.stringify(items));window.dispatchEvent(new Event('promptya-cart'));return items;}
export function addPack(pack){const items=getCart();if(items.length>=4)throw Error("Su paquete ya contiene cuatro paquetes. Puedes modificar tu cesta.");items.push({id:crypto.randomUUID(),pack,model:'flux-schnell',ratio:'3:4',count:100});saveCart(items);return quotePacks(items.length);}
