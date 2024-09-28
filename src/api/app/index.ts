import { IClient } from "../client/type";
import { Id } from "../types/id";
import { IMeta, IMindNode } from "../types/mg";

async function load_mg(client: IClient, path: string) {
  return await client.invoke("app/load_mg", { path });
}

async function save_mg(
  client: IClient,
  modified_nodes: IMindNode[],
  deleted_nodes: Id[],
  added_nodes: IMindNode[],
  meta: IMeta
) {
  return await client.invoke("app/save_mg", {
    modified_nodes,
    deleted_nodes,
    added_nodes,
    meta,
  });
}

export { load_mg, save_mg };
