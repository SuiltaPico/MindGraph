use serde_json::Value;

use crate::{mg::{mg_state::MgInitData, node::entity::MindNode}, utils::types::MutexAppState};

#[tauri::command(async, rename_all = "snake_case")]
pub async fn load(state: tauri::State<'_, MutexAppState>, path: String) -> Result<(), String> {
  let mut state = state.lock().await;
  state.load_mg(path).await.map_err(|e| e.to_string())?;
  Ok(())
}

#[tauri::command(async, rename_all = "snake_case")]
pub async fn save(
  state: tauri::State<'_, MutexAppState>,
  modified_nodes: Vec<MindNode>,
  deleted_nodes: Vec<String>,
  added_nodes: Vec<MindNode>,
  meta: Value,
) -> Result<(), String> {
  let mut state = state.lock().await;
  state
    .save_mg(modified_nodes, deleted_nodes, added_nodes, meta)
    .await
    .map_err(|e| e.to_string())?;
  Ok(())
}

#[tauri::command(async, rename_all = "snake_case")]
pub async fn save_as(
  state: tauri::State<'_, MutexAppState>,
  uri: String,
  modified_nodes: Vec<MindNode>,
  deleted_nodes: Vec<String>,
  added_nodes: Vec<MindNode>,
  meta: Value,
) -> Result<(), String> {
  let mut state = state.lock().await;
  state
    .save_as_mg(uri, modified_nodes, deleted_nodes, added_nodes, meta)
    .await
    .map_err(|e| e.to_string())?;
  Ok(())
}

#[tauri::command(async, rename_all = "snake_case")]
pub async fn get_init_data(state: tauri::State<'_, MutexAppState>) -> Result<MgInitData, String> {
  let state = state.lock().await;
  let init_data = state.get_mg_init_data().await.map_err(|e| e.to_string())?;
  Ok(init_data)
}
