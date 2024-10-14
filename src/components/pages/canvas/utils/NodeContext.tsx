import { EmitterSignal } from "@/common/signal";

/** 渲染时信息。对应着一个 IMindNode。 */
export class NodeContext {
  /** 路径变更通知表 */
  readonly path_emitter_map = new Map<string, EmitterSignal>();
}
