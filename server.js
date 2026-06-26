const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

const FETCH_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
  'Cache-Control': 'max-age=0'
};

// Serve arquivos estáticos da pasta public
app.use(express.static(path.join(__dirname, 'public')));

// API: Contagem de filmes assistidos
app.get('/api/watched-count', async function(req, res) {
  var user = req.query.user;
  var year = req.query.year || new Date().getFullYear();

  if (!user) {
    return res.status(400).json({ error: 'Usuário não fornecido' });
  }

  var url = 'https://letterboxd.com/' + user + '/?tz=' + Date.now();
  try {
    var response = await fetch(url, { headers: FETCH_HEADERS });
    var html = await response.text();

    var result = { count: 0, diaryCount: 0 };

    // Captura FILMS (Unique)
    var regexFilms = new RegExp('href="/' + user + '/films/for/' + year + '/"[^>]*>.*?<span class="value">([\\d,]+)</span>', 'is');
    var matchFilms = html.match(regexFilms);

    if (matchFilms && matchFilms[1]) {
      result.count = parseInt(matchFilms[1].replace(/,/g, ''));
    } else {
      // Fallback
      var regexGeneric = new RegExp('for/' + year + '/"[^>]*>.*?<span class="value">([\\d,]+)</span>', 'is');
      var matchGeneric = html.match(regexGeneric);
      if (matchGeneric && matchGeneric[1]) {
        result.count = parseInt(matchGeneric[1].replace(/,/g, ''));
      }
    }

    // Captura DIARY (Total incluindo rewatches)
    var regexDiary = new RegExp('href="/' + user + '/diary/for/' + year + '/"[^>]*>.*?<span class="value">([\\d,]+)</span>', 'is');
    var matchDiary = html.match(regexDiary);
    if (matchDiary && matchDiary[1]) {
      result.diaryCount = parseInt(matchDiary[1].replace(/,/g, ''));
    }

    // Captura Avatar
    var matchAvatar = html.match(/<img[^>]+class="[^"]*profile-avatar[^"]*"[^>]+src="([^"]+)"/i);
    if (!matchAvatar) matchAvatar = html.match(/<img[^>]+class="[^"]*avatar[^"]*"[^>]+src="([^"]+)"/i);
    if (!matchAvatar) matchAvatar = html.match(/<img[^>]+src="([^"]+\/avatar\/[^"]+)"/i);
    if (matchAvatar && matchAvatar[1]) {
      result.avatarUrl = matchAvatar[1];
    }

    res.json(result);
  } catch (e) {
    console.error('getWatchedCount error:', e.message);
    res.status(500).json({ error: 'Falha ao buscar dados' });
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

app.listen(PORT, '0.0.0.0', function() {
  console.log('Letterboxd Panel rodando na porta ' + PORT);
});
