'use strict';
const $ = id => document.getElementById(id);
const installDialog = $('installDialog');
let installPrompt = null;
let waitingWorker = null;
const appUrl = new URL('./', location.href).href;
const isIphone = /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
const standalone = () => window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;

function showPlatform(platform) {
  const iphone = platform === 'iphone';
  $('iphoneGuide').hidden = !iphone;
  $('androidGuide').hidden = iphone;
  $('iphoneButton').setAttribute('aria-pressed', String(iphone));
  $('androidButton').setAttribute('aria-pressed', String(!iphone));
}
function showHelp() {
  showPlatform(isIphone ? 'iphone' : 'android');
  $('dialogStatus').textContent = '';
  $('copyFallback').hidden = true;
  if (!installDialog.open) installDialog.showModal();
}
function updateInstalled() {
  if (standalone()) {
    $('installLabel').textContent = 'التطبيق على هاتفك';
    $('installNote').textContent = 'اختر بوابة الدخول لبدء العمل';
    $('installButton').hidden = true;
  }
}
function updateNetwork() {
  $('offlineNotice').hidden = navigator.onLine;
  $('connectionText').textContent = navigator.onLine ? 'يلزم الإنترنت لعرض الطلبات وحفظ التغييرات' : 'بوابات العمل متاحة عند عودة الاتصال';
}
async function copyAppLink() {
  try {
    await navigator.clipboard.writeText(appUrl);
    $('status').textContent = 'تم نسخ الرابط. يمكنك مشاركته مع الموظفين.';
    $('dialogStatus').textContent = 'تم نسخ رابط التطبيق.';
  } catch (_) {
    if (!installDialog.open) showHelp();
    $('copyFallback').value = appUrl;
    $('copyFallback').hidden = false;
    $('copyFallback').focus();
    $('copyFallback').select();
    $('dialogStatus').textContent = 'اضغط مطولًا على الرابط واختر نسخ.';
  }
}
window.addEventListener('beforeinstallprompt', event => {
  event.preventDefault();
  installPrompt = event;
});
window.addEventListener('appinstalled', () => {
  installPrompt = null;
  $('installLabel').textContent = 'تم تثبيت التطبيق';
  $('installNote').textContent = 'افتح «إدارة التحضير» من الشاشة الرئيسية';
  $('status').textContent = 'تم التثبيت بنجاح.';
  if (installDialog.open) installDialog.close();
});
$('installButton').addEventListener('click', async () => {
  if (!installPrompt) { showHelp(); return; }
  const prompt = installPrompt;
  installPrompt = null;
  try {
    await prompt.prompt();
    const choice = await prompt.userChoice;
    $('status').textContent = choice.outcome === 'accepted' ? 'أكمل التثبيت حسب التعليمات على هاتفك.' : 'يمكنك التثبيت لاحقًا من قائمة المتصفح.';
  } catch (_) { showHelp(); }
});
$('helpButton').addEventListener('click', showHelp);
$('closeDialog').addEventListener('click', () => installDialog.close());
$('androidButton').addEventListener('click', () => showPlatform('android'));
$('iphoneButton').addEventListener('click', () => showPlatform('iphone'));
$('copyButton').addEventListener('click', copyAppLink);
$('copyDialogButton').addEventListener('click', copyAppLink);
for (const id of ['employeeLink', 'managerLink']) {
  $(id).addEventListener('click', event => {
    if (!navigator.onLine) {
      event.preventDefault();
      $('offlineNotice').hidden = false;
      $('offlineNotice').scrollIntoView({block: 'center'});
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
    if (reloading) return;
    reloading = true;
    if (waitingWorker) location.reload();
  });
  navigator.serviceWorker.register('./sw.js', {scope: './', updateViaCache: 'none'}).then(registration => {
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
    $('updateButton').addEventListener('click', () => {
      if (waitingWorker) waitingWorker.postMessage({type: 'ACTIVATE_UPDATE'});
    });
  }).catch(() => {
    $('installNote').textContent = 'يمكنك فتح بوابات الدخول أو إضافة الصفحة للشاشة الرئيسية';
  });
}
