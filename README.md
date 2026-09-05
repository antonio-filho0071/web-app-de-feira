# Lista da Feira

App mobile-first para planejar e fazer a lista de compras do mês. Construído com React + TypeScript + Vite, Tailwind CSS e componentes no estilo shadcn/ui.

## Como funciona

O app tem duas abas:

- **Planejar** — lista completa de itens do catálogo (extraído da planilha original) com um contador de quantidade para cada um. Também tem uma seção **Outros**, onde é possível adicionar ou remover itens livremente (para produtos que variam de mês a mês, como os itens de congelados/outros da planilha).
- **Comprar** — mostra só os itens com quantidade maior que zero, como um checklist. Basta tocar no item para marcar como comprado. Um botão **Nova Feira** desmarca tudo para começar a próxima compra, sem apagar as quantidades planejadas.

Tudo é salvo automaticamente no armazenamento local do navegador do celular (`localStorage`). Isso quer dizer:

- Os dados ficam **naquele aparelho e naquele navegador**. Se sua mãe usar o mesmo link em outro celular, vai começar do zero.
- Limpar os dados do navegador (ou usar modo anônimo/privado) apaga a lista salva.
- Não existe backend nem conta de usuário — não há como sincronizar entre dois aparelhos hoje. Se no futuro isso for necessário (por exemplo, você e sua mãe editando a mesma lista ao mesmo tempo), dá para evoluir o app para usar um banco de dados simples.

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
3. Deixe as configurações padrão (Framework: Vite) e clique em "Deploy".
4. Pronto — você recebe uma URL para enviar para sua mãe.

**Opção B — pela linha de comando:**
```bash
npm install -g vercel
vercel        # primeiro deploy (segue as perguntas)
vercel --prod # deploy de produção
```

Não é preciso configurar nenhuma variável de ambiente.

## Atualizando a lista de itens do catálogo

A seção **Outros** já é editável direto no app (adicionar/remover produtos). Já os itens fixos do "Catálogo" (nomes) ficam no código, em `src/data/catalogo.ts` — as quantidades desses itens são editadas normalmente pelo app, mas para adicionar/remover/renomear um item do catálogo fixo é preciso editar esse arquivo e publicar de novo. Se precisar, é só pedir.

## Estrutura do projeto

```
src/
  data/catalogo.ts        # itens extraídos da planilha (catálogo fixo + seção Outros)
  hooks/useShoppingList.ts # estado da lista + persistência em localStorage
  lib/storage.ts           # leitura/escrita segura do localStorage
  components/              # peças de UI reutilizáveis
  components/ui/           # componentes de base (estilo shadcn/ui)
  pages/PlanejarPage.tsx    # tela de planejamento
  pages/ComprarPage.tsx     # tela de checklist de compras
```
