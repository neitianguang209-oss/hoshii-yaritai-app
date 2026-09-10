import { supabase } from "./supabaseClient.js";
import { withCache } from "./cache.js";

// ---- 日用品ストック ----
export async function listDailyStockItems() {
  return withCache("daily_stock_items", async () => {
    const { data, error } = await supabase
      .from("daily_stock_items")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: true });
    if (error) throw error;
    return data;
  });
}

export async function addDailyStockItem(name, genreTag) {
  const { error } = await supabase
    .from("daily_stock_items")
    .insert({ name, genre_tag: genreTag });
  if (error) throw error;
}

export async function archiveDailyStockItem(id) {
  const { error } = await supabase
    .from("daily_stock_items")
    .update({ is_active: false })
    .eq("id", id);
  if (error) throw error;
}

export async function updateDailyStockItem(id, name, genreTag) {
  const { error } = await supabase
    .from("daily_stock_items")
    .update({ name, genre_tag: genreTag })
    .eq("id", id);
  if (error) throw error;
}

export async function deleteDailyStockItem(id) {
  const { error } = await supabase.from("daily_stock_items").delete().eq("id", id);
  if (error) throw error;
}

// ---- 欲しいものリスト ----
export async function listWishItems({ includeArchived = false } = {}) {
  // アーカイブ込みの一覧は控えを分けて持つ(表示内容が違うため)
  const key = includeArchived ? "wish_items_all" : "wish_items";
  return withCache(key, async () => {
    let query = supabase.from("wish_items").select("*").order("created_at", { ascending: true });
    if (!includeArchived) query = query.eq("is_active", true);
    const { data, error } = await query;
    if (error) throw error;
    return data;
  });
}

export async function addWishItem(name, budgetAmount, productUrl) {
  const { error } = await supabase.from("wish_items").insert({
    name,
    budget_amount: budgetAmount ?? null,
    product_url: productUrl || null,
  });
  if (error) throw error;
}

export async function archiveWishItem(id, isActive) {
  const { error } = await supabase
    .from("wish_items")
    .update({ is_active: isActive })
    .eq("id", id);
  if (error) throw error;
}

export async function updateWishItem(id, name, budgetAmount, productUrl) {
  const { error } = await supabase
    .from("wish_items")
    .update({ name, budget_amount: budgetAmount ?? null, product_url: productUrl || null })
    .eq("id", id);
  if (error) throw error;
}

export async function deleteWishItem(id) {
  const { error } = await supabase.from("wish_items").delete().eq("id", id);
  if (error) throw error;
}

// ---- 効率化したいこと ----
export async function listEfficiencyTasks() {
  return withCache("efficiency_tasks", async () => {
    const { data, error } = await supabase
      .from("efficiency_tasks")
      .select("*")
      .order("created_at", { ascending: true });
    if (error) throw error;
    return data;
  });
}

export async function addEfficiencyTask(title, priority, detail, taskType) {
  const { error } = await supabase
    .from("efficiency_tasks")
    .insert({ title, priority, detail: detail || null, task_type: taskType });
  if (error) throw error;
}

export async function updateEfficiencyStatus(id, status) {
  const patch = { status };
  patch.completed_at = status === "done" ? new Date().toISOString() : null;
  const { error } = await supabase.from("efficiency_tasks").update(patch).eq("id", id);
  if (error) throw error;
}

export async function updateEfficiencyTask(id, title, priority, detail, taskType) {
  const { error } = await supabase
    .from("efficiency_tasks")
    .update({ title, priority, detail: detail || null, task_type: taskType })
    .eq("id", id);
  if (error) throw error;
}

export async function deleteEfficiencyTask(id) {
  const { error } = await supabase.from("efficiency_tasks").delete().eq("id", id);
  if (error) throw error;
}
