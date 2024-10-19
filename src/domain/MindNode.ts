import { Id } from "@/api/types/id";


export interface IFullMindNode {
  id: Id;
  __data_type: "full";
  content: {
    _type: string;
    value: string;
  };
  parents: string[];
  children: string[];
}

export interface IRelationMindNode {
  id: Id;
  __data_type: "relation";
  parents: string[];
  children: string[];
}

export type IMindNode = IFullMindNode | IRelationMindNode;

export function create_IFullMindNode(params: Omit<IFullMindNode, "__data_type">) {
  return {
    __data_type: "full" as const,
    ...params,
  };
}
