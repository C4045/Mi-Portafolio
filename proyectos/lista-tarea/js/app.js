/**
 * app.js
 * Punto de entrada: conecta el estado (TaskManager) con la interfaz (UI).
 */
document.addEventListener('DOMContentLoaded', () => {
  const taskManager = new TaskManager();
  const ui = new UI(taskManager);
  ui.init();
});
