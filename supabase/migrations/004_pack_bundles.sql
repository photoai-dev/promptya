-- Price tiers for packs bought in one basket: 22.90 / 19.90 / 16.90 / 14.90 EUR.
alter table public.orders drop constraint if exists orders_amount_check;
alter table public.orders alter column amount set default 2290;
alter table public.orders add constraint orders_amount_check check(amount in (2290,1990,1690,1490));
create table public.pack_bundles (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id),
 created_at timestamptz not null default now(), pack_count integer not null check(pack_count between 1 and 4),
 unit_amount integer not null, amount integer not null, stripe_session text unique,
 status text not null default 'awaiting_payment' check(status in ('awaiting_payment','paid')),
 check(unit_amount=case pack_count when 1 then 2290 when 2 then 1990 when 3 then 1690 when 4 then 1490 end),
 check(amount=unit_amount*pack_count)
);
alter table public.orders add column bundle_id uuid references public.pack_bundles(id);
alter table public.pack_bundles enable row level security;
create policy own_bundles on public.pack_bundles for select to authenticated using(user_id=auth.uid());
create function public.create_pack_bundle(p_user uuid,p_items jsonb)
returns jsonb language plpgsql security definer set search_path=public as $$
declare n integer:=jsonb_array_length(p_items); unit integer; batch uuid; item jsonb;
begin
 if n<1 or n>4 then raise exception 'One to four packs required'; end if;
 unit:=case n when 1 then 2290 when 2 then 1990 when 3 then 1690 else 1490 end;
 insert into pack_bundles(user_id,pack_count,unit_amount,amount) values(p_user,n,unit,n*unit) returning id into batch;
 for item in select * from jsonb_array_elements(p_items) loop
  insert into orders(user_id,bundle_id,count,amount,model,ratio,pack,reference,lora)
  values(p_user,batch,100,unit,item->>'model',item->>'ratio',item->>'pack',item->>'reference',item->>'lora');
 end loop;
 return jsonb_build_object('id',batch,'total',unit*n,'unit',unit,'count',n);
end $$;
create function public.confirm_bundle_payment(p_event text,p_bundle uuid,p_session text,p_jobs jsonb)
returns void language plpgsql security definer set search_path=public as $$
begin
 if exists(select 1 from stripe_events where id=p_event) then return; end if;
 perform 1 from pack_bundles where id=p_bundle and stripe_session=p_session and status='awaiting_payment' for update;
 if not found then return; end if;
 if exists(select 1 from jsonb_array_elements(p_jobs) j where not exists(select 1 from orders o where o.id=(j->>'order_id')::uuid and o.bundle_id=p_bundle)) then raise exception 'Invalid job owner'; end if;
 insert into stripe_events(id) values(p_event) on conflict do nothing;
 insert into image_jobs(order_id,position,prompt)
 select (j->>'order_id')::uuid,(j->>'position')::integer,j->>'prompt' from jsonb_array_elements(p_jobs) j on conflict(order_id,position) do nothing;
 update orders set status='queued' where bundle_id=p_bundle and status='awaiting_payment';
 update pack_bundles set status='paid' where id=p_bundle;
end $$;
revoke all on function public.create_pack_bundle(uuid,jsonb) from public,anon,authenticated;
revoke all on function public.confirm_bundle_payment(text,uuid,text,jsonb) from public,anon,authenticated;
grant execute on function public.create_pack_bundle(uuid,jsonb) to service_role;
grant execute on function public.confirm_bundle_payment(text,uuid,text,jsonb) to service_role;
