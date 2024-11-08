import { Area } from "./Area";

export class AreaContext {
  constructor(
    public area: Area,
    public parent: AreaContext | undefined,
    public parent_index: number
  ) {}

  get_path() {
    const path: number[] = [];
    let current: AreaContext | undefined = this;
    while (current?.parent) {
      path.push(current.parent_index);
      current = current.parent;
    }
    return path.reverse();
  }
}
