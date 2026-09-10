import React, { useEffect, useState } from 'react';
import htm from 'htm';
import { cachedSnapshot, isOffline, onOfflineChange } from '../lib/cache.js';

const html = htm.bind(React.createElement);

// 画面右上の小さな道具まとめ:
//  - オフライン表示中のお知らせ
//  - JSONの書き出し(端末に残っている控えから作るので、通信できなくても押せる)
export function AppHeaderTools() {
  const [offline, setOffline] = useState(isOffline());

  useEffect(() => onOfflineChange(setOffline), []);

  function handleExport() {
    const snapshot = cachedSnapshot();
    const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const d = new Date();
    const stamp = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    a.href = url;
    a.download = `hoshii-yaritai-${stamp}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return html`
    <div class="header-tools">
      ${offline && html`<span class="header-tools__offline">通信できないため、前回の内容を表示中</span>`}
      <button class="header-tools__btn" onClick=${handleExport} title="JSONファイルに書き出す">書き出し</button>
    </div>
  `;
}
