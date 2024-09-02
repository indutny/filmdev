import { LitElement, html, css } from 'lit';

import { MINUTE, formatDuration } from './util.js';

const BASE_TEMPERATURE = 20;
const STEP_MODIFIER = 0.9; // 10% for each 1 degree

class SubmitEvent extends Event {
  constructor(data) {
    super('submit', { bubbles: true, composed: true });

    this.data = data;
  }
}

export class Form extends LitElement {
  static styles = css`
    form {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    label {
      display: flex;
      flex-direction: row;

      font-size: 1rem;
      gap: 1rem;
    }

    label div {
      flex-grow: 1;
    }

    label input {
      max-width: 4rem;
    }

    input[type="submit"], input[type="reset"] {
      height: 2rem;
      width: 100%;
    }

    .confirm-row {
      display: flex;
      flex-direction: row;
      gap: 1rem;
    }

    .confirm-process {
      flex-grow: 1;
      color: #aaa;
    }
  `;

  static properties = {
    developTimeMin: { state: true },
    temperature: { state: true },
    stopTimeSec: { state: true },
    fixTimeMin: { state: true },
    confirmation: { state: true },
  };

  constructor() {
    super();

    this.developTimeMin = 17;
    this.temperature = BASE_TEMPERATURE;
    this.stopTimeSec = 20;
    this.fixTimeMin = 5;
    this.confirmation = undefined;
  }

  render() {
    if (this.confirmation) {
      return html`<form class="confirm" @submit=${this.onConfirm}>
        ${
          this.confirmation.map(({ duration, process }) => {
            return html`<div class="confirm-row">
              <div class="confirm-process">${process}:</div>
              <div class="confirm-duration">${formatDuration(duration)}</div>
            </div>`;
          })
        }
        <input type="reset" @click=${this.onReset} value="Reset"/>
        <input type="submit" value="Confirm"/>
      </div>`;
    }

    return html`<form @submit=${this.onSubmit}>
      <label for="dev">
        <div>Developing Time (min):</div>
        <input
          id="dev"
          type="number"
          .value=${this.developTimeMin}
          @change=${e => this.developTimeMin = parseInt(e.target.value, 10)}
        />
      </label>
      <label for="temp">
        <div>Temperature (C):</div>
        <input
          id="temp"
          type="number"
          .value=${this.temperature}
          @change=${e => this.temperature = parseFloat(e.target.value)}
        />
      </label>
      <label for="stop">
        <div>Stopbath Time (sec):</div>
        <input
          id="stop"
          type="number"
          step="0.1"
          .value=${this.stopTimeSec}
          @change=${e => this.stopTimeSec = parseInt(e.target.value, 10)}
        />
      </label>
      <label for="fix">
        <div>Fixing Time (min):</div>
        <input
          id="fix"
          type="number"
          .value=${this.fixTimeMin}
          @change=${e => this.fixTimeMin = parseInt(e.target.value, 10)}
        />
      </label>
      <input type="submit" value="Start"/>
    </form>`;
  }

  onSubmit(e) {
    e.preventDefault();

    const developTimeSec = Math.round(
      this.developTimeMin * MINUTE *
        Math.pow(STEP_MODIFIER, this.temperature - BASE_TEMPERATURE)
    );
    const fixTimeSec = this.fixTimeMin * MINUTE;

    this.confirmation = [
      { duration: developTimeSec, process: 'Develop' },
      { duration: this.stopTimeSec, process: 'Stop' },
      { duration: fixTimeSec, process: 'Fix' },
    ];
  }

  onReset(e) {
    e.preventDefault();

    this.confirmation = undefined;
  }

  onConfirm(e) {
    e.preventDefault();

    const submit = new SubmitEvent(this.confirmation);
    this.dispatchEvent(submit);
  }
}
customElements.define('fd-form', Form);
