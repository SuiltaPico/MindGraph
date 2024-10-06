import { Component, Show } from "solid-js";
import "./Menu.scss";

import { createSignal } from "@/common/signal";

export interface MenuItem {
  name: string;
  onclick?: () => void | Promise<void>;
  children?: MenuItem[];
}

export class MenuContext {
  showing = createSignal(false);
  list = createSignal<MenuItem[]>([]);
  handle_click = async (it: MenuItem) => {
    this.showing.set(false);
    await it.onclick?.();
  };
}

export const MenuRenderer: Component<{
  context: MenuContext;
}> = (props) => {
  const context = props.context;
  return (
    <Show when={context.showing.get()}>
      <div class="_m_menu_container">
        <MenuListRenderer context={context} list={context.list.get()} />
      </div>
    </Show>
  );
};

export const MenuListRenderer: Component<{
  context: MenuContext;
  list: MenuItem[];
}> = (props) => {
  return (
    <div class="__menu_list">
      {props.list.map((item) => (
        <MenuItemRenderer context={props.context} item={item} />
      ))}
    </div>
  );
};

export const MenuItemRenderer: Component<{
  context: MenuContext;
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
