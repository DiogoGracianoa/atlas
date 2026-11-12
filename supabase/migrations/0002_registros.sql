-- Letrume — registros do estudante (preparatório de concursos, contrato K-R1,
-- ADR-0015). Uma tabela genérica: cada linha é um estado (tópico, revisão,
-- plano) ou um evento (tentativa, sessão, replanejamento, simulado,
-- discursiva) do usuário. "Vence o mais recente" no servidor, como na 0001.

create table public.registros (
  user_id     uuid not null references auth.users on delete cascade,
  area        text not null,                 -- slug do concurso, ex.: 'contagem-2027'
  tipo        text not null,                 -- 'topico' | 'tentativa' | 'sessao' | ...
  registro_id text not null,                 -- id estável do estado ou UUID do evento
  corpo       jsonb not null default '{}'::jsonb,
  updated_at  timestamptz not null default now(),
  primary key (user_id, tipo, registro_id),
  constraint registros_tipo_formato check (tipo ~ '^[a-z][a-z-]{1,31}$'),
  constraint registros_id_tamanho check (char_length(registro_id) between 1 and 200),
  constraint registros_area_formato check (area ~ '^[a-z0-9-]{1,64}$'),
  constraint registros_corpo_tamanho check (octet_length(corpo::text) <= 16384)
);
create index on public.registros (user_id, area);

-- Mesma função da 0001: descarta escrita com updated_at mais antigo.
create trigger registros_vence_mais_recente before update on public.registros
  for each row execute function public.descarta_escrita_antiga();

alter table public.registros enable row level security;
create policy "dono" on public.registros for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

grant select, insert, update, delete on public.registros to authenticated;
