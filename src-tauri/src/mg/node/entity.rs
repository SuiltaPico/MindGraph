use serde::{Deserialize, Serialize};
use serde_json::Value;
use sqlx::types::Json;

#[derive(Debug, Default, PartialEq, Eq, Serialize, Deserialize, sqlx::FromRow)]
pub struct MindNode {
  pub id: String,
  pub content: Json<Value>,
  pub created_at: String,
  pub updated_at: String,
  pub parents: Json<Vec<String>>,
  pub children: Json<Vec<String>>,
}
