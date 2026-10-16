// Read non-secret linking details prepared in private/supabase-link.json.
import {readFile,writeFile} from 'node:fs/promises';
const config=JSON.parse(await readFile('private/supabase-link.json','utf8'));let text=await readFile('.env','utf8');
for(const [name,value] of Object.entries({SUPABASE_URL:config.url,SUPABASE_ANON_KEY:config.key})){const line=new RegExp('^'+name+'=.*$','m');text=line.test(text)?text.replace(line,name+'='+value):text+'\n'+name+'='+value+'\n';}
for(const name of ['SUPABASE_SERVICE_ROLE_KEY','REPLICATE_API_TOKEN','STRIPE_SECRET_KEY','STRIPE_WEBHOOK_SECRET','CRON_SECRET'])if(!new RegExp('^'+name+'=','m').test(text))text+='\n'+name+'=\n';
await writeFile('.env',text,{mode:0o600});console.log('Projet Supabase relié localement. Les clés serveur restent à renseigner dans .env.');
