import { Id } from "./id";

export interface IMindNode {
  id: Id;
  content: {
    _type: string;
    value: string;
  };
  parents: string[];
  children: string[];
}

export interface IMeta {
  name: string;
}

export interface IInitData {
  root_node_id: Id;
  meta: IMeta;
}

