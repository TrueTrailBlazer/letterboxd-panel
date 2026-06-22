// ===== ONBOARDING LOGIC =====
function nextObStep(stepNum) {
  document.querySelectorAll('.ob-step').forEach(function(el) { el.classList.remove('active'); });
  document.getElementById('ob-step-' + stepNum).classList.add('active');
}

function saveUserAndNext() {
  var val = document.getElementById('ob-user-input').value.trim().toLowerCase();
  if (!val) { showToast('Digite seu nome de usuário!', true); return; }
  window.appUser = val;
  nextObStep(3);
}

function finishOnboarding(useMeta) {
  window.appUseMeta = useMeta;
  if (useMeta) {
    var tgt = parseInt(document.getElementById('ob-target-input').value);
    if (!tgt || tgt < 1) { showToast('Digite uma meta válida', true); return; }
    window.appMetaTarget = tgt;
  }

  localStorage.setItem('lbxd_user', window.appUser);
  localStorage.setItem('lbxd_use_meta', window.appUseMeta ? 'true' : 'false');
  localStorage.setItem('lbxd_meta_target', window.appMetaTarget);
  localStorage.setItem('lbxd_meta_year', window.appMetaYear);

  document.getElementById('onboarding-container').style.opacity = '0';
  setTimeout(function() {
    document.getElementById('onboarding-container').style.display = 'none';
    if (typeof startApp === 'function') startApp();
  }, 300);
}
