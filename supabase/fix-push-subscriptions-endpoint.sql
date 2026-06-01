delete from public.push_subscriptions a
using public.push_subscriptions b
where a.endpoint = b.endpoint
  and a.created_at < b.created_at;

create unique index if not exists push_subscriptions_endpoint_unique_idx
  on public.push_subscriptions(endpoint);

grant select, insert, update, delete on public.push_subscriptions to authenticated, service_role;
