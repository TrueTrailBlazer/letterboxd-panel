const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

const USER = 'spklf';
const YEAR = 2026;

const FETCH_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
  'Cache-Control': 'max-age=0'
};

// Serve arquivos estáticos da pasta public
app.use(express.static(path.join(__dirname, 'public')));

// API: Contagem de filmes assistidos
app.get('/api/watched-count', async function(req, res) {
  var url = 'https://letterboxd.com/' + USER + '/?tz=' + Date.now();
  try {
    var response = await fetch(url, { headers: FETCH_HEADERS });
    var html = await response.text();

    // Captura o valor de filmes assistidos no ano
    var regexFilms = new RegExp('href="/' + USER + '/films/for/' + YEAR + '/"[^>]*>.*?<span class="value">([\\d,]+)</span>', 'is');
    var matchFilms = html.match(regexFilms);

    if (matchFilms && matchFilms[1]) {
      return res.json({ count: parseInt(matchFilms[1].replace(/,/g, '')) });
    }

    // Fallback
    var regexGeneric = new RegExp('for/' + YEAR + '/"[^>]*>.*?<span class="value">([\\d,]+)</span>', 'is');
    var matchGeneric = html.match(regexGeneric);
    if (matchGeneric && matchGeneric[1]) {
      return res.json({ count: parseInt(matchGeneric[1].replace(/,/g, '')) });
    }

    res.json({ count: 182 });
  } catch (e) {
    console.error('getWatchedCount error:', e.message);
    res.json({ count: 182 });
  }
});

// API: Proxy para buscar HTML do Letterboxd (contorna CORS)
app.get('/api/proxy', async function(req, res) {
  var url = req.query.url;
  if (!url || url.indexOf('letterboxd.com') === -1) {
    return res.status(400).send('URL inválida');
  }
  try {
    var separator = url.indexOf('?') !== -1 ? '&' : '?';
    var response = await fetch(url + separator + '_cb=' + Date.now(), { headers: FETCH_HEADERS });
    var html = await response.text();
    res.send(html);
  } catch (e) {
    console.error('proxy error:', e.message);
    res.send('');
  }
});

// Fallback: serve o index.html para qualquer rota não-API
app.get('*', function(req, res) {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, function() {
  console.log('Letterboxd Panel rodando em http://localhost:' + PORT);
});
