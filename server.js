const express = require('express');
const path = require('path');
const cheerio = require('cheerio');
const rateLimit = require('express-rate-limit');
const NodeCache = require('node-cache');

const app = express();
const PORT = process.env.PORT || 3000;

// ===== CACHE (TTL de 15 minutos) =====
const pageCache = new NodeCache({ stdTTL: 900, checkperiod: 120 });

// ===== USER-AGENT ROTATION =====
const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_5) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:127.0) Gecko/20100101 Firefox/127.0',
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1',
];

function getHeaders() {
  return {
    'User-Agent': USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)],
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Cache-Control': 'max-age=0',
  };
}

// ===== FETCH COM CACHE =====
async function cachedFetch(url) {
  var cached = pageCache.get(url);
  if (cached) return cached;

  var response = await fetch(url, { headers: getHeaders() });
  var html = await response.text();
  pageCache.set(url, html);
  return html;
}

// ===== RATE LIMITER =====
const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minuto
  max: 30, // máximo 30 requisições por minuto por IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Muitas requisições. Tente novamente em 1 minuto.' },
});

// ===== MIDDLEWARE =====
// Habilita a confiança no proxy reverso do Render para o rate-limiter funcionar
app.set('trust proxy', 1);

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use('/api/', apiLimiter);

// ===== API: Contagem de filmes assistidos (com Cheerio) =====
app.get('/api/watched-count', async function(req, res) {
  var user = req.query.user;
  var year = req.query.year || new Date().getFullYear();

  if (!user) {
    return res.status(400).json({ error: 'Usuário não fornecido' });
  }

  var url = 'https://letterboxd.com/' + user + '/';
  try {
    var html = await cachedFetch(url + '?tz=' + Date.now());
    var $ = cheerio.load(html);

    var result = { count: 0, diaryCount: 0 };

    // Captura FILMS (Unique) via seletor CSS
    var filmsLink = $('a[href="/' + user + '/films/for/' + year + '/"]');
    if (filmsLink.length) {
      var filmsValue = filmsLink.find('.value').text().trim();
      if (filmsValue) result.count = parseInt(filmsValue.replace(/,/g, ''));
    }

    // Fallback: buscar qualquer link com "/for/YEAR/" que tenha um .value
    if (!result.count) {
      $('a[href*="/for/' + year + '/"]').each(function() {
        var val = $(this).find('.value').text().trim();
        if (val && !result.count) {
          result.count = parseInt(val.replace(/,/g, ''));
        }
      });
    }

    // Captura DIARY (Total incluindo rewatches)
    var diaryLink = $('a[href="/' + user + '/diary/for/' + year + '/"]');
    if (diaryLink.length) {
      var diaryValue = diaryLink.find('.value').text().trim();
      if (diaryValue) result.diaryCount = parseInt(diaryValue.replace(/,/g, ''));
    }

    // Captura Avatar via Cheerio
    var avatarImg = $('img.profile-avatar, img.avatar, img[src*="/avatar/"]').first();
    if (avatarImg.length) {
      result.avatarUrl = avatarImg.attr('src');
    }

    res.json(result);
  } catch (e) {
    console.error('getWatchedCount error:', e.message);
    res.status(500).json({ error: 'Falha ao buscar dados' });
  }
});

