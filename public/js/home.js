// ===== VARIÁVEIS GLOBAIS DINÂMICAS =====
window.appUser = '';
window.appUseMeta = false;
window.appMetaTarget = 365;
window.appMetaYear = new Date().getFullYear();
window.lastScrapedCount = 182;

// Citações movidas para public/js/quotes.js

// ===== PROXY FETCH =====
function proxyFetch(url) {
  return fetch('/api/proxy?url=' + encodeURIComponent(url))
    .then(function(res) { return res.text(); });
}

// ===== MODALS & TOASTS =====
function showToast(msg, isError) {
  var container = document.getElementById('toast-container');
  var toast = document.createElement('div');
  toast.className = 'toast-msg' + (isError ? ' error' : '');
  toast.innerText = msg;
  container.appendChild(toast);
  setTimeout(function() {
    toast.classList.add('fade-out');
    setTimeout(function() { toast.remove(); }, 300);
  }, 3000);
}

function showConfirm(title, desc, confirmText, onConfirm) {
  var overlay = document.getElementById('custom-confirm-overlay');
  document.getElementById('confirm-title').innerText = title;
  document.getElementById('confirm-desc').innerText = desc;
  var btnConfirm = document.getElementById('confirm-btn-danger');
  btnConfirm.innerText = confirmText;
  
  overlay.style.display = 'flex';
  
  document.getElementById('confirm-btn-cancel').onclick = function() {
    overlay.style.display = 'none';
  };
  btnConfirm.onclick = function() {
    overlay.style.display = 'none';
    onConfirm();
  };
}

