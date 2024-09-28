use serde_json::Value;

use crate::{
  mg::{node::entity::MindNode},
  utils::types::MutexAppState,
};

#[tauri::command(async, rename_all = "snake_case")]
pub async fn load_mg(state: tauri::State<'_, MutexAppState>, path: String) -> Result<(), String> {
  let mut state = state.lock().await;
  state.load_mg(path).await.map_err(|e| e.to_string())?;
  Ok(())
}

#[tauri::command(async, rename_all = "snake_case")]
pub async fn save_mg(
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
