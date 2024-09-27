use crate::mg::node::api::{
  __cmd__get_first_root_node as __cmd__mg__node__get_first_root_node,
  __cmd__load_node as __cmd__mg__node__load_node, get_first_root_node as mg__node__get_first_root_node,
  load_node as mg__node__load_node,
};
use app::{
  api::{__cmd__load_mg as __cmd__app__load_mg, load_mg as app__load_mg},
  app_state::AppState,
};
use tokio::sync::Mutex;

mod app;
mod mg;
mod utils;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub async fn run() -> Result<(), Box<dyn std::error::Error>> {
  let state = AppState::new().await?;

  tauri::Builder::default()
    .manage(Mutex::new(state))
    .invoke_handler(tauri::generate_handler![
      app__load_mg,
      mg__node__load_node,
      mg__node__get_first_root_node,
    ])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");

  Ok(())
}
