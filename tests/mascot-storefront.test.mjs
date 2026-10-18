import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,stat} from 'node:fs/promises';
import {mascotStorefront} from '../content/mascot-storefront.mjs';
import {mascots} from '../content/mascots.mjs';
import {mascotStoreCopy} from '../content/locales/mascot-store-copy.mjs';
test('redesigned mascot shop preserves exclusive inventory and the existing commercial offer',()=>{const html=mascotStorefront();assert.equal((html.match(/data-mascot-card=/g)||[]).length,15);assert.equal(new Set([...html.matchAll(/data-mascot-card="([^"]+)"/g)].map(m=>m[1])).size,15);assert.equal((html.match(/data-character-filter=/g)||[]).length,6);assert.doesNotMatch(html,/9[,.]99|12 000|4[,.]9\/5|982K|3\.2M|12\.4M|500 personnages|Prompts optimisés/);assert.equal((html.match(/69,90 €/g)||[]).length,15);const sold=mascots[0].slug;assert.ok(!mascotStorefront({[sold]:'sold'}).includes(`data-mascot-card="${sold}"`));});
test('new mascot interface is translated and card portraits are real local assets',async()=>{for(const locale of ['en','es','it','pt','de','nl','br','cz','pl','ja']){const copy=mascotStoreCopy(locale);assert.ok(copy['Rechercher un personnage…']);const html=await readFile(`Promptya_Site/${locale}/viral-trend/index.html`,'utf8');assert.doesNotMatch(html,/>PERSONNAGES<|PRÊTS À L’EMPLOI|Femmes délirantes|Un seul acquéreur par personnage|Aucun personnage ne correspond/);assert.ok(html.includes('/assets/mascot-store.css'));}for(const m of mascots)assert.ok((await stat(`Promptya_Site/assets/mascot-store/${m.slug}.webp`)).size>1000);});
