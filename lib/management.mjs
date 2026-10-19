import {generationAvailability,generationPolicy} from './generation-policy.mjs';
const fail=(message,status=400)=>Object.assign(Error(message),{status});
const uuid=value=>{if(!/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(value||''))throw fail('Identifiant invalide.');return value;};
const statuses=['awaiting_payment','queued','processing','completed','failed'];
const orderFields='id,user_id,bundle_id,kind,mascot_slug,created_at,status,count,amount,model,ratio,pack';
export function pageOptions(url){const page=Number(url.searchParams.get('page')||1);if(!Number.isSafeInteger(page)||page<1||page>10000)throw fail('Page invalide.');return {page,offset:(page-1)*25};}
export function profilePatch(body){if(typeof body?.display_name!=='string'||body.display_name.trim().length>100)throw fail('Nom invalide.');return {display_name:body.display_name.trim(),updated_at:new Date().toISOString()};}
export function createManagement({db,count,signed,env,clearCatalog=()=>{},rebuild,directory}){
 async function orders(url,owner){const {page,offset}=pageOptions(url),status=url.searchParams.get('status');if(status&&!statuses.includes(status))throw fail('Statut invalide.');const id=url.searchParams.get('id');if(id)uuid(id);const filter=(owner?'&user_id=eq.'+uuid(owner):'')+(status?'&status=eq.'+status:'')+(id?'&id=eq.'+id:'');const rows=await db('orders?select='+orderFields+filter+'&order=created_at.desc,id.desc&limit=26&offset='+offset);const hasNext=rows.length>25,items=rows.slice(0,25);if(items.length){const jobs=await db('image_jobs?select=order_id,status&order_id=in.('+items.map(o=>uuid(o.id)).join(',')+')');for(const o of items)o.progress=jobs.filter(j=>j.order_id===o.id&&j.status==='completed').length;}return {items:items.map(({user_id,...o})=>owner?o:{...o,user_id}),page,hasNext};}
 async function detail(id,owner){uuid(id);const [order]=await db('orders?select='+orderFields+'&id=eq.'+id+(owner?'&user_id=eq.'+uuid(owner):''));if(!order)throw fail('Commande introuvable.',404);const jobs=await db('image_jobs?select=id,position,status,output_path'+(owner?'':',error,prediction_id')+'&order_id=eq.'+id+'&order=position');return {order,jobs:await Promise.all(jobs.map(async({output_path,...j})=>({...j,...(output_path&&j.status==='completed'?{url:await signed('outputs/'+output_path)}:{})})))};}
 return async function(route,req,url,u){
 if(route==='account/profile'){
  if(req.method==='GET'){const [profile]=await db('profiles?id=eq.'+uuid(u.id)+'&select=display_name,created_at');return {...profile,email:u.email};}
  if(req.method==='POST'){const patch=profilePatch(req.body);const rows=await db('profiles?id=eq.'+uuid(u.id),'PATCH',patch);if(!rows.length)await db('profiles','POST',{id:u.id,...patch});return patch;}
 }
 if(route==='account/orders'&&req.method==='GET')return orders(url,u.id);
 if(route==='account/summary'&&req.method==='GET'){const id=uuid(u.id),[total,active,completed]=await Promise.all([count('orders?user_id=eq.'+id),count('orders?user_id=eq.'+id+'&status=in.(queued,processing)'),count('orders?user_id=eq.'+id+'&status=eq.completed')]);return {total,active,completed};}
 if(route==='account/order'&&req.method==='GET')return detail(url.searchParams.get('id'),u.id);
 if(route==='account/payments'&&req.method==='GET'){const {page,offset}=pageOptions(url),rows=await db('payments?user_id=eq.'+uuid(u.id)+'&select=id,amount,currency,status,created_at,order_id,bundle_id,mascot_purchase_id&order=created_at.desc,id.desc&limit=26&offset='+offset);return {items:rows.slice(0,25),page,hasNext:rows.length>25};}
 if(route==='admin/overview'&&req.method==='GET'){
  const [ordersTotal,customers,paid,failed,active,collections]=env.SUPABASE_URL&&env.SUPABASE_ANON_KEY&&env.SUPABASE_SERVICE_ROLE_KEY?await Promise.all([count('orders'),count('profiles'),count('payments?status=eq.paid'),count('orders?status=eq.failed'),count('orders?status=in.(queued,processing)'),count('collections?published=eq.true')]):Array(6).fill(null);
  return {counts:{orders:ordersTotal,customers,paid,failed,active,collections},services:{supabase:!!env.SUPABASE_SERVICE_ROLE_KEY,stripe:!!env.STRIPE_SECRET_KEY&&!!env.STRIPE_WEBHOOK_SECRET,replicate:!!env.REPLICATE_API_TOKEN,worker:!!env.CRON_SECRET,generation:generationAvailability(),deployment:!!env.VERCEL_DEPLOY_HOOK_URL},policy:{ceiling:generationPolicy.maxUnit,currency:generationPolicy.currency,unit:generationPolicy.prices['768sq']}};
 }
 if(route==='admin/orders'&&req.method==='GET')return orders(url);
 if(route==='admin/rebuild'&&req.method==='POST'){if(!env.VERCEL_DEPLOY_HOOK_URL||!rebuild)throw fail('Le hook de déploiement Vercel n’est pas configuré.',503);await rebuild();return {requested:true};}
 if(route==='admin/payments'&&req.method==='GET'){const {page,offset}=pageOptions(url),rows=await db('payments?select=id,user_id,amount,currency,status,created_at,order_id,bundle_id,mascot_purchase_id&order=created_at.desc,id.desc&limit=26&offset='+offset);return {items:rows.slice(0,25),page,hasNext:rows.length>25};}
 if(route==='admin/order'&&req.method==='GET')return detail(url.searchParams.get('id'));
 if(route==='admin/customers'&&req.method==='GET'){
  const {page}=pageOptions(url);const result=await directory(page);const users=result.users||[];
  const profiles=users.length?await db('profiles?select=id,display_name&limit=25&id=in.('+users.map(u=>uuid(u.id)).join(',')+')'):[];
  const items=await Promise.all(users.map(async u=>({id:u.id,email:u.email,display_name:profiles.find(p=>p.id===u.id)?.display_name||'',created_at:u.created_at,confirmed:!!u.email_confirmed_at,orders:await count('orders?user_id=eq.'+uuid(u.id))})));
  return {items,page,hasNext:result.next_page!=null?Number(result.next_page)>page:users.length===25};
 }
 if(route==='admin/collections'){
  if(req.method==='GET')return db('collections?select=slug,name,category,image,prompt_count,published,updated_at&order=name&limit=500');
  if(req.method==='POST'){const {slug,published}=req.body||{};if(!/^[a-z0-9-]{1,100}$/.test(slug||'')||typeof published!=='boolean')throw fail('Collection invalide.');const rows=await db('collections?slug=eq.'+slug,'PATCH',{published,updated_at:new Date().toISOString()});if(!rows.length)throw fail('Collection introuvable.',404);clearCatalog();return {slug,published};}
 }
 if(route==='admin/inventory'&&req.method==='GET')return db('mascot_inventory?select=slug,status,sold_at&order=slug');
 return undefined;
 };
}
