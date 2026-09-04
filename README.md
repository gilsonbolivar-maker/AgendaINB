# Agenda INB

Lista telefônica da INB — 1.133 colaboradores, ramal, unidade, ligação e envio de card no WhatsApp.

## Como abrir

```bash
npm install
npm run dev
```

O app sobe em `http://localhost:8080`.

## Uso rápido

- Busque por nome, matrícula, ramal ou área
- Filtre por unidade (Caetité, Resende, …)
- Abra um contato e toque em **Enviar no Zap** para mandar o card
- Favoritos, novo contato, importar/exportar JSON ficam no menu

Dados da lista INB vêm embutidos no app. Contatos que você adicionar ficam no navegador (localStorage).

## Publicação no GitHub Pages

O app é inteiramente client-side (a lista é um módulo do próprio bundle e as
edições ficam em `localStorage`), então o Pages consegue servi-lo como SPA
estática — sem servidor, sem banco e sem autenticação.

```bash
npm run build:pages     # gera dist-pages/
```

### Primeiro uso: ligar o Pages (uma vez, na mão)

Em **Settings → Pages → Build and deployment**, escolha **Source: GitHub
Actions**. Isso é obrigatório: o `GITHUB_TOKEN` do workflow não tem permissão
para criar o site sozinho, e sem esse passo a Action falha em
`actions/configure-pages` com *"Resource not accessible by integration"*.

Feito isso, rode **Actions → Deploy to GitHub Pages → Run workflow** (ou
faça qualquer push na `main`). O site fica em
`https://<usuário>.github.io/AgendaINB/`.

Depois disso o deploy é automático a cada push na branch `main`.

O caminho base vem de `PAGES_BASE` (o workflow passa o nome do repositório).
Em um fork com outro nome, ou numa página de usuário/organização servida na
raiz, ajuste a variável:

```bash
PAGES_BASE=/ npm run build:pages
```

### Duas saídas de build

| Comando | Saída | Para quê |
|---|---|---|
| `npm run build` | `.vercel/output` | App completo (SSR, auth, PGLite) |
| `npm run build:pages` | `dist-pages` | Site estático do GitHub Pages |
