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
pub async fn node_load(state: tauri::State<'_, MutexAppState>, id: String) -> Result<MindNode, String> {
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
