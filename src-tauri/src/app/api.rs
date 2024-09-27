use crate::utils::types::MutexAppState;

#[tauri::command(async)]
pub async fn load_mg(
  path: String,
  state: tauri::State<'_, MutexAppState>,
) -> Result<(), String> {
  let mut state = state.lock().await;
  state.load_mg(path).await.map_err(|e| e.to_string())?;
  Ok(())
}
