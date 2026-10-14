'use strict';
const $ = id => document.getElementById(id);
const installDialog = $('installDialog');
const preferences = window.TahdirPreferences;
const views = ['home','guide','settings'];
const isIphone = /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
const iphoneInstallPage = document.body.dataset.install === 'iphone';
const appUrl = new URL(isIphone || iphoneInstallPage ? './install-iphone.html' : './', location.href).href;
const standalone = () => window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
let installPrompt = null;
let waitingWorker = null;
let statusTimer;

function notify(message) {
  clearTimeout(statusTimer);
  $('status').textContent = message;
  $('status').hidden = false;
  statusTimer = setTimeout(() => { $('status').hidden = true; }, 4500);
}
function renderView(focus = false) {
  const requested = location.hash.slice(1);
  const view = views.includes(requested) ? requested : 'home';
  document.querySelectorAll('[data-view]').forEach(panel => { panel.hidden = panel.id !== view; });
  document.querySelectorAll('[data-nav]').forEach(link => {
    if (link.dataset.nav === view) link.setAttribute('aria-current','page');
    else link.removeAttribute('aria-current');
  });
  if (focus) {
    window.scrollTo(0, 0);
    $(view + 'Title').focus({preventScroll:true});
  }
}
window.addEventListener('hashchange', () => renderView(true));
renderView();

function renderPreferences() {
  const settings = preferences.get();
  document.querySelectorAll('input[name="theme"]').forEach(input => { input.checked = input.value === settings.theme; });
  document.querySelectorAll('input[name="preferredRole"]').forEach(input => { input.checked = input.value === settings.role; });
  $('largeText').checked = settings.largeText;
  $('quickEntry').hidden = settings.role === 'none';
  $('employeeFavorite').hidden = settings.role !== 'employee';
  $('managerFavorite').hidden = settings.role !== 'manager';
  if (settings.role !== 'none') {
    $('quickEntry').href = $(settings.role + 'Link').href;
    $('quickEntryLabel').textContent = settings.role === 'employee' ? 'متابعة إلى بوابة الموظفين' : 'متابعة إلى بوابة الإدارة';
  }
}
function savePreferences(changes) {
  const persisted = preferences.set(changes);
  renderPreferences();
  notify(persisted ? 'تم حفظ اختيارك على هذا الجهاز.' : 'تم تطبيق الاختيار. المتصفح لا يسمح بحفظه بعد الإغلاق.');
}
document.querySelectorAll('input[name="theme"]').forEach(input => input.addEventListener('change', () => savePreferences({theme:input.value})));
document.querySelectorAll('input[name="preferredRole"]').forEach(input => input.addEventListener('change', () => savePreferences({role:input.value})));
$('largeText').addEventListener('change', () => savePreferences({largeText:$('largeText').checked}));
renderPreferences();
function updateDate() {
  $('todayLabel').textContent = new Intl.DateTimeFormat('ar-JO', {weekday:'long', day:'numeric', month:'long', timeZone:'Asia/Amman'}).format(new Date());
}
updateDate();
document.addEventListener('visibilitychange', () => { if (!document.hidden) updateDate(); });

function showPlatform(platform) {
  const iphone = platform === 'iphone';
  $('iphoneGuide').hidden = !iphone;
  $('androidGuide').hidden = iphone;
  $('iphoneButton').setAttribute('aria-pressed', String(iphone));
  $('androidButton').setAttribute('aria-pressed', String(!iphone));
}
function showHelp() {
  showPlatform(isIphone || iphoneInstallPage ? 'iphone' : 'android');
  $('dialogStatus').textContent = '';
  $('copyFallback').hidden = true;
  if (!installDialog.open) installDialog.showModal();
}
function updateInstalled() {
  $('iphoneSetup').hidden = standalone() || !iphoneInstallPage;
  $('installButton').hidden = standalone();
}
function updateNetwork() {
  $('offlineNotice').hidden = navigator.onLine;
  $('connectionText').textContent = navigator.onLine ? 'متصل' : 'غير متصل';
  $('connectionBadge').classList.toggle('is-offline', !navigator.onLine);
  $('connectionBadge').setAttribute('aria-label', navigator.onLine ? 'الجهاز متصل بالإنترنت' : 'الجهاز غير متصل بالإنترنت');
}
async function copyAppLink() {
  try {
    await navigator.clipboard.writeText(appUrl);
    notify('تم نسخ رابط التثبيت.');
    $('dialogStatus').textContent = 'تم نسخ رابط التثبيت.';
  } catch (_) {
    if (!installDialog.open) showHelp();
    $('copyFallback').value = appUrl;
    $('copyFallback').hidden = false;
    $('copyFallback').focus();
    $('copyFallback').select();
    $('dialogStatus').textContent = 'اضغط مطولًا على الرابط واختر نسخ.';
  }
}
window.addEventListener('beforeinstallprompt', event => { event.preventDefault(); installPrompt = event; });
window.addEventListener('appinstalled', () => {
  installPrompt = null;
  $('installButton').hidden = true;
  $('iphoneSetup').hidden = true;
  notify('تم تثبيت التطبيق. افتحه من الشاشة الرئيسية.');
  if (installDialog.open) installDialog.close();
});
$('installButton').addEventListener('click', async () => {
  if (!installPrompt) { showHelp(); return; }
  const prompt = installPrompt;
  installPrompt = null;
  try {
    await prompt.prompt();
    const choice = await prompt.userChoice;
    notify(choice.outcome === 'accepted' ? 'أكمل التثبيت حسب تعليمات هاتفك.' : 'يمكنك التثبيت لاحقًا من الدليل.');
  } catch (_) { showHelp(); }
});
$('helpButton').addEventListener('click', showHelp);
$('closeDialog').addEventListener('click', () => installDialog.close());
$('androidButton').addEventListener('click', () => showPlatform('android'));
$('iphoneButton').addEventListener('click', () => showPlatform('iphone'));
$('copyButton').addEventListener('click', copyAppLink);
$('copyDialogButton').addEventListener('click', copyAppLink);
for (const id of ['employeeLink','managerLink','quickEntry']) {
  $(id).addEventListener('click', event => {
    if (!navigator.onLine) {
      event.preventDefault();
      notify('اتصل بالإنترنت لفتح بوابة العمل.');
      $('offlineNotice').scrollIntoView({block:'center'});
    }
  });
}
window.addEventListener('online', updateNetwork);
window.addEventListener('offline', updateNetwork);
window.matchMedia('(display-mode: standalone)').addEventListener('change', updateInstalled);
updateNetwork();
updateInstalled();

if ('serviceWorker' in navigator) {
  let reloading = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (reloading || !waitingWorker) return;
    reloading = true;
    location.reload();
  });
  navigator.serviceWorker.register('./sw.js', {scope:'./', updateViaCache:'none'}).then(registration => {
    const offerUpdate = () => {
      if (registration.waiting && navigator.serviceWorker.controller) {
        waitingWorker = registration.waiting;
        $('updateNotice').hidden = false;
      }
    };
    offerUpdate();
    registration.addEventListener('updatefound', () => {
      const worker = registration.installing;
      if (worker) worker.addEventListener('statechange', offerUpdate);
    });
    $('updateButton').addEventListener('click', () => { if (waitingWorker) waitingWorker.postMessage({type:'ACTIVATE_UPDATE'}); });
  }).catch(() => {
    $('installNote').textContent = 'أضف الصفحة من قائمة المتصفح';
  });
}
