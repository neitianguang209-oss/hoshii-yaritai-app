// 通信できないときに前回の内容を表示するための、読み取り結果のキャッシュ。
//
// このアプリはデータをSupabaseにしか持っておらず、Supabaseに繋がらないと
// 画面が空になる。データ自体が消えるわけではないが、外出先で電波が悪い、
// あるいはSupabase側が落ちているときに何も見えないのは不便なので、
// 一覧の取得結果を端末にも控えておき、失敗時はそれを表示する。
//
// 書き込み(追加・更新・削除)はキャッシュしない。オフラインでの編集は
// 競合の解決が必要になり、このアプリの規模に見合わないため。

const PREFIX = 'hoshii-yaritai:cache:';

export function readCache(key) {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

function writeCache(key, value) {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch (e) {
    // 容量超過などは無視する(あくまで控え)
  }
}

// 取得に成功したらキャッシュを更新し、失敗したらキャッシュを返す。
// キャッシュも無い場合は、呼び出し側にエラーをそのまま投げる。
export async function withCache(key, fetcher) {
  try {
    const data = await fetcher();
    writeCache(key, data);
    offline = false;
    return data;
  } catch (e) {
    const cached = readCache(key);
    if (cached) {
      offline = true;
      notifyOffline();
      return cached;
    }
    throw e;
  }
}

// オフライン表示中かどうかを画面に伝えるための最小限の仕組み
let offline = false;
const listeners = new Set();

export function isOffline() { return offline; }
export function onOfflineChange(fn) { listeners.add(fn); return () => listeners.delete(fn); }
function notifyOffline() { listeners.forEach((fn) => fn(offline)); }

// エクスポート用: 全キャッシュをまとめて返す
export function cachedSnapshot() {
  return {
    exportedAt: new Date().toISOString(),
    dailyStockItems: readCache('daily_stock_items') || [],
    wishItems: readCache('wish_items') || [],
    efficiencyTasks: readCache('efficiency_tasks') || [],
  };
}
