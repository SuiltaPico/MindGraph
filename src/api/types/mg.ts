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
