export interface IMindNode {
  id: number;
  content: {
    _type: string;
    value: string;
  };
  root_id: number;
  parents: number[];
  children: number[];
}