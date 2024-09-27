import { invoke } from "@tauri-apps/api/core";
import { IMindNode } from "./types/node";
import { Id } from "./types/id";

export async function save_kb(params: {
  modified_nodes: IMindNode[];
  deleted_nodes: Id[];
  added_nodes: IMindNode[];
}): Promise<void> {
  await invoke("save_kb", params);
}
