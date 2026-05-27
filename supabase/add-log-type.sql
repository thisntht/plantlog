alter table public.watering_logs
  add column if not exists log_type text not null default 'watering';

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'watering_logs_log_type_check'
      and conrelid = 'public.watering_logs'::regclass
  ) then
    alter table public.watering_logs
      add constraint watering_logs_log_type_check check (log_type in ('watering', 'repotting', 'fertilizing'));
  end if;
end $$;

update public.watering_logs
set log_type = 'watering'
where log_type is null;
