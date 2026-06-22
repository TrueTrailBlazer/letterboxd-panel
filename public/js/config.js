// ===== CONFIG OVERLAY E LISTAS =====
function openConfig() {
  var currentOffset = localStorage.getItem('meta365_offset');
  if (currentOffset === null) currentOffset = 2;
  document.getElementById('num-offset').value = currentOffset;

  var state = loadState();
  document.getElementById('chk-watchlist').checked = state.watchlist;
  
  var chkShort = document.getElementById('chk-short-only');
  chkShort.checked = state.shortOnly;
  document.getElementById('time-filter-settings').style.display = state.shortOnly ? 'flex' : 'none';
  
  document.getElementById('num-max-time').value = state.maxTime || 100;
  document.getElementById('sel-time-unit').value = state.timeUnit || 'min';
  
  renderConfigLists();

  openPane('pane-menu'); // Reset to main menu whenever config opens
  document.getElementById('config-overlay').classList.add('open');
}

function openPane(paneId) {
  var panes = document.querySelectorAll('.config-pane');
  for (var i = 0; i < panes.length; i++) {
    panes[i].classList.remove('active');
  }
  document.getElementById(paneId).classList.add('active');
}

function closeConfig() {
  document.getElementById('config-overlay').classList.remove('open');
}

function renderConfigLists() {
  var state = loadState();
  var lc = document.getElementById('custom-lists-container');
  lc.innerHTML = '';
  for (var i = 0; i < state.lists.length; i++) {
    var list = state.lists[i];
    
    // Determina um nome bonitinho pra lista baseado na URL
    var name = 'Lista Customizada';
    if (list.url) {
        try { 
            var pathParts = new URL(list.url).pathname.split('/').filter(Boolean);
            if (pathParts.length >= 3 && pathParts[1] === 'list') {
                name = pathParts[2].replace(/-/g, ' ');
            } else if (list.url.indexOf('boxd.it') !== -1) {
                name = 'Link Curto (boxd.it)';
            }
        } catch(e) {}
    } else if (list.path) {
        // Legado
        var parts = list.path.split('/').filter(Boolean);
        name = parts.length >= 3 ? parts[2].replace(/-/g, ' ') : 'Lista Customizada';
    }

    var div = document.createElement('div');
    div.className = 'config-list-item';
    div.innerHTML =
      '<span style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis; flex-grow: 1; font-size: 15px; color: #fff;">' + name + '</span>' +
      '<div style="display: flex; align-items: center; gap: 12px;">' +
        '<label class="switch"><input type="checkbox" class="chk-ext" data-idx="' + i + '"' + (list.checked ? ' checked' : '') + '><span class="slider"></span></label>' +
        '<button class="config-delete-btn" data-idx="' + i + '">✖</button>' +
      '</div>';
    container.appendChild(div);
  }
}

function removeList(idx) {
  var state = loadState();
  state.lists.splice(idx, 1);
  saveState(state);
  renderConfigLists();
}

function resetProfile() {
  showConfirm('Sair e Limpar Perfil?', 'Isso apagará seu username e meta salvos neste dispositivo.', 'Sair', function() {
    localStorage.removeItem('lbxd_user');
    localStorage.removeItem('lbxd_use_meta');
    localStorage.removeItem('lbxd_meta_target');
    location.reload();
  });
}
