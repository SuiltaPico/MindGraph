import { Area } from "./MixEditor";

export class AreaContext {
  area: Area;
  parent: AreaContext;
  parent_index: number;

  constructor(area: Area, parent: AreaContext, parent_index: number) {
    this.area = area;
    this.parent = parent;
    this.parent_index = parent_index;
  }

  get_path() {
    const path: number[] = [];
    let current: AreaContext | undefined = this;
    while (current) {
      path.push(current.parent_index);
      current = current.parent;
    }
    return path.reverse();
  }
}
