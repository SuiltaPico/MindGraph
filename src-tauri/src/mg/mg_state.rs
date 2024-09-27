use crate::utils::{path::get_app_path, types::DBConn};
use sqlx::{sqlite::*, Pool, Sqlite};
use std::path::PathBuf;

use super::{meta::init::meta_init, node::init::node_init};

pub struct MgState {
  pub conn: DBConn,
  pub path: String,
}

impl MgState {
  pub async fn new(path: String) -> Result<Self, Box<dyn std::error::Error>> {
    let db_path = if path == String::from("mindgraph://new") {
      get_app_path().join("data/temp/new.mg")
    } else {
      PathBuf::from(path.clone())
    };


    let conn = SqlitePoolOptions::new()
      .max_connections(100)
      .connect(format!("sqlite://{}?mode=rwc", db_path.to_str().unwrap()).as_str())
      .await?;

    // 检查数据库表是否存在,如果不存在则初始化
    let has_node_table =
      sqlx::query("SELECT name FROM sqlite_master WHERE type='table' AND name='node';")
        .fetch_optional(&conn)
        .await?;

    println!("has_node_table: {:?}", has_node_table.is_none());

    if has_node_table.is_none() {
      // 这里调用 node_init 和 meta_init 函数
      node_init(&conn).await?;
      meta_init(&conn).await?;
    };

    Ok(MgState { conn, path })
  }

  pub async fn close(&self) -> Result<(), Box<dyn std::error::Error>> {
    self.conn.close().await;
    Ok(())
  }

  pub fn get_conn(&self) -> &Pool<Sqlite> {
    &self.conn
  }

  pub fn get_path(&self) -> &String {
    &self.path
  }
}
