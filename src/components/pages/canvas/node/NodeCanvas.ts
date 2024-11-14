import { MenuElement } from "@/components/base/menu/Menu";
import { createContext } from "solid-js";
import { Canvas, canvas_root_id } from "../Canvas";
import { RendererContext } from "../utils/RendererContext";
import { handle_tab_key, handle_window_keydown } from "./handler/keyboard";
import {
  handle_canvas_pointerdown,
  handle_canvas_pointermove,
  handle_canvas_pointerup,
  handle_window_wheel,
} from "./handler/mouse";
import { MindNodeRendererElement } from "./renderer/Node";

function place_render_root_node(
  this: NodeCanvas,
  container: HTMLElement,
  field: HTMLElement,
  initialized: boolean
) {
  let scale = parseFloat(field.style.zoom);
  if (Number.isNaN(scale)) {
    scale = 1;
  }

  const child_container = this.root_rc.children_rc.get(
    this.root_rc.children_rc.keys().next()!.value!
  )!.container_el;

  field.style.width = `calc(200% + ${child_container.clientWidth * scale}px)`;
  field.style.height = `calc(200% + ${child_container.clientHeight * scale}px)`;

  if (!initialized) {
    container.scrollLeft =
      field.clientWidth / 4 + (child_container.clientWidth * scale) / 4;
    container.scrollTop =
      field.clientHeight / 4 + (child_container.clientHeight * scale) / 4;
  }

  child_container.style.left = `${
    field.offsetWidth / 2 - (child_container.clientWidth * scale) / 2
  }px`;
  child_container.style.top = `${
    field.offsetHeight / 2 - (child_container.clientHeight * scale) / 1.5
  }px`;
}

function get_right_click_menu(this: NodeCanvas) {
  const right_click_menu_items: MenuElement[] = [
    {
      name: "复制",
      onclick: () => {
        alert("还没做");
      },
    },
    {
      name: "粘贴",
      onclick: () => {
        alert("还没做");
      },
    },
    {
      type: "divider",
    },
    {
      name: "折叠此节点",
      onclick: () => {
        alert("还没做");
      },
    },
    {
      name: "展开此节点",
      onclick: () => {
        alert("还没做");
      },
    },
    {
      name: "以当前节点为根节点",
      onclick: () => {
        alert("还没做");
      },
    },
    {
      name: "插入分支",
      onclick: () => {
        alert("还没做");
      },
    },
  ];
  return right_click_menu_items;
}

export class NodeCanvas {
  offset_x = 32;
  offset_y = 12;

  right_click_start_x = 0;
  right_click_start_y = 0;

  scale_factor = 1.09;

  right_click_menu_items = get_right_click_menu.call(this);

  handle_tab_key = handle_tab_key.bind(this);
  handle_window_keydown = handle_window_keydown.bind(this);

  handle_canvas_pointerdown = handle_canvas_pointerdown.bind(this);
  handle_canvas_pointermove = handle_canvas_pointermove.bind(this);
  handle_canvas_pointerup = handle_canvas_pointerup.bind(this);
  handle_window_wheel = handle_window_wheel.bind(this);

  place_render_root_node = place_render_root_node.bind(this);
  root_rc = new RendererContext(canvas_root_id, null as any, () => {});

  resize_obs = new ResizeObserver((entries) => {
    console.log(
      "检测到节点变化",
      entries.map((it) => it.target)
    );
    for (const entry of entries) {
      const render_context = (
        entry.target.closest("._m_mind_node") as MindNodeRendererElement
      )._meta.rc;
      render_context.handle_obs_resize?.();
    }
  });


  constructor(public canvas: Canvas) {}
}

export const NodeCanvasContext = createContext<NodeCanvas>();
