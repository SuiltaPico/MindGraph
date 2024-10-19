import { IClient } from "@/api/client/type";
import { Id } from "@/api/types/id";
import { IFullMindNode, IMindNode, IRelationMindNode } from "@/domain/MindNode";

export type CheckRelationResult = {
  /** 目标节点是否是源节点的后代节点 */
  target_is_desc_of_src: boolean;
};

export async function load(
  client: IClient,
  params: { id: Id }
): Promise<IFullMindNode> {
  return (await client.invoke("app/mg/node/load", params)) as IFullMindNode;
}

export async function load_relation(
  client: IClient,
  params: { id: Id }
): Promise<IRelationMindNode> {
  return (await client.invoke(
    "app/mg/node/load_relation",
    params
  )) as IRelationMindNode;
}
