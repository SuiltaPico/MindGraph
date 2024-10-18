import { IMindNode } from "@/api/types/mg";
import { AppContext } from "@/AppContext";
import { createSignal } from "@/common/signal";
import { createContext, createRoot } from "solid-js";
import { monotonicFactory } from "ulid";
import { MindNodeHelper } from "./utils/Helper";
import {
  MindNodeRenderer,
  MindNodeRendererElement,
} from "./node/renderer/Node";
import { RendererContext } from "./utils/RendererContext";
import { NodeContext } from "./utils/NodeContext";

export function set_node_prop(
  node: IMindNode,
  node_context: NodeContext,
  key: keyof IMindNode,
  value: any
) {
  node[key] = value;
  const emitter = node_context.path_emitter_map.get(key);
  emitter?.emit();
}

export const canvas_root_id = "[canvas_root]";

export class Canvas {
  readonly root = createSignal<string>("", {
    equals: false,
  });
  /** 需要被渲染的节点 */
  readonly nodes = new Map<string, IMindNode>();
  readonly node_context = new Map<string, NodeContext>();
  /** 相对于上次保存的状态来说，已经添加的节点。储存的都是临时的新节点。 */
  readonly added_nodes = new Set<string>();
  /** 相对于上次保存的状态来说，已经删除的节点。储存的都是已有的节点。 */
  readonly deleted_nodes = new Set<string>();
  /** 相对于上次保存的状态来说，修改的节点。储存的都是已有的节点。 */
  readonly modified_nodes = new Set<string>();
  readonly ulid = monotonicFactory();

  /** 当前聚焦的节点 */
  readonly focused_node_data: {
    rc: RendererContext | undefined;
  } = {
    rc: undefined,
  };

  /** 当前拖拽的状态 */
  readonly dragging_node_data = createSignal<
    | {
        type: "dragging";
        rc: RendererContext;
      }
    | {
        type: "pending";
        x: number;
        y: number;
        rc: RendererContext;
      }
    | undefined
  >(undefined);

  /** 当前是否在缩放 */
  scaling = false;

  resize_obs = new ResizeObserver((entries) => {
    if (this.scaling) {
      this.scaling = false;
    }
    console.log("检测到节点变化", entries.map((it) => it.target));
    for (const entry of entries) {
      const render_context = (
        entry.target.closest("._m_mind_node") as MindNodeRendererElement
      )._meta.rc;
      render_context.handle_obs_resize?.();
    }
  });

  load_node: (id: string) => Promise<IMindNode>;

  clean_catch() {
    this.node_context.clear();
    this.nodes.clear();
    this.added_nodes.clear();
    this.deleted_nodes.clear();
    this.modified_nodes.clear();
    this.focused_node_data.rc = undefined;
  }

  get_node_context(id: string) {
    let node_context = this.node_context.get(id);
    if (node_context === undefined) {
      node_context = new NodeContext();
      this.node_context.set(id, node_context);
    }
    return node_context;
  }

  async get_node_helper(id: string, rc: RendererContext) {
    let node = this.nodes.get(id);
    if (node === undefined) {
      node = await this.load_node(id);
      this.nodes.set(id, node);
    }
    return new MindNodeHelper(node, this.get_node_context(id), rc);
  }

  /** 渲染节点。尝试使用 `parent_rc` 的缓存渲染上下文，如果缓存不存在，则创建新的渲染上下文。 */
  render_node(
    id: string,
    parent_rc: RendererContext,
    options: {
      onresize?: (node_y_offset: number) => void;
    }
  ) {
    let rc: RendererContext | undefined = parent_rc.children_rc.get(id);
    let el: any = rc?.dom_el;
    if (!rc) {
      rc = new RendererContext(id, parent_rc, options.onresize);
      // 创建 dom 元素，会触发 get_node 方法，因此要先设置 rc
      parent_rc.children_rc.set(id, rc);
      createRoot((disposer) => {
        rc!.add_disposer(disposer);
        el = <MindNodeRenderer id={id} rc={rc!}></MindNodeRenderer>;
      });
    }

    return el;
  }

