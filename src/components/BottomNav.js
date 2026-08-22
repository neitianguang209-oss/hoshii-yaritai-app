import htm from 'htm';
import React from 'react';

const html = htm.bind(React.createElement);

const ICONS = {
  wants: html`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
    <path d="M12 21s-7.5-4.6-10-9.2C.5 8.3 2.4 5 6 5c2.1 0 3.6 1.2 6 4 2.4-2.8 3.9-4 6-4 3.6 0 5.5 3.3 4 6.8C19.5 16.4 12 21 12 21z" />
  </svg>`,
  efficiency: html`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
    <path d="M13 2 4 14h6l-1 8 9-12h-6l1-8z" />
  </svg>`,
};

const TABS = [
  { key: 'wants', icon: 'wants', label: '欲しいもの' },
  { key: 'efficiency', icon: 'efficiency', label: '効率化したいこと' },
];

export function BottomNav({ active, onChange }) {
  return html`
    <nav class="bottom-nav">
      ${TABS.map(
        (tab) => html`
          <button
            key=${tab.key}
            class=${`bottom-nav__item${active === tab.key ? ' is-active' : ''}`}
            onClick=${() => onChange(tab.key)}
          >
            ${ICONS[tab.icon]}
            <span>${tab.label}</span>
          </button>
        `
      )}
    </nav>
  `;
}
