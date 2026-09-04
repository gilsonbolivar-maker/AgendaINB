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

O site está no ar em https://gilsonbolivar-maker.github.io/AgendaINB/ e o
deploy é automático a cada push na `main`. Também dá para disparar à mão em
**Actions → Deploy to GitHub Pages → Run workflow**.

Num repositório onde o Pages ainda nunca foi ligado, a primeira execução
falha em `actions/configure-pages` com *"Resource not accessible by
integration"*: o `GITHUB_TOKEN` consegue publicar, mas não consegue criar o
site do zero. Nesse caso, ligue uma vez em **Settings → Pages → Build and
deployment → Source: GitHub Actions** e rode o workflow de novo.

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
