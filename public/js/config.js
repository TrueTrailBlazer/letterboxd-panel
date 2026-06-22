// ===== CONFIG OVERLAY E LISTAS =====
function openConfig() {
  var currentOffset = localStorage.getItem('meta365_offset');
  if (currentOffset === null) currentOffset = 2;
  document.getElementById('num-offset').value = currentOffset;

  var state = loadState();
  document.getElementById('chk-watchlist').checked = state.watchlist;
  document.getElementById('chk-short-only').checked = state.shortOnly;
  document.getElementById('num-max-minutes').value = state.maxMinutes;
  renderConfigLists();

  document.getElementById('config-overlay').classList.add('open');
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
      '<label class="config-checkbox-label" style="margin-bottom:0; flex-grow:1; max-width:85%;">' +
        '<input type="checkbox" class="chk-ext" data-idx="' + i + '"' + (list.checked ? ' checked' : '') + '>' +
        '<span style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">' + name + '</span>' +
      '</label>' +
      '<button class="config-delete-btn" data-idx="' + i + '">✖</button>';
    lc.appendChild(div);
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
