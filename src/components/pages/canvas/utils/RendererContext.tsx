import { createSignal, WrappedSignal } from "@/common/signal";

/** 渲染时信息。
 * 储存每一个节点渲染器的状态。
 */
export class RendererContext {
  /** 子节点的渲染上下文。子节点变动的时候，需要手动维护。 */
  readonly children_rc = new Map<string, RendererContext>();

  /** 是否正在编辑。 */
  readonly editing = createSignal<boolean>(false);
  /** 是否已折叠。 */
  readonly folded = createSignal<boolean>(false);
  /** 是否已聚焦。 */
  readonly focused = createSignal<boolean>(false);
  /** 是否正在拖拽。 */
  readonly dragging = createSignal<boolean>(false);

  /** 当节点大小改变时 */
  handle_obs_resize?: () => void;
  private disposers: (() => void)[] = [];

  /** 节点渲染的 dom 元素 */
  container_el: HTMLElement = null as any;
  /** 节点渲染的 dom 元素的父元素 */
  node_el: HTMLElement = null as any;

  add_disposer(disposer: () => void) {
    this.disposers.push(disposer);
  }

  dispose() {    
    // 逆序运行
    for (let i = this.disposers.length - 1; i >= 0; i--) {
      this.disposers[i]();
    }
    this.disposers = [];

    this.children_rc.forEach((rc) => rc.dispose());
  }

  constructor(
    /** 节点 id。因为渲染时信息可能会先于节点加载前创建，因此需要先记录节点 id，后续再通过节点 id 获取节点。 */
    public readonly node_id: string,
    public readonly parent_rc: RendererContext,
    public onresize?: (node_y_offset: number) => void
  ) {}
}
