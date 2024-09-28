use serde::{Deserialize, Serialize};
use serde_json::Value;
use sqlx::types::Json;

#[derive(Debug, Default, PartialEq, Eq, Serialize, Deserialize, sqlx::FromRow)]
pub struct Meta {
  pub key: String,
  pub value: Json<Value>,
}
