use super::{
  meta::init::meta_init,
  node::{entity::MindNode, init::node_init},
};
use crate::utils::{path::get_app_path, types::DBConn};
use log::LevelFilter;
use serde::{Deserialize, Serialize};
use serde_json::Value;
use sqlx::{sqlite::*, ConnectOptions, Row};
use std::{
  collections::{HashMap, HashSet},
  time::Duration,
};

#[derive(Debug, Serialize, Deserialize)]
pub struct MgInitData {
  pub root_node_id: String,
  pub meta: Value,
}

pub struct MgState {
  pub conn: DBConn,
  pub uri: String,
}

impl MgState {
  pub async fn new(uri: String) -> Result<Self, Box<dyn std::error::Error>> {
    Ok(MgState::open_new_mg_state(uri).await?)
  }

  pub fn parse_uri(uri: String) -> Result<String, Box<dyn std::error::Error>> {
    if uri.starts_with("file://") {
      Ok(uri.replace("file://", ""))
    } else if uri.starts_with("mindgraph://") {
      match uri.as_str() {
        "mindgraph://new" => Ok(
          get_app_path()
            .join("data/temp/new.mg")
            .to_str()
            .unwrap()
            .to_string(),
        ),
        _ => Err(Box::new(std::io::Error::new(
          std::io::ErrorKind::InvalidInput,
          format!("Invalid uri: {}", uri),
        ))),
      }
    } else {
      Err(Box::new(std::io::Error::new(
        std::io::ErrorKind::InvalidInput,
        format!("Invalid uri: {}", uri),
      )))
    }
  }

  pub async fn open_new_mg_state(uri: String) -> Result<Self, Box<dyn std::error::Error>> {
    let path = Self::parse_uri(uri.clone())?;

    let options = format!("sqlite://{}?mode=rwc", path)
      .as_str()
      .parse::<SqliteConnectOptions>()?
      .log_statements(LevelFilter::Trace)
      .log_slow_statements(LevelFilter::Trace, Duration::from_millis(100));
    let conn = SqlitePoolOptions::new()
      .max_connections(100)
      .connect_with(options)
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

    Ok(MgState { conn, uri })
  }

  pub async fn close(&self) -> Result<(), Box<dyn std::error::Error>> {
    self.conn.close().await;
    Ok(())
  }

  pub async fn get_meta(&self) -> Result<Value, String> {
    let rows = sqlx::query("SELECT key, cast(value as text) as value FROM meta")
      .fetch_all(&self.conn)
      .await
      .map_err(|e| e.to_string())?;

    let mut map = serde_json::Map::new();
    for row in rows.into_iter() {
      let key: String = row.get("key");
      let value = row.get::<sqlx::types::JsonValue, _>("value");
      let json_value: serde_json::Value =
        serde_json::from_value(value).map_err(|e| e.to_string())?;
      map.insert(key, json_value);
    }
    Ok(map.into())
  }

  pub async fn get_first_root_node(&self) -> Result<MindNode, String> {
    let root_node: MindNode = sqlx::query_as(
      r#"
    SELECT
      n.*,
      (SELECT json_group_array(parent_id)
       FROM node_node_r nnr
       WHERE nnr.child_id = n.id) AS parents,
      (SELECT json_group_array(child_id)
       FROM node_node_r nnr
       WHERE nnr.parent_id = n.id) AS children
    FROM node n
    LEFT JOIN node_node_r nnr ON n.id = nnr.child_id
    WHERE nnr.parent_id IS NULL
    LIMIT 1;  
    "#,
    )
    .fetch_one(&self.conn)
    .await
    .map_err(|e| e.to_string())?;

    Ok(root_node)
  }

  pub async fn get_init_data(&self) -> Result<MgInitData, String> {
    let root_node = self.get_first_root_node().await?;
    let meta = self.get_meta().await?;
    Ok(MgInitData {
      root_node_id: root_node.id,
      meta,
    })
  }

