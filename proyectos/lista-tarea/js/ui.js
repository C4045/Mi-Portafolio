/**
 * ui.js
 * Toda la manipulación del DOM vive aquí. Traduce el estado de TaskManager
 * en HTML y traduce los eventos del usuario en llamadas a TaskManager.
 */
class UI {
  constructor(taskManager) {
    this.tm = taskManager;

    this.state = {
      filter: 'todas',
      query: '',
      sort: 'creacion',
    };

    // --- referencias del DOM ---
    this.el = {
      themeToggle: document.getElementById('themeToggle'),
      ringFill: document.getElementById('progressRingFill'),
      percent: document.getElementById('progressPercent'),
      message: document.getElementById('progressMessage'),
      statTotal: document.getElementById('statTotal'),
      statPending: document.getElementById('statPending'),
      statCompleted: document.getElementById('statCompleted'),
      searchInput: document.getElementById('searchInput'),
      addForm: document.getElementById('addForm'),
      tareaInput: document.getElementById('tareaInput'),
      toggleOptions: document.getElementById('toggleOptions'),
      addFormOptions: document.getElementById('addFormOptions'),
      categoriaInput: document.getElementById('categoriaInput'),
      categoriasList: document.getElementById('categoriasList'),
      prioridadInput: document.getElementById('prioridadInput'),
      fechaInput: document.getElementById('fechaInput'),
      pills: Array.from(document.querySelectorAll('.pill')),
      countTodas: document.getElementById('countTodas'),
      countPendientes: document.getElementById('countPendientes'),
      countCompletadas: document.getElementById('countCompletadas'),
      sortSelect: document.getElementById('sortSelect'),
      list: document.getElementById('listaTareas'),
      emptyState: document.getElementById('emptyState'),
      emptyTitle: document.getElementById('emptyTitle'),
      emptySubtitle: document.getElementById('emptySubtitle'),
      limpiarCompletadasBtn: document.getElementById('limpiarCompletadasBtn'),
      limpiarBtn: document.getElementById('limpiarBtn'),
      toastContainer: document.getElementById('toastContainer'),
    };

    this.RING_CIRCUMFERENCE = 201.06;
  }

  init() {
    this._initTheme();
    this._bindEvents();
    this._setOptionsExpanded(Boolean(Storage.getFormExpanded()));
    this.render();
  }

  /* ======================= TEMA ======================= */
  _initTheme() {
    const stored = Storage.getTheme();
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    this._applyTheme(stored || (prefersDark ? 'dark' : 'light'));
  }

  _applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    const isDark = theme === 'dark';
    this.el.themeToggle.setAttribute('aria-pressed', String(isDark));
    this.el.themeToggle.setAttribute('aria-label', isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro');
    this.el.themeToggle.querySelector('use').setAttribute('href', isDark ? '#icon-sun' : '#icon-moon');
  }

  _toggleTheme() {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const next = isDark ? 'light' : 'dark';
    this._applyTheme(next);
    Storage.saveTheme(next);
  }

  /* ======================= EVENTOS ======================= */
  _bindEvents() {
    this.el.themeToggle.addEventListener('click', () => this._toggleTheme());

    this.el.addForm.addEventListener('submit', (e) => this._handleAddSubmit(e));

    this.el.toggleOptions.addEventListener('click', () => {
      this._setOptionsExpanded(this.el.addFormOptions.hidden);
    });

    this.el.searchInput.addEventListener(
      'input',
      Utils.debounce((e) => {
        this.state.query = e.target.value;
        this.render();
      }, 200)
    );

    this.el.pills.forEach((pill) => {
      pill.addEventListener('click', () => {
        this.state.filter = pill.dataset.filter;
        this.el.pills.forEach((p) => {
          const active = p === pill;
          p.classList.toggle('is-active', active);
          p.setAttribute('aria-selected', String(active));
        });
        this.render();
      });
    });

    this.el.sortSelect.addEventListener('change', (e) => {
      this.state.sort = e.target.value;
      this.render();
    });

    this.el.list.addEventListener('click', (e) => this._handleListClick(e));
    this.el.list.addEventListener('submit', (e) => this._handleEditSubmit(e));

    this.el.limpiarCompletadasBtn.addEventListener('click', () => this._handleClearCompleted());
    this.el.limpiarBtn.addEventListener('click', () => this._handleClearAll());
  }

