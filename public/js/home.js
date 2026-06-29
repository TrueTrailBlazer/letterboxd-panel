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
  
  // Helper: create avatar element safely
  function createAvatarEl(size) {
    if (savedAvatar) {
      var img = document.createElement('img');
      img.src = savedAvatar;
      img.style.cssText = 'width:' + size + 'px; height:' + size + 'px; border-radius:50%; margin-right:12px; border:1px solid #2c3440; object-fit:cover;';
      img.onerror = function() {
        var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('fill', '#89a');
        svg.setAttribute('height', size);
        svg.setAttribute('width', size);
        svg.setAttribute('viewBox', '0 0 24 24');
        svg.style.marginRight = '12px';
        var p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        p.setAttribute('d', 'M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z');
        svg.appendChild(p);
        img.parentNode.replaceChild(svg, img);
      };
      return img;
    } else {
      var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('fill', '#89a');
      svg.setAttribute('height', size);
      svg.setAttribute('width', size);
      svg.setAttribute('viewBox', '0 0 24 24');
      svg.style.marginRight = '12px';
      var p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      p.setAttribute('d', 'M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z');
      svg.appendChild(p);
      return svg;
    }
  }

  // === ROULETTE-ONLY MODE ===
  if (!window.appUseMeta) {
    if (appCont) {
      appCont.style.display = 'block';
      var rhTmpl = document.getElementById('tmpl-roulette-header');
      if (rhTmpl) {
        var clone = rhTmpl.content.cloneNode(true);
        clone.getElementById('tmpl-rh-link').href = 'https://letterboxd.com/' + window.appUser + '/';
        clone.getElementById('tmpl-rh-avatar').appendChild(createAvatarEl(54));
        clone.getElementById('tmpl-rh-username').textContent = window.appUser;
        appCont.innerHTML = '';
        appCont.appendChild(clone);
      }
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
  
  // === META MODE ===
  if (appCont) appCont.style.display = 'block';
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
    var currentDay = Math.floor((now - new Date(window.appMetaYear, 0, 0)) / (1000 * 60 * 60 * 24));
    var daysInYear = 365;
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
    
    // Inject quote into empty state
    var quoteObj = window.currentSessionQuote.quote;
    var quoteContainer = document.getElementById('empty-state-quote');
    if (quoteContainer) {
      quoteContainer.innerHTML = '<span style="font-style: italic; font-weight: bold; color: #fff;">"' + quoteObj.quote + '"</span><br><span style="font-style: normal; color: #678; display: inline-block; margin-top: 8px;">\u2014 ' + quoteObj.movie + '</span>';
    }

    // Clone and populate template
    var tmpl = document.getElementById('tmpl-goal-tracker');
    if (!tmpl) return;
    var clone = tmpl.content.cloneNode(true);

    clone.getElementById('tmpl-profile-link').href = 'https://letterboxd.com/' + window.appUser + '/';
    clone.getElementById('tmpl-avatar').appendChild(createAvatarEl(54));
    clone.getElementById('tmpl-username').textContent = window.appUser;
    clone.getElementById('tmpl-goal-title').textContent = window.t('lbl_goal_title').replace('{target}', window.appMetaTarget);
    
    var syncEl = clone.getElementById('tmpl-sync-status');
    syncEl.textContent = window.t(labelStatus);
    syncEl.style.color = corStatus;
    syncEl.setAttribute('data-status-key', labelStatus);
    syncEl.id = 'sync-status';

    var statusMsg = clone.getElementById('tmpl-status-msg');
    statusMsg.innerHTML = msg + ' <span style="color:#89a; margin-left:4px;">(' + percent + '%)</span>';
    statusMsg.style.color = color;

    clone.getElementById('tmpl-day-counter').textContent = window.t('stat_day') + ' ' + currentDay + '/' + daysInYear;
    clone.getElementById('tmpl-progress-bar').style.width = Math.min(100, percent) + '%';

    clone.getElementById('tmpl-stat-watched').textContent = watched;
    clone.getElementById('tmpl-lbl-watched').textContent = window.t('stat_watched');
    
    var balanceEl = clone.getElementById('tmpl-stat-balance');
    balanceEl.textContent = saldo > 0 ? '+' + saldo : saldo;
    balanceEl.style.color = color;
    clone.getElementById('tmpl-lbl-balance').textContent = window.t('stat_balance');

    clone.getElementById('tmpl-stat-remaining').textContent = Math.max(0, window.appMetaTarget - watched);
    clone.getElementById('tmpl-lbl-remaining').textContent = window.t('stat_remaining');

    clone.getElementById('tmpl-stat-projection').textContent = projection;
    clone.getElementById('tmpl-lbl-projection').textContent = window.t('stat_projection');

    appCont.innerHTML = '';
    appCont.appendChild(clone);
    
    // Attach manual toggle logic
    var toggleBtn = document.getElementById('goal-tracker-toggle-btn');
    if (toggleBtn) {
      toggleBtn.onclick = function() {
        var col = document.getElementById('goal-tracker-collapsible');
        var card = document.getElementById('goal-tracker-card');
        var icon = document.getElementById('goal-tracker-toggle-icon');
        if (col.style.maxHeight === '0px') {
          col.style.maxHeight = '500px';
          col.style.opacity = '1';
          card.style.marginBottom = '24px';
          icon.innerText = '\u25B2';
        } else {
          col.style.maxHeight = '0px';
          col.style.opacity = '0';
          card.style.marginBottom = '8px';
          icon.innerText = '\u25BC';
        }
      };
    }

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
    lists: [],
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
    '<div id="roulette-empty-state" style="margin: auto; text-align: center; color: #678; padding: 24px; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%;">' +
      '<div id="empty-state-quote" style="font-size: 16px; color: #89a; max-width: 90%; line-height: 1.4;"></div>' +
    '</div>' +
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
    if (val > 21) val = 21;
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
    var emptyEl = document.getElementById('roulette-empty-state');
    if (emptyEl) emptyEl.style.display = 'none';

    var state = loadState();
    var sources = [];
    if (state.watchlist) sources.push({ type: 'watchlist', url: 'https://letterboxd.com/' + window.appUser + '/watchlist/', name: window.t('lbl_from_watch') });
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

    // Timer Estimado (~1.2s por filme)
    var estimatedTotalSeconds = Math.max(3, Math.ceil(drawCount * 1.2));
    var elapsedSeconds = 0;
    var progressInterval = setInterval(function() {
      elapsedSeconds++;
      var remaining = Math.max(1, estimatedTotalSeconds - elapsedSeconds);
      if (remaining > 1) {
        btn.innerText = window.t('msg_shuffling') + ' (~' + remaining + 's)';
      } else {
        btn.innerText = window.t('msg_shuffling') + ' (quase lá...)';
      }
    }, 1000);

    // AbortController com timeout de 45 segundos
    var controller = new AbortController();
    var timeoutId = setTimeout(function() { controller.abort(); }, 45000);

    try {
      var response = await fetch('/api/roulette', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sources: sources,
          drawCount: drawCount,
          filter: {
            shortOnly: state.shortOnly || false,
            maxTimeHr: state.maxTimeHr || 1,
            maxTimeMin: state.maxTimeMin || 40
          }
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        var errData = await response.json().catch(function() { return {}; });
        throw new Error(errData.error || 'Erro do servidor');
      }

      var data = await response.json();
      var validMovies = data.movies;

      if (!validMovies || !validMovies.length) throw new Error(window.t('err_empty'));

      window.currentDrawData = validMovies;
      window.currentDrawData = validMovies;
      
      var resultCont = document.getElementById('roulette-result');
      resultCont.innerHTML = '';
      
      if (validMovies.length === 1) {
        var m = validMovies[0];
        var tmpl = document.getElementById('tmpl-roulette-single');
        if (tmpl) {
          var clone = tmpl.content.cloneNode(true);
          clone.getElementById('tmpl-rs-source').textContent = m.sourceName;
          clone.getElementById('tmpl-rs-img-link').href = m.link;
          clone.getElementById('tmpl-rs-img').src = m.imgSrc;
          var titleLink = clone.getElementById('tmpl-rs-title-link');
          titleLink.textContent = m.title;
          titleLink.href = m.link;
          resultCont.appendChild(clone);
        }
      } else if (validMovies.length >= 2 && validMovies.length <= 8) {
        var drawnSourcesObj = {};
        for (var j = 0; j < validMovies.length; j++) drawnSourcesObj[validMovies[j].sourceName] = true;
        var drawnSources = Object.keys(drawnSourcesObj);
        var sourceLabel = drawnSources.length > 1 ? window.t('lbl_multi_source') : drawnSources[0];
        
        var tmpl = document.getElementById('tmpl-roulette-swiper');
        if (tmpl) {
          var clone = tmpl.content.cloneNode(true);
          clone.getElementById('tmpl-rsw-source').textContent = sourceLabel;
          var wrapper = clone.getElementById('tmpl-rsw-wrapper');
          for (var i = 0; i < validMovies.length; i++) {
            var m = validMovies[i];
            var slide = document.createElement('div');
            slide.className = 'swiper-slide';
            slide.style.cssText = 'width: 170px; aspect-ratio: 2/3; height: auto;';
            slide.onclick = (function(idx) { return function() { openPosterModal(idx); }; })(i);
            var img = document.createElement('img');
            img.src = m.imgSrc;
            img.style.cssText = 'width: 100%; height: 100%; object-fit: cover; border-radius: 8px; display: block; box-shadow: 0 4px 10px rgba(0,0,0,0.5);';
            slide.appendChild(img);
            wrapper.appendChild(slide);
          }
          clone.getElementById('tmpl-rsw-details').textContent = window.t('lbl_tap_details');
          clone.getElementById('tmpl-rsw-details').setAttribute('data-i18n', 'lbl_tap_details');
          resultCont.appendChild(clone);
        }
      } else {
        var drawnSourcesObj = {};
        for (var j = 0; j < validMovies.length; j++) drawnSourcesObj[validMovies[j].sourceName] = true;
        var drawnSources = Object.keys(drawnSourcesObj);
        var sourceLabel = drawnSources.length > 1 ? window.t('lbl_multi_source') : drawnSources[0];
        
        var tmpl = document.getElementById('tmpl-roulette-grid');
        if (tmpl) {
          var clone = tmpl.content.cloneNode(true);
          clone.getElementById('tmpl-rg-source').textContent = sourceLabel;
          var container = clone.getElementById('tmpl-rg-container');
          for (var i = 0; i < validMovies.length; i++) {
            var m = validMovies[i];
            var wrap = document.createElement('div');
            wrap.className = 'grid-poster-wrap';
            wrap.onclick = (function(idx) { return function() { openPosterModal(idx); }; })(i);
            var img = document.createElement('img');
            img.src = m.imgSrc;
            wrap.appendChild(img);
            container.appendChild(wrap);
          }
          resultCont.appendChild(clone);
        }
      }
      document.getElementById('roulette-result').style.display = 'flex';

      if (validMovies.length >= 2 && validMovies.length <= 8 && typeof Swiper !== 'undefined') {
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

      clearInterval(progressInterval);
      btn.innerText = window.t('btn_roulette');
      btn.disabled = false;

    } catch (err) {
      clearInterval(progressInterval);
      clearTimeout(timeoutId);
      console.error('Roulette error:', err);
      if (err.name === 'AbortError') {
        btn.innerText = window.t('btn_error_retry');
      } else {
        btn.innerText = window.t('btn_error_retry');
      }
      btn.disabled = false;
      var emptyEl = document.getElementById('roulette-empty-state');
      if (emptyEl) emptyEl.style.display = 'flex';
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
  document.getElementById('modal-bg-img').src = m.imgSrc;
  document.getElementById('modal-link').innerText = m.title;
  document.getElementById('modal-link').href = m.link;
  document.getElementById('modal-img-link').href = m.link;
  document.getElementById('modal-source').innerText = m.sourceName;
  
  // Meta data (Year & Director)
  var yearEl = document.getElementById('modal-year');
  var dirEl = document.getElementById('modal-director');
  var dotEl = document.getElementById('modal-dot');
  var metaEl = document.getElementById('modal-meta');
  
  var hasYear = m.year ? true : false;
  var hasDir = m.director ? true : false;
  
  if (hasYear || hasDir) {
    metaEl.style.display = 'block';
    yearEl.innerText = m.year || '';
    dirEl.innerText = m.director ? 'Dir. ' + m.director : '';
    dotEl.style.display = (hasYear && hasDir) ? 'inline' : 'none';
  } else {
    metaEl.style.display = 'none';
  }
  
  // Genres
  var genresEl = document.getElementById('modal-genres');
  genresEl.innerHTML = '';
  if (m.genres && m.genres.length > 0) {
    m.genres.forEach(function(g) {
      var span = document.createElement('span');
      span.innerText = g;
      span.style.cssText = 'border: 1px solid rgba(64, 188, 244, 0.4); color: #40bcf4; padding: 4px 10px; border-radius: 12px; font-size: 11px; font-weight: bold; background: rgba(64, 188, 244, 0.05);';
      genresEl.appendChild(span);
    });
  }
  
  // Synopsis
  var synEl = document.getElementById('modal-synopsis');
  var synBox = document.getElementById('modal-synopsis-box');
  if (m.synopsis) {
    synEl.innerText = m.synopsis;
    synBox.style.display = 'block';
  } else {
    synBox.style.display = 'none';
  }
  
  // Animation reset
  var content = document.getElementById('poster-modal-content');
  content.style.transform = 'translateY(20px)';
  content.style.opacity = '0';
  
  var modal = document.getElementById('poster-modal');
  modal.classList.add('active');
  modal.style.display = 'flex';
  
  setTimeout(function() {
    content.style.transform = 'translateY(0)';
    content.style.opacity = '1';
  }, 10);
};

window.closePosterModal = function(e) {
  if (e && e.target.id !== 'poster-modal') return;
  var content = document.getElementById('poster-modal-content');
  if (content) {
    content.style.transform = 'translateY(20px)';
    content.style.opacity = '0';
  }
  setTimeout(function() {
    document.getElementById('poster-modal').classList.remove('active');
    document.getElementById('poster-modal').style.display = 'none';
  }, 300);
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
