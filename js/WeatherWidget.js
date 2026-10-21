import { UIComponent } from './UIComponent.js';

/**
 * Погода через открытый API Open-Meteo (без ключа).
 * Координаты: Москва по умолчанию.
 */
export class WeatherWidget extends UIComponent {
  static type = 'weather';

  constructor(config = {}) {
    super({ title: 'Погода', ...config });
    this.lat = config.lat ?? 55.7558;
    this.lon = config.lon ?? 37.6173;
    this.city = config.city ?? 'Москва';
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

    this._setState('loading', 'Загрузка погоды…');

    try {
      const url = new URL('https://api.open-meteo.com/v1/forecast');
      url.searchParams.set('latitude', this.lat);
      url.searchParams.set('longitude', this.lon);
      url.searchParams.set('current', 'temperature_2m,wind_speed_10m,weather_code');
      url.searchParams.set('timezone', 'auto');

      const res = await fetch(url, { signal: controller.signal });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      if (requestId !== this._requestId) return;

      const cur = data?.current;
      if (!cur || typeof cur.temperature_2m !== 'number') {
        this._setState('empty', 'Нет данных о погоде.');
        return;
      }

      this._box.dataset.state = 'success';
      this._box.textContent = '';

      const t = document.createElement('p');
      t.className = 'metric';
      t.textContent = `${this.city}: ${cur.temperature_2m}°C`;

      const w = document.createElement('p');
      w.className = 'metric metric--muted';
      w.textContent = `Ветер: ${cur.wind_speed_10m} км/ч · код ${cur.weather_code}`;

      this._box.append(t, w);
    } catch (err) {
      if (err.name === 'AbortError') return;
      this._setState('error', `Ошибка загрузки: ${err.message}`);
    }
  }
}