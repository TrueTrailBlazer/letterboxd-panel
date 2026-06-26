# Letterboxd Dashboard & Roulette

Um painel pessoal definitivo para usuários do Letterboxd, desenhado com foco em uma experiência premium de uso móvel (PWA). Ele combina um **Acompanhamento de Metas de Filmes** super inteligente com uma poderosa **Roleta de Sorteios** a partir de múltiplas listas.

🔗 **Acesse ao vivo:** [https://letterboxd-panel.onrender.com](https://letterboxd-panel.onrender.com)

## Funcionalidades Principais

### Tracker de Metas Inteligente
- **Contagem em Tempo Real:** Conecta-se ao seu perfil e conta automaticamente os filmes assistidos no ano.
- **Cálculo de Projeção:** Informa sua "Folga" (quantos filmes você está adiantado/atrasado em relação ao dia exato do ano).
- **Citações Dinâmicas:** Exibe frases clássicas do cinema ("Quotes") que mudam para te elogiar se estiver adiantado ou dar uma bronca se estiver atrasado na sua meta.
- **Visual Minimalista:** O bloco de meta pode ser retraído a qualquer momento para focar no sorteio dos filmes.

### Roleta de Sorteio Avançada
- **Múltiplas Fontes:** Sorteie filmes não apenas da sua *Watchlist*, mas combine com *N* listas personalizadas ao mesmo tempo! O robô seleciona filmes mesclados de todas as fontes que você ativar.
- **Sorteio em Lote (1 a 21 filmes):** Permite sortear desde a "dica da noite" até dezenas de filmes para fazer uma grande seleção (com Grid automático).
- **Apresentação em Coverflow:** Sorteios entre 2 e 8 filmes usam um belo carrossel tátil com pôsteres em alta definição.

### Ferramentas e Filtros
- **Filtro de Duração:** Cansado de sortear um "Curta de 3 minutos" sem querer? O app possui um filtro para eliminar curtas e mini-séries da roleta.
- **Offset Personalizado:** Permite ignorar re-watches ou ajustar os números para bater com a exatidão que você espera.
- **PWA Instalável e Offline:** Experiência nativa em tela cheia no Android/iOS (sem a barra de navegação do Chrome). Graças ao **Service Worker** com estratégia de *Cache-First*, o aplicativo abre instantaneamente com seus dados salvos mesmo sem conexão com a internet.
- **Internacionalização:** Suporte rápido para troca entre Português e Inglês.

---

## Arquitetura Resiliente

Este projeto utiliza um servidor **Node.js/Express** para atuar como motor de extração de dados do Letterboxd, protegendo o app cliente e evitando quebras de UI:

- **Web Scraping via Cheerio:** Extrações baseadas em seletores CSS nativos, prevenindo quebras causadas por atualizações cosméticas na página original.
- **Prevenção de Abusos (Rate Limiting):** A API bloqueia IPs com requisições abusivas para proteger a estabilidade do painel.
- **Memória em Cache (`node-cache`):** Respostas de Listas e Watchlists ficam salvas temporariamente, economizando requisições repetidas ao servidor alvo.
- **Rotação de User-Agents:** Camuflagem inteligente de headers nas requisições do Node.js.
- **Segurança de Interface:** 100% da renderização do frontend é protegida utilizando injeção via `textContent` nas tags nativas HTML `<template>`, isolando ameaças e quebras de sintaxe (zero `innerHTML` com HTML bruto).

---

## Como rodar localmente

```bash
npm install
npm run dev
```

Acesse `http://localhost:3000`

---

## Deploy no Render

1. Crie uma conta no [render.com](https://render.com)
2. Conecte seu repositório GitHub
3. Selecione **Web Service**
4. Configure:
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Environment:** Node
5. Faça o Deploy e abra a URL no celular para instalar o PWA!
