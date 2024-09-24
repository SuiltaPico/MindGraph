use serde::{Deserialize, Serialize};
use serde_json::Value;
use sqlx::{sqlite::SqliteRow, types::Json, FromRow, Row};

// #[derive(Debug, Default, PartialEq, Eq, Serialize, Deserialize)]
// pub struct Node {
//   id: i32,
//   content: String,
// }

// impl FromRow<'_, SqliteRow> for Node {
//   fn from_row(row: &SqliteRow) -> Result<Self, sqlx::Error> {
//     Ok(Node {
//       id: row.try_get("id")?,
//       content: row.try_get("content")?,
//     })
//   }
// }

// #[derive(Debug, Default, PartialEq, Eq, Serialize, Deserialize, sqlx::FromRow)]
// pub struct NodeContent {
//   _type: String,
//   value: String,
// }

#[derive(Debug, Default, PartialEq, Eq, Serialize, Deserialize, sqlx::FromRow)]
pub struct Node {
  id: String,
  content: Json<Value>,
  parents: Json<Vec<String>>,
  children: Json<Vec<String>>,
}

// impl FromRow<'_, SqliteRow> for NodeWithRoot {
//   fn from_row(row: &SqliteRow) -> Result<Self, sqlx::Error> {
//     Ok(NodeWithRoot {
//       id: row.try_get("id")?,
//       content: row.try_get("content")?,
//       root_id: row.try_get("root_id")?,
//       parents: row.try_get("parents")?,
//       children: row.try_get("children")?,
//     })
//   }
// }
