import React, { useEffect, useState } from 'react';
import htm from 'htm';
import { listWishItems, addWishItem, archiveWishItem, updateWishItem, deleteWishItem } from '../lib/api.js';
import { formatBudget } from '../lib/format.js';

const html = htm.bind(React.createElement);

const CheckIcon = html`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
  <polyline points="4 12 9 17 20 6" />
</svg>`;

const EditIcon = html`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
  <path d="M12 20h9" />
  <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
</svg>`;

const TrashIcon = html`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
  <path d="M3 6h18" />
  <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
  <path d="M10 11v6" />
  <path d="M14 11v6" />
</svg>`;

const LinkIcon = html`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
  <path d="M9 17H7a5 5 0 0 1 0-10h2" />
  <path d="M15 7h2a5 5 0 0 1 0 10h-2" />
  <line x1="8" y1="12" x2="16" y2="12" />
</svg>`;

export function WishListView() {
  const [activeItems, setActiveItems] = useState(null);
  const [archivedItems, setArchivedItems] = useState(null);
  const [showArchived, setShowArchived] = useState(false);
  const [name, setName] = useState('');
  const [budget, setBudget] = useState('');
  const [productUrl, setProductUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editBudget, setEditBudget] = useState('');
  const [editProductUrl, setEditProductUrl] = useState('');

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
      await addWishItem(trimmed, budgetAmount, productUrl.trim());
      setName('');
      setBudget('');
      setProductUrl('');
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

  function startEdit(item) {
    setEditingId(item.id);
    setEditName(item.name);
    setEditBudget(item.budget_amount === null ? '' : String(item.budget_amount));
    setEditProductUrl(item.product_url || '');
  }

  function cancelEdit() {
    setEditingId(null);
  }

  async function saveEdit(id) {
    const trimmed = editName.trim();
    if (!trimmed) return;
    const budgetAmount = editBudget.trim() === '' ? null : Number(editBudget);
    await updateWishItem(id, trimmed, budgetAmount, editProductUrl.trim());
    setEditingId(null);
    await refresh();
  }

  async function handleDelete(id, fromArchived) {
    if (!window.confirm('このアイテムを削除しますか?(元に戻せません)')) return;
    await deleteWishItem(id);
    if (fromArchived) {
      setArchivedItems((prev) => (prev ? prev.filter((i) => i.id !== id) : prev));
    } else {
      setActiveItems((prev) => (prev ? prev.filter((i) => i.id !== id) : prev));
    }
  }

  if (activeItems === null) {
    return html`<div class="loading-hint">読み込み中…</div>`;
  }

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
        <input
          type="url"
          placeholder="商品ページのリンク(任意)"
          value=${productUrl}
          onInput=${(e) => setProductUrl(e.target.value)}
        />
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
        : html`
            <div class="item-list">
              ${activeItems.map(
                (item) =>
                  editingId === item.id
                    ? html`
                        <div key=${item.id} class="item-row item-row--stack">
                          <div class="edit-form">
                            <input
                              type="text"
                              value=${editName}
                              onInput=${(e) => setEditName(e.target.value)}
                            />
                            <input
                              type="url"
                              placeholder="商品ページのリンク(任意)"
                              value=${editProductUrl}
                              onInput=${(e) => setEditProductUrl(e.target.value)}
                            />
                            <input
                              type="number"
                              placeholder="金額(任意)"
                              value=${editBudget}
                              onInput=${(e) => setEditBudget(e.target.value)}
                              min="0"
                            />
                            <div class="edit-actions">
                              <button class="edit-actions__delete" onClick=${() => handleDelete(item.id, false)}>削除</button>
                              <div class="edit-actions__right">
                                <button class="edit-actions__cancel" onClick=${cancelEdit}>キャンセル</button>
                                <button class="edit-actions__save" onClick=${() => saveEdit(item.id)}>保存</button>
                              </div>
                            </div>
                          </div>
                        </div>
                      `
                    : html`
                        <div key=${item.id} class="item-row">
                          <button class="check-btn" onClick=${() => handleToggleActive(item.id, false)} aria-label="手に入れた">
                            ${CheckIcon}
                          </button>
                          <div class="item-row__main">
                            <div class="item-row__name">${item.name}</div>
                            ${item.budget_amount !== null &&
                            html`<div class="item-row__budget">${formatBudget(item.budget_amount)}</div>`}
                          </div>
                          <div class="item-row__actions">
                            ${item.product_url &&
                            html`<a class="icon-btn" href=${item.product_url} target="_blank" rel="noopener noreferrer" aria-label="商品ページを開く">
                              ${LinkIcon}
                            </a>`}
                            <button class="icon-btn" onClick=${() => startEdit(item)} aria-label="編集">
                              ${EditIcon}
                            </button>
                            <button class="icon-btn" onClick=${() => handleDelete(item.id, false)} aria-label="削除">
                              ${TrashIcon}
                            </button>
                          </div>
                        </div>
                      `
              )}
            </div>
          `}

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
                        <div class="item-row__actions">
                          ${item.product_url &&
                          html`<a class="icon-btn" href=${item.product_url} target="_blank" rel="noopener noreferrer" aria-label="商品ページを開く">
                            ${LinkIcon}
                          </a>`}
                          <button class="icon-btn" onClick=${() => handleDelete(item.id, true)} aria-label="削除">
                            ${TrashIcon}
                          </button>
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
