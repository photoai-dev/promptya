-- Apply once in Supabase SQL Editor. Service role is server-only.
create table public.orders (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id),
 created_at timestamptz not null default now(), status text not null default 'awaiting_payment'
 check(status in ('awaiting_payment','queued','processing','completed','failed')),
 count integer not null check(count between 1 and 100), amount integer not null default 1990 check(amount=1990),
 model text not null, ratio text not null, pack text, prompt text, reference text, lora text,
 stripe_session text unique, zip_path text
);
create table public.image_jobs (
 id uuid primary key default gen_random_uuid(), order_id uuid not null references public.orders(id),
 position integer not null, prompt text not null, status text not null default 'queued',
 prediction_id text, output_path text, error text, lease_until timestamptz,
 unique(order_id,position)
);
create table public.admins (user_id uuid primary key references auth.users(id));
create table public.stripe_events (id text primary key, created_at timestamptz default now());
alter table public.orders enable row level security;
alter table public.image_jobs enable row level security;
alter table public.admins enable row level security;
alter table public.stripe_events enable row level security;
create policy own_orders on public.orders for select to authenticated using (user_id=auth.uid());
create policy own_images on public.image_jobs for select to authenticated using (exists(select 1 from public.orders o where o.id=order_id and o.user_id=auth.uid()));
-- No client write policies: price, ownership and payment state are server-controlled.
insert into storage.buckets(id,name,public,file_size_limit) values
 ('references','references',false,4194304),('outputs','outputs',false,104857600)
on conflict(id) do nothing;
create function public.confirm_payment(p_event text,p_order uuid,p_session text,p_jobs jsonb)
returns void language plpgsql security definer set search_path=public as $$
begin
 if exists(select 1 from stripe_events where id=p_event) then return; end if;
 perform 1 from orders where id=p_order and stripe_session=p_session and status='awaiting_payment' for update;
 if not found then return; end if;
 insert into stripe_events(id) values(p_event) on conflict do nothing;
 insert into image_jobs(order_id,position,prompt)
 select p_order,(j->>'position')::integer,j->>'prompt' from jsonb_array_elements(p_jobs) j
 on conflict(order_id,position) do nothing;
 update orders set status='queued' where id=p_order;
end $$;
create function public.claim_jobs(p_limit integer default 3)
returns setof public.image_jobs language sql security definer set search_path=public as $$
 update image_jobs set lease_until=now()+interval '3 minutes'
 where id in (select id from image_jobs where status in ('queued','processing')
 and (lease_until is null or lease_until<now()) order by order_id,position
 for update skip locked limit least(p_limit,3)) returning *;
$$;
revoke all on function public.confirm_payment(text,uuid,text,jsonb) from public,anon,authenticated;
revoke all on function public.claim_jobs(integer) from public,anon,authenticated;
grant execute on function public.confirm_payment(text,uuid,text,jsonb) to service_role;
grant execute on function public.claim_jobs(integer) to service_role;
