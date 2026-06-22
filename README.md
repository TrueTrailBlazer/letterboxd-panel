# Painel Letterboxd 🎬

Painel pessoal de acompanhamento da meta de 365 filmes + Roleta de filmes do Letterboxd.

## Como rodar localmente

```bash
npm install
npm start
```

Acesse `http://localhost:3000`

## Deploy no Render

1. Crie uma conta em [render.com](https://render.com)
2. Conecte seu repositório GitHub
3. Selecione **Web Service**
4. Configure:
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Environment:** Node
5. Deploy!

## Funcionalidades

- 📊 Tracker de meta com contagem em tempo real
- 🎰 Roleta de filmes (Watchlist + listas customizadas)
- ⏱️ Filtro de duração
- 📱 PWA (adicione à tela inicial)
- 🔄 Sincronização automática com Letterboxd