  _setOptionsExpanded(expanded) {
    this.el.addFormOptions.hidden = !expanded;
    this.el.toggleOptions.setAttribute('aria-expanded', String(expanded));
    this.el.toggleOptions.setAttribute('aria-label', expanded ? 'Ocultar más opciones' : 'Mostrar más opciones');
    Storage.saveFormExpanded(expanded);
  }

  /* ======================= ACCIONES ======================= */
  _handleAddSubmit(e) {
    e.preventDefault();
    const text = this.el.tareaInput.value.trim();
    if (!text) {
      this.el.tareaInput.focus();
      return;
    }

    const task = this.tm.add({
      text,
      priority: this.el.prioridadInput.value,
      category: this.el.categoriaInput.value,
      dueDate: this.el.fechaInput.value || null,
    });

    this.el.tareaInput.value = '';
    this.el.fechaInput.value = '';
    this.el.categoriaInput.value = '';
    this.el.prioridadInput.value = 'media';
    this.el.tareaInput.focus();

    this.render({ newTaskId: task.id });
  }

  _handleListClick(e) {
    const actionBtn = e.target.closest('[data-action]');
    if (!actionBtn) return;
    const li = e.target.closest('.task-item');
    if (!li) return;
    const id = li.dataset.id;

    switch (actionBtn.dataset.action) {
      case 'toggle':
        this._handleToggle(id);
        break;
      case 'delete':
        this._handleDelete(id, li);
        break;
      case 'edit':
        this._handleEditStart(id, li);
        break;
      case 'cancel-edit':
        this.render();
        break;
    }
  }

  _handleToggle(id) {
    const task = this.tm.toggleComplete(id);
    this.render({ justToggledId: task && task.completed ? id : null });
  }

  _handleDelete(id, li) {
    li.classList.add('is-removing');
    window.setTimeout(() => {
      const result = this.tm.remove(id);
      this.render();
      if (result) {
        this._showToast('Tarea eliminada', 'Deshacer', () => {
          this.tm.restore(result.task, result.index);
          this.render({ newTaskId: result.task.id });
        });
      }
    }, 220);
  }

  _handleEditStart(id, li) {
    const task = this.tm.tasks.find((t) => t.id === id);
    if (!task) return;
    li.classList.add('is-editing');
    li.innerHTML = this._editFormHTML(task);
    const textInput = li.querySelector('.edit-form__text');
    textInput.focus();
    textInput.setSelectionRange(textInput.value.length, textInput.value.length);
  }

  _handleEditSubmit(e) {
    const form = e.target.closest('.edit-form');
    if (!form) return;
    e.preventDefault();

    const text = form.querySelector('.edit-form__text').value.trim();
    if (!text) return;

    const id = form.dataset.editing;
    this.tm.update(id, {
      text,
      category: form.querySelector('.edit-cat').value.trim(),
      priority: form.querySelector('.edit-pri').value,
      dueDate: form.querySelector('.edit-date').value || null,
    });

    this.render();
  }

  _handleClearCompleted() {
    const removed = this.tm.clearCompleted();
    if (removed.length === 0) return;
    this.render();
    const label = removed.length === 1 ? '1 tarea completada eliminada' : `${removed.length} tareas completadas eliminadas`;
    this._showToast(label, 'Deshacer', () => {
      this.tm.restoreMany(removed);
      this.render();
    });
  }

  _handleClearAll() {
    if (this.tm.tasks.length === 0) return;
    const removed = this.tm.clearAll();
    this.render();
    const label = removed.length === 1 ? 'Se eliminó 1 tarea' : `Se eliminaron ${removed.length} tareas`;
    this._showToast(label, 'Deshacer', () => {
      this.tm.restoreMany(removed);
      this.render();
    });
  }

