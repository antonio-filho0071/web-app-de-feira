-- Lista da Feira — schema do Supabase
-- Cole este arquivo inteiro no SQL Editor do seu projeto Supabase e clique em "Run".
-- Pode rodar de novo com segurança (idempotente) se precisar reaplicar.

-- =========================================================================
-- Tabelas
-- =========================================================================

create table if not exists listas (
  id uuid primary key default gen_random_uuid(),
  codigo text unique not null,
  criada_em timestamptz not null default now()
);

create table if not exists itens_catalogo (
  lista_id uuid not null references listas(id) on delete cascade,
  item_id text not null,
  quantidade int not null default 0,
  observacao text not null default '',
  comprado boolean not null default false,
  atualizado_em timestamptz not null default now(),
  primary key (lista_id, item_id)
);

create table if not exists itens_outros (
  id uuid primary key default gen_random_uuid(),
  lista_id uuid not null references listas(id) on delete cascade,
  nome text not null,
  quantidade int not null default 0,
  observacao text not null default '',
  comprado boolean not null default false,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create index if not exists itens_catalogo_lista_id_idx on itens_catalogo (lista_id);
create index if not exists itens_outros_lista_id_idx on itens_outros (lista_id);

-- =========================================================================
-- Row Level Security
--
-- Modelo de segurança: o "código da lista" funciona como uma chave de acesso.
-- Leitura (select) é liberada para permitir o Realtime funcionar (ver README
-- para o motivo). Toda ESCRITA (insert/update/delete) só acontece através das
-- funções abaixo, que validam o código antes de tocar nos dados — por isso
-- não existem políticas de insert/update/delete: sem uma, o acesso direto via
-- API é negado por padrão, e só as funções (que rodam com privilégio de
-- dono/"security definer") conseguem gravar.
-- =========================================================================

alter table listas enable row level security;
alter table itens_catalogo enable row level security;
alter table itens_outros enable row level security;

drop policy if exists "leitura publica" on listas;
create policy "leitura publica" on listas for select using (true);

drop policy if exists "leitura publica" on itens_catalogo;
create policy "leitura publica" on itens_catalogo for select using (true);

drop policy if exists "leitura publica" on itens_outros;
create policy "leitura publica" on itens_outros for select using (true);

-- O Postgres exige a permissão de tabela (grant) além da política de RLS:
-- sem isto, nem o select liberado acima funcionaria. Não concedemos
-- insert/update/delete diretos — só as funções abaixo (security definer)
-- podem escrever.
grant select on listas, itens_catalogo, itens_outros to anon, authenticated;

-- =========================================================================
-- Funções (RPC)
-- =========================================================================

-- Cria uma lista nova com um código curto e único (6 caracteres, sem
-- caracteres ambíguos como 0/O/1/I).
create or replace function criar_lista()
returns table(id uuid, codigo text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_codigo text;
  v_id uuid;
  v_alfabeto text := '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  v_tentativa text;
  i int;
begin
  loop
    v_tentativa := '';
    for i in 1..6 loop
      v_tentativa := v_tentativa || substr(v_alfabeto, 1 + floor(random() * length(v_alfabeto))::int, 1);
    end loop;
    exit when not exists (select 1 from listas l where l.codigo = v_tentativa);
  end loop;
  v_codigo := v_tentativa;
  insert into listas(codigo) values (v_codigo) returning listas.id into v_id;
  return query select v_id, v_codigo;
end;
$$;

grant execute on function criar_lista() to anon, authenticated;

-- Retorna o estado completo de uma lista (catálogo + outros) a partir do código.
create or replace function obter_lista(p_codigo text)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
  v_result json;
begin
  select listas.id into v_id from listas where codigo = upper(p_codigo);
  if v_id is null then
    raise exception 'codigo_invalido';
  end if;
  select json_build_object(
    'lista_id', v_id,
    'codigo', upper(p_codigo),
    'catalogo', coalesce((select json_agg(t) from itens_catalogo t where t.lista_id = v_id), '[]'::json),
    'outros', coalesce((select json_agg(t order by t.criado_em) from itens_outros t where t.lista_id = v_id), '[]'::json)
  ) into v_result;
  return v_result;
end;
$$;

grant execute on function obter_lista(text) to anon, authenticated;

-- Cria/atualiza o estado de um item do catálogo fixo.
create or replace function upsert_item_catalogo(
  p_codigo text,
  p_item_id text,
  p_quantidade int,
  p_observacao text,
  p_comprado boolean
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  select listas.id into v_id from listas where codigo = upper(p_codigo);
  if v_id is null then
    raise exception 'codigo_invalido';
  end if;

  insert into itens_catalogo (lista_id, item_id, quantidade, observacao, comprado, atualizado_em)
  values (v_id, p_item_id, greatest(p_quantidade, 0), coalesce(p_observacao, ''), p_comprado, now())
  on conflict (lista_id, item_id) do update
    set quantidade = excluded.quantidade,
        observacao = excluded.observacao,
        comprado = excluded.comprado,
        atualizado_em = now();
end;
$$;

grant execute on function upsert_item_catalogo(text, text, int, text, boolean) to anon, authenticated;

-- Adiciona um item novo na seção "Outros". Retorna o id gerado.
create or replace function adicionar_item_outro(p_codigo text, p_nome text, p_quantidade int)
returns table(id uuid)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
  v_item_id uuid;
begin
  select listas.id into v_id from listas where codigo = upper(p_codigo);
  if v_id is null then
    raise exception 'codigo_invalido';
  end if;

  insert into itens_outros (lista_id, nome, quantidade)
  values (v_id, p_nome, greatest(p_quantidade, 0))
  returning itens_outros.id into v_item_id;

  return query select v_item_id;
end;
$$;

grant execute on function adicionar_item_outro(text, text, int) to anon, authenticated;

-- Atualiza um item existente da seção "Outros".
create or replace function atualizar_item_outro(
  p_codigo text,
  p_item_id uuid,
  p_quantidade int,
  p_observacao text,
  p_comprado boolean
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  select listas.id into v_id from listas where codigo = upper(p_codigo);
  if v_id is null then
    raise exception 'codigo_invalido';
  end if;

  update itens_outros
    set quantidade = greatest(p_quantidade, 0),
        observacao = coalesce(p_observacao, ''),
        comprado = p_comprado,
        atualizado_em = now()
    where lista_id = v_id and id = p_item_id;
end;
$$;

grant execute on function atualizar_item_outro(text, uuid, int, text, boolean) to anon, authenticated;

-- Remove um item da seção "Outros".
create or replace function remover_item_outro(p_codigo text, p_item_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  select listas.id into v_id from listas where codigo = upper(p_codigo);
  if v_id is null then
    raise exception 'codigo_invalido';
  end if;

  delete from itens_outros where lista_id = v_id and id = p_item_id;
end;
$$;

grant execute on function remover_item_outro(text, uuid) to anon, authenticated;

-- "Nova Feira": desmarca todos os itens comprados, mantendo as quantidades.
create or replace function resetar_compras(p_codigo text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  select listas.id into v_id from listas where codigo = upper(p_codigo);
  if v_id is null then
    raise exception 'codigo_invalido';
  end if;

  update itens_catalogo set comprado = false, atualizado_em = now() where lista_id = v_id and comprado = true;
  update itens_outros set comprado = false, atualizado_em = now() where lista_id = v_id and comprado = true;
end;
$$;

grant execute on function resetar_compras(text) to anon, authenticated;

-- =========================================================================
-- Realtime
-- Habilita a publicação padrão do Supabase para as duas tabelas de itens,
-- para que mudanças feitas por um aparelho apareçam nos outros na hora.
-- =========================================================================

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'itens_catalogo'
  ) then
    execute 'alter publication supabase_realtime add table itens_catalogo';
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'itens_outros'
  ) then
    execute 'alter publication supabase_realtime add table itens_outros';
  end if;
end $$;
