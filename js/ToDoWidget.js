import { UIComponent } from './UIComponent.js';

export class ToDoWidget extends UIComponent {
  static type = 'todo';

  constructor(config = {}) {
    super({ title: 'Список дел', ...config });
    /** @type {{id:string,text:string,done:boolean}[]} */
    this.tasks = [];
    this._filter = 'all';
  }

  render() {
    const el = super.render();

    const form = document.createElement('form');
    form.className = 'todo__form';

    const input = document.createElement('input');
    input.type = 'text';
    input.placeholder = 'Новая задача…';
    input.className = 'todo__input';
    input.maxLength = 120;
    input.required = true;

    const submit = document.createElement('button');
    submit.type = 'submit';
    submit.className = 'btn btn--primary';
    submit.textContent = 'Добавить';

    form.append(input, submit);

    const filters = document.createElement('div');
    filters.className = 'todo__filters';
    filters.setAttribute('role', 'tablist');
    ['all', 'active', 'done'].forEach(key => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'todo__filter';
      b.dataset.filter = key;
      b.setAttribute('role', 'tab');
      b.textContent = { all: 'Все', active: 'Активные', done: 'Выполненные' }[key];
      filters.append(b);
    });

    const list = document.createElement('ul');
    list.className = 'todo__list';

    const empty = document.createElement('p');
    empty.className = 'state state--empty';
    empty.textContent = 'Задач пока нет. Добавьте первую!';

    this.body.append(form, filters, list, empty);

    this._els = { input, list, empty, filters };

    this._listen(form, 'submit', (e) => {
      e.preventDefault();
      const text = input.value.trim();
      if (!text) return;
      this.addTask(text);
      input.value = '';
      input.focus();
    });

    this._listen(filters, 'click', (e) => {
      const btn = e.target.closest('[data-filter]');
      if (!btn) return;
      this._filter = btn.dataset.filter;
      this._renderTasks();
    });

    this._listen(list, 'click', (e) => {
      const li = e.target.closest('li[data-task-id]');
      if (!li) return;
      const id = li.dataset.taskId;
      if (e.target.matches('[data-role="toggle"]')) this.toggleTask(id);
      if (e.target.matches('[data-role="remove"]')) this.removeTask(id);
    });

    this._renderTasks();
    return el;
  }

  addTask(text) {
    this.tasks.push({
      id: crypto.randomUUID(),
      text,
      done: false
    });
    this._renderTasks();
  }

  removeTask(id) {
    this.tasks = this.tasks.filter(t => t.id !== id);
    this._renderTasks();
  }

  toggleTask(id) {
    const t = this.tasks.find(t => t.id === id);
    if (t) t.done = !t.done;
    this._renderTasks();
  }

  _renderTasks() {
    const { list, empty, filters } = this._els;

    filters.querySelectorAll('[data-filter]').forEach(b => {
      const active = b.dataset.filter === this._filter;
      b.classList.toggle('is-active', active);
      b.setAttribute('aria-selected', String(active));
    });

    const visible = this.tasks.filter(t => {
      if (this._filter === 'active') return !t.done;
      if (this._filter === 'done') return t.done;
      return true;
    });

    list.textContent = '';
    for (const t of visible) {
      const li = document.createElement('li');
      li.className = 'todo__item' + (t.done ? ' is-done' : '');
      li.dataset.taskId = t.id;

      const label = document.createElement('label');
      label.className = 'todo__label';

      const cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.checked = t.done;
      cb.dataset.role = 'toggle';

      const span = document.createElement('span');
      span.textContent = t.text;

      label.append(cb, span);

      const rm = document.createElement('button');
      rm.type = 'button';
      rm.className = 'todo__remove';
      rm.dataset.role = 'remove';
      rm.setAttribute('aria-label', `Удалить задачу «${t.text}»`);
      rm.textContent = '×';

      li.append(label, rm);
      list.append(li);
    }

    empty.hidden = visible.length > 0;
  }
}