import {validateEditorialPatch} from './editorial.mjs';
import {createHmac,timingSafeEqual,randomUUID} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {models,validateOrder,validateBundle,predictionInput,zip} from './core.mjs';
import {quotePacks} from '../Promptya_Site/assets/pricing.js';
import {createMascotService} from './mascot-sales.mjs';
import {mascots} from '../content/mascots.mjs';
import {createPreviewService} from './previews.mjs';
import {adminSession,verifyAdmin} from './admin-access.mjs';
import {assertGenerationBudget,generationAvailability} from './generation-policy.mjs';
import {authRoute,customer} from './customer-auth.mjs';
import {paymentRecord} from './payments.mjs';
const env=process.env;
const required=['SUPABASE_URL','SUPABASE_ANON_KEY','SUPABASE_SERVICE_ROLE_KEY','APP_URL'];
const configured=()=>required.every(k=>env[k]);
async function jsonFetch(url,options={}){const r=await fetch(url,{...options,signal:AbortSignal.timeout(20000)});const text=await r.text();let data;try{data=JSON.parse(text);}catch{data=text;}if(!r.ok)throw Error(`Service externe (${r.status})`);return data;}
async function recordPayment(session,owner){return jsonFetch(env.SUPABASE_URL+'/rest/v1/payments?on_conflict=stripe_session',{method:'POST',headers:{apikey:env.SUPABASE_SERVICE_ROLE_KEY,Authorization:'Bearer '+env.SUPABASE_SERVICE_ROLE_KEY,'Content-Type':'application/json',Prefer:'resolution=ignore-duplicates,return=minimal'},body:JSON.stringify(paymentRecord(session,owner))});}
export async function db(path,method='GET',body){return jsonFetch(env.SUPABASE_URL+'/rest/v1/'+path,{method,headers:{apikey:env.SUPABASE_SERVICE_ROLE_KEY,Authorization:'Bearer '+env.SUPABASE_SERVICE_ROLE_KEY,'Content-Type':'application/json',Prefer:'return=representation'},...(body!==undefined?{body:JSON.stringify(body)}:{})});}
async function user(req){const bearer=req.headers.authorization;if(!bearer?.startsWith('Bearer '))throw Error('Connectez-vous pour accéder à vos commandes.');return jsonFetch(env.SUPABASE_URL+'/auth/v1/user',{headers:{apikey:env.SUPABASE_ANON_KEY,Authorization:bearer}});}
async function storage(path,data,type){const r=await fetch(env.SUPABASE_URL+'/storage/v1/object/'+path,{method:'POST',headers:{Authorization:'Bearer '+env.SUPABASE_SERVICE_ROLE_KEY,apikey:env.SUPABASE_SERVICE_ROLE_KEY,'Content-Type':type,'x-upsert':'true'},body:data,signal:AbortSignal.timeout(20000)});if(!r.ok)throw Error('Stockage indisponible');}
async function signed(path){const d=await jsonFetch(env.SUPABASE_URL+'/storage/v1/object/sign/'+path,{method:'POST',headers:{Authorization:'Bearer '+env.SUPABASE_SERVICE_ROLE_KEY,'Content-Type':'application/json'},body:JSON.stringify({expiresIn:600})});return env.SUPABASE_URL+'/storage/v1'+d.signedURL;}
export function verifyStripe(raw,header,secret,now=Date.now()){
  const parts=(header||'').split(',');const time=parts.find(s=>s.startsWith('t='))?.slice(2);if(!time||!/^\d+$/.test(time)||Math.abs(now/1000-Number(time))>300)return false;
  const hash=createHmac('sha256',secret).update(time+'.').update(raw).digest();return parts.filter(s=>s.startsWith('v1=')).some(s=>{const b=Buffer.from(s.slice(3),'hex');return b.length===hash.length&&timingSafeEqual(hash,b);});
}
let catalogCache;async function catalog(){return catalogCache??=(await db('collections?published=eq.true&select=slug,name,category,image,prompt_count')).map(p=>({...p,promptCount:p.prompt_count}));}
async function internalPrompts(slug){const rows=await db('collection_prompts?collection_slug=eq.'+encodeURIComponent(slug)+'&select=content&order=position');if(!rows.length)throw Error('Collection interne non importée dans Supabase.');return rows.map(r=>r.content);}
async function uploadReference(reference,userId){if(!reference)return null;const m=reference.match(/^data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+/=]+)$/);if(!m)throw Error('Référence invalide');const data=Buffer.from(m[2],'base64');if(data.length>4*1024*1024)throw Error('Référence trop volumineuse');const path=`${userId}/${randomUUID()}.${m[1]}`;await storage('references/'+path,data,'image/'+m[1]);return path;}
async function owned(id,u){if(!/^[a-f0-9-]{36}$/.test(id||''))throw Error('Commande invalide');const rows=await db(`orders?id=eq.${id}&user_id=eq.${u.id}`);if(!rows[0])throw Error('Commande introuvable');return rows[0];}
const previews=createPreviewService({db,jsonFetch,storage,signed,catalog,internalPrompts,env});
const mascotSales=createMascotService({db,jsonFetch,storage,internalPrompts,env,mascots,recordPayment});
export async function handler(req,res){
  const url=new URL(req.url,env.APP_URL||'http://localhost');const route=url.pathname.replace(/^\/api\//,'');
  const send=(status,data)=>{res.setHeader('Cache-Control','no-store');res.status(status).json(data);};
  try{
    if(route==='admin-session')return await adminSession(req,res);
    if(route.startsWith('auth/'))return await authRoute(route,req,res,env);
    if(route==='config')return send(200,{mode:configured()?'cloud':'unconfigured',generationAvailable:generationAvailability()&&!!env.REPLICATE_API_TOKEN,models:models.filter(m=>m.id==='flux-3-image'),integrations:{github:'Source du projet',vercel:'Hébergement',supabase:configured()?'Configuré — connexion à tester':'À configurer',replicate:env.REPLICATE_API_TOKEN?'Clé renseignée — à tester':'Clé absente',stripe:env.STRIPE_SECRET_KEY?'Clé renseignée — à tester':'Clé absente'}});
    if(!configured())return send(503,{error:'Le service est temporairement indisponible. Merci de réessayer plus tard.'});
    if(route==='catalog'&&req.method==='GET')return send(200,await catalog());
    if(route==='mascots'&&req.method==='GET')return send(200,await mascotSales.inventory());
    if(route==='examples'&&req.method==='GET')return send(200,await previews.public(url.searchParams.get('pack')));
    if(route==='covers'&&req.method==='POST')return send(503,{error:'Le tarif du générateur de covers sera défini séparément. Aucune génération payante n’est activée.'});
    if(req.method==='POST'&&route!=='stripe-webhook'&&req.headers.origin!==new URL(env.APP_URL).origin)return send(403,{error:'Origine non autorisée'});
    if(route==='login'&&req.method==='POST'){const {email}=req.body;if(typeof email!=='string'||email.length>254)return send(400,{error:'Adresse invalide'});await jsonFetch(env.SUPABASE_URL+'/auth/v1/otp?redirect_to='+encodeURIComponent(env.APP_URL+'/compte/'),{method:'POST',headers:{apikey:env.SUPABASE_ANON_KEY,'Content-Type':'application/json'},body:JSON.stringify({email,create_user:true})});return send(200,{ok:true});}
    if(route==='stripe-webhook'&&req.method==='POST'){
      if(!env.STRIPE_WEBHOOK_SECRET)return send(503,{error:'Webhook non configuré'});
      const chunks=[];for await(const c of req)chunks.push(c);const raw=Buffer.concat(chunks);
      if(!verifyStripe(raw,req.headers['stripe-signature'],env.STRIPE_WEBHOOK_SECRET))return send(400,{error:'Signature invalide'});
      const event=JSON.parse(raw),s=event.data.object;
      if(event.type==='charge.refunded'&&typeof s.payment_intent==='string'){await db('payments?stripe_payment_intent=eq.'+encodeURIComponent(s.payment_intent),'PATCH',{status:s.amount_refunded>=s.amount?'refunded':'partially_refunded',updated_at:new Date().toISOString()});return send(200,{received:true});}
      if(s.metadata?.mascot_purchase_id&&['checkout.session.completed','checkout.session.expired'].includes(event.type)){await mascotSales.event(event);return send(200,{received:true});}
      if(['checkout.session.completed','checkout.session.async_payment_succeeded'].includes(event.type)&&s.payment_status==='paid'){
        if(s.metadata.bundle_id){const id=s.metadata.bundle_id;if(!/^[a-f0-9-]{36}$/.test(id))return send(400,{error:'Forfait invalide'});const [bundle]=await db('pack_bundles?id=eq.'+id);if(!bundle||bundle.stripe_session!==s.id||s.amount_total!==bundle.amount||s.currency!=='eur')return send(400,{error:'Paiement du forfait incohérent'});const orders=await db('orders?bundle_id=eq.'+id),jobs=[];for(const o of orders){const prompts=await internalPrompts(o.pack);for(let i=0;i<o.count;i++)jobs.push({order_id:o.id,position:i,prompt:prompts[i%prompts.length]});}await db('rpc/confirm_bundle_payment','POST',{p_event:event.id,p_bundle:id,p_session:s.id,p_jobs:jobs});await recordPayment(s,{user_id:bundle.user_id,bundle_id:id});return send(200,{received:true});}
        const rows=await db(`orders?id=eq.${s.metadata.order_id}`),o=rows[0];
        if(!o||s.amount_total!==o.amount||s.currency!=='eur'||s.id!==o.stripe_session)return send(400,{error:'Paiement incohérent'});
        const prompts=o.pack?await internalPrompts(o.pack):[o.prompt];const jobs=Array.from({length:o.count},(_,i)=>({position:i,prompt:prompts[i%prompts.length]}));
        await db('rpc/confirm_payment','POST',{p_event:event.id,p_order:o.id,p_session:s.id,p_jobs:jobs});
        await recordPayment(s,{user_id:o.user_id,order_id:o.id});
      }return send(200,{received:true});
    }
    if(route==='worker'&&req.method==='GET'){
      if(!env.CRON_SECRET||req.headers.authorization!=='Bearer '+env.CRON_SECRET)return send(401,{error:'Accès réservé'});
      if(!env.REPLICATE_API_TOKEN)return send(503,{error:'Replicate non configuré'});
      const previewWork=previews.work().then(result=>({result})).catch(e=>({error:e.message}));
      const jobs=await db('rpc/claim_jobs','POST',{p_limit:3});
      await Promise.all(jobs.map(async j=>{
        try{const [o]=await db('orders?id=eq.'+j.order_id);const model=models.find(m=>m.id===o.model);const headers={Authorization:'Bearer '+env.REPLICATE_API_TOKEN,'Content-Type':'application/json'};
          if(!j.prediction_id){assertGenerationBudget(o);if(j.status==='processing')throw Error('Création interrompue : vérifier Replicate avant relance manuelle.');await db('image_jobs?id=eq.'+j.id,'PATCH',{status:'processing'});let reference=o.reference;if(reference)reference=await signed('references/'+reference);const p=await jsonFetch(`https://api.replicate.com/v1/models/${model.slug}/predictions`,{method:'POST',headers,body:JSON.stringify({input:predictionInput({...o,reference},j.prompt)})});await db('image_jobs?id=eq.'+j.id,'PATCH',{prediction_id:p.id,status:'processing',lease_until:null});await db('orders?id=eq.'+o.id,'PATCH',{status:'processing'});return;}
          const p=await jsonFetch('https://api.replicate.com/v1/predictions/'+j.prediction_id,{headers});
          if(p.status==='succeeded'){const output=Array.isArray(p.output)?p.output[0]:p.output;const u=new URL(output);if(u.protocol!=='https:'||!u.hostname.endsWith('.replicate.delivery'))throw Error('URL de sortie invalide');const r=await fetch(output,{signal:AbortSignal.timeout(15000)});if(!r.ok)throw Error('Téléchargement Replicate impossible');const data=Buffer.from(await r.arrayBuffer());const path=`${o.user_id}/${o.id}/${j.position}.webp`;await storage('outputs/'+path,data,'image/webp');await db('image_jobs?id=eq.'+j.id,'PATCH',{status:'completed',output_path:path,lease_until:null});}
          else if(['failed','canceled'].includes(p.status))throw Error('Génération échouée chez Replicate');else await db('image_jobs?id=eq.'+j.id,'PATCH',{lease_until:null});
        }catch(e){await db('image_jobs?id=eq.'+j.id,'PATCH',{status:'failed',error:e.message,lease_until:null});await db('orders?id=eq.'+j.order_id,'PATCH',{status:'failed'});}
      }));
      for(const id of new Set(jobs.map(j=>j.order_id))){const all=await db('image_jobs?order_id=eq.'+id);if(all.length&&all.every(j=>j.status==='completed'))await db('orders?id=eq.'+id,'PATCH',{status:'completed'});}
      return send(200,{processed:jobs.length,previews:await previewWork});
    }
    const u=route==='admin'||route.startsWith('admin/')?(await verifyAdmin(req)).user:await customer(req,res,env);
    if(route==='mascots/checkout'&&req.method==='POST')return send(200,await mascotSales.checkout(u,req.body));
    if(route==='payments'&&req.method==='GET')return send(200,await db('payments?user_id=eq.'+u.id+'&select=id,amount,currency,status,created_at,order_id,bundle_id,mascot_purchase_id&order=created_at.desc'));
    if(route==='admin/editorial'&&req.method==='GET'){const locale=url.searchParams.get('locale')||'fr';if(!['fr','en','es','it','pt','de'].includes(locale))return send(400,{error:'Langue invalide.'});const path=url.searchParams.get('page');return send(200,await db('editorial_pages?locale=eq.'+locale+(path?'&source_route=eq.'+encodeURIComponent(path):'&select=source_route,locale,kind,title,revision,updated_at')+'&order=source_route&limit=500'));}
    if(route==='admin/editorial'&&req.method==='POST'){if(req.headers.origin!==new URL(env.APP_URL).origin)return send(403,{error:'Origine non autorisée.'});const patch=validateEditorialPatch(req.body);const rows=await db('editorial_pages?locale=eq.'+req.body.locale+'&source_route=eq.'+encodeURIComponent(req.body.source_route)+'&revision=eq.'+req.body.revision,'PATCH',patch);return rows.length?send(200,rows[0]):send(409,{error:'Cette page a changé. Rechargez-la avant de modifier.'});}
    if(route==='admin/previews'&&req.method==='GET')return send(200,await previews.list(u));
    if(route==='admin/previews'&&req.method==='POST')return send(201,await previews.enqueue(u,req.body.pack));
    if(route==='admin/previews/publish'&&req.method==='POST')return send(200,await previews.publish(u,req.body.batchId));
    if(route==='bundles'&&req.method==='POST'){
      const raw={items:req.body.items?.map(i=>({...i,reference:req.body.reference||null,consent:req.body.consent===true}))};const {items}=validateBundle(raw,await catalog());items.forEach(assertGenerationBudget);for(const pack of new Set(items.map(i=>i.pack)))await internalPrompts(pack);const reference=await uploadReference(req.body.reference,u.id);items.forEach(i=>i.reference=reference);const bundle=await db('rpc/create_pack_bundle','POST',{p_user:u.id,p_items:items});return send(201,bundle);
    }
    if(route==='bundle-checkout'&&req.method==='POST'){
      assertGenerationBudget({model:'flux-3-image'});
      if(!env.STRIPE_SECRET_KEY||!env.STRIPE_WEBHOOK_SECRET||!env.REPLICATE_API_TOKEN||!env.CRON_SECRET)return send(503,{error:'Configurez Stripe, Replicate et le worker avant le paiement.'});
      const id=req.body.bundleId;if(!/^[a-f0-9-]{36}$/.test(id||''))throw Error('Forfait invalide');const [bundle]=await db(`pack_bundles?id=eq.${id}&user_id=eq.${u.id}`);if(!bundle||bundle.status!=='awaiting_payment')throw Error('Forfait introuvable ou déjà réglé');const quote=quotePacks(bundle.pack_count);if(bundle.amount!==quote.total||bundle.unit_amount!==quote.unit)throw Error('Tarif du forfait incohérent');
      const form=new URLSearchParams({mode:'payment',success_url:env.APP_URL+'/commandes/?paid=1',cancel_url:env.APP_URL+'/commandes/','metadata[bundle_id]':id,'line_items[0][price_data][currency]':'eur','line_items[0][price_data][unit_amount]':String(quote.unit),'line_items[0][price_data][product_data][name]':'Promptya — pack de 100 photos','line_items[0][quantity]':String(quote.packs)});const s=await jsonFetch('https://api.stripe.com/v1/checkout/sessions',{method:'POST',headers:{Authorization:'Bearer '+env.STRIPE_SECRET_KEY,'Content-Type':'application/x-www-form-urlencoded','Idempotency-Key':'bundle-'+id},body:form.toString()});await db('pack_bundles?id=eq.'+id,'PATCH',{stripe_session:s.id});return send(200,{url:s.url});
    }
    if(route==='orders'&&req.method==='POST'){
      const input=validateOrder(req.body,await catalog());assertGenerationBudget(input);if(input.pack)await internalPrompts(input.pack);
      input.reference=await uploadReference(input.reference,u.id);
      const [order]=await db('orders','POST',{...input,user_id:u.id});return send(201,{id:order.id});
    }
    if(['orders','admin'].includes(route)&&req.method==='GET'){
      if(route==='admin'&&!u.passwordAdmin&&!(await db('admins?user_id=eq.'+u.id)).length)return send(403,{error:'Compte administrateur requis'});
      const rows=await db('orders?select=id,bundle_id,kind,mascot_slug,created_at,status,count,amount,model,ratio,pack&order=created_at.desc&limit=100'+(route==='orders'?'&user_id=eq.'+u.id:''));
      for(const o of rows){const j=await db('image_jobs?select=status&order_id=eq.'+o.id);o.progress=j.filter(j=>j.status==='completed').length;}
      return send(200,rows);
    }
    if(route==='checkout'&&req.method==='POST'){
      assertGenerationBudget({model:'flux-3-image'});
      if(!env.STRIPE_SECRET_KEY||!env.STRIPE_WEBHOOK_SECRET||!env.REPLICATE_API_TOKEN||!env.CRON_SECRET)return send(503,{error:'Paiement désactivé : configurez Stripe, Replicate et le worker.'});const o=await owned(req.body.orderId,u);if(o.status!=='awaiting_payment')throw Error('Commande déjà réglée');if(o.kind==='mascot')throw Error('Utilisez le paiement exclusif de la mascotte.');if(o.bundle_id)throw Error('Réglez ce pack depuis son forfait.');o.amount=quotePacks(1).total;await db('orders?id=eq.'+o.id,'PATCH',{amount:o.amount});
      const form=new URLSearchParams({mode:'payment',success_url:env.APP_URL+'/commandes/?paid=1',cancel_url:env.APP_URL+'/commandes/','metadata[order_id]':o.id,'line_items[0][price_data][currency]':'eur','line_items[0][price_data][unit_amount]':String(o.amount),'line_items[0][price_data][product_data][name]':'Promptya — pack de '+o.count+' images','line_items[0][quantity]':'1'});
      const s=await jsonFetch('https://api.stripe.com/v1/checkout/sessions',{method:'POST',headers:{Authorization:'Bearer '+env.STRIPE_SECRET_KEY,'Content-Type':'application/x-www-form-urlencoded','Idempotency-Key':'checkout-'+o.id},body:form.toString()});await db('orders?id=eq.'+o.id,'PATCH',{stripe_session:s.id});return send(200,{url:s.url});
    }
    if(route==='download'&&req.method==='GET'){
      const o=await owned(url.searchParams.get('id'),u);if(o.status!=='completed')throw Error('Lot non terminé');
      if(!o.zip_path){const jobs=await db('image_jobs?order_id=eq.'+o.id+'&order=position');const files=[];for(const j of jobs){const r=await fetch(await signed('outputs/'+j.output_path),{signal:AbortSignal.timeout(15000)});if(!r.ok)throw Error('Image indisponible');files.push({name:`image-${j.position+1}.webp`,data:Buffer.from(await r.arrayBuffer())});}const path=`${u.id}/${o.id}/pack.zip`;await storage('outputs/'+path,zip(files),'application/zip');await db('orders?id=eq.'+o.id,'PATCH',{zip_path:path});o.zip_path=path;}return send(200,{url:await signed('outputs/'+o.zip_path)});
    }
    return send(404,{error:'Route introuvable'});
  }catch(e){return send(400,{error:e.message});}
}
