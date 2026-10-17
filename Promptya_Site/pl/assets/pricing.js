export const PACK_PRICES=Object.freeze({1:2290,2:1990,3:1690,4:1490});
export function quotePacks(count){if(!Number.isInteger(count)||count<1||count>4)throw Error("Wybierz od 1 do 4 pakietów.");return {packs:count,unit:PACK_PRICES[count],total:count*PACK_PRICES[count],images:100*count,saving:count*(PACK_PRICES[1]-PACK_PRICES[count])};}
export const euros=cents=>(cents/100).toLocaleString('pl-PL',{minimumFractionDigits:2,maximumFractionDigits:2})+' €';
