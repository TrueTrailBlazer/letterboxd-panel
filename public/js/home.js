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
  var toast = document.createElement('div');
  toast.className = 'toast-msg' + (isError ? ' error' : '');
  toast.innerText = window.t(msg) || msg;
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
  var appCont = document.getElementById('app-container');
  
  var savedAvatar = localStorage.getItem('lbxd_avatar_' + window.appUser);
  var avatarSvg = '<svg fill="#89a" height="36" viewBox="0 0 24 24" width="36" xmlns="http://www.w3.org/2000/svg" style="margin-right:8px;"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>';
  var avatarHtml = savedAvatar ? '<img src="' + savedAvatar + '" style="width:36px; height:36px; border-radius:50%; margin-right:8px; border:1px solid #2c3440; object-fit:cover;" onerror="this.outerHTML=\'' + avatarSvg.replace(/"/g, '&quot;') + '\'">' : avatarSvg;

  if (!window.appUseMeta) {
    if (appCont) {
      appCont.style.display = 'block';
      appCont.innerHTML = 
        '<div style="display:flex; flex-direction:column; align-items:center; justify-content:center; padding: 10px 0 0 0;">' +
          '<div style="display:flex; align-items:center; background: #14181c; border: 1px solid #2c3440; padding: 6px 16px 6px 6px; border-radius: 26px; box-shadow: 0 4px 6px rgba(0,0,0,0.3);">' +
            avatarHtml +
            '<span style="font-size: 14px; font-weight: bold; color: #fff; text-transform: uppercase; letter-spacing: 1px;">' + window.appUser + '</span>' +
          '</div>' +
          '<h2 style="margin: 16px 0 0 0; font-size: 12px; color: #89a; text-transform: uppercase; letter-spacing: 0.1em;">Roleta Letterboxd</h2>' +
          '<div style="width: 24px; height: 3px; background: #00e054; margin: 8px auto 0 auto; border-radius: 2px;"></div>' +
        '</div>';
    }
    var offsetHelp = document.getElementById('offset-help');
    if (offsetHelp) offsetHelp.style.display = 'none';
    var rowOffset = document.getElementById('row-offset');
    if (rowOffset) rowOffset.style.display = 'none';
    var menuTitle = document.getElementById('menu-title-meta');
    if (menuTitle) menuTitle.innerText = window.t('menu_account_only');
    var paneTitle = document.getElementById('pane-title-meta');
    if (paneTitle) paneTitle.innerText = window.t('menu_account_only');
    if (roleta) {
      roleta.style.borderTop = 'none';
      roleta.style.justifyContent = 'center';
      roleta.style.marginTop = '0';
      roleta.style.paddingTop = '0';
    }
    return;
  }
  
  if (appCont) {
    appCont.style.display = 'block';
  }
  if (roleta) {
    roleta.style.justifyContent = 'flex-start';
    roleta.style.marginTop = '10px';
    roleta.style.paddingTop = '10px';
    roleta.style.borderTop = '1px solid #2c3440';
  }
  
  document.getElementById('config-meta-section').style.display = 'block';
  var offsetHelp = document.getElementById('offset-help');
  if (offsetHelp) offsetHelp.style.display = 'block';
  var rowOffset = document.getElementById('row-offset');
  if (rowOffset) rowOffset.style.display = 'flex';
  var menuTitle = document.getElementById('menu-title-meta');
  if (menuTitle) menuTitle.innerText = window.t('menu_account');
  var paneTitle = document.getElementById('pane-title-meta');
  if (paneTitle) paneTitle.innerText = window.t('menu_account');


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
    if (saldo > 0) { color = '#00e054'; msg = window.t('msg_ahead').replace('{count}', saldo); }
    else if (saldo === 0) { color = '#40bcf4'; msg = window.t('msg_on_track'); }
    else { color = '#ff4e00'; msg = window.t('msg_behind').replace('{count}', Math.abs(saldo)); }
    
    var quoteObj = window.currentSessionQuote.quote;
    var quoteText = quoteObj.quote + ' — ' + quoteObj.movie;

    var cardHtml = 
      '<div style="background: #14181c; border-radius: 8px; border: 1px solid #2c3440; overflow: hidden; margin-bottom: 24px; box-shadow: 0 4px 6px rgba(0,0,0,0.3);">' +
        // Card Header (Title & Status)
        '<div style="padding: 16px; border-bottom: 1px solid #2c3440; display: flex; justify-content: space-between; align-items: center;">' +
          '<div style="display: flex; align-items: center;">' +
            avatarHtml +
            '<span style="font-size: 14px; font-weight: bold; color: #fff; text-transform: uppercase;">' + window.t('lbl_goal_title').replace('{target}', window.appMetaTarget) + '</span>' +
          '</div>' +
          '<div style="display: flex; align-items: center; gap: 8px;">' +
            '<span id="sync-status" data-status-key="' + labelStatus + '" style="color:' + corStatus + '; font-size:11px;">' + window.t(labelStatus) + '</span>' +
          '</div>' +
        '</div>' +

        // Progress Area
        '<div style="padding: 16px 16px 0 16px;">' +
          '<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">' +
            '<span style="font-size: 11px; font-weight: bold; color: ' + color + ';">' + msg + ' <span style="color:#89a; margin-left:4px;">(' + percent + '%)</span></span>' +
            '<span style="font-size: 11px; color: #678; text-transform: uppercase;">' + window.t('stat_day') + ' ' + currentDay + '/' + daysInYear + '</span>' +
          '</div>' +
          // PILL PROGRESS BAR
          '<div style="width: 100%; height: 6px; background: #2c3440; border-radius: 3px; overflow: hidden; position: relative;">' +
            '<div style="height: 100%; background: #00e054; width: ' + Math.min(100, percent) + '%; border-radius: 3px;"></div>' +
          '</div>' +
        '</div>' +
        
        // Card Body (Stats Grid)
        '<div style="padding: 16px; display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">' +
          
          '<div style="display: flex; flex-direction: column;">' +
            '<span style="font-size: 24px; font-weight: bold; color: #fff; line-height: 1;">' + watched + '</span>' +
            '<span style="font-size: 11px; color: #89a; text-transform: uppercase; margin-top: 4px;">' + window.t('stat_watched') + '</span>' +
          '</div>' +
          
          '<div style="display: flex; flex-direction: column;">' +
            '<span style="font-size: 24px; font-weight: bold; color: ' + color + '; line-height: 1;">' + (saldo > 0 ? '+' + saldo : saldo) + '</span>' +
            '<span style="font-size: 11px; color: #89a; text-transform: uppercase; margin-top: 4px;">' + window.t('stat_balance') + '</span>' +
          '</div>' +

          '<div style="display: flex; flex-direction: column;">' +
            '<span style="font-size: 24px; font-weight: bold; color: #fff; line-height: 1;">' + Math.max(0, window.appMetaTarget - watched) + '</span>' +
            '<span style="font-size: 11px; color: #89a; text-transform: uppercase; margin-top: 4px;">' + window.t('stat_remaining') + '</span>' +
          '</div>' +

          '<div style="display: flex; flex-direction: column;">' +
            '<span style="font-size: 24px; font-weight: bold; color: #40bcf4; line-height: 1;">' + projection + '</span>' +
            '<span style="font-size: 11px; color: #89a; text-transform: uppercase; margin-top: 4px;">' + window.t('stat_projection') + '</span>' +
          '</div>' +

        '</div>' +

        // Quote Box
        '<div style="background: rgba(255,255,255,0.02); padding: 12px 16px; border-top: 1px solid #2c3440; font-size: 12px; font-style: italic; color: #89a; text-align: center; line-height: 1.4;">' +
          '"' + quoteText + '"' +
        '</div>' +

      '</div>';
      
    document.getElementById('app-container').innerHTML = cardHtml;
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
      '<div style="margin: auto 0; width: 100%; min-height:0; display:flex; flex-direction:column; align-items:center; justify-content:center;">' +
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
    var st = syncEl ? syncEl.getAttribute('preferred-status-key') : 'stat_synced';
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
  
  function updateSliderValue(val) {
    if (val < 1) val = 1;
    if (val > 20) val = 20;
    var drawSlider = document.getElementById('draw-count-slider');
    if (drawSlider) {
      drawSlider.value = val;
      document.getElementById('draw-count-label').innerText = val;
      localStorage.setItem('lbxd_draw_count', val);
    }
  }

  var drawSlider = document.getElementById('draw-count-slider');
  if (drawSlider) {
    drawSlider.oninput = function(e) { updateSliderValue(parseInt(e.target.value) || 1); };
  }
  var drawMinus = document.getElementById('draw-count-minus');
  if (drawMinus) {
    drawMinus.onclick = function() {
      var current = parseInt(document.getElementById('draw-count-slider').value) || 1;
      updateSliderValue(current - 1);
    };
  }
  var drawPlus = document.getElementById('draw-count-plus');
  if (drawPlus) {
    drawPlus.onclick = function() {
      var current = parseInt(document.getElementById('draw-count-slider').value) || 1;
      updateSliderValue(current + 1);
    };
  }

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
      showToast(window.t('err_use_link'), true); return; 
    }
    
    try { new URL(val); } catch(err) { showToast(window.t('err_invalid_link'), true); return; }
    
    var state = loadState();
    for (var i = 0; i < state.lists.length; i++) {
      if (state.lists[i].url === val || state.lists[i].path === new URL(val).pathname) { 
        showToast(window.t('err_list_exists'), true); return; 
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
    btn.innerText = window.t('msg_shuffling');
    btn.disabled = true;
    document.getElementById('roulette-result').style.display = 'none';

    var state = loadState();
    var sources = [];
    if (state.watchlist) sources.push({ type: 'watchlist', url: 'https://letterboxd.com/' + window.appUser + '/watchlist/' });
    state.lists.forEach(function(l) {
      if (l.checked) {
          var url = l.url ? l.url : 'https://letterboxd.com' + l.path;
          var name = window.t('lbl_custom_list_source');
          try { 
              var pathParts = new URL(url).pathname.split('/').filter(Boolean);
              if (pathParts.length >= 3 && pathParts[1] === 'list') name = window.t('lbl_list_source').replace('{name}', pathParts[2].replace(/-/g, ' ').toUpperCase());
              else if (url.indexOf('boxd.it') !== -1) name = window.t('lbl_short_link_source');
          } catch(e) {}
          sources.push({ type: 'list', url: url, name: name });
      }
    });

    if (!sources.length) {
      btn.innerText = window.t('btn_choose_source');
      btn.disabled = false;
      return;
    }

    var drawCount = parseInt(localStorage.getItem('lbxd_draw_count')) || 1;

    try {
      var allPosters = [];
      await Promise.all(sources.map(async function(source) {
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
          var sName = source.type === 'watchlist' ? window.t('lbl_from_watch') : source.name;
          posters.forEach(function(p) {
            allPosters.push({ element: p, sourceName: sName });
          });
        } catch(e) {
          console.error("Erro ao puxar fonte", source.url, e);
        }
      }));

      if (!allPosters.length) throw new Error('Vazio');

      // Embaralha TODOS os posters combinados
      allPosters = allPosters.sort(function() { return 0.5 - Math.random() });

      var validMovies = [];
      var idx = 0;
      
      while(validMovies.length < drawCount && idx < allPosters.length) {
        var batch = [];
        while (batch.length < 5 && idx < allPosters.length && (validMovies.length + batch.length) < drawCount) {
           batch.push(allPosters[idx++]);
        }
        
        var results = await Promise.all(batch.map(async function(randomPosterObj) {
            var randomPoster = randomPosterObj.element;
            var currentSourceName = randomPosterObj.sourceName;
            
            var containerHtml = (randomPoster.closest('li') || randomPoster.parentNode || randomPoster).outerHTML;
            var imgNode = randomPoster.querySelector('img');
            var displayTitle = imgNode && imgNode.alt ? imgNode.alt.replace(/^Poster for /i, '').trim() : window.t('lbl_drawn_film');
            
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
            var filmHtml = await proxyFetch(link).catch(function(){ return ''; });
            if(!filmHtml) return null;
            
            var filmDoc = new DOMParser().parseFromString(filmHtml, 'text/html');
            if (state.shortOnly) {
              var footer = filmDoc.querySelector('.text-link.text-footer');
              var durationMinutes = footer ? parseInt(footer.innerText.match(/\d+/)[0]) : 0;
              var maxLimitMinutes = (state.maxTimeHr * 60) + state.maxTimeMin;
              if (durationMinutes > maxLimitMinutes) return null;
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
            var synopsis = '';
            var metaDesc = filmDoc.querySelector('meta[property="og:description"]');
            if (metaDesc) synopsis = metaDesc.getAttribute('content');
            if (!synopsis) {
              var metaName = filmDoc.querySelector('meta[name="description"]');
              if (metaName) synopsis = metaName.getAttribute('content');
            }
            if (synopsis) {
              synopsis = synopsis.replace(/^.*? directed by .*?\.\s*/i, '');
              if (synopsis.length > 600) synopsis = synopsis.substring(0, 600) + '...';
            }

            return { title: displayTitle, link: link, imgSrc: imgSrc, sourceName: currentSourceName, synopsis: synopsis };
        }));
        
        for (var i = 0; i < results.length; i++) {
           if(results[i] !== null && validMovies.length < drawCount) {
               validMovies.push(results[i]);
           }
        }
      }

      if (!validMovies.length) throw new Error(window.t('err_empty'));

      window.currentDrawData = validMovies;
      var resultHtml = '';
      
      if (validMovies.length === 1) {
        var m = validMovies[0];
        resultHtml = 
          '<div style="margin: auto 0; width: 100%; min-height:0; display:flex; flex-direction:column; align-items:center; justify-content:center;">' +
            '<span id="roulette-source" class="roulette-source-text">' + m.sourceName + '</span>' +
            '<div class="roulette-poster-wrap" style="display:flex;">' +
              '<a id="roulette-poster-link" href="' + m.link + '"><img id="roulette-poster-img" src="' + m.imgSrc + '" alt="Poster" style="width:100%;display:block;height:auto;object-fit:cover;"></a>' +
            '</div>' +
            '<a id="roulette-link" class="roulette-link-text" href="' + m.link + '">' + m.title + '</a>' +
          '</div>';
      } else if (validMovies.length >= 2 && validMovies.length <= 5) {
        var sourceLabel = sources.length > 1 ? window.t('lbl_multi_source') : validMovies[0].sourceName;
        var swiperHtml = '<div class="swiper" style="width: 100%; padding: 20px 0; flex-shrink: 0;"><div class="swiper-wrapper">';
        
        for (var i = 0; i < validMovies.length; i++) {
          var m = validMovies[i];
          var clickJs = "openPosterModal(" + i + ")";
          swiperHtml += 
            '<div class="swiper-slide" onclick="' + clickJs + '" style="width: 220px; aspect-ratio: 2/3; height: auto;">' +
              '<img src="' + m.imgSrc + '" style="width: 100%; height: 100%; object-fit: cover; border-radius: 8px; display: block; box-shadow: 0 4px 10px rgba(0,0,0,0.5);">' +
            '</div>';
        }
        swiperHtml += '</div></div>';
        
        resultHtml = 
          '<div style="width: 100%; height: 100%; display:flex; flex-direction:column; align-items:center; justify-content:center;">' +
            '<span class="roulette-source-text" style="margin-bottom: 0; text-align: center;">' + sourceLabel + '</span>' +
            swiperHtml +
            '<span class="roulette-source-text" style="margin-top: 10px; font-size: 10px; color:#567;" data-i18n="lbl_tap_details">' + window.t('lbl_tap_details') + '</span>' +
          '</div>';
      } else {
        var gridHtml = '<div class="roulette-grid">';
        for (var i = 0; i < validMovies.length; i++) {
          var m = validMovies[i];
          var clickJs = "openPosterModal(" + i + ")";
          gridHtml += '<div class="grid-poster-wrap" onclick="' + clickJs + '"><img src="' + m.imgSrc + '"></div>';
        }
        gridHtml += '</div>';
        
        var sourceLabel = sources.length > 1 ? window.t('lbl_multi_source') : validMovies[0].sourceName;
        
        resultHtml = 
          '<div style="width: 100%; height: 100%; display:flex; flex-direction:column; align-items:center; overflow:hidden; justify-content:center;">' +
            '<span class="roulette-source-text" style="margin-bottom: 12px; text-align: center;">' + sourceLabel + '</span>' +
            gridHtml +
          '</div>';
      }
      
      document.getElementById('roulette-result').innerHTML = resultHtml;
      document.getElementById('roulette-result').style.display = 'flex';

      if (validMovies.length >= 2 && validMovies.length <= 5 && typeof Swiper !== 'undefined') {
        new Swiper('.swiper', {
          effect: 'coverflow',
          grabCursor: true,
          centeredSlides: true,
          slidesPerView: 'auto',
          coverflowEffect: {
            rotate: 20,
            stretch: 0,
            depth: 150,
            modifier: 1,
            slideShadows: true,
          },
          initialSlide: Math.floor(validMovies.length / 2)
        });
      }

      btn.innerText = window.t('btn_roulette');
      btn.disabled = false;

    } catch (err) {
      console.error('Roulette error:', err);
      btn.innerText = window.t('btn_error_retry');
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

    renderTracker(window.lastScrapedCount, 'stat_syncing', '#678');
    renderRouletteUI();
    bindEvents();

    if (window.appUseMeta) {
      // Fetch avatar in background (Immediate Cache Check)
      var savedAvatar = localStorage.getItem('lbxd_avatar_' + window.appUser);
      if (savedAvatar) renderTracker(window.lastScrapedCount, 'stat_syncing', '#678');

      fetch('/api/watched-count?user=' + encodeURIComponent(window.appUser) + '&year=' + window.appMetaYear)
        .then(function(res) { return res.json(); })
        .then(function(data) {
          if (data && data.avatarUrl) {
             localStorage.setItem('lbxd_avatar_' + window.appUser, data.avatarUrl);
          }
          if (data && data.count !== undefined && !isNaN(data.count)) {
            if (data.diaryCount && data.diaryCount > data.count) {
              var autoOffset = data.diaryCount - data.count;
              localStorage.setItem('meta365_offset', autoOffset);
              var offsetInput = document.getElementById('num-offset');
              if (offsetInput) offsetInput.value = autoOffset;
            }
            
            renderTracker(data.count, 'stat_synced', '#00e054');
          } else {
            renderTracker(window.lastScrapedCount, 'stat_offline', '#ff4e00');
          }
        })
        .catch(function(err) {
          console.warn('Falha silenciosa:', err);
          renderTracker(window.lastScrapedCount, 'stat_offline', '#ff4e00');
        });
        
      // Fetch avatar in background (Scrape Update)
      fetch('/api/proxy?url=' + encodeURIComponent('https://letterboxd.com/' + window.appUser + '/'))
        .then(function(res) { 
           if (!res.ok) throw new Error('HTTP ' + res.status);
           return res.text(); 
        })
        .then(function(html) {
          var doc = new DOMParser().parseFromString(html, 'text/html');
          var avatarImg = doc.querySelector('.profile-avatar img, .avatar img, img.avatar, img[src*="/avatar/"]');
          if (avatarImg && avatarImg.src && avatarImg.src !== localStorage.getItem('lbxd_avatar_' + window.appUser)) {
             localStorage.setItem('lbxd_avatar_' + window.appUser, avatarImg.src);
             var syncEl = document.getElementById('sync-status');
             var st = syncEl ? syncEl.getAttribute('data-status-key') : 'stat_synced';
             var sc = syncEl ? syncEl.style.color : '#00e054';
             renderTracker(window.lastScrapedCount, st, sc);
          }
        }).catch(function(e){
           console.warn('Background avatar fetch failed', e);
        });
        
    }
  } catch (e) {
    console.error('Init error:', e);
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

window.openPosterModal = function(index) {
  var m = window.currentDrawData ? window.currentDrawData[index] : null;
  if (!m) return;
  document.getElementById('modal-poster-img').src = m.imgSrc;
  document.getElementById('modal-link').innerText = m.title;
  document.getElementById('modal-link').href = m.link;
  document.getElementById('modal-img-link').href = m.link;
  document.getElementById('modal-source').innerText = m.sourceName;
  
  var synEl = document.getElementById('modal-synopsis');
  if (m.synopsis) {
    synEl.innerText = m.synopsis;
    synEl.style.display = 'block';
  } else {
    synEl.style.display = 'none';
  }
  
  document.getElementById('poster-modal').classList.add('active');
};

window.closePosterModal = function(e) {
  if (e && e.target.id !== 'poster-modal') return;
  document.getElementById('poster-modal').classList.remove('active');
};

// ==========================================
// MÓDULO: CUSTOM PULL-TO-REFRESH
// ==========================================
(function() {
  var startY = 0;
  var ptrEl = null;
  var isRefreshing = false;

  document.addEventListener('touchstart', function(e) {
    if (isRefreshing) return;
    if (!ptrEl) ptrEl = document.getElementById('custom-ptr');
    
    var overlay = document.getElementById('config-overlay');
    if (overlay && overlay.style.display !== 'none' && overlay.style.display !== '') return;
    
    // Check if user is scrolling inside any inner element (like roulette-grid)
    var current = e.target;
    var isScrollingInner = false;
    while(current && current !== document.body && current !== document) {
      if (current.scrollTop > 0) {
        isScrollingInner = true;
        break;
      }
      current = current.parentNode;
    }
    if (isScrollingInner) return;

    var wrapper = document.getElementById('app-wrapper');
    if (wrapper && wrapper.scrollTop > 0) return;

    startY = e.touches[0].clientY;
  }, { passive: true });

  document.addEventListener('touchmove', function(e) {
    if (isRefreshing || startY === 0 || !ptrEl) return;
    var currentY = e.touches[0].clientY;
    var dy = currentY - startY;
    
    if (dy > 0) {
      var current = e.target;
      var isScrollingInner = false;
      while(current && current !== document.body && current !== document) {
        if (current.scrollTop > 0) {
          isScrollingInner = true;
          break;
        }
        current = current.parentNode;
      }
      if (isScrollingInner) return;

      var wrapper = document.getElementById('app-wrapper');
      if (wrapper && wrapper.scrollTop > 0) return;

      var dist = Math.min(dy * 0.4, 60); 
      ptrEl.style.transition = 'none';
      ptrEl.style.transform = 'translateY(' + (dist - 60) + 'px)';
    }
  }, { passive: true });

  document.addEventListener('touchend', function(e) {
    if (isRefreshing || startY === 0 || !ptrEl) return;
    var dy = e.changedTouches[0].clientY - startY;
    
    if (dy > 80) {
      isRefreshing = true;
      ptrEl.style.transition = 'transform 0.2s';
      ptrEl.style.transform = 'translateY(0px)';
      var spin = ptrEl.querySelector('svg');
      if (spin) {
        spin.style.animation = 'spin 1s linear infinite';
      }
      setTimeout(function() {
        window.location.reload(true);
      }, 500);
    } else {
      ptrEl.style.transition = 'transform 0.2s';
      ptrEl.style.transform = 'translateY(-100%)';
    }
    startY = 0;
  }, { passive: true });
})();