  focus_node(rc: RendererContext | undefined) {
    // 如果已经是聚焦的节点，则不重复聚焦
    if (this.focused_node_data.rc === rc) return;

    if (this.focused_node_data.rc) {
      // 取消之前的聚焦
      this.focused_node_data.rc.focused.set(false);
    }

    // 设置新的聚焦
    this.focused_node_data.rc = rc;
    if (rc !== undefined) {
      rc.focused.set(true);
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

  /** 为指定节点添加一个子节点 */
  add_new_child(id: string) {
    const node = this.nodes.get(id)!;
    const node_ri = this.node_context.get(id)!;

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

  /** 为指定渲染上下文添加一个同级节点 */
  add_next_sibling(rc: RendererContext) {
    const parent_node = this.nodes.get(rc.parent_rc.node_id)!;
    const parent_ri = this.node_context.get(parent_node.id)!;

    const new_node = {
      id: this.ulid(),
      content: {
        _type: "markdown",
        value: "",
      },
      parents: [parent_node.id],
      children: [],
    };
    this.nodes.set(new_node.id, new_node);
    this.added_nodes.add(new_node.id);

    const index = parent_node.children.indexOf(rc.node_id);
    const new_children = [...parent_node.children];
    new_children.splice(index + 1, 0, new_node.id);

    set_node_prop(parent_node, parent_ri, "children", new_children);
    this.mark_modified(parent_node.id);
    return new_node;
  }

  /** 删除指定节点 */
  delete_node(rc: RendererContext) {
    const node_to_delete = this.nodes.get(rc.node_id)!;

    rc.dispose();

    const parent_rc = rc.parent_rc;
    const parent_node = this.nodes.get(parent_rc.node_id)!;

    // 把自己从父节点的 children 中移除
    const parent_ri = this.node_context.get(parent_node.id)!;
    set_node_prop(
      parent_node,
      parent_ri,
      "children",
      parent_node.children.filter((child_id) => child_id !== rc.node_id)
    );
    parent_rc.handle_obs_resize?.();
    this.mark_modified(parent_node.id);

    // 从节点的 parents 中移除当前父节点
    node_to_delete.parents = node_to_delete.parents.filter(
      (id) => id !== parent_rc.node_id
    );

    if (node_to_delete.parents.length > 0) {
      // 还有其他父节点，只删除关系
      const node_ri = this.node_context.get(node_to_delete.id)!;
      set_node_prop(node_to_delete, node_ri, "parents", node_to_delete.parents);
      this.mark_modified(node_to_delete.id);
    } else {
      // 没有其他父节点，尝试删除节点，和所有后代节点
      this.nodes.delete(node_to_delete.id);
      this.node_context.delete(node_to_delete.id);
      this.mark_deleted(node_to_delete.id);

      // 由于这个应用的节点允许有多个父节点，因此删除节点时，只会向单个父节点的后代节点传播删除命令，一旦传播到多个父节点的后代，则停止传播，只是标记为更改，并从 parent 列表里面删除目标父节点而已。
      // 因此，这里需要进行一个特殊的递归，遍历删除所有后代节点
      this.recursive_delete_descendants(node_to_delete);
    }
  }

  /** 递归删除指定节点的所有后代节点 */
  private recursive_delete_descendants(node: IMindNode) {
    for (const childId of node.children) {
      const childNode = this.nodes.get(childId);
      if (childNode) {
        // 从子节点的parents中移除当前节点
        childNode.parents = childNode.parents.filter((id) => id !== node.id);

        if (childNode.parents.length === 0) {
          // 如果子节点没有其他父节点，则删除该子节点
          this.nodes.delete(childId);
          this.node_context.delete(childId);
          this.mark_deleted(childId);

          // 继续递归删除该子节点的后代
          this.recursive_delete_descendants(childNode);
        } else {
          // 如果子节点还有其他父节点，只标记为修改
          const child_ri = this.node_context.get(childId)!;
          set_node_prop(childNode, child_ri, "parents", childNode.parents);
          this.mark_modified(childId);
        }
      }
    }
  }

  /** 当前画布状态是否已修改 */
  is_modified() {
    return (
      this.modified_nodes.size > 0 ||
      this.deleted_nodes.size > 0 ||
      this.added_nodes.size > 0
    );
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
    this.load_node = (id) => ac.api.app.mg.node.load({ id });
  }
}

export const CanvasStateContext = createContext<Canvas>();
