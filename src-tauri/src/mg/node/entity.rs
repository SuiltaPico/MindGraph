use serde::{Deserialize, Serialize};
use serde_json::Value;
use sqlx::types::Json;

#[derive(Debug, Default, PartialEq, Eq, Serialize, Deserialize, sqlx::FromRow)]
pub struct MindNode {
  id: String,
  content: Json<Value>,
  parents: Json<Vec<String>>,
  children: Json<Vec<String>>,
}
