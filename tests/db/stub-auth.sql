-- Stub mínimo do que o Supabase provê, para testar a migration num
-- PostgreSQL puro: papéis anon/authenticated, auth.users e auth.uid().
-- auth.uid() lê o mesmo parâmetro que o PostgREST define a partir do JWT.
create role anon nologin;
create role authenticated nologin;

create schema auth;
grant usage on schema auth to anon, authenticated;

create table auth.users (id uuid primary key);

create function auth.uid() returns uuid
language sql stable
as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;

grant execute on function auth.uid() to anon, authenticated;
