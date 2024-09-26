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
  id: string;
  parent_rc: RenderContext;
  /** 当节点大小改变时 */
  handle_obs_resize?: () => void;
  onresize?: (container: HTMLElement, node_y_offset: number) => void;
  dispose?: () => void;
  dom_el: HTMLElement;
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
    this.rc = render_info.context_map.get(parent_id)!;
    if (!this.rc) {
      debugger;
    }
  }
}

const canvas_root_id = "[canvas_root]";

export class CanvasState {
  root = createSignal<string>("");
  /** 需要被渲染的节点 */
  nodes = new Map<string, IMindNode>();
  render_info = new Map<string, RenderInfo>();
  /** 相对于上次保存的状态来说，已经添加的节点。储存的都是临时的新节点。 */
  added_nodes = new Set<string>();
  /** 相对于上次保存的状态来说，已经删除的节点。储存的都是已有的节点。 */
  deleted_nodes = new Set<string>();
  /** 相对于上次保存的状态来说，修改的节点。储存的都是已有的节点。 */
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
    parent_rc: RenderContext,
    options: {
      onresize?: (container: HTMLElement, node_y_offset: number) => void;
    }
  ) {
    const render_info = this.get_render_info(id);
    let rc: RenderContext | undefined = render_info.context_map.get(
      parent_rc.id
    );
    if (!rc) {
      rc = {
        id,
        parent_rc,
        dom_el: null as any,
        onresize: options.onresize,
      };
      render_info.context_map.set(parent_rc.id, rc);
      // 创建 dom 元素，会触发 get_node 方法，因此要先设置 rc
      rc.dom_el = (
        <MindNodeRenderer id={id} rc={rc}></MindNodeRenderer>
      ) as any;
    }
    console.log(id, rc, parent_rc.id);
    return rc.dom_el;
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

  mark_modified(id: string) {
    if (this.added_nodes.has(id)) return;
    this.modified_nodes.add(id);
  }

  mark_deleted(id: string) {
    if (!this.added_nodes.has(id)) {
      // 如果是已有节点，则标记为已删除
      this.deleted_nodes.add(id);
    } else {
      // 如果是临时新节点，则直接删除
      this.added_nodes.delete(id);
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
        this.mark_modified(focused_node.id);

        this.focus_node(new_node.id, this.focused_node_data.parent_id);
      } else if (e.key === "Delete") {
        if (focused_node_data.id === "") return;

        const node_to_delete = this.nodes.get(focused_node_data.id)!;
        const node_to_delete_rc = this.render_info
          .get(node_to_delete.id)!
          .context_map.get(focused_node_data.parent_id)!;

        console.log(node_to_delete.id, focused_node_data.parent_id);

        node_to_delete_rc.dispose?.();

        const parent_rc = node_to_delete_rc.parent_rc;
        const parent_node = this.nodes.get(focused_node_data.parent_id)!;

        // 把自己从父节点的 children 中移除
        const parent_ri = this.render_info.get(parent_node.id)!;
        set_node_prop(
          parent_node,
          parent_ri,
          "children",
          parent_node.children.filter((id) => id !== focused_node_data.id)
        );
        parent_rc.handle_obs_resize?.();
        this.mark_modified(parent_node.id);

        // 从节点的 parents 中移除当前父节点
        node_to_delete.parents = node_to_delete.parents.filter(
          (id) => id !== focused_node_data.parent_id
        );

        if (node_to_delete.parents.length > 0) {
          // 还有其他父节点，只删除关系
          const node_ri = this.render_info.get(node_to_delete.id)!;
          set_node_prop(
            node_to_delete,
            node_ri,
            "parents",
            node_to_delete.parents
          );
          this.mark_modified(node_to_delete.id);
        } else {
          // 没有其他父节点，删除整个节点
          this.nodes.delete(node_to_delete.id);
          this.render_info.delete(node_to_delete.id);
          this.mark_deleted(node_to_delete.id);
        }

        // 清理context_map
        this.render_info
          .get(focused_node_data.parent_id)
          ?.context_map.delete(node_to_delete.id);

        // 重置焦点
        this.focus_node("", "");
      }
    });
  }
}

export const CanvasStateContext = createContext<CanvasState>();

export const Canvas: Component<{ state: CanvasState }> = (props) => {
  let container: HTMLElement;
  let field: HTMLElement;
  const { state } = props;

  onMount(() => {
    field.style.width = "200%";
    field.style.height = "200%";
    container.scrollLeft = field.clientWidth / 4;
    container.scrollTop = field.clientHeight / 4;
  });

  const root_rc = {
    id: canvas_root_id,
    parent_rc: null as any,
    dom_el: null as any,
    onresize: () => {},
    dispose: () => {},
  };

  return (
    <CanvasStateContext.Provider value={state}>
      <div class="mind_node_canvas" ref={(it) => (container = it)}>
        <div class="__field" ref={(it) => (field = it)}>
          <Show
            when={state.root.get() !== ""}
            fallback={<div>CanvasState 未设置根节点。</div>}
          >
            {state.render_node(state.root.get(), root_rc, {
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
