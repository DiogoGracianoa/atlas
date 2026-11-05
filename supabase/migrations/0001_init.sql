-- Atlas de Estudos — schema inicial.
-- Base: SQL fornecido pelo autor, com o adendo multiárea (coluna `area` e
-- índices) e o trigger de "vence o mais recente" aprovado em 2026-11-04 (P3).
-- IDs canônicos no formato 'area/id' (ex.: 'politica/m1e1').

create table public.progress (
  user_id    uuid not null references auth.users on delete cascade,
  area       text not null,
  item_id    text not null,              -- já no formato 'politica/m1e1'
  mark       text not null,              -- 'def' | 'vid' | 'book' | 'do'
  done       boolean not null default false,
  updated_at timestamptz not null default now(),
  primary key (user_id, item_id, mark)
);
create index on public.progress (user_id, area);

create table public.notes (
  user_id    uuid not null references auth.users on delete cascade,
  area       text not null,
  item_id    text not null,              -- já no formato 'politica/m1e1'
  body       text not null default '',
  updated_at timestamptz not null default now(),
  primary key (user_id, item_id)
);
create index on public.notes (user_id, area);

create table public.prefs (
  user_id    uuid primary key references auth.users on delete cascade,
  size       text,
  theme      text,
  last_at    text,
  updated_at timestamptz not null default now()
);

create table public.heartbeat (
  id        int primary key default 1,
  pinged_at timestamptz not null default now()
);
insert into public.heartbeat (id) values (1);

-- Vence o mais recente também no servidor: uma escrita cujo updated_at é
-- anterior ao já gravado é descartada (a linha fica intacta e não volta na
-- resposta do upsert). Sem isto, uma fila offline antiga, ao subir,
-- sobrescreveria a edição mais nova feita em outro aparelho.
-- updated_at é o instante da edição no aparelho, enviado pelo cliente.
create function public.descarta_escrita_antiga() returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.updated_at < old.updated_at then
    return null;
  end if;
  return new;
end;
$$;
-- Só o trigger usa a função; ela não deve aparecer como RPC na API.
revoke execute on function public.descarta_escrita_antiga() from public, anon, authenticated;

create trigger progress_vence_mais_recente before update on public.progress
  for each row execute function public.descarta_escrita_antiga();
create trigger notes_vence_mais_recente before update on public.notes
  for each row execute function public.descarta_escrita_antiga();
create trigger prefs_vence_mais_recente before update on public.prefs
  for each row execute function public.descarta_escrita_antiga();

alter table public.progress  enable row level security;
alter table public.notes     enable row level security;
alter table public.prefs     enable row level security;
alter table public.heartbeat enable row level security;

create policy "dono" on public.progress for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "dono" on public.notes for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "dono" on public.prefs for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "ping publico" on public.heartbeat for select to anon using (true);

-- Projetos Supabase criados a partir de 30/05/2026 exigem grants explícitos
-- para o PostgREST. Sem isto as tabelas não aparecem na API.
grant usage on schema public to anon, authenticated;
grant select, insert, update, delete
  on public.progress, public.notes, public.prefs to authenticated;
grant select on public.heartbeat to anon, authenticated;
