import {quotePacks} from './pricing.js';
const key='promptya_cart_v1';
export function getCart(){try{const data=JSON.parse(localStorage.getItem(key)||'[]');return Array.isArray(data)?data.filter(x=>typeof x.pack==='string').slice(0,4):[];}catch{return [];}}
export function saveCart(items){if(items.length>4)throw Error("Um pacote contém no máximo quatro pacotes.");localStorage.setItem(key,JSON.stringify(items));window.dispatchEvent(new Event('promptya-cart'));return items;}
export function addPack(pack){const items=getCart();if(items.length>=4)throw Error("Seu pacote já contém quatro pacotes. Você pode modificar sua cesta.");items.push({id:crypto.randomUUID(),pack,model:'flux-schnell',ratio:'3:4',count:100});saveCart(items);return quotePacks(items.length);}
