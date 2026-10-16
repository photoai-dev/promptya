-- Do not enable real sales until license terms and private generation library are ready.
alter table public.orders drop constraint if exists orders_amount_check;
alter table public.orders add constraint orders_amount_check check(amount in (2290,1990,1690,1490,6990));
alter table public.orders add column kind text not null default 'pack' check(kind in ('pack','mascot'));
alter table public.orders add column mascot_slug text;
create table public.mascot_inventory (
 slug text primary key, status text not null default 'available' check(status in ('available','reserved','sold')),
 reservation_id uuid, sold_at timestamptz
);
create table public.mascot_purchases (
 id uuid primary key default gen_random_uuid(), mascot_slug text not null references public.mascot_inventory(slug),
 user_id uuid not null references auth.users(id), order_id uuid references public.orders(id),
 amount integer not null default 6990 check(amount=6990), stripe_session text unique,
 status text not null default 'pending' check(status in ('pending','paid','expired')),
 license_version text not null, license_accepted_at timestamptz not null default now(),
 created_at timestamptz not null default now()
);
alter table public.mascot_inventory enable row level security;
alter table public.mascot_purchases enable row level security;
create policy own_mascot_purchases on public.mascot_purchases for select to authenticated using(user_id=auth.uid());
revoke all on public.mascot_inventory from anon,authenticated;
grant all on public.mascot_inventory,public.mascot_purchases to service_role;
insert into public.mascot_inventory(slug) values
 ('vanessa-biceps'),('josiane-cornichon'),('monsieur-yeux-en-vacances'),('miss-oreilles-paraboles'),
 ('madame-permanente-volcan'),('reine-front-panoramique'),('brigitte-bambou'),('cindy-parpaing'),
 ('ginette-bulldozer'),('monique-turbo'),('comte-epaules-cintre'),('lady-cou-accordeon') on conflict do nothing;
create function public.reserve_mascot(p_slug text,p_user uuid,p_reference text,p_license text)
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
 values(p_user,30,6990,'flux-kontext-pro','3:4','mascot',p_slug,p_reference) returning id into oid;
 update mascot_purchases set order_id=oid where id=reservation;
 update mascot_inventory set status='reserved',reservation_id=reservation where slug=p_slug;
 return jsonb_build_object('id',reservation,'orderId',oid);
end $$;
create function public.confirm_mascot_sale(p_event text,p_purchase uuid,p_session text,p_prompts jsonb)
returns void language plpgsql security definer set search_path=public as $$
declare purchase mascot_purchases%rowtype; state text; reserved uuid;
begin
 if exists(select 1 from stripe_events where id=p_event) then return; end if;
 select * into purchase from mascot_purchases where id=p_purchase;
 if purchase.id is null then raise exception 'Purchase missing'; end if;
 select status,reservation_id into state,reserved from mascot_inventory where slug=purchase.mascot_slug for update;
 select * into purchase from mascot_purchases where id=p_purchase for update;
 if purchase.status='paid' then return; end if;
 if state<>'reserved' or reserved<>purchase.id or purchase.stripe_session<>p_session or purchase.status<>'pending' then raise exception 'Reservation mismatch'; end if;
 if jsonb_array_length(p_prompts)<>30 then raise exception 'Thirty images required'; end if;
 insert into stripe_events(id) values(p_event) on conflict do nothing;
 insert into image_jobs(order_id,position,prompt) select purchase.order_id,ordinality::integer-1,value from jsonb_array_elements_text(p_prompts) with ordinality on conflict(order_id,position) do nothing;
 update mascot_inventory set status='sold',sold_at=now() where slug=purchase.mascot_slug;
 update mascot_purchases set status='paid' where id=purchase.id;
 update orders set status='queued' where id=purchase.order_id;
end $$;
create function public.expire_mascot_reservation(p_purchase uuid,p_session text)
returns void language plpgsql security definer set search_path=public as $$
declare purchase mascot_purchases%rowtype;
begin
 select * into purchase from mascot_purchases where id=p_purchase;
 if purchase.id is null then return; end if;
 perform 1 from mascot_inventory where slug=purchase.mascot_slug for update;
 select * into purchase from mascot_purchases where id=p_purchase for update;
 if purchase.status='pending' and purchase.stripe_session=p_session then
  update mascot_purchases set status='expired' where id=purchase.id;
  update mascot_inventory set status='available',reservation_id=null where slug=purchase.mascot_slug and status='reserved' and reservation_id=purchase.id;
  update orders set status='failed' where id=purchase.order_id and status='awaiting_payment';
 end if;
end $$;
revoke all on function public.reserve_mascot(text,uuid,text,text) from public,anon,authenticated;
revoke all on function public.confirm_mascot_sale(text,uuid,text,jsonb) from public,anon,authenticated;
revoke all on function public.expire_mascot_reservation(uuid,text) from public,anon,authenticated;
grant execute on function public.reserve_mascot(text,uuid,text,text) to service_role;
grant execute on function public.confirm_mascot_sale(text,uuid,text,jsonb) to service_role;
grant execute on function public.expire_mascot_reservation(uuid,text) to service_role;
