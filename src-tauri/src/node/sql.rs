use crate::DBConn;
use ulid::Ulid;

pub async fn create_table(conn: &DBConn) -> Result<(), Box<dyn std::error::Error>> {
  // 创建节点表
  sqlx::raw_sql(
    r#"
    CREATE TABLE IF NOT EXISTS node (
      id CHAR(26) PRIMARY KEY,
      content JSON NOT NULL
    );
    "#,
  )
  .execute(conn)
  .await
  .unwrap();

  // 创建节点-节点归属表
  sqlx::raw_sql(
    r#"
    CREATE TABLE IF NOT EXISTS node_node_r (
      parent_id CHAR(26) NOT NULL,
      child_id CHAR(26) NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_node_node_r_parent_id ON node_node_r (parent_id);
    CREATE INDEX IF NOT EXISTS idx_node_node_r_child_id ON node_node_r (child_id);
    "#,
  )
  .execute(conn)
  .await
  .unwrap();

  Ok(())
}

// Start of Selection
pub async fn create_init_nodes(conn: &DBConn) -> Result<(), Box<dyn std::error::Error>> {
  // 创建初始节点
  let nodes = vec![
    ("主题", None),
    ("分支1", Some(0)),
    ("分支2", Some(0)),
    ("分支3", Some(0)),
    ("子分支1", Some(1)),
    ("子分支2", Some(1)),
  ];

  let mut node_ids: Vec<String> = Vec::new();

  for (_, (value, parent_index)) in nodes.iter().enumerate() {
    let id = Ulid::new().to_string();
    node_ids.push(id.clone());

    let content = serde_json::json!({
        "_type": "markdown",
        "value": value
    });

    sqlx::query("INSERT INTO node (id, content) VALUES (?, ?)")
      .bind(&id)
      .bind(content.to_string())
      .execute(conn)
      .await?;

    if let Some(parent_index) = parent_index {
      let parent_id = &node_ids[*parent_index];
      sqlx::query("INSERT INTO node_node_r (parent_id, child_id) VALUES (?, ?)")
        .bind(parent_id)
        .bind(&id)
        .execute(conn)
        .await?;
    }
  }

  Ok(())
}
