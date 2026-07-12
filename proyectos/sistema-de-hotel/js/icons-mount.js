/* =========================================================
   icons-mount.js — Monta los iconos declarados con data-icon
   ========================================================= */
(function (App) {
  'use strict';

  function mountIcons(root = document) {
    root.querySelectorAll('[data-icon]').forEach((el) => {
      const name = el.dataset.icon;
      if (App.Icons[name] && !el.dataset.iconMounted) {
        el.innerHTML = App.Icons[name];
        el.dataset.iconMounted = '1';
      }
    });
  }

  App.UI = App.UI || {};
  App.UI.mountIcons = mountIcons;

  document.addEventListener('DOMContentLoaded', () => {
    mountIcons();
    document.querySelectorAll('[data-view-link]').forEach((btn) => {
      btn.addEventListener('click', () => {
        document.querySelector(`.nav-item[data-view="${btn.dataset.viewLink}"]`)?.click();
      });
    });
  });
})(window.App = window.App || {});
