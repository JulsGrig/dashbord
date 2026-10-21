import { Dashboard } from './js/Dashboard.js';

const root = document.getElementById('dashboard');
const dashboard = new Dashboard(root);

document.querySelector('.toolbar').addEventListener('click', (e) => {
  const btn = e.target.closest('[data-add]');
  if (!btn) return;
  const type = btn.dataset.add;
  try {
    dashboard.addWidget(type);
  } catch (err) {
    console.error(err);
    alert(`Не удалось добавить виджет: ${err.message}`);
  }
});

// Приятный старт: показываем по одному виджету каждого типа
dashboard.addWidget('todo');
dashboard.addWidget('quote');
dashboard.addWidget('weather');
dashboard.addWidget('currency');

// Для отладки в консоли
window.__dashboard = dashboard;