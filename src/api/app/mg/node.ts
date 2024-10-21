import { IClient } from "@/api/client/type";
import { Id } from "@/api/types/id";
import { IFullMindNode } from "@/domain/MindNode";

export async function load(
  client: IClient,
  params: { id: Id }
): Promise<IFullMindNode> {
  return (await client.invoke("app/mg/node/load", params)) as IFullMindNode;
}