import { IMindNode } from "@/api/types/node";
import { IClient } from "../client/type";
import { Id } from "../types/id";

async function load_node(client: IClient, id: Id): Promise<IMindNode> {
  return (await client.invoke("mg/node/load_node", { id })) as IMindNode;
}

async function get_first_root_node(client: IClient): Promise<Id> {
  const rootNode = (await client.invoke(
    "mg/node/get_first_root_node"
  )) as IMindNode;
  return rootNode.id;
}

export { get_first_root_node, load_node };
