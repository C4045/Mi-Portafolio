(function (App) {
  'use strict';

  const D = () => App.Data;
  const U = () => App.Utils;
  const I = () => App.Icons;
  const R = () => App.Reservations;

  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  function toast(message, type = 'info', duration = 3600) {
    const root = $('#toastRoot');
    if (!root) return;
    const iconMap = { success: I().check, error: I().x, info: I().bellRing, warning: I().alert };
    const el = document.createElement('div');
    el.className = `toast toast-${type}`;
    el.innerHTML = `
      <span class="toast-icon">${iconMap[type] || iconMap.info}</span>
      <span class="toast-msg">${U().esc(message)}</span>
      <button class="toast-close" aria-label="Cerrar notificación">${I().close}</button>
    `;
    root.appendChild(el);
    requestAnimationFrame(() => el.classList.add('show'));

    const remove = () => {
      el.classList.remove('show');
      el.classList.add('hide');
      setTimeout(() => el.remove(), 250);
    };
    const timer = setTimeout(remove, duration);
    el.querySelector('.toast-close').addEventListener('click', () => { clearTimeout(timer); remove(); });
  }

  function openModal(innerHTML, { size = 'md', onMount } = {}) {
    closeModal();
    const root = $('#modalRoot');
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `<div class="modal-dialog modal-${size}" role="dialog" aria-modal="true">${innerHTML}</div>`;
    root.appendChild(overlay);

    requestAnimationFrame(() => overlay.classList.add('open'));

    overlay.addEventListener('mousedown', (e) => {
      if (e.target === overlay) closeModal();
    });
    document.addEventListener('keydown', escHandler);

    const closeBtns = $$('[data-close-modal]', overlay);
    closeBtns.forEach((b) => b.addEventListener('click', closeModal));

    if (onMount) onMount(overlay);
    const focusable = overlay.querySelector('input, select, textarea, button');
    if (focusable) setTimeout(() => focusable.focus(), 60);
    return overlay;
  }

  function escHandler(e) {
    if (e.key === 'Escape') closeModal();
  }

  function closeModal() {
    const overlay = $('.modal-overlay');
    if (!overlay) return;
    overlay.classList.remove('open');
    overlay.classList.add('closing');
    document.removeEventListener('keydown', escHandler);
    setTimeout(() => overlay.remove(), 200);
  }

  function confirmModal({ title, message, confirmLabel = 'Confirmar', danger = false, icon }) {
    return new Promise((resolve) => {
      openModal(`
        <div class="modal-body confirm-body">
          <div class="confirm-icon ${danger ? 'danger' : ''}">${icon || I().alert}</div>
          <h3>${U().esc(title)}</h3>
          <p>${U().esc(message)}</p>
          <div class="modal-actions">
            <button class="btn btn-ghost" data-close-modal>Cancelar</button>
            <button class="btn ${danger ? 'btn-danger' : 'btn-primary'}" id="confirmBtn">${U().esc(confirmLabel)}</button>
          </div>
        </div>
      `, {
        size: 'sm',
        onMount: (overlay) => {
          $('#confirmBtn', overlay).addEventListener('click', () => { resolve(true); closeModal(); });
        },
      });
      const overlayNode = $('.modal-overlay');
      // Si se cierra sin confirmar (backdrop, Escape o botón Cancelar), resolvemos false
      const observer = new MutationObserver(() => {
        if (!document.body.contains(overlayNode)) { resolve(false); observer.disconnect(); }
      });
      observer.observe(document.body, { childList: true, subtree: true });
    });
  }

  function renderStats() {
    const s = D().getStats();
    const grid = $('#statsGrid');
    if (!grid) return;
    const cards = [
      { label: 'Habitaciones disponibles', value: `${s.disponibles}/${s.totalHabitaciones}`, icon: I().door, tone: 'teal' },
      { label: 'Habitaciones ocupadas', value: s.ocupadas, icon: I().key, tone: 'terracotta' },
      { label: 'Reservas activas', value: s.reservasActivas, icon: I().calendarCheck, tone: 'slate' },
      { label: 'Ingresos totales', value: U().formatCurrency(s.ingresos), icon: I().coins, tone: 'brass' },
    ];
    grid.innerHTML = cards.map((c) => `
      <div class="stat-card tone-${c.tone}">
        <div class="stat-icon">${c.icon}</div>
        <div class="stat-info">
          <span class="stat-value">${c.value}</span>
          <span class="stat-label">${c.label}</span>
        </div>
      </div>
    `).join('');
  }

  function renderRooms() {
    const grids = $$('#roomsGrid, #roomsGridFull');
    if (!grids.length) return;
    const statusLabel = { disponible: 'Disponible', reservada: 'Reservada', ocupada: 'Ocupada' };

    const html = D().ROOM_CATALOG.map((room) => {
      const status = D().getRoomStatus(room.numero);
      return `
        <div class="keycard status-${status}" data-room="${room.numero}" tabindex="0">
          <div class="keycard-rail"></div>
          <div class="keycard-body">
            <div class="keycard-top">
              <span class="keycard-number">${room.numero}</span>
              ${I().door}
            </div>
            <div class="keycard-type">${room.tipo} · ${room.capacidad} pax</div>
            <div class="keycard-price">${U().formatCurrency(room.precio)}<span>/noche</span></div>
            <span class="keycard-status status-pill-${status}">${statusLabel[status]}</span>
          </div>
        </div>
      `;
    }).join('');

    grids.forEach((grid) => {
      grid.innerHTML = html;
      $$('.keycard', grid).forEach((card) => {
        card.addEventListener('click', () => {
          const numero = Number(card.dataset.room);
          App.UI.openRoomReservations(numero);
        });
      });
    });
  }

  function openRoomReservations(numero) {
    const reservas = D().state.reservas.filter((r) => r.habitacion === numero && r.estado !== 'cancelada');
    const room = D().getRoom(numero);
    openModal(`
      <div class="modal-header">
        <h3>${I().door} Habitación ${numero} — ${room.tipo}</h3>
        <button class="modal-close" data-close-modal aria-label="Cerrar">${I().close}</button>
      </div>
      <div class="modal-body">
        ${reservas.length ? `<div class="mini-list">${reservas.map((r) => `
          <div class="mini-item">
            <span class="mono">${r.codigo}</span>
            <span>${U().esc(r.guest.nombre)}</span>
            <span>${U().formatDateShort(r.fechaIngreso)} → ${U().formatDateShort(r.fechaSalida)}</span>
            <span class="badge badge-${D().ESTADOS[r.estado].color}">${D().ESTADOS[r.estado].label}</span>
          </div>`).join('')}</div>` : `<p class="empty-hint">Sin reservas registradas para esta habitación.</p>`}
      </div>
    `, { size: 'md' });
  }

  App.UI = App.UI || {};
  Object.assign(App.UI, { $, $$, toast, openModal, closeModal, confirmModal, renderStats, renderRooms, openRoomReservations });
})(window.App = window.App || {});
