use serde_json::Value;
use sqlx::sqlite::SqlitePoolOptions;

use crate::mg::mg_state::MgState;
use crate::mg::node::entity::MindNode;
use crate::utils::{path::get_app_path, types::DBConn};
pub struct AppState {
  pub conn: DBConn,
  pub mg: Option<MgState>,
}

impl AppState {
  pub async fn new() -> Result<Self, Box<dyn std::error::Error>> {
    let app_path = get_app_path();
    let db_path = app_path.join("data/app.sqlite");

    let conn = SqlitePoolOptions::new()
      .max_connections(100)
      .connect(format!("sqlite://{}?mode=rwc", db_path.to_str().unwrap()).as_str())
      .await?;

    Ok(AppState { conn, mg: None })
  }

  pub async fn load_mg(&mut self, path: String) -> Result<(), Box<dyn std::error::Error>> {
    let mg_state = MgState::new(path).await?;
    self.mg = Some(mg_state);
    Ok(())
  }

  pub async fn save_mg(
    &mut self,
    modified_nodes: Vec<MindNode>,
    deleted_nodes: Vec<String>,
    new_nodes: Vec<MindNode>,
    meta: Value,
  ) -> Result<(), Box<dyn std::error::Error>> {
    self
      .mg
      .as_mut()
      .unwrap()
      .save(modified_nodes, deleted_nodes, new_nodes, meta)
      .await?;
    Ok(())
  }
}
