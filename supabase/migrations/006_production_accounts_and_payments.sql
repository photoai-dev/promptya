-- Auth lives in auth.users. No card data or provider secrets are stored here.
create table public.profiles (
 id uuid primary key references auth.users(id) on delete cascade,
 display_name text not null default '' check(length(display_name)<=100),
 created_at timestamptz not null default now(),updated_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
create policy own_profile_read on public.profiles for select to authenticated using(id=(select auth.uid()));
create policy own_profile_update on public.profiles for update to authenticated using(id=(select auth.uid())) with check(id=(select auth.uid()));
create function public.create_customer_profile() returns trigger language plpgsql security definer set search_path='' as $$
begin insert into public.profiles(id) values(new.id) on conflict do nothing; return new; end $$;
revoke all on function public.create_customer_profile() from public,anon,authenticated;
create trigger customer_profile_created after insert on auth.users for each row execute function public.create_customer_profile();
insert into public.profiles(id) select id from auth.users on conflict do nothing;
create table public.collections (
 slug text primary key,name text not null,category text not null,image text not null,
 prompt_count integer not null check(prompt_count>0),published boolean not null default true,
 updated_at timestamptz not null default now()
);
alter table public.collections enable row level security;
create policy published_collections on public.collections for select to anon,authenticated using(published);
revoke all on public.collections from anon,authenticated;
grant select on public.collections to anon,authenticated;
grant all on public.collections,public.profiles to service_role;
create table public.payments (
 id uuid primary key default gen_random_uuid(),user_id uuid not null references auth.users(id),
 stripe_session text not null unique,stripe_payment_intent text,amount integer not null check(amount>0),
 currency text not null check(currency='eur'),status text not null check(status in('paid','partially_refunded','refunded')),
 order_id uuid references public.orders(id),bundle_id uuid references public.pack_bundles(id),
 mascot_purchase_id uuid references public.mascot_purchases(id),
 created_at timestamptz not null default now(),updated_at timestamptz not null default now(),
 check(num_nonnulls(order_id,bundle_id,mascot_purchase_id)=1)
);
alter table public.payments enable row level security;
revoke all on public.payments from anon,authenticated;
grant select on public.payments to authenticated;
grant all on public.payments to service_role;
create policy own_payments on public.payments for select to authenticated using(user_id=(select auth.uid()));
create index payments_user_id_idx on public.payments(user_id);
create index payments_order_id_idx on public.payments(order_id);
create index payments_bundle_id_idx on public.payments(bundle_id);
create index payments_mascot_purchase_idx on public.payments(mascot_purchase_id);
create index payments_intent_idx on public.payments(stripe_payment_intent);
alter table public.orders add column resolution text check(resolution in('768sq','1k','1.5k','2k','4k'));
alter table public.pack_preview_batches alter column model set default 'flux-3-image';
alter table public.pack_preview_batches alter column created_by drop not null;
create index orders_user_id_idx on public.orders(user_id);
create index orders_bundle_id_idx on public.orders(bundle_id);
create index image_jobs_queue_idx on public.image_jobs(status,lease_until);
create index pack_bundles_user_idx on public.pack_bundles(user_id);
create index preview_batches_actor_idx on public.pack_preview_batches(created_by);
create index preview_jobs_queue_idx on public.pack_preview_jobs(status,lease_until);
create index mascot_purchases_user_idx on public.mascot_purchases(user_id);
create index mascot_purchases_slug_idx on public.mascot_purchases(mascot_slug);
create index mascot_purchases_order_idx on public.mascot_purchases(order_id);

create or replace function public.reserve_mascot(p_slug text,p_user uuid,p_reference text,p_license text)
returns jsonb language plpgsql security definer set search_path=public as $$
declare state text; reservation uuid; owner uuid; oid uuid;
begin
 select status,reservation_id into state,reservation from mascot_inventory where slug=p_slug for update;
 if state is null or state='sold' then raise exception 'Mascot unavailable'; end if;
 if state='reserved' then
  select user_id,order_id into owner,oid from mascot_purchases where id=reservation;
  if owner=p_user then return jsonb_build_object('id',reservation,'orderId',oid); end if;
  raise exception 'Mascot already reserved';
 end if;
 insert into mascot_purchases(mascot_slug,user_id,license_version) values(p_slug,p_user,p_license) returning id into reservation;
 insert into orders(user_id,count,amount,model,ratio,kind,mascot_slug,reference)
 values(p_user,30,6990,'flux-3-image','3:4','mascot',p_slug,p_reference) returning id into oid;
 update mascot_purchases set order_id=oid where id=reservation;
 update mascot_inventory set status='reserved',reservation_id=reservation where slug=p_slug;
 return jsonb_build_object('id',reservation,'orderId',oid);
end $$;

create or replace function public.create_pack_bundle(p_user uuid,p_items jsonb)
returns jsonb language plpgsql security definer set search_path=public as $$
declare n integer:=jsonb_array_length(p_items); unit integer; batch uuid; item jsonb;
begin
 if n<1 or n>4 then raise exception 'One to four packs required'; end if;
 unit:=case n when 1 then 2290 when 2 then 1990 when 3 then 1690 else 1490 end;
 insert into pack_bundles(user_id,pack_count,unit_amount,amount) values(p_user,n,unit,n*unit) returning id into batch;
 for item in select * from jsonb_array_elements(p_items) loop
  insert into orders(user_id,bundle_id,count,amount,model,ratio,pack,reference,lora,resolution)
  values(p_user,batch,100,unit,item->>'model',item->>'ratio',item->>'pack',item->>'reference',item->>'lora',item->>'resolution');
 end loop;
 return jsonb_build_object('id',batch,'total',unit*n,'unit',unit,'count',n);
end $$;
