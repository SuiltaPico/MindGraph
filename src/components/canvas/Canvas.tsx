import { Component, createContext, onMount, Show } from "solid-js";
import { MindNodeRenderer } from "./MindNodeRenderer";
import { IMindNode } from "@/api/types/node";
import {
  createEmitterSignal,
  createSignal,
  EmitterSignal,
  WrappedSignal,
} from "@/common/signal";
import "./Canvas.scss";

/** 渲染时信息 */
interface RenderInfo {
  /** 路径变更通知表 */
  path_emitter_map: Map<string, EmitterSignal>;
  dom_el?: HTMLElement;
  onresize?: (container: HTMLElement, node_y_offset: number) => void;
  /** 当节点大小改变时 */
  handle_obs_resize?: () => void;

  /** 是否已聚焦 */
  focused: WrappedSignal<boolean>;
}

/** 渲染时信息 */
interface RenderContext {
  is_root: boolean;
}

function create_RenderInfo() {
  return {
    path_emitter_map: new Map<string, EmitterSignal>(),
    focused: createSignal(false),
  } satisfies RenderInfo;
}

export class MindNodeHelper {
  get_prop<T extends keyof IMindNode>(key: T) {
    let emitter = this.render_info.path_emitter_map.get(key);
    if (emitter === undefined) {
      emitter = createEmitterSignal();
      this.render_info.path_emitter_map.set(key, emitter);
    }
    emitter.use();
    return this.node[key];
  }

  set_prop(key: keyof IMindNode, value: any) {
    this.node[key] = value;
    const emitter = this.render_info.path_emitter_map.get(key);
    emitter?.emit();
  }

  constructor(public node: IMindNode, public render_info: RenderInfo) {}
}

export class CanvasState {
  root = createSignal<number>(-1);
  /** 需要被渲染的节点 */
  nodes = new Map<number, IMindNode>();
  render_info = new Map<number, RenderInfo>();
  /** 已经删除的节点 */
  deleted_nodes = new Set<number>();
  /** 修改的节点 */
  modified_nodes = new Set<number>();

  /** 当前聚焦的节点 */
  focused_node: number = -1;

  resize_obs = new ResizeObserver((entries) => {
    for (const entry of entries) {
      const id = (entry.target as any)._id;
      this.render_info.get(id)?.handle_obs_resize?.();
    }
  });

  load_node: (id: number) => Promise<IMindNode>;

  get_render_info(id: number) {
    let render_info = this.render_info.get(id);
    if (render_info === undefined) {
      render_info = create_RenderInfo();
      this.render_info.set(id, render_info);
    }
    return render_info;
  }

  async get_node(id: number) {
    let node = this.nodes.get(id);
    if (node === undefined) {
      node = await this.load_node(id);
      this.nodes.set(id, node);
    }
    return new MindNodeHelper(node, this.get_render_info(id));
  }

  render_node(
    id: number,
    options: {
      onresize?: (container: HTMLElement, node_y_offset: number) => void;
    }
  ) {
    const render_info = this.get_render_info(id);
    if (render_info.dom_el === undefined) {
      render_info.dom_el = (
        <MindNodeRenderer id={id}></MindNodeRenderer>
      ) as any;
    }
    render_info.onresize = options.onresize;
    return render_info.dom_el;
  }

  focus_node(id: number) {
    if (this.focused_node === id) return;

    // 取消之前的聚焦
    this.get_render_info(this.focused_node).focused.set(false);

    // 设置新的聚焦
    this.focused_node = id;
    if (this.focused_node !== -1) {
      this.get_render_info(id).focused.set(true);
    }
  }

  constructor(options: { load_node: (id: number) => Promise<IMindNode> }) {
    this.load_node = options.load_node;
    window.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
      } else if (e.key === "Tab") {
        if (this.focused_node === -1) return;
        const node = this.nodes.get(this.focused_node)!;
      }
    });
  }
}

export const CanvasStateContext = createContext<CanvasState>();

export const Canvas: Component<{ state: CanvasState }> = (props) => {
  let container: HTMLElement;
  let field: HTMLElement;
  const { state } = props;

  let curr_node: IMindNode;
  onMount(() => {
    field.style.width = "200%";
    field.style.height = "200%";
    container.scrollLeft = field.clientWidth / 4;
    container.scrollTop = field.clientHeight / 4;
  });

  return (
    <CanvasStateContext.Provider value={state}>
      <div class="mind_node_canvas" ref={(it) => (container = it)}>
        <div class="__field" ref={(it) => (field = it)}>
          <Show
            when={state.root.get() !== -1}
            fallback={<div>CanvasState 未设置根节点。</div>}
          >
            {state.render_node(state.root.get(), {
              onresize: (child_container) => {
                child_container.style.left = `${
                  field.clientWidth / 2 - child_container.clientWidth / 2
                }px`;
                child_container.style.top = `${
                  field.clientHeight / 2 - child_container.clientHeight / 1.5
                }px`;
              },
            })}
          </Show>
        </div>
      </div>
    </CanvasStateContext.Provider>
  );
};
