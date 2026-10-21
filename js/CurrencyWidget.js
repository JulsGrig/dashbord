import { UIComponent } from './UIComponent.js';

/**
 * Курсы валют ЦБ РФ.
 * Источник: https://www.cbr-xml-daily.ru/daily_json.js (без ключа, с CORS).
 * Данные считаются недоверенными — только textContent, без innerHTML.
 */
export class CurrencyWidget extends UIComponent {
  static type = 'currency';

  /**
   * @param {{ codes?: string[] }} config
   */
  constructor(config = {}) {
    super({ title: 'Курсы валют (ЦБ РФ)', ...config });
    /** Коды валют по классификатору ЦБ РФ */
    this.codes = config.codes ?? ['USD', 'EUR', 'CNY'];
    this._requestId = 0;
  }

  render() {
    super.render();

    const box = document.createElement('div');
    box.className = 'widget-state';

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'btn btn--ghost';
    btn.textContent = 'Обновить';

    this.body.append(box, btn);
    this._box = box;

    this._listen(btn, 'click', () => this.load());
    this.load();

    return this.el;
  }

  _setState(state, message) {
    this._box.dataset.state = state;
    this._box.textContent = message;
  }

  async load() {
    const requestId = ++this._requestId;
    const controller = this._newAbortController();

    this._setState('loading', 'Загрузка курсов…');

    try {
      const res = await fetch(
        'https://www.cbr-xml-daily.ru/daily_json.js',
        { signal: controller.signal }
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      // устаревший ответ — игнорируем
      if (requestId !== this._requestId) return;

      const valute = data?.Valute;
      if (!valute || typeof valute !== 'object') {
        this._setState('empty', 'Нет данных о курсах.');
        return;
      }

      const rows = this.codes
        .map(code => valute[code] && {
          code,
          name: valute[code].Name,
          value: valute[code].Value,
          nominal: valute[code].Nominal || 1,
          previous: valute[code].Previous
        })
        .filter(Boolean);

      if (!rows.length) {
        this._setState('empty', 'Нет данных по выбранным валютам.');
        return;
      }

      this._box.dataset.state = 'success';
      this._box.textContent = '';

      const date = document.createElement('p');
      date.className = 'metric metric--muted';
      date.textContent = `Курс на ${new Date(data.Date).toLocaleDateString('ru-RU')}`;

      const ul = document.createElement('ul');
      ul.className = 'currency__list';

      for (const row of rows) {
        const li = document.createElement('li');
        li.className = 'currency__item';

        const left = document.createElement('span');
        left.className = 'currency__code';
        left.textContent = `${row.code} · ${row.name}`;

        const right = document.createElement('strong');
        right.className = 'currency__value';
        right.textContent = `${(row.value / row.nominal).toFixed(2)} ₽`;

        if (typeof row.previous === 'number') {
          const diff = row.value - row.previous;
          const arrow = document.createElement('span');
          arrow.className = 'currency__delta ' +
            (diff > 0 ? 'is-up' : diff < 0 ? 'is-down' : 'is-flat');
          arrow.textContent = diff === 0 ? '±0' :
            `${diff > 0 ? '▲' : '▼'} ${Math.abs(diff).toFixed(2)}`;
          right.append(' ', arrow);
        }

        li.append(left, right);
        ul.append(li);
      }

      this._box.append(date, ul);
    } catch (err) {
      if (err.name === 'AbortError') return;
      this._setState('error', `Ошибка загрузки: ${err.message}`);
    }
  }
}