/**
 * storage.js
 * Capa de persistencia. Encapsula todo el acceso a LocalStorage
 * para que el resto de la app nunca hable con `localStorage` directamente.
 */
const Storage = (function () {
  const KEYS = {
    tasks: 'misTareas.tasks.v1',
    theme: 'misTareas.theme',
    formExpanded: 'misTareas.formExpanded',
  };

  function safeGet(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw === null ? fallback : JSON.parse(raw);
    } catch (err) {
      console.warn(`No se pudo leer "${key}" de LocalStorage:`, err);
      return fallback;
    }
  }

  function safeSet(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (err) {
      console.warn(`No se pudo guardar "${key}" en LocalStorage:`, err);
      return false;
    }
  }

  return {
    getTasks() {
      return safeGet(KEYS.tasks, null);
    },
    saveTasks(tasks) {
      return safeSet(KEYS.tasks, tasks);
    },
    getTheme() {
      return safeGet(KEYS.theme, null);
    },
    saveTheme(theme) {
      return safeSet(KEYS.theme, theme);
    },
    getFormExpanded() {
      return safeGet(KEYS.formExpanded, false);
    },
    saveFormExpanded(value) {
      return safeSet(KEYS.formExpanded, value);
    },
  };
})();
