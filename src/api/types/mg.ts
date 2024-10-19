import { Id } from "./id";

export interface IMeta {
  name: string;
}

export interface IInitData {
  root_node_id: Id;
  meta: IMeta;
}

