import { ToDoWidget } from './ToDoWidget.js';
import { QuoteWidget } from './QuoteWidget.js';
import { WeatherWidget } from './WeatherWidget.js';
import { CurrencyWidget } from './CurrencyWidget.js';

/** Реестр доступных типов виджетов. Легко расширяется. */
const WIDGET_REGISTRY = {
  todo: ToDoWidget,
  quote: QuoteWidget,
  weather: WeatherWidget,
  currency: CurrencyWidget
};

export class Dashboard {
  /**
   * @param {HTMLElement} root — контейнер для виджетов
   */
  constructor(root) {
    if (!root) throw new Error('Dashboard root element is required');
    this.root = root;
    /** @type {Map<string, import('./UIComponent.js').UIComponent>} */
    this.widgets = new Map();

    this._onClose = (e) => {
      const id = e.detail?.id;
      if (id) this.removeWidget(id);
    };
    this.root.addEventListener('widget:close', this._onClose);
  }

  /**
   * Добавить виджет по типу.
   * @param {keyof typeof WIDGET_REGISTRY} type
   * @param {object} [config]
   * @returns {import('./UIComponent.js').UIComponent}
   */
  addWidget(type, config = {}) {
    const Ctor = WIDGET_REGISTRY[type];
    if (!Ctor) throw new Error(`Unknown widget type: ${type}`);

    const widget = new Ctor(config);
    this.widgets.set(widget.id, widget);
    this.root.append(widget.render());
    return widget;
  }

  /** Удалить виджет по id. */
  removeWidget(id) {
    const widget = this.widgets.get(id);
    if (!widget) return false;
    widget.destroy();
    this.widgets.delete(id);
    return true;
  }

  /** Удалить все виджеты. */
  clear() {
    for (const id of [...this.widgets.keys()]) {
      this.removeWidget(id);
    }
  }

  /** Полная очистка дашборда. */
  destroy() {
    this.clear();
    this.root.removeEventListener('widget:close', this._onClose);
  }
}