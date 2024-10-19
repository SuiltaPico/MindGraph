use serde::{Deserialize, Serialize};

use crate::{mg::node::entity::MindNode, utils::types::MutexAppState};

// #[tauri::command(async, rename_all = "snake_case")]
// pub async fn get_top_nodes(
//   state: tauri::State<'_, MutexAppState>,
//   deep: i32,
// ) -> Result<Vec<MindNode>, String> {
//   // 执行查询以获取没有父节点的节点
//   let nodes_without_parents: Vec<MindNode> = sqlx::query_as(
//     format!(
//       r#"
//     WITH RECURSIVE TreePaths AS (
//       -- Step 1: 从没有父节点的节点开始
//       SELECT
//         n.id AS root_id,
//         n.id AS node_id,
//         0 AS depth
//       FROM
//         node n
//       LEFT JOIN
//         node_node_r nnr ON n.id = nnr.child_id
//       WHERE
//         nnr.parent_id IS NULL

//       UNION ALL

//       -- Step 2: 递归查找子节点并增加深度
//       SELECT
//         tp.root_id,
//         nnr.child_id AS node_id,
//         tp.depth + 1 AS depth
//       FROM
//         TreePaths tp
//       JOIN
//         node_node_r nnr ON tp.node_id = nnr.parent_id
//       WHERE
//         tp.depth < {}
//     )

//     -- Step 3: 选择深度为 `deep` 的节点
//     SELECT
//       *,
// 	    (SELECT json_group_array(parent_id)
//       FROM node_node_r nnr
//       WHERE nnr.child_id = tp.node_id) AS parents,
//       (SELECT json_group_array(child_id)
//       FROM node_node_r nnr
//       WHERE nnr.parent_id = tp.node_id) AS children
//     FROM
//       TreePaths tp
//     JOIN
//       node n ON tp.node_id = n.id
//     WHERE
//       depth < {};
//     "#,
//       deep, deep,
//     )
//     .as_str(),
//   )
//   .fetch_all(&state.lock().await.conn)
//   .await
//   .map_err(|e| e.to_string())?;

//   Ok(nodes_without_parents)
// }

// #[tauri::command(async, rename_all = "snake_case")]
// pub async fn get_first_root_node(
//   state: tauri::State<'_, MutexAppState>,
// ) -> Result<MindNode, String> {
//   let root_node: MindNode = sqlx::query_as(
//     r#"
//     SELECT
//       n.*,
//       (SELECT json_group_array(parent_id)
//        FROM node_node_r nnr
//        WHERE nnr.child_id = n.id) AS parents,
//       (SELECT json_group_array(child_id)
//        FROM node_node_r nnr
//        WHERE nnr.parent_id = n.id) AS children
//     FROM node n
//     LEFT JOIN node_node_r nnr ON n.id = nnr.child_id
//     WHERE nnr.parent_id IS NULL
//     LIMIT 1;
//     "#,
//   )
//   .fetch_one(&state.lock().await.mg.as_ref().unwrap().conn)
//   .await
//   .map_err(|e| e.to_string())?;

//   Ok(root_node)
// }

#[tauri::command(async, rename_all = "snake_case")]
pub async fn node_load(
  state: tauri::State<'_, MutexAppState>,
  id: String,
) -> Result<MindNode, String> {
  let node: MindNode = sqlx::query_as(
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
    WHERE n.id = ?;
    "#,
  )
  .bind(id)
  .fetch_one(&state.lock().await.mg.as_ref().unwrap().conn)
  .await
  .map_err(|e| e.to_string())?;

  Ok(node)
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CheckRelationResult {
  target_is_desc_of_src: bool,
}

#[tauri::command(async, rename_all = "snake_case")]
pub async fn node_check_relation(
  state: tauri::State<'_, MutexAppState>,
  src: String,
  target: String,
) -> Result<CheckRelationResult, String> {
  let state = state.lock().await;
  let conn = &state.mg.as_ref().unwrap().conn;
  // TODO：这个查询会列出所有的祖先节点，因为 Sqlite 的限制，并不会提前结束，需要更多优化
  let is_descendants = sqlx::query_scalar::<_, bool>(
    r#"
    WITH RECURSIVE ancestors(id) AS (
      -- 查询起始点，即目标节点
      SELECT ?
      -- 将初始节点与递归查询的结果合并
      UNION ALL
      -- 从表 node_node_r 中选择：在 r.child_id 是当前祖先节点的 ID 的情况下，其所有父节点 ID
      SELECT r.parent_id
      FROM node_node_r r
      JOIN ancestors a ON r.child_id = a.id
    )
    -- 查询所有的祖先节点，并判断源节点是否在这些祖先节点中
    SELECT EXISTS (
      SELECT 1 FROM ancestors WHERE id = ?
    );
    "#,
  )
  .bind(&target)
  .bind(&src)
  .fetch_one(conn)
  .await
  .map_err(|e| e.to_string())?;

  Ok(CheckRelationResult {
    target_is_desc_of_src: is_descendants,
  })
}
