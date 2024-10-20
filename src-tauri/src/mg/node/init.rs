use crate::utils::types::DBConn;
use chrono::Utc;
use ulid::Generator;

pub async fn node_init(conn: &DBConn) -> Result<(), Box<dyn std::error::Error>> {
  println!("node_init");
  create_table(conn).await?;
  create_init_data(conn).await?;
  println!("node_init end");
  Ok(())
}

pub async fn create_table(conn: &DBConn) -> Result<(), Box<dyn std::error::Error>> {
  println!("create_table");
  // 创建节点表
  sqlx::raw_sql(
    r#"
    CREATE TABLE IF NOT EXISTS node (
      id CHAR(26) PRIMARY KEY,
      content JSONB NOT NULL,
      created_at DATETIME NOT NULL,
      updated_at DATETIME NOT NULL
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
      child_id CHAR(26) NOT NULL,
      PRIMARY KEY (parent_id, child_id)
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

pub async fn create_init_data(conn: &DBConn) -> Result<(), Box<dyn std::error::Error>> {
  println!("create_init_data");
  // 创建初始节点
  let nodes = vec![
    ("主题", None, Utc::now().to_string(), Utc::now().to_string()),
    (
      "分支1",
      Some(0),
      Utc::now().to_string(),
      Utc::now().to_string(),
    ),
    (
      "分支2",
      Some(0),
      Utc::now().to_string(),
      Utc::now().to_string(),
    ),
    (
      "分支3",
      Some(0),
      Utc::now().to_string(),
      Utc::now().to_string(),
    ),
    (
      "子分支1",
      Some(1),
      Utc::now().to_string(),
      Utc::now().to_string(),
    ),
    (
      "子分支2",
      Some(1),
      Utc::now().to_string(),
      Utc::now().to_string(),
    ),
  ];

  let mut node_ids: Vec<String> = Vec::new();
  let mut ulid_gen = Generator::new();

  for (_, (value, parent_index, created_at, updated_at)) in nodes.iter().enumerate() {
    let id = ulid_gen.generate().unwrap().to_string();
    node_ids.push(id.clone());

    let content = serde_json::json!({
        "_type": "markdown",
        "value": value
    });

    sqlx::query("INSERT INTO node (id, content, created_at, updated_at) VALUES (?, ?, ?, ?)")
      .bind(&id)
      .bind(content.to_string())
      .bind(created_at)
      .bind(updated_at)
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