// ===== TRACKER LOGIC =====
function renderTracker(scrapedCount, statusText, statusColor) {
  var roleta = document.getElementById('roleta-container');
  if (!window.appUseMeta) {
    document.getElementById('app-container').innerHTML = 
      '<div style="text-align:center; padding: 10px 0 20px 0;">' +
        '<h2 style="margin:0; font-size: 16px; color: #fff; text-transform: uppercase; letter-spacing: 0.1em;">Roleta Letterboxd</h2>' +
        '<div style="width: 30px; height: 3px; background: #00e054; margin: 12px auto 0 auto; border-radius: 2px;"></div>' +
      '</div>';
    var offsetHelp = document.getElementById('offset-help');
    if (offsetHelp) offsetHelp.style.display = 'none';
    var rowOffset = document.getElementById('row-offset');
    if (rowOffset) rowOffset.style.display = 'none';
    var menuTitle = document.getElementById('menu-title-meta');
    if (menuTitle) menuTitle.innerText = 'Sua Conta';
    var paneTitle = document.getElementById('pane-title-meta');
    if (paneTitle) paneTitle.innerText = 'Sua Conta';
    if (roleta) {
      roleta.style.borderTop = 'none';
    }
    return;
  }
  
  document.getElementById('config-meta-section').style.display = 'block';
  var offsetHelp = document.getElementById('offset-help');
  if (offsetHelp) offsetHelp.style.display = 'block';
  var rowOffset = document.getElementById('row-offset');
  if (rowOffset) rowOffset.style.display = 'flex';
  var menuTitle = document.getElementById('menu-title-meta');
  if (menuTitle) menuTitle.innerText = 'Conta e Metas';
  var paneTitle = document.getElementById('pane-title-meta');
  if (paneTitle) paneTitle.innerText = 'Sua Meta';


  try {
    if (scrapedCount && !isNaN(scrapedCount)) {
      window.lastScrapedCount = parseInt(scrapedCount);
      localStorage.setItem('meta365_last_scraped_' + window.appUser, window.lastScrapedCount);
    }

    var labelStatus = statusText || '• Sincronizando...';
    var corStatus = statusColor || '#678';

    var offset = localStorage.getItem('meta365_offset');
    if (offset === null) { offset = 2; localStorage.setItem('meta365_offset', 2); } 
    else { offset = parseInt(offset) || 0; }

    var watched = window.lastScrapedCount + offset;
    var now = new Date();
    // Target proporcional aos dias que se passaram no ano
    var currentDay = Math.floor((now - new Date(window.appMetaYear, 0, 0)) / (1000 * 60 * 60 * 24));
    var daysInYear = 365; // Simplificado
    var expectedToday = Math.round((window.appMetaTarget / daysInYear) * currentDay);
    
    var saldo = watched - expectedToday;
    var percent = ((watched / window.appMetaTarget) * 100).toFixed(1);
    var projection = Math.round((watched / currentDay) * daysInYear) || 0;

    var currentStatus = saldo > 0 ? 'ahead' : (saldo === 0 ? 'on_track' : 'behind');
    if (!window.currentSessionQuote || window.currentSessionQuote.status !== currentStatus) {
      var arr = saldo > 0 ? window.appQuotes.acima_da_meta : (saldo === 0 ? window.appQuotes.na_meta_exata : window.appQuotes.abaixo_da_meta);
      window.currentSessionQuote = {
        status: currentStatus,
        quote: arr[Math.floor(Math.random() * arr.length)]
      };
    }

    var color, msg;
    if (saldo > 0) { color = '#00e054'; msg = 'Com folga de ' + saldo + ' filme(s)'; }
    else if (saldo === 0) { color = '#40bcf4'; msg = 'Meta cravada no dia'; }
    else { color = '#ff4e00'; msg = 'Faltando ' + Math.abs(saldo) + ' filme(s) hoje'; }
    
    var quoteObj = window.currentSessionQuote.quote;
    var quoteText = quoteObj.quote + ' — ' + quoteObj.movie;

    document.getElementById('app-container').innerHTML =
      '<h2 class="section-heading">' +
        'Meta ' + window.appMetaTarget + ' Filmes ' +
        '<span id="sync-status" style="color:' + corStatus + '; font-size:10px; text-transform:none; margin-left:8px;">' + labelStatus + '</span>' +
        '<span style="float: right; color: #678;">DIA ' + currentDay + '/' + daysInYear + '</span>' +
      '</h2>' +
      '<div class="meta-stats-row">' +
        '<div class="meta-stat-item"><span class="meta-stat-val">' + watched + '</span><span class="meta-stat-lbl">Vistos</span></div>' +
        '<div class="meta-stat-item"><span class="meta-stat-val" style="color:' + color + '">' + (saldo > 0 ? '+' + saldo : saldo) + '</span><span class="meta-stat-lbl">Saldo</span></div>' +
        '<div class="meta-stat-item"><span class="meta-stat-val">' + Math.max(0, window.appMetaTarget - watched) + '</span><span class="meta-stat-lbl">Restam</span></div>' +
        '<div class="meta-stat-item"><span class="meta-stat-val" style="color:#40bcf4">' + projection + '</span><span class="meta-stat-lbl">Projeção</span></div>' +
      '</div>' +
      '<div class="meta-progress-header">' +
        '<span>Progresso Anual</span>' +
        '<span class="meta-progress-pct">' + percent + '%</span>' +
      '</div>' +
      '<div class="meta-bar-bg"><div class="meta-bar-fill" style="width: ' + Math.min(100, percent) + '%"></div></div>' +
      '<div class="meta-msg-box">' +
        '<div class="meta-msg-main">' +
          '<div class="meta-msg-dot" style="background:' + color + '; box-shadow: 0 0 5px ' + color + '"></div>' +
          '<span style="color:#fff">' + msg + '</span>' +
        '</div>' +
        '<div class="meta-quote">"' + quoteText + '"</div>' +
      '</div>';
  } catch (e) {
    console.error('renderTracker error:', e);
  }
}

function loadState() {
  var raw = localStorage.getItem('rouletteState_PWA');
  if (raw) {
    try { return JSON.parse(raw); } catch (e) {}
  }
  return {
    watchlist: true,
    customLists: [],
    shortOnly: false,
    maxTimeHr: 1,
    maxTimeMin: 40
  };
}
function saveState(state) {
  localStorage.setItem('rouletteState_PWA', JSON.stringify(state));
}

