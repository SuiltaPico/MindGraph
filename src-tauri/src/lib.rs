use app::{
  api::mg::{
    index::{
      __cmd__get_init_data as __cmd__app__mg__get_init_data, __cmd__load as __cmd__app__mg__load,
      __cmd__new as __cmd__app__mg__new, __cmd__save as __cmd__app__mg__save,
      __cmd__save_as as __cmd__app__mg__save_as, get_init_data as app__mg__get_init_data,
      load as app__mg__load, new as app__mg__new, save as app__mg__save,
      save_as as app__mg__save_as,
    },
    node::{
      __cmd__node_load as __cmd__app__mg__node__load,
      node_load as app__mg__node__load,
    },
  },
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
    .plugin(tauri_plugin_dialog::init())
    .plugin(tauri_plugin_process::init())
    .manage(Mutex::new(state))
    .invoke_handler(tauri::generate_handler![
      app__mg__new,
      app__mg__load,
      app__mg__save,
      app__mg__save_as,
      app__mg__get_init_data,
      app__mg__node__load,
    ])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");

  Ok(())
}
