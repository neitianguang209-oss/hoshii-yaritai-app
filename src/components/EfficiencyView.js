import React, { useEffect, useState } from 'react';
import htm from 'htm';
import { listEfficiencyTasks, addEfficiencyTask, updateEfficiencyStatus } from '../lib/api.js';
import { isWithinCurrentWeek } from '../lib/format.js';

const html = htm.bind(React.createElement);

const PRIORITY_LABEL = { high: '高', mid: '中', low: '低' };
const STATUS_LABEL = { not_started: '未着手', in_progress: '進行中', done: '完了' };
const STATUS_ORDER = ['not_started', 'in_progress', 'done'];

export function EfficiencyView() {
  const [tasks, setTasks] = useState(null);
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState('mid');
  const [saving, setSaving] = useState(false);

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
    if (!trimmed || saving) return;
    setSaving(true);
    try {
      await addEfficiencyTask(trimmed, priority);
      setTitle('');
      setPriority('mid');
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

  if (tasks === null) {
    return html`<div class="loading-hint">読み込み中…</div>`;
  }

  const weekCount = tasks.filter((t) => t.status === 'done' && isWithinCurrentWeek(t.completed_at)).length;

  const groups = STATUS_ORDER.map((status) => ({
    status,
    label: STATUS_LABEL[status],
    rows: tasks.filter((t) => t.status === status),
  }));

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
        <div class="toggle-row">
          ${['high', 'mid', 'low'].map(
            (p) => html`
              <button
                key=${p}
                type="button"
                class=${`chip${priority === p ? ' is-selected' : ''}`}
                onClick=${() => setPriority(p)}
              >重要度: ${PRIORITY_LABEL[p]}</button>
            `
          )}
        </div>
      </form>

      ${tasks.length === 0
        ? html`<div class="empty-hint">まだ何も登録されていません。</div>`
        : groups.map(
            (group) =>
              group.rows.length > 0 &&
              html`
                <div key=${group.status}>
                  <div class="group-heading">${group.label}(${group.rows.length})</div>
                  <div class="item-list">
                    ${group.rows.map(
                      (task) => html`
                        <div key=${task.id} class=${`item-row item-row--stack${task.status === 'done' ? ' is-done' : ''}`}>
                          <div class="item-row__main">
                            <div class=${`item-row__name${task.status === 'done' ? ' is-struck' : ''}`}>${task.title}</div>
                            <div class="item-row__meta">
                              <span class=${`badge priority-${task.priority}`}>重要度 ${PRIORITY_LABEL[task.priority]}</span>
                            </div>
                          </div>
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
                </div>
              `
          )}
    </div>
  `;
}
