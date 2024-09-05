use crate::DBConn;

pub async fn create_table(conn: &DBConn) -> Result<(), Box<dyn std::error::Error>> {
  // 创建节点表
  sqlx::raw_sql(
    r#"
    CREATE TABLE IF NOT EXISTS node (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
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
      parent_id INTEGER NOT NULL,
      child_id INTEGER NOT NULL
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

pub async fn create_init_nodes(conn: &DBConn) -> Result<(), Box<dyn std::error::Error>> {
  // 创建节点表
  sqlx::raw_sql(
    r#"
    INSERT INTO node(content)
    VALUES 
      ('{"_type": "markdown", "value": "主题"}'),
      ('{"_type": "markdown", "value": "分支1"}'),
      ('{"_type": "markdown", "value": "分支2"}'),
      ('{"_type": "markdown", "value": "分支3"}'),
      ('{"_type": "markdown", "value": "子分支1"}'),
      ('{"_type": "markdown", "value": "子分支2"}');

    INSERT INTO node_node_r(parent_id, child_id) 
    VALUES 
      (1, 2),
      (1, 3),
      (1, 4),
      (2, 5),
      (2, 6);
    "#,
  )
  .execute(conn)
  .await
  .unwrap();

  Ok(())
}
