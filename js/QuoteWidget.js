import { UIComponent } from './UIComponent.js';

export class QuoteWidget extends UIComponent {
  static type = 'quote';

  constructor(config = {}) {
    super({ title: 'Случайная цитата', ...config });
    this.quotes = [
      { text: 'Программы должны быть написаны для людей, а лишь попутно — для машин.', author: 'Абельсон и Сассман' },
      { text: 'Простота — предельная форма изощрённости.', author: 'Леонардо да Винчи' },
      { text: 'Сначала решите задачу. Потом пишите код.', author: 'Джон Джонсон' },
      { text: 'Любая достаточно развитая технология неотличима от магии.', author: 'Артур Кларк' },
      { text: 'Единственный способ сделать великую работу — любить то, что делаешь.', author: 'Стив Джобс' }
    ];
    this.current = null;
  }

  render() {
    super.render();

    const box = document.createElement('blockquote');
    box.className = 'quote';
    box.setAttribute('aria-live', 'polite');

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'btn btn--primary';
    btn.textContent = 'Обновить';

    this.body.append(box, btn);

    this._listen(btn, 'click', () => this.refresh());
    this.refresh();

    return this.el;
  }

  refresh() {
    const box = this.body.querySelector('.quote');
    let next = this.current;
    while (next === this.current && this.quotes.length > 1) {
      next = this.quotes[Math.floor(Math.random() * this.quotes.length)];
    }
    this.current = next;

    box.textContent = '';
    const p = document.createElement('p');
    p.textContent = `«${next.text}»`;
    const cite = document.createElement('cite');
    cite.textContent = `— ${next.author}`;
    box.append(p, cite);
  }
}