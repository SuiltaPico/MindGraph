import { Id } from "@/api/types/id";
import { OutputBlockData, OutputData } from "@editorjs/editorjs";

export type MarkdownContent = {
  _type: "markdown";
  value: string;
};

export type EditorJSContent = {
  _type: "editorjs";
  value: OutputData & {
    blocks: OutputBlockData<"paragraph", { text: string }>[];
  };
};

export interface IFullMindNode {
  id: Id;
  __data_type: "full";
  content: MarkdownContent | EditorJSContent;

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
