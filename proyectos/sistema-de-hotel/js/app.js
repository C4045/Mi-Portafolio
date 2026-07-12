/* =========================================================
   app.js — Inicialización y wiring general de la aplicación
   ========================================================= */
(function (App) {
  'use strict';

  const D = () => App.Data;
  const { $, $$ } = App.UI;

  function renderAll() {
    App.UI.renderStats();
    App.UI.renderRooms();
    App.UI.renderReservations();
    App.UI.renderReservationsPreview();
    App.UI.renderHistory();
    App.UI.mountIcons();
  }
  App.UI.renderAll = renderAll;

  /* ---------------- Vistas / navegación ---------------- */
  function setView(view) {
    D().state.vista = view;
    $$('.nav-item').forEach((btn) => btn.classList.toggle('active', btn.dataset.view === view));
    $$('.view').forEach((section) => section.classList.toggle('active', section.id === `view-${view}`));
    $('#pageTitle').textContent = {
      panel: 'Panel general',
      reservas: 'Reservas',
      habitaciones: 'Habitaciones',
      historial: 'Historial',
    }[view];
    document.getElementById('mobileSidebar')?.classList.remove('open');
  }

  function wireNav() {
    $$('.nav-item').forEach((btn) => btn.addEventListener('click', () => setView(btn.dataset.view)));
  }

  /* ---------------- Tema claro / oscuro ---------------- */
  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    const icon = $('#themeIcon');
    if (icon) icon.innerHTML = theme === 'dark' ? App.Icons.sun : App.Icons.moon;
    App.Storage.setTheme(theme);
  }

  function wireTheme() {
    const saved = App.Storage.getTheme() || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    applyTheme(saved);
    $('#btnTheme').addEventListener('click', () => {
      const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      applyTheme(next);
    });
  }

  /* ---------------- Buscador y filtros ---------------- */
  function wireFilters() {
    const rerender = () => { App.UI.renderReservations(); App.UI.renderHistory(); };
    $('#searchInput').addEventListener('input', App.Utils.debounce(rerender, 200));
    $('#filterTipo').addEventListener('change', rerender);
    $('#filterEstado').addEventListener('change', rerender);
    $('#btnClearFilters').addEventListener('click', () => {
      $('#searchInput').value = '';
      $('#filterTipo').value = 'todos';
      $('#filterEstado').value = 'todos';
      rerender();
    });
  }

  /* ---------------- Acciones principales ---------------- */
  function wireActions() {
    $$('[data-action="nueva-reserva"]').forEach((btn) => btn.addEventListener('click', () => App.UI.abrirFormulario()));

    $('#btnExportPDF').addEventListener('click', () => {
      const filtros = App.UI.currentFilters();
      const reservas = D().state.reservas.filter((r) => {
        const room = D().getRoom(r.habitacion);
        if (filtros.tipo !== 'todos' && room?.tipo !== filtros.tipo) return false;
        if (filtros.estado !== 'todos' && r.estado !== filtros.estado) return false;
        return true;
      });
      if (!reservas.length) return App.UI.toast('No hay reservas para exportar con los filtros actuales.', 'warning');
      App.Export.exportarPDF(reservas);
    });

    $('#btnExportExcel').addEventListener('click', () => {
      const filtros = App.UI.currentFilters();
      const reservas = D().state.reservas.filter((r) => {
        const room = D().getRoom(r.habitacion);
        if (filtros.tipo !== 'todos' && room?.tipo !== filtros.tipo) return false;
        if (filtros.estado !== 'todos' && r.estado !== filtros.estado) return false;
        return true;
      });
      if (!reservas.length) return App.UI.toast('No hay reservas para exportar con los filtros actuales.', 'warning');
      App.Export.exportarExcel(reservas);
    });

    $('#btnMobileMenu')?.addEventListener('click', () => {
      $('#mobileSidebar').classList.toggle('open');
    });
    $('#sidebarOverlay')?.addEventListener('click', () => $('#mobileSidebar').classList.remove('open'));
  }

  /* ---------------- Inicialización ---------------- */
  function init() {
    D().init();
    wireNav();
    wireTheme();
    wireFilters();
    wireActions();
    setView('panel');
    renderAll();

    if (!D().state.reservas.length) {
      setTimeout(() => App.UI.toast('¡Bienvenido! Crea tu primera reserva para comenzar.', 'info'), 500);
    }
  }

  document.addEventListener('DOMContentLoaded', init);
})(window.App = window.App || {});
