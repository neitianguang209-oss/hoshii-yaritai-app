import React, { useEffect, useState } from 'react';
import htm from 'htm';
import { listEfficiencyTasks, addEfficiencyTask, updateEfficiencyStatus, updateEfficiencyTask, deleteEfficiencyTask } from '../lib/api.js';
import { isWithinCurrentWeek } from '../lib/format.js';

const html = htm.bind(React.createElement);

const PRIORITY_LABEL = { high: '高', mid: '中', low: '低' };
const STATUS_LABEL = { not_started: '未着手', in_progress: '進行中', done: '完了' };
const STATUS_ORDER = ['not_started', 'in_progress', 'done'];
const PRIORITY_ORDER = ['high', 'mid', 'low'];
const TYPE_PRESETS = ['新規', '修正'];

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

const ChevronIcon = html`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <polyline points="6 9 12 15 18 9" />
</svg>`;

function typeOptions(currentType, extraTypes) {
  const all = [...TYPE_PRESETS, ...extraTypes.filter((t) => !TYPE_PRESETS.includes(t))];
  return currentType && !all.includes(currentType) ? [...all, currentType] : all;
}

export function EfficiencyView() {
  const [tasks, setTasks] = useState(null);
  const [title, setTitle] = useState('');
  const [detail, setDetail] = useState('');
  const [typeTag, setTypeTag] = useState(TYPE_PRESETS[0]);
  const [typeCustom, setTypeCustom] = useState('');
  const [showTypeCustom, setShowTypeCustom] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editPriority, setEditPriority] = useState('mid');
  const [editDetail, setEditDetail] = useState('');
  const [editType, setEditType] = useState('');
  const [typeFilter, setTypeFilter] = useState('すべて');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [expandedIds, setExpandedIds] = useState(() => new Set());

  async function refresh() {
    const data = await listEfficiencyTasks();
    setTasks(data);
  }

  useEffect(() => {
    refresh();
    const onVisible = () => document.visibilityState === 'visible' && refresh();
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, []);

  async function handleAdd(e) {
    e.preventDefault();
    const trimmed = title.trim();
    const type = (showTypeCustom ? typeCustom : typeTag).trim();
    if (!trimmed || !type || saving) return;
    setSaving(true);
    try {
      await addEfficiencyTask(trimmed, 'mid', detail.trim(), type);
      setTitle('');
      setDetail('');
      if (showTypeCustom) setTypeCustom('');
      await refresh();
    } finally {
      setSaving(false);
    }
  }

  async function handleStatusChange(id, status) {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, status, completed_at: status === 'done' ? new Date().toISOString() : null } : t)));
    await updateEfficiencyStatus(id, status);
    await refresh();
  }

  function selectStatusFilter(status) {
    setStatusFilter(status);
    setPriorityFilter('all');
  }

  function selectTypeTag(tag) {
    setTypeFilter(tag);
    if (tag !== 'すべて') {
      setTypeTag(tag);
      setShowTypeCustom(false);
    }
  }

  function toggleExpanded(id) {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function startEdit(task) {
    setEditingId(task.id);
    setEditTitle(task.title);
    setEditPriority(task.priority);
    setEditDetail(task.detail || '');
    setEditType(task.task_type);
  }

  function cancelEdit() {
    setEditingId(null);
  }

  async function saveEdit(id) {
    const trimmed = editTitle.trim();
    const type = editType.trim();
    if (!trimmed || !type) return;
    await updateEfficiencyTask(id, trimmed, editPriority, editDetail.trim(), type);
    setEditingId(null);
    await refresh();
  }

  async function handleDelete(id) {
    if (!window.confirm('このタスクを削除しますか?(元に戻せません)')) return;
    await deleteEfficiencyTask(id);
    setTasks((prev) => (prev ? prev.filter((t) => t.id !== id) : prev));
  }

  if (tasks === null) {
    return html`<div class="loading-hint">読み込み中…</div>`;
  }

  const weekCount = tasks.filter((t) => t.status === 'done' && isWithinCurrentWeek(t.completed_at)).length;

  const typeRowTags = [
    ...TYPE_PRESETS,
    ...Array.from(new Set(tasks.map((t) => t.task_type))).filter((t) => !TYPE_PRESETS.includes(t)),
  ];

  const typeFilteredTasks = typeFilter === 'すべて' ? tasks : tasks.filter((t) => t.task_type === typeFilter);

  const statusTabs = [
    { key: 'all', label: 'すべて', count: typeFilteredTasks.length },
    ...STATUS_ORDER.map((s) => ({ key: s, label: STATUS_LABEL[s], count: typeFilteredTasks.filter((t) => t.status === s).length })),
  ];

  let visibleTasks = statusFilter === 'all' ? typeFilteredTasks : typeFilteredTasks.filter((t) => t.status === statusFilter);
  if (statusFilter !== 'all' && priorityFilter !== 'all') {
    visibleTasks = visibleTasks.filter((t) => t.priority === priorityFilter);
  }

  return html`
    <div>
      <div class="week-banner">
        <span class="week-banner__label">今週の達成</span>
        <span class="week-banner__count">${weekCount}件</span>
      </div>

      <form class="add-form" onSubmit=${handleAdd}>
        <div class="add-form__row">
          <input
            type="text"
            placeholder="効率化したいこと(例: 議事録の要約を自動化)"
            value=${title}
            onInput=${(e) => setTitle(e.target.value)}
          />
          <button class="add-form__submit" type="submit" disabled=${saving || !title.trim()}>追加</button>
        </div>
        <textarea
          placeholder="詳細(任意)"
          value=${detail}
          onInput=${(e) => setDetail(e.target.value)}
          rows="2"
        ></textarea>
      </form>

      <div class="chip-row" style=${{ marginBottom: '8px' }}>
        <button
          type="button"
          class=${`chip${typeFilter === 'すべて' ? ' is-selected' : ''}`}
          onClick=${() => selectTypeTag('すべて')}
        >すべて</button>
        ${typeRowTags.map(
          (tag) => html`
            <button
              key=${tag}
              type="button"
              class=${`chip${!showTypeCustom && typeFilter === tag ? ' is-selected' : ''}`}
              onClick=${() => selectTypeTag(tag)}
            >${tag}</button>
          `
        )}
        <button
          type="button"
          class=${`chip${showTypeCustom ? ' is-selected' : ''}`}
          onClick=${() => setShowTypeCustom(true)}
        >＋自由入力</button>
      </div>
      ${showTypeCustom &&
      html`<input
        type="text"
        placeholder="種類を入力(例: 調査)"
        value=${typeCustom}
        onInput=${(e) => setTypeCustom(e.target.value)}
        style=${{ marginBottom: '14px' }}
      />`}

      ${tasks.length > 0 &&
      html`
        <div class="chip-row" style=${{ marginBottom: '8px' }}>
          ${statusTabs.map(
            (tab) => html`
              <button
                key=${tab.key}
                class=${`chip${statusFilter === tab.key ? ' is-selected' : ''}`}
                onClick=${() => selectStatusFilter(tab.key)}
              >${tab.label}(${tab.count})</button>
            `
          )}
        </div>
      `}

      ${statusFilter !== 'all' &&
      html`
        <div class="chip-row" style=${{ marginBottom: '14px' }}>
          <button
            class=${`chip${priorityFilter === 'all' ? ' is-selected' : ''}`}
            onClick=${() => setPriorityFilter('all')}
          >すべて</button>
          ${PRIORITY_ORDER.map(
            (p) => html`
              <button
                key=${p}
                class=${`chip${priorityFilter === p ? ' is-selected' : ''}`}
                onClick=${() => setPriorityFilter(p)}
              >重要度: ${PRIORITY_LABEL[p]}</button>
            `
          )}
        </div>
      `}

      ${tasks.length === 0
        ? html`<div class="empty-hint">まだ何も登録されていません。</div>`
        : visibleTasks.length === 0
        ? html`<div class="empty-hint">該当するタスクはありません。</div>`
        : html`
            <div class="item-list">
              ${visibleTasks.map(
                (task) =>
                  editingId === task.id
                    ? html`
                        <div key=${task.id} class="item-row item-row--stack">
                          <div class="edit-form">
                            <input
                              type="text"
                              value=${editTitle}
                              onInput=${(e) => setEditTitle(e.target.value)}
                            />
                            <textarea
                              placeholder="詳細(任意)"
                              value=${editDetail}
                              onInput=${(e) => setEditDetail(e.target.value)}
                              rows="3"
                            ></textarea>
                            <div class="chip-row">
                              ${typeOptions(task.task_type, typeRowTags).map(
                                (tag) => html`
                                  <button
                                    key=${tag}
                                    type="button"
                                    class=${`chip${editType === tag ? ' is-selected' : ''}`}
                                    onClick=${() => setEditType(tag)}
                                  >${tag}</button>
                                `
                              )}
                            </div>
                            <div class="toggle-row">
                              ${PRIORITY_ORDER.map(
                                (p) => html`
                                  <button
                                    key=${p}
                                    type="button"
                                    class=${`chip${editPriority === p ? ' is-selected' : ''}`}
                                    onClick=${() => setEditPriority(p)}
                                  >重要度: ${PRIORITY_LABEL[p]}</button>
                                `
                              )}
                            </div>
                            <div class="edit-actions">
                              <button class="edit-actions__delete" onClick=${() => handleDelete(task.id)}>削除</button>
                              <div class="edit-actions__right">
                                <button class="edit-actions__cancel" onClick=${cancelEdit}>キャンセル</button>
                                <button class="edit-actions__save" onClick=${() => saveEdit(task.id)}>保存</button>
                              </div>
                            </div>
                          </div>
                        </div>
                      `
                    : html`
                        <div key=${task.id} class=${`item-row item-row--stack${task.status === 'done' ? ' is-done' : ''}`}>
                          <div class="item-row__main" style=${{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
                            <div>
                              <div class=${`item-row__name${task.status === 'done' ? ' is-struck' : ''}`}>${task.title}</div>
                              <div class="item-row__meta">
                                <span class="badge">${task.task_type}</span>
                                <span class="badge">${STATUS_LABEL[task.status]}</span>
                                <span class=${`badge priority-${task.priority}`}>重要度 ${PRIORITY_LABEL[task.priority]}</span>
                              </div>
                            </div>
                            <div class="item-row__actions">
                              <button class="icon-btn" onClick=${() => startEdit(task)} aria-label="編集">
                                ${EditIcon}
                              </button>
                              <button class="icon-btn" onClick=${() => handleDelete(task.id)} aria-label="削除">
                                ${TrashIcon}
                              </button>
                            </div>
                          </div>
                          ${task.detail &&
                          html`
                            <button class="detail-toggle" onClick=${() => toggleExpanded(task.id)}>
                              <span class=${`detail-toggle__icon${expandedIds.has(task.id) ? ' is-open' : ''}`}>${ChevronIcon}</span>
                              ${expandedIds.has(task.id) ? '詳細を閉じる' : '詳細を見る'}
                            </button>
                          `}
                          ${task.detail && expandedIds.has(task.id) &&
                          html`<div class="item-row__detail">${task.detail}</div>`}
                          <div class="status-select">
                            ${STATUS_ORDER.map(
                              (s) => html`
                                <button
                                  key=${s}
                                  class=${`chip${task.status === s ? ' is-selected' : ''}`}
                                  onClick=${() => handleStatusChange(task.id, s)}
                                >${STATUS_LABEL[s]}</button>
                              `
                            )}
                          </div>
                        </div>
                      `
              )}
            </div>
          `}
    </div>
  `;
}