// ===== API: ROULETTE (todo o scraping pesado no backend) =====
app.post('/api/roulette', async function(req, res) {
  var sources = req.body.sources; // [{ type, url, name }]
  var drawCount = parseInt(req.body.drawCount) || 1;
  var filter = req.body.filter || {}; // { shortOnly, maxTimeHr, maxTimeMin }

  if (!sources || !sources.length) {
    return res.status(400).json({ error: 'Nenhuma fonte fornecida' });
  }

  try {
    var allPosters = [];

    // 1. Buscar todas as fontes em paralelo
    await Promise.all(sources.map(async function(source) {
      try {
        var html = await cachedFetch(source.url);
        var $ = cheerio.load(html);

        // Detectar paginação
        var maxPage = 1;
        $('.paginate-pages li a').each(function() {
          var num = parseInt($(this).text());
          if (!isNaN(num) && num > maxPage) maxPage = num;
        });

        // Sortear página aleatória
        var randomPage = Math.floor(Math.random() * maxPage) + 1;
        if (randomPage > 1) {
          var targetUrl = source.url.replace(/\/$/, '') + '/page/' + randomPage + '/';
          html = await cachedFetch(targetUrl);
          $ = cheerio.load(html);
        }

        // Extrair posters via Cheerio
        $('.film-poster').each(function() {
          var el = $(this);
          var container = el.closest('li').length ? el.closest('li') : el.parent();

          var imgNode = el.find('img').first();
          var displayTitle = imgNode.attr('alt') || 'Filme sorteado';
          displayTitle = displayTitle.replace(/^Poster for /i, '').trim();

          var slug = el.attr('data-film-slug') || '';
          if (!slug || slug === 'null') {
            var targetLink = el.attr('data-target-link') || '';
            if (targetLink) slug = targetLink.replace(/\/film\/|\//g, '');
          }
          if (!slug || slug === 'null') {
            var aTag = container.find('a[href*="/film/"]').first();
            if (aTag.length) {
              slug = aTag.attr('href').replace(/\/film\/|\//g, '');
            }
          }
          if (!slug || slug === 'null') {
            slug = displayTitle.replace(/\s*\(\d{4}\)$/, '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9\s-]/g, '').trim().replace(/\s+/g, '-').toLowerCase();
          }

          var imgSrc = el.attr('data-image-url') || el.attr('data-poster-url') || imgNode.attr('data-image') || imgNode.attr('data-src') || imgNode.attr('src') || '';
          
          // Prevenção contra lazy load pixels
          if (imgSrc && (imgSrc.includes('empty-poster') || imgSrc.includes('transparent') || imgSrc.startsWith('data:image'))) {
            imgSrc = imgNode.attr('data-image') || el.attr('data-image-url') || '';
          }

          allPosters.push({
            title: displayTitle,
            slug: slug,
            imgSrc: imgSrc,
            sourceName: source.name || source.type,
          });
        });
      } catch (e) {
        console.error('Erro ao puxar fonte', source.url, e.message);
      }
    }));

    if (!allPosters.length) {
      return res.status(404).json({ error: 'Nenhum filme encontrado nas fontes' });
    }

    // 2. Embaralhar (Fisher-Yates)
    for (var i = allPosters.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var temp = allPosters[i];
      allPosters[i] = allPosters[j];
      allPosters[j] = temp;
    }

    // 3. Validar filmes (buscar detalhes: imagem HD, duração, sinopse)
    var validMovies = [];
    var idx = 0;

    while (validMovies.length < drawCount && idx < allPosters.length) {
      var batchSize = Math.min(5, drawCount - validMovies.length, allPosters.length - idx);
      var batch = allPosters.slice(idx, idx + batchSize);
      idx += batchSize;

      var results = await Promise.all(batch.map(async function(poster) {
        try {
          var filmUrl = 'https://letterboxd.com/film/' + poster.slug + '/';
          var filmHtml = await cachedFetch(filmUrl);
          var $f = cheerio.load(filmHtml);

          // Filtro de duração (Apenas Filmes Curtos)
          if (filter.shortOnly) {
            var footerText = $f('.text-link.text-footer').text();
            var durationMatch = footerText.match(/(\d+)\s*min/);
            var durationMinutes = durationMatch ? parseInt(durationMatch[1]) : 0;
            var minLimitMinutes = ((filter.maxTimeHr || 1) * 60) + (filter.maxTimeMin || 40);
            if (durationMinutes > 0 && durationMinutes > minLimitMinutes) return null;
          }

          // Imagem HD via JSON-LD
          var jsonLdScript = $f('script[type="application/ld+json"]').first();
          if (jsonLdScript.length) {
            try {
              var jsonText = jsonLdScript.html().replace(/\/\*.*?\*\//g, '');
              var data = JSON.parse(jsonText);
              var movieData = Array.isArray(data) ? data.find(function(item) { return item['@type'] === 'Movie' || item.image; }) : data;
              if (movieData) {
                if (movieData.image) poster.imgSrc = movieData.image;
                
                // Get Year
                if (movieData.dateCreated) poster.year = movieData.dateCreated.substring(0, 4);
                else if (movieData.datePublished) poster.year = movieData.datePublished.substring(0, 4);
                
                // Get Director
                if (movieData.director && Array.isArray(movieData.director) && movieData.director.length > 0) {
                  poster.director = movieData.director[0].name;
                } else if (movieData.director && movieData.director.name) {
                  poster.director = movieData.director.name;
                }
                
                // Get Genres
                if (movieData.genre) {
                  poster.genres = Array.isArray(movieData.genre) ? movieData.genre.slice(0, 2) : [movieData.genre];
                }
              }
            } catch (parseErr) { /* ignore JSON parse errors */ }
          }

          // Sinopse
          var synopsis = '';
          var metaOg = $f('meta[property="og:description"]').attr('content');
          var metaName = $f('meta[name="description"]').attr('content');
          synopsis = metaOg || metaName || '';
          if (synopsis) {
            synopsis = synopsis.replace(/^.*? directed by .*?\.\s*/i, '');
            if (synopsis.length > 600) synopsis = synopsis.substring(0, 600) + '...';
          }

          return {
            title: poster.title,
            slug: poster.slug,
            imgSrc: poster.imgSrc,
            sourceName: poster.sourceName,
            synopsis: synopsis,
            year: poster.year || '',
            director: poster.director || '',
            genres: poster.genres || []
          };
        } catch (e) {
          console.error('Film detail error:', poster.slug, e.message);
          return null;
        }
      }));

      for (var r = 0; r < results.length; r++) {
        if (results[r] !== null && validMovies.length < drawCount) {
          validMovies.push(results[r]);
        }
      }
    }

    if (!validMovies.length) {
      return res.status(404).json({ error: 'Nenhum filme válido encontrado' });
    }

    res.json({ movies: validMovies });
  } catch (e) {
    console.error('Roulette error:', e.message);
    res.status(500).json({ error: 'Erro interno ao sortear filmes' });
  }
});

// Fallback: serve o index.html para qualquer rota não-API
app.get('*', function(req, res) {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, '0.0.0.0', function() {
  console.log('Letterboxd Panel rodando na porta ' + PORT);
});
