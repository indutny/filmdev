import { LitElement, html, css } from 'lit';
import { styleMap } from 'lit-html/directives/style-map.js';

import blipUrl from '../assets/blip.mp3'

import { MINUTE, formatDuration } from './util.js';

const STAGE_IDLE = 'idle';
const STAGE_RUNNING = 'running';
const STAGE_FINISHED = 'finished';

const POUR_DURATION = 10;
const AGITATE_DURATION = 10;

const blip = new Audio(blipUrl);

function onBeforeUnload(event) {
  event.preventDefault();
}

export class Timer extends LitElement {
  static styles = css`
    .timer {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .process {
      text-align: right;
      font-size: 1rem;
      color: #aaa;
    }

    .action {
      height: 4rem;
      font-size: 4rem;
      line-height: 4rem;
    }

    .display {
      font-variant-numeric: tabular-nums;
      font-size: 6rem;
    }

    button {
      height: 2rem;
      width: 100%;
    }

    .progress {
      width: 100%
      height: 4px;
      overflow: hidden;
      background: light-dark(#eee, #333);

      border-radius: 2px;
    }

    .progress-fill {
      width: 100%;
      height: 4px;

      transform: translateX(-100%);
      background: blue;
      border-radius: 2px;

      transition: transform 250ms ease-in-out;
    }
  `;

  static properties = {
    process: { type: String },
    duration: { type: Number },

    acquiringLock: { state: true, type: Boolean },
    elapsed: { state: true, type: Number },
    stage: { state: true, type: String },
    action: { state: true, type: String },
  };

  #wakeLock;
  #startTime;
  #timer;

  constructor() {
    super();

    this.acquiringLock = false;
    this.elapsed = 0;
    this.stage = STAGE_IDLE;
    this.action = '';
  }

  connectedCallback() {
    super.connectedCallback();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.#wakeLock?.then(lock => lock.release());
    this.#wakeLock = undefined;
    if (this.#timer !== undefined) {
      clearInterval(this.#timer);
    }
    window.removeEventListener('beforeunload', onBeforeUnload);
  }

  render() {
    let displayedValue;

    if (this.stage === STAGE_IDLE) {
      displayedValue = this.duration;
    } else if (this.stage === STAGE_RUNNING) {
      displayedValue = this.elapsed;
    } else if (this.stage === STAGE_FINISHED) {
      displayedValue = this.elapsed;
    }

    const progress = this.elapsed / this.duration * 100;
    const progressStyle = {
      transform: `translateX(${progress - 100}%)`,
    };

    return html`<div class="timer">
      <div class="process">${this.process}</div>
      <div class="action">${this.action}</div>
      <div class="display">
        ${formatDuration(displayedValue)}
      </div>
      <div class="progress">
        <div class="progress-fill" style=${styleMap(progressStyle)}></div>
      </div>
      <button
        @click=${this.onStart}
        ?disabled=${this.acquiringLock || this.stage !== STAGE_IDLE}>
        Start
      </button>
      <button
        @click=${this.onNext}
        ?disabled=${this.stage !== STAGE_FINISHED}>
        Next
      </button>
    </div>`;
  }

  async onStart(e) {
    e.preventDefault();

    this.acquiringLock = true;

    try {
      this.#wakeLock = await navigator.wakeLock.request();
    } catch {
      // Ignore
    }

    this.acquiringLock = false;

    this.#startTime = Date.now();
    this.stage = STAGE_RUNNING;

    this.#timer = setTimeout(() => this.onTick(), 1000);
    this.computeAction();

    window.addEventListener('beforeunload', onBeforeUnload);
  }

  onTick() {
    this.#timer = undefined;

    const elapsedMs = Date.now() - this.#startTime;

    this.elapsed += 1;
    const drift = elapsedMs - this.elapsed * 1000;

    this.computeAction();

    if (this.elapsed < this.duration) {
      this.#timer = setTimeout(() => this.onTick(), 1000 - drift);
      return;
    }

    this.stage = STAGE_FINISHED;
    this.#timer = undefined;
    window.removeEventListener('beforeunload', onBeforeUnload);
  }

  onNext(e) {
    e.preventDefault();
    const event = new Event('next', { bubbles: true, composed: true });
    this.dispatchEvent(event);
  }

  computeAction() {
    if (this.duration - this.elapsed <= POUR_DURATION) {
      this.setAction('Drain');
      return;
    }

    if (this.elapsed < POUR_DURATION) {
      this.setAction('Pour');
      return;
    }

    // First agitation happens after pouring
    if (this.elapsed < MINUTE) {
      if (this.elapsed < POUR_DURATION + AGITATE_DURATION) {
        this.setAction('Agitate');
        return;
      }
      this.setAction('');
      return;
    }

    if (this.elapsed % MINUTE < AGITATE_DURATION) {
      this.setAction('Agitate');
      return;
    }

    this.setAction('');
  }

  setAction(newAction) {
    if (this.action === newAction) {
      return;
    }

    this.action = newAction;
    if (newAction) {
      blip.play();
    }
  }
}
customElements.define('fd-timer', Timer);
