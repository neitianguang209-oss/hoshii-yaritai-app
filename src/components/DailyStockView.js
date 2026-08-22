import React, { useEffect, useState } from 'react';
import htm from 'htm';
import { listDailyStockItems, addDailyStockItem, archiveDailyStockItem } from '../lib/api.js';

const html = htm.bind(React.createElement);

const PRESET_TAGS = ['食材', '日用品'];

const CheckIcon = html`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
  <polyline points="4 12 9 17 20 6" />
</svg>`;

export function DailyStockView() {
  const [items, setItems] = useState(null);
  const [name, setName] = useState('');
  const [genreTag, setGenreTag] = useState(PRESET_TAGS[0]);
  const [customTag, setCustomTag] = useState('');
  const [showCustom, setShowCustom] = useState(false);
  const [activeFilter, setActiveFilter] = useState('すべて');
  const [saving, setSaving] = useState(false);

  async function refresh() {
    const data = await listDailyStockItems();
    setItems(data);
  }

  useEffect(() => {
    refresh();
    const onVisible = () => document.visibilityState === 'visible' && refresh();
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, []);

  async function handleAdd(e) {
    e.preventDefault();
    const trimmed = name.trim();
    const tag = (showCustom ? customTag : genreTag).trim();
    if (!trimmed || !tag || saving) return;
    setSaving(true);
    try {
      await addDailyStockItem(trimmed, tag);
      setName('');
      if (showCustom) setCustomTag('');
      await refresh();
    } finally {
      setSaving(false);
    }
  }

  async function handleCheck(id) {
    await archiveDailyStockItem(id);
    setItems((prev) => (prev ? prev.filter((i) => i.id !== id) : prev));
  }

  if (items === null) {
    return html`<div class="loading-hint">読み込み中…</div>`;
  }

  const tags = ['すべて', ...Array.from(new Set(items.map((i) => i.genre_tag)))];
  const filtered = activeFilter === 'すべて' ? items : items.filter((i) => i.genre_tag === activeFilter);

  const groups =
    activeFilter === 'すべて'
      ? Array.from(new Set(items.map((i) => i.genre_tag))).map((tag) => ({
          tag,
          rows: items.filter((i) => i.genre_tag === tag),
        }))
      : [{ tag: activeFilter, rows: filtered }];

  return html`
    <div>
      <form class="add-form" onSubmit=${handleAdd}>
        <div class="add-form__row">
          <input
            type="text"
            placeholder="買うもの(例: 洗剤)"
            value=${name}
            onInput=${(e) => setName(e.target.value)}
          />
          <button class="add-form__submit" type="submit" disabled=${saving || !name.trim()}>追加</button>
        </div>
        <div class="chip-row">
          ${PRESET_TAGS.map(
            (tag) => html`
              <button
                key=${tag}
                type="button"
                class=${`chip${!showCustom && genreTag === tag ? ' is-selected' : ''}`}
                onClick=${() => {
                  setShowCustom(false);
                  setGenreTag(tag);
                }}
              >${tag}</button>
            `
          )}
          <button
            type="button"
            class=${`chip${showCustom ? ' is-selected' : ''}`}
            onClick=${() => setShowCustom(true)}
          >＋自由入力</button>
        </div>
        ${showCustom &&
        html`<input
          type="text"
          placeholder="ジャンルを入力(例: 化粧品)"
          value=${customTag}
          onInput=${(e) => setCustomTag(e.target.value)}
        />`}
      </form>

      ${items.length > 0 &&
      html`
        <div class="chip-row" style=${{ marginBottom: '14px' }}>
          ${tags.map(
            (tag) => html`
              <button
                key=${tag}
                class=${`chip${activeFilter === tag ? ' is-selected' : ''}`}
                onClick=${() => setActiveFilter(tag)}
              >${tag}</button>
            `
          )}
        </div>
      `}

      ${items.length === 0
        ? html`<div class="empty-hint">まだ何も登録されていません。</div>`
        : groups.map(
            (group) => html`
              <div key=${group.tag}>
                ${activeFilter === 'すべて' && html`<div class="group-heading">${group.tag}</div>`}
                <div class="item-list">
                  ${group.rows.map(
                    (item) => html`
                      <div key=${item.id} class="item-row">
                        <button class="check-btn" onClick=${() => handleCheck(item.id)} aria-label="買った">
                          ${CheckIcon}
                        </button>
                        <div class="item-row__main">
                          <div class="item-row__name">${item.name}</div>
                        </div>
                      </div>
                    `
                  )}
                </div>
              </div>
            `
          )}
    </div>
  `;
}
