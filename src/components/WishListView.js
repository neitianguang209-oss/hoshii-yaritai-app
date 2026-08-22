import React, { useEffect, useState } from 'react';
import htm from 'htm';
import { listWishItems, addWishItem, archiveWishItem } from '../lib/api.js';
import { formatBudget } from '../lib/format.js';

const html = htm.bind(React.createElement);

const CheckIcon = html`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
  <polyline points="4 12 9 17 20 6" />
</svg>`;

const DECISION_LABEL = { instant: '即決型', encounter: '出会い待ち型' };

export function WishListView() {
  const [activeItems, setActiveItems] = useState(null);
  const [archivedItems, setArchivedItems] = useState(null);
  const [showArchived, setShowArchived] = useState(false);
  const [name, setName] = useState('');
  const [decisionType, setDecisionType] = useState('instant');
  const [budget, setBudget] = useState('');
  const [saving, setSaving] = useState(false);

  async function refresh() {
    const data = await listWishItems();
    setActiveItems(data);
  }

  useEffect(() => {
    refresh();
    const onVisible = () => document.visibilityState === 'visible' && refresh();
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, []);

  async function toggleArchivedView() {
    if (!showArchived && archivedItems === null) {
      const all = await listWishItems({ includeArchived: true });
      setArchivedItems(all.filter((i) => !i.is_active));
    }
    setShowArchived((v) => !v);
  }

  async function handleAdd(e) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed || saving) return;
    setSaving(true);
    try {
      const budgetAmount = budget.trim() === '' ? null : Number(budget);
      await addWishItem(trimmed, decisionType, budgetAmount);
      setName('');
      setBudget('');
      await refresh();
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleActive(id, nextActive) {
    await archiveWishItem(id, nextActive);
    if (nextActive) {
      setArchivedItems((prev) => (prev ? prev.filter((i) => i.id !== id) : prev));
    } else {
      setActiveItems((prev) => (prev ? prev.filter((i) => i.id !== id) : prev));
    }
    await refresh();
    if (archivedItems !== null) {
      const all = await listWishItems({ includeArchived: true });
      setArchivedItems(all.filter((i) => !i.is_active));
    }
  }

  if (activeItems === null) {
    return html`<div class="loading-hint">読み込み中…</div>`;
  }

  const groups = [
    { key: 'instant', label: DECISION_LABEL.instant, rows: activeItems.filter((i) => i.decision_type === 'instant') },
    { key: 'encounter', label: DECISION_LABEL.encounter, rows: activeItems.filter((i) => i.decision_type === 'encounter') },
  ];

  return html`
    <div>
      <form class="add-form" onSubmit=${handleAdd}>
        <div class="add-form__row">
          <input
            type="text"
            placeholder="欲しいもの(例: 電動歯ブラシ)"
            value=${name}
            onInput=${(e) => setName(e.target.value)}
          />
          <button class="add-form__submit" type="submit" disabled=${saving || !name.trim()}>追加</button>
        </div>
        <div class="toggle-row">
          <button
            type="button"
            class=${`chip${decisionType === 'instant' ? ' is-selected' : ''}`}
            onClick=${() => setDecisionType('instant')}
          >即決型</button>
          <button
            type="button"
            class=${`chip${decisionType === 'encounter' ? ' is-selected' : ''}`}
            onClick=${() => setDecisionType('encounter')}
          >出会い待ち型</button>
        </div>
        <input
          type="number"
          placeholder="金額(任意)"
          value=${budget}
          onInput=${(e) => setBudget(e.target.value)}
          min="0"
        />
      </form>

      ${activeItems.length === 0
        ? html`<div class="empty-hint">まだ何も登録されていません。</div>`
        : groups.map(
            (group) =>
              group.rows.length > 0 &&
              html`
                <div key=${group.key}>
                  <div class="group-heading">${group.label}</div>
                  <div class="item-list">
                    ${group.rows.map(
                      (item) => html`
                        <div key=${item.id} class="item-row">
                          <button class="check-btn" onClick=${() => handleToggleActive(item.id, false)} aria-label="手に入れた">
                            ${CheckIcon}
                          </button>
                          <div class="item-row__main">
                            <div class="item-row__name">${item.name}</div>
                            ${item.budget_amount !== null &&
                            html`<div class="item-row__budget">${formatBudget(item.budget_amount)}</div>`}
                          </div>
                        </div>
                      `
                    )}
                  </div>
                </div>
              `
          )}

      <div class="archive-toggle">
        <button onClick=${toggleArchivedView}>
          ${showArchived ? '購入済みを閉じる' : '購入済みを見る'}
        </button>
      </div>

      ${showArchived &&
      html`
        <div>
          <div class="group-heading">購入済み</div>
          ${archivedItems && archivedItems.length === 0
            ? html`<div class="empty-hint">まだありません。</div>`
            : html`
                <div class="item-list">
                  ${(archivedItems || []).map(
                    (item) => html`
                      <div key=${item.id} class="item-row is-done">
                        <button class="check-btn is-checked" onClick=${() => handleToggleActive(item.id, true)} aria-label="戻す">
                          ${CheckIcon}
                        </button>
                        <div class="item-row__main">
                          <div class="item-row__name is-struck">${item.name}</div>
                          ${item.budget_amount !== null &&
                          html`<div class="item-row__budget">${formatBudget(item.budget_amount)}</div>`}
                        </div>
                      </div>
                    `
                  )}
                </div>
              `}
        </div>
      `}
    </div>
  `;
}
