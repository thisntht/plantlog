alter table public.profiles
  add column if not exists last_notification_sent_on date;