function renderRouletteUI() {
  document.getElementById('roleta-container').innerHTML =
    '<div id="roulette-result" class="roulette-result-box" style="display:none;">' +
      '<div style="margin: auto 0; width: 100%; flex:1 1 0; min-height:0; overflow:hidden; display:flex; flex-direction:column; align-items:center; justify-content:center;">' +
        '<span id="roulette-source" class="roulette-source-text"></span>' +
        '<div id="roulette-poster-wrap" class="roulette-poster-wrap" style="display:none;"></div>' +
        '<a id="roulette-link" class="roulette-link-text" href="#" target="_blank"></a>' +
      '</div>' +
    '</div>';
}

// ===== BIND EVENTS =====
function bindEvents() {
  document.getElementById('open-config-btn').onclick = function(e) { e.preventDefault(); if(typeof openConfig === 'function') openConfig(); };
  document.getElementById('close-config-btn').onclick = function() { if(typeof closeConfig === 'function') closeConfig(); };
  document.getElementById('reset-profile-btn').onclick = function() { if(typeof resetProfile === 'function') resetProfile(); };

  document.getElementById('num-offset').oninput = function(e) {
    localStorage.setItem('meta365_offset', parseInt(e.target.value) || 0);
    var syncEl = document.getElementById('sync-status');
    var st = syncEl ? syncEl.innerText : '• Sincronizado';
    var sc = syncEl ? syncEl.style.color : '#00e054';
    renderTracker(window.lastScrapedCount, st, sc);
  };

  document.getElementById('chk-watchlist').onchange = function(e) {
    var state = loadState(); state.watchlist = e.target.checked; saveState(state);
  };
  document.getElementById('chk-short-only').onchange = function(e) {
    var state = loadState();
    state.shortOnly = e.target.checked;
    saveState(state);
    document.getElementById('time-filter-settings').style.display = e.target.checked ? 'flex' : 'none';
  };
  document.getElementById('num-max-hr').oninput = function(e) {
    var val = parseInt(e.target.value) || 0;
    var state = loadState(); state.maxTimeHr = val; saveState(state);
  };
  document.getElementById('num-max-min').oninput = function(e) {
    var val = parseInt(e.target.value) || 0;
    var state = loadState(); state.maxTimeMin = val; saveState(state);
  };

  document.getElementById('custom-lists-container').onclick = function(e) {
    var delBtn = e.target.closest ? e.target.closest('.config-delete-btn') : null;
    if (!delBtn && e.target.classList.contains('config-delete-btn')) delBtn = e.target;
    if (delBtn && typeof removeList === 'function') removeList(parseInt(delBtn.getAttribute('data-idx')));
  };

  document.getElementById('custom-lists-container').onchange = function(e) {
    if (e.target.classList.contains('chk-ext')) {
      var state = loadState();
      var idx = parseInt(e.target.getAttribute('data-idx'));
      state.lists[idx].checked = e.target.checked;
      saveState(state);
    }
  };

  // ADD LIST
  document.getElementById('add-list-btn').onclick = function() {
    var val = document.getElementById('new-list-url').value.trim();
    if (val.indexOf('letterboxd.com/') === -1 && val.indexOf('boxd.it/') === -1) { 
      showToast('Use um link do Letterboxd ou boxd.it', true); return; 
    }
    
    try { new URL(val); } catch(err) { showToast('Link inválido', true); return; }
    
    var state = loadState();
    for (var i = 0; i < state.lists.length; i++) {
      if (state.lists[i].url === val || state.lists[i].path === new URL(val).pathname) { 
        showToast('Lista já existe', true); return; 
      }
    }
    
    state.lists.push({ url: val, checked: true });
    saveState(state);
    document.getElementById('new-list-url').value = '';
    if(typeof renderConfigLists === 'function') renderConfigLists();
  };

  // ===== SPIN ROULETTE =====
  document.getElementById('roulette-btn').onclick = async function() {
    var btn = this;
    btn.innerText = 'EMBARALHANDO...';
    btn.disabled = true;
    document.getElementById('roulette-result').style.display = 'none';

    var state = loadState();
    var sources = [];
    if (state.watchlist) sources.push({ type: 'watchlist', url: 'https://letterboxd.com/' + window.appUser + '/watchlist/' });
    state.lists.forEach(function(l) {
      if (l.checked) {
          var url = l.url ? l.url : 'https://letterboxd.com' + l.path;
          var name = 'DE UMA LISTA CUSTOMIZADA:';
          try { 
              var pathParts = new URL(url).pathname.split('/').filter(Boolean);
              if (pathParts.length >= 3 && pathParts[1] === 'list') name = "DA LISTA: " + pathParts[2].replace(/-/g, ' ').toUpperCase();
              else if (url.indexOf('boxd.it') !== -1) name = 'DE UM LINK CURTO (BOXD.IT):';
          } catch(e) {}
          sources.push({ type: 'list', url: url, name: name });
      }
    });

    if (!sources.length) {
      btn.innerText = 'ESCOLHA UMA FONTE';
      btn.disabled = false;
      return;
    }

    var source = sources[Math.floor(Math.random() * sources.length)];

    try {
      var html = await proxyFetch(source.url);
      var doc = new DOMParser().parseFromString(html, 'text/html');
      
      var pagLinks = doc.querySelectorAll('.paginate-pages li a');
      var maxPage = pagLinks.length ? parseInt(pagLinks[pagLinks.length - 1].innerText) : 1;
      var randomPage = Math.floor(Math.random() * maxPage) + 1;

      if (randomPage > 1) {
        var targetUrl = source.url.replace(/\/$/, '') + '/page/' + randomPage + '/';
        html = await proxyFetch(targetUrl);
        doc = new DOMParser().parseFromString(html, 'text/html');
      }

      var posters = Array.from(doc.querySelectorAll('.film-poster'));
      if (!posters.length) throw new Error('Vazio');

      var randomPoster = posters[Math.floor(Math.random() * posters.length)];
      var containerHtml = (randomPoster.closest('li') || randomPoster.parentNode || randomPoster).outerHTML;
      var imgNode = randomPoster.querySelector('img');
      var displayTitle = imgNode && imgNode.alt ? imgNode.alt.replace(/^Poster for /i, '').trim() : 'Filme Sorteado';

      var slug = '';
      var slugMatch = containerHtml.match(/data-film-slug=["']([^"']+)["']/);
      var targetMatch = containerHtml.match(/data-target-link=["']([^"']+)["']/);
      var aMatch = containerHtml.match(/href=["']\/film\/([^"']+)["']/);

      if (slugMatch && slugMatch[1] && slugMatch[1] !== 'null') { slug = slugMatch[1]; } 
      else if (targetMatch && targetMatch[1] && targetMatch[1] !== 'null') { slug = targetMatch[1].replace(/\/film\/|\//g, ''); } 
      else if (aMatch && aMatch[1]) { slug = aMatch[1].replace(/\//g, ''); }

      if (!slug || slug === 'null') {
        slug = displayTitle.replace(/\s*\(\d{4}\)$/, '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9\s-]/g, '').trim().replace(/\s+/g, '-').toLowerCase();
      }

      var link = 'https://letterboxd.com/film/' + slug + '/';
      var filmHtml = await proxyFetch(link);
      var filmDoc = new DOMParser().parseFromString(filmHtml, 'text/html');

      if (state.shortOnly) {
        var footer = filmDoc.querySelector('.text-link.text-footer');
        var durationMinutes = footer ? parseInt(footer.innerText.match(/\d+/)[0]) : 0;
        
        var maxLimitMinutes = (state.maxTimeHr * 60) + state.maxTimeMin;
        
        if (durationMinutes > maxLimitMinutes) {
          btn.innerText = 'LONGO... TROCANDO';
          return setTimeout(function() { btn.onclick(); }, 500);
        }
      }

      var imgSrc = imgNode ? (imgNode.getAttribute('src') || imgNode.getAttribute('data-image')) : '';
      var jsonLd = filmDoc.querySelector('script[type="application/ld+json"]');
      if (jsonLd) {
        var data = JSON.parse(jsonLd.innerText.replace(/\/\*.*?\*\//g, ''));
        if (Array.isArray(data)) {
          var found = data.find(function(i) { return i.image; });
          if (found) imgSrc = found.image;
        } else if (data.image) {
          imgSrc = data.image;
        }
      }

      document.getElementById('roulette-poster-wrap').innerHTML = '<a id="roulette-poster-link" href="' + link + '" target="_blank"><img id="roulette-poster-img" src="' + imgSrc + '" alt="Poster" style="width:100%;display:block;height:100%;object-fit:cover;min-height:0;"></a>';
      document.getElementById('roulette-poster-wrap').style.display = 'flex';
      document.getElementById('roulette-link').innerText = displayTitle;
      document.getElementById('roulette-link').href = link;
      document.getElementById('roulette-source').innerText = source.type === 'watchlist' ? 'DA SUA WATCHLIST:' : source.name;
      document.getElementById('roulette-result').style.display = 'flex';

      btn.innerText = 'O QUE ASSISTIR HOJE?';
      btn.disabled = false;

    } catch (err) {
      console.error('Roulette error:', err);
      btn.innerText = 'ERRO. TENTAR DE NOVO';
      btn.disabled = false;
    }
  };
}

// ===== INIT (Local-First) =====
function startApp() {
  document.getElementById('app-wrapper').style.display = 'flex';
  
  try {
    var savedCount = localStorage.getItem('meta365_last_scraped_' + window.appUser);
    if (savedCount !== null) { window.lastScrapedCount = parseInt(savedCount) || 0; } 
    else { window.lastScrapedCount = 0; }

    renderTracker(window.lastScrapedCount, '• Sincronizando...', '#678');
    renderRouletteUI();
    bindEvents();

    if (window.appUseMeta) {
      fetch('/api/watched-count?user=' + encodeURIComponent(window.appUser) + '&year=' + window.appMetaYear)
        .then(function(res) { return res.json(); })
        .then(function(data) {
          if (data && data.count !== undefined && !isNaN(data.count)) {
            if (data.diaryCount && data.diaryCount > data.count) {
              var autoOffset = data.diaryCount - data.count;
              localStorage.setItem('meta365_offset', autoOffset);
              var offsetInput = document.getElementById('num-offset');
              if (offsetInput) offsetInput.value = autoOffset;
            }
            
            renderTracker(data.count, '• Sincronizado', '#00e054');
          } else {
            renderTracker(window.lastScrapedCount, '• Offline', '#ff4e00');
          }
        })
        .catch(function(err) {
          console.warn('Falha silenciosa:', err);
          renderTracker(window.lastScrapedCount, '• Offline', '#ff4e00');
        });
    }
  } catch (e) {
    console.error('Init error:', e);
    if(window.appUseMeta) renderTracker(182, '• Erro', '#ff4e00');
  }
}

window.onload = function() {
  var savedUser = localStorage.getItem('lbxd_user');
  if (savedUser) {
    window.appUser = savedUser;
    window.appUseMeta = localStorage.getItem('lbxd_use_meta') === 'true';
    window.appMetaTarget = parseInt(localStorage.getItem('lbxd_meta_target')) || 365;
    window.appMetaYear = parseInt(localStorage.getItem('lbxd_meta_year')) || new Date().getFullYear();
    startApp();
  } else {
    document.getElementById('onboarding-container').style.display = 'block';
    document.getElementById('app-wrapper').style.display = 'none';
  }
};
