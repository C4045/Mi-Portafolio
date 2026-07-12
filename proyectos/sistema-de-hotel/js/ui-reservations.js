/* =========================================================
   ui-reservations.js — Listado, filtros, formulario y detalle de reservas
   Namespace: App.UI (extensión)
   ========================================================= */
(function (App) {
  'use strict';

  const D = () => App.Data;
  const U = () => App.Utils;
  const I = () => App.Icons;
  const R = () => App.Reservations;
  const { $, $$ } = App.UI;

  const normalize = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  function matchesFilters(r, { texto, tipo, estado }) {
    const room = D().getRoom(r.habitacion);
    if (tipo !== 'todos' && room?.tipo !== tipo) return false;
    if (estado && estado !== 'todos' && r.estado !== estado) return false;
    if (texto) {
      const haystack = normalize(`${r.guest.nombre} ${r.guest.documento} ${r.codigo} ${r.habitacion}`);
      if (!haystack.includes(normalize(texto))) return false;
    }
    return true;
  }

  function ticketCard(r) {
    const room = D().getRoom(r.habitacion);
    const estado = D().ESTADOS[r.estado];
    const puedeAvanzar = !!estado.next;
    const puedeCancelar = ['reservada', 'checkin'].includes(r.estado);

    return `
      <article class="ticket" data-codigo="${r.codigo}">
        <div class="ticket-main">
          <div class="ticket-top">
            <span class="badge badge-${estado.color}">${estado.label}</span>
            <span class="ticket-code mono">${r.codigo}</span>
          </div>
          <div class="ticket-guest">
            <div class="avatar">${U().initials(r.guest.nombre)}</div>
            <div>
              <div class="ticket-name">${U().esc(r.guest.nombre)}</div>
              <div class="ticket-sub">${U().esc(r.guest.documento || 'Sin documento')} · ${r.guest.huespedes} huésped(es)</div>
            </div>
          </div>
          <div class="ticket-meta">
            <span>${I().calendarCheck} ${U().formatDateShort(r.fechaIngreso)} → ${U().formatDateShort(r.fechaSalida)} · ${r.noches} noche(s)</span>
            <span>${I().door} Habitación ${r.habitacion} · ${room?.tipo || ''}</span>
          </div>
        </div>
        <div class="ticket-stub">
          <span class="ticket-total">${U().formatCurrency(r.total)}</span>
          <span class="ticket-total-label">Total c/imp.</span>
          <div class="ticket-actions">
            <button class="icon-btn" data-action="detalle" title="Ver detalle">${I().moreVertical}</button>
            <button class="icon-btn" data-action="editar" title="Editar reserva">${I().edit}</button>
            ${puedeAvanzar ? `<button class="icon-btn accent" data-action="avanzar" title="Avanzar a ${D().ESTADOS[estado.next].label}">${I().logIn}</button>` : ''}
            ${puedeCancelar ? `<button class="icon-btn danger" data-action="cancelar" title="Cancelar reserva">${I().trash}</button>` : ''}
          </div>
        </div>
      </article>
    `;
  }

  function currentFilters() {
    return {
      texto: $('#searchInput')?.value.trim() || '',
      tipo: $('#filterTipo')?.value || 'todos',
      estado: $('#filterEstado')?.value || 'todos',
    };
  }

  function renderReservations() {
    const list = $('#reservationsList');
    if (!list) return;
    const filtros = currentFilters();
    const reservas = D().state.reservas.filter((r) => matchesFilters(r, filtros));

    list.innerHTML = reservas.length
      ? reservas.map(ticketCard).join('')
      : `<div class="empty-state">${I().empty}<p>No se encontraron reservas con esos filtros.</p></div>`;

    wireTicketActions(list);
    const counter = $('#reservationsCount');
    if (counter) counter.textContent = `${reservas.length} reserva${reservas.length === 1 ? '' : 's'}`;
  }

  function renderReservationsPreview() {
    const list = $('#reservationsPreview');
    if (!list) return;
    const reservas = [...D().state.reservas]
      .sort((a, b) => new Date(b.creadoEn) - new Date(a.creadoEn))
      .slice(0, 5);
    list.innerHTML = reservas.length
      ? reservas.map(ticketCard).join('')
      : `<div class="empty-state">${I().empty}<p>No hay reservas todavía. ¡Crea la primera!</p></div>`;
    wireTicketActions(list);
  }

  function renderHistory() {
    const list = $('#historyList');
    if (!list) return;
    const filtros = currentFilters();
    const reservas = D().state.reservas
      .filter((r) => ['finalizada', 'cancelada'].includes(r.estado))
      .filter((r) => matchesFilters(r, { ...filtros, estado: 'todos' }))
      .sort((a, b) => new Date(b.actualizadoEn) - new Date(a.actualizadoEn));

    list.innerHTML = reservas.length
      ? reservas.map(ticketCard).join('')
      : `<div class="empty-state">${I().history}<p>Aún no hay reservas finalizadas o canceladas.</p></div>`;

    wireTicketActions(list);
  }

  function wireTicketActions(container) {
    $$('.ticket', container).forEach((card) => {
      const codigo = card.dataset.codigo;
      $$('[data-action]', card).forEach((btn) => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const action = btn.dataset.action;
          if (action === 'detalle') abrirDetalle(codigo);
          if (action === 'editar') abrirFormulario(codigo);
          if (action === 'avanzar') avanzarReserva(codigo);
          if (action === 'cancelar') cancelarReserva(codigo);
        });
      });
      card.addEventListener('click', () => abrirDetalle(codigo));
    });
  }

  async function avanzarReserva(codigo) {
    const reserva = D().getReservaByCodigo(codigo);
    const meta = D().ESTADOS[reserva.estado];
    const destino = D().ESTADOS[meta.next];
    const ok = await App.UI.confirmModal({
      title: `Mover a "${destino.label}"`,
      message: `¿Confirmas que la reserva ${codigo} de ${reserva.guest.nombre} avanza a "${destino.label}"?`,
      confirmLabel: `Sí, mover a ${destino.label}`,
      icon: I().logIn,
    });
    if (!ok) return;
    R().avanzarEstado(codigo);
    App.UI.toast(`Reserva ${codigo} actualizada a "${destino.label}".`, 'success');
    App.UI.renderAll();
  }

  async function cancelarReserva(codigo) {
    const reserva = D().getReservaByCodigo(codigo);
    const ok = await App.UI.confirmModal({
      title: 'Cancelar reserva',
      message: `Esta acción cancelará la reserva ${codigo} de ${reserva.guest.nombre} y liberará la habitación. ¿Deseas continuar?`,
      confirmLabel: 'Sí, cancelar reserva',
      danger: true,
      icon: I().trash,
    });
    if (!ok) return;
    R().cancelar(codigo);
    App.UI.toast(`Reserva ${codigo} cancelada.`, 'warning');
    App.UI.renderAll();
  }

  /* ---------------------------------------------------------
     DETALLE
  --------------------------------------------------------- */
  function abrirDetalle(codigo) {
    const r = D().getReservaByCodigo(codigo);
    if (!r) return;
    const room = D().getRoom(r.habitacion);
    const estado = D().ESTADOS[r.estado];

    App.UI.openModal(`
      <div class="modal-header">
        <h3>${I().idCard} Detalle de reserva</h3>
        <button class="modal-close" data-close-modal aria-label="Cerrar">${I().close}</button>
      </div>
      <div class="modal-body detail-body">
        <div class="detail-head">
          <div>
            <span class="mono detail-code">${r.codigo}</span>
            <span class="badge badge-${estado.color}">${estado.label}</span>
          </div>
          <span class="detail-total">${U().formatCurrency(r.total)}</span>
        </div>

        <div class="detail-grid">
          <div><label>Huésped</label><p>${U().esc(r.guest.nombre)}</p></div>
          <div><label>Documento</label><p>${U().esc(r.guest.documento) || '—'}</p></div>
          <div><label>Teléfono</label><p>${I().phone} ${U().esc(r.guest.telefono) || '—'}</p></div>
          <div><label>Email</label><p>${I().mail} ${U().esc(r.guest.email) || '—'}</p></div>
          <div><label>Habitación</label><p>${room.numero} · ${room.tipo}</p></div>
          <div><label>Huéspedes</label><p>${r.guest.huespedes}</p></div>
          <div><label>Ingreso</label><p>${U().formatDateLong(r.fechaIngreso)}</p></div>
          <div><label>Salida</label><p>${U().formatDateLong(r.fechaSalida)}</p></div>
          <div><label>Noches</label><p>${r.noches}</p></div>
          <div><label>Precio/noche</label><p>${U().formatCurrency(r.precioNoche)}</p></div>
        </div>

        ${r.guest.notas ? `<div class="detail-notes"><label>Notas</label><p>${U().esc(r.guest.notas)}</p></div>` : ''}

        <div class="detail-totals">
          <div><span>Subtotal</span><span>${U().formatCurrency(r.subtotal)}</span></div>
          <div><span>Impuesto (${r.impuestoPorcentaje}%)</span><span>${U().formatCurrency(r.impuesto)}</span></div>
          <div class="total-row"><span>Total</span><span>${U().formatCurrency(r.total)}</span></div>
        </div>

        <div class="detail-history">
          <label>${I().history} Historial de estados</label>
          <ul class="timeline">
            ${r.historial.map((h) => `<li><span class="badge badge-${D().ESTADOS[h.estado].color}">${D().ESTADOS[h.estado].label}</span><span class="timeline-date">${U().formatDateTime(h.fecha)}</span></li>`).join('')}
          </ul>
        </div>

        <div class="modal-actions">
          <button class="btn btn-ghost" data-close-modal>Cerrar</button>
          <button class="btn btn-primary" id="btnEditarDesdeDetalle">${I().edit} Editar reserva</button>
        </div>
      </div>
    `, {
      size: 'lg',
      onMount: (overlay) => {
        $('#btnEditarDesdeDetalle', overlay).addEventListener('click', () => abrirFormulario(codigo));
      },
    });
  }

  /* ---------------------------------------------------------
     FORMULARIO (crear / editar)
  --------------------------------------------------------- */
  function roomOptions(selected) {
    return D().ROOM_CATALOG.map((room) => `
      <option value="${room.numero}" ${Number(selected) === room.numero ? 'selected' : ''}>
        ${room.numero} — ${room.tipo} — ${U().formatCurrency(room.precio)}/noche (máx. ${room.capacidad} pax)
      </option>
    `).join('');
  }

  function abrirFormulario(codigo) {
    const editing = codigo ? D().getReservaByCodigo(codigo) : null;
    const today = U().todayISO();
    const g = editing?.guest || {};

    App.UI.openModal(`
      <div class="modal-header">
        <h3>${editing ? I().edit + ' Editar reserva' : I().plus + ' Nueva reserva'}</h3>
        <button class="modal-close" data-close-modal aria-label="Cerrar">${I().close}</button>
      </div>
      <form class="modal-body reserva-form" id="reservaForm" novalidate>
        <div class="form-errors" id="formErrors" role="alert" hidden></div>

        <fieldset>
          <legend>${I().idCard} Datos del huésped</legend>
          <div class="form-grid">
            <div class="form-group">
              <label for="f-nombre">Nombre completo *</label>
              <input id="f-nombre" type="text" name="nombre" required aria-required="true" placeholder="Ej: Celso Romero" value="${U().esc(g.nombre || '')}">
            </div>
            <div class="form-group">
              <label for="f-documento">Documento de identidad *</label>
              <input id="f-documento" type="text" name="documento" required aria-required="true" placeholder="Ej: 4.567.890" value="${U().esc(g.documento || '')}">
            </div>
            <div class="form-group">
              <label for="f-telefono">${I().phone} Teléfono</label>
              <input id="f-telefono" type="tel" name="telefono" placeholder="Ej: +595 981 000 000" value="${U().esc(g.telefono || '')}">
            </div>
            <div class="form-group">
              <label for="f-email">${I().mail} Email</label>
              <input id="f-email" type="email" name="email" placeholder="Ej: correo@ejemplo.com" value="${U().esc(g.email || '')}">
            </div>
            <div class="form-group">
              <label for="f-huespedes">${I().users} Nº de huéspedes</label>
              <input id="f-huespedes" type="number" name="huespedes" min="1" max="10" value="${g.huespedes || 1}">
            </div>
          </div>
        </fieldset>

        <fieldset>
          <legend>${I().door} Estadía</legend>
          <div class="form-grid">
            <div class="form-group form-span-2">
              <label for="f-habitacion">Habitación *</label>
              <select id="f-habitacion" name="habitacion" required aria-required="true">
                <option value="">Seleccionar...</option>
                ${roomOptions(editing?.habitacion)}
              </select>
            </div>
            <div class="form-group">
              <label for="f-ingreso">Fecha de ingreso *</label>
              <input id="f-ingreso" type="date" name="fechaIngreso" required aria-required="true" min="${editing ? '' : today}" value="${editing?.fechaIngreso || today}">
            </div>
            <div class="form-group">
              <label for="f-salida">Fecha de salida *</label>
              <input id="f-salida" type="date" name="fechaSalida" required aria-required="true" value="${editing?.fechaSalida || U().addDaysISO(today, 1)}">
            </div>
          </div>
          <div class="availability-hint" id="availabilityHint" aria-live="polite"></div>
        </fieldset>

        <fieldset>
          <legend>📝 Notas</legend>
          <div class="form-group">
            <label for="f-notas" class="sr-only">Notas adicionales</label>
            <textarea id="f-notas" name="notas" rows="2" placeholder="Pedidos especiales, preferencias, etc.">${U().esc(g.notas || '')}</textarea>
          </div>
        </fieldset>

        <div class="totals-preview" id="totalsPreview"></div>

        <div class="modal-actions">
          <button type="button" class="btn btn-ghost" data-close-modal>Cancelar</button>
          <button type="submit" class="btn btn-primary">${editing ? I().check + ' Guardar cambios' : I().check + ' Confirmar reserva'}</button>
        </div>
      </form>
    `, {
      size: 'lg',
      onMount: (overlay) => wireFormulario(overlay, editing),
    });
  }

  function updatePreview(form) {
    const habitacion = Number(form.habitacion.value);
    const fechaIngreso = form.fechaIngreso.value;
    const fechaSalida = form.fechaSalida.value;
    const room = D().getRoom(habitacion);
    const preview = $('#totalsPreview', form);
    const hint = $('#availabilityHint', form);

    if (!room || !fechaIngreso || !fechaSalida) {
      preview.innerHTML = '';
      hint.innerHTML = '';
      return;
    }
    const noches = U().nightsBetween(fechaIngreso, fechaSalida);
    if (noches < 1) {
      preview.innerHTML = `<p class="preview-warning">${I().alert} La fecha de salida debe ser posterior al ingreso.</p>`;
      hint.innerHTML = '';
      return;
    }
    const { subtotal, impuesto, total } = R().calcularTotales(room.precio, noches);
    preview.innerHTML = `
      <div class="preview-row"><span>${noches} noche(s) × ${U().formatCurrency(room.precio)}</span><span>${U().formatCurrency(subtotal)}</span></div>
      <div class="preview-row"><span>Impuesto (${D().IMPUESTO_PORCENTAJE}%)</span><span>${U().formatCurrency(impuesto)}</span></div>
      <div class="preview-row preview-total"><span>Total a pagar</span><span>${U().formatCurrency(total)}</span></div>
    `;

    const excludeCodigo = form.dataset.codigo || undefined;
    const disponible = D().isRoomAvailable(habitacion, fechaIngreso, fechaSalida, excludeCodigo);
    hint.innerHTML = disponible
      ? `<span class="hint-ok">${I().check} Habitación disponible en esas fechas.</span>`
      : `<span class="hint-bad">${I().alert} Habitación ocupada en ese rango. Prueba otras fechas u otra habitación.</span>`;
  }

  function wireFormulario(overlay, editing) {
    const form = $('#reservaForm', overlay);
    if (editing) form.dataset.codigo = editing.codigo;

    ['habitacion', 'fechaIngreso', 'fechaSalida'].forEach((name) => {
      form[name].addEventListener('change', () => updatePreview(form));
    });
    form.fechaIngreso.addEventListener('change', () => {
      if (form.fechaSalida.value && form.fechaSalida.value <= form.fechaIngreso.value) {
        form.fechaSalida.value = U().addDaysISO(form.fechaIngreso.value, 1);
      }
      updatePreview(form);
    });
    updatePreview(form);

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const payload = {
        nombre: form.nombre.value,
        documento: form.documento.value,
        telefono: form.telefono.value,
        email: form.email.value,
        huespedes: form.huespedes.value,
        habitacion: form.habitacion.value,
        fechaIngreso: form.fechaIngreso.value,
        fechaSalida: form.fechaSalida.value,
        notas: form.notas.value,
      };

      const result = editing ? R().editar(editing.codigo, payload) : R().crear(payload);
      const errBox = $('#formErrors', form);

      if (!result.ok) {
        errBox.hidden = false;
        errBox.innerHTML = result.errores.map((e2) => `<p>${I().alert} ${U().esc(e2)}</p>`).join('');
        errBox.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
      }

      App.UI.closeModal();
      App.UI.toast(
        editing ? `Reserva ${editing.codigo} actualizada correctamente.` : `Reserva ${result.reserva.codigo} creada correctamente.`,
        'success'
      );
      App.UI.renderAll();
    });
  }

  Object.assign(App.UI, {
    renderReservations, renderReservationsPreview, renderHistory, abrirDetalle, abrirFormulario, currentFilters,
  });
})(window.App = window.App || {});
