import clsx from "clsx";
import {
  createEffect,
  For,
  mapArray,
  on,
  onMount,
  Show,
  useContext,
} from "solid-js";
import { CanvasStateContext } from "../../Canvas";
import { MindNodeHelper } from "../../utils/Helper";
import { MindNodeRendererElement } from "./Node";
import { RedrawHelper } from "./RedrawHelper";

export interface IChildData {
  id: string;
  container?: HTMLElement;
  node_y_offset: number;
}

export const MindNodeContentRenderer = (props: { it: MindNodeHelper }) => {
  const it = props.it;
  const { editing, folded, focused } = it.rc;
  const ctx = useContext(CanvasStateContext)!;

  createEffect(
    on(focused.get, (focused) => {
      if (!focused) {
        editing.set(false);
      }
    })
  );

  let container: MindNodeRendererElement;
  let node: HTMLDivElement;
  let children_streamline_group: SVGGElement;
  let main_streamline: SVGPathElement;
  let folding_points: SVGCircleElement;

  /** 子节点容器数据。会随着子节点增删而自动变化。 */
  const children_data_map = mapArray<string, IChildData>(
    () => props.it.get_prop("children").slice(),
    (id) => {
      return {
        id: id,
        node_y_offset: 0,
      };
    }
  );

  createEffect(() => {
    console.log(children_data_map());
  });

  const redraw_helper = new RedrawHelper(
    ctx,
    props.it,
    children_data_map,
    folded
  );

  onMount(() => {
    it.rc!.container_el = container;
    it.rc!.node_el = node;

    redraw_helper.onmount(
      container,
      node,
      children_streamline_group,
      main_streamline,
      folding_points
    );
    it.rc.handle_obs_resize = () => {
      console.log(
        `[父节点：${
          ctx.nodes.get(it.rc.parent_rc.node_id)?.content.value
        }] 的子节点 “${it.node.content.value}” 的容器大小变化，需要重绘`
      );
      redraw_helper.full_redraw();
      it.rc.onresize?.(redraw_helper.node_y_offset);
    };
    console.log(`观察 “${it.node.content.value}”`);
    ctx.resize_obs.observe(node);
    redraw_helper.redraw_center_related_objects();
    redraw_helper.last_container_height = container.offsetHeight;
    it.rc.add_disposer(() => {
      console.log(`取消观察 “${it.node.content.value}”`);
      ctx.resize_obs.unobserve(node);
    });

    createEffect(
      on(focused.get, () => {
        node.focus();
      })
    );

    createEffect(
      on(
        () => props.it.get_prop("children"),
        () => {
          console.log(
            `[父节点：${
              ctx.nodes.get(it.rc.parent_rc.node_id)?.content.value
            }] 子节点数组变化，需要重绘“${it.node.content.value}”`
          );
          redraw_helper.full_redraw_next_tick();
        },
        {
          defer: true,
        }
      )
    );
  });

  /** 处理折叠点点击。 */
  function handle_folding_points_click() {
    folded.set(!folded.get());
    redraw_helper.redraw_center_related_objects();
  }

  function handle_node_dblclick() {
    if (!editing.get()) {
      editing.set(true);
      const selection = window.getSelection();
      node.focus();
      if (selection) {
        selection.removeAllRanges();
        const range = document.createRange();
        range.selectNodeContents(node);
        range.setStart(node, node.childNodes.length);
        selection.addRange(range);
      }
    }
  }

  function handle_node_input(e: InputEvent & { target: Element }) {
    it.set_prop("content", { value: e.target.textContent });
    ctx.mark_modified(it.node.id);
  }

  return (
    <div
      class={clsx("_m_mind_node", focused.get() && "__focused__")}
      ref={(el) => {
        container = el as MindNodeRendererElement;
        container._meta = {
          state: "ready",
          id: it.node.id,
          parent_id: it.rc.parent_rc.node_id,
          rc: it.rc,
        };
      }}
    >
      <div
        class={"__node"}
        contenteditable={editing.get()}
        onDblClick={handle_node_dblclick}
        onInput={handle_node_input}
        ref={(el) => {
          node = el as MindNodeRendererElement;
        }}
      >
        {it.node.content.value}
      </div>
      <svg class="__diversion">
        <g
          style={{
            display: folded.get() ? "none" : "block",
          }}
          ref={(it) => (children_streamline_group = it)}
        >
          <For each={props.it.get_prop("children")}>{() => <path></path>}</For>
        </g>
        <path
          style={{
            display:
              props.it.get_prop("children").length > 0 ? "block" : "none",
          }}
          ref={(it) => (main_streamline = it)}
        ></path>
        <circle
          class="__folding_point"
          r={6}
          ref={(it) => (folding_points = it)}
          style={{
            display:
              props.it.get_prop("children").length > 0 && focused.get()
                ? "block"
                : "none",
          }}
          onMouseDown={handle_folding_points_click}
        ></circle>
      </svg>
      <Show when={!folded.get()}>
        <div class="__children">
          <For each={props.it.get_prop("children")}>
            {(child, i) =>
              ctx.render_node(child, it.rc, {
                onresize: (node_y_offset) =>
                  redraw_helper.handle_children_resize(node_y_offset, i()),
              })
            }
          </For>
        </div>
      </Show>
    </div>
  );
};
