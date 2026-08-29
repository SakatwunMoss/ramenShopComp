-- ラーメン店舗マスタ（HotPepper ほか将来のデータソースも想定）
create table if not exists shops (
  id uuid primary key default gen_random_uuid(),
  hotpepper_id text unique,
  data_source text not null default 'hotpepper',
  name text not null,
  genre text,
  address text,
  large_area_code text,
  middle_area_code text,
  small_area_code text,
  lat double precision,
  lng double precision,
  budget text,
  image_url text,
  shop_url text,
  phone text,
  open_hours text,
  close_days text,
  access text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists shops_large_area_code_idx on shops (large_area_code);
create index if not exists shops_genre_idx on shops (genre);
create index if not exists shops_name_idx on shops (name);

-- 読み取りは公開、書き込みは service role のみ（service role は RLS をバイパス）
alter table shops enable row level security;

create policy "Public read shops"
  on shops
  for select
  to anon, authenticated
  using (true);

-- anon / authenticated からの insert / update / delete はポリシー未定義のため拒否される
