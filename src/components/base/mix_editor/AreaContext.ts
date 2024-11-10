import { Area } from "./Area";
import { MaybeArea, NotArea } from "./MixEditor";

/** 区域上下文。用于运行时获取区域的父节点等信息。 */
export class AreaContext {
  constructor(
    public area: Area,
    public parent: MaybeArea = NotArea
  ) {}
}
