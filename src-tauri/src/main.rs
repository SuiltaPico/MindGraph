// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

pub mod node;

use dirs::data_dir;
use node::{
  entity::{Node, NodeWithRoot},
  sql::{create_init_nodes, create_table},
};
use sqlx::{query, query_as, sqlite::*, Database, Pool};
use std::fs;
use tauri::{CustomMenuItem, Menu, Submenu};

pub type DBConn = Pool<Sqlite>;
pub struct AppState {
  conn: DBConn,
}

async fn init() -> Result<AppState, Box<dyn std::error::Error>> {
  let mut app_path =
    data_dir().expect("[错误] 无法找到 data_dir，该应用可能暂不支持您的操作系统。");
  app_path.push("MindGraph");

  let mut save_path = app_path.clone();
  save_path.push("data/temp/temp.mg");

  let dir_path = save_path.parent().unwrap();

  if !fs::metadata(dir_path).is_ok() {
    fs::create_dir_all(dir_path)?;
  }

  let conn = SqlitePoolOptions::new()
    .max_connections(100)
    .connect(format!("sqlite://{}?mode=rwc", save_path.to_str().unwrap()).as_str())
    .await?;

  let has_node_table =
    sqlx::query("SELECT name FROM sqlite_master WHERE type='table' AND name='node';")
      .fetch_optional(&conn)
      .await?;

  if has_node_table.is_none() {
    create_table(&conn).await?;
    create_init_nodes(&conn).await?;
  }

  Ok(AppState { conn })
}

#[tauri::command]
async fn get_top_nodes(
  state: tauri::State<'_, AppState>,
  deep: i32,
) -> Result<Vec<NodeWithRoot>, ()> {
  // 执行查询以获取没有父节点的节点
  let nodes_without_parents: Vec<NodeWithRoot> = sqlx::query_as(
    format!(
      r#"
    WITH RECURSIVE TreePaths AS (
      -- Step 1: 从没有父节点的节点开始
      SELECT
        n.id AS root_id,
        n.id AS node_id,
        0 AS depth
      FROM
        node n
      LEFT JOIN
        node_node_r nnr ON n.id = nnr.child_id
      WHERE
        nnr.parent_id IS NULL

      UNION ALL

      -- Step 2: 递归查找子节点并增加深度
      SELECT
        tp.root_id,
        nnr.child_id AS node_id,
        tp.depth + 1 AS depth
      FROM
        TreePaths tp
      JOIN
        node_node_r nnr ON tp.node_id = nnr.parent_id
      WHERE
        tp.depth < {}
    )

    -- Step 3: 选择深度为 `deep` 的节点
    SELECT
      *,
      
	    (SELECT json_group_array(parent_id)
      FROM node_node_r nnr
      WHERE nnr.child_id = tp.node_id) AS parents,
      (SELECT json_group_array(child_id)
      FROM node_node_r nnr
      WHERE nnr.parent_id = tp.node_id) AS children
    FROM
      TreePaths tp
    JOIN
      node n ON tp.node_id = n.id
    WHERE
      depth < {};
    "#,
      deep, deep,
    )
    .as_str(),
  )
  .fetch_all(&state.conn)
  .await
  .expect("get_top_nodes error");

  Ok(nodes_without_parents)
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
  let state = init().await?;

  let file_menu = Submenu::new(
    "文件",
    Menu::new()
      .add_item(CustomMenuItem::new("new".to_string(), "新建").accelerator("Ctrl+N"))
      .add_item(CustomMenuItem::new("open".to_string(), "打开").accelerator("Ctrl+O"))
      .add_item(CustomMenuItem::new("save".to_string(), "保存").accelerator("Ctrl+S")),
  );
  let menu = Menu::new().add_submenu(file_menu);

  tauri::Builder::default()
    .manage(state)
    .invoke_handler(tauri::generate_handler![get_top_nodes])
    .menu(menu)
    .run(tauri::generate_context!())
    .expect("error while running tauri application");

  Ok(())
}
