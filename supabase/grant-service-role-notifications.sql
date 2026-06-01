grant usage on schema public to service_role;

grant select, insert, update, delete on public.profiles to service_role;
grant select, insert, update, delete on public.plants to service_role;
grant select, insert, update, delete on public.watering_logs to service_role;
grant select, insert, update, delete on public.watering_log_photos to service_role;
grant select, insert, update, delete on public.plant_snoozes to service_role;
grant select, insert, update, delete on public.push_subscriptions to service_role;
