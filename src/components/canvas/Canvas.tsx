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
import { ulid } from "ulid";

/** 渲染时信息 */
export interface RenderInfo {
  /** 路径变更通知表 */
  path_emitter_map: Map<string, EmitterSignal>;
  /** 是否已聚焦。其中为聚焦节点的所在父节点 id。 */
  focused: WrappedSignal<string>;
  context_map: Map<string, RenderContext>;
}

/** 渲染时信息 */
export interface RenderContext {
  parent_id: string;
  dom_el: HTMLElement;
  /** 当节点大小改变时 */
  handle_obs_resize?: () => void;
  onresize?: (container: HTMLElement, node_y_offset: number) => void;
}

function create_RenderInfo() {
  return {
    path_emitter_map: new Map(),
    focused: createSignal(""),
    context_map: new Map(),
  } satisfies RenderInfo;
}

function set_node_prop(
  node: IMindNode,
  render_info: RenderInfo,
  key: keyof IMindNode,
  value: any
) {
  node[key] = value;
  const emitter = render_info.path_emitter_map.get(key);
  emitter?.emit();
}

export class MindNodeHelper {
  rc: RenderContext;

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
    set_node_prop(this.node, this.render_info, key, value);
  }

  constructor(
    public node: IMindNode,
    public render_info: RenderInfo,
    public parent_id: string
  ) {
    this.rc = render_info.context_map.get(this.parent_id)!;
  }
}

const canvas_root_id = "[canvas_root]";

export class CanvasState {
  root = createSignal<string>("");
  /** 需要被渲染的节点 */
  nodes = new Map<string, IMindNode>();
  render_info = new Map<string, RenderInfo>();
  /** 已经添加的节点 */
  added_nodes = new Set<string>();
  /** 已经删除的节点 */
  deleted_nodes = new Set<string>();
  /** 修改的节点 */
  modified_nodes = new Set<string>();

  /** 当前聚焦的节点 */
  readonly focused_node_data: {
    id: string;
    parent_id: string;
  } = {
    id: "",
    parent_id: "",
  };

  resize_obs = new ResizeObserver((entries) => {
    for (const entry of entries) {
      const render_context = (entry.target as any)._rc as RenderContext;
      render_context.handle_obs_resize?.();
    }
  });

  load_node: (id: string) => Promise<IMindNode>;

  get_render_info(id: string) {
    let render_info = this.render_info.get(id);
    if (render_info === undefined) {
      render_info = create_RenderInfo();
      this.render_info.set(id, render_info);
    }
    return render_info;
  }

  async get_node(id: string, parent_id: string) {
    let node = this.nodes.get(id);
    if (node === undefined) {
      node = await this.load_node(id);
      this.nodes.set(id, node);
    }
    return new MindNodeHelper(node, this.get_render_info(id), parent_id);
  }

  render_node(
    id: string,
    parent_id: string,
    options: {
      onresize?: (container: HTMLElement, node_y_offset: number) => void;
    }
  ) {
    const render_info = this.get_render_info(id);
    const rc = {
      parent_id,
      dom_el: document.createElement("div"),
      onresize: options.onresize,
    };
      render_info.context_map.set(parent_id, rc);
    return <MindNodeRenderer id={id} rc={rc}></MindNodeRenderer>;
  }

  focus_node(id: string, parent_id: string) {
    if (this.focused_node_data.id === id) return;

    // 取消之前的聚焦
    this.get_render_info(this.focused_node_data.id).focused.set(parent_id);

    // 设置新的聚焦
    this.focused_node_data.id = id;
    this.focused_node_data.parent_id = parent_id;
    if (id !== "") {
      this.get_render_info(id).focused.set(parent_id);
    }
  }

  constructor(options: { load_node: (id: string) => Promise<IMindNode> }) {
    const focused_node_data = this.focused_node_data;

    this.load_node = options.load_node;
    window.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        if (focused_node_data.id === "") return;
        if (e.shiftKey || e.metaKey || e.altKey || e.ctrlKey) return;
      } else if (e.key === "Tab") {
        e.preventDefault();
        if (focused_node_data.id === "") return;
        const focused_node = this.nodes.get(focused_node_data.id)!;
        const focused_node_ri = this.render_info.get(focused_node.id)!;

        const new_node = {
          id: ulid(),
          content: {
            _type: "markdown",
            value: "",
          },
          parents: [focused_node.id],
          children: [],
        };
        this.nodes.set(new_node.id, new_node);
        this.added_nodes.add(new_node.id);

        set_node_prop(focused_node, focused_node_ri, "children", [
          ...focused_node.children,
          new_node.id,
        ]);
        this.modified_nodes.add(focused_node.id);

        this.focus_node(new_node.id, this.focused_node_data.parent_id);
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
            when={state.root.get() !== ""}
            fallback={<div>CanvasState 未设置根节点。</div>}
          >
            {state.render_node(state.root.get(), canvas_root_id, {
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
