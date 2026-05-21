create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  notification_time time default '20:00',
  is_public boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.plants (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  nickname text not null,
  scientific_name text,
  plant_type text,
  watering_interval_days integer not null check (watering_interval_days > 0),
  started_at date not null default current_date,
  memo text,
  cover_image_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.watering_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plant_id uuid not null references public.plants(id) on delete cascade,
  watered_date date not null,
  soil_status text check (soil_status in ('dry', 'moist', 'wet')),
  water_amount text check (water_amount in ('little', 'normal', 'deep')),
  plant_conditions text[] not null default '{}',
  memo text,
  created_at timestamptz not null default now()
);

create table if not exists public.watering_log_photos (
  id uuid primary key default gen_random_uuid(),
  watering_log_id uuid not null references public.watering_logs(id) on delete cascade,
  image_url text not null,
  storage_path text not null
);

create table if not exists public.plant_snoozes (
  id uuid primary key default gen_random_uuid(),
  plant_id uuid not null references public.plants(id) on delete cascade,
  snoozed_until date not null
);

create unique index if not exists plant_snoozes_plant_id_unique_idx on public.plant_snoozes(plant_id);

alter table public.profiles enable row level security;
alter table public.plants enable row level security;
alter table public.watering_logs enable row level security;
alter table public.watering_log_photos enable row level security;
alter table public.plant_snoozes enable row level security;

create policy "profiles are private" on public.profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

create policy "plants are private" on public.plants
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "watering logs are private" on public.watering_logs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "watering log photos are private" on public.watering_log_photos
  for all using (
    exists (
      select 1 from public.watering_logs
      where watering_logs.id = watering_log_photos.watering_log_id
      and watering_logs.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.watering_logs
      where watering_logs.id = watering_log_photos.watering_log_id
      and watering_logs.user_id = auth.uid()
    )
  );

create policy "plant snoozes are private" on public.plant_snoozes
  for all using (
    exists (
      select 1 from public.plants
      where plants.id = plant_snoozes.plant_id
      and plants.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.plants
      where plants.id = plant_snoozes.plant_id
      and plants.user_id = auth.uid()
    )
  );

create index if not exists plants_user_id_idx on public.plants(user_id);
create index if not exists watering_logs_user_plant_date_idx on public.watering_logs(user_id, plant_id, watered_date desc);
create index if not exists plant_snoozes_plant_id_idx on public.plant_snoozes(plant_id);
