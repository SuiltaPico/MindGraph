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
  created_at: string;
  updated_at: string;
}

export interface IRelationMindNode {
  id: Id;
  __data_type: "relation";
  parents: string[];
  children: string[];
}

export type IMindNode = IFullMindNode | IRelationMindNode;

export function create_IFullMindNode(
  params: Omit<IFullMindNode, "__data_type" | "created_at" | "updated_at">
) {
  return {
    __data_type: "full" as const,
    created_at: Date.now().toString(),
    updated_at: Date.now().toString(),
    ...params,
  };
}