'use strict';
(() => {
  const key = 'tahdir-launcher-preferences-v1';
  const defaults = {theme:'system', role:'none', largeText:false};
  let saved = {};
  try { saved = JSON.parse(localStorage.getItem(key)) || {}; } catch (_) {}
  const preferences = {
    theme:['light','dark','system'].includes(saved.theme) ? saved.theme : defaults.theme,
    role:['none','employee','manager'].includes(saved.role) ? saved.role : defaults.role,
    largeText:saved.largeText === true
  };
  const darkQuery = window.matchMedia('(prefers-color-scheme: dark)');
  function apply() {
    const theme = preferences.theme === 'system' ? (darkQuery.matches ? 'dark' : 'light') : preferences.theme;
    document.documentElement.dataset.theme = theme;
    document.documentElement.classList.toggle('large-text', preferences.largeText);
    document.querySelector('meta[name="theme-color"]').content = theme === 'dark' ? '#161714' : '#f7f6f2';
  }
  window.TahdirPreferences = {
    get:() => ({...preferences}),
    set:changes => {
      if (['light','dark','system'].includes(changes.theme)) preferences.theme = changes.theme;
      if (['none','employee','manager'].includes(changes.role)) preferences.role = changes.role;
      if (typeof changes.largeText === 'boolean') preferences.largeText = changes.largeText;
      apply();
      try { localStorage.setItem(key, JSON.stringify(preferences)); return true; } catch (_) { return false; }
    }
  };
  darkQuery.addEventListener('change', apply);
  apply();
})();
