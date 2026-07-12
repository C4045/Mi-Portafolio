/**
 * taskManager.js
 * Fuente de verdad del estado de las tareas. No toca el DOM: solo datos.
 *
 * Forma de una tarea:
 * {
 *   id: string,
 *   text: string,
 *   completed: boolean,
 *   priority: 'alta' | 'media' | 'baja',
 *   category: string,
 *   dueDate: string|null   (YYYY-MM-DD),
 *   createdAt: number,
 *   completedAt: number|null
 * }
 */
class TaskManager {
  constructor() {
    const stored = Storage.getTasks();
    this.tasks = stored !== null ? stored : this._seedDefaults();
    if (stored === null) this._persist();
  }

  // Tareas de ejemplo iguales a las de la versión original, para que
  // quien abre la app por primera vez no vea una lista vacía sin contexto.
  _seedDefaults() {
    const now = Date.now();
    return [
      { id: Utils.uid(), text: 'Aprender inglés', completed: false, priority: 'media', category: 'Estudio', dueDate: null, createdAt: now - 3000, completedAt: null },
      { id: Utils.uid(), text: 'Hacer mi portafolio responsive', completed: false, priority: 'alta', category: 'Trabajo', dueDate: null, createdAt: now - 2000, completedAt: null },
      { id: Utils.uid(), text: 'Estudiar para el final de semestre', completed: false, priority: 'alta', category: 'Estudio', dueDate: null, createdAt: now - 1000, completedAt: null },
    ];
  }

  _persist() {
    Storage.saveTasks(this.tasks);
  }

  add({ text, priority = 'media', category = '', dueDate = null }) {
    const task = {
      id: Utils.uid(),
      text: text.trim(),
      completed: false,
      priority,
      category: category.trim(),
      dueDate: dueDate || null,
      createdAt: Date.now(),
      completedAt: null,
    };
    this.tasks.push(task);
    this._persist();
    return task;
  }

  update(id, changes) {
    const task = this.tasks.find((t) => t.id === id);
    if (!task) return null;
    Object.assign(task, changes);
    this._persist();
    return task;
  }

  toggleComplete(id) {
    const task = this.tasks.find((t) => t.id === id);
    if (!task) return null;
    task.completed = !task.completed;
    task.completedAt = task.completed ? Date.now() : null;
    this._persist();
    return task;
  }

  /** Elimina y devuelve { task, index } para permitir deshacer. */
  remove(id) {
    const index = this.tasks.findIndex((t) => t.id === id);
    if (index === -1) return null;
    const [task] = this.tasks.splice(index, 1);
    this._persist();
    return { task, index };
  }

  restore(task, index) {
    const safeIndex = Math.min(index, this.tasks.length);
    this.tasks.splice(safeIndex, 0, task);
    this._persist();
  }

  /** Elimina todas las completadas y las devuelve (para deshacer). */
  clearCompleted() {
    const removed = this.tasks.filter((t) => t.completed);
    this.tasks = this.tasks.filter((t) => !t.completed);
    this._persist();
    return removed;
  }

  clearAll() {
    const removed = this.tasks;
    this.tasks = [];
    this._persist();
    return removed;
  }

  restoreMany(tasks) {
    this.tasks = this.tasks.concat(tasks);
    this._persist();
  }

  getStats() {
    const total = this.tasks.length;
    const completed = this.tasks.filter((t) => t.completed).length;
    const pending = total - completed;
    const percent = total === 0 ? 0 : Math.round((completed / total) * 100);
    return { total, pending, completed, percent };
  }

  getCategories() {
    const set = new Set(this.tasks.map((t) => t.category).filter(Boolean));
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'es'));
  }

  /**
   * Devuelve tareas filtradas por estado + búsqueda de texto, y ordenadas.
   * status: 'todas' | 'pendientes' | 'completadas'
   * sortBy: 'creacion' | 'prioridad' | 'vencimiento' | 'alfabetico'
   */
  filter({ status = 'todas', query = '', sortBy = 'creacion' } = {}) {
    const q = query.trim().toLowerCase();

    let result = this.tasks.filter((t) => {
      if (status === 'pendientes' && t.completed) return false;
      if (status === 'completadas' && !t.completed) return false;
      if (q) {
        const haystack = `${t.text} ${t.category}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });

    result = result.slice().sort((a, b) => {
      switch (sortBy) {
        case 'prioridad':
          return Utils.PRIORITY_WEIGHT[a.priority] - Utils.PRIORITY_WEIGHT[b.priority] || b.createdAt - a.createdAt;
        case 'vencimiento': {
          if (!a.dueDate && !b.dueDate) return b.createdAt - a.createdAt;
          if (!a.dueDate) return 1;
          if (!b.dueDate) return -1;
          return a.dueDate.localeCompare(b.dueDate);
        }
        case 'alfabetico':
          return a.text.localeCompare(b.text, 'es');
        case 'creacion':
        default:
          return b.createdAt - a.createdAt;
      }
    });

    return result;
  }
}
