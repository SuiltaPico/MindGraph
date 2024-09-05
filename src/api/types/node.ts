export interface NodeWithRoot {
  id: number;
  content: {
    _type: string;
    value: string;
  };
  root_id: number;
  parents: number[];
  children: number[];
}
