import { Component, createEffect, on, onMount, Show } from "solid-js";
import { createSignal } from "@/common/signal";
import {
  autoUpdate,
  computePosition,
  offset,
  OffsetOptions,
  Placement,
  ReferenceElement,
  shift,
} from "@floating-ui/dom";
import "./Menu.css";

interface MenuElementBase {
  type?: string;
}

export interface MenuDivider extends MenuElementBase {
  type: "divider";
}

export interface MenuItem extends MenuElementBase {
  name: string;
  onclick?: () => void | Promise<void>;
  children?: MenuItem[];
}

export type MenuElement = MenuDivider | MenuItem;

export interface MenuShowAt {
  el: ReferenceElement;
  placement?: Placement;
  offset?: OffsetOptions;
}

export class MenuState {
  show_at = createSignal<MenuShowAt | undefined>(undefined);
  list = createSignal<MenuElement[]>([]);

  async handle_click(it: MenuItem) {
    this.hide();
    await it.onclick?.();
  }

  show(items: MenuElement[], at: MenuShowAt) {
    this.list.set(items);
    this.show_at.set(at);
  }

  hide() {
    this.show_at.set(undefined);
  }
}

export const MenuRenderer: Component<{
  context: MenuState;
}> = (props) => {
  let container: HTMLDivElement | undefined;
  const context = props.context;
  let cleanup: () => void;

  async function update_position() {
    const at = context.show_at.get();
    if (!at) return;
    const { x, y } = await computePosition(at.el, container!, {
      middleware: [
        offset(at.offset ?? { mainAxis: 8 }),
        shift({
          mainAxis: true,
          crossAxis: true,
        }),
      ],
      placement: at.placement,
    });
    container!.style.left = `${x}px`;
    container!.style.top = `${y}px`;
  }

  onMount(() => {
    createEffect(
      on(context.show_at.get, async (at) => {
        cleanup?.();
        if (at) {
          cleanup = autoUpdate(at.el, container!, update_position);
        }
      })
    );
  });

  window.addEventListener("click", (e) => {
    const show_at = context.show_at.get();
    if (!show_at) {
      context.hide();
      return;
    }
    if (
      !container!.contains(e.target as Node) &&
      (!(show_at.el instanceof HTMLElement) ||
        (show_at.el instanceof HTMLElement &&
          !show_at.el.contains(e.target as Node)))
    ) {
      context.hide();
      return;
    }
  });

  return (
    <Show when={context.show_at.get()}>
      <div ref={container} class="_m_menu_container">
        <MenuListRenderer context={context} list={context.list.get()} />
      </div>
    </Show>
  );
};

export const MenuItemRenderer: Component<{
  context: MenuState;
  item: MenuItem;
}> = (props) => {
  return (
    <div
      class="__menu_item"
      onclick={() => props.context.handle_click(props.item)}
    >
      <div class="__name">{props.item.name}</div>
      {props.item.children && (
        <MenuListRenderer context={props.context} list={props.item.children} />
      )}
    </div>
  );
};

export const MenuDividerRenderer: Component<{
  context: MenuState;
  item: MenuDivider;
}> = (props) => {
  return <div class="__menu_divider" />;
};

const map: Record<string, Component<{ context: MenuState; item: any }>> = {
  divider: MenuDividerRenderer,
  item: MenuItemRenderer,
};

export const MenuListRenderer: Component<{
  context: MenuState;
  list: MenuElement[];
}> = (props) => {
  return (
    <div class="__menu_list">
      {props.list.map((item) =>
        map[item.type ?? "item"]({ context: props.context, item: item })
      )}
    </div>
  );
};
