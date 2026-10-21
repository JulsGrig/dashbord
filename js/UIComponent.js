/**
 * Абстрактный базовый класс виджета.
 * Инкапсулирует: id, title, DOM-узел, подписки, AbortController.
 */
export class UIComponent {
  /** @type {string} */
  static type = 'base';

  /**
   * @param {{ id?: string, title?: string }} config
   */
  constructor({ id, title } = {}) {
    if (new.target === UIComponent) {
      throw new TypeError('UIComponent is abstract and cannot be instantiated directly');
    }
    this.id = id ?? `${this.constructor.type}-${Math.random().toString(36).slice(2, 8)}`;
    this.title = title ?? 'Виджет';
    this.el = null;
    this.body = null;
    this._cleanups = new Set();
    this._controllers = new Set();
    this._abortController = null;
  }

  /** Возвращает свежий AbortController; старый — отменяется. */
  _newAbortController() {
    this._abortController?.abort();
    this._abortController = new AbortController();
    this._controllers.add(this._abortController);
    return this._abortController;
  }

  /** Регистрирует функцию очистки (снятие слушателя, очистка таймера и т.п.). */
  _onCleanup(fn) {
    this._cleanups.add(fn);
  }

  /** Помощник: навесить слушатель с авт. очисткой. */
  _listen(target, type, handler, options) {
    target.addEventListener(type, handler, options);
    this._onCleanup(() => target.removeEventListener(type, handler, options));
  }

  /** Создаёт корневую обёртку виджета из <template>. */
  _createShell() {
    const tpl = document.getElementById('widget-template');
    const node = tpl.content.firstElementChild.cloneNode(true);
    node.dataset.widgetId = this.id;
    node.dataset.widgetType = this.constructor.type;
    node.querySelector('.widget__title').textContent = this.title;

    node.querySelector('[data-action="minimize"]')
      .addEventListener('click', () => this.minimize());
    node.querySelector('[data-action="close"]')
      .addEventListener('click', () => this.close());

    return node;
  }

  /** Возвращает DOM-элемент виджета. Дочерние классы могут переопределить. */
  render() {
    this.el = this._createShell();
    this.body = this.el.querySelector('.widget__body');
    return this.el;
  }

  /** Свернуть/развернуть содержимое. */
  minimize() {
    if (!this.el) return;
    this.el.classList.toggle('widget--collapsed');
    const btn = this.el.querySelector('[data-action="minimize"]');
    const collapsed = this.el.classList.contains('widget--collapsed');
    btn.textContent = collapsed ? '+' : '–';
    btn.setAttribute('aria-expanded', String(!collapsed));
  }

  /** Инициирует закрытие — Dashboard решает, как удалять. */
  close() {
    this.el?.dispatchEvent(new CustomEvent('widget:close', {
      bubbles: true,
      detail: { id: this.id }
    }));
  }

  /** Полная очистка: слушатели, запросы, интервалы, DOM. */
  destroy() {
    this._abortController?.abort();
    this._controllers.forEach(c => c.abort());
    this._controllers.clear();

    this._cleanups.forEach(fn => {
      try { fn(); } catch (err) { console.warn('cleanup error', err); }
    });
    this._cleanups.clear();

    this.el?.remove();
    this.el = null;
    this.body = null;
  }
}