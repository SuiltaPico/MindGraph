export interface IMindNode {
  id: string;
  content: {
    _type: string;
    value: string;
  };
  parents: string[];
  children: string[];
}