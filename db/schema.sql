create extension if not exists pgcrypto;

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  name text,
  avatar_url text,
  password_hash text,
  provider text not null default 'password',
  created_at timestamptz not null default now()
);

create table if not exists projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  name text not null,
  source_type text not null,          -- 'url' | 'image'
  source_url text,
  favicon text,
  thumbnail text,                     -- small jpeg data url
  status text not null default 'cloning', -- cloning | ready | error
  error text,
  tokens jsonb,
  design_md text,
  capture jsonb,                      -- page structure outline used for cloning
  nav_links jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists projects_user_idx on projects(user_id, updated_at desc);

create table if not exists pages (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  path text not null default '/',
  title text not null default 'Home',
  source_url text,
  screenshot text,
  created_at timestamptz not null default now(),
  unique(project_id, path)
);

create table if not exists versions (
  id uuid primary key default gen_random_uuid(),
  page_id uuid not null references pages(id) on delete cascade,
  html text not null,
  prompt text,
  created_at timestamptz not null default now()
);
create index if not exists versions_page_idx on versions(page_id, created_at desc);

create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  page_id uuid references pages(id) on delete cascade,
  role text not null,                 -- user | assistant
  content text not null,
  created_at timestamptz not null default now()
);
create index if not exists messages_project_idx on messages(project_id, created_at);
