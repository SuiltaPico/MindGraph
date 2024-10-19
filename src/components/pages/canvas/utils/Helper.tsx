import { IFullMindNode, IMindNode } from "@/domain/MindNode";
import { createEmitterSignal } from "@/common/signal";
import { set_node_prop } from "../Canvas";
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

  set_prop(
    key: Exclude<keyof IFullMindNode, "id" | "__data_type">,
    value: any
  ) {
    set_node_prop(this.node, this.nc, key as any, value);
  }

  constructor(
    public node: IFullMindNode,
    public nc: NodeContext,
    public rc: RendererContext
  ) {
    this.id = node.id;
  }
}