  /* ======================= RENDER ======================= */
  render(opts = {}) {
    const { newTaskId = null, justToggledId = null } = opts;
    const filtered = this.tm.filter({
      status: this.state.filter,
      query: this.state.query,
      sortBy: this.state.sort,
    });

    this.el.list.innerHTML = '';
    filtered.forEach((task) => {
      const li = this._buildTaskLi(task, task.id === newTaskId);
      this.el.list.appendChild(li);
      if (task.id === justToggledId && task.completed) {
        const toggleBtn = li.querySelector('.task-toggle');
        toggleBtn.classList.add('just-toggled');
        toggleBtn.addEventListener('animationend', () => toggleBtn.classList.remove('just-toggled'), { once: true });
      }
    });

    this._renderEmptyState(filtered.length);
    this._renderStats();
    this._renderCounts();
    this._renderCategoryDatalist();
    this._renderFooterState();
  }

  _buildTaskLi(task, enter) {
    const li = document.createElement('li');
    li.className = 'task-item' + (task.completed ? ' is-completed' : '') + (enter ? ' task-item--enter' : '');
    li.dataset.id = task.id;
    li.dataset.priority = task.priority;
    li.innerHTML = this._taskContentHTML(task);
    return li;
  }

  _taskContentHTML(task) {
    const dueInfo = task.dueDate ? Utils.formatDueDate(task.dueDate, task.completed) : null;
    const categoryChip = task.category ? this._categoryChipHTML(task.category) : '';
    const dueChip = dueInfo
      ? `<span class="chip chip--date${dueInfo.isOverdue ? ' is-overdue' : ''}"><svg width="10" height="10"><use href="#icon-calendar"/></svg>${Utils.escapeHtml(dueInfo.label)}</span>`
      : '';

    return `
      <button class="task-toggle" data-action="toggle" aria-label="${task.completed ? 'Marcar como pendiente' : 'Marcar como completada'}">
        <svg width="13" height="13"><use href="#icon-check"/></svg>
      </button>
      <div class="task-content">
        <p class="task-text">${Utils.escapeHtml(task.text)}</p>
        <div class="task-meta">
          <span class="chip chip--priority" data-priority="${task.priority}">
            <svg width="10" height="10"><use href="#icon-flag"/></svg>${Utils.PRIORITY_LABEL[task.priority]}
          </span>
          ${categoryChip}
          ${dueChip}
        </div>
      </div>
      <div class="task-actions">
        <button class="icon-btn" data-action="edit" aria-label="Editar tarea" title="Editar">
          <svg width="15" height="15"><use href="#icon-edit"/></svg>
        </button>
        <button class="icon-btn danger" data-action="delete" aria-label="Eliminar tarea" title="Eliminar">
          <svg width="15" height="15"><use href="#icon-trash"/></svg>
        </button>
      </div>
    `;
  }

  _categoryChipHTML(category) {
    const idx = Utils.categoryChipIndex(category);
    return `<span class="chip chip--category" style="background:var(--chip-${idx}-bg); color:var(--chip-${idx}-fg)">
      <svg width="10" height="10"><use href="#icon-tag"/></svg>${Utils.escapeHtml(category)}
    </span>`;
  }

  _editFormHTML(task) {
    const opt = (value, label) => `<option value="${value}" ${task.priority === value ? 'selected' : ''}>${label}</option>`;
    return `
      <form class="edit-form" data-editing="${task.id}">
        <input type="text" class="edit-form__text" value="${Utils.escapeHtml(task.text)}" maxlength="140" aria-label="Editar texto de la tarea" required>
        <div class="edit-form__grid">
          <input type="text" class="edit-cat" list="categoriasList" placeholder="Categoría" value="${Utils.escapeHtml(task.category || '')}" maxlength="24" aria-label="Editar categoría">
          <select class="edit-pri" aria-label="Editar prioridad">
            ${opt('alta', 'Alta')}${opt('media', 'Media')}${opt('baja', 'Baja')}
          </select>
          <input type="date" class="edit-date" value="${task.dueDate || ''}" aria-label="Editar fecha de vencimiento">
        </div>
        <div class="edit-form__actions">
          <button type="button" class="btn btn--ghost" data-action="cancel-edit">Cancelar</button>
          <button type="submit" class="btn btn--primary">Guardar</button>
        </div>
      </form>
    `;
  }

