import { LitElement, html, css } from 'lit';
import { keyed } from 'lit/directives/keyed.js';

import './Form.js';
import './Timer.js';

export class App extends LitElement {
  static styles = css`
    main {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;

      height: 100%;
    }
  `;

  static properties = {
    timers: { state: true },
    timerIndex: { state: true },
  };

  constructor() {
    super();

    this.timers = [];
    this.timerIndex = 0;
  }

  render() {
    let view;
    if (this.timerIndex >= this.timers.length) {
      view = html`<fd-form @submit=${this.onSubmitForm}/>`;
    } else {
      const timer = this.timers[this.timerIndex];
      view = keyed(this.timerIndex, html`<fd-timer
        process=${timer.process}
        duration=${timer.duration}
        @next=${this.onNext}
      />`);
    }

    return html`<main>${view}</main>`;
  }

  onSubmitForm(e) {
    this.timers = e.data;
    this.timerIndex = 0;
  }

  onNext() {
    this.timerIndex += 1;
  }
}
customElements.define('fd-app', App);
