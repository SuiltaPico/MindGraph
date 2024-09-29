use crate::utils::types::DBConn;

pub async fn meta_init(conn: &DBConn) -> Result<(), Box<dyn std::error::Error>> {
  create_table(conn).await?;
  create_init_data(conn).await?;
  Ok(())
}

pub async fn create_table(conn: &DBConn) -> Result<(), Box<dyn std::error::Error>> {
  sqlx::raw_sql(
    r#"
    CREATE TABLE IF NOT EXISTS meta (
      key VARCHAR(1023) PRIMARY KEY NOT NULL,
      value JSON NOT NULL
    );
    "#,
  )
  .execute(conn)
  .await
  .unwrap();

  Ok(())
}

pub async fn create_init_data(conn: &DBConn) -> Result<(), Box<dyn std::error::Error>> {
  // 创建初始元信息
  let metas = vec![
    ("name", r#""知识库""#),
    ("schema_version", r#"0"#),
  ];

  for (key, value) in metas.iter() {
    sqlx::query("INSERT INTO meta (key, value) VALUES (?, ?)")
      .bind(key)
      .bind(value)
      .execute(conn)
      .await?;
  }

  Ok(())
}