  pub async fn load_existing_relationships(
    &self,
    node_ids: Vec<String>,
  ) -> Result<HashMap<String, HashSet<String>>, Box<dyn std::error::Error>> {
    // 创建一个空的 HashMap 来存储结果
    let mut relationships: HashMap<String, HashSet<String>> = HashMap::new();

    // 如果 node_ids 为空，直接返回空的 HashMap
    if node_ids.is_empty() {
      return Ok(relationships);
    }

    // 生成查询的 SQL 字符串
    let params = format!("?{}", ", ?".repeat(node_ids.len() - 1));
    let query = format!(
      "SELECT parent_id, child_id FROM node_node_r WHERE parent_id IN ({0})",
      params
    );

    // 执行查询
    let mut query_builder = sqlx::query(&query);
    for id in &node_ids {
      query_builder = query_builder.bind(id);
    }

    let rows = query_builder.fetch_all(&self.conn).await?;

    // 填充 HashMap
    for row in rows {
      let parent_id: String = row.try_get("parent_id").unwrap();
      let child_id: String = row.try_get("child_id").unwrap();

      relationships
        .entry(parent_id.clone())
        .or_insert_with(HashSet::new)
        .insert(child_id.clone());
    }

    Ok(relationships)
  }

  pub async fn open_uri(&mut self, uri: String) -> Result<(), Box<dyn std::error::Error>> {
    let new_state = Self::open_new_mg_state(uri).await?;
    self.conn = new_state.conn;
    self.uri = new_state.uri;

    Ok(())
  }

