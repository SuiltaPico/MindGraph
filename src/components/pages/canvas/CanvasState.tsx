import { createContext, createRoot } from "solid-js";
import { MindNodeRenderer, MindNodeRendererElement } from "./MindNodeRenderer";
import { IMindNode } from "@/api/types/mg";
import {
  createEmitterSignal,
  createSignal,
  EmitterSignal,
  WrappedSignal,
} from "@/common/signal";
import { monotonicFactory } from "ulid";
import { AppContext } from "@/AppContext";

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
  disposers: (() => void)[];
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
  id: string;

  get_prop<T extends keyof IMindNode>(key: T) {
    let emitter = this.ri.path_emitter_map.get(key);
    if (emitter === undefined) {
      emitter = createEmitterSignal();
      this.ri.path_emitter_map.set(key, emitter);
    }
    emitter.use();
    return this.node[key];
  }

  set_prop(key: keyof IMindNode, value: any) {
    set_node_prop(this.node, this.ri, key, value);
  }

  constructor(
    public node: IMindNode,
    public ri: RenderInfo,
    public parent_id: string
  ) {
    this.rc = ri.context_map.get(parent_id)!;
    this.id = node.id;
    if (!this.rc) {
      debugger;
    }
  }
}

export const canvas_root_id = "[canvas_root]";

