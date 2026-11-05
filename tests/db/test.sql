-- Testes da migration (cenários D01–D04 de especificacao.md).
-- Cada asserção que falha interrompe o psql (ON_ERROR_STOP) com a mensagem.
\set ON_ERROR_STOP 1

create schema t;
grant usage on schema t to anon, authenticated;
create function t.eq(actual anyelement, expected anyelement, msg text) returns void
language plpgsql as $$
begin
  if actual is distinct from expected then
    raise exception 'FALHOU: % (obtido: %, esperado: %)', msg, actual, expected;
  end if;
  raise notice 'ok: %', msg;
end $$;
grant execute on function t.eq(anyelement, anyelement, text) to anon, authenticated;

insert into auth.users (id) values
  ('11111111-1111-1111-1111-111111111111'),
  ('22222222-2222-2222-2222-222222222222');

-- ---------- U1 escreve ----------
set role authenticated;
set request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';

-- upsert como o PostgREST gera (Prefer: resolution=merge-duplicates, return=representation)
insert into public.progress (user_id, area, item_id, mark, done, updated_at)
values ('11111111-1111-1111-1111-111111111111', 'politica', 'politica/m1e1', 'def', true, '2026-11-04 10:05:00+00')
on conflict (user_id, item_id, mark) do update
  set area = excluded.area, done = excluded.done, updated_at = excluded.updated_at;

-- D01: escrita mais antiga é ignorada e não volta na resposta
with r as (
  insert into public.progress (user_id, area, item_id, mark, done, updated_at)
  values ('11111111-1111-1111-1111-111111111111', 'politica', 'politica/m1e1', 'def', false, '2026-11-04 10:00:00+00')
  on conflict (user_id, item_id, mark) do update
    set area = excluded.area, done = excluded.done, updated_at = excluded.updated_at
  returning 1
) select t.eq((select count(*) from r)::int, 0, 'D01 progress: upsert mais antigo não retorna linha');
select t.eq(done, true, 'D01 progress: valor mais novo preservado') from public.progress where item_id = 'politica/m1e1' and mark = 'def';
select t.eq(updated_at, '2026-11-04 10:05:00+00'::timestamptz, 'D01 progress: horário preservado') from public.progress where item_id = 'politica/m1e1' and mark = 'def';

-- D02: escrita mais nova atualiza e volta na resposta
with r as (
  insert into public.progress (user_id, area, item_id, mark, done, updated_at)
  values ('11111111-1111-1111-1111-111111111111', 'politica', 'politica/m1e1', 'def', false, '2026-11-04 10:10:00+00')
  on conflict (user_id, item_id, mark) do update
    set area = excluded.area, done = excluded.done, updated_at = excluded.updated_at
  returning done
) select t.eq((select done from r), false, 'D02 progress: upsert mais novo aplicado e retornado');

-- mesmo horário (reenvio da mesma operação) é idempotente e aceito
with r as (
  insert into public.progress (user_id, area, item_id, mark, done, updated_at)
  values ('11111111-1111-1111-1111-111111111111', 'politica', 'politica/m1e1', 'def', false, '2026-11-04 10:10:00+00')
  on conflict (user_id, item_id, mark) do update
    set area = excluded.area, done = excluded.done, updated_at = excluded.updated_at
  returning 1
) select t.eq((select count(*) from r)::int, 1, 'reenvio com o mesmo horário é aceito');

-- notes: mesmas regras
insert into public.notes (user_id, area, item_id, body, updated_at)
values ('11111111-1111-1111-1111-111111111111', 'politica', 'politica/m1e1', 'B', '2026-11-04 10:05:00+00')
on conflict (user_id, item_id) do update set area = excluded.area, body = excluded.body, updated_at = excluded.updated_at;
insert into public.notes (user_id, area, item_id, body, updated_at)
values ('11111111-1111-1111-1111-111111111111', 'politica', 'politica/m1e1', 'A', '2026-11-04 10:00:00+00')
on conflict (user_id, item_id) do update set area = excluded.area, body = excluded.body, updated_at = excluded.updated_at;
select t.eq(body, 'B', 'D01 notes: texto mais antigo ignorado') from public.notes where item_id = 'politica/m1e1';
insert into public.notes (user_id, area, item_id, body, updated_at)
values ('11111111-1111-1111-1111-111111111111', 'politica', 'politica/m1e1', 'C', '2026-11-04 10:06:00+00')
on conflict (user_id, item_id) do update set area = excluded.area, body = excluded.body, updated_at = excluded.updated_at;
select t.eq(body, 'C', 'D02 notes: texto mais novo aplicado') from public.notes where item_id = 'politica/m1e1';

-- prefs: mesmas regras
insert into public.prefs (user_id, last_at, updated_at)
values ('11111111-1111-1111-1111-111111111111', 'politica/m2e3', '2026-11-04 10:05:00+00')
on conflict (user_id) do update set last_at = excluded.last_at, updated_at = excluded.updated_at;
insert into public.prefs (user_id, last_at, updated_at)
values ('11111111-1111-1111-1111-111111111111', 'politica/m1e1', '2026-11-04 10:00:00+00')
on conflict (user_id) do update set last_at = excluded.last_at, updated_at = excluded.updated_at;
select t.eq(last_at, 'politica/m2e3', 'D01 prefs: posição mais antiga ignorada') from public.prefs;

-- updated_at omitido usa now()
insert into public.progress (user_id, area, item_id, mark, done)
values ('11111111-1111-1111-1111-111111111111', 'politica', 'politica/m1e2', 'vid', true);
select t.eq(updated_at is not null, true, 'updated_at padrão preenchido') from public.progress where item_id = 'politica/m1e2';

-- consulta por área usa a coluna area
select t.eq(count(*)::int, 2, 'progresso consultável por área') from public.progress where area = 'politica';

-- ---------- D03: U2 não enxerga nem escreve linhas de U1 ----------
set request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';
select t.eq(count(*)::int, 0, 'D03 RLS: U2 não lê progress de U1') from public.progress;
select t.eq(count(*)::int, 0, 'D03 RLS: U2 não lê notes de U1') from public.notes;
select t.eq(count(*)::int, 0, 'D03 RLS: U2 não lê prefs de U1') from public.prefs;
do $$
begin
  insert into public.progress (user_id, area, item_id, mark, done)
  values ('11111111-1111-1111-1111-111111111111', 'politica', 'politica/m9e9', 'def', true);
  raise exception 'FALHOU: D03 RLS permitiu U2 inserir linha de U1';
exception when insufficient_privilege then
  raise notice 'ok: D03 RLS: U2 não insere linha de U1';
end $$;
update public.notes set body = 'invadido' where item_id = 'politica/m1e1';
reset role;
select t.eq(body, 'C', 'D03 RLS: U2 não altera nota de U1') from public.notes where item_id = 'politica/m1e1';

-- ---------- D04: anon só lê heartbeat ----------
set role anon;
reset request.jwt.claim.sub;
select t.eq(count(*)::int, 1, 'D04 anon lê heartbeat') from public.heartbeat;
do $$
begin
  perform 1 from public.progress;
  raise exception 'FALHOU: D04 anon leu progress';
exception when insufficient_privilege then
  raise notice 'ok: D04 anon sem acesso a progress';
end $$;
reset role;

-- usuário removido leva junto suas linhas
delete from auth.users where id = '11111111-1111-1111-1111-111111111111';
select t.eq(count(*)::int, 0, 'on delete cascade em progress') from public.progress;
select t.eq(count(*)::int, 0, 'on delete cascade em notes') from public.notes;

\echo 'TODOS OS TESTES DO BANCO PASSARAM'