  _renderEmptyState(visibleCount) {
    const hasAnyTasks = this.tm.tasks.length > 0;
    const hasQuery = this.state.query.trim().length > 0;

    if (visibleCount > 0) {
      this.el.emptyState.hidden = true;
      this.el.list.hidden = false;
      return;
    }

    this.el.list.hidden = true;
    this.el.emptyState.hidden = false;
    const iconUse = this.el.emptyState.querySelector('use');

    if (!hasAnyTasks) {
      this.el.emptyTitle.textContent = 'Aún no tienes tareas';
      this.el.emptySubtitle.textContent = 'Agrega tu primera tarea desde el campo de arriba para comenzar.';
      iconUse.setAttribute('href', '#icon-inbox');
    } else if (hasQuery) {
      this.el.emptyTitle.textContent = `Sin resultados para “${this.state.query.trim()}”`;
      this.el.emptySubtitle.textContent = 'Prueba con otras palabras o cambia el filtro activo.';
      iconUse.setAttribute('href', '#icon-search');
    } else if (this.state.filter === 'pendientes') {
      this.el.emptyTitle.textContent = '¡Todo listo!';
      this.el.emptySubtitle.textContent = 'No tienes tareas pendientes en este momento.';
      iconUse.setAttribute('href', '#icon-sparkle');
    } else if (this.state.filter === 'completadas') {
      this.el.emptyTitle.textContent = 'Nada completado todavía';
      this.el.emptySubtitle.textContent = 'Las tareas que marques como hechas aparecerán aquí.';
      iconUse.setAttribute('href', '#icon-inbox');
    } else {
      this.el.emptyTitle.textContent = 'Sin tareas';
      this.el.emptySubtitle.textContent = '';
      iconUse.setAttribute('href', '#icon-inbox');
    }
  }

  _renderStats() {
    const stats = this.tm.getStats();
    this.el.statTotal.textContent = stats.total;
    this.el.statPending.textContent = stats.pending;
    this.el.statCompleted.textContent = stats.completed;
    this.el.percent.textContent = `${stats.percent}%`;

    const offset = this.RING_CIRCUMFERENCE - (stats.percent / 100) * this.RING_CIRCUMFERENCE;
    this.el.ringFill.style.strokeDashoffset = String(offset);

    this.el.message.textContent = this._progressMessage(stats);
  }

  _progressMessage(stats) {
    if (stats.total === 0) return 'Agrega tu primera tarea para comenzar';
    if (stats.percent === 100) return '¡Todas las tareas completadas! 🎉';
    if (stats.pending === 1) return 'Solo te queda 1 tarea pendiente';
    if (stats.percent >= 50) return `Vas muy bien: ${stats.pending} tareas pendientes`;
    return `Tienes ${stats.pending} tareas pendientes`;
  }

  _renderCounts() {
    const all = this.tm.tasks;
    this.el.countTodas.textContent = all.length;
    this.el.countPendientes.textContent = all.filter((t) => !t.completed).length;
    this.el.countCompletadas.textContent = all.filter((t) => t.completed).length;
  }

  _renderCategoryDatalist() {
    const categories = this.tm.getCategories();
    this.el.categoriasList.innerHTML = categories.map((c) => `<option value="${Utils.escapeHtml(c)}"></option>`).join('');
  }

  _renderFooterState() {
    const stats = this.tm.getStats();
    this.el.limpiarCompletadasBtn.disabled = stats.completed === 0;
    this.el.limpiarBtn.disabled = stats.total === 0;
  }

  /* ======================= TOASTS ======================= */
  _showToast(message, actionLabel, onAction) {
    const toast = document.createElement('div');
    toast.className = 'toast';

    const text = document.createElement('span');
    text.textContent = message;
    toast.appendChild(text);

    if (actionLabel) {
      const btn = document.createElement('button');
      btn.className = 'toast__action';
      btn.innerHTML = `<svg width="14" height="14"><use href="#icon-undo"/></svg><span>${Utils.escapeHtml(actionLabel)}</span>`;
      btn.addEventListener('click', () => {
        onAction && onAction();
        dismiss();
      });
      toast.appendChild(btn);
    }

    this.el.toastContainer.appendChild(toast);

    const timer = window.setTimeout(dismiss, 5000);
    function dismiss() {
      window.clearTimeout(timer);
      toast.classList.add('is-leaving');
      window.setTimeout(() => toast.remove(), 180);
    }
  }
}
