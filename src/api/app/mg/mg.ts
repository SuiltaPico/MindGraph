import { IClient } from "../../client/type";
import { Id } from "../../types/id";
import { IInitData, IMeta, IMindNode } from "../../types/mg";
export * as node from "./node";

export async function new_mg(client: IClient) {
  return await client.invoke("app/mg/new");
}

export async function load(client: IClient, uri: string) {
  return await client.invoke("app/mg/load", { uri });
}

export async function save(
  client: IClient,
  param: {
    modified_nodes: IMindNode[];
    deleted_nodes: Id[];
    added_nodes: IMindNode[];
    meta: IMeta;
  }
) {
  return await client.invoke("app/mg/save", param);
}

export async function save_as(
  client: IClient,
  param: {
    uri: string;
    modified_nodes: IMindNode[];
    deleted_nodes: Id[];
    added_nodes: IMindNode[];
    meta: IMeta;
  }
) {
  return await client.invoke("app/mg/save_as", param);
}

export async function get_init_data(client: IClient): Promise<IInitData> {
  const init_data = await client.invoke("app/mg/get_init_data");
  return init_data;
}
