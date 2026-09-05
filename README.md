# Lista da Feira

App mobile-first para planejar e fazer a lista de compras do mês. Construído com React + TypeScript + Vite, Tailwind CSS e componentes no estilo shadcn/ui. Suporta sincronização entre celulares via Supabase (opcional — funciona só localmente também).

## Como funciona

O app tem duas abas:

- **Planejar** — lista completa de itens do catálogo (extraído da planilha original) com um contador de quantidade para cada um. Também tem uma seção **Outros**, onde é possível adicionar ou remover itens livremente (para produtos que variam de mês a mês).
- **Comprar** — mostra só os itens com quantidade maior que zero, como um checklist. Basta tocar no item para marcar como comprado. Um botão **Nova Feira** desmarca tudo para começar a próxima compra, sem apagar as quantidades planejadas.

### Modo local (padrão, sem configuração)

Sem nenhuma variável de ambiente configurada, tudo é salvo só no `localStorage` do navegador daquele celular — funciona sozinho, mas não sincroniza com outros aparelhos.

### Modo sincronizado (com Supabase)

Configurando as variáveis de ambiente do Supabase (veja abaixo), o app ganha uma tela inicial para **criar uma lista nova** (gera um código de 6 caracteres) ou **entrar com um código** que outra pessoa já criou. A partir daí:

- As mudanças de um celular aparecem em tempo real no outro (Supabase Realtime).
- O app funciona offline: continua marcando itens e editando quantidades sem internet, e sincroniza sozinho assim que a conexão voltar (um indicador no topo mostra "Sincronizado", "Sincronizando…" ou "Sem internet").
- O código da lista funciona como uma chave de acesso — quem tem o código consegue ler e editar a lista (veja "Segurança" abaixo). Ele fica salvo no aparelho após a primeira vez; pelo menu (ícone de pessoas no topo) dá pra ver o código de novo, compartilhar ou sair da lista.

## Configurando o Supabase (para sincronizar entre celulares)

1. Crie uma conta gratuita em [supabase.com](https://supabase.com) e clique em "New Project". Escolha uma senha de banco (guarde-a, mas ela não será usada no app) e uma região próxima do Brasil (ex: São Paulo/`sa-east-1`, se disponível).
2. Espere o projeto ficar pronto (1-2 minutos), abra o menu **SQL Editor**, cole o conteúdo inteiro do arquivo [`supabase/schema.sql`](./supabase/schema.sql) deste projeto e clique em **Run**. Isso cria as tabelas e as funções que o app usa.
3. Vá em **Project Settings → API**. Copie:
   - **Project URL**
   - **anon public key** (a chave marcada como "public" — nunca use a "service_role" aqui)
4. Copie o arquivo `.env.example` para `.env.local` e preencha os dois valores:
   ```bash
   cp .env.example .env.local
   ```
   ```
   VITE_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=sua-anon-key-aqui
   ```
5. Rode `npm run dev` de novo — a tela de "Criar uma lista nova" deve aparecer.

No Vercel, adicione essas duas mesmas variáveis em **Project Settings → Environment Variables** antes (ou depois) do deploy, e faça um novo deploy para elas entrarem em vigor.

### Segurança (o que o código da lista protege, e o que não protege)

Não há login nem senha — de propósito, para ficar simples de usar. O modelo é: **qualquer leitura é aberta** (necessário para o tempo real funcionar), mas **toda escrita passa por funções no banco que exigem o código certo** da lista. Ou seja: alguém só consegue mudar sua lista se souber o código de 6 caracteres (que só existe compartilhado por vocês). Isso é adequado para uma lista de compras entre família — não guarde nada sensível nela, e não reaproveite esse mesmo projeto Supabase para outro uso.

## Rodando localmente

```bash
npm install
npm run dev
```

Abre em `http://localhost:5173`.

## Build de produção

```bash
npm run build
```

Gera os arquivos estáticos em `dist/`.

## Deploy no Vercel

O projeto é um app Vite padrão, então o Vercel detecta tudo automaticamente (build command `vite build`, output `dist`). Duas formas de publicar:

**Opção A — pelo site do Vercel (mais simples):**
1. Suba este projeto para um repositório no GitHub (ou GitLab/Bitbucket).
2. Em [vercel.com](https://vercel.com), clique em "Add New… → Project" e selecione o repositório.
3. Se for usar sincronização, adicione as variáveis `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` na tela de configuração (ou depois, em Project Settings → Environment Variables).
4. Deixe o resto padrão (Framework: Vite) e clique em "Deploy".
5. Pronto — você recebe uma URL para enviar para sua mãe.

**Opção B — pela linha de comando:**
```bash
npm install -g vercel
vercel        # primeiro deploy (segue as perguntas)
vercel --prod # deploy de produção
```

## Atualizando a lista de itens do catálogo

A seção **Outros** já é editável direto no app (adicionar/remover produtos). Já os itens fixos do "Catálogo" (nomes) ficam no código, em `src/data/catalogo.ts` — as quantidades desses itens são editadas normalmente pelo app, mas para adicionar/remover/renomear um item do catálogo fixo é preciso editar esse arquivo e publicar de novo. Se precisar, é só pedir.

## Estrutura do projeto

```
supabase/schema.sql          # tabelas, RPC e segurança (cole no SQL Editor do Supabase)
src/
  data/catalogo.ts            # itens extraídos da planilha (catálogo fixo + seção Outros)
  hooks/useLista.ts            # criar/entrar/sair de uma lista compartilhada
  hooks/useShoppingList.ts     # estado da lista, cache offline e sincronização
  lib/supabaseClient.ts        # cliente Supabase (a partir das variáveis de ambiente)
  lib/listaApi.ts              # chamadas às funções RPC do Supabase
  lib/listaSeed.ts             # publica os valores padrão ao criar uma lista nova
  lib/storage.ts               # leitura/escrita segura do localStorage (com migração do formato antigo)
  components/                  # peças de UI reutilizáveis
  components/ui/                # componentes de base (estilo shadcn/ui)
  pages/OnboardingLista.tsx     # tela de criar/entrar em uma lista
  pages/PlanejarPage.tsx        # tela de planejamento
  pages/ComprarPage.tsx         # tela de checklist de compras
```
