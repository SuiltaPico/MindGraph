import { IMindNode } from "@/api/types/mg";
import { createEmitterSignal } from "@/common/signal";
import { set_node_prop } from "../CanvasState";
import { NodeContext } from "./NodeContext";
import { RendererContext } from "./RendererContext";

/** 节点渲染器的辅助工具类，为节点渲染提供一些快捷函数和上下文绑定。 */

export class MindNodeHelper {
  id: string;

  get_prop<T extends keyof IMindNode>(key: T) {
    let emitter = this.nc.path_emitter_map.get(key);
    if (emitter === undefined) {
      emitter = createEmitterSignal();
      this.nc.path_emitter_map.set(key, emitter);
    }
    emitter.use();
    return this.node[key];
  }

  set_prop(key: keyof IMindNode, value: any) {
    set_node_prop(this.node, this.nc, key, value);
  }

  constructor(
    public node: IMindNode,
    public nc: NodeContext,
    public rc: RendererContext
  ) {
    this.id = node.id;
  }
}