  pub async fn save(
    &self,
    modified_nodes: Vec<MindNode>,
    deleted_nodes: Vec<String>,
    new_nodes: Vec<MindNode>,
    meta: Value,
  ) -> Result<(), Box<dyn std::error::Error>> {
    let mut tx = self.conn.begin().await?;

    if !modified_nodes.is_empty() {
      // 更新已经修改的节点的内容
      let mut query = String::from("UPDATE node SET content = CASE id ");
      let mut params: Vec<String> = Vec::new();

      for node in &modified_nodes {
        query.push_str("WHEN ? THEN ? ");
        params.push(node.id.clone());
        params.push(serde_json::to_string(&node.content)?);
      }

      query.push_str("END WHERE id IN (");
      query.push_str(&vec!["?"; modified_nodes.len()].join(", "));
      query.push(')');

      let mut query_builder = sqlx::query(&query);
      for param in params {
        query_builder = query_builder.bind(param);
      }
      for node in &modified_nodes {
        query_builder = query_builder.bind(&node.id);
      }

      query_builder.execute(&mut *tx).await?;

      // 更新节点关系
      let node_ids = modified_nodes.iter().map(|node| node.id.clone()).collect();
      let mut existing_relationships = self.load_existing_relationships(node_ids).await?;

      let mut to_insert: Vec<(String, String)> = Vec::new();
      let mut to_delete: Vec<(String, String)> = Vec::new();

      for node in &modified_nodes {
        let current_children: HashSet<String> = node.children.0.iter().cloned().collect();
        let existing_children = existing_relationships
          .entry(node.id.clone())
          .or_insert_with(HashSet::new);

        // 找到需要插入的 child
        for child in &current_children {
          if !existing_children.contains(child) {
            to_insert.push((node.id.clone(), child.clone()));
          }
        }

        // 找到需要删除的 child
        for child in existing_children.iter() {
          if !current_children.contains(child) {
            to_delete.push((node.id.clone(), child.clone()));
          }
        }
      }

      // 构建批量插入的 SQL 语句
      if !to_insert.is_empty() {
        let mut insert_query =
          String::from("INSERT INTO node_node_r (parent_id, child_id) VALUES ");
        let mut insert_params: Vec<&String> = Vec::new();

        for (i, (parent, child)) in to_insert.iter().enumerate() {
          if i > 0 {
            insert_query.push_str(", ");
          }
          insert_query.push_str("(?, ?)");
          insert_params.push(parent);
          insert_params.push(child);
        }

        let mut query_builder: sqlx::query::Query<'_, Sqlite, SqliteArguments<'_>> =
          sqlx::query(&insert_query);
        for param in insert_params {
          query_builder = query_builder.bind(param);
        }
        query_builder.execute(&mut *tx).await?;
      }

      // 构建批量删除的 SQL 语句
      if !to_delete.is_empty() {
        let mut delete_query = String::from("DELETE FROM node_node_r WHERE ");
        let mut delete_params: Vec<&String> = Vec::new();

        for (i, (parent, child)) in to_delete.iter().enumerate() {
          if i > 0 {
            delete_query.push_str(" OR ");
          }
          delete_query.push_str("(parent_id = ? AND child_id = ?)");
          delete_params.push(parent);
          delete_params.push(child);
        }

        let mut query_builder = sqlx::query(&delete_query);
        for param in delete_params {
          query_builder = query_builder.bind(param);
        }
        query_builder.execute(&mut *tx).await?;
      }
    }

    // 批量删除节点
    if !deleted_nodes.is_empty() {
      let delete_node_query = format!(
        "DELETE FROM node WHERE id IN ({})",
        deleted_nodes
          .iter()
          .map(|_| "?")
          .collect::<Vec<_>>()
          .join(", ")
      );
      let mut query_builder = sqlx::query(&delete_node_query);
      for node_id in &deleted_nodes {
        query_builder = query_builder.bind(node_id);
      }
      query_builder.execute(&mut *tx).await?;

      let delete_node_node_r_query = format!(
        "DELETE FROM node_node_r WHERE parent_id IN ({0}) OR child_id IN ({0})",
        deleted_nodes
          .iter()
          .map(|_| "?")
          .collect::<Vec<_>>()
          .join(", ")
      );
      let mut query_builder = sqlx::query(&delete_node_node_r_query);
      for node_id in &deleted_nodes {
        query_builder = query_builder.bind(node_id);
      }
      query_builder.execute(&mut *tx).await?;
    }

    // 插入新节点
    if !new_nodes.is_empty() {
      let mut insert_query = String::from("INSERT INTO node (id, content) VALUES ");
      let mut insert_params: Vec<String> = Vec::new();

      for (i, node) in new_nodes.iter().enumerate() {
        if i > 0 {
          insert_query.push_str(", ");
        }

        insert_query.push_str("(?, ?)");

        insert_params.push(node.id.clone());
        insert_params.push(serde_json::to_string(&node.content)?);
      }

      let mut query_builder = sqlx::query(&insert_query);

      for param in insert_params {
        query_builder = query_builder.bind(param);
      }

      query_builder.execute(&mut *tx).await?;
    }

    // 更新元数据
    let delete_meta_query = "DELETE FROM meta";
    sqlx::query(delete_meta_query).execute(&mut *tx).await?;

    let insert_meta_query = "INSERT INTO meta (key, value) VALUES (?, ?)";
    let meta_map = meta.as_object().unwrap();

    for (key, value) in meta_map {
      let value_str = serde_json::to_string(value)?;
      let query_builder = sqlx::query(insert_meta_query).bind(key).bind(value_str);
      query_builder.execute(&mut *tx).await?;
    }

    // 提交事务
    tx.commit().await?;

    Ok(())
  }

  pub async fn move_to(&mut self, uri: String) -> Result<(), Box<dyn std::error::Error>> {
    let self_path = Self::parse_uri(self.uri.clone())?;
    let new_path = Self::parse_uri(uri.clone())?;

    self.close().await?;

    tokio::fs::rename(self_path.clone(), new_path.clone()).await?;

    self.open_uri(format!("file://{}", new_path.clone())).await?;

    Ok(())
  }
}