export class CanvasState {
  root = createSignal<string>("", {
    equals: false,
  });
  /** 需要被渲染的节点 */
  nodes = new Map<string, IMindNode>();
  render_info = new Map<string, RenderInfo>();
  /** 相对于上次保存的状态来说，已经添加的节点。储存的都是临时的新节点。 */
  added_nodes = new Set<string>();
  /** 相对于上次保存的状态来说，已经删除的节点。储存的都是已有的节点。 */
  deleted_nodes = new Set<string>();
  /** 相对于上次保存的状态来说，修改的节点。储存的都是已有的节点。 */
  modified_nodes = new Set<string>();
  ulid = monotonicFactory();

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
      const render_context = (
        entry.target.closest(".mind_node_renderer") as MindNodeRendererElement
      )._meta.rc;
      render_context.handle_obs_resize?.();
    }
  });

  load_node: (id: string) => Promise<IMindNode>;

  clean_catch() {
    this.render_info.clear();
    this.nodes.clear();
    this.added_nodes.clear();
    this.deleted_nodes.clear();
    this.modified_nodes.clear();
    this.focused_node_data.id = "";
    this.focused_node_data.parent_id = "";
  }

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
        disposers: [],
      };
      render_info.context_map.set(parent_rc.id, rc);
      // 创建 dom 元素，会触发 get_node 方法，因此要先设置 rc
      createRoot((disposer) => {
        rc!.disposers.push(disposer);
        rc!.dom_el = (
          <MindNodeRenderer id={id} rc={rc!}></MindNodeRenderer>
        ) as any;
      });
    }

    return rc.dom_el;
  }

  focus_node(id: string, parent_id: string) {
    if (
      this.focused_node_data.id === id &&
      this.focused_node_data.parent_id === parent_id
    )
      return;

    // 取消之前的聚焦
    this.get_render_info(this.focused_node_data.id).focused.set("");

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

  add_new_child(id: string) {
    const node = this.nodes.get(id)!;
    const node_ri = this.render_info.get(id)!;

    const new_node = {
      id: this.ulid(),
      content: {
        _type: "markdown",
        value: "",
      },
      parents: [id],
      children: [],
    };
    this.nodes.set(new_node.id, new_node);
    this.added_nodes.add(new_node.id);

    set_node_prop(node, node_ri, "children", [...node.children, new_node.id]);
    this.mark_modified(node.id);
    return new_node;
  }

  add_next_sibling(id: string, parent_id: string) {
    const parent_node = this.nodes.get(parent_id)!;
    const parent_ri = this.render_info.get(parent_id)!;

    const new_node = {
      id: this.ulid(),
      content: {
        _type: "markdown",
        value: "",
      },
      parents: [parent_id],
      children: [],
    };
    this.nodes.set(new_node.id, new_node);
    this.added_nodes.add(new_node.id);

    const index = parent_node.children.indexOf(id);
    const new_children = [...parent_node.children];
    new_children.splice(index + 1, 0, new_node.id);

    set_node_prop(parent_node, parent_ri, "children", new_children);
    this.mark_modified(parent_id);
    return new_node;
  }

  delete_node(id: string, parent_id: string) {
    console.log(id, parent_id);

    const node_to_delete = this.nodes.get(id)!;
    const node_to_delete_rc = this.render_info
      .get(id)!
      .context_map.get(parent_id)!;

    node_to_delete_rc.disposers.map((it) => it());

    const parent_rc = node_to_delete_rc.parent_rc;
    const parent_node = this.nodes.get(parent_id)!;

    // 把自己从父节点的 children 中移除
    const parent_ri = this.render_info.get(parent_node.id)!;
    set_node_prop(
      parent_node,
      parent_ri,
      "children",
      parent_node.children.filter((child_id) => child_id !== id)
    );
    parent_rc.handle_obs_resize?.();
    this.mark_modified(parent_node.id);

    // 从节点的 parents 中移除当前父节点
    node_to_delete.parents = node_to_delete.parents.filter(
      (id) => id !== parent_id
    );

    if (node_to_delete.parents.length > 0) {
      // 还有其他父节点，只删除关系
      const node_ri = this.render_info.get(node_to_delete.id)!;
      set_node_prop(node_to_delete, node_ri, "parents", node_to_delete.parents);
      this.mark_modified(node_to_delete.id);

      // 清理context_map
      this.render_info.get(node_to_delete.id)?.context_map.delete(parent_id);
    } else {
      // 没有其他父节点，尝试删除节点，和所有后代节点
      this.nodes.delete(node_to_delete.id);
      this.render_info.delete(node_to_delete.id);
      this.mark_deleted(node_to_delete.id);

      // 由于这个应用的节点允许有多个父节点，因此删除节点时，只会向单个父节点的后代节点传播删除命令，一旦传播到多个父节点的后代，则停止传播，只是标记为更改，并从 parent 列表里面删除目标父节点而已。
      // 因此，这里需要进行一个特殊的递归，遍历删除所有后代节点
      this.recursive_delete_descendants(node_to_delete);
    }
  }

  private recursive_delete_descendants(node: IMindNode) {
    for (const childId of node.children) {
      const childNode = this.nodes.get(childId);
      if (childNode) {
        // 从子节点的parents中移除当前节点
        childNode.parents = childNode.parents.filter((id) => id !== node.id);

        if (childNode.parents.length === 0) {
          // 如果子节点没有其他父节点，则删除该子节点
          this.nodes.delete(childId);
          this.render_info.delete(childId);
          this.mark_deleted(childId);

          // 继续递归删除该子节点的后代
          this.recursive_delete_descendants(childNode);
        } else {
          // 如果子节点还有其他父节点，只标记为修改
          const child_ri = this.render_info.get(childId)!;
          set_node_prop(childNode, child_ri, "parents", childNode.parents);
          this.mark_modified(childId);
        }
      }
    }
  }

  get_save_data() {
    return {
      modified_nodes: Array.from(this.modified_nodes).map(
        (id) => this.nodes.get(id)!
      ),
      deleted_nodes: Array.from(this.deleted_nodes),
      added_nodes: Array.from(this.added_nodes).map(
        (id) => this.nodes.get(id)!
      ),
    };
  }

  constructor(public ac: AppContext) {
    const focused_node_data = this.focused_node_data;
    this.load_node = (id) => ac.api.app.mg.node.load({ id });

    const handle_tab_key = () => {
      const new_node = this.add_new_child(focused_node_data.id);
      this.focus_node(new_node.id, this.focused_node_data.id);
    };

    window.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        if (focused_node_data.id === "") return;
        if (e.shiftKey || e.metaKey || e.altKey || e.ctrlKey) return;
        e.preventDefault();
        if (focused_node_data.parent_id === canvas_root_id) {
          handle_tab_key();
        } else {
          const new_node = this.add_next_sibling(
            focused_node_data.id,
            focused_node_data.parent_id
          );
          this.focus_node(new_node.id, focused_node_data.parent_id);
        }
      } else if (e.key === "Tab") {
        e.preventDefault();
        if (focused_node_data.id === "") return;
        handle_tab_key();
      } else if (e.key === "Delete") {
        e.preventDefault();
        if (focused_node_data.id === "") return;
        this.delete_node(focused_node_data.id, focused_node_data.parent_id);
        this.focus_node("", "");
      } else if (e.key === "s") {
        e.preventDefault();
        if (focused_node_data.id === "" || !e.ctrlKey) return;
        this.ac.mg_save();
      }
    });
  }
}

export const CanvasStateContext = createContext<CanvasState>();
