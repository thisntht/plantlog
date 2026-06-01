create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  endpoint text not null unique,
  subscription jsonb not null,
  created_at timestamptz not null default now()
);

alter table public.push_subscriptions enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'push_subscriptions'
      and policyname = 'push subscriptions are private'
  ) then
    create policy "push subscriptions are private" on public.push_subscriptions
      for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
  end if;
end $$;

grant select, insert, update, delete on public.push_subscriptions to authenticated, service_role;

create index if not exists push_subscriptions_user_id_idx on public.push_subscriptions(user_id);
create unique index if not exists push_subscriptions_endpoint_unique_idx on public.push_subscriptions(endpoint);
