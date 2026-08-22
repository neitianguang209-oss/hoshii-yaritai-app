import React, { useState } from 'react';
import htm from 'htm';
import { BottomNav } from './components/BottomNav.js';
import { DailyStockView } from './components/DailyStockView.js';
import { WishListView } from './components/WishListView.js';
import { EfficiencyView } from './components/EfficiencyView.js';

const html = htm.bind(React.createElement);

export function App() {
  const [tab, setTab] = useState('wants');
  const [wantsSubTab, setWantsSubTab] = useState('stock');

  return html`
    <div class="app">
      <div class="app-body">
        ${tab === 'wants'
          ? html`
              <h1 class="page-title">欲しいもの</h1>
              <div class="sub-tabs">
                <button
                  class=${`sub-tabs__item${wantsSubTab === 'stock' ? ' is-active' : ''}`}
                  onClick=${() => setWantsSubTab('stock')}
                >日用品ストック</button>
                <button
                  class=${`sub-tabs__item${wantsSubTab === 'wishlist' ? ' is-active' : ''}`}
                  onClick=${() => setWantsSubTab('wishlist')}
                >欲しいものリスト</button>
              </div>
              ${wantsSubTab === 'stock' ? html`<${DailyStockView} />` : html`<${WishListView} />`}
            `
          : html`
              <h1 class="page-title">効率化したいこと</h1>
              <${EfficiencyView} />
            `}
      </div>
      <${BottomNav} active=${tab} onChange=${setTab} />
    </div>
  `;
}
