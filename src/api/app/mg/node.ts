import { IClient } from "@/api/client/type";
import { Id } from "@/api/types/id";
import { IMindNode } from "@/api/types/mg";

export async function load(client: IClient, params: { id: Id }): Promise<IMindNode> {
  return (await client.invoke("app/mg/node/load", params)) as IMindNode;
}

