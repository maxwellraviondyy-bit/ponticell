-- Users
create table if not exists users (
  id bigserial primary key,
  username text unique not null,
  password text not null,
  role text not null,
  name text not null,
  branch text
);

-- Inventory
create table if not exists inventory (
  id bigint primary key,
  type text default 'hp',
  brand text,
  model text,
  ram text default '-',
  storage text,
  color text default '-',
  imei text default '-',
  condition text default 'Second Wajar',
  buy_price bigint default 0,
  sell_price bigint default 0,
  notes text default '',
  photos jsonb default '[]',
  stocks jsonb default '{"KP":0,"SJ":0,"KB":0,"JJ":0}',
  created_at text default now()::text
);

-- Sales Log
create table if not exists sales_log (
  id bigint primary key,
  item_id bigint,
  type text default 'hp',
  brand text,
  model text,
  ram text default '-',
  storage text,
  color text default '-',
  condition text,
  imei text default '-',
  buy_price bigint default 0,
  sell_price bigint default 0,
  original_sell_price bigint default 0,
  profit bigint default 0,
  notes text default '',
  photos jsonb default '[]',
  stock_branch text,
  sold_branch text,
  sold_qty int default 1,
  is_cod boolean default false,
  sold_at text
);

-- Activities
create table if not exists activities (
  id bigint primary key,
  time text,
  type text,
  item text,
  branch text,
  qty int default 1,
  notes text,
  sold_at_branch_name text,
  is_cod boolean default false,
  cancelled boolean default false,
  cancelled_at text,
  cancelled_by text,
  edited_by text
);

-- Ref Harga
create table if not exists ref_harga (
  id bigint primary key,
  brand text,
  model text,
  ram text default '-',
  storage text default '-',
  kode text,
  created_by text
);

-- Testimoni
create table if not exists testimoni (
  id bigserial primary key,
  foto text,
  keterangan text,
  created_at text default now()::text
);

-- Settings
create table if not exists settings (
  key text primary key,
  value text
);

-- Meta produk kasir: foto & deskripsi tambahan untuk produk yang stoknya dari kasir.
-- kasir_id = id item dari kasir (integer), kasir_url = URL kasir asal.
-- Dikelola dari dashboard Ponticell. Tidak menyimpan stok/harga (itu dari kasir).
create table if not exists kasir_produk_meta (
  id bigserial primary key,
  kasir_url text not null,           -- misal 'https://modernshoppontianak.vercel.app'
  kasir_id bigint not null,          -- id item di kasir
  photos jsonb default '[]',         -- array URL foto (Cloudinary)
  deskripsi text default '',         -- deskripsi tambahan (bisa diisi AI)
  updated_at text default now()::text,
  unique (kasir_url, kasir_id)
);
